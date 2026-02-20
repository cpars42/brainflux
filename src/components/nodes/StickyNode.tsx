"use client";

import { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type StickyData = {
  content?: string;
  color?: string;
};

const COLORS = [
  { bg: "#fef08a", text: "#713f12" }, // yellow
  { bg: "#86efac", text: "#14532d" }, // green
  { bg: "#93c5fd", text: "#1e3a5f" }, // blue
  { bg: "#f9a8d4", text: "#831843" }, // pink
  { bg: "#fdba74", text: "#7c2d12" }, // orange
  { bg: "#c4b5fd", text: "#2e1065" }, // purple
];

export function StickyNode({ data, selected }: NodeProps) {
  const nodeData = data as StickyData;
  const colorIdx = COLORS.findIndex((c) => c.bg === nodeData.color) ?? 0;
  const [colorIndex, setColorIndex] = useState(colorIdx >= 0 ? colorIdx : 0);
  const [content, setContent] = useState(nodeData.content ?? "");

  const color = COLORS[colorIndex];

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <div
        style={{
          background: color.bg,
          border: selected ? "2px solid #6366f1" : "2px solid transparent",
          borderRadius: 8,
          width: 180,
          minHeight: 140,
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          boxShadow: "2px 4px 16px #00000044",
          transform: "rotate(-1deg)",
        }}
      >
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            nodeData.content = e.target.value;
          }}
          placeholder="Quick thought..."
          className="flex-1 w-full bg-transparent text-sm outline-none resize-none"
          style={{ color: color.text, fontWeight: 500, lineHeight: 1.5, minHeight: 80 }}
        />
        <div style={{ display: "flex", gap: 4 }}>
          {COLORS.map((c, i) => (
            <button
              key={i}
              onClick={() => {
                setColorIndex(i);
                nodeData.color = c.bg;
              }}
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: c.bg,
                border: i === colorIndex ? "2px solid #1a1a1a" : "1px solid #00000033",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
