"use client";

import { getBezierPath, useNodes, type EdgeProps } from "@xyflow/react";

export function FlowingEdge({
  id,
  source,
  target,
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
  const targetNode = nodes.find((n) => n.id === target);
  const isActive = selected || !!sourceNode?.selected || !!targetNode?.selected;

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

      {/* Flowing dashes overlay — active when source node is selected */}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke="#818cf8"
          strokeWidth={2.5}
          strokeDasharray="8 6"
          strokeLinecap="round"
          strokeDashoffset={0}
          style={{ pointerEvents: "none" }}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="14"
            to="0"
            dur="0.45s"
            repeatCount="indefinite"
          />
        </path>
      )}
    </g>
  );
}
