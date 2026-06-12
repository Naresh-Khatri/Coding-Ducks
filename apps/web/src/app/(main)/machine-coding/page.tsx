"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock, Search } from "lucide-react";

import type { RouterOutputs } from "@acme/api";

import type { LocalAttemptStatus } from "~/lib/machine-coding/local-store";
import { DifficultyBadge } from "~/components/difficulty-badge";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useDebounce } from "~/hooks/use-debounce";
import {
  CATEGORY_LABELS,
  STATUS_DOT,
  STATUS_LABELS,
} from "~/lib/machine-coding/labels";
import { readAllLocalStatuses } from "~/lib/machine-coding/local-store";
import { useTRPC } from "~/trpc/react";

type ProblemItem =
  RouterOutputs["machineCoding"]["listProblems"]["items"][number];

const DURATION_OPTIONS = [
  { value: "all", label: "Any length" },
  { value: "30", label: "≤ 30 min" },
  { value: "60", label: "≤ 60 min" },
  { value: "90", label: "≤ 90 min" },
];

export default function MachineCodingPage() {
  const trpc = useTRPC();

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [duration, setDuration] = useState<string>("all");
  const debouncedSearch = useDebounce(search.trim(), 300);

  // Anonymous attempt statuses live in localStorage; read them after mount to
  // avoid a hydration mismatch.
  const [localStatuses, setLocalStatuses] = useState<
    Record<string, LocalAttemptStatus>
  >({});
  useEffect(() => {
    // Intentional: read browser-only state after mount to stay hydration-safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalStatuses(readAllLocalStatuses());
  }, []);

  const { data, isLoading } = useQuery(
    trpc.machineCoding.listProblems.queryOptions({
      difficulty:
        difficulty === "all"
          ? undefined
          : (difficulty as "easy" | "medium" | "hard"),
      category:
        category === "all"
          ? undefined
          : (category as "ui-component" | "js-utility" | "small-app"),
      durationMax: duration === "all" ? undefined : Number(duration),
      search: debouncedSearch || undefined,
    }),
  );

  const items = data?.items ?? [];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight lg:text-4xl">
          Machine Coding
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          The most-asked machine-coding interview questions, solved in a real
          in-browser IDE with a built-in test runner. No login required — sign
          in only when you want to invite someone for a mock interview.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search problems…"
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
            <SelectItem value="all">All difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="ui-component">UI Component</SelectItem>
            <SelectItem value="js-utility">JS Utility</SelectItem>
            <SelectItem value="small-app">Small App</SelectItem>
          </SelectContent>
        </Select>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-44 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed py-24 text-center">
          No problems match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <ProblemCard
              key={p.slug}
              problem={p}
              localStatus={localStatuses[p.slug]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProblemCard({
  problem,
  localStatus,
}: {
  problem: ProblemItem;
  localStatus?: LocalAttemptStatus;
}) {
  // Server attempt state (signed in) wins; otherwise fall back to local state.
  const status = problem.attemptStatus ?? localStatus ?? null;

  const tags = useMemo(() => problem.tags.slice(0, 3), [problem.tags]);

  return (
    <Link href={`/machine-coding/${problem.slug}`} className="group block">
      <Card className="hover:border-primary/40 flex h-full flex-col transition-all hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <DifficultyBadge difficulty={problem.difficulty} />
            {status && (
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span
                  className={`size-2 rounded-full ${STATUS_DOT[status] ?? "bg-muted-foreground"}`}
                />
                {STATUS_LABELS[status] ?? status}
              </span>
            )}
          </div>
          <CardTitle className="group-hover:text-primary text-lg transition-colors">
            {problem.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-3">
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {problem.durationMinutes} min
            </span>
            <span>{CATEGORY_LABELS[problem.category] ?? problem.category}</span>
          </div>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">
          {problem.roomId
            ? "Open your interview room →"
            : status === "completed"
              ? "Practice again →"
              : status
                ? "Continue →"
                : "Start practicing →"}
        </CardFooter>
      </Card>
    </Link>
  );
}
