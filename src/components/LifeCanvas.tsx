"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nanoid } from "nanoid";
import { NoteNode } from "./nodes/NoteNode";
import { StickyNode } from "./nodes/StickyNode";
import { ClockNode } from "./nodes/ClockNode";
import { TimerNode } from "./nodes/TimerNode";
import { HourglassNode } from "./nodes/HourglassNode";
import { Toolbar } from "./Toolbar";

const NODE_TYPES: NodeTypes = {
  note: NoteNode,
  sticky: StickyNode,
  clock: ClockNode,
  timer: TimerNode,
  hourglass: HourglassNode,
};

const DEFAULT_NODE_DATA: Record<string, object> = {
  note: { title: "", content: "" },
  sticky: { content: "", color: "#fef08a" },
  clock: {},
  timer: { label: "", durationMinutes: 25 },
  hourglass: { durationMinutes: 10 },
};

const DEFAULT_NODE_SIZE: Record<string, { width?: number; height?: number }> = {
  note: { width: 280, height: 200 },
  sticky: {},
  clock: {},
  timer: {},
  hourglass: {},
};

function toFlowNode(n: {
  id: string; type: string;
  position: { x: number; y: number };
  width?: number | null; height?: number | null;
  data: Record<string, unknown>;
}): Node {
  return {
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
    style: n.width ? { width: n.width, height: n.height ?? undefined } : undefined,
  };
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

type ContextMenuState = { x: number; y: number; nodeId: string };

function ContextMenu({
  menu,
  onDelete,
  onClose,
}: {
  menu: ContextMenuState;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Clamp to viewport
  const menuW = 160;
  const menuH = 80;
  const left = Math.min(menu.x, window.innerWidth - menuW - 8);
  const top = Math.min(menu.y, window.innerHeight - menuH - 8);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left,
        top,
        width: menuW,
        background: "#1c1c1f",
        border: "1px solid #3f3f46",
        borderRadius: 10,
        padding: 4,
        zIndex: 9999,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <MenuItem
        icon="🗑"
        label="Delete"
        color="#f87171"
        hoverBg="#2d1515"
        onClick={() => onDelete(menu.nodeId)}
      />
    </div>
  );
}

function MenuItem({
  icon,
  label,
  color,
  hoverBg,
  onClick,
}: {
  icon: string;
  label: string;
  color: string;
  hoverBg: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "7px 10px",
        background: hovered ? hoverBg : "none",
        border: "none",
        color,
        cursor: "pointer",
        borderRadius: 7,
        fontSize: 13,
        textAlign: "left",
        transition: "background 0.1s",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── Inner Flow Editor (needs useReactFlow — must be inside ReactFlowProvider) ─

function FlowEditorInner({ canvasId, userName }: { canvasId: string; userName: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loaded, setLoaded] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { fitView } = useReactFlow();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  // Load canvas on mount
  useEffect(() => {
    fetch(`/api/canvas?canvas=${canvasId}`)
      .then((r) => r.json())
      .then((data) => {
        setNodes(data.nodes.map(toFlowNode));
        setEdges(data.edges);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [canvasId, setNodes, setEdges]);

  // Auto-save (debounced 1.5s)
  const scheduleSave = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      if (!loaded) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        fetch("/api/canvas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            canvasId,
            nodes: currentNodes.map((n) => ({
              id: n.id,
              type: n.type,
              position: n.position,
              width: n.measured?.width ?? n.style?.width ?? null,
              height: n.measured?.height ?? n.style?.height ?? null,
              data: n.data,
            })),
            edges: currentEdges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
            })),
          }),
        });
      }, 1500);
    },
    [loaded, canvasId]
  );

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      setNodes((nds) => { scheduleSave(nds, edges); return nds; });
    },
    [onNodesChange, setNodes, edges, scheduleSave]
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      setEdges((eds) => { scheduleSave(nodes, eds); return eds; });
    },
    [onEdgesChange, setEdges, nodes, scheduleSave]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = { ...connection, id: nanoid(), type: "default" };
      setEdges((eds) => {
        const next = addEdge(edge, eds);
        scheduleSave(nodes, next);
        return next;
      });
    },
    [setEdges, nodes, scheduleSave]
  );

  const addNode = useCallback(
    (type: string) => {
      const id = nanoid();
      const size = DEFAULT_NODE_SIZE[type] ?? {};
      const newNode: Node = {
        id,
        type,
        position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
        data: { ...DEFAULT_NODE_DATA[type] },
        style: size.width ? { width: size.width, height: size.height } : undefined,
      };
      setNodes((nds) => {
        const next = [...nds, newNode];
        scheduleSave(next, edges);
        return next;
      });
    },
    [setNodes, edges, scheduleSave]
  );

  // Delete selected nodes on Backspace/Delete key
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        setNodes((nds) => {
          const next = nds.filter((n) => !n.selected);
          if (next.length !== nds.length) scheduleSave(next, edges);
          return next;
        });
        setEdges((eds) => eds.filter((e) => !e.selected));
      }
    },
    [setNodes, setEdges, edges, scheduleSave]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // Double-click → center + zoom to node
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      fitView({
        nodes: [{ id: node.id }],
        padding: 0.4,
        duration: 500,
        maxZoom: 1.5,
      });
    },
    [fitView]
  );

  // Right-click → context menu
  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
  }, []);

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => {
        const next = nds.filter((n) => n.id !== nodeId);
        scheduleSave(next, edges);
        return next;
      });
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setContextMenu(null);
    },
    [setNodes, setEdges, edges, scheduleSave]
  );

  return (
    <div
      style={{ width: "100vw", height: "100vh" }}
      onClick={() => setContextMenu(null)}
      onContextMenu={(e) => {
        // Only close if clicking the pane (not a node — node context menu stops propagation)
        if ((e.target as HTMLElement).classList.contains("react-flow__pane")) {
          setContextMenu(null);
        }
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        fitView={nodes.length > 0}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{ type: "default" }}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={() => setContextMenu(null)}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
        <Controls />
        <MiniMap
          style={{ background: "#18181b", border: "1px solid #27272a" }}
          nodeColor="#3f3f46"
          maskColor="#09090b99"
        />
      </ReactFlow>

      <Toolbar onAdd={addNode} />

      {/* User bar */}
      <div style={{
        position: "fixed", top: 16, right: 16, display: "flex", alignItems: "center",
        gap: 10, background: "#18181b", border: "1px solid #27272a",
        borderRadius: 10, padding: "6px 12px", zIndex: 10,
        boxShadow: "0 4px 16px #00000066",
      }}>
        <span style={{ fontSize: 13, color: "#71717a" }}>{userName}</span>
        <button
          onClick={logout}
          style={{ fontSize: 12, color: "#52525b", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Sign out
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onDelete={deleteNode}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

// ─── Public export — wraps inner editor in ReactFlowProvider ─────────────────

export function LifeCanvas({ canvasId, userName }: { canvasId: string; userName: string }) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner canvasId={canvasId} userName={userName} />
    </ReactFlowProvider>
  );
}
