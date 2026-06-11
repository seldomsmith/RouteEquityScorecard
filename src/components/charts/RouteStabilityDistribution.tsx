"use client";

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { useRouteStore } from '@/store/routeStore';
import { RoutePoint } from '@/components/charts/EquityQuadrant';

interface RouteStabilityDistributionProps {
  data: RoutePoint[];
}

const STABILITY_COLORS: Record<string, string> = {
  'Bedrock Essential': '#4F46E5',     // Indigo
  'Bedrock Resilient': '#10B981',     // Emerald
  'Policy Swing Corridor': '#F59E0B', // Amber
  'Moderate Stability': '#94A3B8',    // Slate
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl px-3 py-2 text-xs">
      <p className="font-bold text-slate-900">{d.name}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: STABILITY_COLORS[d.name] || '#94A3B8' }}
        />
        <span className="font-semibold text-slate-700">Count: {d.count}</span>
      </div>
      <p className="text-[10px] text-slate-400 mt-1">Click to isolate on map/list</p>
    </div>
  );
};

export const RouteStabilityDistribution: React.FC<RouteStabilityDistributionProps> = ({ data }) => {
  const disabledWeights = useRouteStore((state) => state.disabledWeights);
  const selectedStabilityClasses = useRouteStore((state) => state.selectedStabilityClasses);
  const toggleStabilityClass = useRouteStore((state) => state.toggleStabilityClass);

  const is2PillarActive = disabledWeights.includes('resilience') && disabledWeights.includes('monopoly');

  // Compute counts dynamically
  const counts = React.useMemo(() => {
    const c = {
      'Bedrock Essential': 0,
      'Bedrock Resilient': 0,
      'Policy Swing Corridor': 0,
      'Moderate Stability': 0,
    };
    
    data.forEach((r) => {
      const cls = is2PillarActive ? r.stability_class_2_pillar : r.stability_class;
      const key = cls || 'Moderate Stability';
      if (key in c) {
        c[key as keyof typeof c]++;
      } else {
        c['Moderate Stability']++;
      }
    });
    
    return Object.entries(c).map(([name, count]) => ({
      name,
      count,
    }));
  }, [data, is2PillarActive]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={counts}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 9, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
        <Bar
          dataKey="count"
          radius={[4, 4, 0, 0]}
          cursor="pointer"
        >
          {counts.map((entry, index) => {
            const isSelected = selectedStabilityClasses.includes(entry.name);
            const isAnySelected = selectedStabilityClasses.length > 0;
            const fillOpacity = isAnySelected ? (isSelected ? 1.0 : 0.3) : 0.85;
            
            return (
              <Cell
                key={`cell-${index}`}
                fill={STABILITY_COLORS[entry.name] || '#94A3B8'}
                fillOpacity={fillOpacity}
                onClick={() => toggleStabilityClass(entry.name)}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};