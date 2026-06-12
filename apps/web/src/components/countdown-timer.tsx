"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export interface CountdownTimerProps {
  /** Starting value in minutes — the timer counts down from here. */
  defaultMinutes: number;
  /** Start in the expanded (pause | time | reset) view. Defaults to false. */
  defaultExpanded?: boolean;
  /** Begin counting down on mount. Defaults to true. */
  autoStart?: boolean;
  /** Fired once when the countdown crosses zero. */
  onComplete?: () => void;
  className?: string;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function remainingColor(remaining: number): string {
  if (remaining < 60_000) return "text-red-500";
  if (remaining < 5 * 60_000) return "text-amber-500";
  return "text-muted-foreground";
}

/**
 * A self-contained, reusable countdown widget. It owns its own running/paused
 * state (so it knows nothing about the surrounding feature) and renders as a
 * compact pill that expands into pause | time | reset controls.
 *
 * Note: state is in-memory only — it resets on reload rather than resuming from
 * a persisted start time.
 */
export function CountdownTimer({
  defaultMinutes,
  defaultExpanded = false,
  autoStart = true,
  onComplete,
  className,
}: CountdownTimerProps) {
  const totalMs = Math.max(0, Math.round(defaultMinutes * 60_000));
  const [remaining, setRemaining] = useState(totalMs);
  const [running, setRunning] = useState(autoStart);
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Deadline-based ticking so the countdown never drifts; the ref is re-armed
  // whenever we (re)start so pause/resume picks up where it left off.
  const deadlineRef = useRef(Date.now() + totalMs);
  const runningRef = useRef(running);
  const firedRef = useRef(false);

  useEffect(() => {
    runningRef.current = running;
    if (running) deadlineRef.current = Date.now() + remaining;
    // Re-arming off `remaining` here intentionally tracks only `running` —
    // ticks update `remaining` without resetting the deadline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!runningRef.current) return;
      const next = Math.max(0, deadlineRef.current - Date.now());
      setRemaining(next);
      if (next === 0) setRunning(false);
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !firedRef.current) {
      firedRef.current = true;
      onComplete?.();
    }
  }, [remaining, onComplete]);

  const toggle = () => setRunning((r) => !r);
  const reset = () => {
    firedRef.current = false;
    deadlineRef.current = Date.now() + totalMs;
    setRemaining(totalMs);
  };

  const label = formatRemaining(remaining);
  const color = remainingColor(remaining);

  if (!expanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(true)}
        title="Show timer controls"
        className={cn(
          "gap-1 font-mono tabular-nums",
          color,
          className,
        )}
      >
        <Clock className="size-3.5" />
        {label}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "bg-background flex items-center gap-0.5 rounded-md border px-0.5",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggle}
        title={running ? "Pause" : "Resume"}
      >
        {running ? (
          <Pause className="size-3.5" />
        ) : (
          <Play className="size-3.5" />
        )}
      </Button>

      <button
        type="button"
        onClick={() => setExpanded(false)}
        title="Minimize timer"
        className={cn(
          "min-w-12 px-1 text-center font-mono text-sm tabular-nums",
          color,
        )}
      >
        {label}
      </button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={reset}
        title="Reset timer"
      >
        <RotateCcw className="size-3.5" />
      </Button>
    </div>
  );
}
