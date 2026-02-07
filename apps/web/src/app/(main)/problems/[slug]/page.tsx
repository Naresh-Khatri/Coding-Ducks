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
import { Loader2, Play, Send, ChevronLeft, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

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

  const [codes, setCodes] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<Language>("py"); // Start with py default
  const [activeTab, setActiveTab] = useState("problem");
  const [consoleOutput, setConsoleOutput] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastProblemId, setLastProblemId] = useState<number | null>(null);
  const [pollingId, setPollingId] = useState<number | null>(null);

  // Fetch problem
  const { data: problem, isLoading } = useQuery(
    trpc.problem.bySlug.queryOptions({ slug })
  );

  // Fetch submissions history
  const { data: submissions, refetch: refetchSubmissions } = useQuery(
    trpc.submission.list.queryOptions({
      problemId: problem?.id,
      limit: 10
    }, {
      enabled: !!problem?.id
    })
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
      }
    )
  );

  // Handle polling completion
  useEffect(() => {
    if (resultsQuery.data && resultsQuery.data.status !== "running") {
      const data = resultsQuery.data;
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

  // Set initial language and starter codes
  useEffect(() => {
    if (problem && problem.id !== lastProblemId) {
      if (problem.starterCode) {
        const starterCodes = problem.starterCode as Record<string, string>;
        setCodes(starterCodes);

        // Auto-select first available language if current isn't available
        const availableLangs = Object.keys(starterCodes);
        if (availableLangs.length > 0 && !availableLangs.includes(language)) {
          setLanguage(availableLangs[0] as Language);
        }
      }
      setLastProblemId(problem.id);
    }
  }, [problem, lastProblemId, language]);

  const currentCode = codes[language] || "";

  const setCode = (newCode: string) => {
    setCodes(prev => ({ ...prev, [language]: newCode }));
  };

  const runMutation = useMutation(
    trpc.submission.run.mutationOptions({
      onSuccess: (data) => {
        if (!data) return;
        setPollingId(data.id);
        // isRunning is already set in handleRun
      },
      onError: (err) => {
        toast.error(err.message || "Execution failed");
        setIsRunning(false);
      },
    })
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
    })
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
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading problem details...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background p-4 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <p className="text-xl font-medium text-muted-foreground">Problem not found</p>
          <p className="max-w-md text-sm text-muted-foreground/60">
            The problem you're looking for might have been moved, renamed, or is currently unpublished.
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
    <div className="flex h-[calc(100vh-64px)] flex-col bg-background font-inter selection:bg-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card/50 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="hover:bg-accent/50 rounded-full">
            <Link href="/problems">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{problem.title}</h1>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize border-none px-2.5 py-0.5 text-[10px] font-bold tracking-wider",
                  problem.difficulty === "easy" && "bg-emerald-500/10 text-emerald-500",
                  problem.difficulty === "medium" && "bg-amber-500/10 text-amber-500",
                  problem.difficulty === "hard" && "bg-rose-500/10 text-rose-500"
                )}
              >
                {problem.difficulty}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="h-9 rounded-full px-5 border-primary/20 hover:border-primary/50 transition-all duration-300"
          >
            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> : <Play className="mr-2 h-4 w-4 fill-primary text-primary" />}
            <span className="font-semibold text-xs tracking-wide">RUN CODE</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="h-9 rounded-full px-6 shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4 fill-current" />}
            <span className="font-bold text-xs tracking-wider uppercase">Submit</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel: Problem Description */}
          <ResizablePanel defaultSize={40} minSize={20} className="bg-card/30">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <div className="p-8 pb-32">
                <div className="prose prose-invert prose-slate max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-3xl font-extrabold tracking-tight mb-6 mt-0" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-bold tracking-tight mb-4 mt-8 text-foreground/90 border-b border-white/5 pb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="text-foreground/70 leading-relaxed mb-4 text-sm" {...props} />,
                      code: ({ node, inline, ...props }: any) =>
                        inline ? (
                          <code className="bg-accent/40 rounded px-1.5 py-0.5 text-xs font-mono text-primary font-medium" {...props} />
                        ) : (
                          <code className="block bg-accent/20 p-4 rounded-lg overflow-x-auto text-xs font-mono my-4 border border-white/5" {...props} />
                        ),
                      ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 space-y-2 mb-6 text-sm text-foreground/70" {...props} />,
                      li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                    }}
                  >
                    {problem.description}
                  </ReactMarkdown>
                </div>

                {problem.tags && problem.tags.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-white/5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Related Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {problem.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-[10px] font-medium transition-colors cursor-pointer border-none px-2 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="w-1 bg-border/50 hover:bg-primary/30 transition-colors" />

          {/* Right Panel: Code Editor & Console */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={65} minSize={30}>
                <div className="flex h-full flex-col">
                  <div className="border-b px-4 py-2 bg-card/50 flex justify-between items-center text-xs backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-2 w-2 rounded-full bg-primary/80 animate-pulse" />
                      <span className="font-bold tracking-wider uppercase text-muted-foreground/80">Code Editor</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-px bg-border" />
                      <select
                        className="bg-transparent border-none outline-none font-bold text-xs cursor-pointer hover:text-primary transition-colors pr-2"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                      >
                        {Object.keys(problem.starterCode as Record<string, string> || {}).map(lang => (
                          <option key={lang} value={lang} className="bg-popover text-foreground">
                            {LANGUAGES.find((l) => l.key === lang)?.label || lang}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex-1 relative bg-[#1e1e1e]">
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

              <ResizableHandle withHandle className="h-1 bg-border/50 hover:bg-primary/30 transition-colors" />

              <ResizablePanel defaultSize={35} minSize={10}>
                <div className="flex h-full flex-col bg-card/10">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <div className="bg-card/30 border-b px-4 backdrop-blur-sm">
                      <TabsList className="bg-transparent h-11 p-0 gap-8">
                        <TabsTrigger value="problem" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs tracking-wider uppercase text-muted-foreground data-[state=active]:text-foreground transition-all">Test Cases</TabsTrigger>
                        <TabsTrigger value="console" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs tracking-wider uppercase text-muted-foreground data-[state=active]:text-foreground transition-all">
                          Output {consoleOutput.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]">{consoleOutput.length}</span>}
                        </TabsTrigger>
                        <TabsTrigger value="submissions" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs tracking-wider uppercase text-muted-foreground data-[state=active]:text-foreground transition-all">Submissions</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="problem" className="flex-1 p-6 overflow-y-auto custom-scrollbar m-0">
                      <div className="space-y-6">
                        {problem.testCases?.filter((tc: any) => tc.isPublic).map((tc: any, i: number) => {
                          // Handle structured or legacy test cases
                          const input = tc.input ?? (tc.args ? tc.args.join("\n") : "");
                          const output = tc.output ?? tc.expected ?? "";

                          return (
                            <div key={i} className="group transition-all duration-300">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-5 w-5 rounded-full bg-accent/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                  {i + 1}
                                </div>
                                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">Test Case</div>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                  <div className="text-[10px] font-semibold text-muted-foreground ml-1">INPUT</div>
                                  <div className="bg-black/20 border border-white/5 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap text-foreground/80 min-h-[44px]">
                                    {input}
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="text-[10px] font-semibold text-muted-foreground ml-1">EXPECTED OUTPUT</div>
                                  <div className="bg-black/20 border border-white/5 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap text-emerald-500/80 min-h-[44px]">
                                    {output}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {(!problem.testCases || problem.testCases.filter((tc: any) => tc.isPublic).length === 0) && (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                              <EyeOff className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">No public test cases available</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="console" className="flex-1 p-6 overflow-y-auto custom-scrollbar m-0">
                      {consoleOutput.length > 0 ? (
                        <div className="space-y-4">
                          {consoleOutput.map((res: any, i: number) => (
                            <div key={i} className={cn(
                              "relative group overflow-hidden rounded-xl border transition-all duration-300",
                              res.passed
                                ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                                : "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40"
                            )}>
                              <div className="flex items-center justify-between p-4 bg-white/5">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter uppercase",
                                    res.passed ? "bg-emerald-500 text-black" : "bg-rose-500 text-white"
                                  )}>
                                    {res.passed ? "PASSED" : "FAILED"}
                                  </div>
                                  <span className="text-xs font-bold font-mono text-muted-foreground">TC#{i + 1}</span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/60">
                                  <span>{res.runtime}ms</span>
                                </div>
                              </div>

                              <div className="p-4 space-y-4">
                                {res.error ? (
                                  <div className="bg-black/20 p-3 rounded-lg border border-rose-500/20">
                                    <div className="text-[10px] font-bold text-rose-500 mb-2 uppercase tracking-wider">Error Runtime</div>
                                    <div className="text-xs font-mono text-rose-400 whitespace-pre-wrap">{res.error}</div>
                                  </div>
                                ) : (
                                  <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] font-bold text-muted-foreground/60 tracking-wider">INPUT</div>
                                      <div className="bg-black/10 p-2 rounded-md font-mono text-[11px] text-foreground/70 overflow-x-auto truncate">{res.input || "N/A"}</div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] font-bold text-muted-foreground/60 tracking-wider">EXPECTED</div>
                                      <div className="bg-black/10 p-2 rounded-md font-mono text-[11px] text-emerald-500/60 overflow-x-auto truncate">{res.expected || "N/A"}</div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] font-bold text-muted-foreground/60 tracking-wider">ACTUAL</div>
                                      <div className={cn(
                                        "bg-black/10 p-2 rounded-md font-mono text-[11px] overflow-x-auto truncate",
                                        res.passed ? "text-emerald-500" : "text-rose-500 font-bold"
                                      )}>{res.actual || (res.passed ? "✓" : "NULL")}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center opacity-50 grayscale transition-all duration-700 hover:opacity-80 hover:grayscale-0">
                          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/5" />
                            <Play className="h-8 w-8 text-primary fill-primary ml-1" />
                          </div>
                          <h3 className="text-sm font-bold tracking-widest uppercase mb-2">Editor Standby</h3>
                          <p className="max-w-[200px] text-[10px] font-medium text-muted-foreground leading-relaxed">
                            Write your solution above and hit <span className="text-primary font-bold">RUN</span> to execute test cases.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="submissions" className="flex-1 p-6 overflow-y-auto custom-scrollbar m-0">
                      {submissions && submissions.length > 0 ? (
                        <div className="space-y-3">
                          {submissions.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "h-2 w-2 rounded-full",
                                  sub.status === "accepted" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                )} />
                                <div className="flex flex-col gap-0.5">
                                  <div className={cn(
                                    "text-xs font-black uppercase tracking-tight",
                                    sub.status === "accepted" ? "text-emerald-500" : "text-rose-500"
                                  )}>
                                    {sub.status.replace("_", " ")}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground/60 font-medium">
                                    {new Date(sub.createdAt).toLocaleDateString()} at {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end gap-0.5">
                                  <div className="text-[11px] font-mono font-bold text-foreground/80 lowercase">{sub.lang}</div>
                                  <div className="text-[10px] text-muted-foreground/40 font-mono tracking-tighter">
                                    {sub.testsPassed}/{sub.testsTotal} tests
                                  </div>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                  <ChevronLeft className="h-4 w-4 rotate-180" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                          <div className="h-14 w-14 border-2 border-dashed border-muted rounded-full flex items-center justify-center mb-6">
                            <Send className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">No submissions yet for this problem</p>
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
