"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock,
  Eye,
  Flame,
  Search,
} from "lucide-react";

import type { RouterOutputs } from "@acme/api";

import type { LocalAttemptStatus } from "~/lib/machine-coding/local-store";
import { DIFFICULTY_TEXT_COLORS } from "~/components/difficulty-badge";
import { CategoryIcons } from "~/components/machine-coding/category-icons";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useDebounce } from "~/hooks/use-debounce";
import { CATEGORY_LABELS, STATUS_LABELS } from "~/lib/machine-coding/labels";
import { readAllLocalStatuses } from "~/lib/machine-coding/local-store";
import { cn } from "~/lib/utils";
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

  const items = useMemo(() => data?.items ?? [], [data]);

  const totalMinutes = useMemo(
    () => items.reduce((sum, p) => sum + p.durationMinutes, 0),
    [items],
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
            <SelectItem value="ui-component">UI</SelectItem>
            <SelectItem value="js-utility">JS Utils</SelectItem>
            <SelectItem value="small-app">App</SelectItem>
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

      {/* Summary */}
      {!isLoading && items.length > 0 && (
        <div className="text-muted-foreground mb-3 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <Search className="size-3.5" />
            {items.length} {items.length === 1 ? "question" : "questions"}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {formatTotalDuration(totalMinutes)} total
          </span>
        </div>
      )}

      {isLoading ? (
        <ul className="divide-border bg-card divide-y rounded-xl border">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="bg-muted size-5 animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
                <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
              </div>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed py-24 text-center">
          No problems match your filters.
        </div>
      ) : (
        <ul className="divide-border bg-card divide-y rounded-xl border">
          {items.map((p) => (
            <ProblemRow
              key={p.slug}
              problem={p}
              localStatus={localStatuses[p.slug]}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function formatTotalDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function ProblemRow({
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
    <li>
      <Link
        href={`/machine-coding/${problem.slug}`}
        className="group hover:bg-muted/40 flex items-center gap-4 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl"
      >
        {/* Status indicator — each state gets a distinct, meaningful icon */}
        {status === "completed" ? (
          <CheckCircle2
            className="size-5 shrink-0 text-green-500"
            aria-label="Completed"
          />
        ) : status === "revealed" ? (
          <Eye
            className="size-5 shrink-0 text-orange-500"
            aria-label="Solution viewed"
          />
        ) : status === "in-progress" ? (
          <CircleDashed
            className="size-5 shrink-0 text-amber-500"
            aria-label="In progress"
          />
        ) : (
          <Circle
            className="text-muted-foreground/30 size-5 shrink-0"
            aria-label="Not started"
          />
        )}

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="group-hover:text-primary truncate font-medium transition-colors">
              {problem.title}
            </span>
            {status && (
              <span className="text-muted-foreground hidden text-xs sm:inline">
                · {STATUS_LABELS[status] ?? status}
              </span>
            )}
          </div>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="flex items-center gap-1.5">
              <CategoryIcons category={problem.category} />
              {CATEGORY_LABELS[problem.category] ?? problem.category}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 capitalize",
                DIFFICULTY_TEXT_COLORS[problem.difficulty],
              )}
            >
              <Flame className="size-3.5" />
              {problem.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {problem.durationMinutes} min
            </span>
            {tags.length > 0 && (
              <span className="hidden items-center gap-1 md:flex">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </span>
            )}
          </div>
        </div>

        <ArrowRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
      </Link>
    </li>
  );
}
