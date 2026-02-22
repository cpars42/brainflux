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
  const cs = Math.floor((ms % 1000) / 10); // centiseconds (0–99)
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const csStr = cs.toString().padStart(2, "0");
  const sStr = s.toString().padStart(2, "0");
  const mStr = m.toString().padStart(2, "0");
  if (h > 0) {
    return {
      main: `${h}:${mStr}:${sStr}`,
      cs: csStr,
    };
  }
  return {
    main: `${mStr}:${sStr}`,
    cs: csStr,
  };
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

  // Tick every 50ms for smooth centisecond display
  useEffect(() => {
    if (running && nodeData.startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed((nodeData.elapsedMs ?? 0) + Math.max(0, Date.now() - nodeData.startTime!));
      }, 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, nodeData]);

  const start = useCallback(() => {
    nodeData.startTime = Date.now();
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

  const { main, cs } = formatTime(elapsed);

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
          padding: "18px 24px",
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
          className="w-full bg-transparent text-xs text-center outline-none placeholder-zinc-700 mb-4"
          style={{ color: "#71717a" }}
        />

        {/* Time display — no ring, just clean digits */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2, marginBottom: 16 }}>
          <span style={{
            fontSize: 36,
            fontWeight: 200,
            color: running ? "#22d3ee" : "#f4f4f5",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-1px",
            lineHeight: 1,
            transition: "color 0.3s",
          }}>
            {main}
          </span>
          <span style={{
            fontSize: 20,
            fontWeight: 200,
            color: running ? "#22d3ee99" : "#71717a",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.5px",
            lineHeight: 1,
            transition: "color 0.3s",
          }}>
            .{cs}
          </span>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
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
