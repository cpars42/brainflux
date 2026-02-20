"use client";

import { useState, useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export function ClockNode({ selected }: NodeProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = now.getHours().toString().padStart(2, "0");
  const mins = now.getMinutes().toString().padStart(2, "0");
  const secs = now.getSeconds().toString().padStart(2, "0");
  const day = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <div
        style={{
          background: "#18181b",
          border: `1.5px solid ${selected ? "#6366f1" : "#27272a"}`,
          borderRadius: 16,
          padding: "20px 28px",
          textAlign: "center",
          boxShadow: "0 4px 24px #00000066",
          minWidth: 200,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
          <span style={{ fontSize: 48, fontWeight: 200, letterSpacing: "-2px", color: "#f4f4f5", fontVariantNumeric: "tabular-nums" }}>
            {hours}:{mins}
          </span>
          <span style={{ fontSize: 24, fontWeight: 200, color: "#71717a", marginLeft: 4, fontVariantNumeric: "tabular-nums" }}>
            {secs}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#52525b", marginTop: 4, letterSpacing: "0.05em" }}>
          {day}
        </div>
      </div>
    </>
  );
}
