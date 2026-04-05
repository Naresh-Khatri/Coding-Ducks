import type { LevelDefinition } from "~/lib/system-design/types";

export const asyncProcessing: LevelDefinition = {
  slug: "async-processing",
  title: "Async Job Processing",
  description:
    "Build an image upload service where users submit images that need background processing. " +
    "The API must respond quickly while heavy processing happens asynchronously via a message queue.",
  difficulty: "intermediate",
  budget: 200,
  durationSeconds: 75,
  trafficPattern: [
    { time: 0, rps: 300 },
    { time: 10, rps: 1000 },
    { time: 20, rps: 2500 },
    { time: 30, rps: 4000 },
    { time: 40, rps: 5000 },
    { time: 50, rps: 3500 },
    { time: 60, rps: 2000 },
    { time: 70, rps: 1000 },
    { time: 75, rps: 500 },
  ],
  requiredBlockTypes: ["app-server", "message-queue", "object-storage"],
  passCondition: {
    minUptimePercent: 95,
    maxAvgLatencyMs: 500,
  },
  starConditions: {
    oneStar: { maxCostPercent: 100, maxAvgLatencyMs: 500 },
    twoStar: { maxCostPercent: 70, maxAvgLatencyMs: 250 },
    threeStar: { maxCostPercent: 48, maxAvgLatencyMs: 120 },
  },
  hints: [
    "A message queue decouples the API from slow processing work",
    "Object storage (S3) is where uploaded files should be persisted",
    "The app server should enqueue jobs, not process them inline",
    "Multiple app servers behind a load balancer handle upload spikes",
    "RabbitMQ or Kafka can buffer jobs when workers are busy",
  ],
};
