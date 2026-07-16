"use client";

import React, { useState, useMemo } from 'react';
import { RoutePoint } from '@/components/charts/EquityQuadrant';
import { useRouteStore, MetricKey } from '@/store/routeStore';

export interface DaInfo {
  id: string;
  pop: number;
  low_income_pct: number;
  minority_pct: number;
  senior_pct: number;
  lone_parent_pct?: number;
  recent_immigrant_pct?: number;
  youth_pct?: number;
  vulnerability_index?: number;
  neighbourhood?: string;
}

export interface RouteWithDAs extends RoutePoint {
  da_data: DaInfo[];
}

interface MatrixProps {
  routes: RouteWithDAs[];
  daAreaMap?: Record<string, number>;
}

export const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: 'composite',             label: 'Composite Vulnerability Score', color: '#0F766E' },
  { key: 'low_income_pct',        label: 'Low Income',           color: '#EF4444' },
  { key: 'minority_pct',          label: 'Visible Minority',     color: '#F59E0B' },
  { key: 'senior_pct',            label: 'Seniors',              color: '#8B5CF6' },
  { key: 'lone_parent_pct',       label: 'Lone Parents',         color: '#EC4899' },
  { key: 'recent_immigrant_pct',  label: 'Recent Immigrants',    color: '#10B981' },
  { key: 'youth_pct',             label: 'Youth (15-24)',        color: '#6366F1' },
];

const GRADE_COLORS: Record<string, string> = {
  A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#F97316', E: '#EF4444',
};

function getMetricValue(da: DaInfo, metric: MetricKey): number {
  if (metric === 'composite') {
    return (da.vulnerability_index !== undefined && da.vulnerability_index !== null) ? da.vulnerability_index : (da.low_income_pct + da.minority_pct + da.senior_pct) / 3;
  }
  return da[metric] || 0;
}

const METRIC_HSL: Record<MetricKey, { h: number; s: number; minL: number; maxL: number }> = {
  composite:            { h: 174, s: 76, minL: 20, maxL: 92 },
  low_income_pct:        { h: 0,   s: 84, minL: 35, maxL: 95 },
  minority_pct:          { h: 38,  s: 93, minL: 30, maxL: 95 },
  senior_pct:            { h: 262, s: 89, minL: 35, maxL: 95 },
  lone_parent_pct:       { h: 330, s: 81, minL: 30, maxL: 95 },
  recent_immigrant_pct:  { h: 161, s: 84, minL: 20, maxL: 92 },
  youth_pct:             { h: 239, s: 84, minL: 30, maxL: 95 },
};

// Map a value to a normalized intensity t [0, 1]
function calculateIntensity(
  value: number,
  metric: MetricKey,
  minVal: number,
  maxVal: number,
  meanVal: number,
  stdVal: number
): number {
  if (maxVal === minVal) return 0.0;
  
  if (metric === 'composite') {
    const z = (value - meanVal) / stdVal;
    // Standard logistic sigmoid maps to (0, 1)
    return 1 / (1 + Math.exp(-z));
  } else {
    // For other metrics, use local Min-Max normalization
    return (value - minVal) / (maxVal - minVal);
  }
}

// Map density to circle radius (2.5-12px)
function densityToRadius(density: number, maxDensity: number): number {
  if (maxDensity === 0) return 2.5;
  // Linear scale with wider range makes differences significantly more prominent
  return 2.5 + (density / maxDensity) * 9.5;
}

