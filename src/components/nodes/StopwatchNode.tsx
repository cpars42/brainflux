"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useTriggerSave } from "../LifeCanvas";

export type StopwatchData = {
  label?: string;
  startTime?: number | null;   // absolute ms timestamp when last started; null/absent = paused
  elapsedMs?: number;          // ms accumulated before current run (for pause/resume persistence)
};

function formatTime(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function StopwatchNode({ data, selected }: NodeProps) {
  const nodeData = data as StopwatchData;
  const triggerSave = useTriggerSave();

  const isRunning = () => !!nodeData.startTime && nodeData.startTime > 0;
  const getCurrentElapsed = () => {
    const base = nodeData.elapsedMs ?? 0;
    if (nodeData.startTime) {
      return base + Math.max(0, Date.now() - nodeData.startTime);
    }
    return base;
  };

  const [elapsed, setElapsed] = useState(getCurrentElapsed);
  const [running, setRunning] = useState(isRunning);
  const [label, setLabel] = useState(nodeData.label ?? "");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick every 100ms for smooth display
  useEffect(() => {
    if (running && nodeData.startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed((nodeData.elapsedMs ?? 0) + Math.max(0, Date.now() - nodeData.startTime!));
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, nodeData]);

  const start = useCallback(() => {
    const now = Date.now();
    nodeData.startTime = now;
    // elapsedMs stays as-is (accumulated before this run)
    setRunning(true);
    triggerSave();
  }, [nodeData, triggerSave]);

  const pause = useCallback(() => {
    const current = (nodeData.elapsedMs ?? 0) + (nodeData.startTime ? Math.max(0, Date.now() - nodeData.startTime) : 0);
    nodeData.elapsedMs = current;
    nodeData.startTime = null;
    setElapsed(current);
    setRunning(false);
    triggerSave();
  }, [nodeData, triggerSave]);

  const reset = useCallback(() => {
    nodeData.startTime = null;
    nodeData.elapsedMs = 0;
    setElapsed(0);
    setRunning(false);
    triggerSave();
  }, [nodeData, triggerSave]);

  // Seconds within current minute (0–59), used for the ring
  const secsInMinute = Math.floor((elapsed / 1000) % 60);
  const ringProgress = secsInMinute / 60;
  const CIRCUMFERENCE = 251.2;

  return (
    <>
      <Handle id="top"    type="source" position={Position.Top} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="left"   type="source" position={Position.Left} />
      <Handle id="right"  type="source" position={Position.Right} />
      <div
        style={{
          background: "#18181b",
          border: `1.5px solid ${selected ? "#6366f1" : "#27272a"}`,
          borderRadius: 16,
          padding: "18px 22px",
          textAlign: "center",
          boxShadow: "0 4px 24px #00000066",
          minWidth: 180,
          transition: "border-color 0.3s",
        }}
      >
        <input
          value={label}
          onChange={(e) => { setLabel(e.target.value); nodeData.label = e.target.value; }}
          placeholder="Stopwatch label..."
          className="w-full bg-transparent text-xs text-center outline-none placeholder-zinc-700 mb-3"
          style={{ color: "#71717a" }}
        />

        {/* Ring + time display */}
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={48} cy={48} r={40} fill="none" stroke="#27272a" strokeWidth={6} />
            <circle
              cx={48} cy={48} r={40} fill="none"
              stroke={running ? "#22d3ee" : "#3f3f46"}
              strokeWidth={6}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - ringProgress)}
              strokeLinecap="round"
              style={{ transition: running ? "stroke-dashoffset 0.1s linear, stroke 0.3s" : "stroke 0.3s" }}
            />
          </svg>
          <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{
              fontSize: elapsed >= 3600000 ? 16 : 22,
              fontWeight: 300,
              color: "#f4f4f5",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.5px",
            }}>
              {formatTime(elapsed)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
          <button
            onClick={running ? pause : start}
            style={{
              background: running ? "#27272a" : "#22d3ee22",
              color: running ? "#f4f4f5" : "#22d3ee",
              border: running ? "none" : "1px solid #22d3ee55",
              borderRadius: 8,
              padding: "5px 16px",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {running ? "Stop" : "Start"}
          </button>
          <button
            onClick={reset}
            style={{
              background: "none",
              color: "#52525b",
              border: "1px solid #27272a",
              borderRadius: 8,
              padding: "5px 12px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ↺
          </button>
        </div>
      </div>
    </>
  );
}
