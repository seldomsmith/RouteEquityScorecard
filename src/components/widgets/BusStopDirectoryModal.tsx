"use client";

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Users, 
  SlidersHorizontal, 
  Layers,
  ArrowUpDown,
  Building2,
  Info
} from 'lucide-react';
import { BusStopRecord } from '@/components/widgets/BusStopDirectory';
import { BusStopGrade, GRADE_CONFIG } from '@/components/widgets/BusStopGradeLegend';

export type CimdDimensionKey = 'econ' | 'res' | 'eth' | 'sit';

interface BusStopDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stops: BusStopRecord[];
  selectedStopId: string | null;
  activeDimensions: CimdDimensionKey[];
  onSelectStop: (stopId: string) => void;
}

export const BusStopDirectoryModal: React.FC<BusStopDirectoryModalProps> = ({
  isOpen,
  onClose,
  stops,
  selectedStopId,
  activeDimensions,
  onSelectStop,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<BusStopGrade | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'stop_id' | 'name' | 'pop' | 'score' | 'percentile'>('percentile');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);

  // Calculate dynamic score for a stop based on selected CIMD dimensions
  const getDynamicScore = (stop: BusStopRecord): { score: number; pop: number } => {
    if (!stop.das || stop.das.length === 0) {
      return { score: stop.equal_score, pop: 1200 };
    }

    const numDims = activeDimensions.length || 4;
    const dimWeight = 1 / numDims;

    let blendedSum = 0;
    let approxPop = 0;

    stop.das.forEach((da) => {
      let daDimScore = 0;
      if (activeDimensions.includes('econ')) daDimScore += (da.econ ?? 50) * dimWeight;
      if (activeDimensions.includes('res')) daDimScore += (da.res ?? 50) * dimWeight;
      if (activeDimensions.includes('eth')) daDimScore += (da.eth ?? 50) * dimWeight;
      if (activeDimensions.includes('sit')) daDimScore += (da.sit ?? 50) * dimWeight;

      const overlapPct = (da.pct || 0) / 100;
      blendedSum += daDimScore * overlapPct;
      approxPop += Math.round(1800 * overlapPct);
    });

    return { 
      score: Number(blendedSum.toFixed(1)), 
      pop: Math.max(150, approxPop) 
    };
  };

  // Pre-calculate stops with computed dynamic scores and percentiles
  const processedStops = useMemo(() => {
    // Compute dynamic scores
    const scoredList = stops.map((s) => {
      const { score, pop } = getDynamicScore(s);
      return {
        ...s,
        dynamicScore: score,
        approxPop: pop,
        neighborhood: s.das[0] ? `DA ${s.das[0].da_id}` : 'Edmonton Central',
      };
    });

    // Rank city stops for percentile
    const sortedCity = [...scoredList.filter((s) => !s.is_regional)].sort((a, b) => a.dynamicScore - b.dynamicScore);
    const totalCity = sortedCity.length || 1;

    const rankMap: Record<string, number> = {};
    sortedCity.forEach((s, idx) => {
      rankMap[s.stop_id] = Number(((idx / (totalCity - 1 || 1)) * 100).toFixed(1));
    });

    return scoredList.map((s) => {
      const percentile = s.is_regional ? null : (rankMap[s.stop_id] ?? 50);
      let grade: BusStopGrade = 'C';
      if (s.is_regional) grade = 'Regional';
      else if (percentile !== null) {
        if (percentile >= 80) grade = 'A';
        else if (percentile >= 60) grade = 'B';
        else if (percentile >= 40) grade = 'C';
        else if (percentile >= 20) grade = 'D';
        else grade = 'E';
      }

      return {
        ...s,
        dynamicPercentile: percentile,
        dynamicGrade: grade,
      };
    });
  }, [stops, activeDimensions]);

  // Grade Counts
  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: processedStops.length, A: 0, B: 0, C: 0, D: 0, E: 0, Regional: 0 };
    processedStops.forEach((s) => {
      if (counts[s.dynamicGrade] !== undefined) counts[s.dynamicGrade]++;
    });
    return counts;
  }, [processedStops]);

  // Filtered and Sorted list
  const filteredStops = useMemo(() => {
    let list = processedStops;

    if (selectedGrade !== 'ALL') {
      list = list.filter((s) => s.dynamicGrade === selectedGrade);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((s) => 
        s.stop_id.toLowerCase().includes(term) ||
        s.stop_name.toLowerCase().includes(term) ||
        s.neighborhood.toLowerCase().includes(term)
      );
    }

    return list.sort((a, b) => {
      let valA: any = a[sortField === 'score' ? 'dynamicScore' : sortField === 'percentile' ? 'dynamicPercentile' : sortField === 'pop' ? 'approxPop' : sortField];
      let valB: any = b[sortField === 'score' ? 'dynamicScore' : sortField === 'percentile' ? 'dynamicPercentile' : sortField === 'pop' ? 'approxPop' : sortField];

      if (valA === null || valA === undefined) valA = -1;
      if (valB === null || valB === undefined) valB = -1;

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [processedStops, selectedGrade, searchTerm, sortField, sortOrder]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (!isOpen) return null;

  const gradesList: (BusStopGrade | 'ALL')[] = ['ALL', 'A', 'B', 'C', 'D', 'E', 'Regional'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1e3a8a] text-white rounded-xl shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                ETS Bus Stop Directory
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive 6,750+ Bus Stop Equity Database & Dissemination Area Contributions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls & Grade Filter Tabs */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          
          {/* Grade Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {gradesList.map((g) => {
              const count = gradeCounts[g] || 0;
              const isSelected = selectedGrade === g;
              const cfg = g !== 'ALL' ? GRADE_CONFIG[g] : null;

              return (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cfg && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white"
                      style={{ backgroundColor: cfg.color }}
                    />
                  )}
                  <span>{g === 'ALL' ? 'All Stops' : `Grade ${g}`}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {count.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Stop ID or Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-md z-10 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12"></th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('stop_id')}>
                  <div className="flex items-center gap-1">
                    Stop ID <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    Location & Neighborhood <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right" onClick={() => handleSort('pop')}>
                  <div className="flex items-center justify-end gap-1">
                    Pop (400m) <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right" onClick={() => handleSort('score')}>
                  <div className="flex items-center justify-end gap-1">
                    Blended Score <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right" onClick={() => handleSort('percentile')}>
                  <div className="flex items-center justify-end gap-1">
                    City Percentile <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 font-medium">
                    No bus stops matching active filters.
                  </td>
                </tr>
              ) : (
                filteredStops.map((stop) => {
                  const isExpanded = expandedStopId === stop.stop_id;
                  const cfg = GRADE_CONFIG[stop.dynamicGrade];

                  return (
                    <React.Fragment key={stop.stop_id}>
                      <tr 
                        className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                          selectedStopId === stop.stop_id ? 'bg-blue-50/80 font-bold' : ''
                        }`}
                        onClick={() => setExpandedStopId(isExpanded ? null : stop.stop_id)}
                      >
                        <td className="py-3 px-4 text-slate-400">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-[#1e3a8a]" /> : <ChevronRight className="w-4 h-4" />}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-[#1e3a8a]">
                          #{stop.stop_id}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{stop.stop_name}</div>
                          <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" /> {stop.neighborhood}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                          {stop.approxPop.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {stop.dynamicScore.toFixed(1)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {stop.is_regional ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              Regional / N/A
                            </span>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs shadow-2xs ${cfg?.bg}`}>
                              {stop.dynamicPercentile !== null ? `${stop.dynamicPercentile.toFixed(1)}th %ile` : 'N/A'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStop(stop.stop_id);
                              onClose();
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all"
                          >
                            View on Map
                          </button>
                        </td>
                      </tr>

                      {/* Nested DA Contribution Expansion Sub-Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={7} className="p-4 pl-12">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5" /> Contributing Dissemination Areas (400m Walk Radius)
                                </span>
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  {stop.das.length} Intersecting DAs
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {stop.das.map((da) => {
                                  const pct = da.pct || 0;
                                  const numDims = activeDimensions.length || 4;
                                  const dimWeight = 1 / numDims;

                                  const daDimScore = (da.econ ?? 50) * (activeDimensions.includes('econ') ? dimWeight : 0) +
                                                     (da.res ?? 50) * (activeDimensions.includes('res') ? dimWeight : 0) +
                                                     (da.eth ?? 50) * (activeDimensions.includes('eth') ? dimWeight : 0) +
                                                     (da.sit ?? 50) * (activeDimensions.includes('sit') ? dimWeight : 0);

                                  const netContrib = (daDimScore * (pct / 100)).toFixed(1);

                                  return (
                                    <div key={da.da_id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                                      <div>
                                        <div className="font-mono font-bold text-slate-800">DA {da.da_id}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">
                                          Area Overlap: <strong className="text-slate-700">{pct}%</strong>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-mono font-bold text-[#1e3a8a]">+{netContrib} pts</div>
                                        <div className="text-[9px] text-slate-400 uppercase font-semibold">
                                          DA Score: {daDimScore.toFixed(0)}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Showing <strong>{filteredStops.length.toLocaleString()}</strong> of <strong>{stops.length.toLocaleString()}</strong> bus stops in Edmonton network
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
