import type { LevelDefinition } from "~/lib/system-design/types";

export const simpleWebApp: LevelDefinition = {
  slug: "simple-web-app",
  title: "Simple Web Application",
  description:
    "Design a basic web application that can handle moderate traffic. " +
    "Route requests through a load balancer to web servers backed by a database and cache.",
  difficulty: "beginner",
  budget: 320,
  durationSeconds: 60,
  writeFraction: 0.2,
  trafficPattern: [
    { time: 0, rps: 200 },
    { time: 10, rps: 500 },
    { time: 20, rps: 2000 },
    { time: 30, rps: 3000 },
    { time: 40, rps: 6000 },
    { time: 45, rps: 2800 },
    { time: 50, rps: 2200 },
    { time: 60, rps: 700 },
  ],
  requiredBlockTypes: ["dns", "cdn", "load-balancer", "sql-db"],
  passCondition: {
    minUptimePercent: 95,
    maxAvgLatencyMs: 300,
  },
  // Calibrated empirically (see __tests__/calibration.test.ts):
  //   3★ Cloud DNS + Cloudflare CDN + Traefik + Go×2 + Memcached + MySQL ≈ $243 (76%)
  //   2★ Route 53 + CloudFront + Nginx + Node×3 + Redis + PostgreSQL     ≈ $300 (94%)
  starConditions: {
    twoStar: { maxCostPercent: 90, maxAvgLatencyMs: 170 },
    threeStar: { maxCostPercent: 80, maxAvgLatencyMs: 90 },
  },
  hints: [
    "A load balancer distributes traffic across multiple app servers",
    "Add a Redis cache in front of your database to reduce load",
    "You'll need at least 2 app servers to handle the traffic spike at 40s",
  ],
};
