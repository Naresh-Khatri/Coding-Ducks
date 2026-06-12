"use client";

import { useEffect, useRef, useState } from "react";
import { SquareTerminal, Trash2, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { PreviewConsoleEntry } from "~/lib/webcontainer/preview-console";
import type { WebContainerRuntime } from "~/lib/webcontainer/use-runtime";

// Keep at most this many rows in the DOM; older entries scroll off the top.
const MAX_ROWS = 1000;

const LEVEL_ROW: Record<PreviewConsoleEntry["level"], string> = {
  error: "bg-red-500/10 text-red-300",
  warn: "bg-amber-500/10 text-amber-200",
  info: "text-sky-300",
  debug: "text-zinc-500",
  log: "text-zinc-200",
};

/**
 * A DevTools-style console for the WebContainer preview: shows `console.*`
 * output and uncaught errors forwarded from the running app (see
 * `lib/webcontainer/preview-console`). Incoming entries are coalesced per
 * animation frame so a chatty app can't trigger a React render per log line.
 */
export function ConsolePanel({
  runtime,
  onClose,
}: {
  runtime: WebContainerRuntime;
  onClose?: () => void;
}) {
  const { subscribeConsole, clearConsole } = runtime;
  const [entries, setEntries] = useState<PreviewConsoleEntry[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Stick to the bottom only when the user is already there.
  const atBottomRef = useRef(true);

  useEffect(() => {
    const pending: PreviewConsoleEntry[] = [];
    let raf: number | null = null;

    const flush = () => {
      raf = null;
      if (pending.length === 0) return;
      const batch = pending.splice(0, pending.length);
      setEntries((prev) => {
        const combined =
          prev.length + batch.length > MAX_ROWS
            ? prev.concat(batch).slice(-MAX_ROWS)
            : prev.concat(batch);
        return combined;
      });
    };

    const unsub = subscribeConsole((entry) => {
      pending.push(entry);
      raf ??= requestAnimationFrame(flush);
    });

    return () => {
      unsub();
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [subscribeConsole]);

  // Follow the tail after each batch, unless the user has scrolled up to read.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const handleClear = () => {
    clearConsole();
    setEntries([]);
    atBottomRef.current = true;
  };

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      <div className="bg-muted/20 flex items-center gap-1 border-b px-2 py-1">
        <SquareTerminal className="text-muted-foreground size-3.5" />
        <span className="text-xs font-medium">Console</span>
        {entries.length > 0 && (
          <span className="text-muted-foreground/70 text-[11px]">
            {entries.length}
          </span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={handleClear}
            disabled={entries.length === 0}
            title="Clear console"
          >
            <Trash2 className="size-3.5" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={onClose}
              title="Hide console"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {entries.length === 0 ? (
          <div className="text-muted-foreground/60 flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-xs">
            <SquareTerminal className="size-5 opacity-40" />
            <p>Logs and errors from your running preview will show up here.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "border-b border-white/[0.04] px-3 py-1 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap",
                LEVEL_ROW[entry.level],
              )}
            >
              {entry.text || " "}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Header toggle for the preview console. Owns its own unread/error indicator so
 * the surrounding workspace doesn't re-render on every forwarded log line — the
 * subscription lives entirely in this leaf component.
 */
export function ConsoleToggleButton({
  runtime,
  open,
  onToggle,
}: {
  runtime: WebContainerRuntime;
  open: boolean;
  onToggle: () => void;
}) {
  const { subscribeConsole } = runtime;
  const [unread, setUnread] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Track `open` in a ref so the long-lived subscription callback can read the
  // latest value without re-subscribing. Ref writes in an effect are fine — the
  // lint rule only forbids writing refs during render.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // While open, entries are visible, so the subscription doesn't accrue unread.
  useEffect(() => {
    return subscribeConsole((entry) => {
      if (openRef.current) return;
      setUnread((n) => n + 1);
      if (entry.level === "error") setHasError(true);
    });
  }, [subscribeConsole]);

  const handleClick = () => {
    // Opening the console marks everything currently logged as seen. (Opening
    // only ever happens through this button, so this is the one place to reset.)
    if (!open) {
      setUnread(0);
      setHasError(false);
    }
    onToggle();
  };

  return (
    <Button
      variant={open ? "secondary" : "ghost"}
      size="sm"
      className="h-6 gap-1 rounded-xs px-2 text-xs"
      onClick={handleClick}
      title="Toggle preview console"
    >
      <SquareTerminal className="size-3.5" />
      <span className="hidden md:inline">Console</span>
      {!open && unread > 0 && (
        <span
          className={cn(
            "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-medium",
            hasError
              ? "bg-red-500 text-white"
              : "bg-muted-foreground/30 text-foreground",
          )}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Button>
  );
}
