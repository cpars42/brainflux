"use client";

import { useState, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const LANGUAGES = [
  { id: "js",     label: "JavaScript", prism: "javascript" },
  { id: "ts",     label: "TypeScript", prism: "typescript" },
  { id: "python", label: "Python",     prism: "python" },
  { id: "bash",   label: "Bash",       prism: "bash" },
  { id: "json",   label: "JSON",       prism: "json" },
  { id: "html",   label: "HTML",       prism: "html" },
  { id: "css",    label: "CSS",        prism: "css" },
  { id: "sql",    label: "SQL",        prism: "sql" },
  { id: "rust",   label: "Rust",       prism: "rust" },
  { id: "go",     label: "Go",         prism: "go" },
];

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

  const langDef = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];

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
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Code Area */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {isEditing ? (
            /* Edit mode: plain textarea */
            <textarea
              value={code}
              onChange={(e) => updateCode(e.target.value)}
              autoFocus
              spellCheck={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                padding: "12px",
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                fontSize: 13,
                color: "#e6edf3",
                lineHeight: 1.6,
                zIndex: 2,
              }}
            />
          ) : (
            /* View mode: syntax-highlighted */
            <div style={{ position: "absolute", inset: 0, overflow: "auto" }}>
              <SyntaxHighlighter
                language={langDef.prism}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "12px",
                  background: "transparent",
                  fontSize: 13,
                  lineHeight: 1.6,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                  minHeight: "100%",
                }}
                codeTagProps={{ style: { fontFamily: "inherit" } }}
              >
                {code || "// Double-click to edit"}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
