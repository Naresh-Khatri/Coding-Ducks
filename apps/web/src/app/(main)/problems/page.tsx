"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { CheckCircle, Circle, Loader2, Search } from "lucide-react";
import { cn } from "~/lib/utils";

const DIFFICULTY_COLORS = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ProblemsPage() {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string | undefined>();

  const { data, isLoading } = useQuery(
    trpc.problem.list.queryOptions({
      search: search || undefined,
      difficulty: difficulty === "all" ? undefined : (difficulty as "easy" | "medium" | "hard" | undefined),
      limit: 50,
    })
  );

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Problems</h1>
        <p className="text-muted-foreground">
          Practice coding problems and improve your skills
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Problems Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 border-b text-sm font-medium text-muted-foreground bg-muted/30">
          <div className="w-8 flex justify-center">Status</div>
          <div>Title</div>
          <div className="w-24 text-center">Difficulty</div>
          <div className="w-20 text-center">Solved</div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No problems found
          </div>
        ) : (
          <div className="divide-y">
            {data?.items.map((problem, index) => (
              <Link
                key={problem.id}
                href={`/problems/${problem.slug}`}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 hover:bg-muted/50 transition-colors items-center group"
              >
                <div className="w-8 flex justify-center">
                  {problem.userStatus === "solved" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : problem.userStatus === "attempted" ? (
                    <Circle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                  )}
                </div>
                <div className="font-medium">
                  <span className="text-muted-foreground/50 mr-3 font-mono text-sm">
                    {index + 1}.
                  </span>
                  {problem.title}
                  {problem.tags && problem.tags.length > 0 && (
                    <div className="inline-flex ml-3 gap-1">
                      {problem.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-24 text-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize font-normal",
                      DIFFICULTY_COLORS[problem.difficulty]
                    )}
                  >
                    {problem.difficulty}
                  </Badge>
                </div>
                <div className="w-20 text-center text-sm text-muted-foreground">
                  {problem.acceptanceRate != null ? `${problem.acceptanceRate}%` : "-"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
