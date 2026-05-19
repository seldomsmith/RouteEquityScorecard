"use client";

import React from 'react';
import { useUIStore } from '@/store/useUIStore';

export const EquityRidershipQuadrant = () => {
  const routes = useUIStore((state) => state.allRouteMetrics) || [];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full flex flex-col shadow-sm">
      <header className="mb-4">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
          Strategic Ridership Quadrant
        </h3>
        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Equity Index vs. Operational Volume</p>
      </header>
      
      <div className="flex-1 relative border-l-2 border-b-2 border-slate-100 m-4">
        <div className="absolute top-2 left-2 text-[8px] font-black text-emerald-600 uppercase opacity-40">Essential Social Lifelines</div>
        <div className="absolute top-2 right-2 text-[8px] font-black text-slate-400 uppercase opacity-40">Operational Workhorses</div>
        
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <div className="w-px h-full bg-slate-900" />
          <div className="h-px w-full bg-slate-900 absolute" />
        </div>

        {routes.map((r, i) => {
          const xPos = Math.min(95, (r.pop_served / 15000) * 100);
          const yPos = r.rei_score;
          
          return (
            <div 
              key={i}
              className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-500 cursor-pointer hover:scale-150 ${yPos > 60 ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'}`}
              style={{ 
                left: `${xPos}%`, 
                bottom: `${yPos}%` 
              }}
              title={`${r.route_name}: Score ${yPos}`}
            />
          );
        })}

        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[7px] font-black text-slate-400 uppercase tracking-widest">Population Served (Volume)</div>
        <div className="absolute -left-10 top-1/2 -rotate-90 text-[7px] font-black text-slate-400 uppercase tracking-widest">Equity Score (REI)</div>
      </div>
    </div>
  );
};
