"use client";

import React from 'react';
import { useRouteStore } from '@/store/routeStore';
import { RoutePoint } from '@/components/charts/EquityQuadrant';

interface SidebarProps {
  routes: RoutePoint[];
}

const WEIGHT_LABELS: Record<string, { label: string; color: string }> = {
  vulnerability: { label: 'Vulnerability', color: '#EF4444' },
  resilience:    { label: 'Temporal Risk', color: '#F59E0B' },
  monopoly:      { label: 'Monopoly',      color: '#8B5CF6' },
  opportunity:   { label: 'Opportunity',   color: '#10B981' },
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
  const selectedRoute = useRouteStore((s) => s.selectedRoute);
  const setSelectedRoute = useRouteStore((s) => s.setSelectedRoute);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <h1 className="text-lg font-black tracking-tight text-slate-900">REI OS</h1>
        <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
          Route Equity Intelligence
        </p>
      </div>

      {/* Weight Sliders */}
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Policy Weights
        </h2>
        <div className="space-y-3">
          {Object.entries(WEIGHT_LABELS).map(([key, { label, color }]) => {
            const val = weights[key as keyof typeof weights];
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-slate-600">{label}</span>
                  <span className="text-[11px] font-mono font-bold text-slate-800">{val}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={val}
                  onChange={(e) =>
                    setWeight(key as keyof typeof weights, Number(e.target.value))
                  }
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${color} ${val}%, #E2E8F0 ${val}%)`,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className={`mt-2 text-[10px] font-mono text-center ${totalWeight === 100 ? 'text-emerald-600' : 'text-red-500 font-bold'}`}>
          Total: {totalWeight}%{totalWeight !== 100 ? ' ← Must equal 100%' : ' ✓'}
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

      {/* Route List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Network ({routes.length} routes)
          </h2>
          <div className="space-y-1">
            {routes
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
