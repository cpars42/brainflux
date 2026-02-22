"use client";

import { useEffect, useRef } from "react";

const CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const FONT_SIZE = 16;
const FADE_RATE = 0.07; // per-frame brightness decay — higher = shorter, snappier trails

interface Column {
  x: number;
  y: number;     // pixel y of the head character
  speed: number; // pixels per frame
}

interface Cell {
  char: string;
  brightness: number; // 0–1
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
    let grid: Cell[][] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function createColumns() {
      const colCount = Math.ceil(canvas!.width / FONT_SIZE);
      const rowCount = Math.ceil(canvas!.height / FONT_SIZE) + 1;
      columns = [];
      grid = [];
      for (let i = 0; i < colCount; i++) {
        columns.push({
          x: i * FONT_SIZE,
          y: Math.random() * canvas!.height,
          speed: 3 + Math.random() * 4, // classic Matrix movie speed
        });
        grid[i] = Array.from({ length: rowCount }, () => ({
          char: CHARS[Math.floor(Math.random() * CHARS.length)],
          brightness: 0,
        }));
      }
    }

    function draw() {
      // Clear to fully transparent — app background (#1c1c1f) shows through
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.font = `${FONT_SIZE}px monospace`;

      const rowCount = grid[0]?.length ?? 0;

      for (let ci = 0; ci < columns.length; ci++) {
        const col = columns[ci];
        const headRow = Math.floor(col.y / FONT_SIZE);

        // Light up head cell with a fresh random character
        if (headRow >= 0 && headRow < rowCount) {
          grid[ci][headRow].char = CHARS[Math.floor(Math.random() * CHARS.length)];
          grid[ci][headRow].brightness = 1.0;
        }

        // Advance head position
        col.y += col.speed;

        // Reset column when it scrolls off-screen
        if (col.y > canvas!.height && Math.random() > 0.975) {
          col.y = 0;
          col.speed = 3 + Math.random() * 4;
        }

        // Draw all visible cells and decay non-head brightness
        for (let ri = 0; ri < rowCount; ri++) {
          const cell = grid[ci][ri];
          if (cell.brightness < 0.03) continue;

          const isHead = ri === headRow;

          if (isHead) {
            // Dim white-green head — subtle, atmospheric Matrix look
            ctx!.fillStyle = `rgba(120, 255, 120, ${cell.brightness * 0.42})`;
          } else {
            ctx!.fillStyle = `rgba(0, 185, 50, ${cell.brightness * 0.35})`;
          }

          ctx!.fillText(cell.char, col.x, (ri + 1) * FONT_SIZE);

          // Fade trail; head stays at full brightness until overwritten
          if (!isHead) {
            cell.brightness = Math.max(0, cell.brightness - FADE_RATE);
          }
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
