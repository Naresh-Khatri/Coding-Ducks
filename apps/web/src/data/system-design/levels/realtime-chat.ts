import type { LevelDefinition } from "~/lib/system-design/types";

export const realtimeChat: LevelDefinition = {
  slug: "realtime-chat",
  title: "Realtime Chat",
  description:
    "Build a chat service where users hold long-lived connections and broadcast " +
    "messages to rooms. A streamer goes live midway and a flood of viewers joins. " +
    "You need WebSockets, pub/sub fan-out, and history persistence — all under 200ms.",
  difficulty: "intermediate",
  budget: 440,
  durationSeconds: 90,
  writeFraction: 0.08,
  trafficPattern: [
    { time: 0, rps: 500 },
    { time: 10, rps: 1500 },
    { time: 20, rps: 3000 },
    // Streamer goes live
    { time: 30, rps: 10000 },
    { time: 40, rps: 14000 },
    { time: 50, rps: 18000 },
    { time: 60, rps: 13000 },
    { time: 75, rps: 6000 },
    { time: 90, rps: 3000 },
  ],
  requiredBlockTypes: [
    "dns",
    "load-balancer",
    "websocket-server",
    "cache",
    "sql-db",
  ],
  passCondition: {
    minUptimePercent: 93,
    maxAvgLatencyMs: 150,
  },
  // Calibrated empirically (see __tests__/calibration.test.ts):
  //   3★ Cloud DNS + Traefik + Phoenix×3 + Memcached + Cloud SQL    ≈ $323 (73%)
  //   2★ Route 53 + Nginx + Socket.IO×5 + Redis + PostgreSQL×2      ≈ $450 (102%, over budget)
  starConditions: {
    twoStar: { maxCostPercent: 82, maxAvgLatencyMs: 80 },
    threeStar: { maxCostPercent: 78, maxAvgLatencyMs: 40 },
  },
  hints: [
    "WebSocket servers hold tens of thousands of long-lived connections",
    "Redis pub/sub fans out messages to subscribers without hitting the DB",
    "Multiple WebSocket replicas need pub/sub to coordinate rooms across servers",
    "Chat history goes to SQL — but route it off the hot path",
    "Latency budget is tight — keep the request path short",
  ],
};
