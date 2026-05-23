import { useEffect, useRef } from "react";
import { Ban, ChevronDown, Terminal } from "lucide-react";

import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";

export interface LogEntry {
  method: "log" | "warn" | "error" | "info";
  args: unknown[];
  timestamp: number;
  lineno?: number;
  colno?: number;
}

interface ConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
  onClose?: () => void;
  className?: string;
}

export function Console({ logs, onClear, onClose, className }: ConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatArg = (arg: unknown) => {
    if (typeof arg === "object" && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  };

  return (
    <div
      className={`flex h-full flex-col bg-[#1e1e1e] font-mono text-xs ${className}`}
    >
      <div className="flex items-center justify-between border-b border-gray-700 bg-[#252526] px-3 py-1">
        <div className="flex items-center gap-2 text-gray-400">
          <Terminal className="h-3 w-3" />
          <span className="font-semibold">Console</span>
        </div>
        <div className="flex items-center gap-1">
          {logs.filter((l) => l.method === "error").length > 0 && (
            <div className="mr-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {logs.filter((l) => l.method === "error").length}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-5 w-5 text-gray-400 hover:bg-white/10 hover:text-white"
            title="Clear Console"
            aria-label="Clear console"
          >
            <Ban className="h-3 w-3" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-5 w-5 text-gray-400 hover:bg-white/10 hover:text-white"
              title="Close Console"
              aria-label="Close console"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-auto p-2" ref={scrollRef}>
        {logs.length === 0 && (
          <div className="mt-4 text-center text-gray-600 italic">
            No logs yet...
          </div>
        )}
        {logs.map((log, i) => (
          <div
            key={i}
            className={`flex gap-2 rounded p-1 font-mono break-all whitespace-pre-wrap ${
              log.method === "error"
                ? "border-l-2 border-red-500 bg-red-950/30 text-red-200"
                : log.method === "warn"
                  ? "border-l-2 border-amber-500 bg-amber-950/30 text-amber-200"
                  : "border-l-2 border-transparent text-gray-300"
            }`}
          >
            <span className="min-w-[3rem] pt-0.5 text-[10px] text-gray-500 select-none">
              {new Date(log.timestamp).toLocaleTimeString([], {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <div className="flex flex-1 flex-col">
              <div>
                {log.args.map((arg, j) => (
                  <span key={j} className="mr-2">
                    {formatArg(arg)}
                  </span>
                ))}
              </div>
              {log.lineno && (
                <div className="mt-1 text-[10px] opacity-70">
                  at line {log.lineno}
                  {log.colno ? `:${log.colno}` : ""}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
