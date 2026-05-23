import type {
  Connection,
  Edge,
  Node,
  OnEdgesChange,
  OnNodesChange,
  ReactFlowInstance,
} from "@xyflow/react";
import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { toast } from "sonner";
import { create } from "zustand";

import type {
  BlockDefinition,
  BlockNodeData,
  LevelDefinition,
  SimulationResults,
} from "./types";
import { getBlockDefinition, TRAFFIC_SOURCE_BLOCK } from "./block-registry";
import { isValidConnection } from "./connection-validator";

// Module-level ref for the ReactFlow instance, set by the workspace component.
// Kept outside the store because the RF instance is non-serializable and
// there is only ever one workspace mounted per page.
let rfInstance: ReactFlowInstance | null = null;

export function setReactFlowInstance(instance: ReactFlowInstance | null) {
  rfInstance = instance;
}

export function getReactFlowInstance() {
  return rfInstance;
}

// --- localStorage helpers ---
const STORAGE_PREFIX = "sd-canvas-";

interface SavedCanvas {
  nodes: {
    id: string;
    position: { x: number; y: number };
    definitionType: string;
    providerName: string;
    replicas?: number;
    isStartBlock?: boolean;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    sourceHandle: string | null;
    targetHandle: string | null;
  }[];
}

function saveCanvas(slug: string, nodes: Node<BlockNodeData>[], edges: Edge[]) {
  try {
    const data: SavedCanvas = {
      nodes: nodes.map((n) => {
        const d = n.data;
        return {
          id: n.id,
          position: n.position,
          definitionType: d.definition.type,
          providerName: d.definition.name,
          replicas: d.replicas,
          isStartBlock: d.isStartBlock,
        };
      }),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
        targetHandle: e.targetHandle ?? null,
      })),
    };
    localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

function loadCanvas(
  slug: string,
  bumpCounter: (id: number) => void,
): { nodes: Node<BlockNodeData>[]; edges: Edge[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + slug);
    if (!raw) return null;
    const data: SavedCanvas = JSON.parse(raw);

    // Reconstruct nodes from saved definitions
    const nodes: Node<BlockNodeData>[] = [];
    for (const saved of data.nodes) {
      let definition: BlockDefinition;

      if (saved.isStartBlock) {
        definition = TRAFFIC_SOURCE_BLOCK;
      } else {
        const baseDef = getBlockDefinition(saved.definitionType);
        if (!baseDef) continue;

        // Apply saved provider
        const provider = baseDef.providers?.find(
          (p) => p.provider === saved.providerName,
        );
        definition = provider
          ? {
              ...baseDef,
              name: provider.provider,
              costPerMonth: provider.costPerMonth,
              maxRps: provider.maxRps,
              maxConnections: provider.maxConnections,
              baseLatencyMs: provider.baseLatencyMs,
              ...(provider.hitRate !== undefined && {
                hitRate: provider.hitRate,
              }),
              ...(provider.edgeLatencyReduction !== undefined && {
                edgeLatencyReduction: provider.edgeLatencyReduction,
              }),
              ...(provider.attackAbsorbRate !== undefined && {
                attackAbsorbRate: provider.attackAbsorbRate,
              }),
            }
          : baseDef;
      }

      // Keep nodeIdCounter above any restored IDs
      const idNum = parseInt(saved.id.replace("block-", ""), 10);
      if (!isNaN(idNum)) bumpCounter(idNum);

      // Non-counter blocks can never have replicas > 1, even if an older
      // saved canvas has them. Clamp on load so capacity math stays honest.
      const savedReplicas = saved.replicas ?? 1;
      const replicas =
        (definition.scaling ?? "counter") === "counter" ? savedReplicas : 1;

      nodes.push({
        id: saved.id,
        type: "blockNode",
        position: saved.position,
        data: {
          definition,
          instanceId: saved.id,
          isStartBlock: saved.isStartBlock,
          replicas,
          currentRps: 0,
          currentLatencyMs: 0,
          loadPercent: 0,
          failedRequests: 0,
          queueDepth: 0,
          status: "idle",
        },
      });
    }

    // Migrate stale LB output handles (used to be http-out-1 / http-out-2
    // for the labeled Server slots; now there's a single backend pool port).
    const nodeTypeById = new Map<string, string>();
    for (const n of nodes) {
      nodeTypeById.set(n.id, (n.data).definition.type);
    }

    const edges: Edge[] = data.edges.map((e) => {
      let sourceHandle = e.sourceHandle;
      if (
        nodeTypeById.get(e.source) === "load-balancer" &&
        (sourceHandle === "http-out-1" || sourceHandle === "http-out-2")
      ) {
        sourceHandle = "http-out-0";
      }
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle,
        targetHandle: e.targetHandle,
        type: "customEdge",
      };
    });

    return { nodes, edges };
  } catch {
    return null;
  }
}

