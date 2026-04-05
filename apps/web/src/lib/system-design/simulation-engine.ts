import type { Edge, Node } from "@xyflow/react";
import type {
  AttackSpike,
  BlockNodeData,
  LatencyCurve,
  LevelDefinition,
  PortProtocol,
  SimulationResults,
  SimulationTick,
  TrafficDataPoint,
} from "./types";
import { getTopologicalOrder } from "./connection-validator";

/** Apply ±jitterPercent random noise to a value. */
function jitter(value: number, jitterPercent: number): number {
  return value * (1 + (Math.random() * 2 - 1) * jitterPercent);
}

// --- Protocols considered async (fire-and-forget from user perspective) ---
const ASYNC_PROTOCOLS = new Set<string>(["AMQP"]);

// --- Per-block-type behavior ---

interface BlockBehavior {
  needsDownstream: boolean;
  generates?: Record<string, {
    ratio: number;
    required: boolean;
  }>;
  cacheEffect?: {
    ifConnected: PortProtocol;
    reduces: PortProtocol;
    hitRate: number;
  };
}

const BLOCK_BEHAVIORS: Record<string, BlockBehavior> = {
  "traffic-source": { needsDownstream: true },
  "dns":            { needsDownstream: true },
  "cdn":            { needsDownstream: true },
  "load-balancer":  { needsDownstream: true },
  "api-gateway":    { needsDownstream: true },
  "firewall":       { needsDownstream: true },
  "rate-limiter":   { needsDownstream: true },
  "auto-scaler":    { needsDownstream: true },

  "app-server": {
    needsDownstream: false,
    generates: {
      SQL:   { ratio: 1.0, required: true },
      Redis: { ratio: 1.0, required: false },
      AMQP:  { ratio: 0.1, required: false },
      S3:    { ratio: 0.05, required: false },
    },
    cacheEffect: {
      ifConnected: "Redis",
      reduces: "SQL",
      hitRate: 0.75,
    },
  },

  "worker": {
    needsDownstream: false,
    generates: {
      SQL: { ratio: 0.5, required: false },
      S3:  { ratio: 0.1, required: false },
    },
  },

  "sql-db":         { needsDownstream: false },
  "nosql-db":       { needsDownstream: false },
  "cache":          { needsDownstream: false },
  "object-storage": { needsDownstream: false },
  "search-engine":  { needsDownstream: false },
  "message-queue":  { needsDownstream: true },
};

// --- Edge with protocol info ---
interface SimEdge {
  sourceId: string;
  targetId: string;
  sourceHandle: string;
  targetHandle: string;
  protocol: PortProtocol;
}

interface SimNode {
  id: string;
  type: string;
  maxRps: number;
  baseLatencyMs: number;
  routingStrategy: string;
  ports: { id: string; protocol: PortProtocol; direction: "in" | "out" }[];
  pendingRps: number;
  currentRps: number;
  loadPercent: number;
  currentLatencyMs: number;
  status: "idle" | "healthy" | "degraded" | "overloaded" | "failing";

  queueDepth: number;
  queueLimit: number;
  latencyCurve: LatencyCurve;
  hitRate: number;
  timeoutMs: number;
  isAsync: boolean;
}

interface NodeEdges {
  downstream: Map<string, string[]>; // protocol → target IDs
  upstream: string[];
  allDownstream: string[]; // flat list of all downstream IDs
}

interface QueueResult {
  processed: number;
  dropped: number;
  loadFactor: number;
}

// Penalties for missing infrastructure layers
interface MissingLayerPenalties {
  latencyPenaltyMs: number; // added to traffic-source so it propagates downstream
}

export const MISSING_LAYER_PENALTIES: Record<string, Partial<MissingLayerPenalties> & { warning: string }> = {
  dns: { latencyPenaltyMs: 120, warning: "Default DNS: +120ms latency, no smart routing or edge network" },
  cdn: { latencyPenaltyMs: 80, warning: "No CDN: +80ms latency, every request hits origin server" },
};

