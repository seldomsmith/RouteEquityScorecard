# ROUTE EQUITY SCORECARD: REI WEIGHT SENSITIVITY ANALYSIS
*A Monte Carlo Policy Simulation Meta-Analysis on Transit Equity Classifications*

---

## EXECUTIVE SUMMARY
The Route Equity Scorecard defines equity priority by weighting four operational and socio-demographic pillars. These pillars are Vulnerability (socio-economic demographics) at 15 percent, Off Peak Service at 40 percent, Service Monopoly at 10 percent, and Opportunity Access at 35 percent. We conducted this analysis because choosing one specific default set of weighting introduces a potential policy vulnerability or weakness, as the prioritization of specific weights will shift the scoring of different routes depending on the policy orientations and definitions of “equity”.

To evaluate how sensitive the route equity scoring is to weight changes, a weight sensitivity Monte Carlo simulation was performed. The evaluation simulated 1,771 valid zero-sum policy weight configurations in 5 percent increments across all 170 transit routes in Edmonton, generating 301,070 analytical records.

### 1.2 Summary of Findings:
First, **Bedrock Essentials**: Out of 170 routes, 43 corridors representing 25.3 percent of the total are classified as Bedrock Essentials. These routes maintain an A or B Grade in 90 percent or more of all simulated policy configurations. Their Route Equity Score is consistently high regardless of whether opportunity, off peak service, or vulnerability of the area, or monopoly service are emphasized.

Second, **Policy Swing Corridors**: There are 38 corridors representing 22.4 percent of the total classified as highly sensitive Policy Swing Corridors. These routes experience significant grade variations, such as swinging from Grade A to Grade D depending on the weight configuration, indicating that their prioritization depends heavily on the chosen policy weights.

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
- **Bedrock Essentials:** 43 routes
- **Bedrock Resilient:** 43 routes
- **Policy Swing Corridors:** 38 routes
- **Moderate Stability:** 46 routes

*(Note: Visual representation coordinates and trends are detailed in Appendix A)*

### Figure 3C: Volatility vs. Mean Score (Policy Risk Map)
*(Note: Volatility mapping is outputted as part of the analysis backend exports)*

### Figure 3B: Grade Stability AB Distribution

### A. Bedrock Essentials, Top 15 Corridors
These corridors consistently score in the top 40 percent, representing Grades A and B, under nearly all policy weight configurations.

The details below list the Route ID, Name, Mean Score, Robustness, AB Stability percentage, and Primary Driver:

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | Primary Driver |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `008` | 008 — 008 — Abbottsfield - Downtown - University | 99.3 | 0.33 | 100.0% | Monopoly |
| `002` | 002 — 002 — West Edmonton Mall - Stadium - Clareview | 99.3 | 0.41 | 100.0% | Monopoly |
| `103` | 103 — 103 — Eaux Claires - Castle Downs - Kingsway | 99.1 | 0.35 | 100.0% | Monopoly |
| `009` | 009 — 009 — Southgate - Eaux Claires | 98.8 | 1.09 | 100.0% | Monopoly |
| `005` | 005 — 005 — Westmount - Downtown - Coliseum | 98.6 | 1.72 | 100.0% | Monopoly |
| `021R` | Capital — Capital — Capital Line | 98.4 | 1.60 | 100.0% | Monopoly |
| `056` | 056 — 056 — Meadows - Leger - West Edmonton Mall | 98.0 | 3.17 | 99.9% | Monopoly |
| `052` | 052 — 052 — Northgate - West Edmonton Mall | 97.3 | 2.91 | 100.0% | Monopoly |
| `053` | 053 — 053 — West Clareview - Mill Woods | 96.3 | 2.04 | 100.0% | Monopoly |
| `109` | 109 — 109 — Northgate - Castle Downs - Hudson | 95.7 | 3.12 | 100.0% | Vulnerability |
| `124` | 124 — 124 — Westmount - Eaux Claires | 94.4 | 2.65 | 100.0% | Monopoly |
| `900X` | 900X — 900X — Lewis Farms - Downtown | 93.7 | 10.40 | 95.3% | Opportunity |
| `055` | 055 — 055 — Meadows - Southgate - West Edmonton Mall | 93.0 | 3.37 | 100.0% | Monopoly |
| `519` | 519 — 519 — Mill Woods - Century Park | 92.6 | 4.22 | 100.0% | Vulnerability |
| `114` | 114 — 114 — West Clareview - Coliseum | 92.4 | 8.44 | 96.4% | Monopoly |

