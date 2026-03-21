"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, Flame, Target, Trophy } from "lucide-react";

import { Card } from "~/components/ui/card";
import { useTRPC } from "~/trpc/react";

interface StatsOverviewProps {
  username: string;
  profile: {
    totalSolved: number;
    currentStreak: number;
    longestStreak: number;
    points: number | null;
  };
}

export function StatsOverview({ username, profile }: StatsOverviewProps) {
  const trpc = useTRPC();
  const { data: stats } = useQuery(
    trpc.profile.solveStats.queryOptions({ username }),
  );

  const easyCount =
    stats?.byDifficulty.find((d) => d.difficulty === "easy")?.count ?? 0;
  const mediumCount =
    stats?.byDifficulty.find((d) => d.difficulty === "medium")?.count ?? 0;
  const hardCount =
    stats?.byDifficulty.find((d) => d.difficulty === "hard")?.count ?? 0;

  const cards = [
    {
      label: "Problems Solved",
      value: profile.totalSolved,
      icon: Target,
      sub: `${easyCount}E / ${mediumCount}M / ${hardCount}H`,
      color: "text-blue-400",
    },
    {
      label: "Current Streak",
      value: `${profile.currentStreak}d`,
      icon: Flame,
      sub: `Best: ${profile.longestStreak}d`,
      color: "text-orange-400",
    },
    {
      label: "Points",
      value: profile.points ?? 0,
      icon: Trophy,
      sub: "Total score",
      color: "text-amber-400",
    },
    {
      label: "Longest Streak",
      value: `${profile.longestStreak}d`,
      icon: Award,
      sub: "All time best",
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2">
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-muted-foreground text-xs">{card.label}</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">{card.sub}</p>
        </Card>
      ))}
    </div>
  );
}
