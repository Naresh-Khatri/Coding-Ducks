/**
 * Calibration / test harness for the system-design simulation engine.
 *
 * Run with:
 *   node --import ./src/lib/system-design/__tests__/_loader.mjs \
 *        src/lib/system-design/__tests__/<your-test>.ts
 *
 * All relative imports use the .ts extension so Node's native type-stripping
 * can resolve them without a build step.
 */

import type { Edge, Node } from "@xyflow/react";

import type {
  BlockDefinition,
  BlockNodeData,
  LevelDefinition,
  PortProtocol,
  SimulationResults,
} from "../types.ts";
import { getBlockDefinition, TRAFFIC_SOURCE_BLOCK } from "../block-registry.ts";
import { SimulationEngine } from "../simulation-engine.ts";
import { computeTopologyWarnings } from "../topology-warnings.ts";

// ─── Public types ────────────────────────────────────────────────────────────

export interface DesignSpec {
  blocks: Record<
    string,
    { type: string; provider?: string; replicas?: number }
  >;
  // each edge: [fromKey, toKey, protocol?] — protocol defaults to "HTTP"
  edges: Array<[string, string] | [string, string, PortProtocol]>;
}

export interface ScoreSummary {
  stars: number; // median stars across runs
  minStars: number; // worst-case across runs
  maxStars: number; // best-case across runs
  passed: boolean; // majority vote
  costPerMonth: number; // deterministic (no jitter)
  costPercent: number; // costPerMonth / level.budget * 100
  avgLatencyMs: number; // median
  p99LatencyMs: number; // median
  uptimePercent: number; // median
  warnings: string[]; // unique "severity: message" strings seen in any run
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Map a PortProtocol to its handle-id prefix. */
function protocolPrefix(proto: PortProtocol): string {
  // PortProtocol values all lower-case cleanly except "Redis"
  return proto.toLowerCase();
}

/**
 * Apply a provider variant onto a base BlockDefinition, mirroring exactly
 * what `loadCanvas` does in store.ts.
 */
function applyProvider(
  baseDef: BlockDefinition,
  providerName: string,
): BlockDefinition {
  const variant = baseDef.providers?.find((p) => p.provider === providerName);
  if (!variant) {
    throw new Error(
      `Provider "${providerName}" not found for block type "${baseDef.type}". ` +
        `Available: ${(baseDef.providers ?? []).map((p) => p.provider).join(", ")}`,
    );
  }
  return {
    ...baseDef,
    name: variant.provider,
    costPerMonth: variant.costPerMonth,
    maxRps: variant.maxRps,
    maxConnections: variant.maxConnections,
    baseLatencyMs: variant.baseLatencyMs,
    ...(variant.hitRate !== undefined && { hitRate: variant.hitRate }),
    ...(variant.edgeLatencyReduction !== undefined && {
      edgeLatencyReduction: variant.edgeLatencyReduction,
    }),
    ...(variant.attackAbsorbRate !== undefined && {
      attackAbsorbRate: variant.attackAbsorbRate,
    }),
  };
}

/** Make a zeroed-out runtime BlockNodeData wrapping a definition. */
function makeNodeData(
  definition: BlockDefinition,
  instanceId: string,
  replicas: number,
  isStartBlock?: boolean,
): BlockNodeData {
  return {
    definition,
    instanceId,
    isStartBlock,
    replicas,
    currentRps: 0,
    currentLatencyMs: 0,
    loadPercent: 0,
    failedRequests: 0,
    queueDepth: 0,
    status: "idle",
  };
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

// ─── buildGraph ──────────────────────────────────────────────────────────────

/**
 * Build the nodes+edges arrays the SimulationEngine expects.
 * "traffic-source" is implicit — do NOT list it in spec.blocks.
 */
export function buildGraph(spec: DesignSpec): {
  nodes: Node<BlockNodeData>[];
  edges: Edge[];
} {
  // Collect all valid node IDs up front for edge validation
  const allIds = new Set<string>([
    "traffic-source",
    ...Object.keys(spec.blocks),
  ]);

  // ── Nodes ──────────────────────────────────────────────────────────────────

  const startNode: Node<BlockNodeData> = {
    id: "traffic-source",
    type: "blockNode",
    position: { x: 50, y: 200 },
    data: makeNodeData(TRAFFIC_SOURCE_BLOCK, "traffic-source", 1, true),
  };

  const userNodes: Node<BlockNodeData>[] = Object.entries(spec.blocks).map(
    ([key, entry]) => {
      const baseDef = getBlockDefinition(entry.type);
      if (!baseDef) {
        throw new Error(
          `Unknown block type "${entry.type}" for key "${key}". ` +
            `Check block-registry.ts for valid types.`,
        );
      }

      const definition = entry.provider
        ? applyProvider(baseDef, entry.provider)
        : baseDef;

      // Mirror the replica-clamping logic from store.ts / simulation-engine.ts:
      // non-"counter" scaling modes are always single-instance.
      const scalingMode = definition.scaling ?? "counter";
      const replicas =
        scalingMode === "counter" ? Math.max(1, entry.replicas ?? 1) : 1;

      return {
        id: key,
        type: "blockNode",
        position: { x: 0, y: 0 }, // position is irrelevant for simulation
        data: makeNodeData(definition, key, replicas),
      } satisfies Node<BlockNodeData>;
    },
  );

  const nodes: Node<BlockNodeData>[] = [startNode, ...userNodes];

  // ── Edges ──────────────────────────────────────────────────────────────────

  const edges: Edge[] = spec.edges.map((tuple) => {
    const fromKey = tuple[0];
    const toKey = tuple[1];
    const proto: PortProtocol =
      (tuple[2] as PortProtocol | undefined) ?? "HTTP";

    if (!allIds.has(fromKey)) {
      throw new Error(
        `Edge source "${fromKey}" is not a known node key. ` +
          `Valid keys: ${[...allIds].join(", ")}`,
      );
    }
    if (!allIds.has(toKey)) {
      throw new Error(
        `Edge target "${toKey}" is not a known node key. ` +
          `Valid keys: ${[...allIds].join(", ")}`,
      );
    }

    const prefix = protocolPrefix(proto);
    const sourceHandle = `${prefix}-out-0`;
    const targetHandle = `${prefix}-in-0`;

    return {
      id: `edge-${fromKey}-${toKey}-${proto}`,
      type: "customEdge",
      source: fromKey,
      target: toKey,
      sourceHandle,
      targetHandle,
    } satisfies Edge;
  });

  return { nodes, edges };
}

// ─── scoreOnce ───────────────────────────────────────────────────────────────

/**
 * Run the level once through the real engine and return raw SimulationResults.
 */
export function scoreOnce(
  level: LevelDefinition,
  spec: DesignSpec,
): SimulationResults {
  const { nodes, edges } = buildGraph(spec);

  const engine = new SimulationEngine(
    nodes as Node<BlockNodeData>[],
    edges as Edge[],
    level,
  );

  const allTicks = [];
  while (!engine.isComplete()) {
    allTicks.push(engine.tick());
  }

  // Total cost: sum of costPerMonth × replicas for every node
  const totalCost = nodes.reduce((sum, n) => {
    const d = n.data as BlockNodeData;
    return sum + d.definition.costPerMonth * (d.replicas ?? 1);
  }, 0);

  // Topology warnings (SPOF, unreachable, no-cache, etc.)
  const topologyWarnings = computeTopologyWarnings(
    nodes as Node<BlockNodeData>[],
    edges as Edge[],
  );

  // Idle-required check — mirrors simulation-runner.tsx exactly:
  // A required block that is reachable but carries no traffic the whole run
  // means the topology doesn't route through it → severity "error".
  const requiredTypes = new Set(level.requiredBlockTypes ?? []);
  if (requiredTypes.size > 0) {
    const peakRps = new Map<string, number>();
    for (const tick of allTicks) {
      for (const [nodeId, st] of Object.entries(tick.blockStats)) {
        peakRps.set(nodeId, Math.max(peakRps.get(nodeId) ?? 0, st.rps));
      }
    }
    for (const n of nodes) {
      const data = n.data as BlockNodeData;
      if (!requiredTypes.has(data.definition.type)) continue;
      if ((peakRps.get(n.id) ?? 0) >= 1) continue;
      topologyWarnings.push({
        id: `idle-required:${n.id}`,
        severity: "error",
        message: `${data.definition.label} is required but carries no traffic — route the data path through it`,
      });
    }
  }

  return engine.getResults(totalCost, level, topologyWarnings);
}

// ─── score ───────────────────────────────────────────────────────────────────

/**
 * Run `runs` times (default 9) to average over the engine's RNG jitter, and
 * aggregate into a ScoreSummary.
 */
export function score(
  level: LevelDefinition,
  spec: DesignSpec,
  runs = 9,
): ScoreSummary {
  // Deterministic cost: compute once from the graph (no RNG involved)
  const { nodes } = buildGraph(spec);
  const costPerMonth = nodes.reduce((sum, n) => {
    const d = n.data as BlockNodeData;
    return sum + d.definition.costPerMonth * (d.replicas ?? 1);
  }, 0);
  const costPercent =
    level.budget > 0 ? (costPerMonth / level.budget) * 100 : 0;

  const results: SimulationResults[] = [];
  for (let i = 0; i < runs; i++) {
    results.push(scoreOnce(level, spec));
  }

  // Aggregate
  const sortedStars = [...results.map((r) => r.stars)].sort((a, b) => a - b);
  const sortedAvgLat = [...results.map((r) => r.avgLatencyMs)].sort(
    (a, b) => a - b,
  );
  const sortedP99 = [...results.map((r) => r.p99LatencyMs)].sort(
    (a, b) => a - b,
  );
  const sortedUptime = [...results.map((r) => r.uptimePercent)].sort(
    (a, b) => a - b,
  );

  const passCount = results.filter((r) => r.passed).length;

  // Unique warnings from any run
  const warningSet = new Set<string>();
  for (const r of results) {
    for (const w of r.topologyWarnings) {
      warningSet.add(`${w.severity}: ${w.message}`);
    }
  }

  return {
    stars: median(sortedStars),
    minStars: sortedStars[0]!,
    maxStars: sortedStars[sortedStars.length - 1]!,
    passed: passCount > runs / 2,
    costPerMonth,
    costPercent: Math.round(costPercent * 100) / 100,
    avgLatencyMs: median(sortedAvgLat),
    p99LatencyMs: median(sortedP99),
    uptimePercent: median(sortedUptime),
    warnings: [...warningSet],
  };
}
