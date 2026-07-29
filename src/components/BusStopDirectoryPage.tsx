"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Menu,
  Layers,
  ArrowUpDown,
  Building2,
  ArrowLeft
} from 'lucide-react';
import { BusStopRecord } from '@/components/widgets/BusStopDirectory';
import { BusStopGrade, GRADE_CONFIG } from '@/components/widgets/BusStopGradeLegend';
import { GlobalNavMenu, PageView } from '@/components/widgets/GlobalNavMenu';

export type CimdDimensionKey = 'econ' | 'res' | 'eth' | 'sit';

interface BusStopDirectoryPageProps {
  onNavigate?: (page: PageView) => void;
  onSelectStopOnMap?: (stopId: string) => void;
}

export const BusStopDirectoryPage: React.FC<BusStopDirectoryPageProps> = ({
  onNavigate,
  onSelectStopOnMap,
}) => {
  const [stops, setStops] = useState<BusStopRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [activeDimensions, setActiveDimensions] = useState<CimdDimensionKey[]>(['econ', 'res', 'eth', 'sit']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<BusStopGrade | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'stop_id' | 'name' | 'pop' | 'score' | 'percentile'>('percentile');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);

  // Load Bus Stop records
  useEffect(() => {
    fetch('/data/bus_stop_vulnerability.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stops) {
          setStops(data.stops);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load bus_stop_vulnerability.json:', err);
        setLoading(false);
      });
  }, []);

  const handleToggleDimension = (dim: CimdDimensionKey) => {
    setActiveDimensions((prev) => {
      if (prev.includes(dim)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dim);
      }
      return [...prev, dim];
    });
  };

  // Compute dynamic scores
  const processedStops = useMemo(() => {
    const numDims = activeDimensions.length || 4;
    const dimWeight = 1 / numDims;

    const scoredList = stops.map((s) => {
      if (!s.das || s.das.length === 0) {
        return {
          ...s,
          dynamicScore: s.equal_score,
          approxPop: 1200,
          neighborhood: 'Edmonton Central',
        };
      }

      let blendedSum = 0;
      let approxPop = 0;

      s.das.forEach((da) => {
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
        ...s,
        dynamicScore: Number(blendedSum.toFixed(1)),
        approxPop: Math.max(150, approxPop),
        neighborhood: s.das[0] ? `DA ${s.das[0].da_id}` : 'Edmonton Central',
      };
    });

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

  const gradesList: (BusStopGrade | 'ALL')[] = ['ALL', 'A', 'B', 'C', 'D', 'E', 'Regional'];

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navigation Overlay Menu */}
      <GlobalNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        onNavigate={onNavigate}
        activeItemIndex={5}
      />

      {/* Header Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate?.('bus-stop-analysis')}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Map
          </button>

          <div className="h-4 w-[1px] bg-slate-200" />

          <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1e3a8a]" /> ETS BUS STOP DIRECTORY
          </h1>

          <button
            onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
            className="px-3 py-1.5 text-[10px] font-bold text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all uppercase tracking-wider shadow-xs flex items-center gap-1.5"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>MENU</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isNavMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* CIMD Criteria Weight Controls */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">
            Criteria Weights ({(100 / (activeDimensions.length || 4)).toFixed(0)}% each):
          </span>
          {(
            [
              { key: 'econ', label: 'Economic' },
              { key: 'res', label: 'Residential' },
              { key: 'eth', label: 'Ethnocultural' },
              { key: 'sit', label: 'Situational' },
            ] as const
          ).map((dim) => {
            const isActive = activeDimensions.includes(dim.key);
            return (
              <button
                key={dim.key}
                onClick={() => handleToggleDimension(dim.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#1e3a8a] text-white shadow-xs'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {dim.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Page Content */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden max-w-7xl mx-auto w-full space-y-4">
        
        {/* Controls Bar & Grade Filter Tabs */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          
          {/* Grade Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {gradesList.map((g) => {
              const count = gradeCounts[g] || 0;
              const isSelected = selectedGrade === g;
              const cfg = g !== 'ALL' ? GRADE_CONFIG[g] : null;

              return (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
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
                  <span>{g === 'ALL' ? 'All Bus Stops' : `Grade ${g}`}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {count.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Stop ID or Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading Edmonton Bus Stop Records...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-md z-10 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12"></th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('stop_id')}>
                    <div className="flex items-center gap-1">
                      Stop ID <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Location & Catchment Neighborhood <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right" onClick={() => handleSort('pop')}>
                    <div className="flex items-center justify-end gap-1">
                      Pop (400m) <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right" onClick={() => handleSort('score')}>
                    <div className="flex items-center justify-end gap-1">
                      Blended Score <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right" onClick={() => handleSort('percentile')}>
                    <div className="flex items-center justify-end gap-1">
                      City Percentile <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStops.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-400 font-medium">
                      No bus stops matching search or active filters.
                    </td>
                  </tr>
                ) : (
                  filteredStops.map((stop) => {
                    const isExpanded = expandedStopId === stop.stop_id;
                    const cfg = GRADE_CONFIG[stop.dynamicGrade];

                    return (
                      <React.Fragment key={stop.stop_id}>
                        <tr 
                          className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                          onClick={() => setExpandedStopId(isExpanded ? null : stop.stop_id)}
                        >
                          <td className="py-3.5 px-4 text-slate-400">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-[#1e3a8a]" /> : <ChevronRight className="w-4 h-4" />}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-[#1e3a8a]">
                            #{stop.stop_id}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">{stop.stop_name}</div>
                            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400" /> {stop.neighborhood}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                            {stop.approxPop.toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              {stop.dynamicScore.toFixed(1)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {stop.is_regional ? (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                Regional / N/A
                              </span>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs shadow-2xs ${cfg?.bg}`}>
                                {stop.dynamicPercentile !== null ? `${stop.dynamicPercentile.toFixed(1)}th %ile` : 'N/A'}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectStopOnMap) {
                                  onSelectStopOnMap(stop.stop_id);
                                }
                                onNavigate?.('bus-stop-analysis');
                              }}
                              className="px-3 py-1.5 text-[11px] font-bold text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all"
                            >
                              View on Map
                            </button>
                          </td>
                        </tr>

                        {/* Nested DA Contribution Sub-Row */}
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
          )}
        </div>
      </div>
    </div>
  );
};
