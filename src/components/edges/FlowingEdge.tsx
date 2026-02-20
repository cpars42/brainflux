"use client";

import { getBezierPath, useNodes, useEdges, type EdgeProps } from "@xyflow/react";

/**
 * Undirected BFS from all selected nodes.
 * Follows edges in both directions so selecting any node in a chain
 * activates all connected edges throughout the subgraph.
 */
function getConnectedSubgraph(
  selectedIds: Set<string>,
  allEdges: { source: string; target: string }[]
): Set<string> {
  const visited = new Set<string>(selectedIds);
  const queue = Array.from(selectedIds);
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const e of allEdges) {
      if (e.source === current && !visited.has(e.target)) {
        visited.add(e.target);
        queue.push(e.target);
      }
      if (e.target === current && !visited.has(e.source)) {
        visited.add(e.source);
        queue.push(e.source);
      }
    }
  }
  return visited;
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
  const connected = getConnectedSubgraph(selectedIds, allEdges);

  // Active if edge is selected, OR either endpoint is in the connected subgraph
  const isActive = selected || connected.has(source) || connected.has(target);

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

      {/* Flowing dashes overlay — active when any connected node is selected */}
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
