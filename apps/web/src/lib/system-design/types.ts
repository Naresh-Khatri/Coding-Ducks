// --- Port & Connection Types ---
export type PortProtocol =
  | "HTTP"
  | "TCP"
  | "SQL"
  | "Redis"
  | "AMQP"
  | "S3"
  | "DNS"
  | "gRPC";

export type PortDirection = "in" | "out";

export interface BlockPort {
  id: string;
  protocol: PortProtocol;
  direction: PortDirection;
  label?: string;
}

// --- Block Category ---
export type BlockCategory =
  | "networking"
  | "compute"
  | "storage"
  | "messaging"
  | "security";

// --- Read/write typed request flow ---
export interface FlowVolume {
  read: number;
  write: number;
}

// --- Provider variant for a block type ---
export interface ProviderVariant {
  provider: string; // e.g. "Redis", "Memcached"
  costPerMonth: number;
  maxRps: number;
  maxConnections: number;
  baseLatencyMs: number;
  queueLimit?: number;
  timeoutMs?: number;
  /** Cache/CDN hit-rate override (0–1). */
  hitRate?: number;
  /** ms shaved from end-to-end latency when on the sync path (DNS edge POPs). */
  edgeLatencyReduction?: number;
  /** Fraction of attack RPS dropped before downstream (0–1). */
  attackAbsorbRate?: number;
}

// --- Block Definition (static registry entry) ---
export interface BlockDefinition {
  type: string; // abstract role: "cache", "sql-db", etc.
  label: string; // display label: "Cache", "SQL Database", etc.
  name: string; // current provider: "Redis", "PostgreSQL", etc.
  category: BlockCategory;
  description: string;
  icon: string;
  costPerMonth: number;
  ports: BlockPort[];
  maxRps: number;
  maxConnections: number;
  baseLatencyMs: number;
  routingStrategy: "round-robin" | "passthrough" | "broadcast" | "none";
  providers?: ProviderVariant[];

  // Enhanced simulation fields
  queueLimit?: number;   // max buffered requests before dropping (0 = no queue)
  hitRate?: number;       // base cache/CDN hit rate 0–1 (cooled dynamically under surge)
  timeoutMs?: number;     // request timeout threshold
  scalesReadsOnly?: boolean; // datastores: replicas add read capacity, not write
  /**
   * How this block scales horizontally:
   *  - "counter"  → in-card replica stepper (data tier: DB, cache, queue, search)
   *  - "manual"   → drop another instance on the canvas behind an LB (compute)
   *  - "managed"  → single instance, conceptually multi-AZ HA (DNS/CDN/LB/firewall/etc.)
   * Defaults to "counter" if omitted.
   */
  scaling?: "counter" | "manual" | "managed";
  /** ms shaved from end-to-end latency when on the sync path (DNS edge POPs). */
  edgeLatencyReduction?: number;
  /** Fraction of attack RPS dropped before downstream (0–1). */
  attackAbsorbRate?: number;
}

// --- Block Instance (node data on canvas) ---
export interface BlockNodeData {
  definition: BlockDefinition;
  instanceId: string;
  isStartBlock?: boolean;
  replicas: number; // horizontal scale: capacity & cost both ×replicas (default 1)
  currentRps: number;
  currentLatencyMs: number;
  loadPercent: number;
  /** Split utilization (0–100) populated only for read/write-asymmetric sinks. */
  readLoadPercent?: number;
  writeLoadPercent?: number;
  failedRequests: number;
  queueDepth: number;
  status: "idle" | "healthy" | "degraded" | "overloaded" | "failing";
  [key: string]: unknown;
}

// --- Level Definition ---
export interface TrafficDataPoint {
  time: number;
  rps: number;
  readRps?: number;
  writeRps?: number;
}

export interface StarCondition {
  maxCostPercent: number;
  maxAvgLatencyMs: number;
}

export interface AttackSpike {
  time: number;        // when the attack starts (seconds)
  duration: number;    // how long it lasts (seconds)
  rps: number;         // extra malicious RPS on top of normal traffic
}

export interface ChaosEvent {
  /** Sim time (seconds) when the failure happens. */
  time: number;
  /** Block type to degrade — first reachable matching node is hit. */
  targetType: string;
  /** Human-readable label shown in the timeline. */
  label?: string;
}

export interface LevelDefinition {
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  budget: number;
  durationSeconds: number;
  /** Fraction of traffic that is writes (0–1). Reads can be cached; writes
   *  always hit the primary datastore. Defaults to 0.1 when omitted. */
  writeFraction?: number;
  trafficPattern: TrafficDataPoint[];
  attackSpikes?: AttackSpike[];
  chaosEvents?: ChaosEvent[];
  requiredBlockTypes?: string[];
  passCondition: {
    minUptimePercent: number;
    maxAvgLatencyMs: number;
  };
  starConditions: {
    twoStar: StarCondition;
    threeStar: StarCondition;
  };
  hints?: string[];
  allowedBlockTypes?: string[];
}

// --- Simulation Results ---
export interface SimulationResults {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  uptimePercent: number;
  avgLatencyMs: number;
  p99LatencyMs: number;
  totalCostPerMonth: number;
  stars: number;
  passed: boolean;
  /** Uptime ceiling imposed by single-instance points of failure (0–100). */
  availabilityCeiling: number;
  /** Node ids that are single points of failure on the critical path. */
  spofNodes: string[];
  /** Topology issues surfaced to the player (unreachable blocks, SPOFs, etc). */
  topologyWarnings: Array<{
    id: string;
    severity: "error" | "warn" | "info";
    message: string;
  }>;
  /** True if the star count was capped due to severity:"warn" topology issues. */
  starsCappedByTopology: boolean;
  /** True if the level was failed due to a severity:"error" topology issue. */
  failedByTopology: boolean;
  /** Chaos events that fired during this run. */
  chaosTriggered?: ChaosEvent[];
  timeline: SimulationTick[];
}

export interface SimulationTick {
  time: number;
  totalRps: number;
  successfulRps: number;
  failedRps: number;
  avgLatencyMs: number;
  readRps?: number;
  writeRps?: number;
  cacheHitRate?: number; // effective (cooled) cache hit rate this tick, 0–1
  blockStats: Record<
    string,
    {
      rps: number;
      latencyMs: number;
      loadPercent: number;
      /** Split utilization (0–100) for read/write-asymmetric sinks. */
      readLoadPercent?: number;
      writeLoadPercent?: number;
      status: "idle" | "healthy" | "degraded" | "overloaded" | "failing";
      failedRps: number;
      queueDepth: number;
      timedOutRps: number;
    }
  >;
}
