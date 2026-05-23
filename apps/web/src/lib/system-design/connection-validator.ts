import type { Connection, Edge, Node } from "@xyflow/react";

import type { BlockNodeData } from "./types";

export function isValidConnection(
  connection: Connection,
  nodes: Node<BlockNodeData>[],
  edges: Edge[],
): boolean {
  if (connection.source === connection.target) return false;

  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);
  if (!sourceNode || !targetNode) return false;

  const sourcePort = (sourceNode.data).definition.ports.find(
    (p) => p.id === connection.sourceHandle,
  );
  const targetPort = (targetNode.data).definition.ports.find(
    (p) => p.id === connection.targetHandle,
  );
  if (!sourcePort || !targetPort) return false;

  if (sourcePort.protocol !== targetPort.protocol) return false;
  if (sourcePort.direction !== "out" || targetPort.direction !== "in")
    return false;

  // Prevent duplicate connections between same handles
  const duplicate = edges.some(
    (e) =>
      e.source === connection.source &&
      e.target === connection.target &&
      e.sourceHandle === connection.sourceHandle &&
      e.targetHandle === connection.targetHandle,
  );
  if (duplicate) return false;

  return true;
}

export function hasCycle(nodes: Node[], edges: Edge[]): boolean {
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  let visited = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    visited++;
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return visited !== nodes.length;
}

export function getTopologicalOrder(nodes: Node[], edges: Edge[]): string[] {
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return order;
}

/** BFS from a start node to find all reachable block types. */
export function getReachableTypes(
  nodes: Node<BlockNodeData>[],
  edges: Edge[],
  startId = "traffic-source",
): Set<string> {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }

  const visited = new Set<string>();
  const queue = [startId];
  visited.add(startId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }

  const types = new Set<string>();
  for (const node of nodes) {
    if (visited.has(node.id)) {
      types.add((node.data).definition.type);
    }
  }
  return types;
}
