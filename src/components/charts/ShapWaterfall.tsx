"use client";

import React from 'react';
import { RoutePoint } from '@/components/charts/EquityQuadrant';

interface WaterfallProps {
  route: RoutePoint | null;
}

const PILLARS = [
  { key: 'pillar_1', label: 'Vulnerability', color: '#EF4444' },
  { key: 'pillar_2', label: 'Temporal Risk', color: '#F59E0B' },
  { key: 'pillar_3', label: 'Monopoly', color: '#8B5CF6' },
  { key: 'pillar_4', label: 'Opportunity', color: '#10B981' },
];

const GRADE_BG: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-amber-100 text-amber-700',
  D: 'bg-orange-100 text-orange-700',
  E: 'bg-red-100 text-red-700',
};

export const ShapWaterfall: React.FC<WaterfallProps> = ({ route }) => {
  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-xs text-brand-slate-400">
        <span className="text-lg mb-1">📊</span>
        Select a route to see its score breakdown
      </div>
    );
  }

  const pillarValues = PILLARS.map((p) => ({
    ...p,
    value: Number((route as any)[p.key]) || 0,
  }));

  // Fixed scale: pillar scores range 0-100 across the entire network.
  // This ensures bars are directly comparable between routes.
  const PILLAR_MAX = 100;
  const COMPOSITE_MAX = 70; // Global max composite is 66.9, rounded to 70

  return (
    <div className="flex flex-col h-full px-2 py-1">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${GRADE_BG[route.grade] || 'bg-slate-100 text-slate-600'}`}>
          {route.grade}
        </span>
        <span className="text-xs font-bold text-slate-800 truncate">{route.short_name} — {route.name}</span>
      </div>

      {/* Pillar Bars */}
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {pillarValues.map((p) => (
          <div key={p.key} className="flex items-center gap-2">
            <span className="text-[9px] text-slate-500 w-16 text-right truncate">{p.label}</span>
            <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max((p.value / PILLAR_MAX) * 100, 2)}%`,
                  backgroundColor: p.color,
                  opacity: 0.85,
                }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-600 w-8 text-right">
              {p.value.toFixed(1)}
            </span>
          </div>
        ))}

        {/* Composite Score Bar */}
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-200">
          <span className="text-[9px] font-bold text-slate-700 w-16 text-right">TOTAL</span>
          <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.max((route.composite_score / COMPOSITE_MAX) * 100, 2)}%`,
                background: 'linear-gradient(90deg, #0F766E, #14B8A6)',
              }}
            />
          </div>
          <span className="text-[10px] font-mono font-black text-slate-800 w-8 text-right">
            {route.composite_score.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};
