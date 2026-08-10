/**
 * useReactiveScoring — Reactive Scoring Engine
 *
 * Replicates the Python scoring pipeline (refine_scoring.py) in pure TypeScript.
 * Recalculates composite scores, sigmoid transforms, quintile grades, and SHAP
 * contributions in real time as policy weights change.
 */

import { useMemo } from 'react';
import { RouteWithDAs } from '@/components/charts/EquityMatrix';
import { useRouteStore } from '@/store/routeStore';

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
  baseline_grade?: string;
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

/* ── Helper Math ───────────────────────────────────────────────────── */

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function stddev(arr: number[], avg: number): number {
  if (arr.length <= 1) return 0;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function sigmoid(x: number, mid: number, k: number): number {
  // Map raw weighted sum into a calibrated 0-100 scale
  const s = 1.0 / (1.0 + Math.exp(-k * (x - mid)));
  return s;
}

// Computes dynamic route vulnerability score based on selected active CIMD dimensions and DA scores
function getDynamicRouteVuln(
  route: RouteWithDAs,
  daScores: Record<string, any>,
  activeDimensions: ('econ' | 'res' | 'eth' | 'sit')[]
): number {
  if (activeDimensions.length === 0) {
    return 0;
  }

  if (!route.da_data || route.da_data.length === 0) {
    return route.pillar_1_cimd ?? route.pillar_1;
  }

  let routeVulnSum = 0;
  let routePopSum = 0;
  
  const numDims = activeDimensions.length;
  const dimWeight = 1 / numDims;

  route.da_data.forEach((da) => {
    const daScoresItem = daScores[da.id];
    if (daScoresItem) {
      let score = 0;
      if (activeDimensions.includes('econ')) score += (daScoresItem.econ ?? daScoresItem.economic ?? 50) * dimWeight;
      if (activeDimensions.includes('res')) score += (daScoresItem.res ?? 50) * dimWeight;
      if (activeDimensions.includes('eth')) score += (daScoresItem.eth ?? 50) * dimWeight;
      if (activeDimensions.includes('sit')) score += (daScoresItem.sit ?? 50) * dimWeight;
      
      routeVulnSum += score * da.pop;
      routePopSum += da.pop;
    }
  });
  
  if (routePopSum > 0) {
    return routeVulnSum / routePopSum;
  }
  return route.pillar_1_cimd ?? route.pillar_1;
}

/* ── Hook ──────────────────────────────────────────────────────────── */

export function useReactiveScoring(
  baseRoutes: RouteWithDAs[],
  weights: PolicyWeights,
  cimdMode: boolean = true
): { scoredRoutes: ScoredRoute[]; networkStats: NetworkStats } {
  const activeDimensions = useRouteStore((s) => s.activeDimensions);
  const daScores = useRouteStore((s) => s.daScores);

  return useMemo(() => {
    if (!baseRoutes || baseRoutes.length === 0) {
      return {
        scoredRoutes: [],
        networkStats: {
          sigmoidMidpoint: 0,
          sigmoidSteepness: 0,
          quintileCuts: [20, 40, 60, 80],
          pillarMeans: {},
          gradeDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0 },
        },
      };
    }

    const municipalRoutes = baseRoutes.filter((r) => !r.is_regional);
    const regionalRoutes = baseRoutes.filter((r) => r.is_regional);
    const n_muni = municipalRoutes.length;

    // ── 1. Compute per-pillar network means (municipal only) ──────
    const pillarMeans: Record<string, number> = {};
    for (const p of PILLAR_MAP) {
      const values = municipalRoutes.map((r) => {
        if (p.key === 'pillar_1') {
          return getDynamicRouteVuln(r, daScores, activeDimensions);
        }
        return (r as any)[p.key] as number || 0;
      });
      pillarMeans[p.key] = mean(values);
    }

    // ── 2. Compute raw weighted composite for each municipal route ──
    const w = {
      pillar_1: weights.vulnerability / 100,
      pillar_2: weights.resilience / 100,
      pillar_3: weights.monopoly / 100,
      pillar_4: weights.opportunity / 100,
    };

    const rawComposites = municipalRoutes.map((r) => {
      const vuln = getDynamicRouteVuln(r, daScores, activeDimensions);
      return (
        (vuln * w.pillar_1) +
        (r.pillar_2 * w.pillar_2) +
        (r.pillar_3 * w.pillar_3) +
        (r.pillar_4 * w.pillar_4)
      );
    });

    // ── 3. Calibrate sigmoid from composite distribution ──────────
    const compMean = mean(rawComposites);
    const compSd = stddev(rawComposites, compMean);
    const steepness = compSd > 0 ? 4.0 / (2 * compSd) : 0.08;

    // ── 4. Apply sigmoid transform ────────────────────────────────
    const finalScores = rawComposites.map((raw) =>
      Math.round(sigmoid(raw, compMean, steepness) * 100)
    );

    // ── 5. Quintile grading ───────────────────────────────────────
    const sorted = [...finalScores].sort((a, b) => a - b);
    const cuts = [0.2, 0.4, 0.6, 0.8].map((p) => sorted[Math.floor(n_muni * p)]);

    function assignGrade(score: number): string {
      if (score >= cuts[3]) return 'A';
      if (score >= cuts[2]) return 'B';
      if (score >= cuts[1]) return 'C';
      if (score >= cuts[0]) return 'D';
      return 'E';
    }

    // ── 6. Build scored routes with SHAP contributions ────────────
    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

    const scoredMunicipalRoutes: ScoredRoute[] = municipalRoutes.map((route, i) => {
      const grade = assignGrade(finalScores[i]);
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;

      // SHAP: φ_j = (w_j) × (pillar_j - network_mean_of_pillar_j)
      const shap: ShapContribution[] = PILLAR_MAP.map((p) => {
        const pillarScore = (p.key === 'pillar_1')
          ? getDynamicRouteVuln(route, daScores, activeDimensions)
          : ((route as any)[p.key] as number || 0);
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

      // Update route's pillar_1_cimd dynamically for downstream display
      const dynVuln = getDynamicRouteVuln(route, daScores, activeDimensions);

      return {
        ...route,
        pillar_1_cimd: dynVuln,
        baseline_grade: route.grade,
        composite_score: finalScores[i],
        composite_score_raw: Math.round(rawComposites[i] * 100) / 100,
        grade,
        shap,
      };
    });

      return {
        ...route,
        pillar_1_cimd: dynVuln,
        baseline_grade: route.grade,
        composite_score: finalScores[i],
        composite_score_raw: Math.round(rawComposites[i] * 100) / 100,
        grade,
        shap,
      };
    });

    const scoredRegionalRoutes: ScoredRoute[] = regionalRoutes.map((route) => {
      const shap: ShapContribution[] = PILLAR_MAP.map((p) => ({
        pillar: p.key,
        label: p.label,
        value: 0.0,
        color: p.color_pos,
        rawScore: 0.0,
        networkMean: 0.0,
        weight: 0.0,
      }));

      return {
        ...route,
        baseline_grade: 'Regional',
        composite_score: 0.0,
        composite_score_raw: 0.0,
        grade: 'Regional',
        shap,
      };
    });

    const scoredRoutes = [...scoredMunicipalRoutes, ...scoredRegionalRoutes];

    return {
      scoredRoutes,
      networkStats: {
        sigmoidMidpoint: compMean,
        sigmoidSteepness: steepness,
        quintileCuts: cuts,
        pillarMeans,
        gradeDistribution,
      },
    };
  }, [baseRoutes, weights, cimdMode, activeDimensions, daScores]);
}
