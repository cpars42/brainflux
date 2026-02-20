"use client";

import { getBezierPath, useNodes, type EdgeProps } from "@xyflow/react";

export function FlowingEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
}: EdgeProps) {
  const nodes = useNodes();
  const sourceNode = nodes.find((n) => n.id === source);
  const isActive = selected || !!sourceNode?.selected;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g>
      {/* Base path — always visible */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        fill="none"
      />

      {/* Flowing dashes — only when source is selected */}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke="#818cf8"
          strokeWidth={2.5}
          strokeDasharray="8 6"
          strokeLinecap="round"
          className="flowing-edge-anim"
          style={{ pointerEvents: "none" }}
        />
      )}
    </g>
  );
}
