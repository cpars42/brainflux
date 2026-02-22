"use client";

import { useState, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

const LANGUAGES = ["js", "ts", "python", "bash", "json", "html", "css", "sql", "rust", "go"];

export type CodeData = {
  title?: string;
  language?: string;
  code?: string;
};

export function CodeNode({ id, data, selected }: NodeProps) {
  const nodeData = data as CodeData;
  const [title, setTitle] = useState(nodeData.title ?? "");
  const [language, setLanguage] = useState(nodeData.language ?? "js");
  const [code, setCode] = useState(nodeData.code ?? "");
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  const updateCode = useCallback((val: string) => {
    setCode(val);
    nodeData.code = val;
  }, [nodeData]);

  return (
    <>
      <NodeResizer
        minWidth={260}
        minHeight={180}
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
          background: "#0d1117",
          border: `1.5px solid ${isEditing ? "#eab308" : selected ? "#6366f1" : "#27272a"}`,
          boxShadow: isEditing
            ? "0 0 0 2px #eab30833"
            : selected
            ? "0 0 0 2px #6366f133"
            : "0 4px 24px #00000066",
          minWidth: 260,
          minHeight: 180,
        }}
      >
        {/* Header */}
        <div style={{ background: "#161b22", padding: "7px 12px", borderBottom: "1px solid #30363d", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>💻</span>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); nodeData.title = e.target.value; }}
            placeholder="Code snippet..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              fontWeight: 600,
              color: "#e6edf3",
              pointerEvents: isEditing ? "auto" : "none",
              userSelect: isEditing ? "auto" : "none",
            }}
          />
          <select
            value={language}
            onChange={(e) => { setLanguage(e.target.value); nodeData.language = e.target.value; }}
            style={{
              background: "#21262d",
              border: "1px solid #30363d",
              borderRadius: 4,
              color: "#8b949e",
              fontSize: 11,
              padding: "2px 4px",
              outline: "none",
              cursor: isEditing ? "pointer" : "default",
              pointerEvents: isEditing ? "auto" : "none",
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Code Area */}
        <textarea
          value={code}
          onChange={(e) => updateCode(e.target.value)}
          placeholder={isEditing ? "// Write your code here..." : "Double-click to edit"}
          spellCheck={false}
          style={{
            flex: 1,
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            padding: "12px",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 13,
            color: "#e6edf3",
            lineHeight: 1.6,
            pointerEvents: isEditing ? "auto" : "none",
            userSelect: isEditing ? "auto" : "none",
            cursor: isEditing ? "text" : "default",
          }}
        />
      </div>
    </>
  );
}
