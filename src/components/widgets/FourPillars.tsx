"use client";

import React from 'react';
import { Users, Target, Clock, Shield } from 'lucide-react';
import { BorderGlow } from '../BorderGlow';

export const FourPillars: React.FC = () => {
  const pillars = [
    {
      title: 'Transit Vulnerability',
      icon: Users,
      color: '#EF4444', // Red
      glowColor: '0 90 60',
      description: 'Tracks demographic data along a route. Priority points go to stops adjacent to households with low-income, senior, youth, lone-parent, or visible minority residents.',
    },
    {
      title: 'Destination Opportunity',
      icon: Target,
      color: '#4F46E5', // Indigo
      glowColor: '240 90 60',
      description: 'Evaluates connections to specific destinations. Points are awarded based on hospitals, employment centres, post-secondary schools, grocery stores, and primary/secondary schools within walking distance.',
    },
    {
      title: 'Off-Peak Service',
      icon: Clock,
      color: '#10B981', // Emerald Green
      glowColor: '150 90 60',
      description: 'Compares how frequently buses run late at night (9:30 PM to 10:30 PM) versus morning peak hours to evaluate transit reliability for late night riders.',
    },
    {
      title: 'Transit Monopoly',
      icon: Shield,
      color: '#F59E0B', // Amber
      glowColor: '35 90 60',
      description: 'Identifies neighbourhoods where a single route is the only transit provider. Areas without walking-distance alternatives score high.',
    },
  ];

  return (
    <div className="w-full mt-4 flex flex-col gap-6 md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)]">
      <div className="text-center mb-2">
        <span className="text-sm font-black text-blue-900 uppercase tracking-wider block">The Four Pillars of Transit Equity</span>
        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
          Explore the four core dimensions used to calculate transit equity network-wide.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[220px]">
        {pillars.map((p, idx) => {
          const Icon = p.icon;

          return (
            <div 
              key={idx}
              className="group relative w-full h-[320px]"
            >
              <BorderGlow
                animated={true}
                edgeSensitivity={30}
                glowRadius={40}
                glowIntensity={1.2}
                coneSpread={25}
                borderRadius={16}
                backgroundColor="transparent"
                glowColor={p.glowColor}
                colors={[p.color]}
                className="w-full h-full rounded-2xl shadow-sm"
              >
                {/* Inner Card Container */}
                <div 
                  className="w-full h-full flex flex-col bg-white rounded-2xl border-2 overflow-hidden"
                  style={{ borderColor: p.color }}
                >
                  {/* Top Segment: Colored Header */}
                  <div 
                    className="p-5 flex flex-col items-center justify-center text-center text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    <div className="p-2.5 bg-white/15 rounded-lg border border-white/20 mb-2">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider leading-tight">
                      {p.title}
                    </span>
                  </div>

                  {/* Bottom Segment: White Text Body */}
                  <div className="flex-1 p-5 flex flex-col justify-start bg-white overflow-y-auto custom-scrollbar">
                    <p className="text-[11px] text-slate-655 leading-relaxed font-semibold">
                      {p.description}
                    </p>
                  </div>
                </div>
              </BorderGlow>
            </div>
          );
        })}
      </div>
    </div>
  );
};
