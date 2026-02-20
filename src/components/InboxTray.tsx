"use client";

import { useEffect, useState, useRef } from "react";

export type InboxItem = {
  id: string;
  content: string;
  source: string;
  created_at: string;
};

interface InboxTrayProps {
  onDragStart: (item: InboxItem) => void;
}

export function InboxTray({ onDragStart }: InboxTrayProps) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/inbox");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchItems();
    intervalRef.current = setInterval(fetchItems, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Auto-open tray when new items arrive
  useEffect(() => {
    if (items.length > 0) setOpen(true);
    if (items.length === 0) setOpen(false);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Tab */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "#eab308",
          color: "#000",
          fontWeight: 700,
          fontSize: 13,
          padding: "4px 16px",
          borderRadius: "0 0 10px 10px",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          userSelect: "none",
        }}
      >
        📥 Inbox
        <span
          style={{
            background: "#000",
            color: "#eab308",
            borderRadius: "50%",
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {items.length}
        </span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* Tray */}
      {open && (
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #eab308",
            borderRadius: "0 0 12px 12px",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minWidth: 280,
            maxWidth: 360,
            maxHeight: 320,
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <p style={{ color: "#888", fontSize: 11, margin: 0, textAlign: "center" }}>
            Drag items onto the canvas ↓
          </p>
          {items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/brainflux-inbox", JSON.stringify(item));
                e.dataTransfer.effectAllowed = "copy";
                onDragStart(item);
              }}
              style={{
                background: "#2a2a2a",
                border: "1px solid #333",
                borderLeft: "3px solid #eab308",
                borderRadius: 8,
                padding: "8px 10px",
                cursor: "grab",
                color: "#e5e7eb",
                fontSize: 13,
                lineHeight: 1.4,
                userSelect: "none",
              }}
            >
              {item.content}
              <div style={{ color: "#555", fontSize: 10, marginTop: 4 }}>
                via {item.source} · {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Hook to refresh inbox from outside (e.g. after consuming an item)
let _refreshInbox: (() => void) | null = null;
export function useInboxRefresh() {
  return _refreshInbox;
}
export function registerInboxRefresh(fn: () => void) {
  _refreshInbox = fn;
}
