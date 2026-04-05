import { useReactFlow } from "@xyflow/react";
import { Fullscreen, Minus, Plus } from "lucide-react";

import { useSystemDesignStore } from "~/lib/system-design/store";
import { cn } from "~/lib/utils";

export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const sidebarMode = useSystemDesignStore((s) => s.sidebarMode);
  return (
    <div
      className={cn(
        "absolute bottom-3 z-10 flex flex-col gap-1",
        sidebarMode === "fixed" ? "left-2" : "left-12",
      )}
    >
      <button
        onClick={() => zoomIn()}
        className="bg-card text-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-md border shadow-sm transition-colors"
        title="Zoom in"
      >
        <Plus size={14} />
      </button>
      <button
        onClick={() => zoomOut()}
        className="bg-card text-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-md border shadow-sm transition-colors"
        title="Zoom out"
      >
        <Minus size={14} />
      </button>
      <button
        onClick={() => fitView({ padding: 0.2 })}
        className="bg-card text-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-md border shadow-sm transition-colors"
        title="Fit view"
      >
        <Fullscreen size={14} />
      </button>
    </div>
  );
}
