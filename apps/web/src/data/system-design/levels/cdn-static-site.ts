import type { LevelDefinition } from "~/lib/system-design/types";

export const cdnStaticSite: LevelDefinition = {
  slug: "cdn-static-site",
  title: "Static Site with CDN",
  description:
    "Serve a marketing website with global reach. Most requests are for static assets — " +
    "use a CDN to handle the load cheaply and keep latency low worldwide.",
  difficulty: "beginner",
  budget: 110,
  durationSeconds: 45,
  trafficPattern: [
    { time: 0, rps: 200 },
    { time: 10, rps: 800 },
    { time: 20, rps: 2000 },
    { time: 30, rps: 1200 },
    { time: 40, rps: 600 },
    { time: 45, rps: 300 },
  ],
  requiredBlockTypes: ["cdn"],
  passCondition: {
    minUptimePercent: 99,
    maxAvgLatencyMs: 200,
  },
  starConditions: {
    oneStar: { maxCostPercent: 100, maxAvgLatencyMs: 200 },
    twoStar: { maxCostPercent: 70, maxAvgLatencyMs: 80 },
    threeStar: { maxCostPercent: 50, maxAvgLatencyMs: 40 },
  },
  hints: [
    "A CDN caches static content at edge locations close to users",
    "You still need an app server behind the CDN as the origin",
    "DNS routes users to the nearest CDN edge",
  ],
};
