import type { Metadata } from "next";

import { getQueryClient, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { ProblemDetailClient } from "./problem-detail-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Plain-text excerpt of the (markdown) description for meta/OG tags. */
function excerpt(markdown: string, max = 155): string {
  const text = markdown
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/[#>*_~[\]()-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getQueryClient()
    .fetchQuery(trpc.problem.bySlug.queryOptions({ slug }))
    .catch(() => null);

  if (!problem) {
    return { title: "Problem not found · Coding Ducks" };
  }

  const title = `${problem.title} · Coding Ducks`;
  const description = excerpt(problem.description);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ProblemDetailPage({ params }: PageProps) {
  const { slug } = await params;
  prefetch(trpc.problem.bySlug.queryOptions({ slug }));
  return (
    <HydrateClient>
      <ProblemDetailClient />
    </HydrateClient>
  );
}
