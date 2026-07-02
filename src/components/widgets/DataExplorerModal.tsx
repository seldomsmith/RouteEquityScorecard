import React, { useState, useMemo } from 'react';
import { X, Download, ArrowUp, ArrowDown, Minus, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DataExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRoutesData: any[];
  weights: {
    vulnerability: number;
    offPeak: number;
    monopoly: number;
    opportunity: number;
  };
}

export const DataExplorerModal: React.FC<DataExplorerModalProps> = ({
  isOpen,
  onClose,
  allRoutesData,
  weights
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'liveScore', direction: 'desc' });
  const [activeGradeFilter, setActiveGradeFilter] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

  // 1. Calculate Live Scores and Grades
  const processedRoutes = useMemo(() => {
    if (!allRoutesData || allRoutesData.length === 0) return [];
    
    // Calculate raw live scores
    let routesWithScores = allRoutesData.map((route: any) => {
      const v = (route.pillar_1_vulnerability || 0) * (weights.vulnerability / 100);
      const t = (route.pillar_2_temporal || 0) * (weights.offPeak / 100);
      const m = (route.pillar_3_monopoly || 0) * (weights.monopoly / 100);
      const o = (route.pillar_4_opportunity || 0) * (weights.opportunity / 100);
      
      const liveScore = v + t + m + o;
      return { ...route, liveScore, v_contrib: v, t_contrib: t, m_contrib: m, o_contrib: o };
    });

    // Sort by live score descending to assign quintile grades
    routesWithScores.sort((a, b) => b.liveScore - a.liveScore);
    
    const total = routesWithScores.length;
    return routesWithScores.map((route, idx) => {
      const p = idx / total;
      let liveGrade = 'E';
      if (p < 0.2) liveGrade = 'A';
      else if (p < 0.4) liveGrade = 'B';
      else if (p < 0.6) liveGrade = 'C';
      else if (p < 0.8) liveGrade = 'D';
      
      // Calculate Grade Diff
      const grades = ['A', 'B', 'C', 'D', 'E'];
      const oldIdx = grades.indexOf(route.grade || 'C');
      const newIdx = grades.indexOf(liveGrade);
      let gradeDiff = 0; // 0 = same, >0 = improved (went from C to B), <0 = worse
      if (oldIdx !== -1 && newIdx !== -1) {
        gradeDiff = oldIdx - newIdx;
      }

      // Infer Category for pills
      let category = 'Other';
      if (route.stability_class === 'Bedrock Essential' || route.composite_score > 70) category = 'Bedrock Essential';
      else if (route.stability_class === 'Policy Swing Corridor' || (route.vulnerability_score < 40 && route.opportunity_score > 60)) category = 'Policy Swing Corridor';
      else if (route.vulnerability_score > 70) category = 'High Vulnerability';
      
      return {
        ...route,
        liveGrade,
        gradeDiff,
        category
      };
    });
  }, [allRoutesData, weights]);

  // Grade Distribution Histogram
  const gradeDistribution = useMemo(() => {
    const dist = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    processedRoutes.forEach(r => {
      dist[r.liveGrade as keyof typeof dist]++;
    });
    return dist;
  }, [processedRoutes]);

  // Filtering
  const filteredRoutes = useMemo(() => {
    return processedRoutes.filter(r => {
      if (activeGradeFilter && r.liveGrade !== activeGradeFilter) return false;
      if (activeCategoryFilter && r.category !== activeCategoryFilter) return false;
      return true;
    });
  }, [processedRoutes, activeGradeFilter, activeCategoryFilter]);

  // Sorting
  const sortedRoutes = useMemo(() => {
    const sorted = [...filteredRoutes];
    sorted.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (typeof valA === 'string') {
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });
    return sorted;
  }, [filteredRoutes, sortConfig]);

  const handleSort = (key: string) => {
    if (sortConfig.key === key) {
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'desc' });
    }
  };

  const GRADE_COLORS: Record<string, string> = {
    A: 'bg-emerald-500',
    B: 'bg-blue-500',
    C: 'bg-amber-500',
    D: 'bg-orange-500',
    E: 'bg-red-500'
  };

  const downloadCSV = () => {
    if (sortedRoutes.length === 0) return;
    const headers = ['Route ID', 'Route Name', 'Category', 'Live Score', 'Live Grade', 'Baseline Grade', 'Vuln Contrib', 'OffPeak Contrib', 'Mono Contrib', 'Opp Contrib'];
    const rows = sortedRoutes.map(r => [
      r.route_id, 
      `"${r.route_name || r.name || ''}"`,
      r.category,
      r.liveScore.toFixed(2),
      r.liveGrade,
      r.grade || 'C',
      r.v_contrib.toFixed(2),
      r.t_contrib.toFixed(2),
      r.m_contrib.toFixed(2),
      r.o_contrib.toFixed(2)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "network_equity_scores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col font-sans text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex-none p-4 md:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Network Data Explorer</h2>
          <p className="text-sm text-slate-400 mt-1">Live scores calculated using your active policy weights.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-md transition-colors">
            <Download className="w-4 h-4" /> Download CSV
          </button>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Histogram & Filters */}
        <div className="flex-none p-6 border-b border-slate-800 bg-slate-900 space-y-6">
          
          {/* Histogram */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Live Grade Distribution</h3>
            <div className="flex h-12 w-full rounded-lg overflow-hidden shadow-inner border border-slate-700/50">
              {(['A', 'B', 'C', 'D', 'E'] as const).map(grade => {
                const count = gradeDistribution[grade];
                const pct = processedRoutes.length > 0 ? (count / processedRoutes.length) * 100 : 0;
                const isActive = activeGradeFilter === grade;
                return (
                  <div 
                    key={grade}
                    onClick={() => setActiveGradeFilter(isActive ? null : grade)}
                    className={`relative group cursor-pointer transition-all duration-300 flex items-center justify-center border-r border-slate-900/20 last:border-0 ${GRADE_COLORS[grade]} ${isActive ? 'brightness-110 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.5)]' : 'hover:brightness-110 opacity-90'} `}
                    style={{ width: `${pct}%` }}
                  >
                    {pct > 5 && <span className="text-white font-bold text-xs drop-shadow-md z-10">{grade} ({count})</span>}
                  </div>
                )
              })}
            </div>
            {activeGradeFilter && (
              <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filtering by Grade {activeGradeFilter}. <button onClick={() => setActiveGradeFilter(null)} className="underline hover:text-blue-300">Clear</button>
              </p>
            )}
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {['Bedrock Essential', 'Policy Swing Corridor', 'High Vulnerability'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(activeCategoryFilter === cat ? null : cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  activeCategoryFilter === cat 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-950 p-6">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-950/95 backdrop-blur z-20 shadow-sm border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('route_id')}>Route ID</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('category')}>Classification</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('liveScore')}>Live Score</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('liveGrade')}>Grade</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase w-48">Pillar Drivers (Sparkline)</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sortedRoutes.map((r, i) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i < 20 ? i * 0.01 : 0 }}
                    key={r.route_id} 
                    className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors group cursor-default"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">{r.short_name || r.route_id}</div>
                      <div className="text-xs text-slate-500 max-w-[200px] truncate" title={r.route_name || r.name}>{r.route_name || r.name}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">{r.category !== 'Other' ? r.category : '-'}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-lg font-bold text-white">{r.liveScore.toFixed(1)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center justify-center w-8 h-8 rounded font-black text-white ${GRADE_COLORS[r.liveGrade] || 'bg-slate-600'}`}>
                          {r.liveGrade}
                        </span>
                        {/* Ghost Diff Arrow */}
                        {r.gradeDiff > 0 ? (
                          <div className="flex flex-col text-[10px] text-emerald-400 font-bold items-center leading-none" title={`Improved from baseline ${r.grade}`}>
                            <ArrowUp className="w-3 h-3" />
                            <span>{r.gradeDiff}</span>
                          </div>
                        ) : r.gradeDiff < 0 ? (
                          <div className="flex flex-col text-[10px] text-red-400 font-bold items-center leading-none" title={`Dropped from baseline ${r.grade}`}>
                            <ArrowDown className="w-3 h-3" />
                            <span>{Math.abs(r.gradeDiff)}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col text-[10px] text-slate-600 font-bold items-center leading-none" title="Unchanged">
                            <Minus className="w-3 h-3" />
                            <span>-</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {/* Mini Sparkline Bar (100% = max possible score ~100) */}
                      <div className="flex h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner opacity-70 group-hover:opacity-100 transition-opacity">
                        <div style={{ width: `${r.v_contrib}%` }} className="bg-fuchsia-500 hover:brightness-125" title={`Vuln: ${r.v_contrib.toFixed(1)}`} />
                        <div style={{ width: `${r.t_contrib}%` }} className="bg-sky-500 hover:brightness-125" title={`OffPeak: ${r.t_contrib.toFixed(1)}`} />
                        <div style={{ width: `${r.m_contrib}%` }} className="bg-amber-500 hover:brightness-125" title={`Mono: ${r.m_contrib.toFixed(1)}`} />
                        <div style={{ width: `${r.o_contrib}%` }} className="bg-indigo-500 hover:brightness-125" title={`Opp: ${r.o_contrib.toFixed(1)}`} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {sortedRoutes.length === 0 && (
            <div className="py-12 text-center text-slate-500 italic">No routes match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
};
