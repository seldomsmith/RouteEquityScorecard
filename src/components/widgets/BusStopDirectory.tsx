"use client";

import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, SlidersHorizontal, MapPin } from 'lucide-react';

export interface BusStopRecord {
  stop_id: string;
  stop_name: string;
  lon: number;
  lat: number;
  equal_score: number;
  economic_score: number;
  das: Array<{
    da_id: string;
    pct: number;
    equal_score: number;
    economic_score: number;
    econ: number;
    res: number;
    eth: number;
    sit: number;
  }>;
}

interface BusStopDirectoryProps {
  stops: BusStopRecord[];
  selectedStopId: string | null;
  mode: 'equal' | 'economic';
  onSelectStop: (stopId: string) => void;
  onClose?: () => void;
}

export const BusStopDirectory: React.FC<BusStopDirectoryProps> = ({
  stops,
  selectedStopId,
  mode,
  onSelectStop
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'name'>('desc');

  // Filter and sort stops
  const filteredStops = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let res = stops;

    if (term) {
      res = res.filter(
        (s) =>
          s.stop_id.toLowerCase().includes(term) ||
          s.stop_name.toLowerCase().includes(term) ||
          s.das.some((d) => d.da_id.includes(term))
      );
    }

    return [...res].sort((a, b) => {
      const scoreA = mode === 'equal' ? a.equal_score : a.economic_score;
      const scoreB = mode === 'equal' ? b.equal_score : b.economic_score;

      if (sortOrder === 'desc') return scoreB - scoreA;
      if (sortOrder === 'asc') return scoreA - scoreB;
      return a.stop_name.localeCompare(b.stop_name);
    });
  }, [stops, searchTerm, sortOrder, mode]);

  // Vulnerability score badge helper
  const getScoreBadge = (score: number) => {
    if (score >= 70) return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', label: 'High' };
    if (score >= 50) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', label: 'Mod-High' };
    if (score >= 35) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40', label: 'Moderate' };
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'Low' };
  };

  return (
    <div className="w-80 md:w-96 bg-slate-950/90 backdrop-blur-xl border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl z-30 transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base flex items-center gap-2 text-white">
            <MapPin className="w-4 h-4 text-cyan-400" /> Stop Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredStops.length.toLocaleString()} bus stops evaluated
          </p>
        </div>
      </div>

      {/* Controls: Search & Sort */}
      <div className="p-4 space-y-3 border-b border-slate-800/80 bg-slate-900/40">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Stop ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" /> Sort:
          </span>
          <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setSortOrder('desc')}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                sortOrder === 'desc' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Highest
            </button>
            <button
              onClick={() => setSortOrder('asc')}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                sortOrder === 'asc' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lowest
            </button>
            <button
              onClick={() => setSortOrder('name')}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                sortOrder === 'name' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Name
            </button>
          </div>
        </div>
      </div>

      {/* Stop List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-1">
        {filteredStops.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No bus stops found matching search.
          </div>
        ) : (
          filteredStops.map((stop) => {
            const isSelected = selectedStopId === stop.stop_id;
            const score = mode === 'equal' ? stop.equal_score : stop.economic_score;
            const badge = getScoreBadge(score);
            const primaryDa = stop.das[0];

            return (
              <button
                key={stop.stop_id}
                onClick={() => onSelectStop(stop.stop_id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-cyan-950/50 border border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                    : 'hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      #{stop.stop_id}
                    </span>
                    <span className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                      {stop.stop_name}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>DA {primaryDa ? primaryDa.da_id : 'N/A'} ({primaryDa ? `${primaryDa.pct}%` : '0%'})</span>
                    {stop.das.length > 1 && (
                      <span className="text-[10px] text-slate-500 bg-slate-900 px-1 rounded">
                        +{stop.das.length - 1} DAs
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`px-2 py-1 rounded-lg border ${badge.bg} ${badge.text} ${badge.border} text-right`}>
                    <div className="font-mono font-bold text-xs">{score.toFixed(1)}</div>
                    <div className="text-[9px] uppercase tracking-wider opacity-80">{badge.label}</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-cyan-400 transform translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'}`} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
