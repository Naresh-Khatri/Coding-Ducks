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

// --- Latency curve type ---
export type LatencyCurve = "flat" | "quadratic" | "cubic";

// --- Provider variant for a block type ---
export interface ProviderVariant {
  provider: string; // e.g. "Redis", "Memcached"
  costPerMonth: number;
  maxRps: number;
  maxConnections: number;
  baseLatencyMs: number;
  queueLimit?: number;
  timeoutMs?: number;
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
  latencyCurve?: LatencyCurve;
  queueLimit?: number;   // max buffered requests before dropping (0 = no queue)
  hitRate?: number;       // cache/CDN hit rate 0–1
  timeoutMs?: number;     // request timeout threshold
}

// --- Block Instance (node data on canvas) ---
export interface BlockNodeData {
  definition: BlockDefinition;
  instanceId: string;
  isStartBlock?: boolean;
  currentRps: number;
  currentLatencyMs: number;
  loadPercent: number;
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

export interface LevelDefinition {
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  budget: number;
  durationSeconds: number;
  trafficPattern: TrafficDataPoint[];
  attackSpikes?: AttackSpike[];
  requiredBlockTypes?: string[];
  passCondition: {
    minUptimePercent: number;
    maxAvgLatencyMs: number;
  };
  starConditions: {
    oneStar: StarCondition;
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
  timeline: SimulationTick[];
}

export interface SimulationTick {
  time: number;
  totalRps: number;
  successfulRps: number;
  failedRps: number;
  avgLatencyMs: number;
  blockStats: Record<
    string,
    {
      rps: number;
      latencyMs: number;
      loadPercent: number;
      status: "idle" | "healthy" | "degraded" | "overloaded" | "failing";
      failedRps: number;
      queueDepth: number;
      timedOutRps: number;
    }
  >;
}
