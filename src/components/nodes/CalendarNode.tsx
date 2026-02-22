"use client";

import { useState, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

export type CalendarData = {
  notes?: Record<string, string>;
  selectedDate?: string;
};

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarNode({ id, data, selected }: NodeProps) {
  const nodeData = data as CalendarData;
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(nodeData.selectedDate ?? "");
  const [notes, setNotes] = useState<Record<string, string>>(nodeData.notes ?? {});
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  // Monday-based: Monday=0 ... Sunday=6
  let startDow = firstDay.getDay() - 1; // getDay: 0=Sun, 1=Mon...
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const updateNote = useCallback((key: string, text: string) => {
    setNotes((prev) => {
      const next = { ...prev, [key]: text };
      nodeData.notes = next;
      return next;
    });
  }, [nodeData]);

  const selectDay = useCallback((d: number) => {
    const key = toKey(year, month, d);
    setSelectedDate(key);
    nodeData.selectedDate = key;
  }, [year, month, nodeData]);

  return (
    <>
      <NodeResizer
        minWidth={240}
        minHeight={220}
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
          minHeight: 220,
        }}
      >
        {/* Month navigation header */}
        <div style={{ background: "#1c1c20", padding: "7px 10px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>‹</button>
          <span style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>›</button>
        </div>

        {/* Calendar grid */}
        <div style={{ padding: "8px 8px 4px", flexShrink: 0 }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {DAYS.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#52525b", fontWeight: 600 }}>{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={`e-${i}`} />;
              const key = toKey(year, month, d);
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              const hasNote = !!notes[key];
              return (
                <button
                  key={key}
                  onClick={() => selectDay(d)}
                  style={{
                    background: isToday ? "#6366f1" : isSelected ? "#27272a" : "none",
                    border: isSelected && !isToday ? "1px solid #6366f1" : "1px solid transparent",
                    borderRadius: 5,
                    color: isToday ? "#fff" : "#a1a1aa",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: isToday ? 700 : 400,
                    padding: "3px 0",
                    position: "relative",
                    textAlign: "center",
                  }}
                >
                  {d}
                  {hasNote && (
                    <span style={{
                      position: "absolute",
                      bottom: 1,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 3,
                      height: 3,
                      borderRadius: "50%",
                      background: isToday ? "#fff" : "#6366f1",
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note for selected date */}
        {selectedDate && (
          <div style={{ flex: 1, padding: "6px 10px", display: "flex", flexDirection: "column", gap: 4, minHeight: 0 }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 600 }}>{selectedDate}</div>
            <textarea
              value={notes[selectedDate] ?? ""}
              onChange={(e) => updateNote(selectedDate, e.target.value)}
              placeholder="Add a note..."
              style={{
                flex: 1,
                background: "#27272a",
                border: "1px solid #3f3f46",
                borderRadius: 6,
                outline: "none",
                resize: "none",
                padding: "6px 8px",
                fontSize: 12,
                color: "#a1a1aa",
                pointerEvents: isEditing ? "auto" : "none",
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
