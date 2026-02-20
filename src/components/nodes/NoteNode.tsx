"use client";

import { useState, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";

export type NoteData = {
  title?: string;
  content?: string;
};

export function NoteNode({ data, selected }: NodeProps) {
  const nodeData = data as NoteData;
  const [title, setTitle] = useState(nodeData.title ?? "");
  const [content, setContent] = useState(nodeData.content ?? "");

  const updateData = useCallback(() => {
    nodeData.title = title;
    nodeData.content = content;
  }, [title, content, nodeData]);

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={120}
        isVisible={selected}
        lineStyle={{ borderColor: "#6366f1" }}
        handleStyle={{ backgroundColor: "#6366f1", border: "none" }}
      />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div
        className="h-full flex flex-col rounded-xl overflow-hidden"
        style={{
          background: "#18181b",
          border: `1.5px solid ${selected ? "#6366f1" : "#27272a"}`,
          boxShadow: selected ? "0 0 0 2px #6366f133" : "0 4px 24px #00000066",
          minWidth: 200,
          minHeight: 120,
        }}
      >
        <div style={{ background: "#1c1c20", padding: "8px 12px", borderBottom: "1px solid #27272a" }}>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); updateData(); }}
            placeholder="Title..."
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder-zinc-600"
            style={{ color: "#e4e4e7" }}
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); updateData(); }}
          placeholder="Write anything..."
          className="flex-1 w-full bg-transparent text-sm outline-none resize-none placeholder-zinc-700 p-3"
          style={{ color: "#a1a1aa", lineHeight: 1.6 }}
        />
      </div>
    </>
  );
}
