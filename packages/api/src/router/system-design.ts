import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";

import { systemDesignAttempt } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

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
