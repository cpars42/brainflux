"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useTriggerSave } from "../LifeCanvas";

export type TimerData = {
  label?: string;
  durationMinutes?: number;
  endTime?: number | null;        // absolute ms timestamp when timer ends (set when running)
  remainingSeconds?: number | null; // saved remaining when paused
};

export function TimerNode({ data, selected }: NodeProps) {
  const nodeData = data as TimerData;
  const triggerSave = useTriggerSave();

  const totalSecs = (nodeData.durationMinutes ?? 25) * 60;

  // Derive initial state from persisted data
  const getInitialRemaining = () => {
    if (nodeData.endTime) {
      const r = Math.ceil((nodeData.endTime - Date.now()) / 1000);
      return r > 0 ? r : 0;
    }
    if (nodeData.remainingSeconds != null) return nodeData.remainingSeconds;
    return totalSecs;
  };
  const isInitiallyRunning = () => {
    return !!nodeData.endTime && nodeData.endTime > Date.now();
  };

  const [remaining, setRemaining] = useState(getInitialRemaining);
  const [running, setRunning] = useState(isInitiallyRunning);
  const [label, setLabel] = useState(nodeData.label ?? "");
  const [settingTime, setSettingTime] = useState(false);
  const [inputMins, setInputMins] = useState(String(nodeData.durationMinutes ?? 25));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick from endTime for accuracy
  useEffect(() => {
    if (running && nodeData.endTime) {
      intervalRef.current = setInterval(() => {
        const r = Math.ceil((nodeData.endTime! - Date.now()) / 1000);
        if (r <= 0) {
          setRemaining(0);
          setRunning(false);
          nodeData.endTime = null;
          nodeData.remainingSeconds = 0;
          triggerSave();
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setRemaining(r);
        }
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, nodeData, triggerSave]);

  const start = useCallback(() => {
    const endTime = Date.now() + remaining * 1000;
    nodeData.endTime = endTime;
    nodeData.remainingSeconds = null;
    setRunning(true);
    triggerSave();
  }, [remaining, nodeData, triggerSave]);

  const pause = useCallback(() => {
    nodeData.endTime = null;
    nodeData.remainingSeconds = remaining;
    setRunning(false);
    triggerSave();
  }, [remaining, nodeData, triggerSave]);

  const reset = useCallback(() => {
    nodeData.endTime = null;
    nodeData.remainingSeconds = null;
    const secs = (nodeData.durationMinutes ?? 25) * 60;
    setRemaining(secs);
    setRunning(false);
    triggerSave();
  }, [nodeData, triggerSave]);

  const applyTime = () => {
    const mins = Math.max(1, parseInt(inputMins) || 25);
    const secs = mins * 60;
    nodeData.durationMinutes = mins;
    nodeData.endTime = null;
    nodeData.remainingSeconds = null;
    setRemaining(secs);
    setRunning(false);
    setSettingTime(false);
    setInputMins(String(mins));
    triggerSave();
  };

  const progress = totalSecs > 0 ? (totalSecs - remaining) / totalSecs : 0;
  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");
  const done = remaining === 0;

  return (
    <>
      <Handle id="top"    type="source" position={Position.Top} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="left"   type="source" position={Position.Left} />
      <Handle id="right"  type="source" position={Position.Right} />
      <div
        style={{
          background: "#18181b",
          border: `1.5px solid ${selected ? "#6366f1" : done ? "#ef4444" : "#27272a"}`,
          borderRadius: 16,
          padding: "18px 22px",
          textAlign: "center",
          boxShadow: done ? "0 0 20px #ef444433" : "0 4px 24px #00000066",
          minWidth: 180,
          transition: "border-color 0.3s, box-shadow 0.3s",
        }}
      >
        <input
          value={label}
          onChange={(e) => { setLabel(e.target.value); nodeData.label = e.target.value; }}
          placeholder="Timer label..."
          className="w-full bg-transparent text-xs text-center outline-none placeholder-zinc-700 mb-3"
          style={{ color: "#71717a" }}
        />

        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={48} cy={48} r={40} fill="none" stroke="#27272a" strokeWidth={6} />
            <circle
              cx={48} cy={48} r={40} fill="none"
              stroke={done ? "#ef4444" : running ? "#6366f1" : "#3f3f46"}
              strokeWidth={6}
              strokeDasharray={251.2}
              strokeDashoffset={251.2 * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
            />
          </svg>
          <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 22, fontWeight: 300, color: done ? "#ef4444" : "#f4f4f5", fontVariantNumeric: "tabular-nums" }}>
              {m}:{s}
            </span>
            {done && <span style={{ fontSize: 10, color: "#ef4444" }}>done</span>}
          </div>
        </div>

        {settingTime ? (
          <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center", justifyContent: "center" }}>
            <input
              type="number" value={inputMins}
              onChange={(e) => setInputMins(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyTime()}
              className="w-14 text-center bg-zinc-800 rounded text-sm outline-none border border-zinc-700"
              style={{ color: "#f4f4f5", padding: "2px 4px" }}
              autoFocus
            />
            <span style={{ color: "#52525b", fontSize: 12 }}>min</span>
            <button onClick={applyTime} style={{ fontSize: 12, color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>Set</button>
          </div>
        ) : (
          <button
            onClick={() => setSettingTime(true)}
            style={{ fontSize: 10, color: "#3f3f46", background: "none", border: "none", cursor: "pointer", marginTop: 8, display: "block", margin: "8px auto 0" }}
          >
            {nodeData.durationMinutes ?? 25} min ✎
          </button>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
          <button
            onClick={running ? pause : start}
            disabled={done}
            style={{
              background: running ? "#27272a" : done ? "#3f3f46" : "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "5px 16px",
              fontSize: 13,
              cursor: done ? "default" : "pointer",
              fontWeight: 500,
            }}
          >
            {running ? "Pause" : done ? "Done" : "Start"}
          </button>
          <button
            onClick={reset}
            style={{ background: "none", color: "#52525b", border: "1px solid #27272a", borderRadius: 8, padding: "5px 12px", fontSize: 13, cursor: "pointer" }}
          >
            ↺
          </button>
        </div>
      </div>
    </>
  );
}
