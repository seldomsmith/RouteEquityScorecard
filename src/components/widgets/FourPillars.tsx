"use client";

import React, { useState } from 'react';
import { Users, Target, Clock, Shield } from 'lucide-react';
import { BorderGlow } from '../BorderGlow';

export const FourPillars: React.FC = () => {
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleFlip = (idx: number) => {
    setFlippedCards(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const pillars = [
    {
      title: 'Transit Vulnerability',
      icon: Users,
      color: '#EF4444', // Red
      glowColor: '0 90 60',
      description: 'Measures demographic need along a route. Full priority points go to stops immediately adjacent to households with low-income, senior, youth, lone-parent, or visible minority residents.',
    },
    {
      title: 'Destination Opportunity',
      icon: Target,
      color: '#4F46E5', // Indigo
      glowColor: '240 90 60',
      description: 'Evaluates direct connections to key destinations. Points are awarded based on hospitals, employment centers, post-secondary schools, grocery stores, and primary/secondary schools within walking distance.',
    },
    {
      title: 'Off-Peak Service',
      icon: Clock,
      color: '#10B981', // Emerald Green
      glowColor: '150 90 60',
      description: 'Compares how frequently buses run late at night (9:30–10:30 PM) versus morning peak hours to evaluate transit service reliability for late night transit riders.',
    },
    {
      title: 'Transit Monopoly',
      icon: Shield,
      color: '#F59E0B', // Amber
      glowColor: '35 90 60',
      description: 'Identifies neighborhoods where a single route is the sole access provider. Areas without walking-distance alternatives score high, signaling dynamic transit isolation.',
    },
  ];

  return (
    <div className="w-full mt-4 flex flex-col gap-6 md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)]">
      <div className="text-center mb-2">
        <span className="text-sm font-black text-blue-900 uppercase tracking-wider block">The Four Pillars of Transit Equity</span>
        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
          Select/click each solid tile below to flip and inspect its methodology definition
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[220px]">
        {pillars.map((p, idx) => {
          const Icon = p.icon;
          const isFlipped = !!flippedCards[idx];

          return (
            <div 
              key={idx}
              onClick={() => toggleFlip(idx)}
              className="cursor-pointer group relative perspective w-full h-[290px]"
            >
              {/* Inner card with 3D rotation transition */}
              <div 
                className={`relative w-full h-full transition-transform duration-500 transform-style preserve-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* FRONT SIDE (Solid Color Card with BorderGlow) */}
                <div className="absolute inset-0 backface-hidden w-full h-full">
                  <BorderGlow
                    animated={true}
                    edgeSensitivity={30}
                    glowRadius={40}
                    glowIntensity={1.2}
                    coneSpread={25}
                    borderRadius={16}
                    backgroundColor={p.color}
                    glowColor={p.glowColor}
                    colors={[p.color]}
                    className="w-full h-full rounded-2xl shadow-md"
                  >
                    <div className="w-full h-full p-8 flex flex-col justify-between items-center text-center text-white">
                      <div className="p-3 bg-white/10 rounded-xl border border-white/20 mt-4">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-sm font-black uppercase tracking-wider leading-tight mb-4">
                        {p.title}
                      </span>
                    </div>
                  </BorderGlow>
                </div>

                {/* BACK SIDE (White/Slate Details Card with border layout) */}
                <div className="absolute inset-0 backface-hidden w-full h-full rotate-y-180 bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex flex-col justify-center select-none">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: p.color }}>
                      {p.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      {p.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
