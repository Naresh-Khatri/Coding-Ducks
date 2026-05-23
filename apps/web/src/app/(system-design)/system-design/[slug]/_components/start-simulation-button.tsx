"use client";

import { useMemo } from "react";
import { Check, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

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
  const hasConnections = edges.length > 0;
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

  // Compact onboarding stepper sitting above the Start button — guides
  // beginners through the build and fills in checks as each step completes.
  const step2Done = hasConnections && allRequiredPlaced && !hasCycleInGraph;
  const steps = [
    { num: 1, label: "Add blocks", done: hasUserNodes },
    { num: 2, label: "Connect & place required", done: step2Done },
  ];
  const currentStep = !hasUserNodes ? 1 : 2;

  return (
    <div
      data-tour="sd-start"
      className={cn(
        "absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 transition-all duration-200 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <AnimatePresence>
        {!canStart && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card/90 flex items-center gap-1 rounded-full border px-2 py-1 shadow-sm backdrop-blur-sm"
          >
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-1">
                {i > 0 && <div className="bg-border h-px w-3" />}
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[11px] transition-colors",
                    s.num === currentStep && !s.done && "bg-primary/10",
                  )}
                >
                  {s.done ? (
                    <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                      <Check size={9} className="text-green-500" />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                        s.num === currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {s.num}
                    </div>
                  )}
                  <span
                    className={cn(
                      s.done
                        ? "text-muted-foreground line-through"
                        : s.num === currentStep
                          ? "text-foreground font-medium"
                          : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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
    </div>
  );
}
