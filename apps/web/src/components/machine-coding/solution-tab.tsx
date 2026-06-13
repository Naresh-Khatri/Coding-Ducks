"use client";

import { Lightbulb } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Markdown } from "~/components/markdown";
import { ShikiCode } from "~/components/shiki-code";

import { useMachineCodingTests } from "./use-tests";

const LANG_BY_EXT: Record<string, string> = {
  tsx: "tsx",
  ts: "ts",
  jsx: "jsx",
  js: "js",
  mjs: "js",
  css: "css",
  html: "html",
  json: "json",
  md: "markdown",
};

function langFromPath(path: string): string {
  const ext = path.split(".").pop() ?? "";
  return LANG_BY_EXT[ext] ?? "text";
}

/**
 * The Solution tab body. Gated: the reference solution is only fetched (and the
 * attempt stamped as "revealed") when the user explicitly asks for it. Once
 * loaded it shows the full solution source, read-only, followed by the editorial
 * write-up — the GreatFrontend-style "Solution" view, kept out of the editor so
 * the user's own code is never overwritten.
 */
export function SolutionTab() {
  const { revealed, reveal, revealPending, solutionFiles, editorial } =
    useMachineCodingTests();

  if (!solutionFiles) {
    return (
      <SolutionGate
        revealed={revealed}
        reveal={reveal}
        revealPending={revealPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(solutionFiles).map(([path, content]) => (
        <div key={path}>
          <div className="text-muted-foreground mb-2 font-mono text-xs">
            {path}
          </div>
          <ShikiCode code={content} lang={langFromPath(path)} />
        </div>
      ))}
      {editorial && (
        <div className="border-t pt-6">
          <Markdown>{editorial}</Markdown>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state before the solution is loaded. A returning user whose attempt is
 * already flagged `revealed` gets a plain "Show solution" button (no warning —
 * they've seen it before); a first-timer gets a confirm dialog, since viewing it
 * stamps the attempt.
 */
function SolutionGate({
  revealed,
  reveal,
  revealPending,
}: {
  revealed: boolean;
  reveal: () => void;
  revealPending: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="bg-muted rounded-full p-3">
        <Lightbulb className="text-muted-foreground size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Reference solution</p>
        <p className="text-muted-foreground mx-auto max-w-xs text-xs leading-relaxed">
          Give the tests a real attempt first — you&apos;ll learn more. Viewing
          the solution marks this attempt as revealed.
        </p>
      </div>

      {revealed ? (
        <Button size="sm" onClick={reveal} disabled={revealPending}>
          <Lightbulb className="mr-1 size-3.5" />
          {revealPending ? "Loading…" : "Show solution"}
        </Button>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" disabled={revealPending}>
              <Lightbulb className="mr-1 size-3.5" />
              Reveal solution
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reveal the solution?</AlertDialogTitle>
              <AlertDialogDescription>
                The reference solution and editorial will appear here in the
                Solution tab. This marks the attempt as having viewed the
                solution.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={reveal}>
                Reveal solution
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
