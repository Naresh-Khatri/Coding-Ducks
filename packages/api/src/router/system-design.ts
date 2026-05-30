import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod/v4";

import { systemDesignAttempt } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/);

const savedNodeSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.string().min(1).max(32).optional(),
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  data: z.object({
    definitionType: z.string().min(1).max(64),
    provider: z.string().min(1).max(64),
    replicas: z.number().int().min(1).max(20).optional(),
  }),
});

const savedEdgeSchema = z.object({
  id: z.string().min(1).max(128),
  source: z.string().min(1).max(64),
  target: z.string().min(1).max(64),
  sourceHandle: z.string().max(64).nullable(),
  targetHandle: z.string().max(64).nullable(),
});

const graphSchema = z.object({
  nodes: z.array(savedNodeSchema).max(200),
  edges: z.array(savedEdgeSchema).max(400),
});

export const systemDesignRouter = createTRPCRouter({
  saveAttempt: protectedProcedure
    .input(
      z.object({
        levelSlug: slugSchema,
        graph: graphSchema,
        uptimePercent: z.number().finite().min(0).max(100),
        avgLatencyMs: z.number().finite().min(0).max(60_000),
        totalCost: z.number().finite().min(0).max(1_000_000),
        stars: z.number().int().min(0).max(3),
        passed: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [attempt] = await ctx.db
        .insert(systemDesignAttempt)
        .values({
          userId: ctx.session.user.id,
          levelSlug: input.levelSlug,
          graph: input.graph,
          uptimePercent: Math.round(input.uptimePercent * 100),
          avgLatencyMs: Math.round(input.avgLatencyMs),
          totalCost: Math.round(input.totalCost * 100),
          stars: input.stars,
          passed: input.passed ? 1 : 0,
        })
        .returning();
      return attempt;
    }),

  myProgress: protectedProcedure.query(async ({ ctx }) => {
    const attempts = await ctx.db
      .select()
      .from(systemDesignAttempt)
      .where(eq(systemDesignAttempt.userId, ctx.session.user.id))
      .orderBy(
        desc(systemDesignAttempt.stars),
        desc(systemDesignAttempt.uptimePercent),
      );

    const best: Record<string, (typeof attempts)[0]> = {};
    for (const a of attempts) {
      if (!best[a.levelSlug]) best[a.levelSlug] = a;
    }
    return best;
  }),

  bestAttempt: protectedProcedure
    .input(z.object({ levelSlug: slugSchema }))
    .query(async ({ ctx, input }) => {
      const [best] = await ctx.db
        .select()
        .from(systemDesignAttempt)
        .where(
          and(
            eq(systemDesignAttempt.userId, ctx.session.user.id),
            eq(systemDesignAttempt.levelSlug, input.levelSlug),
          ),
        )
        .orderBy(
          desc(systemDesignAttempt.stars),
          desc(systemDesignAttempt.uptimePercent),
        )
        .limit(1);
      return best ?? null;
    }),

  myAttempts: protectedProcedure
    .input(z.object({ levelSlug: slugSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: systemDesignAttempt.id,
          levelSlug: systemDesignAttempt.levelSlug,
          graph: systemDesignAttempt.graph,
          uptimePercent: systemDesignAttempt.uptimePercent,
          avgLatencyMs: systemDesignAttempt.avgLatencyMs,
          totalCost: systemDesignAttempt.totalCost,
          stars: systemDesignAttempt.stars,
          passed: systemDesignAttempt.passed,
          createdAt: systemDesignAttempt.createdAt,
        })
        .from(systemDesignAttempt)
        .where(
          and(
            eq(systemDesignAttempt.userId, ctx.session.user.id),
            eq(systemDesignAttempt.levelSlug, input.levelSlug),
          ),
        )
        .orderBy(desc(systemDesignAttempt.createdAt))
        .limit(50);
    }),

  // LeetCode-style "you beat X% of builders" comparison for the results modal.
  // Compares the just-finished run against every passed attempt on the level
  // and returns percentiles plus a cost-distribution histogram. Public so the
  // comparison shows even before the player signs in.
  communityStats: publicProcedure
    .input(
      z.object({
        levelSlug: slugSchema,
        uptimePercent: z.number().finite().min(0).max(100),
        avgLatencyMs: z.number().finite().min(0).max(60_000),
        totalCost: z.number().finite().min(0).max(1_000_000),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Stored units: uptime ×100, latency in ms, cost in cents (×100).
      const costCents = Math.round(input.totalCost * 100);
      const latencyMs = Math.round(input.avgLatencyMs);
      const uptimeStored = Math.round(input.uptimePercent * 100);

      const peers = and(
        eq(systemDesignAttempt.levelSlug, input.levelSlug),
        eq(systemDesignAttempt.passed, 1),
      );

      const [agg] = await ctx.db
        .select({
          total: sql<number>`count(*)::int`,
          // Lower cost / latency is better → you beat the more expensive / slower.
          costBeats: sql<number>`count(*) filter (where ${systemDesignAttempt.totalCost} > ${costCents})::int`,
          latencyBeats: sql<number>`count(*) filter (where ${systemDesignAttempt.avgLatencyMs} > ${latencyMs})::int`,
          // Higher uptime is better → you beat the less reliable.
          uptimeBeats: sql<number>`count(*) filter (where ${systemDesignAttempt.uptimePercent} < ${uptimeStored})::int`,
          minCost: sql<number | null>`min(${systemDesignAttempt.totalCost})`,
          maxCost: sql<number | null>`max(${systemDesignAttempt.totalCost})`,
        })
        .from(systemDesignAttempt)
        .where(peers);

      const total = agg?.total ?? 0;
      if (!agg || total === 0) {
        return { sampleSize: 0, cost: null, latency: null, uptime: null };
      }

      const pct = (beats: number) =>
        Math.round((beats / total) * 1000) / 10;

      // Cost-distribution histogram (cents → dollars), bucketed in SQL so we
      // never ship every row to the client.
      const minCost = agg.minCost ?? costCents;
      const maxCost = Math.max(agg.maxCost ?? costCents, costCents);
      const BUCKETS = 12;
      const span = Math.max(maxCost - minCost, 1);
      const width = span / BUCKETS;

      const rows = await ctx.db
        .select({
          bucket: sql<number>`least(${BUCKETS - 1}, floor((${systemDesignAttempt.totalCost} - ${minCost}::float8) / ${width}::float8)::int)`,
          count: sql<number>`count(*)::int`,
        })
        .from(systemDesignAttempt)
        .where(peers)
        // Group by the first output column's ordinal: restating the bucket
        // expression here would re-bind the params under new placeholders,
        // which Postgres treats as a distinct expression and rejects.
        .groupBy(sql`1`);

      const counts = new Array<number>(BUCKETS).fill(0);
      for (const r of rows) {
        const i = Math.min(BUCKETS - 1, Math.max(0, r.bucket));
        counts[i] = (counts[i] ?? 0) + r.count;
      }
      const userBucket = Math.min(
        BUCKETS - 1,
        Math.max(0, Math.floor((costCents - minCost) / width)),
      );
      const histogram = counts.map((count, i) => ({
        // Convert cents → dollars for display.
        min: (minCost + i * width) / 100,
        max: (minCost + (i + 1) * width) / 100,
        count,
        isUser: i === userBucket,
      }));

      return {
        sampleSize: total,
        cost: { percentile: pct(agg.costBeats), value: input.totalCost },
        latency: { percentile: pct(agg.latencyBeats), value: input.avgLatencyMs },
        uptime: { percentile: pct(agg.uptimeBeats), value: input.uptimePercent },
        histogram,
      };
    }),

  recentAttempts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: systemDesignAttempt.id,
        levelSlug: systemDesignAttempt.levelSlug,
        uptimePercent: systemDesignAttempt.uptimePercent,
        avgLatencyMs: systemDesignAttempt.avgLatencyMs,
        totalCost: systemDesignAttempt.totalCost,
        stars: systemDesignAttempt.stars,
        passed: systemDesignAttempt.passed,
        createdAt: systemDesignAttempt.createdAt,
      })
      .from(systemDesignAttempt)
      .where(eq(systemDesignAttempt.userId, ctx.session.user.id))
      .orderBy(desc(systemDesignAttempt.createdAt))
      .limit(20);
  }),
});
