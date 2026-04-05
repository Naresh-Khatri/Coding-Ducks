import type { LevelDefinition } from "~/lib/system-design/types";

export const globalApi: LevelDefinition = {
  slug: "global-api",
  title: "Global API Gateway",
  description:
    "Build a globally distributed API that serves mobile and web clients across regions. " +
    "Traffic comes in waves as different time zones wake up. The API must route through " +
    "security layers, manage rate limits, and keep latency under control worldwide.",
  difficulty: "advanced",
  budget: 550,
  durationSeconds: 90,
  trafficPattern: [
    // Asia morning
    { time: 0, rps: 5000 },
    { time: 10, rps: 10000 },
    // Europe morning overlaps
    { time: 20, rps: 12000 },
    { time: 30, rps: 38000 },
    // Americas morning — global peak
    { time: 40, rps: 85000 },
    { time: 50, rps: 52000 },
    { time: 60, rps: 45000 },
    { time: 70, rps: 18000 },
    { time: 80, rps: 6000 },
    { time: 90, rps: 3000 },
  ],
  attackSpikes: [
    { time: 15, duration: 5, rps: 30000 },   // Bot scan during Asia ramp-up
    { time: 42, duration: 10, rps: 50000 },   // DDoS at global peak
  ],
  requiredBlockTypes: [
    "firewall",
    "rate-limiter",
    "api-gateway",
    "app-server",
    "sql-db",
  ],
  passCondition: {
    minUptimePercent: 93,
    maxAvgLatencyMs: 500,
  },
  starConditions: {
    oneStar: { maxCostPercent: 100, maxAvgLatencyMs: 500 },
    twoStar: { maxCostPercent: 70, maxAvgLatencyMs: 280 },
    threeStar: { maxCostPercent: 52, maxAvgLatencyMs: 120 },
  },
  hints: [
    "A firewall and rate limiter protect against abuse before traffic reaches your servers",
    "An API gateway handles routing, auth, and throttling",
    "25,000 RPS global peak requires significant compute capacity",
    "Cache reduces database pressure during the peak overlap window",
    "CDN can serve cached API responses for public endpoints",
    "The full security stack adds latency — budget for it",
  ],
};
