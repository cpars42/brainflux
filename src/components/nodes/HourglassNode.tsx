"use client";

import { useState, useEffect, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type HourglassData = {
  durationMinutes?: number;
};

// 16-wide hourglass mask (1 = inside hourglass, 0 = outside)
// Top chamber rows 0-9, neck row 10-11, bottom chamber rows 12-21
const COLS = 16;
const ROWS = 22;

function buildMask(): boolean[][] {
  const mask: boolean[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: boolean[] = [];
    // Top half narrows inward, bottom half widens outward
    const half = ROWS / 2;
    let margin: number;
    if (r < half) {
      margin = Math.floor((r / half) * (COLS / 2 - 1));
    } else {
      margin = Math.floor(((ROWS - 1 - r) / half) * (COLS / 2 - 1));
    }
    for (let c = 0; c < COLS; c++) {
      row.push(c >= margin && c < COLS - margin);
    }
    mask.push(row);
  }
  return mask;
}

const MASK = buildMask();

// Collect all pixel positions inside the hourglass, split by top/bottom
const ALL_PIXELS: [number, number][] = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (MASK[r][c]) ALL_PIXELS.push([r, c]);
  }
}

const TOP_PIXELS = ALL_PIXELS.filter(([r]) => r < ROWS / 2).reverse(); // bottom of top first (drain first)
const BOTTOM_PIXELS = ALL_PIXELS.filter(([r]) => r >= ROWS / 2); // top of bottom first (fill first)

function HourglassDisplay({ progress }: { progress: number }) {
  // progress 0 = full top, empty bottom; 1 = empty top, full bottom
  const topFilled = Math.round(TOP_PIXELS.length * (1 - progress));
  const bottomFilled = Math.round(BOTTOM_PIXELS.length * progress);

  const sandSet = new Set<string>();
  TOP_PIXELS.slice(0, topFilled).forEach(([r, c]) => sandSet.add(`${r},${c}`));
  BOTTOM_PIXELS.slice(0, bottomFilled).forEach(([r, c]) => sandSet.add(`${r},${c}`));

  const PIXEL = 6;
  const GAP = 1;

  return (
    <div style={{ position: "relative", width: COLS * (PIXEL + GAP), height: ROWS * (PIXEL + GAP) }}>
      {Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => {
          if (!MASK[r][c]) return null;
          const hasSand = sandSet.has(`${r},${c}`);
          return (
            <div
              key={`${r}-${c}`}
              style={{
                position: "absolute",
                left: c * (PIXEL + GAP),
                top: r * (PIXEL + GAP),
                width: PIXEL,
                height: PIXEL,
                borderRadius: 1,
                background: hasSand
                  ? r < ROWS / 2 ? "#f59e0b" : "#fbbf24"
                  : "#1f1f23",
                transition: "background 0.3s",
              }}
            />
          );
        })
      )}
      {/* Neck glow when draining */}
      {progress > 0 && progress < 1 && (
        <div style={{
          position: "absolute",
          left: (COLS / 2 - 1) * (PIXEL + GAP),
          top: (ROWS / 2 - 1) * (PIXEL + GAP),
          width: (PIXEL + GAP) * 2,
          height: (PIXEL + GAP) * 2,
          background: "#fbbf24",
          borderRadius: 1,
          boxShadow: "0 0 6px #fbbf24",
        }} />
      )}
    </div>
  );
}

export function HourglassNode({ data, selected }: NodeProps) {
  const nodeData = data as HourglassData;
  const [totalSecs, setTotalSecs] = useState((nodeData.durationMinutes ?? 10) * 60);
  const [remaining, setRemaining] = useState(totalSecs);
  const [running, setRunning] = useState(false);
  const [settingTime, setSettingTime] = useState(false);
  const [inputMins, setInputMins] = useState(String(nodeData.durationMinutes ?? 10));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { setRunning(false); return 0; }
          return r - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const progress = totalSecs > 0 ? (totalSecs - remaining) / totalSecs : 0;
  const done = remaining === 0;
  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");

  const applyTime = () => {
    const mins = Math.max(1, parseInt(inputMins) || 10);
    const secs = mins * 60;
    setTotalSecs(secs);
    setRemaining(secs);
    nodeData.durationMinutes = mins;
    setSettingTime(false);
    setRunning(false);
  };

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <div
        style={{
          background: "#18181b",
          border: `1.5px solid ${selected ? "#6366f1" : done ? "#f59e0b" : "#27272a"}`,
          borderRadius: 16,
          padding: "16px 20px",
          textAlign: "center",
          boxShadow: done ? "0 0 24px #f59e0b44" : "0 4px 24px #00000066",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          transition: "border-color 0.3s, box-shadow 0.3s",
        }}
      >
        <HourglassDisplay progress={progress} />

        <div style={{ fontSize: 18, fontWeight: 300, color: done ? "#f59e0b" : "#a1a1aa", fontVariantNumeric: "tabular-nums" }}>
          {m}:{s}
        </div>

        {settingTime ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="number"
              value={inputMins}
              onChange={(e) => setInputMins(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyTime()}
              className="w-12 text-center text-sm outline-none rounded"
              style={{ background: "#27272a", color: "#f4f4f5", padding: "2px 4px", border: "1px solid #3f3f46" }}
              autoFocus
            />
            <span style={{ color: "#52525b", fontSize: 12 }}>min</span>
            <button onClick={applyTime} style={{ fontSize: 12, color: "#f59e0b", background: "none", border: "none", cursor: "pointer" }}>Set</button>
          </div>
        ) : (
          <button
            onClick={() => setSettingTime(true)}
            style={{ fontSize: 11, color: "#3f3f46", background: "none", border: "none", cursor: "pointer" }}
          >
            {nodeData.durationMinutes ?? 10} min ✎
          </button>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              background: running ? "#27272a" : "#f59e0b",
              color: running ? "#a1a1aa" : "#1a1a1a",
              border: "none",
              borderRadius: 8,
              padding: "4px 14px",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {running ? "Pause" : done ? "Done ✓" : "Start"}
          </button>
          <button
            onClick={() => { setRunning(false); setRemaining(totalSecs); }}
            style={{ background: "none", color: "#52525b", border: "1px solid #27272a", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
          >
            ↺
          </button>
        </div>
      </div>
    </>
  );
}
