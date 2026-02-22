"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ConnectionMode,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import { FlowingEdge } from "./edges/FlowingEdge";
import { InboxTray, removeInboxItemFromTray, type InboxItem } from "./InboxTray";
import "@xyflow/react/dist/style.css";
import { nanoid } from "nanoid";
import { NoteNode } from "./nodes/NoteNode";
import { StickyNode } from "./nodes/StickyNode";
import { ClockNode } from "./nodes/ClockNode";
import { TimerNode } from "./nodes/TimerNode";
import { StopwatchNode } from "./nodes/StopwatchNode";
import { HourglassNode } from "./nodes/HourglassNode";
import { LinkNode } from "./nodes/LinkNode";
import { ImageNode } from "./nodes/ImageNode";
import { ChecklistNode } from "./nodes/ChecklistNode";
import { CodeNode } from "./nodes/CodeNode";
import { EmbedNode } from "./nodes/EmbedNode";
import { DrawingNode } from "./nodes/DrawingNode";
import { CounterNode } from "./nodes/CounterNode";
import { WeatherNode } from "./nodes/WeatherNode";
import { CalendarNode } from "./nodes/CalendarNode";
import { Toolbar, type BackgroundSetting } from "./Toolbar";
import { Starfield } from "./Starfield";
import { MatrixRain } from "./MatrixRain";

const EDGE_TYPES: EdgeTypes = {
  default: FlowingEdge,
};

// ─── Contexts ─────────────────────────────────────────────────────────────────

// Edit mode: tracks which node (if any) is in text-edit mode.
export const EditingContext = createContext<string | null>(null);
export const useEditingNodeId = () => useContext(EditingContext);

// Trigger save: lets nodes force a canvas save (e.g. timer start/stop).
export const TriggerSaveContext = createContext<() => void>(() => {});
export const useTriggerSave = () => useContext(TriggerSaveContext);

// ─────────────────────────────────────────────────────────────────────────────

const NODE_TYPES: NodeTypes = {
  note: NoteNode,
  sticky: StickyNode,
  clock: ClockNode,
  timer: TimerNode,
  stopwatch: StopwatchNode,
  hourglass: HourglassNode,
  link: LinkNode,
  image: ImageNode,
  checklist: ChecklistNode,
  code: CodeNode,
  embed: EmbedNode,
  drawing: DrawingNode,
  counter: CounterNode,
  weather: WeatherNode,
  calendar: CalendarNode,
};

const DEFAULT_NODE_DATA: Record<string, object> = {
  note: { title: "", content: "" },
  sticky: { content: "", color: "#fef08a" },
  clock: {},
  timer: { label: "", durationMinutes: 25 },
  stopwatch: { label: "", startTime: null, elapsedMs: 0 },
  hourglass: { durationMinutes: 10 },
  link: { url: "", title: "" },
  image: { imageData: "", alt: "" },
  checklist: { title: "", items: [] },
  code: { title: "", language: "js", code: "" },
  embed: { url: "" },
  drawing: { imageData: "" },
  counter: { label: "Counter", count: 0, step: 1 },
  weather: { city: "" },
  calendar: { notes: {}, selectedDate: "" },
};

