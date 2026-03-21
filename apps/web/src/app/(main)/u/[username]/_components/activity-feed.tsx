"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
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

export function ActivityFeed({ username }: { username: string }) {
  const trpc = useTRPC();
  const { data: activity } = useQuery(
    trpc.profile.recentActivity.queryOptions({ username, limit: 10 }),
  );

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
      {!activity || activity.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No activity yet
        </p>
      ) : (
        <div className="divide-y">
          {activity.map((item) => (
            <Link
              key={item.id}
              href={`/problems/${item.problemSlug}`}
              className="hover:bg-muted/50 flex items-center gap-3 px-2 py-3 transition-colors rounded-lg"
            >
              <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate block">
                  {item.problemTitle}
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 capitalize font-normal",
                  DIFFICULTY_COLORS[item.difficulty],
                )}
              >
                {item.difficulty}
              </Badge>
              <span className="text-muted-foreground shrink-0 text-xs">
                {LANG_LABELS[item.lang] ?? item.lang}
              </span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
