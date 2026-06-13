"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Clock, Flame, Tag } from "lucide-react";

import { DIFFICULTY_TEXT_COLORS } from "~/components/difficulty-badge";
import { Markdown } from "~/components/markdown";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { companyIconSrc } from "~/lib/machine-coding/company-icons";
import { CATEGORY_LABELS, STATUS_DOT, STATUS_LABELS } from "~/lib/machine-coding/labels";
import { cn } from "~/lib/utils";

import { CategoryIcons } from "./category-icons";
import { SolutionTab } from "./solution-tab";
import type { MachineCodingContext } from "./types";
import { VariantIcons } from "./variant-icons";

/**
 * The Problem side panel: GreatFrontend-style "Description | Solution" tabs. The
 * Description tab carries a compact metadata strip (difficulty · time budget ·
 * category), the statement, and the longer-form metadata (topics, companies,
 * attempt status). The Solution tab is gated — it stays empty until the user
 * reveals the reference solution. "Run tests" lives in the Tests drawer and
 * completion is implicit (all tests passing).
 */
export function MachineCodingPanel({
  context,
}: {
  context: MachineCodingContext;
}) {
  const [tab, setTab] = useState("description");
  const { attempt, roomId, tags, companies, difficulty, category, variants } =
    context;

  const hasFootnotes =
    roomId != null || attempt != null || tags.length > 0 || companies.length > 0;

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
      <div className="border-b px-3">
        <TabsList className="h-auto justify-start gap-4 rounded-none bg-transparent p-0">
          <TabsTrigger
            value="description"
            className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-1 py-2 text-xs font-medium shadow-none data-[state=active]:shadow-none"
          >
            Description
          </TabsTrigger>
          <TabsTrigger
            value="solution"
            className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-1 py-2 text-xs font-medium shadow-none data-[state=active]:shadow-none"
          >
            Solution
          </TabsTrigger>
        </TabsList>
      </div>

      {/* A plain overflow container so prose wraps to the panel width (Radix
          ScrollArea's table layout doesn't). */}
      <TabsContent
        value="description"
        className="mt-0 min-h-0 flex-1 overflow-y-auto p-4"
      >
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
            {variants && variants.length > 0 ? (
              <VariantIcons variants={variants} />
            ) : (
              <CategoryIcons category={category} />
            )}
            {CATEGORY_LABELS[category] ?? category}
          </span>
        </div>

        <Markdown>{context.description}</Markdown>

        {hasFootnotes && (
          <div className="mt-8 space-y-4 border-t pt-6 text-sm">
            {roomId != null && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/interview/${roomId}`}>Open interview room</Link>
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
      </TabsContent>

      <TabsContent
        value="solution"
        className="mt-0 min-h-0 flex-1 overflow-y-auto p-4"
      >
        <SolutionTab />
      </TabsContent>
    </Tabs>
  );
}
