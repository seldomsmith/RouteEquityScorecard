"use client";

import React from 'react';

interface RouteTicketProps {
  routeNumber: string;
  theme: 'blue' | 'orange';
  title: string;
  description: string;
  metrics?: { label: string; value: string | number }[];
}

export const RouteTicket: React.FC<RouteTicketProps> = ({
  routeNumber,
  theme,
  title,
  description,
  metrics,
}) => {
  const isBlue = theme === 'blue';
  
  // Theme styling definitions
  const stripeColor = isBlue ? 'bg-blue-600' : 'bg-yellow-500';
  const textColor = isBlue ? 'text-blue-900' : 'text-yellow-800';
  const ringColor = isBlue ? 'focus:ring-blue-500' : 'focus:ring-yellow-500';

  return (
    <div className="flex w-full min-h-[180px] bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Left Vertical Route Stripe */}
      <div className={`w-14 flex-shrink-0 ${stripeColor} flex items-center justify-center relative select-none`}>
        {/* Vertical Text rotated bottom-to-top */}
        <span 
          className="font-mono font-black text-white text-xs tracking-widest uppercase"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          ROUTE {routeNumber}
        </span>
        
        {/* White Inner Edge Notch */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-white rounded-l-full border-y border-l border-slate-100" />
      </div>

      {/* Main Card Content */}
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
        <div>
          <h3 className={`text-xl font-extrabold ${textColor} tracking-tight mb-2`}>
            {title}
          </h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {/* Dashed Separator and Metrics Grid (if provided) */}
        {metrics && metrics.length > 0 && (
          <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {metrics.map((m, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</span>
                  <span className={`text-xs font-mono font-black ${textColor}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
