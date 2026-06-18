"use client";

import React, { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { useRouteStore } from '@/store/routeStore';

interface SensitivityRow {
  route_id: string;
  name: string;
  short_name: string;
  score_mean: number;
  score_std: number;
  score_min: number;
  score_max: number;
  grade_stability_ab: number;
  grade_stability_de: number;
  stability_class: string;
  driver_vulnerability: number;
  driver_temporal: number;
  driver_monopoly: number;
  driver_opportunity: number;
}

interface RouteStabilityScatterProps {
  sensitivityData: Record<string, SensitivityRow>;
}

// Color map aligning with the user's Policy Risk Map design:
// Always High Equity (Bedrock Essential) -> Dark Navy
// Always Low Equity (Bedrock Resilient) -> Steel Blue
// High Swing Routes (Policy Swing Corridor) -> Coral / Rose
// Moderate Stability -> Yellow / Amber
const CLASS_COLORS: Record<string, string> = {
  'Bedrock Essential': '#2E4057',       // Always High Equity
  'Bedrock Resilient': '#68889E',       // Always Low Equity
  'Policy Swing Corridor': '#E85F5C',   // High Swing Routes
  'Moderate Stability': '#F4B942',      // Moderate Stability
};

const CLASS_LABELS: Record<string, string> = {
  'Bedrock Essential': 'Always High Equity',
  'Bedrock Resilient': 'Always Low Equity',
  'Policy Swing Corridor': 'High Swing Routes',
  'Moderate Stability': 'Moderate Stability',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as SensitivityRow;

  // Determine primary driver
  const drivers = [
    { name: 'Vulnerability', val: d.driver_vulnerability },
    { name: 'Off Peak Service', val: d.driver_temporal },
    { name: 'Monopoly', val: d.driver_monopoly },
    { name: 'Opportunity', val: d.driver_opportunity },
  ];
  const primaryDriver = drivers.sort((a, b) => b.val - a.val)[0].name;

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl px-3.5 py-2.5 text-xs max-w-sm">
      <p className="font-bold text-slate-900">{d.name}</p>
      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
        {CLASS_LABELS[d.stability_class] || d.stability_class} (Route {d.short_name})
      </p>

      <div className="mt-2 space-y-1 text-slate-600 pt-1.5 border-t border-slate-100">
        <div className="flex justify-between gap-4">
          <span>Mean Score:</span>
          <span className="font-bold text-slate-800">{d.score_mean.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Volatility ($R_r$):</span>
          <span className="font-bold text-slate-800">{d.score_std.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Primary Driver:</span>
          <span className="font-semibold text-brand-teal-600">{primaryDriver}</span>
        </div>
        <div className="flex justify-between gap-4 text-[10px] text-slate-400 mt-1 italic">
          <span>Range: {d.score_min.toFixed(0)} - {d.score_max.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};

export const RouteStabilityScatter: React.FC<RouteStabilityScatterProps> = ({ sensitivityData }) => {
  const selectedRoute = useRouteStore((state) => state.selectedRoute);
  const setSelectedRoute = useRouteStore((state) => state.setSelectedRoute);
  const selectedStabilityClasses = useRouteStore((state) => state.selectedStabilityClasses);

  const chartData = useMemo(() => {
    const raw = Object.values(sensitivityData).filter((row) => {
      if (!selectedStabilityClasses.length) return true;
      return selectedStabilityClasses.includes(row.stability_class);
    });
    // Explicitly sort by score_mean so Cell elements map correctly to Recharts internal plot order!
    return raw.sort((a, b) => a.score_mean - b.score_mean);
  }, [sensitivityData, selectedStabilityClasses]);

  const handlePointClick = (data: any) => {
    if (data && data.route_id) {
      if (selectedRoute === data.route_id) {
        setSelectedRoute(null);
      } else {
        setSelectedRoute(data.route_id);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {/* Legend */}
      <div className="flex justify-center gap-5 text-[10px] font-semibold text-slate-500 mb-2 mt-1 flex-wrap">
        {Object.entries(CLASS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: CLASS_COLORS[key] }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 w-full relative">
        <ResponsiveContainer width="100%" height="95%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 25, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              type="number"
              dataKey="score_mean"
              name="Mean Score"
              domain={[0, 100]}
              tickCount={5}
              stroke="#94A3B8"
              fontSize={10}
              label={{
                value: 'Mean Score (Overall Priority Rank)',
                position: 'bottom',
                offset: 5,
                fontSize: 10,
                fill: '#64748B',
                fontWeight: 600
              }}
            />
            <YAxis
              type="number"
              dataKey="score_std"
              name="Volatility"
              domain={[0, 40]}
              tickCount={5}
              stroke="#94A3B8"
              fontSize={10}
              label={{
                value: 'Robustness Index (Rr) — Volatility',
                angle: -90,
                position: 'insideLeft',
                offset: -10,
                fontSize: 10,
                fill: '#64748B',
                fontWeight: 600
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter
              data={chartData}
              onClick={(node) => handlePointClick(node.payload)}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => {
                const isSelected = selectedRoute === entry.route_id;
                const isDimmed = selectedRoute !== null && !isSelected;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={CLASS_COLORS[entry.stability_class] || '#64748B'}
                    fillOpacity={isSelected ? 1.0 : isDimmed ? 0.15 : 0.8}
                    stroke={isSelected ? '#0F766E' : 'transparent'}
                    strokeWidth={isSelected ? 2 : 0}
                    r={isSelected ? 6.5 : 4}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
