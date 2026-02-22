"use client";

import { useState, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

export type CounterData = {
  label?: string;
  count?: number;
  step?: number;
};

export function CounterNode({ id, data, selected }: NodeProps) {
  const nodeData = data as CounterData;
  const [label, setLabel] = useState(nodeData.label ?? "Counter");
  const [count, setCount] = useState(nodeData.count ?? 0);
  const [step, setStep] = useState(nodeData.step ?? 1);
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  const increment = useCallback(() => {
    setCount((c) => { const n = c + step; nodeData.count = n; return n; });
  }, [step, nodeData]);

  const decrement = useCallback(() => {
    setCount((c) => { const n = c - step; nodeData.count = n; return n; });
  }, [step, nodeData]);

  return (
    <>
      <NodeResizer
        minWidth={180}
        minHeight={140}
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
          minWidth: 180,
          minHeight: 140,
        }}
      >
        {/* Header */}
        <div style={{ background: "#1c1c20", padding: "8px 12px", borderBottom: "1px solid #27272a", flexShrink: 0 }}>
          <input
            value={label}
            onChange={(e) => { setLabel(e.target.value); nodeData.label = e.target.value; }}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              fontWeight: 600,
              color: "#e4e4e7",
              textAlign: "center",
              pointerEvents: isEditing ? "auto" : "none",
              userSelect: isEditing ? "auto" : "none",
            }}
          />
        </div>

        {/* Counter body */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 16px" }}>
          {/* Count display + controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={decrement}
              style={{
                background: "#27272a",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                color: "#e4e4e7",
                cursor: "pointer",
                fontSize: 20,
                fontWeight: 700,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              −
            </button>

            <span
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: "#e4e4e7",
                minWidth: 60,
                textAlign: "center",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {count}
            </span>

            <button
              onClick={increment}
              style={{
                background: "#6366f1",
                border: "1px solid #6366f1",
                borderRadius: 8,
                color: "#fff",
                cursor: "pointer",
                fontSize: 20,
                fontWeight: 700,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              +
            </button>
          </div>

          {/* Step control */}
          {isEditing && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#71717a" }}>Step:</span>
              <input
                type="number"
                value={step}
                min={1}
                onChange={(e) => { const s = Math.max(1, parseInt(e.target.value) || 1); setStep(s); nodeData.step = s; }}
                style={{
                  width: 48,
                  background: "#27272a",
                  border: "1px solid #3f3f46",
                  borderRadius: 5,
                  outline: "none",
                  padding: "2px 6px",
                  fontSize: 12,
                  color: "#e4e4e7",
                  textAlign: "center",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
