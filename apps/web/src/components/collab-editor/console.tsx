import { useEffect, useRef } from "react";
import { Ban, Terminal, ChevronDown } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";

export interface LogEntry {
  method: "log" | "warn" | "error" | "info";
  args: any[];
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

  const formatArg = (arg: any) => {
    if (typeof arg === "object") {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  };

  return (
    <div className={`flex flex-col bg-[#1e1e1e] text-xs font-mono h-full ${className}`}>
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-700 bg-[#252526]">
        <div className="flex items-center gap-2 text-gray-400">
          <Terminal className="w-3 h-3" />
          <span className="font-semibold">Console</span>
        </div>
        <div className="flex items-center gap-1">
          {logs.filter((l) => l.method === "error").length > 0 && (
            <div className="flex items-center justify-center bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 mr-2">
              {logs.filter((l) => l.method === "error").length}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-5 w-5 hover:bg-white/10 text-gray-400 hover:text-white"
            title="Clear Console"
          >
            <Ban className="w-3 h-3" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-5 w-5 hover:bg-white/10 text-gray-400 hover:text-white"
              title="Close Console"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1" ref={scrollRef}>
        {logs.length === 0 && (
          <div className="text-gray-600 italic text-center mt-4">No logs yet...</div>
        )}
        {logs.map((log, i) => (
          <div
            key={i}
            className={`flex gap-2 p-1 rounded font-mono break-all whitespace-pre-wrap ${log.method === "error"
              ? "bg-red-950/30 text-red-200 border-l-2 border-red-500"
              : log.method === "warn"
                ? "bg-yellow-950/30 text-yellow-200 border-l-2 border-yellow-500"
                : "text-gray-300 border-l-2 border-transparent"
              }`}
          >
            <span className="text-gray-500 select-none min-w-[3rem] text-[10px] pt-0.5">
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: "2-digit", second: "2-digit" })}
            </span>
            <div className="flex-1 flex flex-col">
              <div>
                {log.args.map((arg, j) => (
                  <span key={j} className="mr-2">
                    {formatArg(arg)}
                  </span>
                ))}
              </div>
              {log.lineno && (
                <div className="text-[10px] opacity-70 mt-1">
                  at line {log.lineno}{log.colno ? `:${log.colno}` : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
