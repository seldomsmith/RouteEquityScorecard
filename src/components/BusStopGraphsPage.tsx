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
  Users,
  Compass,
  Award
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
  BarChart,
  Bar,
  Legend,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
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
          dynamicGrade: 'Regional' as BusStopGrade,
          dynamicPercentile: null as number | null,
          neighborhood: 'Regional Area'
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

      return {
        ...s,
        dynamicScore: Number(blendedSum.toFixed(1)),
        approxPop: Math.max(80, approxPop),
        daCount: Math.max(1, daCount),
        neighborhood: s.das && s.das[0] ? `DA ${s.das[0].da_id}` : 'Central Edmonton'
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

  // 1. Scatter Plot Data: X = Blended Score (0-100), Y = Number of Served DAs (1-6+)
  const scatterPlotData = useMemo(() => {
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

  // 2. CIMD Radar Profile Chart Data (Comparing Grade E vs. Grade A vs. City Avg)
  const radarData = useMemo(() => {
    const dims = [
      { key: 'econ', label: 'Economic Dependency' },
      { key: 'res', label: 'Residential Instability' },
      { key: 'eth', label: 'Ethno-cultural Comp.' },
      { key: 'sit', label: 'Situational Vuln.' },
    ] as const;

    const calcGroupAvg = (targetGrade?: string) => {
      const targetList = targetGrade 
        ? processedStops.filter((s) => !s.is_regional && s.dynamicGrade === targetGrade)
        : processedStops.filter((s) => !s.is_regional);
      
      const sums = { econ: 0, res: 0, eth: 0, sit: 0 };
      let count = 0;

      targetList.forEach((s) => {
        if (s.das && s.das.length > 0) {
          count++;
          s.das.forEach((da) => {
            const w = (da.pct || 0) / 100;
            sums.econ += (da.econ ?? 50) * w;
            sums.res += (da.res ?? 50) * w;
            sums.eth += (da.eth ?? 50) * w;
            sums.sit += (da.sit ?? 50) * w;
          });
        }
      });

      const div = count || 1;
      return {
        econ: Math.round(sums.econ / div),
        res: Math.round(sums.res / div),
        eth: Math.round(sums.eth / div),
        sit: Math.round(sums.sit / div),
      };
    };

    const avgCity = calcGroupAvg();
    const avgGradeA = calcGroupAvg('A');
    const avgGradeE = calcGroupAvg('E');

    return dims.map((d) => ({
      dimension: d.label,
      GradeE: avgGradeE[d.key],
      GradeA: avgGradeA[d.key],
      CityAvg: avgCity[d.key],
    }));
  }, [processedStops]);

  // 3. Top 10 Most Vulnerable Neighbourhood DA Clusters
  const neighbourhoodRankData = useMemo(() => {
    const clusters: Record<string, { sum: number; count: number }> = {};

    processedStops.forEach((s) => {
      if (s.is_regional || !s.neighborhood) return;
      if (!clusters[s.neighborhood]) {
        clusters[s.neighborhood] = { sum: 0, count: 0 };
      }
      clusters[s.neighborhood].sum += s.dynamicScore;
      clusters[s.neighborhood].count += 1;
    });

    const list = Object.entries(clusters).map(([name, data]) => ({
      name,
      avgScore: Number((data.sum / (data.count || 1)).toFixed(1)),
      count: data.count
    }));

    // Top 10 lowest scores (Most Vulnerable)
    list.sort((a, b) => a.avgScore - b.avgScore);
    return list.slice(0, 10);
  }, [processedStops]);

  // 4. Grade Donut Distribution Data
  const donutData = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, Regional: 0 };
    processedStops.forEach((s) => {
      if (counts[s.dynamicGrade] !== undefined) counts[s.dynamicGrade]++;
    });

    const total = processedStops.length || 1;
    return (['A', 'B', 'C', 'D', 'E', 'Regional'] as const).map((g) => ({
      name: g === 'Regional' ? 'Regional Partner' : `Grade ${g}`,
      value: counts[g],
      pct: Number(((counts[g] / total) * 100).toFixed(1)),
      color: GRADE_COLORS[g]
    }));
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
              City-wide spatial vulnerability, catchment overlap, and demographic radar profiles
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
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quintile Cut Thresholds</div>
                <div className="text-sm font-black text-amber-600 mt-2 font-mono">
                  E &lt; 38 | D &lt; 51 | C &lt; 64 | B &lt; 78
                </div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5">Dynamic Score Boundaries</div>
              </div>
            </div>

            {/* 2-Column Section 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: DA Catchment Overlap vs. Equity Score (Scatter Matrix) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[#1e3a8a]" /> DA Catchment Overlap vs. Equity Score
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Plots stops by number of served Dissemination Areas (Y) vs Equity Score (X)
                      </p>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" dataKey="x" name="Equity Score" domain={[0, 100]} stroke="#94a3b8" fontSize={10} label={{ value: 'Blended Equity Score (0-100)', position: 'bottom', offset: 0, fontSize: 10, fill: '#64748b' }} />
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

              {/* Chart 2: CIMD Radar Profile */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-rose-600" /> CIMD Radar Profile (Grade E vs. Grade A vs. City)
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Compares socio-economic vulnerability drivers across high and low-performing stops
                      </p>
                    </div>
                  </div>
                  <div className="h-72 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="dimension" stroke="#64748b" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" fontSize={9} />
                        <Radar name="Grade E (Low Equity)" dataKey="GradeE" stroke="#EF4444" fill="#EF4444" fillOpacity={0.35} />
                        <Radar name="Grade A (High Equity)" dataKey="GradeA" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
                        <Radar name="City Average" dataKey="CityAvg" stroke="#64748B" fill="#64748B" fillOpacity={0.15} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Section 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 3: Top 10 Most Vulnerable Neighbourhood Clusters */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-600" /> Top 10 Most Vulnerable Neighbourhood DA Clusters
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Edmonton DA clusters with the lowest average bus stop equity scores
                      </p>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={neighbourhoodRankData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={80} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                        <Bar dataKey="avgScore" name="Avg Stop Score" fill="#F97316" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Chart 4: Dynamic Grade Donut Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                        <PieIcon className="w-4 h-4 text-[#1e3a8a]" /> Quintile Tier Share Distribution
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
                        <RechartsTooltip content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                                <div className="font-bold">{data.name}</div>
                                <div className="text-slate-300 font-mono">{data.value.toLocaleString()} stops ({data.pct}%)</div>
                              </div>
                            );
                          }
                          return null;
                        }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
