"use client";

import {
  Target,
  ArrowRight,
  MousePointerClick,
  Cable,
  Zap,
  Check,
} from "lucide-react";
import { useSystemDesignStore } from "~/lib/system-design/store";
import type { BlockNodeData } from "~/lib/system-design/types";
import { cn } from "~/lib/utils";

export function LevelBriefing() {
  const level = useSystemDesignStore((s) => s.level);
  const nodes = useSystemDesignStore((s) => s.nodes);
  const edges = useSystemDesignStore((s) => s.edges);
  const phase = useSystemDesignStore((s) => s.phase);

  if (!level || phase !== "building") return null;

  const userNodes = nodes.filter(
    (n) => !(n.data as BlockNodeData).isStartBlock,
  );
  const hasNodes = userNodes.length > 0;
  const hasConnections = edges.length > 0;
  const requiredTypes = level.requiredBlockTypes ?? [];
  const placedTypes = new Set(
    nodes.map((n) => (n.data as BlockNodeData).definition.type),
  );
  const allRequiredPlaced = requiredTypes.every((t) => placedTypes.has(t));

  const step = !hasNodes ? 1 : !hasConnections ? 2 : !allRequiredPlaced ? 2 : 3;

  const steps = [
    {
      num: 1,
      label: "Drag blocks onto canvas",
      icon: MousePointerClick,
      done: hasNodes,
    },
    {
      num: 2,
      label: "Connect ports & place required blocks",
      icon: Cable,
      done: hasConnections && allRequiredPlaced,
    },
    {
      num: 3,
      label: "Start simulation to test",
      icon: Zap,
      done: false,
    },
  ];

  return (
    <div className="border-b p-3">
      {/* Objective */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Target size={13} className="text-primary shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Objective
          </span>
        </div>
        <p className="text-muted-foreground text-[12px] leading-relaxed">
          {level.description}
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
          Steps
        </div>
        {steps.map((s) => {
          const isCurrent = s.num === step;
          return (
            <div
              key={s.num}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                isCurrent && "bg-primary/5 border-primary/20 border",
                s.done && "opacity-60",
              )}
            >
              {s.done ? (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                  <Check size={10} className="text-green-500" />
                </div>
              ) : (
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {s.num}
                </div>
              )}
              <span
                className={cn(
                  "flex-1",
                  isCurrent
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                  s.done && "line-through",
                )}
              >
                {s.label}
              </span>
              {isCurrent && !s.done && (
                <ArrowRight size={12} className="text-primary" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
