import type { Edge, Node } from "@xyflow/react";
import type {
  BlockNodeData,
  LevelDefinition,
  SimulationResults,
} from "./types";
import { SimulationEngine } from "./simulation-engine";
import { computeTopologyWarnings } from "./topology-warnings";

export interface WhatIfSuggestion {
  label: string;
  rationale: string;
  delta: {
    uptimePercent: number;
    avgLatencyMs: number;
    totalCostPerMonth: number;
    stars: number;
    nowPasses: boolean;
  };
  newResults: SimulationResults;
}

function totalCost(nodes: Node<BlockNodeData>[]): number {
  let cost = 0;
  for (const n of nodes) {
    const data = n.data;
    if (data.isStartBlock) continue;
    cost += data.definition.costPerMonth * (data.replicas ?? 1);
  }
  return cost;
}

function runSim(
  nodes: Node<BlockNodeData>[],
  edges: Edge[],
  level: LevelDefinition,
): SimulationResults {
  const engine = new SimulationEngine(nodes, edges, level);
  while (!engine.isComplete()) engine.tick();
  const warnings = computeTopologyWarnings(nodes, edges);
  return engine.getResults(totalCost(nodes), level, warnings);
}

function cloneNodesWithReplicas(
  nodes: Node<BlockNodeData>[],
  targetId: string,
  newReplicas: number,
): Node<BlockNodeData>[] {
  return nodes.map((n) => {
    if (n.id !== targetId) return n;
    return {
      ...n,
      data: { ...n.data, replicas: Math.max(1, newReplicas) },
    };
  });
}

// Only "counter"-mode blocks support a replica-count what-if. Manual-scaled
// compute and managed blocks would need a graph mutation (drop another node /
// add HA-pair), which the coach doesn't generate yet.

function countHardTopologyIssues(r: SimulationResults): number {
  return r.topologyWarnings.filter((w) => w.severity === "warn").length;
}

/**
 * Score a result: failed runs are sorted by how close to passing they are,
 * passed runs by stars then (lower) cost. Suggestions that introduce new
 * hard topology issues (SPOFs, unreachable blocks) are rejected outright —
 * cost savings don't justify breaking topology.
 */
function scoreImprovement(
  base: SimulationResults,
  next: SimulationResults,
): number {
  const baseIssues = countHardTopologyIssues(base);
  const nextIssues = countHardTopologyIssues(next);
  if (nextIssues > baseIssues) return -1;
  // Resolving a topology issue is a strong improvement, even if cost rises.
  if (nextIssues < baseIssues && next.passed) {
    return 700 + (baseIssues - nextIssues) * 50 + next.stars * 10;
  }

  if (!base.passed && next.passed) return 1000 + next.stars * 10;
  if (next.passed && base.passed) {
    if (next.stars > base.stars) return 500 + next.stars * 10;
    if (next.stars === base.stars) {
      const costSaved = base.totalCostPerMonth - next.totalCostPerMonth;
      if (costSaved > 0) return 100 + costSaved;
      return -1;
    }
    return -1;
  }
  // Both failing: prefer the one with better uptime / latency mix.
  const uptimeGain = next.uptimePercent - base.uptimePercent;
  const latencyGain = base.avgLatencyMs - next.avgLatencyMs;
  return uptimeGain * 2 + latencyGain / 50;
}

export function generateSuggestions(
  nodes: Node<BlockNodeData>[],
  edges: Edge[],
  level: LevelDefinition,
  current: SimulationResults,
  maxSuggestions = 2,
): WhatIfSuggestion[] {
  // Peak load per node across the run.
  const peakLoad = new Map<string, number>();
  for (const tick of current.timeline) {
    for (const [id, stats] of Object.entries(tick.blockStats)) {
      peakLoad.set(id, Math.max(peakLoad.get(id) ?? 0, stats.loadPercent));
    }
  }

  const candidates: { nodeId: string; load: number }[] = [];
  for (const n of nodes) {
    const data = n.data;
    if (data.isStartBlock) continue;
    if ((data.definition.scaling ?? "counter") !== "counter") continue;
    candidates.push({
      nodeId: n.id,
      load: peakLoad.get(n.id) ?? 0,
    });
  }
  candidates.sort((a, b) => b.load - a.load);

  const evaluated: WhatIfSuggestion[] = [];
  const triedCount = Math.min(candidates.length, 5);

  for (let i = 0; i < triedCount; i++) {
    const cand = candidates[i]!;
    const node = nodes.find((n) => n.id === cand.nodeId);
    if (!node) continue;
    const data = node.data;
    const currentReplicas = data.replicas ?? 1;
    const mutated = cloneNodesWithReplicas(
      nodes,
      cand.nodeId,
      currentReplicas + 1,
    );
    let newResults: SimulationResults;
    try {
      newResults = runSim(mutated, edges, level);
    } catch {
      continue;
    }
    const label = `Add 1 replica to ${data.definition.label}`;
    const rationale =
      cand.load >= 80
        ? `Peaked at ${Math.round(cand.load)}% load — adding capacity should reduce timeouts.`
        : `Currently the highest-loaded scalable block (${Math.round(cand.load)}%).`;
    evaluated.push({
      label,
      rationale,
      delta: {
        uptimePercent: newResults.uptimePercent - current.uptimePercent,
        avgLatencyMs: newResults.avgLatencyMs - current.avgLatencyMs,
        totalCostPerMonth:
          newResults.totalCostPerMonth - current.totalCostPerMonth,
        stars: newResults.stars,
        nowPasses: newResults.passed,
      },
      newResults,
    });
  }

  // If we passed and there are over-replicated blocks, try scaling DOWN to save cost.
  if (current.passed) {
    for (const n of nodes) {
      const data = n.data;
      if (data.isStartBlock) continue;
      if ((data.definition.scaling ?? "counter") !== "counter") continue;
      const replicas = data.replicas ?? 1;
      if (replicas <= 1) continue;
      const peak = peakLoad.get(n.id) ?? 0;
      if (peak > 50) continue; // headroom matters when traffic spikes
      const mutated = cloneNodesWithReplicas(nodes, n.id, replicas - 1);
      let newResults: SimulationResults;
      try {
        newResults = runSim(mutated, edges, level);
      } catch {
        continue;
      }
      if (!newResults.passed) continue;
      evaluated.push({
        label: `Drop 1 replica from ${data.definition.label}`,
        rationale: `Only peaked at ${Math.round(peak)}% — has headroom to shrink.`,
        delta: {
          uptimePercent: newResults.uptimePercent - current.uptimePercent,
          avgLatencyMs: newResults.avgLatencyMs - current.avgLatencyMs,
          totalCostPerMonth:
            newResults.totalCostPerMonth - current.totalCostPerMonth,
          stars: newResults.stars,
          nowPasses: newResults.passed,
        },
        newResults,
      });
    }
  }

  evaluated.sort(
    (a, b) =>
      scoreImprovement(current, b.newResults) -
      scoreImprovement(current, a.newResults),
  );

  const useful = evaluated.filter(
    (s) => scoreImprovement(current, s.newResults) > 0,
  );
  return useful.slice(0, maxSuggestions);
}
