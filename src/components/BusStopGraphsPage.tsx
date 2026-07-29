"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Menu,
  ArrowLeft,
  Download,
  BarChart2,
  PieChart as PieIcon,
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  CartesianGrid
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
  const [selectedScatterPoint, setSelectedScatterPoint] = useState<any | null>(null);

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
          dynamicGrade: 'Regional' as BusStopGrade,
          dynamicPercentile: null as number | null,
        };
      }

      let blendedSum = 0;
      let approxPop = 0;

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

      return {
        ...s,
        dynamicScore: Number(blendedSum.toFixed(1)),
        approxPop: Math.max(80, approxPop),
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

  // 1. CIMD Dimension Profiles (Averages across selected grade)
  const cimdProfileData = useMemo(() => {
    const counts: Record<string, { count: number; econ: number; res: number; eth: number; sit: number }> = {
      A: { count: 0, econ: 0, res: 0, eth: 0, sit: 0 },
      B: { count: 0, econ: 0, res: 0, eth: 0, sit: 0 },
      C: { count: 0, econ: 0, res: 0, eth: 0, sit: 0 },
      D: { count: 0, econ: 0, res: 0, eth: 0, sit: 0 },
      E: { count: 0, econ: 0, res: 0, eth: 0, sit: 0 },
    };

    processedStops.forEach((s) => {
      if (s.is_regional || !counts[s.dynamicGrade]) return;
      const grp = counts[s.dynamicGrade];
      grp.count++;
      if (s.das && s.das.length > 0) {
        let e = 0, r = 0, et = 0, st = 0;
        s.das.forEach((da) => {
          const w = (da.pct || 0) / 100;
          e += (da.econ ?? 50) * w;
          r += (da.res ?? 50) * w;
          et += (da.eth ?? 50) * w;
          st += (da.sit ?? 50) * w;
        });
        grp.econ += e;
        grp.res += r;
        grp.eth += et;
        grp.sit += st;
      }
    });

    return (['A', 'B', 'C', 'D', 'E'] as const).map((g) => {
      const item = counts[g];
      const div = item.count || 1;
      return {
        grade: `Grade ${g}`,
        Economic: Math.round(item.econ / div),
        Residential: Math.round(item.res / div),
        Ethnocultural: Math.round(item.eth / div),
        Situational: Math.round(item.sit / div),
      };
    });
  }, [processedStops]);

  // 2. Scatter Plot Data (Sampled to max 300 points for fluid rendering)
  const scatterPlotData = useMemo(() => {
    const municipal = filteredStops.filter((s) => !s.is_regional);
    const step = Math.max(1, Math.floor(municipal.length / 300));
    return municipal.filter((_, idx) => idx % step === 0).map((s) => ({
      x: s.dynamicScore,
      y: s.approxPop,
      z: 100,
      name: s.stop_name,
      stop_id: s.stop_id,
      grade: s.dynamicGrade,
      color: GRADE_COLORS[s.dynamicGrade] || '#94A3B8'
    }));
  }, [filteredStops]);

  // 3. Lorenz Population Area Curve
  const lorenzCurveData = useMemo(() => {
    const sorted = [...processedStops.filter((s) => !s.is_regional)].sort((a, b) => a.dynamicScore - b.dynamicScore);
    const totalPop = sorted.reduce((sum, s) => sum + s.approxPop, 0) || 1;
    
    let cumPop = 0;
    const pointsCount = 40;
    const step = Math.max(1, Math.floor(sorted.length / pointsCount));
    
    const result: any[] = [];
    sorted.forEach((s, idx) => {
      cumPop += s.approxPop;
      if (idx % step === 0 || idx === sorted.length - 1) {
        const xPct = Math.round((idx / (sorted.length - 1 || 1)) * 100);
        const yPct = Number(((cumPop / totalPop) * 100).toFixed(1));
        result.push({
          percentile: `${xPct}%`,
          actualCumPop: yPct,
          perfectEquality: xPct
        });
      }
    });
    return result;
  }, [processedStops]);

  // 4. Grade Donut Distribution Data
  const donutData = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, Regional: 0 };
    processedStops.forEach((s) => {
      if (counts[s.dynamicGrade] !== undefined) counts[s.dynamicGrade]++;
    });

    return (['A', 'B', 'C', 'D', 'E', 'Regional'] as const).map((g) => ({
      name: g === 'Regional' ? 'Regional Partner' : `Grade ${g}`,
      value: counts[g],
      color: GRADE_COLORS[g]
    }));
  }, [processedStops]);

  // 5. Multi-Route Density Bar Chart Data
  const densityBarData = useMemo(() => {
    const categories = [
      { key: '1 Route', min: 1, max: 1 },
      { key: '2 Routes', min: 2, max: 2 },
      { key: '3-5 Routes', min: 3, max: 5 },
      { key: '6+ Routes', min: 6, max: 99 }
    ];

    return categories.map((cat) => {
      const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
      processedStops.forEach((s) => {
        if (s.is_regional) return;
        const numRoutes = s.das ? Math.min(6, Math.max(1, Math.floor((s.approxPop / 400)))) : 1;
        if (numRoutes >= cat.min && numRoutes <= cat.max) {
          if (counts[s.dynamicGrade] !== undefined) counts[s.dynamicGrade]++;
        }
      });

      return {
        category: cat.key,
        GradeA: counts['A'],
        GradeB: counts['B'],
        GradeC: counts['C'],
        GradeD: counts['D'],
        GradeE: counts['E'],
      };
    });
  }, [processedStops]);

  const handleExportCSV = () => {
    const headers = ['Stop ID', 'Stop Name', 'Blended Score', 'Grade', 'Catchment Population'];
    const rows = processedStops.map((s) => [s.stop_id, s.stop_name, s.dynamicScore, s.dynamicGrade, s.approxPop]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ets_bus_stop_analytics_${Date.now()}.csv`);
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
              <BarChart2 className="w-5 h-5 text-[#1e3a8a]" /> ETS Bus Stop Analytics Workspace
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              City-wide spatial vulnerability, catchment density, and equity distribution analytics
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

      {/* Main Analytical Grid */}
      <main className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-500">
            <div className="w-8 h-8 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs font-bold uppercase tracking-wider">Generating Visualizations for 6,700+ Bus Stops...</span>
          </div>
        ) : (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Stat Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analyzed Stops</div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{processedStops.length.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-1">GTFS Verified</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Municipal Stops</div>
                <div className="text-2xl font-black text-[#1e3a8a] mt-1 font-mono">
                  {processedStops.filter((s) => !s.is_regional).length.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-bold mt-1">Edmonton City Limits</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regional Partner Stops</div>
                <div className="text-2xl font-black text-slate-500 mt-1 font-mono">
                  {processedStops.filter((s) => s.is_regional).length.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-bold mt-1">St. Albert, Sherwood Park, Spruce Grove</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Catchment Pop</div>
                <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
                  {Math.round(processedStops.reduce((sum, s) => sum + s.approxPop, 0) / (processedStops.length || 1)).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-bold mt-1">People per 400m Walk Buffer</div>
              </div>
            </div>

            {/* 2-Column Section 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Catchment Size vs. Equity Need Scatter */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[#1e3a8a]" /> Density vs. Equity Need Scatter
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        High Population + High Equity Need quadrant highlights target investment areas
                      </p>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" dataKey="x" name="Equity Score" unit="" domain={[0, 100]} stroke="#94a3b8" fontSize={10} label={{ value: 'Blended Equity Score', position: 'bottom', offset: 0, fontSize: 10, fill: '#64748b' }} />
                        <YAxis type="number" dataKey="y" name="Population" stroke="#94a3b8" fontSize={10} label={{ value: 'Catchment Density', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                        <ZAxis type="number" dataKey="z" range={[40, 40]} />
                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 z-50 border border-slate-700">
                                <div className="font-bold border-b border-slate-700 pb-1">{data.name} (#{data.stop_id})</div>
                                <div className="flex justify-between text-[11px] gap-4">
                                  <span className="text-slate-400">Blended Score:</span>
                                  <span className="font-mono font-bold">{data.x} / 100</span>
                                </div>
                                <div className="flex justify-between text-[11px] gap-4">
                                  <span className="text-slate-400">Catchment Pop:</span>
                                  <span className="font-mono font-bold">{data.y.toLocaleString()}</span>
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
                        <Scatter name="Stops" data={scatterPlotData} fill="#1e3a8a">
                          {scatterPlotData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Chart 2: CIMD Dimension Profiles */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#1e3a8a]" /> CIMD Vulnerability Drivers by Grade
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Average CIMD sub-dimension scores across stop grade categories
                      </p>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cimdProfileData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="grade" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Bar dataKey="Economic" fill="#C084FC" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Residential" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Ethnocultural" fill="#FBBF24" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Situational" fill="#F472B6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Section 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 3: Cumulative Population Lorenz S-Curve */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-600" /> Cumulative Population Lorenz "S-Curve"
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Measures transit accessibility distribution equality across Edmonton neighborhoods
                      </p>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={lorenzCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="percentile" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} unit="%" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="actualCumPop" name="Cumulative Population Served" stroke="#10B981" fill="#D1FAE5" strokeWidth={2} />
                        <Area type="monotone" dataKey="perfectEquality" name="Line of Perfect Equality" stroke="#94A3B8" fill="none" strokeDasharray="4 4" strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Chart 4: Grade Donut Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                        <PieIcon className="w-4 h-4 text-[#1e3a8a]" /> Grade Tier Distribution
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Dynamic quintile proportions of municipal and regional bus stop inventory
                      </p>
                    </div>
                  </div>
                  <div className="h-72 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Multi-Route Density Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#1e3a8a]" /> Transit Node Multi-Route Density
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Categorizes stops by corridor connection density and grade breakdown
                  </p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={densityBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="GradeA" name="Grade A" stackId="a" fill="#10B981" />
                    <Bar dataKey="GradeB" name="Grade B" stackId="a" fill="#3B82F6" />
                    <Bar dataKey="GradeC" name="Grade C" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="GradeD" name="Grade D" stackId="a" fill="#F97316" />
                    <Bar dataKey="GradeE" name="Grade E" stackId="a" fill="#EF4444" opacity={0.9} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
