"use client";

import type { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import * as Icons from "lucide-react";
import { Copy, Minus, Plus, Trash2, X } from "lucide-react";

import type { BlockNodeData } from "~/lib/system-design/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PROTOCOL_COLORS } from "~/lib/system-design/block-registry";
import { PROVIDER_ICONS } from "~/lib/system-design/provider-icons";
import { useSystemDesignStore } from "~/lib/system-design/store";
import { cn } from "~/lib/utils";

function ProviderIcon({
  name,
  size = 12,
  colored = false,
}: {
  name: string;
  size?: number;
  colored?: boolean;
}) {
  const icon = PROVIDER_ICONS[name];
  if (!icon) return null;
  return (
    <svg
      viewBox={icon.viewBox ?? "0 0 24 24"}
      width={size}
      height={size}
      fill={colored ? `#${icon.hex}` : "currentColor"}
      className="shrink-0"
    >
      <path d={icon.path} />
    </svg>
  );
}

function BlockNodeComponent({ id, data }: NodeProps) {
  const blockData = data as unknown as BlockNodeData;
  const {
    definition,
    loadPercent,
    currentRps,
    currentLatencyMs,
    status,
    isStartBlock,
    failedRequests,
    queueDepth,
    readLoadPercent,
    writeLoadPercent,
  } = blockData;
  const replicas = blockData.replicas ?? 1;
  const phase = useSystemDesignStore((s) => s.phase);
  const removeBlock = useSystemDesignStore((s) => s.removeBlock);
  const duplicateBlock = useSystemDesignStore((s) => s.duplicateBlock);
  const removeEdge = useSystemDesignStore((s) => s.removeEdge);
  const changeProvider = useSystemDesignStore((s) => s.changeProvider);
  const setReplicas = useSystemDesignStore((s) => s.setReplicas);
  const edges = useSystemDesignStore((s) => s.edges);
  const nodes = useSystemDesignStore((s) => s.nodes);
  const supportsReplicas =
    !isStartBlock &&
    definition.type !== "traffic-source" &&
    (definition.scaling ?? "counter") === "counter";

  // Compute blocks need an upstream distributor to scale: app-server/ws-server
  // need a load-balancer, workers need a message-queue. Storage scales with no
  // gate (read-replica routing happens client-side).
  const requiredDistributor: "load-balancer" | "message-queue" | null =
    definition.type === "app-server" || definition.type === "websocket-server"
      ? "load-balancer"
      : definition.type === "worker"
        ? "message-queue"
        : null;
  const hasDistributor =
    requiredDistributor === null ||
    edges.some((e) => {
      if (e.target !== id) return false;
      const src = nodes.find((n) => n.id === e.source);
      return (
        (src?.data as BlockNodeData | undefined)?.definition.type ===
        requiredDistributor
      );
    });
  const replicasGated = supportsReplicas && !hasDistributor;

  const hasProviders = definition.providers && definition.providers.length > 1;
  const [providerOpen, setProviderOpen] = useState(false);

  const IconComponent =
    (
      Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>
    )[definition.icon] ?? Icons.Box;

  const inPorts = definition.ports.filter((p) => p.direction === "in");
  const outPorts = definition.ports.filter((p) => p.direction === "out");

  const backendCount =
    definition.type === "load-balancer"
      ? edges
          .filter((e) => e.source === id)
          .reduce((sum, e) => {
            const target = nodes.find((n) => n.id === e.target);
            const reps =
              (target?.data as BlockNodeData | undefined)?.replicas ?? 1;
            return sum + reps;
          }, 0)
      : 0;

  // Find edges connected to each handle
  const getEdgesForHandle = (handleId: string, type: "source" | "target") => {
    return edges.filter(
      type === "source"
        ? (e) => e.source === id && e.sourceHandle === handleId
        : (e) => e.target === id && e.targetHandle === handleId,
    );
  };

  const borderColor =
    phase === "production"
      ? status === "failing"
        ? "border-red-600"
        : status === "overloaded"
          ? "border-red-500"
          : status === "degraded"
            ? "border-amber-500"
            : status === "healthy"
              ? "border-green-500"
              : "border-border"
      : "border-border";

  const bgGlow =
    phase === "production"
      ? status === "failing"
        ? "bg-red-600/15"
        : status === "overloaded"
          ? "bg-red-500/10"
          : status === "degraded"
            ? "bg-amber-500/10"
            : status === "healthy"
              ? "bg-green-500/10"
              : ""
      : "";

  return (
    <div
      className={cn(
        "bg-card group/node relative min-w-[180px] rounded-lg border-2 p-3 shadow-md transition-colors",
        isStartBlock ? "border-primary/50 bg-primary/5" : borderColor,
        !isStartBlock && bgGlow,
      )}
    >
      {/* Action buttons (building only, not for start block) */}
      {phase === "building" && !isStartBlock && (
        <div className="absolute -top-8 left-1/2 flex -translate-x-1/2 gap-1 opacity-0 transition-opacity group-hover/node:opacity-100">
          <button
            className="bg-card hover:bg-muted flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] shadow-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              duplicateBlock(id);
            }}
            title={
              definition.scaling === "manual"
                ? "Duplicate to add capacity — this block scales by adding more instances behind a load balancer."
                : "Duplicate block"
            }
          >
            <Copy size={11} />
            <span>
              {definition.scaling === "manual" ? "Duplicate to scale" : "Duplicate"}
            </span>
          </button>
          <button
            className="bg-card hover:bg-destructive hover:text-destructive-foreground flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] shadow-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              removeBlock(id);
            }}
            title="Remove block"
          >
            <Trash2 size={11} />
            <span>Remove</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className={cn("flex items-center gap-2", !isStartBlock && "mb-2")}>
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            isStartBlock ? "bg-primary/20" : "bg-muted",
          )}
        >
          <IconComponent size={14} />
        </div>
        <div className="min-w-0 flex-1">
          {isStartBlock ? (
            <div className="text-xs font-semibold">{definition.label}</div>
          ) : (
            <>
              <div className="flex items-center gap-1 text-xs leading-tight font-semibold">
                <span className="truncate">{definition.label}</span>
                <span className="text-muted-foreground flex items-center gap-0.5 font-normal">
                  /
                  <ProviderIcon name={definition.name} size={10} colored />
                  {definition.name}
                </span>
              </div>
              <div className="text-muted-foreground text-[10px]">
                ${definition.costPerMonth * replicas}/mo
                {replicas > 1 && (
                  <span className="text-primary ml-1 font-medium">
                    {definition.scalesReadsOnly
                      ? `1 primary + ${replicas - 1} replica${replicas > 2 ? "s" : ""}`
                      : `${replicas}× (${definition.costPerMonth} ea)`}
                  </span>
                )}
                {phase === "building" &&
                  definition.type === "load-balancer" && (
                    <span className="text-primary ml-1 font-medium">
                      · {backendCount} backend{backendCount === 1 ? "" : "s"}
                    </span>
                  )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Provider selector (building only, not for start block) */}
      {phase === "building" && hasProviders && !isStartBlock && (
        <div className="nodrag mb-2">
          <Select
            value={definition.name}
            onValueChange={(val) => changeProvider(id, val)}
            open={providerOpen}
            onOpenChange={setProviderOpen}
          >
            <SelectTrigger
              className="h-6 px-2 py-0 text-[10px] shadow-none"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => setProviderOpen((v) => !v)}
            >
              <div className="flex gap-2">
                <ProviderIcon name={definition.name} size={14} colored />
                <span className="flex items-center gap-1">
                  {definition.name}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {definition.providers!.map((p) => (
                <SelectItem
                  key={p.provider}
                  value={p.provider}
                  className="text-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <ProviderIcon name={p.provider} size={12} colored />
                    <span className="font-medium">{p.provider}</span>
                    <span className="text-muted-foreground">
                      ${p.costPerMonth} • {(p.maxRps / 1000).toFixed(0)}k RPS •{" "}
                      {p.baseLatencyMs}ms
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Replica stepper (building only) */}
      {phase === "building" && supportsReplicas && (
        <div className="nodrag mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-[10px] font-medium",
                replicasGated
                  ? "text-muted-foreground/50"
                  : "text-muted-foreground",
              )}
            >
              Replicas
            </span>
            {definition.scalesReadsOnly && (
              <span
                className="rounded-sm bg-amber-500/15 px-1 py-px text-[9px] font-medium text-amber-600 dark:text-amber-400"
                title={`Replicas add read capacity. Writes stay capped at the primary's ~${definition.maxRps.toLocaleString()} RPS regardless of replica count.`}
              >
                reads only
              </span>
            )}
            {replicasGated && (
              <span
                className="rounded-sm bg-amber-500/15 px-1 py-px text-[9px] font-medium text-amber-600 dark:text-amber-400"
                title={
                  requiredDistributor === "load-balancer"
                    ? "Connect a load balancer upstream to scale this block"
                    : "Connect a message queue upstream to scale this block"
                }
              >
                needs {requiredDistributor === "load-balancer" ? "LB" : "queue"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              className="bg-muted hover:bg-muted/70 flex h-5 w-5 items-center justify-center rounded transition-colors disabled:opacity-30"
              disabled={replicas <= 1 || replicasGated}
              onClick={(e) => {
                e.stopPropagation();
                setReplicas(id, replicas - 1);
              }}
              title="Remove a replica"
            >
              <Minus size={11} />
            </button>
            <span
              className={cn(
                "w-6 text-center text-xs font-semibold tabular-nums",
                replicasGated && "text-muted-foreground/50",
              )}
            >
              {replicas}×
            </span>
            <button
              className="bg-muted hover:bg-muted/70 flex h-5 w-5 items-center justify-center rounded transition-colors disabled:opacity-30"
              disabled={replicasGated}
              onClick={(e) => {
                e.stopPropagation();
                setReplicas(id, replicas + 1);
              }}
              title={
                replicasGated
                  ? requiredDistributor === "load-balancer"
                    ? "Connect a load balancer upstream first"
                    : "Connect a message queue upstream first"
                  : definition.scalesReadsOnly
                    ? "Add a replica (scales reads & cost; writes stay on primary)"
                    : "Add a replica (scales capacity & cost)"
              }
            >
              <Plus size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Production stats */}
      {phase === "production" && status !== "idle" && (
        <div className="space-y-1.5">
          {/* Load bar */}
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                status === "failing"
                  ? "bg-red-600"
                  : loadPercent > 90
                    ? "bg-red-500"
                    : loadPercent > 70
                      ? "bg-amber-500"
                      : "bg-green-500",
              )}
              style={{ width: `${Math.min(loadPercent, 100)}%` }}
            />
          </div>
          {/* Stats row */}
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">
              {Math.round(currentRps)} RPS
            </span>
            <span className="text-muted-foreground">
              {currentLatencyMs.toFixed(0)}ms
            </span>
            <span
              className={cn(
                "font-medium",
                status === "failing"
                  ? "text-red-600"
                  : loadPercent > 90
                    ? "text-red-500"
                    : loadPercent > 70
                      ? "text-amber-500"
                      : "text-green-500",
              )}
            >
              {Math.round(loadPercent)}%
            </span>
          </div>
          {/* Read/Write split for asymmetric sinks (e.g. SQL primary writes) */}
          {definition.scalesReadsOnly &&
            readLoadPercent !== undefined &&
            writeLoadPercent !== undefined && (
              <div className="flex justify-between text-[10px] tabular-nums">
                <span
                  className={cn(
                    "font-medium",
                    writeLoadPercent > 90
                      ? "text-red-500"
                      : writeLoadPercent > 70
                        ? "text-amber-500"
                        : "text-muted-foreground",
                  )}
                  title={`Writes are capped at the primary's ~${definition.maxRps.toLocaleString()} RPS — replicas don't help.`}
                >
                  W {Math.round(writeLoadPercent)}%
                </span>
                <span
                  className={cn(
                    "font-medium",
                    readLoadPercent > 90
                      ? "text-red-500"
                      : readLoadPercent > 70
                        ? "text-amber-500"
                        : "text-muted-foreground",
                  )}
                  title={`Reads scale to ~${(definition.maxRps * replicas).toLocaleString()} RPS across ${replicas} replica${replicas > 1 ? "s" : ""}.`}
                >
                  R {Math.round(readLoadPercent)}%
                </span>
              </div>
            )}
          {/* Queue depth indicator */}
          {queueDepth > 0 && (
            <div className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              {Math.round(queueDepth)} queued
            </div>
          )}
          {/* Failed requests indicator */}
          {status === "failing" && failedRequests > 0 && (
            <div className="flex items-center gap-1 rounded bg-red-600/20 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              {Math.round(failedRequests)} req/s failing
            </div>
          )}
        </div>
      )}

      {/* Input handles (left side) */}
      {inPorts.map((port, i) => {
        const connectedEdges = getEdgesForHandle(port.id, "target");
        const topPercent = ((i + 1) / (inPorts.length + 1)) * 100;
        const handleTitle = port.label
          ? `${port.protocol} in · ${port.label}`
          : `${port.protocol} in`;

        return (
          <div key={port.id}>
            <Handle
              type="target"
              position={Position.Left}
              id={port.id}
              title={handleTitle}
              style={{
                top: `${topPercent}%`,
                background: "transparent",
                border: "none",
                width: 22,
                height: 22,
                borderRadius: 9999,
              }}
            >
              <div
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  background: PROTOCOL_COLORS[port.protocol] ?? "#6b7280",
                  border: "2px solid var(--color-card)",
                }}
              />
            </Handle>
            {/* Per-link unlink buttons */}
            {phase === "building" &&
              connectedEdges.map((edge) => (
                <button
                  key={edge.id}
                  className="absolute opacity-0 transition-opacity group-hover/node:opacity-100"
                  style={{
                    left: -24,
                    top: `calc(${topPercent}% - 8px)`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEdge(edge.id);
                  }}
                  title="Remove this connection"
                >
                  <span className="bg-card flex h-4 w-4 items-center justify-center rounded-full border shadow-sm transition-colors hover:bg-amber-500/10 hover:text-amber-500">
                    <X size={8} />
                  </span>
                </button>
              ))}
          </div>
        );
      })}

      {/* Output handles (right side) */}
      {outPorts.map((port, i) => {
        const connectedEdges = getEdgesForHandle(port.id, "source");
        const topPercent = ((i + 1) / (outPorts.length + 1)) * 100;
        const handleTitle = port.label
          ? `${port.protocol} out · ${port.label}`
          : `${port.protocol} out`;

        return (
          <div key={port.id}>
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              title={handleTitle}
              style={{
                top: `${topPercent}%`,
                background: "transparent",
                border: "none",
                width: 22,
                height: 22,
                borderRadius: 9999,
              }}
            >
              <div
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  background: PROTOCOL_COLORS[port.protocol] ?? "#6b7280",
                  border: "2px solid var(--color-card)",
                }}
              />
            </Handle>
            {/* Per-link unlink buttons */}
            {phase === "building" &&
              connectedEdges.map((edge) => (
                <button
                  key={edge.id}
                  className="absolute opacity-0 transition-opacity group-hover/node:opacity-100"
                  style={{
                    right: -24,
                    top: `calc(${topPercent}% - 8px)`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEdge(edge.id);
                  }}
                  title="Remove this connection"
                >
                  <span className="bg-card flex h-4 w-4 items-center justify-center rounded-full border shadow-sm transition-colors hover:bg-amber-500/10 hover:text-amber-500">
                    <X size={8} />
                  </span>
                </button>
              ))}
          </div>
        );
      })}
    </div>
  );
}

export const BlockNode = memo(BlockNodeComponent);
