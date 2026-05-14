"""
Scoring Refinement Pipeline — Phase A
Applies mathematical transformations to fix pillar dilution and score distribution.

Steps:
  1. Cap all pillars at 95th percentile (outlier control)
  2. Z-score normalize each pillar (mean=50, SD=20)
  3. Recompute weighted composite
  4. Apply sigmoid to final composite (stretch extremes, compress middle)
  5. Re-grade with quintiles
  6. Update JSON + Parquet
"""
import json
import math
import os
import pandas as pd

WEIGHTS = {
    'pillar_1_vulnerability': 0.35,
    'pillar_2_temporal': 0.25,
    'pillar_3_monopoly': 0.25,
    'pillar_4_opportunity': 0.15,
}

PILLAR_KEYS = list(WEIGHTS.keys())

def percentile(values, p):
    """Return the p-th percentile (0-100) of a sorted list."""
    sorted_v = sorted(values)
    k = (len(sorted_v) - 1) * (p / 100)
    f = int(k)
    c = f + 1 if f + 1 < len(sorted_v) else f
    d = k - f
    return sorted_v[f] + d * (sorted_v[c] - sorted_v[f])

def zscore_normalize(values, target_mean=50, target_sd=20):
    """Normalize values to target_mean ± target_sd, clamped to [0, 100]."""
    n = len(values)
    raw_mean = sum(values) / n
    raw_sd = math.sqrt(sum((v - raw_mean) ** 2 for v in values) / n)
    
    if raw_sd == 0:
        return [target_mean] * n
    
    normalized = []
    for v in values:
        z = (v - raw_mean) / raw_sd
        score = target_mean + z * target_sd
        score = max(0, min(100, score))
        normalized.append(round(score, 2))
    return normalized

def sigmoid(x, midpoint=50, steepness=0.08):
    """Apply sigmoid function: compresses middle, stretches extremes."""
    try:
        return 100 / (1 + math.exp(-steepness * (x - midpoint)))
    except OverflowError:
        return 0 if x < midpoint else 100

def main():
    path = 'public/data/golden_route_record.json'
    print("=" * 60)
    print("SCORING REFINEMENT PIPELINE — PHASE A")
    print("=" * 60)
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    routes = data['routes']
    n = len(routes)
    
    # === STEP 1: 95th Percentile Capping ===
    print(f"\n[1/5] Capping pillars at 95th percentile ({n} routes)...")
    for key in PILLAR_KEYS:
        values = [r[key] for r in routes]
        cap = percentile(values, 95)
        capped = 0
        for r in routes:
            if r[key] > cap:
                r[key] = cap
                capped += 1
        print(f"  {key}: cap={cap:.1f}, capped {capped} routes")
    
    # === STEP 2: Z-Score Normalization ===
    print(f"\n[2/5] Z-score normalizing (target: mean=50, SD=20)...")
    for key in PILLAR_KEYS:
        raw_values = [r[key] for r in routes]
        raw_mean = sum(raw_values) / n
        raw_sd = math.sqrt(sum((v - raw_mean) ** 2 for v in raw_values) / n)
        
        normalized = zscore_normalize(raw_values)
        for i, r in enumerate(routes):
            r[key] = normalized[i]
        
        new_mean = sum(normalized) / n
        new_sd = math.sqrt(sum((v - new_mean) ** 2 for v in normalized) / n)
        print(f"  {key}:")
        print(f"    Before: mean={raw_mean:.1f}, SD={raw_sd:.1f}")
        print(f"    After:  mean={new_mean:.1f}, SD={new_sd:.1f}")
    
    # === STEP 3: Recompute Weighted Composite ===
    print(f"\n[3/5] Recomputing weighted composite scores...")
    for r in routes:
        composite = sum(r[k] * w for k, w in WEIGHTS.items())
        r['composite_score_raw'] = round(composite, 2)
    
    raw_composites = [r['composite_score_raw'] for r in routes]
    print(f"  Raw composite: min={min(raw_composites):.1f}, max={max(raw_composites):.1f}, "
          f"avg={sum(raw_composites)/n:.1f}")
    
    # === STEP 4: Sigmoid Transform ===
    print(f"\n[4/5] Applying sigmoid transform to composite...")
    
    # Calibrate sigmoid: use the actual mean as midpoint
    comp_mean = sum(raw_composites) / n
    comp_sd = math.sqrt(sum((v - comp_mean) ** 2 for v in raw_composites) / n)
    
    # Steepness calibrated so ±2 SD covers roughly 10-90 range
    steepness = 4.0 / (2 * comp_sd) if comp_sd > 0 else 0.08
    
    for r in routes:
        r['composite_score'] = round(sigmoid(r['composite_score_raw'], comp_mean, steepness), 2)
    
    final_scores = [r['composite_score'] for r in routes]
    print(f"  Sigmoid params: midpoint={comp_mean:.1f}, steepness={steepness:.4f}")
    print(f"  Final composite: min={min(final_scores):.1f}, max={max(final_scores):.1f}, "
          f"avg={sum(final_scores)/n:.1f}")
    
    # === STEP 5: Quintile Re-grading ===
    print(f"\n[5/5] Re-grading with quintiles...")
    sorted_scores = sorted(final_scores)
    cuts = [sorted_scores[int(n * p)] for p in [0.2, 0.4, 0.6, 0.8]]
    
    counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0}
    for r in routes:
        s = r['composite_score']
        if s >= cuts[3]:
            r['grade'] = 'A'
        elif s >= cuts[2]:
            r['grade'] = 'B'
        elif s >= cuts[1]:
            r['grade'] = 'C'
        elif s >= cuts[0]:
            r['grade'] = 'D'
        else:
            r['grade'] = 'E'
        counts[r['grade']] += 1
    
    print(f"  Thresholds: E<{cuts[0]:.1f} | D<{cuts[1]:.1f} | C<{cuts[2]:.1f} | B<{cuts[3]:.1f} | A>={cuts[3]:.1f}")
    print(f"  Distribution: {counts}")
    
    # Update metadata
    data['metadata']['stats']['grade_distribution'] = counts
    data['metadata']['scoring'] = {
        'normalization': 'z-score (mean=50, SD=20)',
        'outlier_cap': '95th percentile',
        'composite_transform': 'sigmoid',
        'sigmoid_midpoint': round(comp_mean, 2),
        'sigmoid_steepness': round(steepness, 4),
        'grading': 'quintile-based relative',
    }
    
    # Clean up temp field
    for r in routes:
        if 'composite_score_raw' in r:
            del r['composite_score_raw']
    
    # === SAVE ===
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f)
    print(f"\n✅ JSON saved.")
    
    parquet_path = 'public/data/golden_route_record.parquet'
    df = pd.DataFrame([data])
    df.to_parquet(parquet_path, engine='pyarrow', index=False)
    
    json_size = os.path.getsize(path) / (1024 * 1024)
    parquet_size = os.path.getsize(parquet_path) / (1024 * 1024)
    print(f"✅ Parquet saved. JSON: {json_size:.2f} MB -> Parquet: {parquet_size:.2f} MB")
    
    print("\n" + "=" * 60)
    print("REFINEMENT COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
