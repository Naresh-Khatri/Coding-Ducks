import type { Metadata } from "next";
import { headers } from "next/headers";

import { appRouter, createTRPCContext } from "@acme/api";

import { auth } from "~/auth/server";

import { ProblemDetailClient } from "./problem-detail-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProblem(slug: string) {
  try {
    const ctx = await createTRPCContext({
      headers: new Headers(await headers()),
      auth,
    });
    return await appRouter.createCaller(ctx).problem.bySlug({ slug });
  } catch {
    return null;
  }
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
  const problem = await getProblem(slug);

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

export default function ProblemDetailPage() {
  return <ProblemDetailClient />;
}
