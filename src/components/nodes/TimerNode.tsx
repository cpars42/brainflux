"use client";

import { useState, useEffect, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type TimerData = {
  label?: string;
  durationMinutes?: number;
};

export function TimerNode({ data, selected }: NodeProps) {
  const nodeData = data as TimerData;
  const [totalSeconds, setTotalSeconds] = useState((nodeData.durationMinutes ?? 25) * 60);
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState(nodeData.label ?? "");
  const [settingTime, setSettingTime] = useState(false);
  const [inputMins, setInputMins] = useState(String(nodeData.durationMinutes ?? 25));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            setRunning(false);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const reset = () => {
    setRunning(false);
    setRemaining(totalSeconds);
  };

  const applyTime = () => {
    const mins = Math.max(1, parseInt(inputMins) || 25);
    const secs = mins * 60;
    setTotalSeconds(secs);
    setRemaining(secs);
    nodeData.durationMinutes = mins;
    setSettingTime(false);
    setRunning(false);
  };

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");
  const done = remaining === 0;

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
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
        {/* Label */}
        <input
          value={label}
          onChange={(e) => { setLabel(e.target.value); nodeData.label = e.target.value; }}
          placeholder="Timer label..."
          className="w-full bg-transparent text-xs text-center outline-none placeholder-zinc-700 mb-3"
          style={{ color: "#71717a" }}
        />

        {/* Progress ring */}
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

        {/* Set time */}
        {settingTime ? (
          <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center", justifyContent: "center" }}>
            <input
              type="number"
              value={inputMins}
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

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              background: running ? "#27272a" : "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "5px 16px",
              fontSize: 13,
              cursor: "pointer",
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
