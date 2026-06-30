"use client";

import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { useRouteStore } from '@/store/routeStore';

export interface RoutePoint {
  route_id: string;
  name: string;
  short_name: string;
  grade: string;
  composite_score: number;
  total_pop_served: number;
  pillar_1: number;
  pillar_2: number;
  pillar_3: number;
  pillar_4: number;
  coords: number[][];  // [[lat, lng], ...]
  stability_class?: string;
  trip_count?: number;
  category?: string;
  route_length_km?: number;
  da_data?: {
    id: string;
    pop: number;
    low_income_pct: number;
    minority_pct: number;
    senior_pct: number;
    lone_parent_pct?: number;
    recent_immigrant_pct?: number;
    youth_pct?: number;
    vulnerability_index?: number;
  }[];
}

interface EquityQuadrantProps {
  data: RoutePoint[];
  allRoutes?: RoutePoint[];
}

const GRADE_COLORS: Record<string, string> = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#F97316',
  E: '#EF4444',
};

const computeRouteCosts = (r: RoutePoint) => {
  const category = r.category || 'bus_regular';
  const trip_count = r.trip_count || 0;
  const route_length_km = r.route_length_km || 0;
  
  // Cost per hour mapping
  let costPerHour = 130;
  let speedKmh = 20;
  
  if (category === 'lrt') {
    costPerHour = 260;
    speedKmh = 30;
  } else if (category === 'bus_high_freq') {
    costPerHour = 160;
    speedKmh = 20;
  }
  
  // Trip duration in hours (min 9 minutes/0.15h, max 2.0h)
  let tripDurationHours = route_length_km > 0 ? (route_length_km / speedKmh) : 0.5;
  tripDurationHours = Math.max(0.15, Math.min(2.0, tripDurationHours));
  
  // Weekly operating cost
  const weeklyCost = trip_count * tripDurationHours * costPerHour;
  
  // Cost per equity point
  const costPerEquityPoint = r.composite_score > 0 ? (weeklyCost / r.composite_score) : weeklyCost;
  
  return {
    costPerHour,
    tripDurationHours,
    weeklyCost,
    costPerEquityPoint,
    categoryName: category === 'lrt' ? 'LRT' : category === 'bus_high_freq' ? 'High Frequency Bus' : 'Regular Bus'
  };
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as RoutePoint;
  const { costPerHour, weeklyCost, costPerEquityPoint, categoryName } = computeRouteCosts(d);
  
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl px-3.5 py-2.5 text-xs max-w-sm">
      <p className="font-bold text-slate-900">{d.name}</p>
      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{categoryName} (Route {d.short_name})</p>
      
      <div className="flex items-center gap-2 mt-1.5 border-b border-slate-100 pb-1.5">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: GRADE_COLORS[d.grade] || '#94A3B8' }}
        />
        <span className="font-semibold text-slate-700">Grade {d.grade} (REI: {d.composite_score.toFixed(1)})</span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-slate-600">
        <span className="font-medium">Pop. Served:</span>
        <span className="text-right font-mono font-semibold text-slate-800">{d.total_pop_served.toLocaleString()}</span>
        
        <span className="font-medium">Route Length:</span>
        <span className="text-right font-mono text-slate-700">{(d.route_length_km || 0).toFixed(1)} km</span>
        
        <span className="font-medium">Weekly Trips:</span>
        <span className="text-right font-mono text-slate-700">{d.trip_count || 0}</span>
        
        <span className="font-medium">Cost / Service Hour:</span>
        <span className="text-right font-mono text-slate-700">${costPerHour}/hr</span>
        
        <span className="font-medium text-teal-600">Weekly Est. Cost:</span>
        <span className="text-right font-mono font-bold text-teal-700">
          ${Math.round(weeklyCost).toLocaleString()}
        </span>
        
        <span className="font-medium text-indigo-600">Cost / Equity Point:</span>
        <span className="text-right font-mono font-bold text-indigo-700">
          ${Math.round(costPerEquityPoint).toLocaleString()}/pt
        </span>
      </div>
    </div>
  );
};

