"use client";

import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Minus, Maximize2, Bus, Navigation } from 'lucide-react';
import { useRouteStore } from '@/store/routeStore';

export type BusStopGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'Regional';

interface BusStopGradeLegendProps {
  selectedGrades: BusStopGrade[];
  onToggleGrade: (grade: BusStopGrade) => void;
  selectedRouteGrades?: BusStopGrade[];
  onToggleRouteGrade?: (grade: BusStopGrade) => void;
  gradeCounts?: Record<BusStopGrade, number>;
  routeGradeCounts?: Record<BusStopGrade, number>;
  showHeatmap?: boolean;
  onToggleHeatmap?: () => void;
  showRoutes?: boolean;
  onToggleRoutes?: () => void;
  showStops?: boolean;
  onToggleStops?: () => void;
}

export const GRADE_CONFIG: Record<BusStopGrade, { label: string; color: string; bg: string; border: string }> = {
  A: { label: 'Grade A (High Equity)', color: '#10B981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-500' },
  B: { label: 'Grade B', color: '#3B82F6', bg: 'bg-blue-50 text-blue-700 border-blue-200', border: 'border-blue-500' },
  C: { label: 'Grade C', color: '#F59E0B', bg: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-amber-500' },
  D: { label: 'Grade D', color: '#F97316', bg: 'bg-orange-50 text-orange-700 border-orange-200', border: 'border-orange-500' },
  E: { label: 'Grade E (Low Equity)', color: '#EF4444', bg: 'bg-red-50 text-red-700 border-red-200', border: 'border-red-500' },
  Regional: { label: 'Regional', color: '#94A3B8', bg: 'bg-slate-100 text-slate-600 border-slate-200', border: 'border-slate-400' },
};

const PALETTE_GRADIENTS: Record<string, string> = {
  purple: 'from-purple-100 via-purple-400 to-purple-800',
  teal: 'from-teal-100 via-teal-400 to-teal-800',
  emerald: 'from-emerald-100 via-emerald-400 to-emerald-800',
  carbon: 'from-slate-100 via-slate-400 to-slate-800',
  divergent: 'from-[#D1FAE5] via-[#FEF3C7] to-[#EF4444]',
  sunrise: 'from-[#FEF3C7] via-[#F472B6] to-[#BE185D]',
  sunset: 'from-[#FFEDD5] via-[#F97316] to-[#991B1B]',
};

const PALETTE_ORDER = ['divergent', 'purple', 'teal', 'emerald', 'carbon', 'sunrise', 'sunset'] as const;

export const BusStopGradeLegend: React.FC<BusStopGradeLegendProps> = ({
  selectedGrades,
  onToggleGrade,
  selectedRouteGrades = ['A', 'B', 'C', 'D', 'E', 'Regional'],
  onToggleRouteGrade,
  gradeCounts,
  routeGradeCounts,
  showHeatmap = true,
  onToggleHeatmap,
  showRoutes = false,
  onToggleRoutes,
  showStops = true,
  onToggleStops,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const grades: BusStopGrade[] = ['A', 'B', 'C', 'D', 'E', 'Regional'];

  // Global Heatmap color palette hooks
  const heatmapPalette = useRouteStore((s) => s.heatmapPalette);
  const setHeatmapPalette = useRouteStore((s) => s.setHeatmapPalette);

  const handleCyclePalette = () => {
    const currentIndex = PALETTE_ORDER.indexOf(heatmapPalette);
    const nextIndex = (currentIndex + 1) % PALETTE_ORDER.length;
    setHeatmapPalette(PALETTE_ORDER[nextIndex]);
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-3 flex items-center gap-2 text-xs font-bold text-[#1e3a8a] hover:bg-slate-50 transition-all"
        title="Expand Map Filters"
      >
        <Layers className="w-4 h-4 text-[#1e3a8a]" />
        <span>Map Filters</span>
        <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-3.5 w-64 text-slate-800 space-y-3 max-h-[85vh] overflow-y-auto custom-scrollbar">
      {/* Header with Title & Minimize Button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#1e3a8a] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#1e3a8a]" /> Map Filters:
        </span>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          title="Minimize Panel"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ================= 3 MASTER LAYER TOGGLES ================= */}
      <div className="space-y-2">
        {/* Toggle 1: DA Vulnerability Heatmap */}
        <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              {showHeatmap ? <Eye className="w-3.5 h-3.5 text-[#1e3a8a]" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              Vulnerability Heat Map
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

          {/* Sub-panel: Heatmap Spectrum Bar */}
          {showHeatmap && (
            <div className="space-y-1 pt-1 flex flex-col items-stretch animate-in fade-in duration-150">
              <button
                onClick={handleCyclePalette}
                className={`h-3 w-full rounded-full bg-gradient-to-r ${PALETTE_GRADIENTS[heatmapPalette]} shadow-inner border border-white hover:scale-[1.01] cursor-pointer transition-all duration-150 flex items-center justify-center`}
                title="Click to cycle heatmap color palette"
              />
              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-wide px-0.5">
                <span>Light (Low Need)</span>
                <span>Dark (High Need)</span>
              </div>
              <div className="text-center text-[9px] font-bold text-slate-500/80 tracking-wide pt-0.5 select-none hover:text-slate-700 transition-colors cursor-pointer" onClick={handleCyclePalette}>
                Click to Select Heat Map Colours
              </div>
            </div>
          )}
        </div>

        {/* Toggle 2: Transit Routes */}
        <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              <Navigation className={`w-3.5 h-3.5 ${showRoutes ? 'text-blue-600' : 'text-slate-400'}`} />
              Transit Routes
            </span>
            {onToggleRoutes && (
              <button
                onClick={onToggleRoutes}
                className={`w-8 h-4 rounded-full transition-colors relative p-0.5 ${
                  showRoutes ? 'bg-[#1e3a8a]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full transition-transform ${
                    showRoutes ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>

          {/* Sub-panel: Route Grade Filters */}
          {showRoutes && (
            <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60 animate-in fade-in duration-150">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
                Route Vulnerability Grades
              </div>
              {grades.map((g) => {
                const cfg = GRADE_CONFIG[g];
                const isSelected = selectedRouteGrades.includes(g);
                const count = routeGradeCounts ? routeGradeCounts[g] : undefined;

                return (
                  <button
                    key={`route-g-${g}`}
                    onClick={() => onToggleRouteGrade && onToggleRouteGrade(g)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-white border-slate-200 shadow-2xs text-slate-900'
                        : 'bg-slate-50/60 border-slate-100 text-slate-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span>{g === 'Regional' ? 'Regional' : `Grade ${g}`}</span>
                    </div>
                    {count !== undefined && (
                      <span className="font-mono text-[9px] font-bold opacity-75">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Toggle 3: Transit Stops */}
        <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              <Bus className={`w-3.5 h-3.5 ${showStops ? 'text-teal-600' : 'text-slate-400'}`} />
              Transit Stops
            </span>
            {onToggleStops && (
              <button
                onClick={onToggleStops}
                className={`w-8 h-4 rounded-full transition-colors relative p-0.5 ${
                  showStops ? 'bg-[#1e3a8a]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full transition-transform ${
                    showStops ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>

          {/* Sub-panel: Bus Stop Grade Filters */}
          {showStops && (
            <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60 animate-in fade-in duration-150">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
                Stop Vulnerability Grades ({selectedGrades.length}/6)
              </div>
              {grades.map((g) => {
                const cfg = GRADE_CONFIG[g];
                const isSelected = selectedGrades.includes(g);
                const count = gradeCounts ? gradeCounts[g] : undefined;

                return (
                  <button
                    key={`stop-g-${g}`}
                    onClick={() => onToggleGrade(g)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-white border-slate-200 shadow-2xs text-slate-900'
                        : 'bg-slate-50/60 border-slate-100 text-slate-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span>{cfg.label}</span>
                    </div>

                    {count !== undefined && (
                      <span className="font-mono text-[9px] font-bold opacity-75">
                        {count.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
