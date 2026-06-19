# ROUTE EQUITY SCORECARD: REI WEIGHT SENSITIVITY ANALYSIS
*A Monte Carlo Policy Simulation Meta-Analysis on Transit Equity Classifications*

---

## EXECUTIVE SUMMARY
The Route Equity Scorecard defines equity priority by weighting four operational and socio-demographic pillars. These pillars are Vulnerability (socio-economic demographics) at 15 percent, Off Peak Service at 40 percent, Service Monopoly at 10 percent, and Opportunity Access at 35 percent. We conducted this analysis because choosing one specific default set of weighting introduces a potential policy vulnerability or weakness, as the prioritization of specific weights will shift the scoring of different routes depending on the policy orientations and definitions of “equity”.

To evaluate how sensitive the route equity scoring is to weight changes, a weight sensitivity Monte Carlo simulation was performed. The evaluation simulated 1,771 valid zero-sum policy weight configurations in 5 percent increments across all 170 transit routes in Edmonton, generating 301,070 analytical records.

### 1.2 Summary of Findings:
First, **Bedrock Essentials**: Out of 170 routes, 26 corridors representing 15.3 percent of the total are classified as Bedrock Essentials. These routes maintain an A or B Grade in 90 percent or more of all simulated policy configurations. Their Route Equity Score is consistently high regardless of whether opportunity, off peak service, or vulnerability of the area, or monopoly service are emphasized.

Second, **Policy Swing Corridors**: There are 104 corridors representing 61.2 percent of the total classified as highly sensitive Policy Swing Corridors. These routes experience significant grade variations, such as swinging from Grade A to Grade D depending on the weight configuration, indicating that their prioritization depends heavily on the chosen policy weights.

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
- **Bedrock Essentials:** 26 routes
- **Bedrock Resilient:** 22 routes
- **Policy Swing Corridors:** 104 routes
- **Moderate Stability:** 18 routes

*(Note: Visual representation coordinates and trends are detailed in Appendix A)*

### Figure 3C: Volatility vs. Mean Score (Policy Risk Map)
*(Note: Volatility mapping is outputted as part of the analysis backend exports)*

### Figure 3B: Grade Stability AB Distribution

### A. Bedrock Essentials, Top 15 Corridors
These corridors consistently score in the top 40 percent, representing Grades A and B, under nearly all policy weight configurations.

The details below list the Route ID, Name, Mean Score, Robustness, AB Stability percentage, and Primary Driver:

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | Primary Driver |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `002` | 002 — 002 — West Edmonton Mall - Stadium - Clareview | 99.6 | 0.52 | 100.0% | Monopoly |
| `005` | 005 — 005 — Westmount - Downtown - Coliseum | 98.3 | 2.30 | 100.0% | Opportunity |
| `103` | 103 — 103 — Eaux Claires - Castle Downs - Kingsway | 97.8 | 4.43 | 100.0% | Monopoly |
| `009` | 009 — 009 — Southgate - Eaux Claires | 95.2 | 6.59 | 100.0% | Opportunity |
| `008` | 008 — 008 — Abbottsfield - Downtown - University | 94.1 | 11.57 | 99.9% | Opportunity |
| `054` | 054 — 054 — West Edmonton Mall - West Clareview | 93.3 | 6.82 | 98.9% | Opportunity |
| `715` | 715 — 715 — Leger - Century Park | 92.9 | 12.83 | 97.7% | Monopoly |
| `021R` | Capital — Capital — Capital Line | 88.8 | 14.28 | 98.4% | Opportunity |
| `102` | 102 — 102 — Kingsway - Coliseum - Abbottsfield | 87.5 | 11.65 | 100.0% | Monopoly |
| `113` | 113 — 113 — West Clareview - Northgate | 86.9 | 13.78 | 97.2% | Monopoly |
| `527` | 527 — 527 — Mill Woods - Millbourne | 86.5 | 14.86 | 95.2% | Monopoly |
| `519` | 519 — 519 — Mill Woods - Century Park | 86.5 | 12.06 | 99.6% | Vulnerability |
| `901` | 901 — 901 — Jasper Place - Downtown | 84.7 | 16.30 | 96.9% | Opportunity |
| `055` | 055 — 055 — Meadows - Southgate - West Edmonton Mall | 84.7 | 8.29 | 100.0% | Temporal |
| `717` | 717 — 717 — Leger - Century Park | 84.4 | 15.39 | 90.4% | Vulnerability |

