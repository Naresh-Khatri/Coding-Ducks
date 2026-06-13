"use client";

import { Check, Loader2 } from "lucide-react";

import type { RuntimeStatus } from "~/lib/webcontainer/use-runtime";
import { cn } from "~/lib/utils";

interface BootStep {
  status: RuntimeStatus;
  label: string;
  detail: string;
}

// The phases a cold start passes through, in order. `idle` precedes them and
// `error` is terminal — both handled by the caller / mapping below.
const STEPS: BootStep[] = [
  {
    status: "booting",
    label: "Boot the sandbox",
    detail: "Starting an in-browser Node runtime",
  },
  {
    status: "mounting",
    label: "Mount project files",
    detail: "Loading the code into the sandbox",
  },
  {
    status: "installing",
    label: "Install dependencies",
    detail: "Running npm install — the slow part of a cold start",
  },
  {
    status: "starting",
    label: "Start the server",
    detail: "Launching the server that runs your code",
  },
];

const ORDER: RuntimeStatus[] = [
  "booting",
  "mounting",
  "installing",
  "starting",
  "ready",
];

/**
 * Vertical stepper that narrates the WebContainer cold start (boot → mount →
 * install → start), so the long first-boot wait isn't just an opaque spinner.
 * Shared by the ducklet preview panel and the machine-coding tests panel.
 */
export function BootStepper({
  status,
  className,
}: {
  status: RuntimeStatus;
  className?: string;
}) {
  // `idle` is a transient pre-boot tick; show it as the first step in flight.
  const current = ORDER.indexOf(status === "idle" ? "booting" : status);

  return (
    <div className={cn("flex w-56 flex-col gap-3", className)}>
      {STEPS.map((step) => {
        const index = ORDER.indexOf(step.status);
        const done = index < current;
        const active = index === current;
        return (
          <div key={step.status} className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                done && "border-green-500 bg-green-500 text-white",
                active && "border-primary text-primary",
                !done && !active && "border-muted-foreground/30",
              )}
            >
              {done ? (
                <Check className="size-2.5" />
              ) : active ? (
                <Loader2 className="size-2.5 animate-spin" />
              ) : null}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-xs leading-tight font-medium",
                  done && "text-muted-foreground",
                  active && "text-foreground",
                  !done && !active && "text-muted-foreground/50",
                )}
              >
                {step.label}
              </p>
              {active && (
                <p className="text-muted-foreground/70 mt-0.5 text-[11px] leading-snug">
                  {step.detail}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
