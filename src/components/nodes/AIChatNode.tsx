"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";

export type AIChatData = {
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
};

export function AIChatNode({ data, selected }: NodeProps) {
  const nodeData = data as AIChatData;
  const [messages, setMessages] = useState(nodeData.messages ?? []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg = { role: "user" as const, content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    nodeData.messages = next;
    setLoading(true);

    try {
      const resp = await fetch("https://brainflux.loot42.com/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const assistantMsg = { role: "assistant" as const, content: json.reply ?? json.content ?? JSON.stringify(json) };
      const withReply = [...next, assistantMsg];
      setMessages(withReply);
      nodeData.messages = withReply;
    } catch {
      const errMsg = { role: "assistant" as const, content: "⚠️ AI unavailable — check your connection or the endpoint." };
      const withErr = [...next, errMsg];
      setMessages(withErr);
      nodeData.messages = withErr;
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, nodeData]);

  return (
    <>
      <NodeResizer
        minWidth={260}
        minHeight={240}
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
          border: `1.5px solid ${selected ? "#6366f1" : "#27272a"}`,
          boxShadow: selected ? "0 0 0 2px #6366f133" : "0 4px 24px #00000066",
          minWidth: 260,
          minHeight: 240,
        }}
      >
        {/* Header */}
        <div style={{ background: "#1c1c20", padding: "8px 12px", borderBottom: "1px solid #27272a", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>🤖</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>AI Chat</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#52525b" }}>Gemini Flash Lite</span>
        </div>

        {/* Message history */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: "auto", padding: "10px 10px 4px", display: "flex", flexDirection: "column", gap: 6 }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "#3f3f46", fontSize: 12, marginTop: 16 }}>
              Start a conversation...
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: msg.role === "user" ? "#6366f1" : "#27272a",
                borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding: "6px 10px",
                fontSize: 12,
                color: msg.role === "user" ? "#fff" : "#a1a1aa",
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div style={{
              alignSelf: "flex-start",
              background: "#27272a",
              borderRadius: "12px 12px 12px 2px",
              padding: "6px 12px",
              fontSize: 16,
              color: "#71717a",
              letterSpacing: 2,
            }}>
              ...
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ padding: "8px 10px", borderTop: "1px solid #27272a", display: "flex", gap: 6, flexShrink: 0 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything..."
            style={{
              flex: 1,
              background: "#27272a",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              outline: "none",
              padding: "5px 10px",
              fontSize: 12,
              color: "#e4e4e7",
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? "#27272a" : "#6366f1",
              border: "none",
              borderRadius: 8,
              color: loading || !input.trim() ? "#52525b" : "#fff",
              cursor: loading || !input.trim() ? "default" : "pointer",
              fontSize: 14,
              padding: "5px 10px",
              transition: "background 0.15s",
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
