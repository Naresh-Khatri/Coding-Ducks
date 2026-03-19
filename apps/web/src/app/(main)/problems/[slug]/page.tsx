"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, EyeOff, Loader2, Lock, Play, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import type { Language } from "~/components/code-editor";
import { authClient } from "~/auth/client";
import { CodeEditor } from "~/components/code-editor";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

const LANGUAGES: Array<{ key: string; label: string }> = [
  { key: "py", label: "Python" },
  { key: "js", label: "JavaScript" },
  { key: "cpp", label: "C++" },
  { key: "java", label: "Java" },
  { key: "c", label: "C" },
];

export default function ProblemDetailPage() {
  const trpc = useTRPC();
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;

  const [codes, setCodes] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<Language>("py"); // Start with py default
  const [activeTab, setActiveTab] = useState("problem");
  const [consoleOutput, setConsoleOutput] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastProblemId, setLastProblemId] = useState<number | null>(null);
  const [pollingId, setPollingId] = useState<number | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [selectedOutputCase, setSelectedOutputCase] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const draftsLoadedRef = useRef(false);

  // Fetch problem
  const { data: problem, isLoading } = useQuery(
    trpc.problem.bySlug.queryOptions({ slug }),
  );

  // Fetch saved drafts
  const { data: savedDrafts } = useQuery(
    trpc.codeDraft.get.queryOptions(
      { problemId: problem?.id! },
      { enabled: !!problem?.id && isAuthenticated },
    ),
  );

  // Fetch submissions history
  const { data: submissions, refetch: refetchSubmissions } = useQuery(
    trpc.submission.list.queryOptions(
      {
        problemId: problem?.id,
        limit: 10,
      },
      {
        enabled: !!problem?.id,
      },
    ),
  );

  // Poll for results
  const resultsQuery = useQuery(
    trpc.submission.getResults.queryOptions(
      { id: pollingId! },
      {
        enabled: !!pollingId,
        refetchInterval: (query) => {
          if (query.state.data?.status !== "running") return false;
          return 1000;
        },
      },
    ),
  );

  // Handle polling completion
  useEffect(() => {
    if (resultsQuery.data && resultsQuery.data.status !== "running") {
      const data = resultsQuery.data;
      console.log({ data });
      if (isRunning) {
        setConsoleOutput(data.results || []);
        setActiveTab("console");
        setIsRunning(false);
        toast.success("Execution completed");
      } else if (isSubmitting) {
        if (data.status === "accepted") {
          toast.success("Submission Accepted!");
        } else {
          toast.error(`Submission Failed: ${data.status.replace("_", " ")}`);
        }
        refetchSubmissions();
        setActiveTab("submissions");
        setIsSubmitting(false);
      }
      setPollingId(null);
    }
  }, [resultsQuery.data, isRunning, isSubmitting, refetchSubmissions]);

  // Set initial language and starter codes, merging with saved drafts
  useEffect(() => {
    if (!problem) return;
    // Wait for drafts query to settle (undefined = still loading, null = no drafts)
    if (isAuthenticated && savedDrafts === undefined) return;

    if (problem.id !== lastProblemId || (!draftsLoadedRef.current && savedDrafts)) {
      const starterCodes = (problem.starterCode as Record<string, string>) || {};
      const mergedCodes = { ...starterCodes, ...(savedDrafts || {}) };
      setCodes(mergedCodes);

      // Auto-select first available language if current isn't available
      const availableLangs = Object.keys(mergedCodes);
      if (availableLangs.length > 0 && !availableLangs.includes(language)) {
        setLanguage(availableLangs[0] as Language);
      }

      setLastProblemId(problem.id);
      draftsLoadedRef.current = true;
    }
  }, [problem, lastProblemId, language, savedDrafts, isAuthenticated]);

  const currentCode = codes[language] || "";

  const setCode = (newCode: string) => {
    setCodes((prev) => ({ ...prev, [language]: newCode }));
  };

  // Autosave
  const saveDraftMutation = useMutation(
    trpc.codeDraft.save.mutationOptions({
      onSuccess: () => setSaveStatus("saved"),
      onError: () => setSaveStatus("error"),
    }),
  );

  useEffect(() => {
    if (!isAuthenticated || !problem || !currentCode) return;

    // Don't save if code matches starter code
    const starterCode = (problem.starterCode as Record<string, string>)?.[language];
    if (currentCode === starterCode) return;

    setSaveStatus("saving");
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraftMutation.mutate({
        problemId: problem.id,
        lang: language as any,
        code: currentCode,
      });
    }, 2000);

    return () => clearTimeout(saveTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCode, language, problem?.id, isAuthenticated]);

  // Auto-hide "Saved" after 3s
  useEffect(() => {
    if (saveStatus === "saved") {
      const timer = setTimeout(() => setSaveStatus("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const runMutation = useMutation(
    trpc.submission.run.mutationOptions({
      onSuccess: (data) => {
        console.log(data);
        if (!data) return;
        setPollingId(data.id);
        // isRunning is already set in handleRun
      },
      onError: (err) => {
        toast.error(err.message || "Execution failed");
        setIsRunning(false);
      },
    }),
  );

  const submitMutation = useMutation(
    trpc.submission.submit.mutationOptions({
      onSuccess: (data) => {
        if (!data) return;
        setPollingId(data.id);
        // isSubmitting is already set in handleSubmit
      },
      onError: (err) => {
        toast.error(err.message || "Submission failed");
        setIsSubmitting(false);
      },
    }),
  );

  const handleRun = () => {
    if (!problem || !currentCode) return;
    setIsRunning(true);
    runMutation.mutate({
      problemId: problem.id,
      code: currentCode,
      lang: language as any,
    });
  };

  const handleSubmit = () => {
    if (!problem || !currentCode) return;
    setIsSubmitting(true);
    submitMutation.mutate({
      problemId: problem.id,
      code: currentCode,
      lang: language as any,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary h-10 w-10 animate-spin" />
          <p className="text-muted-foreground animate-pulse text-sm font-medium">
            Loading problem details...
          </p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="bg-background flex h-screen flex-col items-center justify-center gap-6 p-4 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <p className="text-muted-foreground text-xl font-medium">
            Problem not found
          </p>
          <p className="text-muted-foreground/60 max-w-md text-sm">
            The problem you're looking for might have been moved, renamed, or is
            currently unpublished.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/problems">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Problems
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background font-inter selection:bg-primary/20 flex h-[calc(100vh-64px)] flex-col">
      {/* Header */}
      <div className="bg-card/50 flex items-center justify-between border-b px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-accent/50 rounded-full"
          >
            <Link href="/problems">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-xl font-bold tracking-tight">
                {problem.title}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "border-none px-2.5 py-0.5 text-[10px] font-bold tracking-wider capitalize",
                  problem.difficulty === "easy" &&
                    "bg-emerald-500/10 text-emerald-500",
                  problem.difficulty === "medium" &&
                    "bg-amber-500/10 text-amber-500",
                  problem.difficulty === "hard" &&
                    "bg-rose-500/10 text-rose-500",
                )}
              >
                {problem.difficulty}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRun}
                  disabled={!isAuthenticated || isRunning || isSubmitting}
                  className="border-primary/20 hover:border-primary/50 h-9 rounded-full px-5 transition-all duration-300"
                >
                  {isRunning ? (
                    <Loader2 className="text-primary mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="fill-primary text-primary mr-2 h-4 w-4" />
                  )}
                  <span className="text-xs font-semibold tracking-wide">
                    RUN CODE
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-popover border-border animate-in zoom-in-95 duration-200"
              >
                {!isAuthenticated && (
                  <div className="animate-in fade-in zoom-in mr-2 flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 duration-500">
                    <Lock className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-bold tracking-wider text-amber-500 uppercase">
                      Login to Participate
                    </span>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!isAuthenticated || isRunning || isSubmitting}
                  className="shadow-primary/20 h-9 rounded-full px-6 shadow-lg transition-all duration-300 active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4 fill-current" />
                  )}
                  <span className="text-xs font-bold tracking-wider uppercase">
                    Submit
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-popover border-border animate-in zoom-in-95 duration-200"
              >
                {!isAuthenticated && (
                  <div className="animate-in fade-in zoom-in mr-2 flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 duration-500">
                    <Lock className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-bold tracking-wider text-amber-500 uppercase">
                      Login to Participate
                    </span>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel: Problem Description */}
          <ResizablePanel defaultSize={40} minSize={20} className="bg-card/30">
            <div className="custom-scrollbar h-full overflow-y-auto">
              <div className="p-8 pb-32">
                <div className="prose prose-invert prose-slate max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="mt-0 mb-6 text-3xl font-extrabold tracking-tight"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-foreground/90 mt-8 mb-4 border-b border-white/5 pb-2 text-xl font-bold tracking-tight"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="text-foreground/70 mb-4 text-sm leading-relaxed"
                          {...props}
                        />
                      ),
                      code: ({ node, inline, ...props }: any) =>
                        inline ? (
                          <code
                            className="bg-accent/40 text-primary rounded px-1.5 py-0.5 font-mono text-xs font-medium"
                            {...props}
                          />
                        ) : (
                          <code
                            className="bg-accent/20 my-4 block overflow-x-auto rounded-lg border border-white/5 p-4 font-mono text-xs"
                            {...props}
                          />
                        ),
                      ul: ({ node, ...props }) => (
                        <ul
                          className="text-foreground/70 mb-6 ml-5 list-outside list-disc space-y-2 text-sm"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="pl-1" {...props} />
                      ),
                    }}
                  >
                    {problem.description}
                  </ReactMarkdown>
                </div>

                {problem.tags && problem.tags.length > 0 && (
                  <div className="mt-12 border-t border-white/5 pt-8">
                    <h3 className="text-muted-foreground mb-4 text-xs font-bold tracking-widest uppercase">
                      Related Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {problem.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer border-none bg-white/5 px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-white/10"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="bg-border/50 hover:bg-primary/30 w-1 transition-colors"
          />

          {/* Right Panel: Code Editor & Console */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={65} minSize={30}>
                <div className="flex h-full flex-col">
                  <div className="bg-card/50 flex items-center justify-between border-b px-4 py-2 text-xs backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/80 flex h-2 w-2 animate-pulse rounded-full" />
                      <span className="text-muted-foreground/80 font-bold tracking-wider uppercase">
                        Code Editor
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {saveStatus === "saving" && (
                        <span className="text-muted-foreground animate-pulse text-[10px]">
                          Saving...
                        </span>
                      )}
                      {saveStatus === "saved" && (
                        <span className="text-emerald-500/70 text-[10px]">
                          Saved
                        </span>
                      )}
                      {saveStatus === "error" && (
                        <span className="text-rose-500/70 text-[10px]">
                          Save failed
                        </span>
                      )}
                      <div className="bg-border h-4 w-px" />
                      <select
                        className="hover:text-primary cursor-pointer border-none bg-transparent pr-2 text-xs font-bold transition-colors outline-none"
                        value={language}
                        onChange={(e) =>
                          setLanguage(e.target.value as Language)
                        }
                      >
                        {Object.keys(
                          (problem.starterCode as Record<string, string>) || {},
                        ).map((lang) => (
                          <option
                            key={lang}
                            value={lang}
                            className="bg-popover text-foreground"
                          >
                            {LANGUAGES.find((l) => l.key === lang)?.label ||
                              lang}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="relative flex-1 bg-[#1e1e1e]">
                    <CodeEditor
                      value={currentCode}
                      onChange={setCode}
                      language={language}
                      height="100%"
                      className="absolute inset-0"
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle
                withHandle
                className="bg-border/50 hover:bg-primary/30 h-1 transition-colors"
              />

              <ResizablePanel defaultSize={35} minSize={10}>
                <div className="bg-card/10 flex h-full flex-col">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex h-full flex-col"
                  >
                    <div className="bg-card/30 border-b px-4 backdrop-blur-sm">
                      <TabsList className="h-11 gap-8 bg-transparent p-0">
                        <TabsTrigger
                          value="problem"
                          className="data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground h-full rounded-none border-b-2 border-transparent px-0 text-xs font-bold tracking-wider uppercase transition-all data-[state=active]:bg-transparent"
                        >
                          Test Cases
                        </TabsTrigger>
                        <TabsTrigger
                          value="console"
                          className="data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground h-full rounded-none border-b-2 border-transparent px-0 text-xs font-bold tracking-wider uppercase transition-all data-[state=active]:bg-transparent"
                        >
                          Output{" "}
                          {consoleOutput.length > 0 && (
                            <span className="bg-primary/10 text-primary ml-2 rounded-full px-1.5 py-0.5 text-[10px]">
                              {consoleOutput.length}
                            </span>
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="submissions"
                          className="data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground h-full rounded-none border-b-2 border-transparent px-0 text-xs font-bold tracking-wider uppercase transition-all data-[state=active]:bg-transparent"
                        >
                          Submissions
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent
                      value="problem"
                      className="custom-scrollbar m-0 flex-1 overflow-y-auto"
                    >
                      {(() => {
                        const publicCases = problem.testCases?.filter((tc: any) => tc.isPublic) || [];
                        if (publicCases.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="bg-accent/20 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                                <EyeOff className="text-muted-foreground/40 h-6 w-6" />
                              </div>
                              <p className="text-muted-foreground text-sm font-medium">
                                No public test cases available
                              </p>
                            </div>
                          );
                        }
                        const sig = problem.functionSignature as any;
                        const tc = publicCases[selectedTestCase] ?? publicCases[0];
                        if (!tc) return null;
                        return (
                          <div className="p-4">
                            {/* Case tabs */}
                            <div className="mb-4 flex items-center gap-2">
                              {publicCases.map((_: any, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => setSelectedTestCase(i)}
                                  className={cn(
                                    "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                                    selectedTestCase === i
                                      ? "bg-accent text-foreground"
                                      : "text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  Case {i + 1}
                                </button>
                              ))}
                            </div>
                            {/* Params */}
                            <div className="space-y-3">
                              {tc.args && sig?.params ? (
                                sig.params.map((param: any, j: number) => (
                                  <div key={j}>
                                    <div className="text-muted-foreground mb-1 text-xs font-medium">
                                      {param.name} =
                                    </div>
                                    <div className="text-foreground rounded-lg bg-accent/40 px-3 py-2 font-mono text-sm">
                                      {tc.args?.[j]}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div>
                                  <div className="text-muted-foreground mb-1 text-xs font-medium">
                                    Input
                                  </div>
                                  <div className="text-foreground rounded-lg bg-accent/40 px-3 py-2 font-mono text-sm whitespace-pre-wrap">
                                    {tc.input ?? ""}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </TabsContent>

                    <TabsContent
                      value="console"
                      className="custom-scrollbar m-0 flex-1 overflow-y-auto"
                    >
                      {consoleOutput.length > 0 ? (
                        (() => {
                          const allPassed = consoleOutput.every((r: any) => r.passed);
                          const res = consoleOutput[selectedOutputCase] || consoleOutput[0];
                          const sig = problem.functionSignature as any;
                          const publicCases = problem.testCases?.filter((tc: any) => tc.isPublic) || [];
                          const tc = publicCases[selectedOutputCase];
                          return (
                            <div className="p-4">
                              {/* Verdict header */}
                              <div className="mb-4 flex items-center gap-2">
                                {allPassed ? (
                                  <span className="text-sm font-semibold text-emerald-500">
                                    Accepted
                                  </span>
                                ) : (
                                  <span className="text-sm font-semibold text-rose-500">
                                    Wrong Answer
                                  </span>
                                )}
                              </div>
                              {/* Case tabs */}
                              <div className="mb-4 flex items-center gap-2">
                                {consoleOutput.map((r: any, i: number) => (
                                  <button
                                    key={i}
                                    onClick={() => setSelectedOutputCase(i)}
                                    className={cn(
                                      "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                                      selectedOutputCase === i
                                        ? "bg-accent text-foreground"
                                        : "text-muted-foreground hover:text-foreground",
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        r.passed ? "bg-emerald-500" : "bg-rose-500",
                                      )}
                                    />
                                    Case {i + 1}
                                  </button>
                                ))}
                              </div>
                              {/* Selected case details */}
                              {res.error ? (
                                <div className="space-y-3">
                                  <div>
                                    <div className="text-muted-foreground mb-1 text-xs font-medium">
                                      Error
                                    </div>
                                    <div className="rounded-lg bg-accent/40 px-3 py-2 font-mono text-sm whitespace-pre-wrap text-rose-400">
                                      {res.error}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {/* Input params */}
                                  {tc?.args && sig?.params ? (
                                    sig.params.map((param: any, j: number) => (
                                      <div key={j}>
                                        <div className="text-muted-foreground mb-1 text-xs font-medium">
                                          {param.name} =
                                        </div>
                                        <div className="text-foreground rounded-lg bg-accent/40 px-3 py-2 font-mono text-sm">
                                          {tc?.args?.[j]}
                                        </div>
                                      </div>
                                    ))
                                  ) : res.input ? (
                                    <div>
                                      <div className="text-muted-foreground mb-1 text-xs font-medium">
                                        Input
                                      </div>
                                      <div className="text-foreground rounded-lg bg-accent/40 px-3 py-2 font-mono text-sm">
                                        {res.input}
                                      </div>
                                    </div>
                                  ) : null}
                                  {/* Output */}
                                  <div>
                                    <div className="text-muted-foreground mb-1 text-xs font-medium">
                                      Output
                                    </div>
                                    <div
                                      className={cn(
                                        "rounded-lg bg-accent/40 px-3 py-2 font-mono text-sm",
                                        res.passed ? "text-foreground" : "text-rose-500",
                                      )}
                                    >
                                      {res.actual || "null"}
                                    </div>
                                  </div>
                                  {/* Expected */}
                                  <div>
                                    <div className="text-muted-foreground mb-1 text-xs font-medium">
                                      Expected
                                    </div>
                                    <div className="text-foreground rounded-lg bg-accent/40 px-3 py-2 font-mono text-sm">
                                      {res.expected || tc?.expected || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
                          <Play className="text-muted-foreground mb-4 h-8 w-8" />
                          <p className="text-muted-foreground text-xs font-medium">
                            Run your code to see results
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent
                      value="submissions"
                      className="custom-scrollbar m-0 flex-1 overflow-y-auto"
                    >
                      {submissions && submissions.length > 0 ? (
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-muted-foreground border-b border-white/5 text-[11px]">
                              <th className="px-4 py-2 font-medium">Status</th>
                              <th className="px-4 py-2 font-medium">Language</th>
                              <th className="px-4 py-2 font-medium">Runtime</th>
                              <th className="px-4 py-2 font-medium">Memory</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {submissions.map((sub) => {
                              const langLabel =
                                LANGUAGES.find((l) => l.key === sub.lang)?.label || sub.lang;
                              return (
                                <tr
                                  key={sub.id}
                                  onClick={() => setSelectedSubmission(sub)}
                                  className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                                >
                                  <td className="px-4 py-2.5">
                                    <div className="flex flex-col gap-0.5">
                                      <span
                                        className={cn(
                                          "text-xs font-semibold capitalize",
                                          sub.status === "accepted"
                                            ? "text-emerald-500"
                                            : sub.status === "time_limit"
                                              ? "text-amber-500"
                                              : "text-rose-500",
                                        )}
                                      >
                                        {sub.status.replace(/_/g, " ")}
                                      </span>
                                      <span className="text-muted-foreground/60 text-[10px]">
                                        {new Date(sub.createdAt).toLocaleDateString(
                                          undefined,
                                          { month: "short", day: "numeric", year: "numeric" },
                                        )}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="text-muted-foreground px-4 py-2.5">
                                    {langLabel}
                                  </td>
                                  <td className="text-muted-foreground px-4 py-2.5 font-mono">
                                    {sub.runtime != null ? `${sub.runtime} ms` : "N/A"}
                                  </td>
                                  <td className="text-muted-foreground px-4 py-2.5 font-mono">
                                    {sub.memory != null
                                      ? sub.memory >= 1024
                                        ? `${(sub.memory / 1024).toFixed(1)} MB`
                                        : `${sub.memory} KB`
                                      : "N/A"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
                          <Send className="text-muted-foreground mb-4 h-8 w-8" />
                          <p className="text-muted-foreground text-xs font-medium">
                            No submissions yet
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Submission Detail Dialog */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          {selectedSubmission && (() => {
            const sub = selectedSubmission;
            const langLabel =
              LANGUAGES.find((l) => l.key === sub.lang)?.label || sub.lang;
            const results = sub.results as any[] | null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-lg font-bold capitalize",
                        sub.status === "accepted"
                          ? "text-emerald-500"
                          : sub.status === "time_limit"
                            ? "text-amber-500"
                            : "text-rose-500",
                      )}
                    >
                      {sub.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground text-sm font-normal">
                      #{sub.id}
                    </span>
                  </DialogTitle>
                </DialogHeader>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-lg bg-accent/40 p-3">
                    <div className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                      Language
                    </div>
                    <div className="text-foreground text-sm font-medium">{langLabel}</div>
                  </div>
                  <div className="rounded-lg bg-accent/40 p-3">
                    <div className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                      Runtime
                    </div>
                    <div className="text-foreground text-sm font-medium">
                      {sub.runtime != null ? `${sub.runtime} ms` : "N/A"}
                    </div>
                  </div>
                  <div className="rounded-lg bg-accent/40 p-3">
                    <div className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                      Memory
                    </div>
                    <div className="text-foreground text-sm font-medium">
                      {sub.memory != null
                        ? sub.memory >= 1024
                          ? `${(sub.memory / 1024).toFixed(1)} MB`
                          : `${sub.memory} KB`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="rounded-lg bg-accent/40 p-3">
                    <div className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                      Tests
                    </div>
                    <div className="text-foreground text-sm font-medium">
                      {sub.testsPassed}/{sub.testsTotal} passed
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground text-xs">
                  Submitted{" "}
                  {new Date(sub.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  at{" "}
                  {new Date(sub.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {/* Error message */}
                {sub.errorMessage && (
                  <div>
                    <div className="text-muted-foreground mb-1 text-xs font-medium">
                      Error
                    </div>
                    <div className="max-h-32 overflow-auto rounded-lg bg-accent/40 px-3 py-2 font-mono text-xs whitespace-pre-wrap text-rose-400">
                      {sub.errorMessage}
                    </div>
                  </div>
                )}

                {/* Test results */}
                {results && results.length > 0 && (
                  <div>
                    <div className="text-muted-foreground mb-2 text-xs font-medium">
                      Test Results
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {results.map((r: any, i: number) => (
                        <div
                          key={i}
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold",
                            r.passed
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-rose-500/15 text-rose-500",
                          )}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code */}
                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium">
                    Code
                  </div>
                  <div className="max-h-64 overflow-auto rounded-lg border border-white/5 bg-[#1e1e1e]">
                    <CodeEditor
                      value={sub.code}
                      onChange={() => {}}
                      language={sub.lang as Language}
                      height="250px"
                      readOnly
                    />
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
