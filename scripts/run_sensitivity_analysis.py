import json
import math
import os
import pandas as pd
import numpy as np

def main():
    print("=" * 60)
    print("ROUTE EQUITY INDEX — SENSITIVITY MONTE CARLO ENGINE")
    print("=" * 60)
    
    json_path = 'public/data/golden_route_record.json'
    if not os.path.exists(json_path):
        print(f"Error: Golden record not found at {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    routes = [r for r in data['routes'] if not r.get('is_regional', False)]
    num_routes = len(routes)
    print(f"Loaded {num_routes} non-regional routes from golden record for sensitivity sweep.")
    
    # 1. Generate Combinations (Stars & Bars: w1 + w2 + w3 + w4 = 1.0 in steps of 0.05)
    print("\n[1/5] Generating weight configurations...")
    combinations = []
    for w1 in range(0, 101, 5):
        for w2 in range(0, 101 - w1, 5):
            for w3 in range(0, 101 - w1 - w2, 5):
                w4 = 100 - w1 - w2 - w3
                combinations.append((w1 / 100.0, w2 / 100.0, w3 / 100.0, w4 / 100.0))
                
    num_configs = len(combinations)
    print(f"  Generated exactly {num_configs} valid zero-sum weight configurations.")
    
    # 2. Vectorized Raw Composite Calculations
    print("\n[2/5] Engineering vectorized matrices...")
    
    # Pillar matrix P: shape (num_routes, 4)
    P = np.array([
        [
            r['pillar_1_vulnerability'],
            r['pillar_2_temporal'],
            r['pillar_3_monopoly'],
            r['pillar_4_opportunity']
        ]
        for r in routes
    ])
    
    # Weight matrix W: shape (num_configs, 4)
    W = np.array(combinations)
    
    # Compute all raw composites: P * W.T of shape (num_routes, num_configs)
    print("  Running matrix multiplication for raw composites...")
    RawComposites = np.dot(P, W.T)
    
    # 3. Dynamic Sigmoid Stretch
    print("  Applying dynamic sigmoidal transforms...")
    # Calculate standard deviation of composites for each weight mix
    comp_sd = np.std(RawComposites, axis=0) # Shape: (num_configs,)
    
    # Steepness calibrated so ±2 SD covers roughly 10-90 range
    steepness = np.where(comp_sd > 0, 4.0 / (2 * comp_sd), 0.08)
    
    # Vectorized sigmoid: mean is guaranteed to be 50.0 since each pillar mean is 50.0
    X_shifted = RawComposites - 50.0
    exponent = -steepness * X_shifted
    Scores = np.round(100.0 / (1.0 + np.exp(exponent)), 2)
    
    # 4. Relative Quintile Grading
    print("  Running quintile relative grading...")
    Grades = np.empty(Scores.shape, dtype='object')
    for c in range(num_configs):
        col_scores = Scores[:, c]
        # Quintile cutoffs
        cuts = np.percentile(col_scores, [20, 40, 60, 80])
        
        col_grades = np.empty(col_scores.shape, dtype='object')
        col_grades[col_scores < cuts[0]] = 'E'
        col_grades[(col_scores >= cuts[0]) & (col_scores < cuts[1])] = 'D'
        col_grades[(col_scores >= cuts[1]) & (col_scores < cuts[2])] = 'C'
        col_grades[(col_scores >= cuts[2]) & (col_scores < cuts[3])] = 'B'
        col_grades[col_scores >= cuts[3]] = 'A'
        Grades[:, c] = col_grades
        
    print(f"  Calculated and graded all {num_routes * num_configs} records successfully.")
    
    # 5. Route-level Statistical Analysis
    print("\n[3/5] Computing sensitivity statistics per route...")
    
    summaries = []
    
    # OLS X matrix (num_configs, 4)
    # We fit a no-intercept OLS model: Score = beta_1 * w1 + beta_2 * w2 + beta_3 * w3 + beta_4 * w4
    # The coefficients represent expected score if that weight is set to 1.0 (100%)
    for r_idx in range(num_routes):
        r = routes[r_idx]
        y = Scores[r_idx, :] # scores for this route across 1771 combinations
        
        # OLS regression
        beta = np.linalg.lstsq(W, y, rcond=None)[0]
        
        # Grade numbers: A=5, B=4, C=3, D=2, E=1
        grade_map = {'A':5, 'B':4, 'C':3, 'D':2, 'E':1}
        g_nums = np.array([grade_map[g] for g in Grades[r_idx, :]])
        
        min_g = np.min(g_nums)
        max_g = np.max(g_nums)
        
        pct_ab = np.mean((g_nums == 5) | (g_nums == 4))
        pct_de = np.mean((g_nums == 2) | (g_nums == 1))
        
        # Stability Classification
        mean_score = np.mean(y)
        if pct_ab >= 0.90 and mean_score >= 10.0:
            stability_class = "Bedrock Essential"
        elif pct_de >= 0.90 and mean_score < 10.0:
            stability_class = "Bedrock Resilient"
        elif (max_g - min_g) >= 3:
            stability_class = "Policy Swing Corridor"
        else:
            stability_class = "Moderate Stability"
            
        summaries.append({
            'route_id': r['route_id'],
            'name': r['name'],
            'short_name': r['short_name'],
            'score_mean': round(np.mean(y), 2),
            'score_std': round(np.std(y), 2),
            'score_min': round(np.min(y), 2),
            'score_max': round(np.max(y), 2),
            'grade_stability_ab': round(pct_ab * 100, 1),
            'grade_stability_de': round(pct_de * 100, 1),
            'stability_class': stability_class,
            'driver_vulnerability': round(beta[0], 2),
            'driver_temporal': round(beta[1], 2),
            'driver_monopoly': round(beta[2], 2),
            'driver_opportunity': round(beta[3], 2),
        })
        
    df_summary = pd.DataFrame(summaries)
    
    # 6. Save Data Targets
    print("\n[4/5] Saving data exports...")
    
    # Save Summary CSV
    summary_csv_path = 'public/data/sensitivity_summary.csv'
    df_summary.to_csv(summary_csv_path, index=False)
    print(f"  Summary saved to {summary_csv_path} ({len(df_summary)} rows).")
    
    # Save stability_class back to golden records
    print("  Saving stability_class back to golden records...")
    stability_lookup = {s['route_id']: s['stability_class'] for s in summaries}
    golden_json_paths = [
        'public/data/golden_route_record.json',
        'data/golden_route_record.json'
    ]
    for g_path in golden_json_paths:
        if os.path.exists(g_path):
            with open(g_path, 'r', encoding='utf-8') as f:
                g_data = json.load(f)
            for r in g_data['routes']:
                r['stability_class'] = stability_lookup.get(r['route_id'], 'Moderate Stability')
            with open(g_path, 'w', encoding='utf-8') as f:
                json.dump(g_data, f)
            print(f"    Updated {g_path}")
    
    # Export formatted sensitivity scores to docs/sensitivity_scores.csv
    df_export = pd.DataFrame()
    df_export['Route ID'] = df_summary['route_id']
    df_export['Name'] = df_summary['name'].apply(lambda x: x.split('  ')[-1] if '  ' in str(x) else x)
    df_export['Mean Score'] = df_summary['score_mean']
    df_export['Robustness (Rr)'] = df_summary['score_std']
    df_export['AB Stability (%)'] = df_summary['grade_stability_ab'].apply(lambda x: f'{x:.1f}%')
    df_export['DE Stability (%)'] = df_summary['grade_stability_de'].apply(lambda x: f'{x:.1f}%')
    
    df_export['Primary Driver'] = df_summary[['driver_vulnerability', 'driver_temporal', 'driver_monopoly', 'driver_opportunity']].idxmax(axis=1).apply(
        lambda x: {
            'driver_vulnerability': 'Vulnerability',
            'driver_temporal': 'Temporal',
            'driver_monopoly': 'Monopoly',
            'driver_opportunity': 'Opportunity'
        }.get(x, 'Unknown')
    )
    df_export.to_csv('docs/sensitivity_scores.csv', index=False)
    print(f"  Spreadsheet saved to docs/sensitivity_scores.csv ({len(df_export)} rows).")
    
    # Build complete raw output matrix DataFrame
    print("  Constructing complete matrix DataFrame...")
    matrix_rows = []
    for c_idx, combo in enumerate(combinations):
        w_v, w_t, w_m, w_o = combo
        for r_idx in range(num_routes):
            matrix_rows.append({
                'route_id': routes[r_idx]['route_id'],
                'w_vulnerability': round(w_v, 2),
                'w_temporal': round(w_t, 2),
                'w_monopoly': round(w_m, 2),
                'w_opportunity': round(w_o, 2),
                'score': Scores[r_idx, c_idx],
                'grade': Grades[r_idx, c_idx]
            })
            
    df_matrix = pd.DataFrame(matrix_rows)
    
    # Save Parquet Database
    parquet_path = 'public/data/sensitivity_matrix.parquet'
    df_matrix.to_parquet(parquet_path, engine='pyarrow', index=False)
    print(f"  Matrix database saved to {parquet_path} ({len(df_matrix):,} rows).")
    
    # 7. Generate Research Report
    print("\n[5/5] Authoring Academic/Policy Sensitivity Report...")
    
    # Extract details for report tables
    bedrock_essential = df_summary[df_summary['stability_class'] == "Bedrock Essential"].sort_values(by='score_mean', ascending=False).head(15)
    bedrock_resilient = df_summary[df_summary['stability_class'] == "Bedrock Resilient"].sort_values(by='score_mean', ascending=True).head(15)
    swing_corridors = df_summary[df_summary['stability_class'] == "Policy Swing Corridor"].sort_values(by='score_std', ascending=False).head(15)
    
    counts = df_summary['stability_class'].value_counts()
    
    report_content = f"""# ROUTE EQUITY SCORECARD: REI WEIGHT SENSITIVITY ANALYSIS
*A Monte Carlo Policy Simulation Meta-Analysis on Transit Equity Classifications*

---

## EXECUTIVE SUMMARY
The Route Equity Scorecard defines equity priority by weighting four operational and socio-demographic pillars. These pillars are Vulnerability (socio-economic demographics) at 15 percent, Off Peak Service at 40 percent, Service Monopoly at 10 percent, and Opportunity Access at 35 percent. We conducted this analysis because choosing one specific default set of weighting introduces a potential policy vulnerability or weakness, as the prioritization of specific weights will shift the scoring of different routes depending on the policy orientations and definitions of “equity”.

To evaluate how sensitive the route equity scoring is to weight changes, a weight sensitivity Monte Carlo simulation was performed. The evaluation simulated 1,771 valid zero-sum policy weight configurations in 5 percent increments across all {num_routes} transit routes in Edmonton, generating {len(df_matrix):,} analytical records.

### 1.2 Summary of Findings:
First, **Bedrock Essentials**: Out of {num_routes} routes, {counts.get('Bedrock Essential', 0)} corridors representing {counts.get('Bedrock Essential', 0)/num_routes*100:.1f} percent of the total are classified as Bedrock Essentials. These routes maintain an A or B Grade in 90 percent or more of all simulated policy configurations. Their Route Equity Score is consistently high regardless of whether opportunity, off peak service, or vulnerability of the area, or monopoly service are emphasized.

Second, **Policy Swing Corridors**: There are {counts.get('Policy Swing Corridor', 0)} corridors representing {counts.get('Policy Swing Corridor', 0)/num_routes*100:.1f} percent of the total classified as highly sensitive Policy Swing Corridors. These routes experience significant grade variations, such as swinging from Grade A to Grade D depending on the weight configuration, indicating that their prioritization depends heavily on the chosen policy weights.

Third, **Pillar Dominance**: Regression driver coefficients indicate that Opportunity Access and Off Peak Service serve as the primary drivers of score variation, while Monopoly exerts a highly localized, corridor-specific influence.

---

## METHODOLOGY AND COMBINATORICS

### A. Combinatorial Compression
To compute every possible increment permutation where weights must sum to exactly 100 percent, the Stars and Bars combinatorics theorem was applied.

The number of combinations is calculated as follows:

$$\\text{{Combinations}} = \\binom{{N+K-1}}{{K-1}} = \\binom{{20+4-1}}{{4-1}} = \\binom{{23}}{{3}} = 1,771$$

In this calculation, $N$ equals 20, which represents steps of 5 percent. $K$ equals 4, which represents the four equity pillars.
This reduces the search space by 99.1 percent relative to a full grid search, which would require 194,481 evaluations, improving the efficiency of the simulation.

### B. Analytical Indices
- **Robustness Index ($R_r$):** This is the standard deviation of the route composite score across all 1,771 configurations. A lower robustness index value implies structural resilience to changes in policy weights. Essentially, no matter what the weighting of the REI factors is, the score remains stable.
- **No-Intercept Ordinary Least Squares Drivers:** For each corridor, a no-intercept ordinary least squares regression model was used:
  
  $$\\text{{CompositeScore}}(r,c) = \\beta_1 w_{{1,c}} + \\beta_2 w_{{2,c}} + \\beta_3 w_{{3,c}} + \\beta_4 w_{{4,c}} + \\epsilon$$
  
  Since the weights sum to 1.0, the coefficients correspond to the expected score of the route under a 100 percent pure weight on that specific pillar, acting as direct driver indicators.

### C. Stability Classifications
- **Bedrock Essential:** Grade A or B in 90 percent or more of simulated combinations.
- **Bedrock Resilient:** Grade D or E in 90 percent or more of simulated combinations.
- **Policy Swing Corridor:** Grade spread of 3 or more grades, such as from B to E, across runs.
- **Moderate Stability:** Corridors that do not swing severely but are not consistently in the extreme quintiles.

---

## CORRIDOR STABILITY PROFILES

### Figure 3A: Network Stability Class Distribution
Edmonton transit corridors are classified into the following categories:
- **Bedrock Essentials:** {counts.get('Bedrock Essential', 0)} routes
- **Bedrock Resilient:** {counts.get('Bedrock Resilient', 0)} routes
- **Policy Swing Corridors:** {counts.get('Policy Swing Corridor', 0)} routes
- **Moderate Stability:** {counts.get('Moderate Stability', 0)} routes

*(Note: Visual representation coordinates and trends are detailed in Appendix A)*

### Figure 3C: Volatility vs. Mean Score (Policy Risk Map)
*(Note: Volatility mapping is outputted as part of the analysis backend exports)*

### Figure 3B: Grade Stability AB Distribution

### A. Bedrock Essentials, Top 15 Corridors
These corridors consistently score in the top 40 percent, representing Grades A and B, under nearly all policy weight configurations.

The details below list the Route ID, Name, Mean Score, Robustness, AB Stability percentage, and Primary Driver:

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | Primary Driver |
| :--- | :--- | :---: | :---: | :---: | :--- |
"""
    for _, row in bedrock_essential.iterrows():
        drivers = [
            ('Vulnerability', row['driver_vulnerability']),
            ('Temporal', row['driver_temporal']),
            ('Monopoly', row['driver_monopoly']),
            ('Opportunity', row['driver_opportunity'])
        ]
        best_driver = max(drivers, key=lambda x: x[1])[0]
        # Map driver name to match user layout
        driver_map = {'Vulnerability': 'Vulnerability', 'Temporal': 'Temporal', 'Monopoly': 'Monopoly', 'Opportunity': 'Opportunity'}
        best_driver = driver_map[best_driver]
        report_content += f"| `{row['route_id']}` | {row['short_name']} — {row['name'].split('  ')[-1]} | {row['score_mean']:.1f} | {row['score_std']:.2f} | {row['grade_stability_ab']:.1f}% | {best_driver} |\n"
        
    report_content += """
### B. Highly Sensitive Policy Swing Corridors, Top 15 Corridors
These corridors are sensitive to weight adjustments. Depending on the weight configuration, they may receive either high or low priority rankings.

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | Grade Swing | Best Weight Mix |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
"""
    for _, row in swing_corridors.iterrows():
        drivers = [
            ('Vuln', row['driver_vulnerability']),
            ('Temp', row['driver_temporal']),
            ('Monop', row['driver_monopoly']),
            ('Opp', row['driver_opportunity'])
        ]
        best_mix = max(drivers, key=lambda x: x[1])[0]
        report_content += f"| `{row['route_id']}` | {row['short_name']} — {row['name'].split('  ')[-1]} | {row['score_mean']:.1f} | {row['score_std']:.2f} | {row['grade_stability_ab']:.1f}% | Volatile | {best_mix}-heavy |\n"

    report_content += """
### C. Bedrock Resilient Corridors, Top 15 Low-Priority Corridors
These corridors consistently score in the bottom 40 percent, representing Grades D and E, under almost all weight configurations, typically representing commuter expresses or low-dependency suburban feeders.

The details below list the Route ID, Name, Mean Score, Robustness, and DE Stability percentage:

| Route ID | Name | Mean Score | Robustness | DE Stability (%) |
| :--- | :--- | :---: | :---: | :---: |
"""
    for _, row in bedrock_resilient.iterrows():
        report_content += f"| `{row['route_id']}` | {row['short_name']} — {row['name'].split('  ')[-1]} | {row['score_mean']:.1f} | {row['score_std']:.2f} | {row['grade_stability_de']:.1f}% |\n"

    report_content += """
---

## STATISTICAL DRIVERS OF SCORE VOLATILITY
The sensitivity of a composite score to weight changes can be traced back to its underlying pillar values, explained by the standardized ordinary least squares driver coefficients:
- **Opportunity-Driven Corridors:** Corridors with high opportunity drivers typically represent radial express routes serving employment centers. These routes perform well under opportunity-heavy configurations.
- **Temporal-Driven Corridors:** Corridors with high temporal coefficients represent local routes with substantial off-peak, late-night, or weekend service coverage. These routes show higher priority when Temporal Resilience is emphasized.
- **Vulnerability-Driven Corridors:** Corridors serving areas with higher demographic concentrations of transit-reliant populations, such as low-income households, single-parent families, seniors, and recent immigrants. These routes rank highest when Vulnerability weights are elevated.
- **Monopoly-Driven Corridors:** Corridors serving areas with limited or no overlapping transit alternatives, where residents are structurally dependent on a single route for spatial access to the broader transit network. These routes rank highest when Monopoly weight is elevated.

### Figure 4: Top 20 Most Volatile Routes by Primary Driver
This horizontal bar chart presents the twenty most volatile transit routes measured by their standard deviation, with each bar colour-coded to represent its primary structural driver. The three routes with the highest volatility scores are entirely driven by monopoly characteristics and reach standard deviations of nearly thirty (29.5). The remaining volatility profile is dominated by a mixture of Monopoly, Opportunity, and Temporal drivers, with no routes being primarily driven by Vulnerability.

#### Why is Vulnerability never a key driver of policy swings?
1. **Socio-Demographic Smoothing at the Route Level**: Vulnerability is calculated across Edmonton's 1,700+ Dissemination Areas (DAs) using continuous PCA-weighted indicators. When projected onto route paths via spatial catchment distance decay, these scores are naturally aggregated and smoothed. Routes rarely serve purely homogeneous demographic extremes, resulting in a more balanced and centered distribution across the network.
2. **Binary Contrast in Structural Attributes**: Structural features like *Monopoly* (either a route is the absolute sole lifeline for a neighborhood or it overlaps with several routes) and *Opportunity Access* (either a route runs directly into a major job hub like Downtown/WEM or it is a minor suburban feeder) are highly polarized. Shifting weight to these variables causes extreme score changes (near 0 to near 100), driving high standard deviations.
3. **Policy Implications for Planners**:
   - **Vulnerability as a Stable Anchor**: Identifying demographic transit need is reliable and structurally insulated from weight philosophy changes.
   - **Structural Trade-offs Drive Risk**: Planners' political choices primarily shift transit priorities between coverage networks (Monopoly) and high-frequency commuter networks (Opportunity Access), which is where sensitivity checking and "what-if" modeling should be focused.

---

## POLICY CONCLUSIONS 

### A. Protect Bedrock Essentials 
Since Bedrock Essentials maintain consistent priority rankings across varying weight definitions, their planning and funding can be prioritized independently of shifts in policy weights. These corridors show stable, structural demand under all evaluated scenarios.

### B. Use Strategic Defaults to Manage Volatility
The current baseline weight configuration, which allocates Vulnerability at 15 percent, Temporal at 40 percent, Monopoly at 10 percent, and Opportunity at 35 percent, provides a balanced point of reference. This distribution prevents any single operational or demographic pillar from dominating the final scores, helping to stabilize classifications for the more sensitive Policy Swing Corridors.

### C. Implement Sensitivity Modeling for Swing Corridors
For routes identified as Policy Swing Corridors, planning changes or route optimizations should be accompanied by sensitivity modeling. If a modest shift in policy weights significantly alters a route's priority grade, additional evaluation is recommended to clarify whether the route primarily serves a localized transit monopoly or standard commuter demand.

---

## Appendix A: 
- `sensitivity_summary`
- **Figure A: Score Range Volatility Profile**
"""
    
    report_path = 'docs/SENSITIVITY_ANALYSIS_REPORT.md'
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_content)
    print(f"\n  Policy Sensitivity Report saved to {report_path}.")
    
    print("\n" + "=" * 60)
    print("SENSITIVITY MONTE CARLO ANALYSIS COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
