"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, Clock, Flame, Search } from "lucide-react";

import type { RouterOutputs } from "@acme/api";

import type { LocalAttemptStatus } from "~/lib/machine-coding/local-store";
import { DIFFICULTY_TEXT_COLORS } from "~/components/difficulty-badge";
import { Input } from "~/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { CATEGORY_LABELS } from "~/lib/machine-coding/labels";
import { readAllLocalStatuses } from "~/lib/machine-coding/local-store";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";
import { Button } from "../ui/button";
import { CategoryIcons } from "./category-icons";
import { ProblemStatusIcon } from "./problem-status-icon";

type ProblemItem =
  RouterOutputs["machineCoding"]["listProblems"]["items"][number];

const CATEGORY_PILLS = [
  { value: "all", label: "All" },
  { value: "ui-component", label: "UI coding" },
  { value: "js-utility", label: "JS Utils" },
] as const;

/**
 * The solve-page title control: a header button that opens a left sheet listing
 * the whole catalogue with the user's per-problem status, so candidates can scan
 * progress and jump between problems without going back to the catalogue page.
 * The list is fetched only once the sheet opens, and merges signed-in attempt
 * state with anonymous localStorage progress (server state wins).
 */
export function ProblemSheet({
  currentSlug,
  title,
}: {
  currentSlug: string;
  title: string;
}) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState<(typeof CATEGORY_PILLS)[number]["value"]>("all");

  const { data, isLoading } = useQuery(
    trpc.machineCoding.listProblems.queryOptions(undefined, { enabled: open }),
  );

  // Anonymous progress lives in localStorage; re-read each time the sheet opens
  // so it reflects the latest attempt (hydration-safe: only after mount).
  const [localStatuses, setLocalStatuses] = useState<
    Record<string, LocalAttemptStatus>
  >({});
  useEffect(() => {
    // Intentional: snapshot browser-only state when the sheet opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setLocalStatuses(readAllLocalStatuses());
  }, [open]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      const hay = `${p.title} ${p.tags.join(" ")} ${p.companies.join(" ")}`;
      return hay.toLowerCase().includes(q);
    });
  }, [items, search, category]);

  // Center the current problem in the list once it renders.
  const currentRowRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!open || isLoading) return;
    const id = requestAnimationFrame(() =>
      currentRowRef.current?.scrollIntoView({ block: "center" }),
    );
    return () => cancelAnimationFrame(id);
  }, [open, isLoading]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant={"ghost"}
          className="group hover:bg-muted -mx-1 flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors"
          title="Browse all problems"
        >
          <span className="min-w-0 truncate font-semibold">All Questions</span>
          <ChevronsUpDown className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 transition-colors" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[88vw] gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-3 border-b">
          <div className="pr-8">
            <SheetTitle className="text-base">Practice problems</SheetTitle>
            <SheetDescription className="text-xs">
              Browse the catalogue and jump between problems.
            </SheetDescription>
          </div>

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search within this list"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_PILLS.map((pill) => (
              <button
                key={pill.value}
                type="button"
                data-active={category === pill.value}
                onClick={() => setCategory(pill.value)}
                className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:border-primary hover:bg-muted rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <ul className="divide-border/60 divide-y">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="bg-muted size-4 animate-pulse rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="bg-muted h-3.5 w-1/3 animate-pulse rounded" />
                    <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                  </div>
                </li>
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div className="text-muted-foreground px-4 py-16 text-center text-sm">
              No problems match your search.
            </div>
          ) : (
            <ul className="divide-border/60 divide-y">
              {filtered.map((p) => (
                <ProblemSheetRow
                  key={p.slug}
                  problem={p}
                  status={p.attemptStatus ?? localStatuses[p.slug] ?? null}
                  current={p.slug === currentSlug}
                  rowRef={p.slug === currentSlug ? currentRowRef : undefined}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ProblemSheetRow({
  problem,
  status,
  current,
  rowRef,
  onNavigate,
}: {
  problem: ProblemItem;
  status: string | null;
  current: boolean;
  rowRef?: React.Ref<HTMLAnchorElement>;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        ref={rowRef}
        href={`/machine-coding/${problem.slug}`}
        onClick={onNavigate}
        aria-current={current ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-3 px-4 py-2.5 transition-colors",
          current ? "bg-primary/10" : "hover:bg-muted/50",
        )}
      >
        {current && (
          <span className="bg-primary absolute inset-y-0 left-0 w-0.5" />
        )}
        <ProblemStatusIcon status={status} className="size-4" />

        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-medium transition-colors",
              current ? "text-primary" : "group-hover:text-primary",
            )}
          >
            {problem.title}
          </span>
          <div className="text-muted-foreground mt-0.5 flex items-center gap-x-2.5 text-xs">
            <span className="flex items-center gap-1">
              <CategoryIcons category={problem.category} />
              {CATEGORY_LABELS[problem.category] ?? problem.category}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 capitalize",
                DIFFICULTY_TEXT_COLORS[problem.difficulty],
              )}
            >
              <Flame className="size-3" />
              {problem.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {problem.durationMinutes}m
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
