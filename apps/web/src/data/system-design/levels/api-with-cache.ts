import type { LevelDefinition } from "~/lib/system-design/types";

export const apiWithCache: LevelDefinition = {
  slug: "api-with-cache",
  title: "REST API with Caching",
  description:
    "Build a read-heavy API that serves product data. The database alone can't handle peak load — " +
    "introduce a caching layer to absorb repeated reads and protect your database.",
  difficulty: "beginner",
  budget: 290,
  durationSeconds: 60,
  writeFraction: 0.1,
  trafficPattern: [
    { time: 0, rps: 800 },
    { time: 15, rps: 3000 },
    { time: 25, rps: 6000 },
    { time: 35, rps: 8000 },
    { time: 45, rps: 5000 },
    { time: 55, rps: 2000 },
    { time: 60, rps: 1500 },
  ],
  requiredBlockTypes: ["dns", "cache", "sql-db", "app-server"],
  passCondition: {
    minUptimePercent: 95,
    maxAvgLatencyMs: 250,
  },
  // Calibrated empirically (see __tests__/calibration.test.ts):
  //   3★ Cloud DNS + Traefik + Go×2 + Memcached + MySQL    ≈ $223 (77%)
  //   2★ Route 53 + Nginx + Node×4 + Redis + PostgreSQL    ≈ $285 (98%)
  starConditions: {
    twoStar: { maxCostPercent: 82, maxAvgLatencyMs: 100 },
    threeStar: { maxCostPercent: 80, maxAvgLatencyMs: 50 },
  },
  hints: [
    "Without a cache, every request hits the database directly",
    "Redis can serve 30k+ RPS with sub-millisecond latency",
    "A load balancer lets you scale app servers horizontally",
    "The cache hit ratio determines how much load reaches the DB",
  ],
};
