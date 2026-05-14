# Route Equity Index — Scoring & Grading Methodology

## Overview

The Route Equity Index (REI) assigns each transit route in the Edmonton network a letter grade from **A** (highest equity impact) to **E** (lowest equity impact). The grade reflects a route's relative position within the network based on a composite equity score derived from four weighted analytical pillars, refined through a three-stage statistical normalization pipeline.

---

## 1. The Four Pillars

### Pillar 1: Vulnerability Density (Default Weight: 35%)

Measures the "social gravity" of the service corridor using distance-decay weighting.

- **Formula**: `Σ [ DA_Population × DA_Vulnerability × (1 - distance / 400m) ]`
- **Logic**: Routes that penetrate directly into high-need dissemination areas receive higher scores than those merely bordering them.

### Pillar 2: Temporal Resilience (Default Weight: 25%)

Measures the reliability of service during off-peak windows critical for shift workers.

- **Formula**: `( Trips_Night [9:30–10:30 PM] / Trips_Peak [7:30–8:30 AM] ) × 100`
- **Logic**: Routes that maintain a high percentage of their peak frequency late at night provide 24/7 resilience for workers in hospitals, retail, and security.

### Pillar 3: Network Monopoly (Default Weight: 25%)

Identifies corridors where a route is the sole provider of transit access.

- **Formula**: `Count(Monopoly_DAs) × Log(Daily_Trips)`
- **Logic**: Removing a monopoly route creates an immediate transit desert. Weighted by frequency to distinguish vital high-frequency lifelines from infrequent regional connectors.

### Pillar 4: Critical Opportunity Linkage (Default Weight: 15%)

Direct cumulative opportunity measure using real destination access POI data.

- **POI Weights**: Hospital (5.0), Employment Centre (3.0), Post-Secondary (3.0), Grocery/Food (2.0), Primary/Secondary School (1.0)
- **Formula**: `Σ [ POI_Count_within_400m × POI_Weight ]`

### Weight Adjustment

Policy weights are user-adjustable through a **zero-sum slider system**. Moving one slider automatically redistributes the remaining budget proportionally across the other three pillars, ensuring the total always equals 100%.

---

## 2. Statistical Normalization Pipeline

Raw pillar scores suffer from **pillar dilution**: different pillars produce values on fundamentally different distributions. Without normalization, pillars with naturally higher averages dominate the composite regardless of their assigned weight.

### Before Normalization

| Pillar | Raw Average | Raw StdDev | Problem |
|--------|-----------|----------|---------|
| P1 Vulnerability | 29.0 | 20.4 | Dominates composite by volume |
| P2 Temporal | 10.5 | 14.4 | Most routes near 0, few spikes |
| P3 Monopoly | 6.4 | 14.2 | Most routes near 0, few spikes |
| P4 Opportunity | 15.9 | 19.8 | Urban core hub-and-spoke bias |

### Stage 1: Outlier Capping (95th Percentile)

Each pillar is capped at its 95th percentile value before normalization. This prevents a handful of extreme outliers from skewing the mean and compressing the distribution for all other routes.

| Pillar | 95th Percentile Cap | Routes Capped |
|--------|-------------------|---------------|
| P1 Vulnerability | 73.1 | 12 |
| P2 Temporal | 32.9 | 12 |
| P3 Monopoly | 36.1 | 12 |
| P4 Opportunity | 61.7 | 12 |

### Stage 2: Z-Score Normalization

Each pillar is transformed to a unified distribution with **mean = 50** and **standard deviation = 20**, clamped to [0, 100].

```
normalized_score = 50 + ((raw_score - raw_mean) / raw_sd) × 20
```

This ensures that a score of 70 in any pillar means "one standard deviation above average," regardless of which pillar it represents. The weights now function as intended—a 35% weight for Vulnerability means Vulnerability contributes exactly 35% of the composite, not more.

### After Normalization

