"use client";

import Link from "next/link";
import { Building2, Clock, Flame, Tag } from "lucide-react";

import { DIFFICULTY_TEXT_COLORS } from "~/components/difficulty-badge";
import { Markdown } from "~/components/markdown";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { companyIconSrc } from "~/lib/machine-coding/company-icons";
import { CATEGORY_LABELS, STATUS_DOT, STATUS_LABELS } from "~/lib/machine-coding/labels";
import { cn } from "~/lib/utils";

import { CategoryIcons } from "./category-icons";
import type { MachineCodingContext } from "./types";
import { useMachineCodingTests } from "./use-tests";

/**
 * The Problem side panel: a compact GreatFrontend-style metadata strip
 * (difficulty · time budget · category) at the top, the statement, the editorial
 * once the solution has been revealed, and the longer-form metadata (topics,
 * companies, attempt status) at the bottom. All actions live elsewhere — "Run
 * tests" in the Tests drawer, "Reveal solution" in this panel's header toolbar —
 * and completion is implicit (all tests passing).
 */
export function MachineCodingPanel({
  context,
}: {
  context: MachineCodingContext;
}) {
  const { revealed, editorial } = useMachineCodingTests();
  const { attempt, roomId, tags, companies, difficulty, category } = context;

  const hasFootnotes =
    roomId != null || attempt != null || tags.length > 0 || companies.length > 0;

  return (
    // A plain overflow container so prose wraps to the panel width (Radix
    // ScrollArea's table layout doesn't).
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        {/* Compact metadata strip — the at-a-glance classifiers. */}
        <div className="text-muted-foreground mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b pb-4 text-xs font-medium">
          <span
            className={cn(
              "flex items-center gap-1.5 capitalize",
              DIFFICULTY_TEXT_COLORS[difficulty],
            )}
          >
            <Flame className="size-3.5" />
            {difficulty}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {context.durationMinutes} min
          </span>
          <span className="flex items-center gap-1.5">
            <CategoryIcons category={category} />
            {CATEGORY_LABELS[category] ?? category}
          </span>
        </div>

        <Markdown>{context.description}</Markdown>

        {revealed && editorial && (
          <div className="mt-8 border-t pt-6">
            <Markdown>{editorial}</Markdown>
          </div>
        )}

        {hasFootnotes && (
          <div className="mt-8 space-y-4 border-t pt-6 text-sm">
            {roomId != null && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/ducklets/${roomId}`}>Open interview room</Link>
              </Button>
            )}

            {attempt && (
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span
                  className={`size-2 rounded-full ${STATUS_DOT[attempt.status] ?? "bg-muted-foreground"}`}
                />
                {STATUS_LABELS[attempt.status] ?? attempt.status}
                {attempt.testsLastTotal != null &&
                  ` · tests ${attempt.testsLastPassed ?? 0}/${attempt.testsLastTotal}`}
              </p>
            )}

            {tags.length > 0 && (
              <div>
                <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <Tag className="size-3.5" /> Topics
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {companies.length > 0 && (
              <div>
                <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <Building2 className="size-3.5" /> Asked at
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {companies.map((c) => {
                    const iconSrc = companyIconSrc(c);
                    return (
                      <span
                        key={c}
                        className="text-foreground/80 inline-flex items-center gap-1.5 text-xs"
                      >
                        {iconSrc && (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static brand SVG */}
                            <img
                              src={iconSrc}
                              alt=""
                              className="size-3.5 object-contain"
                            />
                          </span>
                        )}
                        {c}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
