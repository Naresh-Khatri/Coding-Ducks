"use client";

import type { Language } from "~/components/code-editor";
import { CodeEditor } from "~/components/code-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

const LANGUAGES: Array<{ key: string; label: string }> = [
  { key: "py", label: "Python" },
  { key: "js", label: "JavaScript" },
  { key: "cpp", label: "C++" },
  { key: "java", label: "Java" },
  { key: "c", label: "C" },
];

interface SubmissionDetailDialogProps {
  submission: any | null;
  onClose: () => void;
}

export function SubmissionDetailDialog({
  submission,
  onClose,
}: SubmissionDetailDialogProps) {
  if (!submission) return null;

  const sub = submission;
  const langLabel =
    LANGUAGES.find((l) => l.key === sub.lang)?.label || sub.lang;
  const results = sub.results as any[] | null;

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
            { label: "Language", value: langLabel },
            {
              label: "Runtime",
              value: sub.runtime != null ? `${sub.runtime} ms` : "N/A",
            },
            {
              label: "Memory",
              value:
                sub.memory != null
                  ? sub.memory >= 1024
                    ? `${(sub.memory / 1024).toFixed(1)} MB`
                    : `${sub.memory} KB`
                  : "N/A",
            },
            {
              label: "Tests",
              value: `${sub.testsPassed}/${sub.testsTotal} passed`,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-accent/40 p-3">
              <div className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                {stat.label}
              </div>
              <div className="text-foreground text-sm font-medium">
                {stat.value}
              </div>
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
            <div className="flex flex-wrap gap-1.5">
              {results.map((r: any, i: number) => (
                <div
                  key={i}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold",
                    r.passed
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-rose-500/15 text-rose-500",
                  )}
                >
                  {i + 1}
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
