"use client";

import { useState, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

type ChecklistItem = { id: string; text: string; checked: boolean };

export type ChecklistData = {
  title?: string;
  items?: ChecklistItem[];
};

export function ChecklistNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ChecklistData;
  const [title, setTitle] = useState(nodeData.title ?? "");
  const [items, setItems] = useState<ChecklistItem[]>(nodeData.items ?? []);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  const sync = useCallback((newItems: ChecklistItem[], newTitle?: string) => {
    nodeData.items = newItems;
    if (newTitle !== undefined) nodeData.title = newTitle;
  }, [nodeData]);

  const toggleItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const next = prev.map((it) => it.id === itemId ? { ...it, checked: !it.checked } : it);
      sync(next);
      return next;
    });
  }, [sync]);

  const updateText = useCallback((itemId: string, text: string) => {
    setItems((prev) => {
      const next = prev.map((it) => it.id === itemId ? { ...it, text } : it);
      sync(next);
      return next;
    });
  }, [sync]);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== itemId);
      sync(next);
      return next;
    });
  }, [sync]);

  const addItem = useCallback(() => {
    const newItem: ChecklistItem = { id: Date.now().toString(), text: "", checked: false };
    setItems((prev) => {
      const next = [...prev, newItem];
      sync(next);
      return next;
    });
  }, [sync]);

  const checked = items.filter((it) => it.checked).length;

  return (
    <>
      <NodeResizer
        minWidth={220}
        minHeight={160}
        isVisible={selected}
        lineStyle={{ borderColor: "#6366f1" }}
        handleStyle={{ backgroundColor: "#6366f1", border: "none" }}
      />
      <Handle id="top" type="source" position={Position.Top} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="left" type="source" position={Position.Left} />
      <Handle id="right" type="source" position={Position.Right} />

      <div
        className="h-full flex flex-col rounded-xl overflow-hidden"
        style={{
          background: "#18181b",
          border: `1.5px solid ${isEditing ? "#eab308" : selected ? "#6366f1" : "#27272a"}`,
          boxShadow: isEditing
            ? "0 0 0 2px #eab30833"
            : selected
            ? "0 0 0 2px #6366f133"
            : "0 4px 24px #00000066",
          minWidth: 220,
          minHeight: 160,
        }}
      >
        {/* Header */}
        <div style={{ background: "#1c1c20", padding: "8px 12px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>✅</span>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); nodeData.title = e.target.value; }}
            placeholder="Checklist..."
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder-zinc-600"
            style={{
              color: "#e4e4e7",
              pointerEvents: isEditing ? "auto" : "none",
              userSelect: isEditing ? "auto" : "none",
            }}
          />
          <span style={{ fontSize: 10, color: "#71717a", flexShrink: 0 }}>{checked}/{items.length}</span>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
                style={{ cursor: "pointer", accentColor: "#6366f1", flexShrink: 0 }}
              />
              <input
                value={item.text}
                onChange={(e) => updateText(item.id, e.target.value)}
                placeholder="Item..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: item.checked ? "#52525b" : "#a1a1aa",
                  textDecoration: item.checked ? "line-through" : "none",
                  pointerEvents: isEditing ? "auto" : "none",
                  userSelect: isEditing ? "auto" : "none",
                }}
              />
              {isEditing && hoveredId === item.id && (
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 12, padding: "0 2px", flexShrink: 0 }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {isEditing && (
            <button
              onClick={addItem}
              style={{
                marginTop: 6,
                width: "100%",
                background: "none",
                border: "1px dashed #3f3f46",
                borderRadius: 6,
                color: "#71717a",
                cursor: "pointer",
                fontSize: 12,
                padding: "4px 0",
              }}
            >
              + Add item
            </button>
          )}
        </div>
      </div>
    </>
  );
}
