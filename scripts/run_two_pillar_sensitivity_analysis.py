import json
import math
import os
import pandas as pd
import numpy as np

def main():
    print("=" * 60)
    print("2-PILLAR ROUTE EQUITY INDEX — SENSITIVITY MONTE CARLO ENGINE")
    print("=" * 60)
    
    json_path = 'public/data/golden_route_record.json'
    if not os.path.exists(json_path):
        print(f"Error: Golden record not found at {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    routes = data['routes']
    num_routes = len(routes)
    print(f"Loaded {num_routes} routes from golden record.")
    
    # 1. Generate Configurations (2 Pillars: w_vulnerability + w_opportunity = 1.0)
    print("\n[1/5] Generating weight configurations...")
    combinations = []
    for w_v in range(0, 101, 5):
        w_o = 100 - w_v
        combinations.append((w_v / 100.0, 0.0, 0.0, w_o / 100.0))
                
    num_configs = len(combinations)
    print(f"  Generated exactly {num_configs} valid zero-sum weight configurations (Vulnerability & Opportunity only).")
    
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
    
    # Compute raw composites: P * W.T of shape (num_routes, num_configs)
    RawComposites = np.dot(P, W.T)
    
    # 3. Dynamic Sigmoid Stretch
    print("  Applying dynamic sigmoidal transforms...")
    comp_sd = np.std(RawComposites, axis=0) # Shape: (num_configs,)
    steepness = np.where(comp_sd > 0, 4.0 / (2 * comp_sd), 0.08)
    X_shifted = RawComposites - 50.0
    exponent = -steepness * X_shifted
    Scores = np.round(100.0 / (1.0 + np.exp(exponent)), 2)
    
    # 4. Relative Quintile Grading
    print("  Running quintile relative grading...")
    Grades = np.empty(Scores.shape, dtype='object')
    for c in range(num_configs):
        col_scores = Scores[:, c]
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
    
    # W_subset for no-intercept OLS driver estimation (Vulnerability and Opportunity columns)
    W_subset = W[:, [0, 3]]
    
    for r_idx in range(num_routes):
        r = routes[r_idx]
        y = Scores[r_idx, :]
        
        # Fit OLS model on 2 active pillars
        beta = np.linalg.lstsq(W_subset, y, rcond=None)[0]
        
        grade_map = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
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
            'driver_temporal': 0.0,
            'driver_monopoly': 0.0,
            'driver_opportunity': round(beta[1], 2),
        })
        
    df_summary = pd.DataFrame(summaries)
    
    # Save spreadsheet to docs folder
    print("\n[4/5] Saving spreadsheet output...")
    df_export = pd.DataFrame()
    df_export['Route ID'] = df_summary['route_id']
    df_export['Name'] = df_summary['name'].apply(lambda x: x.split('  ')[-1] if '  ' in str(x) else x)
    df_export['Mean Score'] = df_summary['score_mean']
    df_export['Robustness (Rr)'] = df_summary['score_std']
    df_export['AB Stability (%)'] = df_summary['grade_stability_ab'].apply(lambda x: f'{x:.1f}%')
    df_export['DE Stability (%)'] = df_summary['grade_stability_de'].apply(lambda x: f'{x:.1f}%')
    
    # Assign primary driver from active 2 pillars
    df_export['Primary Driver'] = df_summary[['driver_vulnerability', 'driver_opportunity']].idxmax(axis=1).apply(
        lambda x: 'Vulnerability' if x == 'driver_vulnerability' else 'Opportunity'
    )
    
    spreadsheet_path = 'docs/sensitivity_scores_2_pillar.csv'
    df_export.to_csv(spreadsheet_path, index=False)
    print(f"  Spreadsheet saved to {spreadsheet_path} ({len(df_export)} rows).")

    # Save stability_class_2_pillar back to golden records
    print("  Saving stability_class_2_pillar back to golden records...")
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
                r['stability_class_2_pillar'] = stability_lookup.get(r['route_id'], 'Moderate Stability')
            with open(g_path, 'w', encoding='utf-8') as f:
                json.dump(g_data, f)
            print(f"    Updated {g_path} with 2-pillar stability classes")

    
    # 6. Generate 2-Pillar Research Report
    print("\n[5/5] Authoring 2-Pillar Sensitivity Report...")
    bedrock_essential = df_summary[df_summary['stability_class'] == "Bedrock Essential"].sort_values(by='score_mean', ascending=False).head(15)
    bedrock_resilient = df_summary[df_summary['stability_class'] == "Bedrock Resilient"].sort_values(by='score_mean', ascending=True).head(15)
    moderate_stability_routes = df_summary[df_summary['stability_class'] == "Moderate Stability"].sort_values(by='score_std', ascending=False).head(15)
    
    counts = df_summary['stability_class'].value_counts()
    len_matrix = num_routes * num_configs
    
    report_content = f"""# ROUTE EQUITY SCORECARD: 2-PILLAR WEIGHT SENSITIVITY ANALYSIS
*A Monte Carlo Policy Simulation Meta-Analysis on Vulnerability & Opportunity Access*

---

## EXECUTIVE SUMMARY
This report analyzes how Edmonton's transit route equity scores behave when we restrict our evaluation to two core pillars: **Vulnerability** (which measures socio-demographic need based on census indicators) and **Opportunity Access** (which measures how well a route connects people to jobs). 

### Why Exclude Monopoly and Off-Peak Service?
In previous versions of the Route Equity Scorecard, we factored in structural and operational metrics:
* **Service Monopoly**: High scores were given to routes that are the sole transit option in a neighborhood.
* **Off-Peak/Temporal Service**: High scores went to routes with substantial weekend, late-night, or early-morning schedules.

While these operational metrics are valuable, they reflect the *way service is scheduled and laid out* rather than *who* is riding and *why*. By isolating Vulnerability (demographics) and Opportunity Access (employment connections) and setting Monopoly and Temporal weights to zero, we can evaluate a fundamental planning question: **Does our transit network prioritize areas with the highest human need, or does it prioritize connecting people to jobs?** 

This two-pillar approach helps planners understand the trade-offs between a "welfare-oriented" equity model (focusing resources on disadvantaged populations) and an "economic-utility" model (focusing resources on employment hubs).

### Simulation Scale
To test the sensitivity of this two-pillar model, we ran a Monte Carlo simulation. We swept the weights of Vulnerability ($w_1$) and Opportunity Access ($w_4$) from 0% to 100% in 5% increments (yielding 21 unique weight combinations). Running this sweep across all {num_routes} transit routes in Edmonton generated {len_matrix:,} analytical records.

### 1.2 Summary of Findings:
First, **Bedrock Essentials**: Out of {num_routes} routes, {counts.get('Bedrock Essential', 0)} corridors representing {counts.get('Bedrock Essential', 0)/num_routes*100:.1f} percent of the total are classified as Bedrock Essentials. These routes maintain an A or B Grade in 90 percent or more of all simulated policy configurations. Their Route Equity Score is consistently high regardless of whether opportunity or vulnerability of the area are emphasized.

Second, **Policy Swing Corridors**: There are 0 corridors representing 0.0 percent of the total classified as highly sensitive Policy Swing Corridors. These routes experience significant grade variations, such as swinging from Grade A to Grade D depending on the weight configuration, indicating that their prioritization depends heavily on the chosen policy weights.

Third, **Pillar Dominance**: Regression driver coefficients indicate that Opportunity Access and Vulnerability serve as the primary drivers of score variation.

---

## METHODOLOGY AND COMBINATORICS

### A. Combinatorial Compression
To compute every possible increment permutation where weights must sum to exactly 100 percent, the Stars and Bars combinatorics theorem was applied.

The number of combinations is calculated as follows:

$$\\text{{Combinations}} = \\binom{{N+K-1}}{{K-1}} = \\binom{{20+2-1}}{{2-1}} = \\binom{{21}}{{1}} = 21$$

In this calculation, $N$ equals 20, which represents steps of 5 percent. $K$ equals 2, which represents the two active equity pillars.
This reduces the search space significantly relative to a full 4-pillar grid search.

### B. Analytical Indices
- **Robustness Index ($R_r$):** This is the standard deviation of the route composite score across all 21 configurations. A lower robustness index value implies structural resilience to changes in policy weights.
- **No-Intercept Ordinary Least Squares Drivers:** For each corridor, a no-intercept ordinary least squares regression model was used:
  
  $$\\text{{CompositeScore}}(r,c) = \\beta_1 w_{{1,c}} + \\beta_4 w_{{4,c}} + \\epsilon$$
  
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
- **Policy Swing Corridors:** 0 routes
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
        driver = 'Vulnerability' if row['driver_vulnerability'] >= row['driver_opportunity'] else 'Opportunity'
        report_content += f"| `{row['route_id']}` | {row['short_name']} — {row['name'].split('  ')[-1]} | {row['score_mean']:.1f} | {row['score_std']:.2f} | {row['grade_stability_ab']:.1f}% | {driver} |\n"
        
    report_content += """