// --- Undo/Redo History ---
const MAX_HISTORY = 50;

interface HistorySnapshot {
  nodes: Node<BlockNodeData>[];
  edges: Edge[];
}

interface SessionState {
  nodeIdCounter: number;
  history: HistorySnapshot[];
  historyIndex: number;
  skipHistory: boolean;
}

/**
 * Session-scoped state, encapsulated so each `setLevel()` starts fresh
 * and history from a prior level can't leak into the current one.
 */
const session: SessionState = {
  nodeIdCounter: 0,
  history: [],
  historyIndex: -1,
  skipHistory: false,
};

function resetSession() {
  session.nodeIdCounter = 0;
  session.history = [];
  session.historyIndex = -1;
  session.skipHistory = false;
}

function bumpCounter(id: number) {
  if (id >= session.nodeIdCounter) session.nodeIdCounter = id + 1;
}

function nextNodeId() {
  return `block-${++session.nodeIdCounter}`;
}

function pushHistory(nodes: Node<BlockNodeData>[], edges: Edge[]) {
  if (session.skipHistory) return;
  // Discard any redo states
  session.history = session.history.slice(0, session.historyIndex + 1);
  session.history.push({
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  });
  if (session.history.length > MAX_HISTORY) {
    session.history.shift();
  }
  session.historyIndex = session.history.length - 1;
  // Update store flags
  useSystemDesignStore.setState({
    canUndo: session.historyIndex > 0,
    canRedo: false,
  });
}

function resetHistory(nodes: Node<BlockNodeData>[], edges: Edge[]) {
  session.history = [
    {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    },
  ];
  session.historyIndex = 0;
}

// --- Store ---

interface SystemDesignStore {
  level: LevelDefinition | null;
  setLevel: (level: LevelDefinition) => void;

  phase: "building" | "production" | "results";
  setPhase: (phase: "building" | "production" | "results") => void;

  nodes: Node<BlockNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addBlock: (
    definition: BlockDefinition,
    position: { x: number; y: number },
  ) => void;
  addBlockToCenter: (definition: BlockDefinition) => void;
  removeBlock: (nodeId: string) => void;
  duplicateBlock: (nodeId: string) => void;
  disconnectBlock: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  changeProvider: (nodeId: string, providerName: string) => void;
  setReplicas: (nodeId: string, replicas: number) => void;
  onConnect: (connection: Connection) => void;

  simulationTick: number;
  simulationSpeed: number;
  simulationPaused: boolean;
  simulationResults: SimulationResults | null;
  simulationTimeline: SimulationResults["timeline"];
  setSimulationSpeed: (speed: number) => void;
  togglePause: () => void;
  updateBlockStats: (
    nodeId: string,
    stats: {
      rps: number;
      latencyMs: number;
      loadPercent: number;
      status: string;
      failedRps: number;
      queueDepth: number;
      timedOutRps: number;
    },
  ) => void;
  setSimulationResults: (results: SimulationResults) => void;
  incrementTick: () => void;
  addTimelineTick: (tick: SimulationResults["timeline"][0]) => void;
  seekToTick: (tick: number) => void;
  setFullTimeline: (timeline: SimulationResults["timeline"]) => void;

