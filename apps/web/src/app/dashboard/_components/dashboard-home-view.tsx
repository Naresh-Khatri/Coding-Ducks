"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  Flame,
  Loader2,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_MAP: Record<
  string,
  { label: string; icon: typeof CheckCircle; color: string }
> = {
  accepted: { label: "Accepted", icon: CheckCircle, color: "text-green-500" },
  wrong_answer: { label: "Wrong Answer", icon: XCircle, color: "text-red-500" },
  runtime_error: {
    label: "Runtime Error",
    icon: XCircle,
    color: "text-red-500",
  },
  time_limit: { label: "TLE", icon: Clock, color: "text-amber-500" },
  compile_error: {
    label: "Compile Error",
    icon: XCircle,
    color: "text-red-500",
  },
};

const INTENSITY_CLASSES = [
  "bg-muted",
  "bg-emerald-900/60",
  "bg-emerald-700/70",
  "bg-emerald-500/80",
  "bg-emerald-400",
];

function getIntensity(count: number): number {
  if (count === 0) return 0;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export function DashboardHomeView() {
  const trpc = useTRPC();
  const { data: stats, isLoading } = useQuery(
    trpc.user.dashboardStats.queryOptions(),
  );

  const miniHeatmap = useMemo(() => {
    if (!stats) return [];
    const countMap = new Map<string, number>();
    for (const d of stats.heatmap) {
      countMap.set(d.date, d.count);
    }

    // Last 20 weeks
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() - 20 * 7);

    const weeks: Array<Array<{ date: string; count: number }>> = [];
    for (let w = 0; w < 20; w++) {
      const days: Array<{ date: string; count: number }> = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + w * 7 + d);
        const dateStr = date.toISOString().split("T")[0]!;
        days.push({ date: dateStr, count: countMap.get(dateStr) ?? 0 });
      }
      weeks.push(days);
    }
    return weeks;
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const easyCount =
    stats.byDifficulty.find((d) => d.difficulty === "easy")?.count ?? 0;
  const mediumCount =
    stats.byDifficulty.find((d) => d.difficulty === "medium")?.count ?? 0;
  const hardCount =
    stats.byDifficulty.find((d) => d.difficulty === "hard")?.count ?? 0;

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2">
              <Target className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSolved}</p>
              <p className="text-muted-foreground text-xs">Problems Solved</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            {easyCount}E / {mediumCount}M / {hardCount}H
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2">
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.currentStreak}d</p>
              <p className="text-muted-foreground text-xs">Current Streak</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Best: {stats.longestStreak}d
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.points}</p>
              <p className="text-muted-foreground text-xs">Points</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.longestStreak}d</p>
              <p className="text-muted-foreground text-xs">Longest Streak</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Mini heatmap */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Activity</h3>
            {stats.username && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/u/${stats.username}`}>View Full Profile</Link>
              </Button>
            )}
          </div>
          <div className="flex gap-0.5">
            {miniHeatmap.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={cn(
                      "h-[10px] w-[10px] rounded-[2px]",
                      INTENSITY_CLASSES[getIntensity(day.count)],
                    )}
                    title={`${day.date}: ${day.count}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <span>Less</span>
            {INTENSITY_CLASSES.map((cls, i) => (
              <div
                key={i}
                className={cn("h-[10px] w-[10px] rounded-[2px]", cls)}
              />
            ))}
            <span>More</span>
          </div>
        </Card>

        {/* Recent submissions */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Recent Submissions</h3>
          {stats.recentSubmissions.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-3 py-8 text-sm">
              <p>No submissions yet</p>
              <Button asChild size="sm">
                <Link href="/problems">Start Solving</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentSubmissions.map((sub) => {
                const statusInfo = STATUS_MAP[sub.status] ?? {
                  label: sub.status,
                  icon: Clock,
                  color: "text-muted-foreground",
                };
                const Icon = statusInfo.icon;
                return (
                  <Link
                    key={sub.id}
                    href={`/problems/${sub.problemSlug}`}
                    className="hover:bg-muted/50 flex items-center gap-2 rounded-lg px-2 py-2 transition-colors"
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", statusInfo.color)} />
                    <span className="flex-1 truncate text-sm font-medium">
                      {sub.problemTitle}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 px-1.5 py-0 text-[9px] capitalize font-normal border-none",
                        DIFFICULTY_COLORS[sub.difficulty],
                      )}
                    >
                      {sub.difficulty}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
