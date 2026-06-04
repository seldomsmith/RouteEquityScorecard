"use client";

import { useWeightingStore } from '@/store/useWeightingStore';

const Slider = ({ label, value, onChange, description }: any) => (
  <div className="mb-5 group relative">
    <div className="flex justify-between mb-1.5 items-center">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
        <div className="tooltip-trigger relative">
          <div className="w-3 h-3 rounded-full bg-slate-100 flex items-center justify-center text-[7px] font-black text-slate-400 cursor-help">?</div>
          <div className="tooltip-content absolute z-50 left-0 bottom-full mb-2 w-48 bg-slate-900 text-white p-3 rounded-xl text-[8px] font-medium leading-relaxed shadow-2xl pointer-events-none">
            {description}
            <div className="absolute top-full left-2 border-4 border-transparent border-t-slate-900" />
          </div>
        </div>
      </div>
      <span className="text-[10px] font-black text-emerald-600">{(value * 100).toFixed(0)}%</span>
    </div>
    <input 
      type="range" min="0" max="1" step="0.05" value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
    />
  </div>
);

export const WeightingControls = () => {
  const store = useWeightingStore();

  return (
    <div className="p-6 bg-white border-b border-slate-200">
      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 text-center">Policy Weighting</h3>
      
      <Slider 
        label="Social Vulnerability" 
        value={store.vulnerability} 
        onChange={(v: any) => store.setWeight('vulnerability', v)} 
        description="Prioritizes routes serving high-needs demographics (low income, zero-vehicle households)."
      />
      <Slider 
        label="Off Peak Service" 
        value={store.temporal} 
        onChange={(v: any) => store.setWeight('temporal', v)} 
        description="Measures how consistent service is during off-peak and weekend hours."
      />
      <Slider 
        label="Network Monopoly" 
        value={store.monopoly} 
        onChange={(v: any) => store.setWeight('monopoly', v)} 
        description="Highlights routes that are the ONLY option for specific neighborhoods."
      />
      <Slider 
        label="Opportunity Access" 
        value={store.opportunity} 
        onChange={(v: any) => store.setWeight('opportunity', v)} 
        description="Connects routes to key social infrastructure like hospitals and grocery stores."
      />
    </div>
  );
};
