# Route Equity Scorecard — Weight Sensitivity & Robustness Analysis
*A Monte Carlo Policy Simulation Meta-Analysis on Transit Equity Classifications*

---

## 🎯 Executive Summary
The Route Equity Scorecard defines equity priority by weighting four distinct operational and socio-demographic pillars: Vulnerability ($15\%$), Off Peak Service ($40\%$), Monopoly ($10\%$), and Opportunity Access ($35\%$). However, selecting static weights poses a core policy vulnerability: *does the prioritization of transit lifelines change under differing philosophical definitions of equity?*

To isolate policy bias from structural necessity, we executed a global weight sensitivity Monte Carlo analysis. We simulated **1,771 valid zero-sum policy weight configurations** (in 5% increments) across all **235 routes in Edmonton**, generating **416,185 analytical records**. 

### Key Discoveries:
1. **The Bedrock Lifelines exist:** Out of 235 routes, **43 corridors (18.3%) are Bedrock Essentials**. They maintain an A or B Grade in $\ge 90\%$ of all simulated policy configurations. Regardless of whether opportunity, off peak service, or census demographics are heavily prioritized, these corridors are structurally and socially essential lifelines.
2. **Policy Swings are restricted:** Only **104 corridors (44.3%) are highly sensitive Policy Swing Corridors**. These routes swing wildly (e.g. from Grade A under a pure Off Peak Service mix to Grade D under an Opportunity mix), meaning their funding or optimization is dependent on political and administrative weight selections.
3. **Pillar Dominance:** Regression driver coefficients show that **Opportunity Access** and **Off Peak Service** act as the primary engines of score dispersion, while **Monopoly** exerts a highly localized, corridor-specific influence.

---

