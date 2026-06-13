"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useTRPC } from "~/trpc/react";

/**
 * Compact prev/next pager + position counter for the solve-page header, so the
 * candidate can step through the catalogue in `displayOrder` (and see where they
 * are in it) without opening the full "All Questions" sheet. Shares its query
 * cache with the sheet — both read the unfiltered `listProblems` list.
 */
export function ProblemNav({ currentSlug }: { currentSlug: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const { data } = useQuery(trpc.machineCoding.listProblems.queryOptions());

  const items = data?.items ?? [];
  const index = items.findIndex((p) => p.slug === currentSlug);
  const prev = index > 0 ? items[index - 1] : null;
  const next =
    index !== -1 && index < items.length - 1 ? items[index + 1] : null;

  // Prefetch the neighbours so stepping through is instant.
  useEffect(() => {
    if (prev) router.prefetch(`/machine-coding/${prev.slug}`);
    if (next) router.prefetch(`/machine-coding/${next.slug}`);
  }, [router, prev, next]);

  // Until the list resolves (or if the slug isn't in it) there's nothing to page.
  if (index === -1) return null;

  return (
    <div className="text-muted-foreground hidden items-center gap-0.5 sm:flex">
      <PagerButton
        to={prev ? `/machine-coding/${prev.slug}` : null}
        label={prev ? `Previous: ${prev.title}` : "No previous problem"}
      >
        <ChevronLeft className="size-4" />
      </PagerButton>
      <span className="px-1 text-xs font-medium tabular-nums">
        {index + 1} / {items.length}
      </span>
      <PagerButton
        to={next ? `/machine-coding/${next.slug}` : null}
        label={next ? `Next: ${next.title}` : "No next problem"}
      >
        <ChevronRight className="size-4" />
      </PagerButton>
    </div>
  );
}

function PagerButton({
  to,
  label,
  children,
}: {
  to: string | null;
  label: string;
  children: React.ReactNode;
}) {
  if (!to) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled
        title={label}
      >
        {children}
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="icon" className="size-7" title={label} asChild>
      <Link href={to}>{children}</Link>
    </Button>
  );
}
