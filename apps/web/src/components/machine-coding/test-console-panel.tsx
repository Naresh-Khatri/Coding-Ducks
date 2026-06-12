"use client";

import { SquareTerminal } from "lucide-react";

import type { MachineCodingConsoleEntry } from "./use-tests";
import { cn } from "~/lib/utils";
import { useMachineCodingTests } from "./use-tests";

const LEVEL_ROW: Record<MachineCodingConsoleEntry["level"], string> = {
  error: "bg-red-500/10 text-red-600 dark:text-red-300",
  warn: "bg-amber-500/10 text-amber-600 dark:text-amber-200",
  info: "text-sky-600 dark:text-sky-300",
  debug: "text-muted-foreground",
  log: "text-foreground/90",
};

/**
 * Bottom-drawer "Console" tab: the `console.*` output captured while the test
 * suite ran (see the setup harness in `@acme/machine-coding-content`). This is the
 * GreatFrontend-style console for pure-utility problems with no UI preview —
 * log inside your function, run the tests, and the output shows up here.
 */
export function TestConsolePanel() {
  const { consoleEntries, run } = useMachineCodingTests();

  if (consoleEntries.length === 0) {
    return (
      <div className="bg-background text-muted-foreground/70 flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-xs">
        <SquareTerminal className="size-5 opacity-40" />
        <p>
          {run
            ? "Nothing was logged on the last run. Add console.log to your code and re-run."
            : "Run the tests — anything your code logs will show up here."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background h-full overflow-y-auto">
      {consoleEntries.map((entry, i) => (
        <div
          key={i}
          className={cn(
            "border-b border-black/[0.04] px-3 py-1 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap dark:border-white/[0.04]",
            LEVEL_ROW[entry.level],
          )}
        >
          {entry.text || " "}
        </div>
      ))}
    </div>
  );
}
