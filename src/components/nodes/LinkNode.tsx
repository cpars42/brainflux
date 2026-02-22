"use client";

import { useState, useEffect } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

export type LinkData = {
  url: string;
  title?: string;
};

function getHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

function getFaviconUrl(url: string): string {
  const hostname = getHostname(url);
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
}

/** Returns the YouTube video ID if the URL is a YouTube link, otherwise null. */
function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
    }
  } catch { /* ignore */ }
  return null;
}

export function LinkNode({ id, data, selected, width, height }: NodeProps) {
  const nodeData = data as LinkData;
  const youtubeId = getYouTubeId(nodeData.url);
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  // Fallback display title (before any user edit or fetched title)
  const fallback = youtubeId ? "YouTube" : getHostname(nodeData.url);
  const [title, setTitle] = useState(nodeData.title || fallback);

  // Sync when the background title-fetch updates nodeData.title (e.g. after URL drop)
  useEffect(() => {
    if (!isEditing && nodeData.title) {
      setTitle(nodeData.title);
    }
  }, [nodeData.title, isEditing]);

  // ── YouTube embed ─────────────────────────────────────────────────────────
  if (youtubeId) {
    const embedUrl = `https://www.youtube.com/embed/${youtubeId}?rel=0`;
    const w = (width as number) || 480;
    const h = (height as number) || 270;
    const headerH = 34;
    const faviconUrl = getFaviconUrl(nodeData.url);

    return (
      <>
        <NodeResizer
          isVisible={selected}
          minWidth={240}
          minHeight={135 + headerH}
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
          {/* Drag/select header — double-click to edit title */}
          <div
            style={{
              height: headerH,
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderBottom: "1px solid #27272a",
              cursor: isEditing ? "default" : "grab",
              userSelect: "none",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faviconUrl}
              width={14} height={14} alt=""
              style={{ borderRadius: 2, flexShrink: 0 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <input
              value={title}
              onChange={(e) => {
                const v = e.target.value;
                setTitle(v);
                nodeData.title = v;
              }}
              placeholder="Title..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 12,
                color: "#a1a1aa",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                pointerEvents: isEditing ? "auto" : "none",
                userSelect: isEditing ? "auto" : "none",
                cursor: isEditing ? "text" : "inherit",
                minWidth: 0,
              }}
              onClick={(e) => { if (isEditing) e.stopPropagation(); }}
              onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
            />
            {!isEditing && (
              <span style={{ fontSize: 10, color: "#52525b", flexShrink: 0 }}>▶ right-click to open</span>
            )}
            {isEditing && (
              <span style={{ fontSize: 10, color: "#eab308", flexShrink: 0 }}>editing</span>
            )}
          </div>
          {/* iframe — interactive */}
          <iframe
            src={embedUrl}
            width={w}
            height={h - headerH}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ border: "none", display: "block" }}
            title={title}
          />
        </div>
      </>
    );
  }

  // ── Standard link card — no navigation on click ───────────────────────────
  const hostname = getHostname(nodeData.url);
  const faviconUrl = getFaviconUrl(nodeData.url);
  const shortUrl = nodeData.url.length > 52 ? nodeData.url.slice(0, 49) + "…" : nodeData.url;

  return (
    <>
      <Handle id="top"    type="source" position={Position.Top} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="left"   type="source" position={Position.Left} />
      <Handle id="right"  type="source" position={Position.Right} />
      <div
        style={{
          background: "#18181b",
          border: `1.5px solid ${isEditing ? "#eab308" : selected ? "#6366f1" : "#27272a"}`,
          borderRadius: 12,
          padding: "10px 14px",
          boxShadow: isEditing
            ? "0 0 0 2px #eab30833"
            : selected
            ? "0 0 0 2px #6366f133"
            : "0 4px 24px #00000066",
          minWidth: 220,
          maxWidth: 320,
          cursor: "default",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={faviconUrl}
            width={16} height={16} alt=""
            style={{ borderRadius: 2, flexShrink: 0 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <input
            value={title}
            onChange={(e) => {
              const v = e.target.value;
              setTitle(v);
              nodeData.title = v;
            }}
            placeholder="Title..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              fontWeight: 600,
              color: "#e4e4e7",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              pointerEvents: isEditing ? "auto" : "none",
              userSelect: isEditing ? "auto" : "none",
              cursor: isEditing ? "text" : "default",
              minWidth: 0,
              width: "100%",
            }}
            onClick={(e) => { if (isEditing) e.stopPropagation(); }}
            onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
          />
        </div>
        <div style={{ fontSize: 11, color: "#52525b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {shortUrl}
        </div>
        <div style={{ fontSize: 10, color: isEditing ? "#eab308" : "#3f3f46", marginTop: 6 }}>
          {isEditing ? "Editing title — press Esc or click away to save" : "Right-click to open"}
        </div>
      </div>
    </>
  );
}
