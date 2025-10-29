"use client";

import { useEffect, useRef } from "react";

interface WaveformProps {
  isActive: boolean;
  level: number;
}

export default function Waveform({ isActive, level }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bars = 50;
    const barWidth = canvas.width / bars;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bars; i++) {
        let barHeight;
        if (isActive) {
          // Simulate wave pattern based on audio level
          const wave = Math.sin((i / bars) * Math.PI * 4 + Date.now() / 200);
          barHeight = (wave * 0.5 + 0.5) * level * canvas.height * 0.8;
        } else {
          // Idle state - minimal movement
          const wave = Math.sin((i / bars) * Math.PI * 2 + Date.now() / 1000);
          barHeight = (wave * 0.5 + 0.5) * 20;
        }

        const x = i * barWidth;
        const y = (canvas.height - barHeight) / 2;

        // Gradient from primary to accent
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, isActive ? "#3b82f6" : "#6b7280");
        gradient.addColorStop(1, isActive ? "#8b5cf6" : "#9ca3af");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, level]);

  return (
    <div className="w-full max-w-2xl">
      <canvas
        ref={canvasRef}
        width={800}
        height={100}
        className="w-full h-24 rounded-lg"
      />
    </div>
  );
}
