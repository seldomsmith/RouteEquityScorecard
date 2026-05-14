"use client";

import React, { useState, useMemo } from 'react';
import { RoutePoint } from '@/components/charts/EquityQuadrant';
import { useRouteStore } from '@/store/routeStore';

export interface DaInfo {
  id: string;
  pop: number;
  low_income_pct: number;
  minority_pct: number;
  senior_pct: number;
}

export interface RouteWithDAs extends RoutePoint {
  da_data: DaInfo[];
}

interface MatrixProps {
  routes: RouteWithDAs[];
}

type MetricKey = 'composite' | 'low_income_pct' | 'minority_pct' | 'senior_pct';

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: 'composite',       label: 'All Factors',       color: '#0F766E' },
  { key: 'low_income_pct',  label: 'Low Income',        color: '#EF4444' },
  { key: 'minority_pct',    label: 'Visible Minority',  color: '#F59E0B' },
  { key: 'senior_pct',      label: 'Seniors',           color: '#8B5CF6' },
];

const GRADE_COLORS: Record<string, string> = {
  A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#F97316', E: '#EF4444',
};

function getMetricValue(da: DaInfo, metric: MetricKey): number {
  if (metric === 'composite') {
    return (da.low_income_pct + da.minority_pct + da.senior_pct) / 3;
  }
  return da[metric];
}

// Map a value 0-100 to opacity 0.15-1.0
function intensityToOpacity(value: number, maxVal: number): number {
  if (maxVal === 0) return 0.15;
  return 0.15 + (value / maxVal) * 0.85;
}

// Map population to circle radius (3-10px)
function popToRadius(pop: number, maxPop: number): number {
  if (maxPop === 0) return 3;
  return 3 + (Math.sqrt(pop / maxPop)) * 7;
}

