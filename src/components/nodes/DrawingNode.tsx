"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useEditingNodeId } from "../LifeCanvas";

export type DrawingData = {
  imageData?: string;
};

export function DrawingNode({ id, data, selected }: NodeProps) {
  const nodeData = data as DrawingData;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#e4e4e7");
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const editingNodeId = useEditingNodeId();
  const isEditing = editingNodeId === id;

  // Restore saved image on mount
  useEffect(() => {
    if (!nodeData.imageData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = nodeData.imageData;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    nodeData.imageData = canvasRef.current.toDataURL("image/png");
  }, [nodeData]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isEditing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const pos = getPos(e);
    lastPos.current = pos;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, tool === "eraser" ? 8 : 1, 0, Math.PI * 2);
    ctx.fillStyle = tool === "eraser" ? "#18181b" : color;
    ctx.fill();
  }, [isEditing, tool, color]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isEditing || !isDrawing || !lastPos.current) return;
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#18181b" : color;
    ctx.lineWidth = tool === "eraser" ? 16 : 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  }, [isEditing, isDrawing, tool, color]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    setIsDrawing(false);
    lastPos.current = null;
    saveCanvas();
  }, [saveCanvas]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodeData.imageData = "";
  }, [nodeData]);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "#6366f1" : "#27272a",
    border: "none",
    borderRadius: 5,
    color: active ? "#fff" : "#a1a1aa",
    cursor: "pointer",
    fontSize: 13,
    padding: "3px 7px",
  });

  return (
    <>
      <NodeResizer
        minWidth={240}
        minHeight={200}
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
          minHeight: 200,
        }}
      >
        {/* Toolbar */}
        <div style={{ background: "#1c1c20", padding: "6px 10px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 13, marginRight: 2 }}>✏️</span>
          <button style={btnStyle(tool === "pen")} onClick={() => setTool("pen")} disabled={!isEditing} title="Pen">🖊</button>
          <button style={btnStyle(tool === "eraser")} onClick={() => setTool("eraser")} disabled={!isEditing} title="Eraser">⌫</button>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={!isEditing}
            style={{ width: 28, height: 24, border: "none", background: "none", cursor: isEditing ? "pointer" : "default", padding: 0, borderRadius: 4 }}
            title="Color"
          />
          <button
            style={{ ...btnStyle(false), marginLeft: "auto", color: "#f87171" }}
            onClick={clearCanvas}
            disabled={!isEditing}
            title="Clear"
          >
            🗑
          </button>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              background: "#18181b",
              cursor: isEditing ? (tool === "eraser" ? "cell" : "crosshair") : "default",
              pointerEvents: isEditing ? "auto" : "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
        </div>
      </div>
    </>
  );
}
