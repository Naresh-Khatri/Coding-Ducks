"use client";

import { useEffect, useState } from "react";
import { Panel } from "@xyflow/react";
import { ArrowLeft, MousePointerClick } from "lucide-react";

const DISMISSED_KEY = "sd-empty-state-dismissed";

function isDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // ignore
  }
}

export function CanvasEmptyState() {
  const [hidden, setHidden] = useState(true);

  // Read persisted preference on mount (client-only) to avoid SSR mismatch.
  useEffect(() => {
    setHidden(isDismissed());
  }, []);

  if (hidden) return null;

  return (
    <Panel
      position="top-center"
      className="bg-background/60 pointer-events-none !m-0 flex h-full w-full items-center justify-center backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Animated drag hint */}
        <div className="relative">
          <div className="bg-muted/60 flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed">
            <MousePointerClick size={32} className="text-muted-foreground/60" />
          </div>
          {/* Animated arrow pointing left toward palette */}
          <div className="absolute top-1/2 -left-12 -translate-y-1/2 animate-pulse">
            <ArrowLeft size={24} className="text-primary/50" />
          </div>
        </div>

        <div>
          <p className="text-muted-foreground text-sm font-medium">
            Drag blocks from the sidebar
          </p>
          <p className="text-muted-foreground/60 mt-1 max-w-[280px] text-xs">
            Connect components to the Users block to route traffic through your
            system architecture
          </p>
        </div>

        <button
          onClick={() => {
            markDismissed();
            setHidden(true);
          }}
          className="text-muted-foreground/50 hover:text-muted-foreground pointer-events-auto text-[11px] underline-offset-2 transition-colors hover:underline"
        >
          Don&apos;t show me again
        </button>
      </div>
    </Panel>
  );
}
