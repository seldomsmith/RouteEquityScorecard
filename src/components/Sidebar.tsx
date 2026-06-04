"use client";

import React from 'react';
import { useRouteStore } from '@/store/routeStore';
import { RoutePoint } from '@/components/charts/EquityQuadrant';

interface SidebarProps {
  routes: RoutePoint[];
}

const WEIGHT_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  vulnerability: { label: 'Vulnerability',  desc: 'Social gravity of the corridor', color: '#64748B' },
  resilience:    { label: 'Off Peak Service', desc: 'Off-peak service reliability',   color: '#64748B' },
  monopoly:      { label: 'Monopoly',        desc: 'Sole-provider transit corridors', color: '#64748B' },
  opportunity:   { label: 'Opportunity',     desc: 'Critical destination linkage',    color: '#64748B' },
};

const GRADE_DOT: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-blue-500',
  C: 'bg-amber-500',
  D: 'bg-orange-500',
  E: 'bg-red-500',
};

export const Sidebar: React.FC<SidebarProps> = ({ routes }) => {
  const weights = useRouteStore((s) => s.weights);
  const setWeight = useRouteStore((s) => s.setWeight);
  const setWeights = useRouteStore((s) => s.setWeights);
  const disabledWeights = useRouteStore((s) => s.disabledWeights);
  const toggleWeightEnabled = useRouteStore((s) => s.toggleWeightEnabled);
  const selectedRoute = useRouteStore((s) => s.selectedRoute);
  const setSelectedRoute = useRouteStore((s) => s.setSelectedRoute);
  const selectedGrade = useRouteStore((s) => s.selectedGrade);
  const setSelectedGrade = useRouteStore((s) => s.setSelectedGrade);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const gradeCounts = React.useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    routes.forEach((r) => {
      if (r.grade && counts[r.grade] !== undefined) {
        counts[r.grade]++;
      }
    });
    return counts;
  }, [routes]);

  const displayedRoutes = React.useMemo(() => {
    if (!selectedGrade) return routes;
    return routes.filter((r) => r.grade === selectedGrade);
  }, [routes, selectedGrade]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <h1 className="text-lg font-black tracking-tight text-slate-900">REI OS</h1>
        <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
          Route Equity Intelligence
        </p>
      </div>

      {/* Weight Sliders — Zero-Sum System */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Policy Weights
          </h2>
          <button
            onClick={() => {
              setWeights({
                vulnerability: 15,
                resilience: 40,
                monopoly: 10,
                opportunity: 35,
              });
            }}
            className="text-[9px] font-semibold text-brand-teal-600 hover:text-brand-teal-700 uppercase tracking-wider"
          >
            Reset
          </button>
        </div>
        <div className="space-y-3">
          {Object.entries(WEIGHT_LABELS).map(([key, { label, desc, color }]) => {
            const val = weights[key as keyof typeof weights];
            const isDisabled = disabledWeights.includes(key as any);
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={!isDisabled}
                      disabled={!isDisabled && disabledWeights.length >= 3}
                      onChange={() => toggleWeightEnabled(key as any)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-brand-teal-600 focus:ring-brand-teal-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`text-[11px] font-semibold transition-colors duration-150 ${isDisabled ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-600'}`}>
                      {label}
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono font-bold transition-colors duration-150 ${isDisabled ? 'text-slate-400' : 'text-slate-800'}`}>
                    {val}%
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 mb-1">{desc}</p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={val}
                  disabled={isDisabled}
                  onChange={(e) =>
                    setWeight(key as any, Number(e.target.value))
                  }
                  className={`w-full h-1.5 rounded-full appearance-none transition-opacity duration-150
                    ${isDisabled 
                      ? 'opacity-40 cursor-not-allowed [&::-webkit-slider-thumb]:bg-slate-300 [&::-webkit-slider-thumb]:cursor-not-allowed [&::-moz-range-thumb]:bg-slate-300 [&::-moz-range-thumb]:cursor-not-allowed' 
                      : 'cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-black [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-95'
                    }`}
                  style={{
                    background: `linear-gradient(to right, ${isDisabled ? '#CBD5E1' : color} ${val}%, #E2E8F0 ${val}%)`,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-[10px] font-mono text-center text-emerald-600">
          Total: {totalWeight}% ✓
        </div>
      </div>

      {/* Route Selector */}
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          Route Isolator
        </h2>
        <select
          value={selectedRoute || ''}
          onChange={(e) => setSelectedRoute(e.target.value || null)}
          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 focus:border-brand-teal-500"
        >
          <option value="">All Routes</option>
          {routes
            .sort((a, b) => a.short_name.localeCompare(b.short_name, undefined, { numeric: true }))
            .map((r) => (
              <option key={r.route_id} value={r.route_id}>
                {r.short_name} — {r.name} ({r.grade})
              </option>
            ))}
        </select>
      </div>

      {/* Grade Isolator */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Grade Isolator
          </h2>
          {selectedGrade && (
            <button
              onClick={() => setSelectedGrade(null)}
              className="text-[9px] font-semibold text-brand-rose-500 hover:text-brand-rose-600 uppercase tracking-wider"
            >
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {(['A', 'B', 'C', 'D', 'E'] as const).map((g) => {
            const isActive = selectedGrade === g;
            const count = gradeCounts[g] || 0;
            
            // Premium custom badge styling based on active/inactive states
            const styleMap: Record<string, string> = {
              A: isActive ? 'bg-emerald-500 text-white shadow-sm border-emerald-500 font-bold' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/50',
              B: isActive ? 'bg-blue-500 text-white shadow-sm border-blue-500 font-bold' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200/50',
              C: isActive ? 'bg-amber-500 text-white shadow-sm border-amber-500 font-bold' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200/50',
              D: isActive ? 'bg-orange-500 text-white shadow-sm border-orange-500 font-bold' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200/50',
              E: isActive ? 'bg-red-500 text-white shadow-sm border-red-500 font-bold' : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200/50',
            };
            
            return (
              <button
                key={g}
                onClick={() => setSelectedGrade(isActive ? null : g)}
                className={`py-1 px-1 rounded-lg border text-center transition-all duration-150 flex flex-col items-center justify-center ${styleMap[g]}`}
              >
                <span className="text-xs font-black leading-none">{g}</span>
                <span className="text-[8px] font-mono font-semibold opacity-80 mt-0.5 leading-none">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Route List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Network ({displayedRoutes.length} {selectedGrade ? `Grade ${selectedGrade}` : ''} routes)
          </h2>
          <div className="space-y-1">
            {displayedRoutes
              .sort((a, b) => a.composite_score - b.composite_score)
              .map((r) => (
                <button
                  key={r.route_id}
                  onClick={() =>
                    setSelectedRoute(selectedRoute === r.route_id ? null : r.route_id)
                  }
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all duration-150
                    ${selectedRoute === r.route_id
                      ? 'bg-brand-teal-500/10 border border-brand-teal-500/30'
                      : 'hover:bg-slate-50 border border-transparent'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${GRADE_DOT[r.grade] || 'bg-slate-300'}`} />
                  <span className="font-mono font-bold text-slate-700 w-8">{r.short_name}</span>
                  <span className="text-slate-500 truncate flex-1">{r.name}</span>
                  <span className="font-mono font-bold text-slate-400 text-[10px]">{r.grade}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
