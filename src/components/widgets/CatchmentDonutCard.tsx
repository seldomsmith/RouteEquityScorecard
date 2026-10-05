"use client";

import React, { useState } from 'react';

export interface DaOverlapItem {
  da_id: string;
  pct: number;
  equal_score?: number;
  economic_score?: number;
  econ?: number;
  res?: number;
  eth?: number;
  sit?: number;
}

interface CatchmentDonutCardProps {
  stopId: string;
  stopName: string;
  score: number;
  percentile: number;
  grade?: string;
  das: DaOverlapItem[];
  highlightColor?: string;
  className?: string;
  showCalculatedMath?: boolean;
}

const SLICE_COLORS = [
  '#0284c7', // Sky-600
  '#2563eb', // Blue-600
  '#7c3aed', // Violet-600
  '#d97706', // Amber-600
  '#db2777', // Pink-600
  '#059669', // Emerald-600
  '#ea580c', // Orange-600
  '#4f46e5', // Indigo-600
  '#64748b', // Slate-500
];

export const CatchmentDonutCard: React.FC<CatchmentDonutCardProps> = ({
  stopId,
  stopName,
  score,
  percentile,
  grade,
  das,
  highlightColor = '#1e3a8a',
  className = '',
  showCalculatedMath = false,
}) => {
  const [showAllDAs, setShowAllDAs] = useState(false);

  // Sort descending by percentage
  const sortedDAs = [...das].sort((a, b) => b.pct - a.pct);
  const topDAs = sortedDAs.slice(0, 3);
  const remainingDAs = sortedDAs.slice(3);
  const displayedDAs = showAllDAs ? sortedDAs : topDAs;

  // Build SVG Pie / Donut slices
  let cumulativeAngle = 0;
  const piePaths = sortedDAs.map((da, idx) => {
    const fraction = da.pct / 100;
    const angle = fraction * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const r = 40;
    const cx = 50;
    const cy = 50;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      pathData,
      color: SLICE_COLORS[idx % SLICE_COLORS.length],
      da,
      idx,
    };
  });

  return (
    <div className={`bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 max-w-sm w-full select-none ${className}`}>
      {/* Header Pill & Percentile */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] font-black text-[#1e3a8a] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          #{stopId}
        </span>
        <div className="text-right">
          <span className="font-black text-sm text-[#1e3a8a]">
            {percentile.toFixed(0)}th %ile
          </span>
          {grade && (
            <span className="ml-1 text-[11px] font-bold text-slate-500">
              (Grade {grade})
            </span>
          )}
        </div>
      </div>

      {/* Stop Title & Overall Score */}
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
          {stopName}
        </h4>
        <div className="font-mono text-xs font-bold text-slate-500 shrink-0">
          SCORE: <span className="font-black text-slate-900">{score.toFixed(1)}</span>
        </div>
      </div>

      {/* Sub-label */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          400M DA Catchment Overlap
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          {das.length} Dissemination Areas
        </span>
      </div>

      {/* Main Visual: Pie Chart + DA Percentages */}
      <div className="mt-3 flex items-center gap-4">
        {/* Render Pie Chart */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {piePaths.map((slice) => (
              <path
                key={slice.idx}
                d={slice.pathData}
                fill={slice.color}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="transition-opacity hover:opacity-80"
              />
            ))}
          </svg>
        </div>

        {/* Legend / DA Overlap Rows */}
        <div className="flex-1 space-y-1.5 text-xs">
          {displayedDAs.map((da, idx) => {
            const originalIdx = sortedDAs.findIndex((d) => d.da_id === da.da_id);
            const color = SLICE_COLORS[originalIdx % SLICE_COLORS.length];
            return (
              <div key={da.da_id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-mono text-slate-700 text-[11px] truncate">
                    DA {da.da_id}
                  </span>
                </div>
                <div className="font-mono font-bold text-slate-900 text-[11px] shrink-0">
                  {da.pct.toFixed(1)}%
                </div>
              </div>
            );
          })}

          {remainingDAs.length > 0 && (
            <button
              onClick={() => setShowAllDAs(!showAllDAs)}
              className="text-[11px] font-medium text-slate-400 hover:text-blue-600 transition-colors pt-1 block"
            >
              {showAllDAs ? 'Show less' : `+${remainingDAs.length} more DAs`}
            </button>
          )}
        </div>
      </div>

      {/* Optional Step-by-Step Mathematical Computation */}
      {showCalculatedMath && (
        <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-[11px] text-slate-600 space-y-1 font-mono">
          <div className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider">
            Weighted Score Summation:
          </div>
          {sortedDAs.slice(0, 3).map((da) => (
            <div key={da.da_id} className="flex justify-between text-slate-700">
              <span>{da.pct.toFixed(1)}% × {(da.equal_score ?? score).toFixed(1)}</span>
              <span>= {(((da.pct || 0) / 100) * (da.equal_score ?? score)).toFixed(1)}</span>
            </div>
          ))}
          {sortedDAs.length > 3 && (
            <div className="text-slate-400 text-[10px]">
              + remaining {sortedDAs.length - 3} DAs weighted contributions...
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
            <span>Calculated Score:</span>
            <span>{score.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
