"use client";

import { Target } from "lucide-react";

import { useSystemDesignStore } from "~/lib/system-design/store";

export function LevelBriefing() {
  const level = useSystemDesignStore((s) => s.level);
  const phase = useSystemDesignStore((s) => s.phase);

  if (!level || phase !== "building") return null;

  return (
    <div className="border-b p-3" data-tour="sd-briefing">
      {/* Objective */}
      <div className="mb-1.5 flex items-center gap-1.5">
        <Target size={13} className="text-primary shrink-0" />
        <span className="text-xs font-semibold tracking-wider uppercase">
          Objective
        </span>
      </div>
      <p className="text-muted-foreground text-[12px] leading-relaxed">
        {level.description}
      </p>
    </div>
  );
}
