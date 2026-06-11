# ROUTE EQUITY SCORECARD: REI WEIGHT SENSITIVITY ANALYSIS
*A Monte Carlo Policy Simulation Meta-Analysis on Transit Equity Classifications*

---

## EXECUTIVE SUMMARY
The Route Equity Scorecard defines equity priority by weighting four operational and socio-demographic pillars. These pillars are Vulnerability (socio-economic demographics) at 15 percent, Off Peak Service at 40 percent, Service Monopoly at 10 percent, and Opportunity Access at 35 percent. We conducted this analysis because choosing one specific default set of weighting introduces a potential policy vulnerability or weakness, as the prioritization of specific weights will shift the scoring of different routes depending on the policy orientations and definitions of “equity”.

To evaluate how sensitive the route equity scoring is to weight changes, a weight sensitivity Monte Carlo simulation was performed. The evaluation simulated 1,771 valid zero-sum policy weight configurations in 5 percent increments across all 235 transit routes in Edmonton, generating 416,185 analytical records.

### 1.2 Summary of Findings:
First, **Bedrock Essentials**: Out of 235 routes, 44 corridors representing 18.7 percent of the total are classified as Bedrock Essentials. These routes maintain an A or B Grade in 90 percent or more of all simulated policy configurations. Their Route Equity Score is consistently high regardless of whether opportunity, off peak service, or vulnerability of the area, or monopoly service are emphasized.

Second, **Policy Swing Corridors**: There are 107 corridors representing 45.5 percent of the total classified as highly sensitive Policy Swing Corridors. These routes experience significant grade variations, such as swinging from Grade A to Grade D depending on the weight configuration, indicating that their prioritization depends heavily on the chosen policy weights.

Third, **Pillar Dominance**: Regression driver coefficients indicate that Opportunity Access and Off Peak Service serve as the primary drivers of score variation, while Monopoly exerts a highly localized, corridor-specific influence.

---

## METHODOLOGY AND COMBINATORICS

### A. Combinatorial Compression
To compute every possible increment permutation where weights must sum to exactly 100 percent, the Stars and Bars combinatorics theorem was applied.

The number of combinations is calculated as follows:

$$\text{Combinations} = \binom{N+K-1}{K-1} = \binom{20+4-1}{4-1} = \binom{23}{3} = 1,771$$

In this calculation, $N$ equals 20, which represents steps of 5 percent. $K$ equals 4, which represents the four equity pillars.
This reduces the search space by 99.1 percent relative to a full grid search, which would require 194,481 evaluations, improving the efficiency of the simulation.

### B. Analytical Indices
- **Robustness Index ($R_r$):** This is the standard deviation of the route composite score across all 1,771 configurations. A lower robustness index value implies structural resilience to changes in policy weights. Essentially, no matter what the weighting of the REI factors is, the score remains stable.
- **No-Intercept Ordinary Least Squares Drivers:** For each corridor, a no-intercept ordinary least squares regression model was used:
  
  $$\text{CompositeScore}(r,c) = \beta_1 w_{1,c} + \beta_2 w_{2,c} + \beta_3 w_{3,c} + \beta_4 w_{4,c} + \epsilon$$
  
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
- **Bedrock Essentials:** 44 routes
- **Bedrock Resilient:** 44 routes
- **Policy Swing Corridors:** 107 routes
- **Moderate Stability:** 40 routes

*(Note: Visual representation coordinates and trends are detailed in Appendix A)*

### Figure 3C: Volatility vs. Mean Score (Policy Risk Map)
*(Note: Volatility mapping is outputted as part of the analysis backend exports)*

### Figure 3B: Grade Stability AB Distribution

### A. Bedrock Essentials, Top 15 Corridors
These corridors consistently score in the top 40 percent, representing Grades A and B, under nearly all policy weight configurations.

The details below list the Route ID, Name, Mean Score, Robustness, AB Stability percentage, and Primary Driver:

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | Primary Driver |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `002` | 002 — 002 — West Edmonton Mall - Stadium - Clareview | 87.4 | 19.30 | 100.0% | Opportunity |
| `005` | 005 — 005 — Westmount - Downtown - Coliseum | 52.2 | 34.63 | 100.0% | Opportunity |
| `008` | 008 — 008 — Abbottsfield - Downtown - University | 51.7 | 37.58 | 100.0% | Opportunity |
| `560` | 560 — 560 — Spruce Grove - Downtown Edmonton | 46.3 | 37.17 | 95.2% | Monopoly |
| `103` | 103 — 103 — Eaux Claires - Castle Downs - Kingsway | 40.1 | 26.74 | 100.0% | Vulnerability |
| `009` | 009 — 009 — Southgate - Eaux Claires | 29.2 | 27.74 | 100.0% | Opportunity |
| `715` | 715 — 715 — Leger - Century Park | 28.3 | 26.10 | 99.0% | Vulnerability |
| `056` | 056 — 056 — Meadows - Leger - West Edmonton Mall | 27.3 | 33.56 | 99.7% | Vulnerability |
| `900X` | 900X — 900X — Lewis Farms - Downtown | 22.1 | 26.97 | 96.0% | Opportunity |
| `021R` | Capital — Capital — Capital Line | 18.8 | 21.48 | 100.0% | Vulnerability |
| `523` | 523 — 523 — Mill Woods - Downtown | 17.9 | 24.29 | 98.8% | Opportunity |
| `519` | 519 — 519 — Mill Woods - Century Park | 17.6 | 25.66 | 100.0% | Vulnerability |
| `516` | 516 — 516 — Mill Woods - Laurel - Meadows | 16.9 | 27.75 | 92.3% | Vulnerability |
| `130X` | 130X — 130X — Baturyn - Eaux Claires - Government Centre | 16.0 | 22.13 | 90.3% | Vulnerability |
| `111` | 111 — 111 — Concordia - Westmount | 15.9 | 22.05 | 90.1% | Opportunity |