### B. Highly Sensitive Policy Swing Corridors, Top 15 Corridors
These corridors are sensitive to weight adjustments. Depending on the weight configuration, they may receive either high or low priority rankings.

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | Grade Swing | Best Weight Mix |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `451` | 451 — 451 — Bethel - Ordze - Woodbridge | 43.2 | 32.50 | 35.1% | Volatile | Monop-heavy |
| `A6` | A6 — A6 — Deer Ridge - North Ridge | 45.6 | 32.10 | 37.0% | Volatile | Monop-heavy |
| `443` | 443 — 443 — Bethel - Ordze - Glen Allan | 41.2 | 31.26 | 31.4% | Volatile | Monop-heavy |
| `L10` | 10 — 10 — Leduc - Nisku - Eia | 37.2 | 29.14 | 25.2% | Volatile | Temp-heavy |
| `589` | 589 — 589 — Edmonton Waste Management Centre - Coliseum | 43.2 | 28.15 | 31.7% | Volatile | Temp-heavy |
| `007` | 007 — 007 — West Edmonton Mall - Downtown | 61.2 | 27.81 | 56.2% | Volatile | Opp-heavy |
| `120X` | 120X — 120X — Eaux Claires - Government Centre | 66.8 | 27.52 | 65.6% | Volatile | Opp-heavy |
| `150X` | 150X — 150X — Dunluce - Castle Downs - Government Centre | 69.2 | 27.23 | 68.3% | Volatile | Opp-heavy |
| `111` | 111 — 111 — Concordia - Westmount | 72.7 | 27.12 | 72.5% | Volatile | Opp-heavy |
| `747` | 747 — 747 — Century Park - Edmonton International Airport | 47.7 | 27.08 | 37.5% | Volatile | Temp-heavy |
| `130X` | 130X — 130X — Baturyn - Eaux Claires - Government Centre | 73.0 | 27.07 | 73.4% | Volatile | Opp-heavy |
| `205` | 205 — 205 — West Edmonton | 36.6 | 27.00 | 25.7% | Volatile | Opp-heavy |
| `912` | 912 — 912 — Lewis Farms - Jasper Place | 54.5 | 26.60 | 49.3% | Volatile | Temp-heavy |
| `006` | 006 — 006 — Davies - Southgate | 62.7 | 26.11 | 63.3% | Volatile | Temp-heavy |
| `706` | 706 — 706 — Leger - Southgate | 54.2 | 25.33 | 47.4% | Volatile | Temp-heavy |

### C. Bedrock Resilient Corridors, Top 15 Low-Priority Corridors
These corridors consistently score in the bottom 40 percent, representing Grades D and E, under almost all weight configurations, typically representing commuter expresses or low-dependency suburban feeders.

The details below list the Route ID, Name, Mean Score, Robustness, and DE Stability percentage:

| Route ID | Name | Mean Score | Robustness | DE Stability (%) |
| :--- | :--- | :---: | :---: | :---: |
| `420` | 420 — 420 — Bethel - Millennium Place | 5.8 | 2.65 | 99.9% |
| `A3` | A3 — A3 — Riverside | 6.5 | 2.46 | 99.9% |
| `432` | 432 — 432 — Bethel - Summerwood | 6.6 | 2.41 | 99.9% |
| `433` | 433 — 433 — Bethel - Clarkdale | 7.2 | 2.30 | 99.9% |
| `A13` | A13 — A13 — Akinsdale - Campbell | 7.4 | 2.28 | 99.9% |
| `A12` | A12 — A12 — Campbell - Akinsdale | 7.4 | 2.28 | 99.9% |
| `A24` | A24 — A24 — The Gardens | 7.6 | 2.27 | 99.9% |
| `A22` | A22 — A22 — Riel - Heritage Lakes | 7.8 | 2.28 | 99.9% |
| `A23` | A23 — A23 — Heritage Lakes - Riel | 7.8 | 2.28 | 99.9% |
| `441` | 441 — 441 — Bethel - Ordze - Regency | 8.0 | 2.29 | 99.9% |
| `A7` | A7 — A7 — Sturgeon Hospital - Erin Ridge - Oakmont | 8.0 | 2.30 | 99.9% |
| `A21` | A21 — A21 — Heritage Lakes - Riel | 8.2 | 2.33 | 99.9% |
| `525` | 525 — 525 — Bonnie Doon - Ritchie | 8.7 | 2.98 | 99.9% |
| `A31` | A31 — A31 — Heritage Lakes - The Gardens | 8.7 | 2.44 | 99.9% |
| `A8` | A8 — A8 — Oakmont - Erin Ridge - Sturgeon Hospital | 8.9 | 2.55 | 99.9% |

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
