"use client";

import React from 'react';
import { useUIStore } from '@/store/useUIStore';
import { useWeightingStore } from '@/store/useWeightingStore';
import { useBriefingExport } from '@/lib/export/useBriefingExport';

export const ShapWaterfall = () => {
  const { selectedRoute, allRouteMetrics } = useUIStore();
  const weights = useWeightingStore();
  const { exportMarkdown } = useBriefingExport();

  const routeData = allRouteMetrics.find(r => String(r.route_id) === String(selectedRoute));

  if (!selectedRoute || !routeData) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full flex flex-col items-center justify-center shadow-sm">
        <p className="text-[10px] font-black text-slate-300 uppercase italic">Select a corridor to generate briefing</p>
      </div>
    );
  }

  const drivers = [
    { label: 'Social Vulnerability', value: (routeData.vuln_score || 0) * weights.vulnerability, color: 'bg-emerald-600' },
    { label: 'Temporal Reliability', value: (routeData.temp_score || 0) * weights.temporal, color: 'bg-emerald-500' },
    { label: 'Network Monopoly', value: (routeData.mono_score || 0) * weights.monopoly, color: 'bg-emerald-400' },
    { label: 'Opportunity Access', value: (routeData.opp_score || 0) * weights.opportunity, color: 'bg-emerald-300' },
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full flex flex-col shadow-sm">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Score Explainability</h3>
          <p className="text-[9px] text-emerald-600 font-bold uppercase mt-2">Route {selectedRoute}: {routeData.rei_score} Score</p>
        </div>
        <button 
          onClick={() => exportMarkdown(selectedRoute, routeData, weights)}
          className="bg-slate-900 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          Export Briefing (.md)
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center space-y-6">
        {drivers.map((d, i) => (
          <div key={i}>
            <div className="flex justify-between text-[9px] font-bold uppercase mb-1.5 tracking-tighter">
              <span className="text-slate-500">{d.label}</span>
              <span className="text-slate-900 tabular-nums">+{d.value.toFixed(1)}</span>
            </div>
            <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
              <div 
                className={`h-full ${d.color} transition-all duration-700`} 
                style={{ width: `${Math.min(100, (d.value / 40) * 100)}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-100">
        <p className="text-[9px] leading-relaxed text-slate-400 font-bold uppercase tracking-tight">
          Analysis: This route's performance is currently dominated by its 
          <span className="text-slate-900"> {drivers[0].label}</span> profile.
        </p>
      </div>
    </div>
  );
};
