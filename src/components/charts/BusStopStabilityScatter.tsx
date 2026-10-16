"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Maximize2, X, Compass, Filter } from 'lucide-react';

export interface BusStopStabilityPoint {
  stop_id: string;
  stop_name: string;
  stability_class: string;
  score_mean: number;
  score_std: number;
  score_min: number;
  score_max: number;
  score_range: number;
  grade_spread: number;
  count_a: number;
  count_b: number;
  count_c: number;
  count_d: number;
  count_e: number;
  pct_high_equity: number;
  pct_low_equity: number;
  top_positive_driver: string;
  top_negative_driver: string;
}

const CLASS_COLORS: Record<string, string> = {
  'Essential Equity Bus Stop': '#7C3AED',       // Royal Purple
  'High Swing Bus Stop': '#EF4444',             // Red / Crimson
  'Low Swing Bus Stop': '#F59E0B',              // Amber
  'Always Low Equity Bus Stop': '#EA580C',      // Orange
};

function generateNormalDistribution(mean: number, std: number) {
  const validStd = std && std > 0 ? std : 1.0;
  const points = [];
  for (let x = 0; x <= 100; x += 2) {
    const exponent = Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(validStd, 2)));
    const y = (1 / (validStd * Math.sqrt(2 * Math.PI))) * exponent;
    points.push({ x, y });
  }
  return points;
}

const CustomChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: BusStopStabilityPoint = payload[0].payload;
  if (!d) return null;

  const mean = typeof d.score_mean === 'number' ? d.score_mean : 50;
  const std = typeof d.score_std === 'number' ? d.score_std : 5;
  const sparklineData = generateNormalDistribution(mean, std);
  const color = CLASS_COLORS[d.stability_class] || '#64748B';

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl p-4 text-xs w-72 text-slate-900 overflow-hidden relative pointer-events-none">
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10 space-y-2">
        <div>
          <span className="font-mono text-[10px] font-bold text-slate-400">Stop #{d.stop_id}</span>
          <p className="font-black text-slate-900 text-sm truncate">{d.stop_name}</p>
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: color }}
          >
            {d.stability_class}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
          <div>
            <span className="text-[10px] text-slate-400 font-medium">Mean Score:</span>
            <div className="font-mono font-black text-sm" style={{ color }}>
              {mean.toFixed(1)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-medium">Volatility (σ):</span>
            <div className="font-mono font-black text-sm text-slate-800">
              {std.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg font-mono flex justify-between">
          <span>A: {d.count_a} &bull; B: {d.count_b}</span>
          <span>C: {d.count_c}</span>
          <span>D: {d.count_d} &bull; E: {d.count_e}</span>
        </div>

        {/* Normal Distribution Sparkline */}
        <div className="h-14 w-full -mx-1 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${d.stop_id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="y"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#spark-${d.stop_id})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between w-full text-[8px] text-slate-400 font-bold px-1">
          <span>0 (Low Equity)</span>
          <span>100 (High Equity)</span>
        </div>
      </div>
    </div>
  );
};

