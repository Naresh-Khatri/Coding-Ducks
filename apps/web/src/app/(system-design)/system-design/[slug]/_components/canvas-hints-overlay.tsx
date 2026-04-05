"use client";

import { useState } from "react";
import { Panel } from "@xyflow/react";
import { Lightbulb, ChevronUp } from "lucide-react";
import { useSystemDesignStore } from "~/lib/system-design/store";
import { cn } from "~/lib/utils";

export function CanvasHintsOverlay() {
  const level = useSystemDesignStore((s) => s.level);
  const [expanded, setExpanded] = useState(false);

  if (!level?.hints || level.hints.length === 0) return null;

  return (
    <Panel position="bottom-right" className="!m-3">
      <div className="bg-card/90 w-60 rounded-xl border shadow-lg backdrop-blur-sm">
        <button
          onClick={() => setExpanded(!expanded)}
          className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-xl px-3 py-2 transition-colors"
        >
          <Lightbulb size={13} className="text-amber-500" />
          <span className="flex-1 text-left text-xs font-medium">
            Hints
          </span>
          <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">
            {level.hints.length}
          </span>
          <ChevronUp
            size={12}
            className={cn(
              "text-muted-foreground transition-transform",
              !expanded && "rotate-180",
            )}
          />
        </button>
        {expanded && (
          <div className="border-t px-3 pb-3 pt-2">
            <ol className="space-y-2">
              {level.hints.map((hint, i) => (
                <li key={i} className="flex gap-2 text-[11px]">
                  <span className="text-muted-foreground mt-px shrink-0 font-mono text-[10px]">
                    {i + 1}.
                  </span>
                  <span className="text-muted-foreground leading-relaxed">
                    {hint}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Panel>
  );
}
