# ROUTE EQUITY SCORECARD: 2-PILLAR WEIGHT SENSITIVITY ANALYSIS
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
To test the sensitivity of this two-pillar model, we ran a Monte Carlo simulation. We swept the weights of Vulnerability ($w_1$) and Opportunity Access ($w_4$) from 0% to 100% in 5% increments (yielding 21 unique weight combinations). Running this sweep across all 129 transit routes in Edmonton generated 2,709 analytical records.

### 1.2 Summary of Findings:
First, **Bedrock Essentials**: Out of 129 routes, 32 corridors representing 24.8 percent of the total are classified as Bedrock Essentials. These routes maintain an A or B Grade in 90 percent or more of all simulated policy configurations. Their Route Equity Score is consistently high regardless of whether opportunity or vulnerability of the area are emphasized.

Second, **Policy Swing Corridors**: There are 0 corridors representing 0.0 percent of the total classified as highly sensitive Policy Swing Corridors. These routes experience significant grade variations, such as swinging from Grade A to Grade D depending on the weight configuration, indicating that their prioritization depends heavily on the chosen policy weights.

Third, **Pillar Dominance**: Regression driver coefficients indicate that Opportunity Access and Vulnerability serve as the primary drivers of score variation.

---

## METHODOLOGY AND COMBINATORICS

### A. Combinatorial Compression
To compute every possible increment permutation where weights must sum to exactly 100 percent, the Stars and Bars combinatorics theorem was applied.

The number of combinations is calculated as follows:

$$\text{Combinations} = \binom{N+K-1}{K-1} = \binom{20+2-1}{2-1} = \binom{21}{1} = 21$$

In this calculation, $N$ equals 20, which represents steps of 5 percent. $K$ equals 2, which represents the two active equity pillars.
This reduces the search space significantly relative to a full 4-pillar grid search.

### B. Analytical Indices
- **Robustness Index ($R_r$):** This is the standard deviation of the route composite score across all 21 configurations. A lower robustness index value implies structural resilience to changes in policy weights.
- **No-Intercept Ordinary Least Squares Drivers:** For each corridor, a no-intercept ordinary least squares regression model was used:
  
  $$\text{CompositeScore}(r,c) = \beta_1 w_{1,c} + \beta_4 w_{4,c} + \epsilon$$
  
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
- **Bedrock Essentials:** 32 routes
- **Bedrock Resilient:** 9 routes
- **Policy Swing Corridors:** 0 routes
- **Moderate Stability:** 65 routes

*(Note: Visual representation coordinates and trends are detailed in Appendix A)*

### Figure 3C: Volatility vs. Mean Score (Policy Risk Map)
*(Note: Volatility mapping is outputted as part of the analysis backend exports)*

### Figure 3B: Grade Stability AB Distribution

### A. Bedrock Essentials, Top 15 Corridors
These corridors consistently score in the top 40 percent, representing Grades A and B, under nearly all policy weight configurations.

The details below list the Route ID, Name, Mean Score, Robustness, AB Stability percentage, and Primary Driver:

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | Primary Driver |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `002` | 002 — 002 — West Edmonton Mall - Stadium - Clareview | 99.0 | 0.40 | 100.0% | Opportunity |
| `005` | 005 — 005 — Westmount - Downtown - Coliseum | 99.0 | 0.40 | 100.0% | Opportunity |
| `008` | 008 — 008 — Abbottsfield - Downtown - University | 98.8 | 0.59 | 100.0% | Opportunity |
| `111` | 111 — 111 — Concordia - Westmount | 98.5 | 0.50 | 100.0% | Opportunity |
| `900X` | 900X — 900X — Lewis Farms - Downtown | 98.0 | 1.26 | 100.0% | Opportunity |
| `150X` | 150X — 150X — Dunluce - Castle Downs - Government Centre | 97.8 | 0.60 | 100.0% | Opportunity |
| `009` | 009 — 009 — Southgate - Eaux Claires | 97.7 | 1.67 | 100.0% | Opportunity |
| `004` | 004 — 004 — Lewis Farms - University - Capilano | 97.2 | 1.34 | 100.0% | Opportunity |
| `130X` | 130X — 130X — Baturyn - Eaux Claires - Government Centre | 97.2 | 1.24 | 100.0% | Opportunity |
| `021R` | Capital — Capital — Capital Line | 95.5 | 2.02 | 100.0% | Opportunity |
| `701` | 701 — 701 — Southgate - Kingsway | 94.8 | 5.06 | 100.0% | Opportunity |
| `071` | CapRep — CapRep — Capital Line Replacement Service | 94.1 | 5.52 | 100.0% | Opportunity |
| `056` | 056 — 056 — Meadows - Leger - West Edmonton Mall | 92.4 | 6.61 | 100.0% | Vulnerability |
| `052` | 052 — 052 — Northgate - West Edmonton Mall | 91.7 | 2.47 | 100.0% | Vulnerability |
| `901` | 901 — 901 — Jasper Place - Downtown | 91.3 | 7.11 | 100.0% | Opportunity |