export const BusStopStabilityScatter: React.FC = () => {
  const [data, setData] = useState<BusStopStabilityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [classFilter, setClassFilter] = useState<string>('ALL');

  useEffect(() => {
    fetch('/data/bus_stop_sensitivity_summary.csv')
      .then((res) => res.text())
      .then((csvText) => {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');

        const parsed: BusStopStabilityPoint[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',');
          if (row.length < 18) continue;

          parsed.push({
            stop_id: row[0],
            stop_name: row[1],
            stability_class: row[2],
            score_mean: parseFloat(row[3]) || 50,
            score_std: parseFloat(row[4]) || 5,
            score_min: parseFloat(row[5]) || 0,
            score_max: parseFloat(row[6]) || 100,
            score_range: parseFloat(row[7]) || 0,
            grade_spread: parseInt(row[8], 10) || 0,
            count_a: parseInt(row[9], 10) || 0,
            count_b: parseInt(row[10], 10) || 0,
            count_c: parseInt(row[11], 10) || 0,
            count_d: parseInt(row[12], 10) || 0,
            count_e: parseInt(row[13], 10) || 0,
            pct_high_equity: parseFloat(row[14]) || 0,
            pct_low_equity: parseFloat(row[15]) || 0,
            top_positive_driver: row[16],
            top_negative_driver: row[17],
          });
        }
        setData(parsed);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load bus stop sensitivity CSV:', err);
        setLoading(false);
      });
  }, []);

  // Filter and downsample for smooth rendering while preserving key case study stops
  const plotData = useMemo(() => {
    if (data.length === 0) return [];
    const filtered = classFilter === 'ALL' ? data : data.filter((d) => d.stability_class === classFilter);

    // Always include key stops
    const keyStopIds = new Set(['6586', '2821', '1745', '1001']);
    const step = Math.max(1, Math.floor(filtered.length / 900));

    const sampled: BusStopStabilityPoint[] = [];
    filtered.forEach((item, idx) => {
      if (keyStopIds.has(item.stop_id) || idx % step === 0) {
        sampled.push(item);
      }
    });

    return sampled;
  }, [data, classFilter]);

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFullscreen(false)} />
      )}

      <div
        className={
          isFullscreen
            ? "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] h-[88vh] max-w-6xl bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl flex flex-col"
            : "w-full h-[580px] bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)] mt-6 relative"
        }
      >
        {/* Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors z-10"
          title={isFullscreen ? "Close Fullscreen" : "Expand to Fullscreen"}
        >
          {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* Title */}
        <div className="text-center mb-3 mt-1">
          <span className="text-sm font-black text-emerald-900 uppercase tracking-wider">
            CIMD Sensitivity Map: Mean Score vs. Volatility
          </span>
          <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
            Stop #6586 (Purple), Stop #2821 (Red), and Stop #1745 (Orange) highlighted relative to all 5,724 Edmonton municipal bus stops. Hover over any stop to inspect its score distribution.
          </p>
        </div>

        {/* Legend & Filter Controls */}
        <div className="flex flex-wrap justify-center items-center gap-2 mb-3 text-xs font-bold border-b border-slate-100 pb-3">
          {[
            { label: 'All Stops', key: 'ALL', color: '#64748B' },
            { label: 'Essential Equity', key: 'Essential Equity Bus Stop', color: '#7C3AED' },
            { label: 'High Swing', key: 'High Swing Bus Stop', color: '#EF4444' },
            { label: 'Low Swing', key: 'Low Swing Bus Stop', color: '#F59E0B' },
            { label: 'Always Low Equity', key: 'Always Low Equity Bus Stop', color: '#EA580C' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setClassFilter(item.key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                classFilter === item.key
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Scatter Plot */}
        {!loading && plotData.length > 0 ? (
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 25, bottom: 35, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  dataKey="score_mean"
                  name="Mean Score"
                  domain={[10, 100]}
                  tickCount={6}
                  stroke="#64748B"
                  fontSize={11}
                  label={{
                    value: 'Mean Score (Overall Priority Rank Across 15 Combinations)',
                    position: 'bottom',
                    offset: 15,
                    fontSize: 11,
                    fill: '#334155',
                    fontWeight: 700,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="score_std"
                  name="Volatility"
                  domain={[0, 25]}
                  tickCount={6}
                  stroke="#64748B"
                  fontSize={11}
                  label={{
                    value: 'Volatility (Standard Deviation σ)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: -10,
                    fontSize: 11,
                    fill: '#334155',
                    fontWeight: 700,
                  }}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                <Scatter data={plotData}>
                  {plotData.map((entry, index) => {
                    const is6586 = entry.stop_id === '6586';
                    const is2821 = entry.stop_id === '2821';
                    const is1745 = entry.stop_id === '1745';
                    const isKeyStop = is6586 || is2821 || is1745;

                    let fill = CLASS_COLORS[entry.stability_class] || '#94A3B8';
                    let radius = isKeyStop ? 11 : 4.5;
                    let fillOpacity = isKeyStop ? 1.0 : 0.38;
                    let stroke = 'transparent';
                    let strokeWidth = 0;

                    if (is6586) {
                      fill = '#7C3AED'; // Purple
                      stroke = '#581C87';
                      strokeWidth = 2.5;
                    } else if (is2821) {
                      fill = '#EF4444'; // Red
                      stroke = '#991B1B';
                      strokeWidth = 2.5;
                    } else if (is1745) {
                      fill = '#EA580C'; // Orange
                      stroke = '#9A3412';
                      strokeWidth = 2.5;
                    }

                    return (
                      <React.Fragment key={`cell-frag-${entry.stop_id}-${index}`}>
                        <Cell
                          key={`cell-${entry.stop_id}-${index}`}
                          fill={fill}
                          fillOpacity={fillOpacity}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                          r={radius}
                        />
                      </React.Fragment>
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-mono">
            Loading Bus Stop Sensitivity Matrix...
          </div>
        )}
      </div>
    </>
  );
};
