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
  trafficPattern: [
    { time: 0, rps: 500 },
    { time: 15, rps: 1500 },
    { time: 25, rps: 3000 },
    { time: 35, rps: 4000 },
    { time: 45, rps: 2500 },
    { time: 55, rps: 1000 },
    { time: 60, rps: 800 },
  ],
  requiredBlockTypes: ["cache", "sql-db", "app-server"],
  passCondition: {
    minUptimePercent: 95,
    maxAvgLatencyMs: 400,
  },
  starConditions: {
    oneStar: { maxCostPercent: 100, maxAvgLatencyMs: 400 },
    twoStar: { maxCostPercent: 72, maxAvgLatencyMs: 180 },
    threeStar: { maxCostPercent: 52, maxAvgLatencyMs: 80 },
  },
  hints: [
    "Without a cache, every request hits the database directly",
    "Redis can serve 30k+ RPS with sub-millisecond latency",
    "A load balancer lets you scale app servers horizontally",
    "The cache hit ratio determines how much load reaches the DB",
  ],
};
