/**
 * Calibration test suite — keeps every level beatable-but-hard.
 *
 * For each level we run three reference designs through the REAL simulation
 * engine (via the harness) and assert the separate-axis star model holds:
 *
 *   • optimal — a provider-optimised, right-sized topology  ⇒ 3★ (minStars ≥ 3)
 *   • naive   — defaults / over-provisioned, works but pricey ⇒ passes, maxStars ≤ 2
 *   • broken  — missing or undersized critical path           ⇒ fails (0★)
 *
 * The 3★ gate is cost-bound on purpose: beating a level outright is easy, but
 * the third star forces the player to swap in cheaper, better-fit providers
 * and trim replicas. If a level or the engine drifts, one of these flips and
 * the test goes red.
 *
 * Run with:
 *   node --test --import ./src/lib/system-design/__tests__/_loader.mjs \
 *     src/lib/system-design/__tests__/calibration.test.ts
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import type { LevelDefinition } from "../types.ts";
import type { DesignSpec } from "./harness.ts";
import { apiWithCache } from "../../../data/system-design/levels/api-with-cache.ts";
import { asyncProcessing } from "../../../data/system-design/levels/async-processing.ts";
import { cdnStaticSite } from "../../../data/system-design/levels/cdn-static-site.ts";
import { eCommerceCheckout } from "../../../data/system-design/levels/e-commerce-checkout.ts";
import { globalApi } from "../../../data/system-design/levels/global-api.ts";
import { iotTelemetry } from "../../../data/system-design/levels/iot-telemetry.ts";
import { realtimeChat } from "../../../data/system-design/levels/realtime-chat.ts";
import { searchPlatform } from "../../../data/system-design/levels/search-platform.ts";
import { simpleWebApp } from "../../../data/system-design/levels/simple-web-app.ts";
import { socialMediaFeed } from "../../../data/system-design/levels/social-media-feed.ts";
import { score } from "./harness.ts";

// Averaged over enough runs to smooth the engine's RNG (chaos/attack jitter).
const RUNS = 15;

interface LevelCase {
  level: LevelDefinition;
  optimal: DesignSpec;
  naive: DesignSpec;
  broken: DesignSpec;
}

const cases: LevelCase[] = [
  // ── L1 Static Site with CDN ───────────────────────────────────────────────
  {
    level: cdnStaticSite,
    optimal: {
      blocks: {
        dns: { type: "dns", provider: "Cloud DNS" },
        cdn: { type: "cdn", provider: "Cloudflare" },
        o: { type: "object-storage", provider: "R2" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "cdn"],
        ["cdn", "o"],
      ],
    },
    naive: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        cdn: { type: "cdn", provider: "CloudFront" },
        o: { type: "object-storage", provider: "S3" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "cdn"],
        ["cdn", "o"],
      ],
    },
    // CDN present but bypassed — required block carries no traffic.
    broken: {
      blocks: {
        dns: { type: "dns", provider: "Cloud DNS" },
        cdn: { type: "cdn", provider: "Cloudflare" },
        o: { type: "object-storage", provider: "R2" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "o"],
      ],
    },
  },

  // ── L2 Simple Web Application ─────────────────────────────────────────────
  {
    level: simpleWebApp,
    optimal: {
      blocks: {
        dns: { type: "dns", provider: "Cloud DNS" },
        cdn: { type: "cdn", provider: "Cloudflare" },
        lb: { type: "load-balancer", provider: "Traefik" },
        app: { type: "app-server", provider: "Go", replicas: 2 },
        cache: { type: "cache", provider: "Memcached" },
        db: { type: "sql-db", provider: "MySQL" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "cdn"],
        ["cdn", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "db", "SQL"],
      ],
    },
    naive: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        cdn: { type: "cdn", provider: "CloudFront" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 3 },
        cache: { type: "cache", provider: "Redis" },
        db: { type: "sql-db", provider: "PostgreSQL" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "cdn"],
        ["cdn", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "db", "SQL"],
      ],
    },
    // DB present but never written to.
    broken: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        cdn: { type: "cdn", provider: "CloudFront" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 2 },
        db: { type: "sql-db", provider: "PostgreSQL" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "cdn"],
        ["cdn", "lb"],
        ["lb", "app"],
      ],
    },
  },

  // ── L3 REST API with Caching ──────────────────────────────────────────────
  {
    level: apiWithCache,
    optimal: {
      blocks: {
        dns: { type: "dns", provider: "Cloud DNS" },
        lb: { type: "load-balancer", provider: "Traefik" },
        app: { type: "app-server", provider: "Go", replicas: 2 },
        cache: { type: "cache", provider: "Memcached" },
        db: { type: "sql-db", provider: "MySQL" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "db", "SQL"],
      ],
    },
    naive: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 4 },
        cache: { type: "cache", provider: "Redis" },
        db: { type: "sql-db", provider: "PostgreSQL" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "db", "SQL"],
      ],
    },
    // No cache on the path → DB saturates and the required cache stays idle.
    broken: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 1 },
        cache: { type: "cache", provider: "Redis" },
        db: { type: "sql-db", provider: "PostgreSQL" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "db", "SQL"],
      ],
    },
  },

  // ── L4 E-Commerce Checkout ────────────────────────────────────────────────
  {
    level: eCommerceCheckout,
    optimal: {
      blocks: {
        dns: { type: "dns", provider: "Cloud DNS" },
        fw: { type: "firewall", provider: "Cloudflare WAF" },
        cdn: { type: "cdn", provider: "Cloudflare" },
        lb: { type: "load-balancer", provider: "Traefik" },
        app: { type: "app-server", provider: "Go", replicas: 4 },
        cache: { type: "cache", provider: "Memcached", replicas: 2 },
        db: { type: "sql-db", provider: "Aurora" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "fw"],
        ["fw", "cdn"],
        ["cdn", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "db", "SQL"],
      ],
    },
    naive: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        fw: { type: "firewall", provider: "AWS WAF" },
        cdn: { type: "cdn", provider: "CloudFront" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 8 },
        cache: { type: "cache", provider: "Redis", replicas: 2 },
        db: { type: "sql-db", provider: "Aurora" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "fw"],
        ["fw", "cdn"],
        ["cdn", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "db", "SQL"],
      ],
    },
    broken: {
      blocks: {
        dns: { type: "dns", provider: "Cloud DNS" },
        fw: { type: "firewall", provider: "Cloudflare WAF" },
        cdn: { type: "cdn", provider: "Cloudflare" },
        lb: { type: "load-balancer", provider: "Traefik" },
        app: { type: "app-server", provider: "Go", replicas: 4 },
        cache: { type: "cache", provider: "Memcached", replicas: 2 },
        db: { type: "sql-db", provider: "Aurora" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "fw"],
        ["fw", "cdn"],
        ["cdn", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
      ],
    },
  },

  // ── L5 Async Job Processing ───────────────────────────────────────────────
  {
    level: asyncProcessing,
    optimal: {
      blocks: {
        dns: { type: "dns", provider: "Cloud DNS" },
        lb: { type: "load-balancer", provider: "Traefik" },
        app: { type: "app-server", provider: "Go", replicas: 2 },
        mq: { type: "message-queue", provider: "NATS" },
        worker: { type: "worker", provider: "Lambda", replicas: 2 },
        obj: { type: "object-storage", provider: "R2" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "mq", "AMQP"],
        ["mq", "worker", "AMQP"],
        ["worker", "obj", "S3"],
      ],
    },
    naive: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 4 },
        mq: { type: "message-queue", provider: "RabbitMQ" },
        worker: { type: "worker", provider: "Celery", replicas: 6 },
        obj: { type: "object-storage", provider: "S3" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "mq", "AMQP"],
        ["mq", "worker", "AMQP"],
        ["worker", "obj", "S3"],
      ],
    },
    // Single app + single worker — both saturate, jobs back up, uptime collapses.
    broken: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 1 },
        mq: { type: "message-queue", provider: "RabbitMQ" },
        worker: { type: "worker", provider: "Celery", replicas: 1 },
        obj: { type: "object-storage", provider: "S3" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "mq", "AMQP"],
        ["mq", "worker", "AMQP"],
        ["worker", "obj", "S3"],
      ],
    },
  },

  // ── L6 Search Platform ────────────────────────────────────────────────────
  {
    level: searchPlatform,
    optimal: {
      blocks: {
        dns: { type: "dns", provider: "Cloud DNS" },
        lb: { type: "load-balancer", provider: "Traefik" },
        app: { type: "app-server", provider: "Go", replicas: 2 },
        cache: { type: "cache", provider: "Memcached" },
        search: { type: "search-engine", provider: "Typesense", replicas: 2 },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "search", "SQL"],
      ],
    },
    naive: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 4 },
        cache: { type: "cache", provider: "Redis" },
        search: {
          type: "search-engine",
          provider: "Elasticsearch",
          replicas: 2,
        },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "search", "SQL"],
      ],
    },
    // No cache, single app, single search node — search saturates.
    broken: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 1 },
        search: {
          type: "search-engine",
          provider: "Elasticsearch",
          replicas: 1,
        },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "search", "SQL"],
      ],
    },
  },

  // ── L7 Realtime Chat ──────────────────────────────────────────────────────
  {
    level: realtimeChat,
    optimal: {
      blocks: {
        dns: { type: "dns", provider: "Cloud DNS" },
        lb: { type: "load-balancer", provider: "Traefik" },
        ws: { type: "websocket-server", provider: "Phoenix", replicas: 3 },
        cache: { type: "cache", provider: "Memcached" },
        db: { type: "sql-db", provider: "Cloud SQL" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "ws"],
        ["ws", "cache", "Redis"],
        ["ws", "db", "SQL"],
      ],
    },
    naive: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        lb: { type: "load-balancer", provider: "Nginx" },
        ws: { type: "websocket-server", provider: "Socket.IO", replicas: 5 },
        cache: { type: "cache", provider: "Redis" },
        db: { type: "sql-db", provider: "PostgreSQL", replicas: 2 },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "ws"],
        ["ws", "cache", "Redis"],
        ["ws", "db", "SQL"],
      ],
    },
    // Single WS replica — SPOF and capacity-starved during the streamer surge.
    broken: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        lb: { type: "load-balancer", provider: "Nginx" },
        ws: { type: "websocket-server", provider: "Socket.IO", replicas: 1 },
        cache: { type: "cache", provider: "Redis" },
        db: { type: "sql-db", provider: "PostgreSQL" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "ws"],
        ["ws", "cache", "Redis"],
        ["ws", "db", "SQL"],
      ],
    },
  },

  // ── L8 IoT Telemetry Ingestion ────────────────────────────────────────────
  {
    level: iotTelemetry,
    optimal: {
      blocks: {
        dns: { type: "dns", provider: "Cloud DNS" },
        lb: { type: "load-balancer", provider: "Traefik" },
        app: { type: "app-server", provider: "Go", replicas: 4 },
        mq: { type: "message-queue", provider: "NATS" },
        stream: { type: "stream-processor", provider: "Kinesis" },
        tsdb: { type: "time-series-db", provider: "VictoriaMetrics" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "mq", "AMQP"],
        ["mq", "stream", "AMQP"],
        ["stream", "tsdb", "SQL"],
      ],
    },
    naive: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 8 },
        mq: { type: "message-queue", provider: "Kafka" },
        stream: { type: "stream-processor", provider: "Kafka Streams" },
        tsdb: { type: "time-series-db", provider: "InfluxDB" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "mq", "AMQP"],
        ["mq", "stream", "AMQP"],
        ["stream", "tsdb", "SQL"],
      ],
    },
    // Undersized ingest + cheap low-throughput TSDB — writes overflow everywhere.
    broken: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 1 },
        mq: { type: "message-queue", provider: "RabbitMQ" },
        stream: { type: "stream-processor", provider: "Kinesis" },
        tsdb: { type: "time-series-db", provider: "Prometheus" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "lb"],
        ["lb", "app"],
        ["app", "mq", "AMQP"],
        ["mq", "stream", "AMQP"],
        ["stream", "tsdb", "SQL"],
      ],
    },
  },

  // ── L9 Social Media Feed ──────────────────────────────────────────────────
  {
    level: socialMediaFeed,
    optimal: {
      blocks: {
        dns: { type: "dns", provider: "Cloud DNS" },
        fw: { type: "firewall", provider: "Cloudflare WAF" },
        cdn: { type: "cdn", provider: "Cloudflare" },
        lb: { type: "load-balancer", provider: "Traefik" },
        app: { type: "app-server", provider: "Go", replicas: 5 },
        cache: { type: "cache", provider: "Dragonfly" },
        db: { type: "sql-db", provider: "Aurora" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "fw"],
        ["fw", "cdn"],
        ["cdn", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "db", "SQL"],
      ],
    },
    naive: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        cdn: { type: "cdn", provider: "CloudFront" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 16 },
        cache: { type: "cache", provider: "Redis" },
        db: { type: "sql-db", provider: "PostgreSQL" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "cdn"],
        ["cdn", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "db", "SQL"],
      ],
    },
    // Cache present but bypassed — DB sees every read and required cache idles.
    broken: {
      blocks: {
        dns: { type: "dns", provider: "Route 53" },
        cdn: { type: "cdn", provider: "CloudFront" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 4 },
        cache: { type: "cache", provider: "Redis" },
        db: { type: "sql-db", provider: "PostgreSQL" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "cdn"],
        ["cdn", "lb"],
        ["lb", "app"],
        ["app", "db", "SQL"],
      ],
    },
  },

  // ── L10 Global API Gateway ────────────────────────────────────────────────
  {
    level: globalApi,
    optimal: {
      blocks: {
        dns: { type: "dns", provider: "Azure DNS" },
        fw: { type: "firewall", provider: "Cloudflare WAF" },
        rl: { type: "rate-limiter" },
        cdn: { type: "cdn", provider: "CloudFront" },
        gw: { type: "api-gateway", provider: "Kong" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Go", replicas: 7 },
        cache: { type: "cache", provider: "Dragonfly" },
        db1: { type: "sql-db", provider: "Aurora" },
        db2: { type: "sql-db", provider: "Aurora" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "fw"],
        ["fw", "rl"],
        ["rl", "cdn"],
        ["cdn", "gw"],
        ["gw", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "db1", "SQL"],
        ["app", "db2", "SQL"],
      ],
    },
    naive: {
      blocks: {
        dns: { type: "dns", provider: "Azure DNS" },
        fw: { type: "firewall", provider: "AWS WAF" },
        rl: { type: "rate-limiter" },
        cdn: { type: "cdn", provider: "CloudFront" },
        gw: { type: "api-gateway", provider: "AWS API GW" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Node.js", replicas: 20 },
        cache: { type: "cache", provider: "Redis" },
        db1: { type: "sql-db", provider: "Aurora" },
        db2: { type: "sql-db", provider: "Aurora" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "fw"],
        ["fw", "rl"],
        ["rl", "cdn"],
        ["cdn", "gw"],
        ["gw", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
        ["app", "db1", "SQL"],
        ["app", "db2", "SQL"],
      ],
    },
    // DB present but never written to — required block carries no traffic.
    broken: {
      blocks: {
        dns: { type: "dns", provider: "Azure DNS" },
        fw: { type: "firewall", provider: "Cloudflare WAF" },
        rl: { type: "rate-limiter" },
        cdn: { type: "cdn", provider: "CloudFront" },
        gw: { type: "api-gateway", provider: "Kong" },
        lb: { type: "load-balancer", provider: "Nginx" },
        app: { type: "app-server", provider: "Go", replicas: 7 },
        cache: { type: "cache", provider: "Dragonfly" },
        db: { type: "sql-db", provider: "Aurora" },
      },
      edges: [
        ["traffic-source", "dns"],
        ["dns", "fw"],
        ["fw", "rl"],
        ["rl", "cdn"],
        ["cdn", "gw"],
        ["gw", "lb"],
        ["lb", "app"],
        ["app", "cache", "Redis"],
      ],
    },
  },
];

for (const { level, optimal, naive, broken } of cases) {
  describe(`${level.slug} (budget $${level.budget})`, () => {
    it("optimal design earns 3★", () => {
      const s = score(level, optimal, RUNS);
      assert.equal(
        s.minStars,
        3,
        `expected 3★ but got ${s.minStars}-${s.maxStars}★ ` +
          `[$${s.costPerMonth} (${s.costPercent}%), up=${s.uptimePercent}%, ` +
          `avg=${s.avgLatencyMs}ms, p99=${s.p99LatencyMs}ms] ` +
          `${s.warnings.join(" | ")}`,
      );
    });

    it("naive design passes but caps at ≤2★", () => {
      const s = score(level, naive, RUNS);
      assert.ok(
        s.passed,
        `expected naive design to pass but it failed ` +
          `[up=${s.uptimePercent}%, avg=${s.avgLatencyMs}ms] ${s.warnings.join(" | ")}`,
      );
      assert.ok(
        s.maxStars <= 2,
        `expected ≤2★ but naive design hit ${s.maxStars}★ ` +
          `[$${s.costPerMonth} (${s.costPercent}%)] — the 3★ gate is too loose`,
      );
    });

    it("broken design fails the level", () => {
      const s = score(level, broken, RUNS);
      assert.ok(
        !s.passed,
        `expected broken design to fail but it passed with ${s.stars}★ ` +
          `[up=${s.uptimePercent}%, avg=${s.avgLatencyMs}ms]`,
      );
    });
  });
}
