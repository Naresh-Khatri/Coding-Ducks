import type { LevelDefinition } from "~/lib/system-design/types";

export const cdnStaticSite: LevelDefinition = {
  slug: "cdn-static-site",
  title: "Static Site with CDN",
  description:
    "Serve a marketing website with global reach. Most requests are for static assets — " +
    "use a CDN to handle the load cheaply and keep latency low worldwide.",
  difficulty: "beginner",
  budget: 60,
  durationSeconds: 45,
  writeFraction: 0.02,
  // Calibrated empirically (see __tests__/calibration.test.ts):
  //   3★ Cloud DNS + Cloudflare CDN + R2 origin   ≈ $33 (55%)
  //   2★ Route 53 + CloudFront + S3 (defaults)    ≈ $75 (125%, over budget)
  trafficPattern: [
    { time: 0, rps: 3000 },
    { time: 10, rps: 12000 },
    { time: 20, rps: 30000 },
    { time: 30, rps: 18000 },
    { time: 40, rps: 9000 },
    { time: 45, rps: 5000 },
  ],
  requiredBlockTypes: ["dns", "cdn"],
  passCondition: {
    minUptimePercent: 96,
    maxAvgLatencyMs: 120,
  },
  starConditions: {
    twoStar: { maxCostPercent: 90, maxAvgLatencyMs: 50 },
    threeStar: { maxCostPercent: 60, maxAvgLatencyMs: 25 },
  },
  hints: [
    "A CDN caches static content at edge locations close to users",
    "The CDN still needs an origin — object storage works great for static files, an app server works for dynamic pages",
    "DNS routes users to the nearest CDN edge",
  ],
};
