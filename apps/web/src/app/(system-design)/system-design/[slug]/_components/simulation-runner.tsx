"use client";

import { useEffect, useRef } from "react";
import type { Node } from "@xyflow/react";
import { SimulationEngine } from "~/lib/system-design/simulation-engine";
import { useSystemDesignStore } from "~/lib/system-design/store";
import type { BlockNodeData, SimulationTick } from "~/lib/system-design/types";

export function useSimulation() {
  const phase = useSystemDesignStore((s) => s.phase);
  const level = useSystemDesignStore((s) => s.level);
  const rafRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const precomputedRef = useRef<SimulationTick[] | null>(null);

  // Pre-compute all ticks when entering production
  useEffect(() => {
    if (phase !== "production" || !level) return;

    const store = useSystemDesignStore.getState();
    const { nodes, edges } = store;

    if (nodes.length === 0) return;

    // Only pre-compute once
    if (precomputedRef.current) return;

    const engine = new SimulationEngine(
      nodes as Node<BlockNodeData>[],
      edges,
      level,
    );

    const allTicks: SimulationTick[] = [];
    while (!engine.isComplete()) {
      allTicks.push(engine.tick());
    }

    precomputedRef.current = allTicks;
    store.setFullTimeline(allTicks);

    // Compute results
    const totalCost = nodes.reduce(
      (sum, n) => sum + (n.data as BlockNodeData).definition.costPerMonth,
      0,
    );
    const results = engine.getResults(totalCost, level);
    store.setSimulationResults(results);
  }, [phase, level]);

  // Playback loop — steps through pre-computed ticks
  useEffect(() => {
    if (phase !== "production" || !level) return;

    lastFrameTime.current = 0;

    const loop = (timestamp: number) => {
      const store = useSystemDesignStore.getState();
      const ticks = precomputedRef.current;

      if (store.phase !== "production" || !ticks) return;

      if (store.simulationPaused) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const msPerTick = 1000 / store.simulationSpeed;

      if (lastFrameTime.current === 0) {
        lastFrameTime.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTime.current;

      if (elapsed >= msPerTick) {
        lastFrameTime.current = timestamp;

        const currentTick = store.simulationTick;

        if (currentTick >= ticks.length) {
          // Playback complete — show results
          store.setPhase("results");
          return;
        }

        // Apply tick's block stats to nodes
        store.seekToTick(currentTick);
        store.incrementTick();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [phase, level]);

  // Reset precomputed on phase change away from production
  useEffect(() => {
    if (phase === "building") {
      precomputedRef.current = null;
    }
  }, [phase]);
}
