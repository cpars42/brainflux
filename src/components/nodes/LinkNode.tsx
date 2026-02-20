"use client";

import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";

export type LinkData = {
  url: string;
  title?: string;
};

function getHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

/** Returns the YouTube video ID if the URL is a YouTube link, otherwise null. */
function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    // youtu.be/VIDEO_ID
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    // youtube.com/watch?v=VIDEO_ID
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      // youtube.com/shorts/VIDEO_ID
      const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return shortsMatch[1];
      // youtube.com/embed/VIDEO_ID
      const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
    }
  } catch { /* ignore */ }
  return null;
}

export function LinkNode({ data, selected, width, height }: NodeProps) {
  const nodeData = data as LinkData;
  const youtubeId = getYouTubeId(nodeData.url);

  if (youtubeId) {
    const embedUrl = `https://www.youtube.com/embed/${youtubeId}?rel=0`;
    const w = (width as number) || 480;
    const h = (height as number) || 270;

    return (
      <>
        <NodeResizer
          isVisible={selected}
          minWidth={240}
          minHeight={135}
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
            height: h,
            borderRadius: 12,
            overflow: "hidden",
            border: `1.5px solid ${selected ? "#6366f1" : "#27272a"}`,
            boxShadow: selected ? "0 0 0 2px #6366f133" : "0 4px 24px #00000066",
            background: "#000",
            position: "relative",
          }}
        >
          <iframe
            src={embedUrl}
            width={w}
            height={h}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ border: "none", display: "block", pointerEvents: "auto" }}
            title={nodeData.title || "YouTube"}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </>
    );
  }

  // ── Standard link card ─────────────────────────────────────────────────────
  const hostname = getHostname(nodeData.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  const title = nodeData.title || hostname;
  const shortUrl = nodeData.url.length > 52 ? nodeData.url.slice(0, 49) + "…" : nodeData.url;

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
