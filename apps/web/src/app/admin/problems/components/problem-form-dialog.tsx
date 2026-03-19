"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Loader2, Save, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { CodeEditor } from "~/components/ui/code-mirror";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";
import {
  FunctionSignature,
  FunctionSignatureEditor,
  ParamType,
} from "./function-signature-editor";
import { TestCasesTable } from "./test-cases-table";

const problemFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(256),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().min(1, "Description is required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([]),
  displayOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
  testCases: z
    .array(
      z.object({
        // Legacy format
        input: z.string().optional(),
        output: z.string().optional(),
        // New structured format
        args: z.array(z.string()).optional(),
        expected: z.string().optional(),
        isPublic: z.boolean(),
      }),
    )
    .default([]),
  starterCode: z.record(z.string(), z.string()).optional(),
  functionSignature: z.any().optional(),
});

type ProblemFormData = z.infer<typeof problemFormSchema>;

const LANGUAGES = [
  { key: "py", label: "Python" },
  { key: "js", label: "JavaScript" },
  { key: "java", label: "Java" },
  { key: "cpp", label: "C++" },
  { key: "c", label: "C" },
];

const DEFAULT_STARTER_CODE: Record<string, string> = {
  py: "def solution():\n    # Your code here\n    pass",
  js: "function solution() {\n    // Your code here\n}",
  java: "class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}",
  c: "#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}",
};

// Maps our generic types to language-specific types
const TYPE_MAP = {
  py: {
    integer: "int",
    string: "str",
    boolean: "bool",
    float: "float",
    "integer[]": "list[int]",
    "string[]": "list[str]",
  },
  js: {
    integer: "number",
    string: "string",
    boolean: "boolean",
    float: "number",
    "integer[]": "number[]",
    "string[]": "string[]",
  },
  java: {
    integer: "int",
    string: "String",
    boolean: "boolean",
    float: "double",
    "integer[]": "int[]",
    "string[]": "String[]",
  },
  cpp: {
    integer: "int",
    string: "string",
    boolean: "bool",
    float: "double",
    "integer[]": "vector<int>",
    "string[]": "vector<string>",
  },
  c: {
    integer: "int",
    string: "char*", // Simplified
    boolean: "int",
    float: "double",
    "integer[]": "int*", // Simplified
    "string[]": "char**",
  },
};

// Helper to generate starter code based on signature
// Helper to generate starter code based on signature
const generateStarterCode = (sig: FunctionSignature) => {
  const codes: Record<string, string> = {
    py: `class Solution:\n    def ${sig.fnName}(self, ${sig.params.map((p) => `${p.name}: ${TYPE_MAP.py?.[p.type] || "Any"}`).join(", ")}) -> ${TYPE_MAP.py?.[sig.returnType] || "Any"}:\n        # Your code here\n        pass`,
    js: `class Solution {\n    /**\n${sig.params.map((p) => `     * @param {${TYPE_MAP.js?.[p.type] || "any"}} ${p.name}`).join("\n")}\n     * @return {${TYPE_MAP.js?.[sig.returnType] || "any"}}\n     */\n    ${sig.fnName}(${sig.params.map((p) => p.name).join(", ")}) {\n        // Your code here\n    }\n}`,
    java: `class Solution {\n    public ${TYPE_MAP.java?.[sig.returnType] || "void"} ${sig.fnName}(${sig.params.map((p) => `${TYPE_MAP.java?.[p.type] || "Object"} ${p.name}`).join(", ")}) {\n        // Your code here\n        return ${sig.returnType.includes("[]") && TYPE_MAP.java?.[sig.returnType] ? "new " + TYPE_MAP.java[sig.returnType].replace("[]", "[0]") : sig.returnType === "boolean" ? "false" : "0"};\n    }\n}`,
    cpp: `class Solution {\npublic:\n    ${TYPE_MAP.cpp?.[sig.returnType] || "void"} ${sig.fnName}(${sig.params.map((p) => `${TYPE_MAP.cpp?.[p.type] || "auto"} ${p.name}`).join(", ")}) {\n        // Your code here\n    }\n};`,
    c: `// C support is limited for classes, using struct or standalone function\n${TYPE_MAP.c?.[sig.returnType] || "void"} ${sig.fnName}(${sig.params.map((p) => `${TYPE_MAP.c?.[p.type] || "void*"} ${p.name}`).join(", ")}) {\n    // Your code here\n}`,
  };
  return codes;
};


