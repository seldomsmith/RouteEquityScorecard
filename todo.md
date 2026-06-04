# Active Todo & Review Dashboard

## Active Goal
Refining analytical modeling, service impact simulations, and advanced research reporting.

## Sprint Backlog
### Phase 3.5: Elite UI/UX Polish & Explainer Upgrades
1. **SHAP Waterfall Micro-Animations** [LOW]
   - Integrate Framer Motion spring physics to animate the SHAP waterfall bar adjustments fluidly when weights are dragged.
2. **Stability Focus Component Shift** [HIGH]
   - When switching the segmented control to Stability Focus, swap the Population-Equity Quadrant chart for a dedicated "Route Stability Class Distribution" component (visualizing Bedrock Essential/Resilient, Policy Swing, and Moderate count distributions).
3. **2-Pillar Sensitivity Integration** [CRITICAL]
   - If Off-Peak and Monopoly pillars are disabled/deselected in the policy weight menu, dynamically switch the meta-resiliency stability classifications from the standard 4-pillar simulation dataset to the 2-pillar simulation dataset.

### Phase 4.5: Simulation & Data Pipeline
2. **Service Impact Simulation (Draft Mode)** [HIGH]
   - Design dynamic "what-if" corridor removals/additions and re-score the network's equity live in-memory.
3. **Data Pipeline Optimization & Backend Integration** [MEDIUM]
   - Formulate integration steps for PostGIS/Python or R5 routing configurations.
4. **Policy Sensitivity Explorer UI Tab** [FUTURE]
   - Develop an interactive frontend workspace where users can visualize the Monte Carlo simplex terrain and click on routes to see their OLS driver sensitivity trends.

### Phase 5: PhD-Level Research Reporting
5. **Draft Route Equity Research Report** [HIGH]
   - Author a comprehensive, high-fidelity report detailing transit equity scores, demographic correlations, and policy recommendations.

---

## Review & Completed Work
### Completed:
- **Meta Resiliency Map Layer Toggle (Phase 16)**:
  - Added filter mode states (`mapFilterMode`, `selectedStabilityClasses`) and actions to Zustand state store.
  - Implemented Segmented Toggle Control (Grade Focus vs. Stability Focus) in Sidebar.
  - Implemented dynamic Stability Isolator checkboxes in Sidebar with active route counts.
  - Updated Map route line color expressions and tooltips to dynamically swap based on active filter mode (Color-coded by Grade or Stability Class).
  - Implemented reactive Map legend that switches dynamically between Grade colors and Stability colors (Purple, Green, Amber, Gray).
- **Functional Monopoly Implementation (Phase 15)**:
  - Developed `scripts/build_destination_catchments.py` to project route stops and POIs to UTM Zone 12N coordinates, constructing destination catchments using a fast scipy `KDTree` within 400m.
  - Developed `scripts/calculate_functional_monopoly.py` to calculate the Functional Redundancy ratio ($FR_{i,r}$) of route-DA pairs, flagging functional monopolies where destination overlap with alternative routes is $<20\%$.
  - Integrated the calculations into `scripts/update_vulnerability_index.py` and `scripts/refine_scoring.py` pipelines, updating raw and Z-score normalized monopoly scores.
  - Re-run all sensitivity analysis Monte Carlo simulations and updated CSV/parquet datasets, modifying `docs/SENSITIVITY_ANALYSIS_REPORT_2_PILLAR.md` and `docs/sensitivity_scores_2_pillar.csv` to match.
- **Destination-Overlap Monopoly Planning (Phase 14)**:
  - Formulated the exact mathematical equations and logic to calculate Functional Redundancy ($FR_{i,r}$) by intersecting route-level destination catchments.
  - Documented a 3-stage data pipeline structure in the brain implementation plan for future integration into the scoreboard backend.
- **2-Pillar Policy Report Drafting (Phase 13)**:
  - Authored a comprehensive and professional 2-pillar sensitivity meta-analysis at `docs/SENSITIVITY_ANALYSIS_REPORT_2_PILLAR.md` styled in an accessible first-year university tone.
  - Excluded operational service features (Monopoly and Off-Peak) to isolate pure human demographic vs. employment access priorities.
  - Inserted clear chart placeholders, outlined key structural drivers, and detailed recommendations for planning figures.
  - Compiled and structured the **Moderate Swing Corridors** table (15 most volatile routes in the Moderate Stability group) to illustrate route sensitivity to weight shifts.
