"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, XCircle } from "lucide-react";

import type { MachineCodingDiffLine } from "./use-tests";
import { BootStepper } from "~/components/code-workspace/boot-stepper";
import { cn } from "~/lib/utils";
import { useMachineCodingTests } from "./use-tests";

function caseKey(ancestors: string[], title: string, index: number): string {
  return `${index}:${ancestors.join("/")}/${title}`;
}

/** A labeled value block (Input / Expected / Received) shown per case. */
function ValueBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "expected" | "received";
}) {
  return (
    <div className="space-y-1">
      <p
        className={cn(
          "text-[10px] font-medium tracking-wide uppercase",
          tone === "expected"
            ? "text-green-600 dark:text-green-400"
            : tone === "received"
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <pre className="bg-muted/40 max-h-60 overflow-auto rounded p-2 font-mono text-xs whitespace-pre-wrap">
        {value}
      </pre>
    </div>
  );
}

/** Colored expected (−, green) vs received (+, red) diff, jest-style. */
function DiffView({ diff }: { diff: MachineCodingDiffLine[] }) {
  return (
    <pre className="bg-muted/40 overflow-auto rounded p-2 font-mono text-xs leading-relaxed">
      {diff.map((line, i) => (
        <div
          key={`${line.kind}:${i}`}
          className={cn(
            "whitespace-pre-wrap",
            line.kind === "expected" &&
              "bg-green-500/10 text-green-600 dark:text-green-400",
            line.kind === "received" &&
              "bg-red-500/10 text-red-600 dark:text-red-400",
            line.kind === "context" && "text-muted-foreground",
          )}
        >
          <span className="opacity-60 select-none">
            {line.kind === "expected"
              ? "- "
              : line.kind === "received"
                ? "+ "
                : "  "}
          </span>
          {line.text}
        </div>
      ))}
    </pre>
  );
}

/**
 * Bottom-drawer test results: a per-spec pass/fail list (GreatFrontend-style)
 * where each case is collapsible and failures expand to show the assertion plus
 * a colored expected/received diff. Header-less — the run button, pass count and
 * tab switcher live in the surrounding `MachineCodingBottomPanel`.
 */
export function TestResultsList() {
  const { ready, run, status } = useMachineCodingTests();
  // Keys the user manually flipped from the default (failures open, passes
  // closed). Kept as overrides so a re-run re-applies sensible defaults.
  const [overrides, setOverrides] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setOverrides((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="bg-background h-full">
      <div className="h-full overflow-auto py-1">
        {run && run.cases.length > 0 ? (
          run.cases.map((c, i) => {
            const key = caseKey(c.ancestors, c.title, i);
            // Failures default open, passes default closed; override flips it.
            const open = overrides.has(key) ? c.passed : !c.passed;
            return (
              <div key={key} className="px-1">
                <button
                  type="button"
                  className="hover:bg-muted/40 flex w-full items-start gap-1 rounded px-1 py-1 text-left text-sm"
                  onClick={() => toggle(key)}
                  aria-expanded={open}
                >
                  <ChevronRight
                    className={cn(
                      "text-muted-foreground mt-0.5 size-3.5 shrink-0 transition-transform",
                      open && "rotate-90",
                    )}
                  />
                  {c.passed ? (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                  )}
                  <span className="min-w-0">
                    {c.ancestors.length > 0 && (
                      <span className="text-muted-foreground">
                        {c.ancestors.join(" › ")}
                        {" › "}
                      </span>
                    )}
                    <span
                      className={cn(!c.passed && "text-foreground font-medium")}
                    >
                      {c.title}
                    </span>
                  </span>
                </button>

                {open && (
                  <div className="mb-1.5 ml-6 space-y-2">
                    {c.input !== null || c.expected !== null ? (
                      // Real captured values from the cases() harness.
                      <>
                        {c.input !== null && (
                          <ValueBlock label="Input" value={c.input} />
                        )}
                        {c.expected !== null && (
                          <ValueBlock
                            label="Expected output"
                            value={c.expected}
                            tone="expected"
                          />
                        )}
                        {!c.passed && c.received !== null && (
                          <ValueBlock
                            label="Your output"
                            value={c.received}
                            tone="received"
                          />
                        )}
                      </>
                    ) : c.source ? (
                      // Fallback: the spec's assertion source.
                      <ValueBlock label="Test code" value={c.source} />
                    ) : c.passed ? (
                      <p className="text-muted-foreground text-xs">
                        Passed — the assertion held.
                      </p>
                    ) : null}

                    {/* Without captured values, show the raw failure diff too. */}
                    {c.input === null &&
                      c.expected === null &&
                      !c.passed &&
                      (c.diff ?? c.message) && (
                        <div className="space-y-1">
                          {c.message && (
                            <p className="text-muted-foreground text-xs whitespace-pre-wrap">
                              {c.message}
                            </p>
                          )}
                          {c.diff && (
                            <>
                              <div className="flex gap-3 text-[10px] font-medium tracking-wide uppercase">
                                <span className="text-green-600 dark:text-green-400">
                                  − Expected
                                </span>
                                <span className="text-red-600 dark:text-red-400">
                                  + Received
                                </span>
                              </div>
                              <DiffView diff={c.diff} />
                            </>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })
        ) : ready ? (
          <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm">
            Run the tests to see a pass/fail breakdown for each spec.
          </div>
        ) : status === "error" ? (
          <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm">
            Couldn't start the test environment. Check the terminal for details.
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <BootStepper status={status} />
          </div>
        )}
      </div>
    </div>
  );
}
