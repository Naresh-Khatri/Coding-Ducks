"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Clock, Play, Tag } from "lucide-react";

import { DifficultyBadge } from "~/components/difficulty-badge";
import { Markdown } from "~/components/markdown";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { CATEGORY_LABELS, STATUS_LABELS } from "~/lib/machine-coding/labels";
import { useTRPC } from "~/trpc/react";

export default function MachineCodingProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const trpc = useTRPC();

  const { data, isLoading, error } = useQuery(
    trpc.machineCoding.problemBySlug.queryOptions({ slug }, { enabled: !!slug }),
  );

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
        <div className="bg-muted mt-6 h-96 w-full animate-pulse rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Problem not found</h1>
        <p className="text-muted-foreground">
          {error?.message ?? "This problem doesn't exist."}
        </p>
        <Button asChild>
          <Link href="/machine-coding">Back to catalogue</Link>
        </Button>
      </div>
    );
  }

  const { problem, attempt } = data;
  const hasRoom = attempt?.duckletId != null;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/machine-coding"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        All problems
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Statement */}
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{problem.title}</h1>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
          <article className="max-w-none">
            <Markdown>{problem.description}</Markdown>
          </article>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="bg-card space-y-4 rounded-xl border p-5">
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push(`/machine-coding/${problem.slug}/solve`)}
            >
              <Play className="mr-2 size-4" />
              {attempt && attempt.status !== "completed"
                ? "Continue practicing"
                : "Start practicing"}
            </Button>

            {hasRoom && (
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/ducklets/${attempt.duckletId}`}>
                  Open interview room
                </Link>
              </Button>
            )}

            {attempt && (
              <p className="text-muted-foreground text-center text-xs">
                Status: {STATUS_LABELS[attempt.status] ?? attempt.status}
                {attempt.testsLastTotal != null &&
                  ` · tests ${attempt.testsLastPassed ?? 0}/${attempt.testsLastTotal}`}
              </p>
            )}

            <dl className="space-y-3 border-t pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-4" /> Time budget
                </dt>
                <dd className="font-medium">{problem.durationMinutes} min</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">
                  {CATEGORY_LABELS[problem.category] ?? problem.category}
                </dd>
              </div>
            </dl>

            {problem.tags.length > 0 && (
              <div className="border-t pt-4">
                <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <Tag className="size-3.5" /> Topics
                </div>
                <div className="flex flex-wrap gap-1">
                  {problem.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {problem.companies.length > 0 && (
              <div className="border-t pt-4">
                <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <Building2 className="size-3.5" /> Asked at
                </div>
                <div className="flex flex-wrap gap-1">
                  {problem.companies.map((c) => (
                    <Badge key={c} variant="outline" className="font-normal">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
