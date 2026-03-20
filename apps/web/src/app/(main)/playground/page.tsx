"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Cpu,
  Loader2,
  MemoryStick,
  Play,
  RotateCcw,
  Terminal,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import type { Language } from "~/components/code-editor";
import { authClient } from "~/auth/client";
import { CodeEditor } from "~/components/code-editor";
import { Button } from "~/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";
import {
  PythonLogo,
  JavaScriptLogo,
  TypeScriptLogo,
  JavaLogo,
  CppLogo,
  CLogo,
  RustLogo,
  GoLogo,
  RubyLogo,
  PhpLogo,
} from "./_components/language-logos";

const LANGUAGES: Array<{
  id: Language;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  ext: string;
}> = [
  { id: "py", label: "Python", icon: PythonLogo, ext: "py" },
  { id: "js", label: "Node.js", icon: JavaScriptLogo, ext: "js" },
  { id: "ts", label: "TypeScript", icon: TypeScriptLogo, ext: "ts" },
  { id: "java", label: "Java", icon: JavaLogo, ext: "java" },
  { id: "cpp", label: "C++", icon: CppLogo, ext: "cpp" },
  { id: "c", label: "C", icon: CLogo, ext: "c" },
  { id: "rs", label: "Rust", icon: RustLogo, ext: "rs" },
  { id: "go", label: "Go", icon: GoLogo, ext: "go" },
  { id: "rb", label: "Ruby", icon: RubyLogo, ext: "rb" },
  { id: "php", label: "PHP", icon: PhpLogo, ext: "php" },
];

const DEFAULT_CODE: Record<Language, string> = {
  py: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(f"fib({i}) = {fibonacci(i)}")
`,
  js: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}
`,
  ts: `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}
`,
  java: `public class Main {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    public static void main(String[] args) {
        for (int i = 0; i < 10; i++) {
            System.out.println("fib(" + i + ") = " + fibonacci(i));
        }
    }
}
`,
  cpp: `#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    for (int i = 0; i < 10; i++) {
        cout << "fib(" << i << ") = " << fibonacci(i) << endl;
    }
    return 0;
}
`,
  c: `#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    for (int i = 0; i < 10; i++) {
        printf("fib(%d) = %d\\n", i, fibonacci(i));
    }
    return 0;
}
`,
  rs: `fn fibonacci(n: u32) -> u32 {
    if n <= 1 { return n; }
    fibonacci(n - 1) + fibonacci(n - 2)
}

fn main() {
    for i in 0..10 {
        println!("fib({}) = {}", i, fibonacci(i));
    }
}
`,
  go: `package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    for i := 0; i < 10; i++ {
        fmt.Printf("fib(%d) = %d\\n", i, fibonacci(i))
    }
}
`,
  rb: `def fibonacci(n)
  return n if n <= 1
  fibonacci(n - 1) + fibonacci(n - 2)
end

(0...10).each do |i|
  puts "fib(#{i}) = #{fibonacci(i)}"
end
`,
  php: `<?php
function fibonacci(int $n): int {
    if ($n <= 1) return $n;
    return fibonacci($n - 1) + fibonacci($n - 2);
}

for ($i = 0; $i < 10; $i++) {
    echo "fib($i) = " . fibonacci($i) . "\\n";
}
`,
};

type VerdictType = "OK" | "CE" | "RE" | "SG" | "TO" | "XX";

interface ExecutionResult {
  verdict: VerdictType;
  stdout: string;
  stderr: string;
  time: number;
  memory: number;
  exitCode: number;
  wallTime?: number;
  cgOomKilled?: boolean;
}

const VERDICT_CONFIG: Record<
  VerdictType,
  { label: string; color: string; bg: string }
