"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Menu,
  Layers,
  ArrowUpDown,
  Download,
  ArrowLeft,
  Filter,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useDuckDB } from '@/hooks/useDuckDB';
import { useRouteStore } from '@/store/routeStore';
import { useReactiveScoring } from '@/hooks/useReactiveScoring';
import { mapStabilityClass } from '@/utils/stability';
import { GlobalNavMenu, PageView, MENU_ITEMS } from '@/components/widgets/GlobalNavMenu';
import { RouteWithDAs, DaInfo } from '@/components/charts/EquityMatrix';

interface RouteDirectoryPageProps {
  onNavigate?: (page: PageView) => void;
}

export const RouteDirectoryPage: React.FC<RouteDirectoryPageProps> = ({ onNavigate }) => {
  const { db, isInitializing: isDbLoading } = useDuckDB();
  const weights = useRouteStore((s) => s.weights);
  const disabledWeights = useRouteStore((s) => s.disabledWeights);
  const mapFilterMode = useRouteStore((s) => s.mapFilterMode);
  const setMapFilterMode = useRouteStore((s) => s.setMapFilterMode);
  const selectedRouteStore = useRouteStore((s) => s.selectedRoute);
  const setSelectedRouteStore = useRouteStore((s) => s.setSelectedRoute);
  const cimdMode = useRouteStore((s) => s.cimdMode);
  const activeDimensions = useRouteStore((s) => s.activeDimensions);
  const toggleDimension = useRouteStore((s) => s.toggleDimension);
  const daScores = useRouteStore((s) => s.daScores);

  const [baseRoutes, setBaseRoutes] = useState<RouteWithDAs[]>([]);
  const [sensitivityData, setSensitivityData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | 'ALL'>('ALL');
  const [selectedStability, setSelectedStability] = useState<string | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'short_name' | 'name' | 'score' | 'pop' | 'stability' | 'score_mean' | 'score_std'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  // Fallback load of daScores if empty
  useEffect(() => {
    if (Object.keys(daScores).length === 0) {
      fetch('/data/bus_stop_vulnerability.json')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.da_scores) {
            useRouteStore.setState({ daScores: data.da_scores });
          }
        })
        .catch((err) => console.error('Failed to load da_scores fallback in RouteDirectoryPage:', err));
    }
  }, [daScores]);

  // Load Sensitivity summary (stability metrics)
  useEffect(() => {
    fetch('/data/sensitivity_summary_2_pillar.csv')
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim());
        const lookup: Record<string, any> = {};
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const values = line.split(',').map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, idx) => {
            const val = values[idx];
            if (h === 'route_id' || h === 'name' || h === 'short_name' || h === 'stability_class') {
              obj[h] = h === 'stability_class' ? mapStabilityClass(val || '') : (val || '');
            } else {
              obj[h] = Number(val || 0);
            }
          });
          if (obj.route_id) {
            lookup[obj.route_id] = obj;
          }
        }
        setSensitivityData(lookup);
      })
      .catch((err) => console.error('Failed to load sensitivity summary in directory:', err));
  }, []);

  // Load Main DuckDB Dataset
  useEffect(() => {
    if (db) {
      const loadData = async () => {
        try {
          const response = await fetch('/data/golden_route_record.parquet?v=' + Date.now());
          const buffer = await response.arrayBuffer();
          await db.registerFileBuffer('dir_data.parquet', new Uint8Array(buffer));
          
          const conn = await db.connect();
          
          // Ensure table is registered
          await conn.query(`CREATE TABLE IF NOT EXISTS dir_network_data AS SELECT * FROM read_parquet('dir_data.parquet')`);
          
          const routeResult = await conn.query(`
            SELECT route.*
            FROM (
              SELECT UNNEST(routes) as route FROM dir_network_data
            ) t1
          `);

          const rows = routeResult.toArray();
          const routes: RouteWithDAs[] = rows.map((row: any) => {
            let coords: number[][] = [];
            try {
              const rawCoords = row.coords;
              if (rawCoords && rawCoords.toArray) {
                coords = rawCoords.toArray().map((c: any) => {
                  if (c && c.toArray) return Array.from(c.toArray());
                  return Array.isArray(c) ? c : [];
                });
              } else if (Array.isArray(rawCoords)) {
                coords = rawCoords;
              }
            } catch (e) {}

            let da_data: DaInfo[] = [];
            try {
              const rawDa = row.da_metadata;
              if (rawDa && rawDa.toArray) {
                da_data = rawDa.toArray().map((d: any) => ({
                  id: String(d.id || ''),
                  pop: Number(d.pop || 0),
                  low_income_pct: Number(d.low_income_pct || 0),
                  minority_pct: Number(d.minority_pct || 0),
                  senior_pct: Number(d.senior_pct || 0),
                  lone_parent_pct: Number(d.lone_parent_pct || 0),
                  recent_immigrant_pct: Number(d.recent_immigrant_pct || 0),
                  youth_pct: Number(d.youth_pct || 0),
                  vulnerability_index: d.vulnerability_index !== undefined ? Number(d.vulnerability_index) : (d.vulnerability !== undefined ? Number(d.vulnerability) : undefined),
                  neighbourhood: String(d.neighbourhood || ''),
                }));
              }
            } catch (e) {}

            return {
              route_id: String(row.route_id || ''),
              name: String(row.name || ''),
              short_name: String(row.short_name || ''),
              grade: String(row.grade || 'C'),
              composite_score: Number(row.composite_score || 0),
              total_pop_served: Number(row.total_pop_served || 0),
              pillar_1: Number(row.pillar_1_vulnerability || 0),
              pillar_1_cimd: Number(row.cimd_vuln_score || row.pillar_1_vulnerability || 0),
              pillar_2: Number(row.pillar_2_temporal || 0),
              pillar_3: Number(row.pillar_3_monopoly || 0),
              pillar_4: Number(row.pillar_4_opportunity || 0),
              coords,
              da_data,
              stability_class: mapStabilityClass(String(row.stability_class || 'Moderate Stability')),
              stability_class_2_pillar: mapStabilityClass(String(row.stability_class_2_pillar || 'Moderate Stability')),
              trip_count: Number(row.trip_count || 0),
              category: String(row.category || 'bus_regular'),
              route_length_km: Number(row.route_length_km || 0),
              is_regional: !!row.is_regional,
            };
          });

          setBaseRoutes(routes);
          setLoading(false);
          await conn.close();
        } catch (err) {
          console.error("❌ Directory DuckDB Ingestion Failed:", err);
          setLoading(false);
        }
      };

      loadData();
    }
  }, [db]);

  // Reactive Scoring Engine
  const { scoredRoutes, networkStats } = useReactiveScoring(baseRoutes, weights, cimdMode);

  // Exclude regional routes from city scoring and grade counts
  const cityRoutes = useMemo(() => {
    return scoredRoutes.filter((r) => !r.is_regional);
  }, [scoredRoutes]);

  const regionalRoutes = useMemo(() => {
    return scoredRoutes.filter((r) => r.is_regional);
  }, [scoredRoutes]);

  // Grade allocations
  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, Regional: 0 };
    cityRoutes.forEach((r) => {
      counts[r.grade] = (counts[r.grade] || 0) + 1;
    });
    regionalRoutes.forEach((r) => {
      counts['Regional'] = (counts['Regional'] || 0) + 1;
    });
    return counts;
  }, [cityRoutes, regionalRoutes]);

  // Handle Sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Processed, Filtered & Sorted Routes
  const filteredRoutes = useMemo(() => {
    let result = [...scoredRoutes];

    // 1. Search term filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.short_name.toLowerCase().includes(term) ||
          r.name.toLowerCase().includes(term) ||
          r.route_id.toLowerCase().includes(term)
      );
    }

    // 2. Grade filter
    if (selectedGrade !== 'ALL') {
      if (selectedGrade === 'Regional') {
        result = result.filter((r) => r.is_regional);
      } else {
        result = result.filter((r) => !r.is_regional && r.grade === selectedGrade);
      }
    }

    // 3. Stability filter
    if (selectedStability !== 'ALL') {
      result = result.filter((r) => {
        const sens = sensitivityData[r.route_id];
        const stabClass = sens ? sens.stability_class : r.stability_class;
        return stabClass === selectedStability;
      });
    }

    // 4. Sort
    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'short_name') {
        return sortOrder === 'asc' 
          ? a.short_name.localeCompare(b.short_name, undefined, { numeric: true })
          : b.short_name.localeCompare(a.short_name, undefined, { numeric: true });
      } else if (sortField === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortField === 'score') {
        valA = a.composite_score;
        valB = b.composite_score;
      } else if (sortField === 'pop') {
        valA = a.total_pop_served;
        valB = b.total_pop_served;
      } else if (sortField === 'stability') {
        const sensA = sensitivityData[a.route_id];
        const sensB = sensitivityData[b.route_id];
        valA = sensA ? sensA.score_std : 0.0;
        valB = sensB ? sensB.score_std : 0.0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else if (sortField === 'score_mean') {
        const sensA = sensitivityData[a.route_id];
        const sensB = sensitivityData[b.route_id];
        valA = sensA ? sensA.score_mean : a.composite_score;
        valB = sensB ? sensB.score_mean : b.composite_score;
      } else if (sortField === 'score_std') {
        const sensA = sensitivityData[a.route_id];
        const sensB = sensitivityData[b.route_id];
        valA = sensA ? sensA.score_std : 0.0;
        valB = sensB ? sensB.score_std : 0.0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [scoredRoutes, searchTerm, selectedGrade, selectedStability, sortField, sortOrder, sensitivityData]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Route ID',
      'Route Number',
      'Route Name',
      'Regional Transit',
      'Vulnerability Pillar',
      'Temporal Reliability Pillar',
      'Monopoly Index Pillar',
      'Destination Opportunity Pillar',
      'Blended Equity Score',
      'Equity Grade',
      'Stability Class',
      'Population Served'
    ];

    const rows = filteredRoutes.map((r) => {
      const sens = sensitivityData[r.route_id];
      const stability = sens ? sens.stability_class : r.stability_class;
      return [
        r.route_id,
        r.short_name,
        r.name,
        r.is_regional ? 'Yes' : 'No',
        r.pillar_1_cimd.toFixed(1),
        r.pillar_2.toFixed(1),
        r.pillar_3.toFixed(1),
        r.pillar_4.toFixed(1),
        r.composite_score.toFixed(1),
        r.grade,
        stability,
        r.total_pop_served
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ets_route_equity_scorecard_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 text-slate-800 font-sans select-none overflow-hidden">
      {/* Global Navigation Menu */}
      <GlobalNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        onNavigate={onNavigate}
        activeItemIndex={3}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            title="Return to Dashboard Map"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Map View</span>
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              ETS Route Equity Scorecard Directory
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Live scores calculated using your active policy weights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
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

      {/* Subheader Toolbar */}
      <section className="bg-white border-b border-slate-200 px-6 py-3 shadow-sm z-10 flex flex-wrap gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by route number or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Stability Filter
            </span>
            <select
              value={selectedStability}
              onChange={(e) => setSelectedStability(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold"
            >
              <option value="ALL">All Stabilities</option>
              <option value="Essential Equity Routes">Essential Equity Routes</option>
              <option value="Low Equity-Priority Routes">Low Equity-Priority Routes</option>
              <option value="High Swing Routes">High Swing Routes</option>
              <option value="Moderate Swing Routes">Moderate Swing Routes</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grade distribution progress bar */}
      <section className="bg-white px-6 py-3 border-b border-slate-200 flex flex-col gap-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Grade Distribution</div>
        <div className="w-full h-8 rounded-lg overflow-hidden flex shadow-inner border border-slate-100">
          {(['A', 'B', 'C', 'D', 'E', 'Regional'] as const).map((g) => {
            const count = gradeCounts[g] || 0;
            const pct = scoredRoutes.length > 0 ? (count / scoredRoutes.length) * 100 : 0;
            const colorClass = g === 'A' ? 'bg-[#10B981]' 
              : g === 'B' ? 'bg-[#3B82F6]'
              : g === 'C' ? 'bg-[#F59E0B]'
              : g === 'D' ? 'bg-[#F97316]'
              : g === 'E' ? 'bg-[#EF4444]'
              : 'bg-[#94A3B8]';

            const activeClass = selectedGrade === g ? 'ring-4 ring-black/30 scale-y-105 z-10 shadow-lg' : 'hover:opacity-90';

            return (
              <button
                key={g}
                onClick={() => setSelectedGrade(selectedGrade === g ? 'ALL' : g)}
                style={{ width: `${Math.max(4, pct)}%` }}
                className={`${colorClass} h-full transition-all duration-200 text-white flex items-center justify-center text-xs font-black relative group ${activeClass}`}
                title={`Filter by Grade ${g} (${count} routes)`}
              >
                <span>{g} ({count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Table Area */}
      <main className="flex-1 overflow-y-auto px-6 py-6 relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/70 z-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-800 border-t-transparent" />
            <span className="text-xs font-bold text-slate-500 mt-3 uppercase tracking-wider">
              {isDbLoading ? "Initializing Analytical Database..." : "Securing Route Inventory..."}
            </span>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-w-[900px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-55/70 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="py-3.5 px-4 w-12 text-center">Info</th>
                  <th className="py-3.5 px-4 w-24 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('short_name')}>
                    <div className="flex items-center gap-1">
                      <span>Route</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>Description</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-28 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('score')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Live Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-32 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('score_mean')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Simulated Mean</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-32 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('score_std')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Volatility (σ)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-20 text-center">Grade</th>
                  <th className="py-3.5 px-4 w-52 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('stability')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Stability Status</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-36 text-right cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('pop')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Pop. Served</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-32 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 font-bold uppercase tracking-wider">
                      No routes found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.map((route) => {
                    const isExpanded = expandedRouteId === route.route_id;
                    const sens = sensitivityData[route.route_id];
                    const stabilityClass = sens ? sens.stability_class : route.stability_class;

                    const gradeColor = route.is_regional ? 'bg-slate-400'
                      : route.grade === 'A' ? 'bg-[#10B981]'
                      : route.grade === 'B' ? 'bg-[#3B82F6]'
                      : route.grade === 'C' ? 'bg-[#F59E0B]'
                      : route.grade === 'D' ? 'bg-[#F97316]'
                      : 'bg-[#EF4444]';

                    const stabilityBg = stabilityClass === 'Essential Equity Routes' ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : stabilityClass === 'Low Equity-Priority Routes' ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : stabilityClass === 'High Swing Routes' ? 'bg-red-50 text-red-700 border-red-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100';

                    return (
                      <React.Fragment key={route.route_id}>
                        <tr className={`hover:bg-slate-50/80 transition-colors duration-100 ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setExpandedRouteId(isExpanded ? null : route.route_id)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                            >
                              <ChevronRight className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-slate-900">
                            {route.short_name}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-bold truncate max-w-md">
                            {route.name}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-black text-slate-800 text-sm">
                            {route.composite_score.toFixed(1)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                            {sens ? sens.score_mean.toFixed(1) : route.composite_score.toFixed(1)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-slate-500">
                            {sens ? sens.score_std.toFixed(2) : '0.00'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-sm border ${gradeColor}`}>
                              {route.grade}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md border shadow-sm ${stabilityBg}`}>
                              {stabilityClass}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">
                            {route.total_pop_served.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedRouteStore(route.route_id);
                                onNavigate?.('dashboard');
                              }}
                              className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-slate-800 transition-colors shadow-sm"
                            >
                              Select Route
                            </button>
                          </td>
                        </tr>

                        {/* Nested Dropdown */}
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={8} className="py-4 px-6 border-l-2 border-slate-300">
                              <div className="grid grid-cols-3 gap-6">
                                {/* Contributing DAs Table */}
                                <div className="col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Served Dissemination Areas (DAs)</span>
                                  </h4>
                                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                          <th className="pb-1.5">Neighbourhood / DA</th>
                                          <th className="pb-1.5 text-center">Vulnerability Index</th>
                                          <th className="pb-1.5 text-right">Served Population</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                        {route.da_data && route.da_data.length > 0 ? (
                                          route.da_data
                                            .sort((a, b) => b.pop - a.pop)
                                            .map((da) => (
                                              <tr key={da.id} className="hover:bg-slate-50/50">
                                                <td className="py-1.5 font-bold text-slate-700">
                                                  {da.neighbourhood || `DA ${da.id}`}
                                                </td>
                                                <td className="py-1.5 text-center font-mono font-bold text-slate-800">
                                                  {(da.vulnerability_index ?? 2.5).toFixed(1)} / 5.0
                                                </td>
                                                <td className="py-1.5 text-right font-mono">
                                                  {da.pop.toLocaleString()}
                                                </td>
                                              </tr>
                                            ))
                                        ) : (
                                          <tr>
                                            <td colSpan={3} className="text-center py-4 text-slate-400">
                                              No DA metadata available for this route.
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Analytical Metrics Column */}
                                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col gap-4">
                                  <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                      Pillar Contribution
                                    </h4>
                                    <div className="space-y-2">
                                      {[
                                        { name: 'Vulnerability (CIMD)', val: route.pillar_1_cimd, color: '#C084FC' },
                                        { name: 'Temporal Resilience', val: route.pillar_2, color: '#60A5FA' },
                                        { name: 'Monopoly Index', val: route.pillar_3, color: '#FBBF24' },
                                        { name: 'Opportunity Catchment', val: route.pillar_4, color: '#F472B6' }
                                      ].map((item) => (
                                        <div key={item.name} className="flex flex-col gap-0.5">
                                          <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-slate-500">{item.name}</span>
                                            <span className="text-slate-800 font-mono">{item.val.toFixed(1)}</span>
                                          </div>
                                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                              style={{ width: `${item.val}%`, backgroundColor: item.color }} 
                                              className="h-full rounded-full" 
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="border-t border-slate-100 pt-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                      Route Characteristics
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                                      <div>
                                        <span className="text-slate-400">Length: </span>
                                        <span className="font-bold text-slate-700">{(route.route_length_km || 0).toFixed(1)} km</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">Category: </span>
                                        <span className="font-bold text-slate-700 capitalize">{route.category.replace('bus_', '')}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">Weekly Trips: </span>
                                        <span className="font-bold text-slate-700">{route.trip_count.toLocaleString()}</span>
                                      </div>
                                    </div>
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
          </div>
        )}
      </main>
    </div>
  );
};
