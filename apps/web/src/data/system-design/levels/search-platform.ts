import type { LevelDefinition } from "~/lib/system-design/types";

export const searchPlatform: LevelDefinition = {
  slug: "search-platform",
  title: "Search Platform",
  description:
    "Power a product search feature that handles autocomplete and full-text queries. " +
    "A relational database is too slow for search — use a dedicated search engine " +
    "and cache hot queries for sub-100ms responses.",
  difficulty: "intermediate",
  budget: 290,
  durationSeconds: 60,
  writeFraction: 0.03,
  trafficPattern: [
    { time: 0, rps: 1500 },
    { time: 10, rps: 5000 },
    { time: 20, rps: 10000 },
    { time: 30, rps: 14000 },
    { time: 40, rps: 9000 },
    { time: 50, rps: 5000 },
    { time: 60, rps: 2500 },
  ],
  requiredBlockTypes: ["dns", "search-engine", "app-server"],
  passCondition: {
    minUptimePercent: 96,
    maxAvgLatencyMs: 200,
  },
  // Calibrated empirically (see __tests__/calibration.test.ts):
  //   3★ Cloud DNS + Traefik + Go×2 + Memcached + Typesense×2     ≈ $228 (79%)
  //   2★ Route 53 + Nginx + Node×4 + Redis + Elasticsearch×2      ≈ $345 (over budget)
  starConditions: {
    twoStar: { maxCostPercent: 90, maxAvgLatencyMs: 90 },
    threeStar: { maxCostPercent: 82, maxAvgLatencyMs: 40 },
  },
  hints: [
    "Elasticsearch handles full-text search much faster than SQL queries",
    "Cache popular search queries in Redis to avoid hitting Elasticsearch",
    "An API gateway can rate-limit abusive autocomplete requests",
    "Multiple app servers distribute the query processing load",
  ],
};