- **2-Pillar Sensitivity Sweep (Phase 12)**:
  - Developed and ran `scripts/run_two_pillar_sensitivity_analysis.py` to simulate all 21 zero-sum combinations of Vulnerability and Opportunity Access.
  - Authored a dedicated report at `docs/SENSITIVITY_ANALYSIS_REPORT_2_PILLAR.md` and exported the formatted spreadsheet at `docs/sensitivity_scores_2_pillar.csv` for all 170 routes.
- **Sensitivity Spreadsheet Generation (Phase 11)**:
  - Formulated a pandas extraction script to parse `public/data/sensitivity_summary.csv`.
  - Generated the formatted spreadsheet `docs/sensitivity_scores.csv` containing Route ID, Name, Mean Score, Robustness, AB/DE Stability, and Primary Driver columns for all 170 routes.
- **Sensitivity Analysis Recalculation (Phase 10)**:
  - Dynamicized route count and output metrics inside `scripts/run_sensitivity_analysis.py`.
  - Recalculated the Monte Carlo weight sensitivity meta-analysis using the updated 170-route database (post-school route exclusion).
  - Regenerated `public/data/sensitivity_summary.csv` and `public/data/sensitivity_matrix.parquet` with the updated 301,070 simulated data points.
  - Replaced `docs/SENSITIVITY_ANALYSIS_REPORT.md` with updated stats, showing 36 Bedrock Essentials (21.2%) and 63 Policy Swing Corridors (37.1%).
- **Policy Weight Toggles & School Route Exclusion (Phase 9)**:
  - Excluded school special routes (6xx range) from the dataset, decreasing overall route count from 236 to 170.
  - Re-run spatial calculations and re-standardized scoring pipelines to build fresh `.json` and `.parquet` databases.
  - Implemented `disabledWeights` support and `toggleWeightEnabled` action in the Zustand store.
  - Added checkboxes to the sidebar next to each weight parameter allowing them to be fully toggled on/off.
  - Programmed sliders to dynamically auto-adjust and lock to 0% when disabled, redistributing remaining weight percentages proportionally.
- **SHAP Waterfall Layout & Scaling Polish (Phase 7)**:
  - Replaced the dynamic sizing range with a strictly locked scale from `0` to `100` (`minVal = 0`, `maxVal = 100`, `range = 100`) for absolute, consistent cross-route comparison.
  - Added top X-axis grid headers at `0`, `50` (Baseline), and `100`, along with vertical dashed grid lines running all the way down past the `RAW` and shifted `FINAL` score rows.
  - Shifted the `FINAL` composite score row lower to `y = (shap.length + 2.3) * ROW_HEIGHT` to create clean visual whitespace, and added a neat horizontal dotted divider line separating it from the `RAW` composite row.
  - Adjusted the `<svg>` canvas height to prevent any clipping of the shifted row or explanatory footnotes.
- **Dynamic Route/Heatmap Grade Coloring (Phase 6)**:
  - Updated the Map highlight boundary path to dynamically color-match the selected route's current grade (A: Emerald, B: Blue, C: Amber/Yellow, D: Orange, E: Red).
  - Programmed served DA vulnerability heatmaps to dynamically transition gradients using custom shade scales matching the isolated route's grade (e.g. shades of yellow for Grade C routes).
  - Connected the map legends to dynamically swap to matching grade-based gradients when a route is isolated, and to revert back to default metric colors when cleared.
  - Handled seamless integration with active weight slides, ensuring color highlights and heatmap scales instantly adapt when dynamic grading shifts.
- **Policy Sliders Visual Refactoring**:
  - Shifted weight slider track backgrounds from high-contrast grade colors (red, orange, green, purple) to a unified, premium medium gray (`#64748B` / slate-500) to eliminate layout collision and map confusion.
  - Custom styled the range slider thumbs to render as larger, elegant black dots (`w-4 h-4`) with a sharp white border, drop shadows, hover scaling, and reactive active clicks for smooth micro-interactivity.
