"use client";

import { getBezierPath, useNodes, useEdges, type EdgeProps } from "@xyflow/react";

/** BFS from all selected nodes, following edges source→target. Returns set of reachable node IDs. */
function getReachableFromSelected(
  selectedIds: Set<string>,
  allEdges: { source: string; target: string }[]
): Set<string> {
  const reachable = new Set<string>(selectedIds);
  const queue = Array.from(selectedIds);
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const e of allEdges) {
      if (e.source === current && !reachable.has(e.target)) {
        reachable.add(e.target);
        queue.push(e.target);
      }
    }
  }
  return reachable;
}

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
  const allEdges = useEdges();

  const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
  const reachable = getReachableFromSelected(selectedIds, allEdges);

  // Active if: edge itself selected, OR source is reachable from any selected node
  const isActive = selected || reachable.has(source);

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

      {/* Flowing dashes overlay — active when source is reachable from a selected node */}
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
