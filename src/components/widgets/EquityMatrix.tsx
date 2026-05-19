"use client";

import React from 'react';
import { useUIStore } from '@/store/useUIStore';

export const EquityMatrix = () => {
  const { selectedRoute, allRouteMetrics } = useUIStore();
  const routeData = allRouteMetrics.find(r => String(r.route_id) === String(selectedRoute));

  const getGrade = (score: number) => {
    if (score >= 80) return { l: 'A', c: 'text-emerald-600', t: 'Exceptional Equity Coverage' };
    if (score >= 60) return { l: 'B', c: 'text-emerald-500', t: 'Strong Social Alignment' };
    if (score >= 40) return { l: 'C', c: 'text-amber-500', t: 'Neutral Network Performance' };
    if (score >= 20) return { l: 'D', c: 'text-orange-500', t: 'Sub-Optimal Coverage' };
    return { l: 'E', c: 'text-rose-600', t: 'Critical Equity Gap' };
  };

  const grade = routeData ? getGrade(routeData.rei_score) : null;
  
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full flex flex-col shadow-sm">
      <header className="mb-4 flex justify-between items-start">
        <div>
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
            Equity Dissemination Matrix
          </h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
            {selectedRoute ? `Route ${selectedRoute}: ${grade?.t}` : "Select a route to begin"}
          </p>
        </div>
        {grade && (
          <div className="flex flex-col items-end">
            <span className={`text-3xl font-black leading-none ${grade.c}`}>{grade.l}</span>
            <span className="text-[8px] font-black text-slate-300 uppercase mt-1">REI Grade</span>
          </div>
        )}
      </header>
      
      {!selectedRoute ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl">
          <p className="text-[10px] font-bold text-slate-300 uppercase">Awaiting Selection...</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-12 gap-1 content-start overflow-y-auto custom-scrollbar">
          {Array.from({ length: 48 }).map((_, i) => (
            <div 
              key={i} 
              className={`aspect-square rounded-sm transition-all cursor-help ${i % 3 === 0 ? 'bg-emerald-500 shadow-sm' : 'bg-slate-100'}`}
              title={`Segment ${i}: High Vulnerability Match`} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
