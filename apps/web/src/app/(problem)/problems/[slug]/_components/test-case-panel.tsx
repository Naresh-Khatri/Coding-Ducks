"use client";

import { useState } from "react";
import { EyeOff, Pencil, Play, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import type { ConsoleResult, ProblemDetail } from "../types";

interface TestCasePanelProps {
  problem: ProblemDetail;
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  consoleOutput: ConsoleResult[];
  selectedTestCase: number;
  onSelectTestCase: (i: number) => void;
  selectedOutputCase: number;
  onSelectOutputCase: (i: number) => void;
  customTestCase: Record<string, string> | null;
  onCustomTestCaseChange: (args: Record<string, string> | null) => void;
}

const tabTriggerClass =
  "data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground h-full rounded-none border-b-2 border-transparent px-0 text-xs font-bold tracking-wider uppercase transition-all data-[state=active]:bg-transparent";

export function TestCasePanel({
  problem,
  activeTab,
  onActiveTabChange,
  consoleOutput,
  selectedTestCase,
  onSelectTestCase,
  selectedOutputCase,
  onSelectOutputCase,
  customTestCase,
  onCustomTestCaseChange,
}: TestCasePanelProps) {
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const sig = problem.functionSignature;
  const publicCases =
    problem.testCases?.filter((tc) => tc.isPublic) ?? [];

  const startCustomEdit = () => {
    const tc = publicCases[selectedTestCase] ?? publicCases[0];
    const initial: Record<string, string> = {};
    if (sig?.params) {
      if (tc?.args) {
        sig.params.forEach((p, i) => {
          initial[p.name] = tc.args?.[i] ?? "";
        });
      }
    } else {
      // stdin problem: a single raw-input field (sentinel key).
      initial.stdin = tc?.input ?? "";
    }
    onCustomTestCaseChange(initial);
    setIsEditingCustom(true);
  };

  const clearCustom = () => {
    onCustomTestCaseChange(null);
    setIsEditingCustom(false);
  };

  return (
    <div className="bg-card/10 flex h-full flex-col">
      <Tabs
        value={activeTab}
        onValueChange={onActiveTabChange}
        className="flex h-full flex-col"
      >
        <div className="bg-card/30 border-b px-4 backdrop-blur-sm">
          <TabsList className="h-10 gap-8 bg-transparent p-0">
            <TabsTrigger value="problem" className={tabTriggerClass}>
              Test Cases
            </TabsTrigger>
            <TabsTrigger value="console" className={tabTriggerClass}>
              Output{" "}
              {consoleOutput.length > 0 && (
                <span className="bg-primary/10 text-primary ml-2 rounded-full px-1.5 py-0.5 text-[10px]">
                  {consoleOutput.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Test Cases */}
        <TabsContent
          value="problem"
          className="custom-scrollbar m-0 flex-1 overflow-y-auto"
        >
          {publicCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-accent/20 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                <EyeOff className="text-muted-foreground/40 h-6 w-6" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                No public test cases available
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-4 flex items-center gap-2">
                {publicCases.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onSelectTestCase(i);
                      if (isEditingCustom) clearCustom();
                    }}
                    className={cn(
                      "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                      !isEditingCustom && selectedTestCase === i
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Case {i + 1}
                  </button>
                ))}
                {isEditingCustom ? (
                  <button
                    onClick={clearCustom}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Custom
                  </button>
                ) : (
                  <button
                    onClick={startCustomEdit}
                    className="bg-accent text-foreground flex items-center gap-1 rounded-lg border border-dashed border-white/10 px-3 py-1 text-xs font-medium transition-colors hover:border-white/20"
                  >
                    <Pencil className="h-3 w-3" />
                    Custom
                  </button>
                )}
              </div>

              {isEditingCustom && customTestCase ? (
                <div className="space-y-3">
                  {sig?.params ? (
                    sig.params.map((param) => (
                      <div key={param.name}>
                        <div className="text-muted-foreground mb-1 text-xs font-medium">
                          {param.name} =
                        </div>
                        <textarea
                          value={customTestCase[param.name] ?? ""}
                          onChange={(e) =>
                            onCustomTestCaseChange({
                              ...customTestCase,
                              [param.name]: e.target.value,
                            })
                          }
                          className="bg-accent/40 text-foreground w-full resize-none rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-white/20"
                          rows={1}
                          spellCheck={false}
                        />
                      </div>
                    ))
                  ) : (
                    <div>
                      <div className="text-muted-foreground mb-1 text-xs font-medium">
                        Input (stdin)
                      </div>
                      <textarea
                        value={customTestCase.stdin ?? ""}
                        onChange={(e) =>
                          onCustomTestCaseChange({
                            ...customTestCase,
                            stdin: e.target.value,
                          })
                        }
                        className="bg-accent/40 text-foreground w-full resize-none rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-white/20"
                        rows={4}
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>
              ) : (
                (() => {
                  const tc =
                    publicCases[selectedTestCase] ?? publicCases[0];
                  if (!tc) return null;
                  return (
                    <div className="space-y-3">
                      {tc.args && sig?.params ? (
                        sig.params.map((param, j) => (
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
                  );
                })()
              )}
            </div>
          )}
        </TabsContent>

        {/* Output */}
        <TabsContent
          value="console"
          className="custom-scrollbar m-0 flex-1 overflow-y-auto"
        >
          {consoleOutput.length > 0 ? (
            (() => {
              const allPassed = consoleOutput.every((r) => r.passed);
              const res =
                consoleOutput[selectedOutputCase] ?? consoleOutput[0];
              const tc = publicCases[selectedOutputCase];
              if (!res) return null;
              return (
                <div className="p-4">
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
                  <div className="mb-4 flex items-center gap-2">
                    {consoleOutput.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectOutputCase(i)}
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
                      {tc?.args && sig?.params ? (
                        sig.params.map((param, j) => (
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

                      {/* Output vs Expected — diff style */}
                      {!res.passed ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="mb-1 text-xs font-medium text-rose-400">
                              Output
                            </div>
                            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 font-mono text-sm text-rose-400">
                              {res.actual || "null"}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs font-medium text-emerald-400">
                              Expected
                            </div>
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 font-mono text-sm text-emerald-400">
                              {res.expected || tc?.expected || "N/A"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-1 text-xs font-medium text-emerald-400">
                            Output
                          </div>
                          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 font-mono text-sm text-emerald-400">
                            {res.actual || "null"}
                          </div>
                        </div>
                      )}
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
      </Tabs>
    </div>
  );
}
