"use client";

import { Panel } from "@xyflow/react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import { AlertTriangle, Check, Circle, Info } from "lucide-react";
import { getReachableTypes } from "~/lib/system-design/connection-validator";
import { computeMissingLayerPenalties } from "~/lib/system-design/simulation-engine";
import { useSystemDesignStore } from "~/lib/system-design/store";
import { computeTopologyWarnings } from "~/lib/system-design/topology-warnings";
import type { BlockNodeData } from "~/lib/system-design/types";
import { cn } from "~/lib/utils";

export function CanvasInfoOverlay() {
  const level = useSystemDesignStore((s) => s.level);
  const nodes = useSystemDesignStore((s) => s.nodes);
  const edges = useSystemDesignStore((s) => s.edges);

  if (!level) return null;

  const budgetUsed = nodes.reduce((sum, n) => {
    const d = n.data as BlockNodeData;
    return sum + d.definition.costPerMonth * (d.replicas ?? 1);
  }, 0);
  const budgetPercent = (budgetUsed / level.budget) * 100;

  const reachableTypes = useMemo(
    () => getReachableTypes(nodes as Parameters<typeof getReachableTypes>[0], edges),
    [nodes, edges],
  );
  const topologyWarnings = useMemo(
    () =>
      computeTopologyWarnings(
        nodes as Parameters<typeof computeTopologyWarnings>[0],
        edges,
      ),
    [nodes, edges],
  );
  const requiredBlocks = level.requiredBlockTypes ?? [];

  return (
    <Panel position="top-right" className="!m-3">
      <div className="bg-card/90 w-56 rounded-xl border p-3 shadow-lg backdrop-blur-sm">
        {/* Budget */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Budget</span>
            <span
              className={cn(
                "font-mono text-[11px] font-semibold",
                budgetPercent > 90
                  ? "text-red-500"
                  : budgetPercent > 70
                    ? "text-amber-500"
                    : "text-foreground",
              )}
            >
              ${budgetUsed}
              <span className="text-muted-foreground font-normal">
                {" "}
                / ${level.budget}
              </span>
            </span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                budgetPercent > 90
                  ? "bg-red-500"
                  : budgetPercent > 70
                    ? "bg-amber-500"
                    : "bg-primary",
              )}
              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Traffic Pattern */}
        <div className="mb-3">
          <div className="text-muted-foreground mb-1 text-[11px] font-medium">
            Traffic Pattern
          </div>
          <div className="bg-muted/40 h-14 overflow-hidden rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={level.trafficPattern}>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Area
                  type="monotone"
                  dataKey="rps"
                  stroke="#3b82f6"
                  fill="#3b82f640"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-muted-foreground mt-0.5 flex justify-between text-[9px]">
            <span>0s</span>
            <span>
              Peak: {Math.max(...level.trafficPattern.map((p) => p.rps)).toLocaleString()} RPS
            </span>
            <span>{level.durationSeconds}s</span>
          </div>
        </div>

        {/* Required Blocks */}
        {requiredBlocks.length > 0 && (
          <div>
            <div className="text-muted-foreground mb-1 text-[11px] font-medium">
              Required
            </div>
            <div className="space-y-0.5">
              {requiredBlocks.map((type) => {
                const placed = reachableTypes.has(type);
                return (
                  <div
                    key={type}
                    className="flex items-center gap-1.5 text-[11px]"
                  >
                    {placed ? (
                      <Check size={11} className="text-green-500" />
                    ) : (
                      <Circle
                        size={11}
                        className="text-muted-foreground/40"
                      />
                    )}
                    <span
                      className={cn(
                        "capitalize",
                        placed
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {type.replace(/-/g, " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missing layer warnings */}
        {(() => {
          const penalties = computeMissingLayerPenalties(
            reachableTypes,
            level.writeFraction ?? 0.1,
          );
          if (penalties.length === 0) return null;
          if (penalties.every((p) => p.resolved)) return null;
          return (
            <div className="mt-1">
              <div className="text-amber-500 mb-1 text-[11px] font-medium flex items-center gap-1">
                <AlertTriangle size={11} />
                Penalties
              </div>
              <div className="space-y-0.5">
                {penalties.map(({ type, warning, resolved }) => (
                  <div
                    key={type}
                    className={cn(
                      "overflow-hidden text-[10px] leading-tight",
                      resolved
                        ? "text-green-500/60 line-through max-h-0 opacity-0 transition-[max-height,opacity] duration-300 delay-700"
                        : "text-amber-500/80 max-h-6 opacity-100 transition-[color] duration-200",
                    )}
                  >
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Live topology warnings */}
        {topologyWarnings.length > 0 && (
          <div className="mt-2">
            <div className="text-muted-foreground mb-1 flex items-center gap-1 text-[11px] font-medium">
              <AlertTriangle size={11} className="text-amber-500" />
              Topology
            </div>
            <div className="space-y-0.5">
              {topologyWarnings.map((w) => (
                <div
                  key={w.id}
                  className={cn(
                    "flex items-start gap-1 text-[10px] leading-tight",
                    w.severity === "warn"
                      ? "text-amber-500/80"
                      : "text-muted-foreground",
                  )}
                >
                  {w.severity === "warn" ? (
                    <AlertTriangle size={9} className="mt-0.5 shrink-0" />
                  ) : (
                    <Info size={9} className="mt-0.5 shrink-0" />
                  )}
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
