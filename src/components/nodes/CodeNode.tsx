"use client";

import { useState, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
// @ts-ignore — react-syntax-highlighter ships its own types
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism";
// @ts-ignore
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useEditingNodeId } from "../LifeCanvas";

const LANGUAGES: { value: string; label: string }[] = [
  { value: "javascript", label: "JS" },
  { value: "typescript", label: "TS" },
  { value: "python",     label: "Python" },
  { value: "bash",       label: "Bash" },
  { value: "json",       label: "JSON" },
  { value: "html",       label: "HTML" },
  { value: "css",        label: "CSS" },
  { value: "sql",        label: "SQL" },
  { value: "rust",       label: "Rust" },
  { value: "go",         label: "Go" },
  { value: "java",       label: "Java" },
  { value: "cpp",        label: "C++" },
  { value: "yaml",       label: "YAML" },
  { value: "markdown",   label: "Markdown" },
];

/** Legacy short names (from nodes saved before this update) → full names */
const LANG_ALIAS: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
};

function normalizeLang(lang: string | undefined): string {
  const l = (lang ?? "javascript").toLowerCase();
  return LANG_ALIAS[l] ?? l;
}

export type CodeData = {
  title?: string;
  language?: string;
  code?: string;
};

export function CodeNode({ id, data, selected }: NodeProps) {
  const nodeData = data as CodeData;
  const [title, setTitle] = useState(nodeData.title ?? "");
  const [language, setLanguage] = useState(normalizeLang(nodeData.language));
  const [code, setCode] = useState(nodeData.code ?? "");
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  const updateCode = useCallback(
    (val: string) => {
      setCode(val);
      nodeData.code = val;
    },
    [nodeData]
  );

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    nodeData.language = val;
  };

  const borderColor = isEditing ? "#eab308" : selected ? "#6366f1" : "#27272a";
  const boxShadow = isEditing
    ? "0 0 0 2px #eab30833"
    : selected
    ? "0 0 0 2px #6366f133"
    : "0 4px 24px #00000066";

  return (
    <>
      <NodeResizer
        minWidth={260}
        minHeight={180}
        isVisible={selected}
        lineStyle={{ borderColor: "#6366f1" }}
        handleStyle={{ backgroundColor: "#6366f1", border: "none" }}
      />
      <Handle id="top"    type="source" position={Position.Top} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="left"   type="source" position={Position.Left} />
      <Handle id="right"  type="source" position={Position.Right} />

      <div
        className="h-full flex flex-col rounded-xl overflow-hidden"
        style={{
          background: "#0d1117",
          border: `1.5px solid ${borderColor}`,
          boxShadow,
          minWidth: 260,
          minHeight: 180,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#161b22",
            padding: "7px 12px",
            borderBottom: "1px solid #30363d",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14 }}>💻</span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              nodeData.title = e.target.value;
            }}
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
            onChange={(e) => handleLanguageChange(e.target.value)}
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
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Code Area */}
        <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
          {isEditing ? (
            /* Edit mode: plain textarea */
            <textarea
              value={code}
              onChange={(e) => updateCode(e.target.value)}
              placeholder="// Write your code here..."
              spellCheck={false}
              autoFocus
              style={{
                width: "100%",
                height: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                padding: "12px",
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 13,
                color: "#e6edf3",
                lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />
          ) : (
            /* View mode: syntax-highlighted */
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: "12px",
                background: "transparent",
                fontSize: 13,
                lineHeight: 1.6,
                minHeight: "100%",
                fontFamily: "'Courier New', Courier, monospace",
              }}
              showLineNumbers={code.split("\n").length > 4}
              lineNumberStyle={{ color: "#3d4450", fontSize: 11 }}
              wrapLongLines={false}
            >
              {code || "// Double-click to edit"}
            </SyntaxHighlighter>
          )}
        </div>
      </div>
    </>
  );
}
