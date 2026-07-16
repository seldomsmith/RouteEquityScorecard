"use client";

import React from 'react';
import { ScoredRoute, NetworkStats, ShapContribution } from '@/hooks/useReactiveScoring';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRouteStore } from '@/store/routeStore';

interface AnimatedTextProps {
  value: number;
  x: number;
  y: number;
  isPositive?: boolean;
  fontWeight?: number | string;
  fontSize?: number;
  fill?: string;
  prefix?: string;
  precision?: number;
}

const AnimatedTextValue: React.FC<AnimatedTextProps> = ({
  value,
  x,
  y,
  fontWeight = 700,
  fontSize = 10,
  fill,
  prefix = '',
  precision = 1,
}) => {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, { stiffness: 120, damping: 20 });
  const [displayVal, setDisplayVal] = React.useState(value);

  React.useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  React.useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayVal(latest);
    });
    return () => unsubscribe();
  }, [springValue]);

  const sign = prefix === '+' && displayVal >= 0 ? '+' : '';

  return (
    <text
      x={x}
      y={y}
      fontSize={fontSize}
      fontFamily="ui-monospace, monospace"
      fontWeight={fontWeight}
      fill={fill}
      textAnchor="start"
    >
      {sign}{displayVal.toFixed(precision)}
    </text>
  );
};

interface WaterfallProps {
  route: ScoredRoute | null;
  networkStats: NetworkStats;
  sensitivityData?: any;
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
export const ShapWaterfall: React.FC<WaterfallProps> = ({ route, networkStats, sensitivityData }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(310);

  const mapFilterMode = useRouteStore((state) => state.mapFilterMode);
  const weights = useRouteStore((state) => state.weights);

  const sensitivityRow = sensitivityData?.[route?.route_id || ''];
  const isStabilityMode = mapFilterMode === 'stability' && sensitivityRow;

  React.useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width) {
          setWidth(entry.contentRect.width);
        }
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const shap = React.useMemo(() => {
    if (!route) return [];
    if (isStabilityMode) {
      // Option 3: Sensitivity Drivers Waterfall
      // Baseline is score_mean (mean rank under uniform 25% weights)
      // Deviation is w_j - 0.25
      return [
        {
          pillar: 'pillar_1',
          label: 'Vuln Sensitivity',
          value: sensitivityRow.driver_vulnerability * ((weights.vulnerability - 25) / 100),
          color: sensitivityRow.driver_vulnerability * ((weights.vulnerability - 25) / 100) >= 0 ? '#10B981' : '#F43F5E',
          rawScore: sensitivityRow.driver_vulnerability,
          networkMean: 25,
          weight: weights.vulnerability / 100,
        },
        {
          pillar: 'pillar_2',
          label: 'Off-Peak Sens',
          value: sensitivityRow.driver_temporal * ((weights.resilience - 25) / 100),
          color: sensitivityRow.driver_temporal * ((weights.resilience - 25) / 100) >= 0 ? '#10B981' : '#F43F5E',
          rawScore: sensitivityRow.driver_temporal,
          networkMean: 25,
          weight: weights.resilience / 100,
        },
        {
          pillar: 'pillar_3',
          label: 'Monopoly Sens',
          value: sensitivityRow.driver_monopoly * ((weights.monopoly - 25) / 100),
          color: sensitivityRow.driver_monopoly * ((weights.monopoly - 25) / 100) >= 0 ? '#10B981' : '#F43F5E',
          rawScore: sensitivityRow.driver_monopoly,
          networkMean: 25,
          weight: weights.monopoly / 100,
        },
        {
          pillar: 'pillar_4',
          label: 'Opp Sensitivity',
          value: sensitivityRow.driver_opportunity * ((weights.opportunity - 25) / 100),
          color: sensitivityRow.driver_opportunity * ((weights.opportunity - 25) / 100) >= 0 ? '#10B981' : '#F43F5E',
          rawScore: sensitivityRow.driver_opportunity,
          networkMean: 25,
          weight: weights.opportunity / 100,
        },
      ];
    }
    return route.shap || [];
  }, [isStabilityMode, sensitivityRow, route, weights]);

