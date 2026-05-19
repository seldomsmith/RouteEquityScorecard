"use client";

import React from 'react';
import { ScoredRoute, NetworkStats, ShapContribution } from '@/hooks/useReactiveScoring';

interface WaterfallProps {
  route: ScoredRoute | null;
  networkStats: NetworkStats;
}

const GRADE_BG: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-amber-100 text-amber-700',
  D: 'bg-orange-100 text-orange-700',
  E: 'bg-red-100 text-red-700',
};

/**
 * True SHAP Waterfall Chart
 *
 * Starts at the network baseline (≈50.0), then adds/subtracts each pillar's
 * SHAP contribution (φ_j = w_j × (pillar_j - network_mean)) to arrive at
 * the raw composite. The sigmoid-transformed final score is shown separately.
 *
 * Positive contributions render in emerald; negative in rose.
 */
export const ShapWaterfall: React.FC<WaterfallProps> = ({ route, networkStats }) => {
  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-xs text-brand-slate-400">
        <span className="text-lg mb-1">📊</span>
        Select a route to see its score breakdown
      </div>
    );
  }

  const shap = route.shap || [];
  const baseline = 50.0;

  // Compute the waterfall geometry
  // Each bar starts where the previous one ended
  const waterfallBars = shap.map((s, i) => {
    const cumulativeBefore = baseline + shap.slice(0, i).reduce((sum, p) => sum + p.value, 0);
    return {
      ...s,
      startX: cumulativeBefore,
      endX: cumulativeBefore + s.value,
    };
  });

  // The raw composite is where the waterfall ends
  const rawComposite = baseline + shap.reduce((sum, p) => sum + p.value, 0);

  // Scale: we need to map score values (roughly 0-100) to pixel positions
  // Find the range we need to display
  const allValues = [
    baseline,
    rawComposite,
    ...waterfallBars.flatMap((b) => [b.startX, b.endX]),
  ];
  const minVal = Math.max(0, Math.min(...allValues) - 5);
  const maxVal = Math.min(100, Math.max(...allValues) + 5);
  const range = maxVal - minVal || 1;

  // Chart dimensions
  const BAR_HEIGHT = 20;
  const ROW_HEIGHT = 28;
  const LABEL_W = 80;
  const VALUE_W = 40;
  const CHART_W = 180; // pixel width of the bar area

  const toPixel = (val: number) => ((val - minVal) / range) * CHART_W;

  // 🤖 Narrative Briefing Generator
  const generateNarrative = () => {
    const sorted = [...shap].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    const strongest = sorted[0];
    const weakest = sorted.find((s) => s.value < 0);

    let prefix = '';
    if (route.grade === 'A') prefix = "An Essential Lifeline corridor";
    else if (route.grade === 'B') prefix = "A high-performing equity corridor";
    else if (route.grade === 'C') prefix = "A standard coverage route";
    else if (route.grade === 'D') prefix = "A below-average equity contributor";
    else prefix = "A low-impact equity route";

    let explanation = '';
    if (strongest.value >= 0) {
      explanation = `driven primarily by strong ${strongest.label} (+${strongest.value.toFixed(1)})`;
    } else {
      explanation = `constrained across all pillars`;
    }

    if (weakest && weakest.pillar !== strongest.pillar) {
      explanation += `, with ${weakest.label} pulling the score down (${weakest.value.toFixed(1)})`;
    }

    return `${prefix}, ${explanation}.`;
  };

  return (
    <div className="flex flex-col h-full px-1 py-1">
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${GRADE_BG[route.grade] || 'bg-slate-100 text-slate-600'}`}>
            {route.grade}
          </span>
          <span className="text-xs font-bold text-slate-800 truncate">{route.short_name} — {route.name}</span>
        </div>
        <p className="text-[10px] leading-snug text-slate-500 italic border-l-2 border-brand-teal-400 pl-2">
          &quot;{generateNarrative()}&quot;
        </p>
      </div>

      {/* Waterfall Chart */}
      <div className="flex-1 flex flex-col justify-center">
        <svg
          width={LABEL_W + CHART_W + VALUE_W + 10}
          height={(shap.length + 3) * ROW_HEIGHT}
          className="block overflow-visible"
        >
          {/* Baseline */}
          <g transform={`translate(0, ${ROW_HEIGHT * 0.5})`}>
            <text x={LABEL_W - 4} y={4} textAnchor="end" fontSize={9} fontWeight={600} fill="#64748B">
              Baseline
            </text>
            <line
              x1={LABEL_W + toPixel(baseline)}
              y1={-4}
              x2={LABEL_W + toPixel(baseline)}
              y2={(shap.length + 1) * ROW_HEIGHT + 4}
              stroke="#CBD5E1"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            <text
              x={LABEL_W + toPixel(baseline)}
              y={-8}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill="#94A3B8"
            >
              {baseline.toFixed(1)}
            </text>
          </g>

          {/* SHAP Bars */}
          {waterfallBars.map((bar, i) => {
            const y = (i + 1) * ROW_HEIGHT;
            const x1 = LABEL_W + toPixel(Math.min(bar.startX, bar.endX));
            const barW = Math.max(Math.abs(toPixel(bar.endX) - toPixel(bar.startX)), 2);
            const isPositive = bar.value >= 0;

            return (
              <g key={bar.pillar} transform={`translate(0, ${y})`}>
                {/* Label */}
                <text x={LABEL_W - 4} y={BAR_HEIGHT / 2 + 3} textAnchor="end" fontSize={9} fill="#64748B">
                  {bar.label}
                </text>

                {/* Connector line from previous bar's end to this bar's start */}
                {i > 0 && (
                  <line
                    x1={LABEL_W + toPixel(bar.startX)}
                    y1={-ROW_HEIGHT + BAR_HEIGHT}
                    x2={LABEL_W + toPixel(bar.startX)}
                    y2={0}
                    stroke="#CBD5E1"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                )}

                {/* Bar */}
                <rect
                  x={x1}
                  y={0}
                  width={barW}
                  height={BAR_HEIGHT}
                  rx={4}
                  fill={bar.color}
                  opacity={0.85}
                  className="transition-all duration-300"
                />

                {/* Value label */}
                <text
                  x={LABEL_W + CHART_W + 6}
                  y={BAR_HEIGHT / 2 + 3}
                  fontSize={10}
                  fontFamily="ui-monospace, monospace"
                  fontWeight={700}
                  fill={isPositive ? '#059669' : '#E11D48'}
                >
                  {isPositive ? '+' : ''}{bar.value.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Raw Composite subtotal */}
          {(() => {
            const y = (shap.length + 1) * ROW_HEIGHT;
            return (
              <g transform={`translate(0, ${y})`}>
                <line x1={LABEL_W} y1={-4} x2={LABEL_W + CHART_W} y2={-4} stroke="#E2E8F0" strokeWidth={1} />
                <text x={LABEL_W - 4} y={BAR_HEIGHT / 2 + 3} textAnchor="end" fontSize={9} fontWeight={700} fill="#475569">
                  RAW
                </text>
                <rect
                  x={LABEL_W + toPixel(Math.min(baseline, rawComposite))}
                  y={0}
                  width={Math.max(Math.abs(toPixel(rawComposite) - toPixel(baseline)), 2)}
                  height={BAR_HEIGHT}
                  rx={4}
                  fill="url(#tealGradient)"
                  opacity={0.5}
                />
                <text
                  x={LABEL_W + CHART_W + 6}
                  y={BAR_HEIGHT / 2 + 3}
                  fontSize={10}
                  fontFamily="ui-monospace, monospace"
                  fontWeight={800}
                  fill="#334155"
                >
                  {rawComposite.toFixed(1)}
                </text>
              </g>
            );
          })()}

          {/* Final sigmoid score */}
          {(() => {
            const y = (shap.length + 2) * ROW_HEIGHT;
            return (
              <g transform={`translate(0, ${y})`}>
                <text x={LABEL_W - 4} y={BAR_HEIGHT / 2 + 3} textAnchor="end" fontSize={9} fontWeight={700} fill="#0F766E">
                  FINAL
                </text>
                <rect
                  x={LABEL_W + toPixel(Math.min(minVal, route.composite_score))}
                  y={0}
                  width={Math.max(toPixel(route.composite_score) - toPixel(minVal), 2)}
                  height={BAR_HEIGHT}
                  rx={4}
                  fill="url(#tealGradient)"
                  opacity={0.9}
                />
                <text
                  x={LABEL_W + CHART_W + 6}
                  y={BAR_HEIGHT / 2 + 3}
                  fontSize={11}
                  fontFamily="ui-monospace, monospace"
                  fontWeight={900}
                  fill="#0F766E"
                >
                  {route.composite_score.toFixed(1)}
                </text>
              </g>
            );
          })()}

          {/* Gradient defs */}
          <defs>
            <linearGradient id="tealGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0F766E" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Sigmoid callout */}
      <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
        <span>σ midpoint: {networkStats.sigmoidMidpoint.toFixed(1)} · steepness: {networkStats.sigmoidSteepness.toFixed(3)}</span>
        <span className="font-mono">Quintile: {networkStats.quintileCuts.map((c) => c.toFixed(0)).join(' | ')}</span>
      </div>
    </div>
  );
};
