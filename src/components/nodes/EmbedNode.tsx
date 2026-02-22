"use client";

import { useState, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

export type EmbedData = {
  url?: string;
};

export function EmbedNode({ id, data, selected }: NodeProps) {
  const nodeData = data as EmbedData;
  const [url, setUrl] = useState(nodeData.url ?? "");
  const [loadedUrl, setLoadedUrl] = useState(nodeData.url ?? "");
  const [input, setInput] = useState(nodeData.url ?? "");
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  const load = useCallback(() => {
    let finalUrl = input.trim();
    if (finalUrl && !finalUrl.startsWith("http")) finalUrl = "https://" + finalUrl;
    setUrl(finalUrl);
    setLoadedUrl(finalUrl);
    nodeData.url = finalUrl;
  }, [input, nodeData]);

  const clear = useCallback(() => {
    setUrl("");
    setLoadedUrl("");
    setInput("");
    nodeData.url = "";
  }, [nodeData]);

  return (
    <>
      <NodeResizer
        minWidth={300}
        minHeight={200}
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
          minWidth: 300,
          minHeight: 200,
        }}
      >
        {/* Header */}
        <div style={{ background: "#1c1c20", padding: "7px 10px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>🌐</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load(); }}
            placeholder="https://example.com"
            style={{
              flex: 1,
              background: "#27272a",
              border: "1px solid #3f3f46",
              borderRadius: 6,
              outline: "none",
              padding: "3px 8px",
              fontSize: 12,
              color: "#e4e4e7",
              fontFamily: "monospace",
            }}
          />
          {!loadedUrl ? (
            <button
              onClick={load}
              style={{
                background: "#6366f1",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                cursor: "pointer",
                fontSize: 12,
                padding: "3px 10px",
                flexShrink: 0,
              }}
            >
              Load
            </button>
          ) : (
            <button
              onClick={clear}
              style={{
                background: "#27272a",
                border: "none",
                borderRadius: 6,
                color: "#a1a1aa",
                cursor: "pointer",
                fontSize: 12,
                padding: "3px 8px",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {loadedUrl ? (
            <iframe
              src={loadedUrl}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "#fff",
                pointerEvents: isEditing ? "none" : "auto",
              }}
              title={url}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#3f3f46", fontSize: 13 }}>
              Enter a URL above to embed
            </div>
          )}
        </div>
      </div>
    </>
  );
}