  if (!route) {
    return (
      <div ref={containerRef} className="flex flex-col items-center justify-center h-full text-xs text-brand-slate-400 w-full">
        <span className="text-lg mb-1">📊</span>
        Select a route to see its score breakdown
      </div>
    );
  }

  const baseline = isStabilityMode ? sensitivityRow.score_mean : 50.0;

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

  // Fixed scale from 0 to 100 for consistent network comparisons
  const minVal = 0;
  const maxVal = 100;
  const range = 100;

  // Chart dimensions — responsive calculations
  const BAR_HEIGHT = 18;
  const ROW_HEIGHT = 24;
  const LABEL_W = 80;
  const VALUE_W = 45;
  const rightPadding = 12;
  // Dynamic CHART_W guarantees no horizontal scrollbars on shrink, leaving room for VALUE_W + padding
  const CHART_W = Math.max(100, width - LABEL_W - VALUE_W - rightPadding - 24);

  const toPixel = (val: number) => ((val - minVal) / range) * CHART_W;

  // 🤖 Narrative Briefing Generator
  const generateNarrative = () => {
    if (isStabilityMode) {
      const clsLabel = sensitivityRow.stability_class === 'Essential Equity Routes' ? 'Essential Equity Route (Always High Equity)' :
                       sensitivityRow.stability_class === 'Low Equity-Priority Routes' ? 'Low Equity-Priority Route' :
                       sensitivityRow.stability_class === 'High Swing Routes' ? 'High Swing Route' :
                       'Moderate Swing Route';
      return `${route.short_name} is classified as a ${clsLabel} under Monte Carlo pillar weight sweeps. Mean Score: ${sensitivityRow.score_mean.toFixed(1)}, Volatility (Rr): ${sensitivityRow.score_std.toFixed(2)}.`;
    }

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
    <div ref={containerRef} className="flex flex-col h-full px-1 py-1 w-full overflow-hidden">
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
      <div className="flex-1 flex flex-col justify-center min-h-0 w-full overflow-visible pt-4 mt-2">
        <svg
          width="100%"
          height={(shap.length + 3.6) * ROW_HEIGHT}
          className="block overflow-visible"
        >
          {/* Grid lines and headers (0, 50/Baseline, 100) */}
          <g transform={`translate(0, ${ROW_HEIGHT * 0.5})`}>
            {/* Grid Line 0 */}
            <line
              x1={LABEL_W}
              y1={-4}
              x2={LABEL_W}
              y2={(shap.length + 2.3) * ROW_HEIGHT + BAR_HEIGHT - ROW_HEIGHT * 0.5}
              stroke="#CBD5E1"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
            <text
              x={LABEL_W}
              y={-8}
              textAnchor="middle"
              fontSize={8}
              fontWeight={700}
              fill="#94A3B8"
            >
              0
            </text>

            {/* Grid Line 50 (Baseline - Fixed to center at 50) */}
            <text x={LABEL_W - 4} y={4} textAnchor="end" fontSize={9} fontWeight={600} fill="#64748B">
              Baseline
            </text>
            <line
              x1={LABEL_W + toPixel(50)}
              y1={-4}
              x2={LABEL_W + toPixel(50)}
              y2={(shap.length + 2.3) * ROW_HEIGHT + BAR_HEIGHT - ROW_HEIGHT * 0.5}
              stroke="#CBD5E1"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            <text
              x={LABEL_W + toPixel(50)}
              y={-8}
              textAnchor="middle"
              fontSize={8}
              fontWeight={700}
              fill="#64748B"
            >
              50
            </text>

            {/* Grid Line 100 */}
            <line
              x1={LABEL_W + CHART_W}
              y1={-4}
              x2={LABEL_W + CHART_W}
              y2={(shap.length + 2.3) * ROW_HEIGHT + BAR_HEIGHT - ROW_HEIGHT * 0.5}
              stroke="#CBD5E1"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
            <text
              x={LABEL_W + CHART_W}
              y={-8}
              textAnchor="middle"
              fontSize={8}
              fontWeight={700}
              fill="#94A3B8"
            >
              100
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
                  <motion.line
                    animate={{
                      x1: LABEL_W + toPixel(bar.startX),
                      x2: LABEL_W + toPixel(bar.startX),
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    y1={-ROW_HEIGHT + BAR_HEIGHT}
                    y2={0}
                    stroke="#CBD5E1"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                )}

                 {/* Bar */}
                <motion.rect
                  initial={{
                    x: LABEL_W + toPixel(bar.startX),
                    width: 0,
                  }}
                  animate={{
                    x: x1,
                    width: barW,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  y={0}
                  height={BAR_HEIGHT}
                  rx={4}
                  fill={bar.color}
                  opacity={0.85}
                />

                {/* Value label to the right of the bar */}
                <AnimatedTextValue
                  value={bar.value}
                  x={LABEL_W + CHART_W + 8}
                  y={BAR_HEIGHT / 2 + 3}
                  fontSize={10}
                  fontWeight={700}
                  fill={isPositive ? '#059669' : '#E11D48'}
                  prefix={isPositive ? '+' : ''}
                />
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
                <motion.rect
                  initial={{
                    x: LABEL_W + toPixel(baseline),
                    width: 0,
                  }}
                  animate={{
                    x: LABEL_W + toPixel(Math.min(baseline, rawComposite)),
                    width: Math.max(Math.abs(toPixel(rawComposite) - toPixel(baseline)), 2),
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  y={0}
                  height={BAR_HEIGHT}
                  rx={4}
                  fill="url(#tealGradient)"
                  opacity={0.5}
                />
                <AnimatedTextValue
                  value={rawComposite}
                  x={LABEL_W + CHART_W + 8}
                  y={BAR_HEIGHT / 2 + 3}
                  fontSize={10}
                  fontWeight={800}
                  fill="#334155"
                />
              </g>
            );
          })()}

          {/* Final sigmoid score (Shifted down for visual separation) */}
          {(() => {
            const y = (shap.length + 2.3) * ROW_HEIGHT;
            return (
              <g transform={`translate(0, ${y})`}>
                {/* Dotted separator divider line */}
                <line
                  x1={LABEL_W}
                  y1={-6}
                  x2={LABEL_W + CHART_W}
                  y2={-6}
                  stroke="#E2E8F0"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                <text x={LABEL_W - 4} y={BAR_HEIGHT / 2 + 3} textAnchor="end" fontSize={9} fontWeight={700} fill="#0F766E">
                  FINAL
                </text>
                <motion.rect
                  initial={{
                    x: LABEL_W + toPixel(minVal),
                    width: 0,
                  }}
                  animate={{
                    x: LABEL_W + toPixel(Math.min(minVal, route.composite_score)),
                    width: Math.max(toPixel(route.composite_score) - toPixel(minVal), 2),
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  y={0}
                  height={BAR_HEIGHT}
                  rx={4}
                  fill="url(#tealGradient)"
                  opacity={0.9}
                />
                <AnimatedTextValue
                  value={route.composite_score}
                  x={LABEL_W + CHART_W + 8}
                  y={BAR_HEIGHT / 2 + 3}
                  fontSize={11}
                  fontWeight={900}
                  fill="#0F766E"
                />
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



      {/* Explanatory Footnote */}
      <p className="mt-2 text-[9px] leading-relaxed text-slate-400 border-t border-slate-100 pt-1.5 text-justify">
        {isStabilityMode ? (
          <>
            <strong>How to read this:</strong> This waterfall chart shows how your current pillar weights change the route's score compared to its long-term average. Each bar represents the impact of a specific weighting choice. Green bars indicate that your current weights boost the route's score, while red bars indicate they lower it.
          </>
        ) : (
          <>
            <strong>How to read this:</strong> This chart breaks down the route's score, starting from the city-wide average of 50.0. Each bar shows how much a specific category adds to or subtracts from the route's score based on your selected weights. Green bars increase the score, while red bars decrease it. The <strong>FINAL</strong> score is then translated into a letter grade from A to E.
          </>
        )}
      </p>
    </div>
  );
};
