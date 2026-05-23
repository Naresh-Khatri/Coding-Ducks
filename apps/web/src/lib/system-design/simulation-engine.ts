import type { Edge, Node } from "@xyflow/react";

import type {
  AttackSpike,
  BlockNodeData,
  ChaosEvent,
  FlowVolume,
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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// --- Tuning constants (all simulation "feel" lives here, on purpose) ---
const SIM = {
  /** Utilization is clamped here before the latency model so it never
   *  divides by zero. At the cap latency ≈ base × 33. */
  UTIL_CAP: 0.97,
  /** EMA smoothing for the cache-warmth baseline (read RPS). */
  EMA_ALPHA: 0.25,
  /** Cache stays warm until read RPS exceeds baseline × this. */
  SURGE_TRIGGER: 1.4,
  /** How fast the cache cools once past the surge trigger. */
  SURGE_SLOPE: 2.0,
  /** Maximum fraction of the base hit-rate lost during a cold surge. */
  MAX_COOL: 0.6,
  /** Per single-point-of-failure availability factor (compounds). */
  SPOF_AVAILABILITY: 0.99,
  /** p99 tail blow-up: p99 ≈ mean × (1 + pathUtil × this). */
  TAIL_K: 1.5,
  /** 2★ performance gate: p99 must stay within this × the 2★ avg-latency target. */
  P99_STAR_K: 4,
} as const;

const ASYNC_PROTOCOLS = new Set<string>(["AMQP"]);

// --- Per-block-type behavior ---
type Role =
  | "passthrough" // networking/security: forwards flow unchanged
  | "edge-cache" // CDN: serves reads at the edge, forwards misses + writes
  | "compute" // app-server: generates downstream read/write sub-requests
  | "queue" // message-queue: async buffer
  | "worker" // async consumer: drains queue, fans out to SQL/S3
  | "sink"; // datastore: terminates the request

const ROLE: Record<string, Role> = {
  "traffic-source": "passthrough",
  dns: "passthrough",
  "load-balancer": "passthrough",
  "api-gateway": "passthrough",
  firewall: "passthrough",
  "rate-limiter": "passthrough",
  cdn: "edge-cache",
  "app-server": "compute",
  "websocket-server": "compute",
  "message-queue": "queue",
  worker: "worker",
  "stream-processor": "worker",
  "sql-db": "sink",
  "nosql-db": "sink",
  "time-series-db": "sink",
  cache: "sink",
  "object-storage": "sink",
  "search-engine": "sink",
};

// Advisory copy for the canvas overlay. These are no longer hard-coded
// latency penalties — the cost of omitting a layer now emerges from
// utilization in the simulation. The text just nudges the player.
//
// Triggers are topology-conditional: a missing cache only matters when
// there's a DB on the path, a missing CDN only matters when there's a
// read-heavy HTTP origin.
// No-cache advisory lives in topology-warnings (it's app-server-targeted and
// strictly better than a generic check). This function only handles cases
// without a topology equivalent — currently just CDN.
export function computeMissingLayerPenalties(
  reachableTypes: Set<string>,
  writeFraction: number,
): { type: string; warning: string; resolved: boolean }[] {
  const out: { type: string; warning: string; resolved: boolean }[] = [];

  const hasReadOrigin =
    reachableTypes.has("object-storage") || reachableTypes.has("app-server");
  if (hasReadOrigin && writeFraction < 0.5) {
    out.push({
      type: "cdn",
      warning:
        "No CDN: every read hits your origin — expect higher DB load and latency under spikes",
      resolved: reachableTypes.has("cdn"),
    });
  }

  return out;
}

interface SimEdge {
  sourceId: string;
  targetId: string;
  protocol: PortProtocol;
}

interface SimNode {
  id: string;
  type: string;
  role: Role;
  baseMaxRps: number;
  baseLatencyMs: number;
  routingStrategy: string;
  ports: { id: string; protocol: PortProtocol; direction: "in" | "out" }[];
  replicas: number;
  scalesReadsOnly: boolean;
  /** Managed/HA in concept — single-instance, exempt from SPOF detection. */
  isManaged: boolean;
  baseHitRate: number;
  queueLimit: number;
  timeoutMs: number;
  isAsync: boolean;
  edgeLatencyReduction: number;
  attackAbsorbRate: number;

  // per-tick runtime
  pending: FlowVolume;
  queueDepth: number;
  currentRps: number;
  currentLatencyMs: number;
  loadPercent: number;
  status: "idle" | "healthy" | "degraded" | "overloaded" | "failing";
}

interface NodeEdges {
  byProtocol: Map<string, string[]>;
  all: string[];
}

export class SimulationEngine {
  private graph: Map<string, SimNode>;
  private edges: SimEdge[];
  private edgeMap: Map<string, NodeEdges>;
  private topOrder: string[];
  private trafficPattern: TrafficDataPoint[];
  private durationSeconds: number;
  private writeFraction: number;
  private currentTime: number;
  private timeline: SimulationTick[];
  private totalRequests: number;
  private failedRequests: number;
  private latencySum: number;
  private latencyCount: number;
  private latencySamples: number[];
  private attackSpikes: AttackSpike[];
  private chaosEvents: ChaosEvent[];
  private appliedChaos: Set<number>;
  private chaosTriggered: ChaosEvent[];
  private hasFirewall: boolean;
  private hasRateLimiter: boolean;
  private dnsLatencyReduction: number;
  private dnsAttackAbsorb: number;
  private readEma: number;
  private lastCacheHit: number;
  private spofNodes: string[];
  private availabilityCeiling: number;

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
    this.writeFraction = clamp(level.writeFraction ?? 0.1, 0, 1);
    this.currentTime = 0;
    this.timeline = [];
    this.totalRequests = 0;
    this.failedRequests = 0;
    this.latencySum = 0;
    this.latencyCount = 0;
    this.latencySamples = [];
    this.readEma = 0;
    this.lastCacheHit = 0;
    this.spofNodes = [];
    this.availabilityCeiling = 100;

    for (const node of nodes) {
      const data = node.data;
      const def = data.definition;
      this.graph.set(node.id, {
        id: node.id,
        type: def.type,
        role: ROLE[def.type] ?? "sink",
        baseMaxRps: def.maxRps,
        baseLatencyMs: def.baseLatencyMs,
        routingStrategy: def.routingStrategy,
        ports: def.ports.map((p) => ({
          id: p.id,
          protocol: p.protocol,
          direction: p.direction,
        })),
        // Only "counter"-mode blocks honor a replica count in the engine.
        // Manual-scaled (compute) and managed blocks are always one instance —
        // players add capacity by dropping more nodes on the canvas instead.
        replicas:
          (def.scaling ?? "counter") === "counter"
            ? Math.max(1, Math.round(data.replicas ?? 1))
            : 1,
        scalesReadsOnly: def.scalesReadsOnly ?? false,
        isManaged: (def.scaling ?? "counter") === "managed",
        baseHitRate: def.hitRate ?? 0,
        queueLimit: def.queueLimit ?? 0,
        timeoutMs: def.timeoutMs ?? Infinity,
        edgeLatencyReduction: def.edgeLatencyReduction ?? 0,
        attackAbsorbRate: def.attackAbsorbRate ?? 0,
        isAsync: false,
        pending: { read: 0, write: 0 },
        queueDepth: 0,
        currentRps: 0,
        currentLatencyMs: 0,
        loadPercent: 0,
        status: "idle",
      });
      this.edgeMap.set(node.id, { byProtocol: new Map(), all: [] });
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
        protocol,
      });
      const se = this.edgeMap.get(edge.source)!;
      se.all.push(edge.target);
      if (!se.byProtocol.has(protocol)) se.byProtocol.set(protocol, []);
      se.byProtocol.get(protocol)!.push(edge.target);
    }

    this.topOrder = getTopologicalOrder(nodes, rawEdges);

    const reachable = this.computeReachable();
    this.markAsyncNodes();
    this.attackSpikes = level.attackSpikes ?? [];
    this.chaosEvents = level.chaosEvents ?? [];
    this.appliedChaos = new Set();
    this.chaosTriggered = [];

    const reachableTypes = new Set<string>();
    for (const id of reachable) {
      const n = this.graph.get(id);
      if (n) reachableTypes.add(n.type);
    }
    this.hasFirewall = reachableTypes.has("firewall");
    this.hasRateLimiter = reachableTypes.has("rate-limiter");

    let bestDnsLatency = 0;
    let bestDnsAbsorb = 0;
    for (const id of reachable) {
      const n = this.graph.get(id);
      if (n?.type !== "dns") continue;
      if (n.edgeLatencyReduction > bestDnsLatency) {
        bestDnsLatency = n.edgeLatencyReduction;
      }
      if (n.attackAbsorbRate > bestDnsAbsorb) {
        bestDnsAbsorb = n.attackAbsorbRate;
      }
    }
    this.dnsLatencyReduction = bestDnsLatency;
    this.dnsAttackAbsorb = clamp(bestDnsAbsorb, 0, 1);

    this.computeSpof(reachable);
  }

  // --- Graph analysis -------------------------------------------------

  private downstream(id: string): string[] {
    return this.edgeMap.get(id)?.all ?? [];
  }

  private downstreamByProtocol(id: string, protocol: string): string[] {
    return this.edgeMap.get(id)?.byProtocol.get(protocol) ?? [];
  }

  /** BFS from traffic-source over a given edge set. */
  private reachFrom(blocked?: string): Set<string> {
    const reachable = new Set<string>();
    const start = "traffic-source";
    if (blocked === start || !this.graph.has(start)) return reachable;
    reachable.add(start);
    const queue = [start];
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const t of this.downstream(id)) {
        if (t === blocked || reachable.has(t)) continue;
        reachable.add(t);
        queue.push(t);
      }
    }
    return reachable;
  }

  private computeReachable(): Set<string> {
    return this.reachFrom();
  }

  /** Mark nodes only reachable via async (AMQP) edges. */
  private markAsyncNodes(): void {
    const syncReachable = new Set<string>(["traffic-source"]);
    const queue = ["traffic-source"];
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const e of this.edges) {
        if (e.sourceId !== id) continue;
        if (ASYNC_PROTOCOLS.has(e.protocol)) continue;
        if (syncReachable.has(e.targetId)) continue;
        syncReachable.add(e.targetId);
        queue.push(e.targetId);
      }
    }
    for (const node of this.graph.values()) {
      node.isAsync = !syncReachable.has(node.id);
    }
  }

  /**
   * A single-instance node is a SPOF if removing it disconnects the
   * traffic source from a "served sink" (a synchronous datastore or the
   * app tier). Each SPOF compounds the availability ceiling.
   */
  private computeSpof(reachable: Set<string>): void {
    const servedSinks: string[] = [];
    for (const id of reachable) {
      const n = this.graph.get(id);
      if (!n || n.isAsync) continue;
      if (n.role === "sink" || n.role === "compute") servedSinks.push(id);
    }
    if (servedSinks.length === 0) {
      this.availabilityCeiling = 100;
      return;
    }

    const spof: string[] = [];
    for (const id of reachable) {
      if (id === "traffic-source") continue;
      const n = this.graph.get(id);
      if (!n || n.isAsync || n.isManaged || n.replicas >= 2) continue;
      const without = this.reachFrom(id);
      const stillServed = servedSinks.some((s) => s !== id && without.has(s));
      if (!stillServed) spof.push(id);
    }

    this.spofNodes = spof;
    this.availabilityCeiling =
      100 * Math.pow(SIM.SPOF_AVAILABILITY, spof.length);
  }

  // --- Traffic --------------------------------------------------------

  private getRpsAtTime(time: number): number {
    const p = this.trafficPattern;
    if (p.length === 0) return 0;
    if (time <= p[0]!.time) return p[0]!.rps;
    if (time >= p[p.length - 1]!.time) return p[p.length - 1]!.rps;
    for (let i = 0; i < p.length - 1; i++) {
      const c = p[i]!;
      const n = p[i + 1]!;
      if (time >= c.time && time <= n.time) {
        const t = (time - c.time) / (n.time - c.time);
        return c.rps + t * (n.rps - c.rps);
      }
    }
    return p[p.length - 1]!.rps;
  }

  private getAttackRpsAtTime(time: number): number {
    if (this.hasFirewall) return 0;
    let attack = 0;
    for (const s of this.attackSpikes) {
      if (time >= s.time && time < s.time + s.duration) attack += s.rps;
    }
    if (this.dnsAttackAbsorb > 0 && attack > 0) {
      attack *= 1 - this.dnsAttackAbsorb;
    }
    if (this.hasRateLimiter && attack > 0) attack *= 0.1;
    return attack;
  }

  /** Effective cache hit-rate this tick, cooled by sudden read surges. */
  private effectiveHitRate(base: number, readRps: number): number {
    if (base <= 0) return 0;
    const baseline = Math.max(this.readEma, 1);
    const ratio = readRps / baseline;
    const cool =
      clamp((ratio - SIM.SURGE_TRIGGER) / SIM.SURGE_SLOPE, 0, 1) * SIM.MAX_COOL;
    return base * (1 - cool);
  }

  // --- Routing helpers ------------------------------------------------

  private send(targets: string[], flow: FlowVolume, strategy: string): void {
    if (targets.length === 0) return;
    if (strategy === "round-robin") {
      const r = flow.read / targets.length;
      const w = flow.write / targets.length;
      for (const t of targets) {
        const node = this.graph.get(t);
        if (node) {
          node.pending.read += r;
          node.pending.write += w;
        }
      }
    } else if (strategy === "broadcast") {
      for (const t of targets) {
        const node = this.graph.get(t);
        if (node) {
          node.pending.read += flow.read;
          node.pending.write += flow.write;
        }
      }
    } else {
      const node = this.graph.get(targets[0]!);
      if (node) {
        node.pending.read += flow.read;
        node.pending.write += flow.write;
      }
    }
  }

  private latencyFor(node: SimNode, util: number): number {
    const u = clamp(util, 0, SIM.UTIL_CAP);
    return jitter(node.baseLatencyMs / (1 - u), 0.08);
  }

  private statusFor(util: number, dropped: number): SimNode["status"] {
    if (dropped > 0) return "failing";
    if (util < 0.7) return "healthy";
    if (util < 0.9) return "degraded";
    return "overloaded";
  }

  private computeTimeouts(node: SimNode, processed: number): number {
    if (!isFinite(node.timeoutMs) || processed <= 0) return 0;
    if (node.currentLatencyMs > node.timeoutMs) return processed;
    const ratio = node.currentLatencyMs / node.timeoutMs;
    if (ratio > 0.8) return processed * ((ratio - 0.8) / 0.2) * 0.5;
    return 0;
  }

  // --- Tick -----------------------------------------------------------

  /**
   * Apply any chaos events whose scheduled time has arrived.
   * Counter-mode blocks lose one replica (floor 1, capacity clamped to 0).
   * Managed/manual blocks lose half their effective capacity (one AZ down).
   */
  private applyChaos(): void {
    for (let i = 0; i < this.chaosEvents.length; i++) {
      if (this.appliedChaos.has(i)) continue;
      const evt = this.chaosEvents[i]!;
      if (this.currentTime < evt.time) continue;
      let hit: SimNode | undefined;
      for (const n of this.graph.values()) {
        if (n.type !== evt.targetType) continue;
        hit = n;
        break;
      }
      this.appliedChaos.add(i);
      if (!hit) continue;
      if (hit.replicas > 1) {
        hit.replicas -= 1;
      } else {
        hit.baseMaxRps = Math.max(0, Math.floor(hit.baseMaxRps * 0.5));
      }
      this.chaosTriggered.push(evt);
    }
  }

  tick(): SimulationTick {
    this.applyChaos();
    const legit = jitter(this.getRpsAtTime(this.currentTime), 0.05);
    const attack = this.getAttackRpsAtTime(this.currentTime);
    const readRps = legit * (1 - this.writeFraction) + attack;
    const writeRps = legit * this.writeFraction;

    // Cache-warmth baseline (seed on first tick, then EMA).
    this.readEma =
      this.currentTime === 0
        ? readRps
        : SIM.EMA_ALPHA * readRps + (1 - SIM.EMA_ALPHA) * this.readEma;
    const tickHitBasis = this.effectiveHitRate(1, readRps); // 0..1 multiplier
    this.lastCacheHit = 0;

    for (const node of this.graph.values()) {
      node.pending = { read: 0, write: 0 };
    }
    const source = this.graph.get("traffic-source");
    if (source) source.pending = { read: readRps, write: writeRps };

    const upstreamLat = new Map<
      string,
      { weightedSum: number; totalRps: number }
    >();
    for (const id of this.topOrder) {
      upstreamLat.set(id, { weightedSum: 0, totalRps: 0 });
    }

    let tickFailed = 0;
    let tickLatencySum = 0;
    let tickLatencyCount = 0;
    const blockStats: SimulationTick["blockStats"] = {};
    const splitLoad = new Map<string, { read: number; write: number }>();

    for (const id of this.topOrder) {
      const node = this.graph.get(id);
      if (!node) continue;

      const inR = node.pending.read;
      const inW = node.pending.write;
      if (inR + inW === 0 && node.queueDepth === 0) {
        blockStats[id] = {
          rps: 0,
          latencyMs: 0,
          loadPercent: 0,
          status: "idle",
          failedRps: 0,
          queueDepth: Math.round(node.queueDepth),
          timedOutRps: 0,
        };
        continue;
      }

      // --- Capacity & queueing -----------------------------------------
      let processedR: number;
      let processedW: number;
      let dropped: number;
      let util: number;

      if (node.role === "queue") {
        // Async buffer: accept everything, drain to consumer capacity.
        const incoming = inR + inW;
        node.queueDepth += incoming;
        let consumerCap = 0;
        for (const t of this.downstream(id)) {
          const c = this.graph.get(t);
          if (c) consumerCap += c.baseMaxRps * c.replicas;
        }
        const drained = Math.min(node.queueDepth, consumerCap);
        node.queueDepth -= drained;
        dropped = Math.max(0, node.queueDepth - node.queueLimit);
        node.queueDepth = Math.min(node.queueDepth, node.queueLimit);
        processedR = 0;
        processedW = drained; // queued work treated as write-like
        util = consumerCap > 0 ? (incoming + node.queueDepth) / consumerCap : 1;
        node.currentLatencyMs =
          consumerCap > 0
            ? (node.queueDepth / consumerCap) * 1000
            : node.baseLatencyMs;
        node.loadPercent = util * 100;
        node.currentRps = incoming;
        node.status = this.statusFor(util, dropped);
        this.send(
          this.downstream(id),
          { read: 0, write: drained },
          "round-robin",
        );
      } else if (node.role === "sink" && node.scalesReadsOnly) {
        // Datastore: replicas scale READS only; the primary caps writes.
        const wCap = node.baseMaxRps;
        const rCap = node.baseMaxRps * node.replicas;
        const wProc = Math.min(inW, wCap);
        const wDrop = inW - wProc;
        const rLoad = inR + node.queueDepth;
        const rProc = Math.min(rLoad, rCap);
        const rOver = rLoad - rProc;
        const rDrop = Math.max(0, rOver - node.queueLimit);
        node.queueDepth = Math.min(rOver, node.queueLimit);
        processedR = rProc;
        processedW = wProc;
        dropped = wDrop + rDrop;
        const writeUtil = wCap > 0 ? inW / wCap : 0;
        const readUtil = rCap > 0 ? rLoad / rCap : 0;
        util = Math.max(writeUtil, readUtil);
        splitLoad.set(id, { read: readUtil * 100, write: writeUtil * 100 });
        node.currentLatencyMs = this.latencyFor(node, util);
        node.loadPercent = util * 100;
        node.currentRps = inR + inW;
        node.status = this.statusFor(util, dropped);
      } else {
        const cap = node.baseMaxRps * node.replicas;
        const load = inR + inW + node.queueDepth;
        const proc = Math.min(load, cap);
        const over = load - proc;
        dropped = Math.max(0, over - node.queueLimit);
        node.queueDepth = Math.min(over, node.queueLimit);
        const inTotal = inR + inW || 1;
        processedR = proc * (inR / inTotal);
        processedW = proc * (inW / inTotal);
        util = cap > 0 && isFinite(cap) ? load / cap : 0;
        node.currentLatencyMs = this.latencyFor(node, util);
        node.loadPercent = cap > 0 && isFinite(cap) ? (load / cap) * 100 : 0;
        node.currentRps = inR + inW;
        node.status = this.statusFor(util, dropped);
      }

      // --- Timeouts (soft failures) ------------------------------------
      const processedTotal = processedR + processedW;
      const timedOut = this.computeTimeouts(node, processedTotal);
      const effScale =
        processedTotal > 0 ? (processedTotal - timedOut) / processedTotal : 0;
      const effR = processedR * effScale;
      const effW = processedW * effScale;

      // --- Routing -----------------------------------------------------
      let edgeServed = 0; // requests fully answered at this node (CDN edge)
      let edgeLatency = 0;
      // Requests an endpoint accepted but has nowhere valid to send: a read
      // that misses cache with no datastore, or a write with no durable sink.
      // These fail rather than silently succeeding at the app server.
      let unservedDropped = 0;

      if (node.role === "edge-cache") {
        const targets = this.downstream(id);
        if (targets.length === 0) {
          // CDN with no origin: the cache has nothing to populate from, so
          // even the "hit" path has nothing to serve. All traffic fails.
          dropped += effR + effW;
          edgeServed = 0;
        } else {
          const hit = node.baseHitRate * tickHitBasis;
          if (effR + effW > 0)
            this.lastCacheHit = Math.max(this.lastCacheHit, hit);
          edgeServed = effR * hit;
          edgeLatency = node.currentLatencyMs;
          this.send(
            targets,
            { read: effR * (1 - hit), write: effW },
            node.routingStrategy,
          );
        }
      } else if (node.role === "compute") {
        const cacheTargets = this.downstreamByProtocol(id, "Redis");
        const dbTargets = this.downstreamByProtocol(id, "SQL");
        const amqpTargets = this.downstreamByProtocol(id, "AMQP");
        const s3Targets = this.downstreamByProtocol(id, "S3");

        const cacheBaseRate =
          cacheTargets.length > 0
            ? Math.max(
                ...cacheTargets.map((t) => this.graph.get(t)?.baseHitRate ?? 0),
              )
            : 0;
        const hit =
          cacheBaseRate > 0
            ? this.effectiveHitRate(cacheBaseRate, this.readEma) * tickHitBasis
            : 0;
        if (cacheTargets.length > 0 && effR > 0)
          this.lastCacheHit = Math.max(this.lastCacheHit, hit);

        if (cacheTargets.length > 0) {
          this.send(
            cacheTargets,
            { read: effR * hit, write: 0 },
            "round-robin",
          );
        }
        if (dbTargets.length > 0) {
          this.send(
            dbTargets,
            { read: effR * (1 - hit), write: effW },
            "round-robin",
          );
        }
        // Async fan-out (fire-and-forget — not on the user latency path).
        if (amqpTargets.length > 0)
          this.send(amqpTargets, { read: 0, write: effW }, "round-robin");
        if (s3Targets.length > 0)
          this.send(
            s3Targets,
            { read: 0, write: (effR + effW) * 0.05 },
            "round-robin",
          );

        // A write must land in a durable sink (DB or queue). With neither,
        // the app server has nowhere to persist it — those writes fail
        // instead of silently succeeding. (Reads can be served from compute,
        // so a missing read store is a penalty/latency concern, not a drop.)
        const hasWriteSink = dbTargets.length > 0 || amqpTargets.length > 0;
        if (!hasWriteSink) unservedDropped += effW;
      } else if (node.role === "worker") {
        // Workers consume async jobs (write-like) and fan out to their
        // SQL and S3 outputs. Each connected sink sees the full job stream.
        const dbTargets = this.downstreamByProtocol(id, "SQL");
        const s3Targets = this.downstreamByProtocol(id, "S3");
        const jobs = effR + effW;
        if (dbTargets.length > 0) {
          this.send(dbTargets, { read: 0, write: jobs }, "round-robin");
        }
        if (s3Targets.length > 0) {
          this.send(s3Targets, { read: 0, write: jobs }, "round-robin");
        }
      } else if (node.role === "passthrough") {
        this.send(
          this.downstream(id),
          { read: effR, write: effW },
          node.routingStrategy,
        );
      }
      // role "sink": request terminates here.

      // --- Latency accounting ------------------------------------------
      const ue = upstreamLat.get(id);
      const upstream = ue && ue.totalRps > 0 ? ue.weightedSum / ue.totalRps : 0;
      const e2e = node.currentLatencyMs + upstream;
      const handled = Math.max(0, effR + effW - unservedDropped);

      if (!node.isAsync) {
        tickFailed += dropped + timedOut + unservedDropped;

        // Endpoints (sinks, terminal compute, CDN edge hits) carry the
        // full end-to-end latency the user actually experiences.
        const isEndpoint =
          node.role === "sink" ||
          node.role === "compute" ||
          node.role === "edge-cache";
        if (isEndpoint && handled > 0) {
          tickLatencySum += handled * e2e;
          tickLatencyCount += handled;
          const tail = e2e * (1 + clamp(util, 0, 1) * SIM.TAIL_K);
          this.latencySamples.push(tail);
        }
        if (node.role === "edge-cache" && edgeServed > 0) {
          tickLatencySum += edgeServed * (edgeLatency + upstream);
          tickLatencyCount += edgeServed;
          this.latencySamples.push(edgeLatency + upstream);
        }
      }

      if (handled > 0) {
        for (const t of this.downstream(id)) {
          const entry = upstreamLat.get(t);
          if (entry) {
            entry.weightedSum += handled * e2e;
            entry.totalRps += handled;
          }
        }
      }

      const split = splitLoad.get(id);
      blockStats[id] = {
        rps: Math.round(node.currentRps),
        latencyMs: Math.round(e2e * 10) / 10,
        loadPercent: Math.round(node.loadPercent * 10) / 10,
        ...(split && {
          readLoadPercent: Math.round(split.read * 10) / 10,
          writeLoadPercent: Math.round(split.write * 10) / 10,
        }),
        status: node.status,
        failedRps: Math.round(dropped + timedOut),
        queueDepth: Math.round(node.queueDepth),
        timedOutRps: Math.round(timedOut),
      };
    }

    const totalRps = readRps + writeRps;
    this.totalRequests += totalRps;
    this.failedRequests += tickFailed;
    this.latencySum += tickLatencySum;
    this.latencyCount += tickLatencyCount;

    const tickResult: SimulationTick = {
      time: this.currentTime,
      totalRps: Math.round(totalRps),
      successfulRps: Math.round(Math.max(0, totalRps - tickFailed)),
      failedRps: Math.round(tickFailed),
      avgLatencyMs:
        tickLatencyCount > 0
          ? Math.round((tickLatencySum / tickLatencyCount) * 10) / 10
          : 0,
      readRps: Math.round(readRps),
      writeRps: Math.round(writeRps),
      cacheHitRate: Math.round(this.lastCacheHit * 100) / 100,
      blockStats,
    };

    this.timeline.push(tickResult);
    this.currentTime++;
    return tickResult;
  }

  isComplete(): boolean {
    return this.currentTime >= this.durationSeconds;
  }

  getResults(
    totalCost: number,
    level: LevelDefinition,
    topologyWarnings: SimulationResults["topologyWarnings"] = [],
  ): SimulationResults {
    const rawUptime =
      this.totalRequests > 0
        ? ((this.totalRequests - this.failedRequests) / this.totalRequests) *
          100
        : 100;
    const uptimePercent = Math.min(rawUptime, this.availabilityCeiling);

    const rawAvgLatencyMs =
      this.latencyCount > 0 ? this.latencySum / this.latencyCount : 0;
    const avgReduction = Math.min(
      this.dnsLatencyReduction,
      rawAvgLatencyMs * 0.5,
    );
    const avgLatencyMs = rawAvgLatencyMs - avgReduction;

    let p99LatencyMs = 0;
    if (this.latencySamples.length > 0) {
      const sorted = [...this.latencySamples].sort((a, b) => a - b);
      const idx = Math.min(Math.floor(sorted.length * 0.99), sorted.length - 1);
      const rawP99 = sorted[idx]!;
      const p99Reduction = Math.min(this.dnsLatencyReduction, rawP99 * 0.5);
      p99LatencyMs = rawP99 - p99Reduction;
    }

    // An "error" topology issue means the design is invalid (e.g. a required
    // block is bypassed) — the level fails regardless of metrics.
    const failedByTopology = topologyWarnings.some(
      (w) => w.severity === "error",
    );

    const passed =
      !failedByTopology &&
      uptimePercent >= level.passCondition.minUptimePercent &&
      avgLatencyMs <= level.passCondition.maxAvgLatencyMs;

    const costPercent = level.budget > 0 ? (totalCost / level.budget) * 100 : 0;
    // Stars are earned one axis at a time, cumulatively — each tier adds a new
    // binding constraint rather than re-tightening every metric at once:
    //   1★ Reliability — passes the SLA (uptime + latency floor, valid topology).
    //   2★ Performance — also hits the low avg-latency target with a bounded
    //                     p99 tail, on a resilient (mostly SPOF-free) design.
    //   3★ Efficiency  — also fits a tight budget. Latency is already at the 2★
    //                     bar, so cost is what's left to optimize: this is the
    //                     gate that forces deliberate provider selection and
    //                     trimming over-provisioning. A 3★ design must also be
    //                     fully redundant (uptime ≥ 99, no single point of failure).
    // The p99 cap scales off the 2★ avg-latency target so the tail bound stays
    // reachable per level while still rejecting runs where the tail blows up.
    const perfUptime = Math.max(level.passCondition.minUptimePercent, 97);
    const efficiencyUptime = Math.max(level.passCondition.minUptimePercent, 99);
    const perfP99 =
      level.starConditions.twoStar.maxAvgLatencyMs * SIM.P99_STAR_K;
    let stars = 0;
    if (passed) {
      stars = 1;
      const hitsPerformance =
        avgLatencyMs <= level.starConditions.twoStar.maxAvgLatencyMs &&
        p99LatencyMs <= perfP99 &&
        uptimePercent >= perfUptime;
      if (hitsPerformance) {
        stars = 2;
        const hitsEfficiency =
          costPercent <= level.starConditions.threeStar.maxCostPercent &&
          uptimePercent >= efficiencyUptime;
        if (hitsEfficiency) stars = 3;
      }
    }

    const hasHardTopologyIssue = topologyWarnings.some(
      (w) => w.severity === "warn",
    );
    const starsCappedByTopology = hasHardTopologyIssue && stars > 2;
    if (starsCappedByTopology) stars = 2;
    if (failedByTopology) stars = 0;

    return {
      totalRequests: Math.round(this.totalRequests),
      successfulRequests: Math.round(this.totalRequests - this.failedRequests),
      failedRequests: Math.round(this.failedRequests),
      uptimePercent: Math.round(uptimePercent * 100) / 100,
      avgLatencyMs: Math.round(avgLatencyMs * 10) / 10,
      p99LatencyMs: Math.round(p99LatencyMs * 10) / 10,
      totalCostPerMonth: totalCost,
      stars,
      passed,
      availabilityCeiling: Math.round(this.availabilityCeiling * 100) / 100,
      spofNodes: this.spofNodes,
      topologyWarnings,
      starsCappedByTopology,
      failedByTopology,
      chaosTriggered: this.chaosTriggered,
      timeline: this.timeline,
    };
  }
}
