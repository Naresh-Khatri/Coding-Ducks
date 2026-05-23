import type { LevelDefinition } from "~/lib/system-design/types";

export const eCommerceCheckout: LevelDefinition = {
  slug: "e-commerce-checkout",
  title: "E-Commerce Checkout",
  description:
    "Handle a flash sale for an online store. Traffic spikes 10x during the sale window. " +
    "Requests involve browsing (reads), adding to cart, and checkout (writes). " +
    "The system must stay up during the spike or you lose revenue.",
  difficulty: "intermediate",
  budget: 640,
  durationSeconds: 90,
  writeFraction: 0.22,
  trafficPattern: [
    { time: 0, rps: 800 },
    { time: 10, rps: 1500 },
    { time: 20, rps: 3000 },
    // Flash sale starts
    { time: 30, rps: 14000 },
    { time: 35, rps: 20000 },
    { time: 40, rps: 26000 },
    { time: 50, rps: 17000 },
    { time: 60, rps: 9000 },
    // Sale winds down
    { time: 70, rps: 4500 },
    { time: 80, rps: 2200 },
    { time: 90, rps: 1200 },
  ],
  attackSpikes: [
    { time: 32, duration: 8, rps: 35000 }, // DDoS during flash sale peak
  ],
  chaosEvents: [
    { time: 45, targetType: "cache", label: "Cache node failure mid-sale" },
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
    minUptimePercent: 92,
    maxAvgLatencyMs: 350,
  },
  // Calibrated empirically (see __tests__/calibration.test.ts):
  //   3★ Cloud DNS + Cloudflare WAF + Cloudflare CDN + Traefik + Go×4 + Memcached×2 + Aurora ≈ $453 (71%)
  //   2★ Route 53 + AWS WAF + CloudFront + Nginx + Node×8 + Redis×2 + Aurora               ≈ $570 (89%)
  starConditions: {
    twoStar: { maxCostPercent: 82, maxAvgLatencyMs: 180 },
    threeStar: { maxCostPercent: 75, maxAvgLatencyMs: 90 },
  },
  hints: [
    "Multiple app servers behind a load balancer can absorb the spike",
    "A cache prevents the DB from being overwhelmed during peak",
    "Consider a CDN for static product images to offload traffic",
    "A rate limiter can protect your backend during extreme spikes",
    "The flash sale spike is 15,000 RPS — plan your capacity accordingly",
    "A DDoS attack hits during peak sale — a firewall can block it entirely",
    "A cache node will fail mid-sale at t=45 — keep at least 2 cache replicas to survive",
  ],
};
