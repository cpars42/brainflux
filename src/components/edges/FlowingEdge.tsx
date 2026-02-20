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
  const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));

  // Only activate edges directly touching a selected node (no propagation)
  const isActive = selected || selectedIds.has(source) || selectedIds.has(target);

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
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        fill="none"
      />
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
