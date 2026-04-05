import type { LevelDefinition } from "~/lib/system-design/types";

export const socialMediaFeed: LevelDefinition = {
  slug: "social-media-feed",
  title: "Social Media Feed",
  description:
    "Design the backend for a social media feed that serves personalized timelines. " +
    "Read traffic is 50x write traffic. A viral post causes a sudden spike. " +
    "You need caching, a database, and enough compute to survive the surge.",
  difficulty: "advanced",
  budget: 370,
  durationSeconds: 120,
  trafficPattern: [
    { time: 0, rps: 2000 },
    { time: 15, rps: 4000 },
    { time: 30, rps: 6000 },
    // Viral post goes off
    { time: 40, rps: 20000 },
    { time: 50, rps: 30000 },
    { time: 55, rps: 25000 },
    { time: 65, rps: 15000 },
    { time: 80, rps: 8000 },
    { time: 100, rps: 5000 },
    { time: 110, rps: 3000 },
    { time: 120, rps: 2000 },
  ],
  attackSpikes: [
    { time: 45, duration: 10, rps: 25000 },  // Bots scraping the viral post
  ],
  requiredBlockTypes: [
    "load-balancer",
    "app-server",
    "sql-db",
    "cache",
    "cdn",
  ],
  passCondition: {
    minUptimePercent: 90,
    maxAvgLatencyMs: 800,
  },
  starConditions: {
    oneStar: { maxCostPercent: 100, maxAvgLatencyMs: 800 },
    twoStar: { maxCostPercent: 70, maxAvgLatencyMs: 350 },
    threeStar: { maxCostPercent: 50, maxAvgLatencyMs: 150 },
  },
  hints: [
    "30,000 RPS peak — you need serious horizontal scaling",
    "CDN offloads static assets (profile pictures, media thumbnails)",
    "Redis is critical — without cache, the DB sees every read request",
    "Multiple load balancers or an auto-scaler can distribute the spike",
    "A rate limiter protects the system if the spike exceeds capacity",
    "Consider the cost of scaling — don't overprovision for the quiet period",
  ],
};
