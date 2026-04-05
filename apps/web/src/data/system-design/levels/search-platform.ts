import type { LevelDefinition } from "~/lib/system-design/types";

export const searchPlatform: LevelDefinition = {
  slug: "search-platform",
  title: "Search Platform",
  description:
    "Power a product search feature that handles autocomplete and full-text queries. " +
    "A relational database is too slow for search — use a dedicated search engine " +
    "and cache hot queries for sub-100ms responses.",
  difficulty: "intermediate",
  budget: 200,
  durationSeconds: 60,
  trafficPattern: [
    { time: 0, rps: 1000 },
    { time: 10, rps: 3000 },
    { time: 20, rps: 6000 },
    { time: 30, rps: 8000 },
    { time: 40, rps: 5000 },
    { time: 50, rps: 3000 },
    { time: 60, rps: 1500 },
  ],
  requiredBlockTypes: ["search-engine", "app-server"],
  passCondition: {
    minUptimePercent: 96,
    maxAvgLatencyMs: 300,
  },
  starConditions: {
    oneStar: { maxCostPercent: 100, maxAvgLatencyMs: 300 },
    twoStar: { maxCostPercent: 68, maxAvgLatencyMs: 150 },
    threeStar: { maxCostPercent: 48, maxAvgLatencyMs: 60 },
  },
  hints: [
    "Elasticsearch handles full-text search much faster than SQL queries",
    "Cache popular search queries in Redis to avoid hitting Elasticsearch",
    "An API gateway can rate-limit abusive autocomplete requests",
    "Multiple app servers distribute the query processing load",
  ],
};
