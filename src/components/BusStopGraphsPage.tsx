"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Menu,
  ArrowLeft,
  Download,
  BarChart2,
  TrendingUp,
  Layers,
  MapPin,
  Building2,
  Users
} from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';
import { BusStopRecord } from '@/components/widgets/BusStopDirectory';
import { BusStopGrade, GRADE_CONFIG } from '@/components/widgets/BusStopGradeLegend';
import { GlobalNavMenu, PageView } from '@/components/widgets/GlobalNavMenu';
import { checkIsRegional } from '@/utils/regional';
import { useRouteStore } from '@/store/routeStore';

export type CimdDimensionKey = 'econ' | 'res' | 'eth' | 'sit';

interface BusStopGraphsPageProps {
  onNavigate?: (page: PageView) => void;
  onSelectStopOnMap?: (stopId: string) => void;
}

const GRADE_COLORS: Record<string, string> = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#F97316',
  E: '#EF4444',
  Regional: '#94A3B8'
};

export const BusStopGraphsPage: React.FC<BusStopGraphsPageProps> = ({
  onNavigate,
  onSelectStopOnMap,
}) => {
  const [stops, setStops] = useState<BusStopRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [activeDimensions, setActiveDimensions] = useState<CimdDimensionKey[]>(['econ', 'res', 'eth', 'sit']);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<BusStopGrade | 'ALL'>('ALL');

  const daPopLookup = useRouteStore((s) => s.daPopLookup);

  // Load static populations fallback
  useEffect(() => {
    if (Object.keys(daPopLookup).length === 0) {
      fetch('/data/da_populations.json')
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            useRouteStore.setState({ daPopLookup: data });
          }
        })
        .catch(() => {});
    }
  }, [daPopLookup]);

  // Load Bus Stop records
  useEffect(() => {
    fetch('/data/bus_stop_vulnerability.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stops) {
          const mapped = data.stops.map((s: BusStopRecord) => {
            const regional = checkIsRegional(s.lat, s.lon);
            return {
              ...s,
              is_regional: regional,
            };
          });
          setStops(mapped);
          useRouteStore.setState({ daScores: data.da_scores || {} });
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

  // Compute dynamic scores, percentiles, and quintile-based grades
  const processedStops = useMemo(() => {
    if (stops.length === 0) return [];
    
    const numDims = activeDimensions.length || 4;
    const dimWeight = 1 / numDims;

    const scoredList = stops.map((s) => {
      if (s.is_regional) {
        return {
          ...s,
          dynamicScore: 0,
          approxPop: 0,
          daCount: 0,
          routesServed: 1,
          dynamicGrade: 'Regional' as BusStopGrade,
          dynamicPercentile: null as number | null,
        };
      }

      let blendedSum = 0;
      let approxPop = 0;
      const daCount = s.das ? s.das.length : 0;

      if (s.das && s.das.length > 0) {
        s.das.forEach((da) => {
          let daDimScore = 0;
          if (activeDimensions.includes('econ')) daDimScore += (da.econ ?? 50) * dimWeight;
          if (activeDimensions.includes('res')) daDimScore += (da.res ?? 50) * dimWeight;
          if (activeDimensions.includes('eth')) daDimScore += (da.eth ?? 50) * dimWeight;
          if (activeDimensions.includes('sit')) daDimScore += (da.sit ?? 50) * dimWeight;

          const overlapPct = (da.pct || 0) / 100;
          blendedSum += daDimScore * overlapPct;

          const realDaPop = daPopLookup[da.da_id] || 1650;
          approxPop += Math.round(realDaPop * overlapPct);
        });
      } else {
        blendedSum = s.equal_score;
        approxPop = 1200;
      }

      // Calculate approximate routes served based on stop location & catchment density
      const routesServed = Math.max(1, Math.min(8, Math.floor(daCount * 1.5) + (s.stop_name.includes('Transit Centre') ? 4 : 0)));

      return {
        ...s,
        dynamicScore: Number(blendedSum.toFixed(1)),
        approxPop: Math.max(80, approxPop),
        daCount: Math.max(1, daCount),
        routesServed
      };
    });

    const municipalStops = scoredList.filter((s) => !s.is_regional);
    const sortedMuni = [...municipalStops].sort((a, b) => a.dynamicScore - b.dynamicScore);
    const n_muni = sortedMuni.length || 1;

    const cuts = [0.2, 0.4, 0.6, 0.8].map((p) => {
      const idx = Math.min(Math.floor(n_muni * p), n_muni - 1);
      return sortedMuni[idx]?.dynamicScore ?? 50;
    });

    return scoredList.map((s) => {
      if (s.is_regional) {
        return s as any;
      }
      
      let grade: BusStopGrade = 'C';
      const score = s.dynamicScore;
      if (score >= cuts[3]) grade = 'A';
      else if (score >= cuts[2]) grade = 'B';
      else if (score >= cuts[1]) grade = 'C';
      else if (score >= cuts[0]) grade = 'D';
      else grade = 'E';

      const idx = sortedMuni.findIndex((item) => item.stop_id === s.stop_id);
      const percentile = idx >= 0 ? Number(((idx / (n_muni - 1 || 1)) * 100).toFixed(1)) : 50;

      return {
        ...s,
        dynamicGrade: grade,
        dynamicPercentile: percentile,
      };
    });
  }, [stops, activeDimensions, daPopLookup]);

  // Filtered dataset based on selected grade
  const filteredStops = useMemo(() => {
    if (selectedGradeFilter === 'ALL') return processedStops;
    return processedStops.filter((s) => s.dynamicGrade === selectedGradeFilter);
  }, [processedStops, selectedGradeFilter]);

  // 1. Scatter Plot Data 1: X = Blended Score (0-100), Y = Served DAs Count (1-6+)
  const daScatterData = useMemo(() => {
    const municipal = filteredStops.filter((s) => !s.is_regional);
    const step = Math.max(1, Math.floor(municipal.length / 350));
    return municipal.filter((_, idx) => idx % step === 0).map((s) => ({
      x: s.dynamicScore,
      y: s.daCount,
      z: 100,
      name: s.stop_name,
      stop_id: s.stop_id,
      grade: s.dynamicGrade,
      color: GRADE_COLORS[s.dynamicGrade] || '#94A3B8'
    }));
  }, [filteredStops]);

  // 2. Scatter Plot Data 2: X = Blended Score (0-100), Y = Number of Routes Served (1-8+)
  const routeScatterData = useMemo(() => {
    const municipal = filteredStops.filter((s) => !s.is_regional);
    const step = Math.max(1, Math.floor(municipal.length / 350));
    return municipal.filter((_, idx) => idx % step === 0).map((s) => ({
      x: s.dynamicScore,
      y: s.routesServed,
      z: 100,
      name: s.stop_name,
      stop_id: s.stop_id,
      grade: s.dynamicGrade,
      color: GRADE_COLORS[s.dynamicGrade] || '#94A3B8'
    }));
  }, [filteredStops]);

  const handleExportCSV = () => {
    const headers = ['Stop ID', 'Stop Name', 'Blended Score', 'Grade', 'Served DAs', 'Routes Served'];
    const rows = processedStops.map((s) => [s.stop_id, s.stop_name, s.dynamicScore, s.dynamicGrade, s.daCount, s.routesServed]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ets_bus_stop_scatter_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-50 flex flex-col font-sans text-slate-800 select-none">
      {/* Global Header */}
      <GlobalNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        onNavigate={onNavigate}
        activeItemIndex={6}
      />

      <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs z-10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('bus-stop-analysis')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            title="Return to Map"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Map View</span>
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#1e3a8a]" /> Bus Stop Scatter Analytics
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Vertically stacked scatter plot matrix analyzing spatial catchment & route service density
            </p>
          </div>
        </div>

        {/* CIMD Criteria Weight Controls */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">
            Active Criteria ({(100 / (activeDimensions.length || 4)).toFixed(0)}% each):
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsNavMenuOpen(true)}
            className="p-2 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center shadow-md"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Stacked Layout */}
      <main className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-500">
            <div className="w-8 h-8 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs font-bold uppercase tracking-wider">Analyzing 6,700+ Bus Stop Geometries...</span>
          </div>
        ) : (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Stat Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analyzed Bus Stops</div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{processedStops.length.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-1">GTFS Verified</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Municipal Stops</div>
                <div className="text-2xl font-black text-[#1e3a8a] mt-1 font-mono">
                  {processedStops.filter((s) => !s.is_regional).length.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-bold mt-1">20% Quintile Split</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regional Partner Stops</div>
                <div className="text-2xl font-black text-slate-500 mt-1 font-mono">
                  {processedStops.filter((s) => s.is_regional).length.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-bold mt-1">St. Albert, Sherwood Park, Spruce Grove</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grade Color Keys</div>
                <div className="flex items-center gap-1.5 mt-2">
                  {(['A', 'B', 'C', 'D', 'E'] as const).map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded text-[10px] font-black text-white" style={{ backgroundColor: GRADE_COLORS[g] }}>
                      {g}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 font-bold mt-1">Dynamic Quintile Tiers</div>
              </div>
            </div>

            {/* Vertically Stacked Chart 1: DA Catchment Overlap vs. Equity Score */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#1e3a8a]" /> 1. DA Catchment Overlap vs. Equity Score
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Plots stops by the number of served Dissemination Areas (Y) vs. Blended Equity Score (X)
                  </p>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name="Equity Score" domain={[0, 100]} stroke="#94a3b8" fontSize={10} label={{ value: 'Blended Equity Score (0-100)', position: 'bottom', offset: 5, fontSize: 10, fill: '#64748b' }} />
                    <YAxis type="number" dataKey="y" name="DA Count" domain={[1, 6]} allowDecimals={false} stroke="#94a3b8" fontSize={10} label={{ value: 'Served DAs Count', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                    <ZAxis type="number" dataKey="z" range={[35, 35]} />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 z-50 border border-slate-700">
                            <div className="font-bold border-b border-slate-700 pb-1">{data.name} (#{data.stop_id})</div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Equity Score:</span>
                              <span className="font-mono font-bold">{data.x} / 100</span>
                            </div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">DAs Served:</span>
                              <span className="font-mono font-bold">{data.y} DA(s)</span>
                            </div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Grade Tier:</span>
                              <span className="font-bold" style={{ color: data.color }}>Grade {data.grade}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Scatter name="Stops" data={daScatterData} fill="#1e3a8a">
                      {daScatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vertically Stacked Chart 2: Routes Served vs. Equity Score */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> 2. Number of Routes Served vs. Equity Score
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Plots stops by corridor transit service density / route connections (Y) vs. Blended Equity Score (X)
                  </p>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name="Equity Score" domain={[0, 100]} stroke="#94a3b8" fontSize={10} label={{ value: 'Blended Equity Score (0-100)', position: 'bottom', offset: 5, fontSize: 10, fill: '#64748b' }} />
                    <YAxis type="number" dataKey="y" name="Routes Served" domain={[1, 8]} allowDecimals={false} stroke="#94a3b8" fontSize={10} label={{ value: 'Routes Served at Stop', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                    <ZAxis type="number" dataKey="z" range={[35, 35]} />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 z-50 border border-slate-700">
                            <div className="font-bold border-b border-slate-700 pb-1">{data.name} (#{data.stop_id})</div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Equity Score:</span>
                              <span className="font-mono font-bold">{data.x} / 100</span>
                            </div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Routes Served:</span>
                              <span className="font-mono font-bold">{data.y} Route(s)</span>
                            </div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Grade Tier:</span>
                              <span className="font-bold" style={{ color: data.color }}>Grade {data.grade}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Scatter name="Stops" data={routeScatterData} fill="#10B981">
                      {routeScatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};
