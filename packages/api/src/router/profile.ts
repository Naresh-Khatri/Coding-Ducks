import { TRPCError } from "@trpc/server";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod/v4";

import { user as userTable } from "@acme/db";
import { problem, submission, user, userProfile } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const profileRouter = createTRPCRouter({
  byUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select({
          userId: userProfile.userId,
          username: userProfile.username,
          fullname: userProfile.fullname,
          bio: userProfile.bio,
          photoURL: userProfile.photoURL,
          avatarSeed: userProfile.avatarSeed,
          points: userProfile.points,
          githubUrl: userProfile.githubUrl,
          twitterUrl: userProfile.twitterUrl,
          linkedinUrl: userProfile.linkedinUrl,
          websiteUrl: userProfile.websiteUrl,
          currentStreak: userProfile.currentStreak,
          longestStreak: userProfile.longestStreak,
          lastSolveDate: userProfile.lastSolveDate,
          createdAt: userProfile.createdAt,
          // From user table
          name: user.name,
          image: user.image,
        })
        .from(userProfile)
        .innerJoin(user, eq(user.id, userProfile.userId))
        .where(eq(userProfile.username, input.username))
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Total solved count
      const [solvedCount] = await ctx.db
        .select({ count: sql<number>`count(distinct ${submission.problemId})` })
        .from(submission)
        .where(
          and(
            eq(submission.userId, profile.userId),
            eq(submission.status, "accepted"),
          ),
        );

      // Display streak as 0 if stale (lastSolveDate < yesterday)
      const today = new Date().toISOString().split("T")[0]!;
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0]!;
      const displayStreak =
        profile.lastSolveDate && profile.lastSolveDate >= yesterday
          ? profile.currentStreak
          : 0;

      return {
        ...profile,
        currentStreak: displayStreak,
        totalSolved: Number(solvedCount?.count ?? 0),
      };
    }),

  solveStats: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select({ userId: userProfile.userId })
        .from(userProfile)
        .where(eq(userProfile.username, input.username))
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Solved by difficulty
      const byDifficulty = await ctx.db
        .select({
          difficulty: problem.difficulty,
          count: sql<number>`count(distinct ${submission.problemId})`,
        })
        .from(submission)
        .innerJoin(problem, eq(problem.id, submission.problemId))
        .where(
          and(
            eq(submission.userId, profile.userId),
            eq(submission.status, "accepted"),
          ),
        )
        .groupBy(problem.difficulty);

      // Language breakdown
      const byLanguage = await ctx.db
        .select({
          lang: submission.lang,
          count: sql<number>`count(*)`,
        })
        .from(submission)
        .where(
          and(
            eq(submission.userId, profile.userId),
            eq(submission.status, "accepted"),
          ),
        )
        .groupBy(submission.lang);

      return {
        byDifficulty: byDifficulty.map((d) => ({
          difficulty: d.difficulty,
          count: Number(d.count),
        })),
        byLanguage: byLanguage.map((l) => ({
          lang: l.lang,
          count: Number(l.count),
        })),
      };
    }),

  heatmap: publicProcedure
    .input(
      z.object({
        username: z.string(),
        year: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select({ userId: userProfile.userId })
        .from(userProfile)
        .where(eq(userProfile.username, input.username))
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const year = input.year ?? new Date().getFullYear();
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const data = await ctx.db
        .select({
          date: sql<string>`date(${submission.createdAt})`,
          count: sql<number>`count(*)`,
        })
        .from(submission)
        .where(
          and(
            eq(submission.userId, profile.userId),
            eq(submission.status, "accepted"),
            sql`${submission.createdAt} >= ${startDate}::date`,
            sql`${submission.createdAt} <= ${endDate}::date + interval '1 day'`,
          ),
        )
        .groupBy(sql`date(${submission.createdAt})`);

      return data.map((d) => ({
        date: d.date,
        count: Number(d.count),
      }));
    }),

  skillTags: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select({ userId: userProfile.userId })
        .from(userProfile)
        .where(eq(userProfile.username, input.username))
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const result = await ctx.db.execute(
        sql`
          SELECT tag, count(*)::int as count
          FROM (
            SELECT DISTINCT s.problem_id, unnest(p.tags) as tag
            FROM submission s
            JOIN problem p ON p.id = s.problem_id
            WHERE s.user_id = ${profile.userId}
              AND s.status = 'accepted'
          ) AS solved_tags
          GROUP BY tag
          ORDER BY count DESC
        `,
      );

      return result.rows.map((r: Record<string, unknown>) => ({
        tag: r.tag as string,
        count: r.count as number,
      }));
    }),

  recentActivity: publicProcedure
    .input(
      z.object({
        username: z.string(),
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select({ userId: userProfile.userId })
        .from(userProfile)
        .where(eq(userProfile.username, input.username))
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const recent = await ctx.db
        .select({
          id: submission.id,
          problemId: submission.problemId,
          problemTitle: problem.title,
          problemSlug: problem.slug,
          difficulty: problem.difficulty,
          lang: submission.lang,
          status: submission.status,
          createdAt: submission.createdAt,
        })
        .from(submission)
        .innerJoin(problem, eq(problem.id, submission.problemId))
        .where(
          and(
            eq(submission.userId, profile.userId),
            eq(submission.status, "accepted"),
          ),
        )
        .orderBy(desc(submission.createdAt))
        .limit(input.limit);

      return recent;
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        bio: z.string().max(500).optional(),
        fullname: z.string().max(100).optional(),
        githubUrl: z.string().url().or(z.literal("")).optional(),
        twitterUrl: z.string().url().or(z.literal("")).optional(),
        linkedinUrl: z.string().url().or(z.literal("")).optional(),
        websiteUrl: z.string().url().or(z.literal("")).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(userProfile)
        .set({
          bio: input.bio,
          fullname: input.fullname,
          githubUrl: input.githubUrl || null,
          twitterUrl: input.twitterUrl || null,
          linkedinUrl: input.linkedinUrl || null,
          websiteUrl: input.websiteUrl || null,
        })
        .where(eq(userProfile.userId, ctx.session.user.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
        });
      }

      return updated;
    }),

  checkUsername: publicProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3)
          .max(30)
          .regex(
            /^[a-z0-9_]+$/,
            "Only lowercase letters, numbers, and underscores",
          ),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ userId: userProfile.userId })
        .from(userProfile)
        .where(eq(userProfile.username, input.username))
        .limit(1);

      return { available: !existing };
    }),

  updateUsername: protectedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3)
          .max(30)
          .regex(
            /^[a-z0-9_]+$/,
            "Only lowercase letters, numbers, and underscores",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check availability (excluding own profile)
      const [existing] = await ctx.db
        .select({ userId: userProfile.userId })
        .from(userProfile)
        .where(
          and(
            eq(userProfile.username, input.username),
            ne(userProfile.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken",
        });
      }

      // Update both userProfile and user tables
      await ctx.db
        .update(userProfile)
        .set({ username: input.username })
        .where(eq(userProfile.userId, ctx.session.user.id));

      await ctx.db
        .update(userTable)
        .set({ username: input.username })
        .where(eq(userTable.id, ctx.session.user.id));

      return { username: input.username };
    }),

  updateAvatar: protectedProcedure
    .input(z.object({ seed: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(userProfile)
        .set({ avatarSeed: input.seed })
        .where(eq(userProfile.userId, ctx.session.user.id));

      return { avatarSeed: input.seed };
    }),
});
