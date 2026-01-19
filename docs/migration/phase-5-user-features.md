# Phase 5: User Features

> **Prerequisite**: Complete at least [Phase 1](./phase-1-foundation.md) and [Phase 2](./phase-2-problems.md).

---

## Goals

1. ✅ User profile page
2. ✅ Activity calendar (GitHub-style)
3. ✅ Progress stats and achievements
4. ✅ Dashboard with recent activity

---

## Ticket 5.1: User Profile tRPC Router

### File: `packages/api/src/router/user.ts` (extend existing)

```typescript
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { userProfile, submission, challengeAttempt } from "@acme/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export const userRouter = createTRPCRouter({
  /**
   * Get user by username (public profile)
   */
  byUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select()
        .from(userProfile)
        .where(eq(userProfile.username, input.username))
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Get stats
      const [problemStats] = await ctx.db
        .select({
          solved: sql<number>`count(distinct problem_id)`,
          totalSubmissions: sql<number>`count(*)`,
        })
        .from(submission)
        .where(
          and(
            eq(submission.userId, profile.userId),
            eq(submission.status, "accepted")
          )
        );

      const [challengeStats] = await ctx.db
        .select({
          attempted: sql<number>`count(distinct challenge_id)`,
          avgScore: sql<number>`avg(score)`,
        })
        .from(challengeAttempt)
        .where(
          and(
            eq(challengeAttempt.userId, profile.userId),
            eq(challengeAttempt.status, "submitted")
          )
        );

      return {
        ...profile,
        stats: {
          problemsSolved: problemStats?.solved ?? 0,
          totalSubmissions: problemStats?.totalSubmissions ?? 0,
          challengesAttempted: challengeStats?.attempted ?? 0,
          avgChallengeScore: Math.round(challengeStats?.avgScore ?? 0),
        },
      };
    }),

  /**
   * Get activity calendar data (last 365 days)
   */
  activityCalendar: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select({ userId: userProfile.userId })
        .from(userProfile)
        .where(eq(userProfile.username, input.username))
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Get submission counts by date
      const activityData = await ctx.db
        .select({
          date: sql<string>`date(created_at)`,
          count: sql<number>`count(*)`,
        })
        .from(submission)
        .where(
          and(
            eq(submission.userId, profile.userId),
            gte(submission.createdAt, oneYearAgo)
          )
        )
        .groupBy(sql`date(created_at)`)
        .orderBy(sql`date(created_at)`);

      return activityData.map((row) => ({
        date: row.date,
        count: row.count,
        level: row.count === 0 ? 0 : row.count <= 2 ? 1 : row.count <= 5 ? 2 : row.count <= 10 ? 3 : 4,
      }));
    }),

  /**
   * Get recent submissions
   */
  recentActivity: publicProcedure
    .input(z.object({ username: z.string(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select({ userId: userProfile.userId })
        .from(userProfile)
        .where(eq(userProfile.username, input.username))
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const submissions = await ctx.db
        .select({
          id: submission.id,
          status: submission.status,
          lang: submission.lang,
          createdAt: submission.createdAt,
          problem: {
            slug: problem.slug,
            title: problem.title,
          },
        })
        .from(submission)
        .leftJoin(problem, eq(submission.problemId, problem.id))
        .where(eq(submission.userId, profile.userId))
        .orderBy(desc(submission.createdAt))
        .limit(input.limit);

      return submissions;
    }),

  /**
   * Update own profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z.string().min(3).max(30).optional(),
        fullname: z.string().max(100).optional(),
        bio: z.string().max(500).optional(),
        photoURL: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check username uniqueness if changing
      if (input.username) {
        const [existing] = await ctx.db
          .select()
          .from(userProfile)
          .where(eq(userProfile.username, input.username))
          .limit(1);

        if (existing && existing.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username already taken",
          });
        }
      }

      const [updated] = await ctx.db
        .update(userProfile)
        .set(input)
        .where(eq(userProfile.userId, ctx.session.user.id))
        .returning();

      return updated;
    }),
});
```

---

## Ticket 5.2: User Profile Page

### File: `apps/web/src/app/(main)/u/[username]/page.tsx`

