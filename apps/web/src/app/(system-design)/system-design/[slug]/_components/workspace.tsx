"use client";

import type { Connection, Edge, Node, ReactFlowInstance } from "@xyflow/react";
import type { DragEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { Background, ReactFlow } from "@xyflow/react";
import { PanelLeft, Pin, PinOff } from "lucide-react";

import "@xyflow/react/dist/style.css";

import type { BlockNodeData } from "~/lib/system-design/types";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getBlockDefinition } from "~/lib/system-design/block-registry";
import { isValidConnection } from "~/lib/system-design/connection-validator";
import {
  setReactFlowInstance,
  useSystemDesignStore,
} from "~/lib/system-design/store";
import { cn } from "~/lib/utils";
import { BlockNode } from "./block-node";
import { BlockPalette } from "./block-palette";
import { CanvasControls } from "./canvas-controls";
import { CanvasEmptyState } from "./canvas-empty-state";
import { CanvasHintsOverlay } from "./canvas-hints-overlay";
import { CanvasInfoOverlay } from "./canvas-info-overlay";
import { CustomEdge } from "./custom-edge";
import { LevelBriefing } from "./level-briefing";
import { OnboardingTour } from "./onboarding-tour";
import { ResultsModal } from "./results-modal";
import { useSimulation } from "./simulation-runner";
import { StartSimulationButton } from "./start-simulation-button";
import { StatsPanel } from "./stats-panel";
import { SubmissionHistory } from "./submission-history";
import { TopBar } from "./top-bar";
import { TrafficChart } from "./traffic-chart";

const nodeTypes = { blockNode: BlockNode };
const edgeTypes = { customEdge: CustomEdge };

