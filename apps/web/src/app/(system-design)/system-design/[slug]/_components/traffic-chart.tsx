"use client";

import { useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Play, Pause, Radio, SlidersHorizontal, SkipForward } from "lucide-react";
import { useSystemDesignStore } from "~/lib/system-design/store";
import { cn } from "~/lib/utils";

function interpolateExpectedRps(
  time: number,
  pattern: { time: number; rps: number }[],
): number {
  if (pattern.length === 0) return 0;
  if (time <= pattern[0]!.time) return pattern[0]!.rps;
  if (time >= pattern[pattern.length - 1]!.time)
    return pattern[pattern.length - 1]!.rps;
  for (let i = 0; i < pattern.length - 1; i++) {
    const curr = pattern[i]!;
    const next = pattern[i + 1]!;
    if (time >= curr.time && time <= next.time) {
      const t =
        curr.time === next.time
          ? 0
          : (time - curr.time) / (next.time - curr.time);
      return curr.rps + t * (next.rps - curr.rps);
    }
  }
  return pattern[pattern.length - 1]!.rps;
}

const SPEEDS = [1, 2, 5, 10];

export function TrafficChart() {
  const simulationTimeline = useSystemDesignStore((s) => s.simulationTimeline);
  const simulationTick = useSystemDesignStore((s) => s.simulationTick);
  const simulationSpeed = useSystemDesignStore((s) => s.simulationSpeed);
  const setSimulationSpeed = useSystemDesignStore((s) => s.setSimulationSpeed);
  const simulationPaused = useSystemDesignStore((s) => s.simulationPaused);
  const togglePause = useSystemDesignStore((s) => s.togglePause);
  const level = useSystemDesignStore((s) => s.level);
  const seekToTick = useSystemDesignStore((s) => s.seekToTick);
  const timelineMode = useSystemDesignStore((s) => s.timelineMode);
  const setTimelineMode = useSystemDesignStore((s) => s.setTimelineMode);
  const setPhase = useSystemDesignStore((s) => s.setPhase);

  if (!level) return null;

  const isLive = timelineMode === "live";

  const visibleTimeline = isLive
    ? simulationTimeline.slice(0, simulationTick + 1)
    : simulationTimeline;

  const data = visibleTimeline.map((tick) => ({
    time: tick.time,
    successful: tick.successfulRps,
    failed: tick.failedRps,
    expected: Math.round(
      interpolateExpectedRps(tick.time, level.trafficPattern),
    ),
  }));

  const currentTime =
    simulationTick < simulationTimeline.length
      ? simulationTimeline[simulationTick]?.time
      : simulationTimeline[simulationTimeline.length - 1]?.time;

  const handleSeek = useCallback(
    (value: number) => {
      const idx = simulationTimeline.findIndex((t) => t.time >= value);
      if (idx >= 0) seekToTick(idx);
    },
    [simulationTimeline, seekToTick],
  );

  const totalDuration = level.durationSeconds;

  return (
    <div className="flex h-full w-full flex-col">
      {/* Controls bar */}
      <div className="flex items-center gap-2 border-b px-3 py-1">
        {/* Play/Pause */}
        <button
          onClick={togglePause}
          className="hover:bg-muted flex h-6 w-6 items-center justify-center rounded-md transition-colors"
        >
          {simulationPaused ? <Play size={12} /> : <Pause size={12} />}
        </button>

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
          <button
            onClick={() => setTimelineMode("live")}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
              isLive
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Radio size={11} />
            Live
          </button>
          <button
            onClick={() => setTimelineMode("review")}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
              !isLive
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <SlidersHorizontal size={11} />
            Replay
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => setSimulationSpeed(speed)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                simulationSpeed === speed
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Time display */}
        <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
          {isLive
            ? `${simulationTick}s`
            : `${simulationTick}s / ${totalDuration}s`}
        </span>

        {/* End simulation */}
        <button
          onClick={() => setPhase("results")}
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors"
        >
          <SkipForward size={11} />
          End
        </button>
      </div>

      {/* Chart */}
      <div className="min-h-0 flex-1 px-2 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onClick={
              !isLive
                ? (e) => {
                    if (e?.activeLabel != null) {
                      handleSeek(Number(e.activeLabel));
                    }
                  }
                : undefined
            }
            style={!isLive ? { cursor: "pointer" } : undefined}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              opacity={0.3}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              domain={[0, totalDuration]}
              type="number"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 11,
              }}
            />
            {!isLive && currentTime != null && (
              <ReferenceLine
                x={currentTime}
                stroke="var(--color-foreground)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            )}
            <Area
              type="monotone"
              dataKey="expected"
              stroke="#6b7280"
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              name="Expected"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="successful"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.2}
              strokeWidth={1.5}
              name="Successful"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="failed"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.2}
              strokeWidth={1.5}
              name="Failed"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Seekbar (replay mode only) */}
      {!isLive && (
        <div className="flex items-center gap-3 border-t px-4 py-1.5">
          <span className="text-muted-foreground w-8 text-right font-mono text-[10px]">
            {simulationTick}s
          </span>
          <input
            type="range"
            min={0}
            max={simulationTimeline.length - 1 || 0}
            value={Math.min(simulationTick, simulationTimeline.length - 1)}
            onChange={(e) => seekToTick(Number(e.target.value))}
            className="bg-muted accent-primary h-1 flex-1 cursor-pointer appearance-none rounded-full"
          />
          <span className="text-muted-foreground w-8 font-mono text-[10px]">
            {totalDuration}s
          </span>
        </div>
      )}
    </div>
  );
}
