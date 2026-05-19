import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";

import { problemSolution, submission, user } from "@acme/db/schema";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";

const lang = z.enum([
  "py",
  "js",
  "ts",
  "java",
  "cpp",
  "c",
  "rs",
  "go",
  "rb",
  "php",
]);

export const solutionRouter = createTRPCRouter({
  /** Published solutions for a problem (public, newest first). */
  list: publicProcedure
    .input(
      z.object({
        problemId: z.number(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db
        .select({
          id: problemSolution.id,
          title: problemSolution.title,
          body: problemSolution.body,
          code: problemSolution.code,
          lang: problemSolution.lang,
          createdAt: problemSolution.createdAt,
          userId: problemSolution.userId,
          userName: user.name,
          userImage: user.image,
        })
        .from(problemSolution)
        .innerJoin(user, eq(problemSolution.userId, user.id))
        .where(eq(problemSolution.problemId, input.problemId))
        .orderBy(desc(problemSolution.createdAt))
        .limit(input.limit)
        .offset(input.offset),
    ),

  /** Publish a solution — requires an accepted submission for the problem. */
  create: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        title: z.string().trim().min(1).max(200),
        body: z.string().trim().max(20000).optional(),
        code: z.string().min(1),
        lang,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [accepted] = await ctx.db
        .select({ id: submission.id })
        .from(submission)
        .where(
          and(
            eq(submission.userId, ctx.session.user.id),
            eq(submission.problemId, input.problemId),
            eq(submission.kind, "submit"),
            eq(submission.status, "accepted"),
          ),
        )
        .limit(1);

      if (!accepted) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solve the problem before sharing a solution",
        });
      }

      const [created] = await ctx.db
        .insert(problemSolution)
        .values({
          userId: ctx.session.user.id,
          problemId: input.problemId,
          title: input.title,
          body: input.body,
          code: input.code,
          lang: input.lang,
        })
        .returning();

      return created;
    }),

  /** Delete one of your own solutions. */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(problemSolution)
        .where(
          and(
            eq(problemSolution.id, input.id),
            eq(problemSolution.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Solution not found",
        });
      }

      return { success: true };
    }),
});