### B. Highly Sensitive Policy Swing Corridors, Top 15 Corridors
These corridors are sensitive to weight adjustments. Depending on the weight configuration, they may receive either high or low priority rankings.

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | Grade Swing | Best Weight Mix |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `L10` | 10 — 10 — Leduc - Nisku - Eia | 29.5 | 24.51 | 12.6% | Volatile | Temp-heavy |
| `120X` | 120X — 120X — Eaux Claires - Government Centre | 66.2 | 24.49 | 66.2% | Volatile | Opp-heavy |
| `912` | 912 — 912 — Lewis Farms - Jasper Place | 36.8 | 24.03 | 17.8% | Volatile | Temp-heavy |
| `130X` | 130X — 130X — Baturyn - Eaux Claires - Government Centre | 75.6 | 23.77 | 76.3% | Volatile | Opp-heavy |
| `589` | 589 — 589 — Edmonton Waste Management Centre - Coliseum | 40.2 | 23.56 | 21.1% | Volatile | Temp-heavy |
| `006` | 006 — 006 — Davies - Southgate | 44.0 | 23.46 | 27.3% | Volatile | Temp-heavy |
| `747` | 747 — 747 — Century Park - Edmonton International Airport | 45.2 | 22.84 | 28.0% | Volatile | Temp-heavy |
| `926` | 926 — 926 — Lewis Farms - Stillwater | 43.5 | 22.19 | 24.2% | Volatile | Temp-heavy |
| `111` | 111 — 111 — Concordia - Westmount | 79.5 | 21.84 | 81.6% | Volatile | Opp-heavy |
| `923` | 923 — 923 — West Edmonton Mall - Oleskiw | 51.5 | 21.66 | 40.1% | Volatile | Temp-heavy |
| `704` | 704 — 704 — Southgate - Southpark | 49.3 | 21.62 | 35.2% | Volatile | Temp-heavy |
| `150X` | 150X — 150X — Dunluce - Castle Downs - Government Centre | 79.1 | 20.98 | 82.0% | Volatile | Opp-heavy |
| `208` | 208 — 208 — Government Centre Express | 41.7 | 20.89 | 32.3% | Volatile | Opp-heavy |
| `A14` | A14 — A14 — Sturgeon Hospital - St Albert North | 25.3 | 20.77 | 6.4% | Volatile | Temp-heavy |
| `511` | 511 — 511 — Mill Woods - Downtown | 44.8 | 20.42 | 37.7% | Volatile | Opp-heavy |

### C. Bedrock Resilient Corridors, Top 15 Low-Priority Corridors
These corridors consistently score in the bottom 40 percent, representing Grades D and E, under almost all weight configurations, typically representing commuter expresses or low-dependency suburban feeders.

The details below list the Route ID, Name, Mean Score, Robustness, and DE Stability percentage:

| Route ID | Name | Mean Score | Robustness | DE Stability (%) |
| :--- | :--- | :---: | :---: | :---: |
| `420` | 420 — 420 — Bethel - Millennium Place | 4.5 | 1.03 | 100.0% |
| `A3` | A3 — A3 — Riverside | 5.5 | 0.87 | 100.0% |
| `A13` | A13 — A13 — Akinsdale - Campbell | 6.6 | 0.95 | 100.0% |
| `A12` | A12 — A12 — Campbell - Akinsdale | 6.7 | 0.97 | 100.0% |
| `A22` | A22 — A22 — Riel - Heritage Lakes | 7.4 | 1.30 | 100.0% |
| `442` | 442 — 442 — Bethel - Nottingham | 7.5 | 2.40 | 100.0% |
| `A23` | A23 — A23 — Heritage Lakes - Riel | 7.5 | 1.38 | 100.0% |
| `432` | 432 — 432 — Bethel - Summerwood | 7.6 | 2.42 | 100.0% |
| `450` | 450 — 450 — Bethel - Centre In The Park | 7.8 | 2.39 | 100.0% |
| `A24` | A24 — A24 — The Gardens | 8.2 | 1.50 | 100.0% |
| `A7` | A7 — A7 — Sturgeon Hospital - Erin Ridge - Oakmont | 8.5 | 1.55 | 100.0% |
| `205` | 205 — 205 — West Edmonton | 8.6 | 1.52 | 100.0% |
| `503` | 503 — 503 — Davies - Millbourne - Woodvale | 8.6 | 2.00 | 100.0% |
| `433` | 433 — 433 — Bethel - Clarkdale | 8.6 | 2.48 | 100.0% |
| `A21` | A21 — A21 — Heritage Lakes - Riel | 8.7 | 1.74 | 100.0% |

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
