# Route Equity Scorecard: PhD-Level Research Report Brainstorm

## 1. Core Thesis & Objectives
The primary objective of this research is to move beyond descriptive transit equity (e.g., "where do poor people live?") toward prescriptive transit resilience (e.g., "which routes are structurally critical to vulnerable populations, and how sensitive is that criticality to shifting policy priorities?").

**Working Title:** 
*The Elasticity of Equity: Simulating Transit Network Resilience and Vulnerability through Dynamic Multi-Pillar Scoring.*

## 2. The Analytical Engine: Defending the Methodology
The report must rigorously defend the statistical normalization pipeline. 
- **The Problem of Pillar Dilution:** Why raw POI counts or simple ridership ratios fail when combined additively (they result in volumetric bias where density overshadows necessity).
- **The Solution:** Justifying the 95th percentile capping, Z-score normalization (Mean=50, SD=20), and the Sigmoid (S-Curve) transform. Explain how this isolates the "Essential Lifelines" (the statistical extremes) from the "Standard Coverage" (the compressed middle).

## 3. Investigating Dynamic Weighting Elasticity (High Priority)
A core component of the report will investigate **Policy Sensitivity**. When planners shift the weights (e.g., prioritizing *Off Peak Service* over *Vulnerability Density*), how elastic is the network? 

**Research Questions:**
- **System-Wide Synchronization:** How does a shift in policy weight ripples through the entire analytical suite? The report will document the real-time interaction between weights and the *Score Breakdown*, *Quadrant Chart*, and *Bell Curve*.
- **Quintile Migration:** When weights shift, do routes migrate smoothly across quintiles (e.g., A to B), or are there "cliff effects" where an 'A' route suddenly drops to a 'D'?
- **The Invulnerable Core:** Are there routes that remain Grade 'A' *regardless* of how the weights are distributed? These represent the absolute most critical infrastructure in the city.

## 4. Visualizing Spatial Vulnerability
The report will heavily feature the outputs of the planned **DA Vulnerability Heatmap**.
- **Expanded Vulnerability Dimensions:** Incorporate additional demographic groups, specifically **"New Immigrants"**, into the vulnerability density model to identify emerging transit needs.
- **Contextualizing Routes:** By mapping a route alongside the specific DA polygons it touches, we can analyze the "catchment inequality." For example, does a route serve high-vulnerability DAs on its northern leg but low-vulnerability DAs on its southern leg? 
- **The Dissemination Matrix:** Analyzing the dot-matrix heatmap to show how equity is distributed *along* a route, not just *by* the route.

## 5. Potential Chapters / Structure
1. **Introduction:** The limitations of current transit equity models (static buffers vs. network topology).
2. **Methodology:** The 4 Pillars, the Golden Record generation, and the Normalization Pipeline (Z-Scores & Sigmoids).
3. **Analysis I: The Baseline Network:** What the default 35/25/25/15 weighting tells us about the current Edmonton transit network.
4. **Analysis II: Policy Elasticity:** How extreme shifts in policy weighting alter the Quintile distribution. Identifying the "Invulnerable Core."
5. **Analysis III: Spatial Reality:** Case studies of specific Grade A "Essential Lifelines" and Grade E "Low-Impact" routes, visualized alongside their DA vulnerability heatmaps.
6. **Conclusion & Policy Recommendations:** How municipalities can use this model for decommissioning, rerouting, or expanding service without causing silent transit deserts.

## 6. Next Steps for the Model
To fully support this report, the tool must:
1. Dynamically re-sort and re-calculate the A-E Quintile cutoffs every time a slider is moved.
2. Load the DA boundary GeoJSON into Mapbox and link it to the selected route.
3. Allow for rapid isolation of Grade A/B/C/D/E routes to visually compare network states.
