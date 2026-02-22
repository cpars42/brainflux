"use client";

import { useEffect, useRef } from "react";

const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const FONT_SIZE = 16;

interface Column {
  x: number;
  y: number;
  speed: number;
}

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let columns: Column[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function createColumns() {
      const count = Math.ceil(canvas!.width / FONT_SIZE);
      columns = [];
      for (let i = 0; i < count; i++) {
        columns.push({
          x: i * FONT_SIZE,
          y: Math.random() * canvas!.height,
          speed: 0.5 + Math.random() * 1.5,
        });
      }
      // Fill canvas black initially
      ctx!.fillStyle = "#000";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
    }

    function draw() {
      // Semi-transparent black overlay for fade trail effect
      ctx!.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      ctx!.font = `${FONT_SIZE}px monospace`;

      for (const col of columns) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];

        // Head character: bright white-green
        ctx!.fillStyle = "#afffaf";
        ctx!.fillText(char, col.x, col.y);

        // Trailing character slightly above: classic green
        const trailChar = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx!.fillStyle = "rgba(0, 255, 0, 0.6)";
        ctx!.fillText(trailChar, col.x, col.y - FONT_SIZE);

        col.y += col.speed * FONT_SIZE;

        // Reset column to top when it goes past the bottom (with some randomness)
        if (col.y > canvas!.height && Math.random() > 0.975) {
          col.y = 0;
          col.speed = 0.5 + Math.random() * 1.5;
        }
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    createColumns();
    draw();

    const onResize = () => {
      resize();
      createColumns();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
