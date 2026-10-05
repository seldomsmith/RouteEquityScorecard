"use client";

import React from 'react';

interface BusStopTicketProps {
  stopId: string;
  theme: 'emerald' | 'rose' | 'blue' | 'amber';
  stopName: string;
  grade: string;
  score: number;
  percentile: number;
  dailyTrips: number;
  peakTripsPerHour: number;
  routesServed: string[];
  daCount: number;
  tagline: string;
}

export const BusStopTicket: React.FC<BusStopTicketProps> = ({
  stopId,
  theme,
  stopName,
  grade,
  score,
  percentile,
  dailyTrips,
  peakTripsPerHour,
  routesServed,
  daCount,
  tagline,
}) => {
  const themeStyles = {
    emerald: {
      stripe: 'bg-emerald-600',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      title: 'text-emerald-950',
      accent: 'text-emerald-700',
      ring: 'border-emerald-200',
    },
    rose: {
      stripe: 'bg-rose-600',
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
      title: 'text-rose-950',
      accent: 'text-rose-700',
      ring: 'border-rose-200',
    },
    blue: {
      stripe: 'bg-blue-600',
      badge: 'bg-blue-50 text-blue-800 border-blue-200',
      title: 'text-blue-950',
      accent: 'text-blue-700',
      ring: 'border-blue-200',
    },
    amber: {
      stripe: 'bg-amber-600',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      title: 'text-amber-950',
      accent: 'text-amber-700',
      ring: 'border-amber-200',
    },
  }[theme];

  return (
    <div className="flex w-full bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Left Die-Cut Ticket Notch Stripe */}
      <div className={`w-14 flex-shrink-0 ${themeStyles.stripe} flex items-center justify-center relative select-none`}>
        <span
          className="font-mono font-black text-white text-xs tracking-widest uppercase"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          STOP #{stopId}
        </span>
        {/* Die-cut notch */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-white rounded-l-full border-y border-l border-slate-100" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs font-mono font-black rounded border ${themeStyles.badge}`}>
                Grade {grade}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                {percentile.toFixed(1)}th %ile
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equity Score</span>
              <span className={`ml-2 text-base font-mono font-black ${themeStyles.accent}`}>
                {score.toFixed(1)}
              </span>
            </div>
          </div>

          <h3 className={`text-lg font-black ${themeStyles.title} tracking-tight`}>
            {stopName}
          </h3>
          <p className="text-slate-600 text-xs mt-1 font-medium leading-relaxed">
            {tagline}
          </p>
        </div>

        {/* Dashed Separator & Micro-Metrics Grid */}
        <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Routes Served</div>
              <div className="text-xs font-mono font-black text-slate-900 mt-0.5">
                {routesServed.join(', ') || 'None'}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Trips</div>
              <div className="text-xs font-mono font-black text-slate-900 mt-0.5">
                {dailyTrips} trips
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Frequency</div>
              <div className="text-xs font-mono font-black text-slate-900 mt-0.5">
                {peakTripsPerHour.toFixed(1)}/hr
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">400m Buffer DAs</div>
              <div className="text-xs font-mono font-black text-slate-900 mt-0.5">
                {daCount} Census DAs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
