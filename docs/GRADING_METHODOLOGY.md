# Route Equity Index — Grading Methodology

## Overview

The Route Equity Index (REI) assigns each transit route in the Edmonton network a letter grade from **A** (highest equity impact) to **E** (lowest equity impact). The grade reflects a route's relative position within the network based on its composite equity score, which is derived from four weighted analytical pillars.

## Composite Score Calculation

Each route's composite score is computed as:

```
Composite = (P1 × W1) + (P2 × W2) + (P3 × W3) + (P4 × W4)
```

Where the pillars and their default weights are:

| Pillar | Weight | Metric | Description |
|--------|--------|--------|-------------|
| **P1: Vulnerability Density** | 35% | `Σ [DA_Pop × DA_Vulnerability × (1 - dist/400m)]` | Measures the "social gravity" of the service corridor using distance-decay weighting. Routes that penetrate directly into high-need dissemination areas receive higher scores. |
| **P2: Temporal Resilience** | 25% | `(Trips_Night / Trips_Peak) × 100` | Measures service reliability during off-peak windows critical for shift workers (night window: 9:30–10:30 PM vs. peak: 7:30–8:30 AM). |
| **P3: Network Monopoly** | 25% | `Count(Monopoly_DAs) × Log(Daily_Trips)` | Identifies corridors where a route is the sole transit provider. Weighted by frequency to distinguish vital lifelines from infrequent connectors. |
| **P4: Critical Opportunity Linkage** | 15% | `Σ [POI_Count_within_400m × POI_Weight]` | Cumulative opportunity measure using real destination access data. Hospitals (5.0), Employment Centres (3.0), Post-Secondary (3.0), Grocery (2.0), Schools (1.0). |

### Weight Adjustment

Policy weights are user-adjustable through a zero-sum slider system. Moving one slider automatically redistributes the remaining budget proportionally across the other three pillars, ensuring the total always equals 100%.

## Grading System

### Approach: Quintile-Based Relative Grading

Routes are graded using a **quintile distribution**, meaning each letter grade represents approximately 20% of the network. This approach was selected because:

1. **Scores are inherently relative.** The composite score has no absolute meaning—it only indicates how a route compares to others in the same network.
2. **Equal distribution ensures utility.** A grading system where 95% of routes receive the same grade (as occurred with absolute thresholds) provides no analytical value.
3. **Policy neutrality.** Quintiles avoid the implicit value judgment of where to set "passing" vs. "failing" cutoffs.

### Thresholds

The following thresholds were computed from the 20th, 40th, 60th, and 80th percentiles of the 235-route Edmonton network:

| Grade | Percentile | Score Range | Count | Interpretation |
|-------|-----------|-------------|-------|----------------|
| **A** | Top 20% | ≥ 26.2 | 48 | Highest equity impact — critical lifeline routes |
| **B** | 60–80% | 17.4 – 26.1 | 46 | Above-average equity contribution |
| **C** | 40–60% | 12.3 – 17.3 | 47 | Average equity impact across the network |
| **D** | 20–40% | 7.3 – 12.2 | 47 | Below-average equity contribution |
| **E** | Bottom 20% | < 7.3 | 47 | Lowest equity impact — limited vulnerability coverage |

### Statistical Validation

Internal variance analysis confirms that the quintile boundaries produce cohesive groups:

| Grade | Std Dev | Spread | Assessment |
|-------|---------|--------|------------|
| E | 1.6 | 7.1 | Tight — routes are genuinely similar |
| D | 1.5 | 4.8 | Tight |
| C | 1.7 | 5.0 | Tight |
| B | 2.8 | 8.6 | Tight |
| A | 8.3 | 40.7 | Wide — contains both strong and exceptional routes |

The Grade A spread (26.2–66.9) is intentionally retained. The wide range reflects a genuine performance gap between consistently strong trunk routes and the few exceptional cross-network lifelines that score dramatically higher. The Score Breakdown panel in the dashboard allows planners to inspect exactly *why* any given "A" route scored the way it did, providing the granularity that the letter grade deliberately abstracts.

## Data Sources

- **Route geometry and schedules:** General Transit Feed Specification (GTFS), City of Edmonton
- **Census demographics:** Statistics Canada, 2021 Census of Population, Dissemination Area level
- **Points of interest:** OpenStreetMap and municipal open data portals
- **Spatial analysis unit:** Dissemination Area (DA), the smallest standard geographic area for which census data is published

## Reproducibility

The grading computation is performed by `scripts/regrade_routes.py`, which:
1. Reads all composite scores from the Golden Route Record
2. Computes quintile breakpoints at the 20th, 40th, 60th, and 80th percentiles
3. Assigns grades based on which quintile each score falls into
4. Updates both the JSON and Apache Parquet data files

The script is idempotent and can be re-run after any changes to the underlying pillar calculations.