export class SimulationEngine {
  private graph: Map<string, SimNode>;
  private edges: SimEdge[];
  private edgeMap: Map<string, NodeEdges>;
  private topOrder: string[];
  private trafficPattern: TrafficDataPoint[];
  private durationSeconds: number;
  private currentTime: number;
  private timeline: SimulationTick[];
  private totalRequests: number;
  private failedRequests: number;
  private latencySum: number;
  private latencyCount: number;
  private latencySamples: number[];
  private penalties: MissingLayerPenalties;
  private attackSpikes: AttackSpike[];
  private hasFirewall: boolean;
  private hasRateLimiter: boolean;

  constructor(
    nodes: Node<BlockNodeData>[],
    rawEdges: Edge[],
    level: LevelDefinition,
  ) {
    this.graph = new Map();
    this.edges = [];
    this.edgeMap = new Map();
    this.trafficPattern = level.trafficPattern;
    this.durationSeconds = level.durationSeconds;
    this.currentTime = 0;
    this.timeline = [];
    this.totalRequests = 0;
    this.failedRequests = 0;
    this.latencySum = 0;
    this.latencyCount = 0;
    this.latencySamples = [];

    for (const node of nodes) {
      const data = node.data as BlockNodeData;
      const def = data.definition;
      this.graph.set(node.id, {
        id: node.id,
        type: def.type,
        maxRps: def.maxRps,
        baseLatencyMs: def.baseLatencyMs,
        routingStrategy: def.routingStrategy,
        ports: def.ports.map((p) => ({
          id: p.id,
          protocol: p.protocol,
          direction: p.direction,
        })),
        pendingRps: 0,
        currentRps: 0,
        loadPercent: 0,
        currentLatencyMs: 0,
        status: "idle",
        queueDepth: 0,
        queueLimit: def.queueLimit ?? 0,
        latencyCurve: def.latencyCurve ?? "quadratic",
        hitRate: def.hitRate ?? 0,
        timeoutMs: def.timeoutMs ?? Infinity,
        isAsync: false,
      });
      this.edgeMap.set(node.id, {
        downstream: new Map(),
        upstream: [],
        allDownstream: [],
      });
    }

    for (const edge of rawEdges) {
      const sourceNode = this.graph.get(edge.source);
      if (!sourceNode) continue;

      const sourcePort = sourceNode.ports.find(
        (p) => p.id === edge.sourceHandle,
      );
      const protocol = sourcePort?.protocol ?? "HTTP";

      this.edges.push({
        sourceId: edge.source,
        targetId: edge.target,
        sourceHandle: edge.sourceHandle ?? "",
        targetHandle: edge.targetHandle ?? "",
        protocol,
      });

      const sourceEdges = this.edgeMap.get(edge.source)!;
      sourceEdges.allDownstream.push(edge.target);
      if (!sourceEdges.downstream.has(protocol)) {
        sourceEdges.downstream.set(protocol, []);
      }
      sourceEdges.downstream.get(protocol)!.push(edge.target);

      this.edgeMap.get(edge.target)!.upstream.push(edge.source);
    }

    this.topOrder = getTopologicalOrder(nodes, rawEdges);

    const reachable = this.computeReachable();
    this.markAsyncNodes(reachable);
    this.penalties = this.computePenalties(reachable);
    this.attackSpikes = level.attackSpikes ?? [];

    const reachableTypes = new Set<string>();
    for (const nodeId of reachable) {
      const node = this.graph.get(nodeId);
      if (node) reachableTypes.add(node.type);
    }
    this.hasFirewall = reachableTypes.has("firewall");
    this.hasRateLimiter = reachableTypes.has("rate-limiter");
  }

  /** BFS from traffic-source to find all reachable node IDs. */
  private computeReachable(): Set<string> {
    const reachable = new Set<string>();
    const queue: string[] = ["traffic-source"];
    reachable.add("traffic-source");

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      for (const targetId of this.getAllDownstream(nodeId)) {
        if (reachable.has(targetId)) continue;
        reachable.add(targetId);
        queue.push(targetId);
      }
    }