interface ProblemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemId: number | null;
  onSuccess: () => void;
}

export function ProblemFormDialog({
  open,
  onOpenChange,
  problemId,
  onSuccess,
}: ProblemFormDialogProps) {
  const trpc = useTRPC();
  const [tagsInput, setTagsInput] = useState("");
  const [currentLang, setCurrentLang] = useState("py");
  const [signature, setSignature] = useState<FunctionSignature | undefined>(
    undefined,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const problemData = JSON.parse(content);

        // Validate basic structure
        if (!problemData.title || !problemData.description) {
          toast.error("Invalid problem file: missing required fields");
          return;
        }

        // Populate form fields
        form.setValue("title", problemData.title || "");
        form.setValue("slug", problemData.slug || "");
        form.setValue("description", problemData.description || "");
        form.setValue("difficulty", problemData.difficulty || "easy");
        form.setValue("tags", problemData.tags || []);
        form.setValue("displayOrder", problemData.displayOrder || 0);
        form.setValue("isActive", problemData.isActive ?? true);

        // Handle function signature
        if (problemData.functionSignature) {
          const sig = problemData.functionSignature;
          setSignature(sig);
          handleSignatureChange(sig);
        }

        // Handle test cases
        if (problemData.testCases && Array.isArray(problemData.testCases)) {
          form.setValue("testCases", problemData.testCases);
        }

        toast.success("Problem loaded successfully from file");
      } catch (error) {
        console.error("Failed to parse problem file:", error);
        toast.error("Failed to parse problem file. Please check the format.");
      }
    };

    reader.readAsText(file);
    // Reset input so the same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle export to JSON
  const handleExport = () => {
    const formData = form.getValues();

    const exportData = {
      title: formData.title,
      slug: formData.slug,
      description: formData.description,
      difficulty: formData.difficulty,
      tags: formData.tags,
      displayOrder: formData.displayOrder,
      isActive: formData.isActive,
      functionSignature: formData.functionSignature,
      testCases: formData.testCases,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.slug || "problem"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Problem exported successfully");
  };

  // Update starter code when signature changes
  const handleSignatureChange = (newSig: FunctionSignature) => {
    setSignature(newSig);
    form.setValue("functionSignature", newSig);

    const newStarterCode = generateStarterCode(newSig);
    form.setValue("starterCode", newStarterCode);
  };

  const form = useForm<ProblemFormData>({
    resolver: zodResolver(problemFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      difficulty: "easy",
      tags: [],
      displayOrder: 0,
      isActive: true,
      testCases: [{ input: "", output: "", isPublic: true }],
      starterCode: DEFAULT_STARTER_CODE,
    },
  });

  // Fetch existing problem
  const { data: existingProblem, isLoading: isLoadingProblem } = useQuery(
    trpc.problem.getById.queryOptions(
      { id: problemId! },
      { enabled: !!problemId && open },
    ),
  );

  // Reset form when dialog opens or id changes
  useEffect(() => {
    if (open) {
      if (problemId && existingProblem) {
        form.reset({
          title: existingProblem.title,
          slug: existingProblem.slug,
          description: existingProblem.description,
          difficulty: existingProblem.difficulty as "easy" | "medium" | "hard",
          tags: existingProblem.tags,
          displayOrder: existingProblem.displayOrder || 0,
          isActive: existingProblem.isActive,
          testCases: existingProblem.testCases as any[],
          starterCode: existingProblem.starterCode as Record<string, string>,
          functionSignature: existingProblem.functionSignature as any,
        });
        if (existingProblem.functionSignature) {
          setSignature(existingProblem.functionSignature as any);
        }
      } else if (!problemId) {
        form.reset({
          title: "",
          slug: "",
          description: "",
          difficulty: "easy",
          tags: [],
          displayOrder: 0,
          isActive: true,
          testCases: [{ input: "", output: "", isPublic: true }],
          starterCode: DEFAULT_STARTER_CODE,
        });
        setSignature(undefined);
      }
    }
  }, [open, problemId, existingProblem, form]);

  const createMutation = useMutation(
    trpc.problem.create.mutationOptions({
      onSuccess: () => {
        toast.success("Problem created successfully");
        onOpenChange(false);
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.problem.update.mutationOptions({
      onSuccess: () => {
        toast.success("Problem updated successfully");
        onOpenChange(false);
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleTitleChange = (value: string) => {
    form.setValue("title", value);
    if (!problemId) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 100);
      form.setValue("slug", slug);
    }
  };

  const tags = form.watch("tags");
  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      const currentTags = form.getValues("tags");
      form.setValue("tags", [...currentTags, trimmed]);
    }
    setTagsInput("");
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.filter((t) => t !== tagToRemove),
    );
  };

  const onSubmit = (data: ProblemFormData) => {
    // Validate that test cases have either input/output OR args/expected
    const invalidTestCases = data.testCases.filter(tc => {
      const hasLegacy = tc.input !== undefined && tc.output !== undefined;
      const hasNew = tc.args !== undefined && tc.expected !== undefined;
      return !hasLegacy && !hasNew;
    });

    if (invalidTestCases.length > 0) {
      toast.error("Some test cases are incomplete. Please provide either input/output or args/expected for each test case.");
      return;
    }
    if (!problemId) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({ id: problemId, ...data });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = !!problemId && isLoadingProblem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 p-0 sm:max-w-4xl">
        <DialogHeader className="border-b p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle>
              {problemId ? "Edit Problem" : "Create New Problem"}
            </DialogTitle>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {Object.keys(form.formState.errors).length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please fix the following errors:
                      <ul className="mt-2 list-inside list-disc space-y-1">
                        {Object.entries(form.formState.errors).map(([key, error]) => (
                          <li key={key} className="text-sm">
                            {key}: {error?.message?.toString() || "Invalid value"}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                <Tabs defaultValue="details" className="space-y-6">
                  <TabsList className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 backdrop-blur">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="testcases">Test Cases</TabsTrigger>
                    <TabsTrigger value="startercode">Starter Code</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-0 space-y-6">
                    <Card>
                      <CardContent className="space-y-4 pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Two Sum"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleTitleChange(e.target.value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Slug</FormLabel>
                                <FormControl>
                                  <Input placeholder="two-sum" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <FormField
                            control={form.control}
                            name="difficulty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Difficulty</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">
                                      Medium
                                    </SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="displayOrder"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Display Order</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Lower numbers appear first
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="mt-6 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Published</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <FormLabel>Tags</FormLabel>
                          <div className="mb-2 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="gap-1"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="hover:text-destructive ml-1"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex max-w-md gap-2">
                            <Input
                              placeholder="Add tag..."
                              value={tagsInput}
                              onChange={(e) => setTagsInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addTag(tagsInput);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => addTag(tagsInput)}
                            >
                              Add
                            </Button>
                          </div>
                          <FormMessage>
                            {form.formState.errors.tags?.message}
                          </FormMessage>
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Write the problem description in Markdown..."
                                  className="min-h-[300px] font-mono text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Supports Markdown formatting
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="testcases" className="mt-0">
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-base">Test Cases</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <TestCasesTable
                          control={form.control}
                          name="testCases"
                          signature={signature}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="startercode" className="mt-0">
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-base">
                          Starter Code
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-6 space-y-4 border-b pb-6">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-base font-semibold">
                              Function Signature (New)
                            </FormLabel>
                            <p className="text-muted-foreground text-xs">
                              Defining this generates driver code automatically
                            </p>
                          </div>
                          <FunctionSignatureEditor
                            value={signature}
                            onChange={handleSignatureChange}
                          />
                        </div>

                        <Tabs
                          value={currentLang}
                          onValueChange={setCurrentLang}
                          className="w-full"
                        >
                          <TabsList className="mb-4 h-auto flex-wrap gap-2">
                            {LANGUAGES.map((lang) => (
                              <TabsTrigger key={lang.key} value={lang.key}>
                                {lang.label}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {LANGUAGES.map((lang) => (
                            <TabsContent
                              key={lang.key}
                              value={lang.key}
                              className="mt-0"
                            >
                              <FormField
                                control={form.control}
                                name={`starterCode.${lang.key}`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <CodeEditor
                                        value={field.value || ""}
                                        onChange={field.onChange}
                                        language={lang.key}
                                        height="400px"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TabsContent>
                          ))}
                        </Tabs>
                        <p className="text-muted-foreground mt-4 text-xs">
                          This code will be pre-filled when users start this
                          problem in{" "}
                          {LANGUAGES.find((l) => l.key === currentLang)?.label}.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
          )}
        </div>
        {/* <pre>{JSON.stringify(form.formState.errors, null, 2)}</pre> */}

        <div className="bg-muted/10 flex justify-end gap-2 border-t p-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {problemId ? "Save Changes" : "Create Problem"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