> = {
  OK: {
    label: "Success",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  CE: {
    label: "Compilation Error",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  RE: {
    label: "Runtime Error",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  SG: {
    label: "Signal Error",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  TO: {
    label: "Time Limit Exceeded",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  XX: {
    label: "Internal Error",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
};

function LanguageSelector({
  value,
  onChange,
}: {
  value: Language;
  onChange: (lang: Language) => void;
}) {
  const current = LANGUAGES.find((l) => l.id === value)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <current.icon className="h-4 w-4" />
          <span className="font-medium">{current.label}</span>
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            className="text-muted-foreground"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.id}
            onClick={() => onChange(lang.id)}
            className={cn(
              "gap-2.5",
              lang.id === value && "bg-primary/10 text-primary",
            )}
          >
            <lang.icon className="h-4 w-4 shrink-0" />
            <span className="font-medium">{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function PlaygroundPage() {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;

  const [language, setLanguage] = useState<Language>("py");
  const [codes, setCodes] = useState<Record<string, string>>({
    ...DEFAULT_CODE,
  });
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const currentCode = codes[language] ?? "";
  const currentLang = LANGUAGES.find((l) => l.id === language)!;

  const setCode = useCallback(
    (value: string) => {
      setCodes((prev) => ({ ...prev, [language]: value }));
    },
    [language],
  );

  const runMutation = useMutation(
    trpc.playground.run.mutationOptions({
      onSuccess: (data) => {
        setJobId(data.jobId);
        setResult(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to submit code");
        setIsRunning(false);
      },
    }),
  );

  // Poll for job status
  const statusQuery = useQuery(
    trpc.playground.status.queryOptions(
      { jobId: jobId! },
      {
        enabled: !!jobId,
        refetchInterval: (query) => {
          const status = query.state.data?.status;
          if (status === "completed" || status === "failed") return false;
          return 1000;
        },
      },
    ),
  );

  // Handle polling completion
  useEffect(() => {
    if (!statusQuery.data || !jobId) return;
    const { status, result: jobResult } = statusQuery.data;

    if (status === "completed" || status === "failed") {
      if (jobResult) {
        setResult(jobResult);
      }
      setJobId(null);
      setIsRunning(false);
    }
  }, [statusQuery.data, jobId]);

  // Auto-scroll output
  useEffect(() => {
    if (result && outputRef.current) {
      outputRef.current.scrollTop = 0;
    }
  }, [result]);

  const handleRun = () => {
    if (!currentCode.trim()) {
      toast.error("Please write some code first");
      return;
    }
    setIsRunning(true);
    setResult(null);
    runMutation.mutate({ code: currentCode, lang: language });
  };

  const handleReset = () => {
    setCodes((prev) => ({ ...prev, [language]: DEFAULT_CODE[language] }));
    setResult(null);
  };

  const verdictInfo = result ? VERDICT_CONFIG[result.verdict] : null;

  return (
    <div className="bg-background flex h-[calc(100vh-64px)] flex-col">
      {/* Header Bar */}
      <div className="bg-card/50 flex items-center justify-between border-b px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Terminal className="text-primary h-5 w-5" />
          <h1 className="text-lg font-bold tracking-tight">Playground</h1>
          <span className="text-muted-foreground hidden text-xs sm:inline">
            Run code in a secure sandbox
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector value={language} onChange={setLanguage} />

          <div className="bg-border hidden h-6 w-px sm:block" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            title="Reset code"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleRun}
            disabled={isRunning || !isAuthenticated}
            className="shadow-primary/20 gap-2 rounded-full px-5 shadow-lg"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            {isRunning ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Editor */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="flex h-full flex-col">
              <div className="bg-card/30 flex items-center justify-between border-b px-4 py-2 text-xs backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/80 h-2 w-2 animate-pulse rounded-full" />
                  <span className="text-muted-foreground/80 font-bold tracking-wider uppercase">
                    Editor
                  </span>
                </div>
                <div className="text-muted-foreground/60 flex items-center gap-1.5 font-mono text-[11px]">
                  <currentLang.icon className="h-3.5 w-3.5" />
                  main.{currentLang.ext}
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
            className="bg-border/50 hover:bg-primary/30 w-1 transition-colors"
          />

          {/* Output */}
          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="flex h-full flex-col">
              <div className="bg-card/30 flex items-center justify-between border-b px-4 py-2 text-xs backdrop-blur-sm">
                <span className="text-muted-foreground/80 font-bold tracking-wider uppercase">
                  Output
                </span>
                {result && verdictInfo && (
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                      verdictInfo.bg,
                    )}
                  >
                    {result.verdict === "OK" ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3 w-3 text-rose-400" />
                    )}
                    <span className={verdictInfo.color}>
                      {verdictInfo.label}
                    </span>
                  </div>
                )}
              </div>

              <div
                ref={outputRef}
                className="custom-scrollbar flex-1 overflow-y-auto bg-[#1e1e1e] p-4"
              >
                {!isAuthenticated && !result && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-muted-foreground text-sm">
                      Sign in to run code in the playground.
                    </p>
                  </div>
                )}

                {isAuthenticated && !result && !isRunning && (
                  <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
                    <div className="bg-primary/10 mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                      <Play className="text-primary fill-primary ml-0.5 h-7 w-7" />
                    </div>
                    <p className="text-muted-foreground text-xs font-medium">
                      Write code and hit{" "}
                      <span className="text-primary font-bold">Run</span> to see
                      output here.
                    </p>
                  </div>
                )}

                {isRunning && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Loader2 className="text-primary mb-4 h-8 w-8 animate-spin" />
                    <p className="text-muted-foreground animate-pulse text-xs font-medium">
                      Executing...
                    </p>
                  </div>
                )}

                {result && (
                  <div className="space-y-4">
                    {/* stdout */}
                    {result.stdout && (
                      <div>
                        <div className="text-muted-foreground/60 mb-2 text-[10px] font-bold tracking-wider uppercase">
                          stdout
                        </div>
                        <pre className="custom-scrollbar overflow-x-auto rounded-lg border border-white/5 bg-black/30 p-3 font-mono text-sm leading-relaxed text-emerald-300/90 whitespace-pre-wrap">
                          {result.stdout}
                        </pre>
                      </div>
                    )}

                    {/* stderr */}
                    {result.stderr && (
                      <div>
                        <div className="mb-2 text-[10px] font-bold tracking-wider text-rose-400/60 uppercase">
                          stderr
                        </div>
                        <pre className="custom-scrollbar overflow-x-auto rounded-lg border border-rose-500/10 bg-rose-500/5 p-3 font-mono text-xs leading-relaxed text-rose-300/80 whitespace-pre-wrap">
                          {result.stderr}
                        </pre>
                      </div>
                    )}

                    {/* Empty output */}
                    {!result.stdout && !result.stderr && (
                      <p className="text-muted-foreground/40 py-8 text-center text-xs italic">
                        Program finished with no output.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              <div className="bg-card/30 flex items-center gap-6 border-t px-4 py-2 text-[11px]">
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono">
                    {result ? `${result.time}ms` : "\u2014"}
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <MemoryStick className="h-3 w-3" />
                  <span className="font-mono">
                    {result
                      ? `${(result.memory / 1024).toFixed(1)}MB`
                      : "\u2014"}
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="h-3 w-3" />
                  <span className="font-mono">
                    {result ? `exit ${result.exitCode}` : "\u2014"}
                  </span>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
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
