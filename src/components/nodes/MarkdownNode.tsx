"use client";

import { useState, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

export type MarkdownData = {
  title?: string;
  content?: string;
};

function parseMarkdown(text: string): string {
  const lines = text.split("\n");
  const output: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headings
    if (line.startsWith("### ")) {
      if (inList) { output.push("</ul>"); inList = false; }
      output.push(`<h3 style="font-size:14px;font-weight:700;margin:8px 0 4px;color:#e4e4e7">${line.slice(4)}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) { output.push("</ul>"); inList = false; }
      output.push(`<h2 style="font-size:16px;font-weight:700;margin:10px 0 4px;color:#e4e4e7">${line.slice(3)}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      if (inList) { output.push("</ul>"); inList = false; }
      output.push(`<h1 style="font-size:18px;font-weight:800;margin:12px 0 4px;color:#e4e4e7">${line.slice(2)}</h1>`);
      continue;
    }

    // List items
    if (line.match(/^[-*] /)) {
      if (!inList) { output.push('<ul style="margin:4px 0;padding-left:18px">'); inList = true; }
      const content = formatInline(line.slice(2));
      output.push(`<li style="color:#a1a1aa;margin:2px 0;font-size:13px">${content}</li>`);
      continue;
    } else if (inList) {
      output.push("</ul>");
      inList = false;
    }

    // Blank line → paragraph break
    if (line.trim() === "") {
      output.push('<div style="height:8px"></div>');
      continue;
    }

    // Normal paragraph
    output.push(`<p style="margin:2px 0;font-size:13px;color:#a1a1aa;line-height:1.6">${formatInline(line)}</p>`);
  }

  if (inList) output.push("</ul>");
  return output.join("");
}

function formatInline(text: string): string {
  // Escape HTML first (very basic)
  text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Code: `code`
  text = text.replace(/`([^`]+)`/g, '<code style="background:#27272a;border-radius:3px;padding:1px 4px;font-family:monospace;font-size:12px;color:#e6edf3">$1</code>');
  // Bold: **text**
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#e4e4e7">$1</strong>');
  // Italic: *text* or _text_
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
  // Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#818cf8;text-decoration:underline">$1</a>');
  return text;
}

export function MarkdownNode({ id, data, selected }: NodeProps) {
  const nodeData = data as MarkdownData;
  const [title, setTitle] = useState(nodeData.title ?? "");
  const [content, setContent] = useState(nodeData.content ?? "");
  const [preview, setPreview] = useState(false);
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  const updateContent = useCallback((val: string) => {
    setContent(val);
    nodeData.content = val;
  }, [nodeData]);

  const showPreview = !isEditing || preview;

  return (
    <>
      <NodeResizer
        minWidth={240}
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
          background: "#18181b",
          border: `1.5px solid ${isEditing ? "#eab308" : selected ? "#6366f1" : "#27272a"}`,
          boxShadow: isEditing
            ? "0 0 0 2px #eab30833"
            : selected
            ? "0 0 0 2px #6366f133"
            : "0 4px 24px #00000066",
          minWidth: 240,
          minHeight: 180,
        }}
      >
        {/* Header */}
        <div style={{ background: "#1c1c20", padding: "7px 12px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>📄</span>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); nodeData.title = e.target.value; }}
            placeholder="Markdown note..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              fontWeight: 600,
              color: "#e4e4e7",
              pointerEvents: isEditing ? "auto" : "none",
              userSelect: isEditing ? "auto" : "none",
            }}
          />
          {isEditing && (
            <button
              onClick={() => setPreview((p) => !p)}
              style={{
                background: preview ? "#6366f1" : "#27272a",
                border: "none",
                borderRadius: 5,
                color: preview ? "#fff" : "#a1a1aa",
                cursor: "pointer",
                fontSize: 11,
                padding: "2px 8px",
                flexShrink: 0,
              }}
            >
              {preview ? "Edit" : "Preview"}
            </button>
          )}
        </div>

        {/* Body */}
        {showPreview ? (
          <div
            style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) || '<p style="color:#3f3f46;font-size:13px">Nothing to preview</p>' }}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => updateContent(e.target.value)}
            placeholder="# Heading&#10;**bold**, *italic*, `code`&#10;- List item&#10;[link](url)"
            spellCheck={false}
            style={{
              flex: 1,
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              padding: "10px 14px",
              fontSize: 13,
              color: "#a1a1aa",
              lineHeight: 1.6,
              fontFamily: "monospace",
            }}
          />
        )}
      </div>
    </>
  );
}
