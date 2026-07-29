import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Minus, Maximize2 } from 'lucide-react';

export type BusStopGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'Regional';

interface BusStopGradeLegendProps {
  selectedGrades: BusStopGrade[];
  onToggleGrade: (grade: BusStopGrade) => void;
  gradeCounts?: Record<BusStopGrade, number>;
  showHeatmap?: boolean;
  onToggleHeatmap?: () => void;
}

export const GRADE_CONFIG: Record<BusStopGrade, { label: string; color: string; bg: string; border: string }> = {
  A: { label: 'Grade A (High Equity)', color: '#10B981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-500' },
  B: { label: 'Grade B', color: '#3B82F6', bg: 'bg-blue-50 text-blue-700 border-blue-200', border: 'border-blue-500' },
  C: { label: 'Grade C', color: '#F59E0B', bg: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-amber-500' },
  D: { label: 'Grade D', color: '#F97316', bg: 'bg-orange-50 text-orange-700 border-orange-200', border: 'border-orange-500' },
  E: { label: 'Grade E (Low Equity)', color: '#EF4444', bg: 'bg-red-50 text-red-700 border-red-200', border: 'border-red-500' },
  Regional: { label: 'Regional Stops', color: '#94A3B8', bg: 'bg-slate-100 text-slate-600 border-slate-200', border: 'border-slate-400' },
};

export const BusStopGradeLegend: React.FC<BusStopGradeLegendProps> = ({
  selectedGrades,
  onToggleGrade,
  gradeCounts,
  showHeatmap = true,
  onToggleHeatmap,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const grades: BusStopGrade[] = ['A', 'B', 'C', 'D', 'E', 'Regional'];

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-3 flex items-center gap-2 text-xs font-bold text-[#1e3a8a] hover:bg-slate-50 transition-all"
        title="Expand Map Legend"
      >
        <Layers className="w-4 h-4 text-[#1e3a8a]" />
        <span>Legend & Filters</span>
        <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-3.5 w-64 text-slate-800 space-y-3">
      {/* Header with Minimize Button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#1e3a8a]" /> Map Filters & Shading
        </span>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          title="Minimize Legend"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Heatmap Toggle & Spectrum Bar */}
      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            {showHeatmap ? <Eye className="w-3.5 h-3.5 text-[#1e3a8a]" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            DA Vulnerability Heatmap
          </span>
          {onToggleHeatmap && (
            <button
              onClick={onToggleHeatmap}
              className={`w-8 h-4 rounded-full transition-colors relative p-0.5 ${
                showHeatmap ? 'bg-[#1e3a8a]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-3 h-3 bg-white rounded-full transition-transform ${
                  showHeatmap ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          )}
        </div>

        {showHeatmap && (
          <div className="space-y-1 pt-1">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-slate-200 via-blue-400 via-amber-400 to-emerald-600 shadow-inner" />
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Low Equity</span>
              <span>High Equity</span>
            </div>
          </div>
        )}
      </div>

      {/* Grade Filters */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
          Bus Stop Grade Filters ({selectedGrades.length}/6)
        </div>
        {grades.map((g) => {
          const cfg = GRADE_CONFIG[g];
          const isSelected = selectedGrades.includes(g);
          const count = gradeCounts ? gradeCounts[g] : undefined;

          return (
            <button
              key={g}
              onClick={() => onToggleGrade(g)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-white border-slate-200 shadow-xs text-slate-900'
                  : 'bg-slate-50/60 border-slate-100 text-slate-400 opacity-65 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs border border-white"
                  style={{ backgroundColor: cfg.color }}
                />
                <span>{cfg.label}</span>
              </div>

              {count !== undefined && (
                <span className="font-mono text-[10px] font-bold opacity-75">
                  {count.toLocaleString()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
