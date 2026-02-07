"use client";

import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, Key, ShieldCheck, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "~/components/ui/card";
import { useTRPC } from "~/trpc/react";

const languageData = [
  { name: "Python", value: 5400 },
  { name: "JavaScript", value: 3200 },
  { name: "C++", value: 1200 },
  { name: "Go", value: 800 },
];

const COLORS = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

export default function UsageView() {
  const trpc = useTRPC();
  const { data: apiKeys } = useSuspenseQuery(trpc.apiKey.list.queryOptions());

  const [selectedKeyId, setSelectedKeyId] = useState<string>("all");

  const { data: usageHistory } = useSuspenseQuery(
    trpc.apiKey.getUsageHistory.queryOptions({ days: "7" }),
  );
  const { data: languageUsage } = useSuspenseQuery(
    trpc.apiKey.getLanguageUsage.queryOptions(),
  );

  const filteredKeys =
    selectedKeyId === "all"
      ? apiKeys
      : apiKeys.filter((k) => k.id === selectedKeyId);

  const totalRequests = filteredKeys.reduce(
    (acc: number, key) => acc + (key.totalRequests || 0),
    0,
  );
  const totalSuccessful = filteredKeys.reduce(
    (acc: number, key) => acc + (key.successfulRequests || 0),
    0,
  );
  const totalFailed = filteredKeys.reduce(
    (acc: number, key) => acc + (key.failedRequests || 0),
    0,
  );

  const errorRate =
    totalRequests > 0
      ? ((totalFailed / totalRequests) * 100).toFixed(1)
      : "0.0";

  // Data formatting for charts
  const statusChartData = usageHistory?.map((item) => ({
    date: new Date(item.day).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    successful: item.successful || 0,
    failed: item.failed || 0,
  }));

  const chartColors = [
    "var(--primary)",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="mb-1 text-2xl font-bold">Usage & Limits</h2>
          <p className="text-muted-foreground text-sm">
            Monitor your execution quotas and system health.
          </p>
        </div>

        {/* API Key Filter */}
        <div className="group relative">
          <div className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
            <Key size={14} />
          </div>
          <select
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
            className="bg-card border-border text-foreground focus:border-primary focus:ring-ring w-full min-w-[200px] appearance-none rounded-lg border py-2 pr-8 pl-9 text-sm focus:ring-1 focus:outline-none sm:w-auto"
          >
            <option value="all">All API Keys</option>
            {apiKeys.map((key) => (
              <option key={key.id} value={key.id}>
                {key.name} ({key.prefix.slice(0, 8)}...)
              </option>
            ))}
          </select>
          <div className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L5 5L9 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Limit Card */}
        <Card className="relative overflow-hidden p-6">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={60} className="text-primary" />
          </div>
          <h3 className="text-muted-foreground mb-4 text-sm font-medium uppercase">
            Total Requests
          </h3>
          <div className="mb-2 flex items-end gap-2">
            <span className="text-3xl font-bold">
              {totalRequests.toLocaleString()}
            </span>
            <span className="text-muted-foreground mb-1">/ ∞</span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((totalRequests / 10000) * 100, 100)}%`,
              }} // Arbitrary scale for visual
            ></div>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Aggregated usage count
          </p>
        </Card>

        {/* Rate Limit Card */}
        <Card className="p-6">
          <h3 className="text-muted-foreground mb-4 text-sm font-medium uppercase">
            Current Rate Limit
          </h3>
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" size={24} />
            <span className="text-xl font-bold">600 req / min</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Your plan allows for bursts up to 1000 requests.
          </p>
        </Card>

        {/* Error Rate Card */}
        <Card className="p-6">
          <h3 className="text-muted-foreground mb-4 text-sm font-medium uppercase">
            Error Rate
          </h3>
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="text-amber-500" size={24} />
            <span className="text-xl font-bold">{errorRate}%</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Failed: {totalFailed} | Successful: {totalSuccessful}
          </p>
        </Card>
      </div>

      {/* API Usage Table */}
      <Card className="overflow-hidden">
        <div className="bg-muted/50 border-b px-6 py-4">
          <h3 className="font-semibold">API Key Usage Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Prefix</th>
                <th className="px-6 py-3 font-medium">Total Req</th>
                <th className="px-6 py-3 font-medium">Success</th>
                <th className="px-6 py-3 font-medium">Failed</th>
                <th className="px-6 py-3 font-medium">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeys.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground px-6 py-4 text-center"
                  >
                    No keys found.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((key) => (
                  <tr
                    key={key.id}
                    className="hover:bg-muted/50 border-b last:border-0"
                  >
                    <td className="px-6 py-3 font-medium">{key.name}</td>
                    <td className="px-6 py-3 font-mono text-xs">
                      {key.prefix}
                    </td>
                    <td className="px-6 py-3">{key.totalRequests || 0}</td>
                    <td className="px-6 py-3 font-medium text-emerald-600">
                      {key.successfulRequests || 0}
                    </td>
                    <td className="px-6 py-3 font-medium text-red-600">
                      {key.failedRequests || 0}
                    </td>
                    <td className="text-muted-foreground px-6 py-3">
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleString()
                        : "Never"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Request Breakdown Chart */}
        <Card className="h-[400px] p-6">
          <h3 className="mb-6 text-lg font-semibold">Execution Status (7d)</h3>
          {statusChartData && statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={statusChartData} barSize={20}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar
                  dataKey="successful"
                  stackId="a"
                  fill="var(--primary)"
                  name="Successful"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="failed"
                  stackId="a"
                  fill="var(--destructive)"
                  name="Failed"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              No history data available yet.
            </div>
          )}
        </Card>

        <Card className="h-[400px] p-6">
          <h3 className="mb-2 text-lg font-semibold">Top Languages</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            Distribution of runtimes used in your requests.
          </p>
          {languageUsage && languageUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={languageUsage}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="language"
                >
                  {languageUsage.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={chartColors[index % chartColors.length]}
                      stroke="rgba(0,0,0,0)"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              No language data available yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
