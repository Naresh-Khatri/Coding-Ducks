"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { Language } from "~/components/code-editor";
import { authClient } from "~/auth/client";
import { Button } from "~/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useTRPC } from "~/trpc/react";

import { CodeEditorPanel } from "./_components/code-editor-panel";
import { LeftPanel } from "./_components/left-panel";
import { ProblemHeader } from "./_components/problem-header";
import { SubmissionDetailDialog } from "./_components/submission-detail-dialog";
import { TestCasePanel } from "./_components/test-case-panel";
import type { ConsoleResult, SubmissionDetail } from "./types";

export default function ProblemDetailPage() {
  const trpc = useTRPC();
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;

  const [codes, setCodes] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "py";
    return (localStorage.getItem("problem-editor-language") as Language) || "py";
  });
  const [leftTab, setLeftTab] = useState("description");
  const [activeTab, setActiveTab] = useState("problem");
  const [consoleOutput, setConsoleOutput] = useState<ConsoleResult[]>([]);
  const [lastProblemId, setLastProblemId] = useState<number | null>(null);
  const [pollingId, setPollingId] = useState<number | null>(null);
  const [pollingType, setPollingType] = useState<"run" | "submit" | null>(null);
  const [submissionsLimit, setSubmissionsLimit] = useState(10);
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [selectedOutputCase, setSelectedOutputCase] = useState(0);
  const [customTestCase, setCustomTestCase] = useState<Record<string, string> | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionDetail | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const draftsLoadedRef = useRef(false);

  // --- Queries ---

  const { data: problem, isLoading } = useQuery(
    trpc.problem.bySlug.queryOptions({ slug }),
  );

  const { data: savedDrafts } = useQuery(
    trpc.codeDraft.get.queryOptions(
      { problemId: problem?.id! },
      { enabled: !!problem?.id && isAuthenticated },
    ),
  );

  const { data: submissions, refetch: refetchSubmissions } = useQuery(
    trpc.submission.list.queryOptions(
      { problemId: problem?.id, limit: submissionsLimit },
      { enabled: !!problem?.id && isAuthenticated },
    ),
  );

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

  // --- Effects ---

  // Handle polling completion
  useEffect(() => {
    if (resultsQuery.data && resultsQuery.data.status !== "running") {
      const data = resultsQuery.data;
      if (pollingType === "run") {
        setConsoleOutput(data.results || []);
        setActiveTab("console");
        if (data.status === "judge_error") {
          toast.error("Judge error — please try again");
        } else {
          toast.success("Execution completed");
        }
      } else if (pollingType === "submit") {
        if (data.status === "accepted") {
          toast.success("🎉 Accepted!", {
            description: "Nice work — all test cases passed.",
          });
        } else {
          toast.error(`Submission Failed: ${data.status.replace("_", " ")}`);
        }
        refetchSubmissions();
        setLeftTab("submissions");
        setSelectedSubmission(data);
      }
      setPollingId(null);
      setPollingType(null);
    }
  }, [resultsQuery.data, pollingType, refetchSubmissions]);

  // Merge starter code with saved drafts
  useEffect(() => {
    if (!problem) return;
    if (isAuthenticated && savedDrafts === undefined) return;

    if (
      problem.id !== lastProblemId ||
      (!draftsLoadedRef.current && savedDrafts)
    ) {
      const starterCodes =
        (problem.starterCode as Record<string, string>) || {};
      const mergedCodes = { ...starterCodes, ...(savedDrafts || {}) };
      setCodes(mergedCodes);

      const availableLangs = Object.keys(mergedCodes);
      if (availableLangs.length > 0 && !availableLangs.includes(language)) {
        setLanguage(availableLangs[0] as Language);
      }

      setLastProblemId(problem.id);
      draftsLoadedRef.current = true;
    }
  }, [problem, lastProblemId, language, savedDrafts, isAuthenticated]);

  // Remember the chosen language across problems / reloads.
  useEffect(() => {
    localStorage.setItem("problem-editor-language", language);
  }, [language]);

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
    const starterCode = (problem.starterCode as Record<string, string>)?.[
      language
    ];
    if (currentCode === starterCode) return;

    setSaveStatus("saving");
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraftMutation.mutate({
        problemId: problem.id,
        lang: language,
        code: currentCode,
      });
    }, 2000);

    return () => clearTimeout(saveTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCode, language, problem?.id, isAuthenticated]);

  useEffect(() => {
    if (saveStatus === "saved") {
      const timer = setTimeout(() => setSaveStatus("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // --- Mutations ---

  const runMutation = useMutation(
    trpc.submission.run.mutationOptions({
      onSuccess: (data) => {
        if (!data) return;
        setPollingId(data.id);
      },
      onError: (err) => {
        toast.error(err.message || "Execution failed");
        setPollingType(null);
      },
    }),
  );

  const submitMutation = useMutation(
    trpc.submission.submit.mutationOptions({
      onSuccess: (data) => {
        if (!data) return;
        setPollingId(data.id);
      },
      onError: (err) => {
        toast.error(err.message || "Submission failed");
        setPollingType(null);
      },
    }),
  );

  const isRunning = runMutation.isPending || pollingType === "run";
  const isSubmitting = submitMutation.isPending || pollingType === "submit";

  const handleRun = () => {
    if (!problem || !currentCode) return;
    setPollingType("run");
    const sig = problem.functionSignature;
    const customArgs =
      customTestCase && sig?.params
        ? sig.params.map((p) => customTestCase[p.name] ?? "")
        : undefined;
    runMutation.mutate({
      problemId: problem.id,
      code: currentCode,
      lang: language,
      ...(customArgs ? { customArgs } : {}),
    });
  };

  const handleSubmit = () => {
    if (!problem || !currentCode) return;
    setPollingType("submit");
    submitMutation.mutate({
      problemId: problem.id,
      code: currentCode,
      lang: language,
    });
  };

  // --- Loading / Error states ---

  if (isLoading) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <Loader2 className="text-primary h-10 w-10 animate-spin" />
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
        </div>
        <Button asChild>
          <Link href="/problems">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Problems
          </Link>
        </Button>
      </div>
    );
  }

  const availableLanguages = Object.keys(
    (problem.starterCode as Record<string, string>) || {},
  );

  // --- Render ---

  return (
    <>
      <ProblemHeader
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        isAuthenticated={isAuthenticated}
        onRun={handleRun}
        onSubmit={handleSubmit}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel */}
          <ResizablePanel defaultSize={40} minSize={20} className="bg-card/30">
            <LeftPanel
              problem={problem}
              submissions={submissions}
              leftTab={leftTab}
              isAuthenticated={isAuthenticated}
              canLoadMore={(submissions?.length ?? 0) === submissionsLimit}
              onLoadMore={() => setSubmissionsLimit((l) => l + 10)}
              onLeftTabChange={setLeftTab}
              onSelectSubmission={setSelectedSubmission}
            />
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="bg-border/50 hover:bg-primary/30 w-1 transition-colors"
          />

          {/* Right Panel */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* Code Editor */}
              <ResizablePanel defaultSize={65} minSize={30}>
                <CodeEditorPanel
                  code={currentCode}
                  onCodeChange={setCode}
                  language={language}
                  onLanguageChange={setLanguage}
                  availableLanguages={availableLanguages}
                  saveStatus={saveStatus}
                  hasLastSubmission={
                    !!submissions?.some((s) => s.lang === language)
                  }
                  onRetrieveLastSubmission={() => {
                    const lastSub = submissions?.find(
                      (s) => s.lang === language,
                    );
                    if (lastSub?.code) {
                      setCode(lastSub.code);
                      toast.success("Last submission loaded");
                    }
                  }}
                  onResetToDefault={() => {
                    const starterCode =
                      (problem.starterCode as Record<string, string>)?.[
                        language
                      ] ?? "";
                    setCode(starterCode);
                    toast.success("Code reset to default");
                  }}
                  onRun={handleRun}
                  onSubmit={handleSubmit}
                />
              </ResizablePanel>

              <ResizableHandle
                withHandle
                className="bg-border/50 hover:bg-primary/30 h-1 transition-colors"
              />

              {/* Test Cases / Output */}
              <ResizablePanel defaultSize={35} minSize={10}>
                <TestCasePanel
                  problem={problem}
                  activeTab={activeTab}
                  onActiveTabChange={setActiveTab}
                  consoleOutput={consoleOutput}
                  selectedTestCase={selectedTestCase}
                  onSelectTestCase={setSelectedTestCase}
                  selectedOutputCase={selectedOutputCase}
                  onSelectOutputCase={setSelectedOutputCase}
                  customTestCase={customTestCase}
                  onCustomTestCaseChange={setCustomTestCase}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Submission Detail Dialog */}
      <SubmissionDetailDialog
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />

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
    </>
  );
}
