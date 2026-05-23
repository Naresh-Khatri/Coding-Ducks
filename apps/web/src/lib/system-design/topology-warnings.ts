import type { Edge, Node } from "@xyflow/react";
import type { BlockNodeData } from "./types";

export interface TopologyWarning {
  id: string;
  // "error" → invalid topology, fails the level
  // "warn"  → quality issue (SPOF, unreachable extra), caps stars at 2
  // "info"  → advisory only
  severity: "error" | "warn" | "info";
  message: string;
}

const STORAGE_TYPES = new Set([
  "sql-db",
  "nosql-db",
  "search-engine",
  "object-storage",
  "cache",
  "time-series-db",
]);

const ASYNC_PROTOCOLS = new Set(["AMQP"]);

interface Adjacency {
  outgoing: Map<string, Array<{ targetId: string; protocol: string }>>;
}

function buildAdjacency(
  nodes: Node<BlockNodeData>[],
  edges: Edge[],
): Adjacency {
  const outgoing = new Map<
    string,
    Array<{ targetId: string; protocol: string }>
  >();
  for (const n of nodes) outgoing.set(n.id, []);
  for (const e of edges) {
    const src = nodes.find((n) => n.id === e.source);
    if (!src) continue;
    const port = (src.data as BlockNodeData).definition.ports.find(
      (p) => p.id === e.sourceHandle,
    );
    outgoing.get(e.source)?.push({
      targetId: e.target,
      protocol: port?.protocol ?? "HTTP",
    });
  }
  return { outgoing };
}

function reachableFrom(
  adj: Adjacency,
  start: string,
  blocked?: string,
): Set<string> {
  const visited = new Set<string>();
  if (start === blocked) return visited;
  visited.add(start);
  const queue = [start];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const edge of adj.outgoing.get(id) ?? []) {
      if (edge.targetId === blocked || visited.has(edge.targetId)) continue;
      visited.add(edge.targetId);
      queue.push(edge.targetId);
    }
  }
  return visited;
}

function syncReachable(adj: Adjacency, start: string): Set<string> {
  const visited = new Set<string>([start]);
  const queue = [start];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const edge of adj.outgoing.get(id) ?? []) {
      if (ASYNC_PROTOCOLS.has(edge.protocol)) continue;
      if (visited.has(edge.targetId)) continue;
      visited.add(edge.targetId);
      queue.push(edge.targetId);
    }
  }
  return visited;
}

export function computeTopologyWarnings(
  nodes: Node<BlockNodeData>[],
  edges: Edge[],
): TopologyWarning[] {
  const warnings: TopologyWarning[] = [];
  if (nodes.length === 0) return warnings;

  const start = "traffic-source";
  if (!nodes.find((n) => n.id === start)) return warnings;

  const adj = buildAdjacency(nodes, edges);
  const reachable = reachableFrom(adj, start);
  const sync = syncReachable(adj, start);

  // 1. Placed but unreachable blocks
  for (const n of nodes) {
    if (n.id === start) continue;
    const data = n.data as BlockNodeData;
    if (data.isStartBlock) continue;
    if (!reachable.has(n.id)) {
      warnings.push({
        id: `unreachable:${n.id}`,
        severity: "warn",
        message: `${data.definition.label} is placed but not connected to traffic`,
      });
    }
  }

  // 2. Single points of failure on the sync critical path.
  // A reachable single-replica node is a SPOF if blocking it leaves at
  // least one downstream compute/sink unserved.
  const servedSinks: string[] = [];
  for (const id of sync) {
    const n = nodes.find((node) => node.id === id);
    if (!n) continue;
    const t = (n.data as BlockNodeData).definition.type;
    if (
      t === "app-server" ||
      t === "websocket-server" ||
      STORAGE_TYPES.has(t)
    ) {
      servedSinks.push(id);
    }
  }

  if (servedSinks.length > 0) {
    for (const id of sync) {
      if (id === start) continue;
      const n = nodes.find((node) => node.id === id);
      if (!n) continue;
      const data = n.data as BlockNodeData;
      if (data.isStartBlock) continue;
      // Managed/HA blocks (DNS, CDN, LB, …) are not SPOFs even at 1 instance.
      if ((data.definition.scaling ?? "counter") === "managed") continue;
      const replicas = data.replicas ?? 1;
      if (replicas >= 2) continue;
      const without = reachableFrom(adj, start, id);
      const stillServed = servedSinks.some(
        (sid) => sid !== id && without.has(sid),
      );
      if (!stillServed) {
        warnings.push({
          id: `spof:${id}`,
          severity: "warn",
          message: `${data.definition.label} is a single point of failure (only 1 replica)`,
        });
      }
    }
  }

  // 3. DB reachable from app-server with no cache between them.
  // Match on target type, not protocol — search-engine also uses the SQL
  // protocol port, but it's not a DB and doesn't need a Redis cache.
  for (const n of nodes) {
    if (!reachable.has(n.id)) continue;
    const data = n.data as BlockNodeData;
    if (data.definition.type !== "app-server") continue;
    const out = adj.outgoing.get(n.id) ?? [];
    const targetType = (id: string) =>
      (nodes.find((m) => m.id === id)?.data as BlockNodeData | undefined)
        ?.definition.type;
    const hasDb = out.some((e) => {
      const t = targetType(e.targetId);
      return t === "sql-db" || t === "nosql-db";
    });
    const hasCache = out.some((e) => targetType(e.targetId) === "cache");
    if (hasDb && !hasCache) {
      warnings.push({
        id: `no-cache:${n.id}`,
        severity: "info",
        message: `${data.definition.label} reads from the DB with no cache — expect saturation under spikes`,
      });
    }
  }

  return warnings;
}
