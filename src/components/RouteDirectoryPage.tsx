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

  const directoryFeedMode = useRouteStore((s) => s.directoryFeedMode);
  const setDirectoryFeedMode = useRouteStore((s) => s.setDirectoryFeedMode);
  const setWeight = useRouteStore((s) => s.setWeight);
  const setWeights = useRouteStore((s) => s.setWeights);

  const [baseRoutes, setBaseRoutes] = useState<RouteWithDAs[]>([]);
  const [octRoutes, setOctRoutes] = useState<RouteWithDAs[]>([]);
  const [sensitivityData, setSensitivityData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | 'ALL'>('ALL');
  const [selectedStability, setSelectedStability] = useState<string | 'ALL'>('ALL');
  const [deltaFilter, setDeltaFilter] = useState<'ALL' | 'UPGRADED' | 'DOWNGRADED' | 'UNCHANGED' | 'NEW_RETIRED'>('ALL');
  const [sortField, setSortField] = useState<'short_name' | 'name' | 'score' | 'delta_score' | 'delta_p1' | 'delta_p2' | 'delta_p3' | 'delta_p4' | 'pop' | 'stability' | 'score_mean' | 'score_std'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [showWeightControls, setShowWeightControls] = useState<boolean>(false);

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

  // Helper to map raw JSON route records into RouteWithDAs
  const mapJsonToRouteWithDAs = (rawRoutes: any[]): RouteWithDAs[] => {
    return (rawRoutes || []).map((row: any) => ({
      route_id: String(row.route_id || ''),
      name: String(row.name || ''),
      short_name: String(row.short_name || row.route_id || ''),
      grade: String(row.grade || 'C'),
      composite_score: Number(row.composite_score || 0),
      total_pop_served: Number(row.total_pop_served || 0),
      pillar_1: Number(row.pillar_1_vulnerability || 0),
      pillar_1_cimd: Number(row.cimd_4dim_exact ?? row.cimd_vuln_score ?? row.pillar_1_vulnerability ?? 0),
      pillar_2: Number(row.pillar_2_temporal || 0),
      pillar_3: Number(row.pillar_3_monopoly || 0),
      pillar_4: Number(row.pillar_4_opportunity || 0),
      coords: Array.isArray(row.coords) ? row.coords : [],
      da_data: Array.isArray(row.da_metadata)
        ? row.da_metadata.map((d: any) => ({
            id: String(d.id || ''),
            pop: Number(d.pop || 0),
            low_income_pct: Number(d.low_income_pct || 0),
            minority_pct: Number(d.minority_pct || 0),
            senior_pct: Number(d.senior_pct || 0),
            lone_parent_pct: Number(d.lone_parent_pct || 0),
            recent_immigrant_pct: Number(d.recent_immigrant_pct || 0),
            youth_pct: Number(d.youth_pct || 0),
            vulnerability_index: d.vulnerability_index !== undefined ? Number(d.vulnerability_index) : undefined,
            neighbourhood: String(d.neighbourhood || ''),
          }))
        : [],
      stability_class: mapStabilityClass(String(row.stability_class || 'Moderate Stability')),
      stability_class_2_pillar: mapStabilityClass(String(row.stability_class_2_pillar || 'Moderate Stability')),
      trip_count: Number(row.trip_count || 0),
      category: String(row.category || 'bus_regular'),
      route_length_km: Number(row.route_length_km || 0),
      is_regional: !!row.is_regional,
    }));
  };

  // Load Both Clean Bug-Fixed Summer 2026 Baseline & October 2026 GTFS Feeds
  useEffect(() => {
    let isMounted = true;
    const loadFeeds = async () => {
      try {
        const [baseRes, octRes] = await Promise.all([
          fetch('/data/golden_route_record_baseline_fixed.json?v=' + Date.now()),
          fetch('/data/golden_route_record_oct2026.json?v=' + Date.now()),
        ]);
        const [baseJson, octJson] = await Promise.all([baseRes.json(), octRes.json()]);
        if (!isMounted) return;
        setBaseRoutes(mapJsonToRouteWithDAs(baseJson.routes || []));
        setOctRoutes(mapJsonToRouteWithDAs(octJson.routes || []));
        setLoading(false);
      } catch (err) {
        console.error('❌ Directory Dual-Feed Ingestion Failed:', err);
        setLoading(false);
      }
    };
    loadFeeds();
    return () => {
      isMounted = false;
    };
  }, []);

  // Reactive Scoring Engine — Runs simultaneously on both feeds so dragging policy weight sliders
  // recomputes Summer 2026 grades, October 2026 grades, and their 4-pillar deltas in real time!
  const { scoredRoutes: scoredBaseline } = useReactiveScoring(baseRoutes, weights, cimdMode);
  const { scoredRoutes: scoredOct } = useReactiveScoring(octRoutes, weights, cimdMode);

  // Active Primary Routes based on feed mode
  const activeScoredRoutes = useMemo(() => {
    return directoryFeedMode === 'baseline' ? scoredBaseline : scoredOct;
  }, [directoryFeedMode, scoredBaseline, scoredOct]);

  // Fast O(1) lookup maps for Baseline & October feeds
  const baselineById = useMemo(() => {
    const map: Record<string, (typeof scoredBaseline)[number]> = {};
    scoredBaseline.forEach((r) => {
      map[r.route_id] = r;
    });
    return map;
  }, [scoredBaseline]);

  const octById = useMemo(() => {
    const map: Record<string, (typeof scoredOct)[number]> = {};
    scoredOct.forEach((r) => {
      map[r.route_id] = r;
    });
    return map;
  }, [scoredOct]);

  // Unified row list (in Compare mode, includes both active October routes and retired Summer routes like 522)
  const displayRoutes = useMemo(() => {
    if (directoryFeedMode !== 'compare') {
      return activeScoredRoutes;
    }
    const octIds = new Set(scoredOct.map((r) => r.route_id));
    const retiredFromBase = scoredBaseline.filter((r) => !octIds.has(r.route_id));
    return [...scoredOct, ...retiredFromBase];
  }, [directoryFeedMode, activeScoredRoutes, scoredOct, scoredBaseline]);

  // Exclude regional routes from city scoring and grade counts
  const cityRoutes = useMemo(() => {
    return activeScoredRoutes.filter((r) => !r.is_regional);
  }, [activeScoredRoutes]);

  const regionalRoutes = useMemo(() => {
    return activeScoredRoutes.filter((r) => r.is_regional);
  }, [activeScoredRoutes]);

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

  // Summary counts for Delta Filter pills in Compare Mode
  const deltaSummary = useMemo(() => {
    const GRADE_RANK: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
    let upgraded = 0;
    let downgraded = 0;
    let unchanged = 0;
    let newOrRetired = 0;

    displayRoutes.forEach((r) => {
      if (r.is_regional) return;
      const oldR = baselineById[r.route_id];
      const newR = octById[r.route_id];
      if (!oldR || !newR) {
        newOrRetired++;
      } else {
        const oldRank = GRADE_RANK[oldR.grade] || 0;
        const newRank = GRADE_RANK[newR.grade] || 0;
        if (newRank > oldRank) upgraded++;
        else if (newRank < oldRank) downgraded++;
        else unchanged++;
      }
    });
    return { upgraded, downgraded, unchanged, newOrRetired };
  }, [displayRoutes, baselineById, octById]);

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
    const GRADE_RANK: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
    let result = [...displayRoutes];

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

    // 4. Delta movement filter (in Compare Mode)
    if (directoryFeedMode === 'compare' && deltaFilter !== 'ALL') {
      result = result.filter((r) => {
        if (r.is_regional) return false;
        const oldR = baselineById[r.route_id];
        const newR = octById[r.route_id];
        if (deltaFilter === 'NEW_RETIRED') return !oldR || !newR;
        if (!oldR || !newR) return false;
        const oldRank = GRADE_RANK[oldR.grade] || 0;
        const newRank = GRADE_RANK[newR.grade] || 0;
        if (deltaFilter === 'UPGRADED') return newRank > oldRank;
        if (deltaFilter === 'DOWNGRADED') return newRank < oldRank;
        if (deltaFilter === 'UNCHANGED') return newRank === oldRank;
        return true;
      });
    }

    // 5. Sort
    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      const oldA = baselineById[a.route_id];
      const newA = octById[a.route_id];
      const oldB = baselineById[b.route_id];
      const newB = octById[b.route_id];

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
      } else if (sortField === 'delta_score') {
        valA = oldA && newA ? newA.composite_score - oldA.composite_score : -999;
        valB = oldB && newB ? newB.composite_score - oldB.composite_score : -999;
      } else if (sortField === 'delta_p1') {
        valA = oldA && newA ? newA.pillar_1_cimd - oldA.pillar_1_cimd : -999;
        valB = oldB && newB ? newB.pillar_1_cimd - oldB.pillar_1_cimd : -999;
      } else if (sortField === 'delta_p2') {
        valA = oldA && newA ? newA.pillar_2 - oldA.pillar_2 : -999;
        valB = oldB && newB ? newB.pillar_2 - oldB.pillar_2 : -999;
      } else if (sortField === 'delta_p3') {
        valA = oldA && newA ? newA.pillar_3 - oldA.pillar_3 : -999;
        valB = oldB && newB ? newB.pillar_3 - oldB.pillar_3 : -999;
      } else if (sortField === 'delta_p4') {
        valA = oldA && newA ? newA.pillar_4 - oldA.pillar_4 : -999;
        valB = oldB && newB ? newB.pillar_4 - oldB.pillar_4 : -999;
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
  }, [displayRoutes, searchTerm, selectedGrade, selectedStability, deltaFilter, directoryFeedMode, sortField, sortOrder, sensitivityData, baselineById, octById]);

  // Export CSV (supports both Single-Feed and Delta Comparison export!)
  const handleExportCSV = () => {
    if (directoryFeedMode === 'compare') {
      const headers = [
        'Route ID',
        'Route Name',
        'Status',
        'Regional',
        'Summer 2026 Grade',
        'Oct 2026 Grade',
        'Summer 2026 Score',
        'Oct 2026 Score',
        'Delta Composite Score',
        'Delta Vuln (CIMD)',
        'Delta Off-Peak (P2)',
        'Delta Monopoly (P3)',
        'Delta Opportunity (P4)',
        'Summer Weekly Trips',
        'Oct Weekly Trips',
        'Delta Trips',
        'Population Served',
      ];
      const rows = filteredRoutes.map((r) => {
        const oldR = baselineById[r.route_id];
        const newR = octById[r.route_id];
        const status = !oldR ? 'New Route (Oct 2026)' : !newR ? 'Retired Route' : ['001', '509', '918'].includes(r.route_id) ? `Merged ${r.route_id}A/${r.route_id}B` : 'Matched';
        return [
          r.route_id,
          r.name,
          status,
          r.is_regional ? 'Yes' : 'No',
          oldR ? oldR.grade : 'N/A',
          newR ? newR.grade : 'Retired',
          oldR ? oldR.composite_score.toFixed(1) : '',
          newR ? newR.composite_score.toFixed(1) : '',
          oldR && newR ? (newR.composite_score - oldR.composite_score).toFixed(1) : '',
          oldR && newR ? (newR.pillar_1_cimd - oldR.pillar_1_cimd).toFixed(1) : '',
          oldR && newR ? (newR.pillar_2 - oldR.pillar_2).toFixed(1) : '',
          oldR && newR ? (newR.pillar_3 - oldR.pillar_3).toFixed(1) : '',
          oldR && newR ? (newR.pillar_4 - oldR.pillar_4).toFixed(1) : '',
          oldR ? oldR.trip_count : '',
          newR ? newR.trip_count : '',
          oldR && newR ? newR.trip_count - oldR.trip_count : '',
          r.total_pop_served,
        ];
      });
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute('download', `ets_gtfs_comparison_live_weights_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

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
      'Population Served',
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
        r.total_pop_served,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ets_route_equity_scorecard_${directoryFeedMode}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to format signed delta badges
  const renderDeltaPill = (delta: number | null, suffix = '') => {
    if (delta === null || Number.isNaN(delta)) {
      return <span className="text-[10px] font-mono text-slate-300">—</span>;
    }
    const rounded = Math.round(delta * 10) / 10;
    if (Math.abs(rounded) < 0.1) {
      return <span className="text-[10px] font-mono text-slate-400">0.0{suffix}</span>;
    }
    const isPos = rounded > 0;
    return (
      <span
        className={`inline-block font-mono text-[10.5px] font-black px-1.5 py-0.5 rounded border ${
          isPos
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}
      >
        {isPos ? `+${rounded.toFixed(1)}` : rounded.toFixed(1)}
        {suffix}
      </span>
    );
  };

  const getGradeBadgeClass = (g: string, isRegional?: boolean) => {
    if (isRegional || g === 'Regional') return 'bg-slate-400';
    if (g === 'A') return 'bg-[#10B981]';
    if (g === 'B') return 'bg-[#3B82F6]';
    if (g === 'C') return 'bg-[#F59E0B]';
    if (g === 'D') return 'bg-[#F97316]';
    return 'bg-[#EF4444]';
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
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm z-10">
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
              {directoryFeedMode === 'compare'
                ? 'Live Dual-Feed Comparison: Summer 2026 Baseline (Geometry-Fixed) vs. October 2026 GTFS'
                : directoryFeedMode === 'oct2026'
                ? 'Viewing October 2026 ETS GTFS Release (129 Municipal, 52 Regional Routes)'
                : 'Viewing Summer 2026 Baseline (Geometry-Fixed — 128 Municipal, 42 Regional Routes)'}
            </p>
          </div>
        </div>

        {/* Dual-Feed & Delta Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            {(
              [
                { id: 'baseline', label: 'Summer 2026 Baseline' },
                { id: 'oct2026', label: 'Oct 2026 GTFS (New)' },
                { id: 'compare', label: 'Compare (Δ Delta Mode)' },
              ] as const
            ).map((tab) => {
              const active = directoryFeedMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setDirectoryFeedMode(tab.id);
                    if (tab.id === 'compare' && sortField === 'score') {
                      setSortField('delta_score');
                      setSortOrder('desc');
                    } else if (tab.id !== 'compare' && sortField.startsWith('delta_')) {
                      setSortField('score');
                      setSortOrder('desc');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    active
                      ? tab.id === 'compare'
                        ? 'bg-[#1e3a8a] text-white shadow-sm'
                        : 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowWeightControls(!showWeightControls)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
              showWeightControls
                ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
            }`}
            title="Adjust policy pillar weights in real time across both feeds"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Policy Weights ({weights.vulnerability}/{weights.resilience}/{weights.monopoly}/{weights.opportunity})</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{directoryFeedMode === 'compare' ? 'Export Δ CSV' : 'Download CSV'}</span>
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

      {/* Collapsible Live Policy Weights & CIMD Dimension Bar (recomputes both feeds and their deltas live) */}
      {showWeightControls && (
        <section className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-6 z-10 shadow-inner">
          <div className="flex flex-wrap items-center gap-6">
            {(
              [
                { key: 'vulnerability', label: '1. Vulnerability (CIMD)', val: weights.vulnerability },
                { key: 'resilience', label: '2. Off-Peak Service', val: weights.resilience },
                { key: 'monopoly', label: '3. Functional Monopoly', val: weights.monopoly },
                { key: 'opportunity', label: '4. Opportunities', val: weights.opportunity },
              ] as const
            ).map((wItem) => (
              <div key={wItem.key} className="flex items-center gap-2.5">
                <span className="text-[11px] font-bold text-slate-300">{wItem.label}:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={wItem.val}
                  onChange={(e) => setWeight(wItem.key, Number(e.target.value))}
                  className="w-24 accent-blue-400 cursor-pointer"
                />
                <span className="font-mono text-xs font-black text-blue-300 w-9">{wItem.val}%</span>
              </div>
            ))}
            <button
              onClick={() => setWeights({ vulnerability: 15, resilience: 40, monopoly: 10, opportunity: 35 })}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-slate-700 transition-colors"
            >
              Reset (15/40/10/35)
            </button>
          </div>

          {cimdMode && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                CIMD Sub-Dimensions:
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
                    onClick={() => toggleDimension(dim.key)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {dim.label}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

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

        {/* Delta Movement Filter Pills (Shown in Compare Mode) */}
        {directoryFeedMode === 'compare' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'All Municipal & Regional' },
                { id: 'UPGRADED', label: `Grade Upgraded (${deltaSummary.upgraded})` },
                { id: 'DOWNGRADED', label: `Grade Downgraded (${deltaSummary.downgraded})` },
                { id: 'UNCHANGED', label: `Same Grade (${deltaSummary.unchanged})` },
                { id: 'NEW_RETIRED', label: `New / Retired (${deltaSummary.newOrRetired})` },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                onClick={() => setDeltaFilter(pill.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  deltaFilter === pill.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        )}

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
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {directoryFeedMode === 'baseline'
              ? 'Live Grade Distribution (Summer 2026 Baseline)'
              : 'Live Grade Distribution (October 2026 GTFS)'}
          </span>
          {directoryFeedMode === 'compare' && (
            <span className="text-[10px] font-bold text-slate-500">
              Short-turn geometry truncation bug fixed on baseline — deltas isolate pure Fall 2026 ETS schedule changes
            </span>
          )}
        </div>
        <div className="w-full h-8 rounded-lg overflow-hidden flex shadow-inner border border-slate-100">
          {(['A', 'B', 'C', 'D', 'E', 'Regional'] as const).map((g) => {
            const count = gradeCounts[g] || 0;
            const pct = activeScoredRoutes.length > 0 ? (count / activeScoredRoutes.length) * 100 : 0;
            const colorClass =
              g === 'A'
                ? 'bg-[#10B981]'
                : g === 'B'
                ? 'bg-[#3B82F6]'
                : g === 'C'
                ? 'bg-[#F59E0B]'
                : g === 'D'
                ? 'bg-[#F97316]'
                : g === 'E'
                ? 'bg-[#EF4444]'
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
                <span>
                  {g} ({count})
                </span>
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
              {isDbLoading ? 'Initializing Analytical Database...' : 'Securing Dual-Feed Route Inventory...'}
            </span>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-w-[980px]">
            <table className="w-full text-left border-collapse">
              <thead>
                {directoryFeedMode === 'compare' ? (
                  <tr className="bg-slate-55/70 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-3.5 px-3 w-10 text-center">Info</th>
                    <th className="py-3.5 px-3 w-20 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('short_name')}>
                      <div className="flex items-center gap-1">
                        <span>Route</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">
                        <span>Corridor Description</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3 w-28 text-center">Grade (Old → New)</th>
                    <th className="py-3.5 px-3 w-36 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('delta_score')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>Score (Δ)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3 w-24 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('delta_p1')}>
                      <div className="flex items-center justify-center gap-1" title="Change in Statistics Canada 4-Dimension CIMD Vulnerability Score">
                        <span>Δ CIMD</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3 w-28 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('delta_p2')}>
                      <div className="flex items-center justify-center gap-1" title="Change in Pillar 2: Off-Peak & Night Service Score">
                        <span>Δ Off-Peak</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3 w-28 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('delta_p3')}>
                      <div className="flex items-center justify-center gap-1" title="Change in Pillar 3: Functional Monopoly Score">
                        <span>Δ Monopoly</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3 w-28 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('delta_p4')}>
                      <div className="flex items-center justify-center gap-1" title="Change in Pillar 4: Critical Opportunities Score">
                        <span>Δ Opp.</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3 w-28 text-right">Trips (Δ)</th>
                    <th className="py-3.5 px-3 w-28 text-center">Action</th>
                  </tr>
                ) : (
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
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-10 text-slate-400 font-bold uppercase tracking-wider">
                      No routes found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.map((route) => {
                    const isExpanded = expandedRouteId === route.route_id;
                    const sens = sensitivityData[route.route_id];
                    const stabilityClass = sens ? sens.stability_class : route.stability_class;

                    const oldR = baselineById[route.route_id];
                    const newR = octById[route.route_id];
                    const isMergedAB = ['001', '509', '918'].includes(route.route_id);

                    const gradeColor = getGradeBadgeClass(route.grade, route.is_regional);

                    const stabilityBg =
                      stabilityClass === 'Essential Equity Routes'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : stabilityClass === 'Low Equity-Priority Routes'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : stabilityClass === 'High Swing Routes'
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100';

                    return (
                      <React.Fragment key={route.route_id}>
                        {directoryFeedMode === 'compare' ? (
                          <tr className={`hover:bg-slate-50/80 transition-colors duration-100 ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => setExpandedRouteId(isExpanded ? null : route.route_id)}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                              >
                                <ChevronRight className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            </td>
                            <td className="py-3 px-3 font-mono font-black text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <span>{route.short_name}</span>
                                {isMergedAB && (
                                  <span
                                    className="text-[9px] font-bold px-1 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded"
                                    title={`Joined ${route.route_id}A + ${route.route_id}B branches`}
                                  >
                                    A+B
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-700 font-bold truncate max-w-xs">
                              <div className="flex items-center gap-2">
                                <span className="truncate">{route.name}</span>
                                {!oldR && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    New in Oct
                                  </span>
                                )}
                                {!newR && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                    Retired
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {route.is_regional ? (
                                <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full text-white bg-slate-400">
                                  Regional
                                </span>
                              ) : oldR && newR ? (
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full text-white ${getGradeBadgeClass(oldR.grade)}`}>
                                    {oldR.grade}
                                  </span>
                                  <span className="text-slate-400 text-[10px]">→</span>
                                  <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full text-white ${getGradeBadgeClass(newR.grade)}`}>
                                    {newR.grade}
                                  </span>
                                </div>
                              ) : newR ? (
                                <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full text-white ${getGradeBadgeClass(newR.grade)}`}>
                                  New: {newR.grade}
                                </span>
                              ) : (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500 bg-slate-100 border border-slate-200">
                                  Was {oldR?.grade}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {route.is_regional ? (
                                <span className="text-slate-300 font-mono text-[10px]">—</span>
                              ) : oldR && newR ? (
                                <div className="flex items-center justify-center gap-1.5 font-mono">
                                  <span className="text-slate-400 text-[11px]">{oldR.composite_score.toFixed(0)}→</span>
                                  <span className="text-slate-900 font-black text-xs">{newR.composite_score.toFixed(0)}</span>
                                  {renderDeltaPill(newR.composite_score - oldR.composite_score)}
                                </div>
                              ) : newR ? (
                                <span className="font-mono font-black text-slate-900">{newR.composite_score.toFixed(1)}</span>
                              ) : (
                                <span className="font-mono text-slate-400 line-through">{oldR?.composite_score.toFixed(1)}</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {!route.is_regional && oldR && newR ? renderDeltaPill(newR.pillar_1_cimd - oldR.pillar_1_cimd) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {!route.is_regional && oldR && newR ? renderDeltaPill(newR.pillar_2 - oldR.pillar_2) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {!route.is_regional && oldR && newR ? renderDeltaPill(newR.pillar_3 - oldR.pillar_3) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {!route.is_regional && oldR && newR ? renderDeltaPill(newR.pillar_4 - oldR.pillar_4) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[11px]">
                              {oldR && newR ? (
                                <div className="flex flex-col items-end leading-tight">
                                  <span className="text-slate-700 font-bold">{newR.trip_count.toLocaleString()}</span>
                                  <span className={`text-[9.5px] ${newR.trip_count - oldR.trip_count >= 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    ({newR.trip_count - oldR.trip_count >= 0 ? '+' : ''}
                                    {newR.trip_count - oldR.trip_count})
                                  </span>
                                </div>
                              ) : (
                                <span>{route.trip_count.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
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
                        ) : (
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
                              <div className="flex items-center gap-1.5">
                                <span>{route.short_name}</span>
                                {isMergedAB && directoryFeedMode === 'oct2026' && (
                                  <span className="text-[9px] font-bold px-1 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                                    A+B
                                  </span>
                                )}
                              </div>
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
                        )}

                        {/* Nested Dropdown */}
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={11} className="py-4 px-6 border-l-2 border-slate-300">
                              <div className="grid grid-cols-3 gap-6">
                                {/* Contributing DAs Table */}
                                <div className="col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Served Dissemination Areas (DAs) — {route.da_data?.length || 0} Catchments</span>
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
                                                  {da.neighbourhood || `DA ${da.id}`} <span className="text-[10px] text-slate-400 font-mono">({da.id})</span>
                                                </td>
                                                <td className="py-1.5 text-center font-mono font-bold text-slate-800">
                                                  {(da.vulnerability_index ?? 2.5).toFixed(1)}
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

                                {/* Analytical Metrics Column (Side-by-Side Summer vs Oct in Compare Mode) */}
                                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col gap-4">
                                  <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                      {directoryFeedMode === 'compare' && oldR && newR
                                        ? 'Pillar Comparison (Summer 2026 → Oct 2026)'
                                        : 'Pillar Contribution'}
                                    </h4>
                                    <div className="space-y-2.5">
                                      {[
                                        {
                                          name: 'Vulnerability (CIMD)',
                                          oldVal: oldR?.pillar_1_cimd,
                                          newVal: newR?.pillar_1_cimd,
                                          val: route.pillar_1_cimd,
                                          color: '#C084FC',
                                        },
                                        {
                                          name: 'Off-Peak Service (P2)',
                                          oldVal: oldR?.pillar_2,
                                          newVal: newR?.pillar_2,
                                          val: route.pillar_2,
                                          color: '#60A5FA',
                                        },
                                        {
                                          name: 'Functional Monopoly (P3)',
                                          oldVal: oldR?.pillar_3,
                                          newVal: newR?.pillar_3,
                                          val: route.pillar_3,
                                          color: '#FBBF24',
                                        },
                                        {
                                          name: 'Opportunities (P4)',
                                          oldVal: oldR?.pillar_4,
                                          newVal: newR?.pillar_4,
                                          val: route.pillar_4,
                                          color: '#F472B6',
                                        },
                                      ].map((item) => (
                                        <div key={item.name} className="flex flex-col gap-1">
                                          <div className="flex justify-between text-[10px] font-bold items-center">
                                            <span className="text-slate-500">{item.name}</span>
                                            {directoryFeedMode === 'compare' && item.oldVal !== undefined && item.newVal !== undefined ? (
                                              <span className="text-slate-800 font-mono">
                                                {item.oldVal.toFixed(1)} → {item.newVal.toFixed(1)}{' '}
                                                <span className={item.newVal - item.oldVal >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                  ({item.newVal - item.oldVal >= 0 ? '+' : ''}
                                                  {(item.newVal - item.oldVal).toFixed(1)})
                                                </span>
                                              </span>
                                            ) : (
                                              <span className="text-slate-800 font-mono">{item.val.toFixed(1)}</span>
                                            )}
                                          </div>
                                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                              style={{ width: `${Math.min(100, Math.max(0, item.val))}%`, backgroundColor: item.color }}
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
                                      <div className="col-span-2">
                                        <span className="text-slate-400">Weekly Trips: </span>
                                        {directoryFeedMode === 'compare' && oldR && newR ? (
                                          <span className="font-bold text-slate-700 font-mono">
                                            {oldR.trip_count.toLocaleString()} → {newR.trip_count.toLocaleString()} (
                                            {newR.trip_count - oldR.trip_count >= 0 ? '+' : ''}
                                            {newR.trip_count - oldR.trip_count})
                                          </span>
                                        ) : (
                                          <span className="font-bold text-slate-700 font-mono">{route.trip_count.toLocaleString()}</span>
                                        )}
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