### B. Highly Sensitive Policy Swing Corridors, Top 15 Corridors
These corridors are sensitive to weight adjustments. Depending on the weight configuration, they may receive either high or low priority rankings.

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | Grade Swing | Best Weight Mix |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `L10` | 10 — 10 — Leduc - Nisku - Eia | 16.3 | 29.83 | 61.2% | Volatile | Temp-heavy |
| `665` | 665 — 665 — Charlesworth - Dr. Anne Anderson | 15.1 | 27.31 | 71.3% | Volatile | Vuln-heavy |
| `118` | 118 — 118 — Eaux Claires - West Clareview | 10.7 | 20.24 | 89.0% | Volatile | Vuln-heavy |
| `635` | 635 — 635 — Mcnally - Silver Berry | 9.2 | 19.21 | 69.8% | Volatile | Vuln-heavy |
| `120X` | 120X — 120X — Eaux Claires - Government Centre | 11.0 | 17.21 | 85.6% | Volatile | Opp-heavy |
| `630` | 630 — 630 — Austin O'Brien - Silver Berry | 7.5 | 17.18 | 59.1% | Volatile | Vuln-heavy |
| `612` | 612 — 612 — O'Leary - Brintnell | 7.3 | 16.83 | 57.0% | Volatile | Vuln-heavy |
| `121` | 121 — Fraser - Evergreen | 9.2 | 15.20 | 86.3% | Volatile | Monop-heavy |
| `683` | 683 — 683 — Arch Macdonald - Ross Sheppard - Castle Downs | 5.9 | 13.97 | 59.1% | Volatile | Vuln-heavy |
| `119` | 119 — 119 — Eaux Claires - West Clareview | 5.8 | 12.20 | 83.3% | Volatile | Vuln-heavy |
| `107` | 107 — 107 — Belvedere - West Clareview | 5.2 | 11.34 | 84.2% | Volatile | Vuln-heavy |
| `007` | 007 — 007 — West Edmonton Mall - Downtown | 5.2 | 11.09 | 70.5% | Volatile | Opp-heavy |
| `912` | 912 — 912 — Lewis Farms - Jasper Place | 4.7 | 10.14 | 70.1% | Volatile | Temp-heavy |
| `647` | 647 — 647 — Elder Dr. Whiskeyjack - Laurel | 3.6 | 9.75 | 44.4% | Volatile | Vuln-heavy |
| `658` | 658 — 658 — Fr. M. Mccaffery - Rutherford | 3.6 | 9.62 | 45.3% | Volatile | Vuln-heavy |

### C. Bedrock Resilient Corridors, Top 15 Low-Priority Corridors
These corridors consistently score in the bottom 40 percent, representing Grades D and E, under almost all weight configurations, typically representing commuter expresses or low-dependency suburban feeders.

The details below list the Route ID, Name, Mean Score, Robustness, and DE Stability percentage:

| Route ID | Name | Mean Score | Robustness | DE Stability (%) |
| :--- | :--- | :---: | :---: | :---: |
| `420` | 420 — 420 — Bethel - Millennium Place | 0.1 | 0.08 | 96.4% |
| `432` | 432 — 432 — Bethel - Summerwood | 0.1 | 0.11 | 96.4% |
| `622` | 622 — 622 — Stadium - Concordia University | 0.1 | 0.11 | 96.1% |
| `A3` | A3 — A3 — Riverside | 0.1 | 0.10 | 96.4% |
| `F600` | 600 — 600 — Fort Saskatchewan | 0.1 | 0.11 | 96.4% |
| `651` | 651 — 651 — Avalon - Southgate | 0.1 | 0.12 | 92.6% |
| `442` | 442 — 442 — Bethel - Nottingham | 0.1 | 0.11 | 90.6% |
| `433` | 433 — 433 — Bethel - Clarkdale | 0.1 | 0.14 | 96.4% |
| `653` | 653 — 653 — Strathcona - Davies | 0.1 | 0.13 | 95.8% |
| `A24` | A24 — A24 — The Gardens | 0.1 | 0.16 | 96.3% |
| `A13` | A13 — A13 — Akinsdale - Campbell | 0.1 | 0.15 | 96.3% |
| `A12` | A12 — A12 — Campbell - Akinsdale | 0.1 | 0.15 | 96.3% |
| `A23` | A23 — A23 — Heritage Lakes - Riel | 0.1 | 0.17 | 96.3% |
| `642` | 642 — 642 — Lakewood - Mill Woods | 0.1 | 0.15 | 95.8% |
| `441` | 441 — 441 — Bethel - Ordze - Regency | 0.1 | 0.18 | 96.3% |

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
