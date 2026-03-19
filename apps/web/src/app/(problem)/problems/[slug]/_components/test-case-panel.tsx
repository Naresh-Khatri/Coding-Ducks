"use client";

import { EyeOff, Play } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

interface TestCasePanelProps {
  problem: any;
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  consoleOutput: any[];
  selectedTestCase: number;
  onSelectTestCase: (i: number) => void;
  selectedOutputCase: number;
  onSelectOutputCase: (i: number) => void;
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
}: TestCasePanelProps) {
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
          {(() => {
            const publicCases =
              problem.testCases?.filter((tc: any) => tc.isPublic) || [];
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
                <div className="mb-4 flex items-center gap-2">
                  {publicCases.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => onSelectTestCase(i)}
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

        {/* Output */}
        <TabsContent
          value="console"
          className="custom-scrollbar m-0 flex-1 overflow-y-auto"
        >
          {consoleOutput.length > 0 ? (
            (() => {
              const allPassed = consoleOutput.every((r: any) => r.passed);
              const res =
                consoleOutput[selectedOutputCase] || consoleOutput[0];
              const sig = problem.functionSignature as any;
              const publicCases =
                problem.testCases?.filter((tc: any) => tc.isPublic) || [];
              const tc = publicCases[selectedOutputCase];
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
                    {consoleOutput.map((r: any, i: number) => (
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
      </Tabs>
    </div>
  );
}
