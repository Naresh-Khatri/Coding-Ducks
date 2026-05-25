"use client";

import { use, useEffect } from "react";
import { notFound } from "next/navigation";

import { getLevelBySlug } from "~/data/system-design";
import { track } from "~/lib/analytics";
import { useSystemDesignStore } from "~/lib/system-design/store";
import { Workspace } from "./_components/workspace";

export default function SystemDesignLevelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const level = getLevelBySlug(slug);
  const setLevel = useSystemDesignStore((s) => s.setLevel);

  useEffect(() => {
    if (level) {
      setLevel(level);
      track("sd-level-open", {
        slug: level.slug,
        difficulty: level.difficulty,
      });
    }
  }, [level, setLevel]);

  if (!level) {
    notFound();
  }

  return <Workspace />;
}
