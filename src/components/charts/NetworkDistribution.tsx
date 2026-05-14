"use client";

import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell
} from 'recharts';
import { RoutePoint } from './EquityQuadrant';

interface NetworkDistributionProps {
  data: RoutePoint[];
}

const GRADE_COLORS: Record<string, string> = {
  A: '#10B981', // Emerald
  B: '#3B82F6', // Blue
  C: '#F59E0B', // Amber
  D: '#F97316', // Orange
  E: '#EF4444', // Red
};

export const NetworkDistribution: React.FC<NetworkDistributionProps> = ({ data }) => {
  // 1. Bin data for the "Bell Curve" (Area Chart)
  const distributionData = useMemo(() => {
    if (!data.length) return [];
    
    // Create bins from 0 to 100 with step 5
    const bins = Array.from({ length: 21 }, (_, i) => ({
      binStart: i * 5,
      binEnd: (i + 1) * 5,
      label: `${i * 5}`,
      count: 0,
      routes: [] as string[]
    }));

    data.forEach(route => {
      const score = Math.max(0, Math.min(100, route.composite_score));
      let binIndex = Math.floor(score / 5);
      if (binIndex > 20) binIndex = 20;
      bins[binIndex].count += 1;
      bins[binIndex].routes.push(route.short_name);
    });

    return bins;
  }, [data]);

  // 2. Grade Summary Table
  const gradeSummary = useMemo(() => {
    if (!data.length) return [];
    
    const grades = ['A', 'B', 'C', 'D', 'E'];
    const summary = grades.map(g => ({
      grade: g,
      count: 0,
      minScore: 100,
      maxScore: 0,
    }));

    data.forEach(route => {
      const s = summary.find(x => x.grade === route.grade);
      if (s) {
        s.count += 1;
        s.minScore = Math.min(s.minScore, route.composite_score);
        s.maxScore = Math.max(s.maxScore, route.composite_score);
      }
    });

    return summary.map(s => ({
      ...s,
      percentage: ((s.count / data.length) * 100).toFixed(1),
      range: s.count > 0 ? `${s.minScore.toFixed(1)} - ${s.maxScore.toFixed(1)}` : 'N/A'
    }));
  }, [data]);

  // 3. Pillar Variance Spread
  const pillarSpread = useMemo(() => {
    if (!data.length) return [];

    const pillars = [
      { key: 'pillar_1', label: 'Vulnerability' },
      { key: 'pillar_2', label: 'Temporal Resilience' },
      { key: 'pillar_3', label: 'Network Monopoly' },
      { key: 'pillar_4', label: 'Opportunity Access' },
    ];

    return pillars.map(p => {
      const values = data.map(r => (r as any)[p.key] || 0);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      return {
        name: p.label,
        min: Number(min.toFixed(1)),
        max: Number(max.toFixed(1)),
        avg: Number(avg.toFixed(1)),
        // For Recharts range bar, data format is [min, max]
        range: [Number(min.toFixed(1)), Number(max.toFixed(1))]
      };
    });
  }, [data]);

  if (!data.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      
      {/* 1. Grade Summary Table */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Network Grade Distribution</h3>
          <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
            The 235 routes are distributed across quintiles based on relative equity performance.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 text-[10px] font-bold text-slate-400 uppercase">Grade</th>
                <th className="py-2 text-[10px] font-bold text-slate-400 uppercase text-right">Routes</th>
                <th className="py-2 text-[10px] font-bold text-slate-400 uppercase text-right">% Network</th>
                <th className="py-2 text-[10px] font-bold text-slate-400 uppercase text-right">Score Range</th>
              </tr>
            </thead>
            <tbody>
              {gradeSummary.map((row) => (
                <tr key={row.grade} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-2">
                    <span 
                      className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: GRADE_COLORS[row.grade] }}
                    >
                      {row.grade}
                    </span>
                  </td>
                  <td className="py-2 text-xs font-medium text-slate-700 text-right">{row.count}</td>
                  <td className="py-2 text-xs text-slate-500 text-right">{row.percentage}%</td>
                  <td className="py-2 text-[10px] text-slate-400 text-right tabular-nums">{row.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Equity Score Bell Curve */}
      <div className="glass-panel p-4 flex flex-col lg:col-span-2">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Composite Score Distribution (S-Curve)</h3>
          <p className="text-[10px] text-slate-500">
            Density of route scores. The sigmoid transform stretches lifelines (right) and compresses standard coverage (middle).
          </p>
        </div>
        
        <div className="flex-1 min-h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10, fill: '#64748B' }} 
                tickMargin={5}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748B' }} 
              />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1E293B', fontSize: '12px' }}
                formatter={(value: number) => [`${value} routes`, 'Count']}
                labelFormatter={(label) => `Score: ${label} - ${Number(label)+5}`}
              />
              {/* Quintile Reference Lines (approximate based on current data cutoffs) */}
              <ReferenceLine x="15" stroke={GRADE_COLORS.E} strokeDasharray="3 3" label={{ position: 'top', value: 'E', fill: GRADE_COLORS.E, fontSize: 10 }} />
              <ReferenceLine x="30" stroke={GRADE_COLORS.D} strokeDasharray="3 3" label={{ position: 'top', value: 'D', fill: GRADE_COLORS.D, fontSize: 10 }} />
              <ReferenceLine x="55" stroke={GRADE_COLORS.C} strokeDasharray="3 3" label={{ position: 'top', value: 'C', fill: GRADE_COLORS.C, fontSize: 10 }} />
              <ReferenceLine x="85" stroke={GRADE_COLORS.B} strokeDasharray="3 3" label={{ position: 'top', value: 'B', fill: GRADE_COLORS.B, fontSize: 10 }} />
              
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#0F766E" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCount)" 
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
