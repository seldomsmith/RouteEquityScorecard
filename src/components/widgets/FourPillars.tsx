import React, { useState } from 'react';
import { Compass, Users, Target, Clock, Shield } from 'lucide-react';

export const FourPillars: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const pillars = [
    {
      title: 'Transit Vulnerability',
      icon: Users,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      barColor: 'bg-rose-500',
      description: 'Measures the demographic makeup along the route. High density of low-income, senior, youth, single-parent, and visible minority households represents high vulnerability priority.',
      stat: 'Pillar weight: 25%',
    },
    {
      title: 'Destination Opportunity',
      icon: Target,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      barColor: 'bg-indigo-500',
      description: 'Evaluates direct connections to key destinations. Points are awarded based on hospitals, employment centers, post-secondary schools, grocery stores, and primary/secondary schools within walking distance.',
      stat: 'Pillar weight: 25%',
    },
    {
      title: 'Off-Peak Service',
      icon: Clock,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      barColor: 'bg-emerald-500',
      description: 'Measures bus route service frequency and availability outside peak hours (evenings, late nights, Saturdays, and Sundays). Helps assess service for late-shift workers.',
      stat: 'Pillar weight: 25%',
    },
    {
      title: 'Transit Monopoly',
      icon: Shield,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      barColor: 'bg-amber-500',
      description: 'Assesses neighborhood reliance on a single route. Areas without nearby alternative bus lines, ODT zones, or LRT stations score high, representing high monopoly dependence.',
      stat: 'Pillar weight: 25%',
    },
  ];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6 md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)]">
      <div className="text-center">
        <span className="text-sm font-black text-blue-900 uppercase tracking-wider">The Four Pillars of Transit Equity</span>
        <p className="text-xs text-slate-500 mt-1">Select each pillar below to explore what is measured and how it dictates route scores</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {pillars.map((p, idx) => {
          const Icon = p.icon;
          const isActive = idx === activeTab;
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center text-center gap-2 ${
                isActive 
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20' 
                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className={`p-2.5 rounded-xl border ${p.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 leading-tight">{p.title}</span>
            </button>
          );
        })}
      </div>

      <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl animate-fadeIn transition-all duration-300 min-h-[120px] flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${pillars[activeTab].barColor}`} />
            {pillars[activeTab].title}
          </h4>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            {pillars[activeTab].description}
          </p>
        </div>
        <div className="border-t border-slate-200/60 pt-3 mt-3 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
          <span>{pillars[activeTab].stat}</span>
          <span className="text-blue-600 font-extrabold">Active metric</span>
        </div>
      </div>
    </div>
  );
};
