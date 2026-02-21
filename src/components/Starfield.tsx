"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number; // depth: 0 = far, 1 = near
  size: number;
  opacity: number;
  speed: number;
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let stars: Star[] = [];
    const STAR_COUNT = 200;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function createStars() {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        const z = Math.random(); // 0 = far background, 1 = near foreground
        stars.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          z,
          size: 0.3 + z * 1.5, // far stars tiny, near stars bigger
          opacity: 0.15 + z * 0.45, // far stars dim, near stars brighter
          speed: 0.02 + z * 0.08, // far stars drift slow, near stars faster
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const star of stars) {
        // Gentle upward drift for depth illusion
        star.y -= star.speed;
        if (star.y < -2) {
          star.y = canvas!.height + 2;
          star.x = Math.random() * canvas!.width;
        }

        // Subtle twinkle
        const twinkle = 0.85 + Math.sin(Date.now() * 0.001 * star.speed * 10 + star.x) * 0.15;
        const alpha = star.opacity * twinkle;

        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(200, 210, 255, ${alpha})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();

    const onResize = () => {
      resize();
      createStars();
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
