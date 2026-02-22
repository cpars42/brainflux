"use client";

import { useState, useCallback, useRef } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

export type ImageData = {
  imageData?: string;
  alt?: string;
};

export function ImageNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ImageData;
  const [imageData, setImageData] = useState(nodeData.imageData ?? "");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageData(result);
      nodeData.imageData = result;
    };
    reader.readAsDataURL(file);
  }, [nodeData]);

  const onDrop = useCallback((e: React.DragEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [isEditing, handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, [isEditing]);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    if (!isEditing) return;
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) handleFile(file);
    }
  }, [isEditing, handleFile]);

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={150}
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
          border: `1.5px solid ${isDragOver ? "#6366f1" : isEditing ? "#eab308" : selected ? "#6366f1" : "#27272a"}`,
          boxShadow: isEditing
            ? "0 0 0 2px #eab30833"
            : selected
            ? "0 0 0 2px #6366f133"
            : "0 4px 24px #00000066",
          minWidth: 200,
          minHeight: 150,
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onPaste={onPaste}
        tabIndex={0}
      >
        {/* Header */}
        <div style={{ background: "#1c1c20", padding: "8px 12px", borderBottom: "1px solid #27272a", flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: "#71717a", fontWeight: 600 }}>🖼️ Image</span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {imageData ? (
            <img
              src={imageData}
              alt={nodeData.alt ?? ""}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: 16,
                border: `2px dashed ${isDragOver ? "#6366f1" : "#3f3f46"}`,
                borderRadius: 8,
                cursor: isEditing ? "pointer" : "default",
                textAlign: "center",
              }}
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              <span style={{ fontSize: 32 }}>🖼️</span>
              <span style={{ fontSize: 11, color: "#71717a" }}>
                {isEditing ? "Drop image here or click to upload" : "Double-click to add image"}
              </span>
            </div>
          )}
          {imageData && isEditing && (
            <button
              onClick={() => { setImageData(""); nodeData.imageData = ""; }}
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                background: "#27272a",
                border: "none",
                borderRadius: 4,
                color: "#a1a1aa",
                cursor: "pointer",
                fontSize: 12,
                padding: "2px 6px",
              }}
            >
              ✕
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </>
  );
}