    return reachable;
  }

  /** Check which infrastructure layers are missing from reachable graph. */
  private computePenalties(reachable: Set<string>): MissingLayerPenalties {
    const reachableTypes = new Set<string>();
    for (const nodeId of reachable) {
      const node = this.graph.get(nodeId);
      if (node) reachableTypes.add(node.type);
    }

    const result: MissingLayerPenalties = {
      latencyPenaltyMs: 0,
    };

    for (const [blockType, penalty] of Object.entries(MISSING_LAYER_PENALTIES)) {
      if (reachableTypes.has(blockType)) continue;

      if (penalty.latencyPenaltyMs) result.latencyPenaltyMs += penalty.latencyPenaltyMs;
    }

    return result;
  }

  /** Mark nodes only reachable via async protocols. */
  private markAsyncNodes(reachable: Set<string>): void {
    // BFS following only sync edges
    const syncReachable = new Set<string>();
    const queue: string[] = ["traffic-source"];
    syncReachable.add("traffic-source");

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      for (const edge of this.edges) {
        if (edge.sourceId !== nodeId) continue;
        if (ASYNC_PROTOCOLS.has(edge.protocol)) continue;
        if (syncReachable.has(edge.targetId)) continue;
        syncReachable.add(edge.targetId);
        queue.push(edge.targetId);
      }
    }

    for (const node of this.graph.values()) {
      node.isAsync = !syncReachable.has(node.id);
    }
  }

  /** Get attack RPS at a given time. Firewall blocks 100%, rate-limiter blocks 90%. */
  private getAttackRpsAtTime(time: number): number {
    if (this.hasFirewall) return 0;

    let attackRps = 0;
    for (const spike of this.attackSpikes) {
      if (time >= spike.time && time < spike.time + spike.duration) {
        attackRps += spike.rps;
      }
    }

    // Rate-limiter blocks 90% of attack traffic (but not as well as a firewall)
    if (this.hasRateLimiter && attackRps > 0) {
      attackRps *= 0.1;
    }

    return attackRps;
  }

  private getRpsAtTime(time: number): number {
    const pattern = this.trafficPattern;
    if (pattern.length === 0) return 0;
    if (time <= pattern[0]!.time) return pattern[0]!.rps;
    if (time >= pattern[pattern.length - 1]!.time)
      return pattern[pattern.length - 1]!.rps;

    for (let i = 0; i < pattern.length - 1; i++) {
      const curr = pattern[i]!;
      const next = pattern[i + 1]!;
      if (time >= curr.time && time <= next.time) {
        const t = (time - curr.time) / (next.time - curr.time);
        return curr.rps + t * (next.rps - curr.rps);
      }
    }

    return pattern[pattern.length - 1]!.rps;
  }

  private getDownstreamByProtocol(nodeId: string, protocol: string): string[] {
    return this.edgeMap.get(nodeId)?.downstream.get(protocol) ?? [];
  }

  private getAllDownstream(nodeId: string): string[] {
    return this.edgeMap.get(nodeId)?.allDownstream ?? [];
  }

  private sendToTargets(
    targets: string[],
    rps: number,
    strategy: string,
  ): void {
    if (targets.length === 0) return;
    if (strategy === "round-robin") {
      const perNode = rps / targets.length;
      for (const targetId of targets) {
        const target = this.graph.get(targetId);
        if (target) target.pendingRps += perNode;
      }
    } else if (strategy === "broadcast") {
      for (const targetId of targets) {
        const target = this.graph.get(targetId);
        if (target) target.pendingRps += rps;
      }
    } else {
      const target = this.graph.get(targets[0]!);
      if (target) target.pendingRps += rps;
    }
  }

  private computeLatency(node: SimNode, loadFactor: number): number {
    const clampedLoad = Math.min(loadFactor, 3.0);
    let latency: number;
    switch (node.latencyCurve) {
      case "flat":
        latency = node.baseLatencyMs;
        break;
      case "cubic":
        latency = node.baseLatencyMs * (1 + clampedLoad ** 3);
        break;
      case "quadratic":
      default:
        latency = node.baseLatencyMs * (1 + clampedLoad ** 2);
        break;
    }
    return jitter(latency, 0.1);
  }

  /** Process queue: returns how many were processed/dropped and the load factor. */
  private processQueue(node: SimNode, incomingRps: number): QueueResult {
    const capacity = node.maxRps;
    const totalLoad = incomingRps + node.queueDepth;
    const processed = Math.min(totalLoad, capacity);
    const remaining = totalLoad - processed;
    const dropped = Math.max(0, remaining - node.queueLimit);
    node.queueDepth = Math.min(remaining, node.queueLimit);

    const loadFactor =
      capacity > 0 && isFinite(capacity) ? totalLoad / capacity : 0;

    node.loadPercent =
      capacity > 0 && isFinite(capacity) ? (totalLoad / capacity) * 100 : 0;
    node.currentRps = incomingRps;
    node.currentLatencyMs = this.computeLatency(node, loadFactor);
    node.status =
      node.loadPercent < 70
        ? "healthy"
        : node.loadPercent < 90
          ? "degraded"
          : "overloaded";

    return { processed, dropped, loadFactor };
  }

  /** Compute timeout-based soft failures. */
  private computeTimeouts(node: SimNode, processed: number): number {
    if (node.timeoutMs >= Infinity || processed <= 0) return 0;

    if (node.currentLatencyMs > node.timeoutMs) return processed;

    const ratio = node.currentLatencyMs / node.timeoutMs;
    if (ratio > 0.8) {
      return processed * ((ratio - 0.8) / 0.2) * 0.5;
    }
    return 0;
  }

  /** Route traffic through a node based on its block behavior. Returns RPS dropped due to missing connections. */
  private routeTraffic(
    nodeId: string,
    node: SimNode,
    effectiveProcessed: number,
  ): number {
    const behavior = BLOCK_BEHAVIORS[node.type];

    // Message Queue: async buffering pattern
    if (node.type === "message-queue") {
      return this.routeMessageQueue(nodeId, node, effectiveProcessed);
    }

    // Compute block: generates sub-requests
    if (behavior?.generates) {
      return this.routeComputeBlock(
        nodeId,
        effectiveProcessed,
        behavior,
      );
    }

    // Networking/passthrough blocks
    if (behavior?.needsDownstream) {
      return this.routePassthrough(nodeId, node, effectiveProcessed);
    }

    // Sink block with cache hit-rate (Redis, Memcached etc.)
    if (!behavior?.needsDownstream && node.hitRate > 0 && effectiveProcessed > 0) {
      const hitLatency = node.baseLatencyMs;
      const missLatency = node.baseLatencyMs * 5;
      node.currentLatencyMs =
        node.hitRate * hitLatency + (1 - node.hitRate) * missLatency;
    }

    return 0;
  }

  private routeMessageQueue(
    nodeId: string,
    node: SimNode,
    effectiveProcessed: number,
  ): number {
    const downstream = this.getAllDownstream(nodeId);

    if (downstream.length === 0) return effectiveProcessed;

    node.queueDepth += effectiveProcessed;

    let consumerCapacity = 0;
    for (const targetId of downstream) {
      const target = this.graph.get(targetId);
      if (target) consumerCapacity += target.maxRps;
    }

    const drained = Math.min(node.queueDepth, consumerCapacity);
    node.queueDepth -= drained;
    this.sendToTargets(downstream, drained, "round-robin");

    node.currentLatencyMs = consumerCapacity > 0
      ? (node.queueDepth / consumerCapacity) * 1000
      : node.baseLatencyMs;

    return 0;
  }

  private routeComputeBlock(
    nodeId: string,
    effectiveProcessed: number,
    behavior: BlockBehavior,
  ): number {
    const generates = behavior.generates!;

    // Check required protocols have targets
    for (const [protocol, config] of Object.entries(generates)) {
      if (!config.required) continue;
      if (this.getDownstreamByProtocol(nodeId, protocol).length === 0) {
        return effectiveProcessed;
      }
    }

    for (const [protocol, config] of Object.entries(generates)) {
      const targets = this.getDownstreamByProtocol(nodeId, protocol);
      if (targets.length === 0) continue;

      let ratio = config.ratio;

      if (behavior.cacheEffect) {
        const cacheTargets = this.getDownstreamByProtocol(
          nodeId,
          behavior.cacheEffect.ifConnected,
        );
        if (cacheTargets.length > 0 && protocol === behavior.cacheEffect.reduces) {
          ratio *= 1 - behavior.cacheEffect.hitRate;
        }
      }

      this.sendToTargets(targets, effectiveProcessed * ratio, "round-robin");
    }

    return 0;
  }

  private routePassthrough(
    nodeId: string,
    node: SimNode,
    effectiveProcessed: number,
  ): number {
    const downstream = this.getAllDownstream(nodeId);

    if (downstream.length === 0) return effectiveProcessed;

    if (node.hitRate > 0 && effectiveProcessed > 0) {
      const hitRps = effectiveProcessed * node.hitRate;
      const missRps = effectiveProcessed - hitRps;

      const hitLatency = node.baseLatencyMs;
      const missLatency = node.baseLatencyMs * 3;
      node.currentLatencyMs =
        (hitRps * hitLatency + missRps * missLatency) / effectiveProcessed;

      this.sendToTargets(downstream, missRps, node.routingStrategy);
    } else {
      this.sendToTargets(downstream, effectiveProcessed, node.routingStrategy);
    }

    return 0;
  }

  tick(): SimulationTick {
    const legitimateRps = jitter(this.getRpsAtTime(this.currentTime), 0.05);
    const attackRps = this.getAttackRpsAtTime(this.currentTime);
    const rps = legitimateRps + attackRps;

    for (const node of this.graph.values()) {
      node.pendingRps = 0;
    }

    const source = this.graph.get("traffic-source");
    if (source) source.pendingRps = rps;

    // Track upstream latency for weighted merge-point latency
    const upstreamLatency = new Map<string, { weightedSum: number; totalRps: number }>();
    for (const nodeId of this.topOrder) {
      upstreamLatency.set(nodeId, { weightedSum: 0, totalRps: 0 });
    }

    let tickFailed = 0;
    let tickLatencySum = 0;
    let tickLatencyCount = 0;
    const blockStats: SimulationTick["blockStats"] = {};

    for (const nodeId of this.topOrder) {
      const node = this.graph.get(nodeId);
      if (!node) continue;

      const incomingRps = node.pendingRps;
      if (incomingRps === 0 && node.queueDepth === 0) {
        blockStats[nodeId] = {
          rps: 0, latencyMs: 0, loadPercent: 0,
          status: "idle", failedRps: 0,
          queueDepth: Math.round(node.queueDepth), timedOutRps: 0,
        };
        continue;
      }

      const { processed, dropped } = this.processQueue(node, incomingRps);

      // Apply latency penalty at traffic-source so it propagates to all downstream
      if (node.type === "traffic-source") {
        node.currentLatencyMs += this.penalties.latencyPenaltyMs;
      }

      const timedOutRps = this.computeTimeouts(node, processed);
      const effectiveProcessed = processed - timedOutRps;
      const droppedByMissing = this.routeTraffic(nodeId, node, effectiveProcessed);

      const totalDropped = dropped + droppedByMissing + timedOutRps;
      const successfullyHandled = effectiveProcessed - droppedByMissing;

      // Upstream latency for merge-point weighting
      const upstreamEntry = upstreamLatency.get(nodeId);
      const upstreamLat = upstreamEntry && upstreamEntry.totalRps > 0
        ? upstreamEntry.weightedSum / upstreamEntry.totalRps
        : 0;
      const totalNodeLatency = node.currentLatencyMs + upstreamLat;

      // Only count sync path nodes toward user-facing metrics
      if (!node.isAsync) {
        tickFailed += totalDropped;

        if (successfullyHandled > 0) {
          // Only measure latency at endpoints (sinks/terminal compute)
          // where totalNodeLatency represents full end-to-end path latency
          const behavior = BLOCK_BEHAVIORS[node.type];
          const isSink = !behavior?.needsDownstream && !behavior?.generates;
          const isTerminalCompute = behavior?.generates && !node.isAsync;
          if (isSink || isTerminalCompute) {
            tickLatencySum += successfullyHandled * totalNodeLatency;
            tickLatencyCount += successfullyHandled;
            this.latencySamples.push(totalNodeLatency);
          }
        }
      }

      // Propagate latency to downstream nodes
      if (successfullyHandled > 0) {
        for (const targetId of this.getAllDownstream(nodeId)) {
          const entry = upstreamLatency.get(targetId);
          if (entry) {
            entry.weightedSum += successfullyHandled * totalNodeLatency;
            entry.totalRps += successfullyHandled;
          }
        }
      }

      blockStats[nodeId] = {
        rps: Math.round(incomingRps),
        latencyMs: Math.round(totalNodeLatency * 10) / 10,
        loadPercent: Math.round(node.loadPercent * 10) / 10,
        status: totalDropped > 0 ? "failing" : node.status,
        failedRps: Math.round(totalDropped),
        queueDepth: Math.round(node.queueDepth),
        timedOutRps: Math.round(timedOutRps),
      };
    }

    this.totalRequests += rps;
    this.failedRequests += tickFailed;
    this.latencySum += tickLatencySum;
    this.latencyCount += tickLatencyCount;

    const tickResult: SimulationTick = {
      time: this.currentTime,
      totalRps: Math.round(rps),
      successfulRps: Math.round(Math.max(0, rps - tickFailed)),
      failedRps: Math.round(tickFailed),
      avgLatencyMs:
        tickLatencyCount > 0
          ? Math.round((tickLatencySum / tickLatencyCount) * 10) / 10
          : 0,
      blockStats,
    };

    this.timeline.push(tickResult);
    this.currentTime++;

    return tickResult;
  }

  isComplete(): boolean {
    return this.currentTime >= this.durationSeconds;
  }

  getResults(totalCost: number, level: LevelDefinition): SimulationResults {
    const uptimePercent =
      this.totalRequests > 0
        ? ((this.totalRequests - this.failedRequests) / this.totalRequests) *
          100
        : 100;
    const avgLatencyMs =
      this.latencyCount > 0 ? this.latencySum / this.latencyCount : 0;

    let p99LatencyMs = 0;
    if (this.latencySamples.length > 0) {
      const sorted = [...this.latencySamples].sort((a, b) => a - b);
      const idx = Math.min(
        Math.floor(sorted.length * 0.99),
        sorted.length - 1,
      );
      p99LatencyMs = sorted[idx]!;
    }

    const passed =
      uptimePercent >= level.passCondition.minUptimePercent &&
      avgLatencyMs <= level.passCondition.maxAvgLatencyMs;

    const costPercent =
      level.budget > 0 ? (totalCost / level.budget) * 100 : 0;
    let stars = 0;
    if (passed) {
      stars = 1;
      if (
        costPercent <= level.starConditions.twoStar.maxCostPercent &&
        avgLatencyMs <= level.starConditions.twoStar.maxAvgLatencyMs
      ) {
        stars = 2;
      }
      if (
        costPercent <= level.starConditions.threeStar.maxCostPercent &&
        avgLatencyMs <= level.starConditions.threeStar.maxAvgLatencyMs
      ) {
        stars = 3;
      }
    }

    return {
      totalRequests: Math.round(this.totalRequests),
      successfulRequests: Math.round(
        this.totalRequests - this.failedRequests,
      ),
      failedRequests: Math.round(this.failedRequests),
      uptimePercent: Math.round(uptimePercent * 100) / 100,
      avgLatencyMs: Math.round(avgLatencyMs * 10) / 10,
      p99LatencyMs: Math.round(p99LatencyMs * 10) / 10,
      totalCostPerMonth: totalCost,
      stars,
      passed,
      timeline: this.timeline,
    };
  }
}
