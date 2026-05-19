"use client";

import { useMemo } from "react";
import { Zap } from "lucide-react";

import type { BlockNodeData } from "~/lib/system-design/types";
import { Button } from "~/components/ui/button";
import {
  getReachableTypes,
  hasCycle,
} from "~/lib/system-design/connection-validator";
import { useSystemDesignStore } from "~/lib/system-design/store";
import { cn } from "~/lib/utils";

export function StartSimulationButton() {
  const phase = useSystemDesignStore((s) => s.phase);
  const setPhase = useSystemDesignStore((s) => s.setPhase);
  const nodes = useSystemDesignStore((s) => s.nodes);
  const edges = useSystemDesignStore((s) => s.edges);
  const level = useSystemDesignStore((s) => s.level);

  const reachableTypes = useMemo(
    () =>
      getReachableTypes(
        nodes as Parameters<typeof getReachableTypes>[0],
        edges,
      ),
    [nodes, edges],
  );

  const requiredTypes = level?.requiredBlockTypes ?? [];
  const allRequiredPlaced = requiredTypes.every((t) => reachableTypes.has(t));
  const userNodes = nodes.filter(
    (n) => !(n.data as BlockNodeData).isStartBlock,
  );
  const hasUserNodes = userNodes.length > 0;
  const hasCycleInGraph = nodes.length > 0 && hasCycle(nodes, edges);

  const canStart = hasUserNodes && allRequiredPlaced && !hasCycleInGraph;
  const visible = phase === "building" && !!level;

  const hint = !hasUserNodes
    ? "Add blocks to the canvas first"
    : !allRequiredPlaced
      ? "Connect all required blocks"
      : hasCycleInGraph
        ? "Remove cycles in your graph"
        : undefined;

  return (
    <div
      data-tour="sd-start"
      className={cn(
        "absolute bottom-5 left-1/2 z-10 -translate-x-1/2 transition-all duration-200 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <Button
        size="lg"
        onClick={() => canStart && setPhase("production")}
        disabled={!canStart}
        className="gap-2 rounded-full px-6 shadow-lg"
        title={hint}
      >
        <Zap size={18} />
        Start Simulation
      </Button>
      <p
        className={cn(
          "text-muted-foreground overflow-hidden text-center text-[11px] transition-all duration-150",
          hint ? "mt-1.5 max-h-5 opacity-100" : "mt-0 max-h-0 opacity-0",
        )}
      >
        {hint}
      </p>
    </div>
  );
}
