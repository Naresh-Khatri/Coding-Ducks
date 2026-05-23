"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle, Redo2, RotateCcw, Undo2 } from "lucide-react";

import { authClient } from "~/auth/client";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/hooks/use-confirm";
import { useSystemDesignStore } from "~/lib/system-design/store";
import { cn } from "~/lib/utils";
import { startSystemDesignTour } from "./onboarding-tour";

const DIFFICULTY_COLORS = {
  beginner: "bg-green-500/10 text-green-500",
  intermediate: "bg-amber-500/10 text-amber-500",
  advanced: "bg-red-500/10 text-red-500",
};

const SPEEDS = [1, 2, 5, 10];

export function TopBar() {
  const level = useSystemDesignStore((s) => s.level);
  const phase = useSystemDesignStore((s) => s.phase);
  const reset = useSystemDesignStore((s) => s.reset);
  const undo = useSystemDesignStore((s) => s.undo);
  const redo = useSystemDesignStore((s) => s.redo);
  const canUndo = useSystemDesignStore((s) => s.canUndo);
  const canRedo = useSystemDesignStore((s) => s.canRedo);
  const { data: session } = authClient.useSession();

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault();
        useSystemDesignStore.getState().undo();
      } else if (mod && key === "z" && e.shiftKey) {
        e.preventDefault();
        useSystemDesignStore.getState().redo();
      } else if (mod && key === "y") {
        e.preventDefault();
        useSystemDesignStore.getState().redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!level) return null;

  const handleReset = () => {
    reset();
    if (level) {
      useSystemDesignStore.getState().setLevel(level);
    }
  };

  const [confirmResetDialog, triggerReset] = useConfirm({
    title: "Reset canvas?",
    description:
      "This will remove all blocks and connections. This action cannot be undone.",
    onConfirm: handleReset,
    confirmLabel: "Reset",
  });

  return (
    <div className="bg-card flex h-12 items-center gap-3 border-b px-4">
      {/* Back */}
      <Link
        href="/system-design"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={18} />
      </Link>

      {/* Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold">{level.title}</h1>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            DIFFICULTY_COLORS[level.difficulty],
          )}
        >
          {level.difficulty}
        </span>
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-1.5" data-tour="sd-phase">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            phase === "building"
              ? "bg-blue-500"
              : phase === "production"
                ? "animate-pulse bg-green-500"
                : "bg-amber-500",
          )}
        />
        <span className="text-muted-foreground text-xs capitalize">
          {phase}
        </span>
      </div>

      <div className="flex-1" />

      {/* Controls */}
      {phase === "building" && (
        <div className="flex items-center gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={undo}
            disabled={!canUndo}
            className="h-8 w-8 p-0"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={redo}
            disabled={!canRedo}
            className="h-8 w-8 p-0"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={14} />
          </Button>
        </div>
      )}

      {!session?.user && (
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          onClick={() =>
            authClient.signIn.social({
              provider: "google",
              callbackURL: window.location.pathname,
            })
          }
        >
          Sign In
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={() => startSystemDesignTour()}
        className="h-8 w-8 p-0"
        title="Restart tour"
      >
        <HelpCircle size={14} />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={triggerReset}
        className="h-8 w-8 p-0"
        title="Reset canvas"
      >
        <RotateCcw size={14} />
      </Button>
      {confirmResetDialog}
    </div>
  );
}