- **Grade-Level Route Isolation & DA Vulnerability Heatmap**:
  - Implemented interactive clickable grade badges (A, B, C, D, E) in both the Sidebar and the Clickable Map Legend to isolate and filter all routes matching that grade across the entire dashboard.
  - Set up pre-fetching and caching of Edmonton's Dissemination Area bounds (`da_boundaries_simple.geojson`) once on mount to maximize performance.
  - Implemented dynamic Mapbox GL JS `da-heatmap` GeoJSON source and translucent `da-heatmap-layer` (rendered under routes) using an HSL-derived continuous paint interpolation ramp based on the vulnerability index.
  - Added high-fidelity, grid-aligned socio-demographic popups on hover showing population, vulnerability index, low income %, visible minority %, and senior % for served DAs.
- **System-Wide Synchronization**:
  - Connected the Zustand store's `selectedGrade` state and `setSelectedGrade` action across sidebar lists, map layers, ridership quadrants, and aggregate distribution charts.
  - Wired the reactive scoring engine in the frontend to hot-swap geographic routes dynamically when weights are modified.
- **Empirically Weighted Transit Vulnerability Index & Re-Scoring**:
  - Engineered the pipeline in `scripts/update_vulnerability_index.py` which ingests raw `data/demographics.csv`, computes percentage rates for all 6 census indicators, Z-score standardizes across all 1700+ populated Dissemination Areas, and applies PCA weights (Low Income: 1.3, Visible Minority: 1.3, Seniors: 1.0, Lone Parents: 0.6, Recent Immigrants: 1.3, Youth: 0.5) to produce continuous vulnerability index values ($V_i$) for each DA.
  - Developed and ran a high-precision UTM Zone 12N coordinate projection mapping in Shapely, calculating spatial distance-decay weights for served DAs relative to route lines with a 400m limit, re-scoring route `pillar_1_vulnerability` correctly.
  - Recalibrated network scores (capped at 95th percentile, Z-scored, sigmoided, and quintile graded) by resolving CP1252 Windows terminal emoji errors in `scripts/refine_scoring.py` and running the full pipeline end-to-end.
  - Fully integrated the new continuous demographic indicators (`lone_parent_pct`, `recent_immigrant_pct`, `youth_pct`, and `vulnerability_index`) into the frontend TypeScript schemas (`EquityMatrix.tsx` and `CommandCentre.tsx`) and enhanced the Dissemination Matrix to support real-time toggling and an expanded tooltip popover showing a complete socio-demographic profile for every DA in Edmonton.
- **Standardized Strategic Default Weights Milestone**:
  - Implemented atomic `setWeights` action in the state store (`src/store/routeStore.ts`) to concurrently apply state updates without zero-sum racing or rounding drift.
  - Set baseline starting weights in the Zustand store to the new strategic defaults: Vulnerability (15%), Temporal Risk (40%), Monopoly (10%), and Opportunity (35%).
  - Integrated the atomic `setWeights` updater into the Sidebar component (`src/components/Sidebar.tsx`), removing sequential timeouts and enabling one-click standardized baseline restoration.
- **Population Equity & Dashboard Polish**:
  - Replaced `"Ridership"` with `"Population"` in the title of the quadrant scatterplot in `src/components/CommandCentre.tsx`.
  - Standardized the X and Y axes domains (`[0, xMax]` and `[0, 100]`) and the vertical/horizontal crosshair reference lines in `src/components/charts/EquityQuadrant.tsx` using a system-wide unfiltered baseline (`allRoutes`) so they remain mathematically constant when filtering grades.
  - Connected the global `selectedRoute` state and `setSelectedRoute` actions to the scatterplot dots, enabling dynamic highlighting (opacity `1.0`, radius `6px`, dark borders) for the isolated route, and dimming (opacity `0.15`, radius `3px`) for other routes.
  - Enabled direct double-sided interactive clicking on scatterplot dots to select, toggle, and isolate routes globally across the map and sidebar.
  - Removed the `Pillar Score Dispersion (Boxplot Spread)` card visual and its unused `useMemo` math calculations from `src/components/charts/NetworkDistribution.tsx` for a clean diagnostics panel layout.
  - Renamed the first button in the Equity Dissemination Matrix metrics from `"Continuous index V_i"` to `"Composite Vulnerability Score"`.
- **Demographic Heatmap Resilient Fix & Git Synchronization**:
  - Addressed the heatmap rendering visibility issue by adding a resilient fallback key mapping in `src/components/CommandCentre.tsx` supporting both `vulnerability` and `vulnerability_index` backend keys.
  - Successfully staged, committed, and pushed the pipeline-modified `golden_route_record` database assets (.parquet and .json) and our frontend fixes to the remote master branch on GitHub.