  timelineMode: "live" | "review";
  setTimelineMode: (mode: "live" | "review") => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Sidebar
  sidebarMode: "fixed" | "auto";
  setSidebarMode: (mode: "fixed" | "auto") => void;

  reset: () => void;
}

function persistCanvas(state: {
  level: LevelDefinition | null;
  nodes: Node<BlockNodeData>[];
  edges: Edge[];
}) {
  if (state.level) {
    saveCanvas(state.level.slug, state.nodes, state.edges);
  }
}

export const useSystemDesignStore = create<SystemDesignStore>((set, get) => ({
  level: null,
  setLevel: (level) => {
    // Reset simulation + per-level session state (counter, history)
    resetSession();
    const simReset = {
      phase: "building" as const,
      simulationTick: 0,
      simulationSpeed: 2,
      simulationPaused: false,
      simulationResults: null,
      simulationTimeline: [],
      timelineMode: "live" as const,
      canUndo: false,
      canRedo: false,
    };

    // Try to restore saved canvas for this level
    const saved = loadCanvas(level.slug, bumpCounter);
    if (saved && saved.nodes.length > 0) {
      set({ ...simReset, level, nodes: saved.nodes, edges: saved.edges });
      resetHistory(saved.nodes, saved.edges);
      return;
    }

    // Fresh start — place the traffic source block
    const startNode: Node<BlockNodeData> = {
      id: "traffic-source",
      type: "blockNode",
      position: { x: 50, y: 200 },
      data: {
        definition: TRAFFIC_SOURCE_BLOCK,
        instanceId: "traffic-source",
        isStartBlock: true,
        replicas: 1,
        currentRps: 0,
        currentLatencyMs: 0,
        loadPercent: 0,
        failedRequests: 0,
        queueDepth: 0,
        status: "idle",
      },
    };
    set({ ...simReset, level, nodes: [startNode], edges: [] });
    resetHistory([startNode], []);
  },

  phase: "building",
  setPhase: (phase) => set({ phase }),

  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    const nodes = applyNodeChanges(
      changes,
      get().nodes,
    ) as Node<BlockNodeData>[];
    set({ nodes });
    persistCanvas({ ...get(), nodes });
  },

  onEdgesChange: (changes) => {
    const edges = applyEdgeChanges(changes, get().edges);
    set({ edges });
    persistCanvas({ ...get(), edges });
  },

  addBlock: (definition, position) => {
    const { nodes, level } = get();
    const budgetUsed = nodes.reduce((sum, n) => {
      const d = n.data;
      return sum + d.definition.costPerMonth * (d.replicas ?? 1);
    }, 0);
    if (level && budgetUsed + definition.costPerMonth > level.budget) {
      toast.error("Budget exceeded", {
        description: `Adding ${definition.label} ($${definition.costPerMonth}/mo) would exceed the $${level.budget}/mo budget.`,
      });
      return;
    }

    const instanceId = nextNodeId();
    const newNode: Node<BlockNodeData> = {
      id: instanceId,
      type: "blockNode",
      position,
      data: {
        definition,
        instanceId,
        replicas: 1,
        currentRps: 0,
        currentLatencyMs: 0,
        loadPercent: 0,
        failedRequests: 0,
        queueDepth: 0,
        status: "idle",
      },
    };
    const newNodes = [...nodes, newNode];
    set({ nodes: newNodes });
    persistCanvas({ ...get(), nodes: newNodes });
    pushHistory(newNodes, get().edges);
  },

  addBlockToCenter: (definition) => {
    const rf = rfInstance;
    let position = { x: 300, y: 200 };
    if (rf) {
      // Get the center of the current viewport in flow coordinates
      const { x, y, zoom } = rf.getViewport();
      const container = document.querySelector(".react-flow");
      if (container) {
        const rect = container.getBoundingClientRect();
        position = rf.screenToFlowPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        // Offset slightly randomly so stacked clicks don't overlap perfectly
        position.x += (Math.random() - 0.5) * 60;
        position.y += (Math.random() - 0.5) * 60;
      }
    }
    get().addBlock(definition, position);
  },

  duplicateBlock: (nodeId) => {
    const { nodes } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const data = node.data;
    if (data.isStartBlock) return;
    get().addBlock(data.definition, {
      x: node.position.x + 40,
      y: node.position.y + 40,
    });
  },

  removeBlock: (nodeId) => {
    const { nodes, edges } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if ((node?.data!)?.isStartBlock) return;
    const newNodes = nodes.filter((n) => n.id !== nodeId);
    const newEdges = edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId,
    );
    set({ nodes: newNodes, edges: newEdges });
    persistCanvas({ ...get(), nodes: newNodes, edges: newEdges });
    pushHistory(newNodes, newEdges);
  },

  disconnectBlock: (nodeId) => {
    const { edges } = get();
    const newEdges = edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId,
    );
    set({ edges: newEdges });
    persistCanvas({ ...get(), edges: newEdges });
    pushHistory(get().nodes, newEdges);
  },

  removeEdge: (edgeId) => {
    const { edges } = get();
    const newEdges = edges.filter((e) => e.id !== edgeId);
    set({ edges: newEdges });
    persistCanvas({ ...get(), edges: newEdges });
    pushHistory(get().nodes, newEdges);
  },

  changeProvider: (nodeId, providerName) => {
    const { nodes } = get();
    const newNodes = nodes.map((n) => {
      if (n.id !== nodeId) return n;
      const data = n.data;
      const provider = data.definition.providers?.find(
        (p) => p.provider === providerName,
      );
      if (!provider) return n;
      return {
        ...n,
        data: {
          ...data,
          definition: {
            ...data.definition,
            name: provider.provider,
            costPerMonth: provider.costPerMonth,
            maxRps: provider.maxRps,
            maxConnections: provider.maxConnections,
            baseLatencyMs: provider.baseLatencyMs,
            ...(provider.edgeLatencyReduction !== undefined && {
              edgeLatencyReduction: provider.edgeLatencyReduction,
            }),
            ...(provider.attackAbsorbRate !== undefined && {
              attackAbsorbRate: provider.attackAbsorbRate,
            }),
          },
        },
      };
    });
    set({ nodes: newNodes });
    persistCanvas({ ...get(), nodes: newNodes });
    pushHistory(newNodes, get().edges);
  },

  setReplicas: (nodeId, replicas) => {
    const { nodes, level } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const data = node.data;
    if (data.isStartBlock) return;
    if ((data.definition.scaling ?? "counter") !== "counter") return;

    let next = Math.max(1, Math.min(20, Math.round(replicas)));
    if (level) {
      const others = nodes.reduce((sum, n) => {
        if (n.id === nodeId) return sum;
        const d = n.data;
        return sum + d.definition.costPerMonth * (d.replicas ?? 1);
      }, 0);
      const affordable = Math.floor(
        (level.budget - others) / data.definition.costPerMonth,
      );
      if (next > affordable) {
        next = Math.max(1, affordable);
        toast.error("Budget exceeded", {
          description: `Capped ${data.definition.label} at ${next}× — more replicas would exceed the $${level.budget}/mo budget.`,
        });
      }
    }
    if (next === (data.replicas ?? 1)) return;

    const newNodes = nodes.map((n) =>
      n.id === nodeId
        ? { ...n, data: { ...(n.data), replicas: next } }
        : n,
    );
    set({ nodes: newNodes });
    persistCanvas({ ...get(), nodes: newNodes });
    pushHistory(newNodes, get().edges);
  },

  onConnect: (connection) => {
    const { nodes, edges } = get();
    if (!isValidConnection(connection, nodes, edges))
      return;

    const newEdge: Edge = {
      id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: "customEdge",
    };
    const newEdges = [...edges, newEdge];
    set({ edges: newEdges });
    persistCanvas({ ...get(), edges: newEdges });
    pushHistory(get().nodes, newEdges);
  },

  simulationTick: 0,
  simulationSpeed: 1,
  simulationPaused: false,
  simulationResults: null,
  simulationTimeline: [],

  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  togglePause: () => set((s) => ({ simulationPaused: !s.simulationPaused })),

  updateBlockStats: (nodeId, stats) => {
    const { nodes } = get();
    set({
      nodes: nodes.map((n) => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          data: {
            ...(n.data),
            currentRps: stats.rps,
            currentLatencyMs: stats.latencyMs,
            loadPercent: stats.loadPercent,
            failedRequests: stats.failedRps,
            queueDepth: stats.queueDepth,
            status: stats.status as BlockNodeData["status"],
          },
        };
      }),
    });
  },

  setSimulationResults: (results) => set({ simulationResults: results }),
  incrementTick: () => set((s) => ({ simulationTick: s.simulationTick + 1 })),
  addTimelineTick: (tick) =>
    set((s) => ({ simulationTimeline: [...s.simulationTimeline, tick] })),
  setFullTimeline: (timeline) => set({ simulationTimeline: timeline }),
  timelineMode: "live",
  setTimelineMode: (mode) => {
    const store = useSystemDesignStore.getState();
    if (mode === "review") {
      // Pause playback and jump to end so full timeline is visible
      set({ timelineMode: mode, simulationPaused: true });
    } else {
      set({ timelineMode: mode });
    }
  },
  seekToTick: (tickIndex) => {
    const { simulationTimeline, nodes } = get();
    const tick = simulationTimeline[tickIndex];
    if (!tick) return;

    set({
      simulationTick: tickIndex,
      nodes: nodes.map((n) => {
        const stats = tick.blockStats[n.id];
        if (!stats) return n;
        return {
          ...n,
          data: {
            ...(n.data),
            currentRps: stats.rps,
            currentLatencyMs: stats.latencyMs,
            loadPercent: stats.loadPercent,
            readLoadPercent: stats.readLoadPercent,
            writeLoadPercent: stats.writeLoadPercent,
            failedRequests: stats.failedRps,
            queueDepth: stats.queueDepth,
            status: stats.status,
          },
        };
      }),
    });
  },

  // Undo/Redo
  canUndo: false,
  canRedo: false,

  undo: () => {
    if (session.historyIndex <= 0) return;
    session.historyIndex--;
    const snapshot = session.history[session.historyIndex]!;
    session.skipHistory = true;
    const nodes = JSON.parse(
      JSON.stringify(snapshot.nodes),
    ) as Node<BlockNodeData>[];
    const edges = JSON.parse(JSON.stringify(snapshot.edges)) as Edge[];
    set({ nodes, edges, canUndo: session.historyIndex > 0, canRedo: true });
    persistCanvas({ ...get(), nodes, edges });
    session.skipHistory = false;
  },

  redo: () => {
    if (session.historyIndex >= session.history.length - 1) return;
    session.historyIndex++;
    const snapshot = session.history[session.historyIndex]!;
    session.skipHistory = true;
    const nodes = JSON.parse(
      JSON.stringify(snapshot.nodes),
    ) as Node<BlockNodeData>[];
    const edges = JSON.parse(JSON.stringify(snapshot.edges)) as Edge[];
    set({
      nodes,
      edges,
      canUndo: true,
      canRedo: session.historyIndex < session.history.length - 1,
    });
    persistCanvas({ ...get(), nodes, edges });
    session.skipHistory = false;
  },

  // Sidebar
  sidebarMode: (() => {
    try {
      return (
        (localStorage.getItem("sd-sidebar-mode") as "fixed" | "auto") ?? "fixed"
      );
    } catch {
      return "fixed" as const;
    }
  })(),
  setSidebarMode: (mode) => {
    set({ sidebarMode: mode });
    try {
      localStorage.setItem("sd-sidebar-mode", mode);
    } catch {}
  },

  reset: () => {
    const { level } = get();
    if (level) {
      try {
        localStorage.removeItem(STORAGE_PREFIX + level.slug);
      } catch {}
    }
    set({
      phase: "building",
      nodes: [],
      edges: [],
      simulationTick: 0,
      simulationSpeed: 1,
      simulationPaused: false,
      simulationResults: null,
      simulationTimeline: [],
      timelineMode: "live",
    });
  },
}));