const DEFAULT_NODE_SIZE: Record<string, { width?: number; height?: number }> = {
  note: { width: 280, height: 200 },
  sticky: {},
  clock: {},
  timer: {},
  hourglass: {},
  image: { width: 300, height: 250 },
  checklist: { width: 260, height: 220 },
  code: { width: 320, height: 240 },
  embed: { width: 400, height: 300 },
  drawing: { width: 320, height: 280 },
  counter: { width: 200, height: 160 },
  weather: { width: 240, height: 180 },
  calendar: { width: 280, height: 260 },
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

type ContextMenuState = { x: number; y: number; nodeId: string; url?: string; nodeType?: string; onChangeCity?: () => void };

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
  const menuW = 180;
  const extraItems = (menu.url ? 1 : 0) + (menu.onChangeCity ? 1 : 0);
  const menuH = 56 + extraItems * 36;
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
      {menu.url && (
        <MenuItem
          icon="🌐"
          label="Open in browser"
          color="#a5b4fc"
          hoverBg="#1e1b4b"
          onClick={() => { window.open(menu.url, "_blank", "noopener,noreferrer"); onClose(); }}
        />
      )}
      {menu.onChangeCity && (
        <MenuItem
          icon="📍"
          label="Change city"
          color="#6ee7b7"
          hoverBg="#052e16"
          onClick={() => { menu.onChangeCity!(); onClose(); }}
        />
      )}
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

function FlowEditorInner({ canvasId, userName, background, onBackgroundChange }: { canvasId: string; userName: string; background: BackgroundSetting; onBackgroundChange: (bg: BackgroundSetting) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loaded, setLoaded] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [inboxPicker, setInboxPicker] = useState<{ item: InboxItem; x: number; y: number; flowPos: { x: number; y: number } } | null>(null);
  const savedViewport = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { fitView, screenToFlowPosition, getViewport, setViewport } = useReactFlow();

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
        if (data.viewport) savedViewport.current = data.viewport;
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [canvasId, setNodes, setEdges]);

  // Restore viewport after nodes have rendered
  useEffect(() => {
    if (loaded && savedViewport.current) {
      setViewport(savedViewport.current, { duration: 0 });
      savedViewport.current = null;
    }
  }, [loaded, setViewport]);

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
            viewport: getViewport(),
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
              sourceHandle: e.sourceHandle ?? null,
              targetHandle: e.targetHandle ?? null,
            })),
          }),
        });
      }, 1500);
    },
    [loaded, canvasId, getViewport]
  );

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      // While a node is in edit mode, block React Flow from re-selecting it
      // (clicking inside the node triggers a "select" change that brings back the blue ring)
      const filtered = editingNodeId
        ? changes.filter((c) => !(c.type === "select" && c.id === editingNodeId && c.selected))
        : changes;
      onNodesChange(filtered);
      setNodes((nds) => { scheduleSave(nds, edges); return nds; });
    },
    [onNodesChange, setNodes, edges, scheduleSave, editingNodeId]
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
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      const newNode: Node = {
        id,
        type,
        position,
        data: { ...DEFAULT_NODE_DATA[type] },
        style: size.width ? { width: size.width, height: size.height } : undefined,
      };
      setNodes((nds) => {
        const next = [...nds, newNode];
        scheduleSave(next, edges);
        return next;
      });
    },
    [setNodes, edges, scheduleSave, screenToFlowPosition]
  );

  // Edit mode — enter/exit
  const enterEditMode = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
    // Deselect the node so React Flow's blue selection ring doesn't overlay the yellow edit border
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, draggable: false, selected: false } : n));
  }, [setNodes]);

  const exitEditMode = useCallback(() => {
    setEditingNodeId(null);
    setNodes((nds) => nds.map((n) => ({ ...n, draggable: true })));
  }, [setNodes]);

  // Exposed to child nodes so they can force a save (e.g. when timer starts/stops)
  const triggerSave = useCallback(() => {
    setNodes((nds) => { scheduleSave(nds, edges); return nds; });
  }, [setNodes, edges, scheduleSave]);

  // Voice note — create NoteNode at viewport center with transcript
  const addVoiceNoteNode = useCallback(
    (transcript: string) => {
      const id = nanoid();
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const position = screenToFlowPosition({ x: cx, y: cy });
      const newNode: Node = {
        id,
        type: "note",
        position,
        data: { title: "", content: transcript },
        style: { width: 280, height: 200 },
      };
      setNodes((nds) => {
        const next = [...nds, newNode];
        scheduleSave(next, edges);
        return next;
      });
    },
    [setNodes, edges, scheduleSave, screenToFlowPosition]
  );

  // Consume inbox item: create a node then delete the inbox item
  const consumeInboxItem = useCallback(
    async (type: "note" | "sticky" | "link", item: InboxItem, flowPos: { x: number; y: number }) => {
      setInboxPicker(null);
      removeInboxItemFromTray(item.id); // optimistic — remove instantly from tray
      const id = nanoid();
      let newNode: Node;

      if (type === "link") {
        const isUrl = item.content.startsWith("http");
        const linkUrl = isUrl ? item.content : `https://www.google.com/search?q=${encodeURIComponent(item.content)}`;
        const isYouTube = /youtube\.com|youtu\.be/.test(linkUrl);
        newNode = {
          id, type: "link", position: flowPos,
          width:  isYouTube ? 480 : undefined,
          height: isYouTube ? 270 : undefined,
          data: { url: linkUrl, title: item.content },
        };
      } else {
        newNode = {
          id, type, position: flowPos,
          data: { label: type === "note" ? "" : item.content, content: item.content },
        };
      }

      setNodes((nds) => {
        const next = [...nds, newNode];
        scheduleSave(next, edges);
        return next;
      });

      try {
        await fetch(`/api/inbox/${item.id}`, { method: "DELETE" });
      } catch { /* best effort */ }
    },
    [setNodes, edges, scheduleSave]
  );

  // Drag URL from browser → LinkNode | Drag inbox item → type picker
  const onDragOver = useCallback((e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (types.includes("application/brainflux-inbox") || types.includes("text/uri-list") || types.includes("text/plain") || types.includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();

      // Inbox item drop → show type picker
      const inboxRaw = e.dataTransfer.getData("application/brainflux-inbox");
      if (inboxRaw) {
        try {
          const item = JSON.parse(inboxRaw) as InboxItem;
          const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
          setInboxPicker({ item, x: e.clientX, y: e.clientY, flowPos });
        } catch { /* malformed */ }
        return;
      }

      // Image file drop from desktop
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find(f => f.type.startsWith("image/"));
      if (imageFile) {
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          if (!src) return;
          const id = nanoid();
          const img = new window.Image();
          img.onload = () => {
            const maxW = 480;
            const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
            const w = Math.round(img.naturalWidth * scale);
            const h = Math.round(img.naturalHeight * scale) + 30; // +30 for caption
            setNodes((nds) => {
              const next = [...nds, {
                id,
                type: "image",
                position,
                width: w,
                height: h,
                data: { src, alt: imageFile.name.replace(/\.[^.]+$/, "") },
              }];
              scheduleSave(next, edges);
              return next;
            });
          };
          img.src = src;
        };
        reader.readAsDataURL(imageFile);
        return;
      }

      const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
      if (!url || !url.startsWith("http")) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();
      const id = nanoid();
      const isYouTube = /youtube\.com|youtu\.be/.test(url);

      const newNode: Node = {
        id,
        type: "link",
        position,
        width:  isYouTube ? 480 : undefined,
        height: isYouTube ? 270 : undefined,
        data: { url, title: hostname },
      };

      setNodes((nds) => {
        const next = [...nds, newNode];
        scheduleSave(next, edges);
        return next;
      });

      // Fetch real title in background
      try {
        const res = await fetch("/api/fetch-title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const { title } = await res.json();
        if (title) {
          setNodes((nds) => {
            const next = nds.map((n) =>
              n.id === id ? { ...n, data: { ...n.data, title } } : n
            );
            scheduleSave(next, edges);
            return next;
          });
        }
      } catch {
        // keep hostname fallback
      }
    },
    [setNodes, edges, scheduleSave, screenToFlowPosition]
  );

  // Delete selected nodes on Backspace/Delete key + arrow-key navigation between connected nodes
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitEditMode();
        return;
      }

      // Skip if typing in a text field or in edit mode
      const active = document.activeElement;
      const isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || (active as HTMLElement).isContentEditable);

      if (e.key === "Backspace" || e.key === "Delete") {
        if (isTyping) return;
        if (editingNodeId) return;
        setNodes((nds) => {
          const next = nds.filter((n) => !n.selected);
          if (next.length !== nds.length) scheduleSave(next, edges);
          return next;
        });
        setEdges((eds) => eds.filter((e) => !e.selected));
        return;
      }

      // Arrow keys: navigate to connected node in that direction
      const dirMap: Record<string, string> = {
        ArrowLeft: "left", ArrowRight: "right",
        ArrowUp: "top",   ArrowDown: "bottom",
      };
      const dir = dirMap[e.key];
      if (!dir || isTyping || editingNodeId) return;

      // Get the single selected node
      setNodes((nds) => {
        const selected = nds.filter((n) => n.selected);
        if (selected.length !== 1) return nds;
        const nodeId = selected[0].id;

        // Find a connected node via the handle matching `dir`
        let neighborId: string | null = null;
        for (const edge of edges) {
          if (edge.source === nodeId && edge.sourceHandle === dir) {
            neighborId = edge.target;
            break;
          }
          if (edge.target === nodeId && edge.targetHandle === dir) {
            neighborId = edge.source;
            break;
          }
        }
        if (!neighborId) return nds;

        // Prevent default scroll
        e.preventDefault();

        // Zoom to neighbour and select it
        fitView({ nodes: [{ id: neighborId }], padding: 0.4, duration: 450, maxZoom: 1.5 });
        return nds.map((n) => ({ ...n, selected: n.id === neighborId }));
      });
    },
    [setNodes, setEdges, edges, scheduleSave, editingNodeId, exitEditMode, fitView]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // Double-click → enter edit mode; Shift+double-click → zoom to node
  const onNodeDoubleClick = useCallback(
    (e: React.MouseEvent, node: Node) => {
      if (e.shiftKey) {
        fitView({ nodes: [{ id: node.id }], padding: 0.4, duration: 500, maxZoom: 1.5 });
      } else {
        enterEditMode(node.id);
      }
    },
    [fitView, enterEditMode]
  );

  // Right-click → context menu
  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault();
    const url = node.type === "link" ? (node.data as { url?: string }).url : undefined;
    const onChangeCity = node.type === "weather" ? () => {
      setNodes((nds) => nds.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, city: "" } } : n
      ));
    } : undefined;
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id, url, nodeType: node.type, onChangeCity });
  }, [setNodes]);

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
    <TriggerSaveContext.Provider value={triggerSave}>
    <EditingContext.Provider value={editingNodeId}>
    <div
      style={{ width: "100vw", height: "100vh" }}
      onClick={() => setContextMenu(null)}
      onWheel={() => { if (editingNodeId) exitEditMode(); }}
      onDragOver={onDragOver}
      onDrop={onDrop}
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
        edgeTypes={EDGE_TYPES}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{ type: "default" }}
        connectionRadius={40}
        colorMode="dark"
        panOnDrag={editingNodeId === null}
        zoomOnDoubleClick={false}
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={() => { setContextMenu(null); exitEditMode(); }}
        onMoveEnd={() => scheduleSave(nodes, edges)}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" style={{ backgroundColor: "transparent" }} />
        <Controls />
        <MiniMap
          style={{ background: "#18181b", border: "1px solid #27272a" }}
          nodeColor="#3f3f46"
          maskColor="#09090b99"
        />
      </ReactFlow>

      <Toolbar onAdd={addNode} onVoiceNote={addVoiceNoteNode} background={background} onBackgroundChange={onBackgroundChange} />

      <InboxTray onDragStart={() => {}} />

      {/* Inbox type picker */}
      {inboxPicker && (
        <div
          onClick={() => setInboxPicker(null)}
          style={{ position: "fixed", inset: 0, zIndex: 100 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: inboxPicker.x,
              top: inboxPicker.y,
              background: "#1a1a1a",
              border: "1px solid #eab308",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              zIndex: 101,
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              minWidth: 160,
              transform: "translate(-50%, 8px)",
            }}
          >
            <p style={{ color: "#888", fontSize: 11, margin: "0 0 4px", textAlign: "center" }}>
              Add as…
            </p>
            {(["note", "sticky", "link"] as const).map((type) => (
              <button
                key={type}
                onClick={() => consumeInboxItem(type, inboxPicker.item, inboxPicker.flowPos)}
                style={{
                  background: "#2a2a2a",
                  border: "1px solid #3f3f46",
                  borderRadius: 7,
                  color: "#e5e7eb",
                  fontSize: 13,
                  padding: "6px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  textTransform: "capitalize",
                }}
              >
                {type === "note" ? "📝 Note" : type === "sticky" ? "🟡 Sticky" : "🔗 Link"}
              </button>
            ))}
          </div>
        </div>
      )}

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
    </EditingContext.Provider>
    </TriggerSaveContext.Provider>
  );
}

// ─── Public export — wraps inner editor in ReactFlowProvider ─────────────────

export function LifeCanvas({ canvasId, userName }: { canvasId: string; userName: string }) {
  const [background, setBackground] = useState<BackgroundSetting>(
    () => (typeof window !== "undefined" ? localStorage.getItem("brainflux-bg") as BackgroundSetting : null) || "stars"
  );

  const onBackgroundChange = useCallback((bg: BackgroundSetting) => {
    setBackground(bg);
    localStorage.setItem("brainflux-bg", bg);
  }, []);

  return (
    <>
      {background === "stars" && <Starfield />}
      {background === "matrix" && <MatrixRain />}
      <ReactFlowProvider>
        <FlowEditorInner canvasId={canvasId} userName={userName} background={background} onBackgroundChange={onBackgroundChange} />
      </ReactFlowProvider>
    </>
  );
}
