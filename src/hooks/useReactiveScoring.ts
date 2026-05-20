/**
 * useReactiveScoring — Reactive Scoring Engine
 *
 * Replicates the Python scoring pipeline (refine_scoring.py) in pure TypeScript.
 * Recalculates composite scores, sigmoid transforms, quintile grades, and SHAP
 * contributions in real time as policy weights change.
 *
 * The pillar scores (pillar_1…4) are pre-normalized via z-score (mean≈50, SD≈20)
 * and are immutable. Only the weighted composite, sigmoid calibration, and grade
 * assignment change when weights are adjusted.
 *
 * Performance: 235 routes × 4 multiplications + 1 sort = microseconds.
 */

import { useMemo } from 'react';
import { RouteWithDAs } from '@/components/charts/EquityMatrix';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface PolicyWeights {
  vulnerability: number;
  resilience: number;
  monopoly: number;
  opportunity: number;
}

export interface ShapContribution {
  pillar: string;
  label: string;
  value: number;     // φ_j = (w_j / 100) × (pillar_j - pillar_mean)
  color: string;     // emerald for positive, rose for negative
  rawScore: number;  // the route's z-score for this pillar
  networkMean: number; // the network mean for this pillar
  weight: number;    // the weight applied (0-1)
}

export interface ScoredRoute extends RouteWithDAs {
  composite_score: number;     // sigmoid-transformed final score
  composite_score_raw: number; // pre-sigmoid weighted sum
  grade: string;
  shap: ShapContribution[];
}

export interface NetworkStats {
  sigmoidMidpoint: number;
  sigmoidSteepness: number;
  quintileCuts: number[];       // [E|D, D|C, C|B, B|A] thresholds
  pillarMeans: Record<string, number>;
  gradeDistribution: Record<string, number>;
}

/* ── Constants ─────────────────────────────────────────────────────── */

const PILLAR_MAP = [
  { key: 'pillar_1', storeKey: 'vulnerability', label: 'Vulnerability',  color_pos: '#10B981', color_neg: '#F43F5E' },
  { key: 'pillar_2', storeKey: 'resilience',    label: 'Off Peak Service',  color_pos: '#10B981', color_neg: '#F43F5E' },
  { key: 'pillar_3', storeKey: 'monopoly',      label: 'Monopoly',      color_pos: '#10B981', color_neg: '#F43F5E' },
  { key: 'pillar_4', storeKey: 'opportunity',    label: 'Opportunity',   color_pos: '#10B981', color_neg: '#F43F5E' },
] as const;

/* ── Math Utilities ────────────────────────────────────────────────── */

/** Sigmoid function — compresses middle, stretches extremes. */
function sigmoid(x: number, midpoint: number, steepness: number): number {
  const exponent = -steepness * (x - midpoint);
  // Guard against overflow
  if (exponent > 500) return 0;
  if (exponent < -500) return 100;
  return 100 / (1 + Math.exp(exponent));
}

/** Compute mean of an array. */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Compute population standard deviation of an array. */
function stddev(values: number[], avg?: number): number {
  if (values.length === 0) return 0;
  const m = avg ?? mean(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length);
}

/* ── The Hook ──────────────────────────────────────────────────────── */

export function useReactiveScoring(
  baseRoutes: RouteWithDAs[],
  weights: PolicyWeights,
): { scoredRoutes: ScoredRoute[]; networkStats: NetworkStats } {
  return useMemo(() => {
    if (!baseRoutes.length) {
      return {
        scoredRoutes: [],
        networkStats: {
          sigmoidMidpoint: 50,
          sigmoidSteepness: 0.08,
          quintileCuts: [20, 40, 60, 80],
          pillarMeans: {},
          gradeDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0 },
        },
      };
    }

    const n = baseRoutes.length;

    // ── 1. Compute per-pillar network means ───────────────────────
    const pillarMeans: Record<string, number> = {};
    for (const p of PILLAR_MAP) {
      const values = baseRoutes.map((r) => (r as any)[p.key] as number || 0);
      pillarMeans[p.key] = mean(values);
    }

    // ── 2. Compute raw weighted composite for each route ──────────
    const w = {
      pillar_1: weights.vulnerability / 100,
      pillar_2: weights.resilience / 100,
      pillar_3: weights.monopoly / 100,
      pillar_4: weights.opportunity / 100,
    };

    const rawComposites = baseRoutes.map((r) =>
      (r.pillar_1 * w.pillar_1) +
      (r.pillar_2 * w.pillar_2) +
      (r.pillar_3 * w.pillar_3) +
      (r.pillar_4 * w.pillar_4)
    );

    // ── 3. Calibrate sigmoid from composite distribution ──────────
    const compMean = mean(rawComposites);
    const compSd = stddev(rawComposites, compMean);
    // Steepness calibrated so ±2 SD covers roughly the 10–90 score range
    const steepness = compSd > 0 ? 4.0 / (2 * compSd) : 0.08;

    // ── 4. Apply sigmoid transform ────────────────────────────────
    const finalScores = rawComposites.map((raw) =>
      Math.round(sigmoid(raw, compMean, steepness) * 100) / 100
    );

    // ── 5. Quintile grading ───────────────────────────────────────
    const sorted = [...finalScores].sort((a, b) => a - b);
    const cuts = [0.2, 0.4, 0.6, 0.8].map((p) => sorted[Math.floor(n * p)]);

    function assignGrade(score: number): string {
      if (score >= cuts[3]) return 'A';
      if (score >= cuts[2]) return 'B';
      if (score >= cuts[1]) return 'C';
      if (score >= cuts[0]) return 'D';
      return 'E';
    }

    // ── 6. Build scored routes with SHAP contributions ────────────
    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

    const scoredRoutes: ScoredRoute[] = baseRoutes.map((route, i) => {
      const grade = assignGrade(finalScores[i]);
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;

      // SHAP: φ_j = (w_j) × (pillar_j - network_mean_of_pillar_j)
      const shap: ShapContribution[] = PILLAR_MAP.map((p) => {
        const pillarScore = (route as any)[p.key] as number || 0;
        const pillarMean = pillarMeans[p.key];
        const weightFrac = w[p.key as keyof typeof w];
        const shapValue = weightFrac * (pillarScore - pillarMean);

        return {
          pillar: p.key,
          label: p.label,
          value: Math.round(shapValue * 100) / 100,
          color: shapValue >= 0 ? p.color_pos : p.color_neg,
          rawScore: pillarScore,
          networkMean: pillarMean,
          weight: weightFrac,
        };
      });

      return {
        ...route,
        composite_score: finalScores[i],
        composite_score_raw: Math.round(rawComposites[i] * 100) / 100,
        grade,
        shap,
      };
    });

    return {
      scoredRoutes,
      networkStats: {
        sigmoidMidpoint: Math.round(compMean * 100) / 100,
        sigmoidSteepness: Math.round(steepness * 10000) / 10000,
        quintileCuts: cuts.map((c) => Math.round(c * 100) / 100),
        pillarMeans,
        gradeDistribution,
      },
    };
  }, [baseRoutes, weights]);
}