export function Workspace() {
  const level = useSystemDesignStore((s) => s.level);
  const nodes = useSystemDesignStore((s) => s.nodes);
  const edges = useSystemDesignStore((s) => s.edges);
  const onNodesChange = useSystemDesignStore((s) => s.onNodesChange);
  const onEdgesChange = useSystemDesignStore((s) => s.onEdgesChange);
  const onConnect = useSystemDesignStore((s) => s.onConnect);
  const addBlock = useSystemDesignStore((s) => s.addBlock);
  const phase = useSystemDesignStore((s) => s.phase);
  const simulationResults = useSystemDesignStore((s) => s.simulationResults);

  const isProduction = phase === "production";
  const sidebarMode = useSystemDesignStore((s) => s.sidebarMode);
  const setSidebarMode = useSystemDesignStore((s) => s.setSidebarMode);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const reactFlowRef = useRef<ReactFlowInstance<
    Node<BlockNodeData>,
    Edge
  > | null>(null);

  // Run simulation when in production phase
  useSimulation();

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const blockType = e.dataTransfer.getData(
        "application/system-design-block",
      );
      if (!blockType) return;

      const baseDefinition = getBlockDefinition(blockType);
      if (!baseDefinition) return;

      // Apply selected provider's stats
      const providerName = e.dataTransfer.getData(
        "application/system-design-provider",
      );
      let definition = baseDefinition;
      if (providerName && baseDefinition.providers) {
        const provider = baseDefinition.providers.find(
          (p) => p.provider === providerName,
        );
        if (provider) {
          definition = {
            ...baseDefinition,
            name: provider.provider,
            costPerMonth: provider.costPerMonth,
            maxRps: provider.maxRps,
            maxConnections: provider.maxConnections,
            baseLatencyMs: provider.baseLatencyMs,
          };
        }
      }

      const rfInstance = reactFlowRef.current;
      if (!rfInstance) return;

      const position = rfInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      addBlock(definition, position);
    },
    [addBlock],
  );

  const handleIsValidConnection = useCallback(
    (connection: Edge | Connection) => {
      return isValidConnection(
        connection as Connection,
        nodes,
        edges,
      );
    },
    [nodes, edges],
  );

  if (!level) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading level...</div>
      </div>
    );
  }

  const isAuto = sidebarMode === "auto";
  const sidebarVisible = !isAuto || sidebarHovered;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />

      <div className="relative flex min-h-0 flex-1">
        {/* Collapsible left sidebar */}
        <div
          onMouseEnter={() => isAuto && setSidebarHovered(true)}
          onMouseLeave={() => isAuto && setSidebarHovered(false)}
          className={cn(
            "bg-card z-30 flex h-full shrink-0 flex-col border-r transition-all duration-200",
            isAuto && "absolute top-0 left-0",
            isAuto && !sidebarHovered && "w-10 overflow-hidden",
            isAuto && sidebarHovered && "w-72 shadow-xl",
            !isAuto && "w-72",
          )}
        >
          {/* Collapsed state: just a button strip */}
          {isAuto && !sidebarHovered && (
            <div className="flex h-full flex-col items-center gap-2 pt-2">
              <button
                onClick={() => setSidebarMode("fixed")}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1.5 transition-colors"
                title="Pin sidebar"
              >
                <PanelLeft size={16} />
              </button>
            </div>
          )}

          {/* Expanded state: full sidebar content */}
          {sidebarVisible && (
            <>
              {/* Sidebar header with mode toggle */}
              <div className="flex items-center justify-end border-b px-2 py-1">
                <button
                  onClick={() => setSidebarMode(isAuto ? "fixed" : "auto")}
                  className={cn(
                    "text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] transition-colors",
                  )}
                  title={isAuto ? "Pin sidebar open" : "Auto-hide sidebar"}
                >
                  {isAuto ? (
                    <>
                      <Pin size={12} />
                      Pin
                    </>
                  ) : (
                    <>
                      <PinOff size={12} />
                      Unpin
                    </>
                  )}
                </button>
              </div>
              <Tabs
                defaultValue="build"
                className="flex min-h-0 flex-1 flex-col"
              >
                <TabsList className="mx-2 mt-1 w-auto shrink-0">
                  <TabsTrigger value="build" className="flex-1 text-xs">
                    Build
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex-1 text-xs">
                    History
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="build"
                  className="mt-0 flex min-h-0 flex-1 flex-col"
                >
                  <LevelBriefing />
                  <BlockPalette />
                </TabsContent>
                <TabsContent value="history" className="mt-0 min-h-0 flex-1">
                  {level && <SubmissionHistory levelSlug={level.slug} />}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        {/* Main content area */}
        <div className="h-full min-w-0 flex-1">
          <ResizablePanelGroup direction="horizontal">
            {/* Center: canvas + optional bottom chart */}
            <ResizablePanel defaultSize={isProduction ? 78 : 100}>
              <ResizablePanelGroup direction="vertical">
                {/* Canvas */}
                <ResizablePanel defaultSize={isProduction ? 70 : 100}>
                  <div
                    className="h-full w-full"
                    data-tour="sd-canvas"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      onInit={(instance) => {
                        reactFlowRef.current = instance;
                        setReactFlowInstance(
                          instance as unknown as import("@xyflow/react").ReactFlowInstance,
                        );
                      }}
                      nodeTypes={nodeTypes}
                      edgeTypes={edgeTypes}
                      isValidConnection={handleIsValidConnection}
                      nodesDraggable={phase === "building"}
                      nodesConnectable={phase === "building"}
                      elementsSelectable={phase === "building"}
                      fitView
                      className="bg-background"
                      proOptions={{ hideAttribution: true }}
                    >
                      <Background gap={20} size={1} />
                      <CanvasControls />
                      {nodes.length <= 1 && phase === "building" && (
                        <CanvasEmptyState />
                      )}
                      {phase === "building" && <CanvasInfoOverlay />}
                      {phase === "building" && <CanvasHintsOverlay />}
                      <StartSimulationButton />
                    </ReactFlow>
                  </div>
                </ResizablePanel>

                {/* Bottom: traffic chart (production only) */}
                {isProduction && (
                  <>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={30} minSize={15}>
                      <div className="bg-card h-full border-t">
                        <TrafficChart />
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            {/* Right sidebar: stats (production) or history (building) */}
            {isProduction && (
              <>
                <ResizableHandle />
                <ResizablePanel
                  defaultSize={22}
                  minSize={16}
                  maxSize={30}
                  className="bg-card border-l"
                >
                  <StatsPanel />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Results overlay */}
      {phase === "results" && simulationResults && <ResultsModal />}

      <OnboardingTour />
    </div>
  );
}
