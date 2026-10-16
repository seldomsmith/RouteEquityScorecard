"use client";

import React, { useEffect, useRef } from 'react';
import { EDMONTON_CORE_BUS_STOPS, EDMONTON_CORE_CORRIDORS, CoreBusStop } from '@/data/edmontonCoreBusStops';

interface BusStopWaterfallProps {
  opacity?: number;
  interactive?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface CatchmentRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

const GRADE_COLORS: Record<string, string> = {
  A: '#10b981', // High Equity Need Emerald
  B: '#3b82f6', // Transit Blue
  C: '#eab308', // Amber
  D: '#94a3b8', // Slate
  E: '#64748b', // Deep Slate
};

export const BusStopWaterfall: React.FC<BusStopWaterfallProps> = ({
  opacity = 0.28,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const stops: CoreBusStop[] = EDMONTON_CORE_BUS_STOPS;
    const corridors = EDMONTON_CORE_CORRIDORS;

    // Track active catchment ripples
    const ripples: CatchmentRipple[] = [];
    let rippleTimer = 0;

    // Filter prominent stops for ripple generation
    const prominentStops = stops.filter(s => s.grade === 'A' || s.trips >= 150);

    // Track cursor for hover spotlight
    let mousePos: Point | null = null;
    let hoveredStop: CoreBusStop | null = null;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mousePos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const onPointerLeave = () => {
      mousePos = null;
      hoveredStop = null;
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const getPixelCoords = (pctX: number, pctY: number, width: number, height: number): Point => {
      return {
        x: (pctX / 100) * width,
        y: (pctY / 100) * height,
      };
    };

    const spawnRipple = (w: number, h: number) => {
      if (prominentStops.length === 0) return;
      const randomStop = prominentStops[Math.floor(Math.random() * prominentStops.length)];
      const pt = getPixelCoords(randomStop.xPct, randomStop.yPct, w, h);
      ripples.push({
        x: pt.x,
        y: pt.y,
        radius: 2,
        maxRadius: Math.min(w, h) * 0.055, // ~400m walk buffer proportional to viewport scale
        alpha: 0.65,
        color: GRADE_COLORS[randomStop.grade] || '#10b981',
      });
    };

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Check hover proximity to stops
      hoveredStop = null;
      if (mousePos) {
        let minDist = Infinity;
        let closest: CoreBusStop | null = null;
        for (let i = 0; i < stops.length; i++) {
          const s = stops[i];
          const pt = getPixelCoords(s.xPct, s.yPct, w, h);
          const dx = pt.x - mousePos.x;
          const dy = pt.y - mousePos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            closest = s;
          }
        }
        if (minDist < 35) {
          hoveredStop = closest;
        }
      }

      // Periodically trigger a subtle walking catchment ripple
      rippleTimer++;
      if (rippleTimer > 50 && ripples.length < 5) {
        spawnRipple(w, h);
        rippleTimer = 0;
      }

      // 1. Draw ultra-faint arterial corridor traces
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#059669'; // Emerald corridor tint
      ctx.globalAlpha = 0.08;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      corridors.forEach(c => {
        if (c.path.length < 2) return;
        ctx.beginPath();
        c.path.forEach((pt, idx) => {
          const px = getPixelCoords(pt.xPct, pt.yPct, w, h);
          if (idx === 0) ctx.moveTo(px.x, px.y);
          else ctx.lineTo(px.x, px.y);
        });
        ctx.stroke();
      });

      // 2. Animate and draw 400m walking catchment ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 0.35;
        r.alpha = Math.max(0, 0.65 * (1 - r.radius / r.maxRadius));

        if (r.radius >= r.maxRadius || r.alpha <= 0.01) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = r.alpha * 0.45;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Soft internal radial glow fill
        ctx.fillStyle = r.color;
        ctx.globalAlpha = r.alpha * 0.05;
        ctx.fill();
      }

      // 3. Draw central bus stops
      stops.forEach(s => {
        const pt = getPixelCoords(s.xPct, s.yPct, w, h);
        const isHovered = hoveredStop?.id === s.id;
        const color = GRADE_COLORS[s.grade] || '#10b981';

        ctx.beginPath();
        const baseRadius = s.grade === 'A' ? 3.0 : 2.2;
        ctx.arc(pt.x, pt.y, isHovered ? baseRadius * 2.2 : baseRadius, 0, Math.PI * 2);

        ctx.fillStyle = isHovered ? '#ffffff' : color;
        ctx.globalAlpha = isHovered ? 1.0 : s.grade === 'A' ? 0.75 : 0.45;
        ctx.fill();

        if (isHovered || s.grade === 'A') {
          ctx.strokeStyle = color;
          ctx.lineWidth = isHovered ? 2 : 1;
          ctx.stroke();
        }

        // Draw hover tooltip catchment highlight
        if (isHovered) {
          const catchmentRadius = Math.min(w, h) * 0.055;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, catchmentRadius, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.55;
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.globalAlpha = 0.08;
          ctx.fill();

          // Stop name label
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = '#0f172a';
          ctx.font = '600 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${s.name} (Grade ${s.grade})`, pt.x, pt.y - 12);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        opacity,
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    />
  );
};
