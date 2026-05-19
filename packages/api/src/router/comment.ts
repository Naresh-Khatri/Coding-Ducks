import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod/v4";

import { problemComment, submission, user } from "@acme/db/schema";

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

const selectCols = {
  id: problemComment.id,
  parentId: problemComment.parentId,
  title: problemComment.title,
  body: problemComment.body,
  code: problemComment.code,
  lang: problemComment.lang,
  createdAt: problemComment.createdAt,
  userId: problemComment.userId,
  userName: user.name,
  userImage: user.image,
};

export const commentRouter = createTRPCRouter({
  /**
   * Discussion thread for a problem (public). Returns top-level posts
   * newest-first, each with its replies (oldest-first) nested under it.
   */
  list: publicProcedure
    .input(
      z.object({
        problemId: z.number(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.db
        .select(selectCols)
        .from(problemComment)
        .innerJoin(user, eq(problemComment.userId, user.id))
        .where(
          and(
            eq(problemComment.problemId, input.problemId),
            isNull(problemComment.parentId),
          ),
        )
        .orderBy(desc(problemComment.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      if (posts.length === 0) return [];

      const replies = await ctx.db
        .select(selectCols)
        .from(problemComment)
        .innerJoin(user, eq(problemComment.userId, user.id))
        .where(
          inArray(
            problemComment.parentId,
            posts.map((p) => p.id),
          ),
        )
        .orderBy(asc(problemComment.createdAt));

      return posts.map((p) => ({
        ...p,
        replies: replies.filter((r) => r.parentId === p.id),
      }));
    }),

  /**
   * Post to the discussion (auth required). A top-level post may attach a
   * shared solution (title + code + lang) — that requires an accepted
   * submission for the problem. Replies (parentId set) are plain text.
   */
  create: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        body: z.string().trim().min(1).max(2000),
        parentId: z.number().optional(),
        title: z.string().trim().max(200).optional(),
        code: z.string().min(1).optional(),
        lang: lang.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const isReply = input.parentId != null;

      if (isReply && (input.code ?? input.title)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Replies cannot attach a solution",
        });
      }

      if (input.code) {
        if (!input.lang) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A shared solution needs a language",
          });
        }

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
      }

      const [created] = await ctx.db
        .insert(problemComment)
        .values({
          userId: ctx.session.user.id,
          problemId: input.problemId,
          parentId: input.parentId,
          title: input.code ? input.title : undefined,
          body: input.body,
          code: input.code,
          lang: input.code ? input.lang : undefined,
        })
        .returning();

      return created;
    }),

  /** Delete one of your own posts/replies (replies cascade with the post). */
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