## 📖 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [Methodology & Combinatorics](#-methodology--combinatorics)
3. [Corridor Stability Profiles](#-corridor-stability-profiles)
4. [Statistical Drivers of Score Volatility](#-statistical-drivers-of-score-volatility)
5. [Top Corridor Sensitivity Matrices](#-top-corridor-sensitivity-matrices)
6. [Policy Conclusions & Strategic Actions](#-policy-conclusions--strategic-actions)

---

## 🔬 Methodology & Combinatorics

### 1. Combinatorial Compression (Stars and Bars Theorem)
To compute every possible increment permutation where weights must sum to exactly $100\%$ ($w_1 + w_2 + w_3 + w_4 = 1.0$), we apply the **Stars and Bars** combinatorics theorem:
$$\text{Combinations} = \binom{N + K - 1}{K - 1} = \binom{20 + 4 - 1}{4 - 1} = \binom{23}{3} = 1,771$$
Where:
* $N = 20$ represents steps of $5\%$ ($100\% / 5\% = 20$ discrete increments).
* $K = 4$ represents our four equity pillars.

This reduces the search space by **99.1%** relative to a simple grid search ($21^4 = 194,481$), rendering the simulation highly performant.

### 2. Analytical Indices
* **Robustness Index ($R_r$):** The standard deviation of the route's composite score across all 1,771 configurations. A lower $R_r$ implies structural resilience to policy bias.
* **No-Intercept Ordinary Least Squares (OLS) Drivers:**
  For each corridor, we fit the following no-intercept OLS model:
  $$\text{CompositeScore}_{r, c} = \beta_1 w_{1, c} + \beta_2 w_{2, c} + \beta_3 w_{3, c} + \beta_4 w_{4, c} + \epsilon$$
  Since weights sum to 1.0, the coefficients $\beta_p$ correspond exactly to the expected score of the route under a **100% pure weight** on pillar $p$, serving as direct driver indicators.

* **Stability Classifications:**
  * **Bedrock Essential:** Grade A or B in $\ge 90\%$ of combinations.
  * **Bedrock Resilient:** Grade D or E in $\ge 90\%$ of combinations.
  * **Policy Swing Corridor:** Grade spread $\ge 3$ grades (e.g. from B to E) across runs.
  * **Moderate Stability:** Corridors that do not swing severely but are not consistently in the extreme quintiles.

---

## 📊 Corridor Stability Profiles

Edmonton's transit corridors are classified as follows:
* **Bedrock Essentials:** `43 routes`
* **Bedrock Resilient:** `50 routes`
* **Policy Swing Corridors:** `104 routes`
* **Moderate Stability:** `38 routes`

### 1. Bedrock Essentials (Top 15 Corridors)
These corridors are absolute transit lifelines. They consistently score in the top 40% (Grades A & B) under almost every policy weight mix:

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | Primary Driver |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `002` | 002 — 002 — West Edmonton Mall - Stadium - Clareview | 99.7 | 0.26 | 100.0% | Monopoly |
| `005` | 005 — 005 — Westmount - Downtown - Coliseum | 99.2 | 1.03 | 100.0% | Opportunity |
| `103` | 103 — 103 — Eaux Claires - Castle Downs - Kingsway | 98.3 | 3.11 | 100.0% | Monopoly |
| `054` | 054 — 054 — West Edmonton Mall - West Clareview | 97.4 | 3.55 | 100.0% | Monopoly |
| `009` | 009 — 009 — Southgate - Eaux Claires | 97.3 | 3.90 | 100.0% | Opportunity |
| `008` | 008 — 008 — Abbottsfield - Downtown - University | 94.9 | 10.59 | 100.0% | Opportunity |
| `715` | 715 — 715 — Leger - Century Park | 93.9 | 11.42 | 98.9% | Monopoly |
| `102` | 102 — 102 — Kingsway - Coliseum - Abbottsfield | 92.8 | 7.34 | 100.0% | Monopoly |
| `914` | 914 — 914 — West Edmonton Mall - Jasper Place | 92.6 | 3.54 | 100.0% | Off Peak Service |
| `902` | 902 — 902 — Nait - University | 92.5 | 2.27 | 100.0% | Opportunity |
| `021R` | Capital — Capital — Capital Line | 92.2 | 12.31 | 99.8% | Opportunity |
| `113` | 113 — 113 — West Clareview - Northgate | 92.0 | 10.64 | 99.6% | Monopoly |
| `055` | 055 — 055 — Meadows - Southgate - West Edmonton Mall | 91.7 | 5.54 | 100.0% | Off Peak Service |
| `053` | 053 — 053 — West Clareview - Mill Woods | 91.7 | 5.25 | 100.0% | Off Peak Service |
| `519` | 519 — 519 — Mill Woods - Century Park | 91.3 | 7.85 | 100.0% | Vulnerability |

### 2. Highly Sensitive Policy Swing Corridors (Top 15 Corridors)
These corridors are volatile and highly dependent on the administrative weights. Under some weight combinations, they represent critical equity priority; under others, they receive low funding priority:

| Route ID | Name | Mean Score | Robustness ($R_r$) | AB Stability (%) | Grade Swing | Best Weight Mix |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `451` | 451 — 451 — Bethel - Ordze - Woodbridge | 47.3 | 31.30 | 38.6% | Volatile | Monop-heavy |
| `443` | 443 — 443 — Bethel - Ordze - Glen Allan | 48.2 | 31.08 | 39.2% | Volatile | Monop-heavy |
| `F610` | 610 — 610 — Westpark | 40.8 | 30.66 | 32.2% | Volatile | Monop-heavy |
| `A6` | A6 — A6 — Deer Ridge - North Ridge | 50.0 | 30.65 | 42.6% | Volatile | Monop-heavy |
| `205` | 205 — 205 — West Edmonton | 45.1 | 29.33 | 38.0% | Volatile | Opp-heavy |
| `L10` | 10 — 10 — Leduc - Nisku - Eia | 38.1 | 29.06 | 30.3% | Volatile | Off Peak-heavy |
| `612` | 612 — 612 — O'Leary - Brintnell | 49.9 | 28.12 | 43.8% | Volatile | Vuln-heavy |
| `007` | 007 — 007 — West Edmonton Mall - Downtown | 67.7 | 28.09 | 71.1% | Volatile | Opp-heavy |
| `589` | 589 — 589 — Edmonton Waste Management Centre - Coliseum | 44.7 | 27.77 | 36.9% | Volatile | Off Peak-heavy |
| `630` | 630 — 630 — Austin O'Brien - Silver Berry | 49.8 | 27.58 | 43.8% | Volatile | Vuln-heavy |
| `L1` | 1 — 1 — Leduc - Nisku - Edmonton | 52.5 | 27.15 | 44.5% | Volatile | Monop-heavy |
| `665` | 665 — 665 — Charlesworth - Dr. Anne Anderson | 53.5 | 27.14 | 49.7% | Volatile | Vuln-heavy |
| `747` | 747 — 747 — Century Park - Edmonton International Airport | 48.8 | 26.81 | 41.6% | Volatile | Off Peak-heavy |
| `F611` | 611 — 611 — Downtown | 34.8 | 26.73 | 25.5% | Volatile | Monop-heavy |
| `006` | 006 — 006 — Davies - Southgate | 65.3 | 26.61 | 70.0% | Volatile | Off Peak-heavy |

### 3. Bedrock Resilient (Top 15 Low-Priority Corridors)
These corridors consistently score in the bottom 40% (Grades D & E) under almost all weight definitions, typically representing commuter expresses or affluent low-dependency suburban feeders:

| Route ID | Name | Mean Score | Robustness ($R_r$) | DE Stability (%) |
| :--- | :--- | :---: | :---: | :---: |
| `420` | 420 — 420 — Bethel - Millennium Place | 7.3 | 3.80 | 98.8% |
| `A3` | A3 — A3 — Riverside | 8.2 | 3.40 | 98.8% |
| `432` | 432 — 432 — Bethel - Summerwood | 8.5 | 3.26 | 98.8% |
| `F600` | 600 — 600 — Fort Saskatchewan | 8.6 | 3.21 | 98.8% |
| `622` | 622 — 622 — Stadium - Concordia University | 8.7 | 3.57 | 98.8% |
| `433` | 433 — 433 — Bethel - Clarkdale | 9.3 | 2.90 | 98.8% |
| `A13` | A13 — A13 — Akinsdale - Campbell | 9.6 | 2.80 | 98.8% |
| `653` | 653 — 653 — Strathcona - Davies | 9.6 | 4.20 | 98.8% |
| `A12` | A12 — A12 — Campbell - Akinsdale | 9.6 | 2.78 | 98.8% |
| `441` | 441 — 441 — Bethel - Ordze - Regency | 10.2 | 2.59 | 98.8% |
| `A24` | A24 — A24 — The Gardens | 10.2 | 2.57 | 98.8% |
| `A7` | A7 — A7 — Sturgeon Hospital - Erin Ridge - Oakmont | 10.3 | 2.56 | 98.8% |
| `A22` | A22 — A22 — Riel - Heritage Lakes | 10.3 | 2.55 | 98.8% |
| `A23` | A23 — A23 — Heritage Lakes - Riel | 10.4 | 2.51 | 98.8% |
| `655` | 655 — 655 — Strathcona - South Campus | 10.6 | 2.90 | 98.8% |

---

## 📈 Statistical Drivers of Score Volatility

For each route, the sensitivity of the composite score to changes in weight can be mapped to its underlying pillar values. The standardized OLS driver coefficients explain this transition:

* **Opportunity-Driven Corridors:** Routes with large opportunity drivers represent radial express corridors serving high-employment zones. These corridors benefit from an Opportunity-heavy mix.
* **Off Peak Service-Driven Corridors:** Routes with high off-peak coefficients are local routes with high late-night and weekend service requirements. They dominate when Off Peak Service is prioritized.
* **Vulnerability-Driven Corridors:** Corridors directly serving areas with dense demographic indices (lone parents, low-income households, seniors, recent immigrants). They stand out when Vulnerability weight is set high.

---

## 🏁 Policy Conclusions & Strategic Actions

### 1. Hard-Code "Bedrock Essentials" into Capital Planning
Because **Bedrock Essentials** are structurally critical under any definition of transit equity, their funding and prioritization should be insulated from political shifts in weights. They represent absolute system lifelines.

### 2. Standardize "Strategic Defaults" to Limit Volatility
The current strategic defaults—**Vulnerability (15%), Off Peak Service (40%), Monopoly (10%), and Opportunity (35%)**—sit at a balanced junction. This baseline prevents any single pillar from skewing the results, stabilizing the scores of the Policy Swing Corridors.

### 3. Deploy "Draft Mode" Simulations for Swing Corridors
For the Policy Swing Corridors, any service adjustments or routing edits must undergo rigorous sensitivity modeling. If a small change in weight drops a swing route's grade from B to D, planners must carefully evaluate whether the route is serving a specialized local transit monopoly or standard commuter needs.