```tsx
"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ActivityCalendar } from "~/components/activity-calendar";
import { CheckCircle, XCircle, Trophy, Code, Palette } from "lucide-react";
import Link from "next/link";
import { cn } from "~/lib/utils";

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const { data: user, isLoading } = api.user.byUsername.useQuery({ username });
  const { data: activity } = api.user.activityCalendar.useQuery({ username });
  const { data: recentActivity } = api.user.recentActivity.useQuery({ username });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="container py-8">
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.photoURL ?? undefined} />
          <AvatarFallback className="text-2xl">
            {user.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{user.fullname ?? user.username}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
          {user.bio && <p className="mt-2">{user.bio}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Trophy className="h-4 w-4 mr-2" />
            {user.points} points
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              <Code className="h-4 w-4 mr-2" />
              Problems Solved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.stats.problemsSolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.stats.totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              Challenges Attempted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.stats.challengesAttempted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Avg Challenge Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.stats.avgChallengeScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Calendar */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity && <ActivityCalendar data={activity} />}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity?.map((item) => (
              <Link
                key={item.id}
                href={`/problems/${item.problem?.slug}`}
                className="flex items-center justify-between p-3 rounded border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.status === "accepted" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>{item.problem?.title}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline">{item.lang}</Badge>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Ticket 5.3: Activity Calendar Component

### File: `apps/web/src/components/activity-calendar.tsx`

```tsx
"use client";

import { cn } from "~/lib/utils";

interface ActivityData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ActivityCalendarProps {
  data: ActivityData[];
}

const LEVEL_COLORS = {
  0: "bg-muted",
  1: "bg-green-500/20",
  2: "bg-green-500/40",
  3: "bg-green-500/60",
  4: "bg-green-500/80",
};

export function ActivityCalendar({ data }: ActivityCalendarProps) {
  // Generate last 365 days
  const today = new Date();
  const days: Date[] = [];
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date);
  }

  // Create a map for quick lookup
  const dataMap = new Map(data.map((d) => [d.date, d]));

  // Group by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  days.forEach((day, i) => {
    currentWeek.push(day);
    if (day.getDay() === 6 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day) => {
              const dateStr = day.toISOString().split("T")[0];
              const activity = dataMap.get(dateStr);
              const level = activity?.level ?? 0;

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "w-3 h-3 rounded-sm",
                    LEVEL_COLORS[level]
                  )}
                  title={`${dateStr}: ${activity?.count ?? 0} submissions`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn("w-3 h-3 rounded-sm", LEVEL_COLORS[level as 0 | 1 | 2 | 3 | 4])}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
```

---

## Ticket 5.4: Dashboard Page

### File: `apps/web/src/app/(main)/dashboard/page.tsx`

```tsx
"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { useSession } from "~/auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ActivityCalendar } from "~/components/activity-calendar";
import {
  Code,
  Palette,
  Users,
  Trophy,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const username = session?.user?.name ?? "";

  const { data: profile } = api.user.byUsername.useQuery(
    { username },
    { enabled: !!username }
  );
  const { data: activity } = api.user.activityCalendar.useQuery(
    { username },
    { enabled: !!username }
  );
  const { data: recentSubmissions } = api.user.recentActivity.useQuery(
    { username, limit: 5 },
    { enabled: !!username }
  );

  if (!session) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {profile?.fullname ?? username}!</h1>
        <p className="text-muted-foreground">Here's your progress overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points</p>
                <p className="text-2xl font-bold">{profile?.points ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Code className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Problems Solved</p>
                <p className="text-2xl font-bold">{profile?.stats?.problemsSolved ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10">
                <Palette className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Challenges</p>
                <p className="text-2xl font-bold">{profile?.stats?.challengesAttempted ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submissions</p>
                <p className="text-2xl font-bold">{profile?.stats?.totalSubmissions ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && <ActivityCalendar data={activity} />}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Submissions</CardTitle>
            <Link href={`/u/${username}`}>
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSubmissions?.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/problems/${sub.problem?.slug}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {sub.status === "accepted" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{sub.problem?.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {sub.lang}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/problems">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Code className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Solve Problems</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/challenges">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Palette className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="font-medium">UI Challenges</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/ducklets">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="font-medium">Collaborative Coding</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## Dependencies to Install

```bash
# shadcn components
pnpm dlx shadcn@latest add card
```

---

## Verification Checklist

- [ ] `/u/[username]` shows user profile
- [ ] Stats display correctly
- [ ] Activity calendar renders
- [ ] Recent activity shows submissions
- [ ] `/dashboard` loads for logged-in users
- [ ] Profile edit works
- [ ] Points update after solving problems

---

## Next Phase

After completing Phase 5, proceed to [Phase 6: Polish](./phase-6-polish.md).
