"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle,
  Lightbulb,
  Loader2,
  LogIn,
  RotateCcw,
  Star,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { BlockNodeData } from "~/lib/system-design/types";
import type { WhatIfSuggestion } from "~/lib/system-design/what-if-coach";
import { authClient } from "~/auth/client";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useSystemDesignStore } from "~/lib/system-design/store";
import { generateSuggestions } from "~/lib/system-design/what-if-coach";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";
import { SubmissionHistory } from "./submission-history";

export function ResultsModal() {
  const results = useSystemDesignStore((s) => s.simulationResults);
  const level = useSystemDesignStore((s) => s.level);
  const nodes = useSystemDesignStore((s) => s.nodes);
  const edges = useSystemDesignStore((s) => s.edges);
  const setPhase = useSystemDesignStore((s) => s.setPhase);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const hasSaved = useRef(false);
  const starsRef = useRef<HTMLDivElement | null>(null);
  const hasCelebrated = useRef(false);
  const [suggestions, setSuggestions] = useState<WhatIfSuggestion[] | null>(
    null,
  );

  // Subtle 3-star celebration. Anchored to the stars row so the burst feels
  // tied to the icons rather than dropping from the top of the screen.
  useEffect(() => {
    if (!results || results.stars !== 3 || hasCelebrated.current) return;
    hasCelebrated.current = true;
    const el = starsRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
    const colors = ["#fbbf24", "#f59e0b", "#a78bfa", "#f472b6"];
    confetti({
      particleCount: 40,
      spread: 60,
      startVelocity: 28,
      ticks: 120,
      scalar: 0.75,
      gravity: 0.9,
      origin,
      colors,
      disableForReducedMotion: true,
    });
  }, [results]);

  // Defer what-if simulations so they don't block first paint of the modal.
  useEffect(() => {
    if (!results || !level) {
      setSuggestions(null);
      return;
    }
    setSuggestions(null);
    const handle = setTimeout(() => {
      try {
        setSuggestions(
          generateSuggestions(
            nodes as unknown as Parameters<typeof generateSuggestions>[0],
            edges,
            level,
            results,
          ),
        );
      } catch {
        setSuggestions([]);
      }
    }, 50);
    return () => clearTimeout(handle);
  }, [results, level, nodes, edges]);

  const saveAttempt = useMutation(
    trpc.systemDesign.saveAttempt.mutationOptions({
      onSuccess: () => {
        hasSaved.current = true;
        if (level) {
          queryClient.invalidateQueries({
            queryKey: [["systemDesign", "myAttempts"]],
          });
          queryClient.invalidateQueries({
            queryKey: [["systemDesign", "myProgress"]],
          });
        }
      },
    }),
  );

  const doSave = useCallback(() => {
    if (!session?.user || !results || !level) return;
    saveAttempt.mutate({
      levelSlug: level.slug,
      graph: {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            definitionType: (n.data).definition.type,
            provider: (n.data).definition.name,
            replicas: (n.data).replicas ?? 1,
          },
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? null,
          targetHandle: e.targetHandle ?? null,
        })),
      },
      uptimePercent: results.uptimePercent,
      avgLatencyMs: results.avgLatencyMs,
      totalCost: results.totalCostPerMonth,
      stars: results.stars,
      passed: results.passed,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user, results, level, nodes, edges]);

  // Auto-save once when authenticated. Only auto-fires on first visit — after
  // any error/success the user drives retries via the Retry button, so we
  // don't loop on persistent failures.
  useEffect(() => {
    if (!session?.user || !results || !level || hasSaved.current) return;
    if (saveAttempt.isPending || saveAttempt.isError || saveAttempt.isSuccess)
      return;
    doSave();
  }, [
    session?.user,
    results,
    level,
    doSave,
    saveAttempt.isPending,
    saveAttempt.isError,
    saveAttempt.isSuccess,
  ]);

  if (!results || !level) return null;

  const handleDismiss = () => {
    setPhase("building");
    const store = useSystemDesignStore.getState();
    useSystemDesignStore.setState({
      phase: "building",
      simulationTick: 0,
      simulationPaused: false,
      simulationResults: null,
      simulationTimeline: [],
      nodes: store.nodes.map((n) => ({
        ...n,
        data: {
          ...(n.data),
          currentRps: 0,
          currentLatencyMs: 0,
          loadPercent: 0,
          failedRequests: 0,
          queueDepth: 0,
          status: "idle" as const,
        },
      })),
    });
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const budgetUsedPercent =
    level.budget > 0 ? (results.totalCostPerMonth / level.budget) * 100 : 0;

  const timelineData = results.timeline.map((t) => ({
    time: t.time,
    successful: t.successfulRps,
    failed: t.failedRps,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleDismiss}
    >
      <div
        className="bg-card mx-4 w-full max-w-xl rounded-xl border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pass/Fail Banner */}
        <div className="mb-4 text-center">
          {results.passed ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="text-green-500" size={40} />
              <h2 className="text-xl font-bold text-green-500">
                Level Passed!
              </h2>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <XCircle className="text-red-500" size={40} />
              <h2 className="text-xl font-bold text-red-500">Level Failed</h2>
            </div>
          )}

          {/* Stars */}
          <div ref={starsRef} className="mt-2 flex justify-center gap-1">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                size={28}
                className={cn(
                  "transition-colors",
                  star <= results.stars
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
          {results.starsCappedByTopology && (
            <div className="mt-1 text-[11px] text-amber-500/80">
              Stars capped at 2 — fix topology issues for 3-star
            </div>
          )}
        </div>

        {/* Topology errors — invalid design, fails the level */}
        {results.topologyWarnings.filter((w) => w.severity === "error").length >
          0 && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
              <XCircle size={12} />
              Invalid topology
            </div>
            <ul className="space-y-1">
              {results.topologyWarnings
                .filter((w) => w.severity === "error")
                .map((w) => (
                  <li
                    key={w.id}
                    className="text-muted-foreground flex items-start gap-1.5 text-[11px] leading-tight"
                  >
                    <span className="mt-0.5 text-red-500/60">•</span>
                    {w.message}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Topology warnings */}
        {results.topologyWarnings.filter((w) => w.severity === "warn").length >
          0 && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-500">
              <AlertTriangle size={12} />
              Topology issues
            </div>
            <ul className="space-y-1">
              {results.topologyWarnings
                .filter((w) => w.severity === "warn")
                .map((w) => (
                  <li
                    key={w.id}
                    className="text-muted-foreground flex items-start gap-1.5 text-[11px] leading-tight"
                  >
                    <span className="mt-0.5 text-amber-500/60">•</span>
                    {w.message}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Tabbed content */}
        <Tabs defaultValue="results" className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="results" className="flex-1">
              This Attempt
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              Past Attempts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="mt-3 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-muted-foreground text-xs">Uptime</div>
                <div
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    results.uptimePercent < level.passCondition.minUptimePercent
                      ? "text-red-500"
                      : results.uptimePercent >= 99.5
                        ? "text-green-500"
                        : results.uptimePercent >= 97
                          ? "text-amber-500"
                          : "text-foreground",
                  )}
                >
                  {results.uptimePercent.toFixed(1)}%
                </div>
                <div className="text-muted-foreground text-[10px]">
                  Target: {level.passCondition.minUptimePercent}%
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-muted-foreground text-xs">Avg Latency</div>
                <div
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    results.avgLatencyMs > level.passCondition.maxAvgLatencyMs
                      ? "text-red-500"
                      : results.avgLatencyMs <=
                          level.starConditions.twoStar.maxAvgLatencyMs
                        ? "text-green-500"
                        : "text-amber-500",
                  )}
                >
                  {results.avgLatencyMs.toFixed(0)}ms
                </div>
                <div className="text-muted-foreground text-[10px]">
                  Target: &le;{level.passCondition.maxAvgLatencyMs}ms
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-muted-foreground text-xs">p99 Latency</div>
                <div
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    results.p99LatencyMs <=
                      level.starConditions.twoStar.maxAvgLatencyMs * 2
                      ? "text-green-500"
                      : results.p99LatencyMs <=
                          level.passCondition.maxAvgLatencyMs * 2
                        ? "text-amber-500"
                        : "text-red-500",
                  )}
                >
                  {results.p99LatencyMs.toFixed(0)}ms
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-muted-foreground text-xs">Budget Used</div>
                <div
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    budgetUsedPercent > 100
                      ? "text-red-500"
                      : budgetUsedPercent <=
                          level.starConditions.threeStar.maxCostPercent
                        ? "text-green-500"
                        : "text-amber-500",
                  )}
                >
                  {budgetUsedPercent.toFixed(0)}%
                </div>
                <div className="text-muted-foreground text-[10px]">
                  Budget: ${level.budget}
                </div>
              </div>
              <div className="bg-muted/50 col-span-2 rounded-lg p-3 text-center">
                <div className="text-muted-foreground text-xs">Requests</div>
                <div className="text-lg font-bold tabular-nums">
                  <span className="text-green-500">
                    {results.successfulRequests.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-sm font-normal">
                    {" / "}
                  </span>
                  {results.failedRequests > 0 && (
                    <span className="text-sm text-red-500">
                      {results.failedRequests.toLocaleString()} failed
                    </span>
                  )}
                  {results.failedRequests === 0 && (
                    <span className="text-sm text-green-500/60">0 failed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline chart */}
            <div className="bg-muted/50 h-24 rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" hide />
                  <YAxis hide />
                  <Area
                    type="monotone"
                    dataKey="successful"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.3}
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* What-if coach */}
            {suggestions === null ? (
              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <Loader2 size={12} className="animate-spin" />
                Looking for improvements…
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                  <Lightbulb size={12} className="text-amber-400" />
                  Try this next
                </div>
                {suggestions.map((s, idx) => (
                  <SuggestionCard key={idx} suggestion={s} />
                ))}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <SubmissionHistory levelSlug={level.slug} variant="modal" />
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex w-full items-center justify-between gap-2">
          <Link
            href="/system-design"
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            <span className="flex items-center gap-1">
              <ArrowLeft size={12} />
              Back to Levels
            </span>
          </Link>
          <Button onClick={handleDismiss} className="gap-1.5">
            <RotateCcw size={14} />
            Try Again
          </Button>
        </div>

        {/* Save status / Login nudge */}
        <div className="mt-3 border-t pt-3">
          {session?.user ? (
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              {saveAttempt.isPending && (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Saving...
                </>
              )}
              {saveAttempt.isSuccess && (
                <>
                  <Check size={12} className="text-green-500" />
                  Saved
                </>
              )}
              {saveAttempt.isError && (
                <>
                  <XCircle size={12} className="text-red-500" />
                  Failed to save
                  <button
                    onClick={() => {
                      saveAttempt.reset();
                      doSave();
                    }}
                    className="text-foreground ml-1 underline"
                  >
                    Retry
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogIn size={12} className="text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                Sign in to save your progress
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-7 text-xs"
                onClick={() =>
                  authClient.signIn.social({
                    provider: "google",
                    callbackURL: window.location.pathname,
                  })
                }
              >
                Sign in
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: WhatIfSuggestion }) {
  const { label, rationale, delta } = suggestion;
  const uptimeUp = delta.uptimePercent > 0.1;
  const latencyDown = delta.avgLatencyMs < -1;
  const costUp = delta.totalCostPerMonth > 0;
  return (
    <div className="bg-muted/40 space-y-1.5 rounded-md border p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold">{label}</div>
        {delta.nowPasses && (
          <span className="rounded-sm bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-500">
            passes
          </span>
        )}
      </div>
      <div className="text-muted-foreground text-[10px]">{rationale}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] tabular-nums">
        <span
          className={cn(
            "flex items-center gap-1",
            uptimeUp ? "text-green-500" : "text-muted-foreground",
          )}
        >
          Uptime {delta.uptimePercent >= 0 ? "+" : ""}
          {delta.uptimePercent.toFixed(1)}%
        </span>
        <span
          className={cn(
            "flex items-center gap-1",
            latencyDown ? "text-green-500" : "text-muted-foreground",
          )}
        >
          Latency {delta.avgLatencyMs >= 0 ? "+" : ""}
          {delta.avgLatencyMs.toFixed(0)}ms
        </span>
        <span
          className={cn(
            "flex items-center gap-1",
            costUp ? "text-amber-500" : "text-green-500",
          )}
        >
          Cost {delta.totalCostPerMonth >= 0 ? "+" : ""}$
          {delta.totalCostPerMonth.toFixed(0)}/mo
        </span>
      </div>
    </div>
  );
}
