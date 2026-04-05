"use client";

import { memo } from "react";
import { getBezierPath, type EdgeProps } from "@xyflow/react";
import { useSystemDesignStore } from "~/lib/system-design/store";

function CustomEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}: EdgeProps) {
  const phase = useSystemDesignStore((s) => s.phase);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isProduction = phase === "production";

  return (
    <g>
      {/* Glow layer */}
      {isProduction && (
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
          strokeWidth: isProduction ? 3 : 1.5,
          stroke: isProduction ? "#3b82f6" : "#6b7280",
          fill: "none",
        }}
      />
      {/* Animated flowing dots along the path (source → target) */}
      {isProduction && (
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
