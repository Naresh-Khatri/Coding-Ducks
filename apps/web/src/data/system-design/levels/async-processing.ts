import type { LevelDefinition } from "~/lib/system-design/types";

export const asyncProcessing: LevelDefinition = {
  slug: "async-processing",
  title: "Async Job Processing",
  description:
    "Build an image upload service where users submit images that need background processing. " +
    "The API must respond quickly while heavy processing happens asynchronously via a message queue.",
  difficulty: "intermediate",
  budget: 240,
  durationSeconds: 75,
  writeFraction: 0.85,
  trafficPattern: [
    { time: 0, rps: 500 },
    { time: 10, rps: 2000 },
    { time: 20, rps: 4500 },
    { time: 30, rps: 7000 },
    { time: 40, rps: 9000 },
    { time: 50, rps: 6000 },
    { time: 60, rps: 3500 },
    { time: 70, rps: 1500 },
    { time: 75, rps: 800 },
  ],
  requiredBlockTypes: [
    "dns",
    "app-server",
    "message-queue",
    "worker",
    "object-storage",
  ],
  passCondition: {
    minUptimePercent: 95,
    maxAvgLatencyMs: 300,
  },
  // Calibrated empirically (see __tests__/calibration.test.ts):
  //   3★ Cloud DNS + Traefik + Go×2 + NATS + Lambda×2 + R2       ≈ $198 (83%)
  //   2★ Route 53 + Nginx + Node×4 + RabbitMQ + Celery×6 + S3    ≈ $370 (154%, over budget)
  starConditions: {
    twoStar: { maxCostPercent: 90, maxAvgLatencyMs: 150 },
    threeStar: { maxCostPercent: 85, maxAvgLatencyMs: 70 },
  },
  hints: [
    "A message queue decouples the API from slow processing work",
    "Object storage (S3) is where uploaded files should be persisted",
    "The app server should enqueue jobs, not process them inline",
    "Multiple app servers behind a load balancer handle upload spikes",
    "RabbitMQ or Kafka can buffer jobs when workers are busy",
  ],
};
