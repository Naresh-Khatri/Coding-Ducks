import type { Metadata } from "next";

import { getLevelBySlug } from "~/data/system-design";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const level = getLevelBySlug(slug);

  if (!level) {
    return { title: "System Design · Coding Ducks" };
  }

  const title = `${level.title} · System Design · Coding Ducks`;
  const description = `Design a scalable ${level.title} system architecture. A ${level.difficulty} system design challenge on Coding Ducks.`;

  return {
    title,
    description,
  };
}

export default function SystemDesignSlugLayout({ children }: LayoutProps) {
  return children;
}
