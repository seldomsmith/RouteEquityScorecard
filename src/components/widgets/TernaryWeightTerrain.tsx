"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useRouteStore } from '@/store/routeStore';
import { ScoredRoute } from '@/hooks/useReactiveScoring';
import { Info } from 'lucide-react';

interface TernaryWeightTerrainProps {
  route: ScoredRoute | null;
}

export const TernaryWeightTerrain: React.FC<TernaryWeightTerrainProps> = ({ route }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const weights = useRouteStore((state) => state.weights);
  const setWeights = useRouteStore((state) => state.setWeights);

  const [hoveredWeight, setHoveredWeight] = useState<{ vulnerability: number; opportunity: number; resilience: number; monopoly: number; score: number } | null>(null);

  // Define SVG dimensions & box boundaries
  const width = 320;
  const height = 285;
  
  const boxSize = 200;
  const paddingX = (width - boxSize) / 2; // 60px
  const paddingY = 40; // 40px top padding
  
  // Box corner positions:
  // Top-Left (Vulnerability)
  // Top-Right (Off-Peak Service)
  // Bottom-Right (Transit Monopoly)
  // Bottom-Left (Destination Opportunity)

  // Convert weights to local [0, 1] coordinates
  const getCoordsFromWeights = () => {
    // u = right-side weights share
    // v = top-side weights share
    const u = (weights.resilience + weights.monopoly) / 100;
    const v = (weights.vulnerability + weights.resilience) / 100;
    return [u, v];
  };

  const [u, v] = getCoordsFromWeights();
  const currentX = paddingX + u * boxSize;
  const currentY = paddingY + (1 - v) * boxSize;

  // Convert local [0, 1] coordinates to weights summing to 100%
  const coordsToWeights = (u: number, v: number) => {
    const w_vuln = (1 - u) * v;      // Top-Left
    const w_offpeak = u * v;          // Top-Right
    const w_monop = u * (1 - v);      // Bottom-Right
    const w_opp = (1 - u) * (1 - v);  // Bottom-Left

    // Distribute into neat 5% steps using Largest Remainder Method
    const STEP = 5;
    const raw = [
      { key: 'vulnerability', val: w_vuln },
      { key: 'opportunity', val: w_opp },
      { key: 'resilience', val: w_offpeak },
      { key: 'monopoly', val: w_monop },
    ];
    
    const steps = raw.map((r) => ({
      key: r.key,
      ideal: r.val * 20,
      floor: Math.floor(r.val * 20),
    }));
    
    const sumFloor = steps.reduce((sum, s) => sum + s.floor, 0);
    const leftover = 20 - sumFloor;
    
    const sorted = steps.map((s) => ({
      ...s,
      remainder: s.ideal - s.floor
    })).sort((a, b) => b.remainder - a.remainder);
    
    const newWeights: Record<string, number> = {};
    sorted.forEach((s, idx) => {
      const extra = idx < leftover ? 1 : 0;
      newWeights[s.key] = (s.floor + extra) * STEP;
    });
    
    return {
      vulnerability: newWeights.vulnerability,
      opportunity: newWeights.opportunity,
      resilience: newWeights.resilience,
      monopoly: newWeights.monopoly,
    };
  };

  // Calculate composite score for specific local coordinates
  const calculateScoreAtCoordinate = (u: number, v: number) => {
    if (!route) return 50;
    const w_vuln = (1 - u) * v;
    const w_offpeak = u * v;
    const w_monop = u * (1 - v);
    const w_opp = (1 - u) * (1 - v);

    const p1 = route.pillar_1 || 0; // Vulnerability
    const p2 = route.pillar_2 || 0; // Off-Peak
    const p3 = route.pillar_3 || 0; // Monopoly
    const p4 = route.pillar_4 || 0; // Opportunity

    return w_vuln * p1 + w_offpeak * p2 + w_monop * p3 + w_opp * p4;
  };

  // Render clean score heatmap background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !route) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const imgData = ctx.createImageData(cw, ch);
    const data = imgData.data;

    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        // Translate pixel coordinates to local [0, 1] range inside the box
        const u_coord = (x - paddingX) / boxSize;
        const v_coord = 1 - (y - paddingY) / boxSize;

        const isInside = u_coord >= 0 && u_coord <= 1 && v_coord >= 0 && v_coord <= 1;

        const idx = (y * cw + x) * 4;

        if (isInside) {
          const score = calculateScoreAtCoordinate(u_coord, v_coord);

          // Clean, consistent, simplistic color scheme:
          // Smooth transition from dark Slate (#0f172a) to vibrant Brand Blue (#2563eb)
          const factor = Math.max(0, Math.min(100, score)) / 100;
          const r = Math.round(15 + (37 - 15) * factor);
          const g = Math.round(23 + (99 - 23) * factor);
          const b = Math.round(42 + (235 - 42) * factor);

          data[idx] = r;     // R
          data[idx + 1] = g; // G
          data[idx + 2] = b; // B
          data[idx + 3] = 230; // Alpha
        } else {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0; // Transparent
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [route]);

  const handlePointerInteraction = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    // Convert to [0, 1] coordinates relative to box
    let newU = (x - paddingX) / boxSize;
    let newV = 1 - (y - paddingY) / boxSize;

    // Clamp coordinates to box boundaries
    newU = Math.max(0, Math.min(1, newU));
    newV = Math.max(0, Math.min(1, newV));

    const newWeights = coordsToWeights(newU, newV);
    const score = calculateScoreAtCoordinate(newU, newV);

    setHoveredWeight({
      vulnerability: newWeights.vulnerability,
      opportunity: newWeights.opportunity,
      resilience: newWeights.resilience,
      monopoly: newWeights.monopoly,
      score: Math.round(score * 10) / 10,
    });

    if (e.buttons === 1) {
      setWeights(newWeights);
    }
  };

  const handlePointerLeave = () => {
    setHoveredWeight(null);
  };

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <Info className="w-8 h-8 mb-2 text-slate-300" />
        <p className="text-xs uppercase font-black tracking-wider">No Route Selected</p>
        <p className="text-[10px] mt-1">Select a route from the sidebar to visualize its policy sensitivity terrain.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full select-none" ref={containerRef}>
      {/* Visual Controls */}
      <div className="flex-1 relative flex items-center justify-center min-h-[290px]">
        {/* Canvas Heatmap layer */}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute pointer-events-none rounded-xl"
          style={{ width: `${width}px`, height: `${height}px` }}
        />

        {/* SVG Controls layer */}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="absolute z-10 cursor-crosshair overflow-visible"
          onPointerDown={handlePointerInteraction}
          onPointerMove={handlePointerInteraction}
          onPointerLeave={handlePointerLeave}
        >
          {/* Outer Box border */}
          <rect
            x={paddingX}
            y={paddingY}
            width={boxSize}
            height={boxSize}
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="2"
            opacity="0.8"
          />

          {/* Grid lines (25% increments) */}
          {[0.25, 0.5, 0.75].map((val) => {
            const pos = paddingY + val * boxSize;
            const posX = paddingX + val * boxSize;
            return (
              <React.Fragment key={val}>
                {/* Horizontal grid lines */}
                <line
                  x1={paddingX}
                  y1={pos}
                  x2={paddingX + boxSize}
                  y2={pos}
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity="0.25"
                />
                {/* Vertical grid lines */}
                <line
                  x1={posX}
                  y1={paddingY}
                  x2={posX}
                  y2={paddingY + boxSize}
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity="0.25"
                />
              </React.Fragment>
            );
          })}

          {/* Corner Labels (the four actual pillars) */}
          {/* Top-Left: Vulnerability */}
          <text
            x={paddingX - 8}
            y={paddingY + 4}
            textAnchor="end"
            className="text-[9px] font-black fill-slate-900 uppercase tracking-wider"
          >
            Vulnerability
          </text>
          
          {/* Top-Right: Off-Peak Service */}
          <text
            x={paddingX + boxSize + 8}
            y={paddingY + 4}
            textAnchor="start"
            className="text-[9px] font-black fill-slate-900 uppercase tracking-wider"
          >
            Off-Peak
          </text>
          
          {/* Bottom-Right: Monopoly */}
          <text
            x={paddingX + boxSize + 8}
            y={paddingY + boxSize + 4}
            textAnchor="start"
            className="text-[9px] font-black fill-slate-900 uppercase tracking-wider"
          >
            Monopoly
          </text>
          
          {/* Bottom-Left: Opportunity */}
          <text
            x={paddingX - 8}
            y={paddingY + boxSize + 4}
            textAnchor="end"
            className="text-[9px] font-black fill-slate-900 uppercase tracking-wider"
          >
            Opportunity
          </text>

          {/* Active Coordinate Reticle */}
          <circle
            cx={currentX}
            cy={currentY}
            r="8"
            fill="transparent"
            stroke="#ffffff"
            strokeWidth="3"
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          />
          <circle
            cx={currentX}
            cy={currentY}
            r="3"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Stats display panel */}
      <div className="bg-emerald-900 border border-emerald-800 rounded-xl p-3 text-[11px] text-white font-mono grid grid-cols-5 gap-2 items-center flex-shrink-0">
        <div className="flex flex-col text-center">
          <span className="text-[9px] text-emerald-200 uppercase font-black">Score</span>
          <span className="text-white font-bold text-sm mt-0.5">
            {hoveredWeight ? hoveredWeight.score : Math.round(calculateScoreAtCoordinate(u, v) * 10) / 10}
          </span>
        </div>
        <div className="flex flex-col text-center border-l border-emerald-800">
          <span className="text-[9px] text-emerald-200 uppercase font-black">Vuln</span>
          <span className="text-white font-bold text-sm mt-0.5">
            {hoveredWeight ? hoveredWeight.vulnerability : weights.vulnerability}%
          </span>
        </div>
        <div className="flex flex-col text-center border-l border-emerald-800">
          <span className="text-[9px] text-emerald-200 uppercase font-black">Opp</span>
          <span className="text-white font-bold text-sm mt-0.5">
            {hoveredWeight ? hoveredWeight.opportunity : weights.opportunity}%
          </span>
        </div>
        <div className="flex flex-col text-center border-l border-emerald-800">
          <span className="text-[9px] text-emerald-200 uppercase font-black">OffPeak</span>
          <span className="text-white font-bold text-sm mt-0.5">
            {hoveredWeight ? hoveredWeight.resilience : weights.resilience}%
          </span>
        </div>
        <div className="flex flex-col text-center border-l border-emerald-800">
          <span className="text-[9px] text-emerald-200 uppercase font-black">Monop</span>
          <span className="text-white font-bold text-sm mt-0.5">
            {hoveredWeight ? hoveredWeight.monopoly : weights.monopoly}%
          </span>
        </div>
      </div>

      <div className="mt-2 text-[9px] text-slate-400 leading-relaxed italic flex items-center gap-1.5 px-1 flex-shrink-0">
        <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        <span>Drag your cursor inside the square to live-adjust weights and analyze route score sensitivity.</span>
      </div>
    </div>
  );
};
