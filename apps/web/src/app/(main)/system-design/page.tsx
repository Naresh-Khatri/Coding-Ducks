"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  Star,
  DollarSign,
  Clock,
  Cpu,
  Activity,
  Gauge,
  History,
  CheckCircle,
  XCircle,
  Eye,
  LayoutGrid,
  List,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LEVELS } from "~/data/system-design";
import { useTRPC } from "~/trpc/react";
import { authClient } from "~/auth/client";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import {
  getBlockDefinition,
  TRAFFIC_SOURCE_BLOCK,
} from "~/lib/system-design/block-registry";
import { BlockNode } from "~/app/(system-design)/system-design/[slug]/_components/block-node";
import { CustomEdge } from "~/app/(system-design)/system-design/[slug]/_components/custom-edge";
import type { BlockNodeData } from "~/lib/system-design/types";

const DIFFICULTY_COLORS = {
  beginner: "bg-green-500/10 text-green-500 border-green-500/20",
  intermediate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  advanced: "bg-red-500/10 text-red-500 border-red-500/20",
};

const nodeTypes = { blockNode: BlockNode };
const edgeTypes = { customEdge: CustomEdge };

export default function SystemDesignPage() {
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();
  const [historySlug, setHistorySlug] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "table">(() => {
    try {
      return (localStorage.getItem("sd-levels-view") as "grid" | "table") ?? "grid";
    } catch {
      return "grid";
    }
  });

  const handleViewChange = (v: "grid" | "table") => {
    setView(v);
    try {
      localStorage.setItem("sd-levels-view", v);
    } catch {}
  };

  const { data: progress } = useQuery(
    trpc.systemDesign.myProgress.queryOptions(undefined, {
      enabled: !!session?.user,
    }),
  );

  const { data: recentAttempts } = useQuery(
    trpc.systemDesign.recentAttempts.queryOptions(undefined, {
      enabled: !!session?.user,
    }),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Cpu className="text-primary" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">System Design</h1>
            <p className="text-muted-foreground text-sm">
              Build architectures from blocks and test them against real traffic
              patterns
            </p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">
          {LEVELS.length} {LEVELS.length === 1 ? "Level" : "Levels"}
        </h2>
        <div className="bg-muted flex rounded-lg p-0.5">
          <button
            onClick={() => handleViewChange("grid")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Grid view"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => handleViewChange("table")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "table"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Table view"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Level Grid */}
      {view === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((level) => {
            const attempt = progress?.[level.slug];
            const stars = attempt?.stars ?? 0;
            const hasAttempt = !!attempt;

            return (
              <div
                key={level.slug}
                className="bg-card group rounded-xl border p-5 transition-shadow hover:shadow-lg"
              >
                {/* Difficulty + Stars */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      DIFFICULTY_COLORS[level.difficulty],
                    )}
                  >
                    {level.difficulty}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={cn(
                          s <= stars
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/20",
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Title + Description */}
                <h2 className="mb-1 text-base font-semibold">{level.title}</h2>
                <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                  {level.description}
                </p>

                {/* Meta */}
                <div className="text-muted-foreground mb-4 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <DollarSign size={12} />${level.budget}/mo
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {level.durationSeconds}s
                  </span>
                </div>

                {/* Best attempt stats */}
                {hasAttempt && (
                  <div className="bg-muted/50 mb-4 grid grid-cols-3 gap-2 rounded-lg p-2.5 text-center">
                    <div>
                      <div className="text-muted-foreground text-[10px]">
                        Uptime
                      </div>
                      <div className="text-xs font-semibold tabular-nums">
                        {((attempt.uptimePercent ?? 0) / 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px]">
                        Latency
                      </div>
                      <div className="text-xs font-semibold tabular-nums">
                        {attempt.avgLatencyMs ?? 0}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px]">
                        Cost
                      </div>
                      <div className="text-xs font-semibold tabular-nums">
                        ${((attempt.totalCost ?? 0) / 100).toFixed(0)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/system-design/${level.slug}`}>
                      {!hasAttempt
                        ? "Start"
                        : stars < 3
                          ? "Improve"
                          : "Retry"}
                    </Link>
                  </Button>
                  {hasAttempt && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 px-2.5"
                      onClick={() => setHistorySlug(level.slug)}
                    >
                      <History size={14} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Level Table */}
      {view === "table" && (
        <div className="bg-card overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="text-muted-foreground px-4 py-2.5 text-xs font-medium">
                  Level
                </th>
                <th className="text-muted-foreground px-4 py-2.5 text-xs font-medium">
                  Difficulty
                </th>
                <th className="text-muted-foreground hidden px-4 py-2.5 text-xs font-medium sm:table-cell">
                  Budget
                </th>
                <th className="text-muted-foreground hidden px-4 py-2.5 text-xs font-medium md:table-cell">
                  Duration
                </th>
                <th className="text-muted-foreground px-4 py-2.5 text-xs font-medium">
                  Stars
                </th>
                <th className="text-muted-foreground hidden px-4 py-2.5 text-xs font-medium sm:table-cell">
                  Best Uptime
                </th>
                <th className="text-muted-foreground hidden px-4 py-2.5 text-xs font-medium md:table-cell">
                  Best Latency
                </th>
                <th className="text-muted-foreground px-4 py-2.5 text-right text-xs font-medium" />
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((level) => {
                const attempt = progress?.[level.slug];
                const stars = attempt?.stars ?? 0;
                const hasAttempt = !!attempt;

                return (
                  <tr
                    key={level.slug}
                    className="hover:bg-muted/50 border-b transition-colors last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/system-design/${level.slug}`}
                        className="hover:text-primary text-sm font-medium transition-colors"
                      >
                        {level.title}
                      </Link>
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                        {level.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          DIFFICULTY_COLORS[level.difficulty],
                        )}
                      >
                        {level.difficulty}
                      </span>
                    </td>
                    <td className="text-muted-foreground hidden px-4 py-3 text-xs tabular-nums sm:table-cell">
                      ${level.budget}/mo
                    </td>
                    <td className="text-muted-foreground hidden px-4 py-3 text-xs tabular-nums md:table-cell">
                      {level.durationSeconds}s
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={cn(
                              s <= stars
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/20",
                            )}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-xs tabular-nums sm:table-cell">
                      {hasAttempt
                        ? `${((attempt.uptimePercent ?? 0) / 100).toFixed(1)}%`
                        : <span className="text-muted-foreground">--</span>}
                    </td>
                    <td className="hidden px-4 py-3 text-xs tabular-nums md:table-cell">
                      {hasAttempt
                        ? `${attempt.avgLatencyMs ?? 0}ms`
                        : <span className="text-muted-foreground">--</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasAttempt && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setHistorySlug(level.slug)}
                            title="View history"
                          >
                            <History size={13} />
                          </Button>
                        )}
                        <Button asChild size="sm" className="h-7 px-3 text-xs">
                          <Link href={`/system-design/${level.slug}`}>
                            {!hasAttempt
                              ? "Start"
                              : stars < 3
                                ? "Improve"
                                : "Retry"}
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {LEVELS.length === 0 && (
        <div className="text-muted-foreground py-20 text-center">
          No levels available yet.
        </div>
      )}

      {/* Recent Submissions */}
      {recentAttempts && recentAttempts.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Recent Submissions</h2>
          <div className="bg-card overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="text-muted-foreground px-4 py-2.5 text-xs font-medium">
                    Status
                  </th>
                  <th className="text-muted-foreground px-4 py-2.5 text-xs font-medium">
                    Level
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-2.5 text-xs font-medium sm:table-cell">
                    Uptime
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-2.5 text-xs font-medium sm:table-cell">
                    Latency
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-2.5 text-xs font-medium md:table-cell">
                    Cost
                  </th>
                  <th className="text-muted-foreground px-4 py-2.5 text-xs font-medium">
                    Stars
                  </th>
                  <th className="text-muted-foreground px-4 py-2.5 text-right text-xs font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((a) => {
                  const level = LEVELS.find((l) => l.slug === a.levelSlug);
                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-muted/50 border-b last:border-0 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        {a.passed ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-green-500">
                            <CheckCircle size={14} />
                            Passed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                            <XCircle size={14} />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/system-design/${a.levelSlug}`}
                          className="hover:text-primary text-xs font-medium transition-colors"
                        >
                          {level?.title ?? a.levelSlug}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-2.5 text-xs tabular-nums sm:table-cell">
                        {((a.uptimePercent ?? 0) / 100).toFixed(1)}%
                      </td>
                      <td className="hidden px-4 py-2.5 text-xs tabular-nums sm:table-cell">
                        {a.avgLatencyMs ?? 0}ms
                      </td>
                      <td className="hidden px-4 py-2.5 text-xs tabular-nums md:table-cell">
                        ${((a.totalCost ?? 0) / 100).toFixed(0)}/mo
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              className={cn(
                                s <= (a.stars ?? 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/20",
                              )}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="text-muted-foreground px-4 py-2.5 text-right text-xs">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attempt History Dialog */}
      <AttemptHistoryDialog
        levelSlug={historySlug}
        onClose={() => setHistorySlug(null)}
      />
    </div>
  );
}

// ---- Attempt History Dialog with Graph Preview ----

interface SavedGraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    definitionType: string;
    provider?: string;
    replicas?: number;
    isStartBlock?: boolean;
  };
}

interface SavedGraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface SavedGraph {
  nodes: SavedGraphNode[];
  edges: SavedGraphEdge[];
}

function reconstructGraph(graph: SavedGraph): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = graph.nodes.map((saved) => {
    let definition;
    if (saved.data.isStartBlock || saved.data.definitionType === "traffic-source") {
      definition = TRAFFIC_SOURCE_BLOCK;
    } else {
      const baseDef = getBlockDefinition(saved.data.definitionType);
      if (!baseDef) {
        definition = {
          type: saved.data.definitionType,
          label: saved.data.definitionType,
          name: saved.data.provider ?? saved.data.definitionType,
          category: "compute" as const,
          description: "",
          icon: "Box",
          costPerMonth: 0,
          ports: [],
          maxRps: 0,
          maxConnections: 0,
          baseLatencyMs: 0,
          routingStrategy: "none" as const,
        };
      } else {
        const provider = saved.data.provider
          ? baseDef.providers?.find((p) => p.provider === saved.data.provider)
          : undefined;
        definition = provider
          ? {
              ...baseDef,
              name: provider.provider,
              costPerMonth: provider.costPerMonth,
              maxRps: provider.maxRps,
              maxConnections: provider.maxConnections,
              baseLatencyMs: provider.baseLatencyMs,
            }
          : baseDef;
      }
    }

    return {
      id: saved.id,
      type: "blockNode",
      position: saved.position,
      data: {
        definition,
        instanceId: saved.id,
        isStartBlock:
          saved.data.isStartBlock ||
          saved.data.definitionType === "traffic-source",
        replicas: saved.data.replicas ?? 1,
        currentRps: 0,
        currentLatencyMs: 0,
        loadPercent: 0,
        failedRequests: 0,
        queueDepth: 0,
        status: "idle",
      } satisfies BlockNodeData,
    };
  });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: "customEdge",
  }));

  return { nodes, edges };
}

function AttemptHistoryDialog({
  levelSlug,
  onClose,
}: {
  levelSlug: string | null;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const level = LEVELS.find((l) => l.slug === levelSlug);
  const [viewingGraph, setViewingGraph] = useState<SavedGraph | null>(null);

  const { data: attempts, isLoading } = useQuery(
    trpc.systemDesign.myAttempts.queryOptions(
      { levelSlug: levelSlug! },
      { enabled: !!levelSlug },
    ),
  );

  const handleClose = useCallback(() => {
    setViewingGraph(null);
    onClose();
  }, [onClose]);

  if (viewingGraph) {
    return (
      <GraphPreviewDialog
        graph={viewingGraph}
        onClose={() => setViewingGraph(null)}
      />
    );
  }

  return (
    <Dialog open={!!levelSlug} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History size={16} />
            {level?.title ?? "Attempts"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Loading...
          </div>
        ) : !attempts?.length ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No attempts yet.
          </div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {attempts.map((a) => (
              <div
                key={a.id}
                className="bg-muted/50 flex items-center gap-3 rounded-lg p-3"
              >
                {/* Pass/Fail icon */}
                {a.passed ? (
                  <CheckCircle size={16} className="shrink-0 text-green-500" />
                ) : (
                  <XCircle size={16} className="shrink-0 text-red-500" />
                )}

                {/* Stars */}
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      size={10}
                      className={cn(
                        s <= (a.stars ?? 0)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/20",
                      )}
                    />
                  ))}
                </div>

                {/* Stats */}
                <div className="flex flex-1 items-center gap-3 text-[11px]">
                  <span
                    className="text-muted-foreground flex items-center gap-0.5"
                    title="Uptime"
                  >
                    <Activity size={10} />
                    {((a.uptimePercent ?? 0) / 100).toFixed(1)}%
                  </span>
                  <span
                    className="text-muted-foreground flex items-center gap-0.5"
                    title="Latency"
                  >
                    <Gauge size={10} />
                    {a.avgLatencyMs ?? 0}ms
                  </span>
                  <span
                    className="text-muted-foreground flex items-center gap-0.5"
                    title="Cost"
                  >
                    <DollarSign size={10} />${((a.totalCost ?? 0) / 100).toFixed(0)}
                  </span>
                </div>

                {/* View graph button */}
                <button
                  onClick={() => setViewingGraph(a.graph as SavedGraph)}
                  className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  title="View design"
                >
                  <Eye size={14} />
                </button>

                {/* Date */}
                <span className="text-muted-foreground shrink-0 text-[10px]">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---- Graph Preview Dialog ----

function GraphPreviewDialog({
  graph,
  onClose,
}: {
  graph: SavedGraph;
  onClose: () => void;
}) {
  const { nodes, edges } = reconstructGraph(graph);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[70vh] max-w-3xl p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Eye size={16} />
            Architecture Design
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden px-2 pb-2">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag
            zoomOnScroll
            fitView
            className="bg-background rounded-lg"
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} />
          </ReactFlow>
        </div>
      </DialogContent>
    </Dialog>
  );
}
