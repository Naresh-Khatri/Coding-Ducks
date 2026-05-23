"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

const INTENSITY_CLASSES = [
  "bg-muted",
  "bg-emerald-900/60",
  "bg-emerald-700/70",
  "bg-emerald-500/80",
  "bg-emerald-400",
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getIntensity(count: number): number {
  if (count === 0) return 0;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export function SubmissionHeatmap({ username }: { username: string }) {
  const trpc = useTRPC();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: heatmapData } = useQuery(
    trpc.profile.heatmap.queryOptions({ username, year }),
  );

  const { grid, monthLabels, totalSubmissions } = useMemo(() => {
    const countMap = new Map<string, number>();
    let total = 0;
    for (const d of heatmapData ?? []) {
      countMap.set(d.date, d.count);
      total += d.count;
    }

    // Build 52x7 grid starting from first Sunday of the year
    const startDate = new Date(year, 0, 1);
    const startDay = startDate.getDay();
    // Roll back to previous Sunday
    startDate.setDate(startDate.getDate() - startDay);

    const weeks: { date: string; count: number }[][] = [];
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;

    for (let week = 0; week < 53; week++) {
      const days: { date: string; count: number }[] = [];
      for (let day = 0; day < 7; day++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + week * 7 + day);
        const dateStr = d.toISOString().split("T")[0]!;
        const count = countMap.get(dateStr) ?? 0;
        days.push({ date: dateStr, count });

        if (d.getMonth() !== lastMonth && d.getFullYear() === year) {
          months.push({ label: MONTHS[d.getMonth()]!, col: week });
          lastMonth = d.getMonth();
        }
      }
      weeks.push(days);
    }

    return { grid: weeks, monthLabels: months, totalSubmissions: total };
  }, [heatmapData, year]);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {totalSubmissions} submissions in {year}
        </h3>
        <div className="flex gap-1">
          {[currentYear - 1, currentYear].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={cn(
                "rounded px-2 py-1 text-xs transition-colors",
                year === y
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="">
          {/* Month labels */}
          <div
            className="text-muted-foreground mb-1 flex text-xs"
            style={{ paddingLeft: 28 }}
          >
            {/* {monthLabels.map((m, i) => ( */}
            {/*   <span */}
            {/*     key={i} */}
            {/*     className="absolute" */}
            {/*     style={{ marginLeft: m.col * 14 }} */}
            {/*   > */}
            {/*     {m.label} */}
            {/*   </span> */}
            {/* ))} */}
          </div>

          <div className="relative mb-1 h-4">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-muted-foreground absolute text-[10px]"
                style={{ left: 28 + m.col * 14 }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 pr-1">
              {DAYS.map((d, i) => (
                <div
                  key={i}
                  className="text-muted-foreground flex h-[10px] items-center text-[9px] leading-none"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={cn(
                      "size-3 rounded-[2px] transition-colors",
                      INTENSITY_CLASSES[getIntensity(day.count)],
                    )}
                    title={`${day.date}: ${day.count} submission${day.count !== 1 ? "s" : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="text-muted-foreground mt-3 flex items-center justify-end gap-1 text-xs">
            <span>Less</span>
            {INTENSITY_CLASSES.map((cls, i) => (
              <div
                key={i}
                className={cn("h-[10px] w-[10px] rounded-[2px]", cls)}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
