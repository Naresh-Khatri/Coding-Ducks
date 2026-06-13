"use client";

import Link from "next/link";
import { Building2, Clock, Tag } from "lucide-react";

import { Markdown } from "~/components/markdown";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  CATEGORY_LABELS,
  STATUS_DOT,
  STATUS_LABELS,
} from "~/lib/machine-coding/labels";

import type { MachineCodingContext } from "./types";
import { useMachineCodingTests } from "./use-tests";

/**
 * The Problem side panel: the statement, the editorial once the solution has
 * been revealed, and the problem metadata (topics, companies, time budget,
 * attempt status) that used to live on the standalone problem page. All actions
 * live elsewhere — "Run tests" in the Tests drawer, "Reveal solution" in this
 * panel's header toolbar — and completion is implicit (all tests passing).
 */
export function MachineCodingPanel({
  context,
}: {
  context: MachineCodingContext;
}) {
  const { revealed, editorial } = useMachineCodingTests();
  const { attempt, roomId, tags, companies } = context;

  return (
    // A plain overflow container so prose wraps to the panel width (Radix
    // ScrollArea's table layout doesn't).
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <Markdown>{context.description}</Markdown>

        {revealed && editorial && (
          <div className="mt-8 border-t pt-6">
            <Markdown>{editorial}</Markdown>
          </div>
        )}

        {/* Problem metadata — migrated from the old standalone problem page. */}
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

          <dl className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-4" /> Time budget
              </dt>
              <dd className="font-medium">{context.durationMinutes} min</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-medium">
                {CATEGORY_LABELS[context.category] ?? context.category}
              </dd>
            </div>
          </dl>

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
              <div className="flex flex-wrap gap-1">
                {companies.map((c) => (
                  <Badge key={c} variant="outline" className="font-normal">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
