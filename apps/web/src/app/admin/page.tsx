"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FileCode2, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdminPage() {
  const trpc = useTRPC();

  const { data: problems, isLoading } = useQuery(
    trpc.problem.list.queryOptions({ limit: 100 })
  );

  const totalProblems = problems?.total ?? 0;
  const easyCount = problems?.items.filter((p) => p.difficulty === "easy").length ?? 0;
  const mediumCount = problems?.items.filter((p) => p.difficulty === "medium").length ?? 0;
  const hardCount = problems?.items.filter((p) => p.difficulty === "hard").length ?? 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage problems, view statistics, and configure settings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
            <FileCode2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : totalProblems}
            </div>
            <p className="text-xs text-muted-foreground">
              Published problems
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Easy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {isLoading ? "..." : easyCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Beginner friendly
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Medium</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {isLoading ? "..." : mediumCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Intermediate level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hard</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {isLoading ? "..." : hardCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Advanced challenges
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <a
            href="/admin/problems"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <FileCode2 className="h-4 w-4" />
            Manage Problems
          </a>
        </div>
      </div>
    </div>
  );
}
