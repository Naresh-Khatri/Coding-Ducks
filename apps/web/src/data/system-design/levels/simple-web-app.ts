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
  trafficPattern: [
    { time: 0, rps: 100 },
    { time: 10, rps: 300 },
    { time: 20, rps: 1500 },
    { time: 30, rps: 1700 },
    { time: 40, rps: 4500 },
    { time: 45, rps: 1800 },
    { time: 50, rps: 1600 },
    { time: 60, rps: 400 },
  ],
  requiredBlockTypes: ["load-balancer", "sql-db"],
  passCondition: {
    minUptimePercent: 95,
    maxAvgLatencyMs: 500,
  },
  starConditions: {
    oneStar: { maxCostPercent: 100, maxAvgLatencyMs: 500 },
    twoStar: { maxCostPercent: 75, maxAvgLatencyMs: 250 },
    threeStar: { maxCostPercent: 52, maxAvgLatencyMs: 120 },
  },
  hints: [
    "A load balancer distributes traffic across multiple app servers",
    "Add a Redis cache in front of your database to reduce load",
    "You'll need at least 2 app servers to handle the traffic spike at 40s",
  ],
};
