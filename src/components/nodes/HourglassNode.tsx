"use client";

import { useState, useEffect, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type HourglassData = {
  durationMinutes?: number;
};

const COLS = 16;
const ROWS = 22;
const PIXEL = 6;
const GAP = 1;

function buildMask(): boolean[][] {
  const mask: boolean[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: boolean[] = [];
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

const ALL_PIXELS: [number, number][] = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (MASK[r][c]) ALL_PIXELS.push([r, c]);
  }
}

const CENTER = (COLS - 1) / 2; // 7.5
const CONE_SLOPE = 1.3;

// Top chamber: inverted funnel — neck-center drains FIRST, spreading outward+upward
// (mirrors the bottom cone). Low sort key = kept longest in slice = last to drain.
// key = r - abs(c-center)*slope → neck-center has high key (drained first),
// top-edges have low key (kept longest)
const TOP_PIXELS = ALL_PIXELS
  .filter(([r]) => r < ROWS / 2)
  .sort(([r1, c1], [r2, c2]) => {
    const k1 = r1 - Math.abs(c1 - CENTER) * CONE_SLOPE;
    const k2 = r2 - Math.abs(c2 - CENTER) * CONE_SLOPE;
    return k1 - k2; // ascending: low k (top edges) kept longest, high k (neck center) drained first
  });

// Bottom chamber: cone/mound — center column rises first, spreads outward like real sand
// key = (ROWS-1-r) + abs(c-center)*slope → bottom-center fills first
const BOTTOM_PIXELS = ALL_PIXELS
  .filter(([r]) => r >= ROWS / 2)
  .sort(([r1, c1], [r2, c2]) => {
    const k1 = (ROWS - 1 - r1) + Math.abs(c1 - CENTER) * CONE_SLOPE;
    const k2 = (ROWS - 1 - r2) + Math.abs(c2 - CENTER) * CONE_SLOPE;
    return k1 - k2;
  });

// Neck position for falling grain animation
const NECK_Y = Math.floor(ROWS / 2 - 1) * (PIXEL + GAP);
const GRAIN_X = Math.floor(COLS / 2) * (PIXEL + GAP) - PIXEL / 2;

function FallingGrains({ active }: { active: boolean }) {
  if (!active) return null;
  // Fall from neck all the way to the bottom of the hourglass
  const dropDist = (ROWS - 1 - Math.floor(ROWS / 2 - 1)) * (PIXEL + GAP);
  return (
    <>
      <style>{`
        @keyframes grainFall {
          0%   { top: ${NECK_Y - 2}px; opacity: 1; }
          100% { top: ${NECK_Y + dropDist}px; opacity: 0; }
        }
      `}</style>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: GRAIN_X + (i - 1) * 2,
            width: PIXEL - 1,
            height: PIXEL - 1,
            borderRadius: 1,
            background: "#fbbf24",
            boxShadow: "0 0 4px #fbbf2488",
            animation: `grainFall 0.45s ease-in ${i * 150}ms infinite`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

function HourglassDisplay({ progress, running }: { progress: number; running: boolean }) {
  const topFilled = Math.round(TOP_PIXELS.length * (1 - progress));
  const bottomFilled = Math.round(BOTTOM_PIXELS.length * progress);

  const sandSet = new Set<string>();
  TOP_PIXELS.slice(0, topFilled).forEach(([r, c]) => sandSet.add(`${r},${c}`));
  BOTTOM_PIXELS.slice(0, bottomFilled).forEach(([r, c]) => sandSet.add(`${r},${c}`));

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
                transition: "background 0.15s",
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
          boxShadow: "0 0 8px #fbbf24",
        }} />
      )}
      {/* Continuously falling grains when running */}
      <FallingGrains active={running && progress < 1} />
    </div>
  );
}

export function HourglassNode({ data, selected }: NodeProps) {
  const nodeData = data as HourglassData;
  const durationMins = nodeData.durationMinutes ?? 10;

  // Track time in ms to avoid float drift; 200ms ticks = 5fps updates
  const [totalMs, setTotalMs] = useState(durationMins * 60 * 1000);
  const [remainingMs, setRemainingMs] = useState(durationMins * 60 * 1000);
  const [running, setRunning] = useState(false);
  const [settingTime, setSettingTime] = useState(false);
  const [inputMins, setInputMins] = useState(String(durationMins));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TICK = 200; // ms per tick

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemainingMs((r) => {
          if (r <= TICK) { setRunning(false); return 0; }
          return r - TICK;
        });
      }, TICK);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const progress = totalMs > 0 ? (totalMs - remainingMs) / totalMs : 0;
  const done = remainingMs === 0;
  const totalSecs = Math.ceil(remainingMs / 1000);
  const m = Math.floor(totalSecs / 60).toString().padStart(2, "0");
  const s = (totalSecs % 60).toString().padStart(2, "0");

  const applyTime = () => {
    const mins = Math.max(1, parseInt(inputMins) || 10);
    const ms = mins * 60 * 1000;
    setTotalMs(ms);
    setRemainingMs(ms);
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
        <HourglassDisplay progress={progress} running={running} />

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
            onClick={() => { setRunning(false); setRemainingMs(totalMs); }}
            style={{ background: "none", color: "#52525b", border: "1px solid #27272a", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
          >
            ↺
          </button>
        </div>
      </div>
    </>
  );
}