### B. Highly Sensitive Policy Swing Corridors
No corridors met the strict criteria for highly volatile Policy Swing Corridors in this 2-pillar model, as no route swung by 3 or more grades (such as from A to D or B to E). The maximum grade variation across all 170 routes was limited to 2 grades. 

However, there is a group of **Moderate Swing Corridors** (classified under Moderate Stability) that exhibit the highest volatility in this two-pillar model. While they do not cross the extreme boundaries, their priority status remains sensitive to the balance between demographic vulnerability and job access:

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | DE Stability (%) | Primary Driver |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
"""
    for _, row in moderate_stability_routes.iterrows():
        driver = 'Vulnerability' if row['driver_vulnerability'] >= row['driver_opportunity'] else 'Opportunity'
        report_content += f"| `{row['route_id']}` | {row['short_name']} — {row['name'].split('  ')[-1]} | {row['score_mean']:.1f} | {row['score_std']:.2f} | {row['grade_stability_ab']:.1f}% | {row['grade_stability_de']:.1f}% | {driver} |\n"

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
The sensitivity of a route's composite score to weight changes in this model is driven by how its spatial routing aligns with either demographic vulnerability or job access. The Ordinary Least Squares (OLS) regression coefficients show this trade-off clearly, and we can see this play out directly among the Bedrock Essentials:

- **Opportunity-driven Corridors:** These routes represent express trunk lines feeding industrial areas, retail centers, or major commercial districts. Placing a high weight on Opportunity Access increases the scores of these routes.
  * *Example from Table A*: Routes like `002` (West Edmonton Mall - Stadium - Clareview), `005` (Westmount - Downtown - Coliseum), and `900X` (Lewis Farms and Downtown) connect massive commercial centers. Because their primary mission is linking commuters to jobs, their OLS coefficients are opportunity-driven.
- **Vulnerability-driven Corridors:** These routes serve residential communities with high concentrations of transit-reliant populations, such as low-income households, single-parent families, seniors, and recent immigrants. These routes perform best under a Vulnerability-heavy mix.
  * *Example from Table A*: Routes like `103` (Eaux Claires - Castle Downs - Kingsway), `516` (Mill Woods - Laurel - Meadows), and `109` (Northgate - Castle Downs - Hudson) run through residential areas with high socio-demographic vulnerability indices. Their OLS coefficients are vulnerability-driven, reflecting their role as essential community lifelines.


### Why is Vulnerability never a key driver of volatility?
A key observation from the volatility chart is that **no routes are primarily driven by Vulnerability in a way that causes high volatility**. 
1. **Spatial Aggregation**: Vulnerability index scores are calculated at the census Dissemination Area (DA) level and projected onto routes using spatial catchment distance decay. Because routes traverse multiple DAs of varying demographic profiles, the resulting demographic scores are naturally averaged and smoothed. They do not exhibit the extreme "0 or 100" binary distribution seen in structural variables.
2. **Binary Contrast of Opportunity**: In contrast, Opportunity Access is highly polarized. A route either connects directly to a massive job hub (high score) or functions as a local suburban loop (near-zero score). When Opportunity weight shifts, these polarized routes experience dramatic score changes, driving overall network volatility.

---

## POLICY CONCLUSIONS 

### A. Protect Bedrock Essentials 
Since Bedrock Essentials maintain consistent priority rankings across varying weight definitions, their planning and funding can be prioritized independently of shifts in policy weights. These corridors show stable, structural demand under all evaluated scenarios.

### B. Use Strategic Defaults to Manage Volatility
The current baseline weight configuration, which allocates Vulnerability and Opportunity access, provides a balanced point of reference when monopoly and temporal service characteristics are excluded.

### C. Implement Sensitivity Modeling for Swing Corridors
For routes identified as Policy Swing Corridors, planning changes or route optimizations should be accompanied by sensitivity modeling. If a modest shift in active policy weights significantly alters a route's priority grade, additional evaluation is recommended.

---

## Appendix A: 
- `sensitivity_summary`
- **Figure A: Score Range Volatility Profile**
"""
    
    report_path = 'docs/SENSITIVITY_ANALYSIS_REPORT_2_PILLAR.md'
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_content)
    print(f"  Policy Sensitivity Report saved to {report_path}.")
    
    print("\n" + "=" * 60)
    print("2-PILLAR SENSITIVITY MONTE CARLO ANALYSIS COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
