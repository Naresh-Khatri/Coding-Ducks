"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { CodeEditor, type Language } from "~/components/code-editor";
import { Loader2, Play, Send, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

// Helper to map DB lang enum to Editor lang
const mapLangToEditorLen = (lang: string): Language => {
  if (lang === "py") return "py";
  if (lang === "js") return "js";
  if (lang === "java") return "java";
  if (lang === "cpp") return "cpp";
  if (lang === "c") return "c";
  return "js"; // default
};

export default function ProblemDetailPage() {
  const trpc = useTRPC();
  const params = useParams();
  const slug = params.slug as string;

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language>("js"); // Default to js
  const [activeTab, setActiveTab] = useState("problem");
  const [consoleOutput, setConsoleOutput] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: problem, isLoading } = useQuery(
    trpc.problem.bySlug.queryOptions({ slug })
  );

  // Set starter code when loaded
  useEffect(() => {
    if (problem?.starterCode && !code) { // Only set if code is empty to avoid overwrite
      const starter = (problem.starterCode as Record<string, string>)?.[language] || "";
      if (starter) setCode(starter);
    }
  }, [problem, language, code]);

  const runMutation = useMutation(
    trpc.submission.run.mutationOptions({
      onSuccess: (data) => {
        setConsoleOutput(data.results);
        setActiveTab("console");
        toast.success("Code executed successfully");
      },
      onError: (err) => {
        toast.error(err.message || "Execution failed");
      },
      onSettled: () => setIsRunning(false),
    })
  );

  const submitMutation = useMutation(
    trpc.submission.submit.mutationOptions({
      onSuccess: (data) => {
        if (data.status === "accepted") {
          toast.success("Submission Accepted!");
        } else {
          toast.error(`Submission Failed: ${data.status}`);
        }
      },
      onError: (err) => {
        toast.error(err.message || "Submission failed");
      },
      onSettled: () => setIsSubmitting(false),
    })
  );

  const handleRun = () => {
    if (!problem || !code) return;
    setIsRunning(true);
    runMutation.mutate({
      problemId: problem.id,
      code,
      lang: language,
    });
  };

  const handleSubmit = () => {
    if (!problem || !code) return;
    setIsSubmitting(true);
    submitMutation.mutate({
      problemId: problem.id,
      code,
      lang: language,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Problem not found</h1>
        <Button asChild>
          <Link href="/problems">Back to Problems</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/problems">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{problem.title}</h1>
            <Badge variant="secondary" className="capitalize">{problem.difficulty}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
          >
            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Run
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel: Problem Description */}
          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="h-full overflow-y-auto p-6">
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {problem.description}
                </ReactMarkdown>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel: Code Editor & Console */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70} minSize={30}>
                <div className="flex h-full flex-col">
                  <div className="border-b px-4 py-2 bg-muted/30 flex justify-between items-center text-sm">
                    <span>Code Editor</span>
                    <select
                      className="bg-transparent border-none outline-none text-xs"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                    >
                      <option value="js">JavaScript</option>
                      <option value="py">Python</option>
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                      <option value="c">C</option>
                    </select>
                  </div>
                  <div className="flex-1 relative">
                    <CodeEditor
                      value={code}
                      onChange={setCode}
                      language={language}
                      height="100%"
                      className="absolute inset-0"
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={30} minSize={10}>
                <div className="flex h-full flex-col bg-muted/10">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <div className="bg-muted/30 border-b px-2">
                      <TabsList className="bg-transparent h-9 p-0">
                        <TabsTrigger value="problem" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Test Cases</TabsTrigger>
                        <TabsTrigger value="console" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Output</TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="problem" className="flex-1 p-4 overflow-y-auto m-0">
                      <div className="space-y-4">
                        {problem.testCases?.filter((tc: any) => tc.isPublic).map((tc: any, i: number) => (
                          <div key={i} className="mb-4">
                            <div className="text-xs font-semibold mb-1 text-muted-foreground">Test Case {i + 1}</div>
                            <div className="bg-muted p-3 rounded-md text-sm font-mono whitespace-pre-wrap">
                              <div className="mb-2"><span className="text-muted-foreground select-none">Input: </span>{tc.input}</div>
                              <div><span className="text-muted-foreground select-none">Output: </span>{tc.output}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="console" className="flex-1 p-4 overflow-y-auto m-0 font-mono text-sm">
                      {consoleOutput.length > 0 ? (
                        <div className="space-y-3">
                          {consoleOutput.map((res: any, i: number) => (
                            <div key={i} className={cn("p-3 rounded-md border-l-2", res.passed ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500")}>
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn("font-bold text-xs", res.passed ? "text-green-500" : "text-red-500")}>
                                  {res.passed ? "PASSED" : "FAILED"}
                                </span>
                                <span className="text-xs text-muted-foreground">{res.runtime}ms</span>
                              </div>
                              {res.error ? (
                                <div className="text-red-400 whitespace-pre-wrap">{res.error}</div>
                              ) : (
                                <>
                                  {res.input && <div className="text-xs text-muted-foreground mt-1">Input: {res.input}</div>}
                                  {res.actual && <div className="text-xs mt-1">Output: {res.actual}</div>}
                                  {res.expected && !res.passed && <div className="text-xs text-green-400 mt-1">Expected: {res.expected}</div>}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-center mt-4">Run code to see output</div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
