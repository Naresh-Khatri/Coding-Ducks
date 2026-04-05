"use client";

import { useSystemDesignStore } from "~/lib/system-design/store";
import type { BlockNodeData } from "~/lib/system-design/types";
import { cn } from "~/lib/utils";

export function StatsPanel() {
  const level = useSystemDesignStore((s) => s.level);
  const nodes = useSystemDesignStore((s) => s.nodes);
  const simulationTimeline = useSystemDesignStore((s) => s.simulationTimeline);
  const simulationTick = useSystemDesignStore((s) => s.simulationTick);

  if (!level) return null;

  const budgetUsed = nodes.reduce(
    (sum, n) => sum + (n.data as BlockNodeData).definition.costPerMonth,
    0,
  );

  // Only compute stats up to the current tick position
  const ticksUpToCurrent = simulationTimeline.slice(0, simulationTick + 1);

  let totalReqs = 0;
  let failedReqs = 0;
  let latencySum = 0;
  let latencyCount = 0;

  for (const tick of ticksUpToCurrent) {
    totalReqs += tick.totalRps;
    failedReqs += tick.failedRps;
    if (tick.successfulRps > 0) {
      latencySum += tick.avgLatencyMs * tick.successfulRps;
      latencyCount += tick.successfulRps;
    }
  }

  const uptimePercent =
    totalReqs > 0 ? ((totalReqs - failedReqs) / totalReqs) * 100 : 100;
  const avgLatency = latencyCount > 0 ? latencySum / latencyCount : 0;

  // Current tick is the one at the playback position
  const currentTick =
    simulationTick < simulationTimeline.length
      ? simulationTimeline[simulationTick]
      : simulationTimeline[simulationTimeline.length - 1];

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-3">
      <div className="text-muted-foreground flex items-center justify-between text-xs font-medium uppercase tracking-wider">
        <span>Stats</span>
        <span className="text-[10px] font-mono tabular-nums normal-case">
          t={simulationTick}s
        </span>
      </div>

      {/* Uptime */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-muted-foreground mb-1 text-xs">Uptime</div>
        <div
          className={cn(
            "text-2xl font-bold tabular-nums",
            uptimePercent >= level.passCondition.minUptimePercent
              ? "text-green-500"
              : "text-red-500",
          )}
        >
          {uptimePercent.toFixed(1)}%
        </div>
        <div className="text-muted-foreground text-[10px]">
          Target: {level.passCondition.minUptimePercent}%
        </div>
      </div>

      {/* Avg Latency */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-muted-foreground mb-1 text-xs">Avg Latency</div>
        <div
          className={cn(
            "text-xl font-bold tabular-nums",
            avgLatency <= level.passCondition.maxAvgLatencyMs
              ? "text-green-500"
              : "text-red-500",
          )}
        >
          {avgLatency.toFixed(0)}ms
        </div>
        <div className="text-muted-foreground text-[10px]">
          Target: &le;{level.passCondition.maxAvgLatencyMs}ms
        </div>
      </div>

      {/* Current RPS */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-muted-foreground mb-1 text-xs">Current RPS</div>
        <div className="text-xl font-bold tabular-nums">
          {currentTick ? currentTick.successfulRps : 0}
          <span className="text-muted-foreground ml-1 text-sm font-normal">
            / {currentTick ? currentTick.totalRps : 0}
          </span>
        </div>
      </div>

      {/* Cost */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-muted-foreground mb-1 text-xs">Monthly Cost</div>
        <div className="text-lg font-bold tabular-nums">${budgetUsed}</div>
        <div className="text-muted-foreground text-[10px]">
          Budget: ${level.budget}
        </div>
      </div>

      {/* Per-block stats */}
      {currentTick && (
        <div>
          <div className="text-muted-foreground mb-1.5 text-xs font-medium">
            Block Status
          </div>
          <div className="space-y-1">
            {nodes.map((n) => {
              const data = n.data as BlockNodeData;
              const stats = currentTick.blockStats[n.id];
              if (!stats) return null;
              return (
                <div
                  key={n.id}
                  className="bg-card flex items-center gap-2 rounded-md border p-1.5"
                >
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      stats.status === "failing"
                        ? "bg-red-600 animate-pulse"
                        : stats.status === "overloaded"
                          ? "bg-red-500"
                          : stats.status === "degraded"
                            ? "bg-amber-500"
                            : stats.status === "healthy"
                              ? "bg-green-500"
                              : "bg-muted-foreground",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-[10px] font-medium">
                    {data.definition.label}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] tabular-nums",
                      stats.failedRps > 0
                        ? "text-red-500"
                        : "text-muted-foreground",
                    )}
                  >
                    {stats.failedRps > 0
                      ? `${stats.failedRps} failing`
                      : `${stats.rps} RPS`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
