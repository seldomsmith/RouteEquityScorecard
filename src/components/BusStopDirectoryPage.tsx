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
  ArrowLeft,
  Download,
  Info
} from 'lucide-react';
import { BusStopRecord } from '@/components/widgets/BusStopDirectory';
import { BusStopGrade, GRADE_CONFIG } from '@/components/widgets/BusStopGradeLegend';
import { GlobalNavMenu, PageView } from '@/components/widgets/GlobalNavMenu';
import { checkIsRegional } from '@/utils/regional';
import { useRouteStore } from '@/store/routeStore';

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
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);

  // Read real DA population lookup from global store
  const daPopLookup = useRouteStore((s) => s.daPopLookup);

  // Load Bus Stop records
  useEffect(() => {
    fetch('/data/bus_stop_vulnerability.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stops) {
          // Apply client-side regional detector
          const mapped = data.stops.map((s: BusStopRecord) => {
            const regional = checkIsRegional(s.lat, s.lon);
            return {
              ...s,
              is_regional: regional,
            };
          });
          setStops(mapped);
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

  // Compute dynamic scores and realistic populations
  const processedStops = useMemo(() => {
    const numDims = activeDimensions.length || 4;
    const dimWeight = 1 / numDims;

    const scoredList = stops.map((s) => {
      if (!s.das || s.das.length === 0) {
        return {
          ...s,
          dynamicScore: s.is_regional ? 0 : s.equal_score,
          approxPop: s.is_regional ? 0 : 1200,
          neighborhood: s.is_regional ? 'Regional Transit Area' : 'Edmonton Central',
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

        // Use real DA population from lookup if available, fallback to a realistic baseline
        const realDaPop = daPopLookup[da.da_id] || 1650;
        approxPop += Math.round(realDaPop * overlapPct);
      });

      return {
        ...s,
        dynamicScore: s.is_regional ? 0 : Number(blendedSum.toFixed(1)),
        approxPop: s.is_regional ? 0 : Math.max(80, approxPop),
        neighborhood: s.is_regional 
          ? 'Regional Transit Area' 
          : (s.das[0] ? `DA ${s.das[0].da_id}` : 'Edmonton Central'),
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
  }, [stops, activeDimensions, daPopLookup]);

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

      if (sortField === 'stop_id') {
        return sortOrder === 'asc' 
          ? a.stop_id.localeCompare(b.stop_id, undefined, { numeric: true })
          : b.stop_id.localeCompare(a.stop_id, undefined, { numeric: true });
      }

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

  const handleExportCSV = () => {
    const headers = [
      'Stop ID',
      'Stop Name',
      'Is Regional',
      'Blended Score',
      'Catchment Population',
      'Grade'
    ];

    const rows = filteredStops.map((s) => {
      return [
        s.stop_id,
        s.stop_name,
        s.is_regional ? 'Yes' : 'No',
        s.dynamicScore.toFixed(1),
        s.approxPop,
        s.dynamicGrade
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ets_bus_stop_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs z-30 flex-shrink-0">
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
      <div className="flex-1 flex flex-col p-6 overflow-hidden w-full space-y-4">
        
        {/* Controls Bar & Search */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center flex-shrink-0">
          <div className="text-left">
            <h2 className="text-sm font-black text-slate-900 uppercase">Bus Stop Inventory</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {filteredStops.length.toLocaleString()} stop records loaded and scored
            </p>
          </div>

          <div className="flex items-center gap-3">
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
            
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Grade Distribution Bar - Matching Route Scorecard style */}
        <section className="bg-white px-6 py-3 border border-slate-200 shadow-sm rounded-2xl flex flex-col gap-2 flex-shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Grade Distribution</div>
          <div className="w-full h-8 rounded-lg overflow-hidden flex shadow-inner border border-slate-100">
            {(['A', 'B', 'C', 'D', 'E', 'Regional'] as const).map((g) => {
              const count = gradeCounts[g] || 0;
              const pct = processedStops.length > 0 ? (count / processedStops.length) * 100 : 0;
              const colorClass = g === 'A' ? 'bg-[#10B981]' 
                : g === 'B' ? 'bg-[#3B82F6]'
                : g === 'C' ? 'bg-[#F59E0B]'
                : g === 'D' ? 'bg-[#F97316]'
                : g === 'E' ? 'bg-[#EF4444]'
                : 'bg-[#94A3B8]';

              const activeClass = selectedGrade === g ? 'ring-4 ring-black/35 scale-y-105 z-10 shadow-lg' : 'hover:opacity-90';

              return (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(selectedGrade === g ? 'ALL' : g)}
                  style={{ width: `${Math.max(3, pct)}%` }}
                  className={`${colorClass} h-full transition-all duration-200 text-white flex items-center justify-center text-xs font-black relative group ${activeClass}`}
                  title={`Filter by Grade ${g} (${count} stops)`}
                >
                  <span>{g} ({count.toLocaleString()})</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Directory Table */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto custom-scrollbar">
          {loading ? (
            <div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading Edmonton Bus Stop Records...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-md z-10 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12"></th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors w-28" onClick={() => handleSort('stop_id')}>
                    <div className="flex items-center gap-1">
                      Stop ID <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Location & Catchment Neighbourhood <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-28 text-center">Grade</th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right w-36" onClick={() => handleSort('pop')}>
                    <div className="flex items-center justify-end gap-1">
                      Catchment Pop (400m) <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right w-36" onClick={() => handleSort('score')}>
                    <div className="flex items-center justify-end gap-1">
                      Equity Score <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right w-36" onClick={() => handleSort('percentile')}>
                    <div className="flex items-center justify-end gap-1">
                      City Percentile <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center w-36">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {filteredStops.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-400 font-medium">
                      No bus stops matching search or active filters.
                    </td>
                  </tr>
                ) : (
                  filteredStops.map((stop) => {
                    const isExpanded = expandedStopId === stop.stop_id;
                    const cfg = GRADE_CONFIG[stop.dynamicGrade];
                    const gradeColor = stop.is_regional ? 'bg-slate-450 border-slate-500'
                      : stop.dynamicGrade === 'A' ? 'bg-[#10B981] border-[#0F9F70]'
                      : stop.dynamicGrade === 'B' ? 'bg-[#3B82F6] border-[#2563EB]'
                      : stop.dynamicGrade === 'C' ? 'bg-[#F59E0B] border-[#D97706]'
                      : stop.dynamicGrade === 'D' ? 'bg-[#F97316] border-[#EA580C]'
                      : 'bg-[#EF4444] border-[#DC2626]';

                    // Compute CIMD Contributions for the stop
                    const dimContributions = (() => {
                      let econTotal = 0;
                      let resTotal = 0;
                      let ethTotal = 0;
                      let sitTotal = 0;
                      const numDims = activeDimensions.length || 4;
                      const dimWeight = 1 / numDims;

                      if (stop.das && stop.das.length > 0) {
                        stop.das.forEach((da) => {
                          const overlapPct = (da.pct || 0) / 100;
                          if (activeDimensions.includes('econ')) econTotal += (da.econ ?? 50) * dimWeight * overlapPct;
                          if (activeDimensions.includes('res')) resTotal += (da.res ?? 50) * dimWeight * overlapPct;
                          if (activeDimensions.includes('eth')) ethTotal += (da.eth ?? 50) * dimWeight * overlapPct;
                          if (activeDimensions.includes('sit')) sitTotal += (da.sit ?? 50) * dimWeight * overlapPct;
                        });
                      }
                      return [
                        { name: 'Economic Dependency', val: econTotal, color: '#C084FC' },
                        { name: 'Residential Instability', val: resTotal, color: '#60A5FA' },
                        { name: 'Ethno-cultural Composition', val: ethTotal, color: '#FBBF24' },
                        { name: 'Situational Vulnerability', val: sitTotal, color: '#F472B6' }
                      ];
                    })();

                    return (
                      <React.Fragment key={stop.stop_id}>
                        <tr 
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/50' : ''}`}
                          onClick={() => setExpandedStopId(isExpanded ? null : stop.stop_id)}
                        >
                          <td className="py-3 px-4 text-slate-450 text-center">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-[#1e3a8a]" /> : <ChevronRight className="w-4 h-4" />}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-[#1e3a8a]">
                            #{stop.stop_id}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-black text-slate-900 text-sm truncate max-w-lg">{stop.stop_name}</div>
                            <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" /> {stop.neighborhood}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-sm border ${gradeColor}`}>
                              {stop.dynamicGrade}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">
                            {stop.is_regional ? 'N/A' : stop.approxPop.toLocaleString()}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {stop.is_regional ? (
                              <span className="font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">0.0</span>
                            ) : (
                              <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                {stop.dynamicScore.toFixed(1)}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {stop.is_regional ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                Regional
                              </span>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-lg border font-mono font-black text-xs shadow-2xs ${cfg?.bg}`}>
                                {stop.dynamicPercentile !== null ? `${stop.dynamicPercentile.toFixed(1)}th` : 'N/A'}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectStopOnMap) {
                                  onSelectStopOnMap(stop.stop_id);
                                }
                                onNavigate?.('bus-stop-analysis');
                              }}
                              className="px-3 py-1 bg-slate-950 text-white hover:bg-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                            >
                              View on Map
                            </button>
                          </td>
                        </tr>

                        {/* Nested Dropdown — Upgraded with Vertical Table and Waterfall */}
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={8} className="py-4 px-6 border-l-2 border-slate-350">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* 1. Contributing DAs Vertical Table */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    <Layers className="w-4 h-4 text-[#1e3a8a]" />
                                    <span>Served Dissemination Areas (DAs)</span>
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                          <th className="pb-2">DA UID</th>
                                          <th className="pb-2 text-right">Walk Catchment Area %</th>
                                          <th className="pb-2 text-right">DA Population</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                        {stop.das && stop.das.length > 0 ? (
                                          stop.das.map((da) => {
                                            const realPop = daPopLookup[da.da_id] || 1650;
                                            return (
                                              <tr key={da.da_id} className="hover:bg-slate-55/40">
                                                <td className="py-2 font-mono font-bold text-slate-700">
                                                  {da.da_id}
                                                </td>
                                                <td className="py-2 text-right font-mono">
                                                  {da.pct}%
                                                </td>
                                                <td className="py-2 text-right font-mono font-bold">
                                                  {realPop.toLocaleString()}
                                                </td>
                                              </tr>
                                            );
                                          })
                                        ) : (
                                          <tr>
                                            <td colSpan={3} className="text-center py-4 text-slate-450 italic">
                                              No DA details available for this stop.
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* 2. Inline Waterfall Contribution Chart */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                                  <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                      <Info className="w-4 h-4 text-[#1e3a8a]" />
                                      <span>CIMD Dimensions Contribution Waterfall</span>
                                    </h4>
                                    <div className="space-y-3.5">
                                      {dimContributions.map((item) => {
                                        // Calculate percentage relative to max score of 100
                                        const pct = Math.min(100, item.val);
                                        return (
                                          <div key={item.name} className="space-y-1">
                                            <div className="flex justify-between items-center text-[10.5px]">
                                              <span className="text-slate-500 font-bold">{item.name}</span>
                                              <span className="font-mono font-black text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                +{item.val.toFixed(1)} pts
                                              </span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full rounded-full transition-all duration-300"
                                                style={{ width: `${pct}%`, backgroundColor: item.color }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span>Total Blended Score:</span>
                                    <span className="text-sm font-black font-mono text-slate-900">
                                      {stop.dynamicScore.toFixed(1)} / 100.0
                                    </span>
                                  </div>
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
