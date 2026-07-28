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
      const percentileA = mode === 'equal' 
        ? (a.equal_percentile ?? a.equal_score) 
        : (a.economic_percentile ?? a.economic_score);
      const percentileB = mode === 'equal' 
        ? (b.equal_percentile ?? b.equal_score) 
        : (b.economic_percentile ?? b.economic_score);

      if (sortOrder === 'desc') return percentileB - percentileA;
      if (sortOrder === 'asc') return percentileA - percentileB;
      return a.stop_name.localeCompare(b.stop_name);
    });
  }, [stops, searchTerm, sortOrder, mode]);

  // Vulnerability score badge helper
  const getScoreBadge = (score: number) => {
    if (score >= 70) return { bg: 'bg-red-50 text-red-700 border-red-200', label: 'High' };
    if (score >= 50) return { bg: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Mod-High' };
    if (score >= 35) return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Moderate' };
    return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Low' };
  };

  return (
    <div className="w-80 md:w-96 bg-white/95 backdrop-blur-xl border-l border-slate-200 text-slate-800 flex flex-col h-full shadow-2xl z-30 transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="font-bold text-base flex items-center gap-2 text-slate-900">
            <MapPin className="w-4 h-4 text-[#1e3a8a]" /> Stop Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {filteredStops.length.toLocaleString()} bus stops evaluated
          </p>
        </div>
      </div>

      {/* Controls: Search & Sort */}
      <div className="p-3.5 space-y-2.5 border-b border-slate-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Stop ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
          <span className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#1e3a8a]" /> Sort:
          </span>
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setSortOrder('desc')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                sortOrder === 'desc' ? 'bg-[#1e3a8a] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Highest
            </button>
            <button
              onClick={() => setSortOrder('asc')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                sortOrder === 'asc' ? 'bg-[#1e3a8a] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lowest
            </button>
            <button
              onClick={() => setSortOrder('name')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                sortOrder === 'name' ? 'bg-[#1e3a8a] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Name
            </button>
          </div>
        </div>
      </div>

      {/* Stop List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {filteredStops.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-medium">
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
                    ? 'bg-blue-50/80 border border-blue-200 shadow-md'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1e3a8a] bg-blue-100/80 px-1.5 py-0.5 rounded border border-blue-200">
                      #{stop.stop_id}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate group-hover:text-[#1e3a8a] transition-colors">
                      {stop.stop_name}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2 font-medium">
                    <span>DA {primaryDa ? primaryDa.da_id : 'N/A'} ({primaryDa ? `${primaryDa.pct}%` : '0%'})</span>
                    {stop.das.length > 1 && (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded border border-slate-200">
                        +{stop.das.length - 1} DAs
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {(() => {
                    const percentile = mode === 'equal' 
                      ? (stop.equal_percentile ?? stop.equal_score)
                      : (stop.economic_percentile ?? stop.economic_score);
                    const badge = getScoreBadge(percentile);
                    return (
                      <div className={`px-2.5 py-1 rounded-lg border ${badge.bg} text-right font-mono font-bold text-xs shadow-sm`}>
                        <div>{percentile.toFixed(0)}th %ile</div>
                        <div className="text-[8px] uppercase tracking-wider font-semibold opacity-90 text-slate-500">
                          Score: {score.toFixed(1)}
                        </div>
                      </div>
                    );
                  })()}
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#1e3a8a] translate-x-0.5' : 'text-slate-400 group-hover:text-slate-600'}`} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
