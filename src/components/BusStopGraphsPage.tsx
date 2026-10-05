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
  Users,
  Clock,
  GitCommit
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
  Cell,
  BarChart,
  Bar
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
  const baseRoutes = useRouteStore((s) => s.baseRoutes) || [];

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
          tripsPerHour: 2,
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

      // Pure GTFS service schedule metrics (no synthetic formula approximations)
      const routesList = s.routes_served ?? [];
      const routesServed = s.route_count ?? (routesList.length > 0 ? routesList.length : null);
      const tripsPerHour = s.peak_trips_per_hour ?? null;
      const offpeakTripsPerHour = s.offpeak_trips_per_hour ?? null;
      const dailyTrips = s.daily_trips ?? null;

      return {
        ...s,
        dynamicScore: Number(blendedSum.toFixed(1)),
        approxPop: Math.max(80, approxPop),
        daCount: Math.max(1, daCount),
        routesServed,
        routesList,
        tripsPerHour,
        offpeakTripsPerHour,
        dailyTrips
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

  // 2. Scatter Plot Data 2: X = Blended Score (0-100), Y = Verified GTFS Routes Served
  const routeScatterData = useMemo(() => {
    // Only plot stops that have verified GTFS schedule data (nulls are excluded from scatter plotting)
    const validScheduledStops = filteredStops.filter((s) => !s.is_regional && s.routesServed !== null && s.routesServed !== undefined);
    const step = Math.max(1, Math.floor(validScheduledStops.length / 350));
    return validScheduledStops.filter((_, idx) => idx % step === 0).map((s) => ({
      x: s.dynamicScore,
      y: s.routesServed,
      routesList: s.routesList,
      z: 100,
      name: s.stop_name,
      stop_id: s.stop_id,
      grade: s.dynamicGrade,
      color: GRADE_COLORS[s.dynamicGrade] || '#94A3B8'
    }));
  }, [filteredStops]);

  // 3. Scatter Plot Data 3: Stop Equity vs Verified GTFS Service Frequency (Peak Trips/Hr)
  const frequencyScatterData = useMemo(() => {
    // Only plot stops that have verified GTFS schedule arrival records
    const validScheduledStops = filteredStops.filter((s) => !s.is_regional && s.tripsPerHour !== null && s.tripsPerHour !== undefined);
    const step = Math.max(1, Math.floor(validScheduledStops.length / 350));
    return validScheduledStops.filter((_, idx) => idx % step === 0).map((s) => ({
      x: s.dynamicScore,
      y: s.tripsPerHour,
      offpeakY: s.offpeakTripsPerHour,
      dailyTrips: s.dailyTrips,
      z: 100,
      name: s.stop_name,
      stop_id: s.stop_id,
      grade: s.dynamicGrade,
      color: GRADE_COLORS[s.dynamicGrade] || '#94A3B8'
    }));
  }, [filteredStops]);

  // 4. Route Grade Disparity Ratio Bar Chart Data (Actual Min & Max Stop Score per GTFS Route)
  const routeDisparityData = useMemo(() => {
    if (processedStops.length === 0) return [];

    // Group actual stop scores by route short name
    const routeScoresMap = new Map<string, number[]>();
    processedStops.forEach((s) => {
      if (s.is_regional || !s.routesList || s.routesList.length === 0) return;
      s.routesList.forEach((rName) => {
        if (!routeScoresMap.has(rName)) {
          routeScoresMap.set(rName, []);
        }
        routeScoresMap.get(rName)!.push(s.dynamicScore);
      });
    });

    // Select the top 20 most frequent routes or routes present in baseRoutes
    const candidateRouteNames = Array.from(routeScoresMap.keys())
      .filter((rName) => routeScoresMap.get(rName)!.length >= 4) // routes with at least 4 served stops
      .sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      })
      .slice(0, 20);

    return candidateRouteNames.map((rName) => {
      const scores = routeScoresMap.get(rName)!;
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const spread = Number((maxScore - minScore).toFixed(1));

      // Find matching route grade from baseRoutes if available
      const matchedRoute = baseRoutes.find((br) => String(br.short_name) === rName || String(br.route_id) === rName);
      const grade = (matchedRoute?.grade as BusStopGrade) || (spread > 40 ? 'D' : spread > 25 ? 'C' : 'B');

      return {
        routeName: `Route ${rName}`,
        scoreRange: [minScore, maxScore],
        minScore,
        maxScore,
        spread,
        stopsSampled: scores.length,
        color: GRADE_COLORS[grade] || '#64748B'
      };
    });
  }, [processedStops, baseRoutes]);

  // 5. Corridors of Vulnerability Scatter Plot Data (Route Length vs Actual Average Stop Equity)
  const corridorsScatterData = useMemo(() => {
    if (!baseRoutes || baseRoutes.length === 0) return [];

    // Map verified routes directly; no synthetic or hardcoded placeholder networks
    return baseRoutes
      .filter((r) => !r.is_regional && (r.route_length_km ?? 0) > 0)
      .map((r) => ({
        x: Number((r.route_length_km || 0).toFixed(1)),
        y: Math.round(r.composite_score),
        z: 100,
        routeName: `Route ${r.short_name} (${r.name})`,
        grade: r.grade,
        color: GRADE_COLORS[r.grade] || '#64748B'
      }));
  }, [baseRoutes]);

  const handleExportCSV = () => {
    const headers = [
      'Stop ID', 
      'Stop Name', 
      'Blended Score', 
      'Grade', 
      'Served DAs', 
      'GTFS Route Count', 
      'GTFS Routes Served', 
      'Peak Trips/Hour', 
      'Off-Peak Trips/Hour', 
      'Daily Weekday Trips'
    ];
    const rows = processedStops.map((s) => [
      s.stop_id, 
      s.stop_name, 
      s.dynamicScore, 
      s.dynamicGrade, 
      s.daCount, 
      s.routesServed ?? '', 
      (s.routesList || []).join('; '), 
      s.tripsPerHour ?? '', 
      s.offpeakTripsPerHour ?? '', 
      s.dailyTrips ?? ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ets_bus_stop_analytics_matrix_${Date.now()}.csv`);
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
              <BarChart2 className="w-5 h-5 text-[#1e3a8a]" /> ETS Bus Stop & Route Analytics Matrix
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Vertically stacked analytics matrix combining stop-level catchments with corridor-level service operations
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
            {/* Operational Summary Ribbon */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 divide-x divide-slate-100">
                <div className="pr-2">
                  <div className="text-[11px] font-semibold text-slate-500">Analyzed Bus Stops</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold font-mono text-slate-900">{processedStops.length.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-500 font-medium">GTFS active network</span>
                  </div>
                </div>
                <div className="pl-6 pr-2">
                  <div className="text-[11px] font-semibold text-slate-500">Edmonton Stops</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold font-mono text-slate-800">
                      {processedStops.filter((s) => !s.is_regional).length.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Quintile evaluated</span>
                  </div>
                </div>
                <div className="pl-6 pr-2">
                  <div className="text-[11px] font-semibold text-slate-500">Regional Stops</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold font-mono text-slate-600">
                      {processedStops.filter((s) => s.is_regional).length.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Adjacent municipalities</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Grade scale:</span>
                <div className="flex items-center gap-1.5">
                  {(['A', 'B', 'C', 'D', 'E'] as const).map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs" style={{ backgroundColor: GRADE_COLORS[g] }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Vertically Stacked Chart 1: DA Catchment Overlap vs. Equity Score */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-600" /> 1. DA Catchment Overlap vs. Equity Score
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Distribution of bus stops by overlapping Dissemination Areas (Y) relative to Blended Equity Score (X)
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
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-600" /> 2. Number of Routes Served vs. Equity Score
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Corridor route connectivity (Y) relative to Blended Equity Score (X)
                  </p>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name="Equity Score" domain={[0, 100]} stroke="#94a3b8" fontSize={10} label={{ value: 'Blended Equity Score (0-100)', position: 'bottom', offset: 5, fontSize: 10, fill: '#64748b' }} />
                    <YAxis type="number" dataKey="y" name="Routes Served" domain={[1, 'auto']} allowDecimals={false} stroke="#94a3b8" fontSize={10} label={{ value: 'GTFS Routes Served at Stop', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                    <ZAxis type="number" dataKey="z" range={[35, 35]} />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const routesList = (data.routesList || []).join(', ');
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50 border border-slate-700 max-w-xs">
                            <div className="font-bold border-b border-slate-700 pb-1">{data.name} (#{data.stop_id})</div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Equity Score:</span>
                              <span className="font-mono font-bold">{data.x} / 100</span>
                            </div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Routes Served:</span>
                              <span className="font-mono font-bold">{data.y} Route(s)</span>
                            </div>
                            {routesList && (
                              <div className="text-[10px] text-emerald-300 font-mono bg-slate-800/80 p-1 rounded border border-slate-700/50 break-words">
                                Routes: {routesList}
                              </div>
                            )}
                            <div className="flex justify-between text-[11px] gap-4 pt-0.5">
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

            {/* Vertically Stacked Chart 3: Stop Equity vs. Route Service Frequency */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" /> 3. Stop Equity vs. Corridor Service Frequency (Peak Trips/Hour)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hourly peak departures relative to equity need using verified weekday GTFS schedules
                  </p>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name="Equity Score" domain={[0, 100]} stroke="#94a3b8" fontSize={10} label={{ value: 'Blended Equity Score (0-100)', position: 'bottom', offset: 5, fontSize: 10, fill: '#64748b' }} />
                    <YAxis type="number" dataKey="y" name="Trips per Hour" domain={[0, 'auto']} allowDecimals={false} stroke="#94a3b8" fontSize={10} label={{ value: 'Peak Trips / Hour', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                    <ZAxis type="number" dataKey="z" range={[35, 35]} />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50 border border-slate-700">
                            <div className="font-bold border-b border-slate-700 pb-1">{data.name} (#{data.stop_id})</div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Equity Score:</span>
                              <span className="font-mono font-bold">{data.x} / 100</span>
                            </div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Peak Frequency:</span>
                              <span className="font-mono font-bold">{data.y} Trips / Hr</span>
                            </div>
                            {data.offpeakY !== null && data.offpeakY !== undefined && (
                              <div className="flex justify-between text-[11px] gap-4">
                                <span className="text-slate-400">Off-Peak Frequency:</span>
                                <span className="font-mono font-bold text-slate-300">{data.offpeakY} Trips / Hr</span>
                              </div>
                            )}
                            {data.dailyTrips !== null && data.dailyTrips !== undefined && (
                              <div className="flex justify-between text-[11px] gap-4">
                                <span className="text-slate-400">Daily Weekday Trips:</span>
                                <span className="font-mono text-purple-300">{data.dailyTrips} departures</span>
                              </div>
                            )}
                            <div className="flex justify-between text-[11px] gap-4 pt-0.5">
                              <span className="text-slate-400">Grade Tier:</span>
                              <span className="font-bold" style={{ color: data.color }}>Grade {data.grade}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Scatter name="Stops" data={frequencyScatterData} fill="#8B5CF6">
                      {frequencyScatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vertically Stacked Chart 4: Route Grade Disparity Ratio Range Bars */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-slate-600" /> 4. Route Equity Disparity Ratio (Stop Score Range per Corridor)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Spread between minimum and maximum stop equity scores along sampled corridors
                  </p>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={routeDisparityData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="routeName" stroke="#94a3b8" fontSize={9} interval={0} angle={-35} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} label={{ value: 'Equity Score Range (0-100)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                    <RechartsTooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <div className="font-bold border-b border-slate-700 pb-1">{data.routeName}</div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Min Stop Score:</span>
                              <span className="font-mono font-bold text-rose-400">{data.minScore}</span>
                            </div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Max Stop Score:</span>
                              <span className="font-mono font-bold text-emerald-400">{data.maxScore}</span>
                            </div>
                            <div className="flex justify-between text-[11px] gap-4">
                              <span className="text-slate-400">Disparity Spread:</span>
                              <span className="font-mono font-bold text-amber-400">{data.spread} points</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Bar dataKey="scoreRange" name="Score Disparity Range" radius={[4, 4, 4, 4]}>
                      {routeDisparityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vertically Stacked Chart 5: Corridors of Vulnerability */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-600" /> 5. Corridors of Vulnerability (Route Length vs. Averaged Stop Equity)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Transit corridors plotted by length in kilometers (X) relative to route composite equity score (Y)
                  </p>
                </div>
              </div>
              <div className="h-80 w-full">
                {corridorsScatterData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                    Loading verified transit corridors...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" dataKey="x" name="Route Length" unit=" km" domain={[0, 40]} stroke="#94a3b8" fontSize={10} label={{ value: 'Route Length (km)', position: 'bottom', offset: 5, fontSize: 10, fill: '#64748b' }} />
                      <YAxis type="number" dataKey="y" name="Route Avg Score" domain={[0, 100]} stroke="#94a3b8" fontSize={10} label={{ value: 'Route Composite Score', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                      <ZAxis type="number" dataKey="z" range={[45, 45]} />
                      <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 z-50 border border-slate-700">
                              <div className="font-bold border-b border-slate-700 pb-1">{data.routeName}</div>
                              <div className="flex justify-between text-[11px] gap-4">
                                <span className="text-slate-400">Route Length:</span>
                                <span className="font-mono font-bold">{data.x} km</span>
                              </div>
                              <div className="flex justify-between text-[11px] gap-4">
                                <span className="text-slate-400">Composite Score:</span>
                                <span className="font-mono font-bold">{data.y} / 100</span>
                              </div>
                              <div className="flex justify-between text-[11px] gap-4">
                                <span className="text-slate-400">Route Grade:</span>
                                <span className="font-bold" style={{ color: data.color }}>Grade {data.grade}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Scatter name="Corridors" data={corridorsScatterData} fill="#3B82F6">
                        {corridorsScatterData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};
