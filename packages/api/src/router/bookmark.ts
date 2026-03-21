import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";

import { bookmark, problem } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const bookmarkRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({ problemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(bookmark)
        .where(
          and(
            eq(bookmark.userId, ctx.session.user.id),
            eq(bookmark.problemId, input.problemId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        await ctx.db
          .delete(bookmark)
          .where(
            and(
              eq(bookmark.userId, ctx.session.user.id),
              eq(bookmark.problemId, input.problemId),
            ),
          );
        return { bookmarked: false };
      }

      await ctx.db.insert(bookmark).values({
        userId: ctx.session.user.id,
        problemId: input.problemId,
      });

      return { bookmarked: true };
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const bookmarks = await ctx.db
        .select({
          id: bookmark.id,
          problemId: bookmark.problemId,
          createdAt: bookmark.createdAt,
          problemTitle: problem.title,
          problemSlug: problem.slug,
          problemDifficulty: problem.difficulty,
          problemTags: problem.tags,
        })
        .from(bookmark)
        .innerJoin(problem, eq(problem.id, bookmark.problemId))
        .where(eq(bookmark.userId, ctx.session.user.id))
        .orderBy(desc(bookmark.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return bookmarks;
    }),

  isBookmarked: protectedProcedure
    .input(z.object({ problemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(bookmark)
        .where(
          and(
            eq(bookmark.userId, ctx.session.user.id),
            eq(bookmark.problemId, input.problemId),
          ),
        )
        .limit(1);

      return { bookmarked: existing.length > 0 };
    }),
});
