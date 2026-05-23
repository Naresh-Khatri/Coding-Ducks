import type { LevelDefinition } from "~/lib/system-design/types";

export const socialMediaFeed: LevelDefinition = {
  slug: "social-media-feed",
  title: "Social Media Feed",
  description:
    "Design the backend for a social media feed that serves personalized timelines. " +
    "Read traffic is 50x write traffic. A viral post causes a sudden spike. " +
    "You need caching, a database, and enough compute to survive the surge.",
  difficulty: "advanced",
  budget: 720,
  durationSeconds: 120,
  writeFraction: 0.04,
  trafficPattern: [
    { time: 0, rps: 3000 },
    { time: 15, rps: 7000 },
    { time: 30, rps: 11000 },
    // Viral post goes off
    { time: 40, rps: 32000 },
    { time: 50, rps: 50000 },
    { time: 55, rps: 42000 },
    { time: 65, rps: 25000 },
    { time: 80, rps: 13000 },
    { time: 100, rps: 8000 },
    { time: 110, rps: 5000 },
    { time: 120, rps: 3000 },
  ],
  attackSpikes: [
    { time: 45, duration: 10, rps: 40000 },  // Bots scraping the viral post
  ],
  chaosEvents: [
    { time: 60, targetType: "app-server", label: "App server lost during surge" },
  ],
  requiredBlockTypes: [
    "dns",
    "cdn",
    "load-balancer",
    "app-server",
    "sql-db",
    "cache",
  ],
  passCondition: {
    minUptimePercent: 90,
    maxAvgLatencyMs: 400,
  },
  // Calibrated empirically (see __tests__/calibration.test.ts):
  //   3★ Cloud DNS + Cloudflare WAF + Cloudflare CDN + Traefik + Go×5 + Dragonfly + Aurora ≈ $493 (68%)
  //   2★ Route 53 + CloudFront + Nginx + Node×16 + Redis + PostgreSQL                      ≈ $755 (105%, over budget)
  starConditions: {
    twoStar: { maxCostPercent: 85, maxAvgLatencyMs: 200 },
    threeStar: { maxCostPercent: 75, maxAvgLatencyMs: 90 },
  },
  hints: [
    "50,000 RPS peak — add app-server replicas behind a load balancer to scale capacity",
    "CDN offloads static assets (profile pictures, media thumbnails)",
    "Redis is critical — without cache, the DB sees every read request",
    "App-server replicas need a load balancer upstream to distribute traffic",
    "A rate limiter protects the system if the spike exceeds capacity",
    "Consider the cost of scaling — don't overprovision for the quiet period",
    "An app server crashes at t=60 — design for N+1 capacity, not exact-fit",
  ],
};
