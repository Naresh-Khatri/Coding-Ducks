"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle, LogIn, Star, XCircle } from "lucide-react";

import { authClient } from "~/auth/client";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { track } from "~/lib/analytics";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface SubmissionHistoryProps {
  levelSlug: string;
  variant?: "panel" | "modal";
}

export function SubmissionHistory({
  levelSlug,
  variant = "panel",
}: SubmissionHistoryProps) {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();

  const { data: attempts, isLoading } = useQuery(
    trpc.systemDesign.myAttempts.queryOptions(
      { levelSlug },
      { enabled: !!session?.user },
    ),
  );

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <LogIn className="text-muted-foreground" size={24} />
        <div>
          <p className="text-sm font-medium">Sign in to track your progress</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Your submissions will be saved automatically
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            track("auth-signin", {
              provider: "google",
              source: "sd-submission-history",
            });
            authClient.signIn.social({
              provider: "google",
              callbackURL: window.location.pathname,
            });
          }}
        >
          Sign in with Google
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-muted-foreground text-sm">No submissions yet</p>
        <p className="text-muted-foreground text-xs">
          Complete a simulation to see your history
        </p>
      </div>
    );
  }

  return (
    <ScrollArea
      className={cn(variant === "modal" ? "max-h-[280px]" : "h-full")}
    >
      <div className="space-y-1.5 p-2">
        {attempts.map((attempt) => (
          <div
            key={attempt.id}
            className={cn(
              "bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2.5",
              (attempt.passed ?? 0) === 1 && "border-l-2 border-l-green-500/50",
              (attempt.passed ?? 0) === 0 && "border-l-2 border-l-red-500/50",
            )}
          >
            {/* Pass/fail icon */}
            <div className="shrink-0">
              {(attempt.passed ?? 0) === 1 ? (
                <CheckCircle size={14} className="text-green-500" />
              ) : (
                <XCircle size={14} className="text-red-500" />
              )}
            </div>

            {/* Stars */}
            <div className="flex shrink-0 gap-0.5">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  size={12}
                  className={cn(
                    s <= (attempt.stars ?? 0)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>

            {/* Stats */}
            <div className="flex min-w-0 flex-1 items-center gap-2 text-xs tabular-nums">
              <span className="text-muted-foreground">
                {((attempt.uptimePercent ?? 0) / 100).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">
                {attempt.avgLatencyMs ?? 0}ms
              </span>
            </div>

            {/* Timestamp */}
            <span className="text-muted-foreground shrink-0 text-[10px]">
              {formatRelativeTime(new Date(attempt.createdAt))}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
