"use client";

import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

export interface RoutePoint {
  route_id: string;
  name: string;
  short_name: string;
  grade: string;
  composite_score: number;
  total_pop_served: number;
}

interface EquityQuadrantProps {
  data: RoutePoint[];
}

const GRADE_COLORS: Record<string, string> = {
  A: '#10B981', // Emerald
  B: '#3B82F6', // Blue
  C: '#F59E0B', // Amber
  D: '#F97316', // Orange
  E: '#EF4444', // Red
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as RoutePoint;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl px-3 py-2 text-xs">
      <p className="font-bold text-slate-900">{d.name}</p>
      <p className="text-slate-500">Route {d.short_name}</p>
      <div className="flex items-center gap-2 mt-1">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: GRADE_COLORS[d.grade] || '#94A3B8' }}
        />
        <span className="font-semibold text-slate-700">Grade {d.grade}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 mt-1.5 text-slate-600">
        <span>Pop Served</span>
        <span className="text-right font-mono">{d.total_pop_served.toLocaleString()}</span>
        <span>Equity Score</span>
        <span className="text-right font-mono">{d.composite_score.toFixed(1)}</span>
      </div>
    </div>
  );
};

export const EquityQuadrant: React.FC<EquityQuadrantProps> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-slate-400">
        Awaiting engine data...
      </div>
    );
  }

  // Calculate medians for quadrant lines
  const sortedPop = [...data].sort((a, b) => a.total_pop_served - b.total_pop_served);
  const sortedScore = [...data].sort((a, b) => a.composite_score - b.composite_score);
  const medianPop = sortedPop[Math.floor(sortedPop.length / 2)].total_pop_served;
  const medianScore = sortedScore[Math.floor(sortedScore.length / 2)].composite_score;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          type="number"
          dataKey="total_pop_served"
          name="Pop Served"
          tick={{ fontSize: 9, fill: '#64748B' }}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          label={{ value: 'Population Served', position: 'insideBottom', offset: -2, fontSize: 9, fill: '#94A3B8' }}
        />
        <YAxis
          type="number"
          dataKey="composite_score"
          name="Equity Score"
          tick={{ fontSize: 9, fill: '#64748B' }}
          label={{ value: 'Equity Score', angle: -90, position: 'insideLeft', offset: 10, fontSize: 9, fill: '#94A3B8' }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
        <ReferenceLine x={medianPop} stroke="#CBD5E1" strokeDasharray="4 4" />
        <ReferenceLine y={medianScore} stroke="#CBD5E1" strokeDasharray="4 4" />
        <Scatter data={data} animationDuration={600}>
          {data.map((entry, i) => (
            <Cell
              key={`cell-${i}`}
              fill={GRADE_COLORS[entry.grade] || '#94A3B8'}
              fillOpacity={0.75}
              r={4}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};
