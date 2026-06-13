"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FlaskConical,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { TestConsolePanel } from "./test-console-panel";
import { TestResultsList } from "./test-results-panel";
import { useMachineCodingTests } from "./use-tests";

type BottomTab = "tests" | "console";

/**
 * The editor's bottom drawer for machine-coding, modeled on GreatFrontend's
 * results pane: a Tests / Console tab switcher plus an always-available "Run
 * tests" button. "Tests" shows the per-spec pass/fail breakdown; "Console"
 * shows whatever the user's code logged on the last run (the natural output
 * surface for pure-utility problems that have no UI preview).
 */
export function MachineCodingBottomPanel() {
  const {
    ready,
    status,
    running,
    run,
    error,
    consoleEntries,
    clearConsole,
    runTests,
  } = useMachineCodingTests();
  const [tab, setTab] = useState<BottomTab>("tests");

  const allPass = run != null && run.total > 0 && run.passed >= run.total;

  // Phase-aware label for the run button while the sandbox is still coming up.
  const bootLabel =
    status === "installing"
      ? "Installing…"
      : status === "starting"
        ? "Starting…"
        : status === "error"
          ? "Failed"
          : "Booting…";

  return (
    <div className="bg-background flex h-full flex-col">
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <Button
          variant={tab === "tests" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 gap-1.5 rounded-md px-3 text-xs"
          onClick={() => setTab("tests")}
        >
          Tests
          {run && (
            <span
              className={cn(
                "flex items-center gap-1 font-medium",
                allPass ? "text-green-500" : "text-amber-500",
              )}
            >
              {allPass ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              {run.passed}/{run.total}
            </span>
          )}
        </Button>
        <Button
          variant={tab === "console" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 gap-1.5 rounded-md px-3 text-xs"
          onClick={() => setTab("console")}
        >
          Console
          {consoleEntries.length > 0 && (
            <span className="bg-muted-foreground/20 text-foreground inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-medium">
              {consoleEntries.length > 99 ? "99+" : consoleEntries.length}
            </span>
          )}
        </Button>

        <div className="flex-1" />

        {error && (
          <span className="mr-1 hidden truncate text-xs text-amber-500 sm:inline">
            {error}
          </span>
        )}
        {tab === "console" && consoleEntries.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={clearConsole}
            title="Clear console"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
        <Button
          size="sm"
          className="h-7 shrink-0 px-3 text-xs"
          onClick={() => void runTests()}
          disabled={!ready || running}
        >
          {running ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <FlaskConical className="mr-1.5 size-3.5" />
          )}
          {running
            ? "Running…"
            : ready
              ? run
                ? "Re-run"
                : "Run tests"
              : bootLabel}
        </Button>
      </div>

      {/* Both panes stay mounted (scroll/collapse state preserved). */}
      <div className={tab === "tests" ? "min-h-0 flex-1" : "hidden"}>
        <TestResultsList />
      </div>
      <div className={tab === "console" ? "min-h-0 flex-1" : "hidden"}>
        <TestConsolePanel />
      </div>
    </div>
  );
}