export const EquityQuadrant: React.FC<EquityQuadrantProps> = ({ data, allRoutes }) => {
  const selectedRoute = useRouteStore((state) => state.selectedRoute);
  const setSelectedRoute = useRouteStore((state) => state.setSelectedRoute);
  const [xAxisMetric, setXAxisMetric] = React.useState<'pop_served' | 'weekly_cost' | 'equity_efficiency'>('pop_served');

  // Pre-calculate and map the cost variables onto the datasets for graphing
  // (hooks must always run, even when data is empty)
  const mappedData = React.useMemo(() => {
    return data.map(r => {
      const { costPerHour, weeklyCost, costPerEquityPoint } = computeRouteCosts(r);
      return {
        ...r,
        weekly_cost: Math.round(weeklyCost),
        hourly_cost: costPerHour,
        equity_efficiency: Math.round(costPerEquityPoint)
      };
    });
  }, [data]);

  const mappedAllRoutes = React.useMemo(() => {
    const ref = allRoutes && allRoutes.length > 0 ? allRoutes : data;
    return ref.map(r => {
      const { costPerHour, weeklyCost, costPerEquityPoint } = computeRouteCosts(r);
      return {
        ...r,
        weekly_cost: Math.round(weeklyCost),
        hourly_cost: costPerHour,
        equity_efficiency: Math.round(costPerEquityPoint)
      };
    });
  }, [allRoutes, data]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-slate-400">
        Awaiting engine data...
      </div>
    );
  }

  // Set configuration details for the dynamic X-axis
  let xKey = 'total_pop_served';
  let xLabel = 'Population Served';
  let xTickFormatter = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
  
  if (xAxisMetric === 'weekly_cost') {
    xKey = 'weekly_cost';
    xLabel = 'Weekly Operating Cost ($)';
    xTickFormatter = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;
  } else if (xAxisMetric === 'hourly_cost') {
    xKey = 'hourly_cost';
    xLabel = 'Cost per Service Hour ($/hr)';
    xTickFormatter = (v: number) => `$${v}`;
  } else if (xAxisMetric === 'equity_efficiency') {
    xKey = 'equity_efficiency';
    xLabel = 'Cost per Equity Point ($/pt)';
    xTickFormatter = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;
  }

  // Position reference lines based on the median values across the full system
  const sortedX = [...mappedAllRoutes].sort((a, b) => (a[xKey as keyof typeof a] as number) - (b[xKey as keyof typeof b] as number));
  const medianX = sortedX.length > 0 ? (sortedX[Math.floor(sortedX.length / 2)][xKey as keyof typeof sortedX[0]] as number) : 0;
  
  const sortedScore = [...mappedAllRoutes].sort((a, b) => a.composite_score - b.composite_score);
  const medianScore = sortedScore.length > 0 ? sortedScore[Math.floor(sortedScore.length / 2)].composite_score : 50;

  // Calculate static max bounds for the graph
  const maxX = mappedAllRoutes.length > 0 ? Math.max(...mappedAllRoutes.map(r => r[xKey as keyof typeof r] as number)) : 1000;
  const xMax = xAxisMetric === 'hourly_cost' ? 300 : Math.ceil(maxX * 1.05);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Dynamic Selector Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          X-Axis Metric
        </span>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {(
            [
              { key: 'pop_served', label: 'Pop. Served' },
              { key: 'weekly_cost', label: 'Weekly Cost' },
              { key: 'equity_efficiency', label: 'Cost/REI Point' }
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setXAxisMetric(item.key)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all uppercase tracking-wider ${
                xAxisMetric === item.key
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              type="number"
              dataKey={xKey}
              name={xLabel}
              domain={[0, xMax]}
              tick={{ fontSize: 9, fill: '#64748B' }}
              tickFormatter={xTickFormatter}
              label={{ value: xLabel, position: 'insideBottom', offset: -2, fontSize: 9, fill: '#94A3B8' }}
            />
            <YAxis
              type="number"
              dataKey="composite_score"
              name="Equity Score"
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: '#64748B' }}
              label={{ value: 'Equity Score', angle: -90, position: 'insideLeft', offset: 10, fontSize: 9, fill: '#94A3B8' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <ReferenceLine x={medianX} stroke="#CBD5E1" strokeDasharray="4 4" />
            <ReferenceLine y={medianScore} stroke="#CBD5E1" strokeDasharray="4 4" />
            <Scatter data={mappedData} animationDuration={600}>
              {mappedData.map((entry, i) => {
                const isSelected = selectedRoute === entry.route_id;
                const isAnySelected = selectedRoute !== null;
                const opacity = isAnySelected ? (isSelected ? 1.0 : 0.15) : 0.75;
                const radius = isAnySelected ? (isSelected ? 6 : 3) : 4;
                const stroke = isSelected ? '#1E293B' : 'none';
                const strokeWidth = isSelected ? 1.5 : 0;

                return (
                  <Cell
                    key={`cell-${i}`}
                    fill={GRADE_COLORS[entry.grade] || '#94A3B8'}
                    fillOpacity={opacity}
                    r={radius}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    cursor="pointer"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedRoute(null);
                      } else {
                        setSelectedRoute(entry.route_id);
                      }
                    }}
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
