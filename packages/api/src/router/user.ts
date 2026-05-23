import type { TRPCRouterRecord } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod/v4";

import { problem, submission, user, userProfile } from "@acme/db";

import { protectedProcedure } from "../trpc";

export const userRouter = {
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const profile = await ctx.db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    return profile;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Note: Changing email might require re-verification depending on auth setup
      // For now we just update it in the database
      const [updated] = await ctx.db
        .update(user)
        .set({
          name: input.name,
          email: input.email,
        })
        .where(eq(user.id, userId))
        .returning();

      return updated;
    }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [updated] = await ctx.db
        .update(user)
        .set({
          emailNotifications: input.emailNotifications,
        })
        .where(eq(user.id, userId))
        .returning();

      return updated;
    }),

  getSessions: protectedProcedure.query(async ({ ctx }) => {
    // Using Better Auth API to list sessions
    const sessions = await ctx.authApi.listSessions({
      headers: new Headers(), // Empty headers as we're calling from server
    });
    return sessions;
  }),

  revokeSession: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.authApi.revokeSession({
        headers: new Headers(),
        body: {
          token: input.token,
        },
      });
      return { success: true };
    }),

  revokeAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const sessions = await ctx.authApi.listSessions({
      headers: new Headers(),
    });

    const currentToken = ctx.session.session.token;

    // Revoke all sessions except the current one
    const promises = sessions
      .filter((s) => s.token !== currentToken)
      .map((s) =>
        ctx.authApi.revokeSession({
          headers: new Headers(),
          body: {
            token: s.token,
          },
        }),
      );

    await Promise.all(promises);
    return { success: true };
  }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Delete user from database - cascade will handle related data
    await ctx.db.delete(user).where(eq(user.id, userId));

    return { success: true };
  }),

  dashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Total solved
    const [solvedCount] = await ctx.db
      .select({ count: sql<number>`count(distinct ${submission.problemId})` })
      .from(submission)
      .where(
        and(eq(submission.userId, userId), eq(submission.status, "accepted")),
      );

    // Solved by difficulty
    const byDifficulty = await ctx.db
      .select({
        difficulty: problem.difficulty,
        count: sql<number>`count(distinct ${submission.problemId})`,
      })
      .from(submission)
      .innerJoin(problem, eq(problem.id, submission.problemId))
      .where(
        and(eq(submission.userId, userId), eq(submission.status, "accepted")),
      )
      .groupBy(problem.difficulty);

    // Streak info
    const [profile] = await ctx.db
      .select({
        currentStreak: userProfile.currentStreak,
        longestStreak: userProfile.longestStreak,
        lastSolveDate: userProfile.lastSolveDate,
        points: userProfile.points,
        username: userProfile.username,
      })
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .limit(1);

    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0]!;
    const displayStreak =
      profile?.lastSolveDate && profile.lastSolveDate >= yesterday
        ? profile.currentStreak
        : 0;

    // Recent submissions
    const recent = await ctx.db
      .select({
        id: submission.id,
        problemTitle: problem.title,
        problemSlug: problem.slug,
        difficulty: problem.difficulty,
        lang: submission.lang,
        status: submission.status,
        createdAt: submission.createdAt,
      })
      .from(submission)
      .innerJoin(problem, eq(problem.id, submission.problemId))
      .where(eq(submission.userId, userId))
      .orderBy(desc(submission.createdAt))
      .limit(5);

    // Heatmap data for current year
    const year = new Date().getFullYear();
    const heatmap = await ctx.db
      .select({
        date: sql<string>`date(${submission.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(submission)
      .where(
        and(
          eq(submission.userId, userId),
          eq(submission.status, "accepted"),
          sql`${submission.createdAt} >= ${`${year}-01-01`}::date`,
        ),
      )
      .groupBy(sql`date(${submission.createdAt})`);

    return {
      totalSolved: Number(solvedCount?.count ?? 0),
      byDifficulty: byDifficulty.map((d) => ({
        difficulty: d.difficulty,
        count: Number(d.count),
      })),
      currentStreak: displayStreak,
      longestStreak: profile?.longestStreak ?? 0,
      points: profile?.points ?? 0,
      username: profile?.username ?? null,
      recentSubmissions: recent,
      heatmap: heatmap.map((d) => ({ date: d.date, count: Number(d.count) })),
    };
  }),
} satisfies TRPCRouterRecord;
