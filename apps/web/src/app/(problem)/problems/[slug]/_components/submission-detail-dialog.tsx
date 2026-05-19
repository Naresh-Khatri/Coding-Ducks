"use client";

import { useQuery } from "@tanstack/react-query";

import type { Language } from "~/components/code-editor";
import { CodeEditor } from "~/components/code-editor";
import { useTRPC } from "~/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { getLanguageLabel } from "~/lib/languages";
import { cn } from "~/lib/utils";
import type { SubmissionDetail } from "../types";

interface SubmissionDetailDialogProps {
  submission: SubmissionDetail | null;
  onClose: () => void;
}

/**
 * Highlight where `actual` first diverges from `expected` by trimming the
 * shared prefix/suffix and emphasising the differing middle. Keeps the diff
 * cheap (no library) while making the mismatch obvious at a glance.
 */
function DiffValue({
  expected,
  actual,
}: {
  expected: string;
  actual: string;
}) {
  let start = 0;
  while (
    start < expected.length &&
    start < actual.length &&
    expected[start] === actual[start]
  ) {
    start++;
  }
  let end = 0;
  while (
    end < expected.length - start &&
    end < actual.length - start &&
    expected[expected.length - 1 - end] === actual[actual.length - 1 - end]
  ) {
    end++;
  }

  const render = (s: string, diffClass: string) => (
    <>
      {s.slice(0, start)}
      <span className={cn("rounded-sm px-0.5", diffClass)}>
        {s.slice(start, s.length - end)}
      </span>
      {s.slice(s.length - end)}
    </>
  );

  return (
    <div className="space-y-1">
      <div>
        <span className="text-muted-foreground">Expected: </span>
        <span className="break-all text-emerald-400">
          {render(expected, "bg-emerald-500/20")}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Got: </span>
        <span className="break-all text-rose-400">
          {render(actual, "bg-rose-500/25")}
        </span>
      </div>
    </div>
  );
}

export function SubmissionDetailDialog({
  submission,
  onClose,
}: SubmissionDetailDialogProps) {
  const trpc = useTRPC();
  const { data: percentile } = useQuery(
    trpc.submission.percentile.queryOptions(
      { id: submission?.id ?? 0 },
      { enabled: !!submission && submission.status === "accepted" },
    ),
  );

  if (!submission) return null;

  const sub = submission;
  const langLabel = getLanguageLabel(sub.lang);
  const results = sub.results;

  return (
    <Dialog open={!!submission} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
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

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Language", value: langLabel, beats: null },
            {
              label: "Runtime",
              value: sub.runtime != null ? `${sub.runtime} ms` : "N/A",
              beats: percentile?.runtime ?? null,
            },
            {
              label: "Memory",
              value:
                sub.memory != null
                  ? sub.memory >= 1024
                    ? `${(sub.memory / 1024).toFixed(1)} MB`
                    : `${sub.memory} KB`
                  : "N/A",
              beats: percentile?.memory ?? null,
            },
            {
              label: "Tests",
              value: `${sub.testsPassed}/${sub.testsTotal} passed`,
              beats: null,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-accent/40 p-3">
              <div className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                {stat.label}
              </div>
              <div className="text-foreground text-sm font-medium">
                {stat.value}
              </div>
              {stat.beats != null && (
                <div className="mt-0.5 text-[10px] font-medium text-emerald-500">
                  Beats {stat.beats}%
                </div>
              )}
            </div>
          ))}
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

        {results && results.length > 0 && (
          <div>
            <div className="text-muted-foreground mb-2 text-xs font-medium">
              Test Results
            </div>
            <div className="max-h-64 space-y-2 overflow-auto">
              {results
                .map((r, i) => ({ r, n: i + 1 }))
                .sort((a, b) => Number(a.r.passed) - Number(b.r.passed))
                .map(({ r, n }) => (
                <div
                  key={n}
                  className="rounded-lg border border-white/5 bg-accent/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Test {n}</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        r.passed ? "text-emerald-500" : "text-rose-500",
                      )}
                    >
                      {r.passed ? "Passed" : "Failed"}
                    </span>
                  </div>
                  {(r.input != null ||
                    r.expected != null ||
                    r.actual != null ||
                    r.error) && (
                    <div className="mt-2 space-y-1 font-mono text-[11px]">
                      {r.input != null && (
                        <div>
                          <span className="text-muted-foreground">Input: </span>
                          <span className="break-all">{r.input}</span>
                        </div>
                      )}
                      {!r.passed &&
                      r.expected != null &&
                      r.actual != null ? (
                        <DiffValue
                          expected={r.expected}
                          actual={r.actual}
                        />
                      ) : (
                        <>
                          {r.expected != null && (
                            <div>
                              <span className="text-muted-foreground">
                                Expected:{" "}
                              </span>
                              <span className="break-all text-emerald-400">
                                {r.expected}
                              </span>
                            </div>
                          )}
                          {r.actual != null && (
                            <div>
                              <span className="text-muted-foreground">
                                Got:{" "}
                              </span>
                              <span
                                className={cn(
                                  "break-all",
                                  r.passed
                                    ? "text-emerald-400"
                                    : "text-rose-400",
                                )}
                              >
                                {r.actual}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {r.error && (
                        <div className="whitespace-pre-wrap text-rose-400">
                          {r.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
      </DialogContent>
    </Dialog>
  );
}
