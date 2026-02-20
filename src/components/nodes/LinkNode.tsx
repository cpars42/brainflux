"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export type LinkData = {
  url: string;
  title?: string;
};

function getHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

export function LinkNode({ data, selected }: NodeProps) {
  const nodeData = data as LinkData;
  const hostname = getHostname(nodeData.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  const title = nodeData.title || hostname;
  const shortUrl = nodeData.url.length > 52
    ? nodeData.url.slice(0, 49) + "…"
    : nodeData.url;

  return (
    <>
      <Handle id="top"    type="source" position={Position.Top} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="left"   type="source" position={Position.Left} />
      <Handle id="right"  type="source" position={Position.Right} />
      <a
        href={nodeData.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "block",
          background: "#18181b",
          border: `1.5px solid ${selected ? "#6366f1" : "#27272a"}`,
          borderRadius: 12,
          padding: "10px 14px",
          boxShadow: selected ? "0 0 0 2px #6366f133" : "0 4px 24px #00000066",
          textDecoration: "none",
          minWidth: 220,
          maxWidth: 320,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={faviconUrl}
            width={16}
            height={16}
            alt=""
            style={{ borderRadius: 2, flexShrink: 0 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#e4e4e7",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {title}
          </span>
        </div>
        <div style={{
          fontSize: 11,
          color: "#52525b",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {shortUrl}
        </div>
      </a>
    </>
  );
}
