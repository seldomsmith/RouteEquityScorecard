# Route Equity Index — Scoring & Grading Methodology

## Overview

The Route Equity Index (REI) assigns each transit route in the Edmonton network a letter grade from **A** (highest equity impact) to **E** (lowest equity impact). The grade reflects a route's relative position within the network based on a composite equity score derived from four weighted analytical pillars, refined through a three-stage statistical normalization pipeline.

---

## 1. The Four Pillars

### Pillar 1: Vulnerability Density (Default Weight: 35%)

Measures the "social gravity" of the service corridor using distance-decay weighting.

- **Formula**: We count how many low-income or vulnerable residents live near the route, giving full points to homes right next to a bus stop and fewer points to those a walk away (up to 400 meters).
- **Logic**: Routes that penetrate directly into high-need dissemination areas receive higher scores than those merely bordering them.

### Pillar 2: Off Peak Service (Default Weight: 25%)

Measures the reliability of service during off-peak windows critical for late night transit riders.

- **Formula**: We compare how many buses run late at night (9:30–10:30 PM) versus during the morning rush hour (7:30–8:30 AM). If a route keeps running frequently late at night, it acts as a lifeline for late night transit riders.
- **Logic**: Routes that maintain a high percentage of their peak frequency late at night provide 24/7 resilience for workers in hospitals, retail, and security.

### Pillar 3: Network Monopoly (Default Weight: 25%)

Identifies corridors where a route is the primary or sole provider of transit access to its destinations.

- **Formula**: We identify 'transit monopolies'—neighborhoods where a single bus route is the only way in or out. If this route is cut, residents face an immediate transit desert.
- **Logic**: Measures destination-level dependency. Instead of a binary cutoff, it calculates the route's capacity share for each destination it serves compared to alternative routes serving the same DA. Defaulting to 0 if a route serves zero POIs. Weighted by frequency log1p to distinguish vital high-frequency lifelines from infrequent connectors.

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
| P2 Off Peak Service | 10.5 | 14.4 | Most routes near 0, few spikes |
| P3 Monopoly | 6.4 | 14.2 | Most routes near 0, few spikes |
| P4 Opportunity | 15.9 | 19.8 | Urban core hub-and-spoke bias |

### Stage 1: Outlier Capping (95th Percentile)

Each pillar is capped at its 95th percentile value before normalization. This prevents a handful of extreme outliers from skewing the mean and compressing the distribution for all other routes.

| Pillar | 95th Percentile Cap | Routes Capped |
|--------|-------------------|---------------|
| P1 Vulnerability | 73.1 | 12 |
| P2 Off Peak Service | 32.9 | 12 |
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
| P2 Off Peak Service | 50.0 | 20.0 |
| P3 Monopoly | 49.4 | 18.4 |
| P4 Opportunity | 49.9 | 19.6 |

### Stage 3: Sigmoid (S-Curve) Transform

We use a statistical filter to separate the "average" routes from the extreme standouts. This highlights the absolute essential lifelines on one end, and the most under-resourced routes on the other.

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
| **E** | Bottom 20% | < 13.4 | 47 | Infrequent or Occasional Rider Service — lowest equity impact |

### Rationale

1. **Scores are inherently relative.** The composite score indicates how a route compares to others in the same network, not an absolute standard.
2. **Equal distribution ensures analytical utility.** Every grade contains a meaningful number of routes for policy comparison.
3. **Policy neutrality.** Quintiles avoid the implicit value judgment of where to set "passing" vs. "failing" cutoffs.

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

---

## 7. Bus Stop Vulnerability Analysis Methodology

In addition to route-level evaluations, the Scorecard evaluates individual bus stop locations across the entire transit network (**6,750+ stops**).

### 400m Geodesic Catchment Overlap
- **Spatial Precision**: For each bus stop, a **400-meter geodesic catchment buffer** (approx. 5-minute walk) is generated using meter-accurate projection (`EPSG:3400` Alberta 10-TM).
- **Proportional DA Area Intersections**: Bus stop catchments often cross multiple Dissemination Area (DA) boundaries. The stop's raw vulnerability score is computed via **area-weighted proportional overlap**:
  $$\text{Stop Score} = \sum_{i=1}^{K} \left( \frac{\text{Area}(\text{Buffer} \cap \text{DA}_i)}{\text{Area}(\text{Buffer})} \times \text{DA Score}_i \right)$$

### Continuous Percentile Ranking (1–100th %ile)
- **Coarse Quintile Resolution Fix**: Raw StatCan CIMD scores are reported in discrete 1–5 quintile steps (scores of 20, 40, 60, 80, 100), creating heavy clustering at 20.0 and 100.0.
- **Continuous Percentiles**: To provide rich visual and analytical differentiation across the network, continuous percentile ranks ($0.0 \text{ to } 100.0$) are calculated across stops.
- **Smooth Visual Spectrum**: Map stop markers and color gradients interpolate across continuous percentile ranks ($0\% \rightarrow \text{Green}, 50\% \rightarrow \text{Yellow}, 100\% \rightarrow \text{Red}$) rather than coarse score steps.

### Regional Stop Treatment (City of Edmonton Isolation)
- **Scope Isolation**: Regional bus stops located outside City of Edmonton municipal/DA boundaries (e.g. regional commuter connectors) are explicitly flagged (`is_regional: true`).
- **Percentile Exclusion**: Regional stops are **excluded** from the citywide percentile rank calculation so that non-city locations do not distort Edmonton's urban vulnerability distribution.
- **Visual Graying-Out**: Regional stops are rendered on the map in a muted slate-gray (`#94A3B8`, opacity 0.4) and labeled as `Regional / N/A` in directory listings.