| Pillar | Normalized Average | Normalized StdDev |
|--------|-------------------|-------------------|
| P1 Vulnerability | 50.0 | 20.0 |
| P2 Temporal | 50.0 | 20.0 |
| P3 Monopoly | 49.4 | 18.4 |
| P4 Opportunity | 49.9 | 19.6 |

### Stage 3: Sigmoid (S-Curve) Transform

The weighted composite score is passed through a **sigmoid function** to create a non-linear distribution that:

- **Compresses** the middle band (the "Standard Coverage" routes that are neither exceptional nor failing)
- **Stretches** the extremes (making "Essential Lifelines" and "Underperforming" routes statistically distinct)

```
final_score = 100 / (1 + exp(-steepness × (raw_composite - midpoint)))
```

Parameters are auto-calibrated from the data:
- **Midpoint**: 49.84 (the mean composite before sigmoid)
- **Steepness**: 0.1598 (calibrated so ±2 SD covers the 10–90 score range)

### Final Distribution

| Metric | Value |
|--------|-------|
| Minimum | 4.3 |
| Maximum | 99.9 |
| Mean | 47.3 |
| Range | 95.6 |

---

## 3. Grading System

### Quintile-Based Relative Grading

Routes are graded using a **quintile distribution**—each letter grade represents approximately 20% of the 235-route network.

| Grade | Percentile | Score Range | Count | Interpretation |
|-------|-----------|-------------|-------|----------------|
| **A** | Top 20% | ≥ 86.7 | 47 | Essential Lifeline — highest equity impact |
| **B** | 60–80% | 54.6 – 86.6 | 47 | Above-average equity contribution |
| **C** | 40–60% | 29.5 – 54.5 | 47 | Standard coverage |
| **D** | 20–40% | 13.4 – 29.4 | 47 | Below-average equity contribution |
| **E** | Bottom 20% | < 13.4 | 47 | Lowest equity impact |

### Rationale

1. **Scores are inherently relative.** The composite score indicates how a route compares to others in the same network, not an absolute standard.
2. **Equal distribution ensures analytical utility.** Every grade contains a meaningful number of routes for policy comparison.
3. **Policy neutrality.** Quintiles avoid the implicit value judgment of where to set "passing" vs. "failing" cutoffs.

---

## 4. Data Sources

| Source | Provider | Resolution |
|--------|----------|-----------|
| Route geometry and schedules | GTFS, City of Edmonton | Route-level |
| Census demographics | Statistics Canada, 2021 Census | Dissemination Area (DA) |
| Points of interest | OpenStreetMap + municipal open data | Point-level, 400m buffer |
| Spatial analysis unit | Dissemination Area (DA) | Smallest census geography |

---

## 5. Reproducibility

The scoring pipeline consists of two scripts:

1. **`scripts/refine_scoring.py`** — Applies the full normalization pipeline (cap → z-score → sigmoid → regrade)
2. **`scripts/regrade_routes.py`** — Applies quintile regrading only (for use when thresholds need updating without re-normalizing)

Both scripts are idempotent and update the JSON and Apache Parquet data files. Scoring parameters are recorded in the `metadata.scoring` field of the golden record.

---

## 6. Known Limitations & Future Refinements

The current scoring uses pre-computed pillar values from the original analytical engine. The following refinements are planned for future iterations when raw data access is restored:

| Refinement | Current | Proposed |
|-----------|---------|----------|
| P2 Temporal | Simple ratio (night/peak) | Service Retention Delta with `tanh()` saturation function |
| P3 Monopoly | Count × Log(trips) | Redundancy Index: `1 - (Alt_Capacity / Route_Capacity)` |
| P4 Opportunity | Raw POI counts | Access Density: `Σ(POI × Weight) / Route_Length × Log(Ridership + 1)` |

These require access to raw GTFS trip frequencies, network overlap analysis, route lengths, and ridership data.