export const EquityMatrix: React.FC<MatrixProps> = ({ routes, daAreaMap }) => {
  const activeMetric = useRouteStore((s) => s.activeMetric);
  const setActiveMetric = useRouteStore((s) => s.setActiveMetric);
  const selectedRoute = useRouteStore((s) => s.selectedRoute);
  const setSelectedRoute = useRouteStore((s) => s.setSelectedRoute);
  const [hoveredDa, setHoveredDa] = useState<{ da: DaInfo; routeName: string; x: number; y: number } | null>(null);

  // Pre-compute values for scaling
  const { maxPop, maxDensity, minMetric, maxMetric, meanMetric, stdMetric, maxDAs, sortedRoutes } = useMemo(() => {
    let mp = 0, mdens = 0, md = 0;
    let minM = Infinity, maxM = -Infinity;
    
    // Gather all metric values to compute mean and std dev
    const allMetricVals: number[] = [];
    
    routes.forEach((r) => {
      if (r.da_data.length > md) md = r.da_data.length;
      r.da_data.forEach((da) => {
        if (da.pop > mp) mp = da.pop;
        
        const area = daAreaMap?.[da.id] || 1.0;
        const density = da.pop / area;
        if (density > mdens) mdens = density;

        const v = getMetricValue(da, activeMetric);
        allMetricVals.push(v);
        if (v < minM) minM = v;
        if (v > maxM) maxM = v;
      });
    });

    if (minM === Infinity) minM = 0;
    if (maxM === -Infinity) maxM = 100;

    const count = allMetricVals.length;
    const mean = count > 0 ? allMetricVals.reduce((sum, v) => sum + v, 0) / count : 50;
    const variance = count > 0 ? allMetricVals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / count : 0;
    const std = Math.sqrt(variance) || 1.0;

    // Sort by composite score (worst first)
    const sorted = [...routes].sort((a, b) => a.composite_score - b.composite_score);
    return { 
      maxPop: mp, 
      maxDensity: mdens, 
      minMetric: minM, 
      maxMetric: maxM, 
      meanMetric: mean, 
      stdMetric: std, 
      maxDAs: md, 
      sortedRoutes: sorted 
    };
  }, [routes, activeMetric, daAreaMap]);

  if (!routes.length) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-400">
        Awaiting engine data...
      </div>
    );
  }

  const ROW_HEIGHT = 24;
  const LABEL_WIDTH = 60;
  const CHART_WIDTH = Math.max(maxDAs * 22, 400);
  const SVG_HEIGHT = sortedRoutes.length * ROW_HEIGHT + 10;

  // Extract info for the hovered DA
  const hoveredDaArea = hoveredDa ? daAreaMap?.[hoveredDa.da.id] : undefined;
  const hoveredDaDensity = (hoveredDa && hoveredDaArea) ? hoveredDa.da.pop / hoveredDaArea : undefined;

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
          <span>Dot size = Population Density (people/km²)</span>
          <svg width="60" height="26" className="inline-block align-middle">
            <circle cx="6" cy="13" r="2.5" fill="#94A3B8" opacity="0.5"/>
            <circle cx="24" cy="13" r="7" fill="#94A3B8" opacity="0.5"/>
            <circle cx="48" cy="13" r="12" fill="#94A3B8" opacity="0.5"/>
          </svg>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Color intensity = {METRICS.find(m => m.key === activeMetric)?.label}</span>
          <svg width="75" height="12" className="inline-block align-middle">
            {[0.1, 0.325, 0.55, 0.775, 1.0].map((t, i) => {
              const hsl = METRIC_HSL[activeMetric] || { h: 174, s: 76, minL: 20, maxL: 92 };
              const l = hsl.maxL - t * (hsl.maxL - hsl.minL);
              return (
                <circle
                  key={i}
                  cx={6 + i * 14}
                  cy={6}
                  r={5}
                  fill={`hsl(${hsl.h}, ${hsl.s}%, ${l}%)`}
                />
              );
            })}
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
                  const area = daAreaMap?.[da.id] || 1.0;
                  const density = da.pop / area;
                  const r = densityToRadius(density, maxDensity);
                  const val = getMetricValue(da, activeMetric);
                  
                  const intensity = calculateIntensity(val, activeMetric, minMetric, maxMetric, meanMetric, stdMetric);
                  const hsl = METRIC_HSL[activeMetric] || { h: 174, s: 76, minL: 20, maxL: 92 };
                  const l = hsl.maxL - intensity * (hsl.maxL - hsl.minL);
                  const fill = `hsl(${hsl.h}, ${hsl.s}%, ${l}%)`;

                  return (
                    <circle
                      key={da.id}
                      cx={cx}
                      cy={y}
                      r={r}
                      fill={fill}
                      opacity={0.95}
                      stroke="#FFFFFF"
                      strokeWidth={0.5}
                      cursor="pointer"
                      onMouseEnter={(e) => {
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
            {hoveredDa.da.neighbourhood && (
              <p className="font-semibold text-slate-500 text-[9px] uppercase tracking-wide">{hoveredDa.da.neighbourhood}</p>
            )}
            <div className="grid grid-cols-2 gap-x-3 mt-1 text-slate-600">
              <span>DA ID</span>
              <span className="font-mono text-right">{hoveredDa.da.id}</span>
              <span>Population</span>
              <span className="font-mono text-right">{hoveredDa.da.pop.toLocaleString()}</span>
              
              {hoveredDaArea !== undefined && (
                <>
                  <span>Land Area</span>
                  <span className="font-mono text-right">{hoveredDaArea.toFixed(3)} km²</span>
                  <span>Density</span>
                  <span className="font-mono text-right">
                    {Math.round(hoveredDaDensity || 0).toLocaleString()} people/km²
                  </span>
                </>
              )}
              
              <div className="col-span-2 border-t border-slate-100 my-1"></div>
              
              <span className="font-semibold text-brand-slate-700">Transit Vulnerability (V_i)</span>
              <span className="font-semibold text-teal-700 text-right">
                {(hoveredDa.da.vulnerability_index !== undefined ? hoveredDa.da.vulnerability_index : (hoveredDa.da.low_income_pct + hoveredDa.da.minority_pct + hoveredDa.da.senior_pct) / 3).toFixed(1)}
              </span>
              
              <span>Low Income</span>
              <span className="font-mono text-right">{hoveredDa.da.low_income_pct.toFixed(1)}%</span>
              <span>Visible Minority</span>
              <span className="font-mono text-right">{hoveredDa.da.minority_pct.toFixed(1)}%</span>
              <span>Seniors</span>
              <span className="font-mono text-right">{hoveredDa.da.senior_pct.toFixed(1)}%</span>
              
              {hoveredDa.da.lone_parent_pct !== undefined && (
                <>
                  <span>Lone Parents</span>
                  <span className="font-mono text-right">{(hoveredDa.da.lone_parent_pct || 0).toFixed(1)}%</span>
                  <span>Recent Immigrants</span>
                  <span className="font-mono text-right">{(hoveredDa.da.recent_immigrant_pct || 0).toFixed(1)}%</span>
                  <span>Youth (15-24)</span>
                  <span className="font-mono text-right">{(hoveredDa.da.youth_pct || 0).toFixed(1)}%</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
