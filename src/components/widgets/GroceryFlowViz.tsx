import React, { useState, useEffect } from 'react';
import { Store, ShoppingCart, User } from 'lucide-react';

export const GroceryFlowViz = () => {
  const [isEquityAdjusted, setIsEquityAdjusted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsEquityAdjusted(prev => !prev);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 mt-2 md:-mx-12 lg:-mx-24 w-full md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)]">
      
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Destination Quality
          </span>
          <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide mt-2">Utility Flow Simulation</h4>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setIsEquityAdjusted(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${!isEquityAdjusted ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Raw Spatial View
          </button>
          <button
            onClick={() => setIsEquityAdjusted(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${isEquityAdjusted ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Equity-Adjusted View
          </button>
        </div>
      </div>

      {/* Interactive Diagram Area */}
      <div className="relative h-64 w-full bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-between px-4 sm:px-12 py-8">
        
        {/* Left Side: Grocery Stores */}
        <div className="flex flex-col justify-between h-full z-10 w-40 gap-8">
          
          {/* Discount Grocer */}
          <div className="flex flex-col items-center bg-white p-3 rounded-xl border-2 border-emerald-500 shadow-sm relative">
            <Store className="w-8 h-8 text-emerald-600 mb-1" />
            <span className="text-[10px] font-bold text-slate-700 uppercase text-center">Discount Grocer</span>
            <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </div>

          {/* Luxury Grocer */}
          <div className={`flex flex-col items-center bg-white p-3 rounded-xl border-2 transition-colors duration-500 relative ${isEquityAdjusted ? 'border-rose-300 opacity-75' : 'border-emerald-500 shadow-sm'}`}>
            <Store className={`w-8 h-8 mb-1 transition-colors duration-500 ${isEquityAdjusted ? 'text-rose-400' : 'text-emerald-600'}`} />
            <span className="text-[10px] font-bold text-slate-700 uppercase text-center">Luxury Specialty</span>
            <div className={`absolute -right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-500 ${isEquityAdjusted ? 'bg-rose-400' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'}`} />
            
            {/* Price Tag Lock Overlay when Equity Adjusted */}
            <div className={`absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center transition-all duration-500 ${isEquityAdjusted ? 'opacity-100 backdrop-blur-[1px]' : 'opacity-0 pointer-events-none'}`}>
               <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 rotate-[-10deg]">-80% Utility</span>
            </div>
          </div>
        </div>

        {/* Center: Particle Flow Paths (SVG) */}
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center pt-8">
          <svg viewBox="0 0 500 250" className="opacity-80 w-full h-full max-w-[500px]" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            
            {/* Top Path (Discount Grocer to User) */}
            <path 
              d="M 120,60 C 250,60 300,125 400,125" 
              fill="none" 
              stroke="url(#grad-green)" 
              strokeWidth="4" 
              className="animate-flow"
              strokeDasharray="8 8"
            />
            
            {/* Bottom Path (Luxury Grocer to User) */}
            <path 
              d="M 120,190 C 250,190 300,125 400,125" 
              fill="none" 
              stroke={isEquityAdjusted ? "url(#grad-red)" : "url(#grad-green)"} 
              strokeWidth={isEquityAdjusted ? "2" : "4"} 
              className={isEquityAdjusted ? "animate-flow-slow" : "animate-flow"}
              strokeDasharray={isEquityAdjusted ? "4 12" : "8 8"}
              style={{ transition: 'all 0.5s ease-in-out' }}
            />
          </svg>
        </div>

        {/* Right Side: The Transit Rider */}
        <div className="flex flex-col items-center bg-white p-4 rounded-full border-4 border-blue-100 shadow-lg z-10 relative mr-4 sm:mr-12">
          <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
          <User className="w-10 h-10 text-blue-600 mb-1" />
          <span className="text-xs font-black text-slate-800 uppercase">Transit Rider</span>
          
          <div className="mt-2 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold font-mono text-slate-700 transition-all duration-500">
              {isEquityAdjusted ? '1.2' : '2.0'}
            </span>
          </div>
        </div>

      </div>
      
      {/* Caption Text */}
      <div className="text-center h-12 flex items-center justify-center">
         <p className="text-xs text-slate-500 italic transition-opacity duration-300">
           {isEquityAdjusted 
             ? "The luxury store remains physically accessible, but its high prices form an economic barrier, severely reducing its practical utility to low-income riders."
             : "In our spatial analysis of opportunity destinations, both grocery stores are treated as providing equal value to the rider simply because they are physically reachable but if one grocery store is for luxury or higher-end products, they may not provide the same value to a member of an equity seeking community."}
         </p>
      </div>

    </div>
  );
};
