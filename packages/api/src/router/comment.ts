import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";

import { problemComment, user } from "@acme/db/schema";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";

export const commentRouter = createTRPCRouter({
  /** Flat discussion thread for a problem (public, newest first). */
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
          id: problemComment.id,
          body: problemComment.body,
          createdAt: problemComment.createdAt,
          userId: problemComment.userId,
          userName: user.name,
          userImage: user.image,
        })
        .from(problemComment)
        .innerJoin(user, eq(problemComment.userId, user.id))
        .where(eq(problemComment.problemId, input.problemId))
        .orderBy(desc(problemComment.createdAt))
        .limit(input.limit)
        .offset(input.offset),
    ),

  /** Post a comment (auth required). */
  create: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        body: z.string().trim().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(problemComment)
        .values({
          userId: ctx.session.user.id,
          problemId: input.problemId,
          body: input.body,
        })
        .returning();

      return created;
    }),

  /** Delete one of your own comments. */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(problemComment)
        .where(
          and(
            eq(problemComment.id, input.id),
            eq(problemComment.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
      }

      return { success: true };
    }),
});
