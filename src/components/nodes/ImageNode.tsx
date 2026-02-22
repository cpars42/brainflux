"use client";

import { useState, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

export type ImageData = {
  src: string;   // data URL or remote URL
  alt?: string;
};

export function ImageNode({ id, data, selected, width, height }: NodeProps) {
  const nodeData = data as ImageData;
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  const [alt, setAlt] = useState(nodeData.alt ?? "");

  const updateAlt = useCallback((val: string) => {
    setAlt(val);
    nodeData.alt = val;
  }, [nodeData]);

  const w = (width as number) || 320;
  const h = (height as number) || 240;
  const captionH = 30;

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={80}
        keepAspectRatio={false}
        handleStyle={{ background: "#6366f1", border: "none", width: 10, height: 10 }}
        lineStyle={{ borderColor: selected ? "#6366f1" : "transparent" }}
      />
      <Handle id="top"    type="source" position={Position.Top} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="left"   type="source" position={Position.Left} />
      <Handle id="right"  type="source" position={Position.Right} />
      <div
        style={{
          width: w,
          borderRadius: 12,
          overflow: "hidden",
          border: `1.5px solid ${isEditing ? "#eab308" : selected ? "#6366f1" : "#27272a"}`,
          boxShadow: isEditing
            ? "0 0 0 2px #eab30833"
            : selected
            ? "0 0 0 2px #6366f133"
            : "0 4px 24px #00000066",
          background: "#18181b",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={nodeData.src}
          alt={alt || "image"}
          style={{
            width: w,
            height: h - captionH,
            objectFit: "contain",
            background: "#09090b",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
          }}
          draggable={false}
        />
        {/* Caption / alt text */}
        <div
          style={{
            height: captionH,
            padding: "0 10px",
            display: "flex",
            alignItems: "center",
            borderTop: "1px solid #27272a",
            background: "#18181b",
            flexShrink: 0,
          }}
        >
          {isEditing ? (
            <input
              value={alt}
              onChange={(e) => updateAlt(e.target.value)}
              placeholder="Caption..."
              autoFocus
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 11,
                color: "#a1a1aa",
                cursor: "text",
              }}
            />
          ) : (
            <span style={{
              fontSize: 11,
              color: alt ? "#71717a" : "#3f3f46",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}>
              {alt || "Double-click to add caption"}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
