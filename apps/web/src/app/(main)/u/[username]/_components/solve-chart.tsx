"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "~/components/ui/card";
import { useTRPC } from "~/trpc/react";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#22c55e",
  medium: "#eab308",
  hard: "#ef4444",
};

const LANG_LABELS: Record<string, string> = {
  py: "Python",
  js: "JavaScript",
  ts: "TypeScript",
  java: "Java",
  cpp: "C++",
  c: "C",
  rs: "Rust",
  go: "Go",
  rb: "Ruby",
  php: "PHP",
};

export function SolveChart({ username }: { username: string }) {
  const trpc = useTRPC();
  const { data: stats } = useQuery(
    trpc.profile.solveStats.queryOptions({ username }),
  );

  const difficultyData =
    stats?.byDifficulty.map((d) => ({
      name: d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1),
      value: d.count,
      fill: DIFFICULTY_COLORS[d.difficulty] ?? "#888",
    })) ?? [];

  const langData =
    stats?.byLanguage
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((l) => ({
        name: LANG_LABELS[l.lang] ?? l.lang,
        count: l.count,
      })) ?? [];

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Solve Breakdown</h3>

      {difficultyData.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No solved problems yet
        </p>
      ) : (
        <div className="space-y-6">
          {/* Difficulty pie */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {difficultyData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--popover-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Language bar */}
          {langData.length > 0 && (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={langData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--primary)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
