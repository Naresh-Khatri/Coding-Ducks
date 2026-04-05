import type { LevelDefinition } from "~/lib/system-design/types";

export const eCommerceCheckout: LevelDefinition = {
  slug: "e-commerce-checkout",
  title: "E-Commerce Checkout",
  description:
    "Handle a flash sale for an online store. Traffic spikes 10x during the sale window. " +
    "Requests involve browsing (reads), adding to cart, and checkout (writes). " +
    "The system must stay up during the spike or you lose revenue.",
  difficulty: "intermediate",
  budget: 450,
  durationSeconds: 90,
  trafficPattern: [
    { time: 0, rps: 500 },
    { time: 10, rps: 800 },
    { time: 20, rps: 1500 },
    // Flash sale starts
    { time: 30, rps: 8000 },
    { time: 35, rps: 12000 },
    { time: 40, rps: 15000 },
    { time: 50, rps: 10000 },
    { time: 60, rps: 6000 },
    // Sale winds down
    { time: 70, rps: 3000 },
    { time: 80, rps: 1500 },
    { time: 90, rps: 800 },
  ],
  attackSpikes: [
    { time: 32, duration: 8, rps: 20000 },  // DDoS during flash sale peak
  ],
  requiredBlockTypes: ["load-balancer", "app-server", "sql-db", "cache"],
  passCondition: {
    minUptimePercent: 92,
    maxAvgLatencyMs: 600,
  },
  starConditions: {
    oneStar: { maxCostPercent: 100, maxAvgLatencyMs: 600 },
    twoStar: { maxCostPercent: 72, maxAvgLatencyMs: 300 },
    threeStar: { maxCostPercent: 52, maxAvgLatencyMs: 150 },
  },
  hints: [
    "Multiple app servers behind a load balancer can absorb the spike",
    "A cache prevents the DB from being overwhelmed during peak",
    "Consider a CDN for static product images to offload traffic",
    "A rate limiter can protect your backend during extreme spikes",
    "The flash sale spike is 15,000 RPS — plan your capacity accordingly",
    "A DDoS attack hits during peak sale — a firewall can block it entirely",
  ],
};
