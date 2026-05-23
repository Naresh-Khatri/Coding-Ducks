import type { LevelDefinition } from "~/lib/system-design/types";

export const globalApi: LevelDefinition = {
  slug: "global-api",
  title: "Global API Gateway",
  description:
    "Build a globally distributed API that serves mobile and web clients across regions. " +
    "Traffic comes in waves as different time zones wake up. The API must route through " +
    "security layers, manage rate limits, and keep latency under control worldwide.",
  difficulty: "advanced",
  budget: 1080,
  durationSeconds: 90,
  writeFraction: 0.2,
  trafficPattern: [
    // Asia morning
    { time: 0, rps: 4000 },
    { time: 10, rps: 8000 },
    // Europe morning overlaps
    { time: 20, rps: 12000 },
    { time: 30, rps: 28000 },
    // Americas morning — global peak
    { time: 40, rps: 55000 },
    { time: 50, rps: 38000 },
    { time: 60, rps: 30000 },
    { time: 70, rps: 14000 },
    { time: 80, rps: 6000 },
    { time: 90, rps: 3000 },
  ],
  attackSpikes: [
    { time: 15, duration: 5, rps: 30000 },   // Bot scan during Asia ramp-up
    { time: 42, duration: 10, rps: 50000 },   // DDoS at global peak
  ],
  requiredBlockTypes: [
    "dns",
    "cdn",
    "firewall",
    "rate-limiter",
    "api-gateway",
    "app-server",
    "sql-db",
  ],
  chaosEvents: [
    { time: 30, targetType: "api-gateway", label: "Gateway AZ failover" },
  ],
  passCondition: {
    minUptimePercent: 93,
    maxAvgLatencyMs: 300,
  },
  // Calibrated empirically (see __tests__/calibration.test.ts):
  //   3★ Azure DNS + Cloudflare WAF + rate-limiter + CloudFront + Kong + Nginx + Go×7 + Dragonfly + Aurora×2 ≈ $823 (76%)
  //   2★ Azure DNS + AWS WAF + rate-limiter + CloudFront + AWS API GW + Nginx + Node×20 + Redis + Aurora×2   ≈ $1143 (106%, over budget)
  starConditions: {
    twoStar: { maxCostPercent: 90, maxAvgLatencyMs: 150 },
    threeStar: { maxCostPercent: 80, maxAvgLatencyMs: 80 },
  },
  hints: [
    "A firewall and rate limiter protect against abuse before traffic reaches your servers",
    "An API gateway handles routing, auth, and throttling",
    "55,000 RPS at global peak — you need serious compute capacity",
    "Cache reduces database pressure during the peak overlap window",
    "CDN can serve cached API responses for public endpoints",
    "The full security stack adds latency — budget for it",
    "At t=30 an API gateway AZ goes down — half its capacity disappears mid-attack",
  ],
};
