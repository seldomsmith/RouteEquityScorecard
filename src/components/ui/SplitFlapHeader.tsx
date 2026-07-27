"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ScoredRoute } from '@/hooks/useReactiveScoring';

interface SplitFlapHeaderProps {
  route: ScoredRoute;
  onClear: () => void;
}

// Sub-component for individual character tile
const SplitFlapTile: React.FC<{ char: string }> = ({ char }) => {
  const [displayChar, setDisplayChar] = useState(char);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (char === displayChar) return;
    
    setIsFlipping(true);
    let ticks = 0;
    const alphabet = "0123456789ABCDE";
    
    const interval = setInterval(() => {
      ticks++;
      if (ticks >= 5) {
        setDisplayChar(char);
        setIsFlipping(false);
        clearInterval(interval);
      } else {
        const rand = alphabet[Math.floor(Math.random() * alphabet.length)];
        setDisplayChar(rand);
      }
    }, 70);

    return () => clearInterval(interval);
  }, [char, displayChar]);

  return (
    <span 
      className={`relative inline-flex items-center justify-center bg-slate-900 text-white rounded font-mono font-bold text-xs shadow-[inset_0_-1px_2px_rgba(0,0,0,0.6)] border border-slate-950 w-4.5 h-6.5 text-center leading-none select-none overflow-hidden transition-transform duration-100 ${
        isFlipping ? 'scale-y-90' : 'scale-y-100'
      }`}
    >
      {displayChar}
      {/* Horizontal Split Line */}
      <span className="absolute inset-x-0 top-[50%] h-[1px] bg-black/60 shadow-[0_0.5px_0_rgba(255,255,255,0.1)]" />
    </span>
  );
};

// Sub-component for the larger Grade Tile
const GradeFlapTile: React.FC<{ grade: string }> = ({ grade }) => {
  const [displayGrade, setDisplayGrade] = useState(grade);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (grade === displayGrade) return;

    setIsFlipping(true);
    let ticks = 0;
    const grades = "ABCDE";

    const interval = setInterval(() => {
      ticks++;
      if (ticks >= 6) {
        setDisplayGrade(grade);
        setIsFlipping(false);
        clearInterval(interval);
      } else {
        const rand = grades[Math.floor(Math.random() * grades.length)];
        setDisplayGrade(rand);
      }
    }, 85);

    return () => clearInterval(interval);
  }, [grade, displayGrade]);

  const GRADE_COLORS: Record<string, string> = {
    A: 'bg-emerald-750 border-emerald-950',
    B: 'bg-blue-750 border-blue-950',
    C: 'bg-amber-700 border-amber-900',
    D: 'bg-orange-700 border-orange-900',
    E: 'bg-red-700 border-red-950',
  };

  const activeColor = GRADE_COLORS[displayGrade] || 'bg-slate-900 border-slate-950';

  return (
    <span 
      className={`relative inline-flex items-center justify-center ${activeColor} text-white rounded-lg font-mono font-black text-sm shadow-[inset_0_-1.5px_3px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.15)] border w-7 h-8.5 text-center leading-none select-none overflow-hidden transition-transform duration-100 ${
        isFlipping ? 'scale-y-75' : 'scale-y-100'
      }`}
    >
      {displayGrade}
      {/* Horizontal Split Line */}
      <span className="absolute inset-x-0 top-[50%] h-[1.5px] bg-black/60 shadow-[0_0.5px_0_rgba(255,255,255,0.15)]" />
    </span>
  );
};

export const SplitFlapHeader: React.FC<SplitFlapHeaderProps> = ({ route, onClear }) => {
  // Ensure route id is split to character array (padded to 3 characters)
  const routeCode = String(route.short_name || '').padStart(3, '0').slice(0, 3);
  const routeChars = routeCode.split('');

  return (
    <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Route ID Split Flaps */}
        <div className="flex gap-0.5">
          {routeChars.map((char, index) => (
            <SplitFlapTile key={index} char={char} />
          ))}
        </div>

        {/* Route Full Name */}
        <div className="flex-1 min-w-0 pl-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Isolated Route</p>
          <p className="text-[11px] font-bold text-slate-700 truncate leading-none">{route.name}</p>
        </div>
      </div>

      {/* Grade and Clear Controls */}
      <div className="flex items-center gap-2.5">
        <GradeFlapTile grade={route.grade} />
        
        <button
          onClick={onClear}
          className="p-1 hover:bg-slate-200/60 rounded text-slate-450 hover:text-slate-650 transition-colors"
          title="Clear Route Selection"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
