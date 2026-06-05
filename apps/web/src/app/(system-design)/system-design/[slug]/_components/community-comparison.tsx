"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cell, ResponsiveContainer, Bar, BarChart, XAxis } from "recharts";
import { Loader2, Users } from "lucide-react";

import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

interface CommunityComparisonProps {
  levelSlug: string;
  uptimePercent: number;
  avgLatencyMs: number;
  totalCost: number;
}

// LeetCode-style "you beat X% of builders" view shown in the results modal.
// Cost is the headline metric (the thing players optimize), rendered as a
// distribution histogram with the player's bucket highlighted; latency and
// uptime get compact percentile bars below.
export function CommunityComparison({
  levelSlug,
  uptimePercent,
  avgLatencyMs,
  totalCost,
}: CommunityComparisonProps) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.systemDesign.communityStats.queryOptions({
      levelSlug,
      uptimePercent,
      avgLatencyMs,
      totalCost,
    }),
  );

  const chartData = useMemo(
    () =>
      (data?.histogram ?? []).map((b, i) => ({
        i,
        count: b.count,
        isUser: b.isUser,
        label: `$${Math.round(b.min)}`,
      })),
    [data?.histogram],
  );

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-1.5 py-10 text-xs">
        <Loader2 size={14} className="animate-spin" />
        Comparing with the community…
      </div>
    );
  }

  if (!data || data.sampleSize === 0 || !data.cost) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <Users className="text-muted-foreground" size={24} />
        <p className="text-sm font-medium">Not enough data yet</p>
        <p className="text-muted-foreground text-xs">
          Be one of the first to set the bar on this level.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Headline: cost percentile + distribution */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-muted-foreground text-xs">
            Cost efficiency
          </span>
          <span className="text-muted-foreground text-[10px]">
            ${data.cost.value.toFixed(0)}/mo
          </span>
        </div>
        <div className="text-2xl font-bold tabular-nums text-green-500">
          Beats {data.cost.percentile.toFixed(0)}%
        </div>
        <div className="text-muted-foreground text-[11px]">
          of {data.sampleSize.toLocaleString()} passing build
          {data.sampleSize === 1 ? "" : "s"} — cheaper is better
        </div>

        <div className="mt-3 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap={1}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9 }}
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {chartData.map((d) => (
                  <Cell
                    key={d.i}
                    fill={d.isUser ? "#22c55e" : "var(--muted-foreground)"}
                    fillOpacity={d.isUser ? 1 : 0.25}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-muted-foreground -mt-1 text-center text-[10px]">
          <span className="text-green-500">▮</span> your build vs. everyone
          else&apos;s monthly cost
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="space-y-2.5 border-t pt-3">
        {data.latency && (
          <PercentileBar
            label="Latency"
            percentile={data.latency.percentile}
            value={`${data.latency.value.toFixed(0)}ms`}
          />
        )}
        {data.uptime && (
          <PercentileBar
            label="Reliability"
            percentile={data.uptime.percentile}
            value={`${data.uptime.value.toFixed(1)}%`}
          />
        )}
      </div>
    </div>
  );
}

function PercentileBar({
  label,
  percentile,
  value,
}: {
  label: string;
  percentile: number;
  value: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          <span className="text-foreground font-medium">
            Beats {percentile.toFixed(0)}%
          </span>
          <span className="text-muted-foreground ml-1.5">{value}</span>
        </span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            percentile >= 66
              ? "bg-green-500"
              : percentile >= 33
                ? "bg-amber-500"
                : "bg-muted-foreground/50",
          )}
          style={{ width: `${Math.max(percentile, 2)}%` }}
        />
      </div>
    </div>
  );
}
