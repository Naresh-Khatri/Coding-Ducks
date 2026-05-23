"use client";

import { memo } from "react";
import { getBezierPath, type EdgeProps } from "@xyflow/react";
import { useSystemDesignStore } from "~/lib/system-design/store";

function CustomEdgeComponent({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}: EdgeProps) {
  const phase = useSystemDesignStore((s) => s.phase);
  // An edge only carries flow if its source node is actually processing
  // traffic this tick. Disconnected / bypassed branches stay dark.
  const sourceRps = useSystemDesignStore((s) => {
    const n = s.nodes.find((node) => node.id === source);
    return (n?.data?.currentRps as number | undefined) ?? 0;
  });

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isProduction = phase === "production";
  const hasFlow = isProduction && sourceRps > 0;

  return (
    <g>
      {/* Glow layer */}
      {hasFlow && (
        <path
          d={edgePath}
          fill="none"
          strokeWidth={8}
          stroke="#3b82f6"
          opacity={0.15}
          strokeLinecap="round"
        />
      )}
      {/* Base edge line */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...style,
          strokeWidth: hasFlow ? 3 : 1.5,
          stroke: hasFlow ? "#3b82f6" : "#6b7280",
          fill: "none",
        }}
      />
      {/* Animated flowing dots along the path (source → target) */}
      {hasFlow && (
        <path
          d={edgePath}
          fill="none"
          strokeWidth={3}
          stroke="#93c5fd"
          strokeDasharray="6 10"
          strokeLinecap="round"
          className="animate-edge-flow"
        />
      )}
    </g>
  );
}

export const CustomEdge = memo(CustomEdgeComponent);