export const EquityMatrix: React.FC<MatrixProps> = ({ routes }) => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('composite');
  const selectedRoute = useRouteStore((s) => s.selectedRoute);
  const setSelectedRoute = useRouteStore((s) => s.setSelectedRoute);
  const [hoveredDa, setHoveredDa] = useState<{ da: DaInfo; routeName: string; x: number; y: number } | null>(null);

  // Pre-compute max values for scaling
  const { maxPop, maxMetric, maxDAs, sortedRoutes } = useMemo(() => {
    let mp = 0, mm = 0, md = 0;
    routes.forEach((r) => {
      if (r.da_data.length > md) md = r.da_data.length;
      r.da_data.forEach((da) => {
        if (da.pop > mp) mp = da.pop;
        const v = getMetricValue(da, activeMetric);
        if (v > mm) mm = v;
      });
    });
    // Sort by composite score (worst first)
    const sorted = [...routes].sort((a, b) => a.composite_score - b.composite_score);
    return { maxPop: mp, maxMetric: mm, maxDAs: md, sortedRoutes: sorted };
  }, [routes, activeMetric]);

  if (!routes.length) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-400">
        Awaiting engine data...
      </div>
    );
  }

  const activeColor = METRICS.find((m) => m.key === activeMetric)?.color || '#0F766E';
  const ROW_HEIGHT = 24;
  const LABEL_WIDTH = 60;
  const CHART_WIDTH = Math.max(maxDAs * 22, 400);
  const SVG_HEIGHT = sortedRoutes.length * ROW_HEIGHT + 10;

  return (
    <div className="command-card bg-brand-slate-50/50 p-4">
      {/* Header + Metric Toggles */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-widest">
          Equity Dissemination Matrix
        </span>
        <div className="flex gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-200 border ${
                activeMetric === m.key
                  ? 'text-white shadow-sm'
                  : 'text-slate-500 bg-white border-slate-200 hover:border-slate-300'
              }`}
              style={activeMetric === m.key ? { backgroundColor: m.color, borderColor: m.color } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-2 text-[9px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span>Dot size = Population</span>
          <svg width="40" height="12"><circle cx="6" cy="6" r="3" fill="#94A3B8" opacity="0.5"/><circle cx="20" cy="6" r="5" fill="#94A3B8" opacity="0.5"/><circle cx="36" cy="6" r="7" fill="#94A3B8" opacity="0.5"/></svg>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Color intensity = {METRICS.find(m => m.key === activeMetric)?.label}</span>
          <svg width="60" height="12">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((op, i) => (
              <circle key={i} cx={6 + i * 13} cy={6} r={5} fill={activeColor} opacity={op}/>
            ))}
          </svg>
        </div>
      </div>

      {/* Scrollable Matrix */}
      <div className="overflow-auto max-h-[600px] custom-scrollbar border border-slate-200 rounded-lg bg-white relative">
        <svg
          width={LABEL_WIDTH + CHART_WIDTH + 20}
          height={SVG_HEIGHT}
          className="block"
        >
          {sortedRoutes.map((route, rowIdx) => {
            const y = rowIdx * ROW_HEIGHT + ROW_HEIGHT / 2 + 5;
            const isSelected = selectedRoute === route.route_id;

            return (
              <g key={route.route_id}>
                {/* Row background highlight */}
                {isSelected && (
                  <rect
                    x={0}
                    y={y - ROW_HEIGHT / 2}
                    width={LABEL_WIDTH + CHART_WIDTH + 20}
                    height={ROW_HEIGHT}
                    fill="#0F766E"
                    opacity={0.06}
                  />
                )}

                {/* Route label */}
                <text
                  x={LABEL_WIDTH - 4}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={9}
                  fontFamily="ui-monospace, monospace"
                  fontWeight={isSelected ? 700 : 500}
                  fill={isSelected ? '#0F766E' : '#64748B'}
                  cursor="pointer"
                  onClick={() => setSelectedRoute(isSelected ? null : route.route_id)}
                >
                  {route.short_name}
                </text>

                {/* Grade dot */}
                <circle
                  cx={LABEL_WIDTH + 6}
                  cy={y}
                  r={3}
                  fill={GRADE_COLORS[route.grade] || '#94A3B8'}
                />

                {/* DA dots */}
                {route.da_data.map((da, daIdx) => {
                  const cx = LABEL_WIDTH + 20 + daIdx * 20;
                  const r = popToRadius(da.pop, maxPop);
                  const val = getMetricValue(da, activeMetric);
                  const opacity = intensityToOpacity(val, maxMetric);

                  return (
                    <circle
                      key={da.id}
                      cx={cx}
                      cy={y}
                      r={r}
                      fill={activeColor}
                      opacity={opacity}
                      cursor="pointer"
                      onMouseEnter={(e) => {
                        const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
                        setHoveredDa({
                          da,
                          routeName: `${route.short_name} — ${route.name}`,
                          x: cx,
                          y: y,
                        });
                      }}
                      onMouseLeave={() => setHoveredDa(null)}
                      onClick={() => setSelectedRoute(isSelected ? null : route.route_id)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredDa && (
          <div
            className="absolute bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl px-3 py-2 text-xs pointer-events-none z-20"
            style={{
              left: hoveredDa.x + 15,
              top: hoveredDa.y - 30,
            }}
          >
            <p className="font-bold text-slate-800 text-[10px]">{hoveredDa.routeName}</p>
            <div className="grid grid-cols-2 gap-x-3 mt-1 text-slate-600">
              <span>DA ID</span>
              <span className="font-mono text-right">{hoveredDa.da.id}</span>
              <span>Population</span>
              <span className="font-mono text-right">{hoveredDa.da.pop.toLocaleString()}</span>
              <span>Low Income</span>
              <span className="font-mono text-right">{hoveredDa.da.low_income_pct.toFixed(1)}%</span>
              <span>Minority</span>
              <span className="font-mono text-right">{hoveredDa.da.minority_pct.toFixed(1)}%</span>
              <span>Seniors</span>
              <span className="font-mono text-right">{hoveredDa.da.senior_pct.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
