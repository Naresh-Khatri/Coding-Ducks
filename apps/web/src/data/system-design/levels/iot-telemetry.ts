import type { LevelDefinition } from "~/lib/system-design/types";

export const iotTelemetry: LevelDefinition = {
  slug: "iot-telemetry",
  title: "IoT Telemetry Ingestion",
  description:
    "A fleet of 30,000 IoT sensors streams readings every second. " +
    "Latency to the device is loose, but the write throughput is relentless and the dashboards expect fast range queries. " +
    "Decouple the ingestion path, aggregate over windows, and persist to storage built for time-series.",
  difficulty: "intermediate",
  budget: 560,
  durationSeconds: 90,
  writeFraction: 0.95,
  trafficPattern: [
    { time: 0, rps: 5000 },
    { time: 15, rps: 12000 },
    { time: 30, rps: 22000 },
    { time: 45, rps: 30000 },
    { time: 60, rps: 27000 },
    { time: 75, rps: 22000 },
    { time: 90, rps: 18000 },
  ],
  requiredBlockTypes: [
    "dns",
    "app-server",
    "message-queue",
    "stream-processor",
    "time-series-db",
  ],
  passCondition: {
    minUptimePercent: 90,
    maxAvgLatencyMs: 800,
  },
  // Calibrated empirically (see __tests__/calibration.test.ts):
  //   3★ Cloud DNS + Traefik + Go×4 + NATS + Kinesis + VictoriaMetrics  ≈ $378 (68%)
  //   2★ Route 53 + Nginx + Node×8 + Kafka + Kafka Streams + InfluxDB   ≈ $485 (87%)
  starConditions: {
    twoStar: { maxCostPercent: 85, maxAvgLatencyMs: 400 },
    threeStar: { maxCostPercent: 72, maxAvgLatencyMs: 150 },
  },
  hints: [
    "IoT writes are tiny and constant — a message queue smooths the ingest spikes",
    "A stream processor aggregates raw events into windowed metrics before storage",
    "Time-series DBs beat SQL for high-rate timestamped writes and range queries",
    "Latency to the device is loose — buffer in the queue instead of overprovisioning compute",
    "Pick providers by write throughput, not by user-facing latency on this level",
  ],
};
