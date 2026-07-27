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

  // Define SVG dimensions & vertices
  const width = 320;
  const height = 280;
  const A = { x: width / 2, y: 30 }; // Top: Vulnerability
  const B = { x: 30, y: height - 50 }; // Left: Opportunity
  const C = { x: width - 30, y: height - 50 }; // Right: Off-Peak & Monopoly

  // Calculate denominator once
  const denom = (B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y);

  // Convert weights to barycentric coordinates
  // Top (w1) = vulnerability, Left (w2) = opportunity, Right (w3) = resilience + monopoly
  const getBarycentricFromWeights = () => {
    const total = weights.vulnerability + weights.opportunity + weights.resilience + weights.monopoly;
    if (total === 0) return [0.33, 0.33, 0.34];
    const w1 = weights.vulnerability / total;
    const w2 = weights.opportunity / total;
    const w3 = (weights.resilience + weights.monopoly) / total;
    return [w1, w2, w3];
  };

  const [w1, w2, w3] = getBarycentricFromWeights();
  const currentX = w1 * A.x + w2 * B.x + w3 * C.x;
  const currentY = w1 * A.y + w2 * B.y + w3 * C.y;

  // Convert SVG coordinate back to barycentric coordinates
  const getBarycentricFromPoint = (x: number, y: number) => {
    let rawW1 = ((B.y - C.y) * (x - C.x) + (C.x - B.x) * (y - C.y)) / denom;
    let rawW2 = ((C.y - A.y) * (x - C.x) + (A.x - C.x) * (y - C.y)) / denom;
    let rawW3 = 1 - rawW1 - rawW2;

    // Clamp values between 0 and 1
    rawW1 = Math.max(0, Math.min(1, rawW1));
    rawW2 = Math.max(0, Math.min(1, rawW2));
    rawW3 = Math.max(0, Math.min(1, rawW3));

    const sum = rawW1 + rawW2 + rawW3;
    if (sum > 0) {
      return [rawW1 / sum, rawW2 / sum, rawW3 / sum];
    }
    return [0.33, 0.33, 0.34];
  };

  // Convert barycentric coordinates to four-pillar weights (zero-sum, 100%)
  const barycentricToFourPillars = (w1: number, w2: number, w3: number) => {
    // Top = Vulnerability, Left = Opportunity, Right = Off-Peak (80%) and Monopoly (20%)
    const rawVuln = Math.round(w1 * 20) * 5; // step to nearest 5%
    const rawOpp = Math.round(w2 * 20) * 5;
    const rawRight = 100 - rawVuln - rawOpp;

    // Split rawRight between resilience and monopoly proportionally (4:1)
    const rawRes = Math.round((rawRight * 0.8) / 5) * 5;
    const rawMono = 100 - rawVuln - rawOpp - rawRes;

    return {
      vulnerability: rawVuln,
      opportunity: rawOpp,
      resilience: rawRes,
      monopoly: rawMono,
    };
  };

  // Calculate composite score for a specific coordinate
  const calculateScoreAtCoordinate = (w1: number, w2: number, w3: number) => {
    if (!route) return 50;
    const p1 = route.pillar_1 || 0; // Vulnerability
    const p2 = route.pillar_2 || 0; // Off-Peak Service
    const p3 = route.pillar_3 || 0; // Monopoly
    const p4 = route.pillar_4 || 0; // Opportunity

    // Weighted composite
    const score = w1 * p1 + w2 * p4 + w3 * (0.8 * p2 + 0.2 * p3);
    return score;
  };

  // Render heatmap background canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !route) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const imgData = ctx.createImageData(cw, ch);
    const data = imgData.data;

    // Loop through every pixel in the canvas
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        // Map canvas coordinates to SVG coordinate system space
        const svgX = (x / cw) * width;
        const svgY = (y / ch) * height;

        const [w1, w2, w3] = getBarycentricFromPoint(svgX, svgY);

        // Check if point is inside the triangle boundaries
        // We use a small epsilon margin to avoid edge rendering artifacts
        const isInside = w1 >= -0.005 && w2 >= -0.005 && w3 >= -0.005;

        const idx = (y * cw + x) * 4;

        if (isInside) {
          const score = calculateScoreAtCoordinate(w1, w2, w3);

          // Premium color interpolation:
          // Low score (0-40): Dark blue-slate to Indigo
          // Mid score (40-75): Blue to Violet
          // High score (75-100): Bright Cyan/Emerald
          let r = 23, g = 37, b = 84; // Default dark blue
          if (score < 40) {
            const factor = score / 40;
            r = Math.round(23 + (37 - 23) * factor);
            g = Math.round(37 + (99 - 37) * factor);
            b = Math.round(84 + (235 - 84) * factor);
          } else if (score < 75) {
            const factor = (score - 40) / 35;
            r = Math.round(37 + (139 - 37) * factor);
            g = Math.round(99 + (92 - 99) * factor);
            b = Math.round(235 + (246 - 235) * factor);
          } else {
            const factor = (score - 75) / 25;
            r = Math.round(139 + (6 - 139) * factor);
            g = Math.round(92 + (182 - 92) * factor);
            b = Math.round(246 + (212 - 246) * factor);
          }

          data[idx] = r;     // R
          data[idx + 1] = g; // G
          data[idx + 2] = b; // B
          data[idx + 3] = 235; // Alpha
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

    const [w1, w2, w3] = getBarycentricFromPoint(x, y);
    const newWeights = barycentricToFourPillars(w1, w2, w3);

    // Update active cursor stats
    const score = calculateScoreAtCoordinate(w1, w2, w3);
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
          {/* Outer Triangle border */}
          <polygon
            points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="2"
            opacity="0.8"
          />

          {/* Grid lines (10% increments) */}
          {[0.25, 0.5, 0.75].map((val) => {
            // Draw horizontal layers (Vulnerability levels)
            const ly = A.y + (B.y - A.y) * val;
            const lx1 = A.x - (A.x - B.x) * val;
            const lx2 = A.x + (C.x - A.x) * val;

            return (
              <line
                key={val}
                x1={lx1}
                y1={ly}
                x2={lx2}
                y2={ly}
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.3"
              />
            );
          })}

          {/* Vertex Labels */}
          <text
            x={A.x}
            y={A.y - 12}
            textAnchor="middle"
            className="text-[10px] font-black fill-slate-900 uppercase tracking-wider"
          >
            Vulnerability
          </text>
          <text
            x={B.x - 5}
            y={B.y + 16}
            textAnchor="middle"
            className="text-[10px] font-black fill-slate-900 uppercase tracking-wider"
          >
            Opportunity
          </text>
          <text
            x={C.x + 5}
            y={C.y + 16}
            textAnchor="middle"
            className="text-[10px] font-black fill-slate-900 uppercase tracking-wider"
          >
            Off-Peak/Monopoly
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-300 font-mono grid grid-cols-5 gap-2 items-center flex-shrink-0">
        <div className="flex flex-col text-center">
          <span className="text-[8px] text-slate-500 uppercase font-black">Score</span>
          <span className="text-white font-bold text-xs mt-0.5">
            {hoveredWeight ? hoveredWeight.score : Math.round(calculateScoreAtCoordinate(w1, w2, w3) * 10) / 10}
          </span>
        </div>
        <div className="flex flex-col text-center border-l border-slate-800">
          <span className="text-[8px] text-slate-500 uppercase font-black">Vuln</span>
          <span className="text-red-400 font-bold mt-0.5">
            {hoveredWeight ? hoveredWeight.vulnerability : weights.vulnerability}%
          </span>
        </div>
        <div className="flex flex-col text-center border-l border-slate-800">
          <span className="text-[8px] text-slate-500 uppercase font-black">Opp</span>
          <span className="text-indigo-400 font-bold mt-0.5">
            {hoveredWeight ? hoveredWeight.opportunity : weights.opportunity}%
          </span>
        </div>
        <div className="flex flex-col text-center border-l border-slate-800">
          <span className="text-[8px] text-slate-500 uppercase font-black">OffPeak</span>
          <span className="text-amber-400 font-bold mt-0.5">
            {hoveredWeight ? hoveredWeight.resilience : weights.resilience}%
          </span>
        </div>
        <div className="flex flex-col text-center border-l border-slate-800">
          <span className="text-[8px] text-slate-500 uppercase font-black">Monop</span>
          <span className="text-slate-400 font-bold mt-0.5">
            {hoveredWeight ? hoveredWeight.monopoly : weights.monopoly}%
          </span>
        </div>
      </div>

      <div className="mt-2 text-[9px] text-slate-400 leading-relaxed italic flex items-center gap-1.5 px-1 flex-shrink-0">
        <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        <span>Drag your cursor inside the triangle to live-adjust weights and analyze route score sensitivity.</span>
      </div>
    </div>
  );
};
