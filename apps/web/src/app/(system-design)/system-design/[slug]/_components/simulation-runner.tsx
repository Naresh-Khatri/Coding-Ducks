"use client";

import type { Node } from "@xyflow/react";
import { useEffect, useRef } from "react";

import type { BlockNodeData, SimulationTick } from "~/lib/system-design/types";
import { SimulationEngine } from "~/lib/system-design/simulation-engine";
import { useSystemDesignStore } from "~/lib/system-design/store";
import { computeTopologyWarnings } from "~/lib/system-design/topology-warnings";

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
      nodes,
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
    const totalCost = nodes.reduce((sum, n) => {
      const d = n.data;
      return sum + d.definition.costPerMonth * (d.replicas ?? 1);
    }, 0);
    const topologyWarnings = computeTopologyWarnings(
      nodes,
      edges,
    );

    // A required block can be reachable yet carry no traffic — bypassed by a
    // parallel path (e.g. app-server → stream-processor skipping the queue).
    // A required block that stays idle the whole run means the topology
    // doesn't actually satisfy the brief — fail the level (severity "error").
    const requiredTypes = new Set(level.requiredBlockTypes ?? []);
    if (requiredTypes.size > 0) {
      const peakRps = new Map<string, number>();
      for (const t of allTicks) {
        for (const [nodeId, st] of Object.entries(t.blockStats)) {
          peakRps.set(nodeId, Math.max(peakRps.get(nodeId) ?? 0, st.rps));
        }
      }
      for (const n of nodes) {
        const data = n.data;
        if (!requiredTypes.has(data.definition.type)) continue;
        if ((peakRps.get(n.id) ?? 0) >= 1) continue;
        topologyWarnings.push({
          id: `idle-required:${n.id}`,
          severity: "error",
          message: `${data.definition.label} is required but carries no traffic — route the data path through it`,
        });
      }
    }

    const results = engine.getResults(totalCost, level, topologyWarnings);
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