### B. Highly Sensitive Policy Swing Corridors
No corridors met the strict criteria for highly volatile Policy Swing Corridors in this 2-pillar model, as no route swung by 3 or more grades (such as from A to D or B to E). The maximum grade variation across all 170 routes was limited to 2 grades. 

However, there is a group of **Moderate Swing Corridors** (classified under Moderate Stability) that exhibit the highest volatility in this two-pillar model. While they do not cross the extreme boundaries, their priority status remains sensitive to the balance between demographic vulnerability and job access:

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | DE Stability (%) | Primary Driver |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `109` | 109 — 109 — Northgate - Castle Downs - Hudson | 73.7 | 24.70 | 81.0% | 0.0% | Vulnerability |
| `500X` | 500X — 500X — Meadows - Macewan | 50.6 | 23.33 | 47.6% | 28.6% | Opportunity |
| `515` | 515 — 515 — Mill Woods - Meadows | 58.5 | 22.49 | 57.1% | 9.5% | Vulnerability |
| `124` | 124 — 124 — Westmount - Eaux Claires | 65.0 | 21.38 | 76.2% | 0.0% | Vulnerability |
| `717` | 717 — 717 — Leger - Century Park | 55.9 | 21.33 | 52.4% | 9.5% | Vulnerability |
| `523` | 523 — 523 — Mill Woods - Downtown | 81.7 | 19.46 | 85.7% | 0.0% | Opportunity |
| `508` | 508 — 508 — Meadows - Mill Woods | 45.3 | 17.67 | 33.3% | 28.6% | Vulnerability |
| `113` | 113 — 113 — West Clareview - Northgate | 46.1 | 17.50 | 33.3% | 23.8% | Vulnerability |
| `527` | 527 — 527 — Mill Woods - Millbourne | 41.7 | 17.11 | 23.8% | 28.6% | Vulnerability |
| `917` | 917 — 917 — West Edmonton Mall - Lewis Farms | 60.0 | 16.63 | 71.4% | 0.0% | Vulnerability |
| `211` | 211 — 211 — Downtown Edmonton Express | 51.4 | 16.00 | 47.6% | 14.3% | Opportunity |
| `106` | 106 — 106 — Dunvegan - Northgate - Belvedere | 47.5 | 15.97 | 38.1% | 0.0% | Vulnerability |
| `001` | 001 — 001 — Downtown - Capilano | 61.0 | 15.92 | 61.9% | 0.0% | Opportunity |
| `023R` | Valley — Valley — Valley Line | 63.7 | 15.46 | 66.7% | 0.0% | Opportunity |
| `511` | 511 — 511 — Mill Woods - Downtown | 71.2 | 15.21 | 76.2% | 0.0% | Opportunity |

### C. Bedrock Resilient Corridors, Top 15 Low-Priority Corridors
These corridors consistently score in the bottom 40 percent, representing Grades D and E, under almost all weight configurations, typically representing commuter expresses or low-dependency suburban feeders.

The details below list the Route ID, Name, Mean Score, Robustness, and DE Stability percentage:

| Route ID | Name | Mean Score | Robustness | DE Stability (%) |
| :--- | :--- | :---: | :---: | :---: |
| `922` | 922 — 922 — Lewis Farms - Rosenthal | 5.5 | 1.95 | 100.0% |
| `700X` | 700X — 700X — Century Park - Heritage Valley | 6.8 | 1.88 | 100.0% |
| `525` | 525 — 525 — Bonnie Doon - Ritchie | 7.5 | 3.34 | 100.0% |
| `589` | 589 — 589 — Edmonton Waste Management Centre - Coliseum | 7.5 | 1.23 | 100.0% |
| `919` | 919 — 919 — Lewis Farms - Secord | 7.6 | 1.32 | 100.0% |
| `524` | 524 — 524 — Bonnie Doon - Holyrood | 8.2 | 3.05 | 100.0% |
| `505` | 505 — 505 — Davies - Pylypow Industrial | 8.4 | 7.59 | 95.2% |
| `713` | 713 — 713 — Century Park - Twin Brooks | 8.4 | 1.43 | 100.0% |
| `702` | 702 — 702 — Southgate - South Campus | 9.2 | 2.74 | 100.0% |

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
