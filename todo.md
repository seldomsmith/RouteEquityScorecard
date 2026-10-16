# Active Todo & Review Dashboard

## Active Goal
Refining analytical modeling, service impact simulations, and advanced research reporting.

## Sprint Backlog
### Phase 27: Bus Stop Scrollytelling Workspace
1. **Bus Stop Scrollytelling Page ("Explain this to me! — Bus Stop Analysis")** [HIGH]
   - Develop an interactive Mapbox scrollytelling walkthrough for Bus Stop Analysis explaining CIMD dimensions, 400m walk catchments, quintile grading (A–E), 3 real-world case studies (Abbottsfield, Oliver, Windermere), and methodological limitations. See [busstop_scrollytelling.md](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/docs/busstop_scrollytelling.md).

### Phase 25: Regional Route Exclusion & Opportunity Adjustments
2. **Regional Route Exclusion** [HIGH]
   - Exclude 42 regional routes (St. Albert 'A*', Strathcona '4*', Leduc 'L*', Beaumont '540', Spruce Grove '560', Airport '747') from municipal scoring, grading, and charts (Population Equity, S-Curve, Volatility vs Mean Scatter plot), while keeping them on the map styled in dark gray with full DA overlays.
3. **Opportunity Score (Pillar 4) Airport Dilution Log** [MEDIUM]
   - Record and address the under-representation of the Edmonton International Airport (EIA) opportunity value due to simple point-count buffers on regional corridors.

### Phase 4.5: Simulation & Data Pipeline
4. **Service Impact Simulation (Draft Mode)** [HIGH]
   - *Deferred*: Design dynamic "what-if" corridor removals/additions and re-score the network's equity live in-memory. See [service_impact_simulation_plan.md](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/tasks/service_impact_simulation_plan.md).
5. **Data Pipeline Optimization & Backend Integration** [MEDIUM]
   - Formulate integration steps for PostGIS/Python or R5 routing configurations.
6. **Policy Sensitivity Explorer UI Tab** [FUTURE]
   - Develop an interactive frontend workspace where users can visualize the Monte Carlo simplex terrain and click on routes to see their OLS driver sensitivity trends.

---

## Review & Completed Work
- **Bus Stop Header Subway Progress Rail & Extended Waterfall Backdrop (Phase 35)**:
  - Re-architected the header in [BusStopScrollytelling.tsx](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/components/BusStopScrollytelling.tsx) to match Route Equity, applying green branding (`ETS Bus Stop Equity Scorecard`, `Scroll down to read`) and removing the Two Pillars toggle.
  - Implemented an interactive Subway Map Progress Rail with 9 station nodes corresponding to chapters, tracking real-time scroll progress with an animated emerald line and click-to-scroll navigation.
  - Styled a rounded pill button for `View Scorecard ->` in primary emerald green (`bg-emerald-600 hover:bg-emerald-700`) linking to the Bus Stop Dashboard (`page 2.2`).
  - Extended [BusStopWaterfall.tsx](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/components/BusStopWaterfall.tsx) deep into the page across both the hero title and the narrative introduction box.
  - Increased stop node base radius (up to 4.2px for Grade A), boosted canvas opacity to `0.88`, heightened corridor road grid contrast, and increased catchment ripple spawn frequency.
- **CIMD Four Dimensions Redesign & Multi-Stop Map Toggle (Phase 34)**:
  - Eliminated the nested "bubble inception" in [CimdExplainer.tsx](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/components/widgets/CimdExplainer.tsx), replacing tab selectors and multi-level border containers with an open 4-column responsive grid modeled after Route Equity's **Four Pillars**.
  - Implemented the tactile `.pillar-card-lift` 3D hard-shadow hover animations and shifted the palette to four municipal tones: Sapphire Blue (`#1D4ED8`), Pine Teal (`#0F766E`), Royal Violet (`#7C3AED`), and Amber Bronze (`#D97706`).
  - Purged redundant headings (`STATISTICS CANADA FRAMEWORK` and repetitive boilerplate), and added concrete sample score comparisons directly inside each card footer (`#6586` vs `#1745`).
  - Transformed the stop switcher in [BusStopToggleMap.tsx](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/components/widgets/BusStopToggleMap.tsx) into multi-state toggle pills. Activating both stops automatically renders both 400m circles and fits bounds across Edmonton.
  - Removed the redundant "View Both Stops" button and updated the bottom spatial HUD to reflect dual-stop active status.
- **Bus Stop Explain Page Refinements & Architecture Fixes (Phase 33)**:
  - Removed `MICRO-SCALE SPATIAL EQUITY IN TRANSIT` pill tag from [BusStopScrollytelling.tsx](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/components/BusStopScrollytelling.tsx).
  - Switched the hero title `ETS BUS STOP EQUITY SCORECARD` to `text-emerald-700` to align visually with the green branding of the bus stop scorecard.
  - Rewrote Chapter 4 ("Proportional Area Weighting: Dissemination Area Overlap") body text to Grade 10 plain language with varied sentence structures, eliminating academic jargon while keeping the mathematical explanation clear.
  - Fixed the ordinal suffix calculation across `CatchmentDonutCard.tsx`, `BusStopTicket.tsx`, and `BusStopDirectory.tsx`, correctly formatting values like `1st` instead of `1th`.
  - Re-architected `BusStopToggleMap.tsx` from two simultaneous vertical WebGL canvases into a unified single-canvas Mapbox instance with smooth camera fly-to, Stop A (`#6586`) and Stop B (`#1745`) selector cards, "View Both Stops" boundary fit, and a non-overlapping spatial HUD.
  - Replaced the Chapter 7 static two-card layout with [BusStopSupplyDisparity.tsx](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/components/widgets/BusStopSupplyDisparity.tsx), featuring a 5.0× disparity ratio banner, an hourly midday departure timeline (8 departures vs 1 departure), and a winter wait-time exposure comparison.
  - Completely removed the Chapter 9 "Operational Allocation Framework for Transit Planners" table and cleanly renumbered the explorer call-to-action to Chapter 9.
- **Continuous Walkshed Envelope Optimization (Phase 32 / Pathway 2)**:
  - Developed and executed [scripts/build_unified_walkshed_envelopes.py](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/scripts/build_unified_walkshed_envelopes.py) to resolve the fragmented "disconnected bubbles" visual artifact in route isochrones.
  - Backed up all 246 raw street-buffer geometries to `data/archive_isochrones_raw/`.
  - Applied morphological closing (dilation by 85m to bridge street grid block gaps, unary dissolution, and erosion by 85m to strictly preserve the authentic 400m reach boundary) in metric projected space (EPSG:32612 UTM Zone 12N).
  - Pruned micro-island slivers (< 5,000 m²) and filled minor interior non-walkable voids (< 15,000 m²), transforming fragmented sausage ribbons into clean, contiguous corridor walk envelopes.
  - Reduced total network polygon fragments from 13,986 to 912 (a 93.5% reduction in disconnected geometry fragments).
  - Slashed total GeoJSON asset payload across all routes from 71.93 MB to 5.83 MB (a 91.9% bandwidth saving; Route 008 dropped from 922.8 KB with 84 islands down to 53.1 KB with 2 contiguous North/South river corridor envelopes).
  - Enhanced [Map.tsx](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/components/map/Map.tsx#L1207-L1220) map legend to render a dedicated "400m Walk Catchment" badge with dynamic grade-matching borders and translucent fill whenever a route is selected.
  - Confirmed zero impact on underlying census statistics, equity pillar scores, or Monte Carlo sensitivity distributions.
- **Bus Stop Explain This to Me Antiai Audit & Policy Framework Removal (Phase 31)**:
  - Removed "Actionable Decision Framework", policyAction text, and policy action tags ("Winter Snow Clearance", "Capital Infrastructure Fund", "Pedestrian Safety Lighting") from `BusStopGradeDistribution.tsx`.
  - Replaced inflated radii (`rounded-3xl` / `rounded-2xl`) with clean structural `rounded-xl` in `BusStopGradeDistribution.tsx` and `CimdExplainer.tsx`.
  - Enforced `tabular-nums` and font-mono precision across numerical scores, percentile cutoffs, daily trips, and peak frequency counters in `BusStopScrollytelling.tsx`, `BusStopGradeDistribution.tsx`, `BusStopTicket.tsx`, and `CimdExplainer.tsx`.
  - Eliminated inanimate false agency ("scorecard translates", "metric reflects", "scores summarise") across chapter intros and dimension descriptions in `BusStopScrollytelling.tsx` and `CimdExplainer.tsx`.
  - Replaced melodramatic AI chapter titles ("Two Bus Stops, Two Realities", "Mapping the Divide") with direct technical titles ("Comparative Analysis: High-Need vs. Low-Need Catchments", "Spatial Distribution: Comparative Catchment Geography").
  - Restructured Chapter 9 from an arbitrary 3-card symmetrical grid into a high-density operational policy matrix with explicit thresholds, mandated interventions, and funding mechanisms.
  - Replaced the dark terminal box in the CIMD math modal with clean mathematical typography on neutral surfaces.
  - Pruned unused decorative Lucide icons from headers and badges while strictly preserving all unselected components and features.
- **Edmonton Core Real-Route Alignment for Landing Page Hero Waterfall (Phase 30)**:
  - Replaced hardcoded synthetic schematic subway paths in `RouteWaterfall.tsx` with 8 authentic central Edmonton route corridors extracted directly from GTFS records: Capital Line LRT (`#22c55e`), Metro Line LRT (`#ef4444`), Valley Line LRT (`#06b6d4`), Route 1 (`#3b82f6`), Route 4 (`#f97316`), Route 8 (`#a855f7`), Route 2 (`#eab308`), and Route 9 (`#10b981`).
  - Geographically bounded within the core frame: 118 Ave (North), 63 Ave (South), 142 St (West), and 75 St (East), strictly preserving natural road and track curves including the North Saskatchewan River bend, Tawatinâ Bridge, Dudley B. Menzies bridge/tunnel, Jasper Ave, and Whyte Ave.
  - Positioned authentic Edmonton transit interchange transfer hubs (Churchill, University, Whyte Ave, Government Centre, MacEwan, Stadium, Davies, and Corona/Jasper).
  - Engineered phased dispatch timing so vehicles cycle gracefully with individual cooldown intervals, maintaining a clean visual balance of 3 to 5 vehicles gliding across the viewport simultaneously without overcrowding.
  - Retained all existing aesthetic properties: glowing vehicle heads, 30-segment trailing light tails, station proximity pulse activations, and interactive cursor spotlight highlighting.
- **October 2026 GTFS Live Production Cutover & Dual-Feed Analytics (Phase 29)**:
  - Archived previous baseline assets (`golden_route_record.json`, `golden_route_record.parquet`, `bus_stop_vulnerability.json`, `sensitivity_summary.csv`, and `sensitivity_summary_2_pillar.csv`) to `data/archive_baseline/`.
  - Promoted the October 2026 GTFS dataset (`261002_1029`) as the live production base (`public/data/golden_route_record.json` and `.parquet`) with unified corridors for `001`, `509`, and `918`, bringing active network routes to 178 (129 municipal, 49 regional).
  - Maintained DuckDB frontend compatibility using the 1-row `{metadata, routes}` Parquet schema.
  - Synchronized stop metrics (peak/off-peak trips per hour, daily trips, and routes served) across all 6,755 stops in `public/data/bus_stop_vulnerability.json` while preserving continuous Statistics Canada 4-Dimension CIMD scores across all 10,257 DAs.
  - Generated 10 missing 400m corridor walk isochrone GeoJSONs in `public/data/isochrones/` (including `071`, `505`, and `F1`) to prevent map click 404 errors.
  - Ran both 4-pillar (1,771 weight configurations) and 2-pillar (21 weight configurations) Monte Carlo sensitivity simulations, refreshing stability classifications and exporting `public/data/sensitivity_matrix.parquet`.
  - Provided interactive dual-feed exploration in `RouteDirectoryPage.tsx` with live policy weight and CIMD sliders, 4-pillar delta sorting, movement filters, and custom CSV exports.
- **October 2026 ETS GTFS Comparative Audit & Zero-Breakage Integration Pipeline (Phase 28)**:
  - Audited `ETS_Bus_Schedule_GTFS_Data_Feed_-_Trips_20261016.csv` (795 MB Socrata `trips` export) alongside the matching 18.7 MB relational ETS GTFS zip (`261002_1029`, cached at `scratch/gtfs_20261016.zip`), adding `ETS_Bus_Schedule_*.csv` and `*.zip` to `.gitignore` to protect `git push` / `ship.bat`.
  - Built and executed `scripts/compare_gtfs_feeds.py` to evaluate all 184 active non-6xx routes (132 municipal, 52 regional) against the 170-route production baseline across all 4 equity categories (Statistics Canada 4-Dimension CIMD & 6-indicator Social Gravity Vulnerability, Off-Peak Service, Functional Monopoly, and Opportunities) without touching live `public/data/` assets.
  - Eliminated offline `H:\` drive dependencies by reconstructing per-stop POI sets (`stop_pois`) via mathematical set intersection of `data/destination_catchments.json` with 100.0% identity across all baseline routes.
  - Fixed the legacy `trips.drop_duplicates('route_id')` short-turn truncation bug that previously scored early-morning garage pull-out stubs on Routes `004`, `007`, `106`, `116`, `507`, `509`, `701`, and `904`.
  - Exported route-by-route deltas to `docs/gtfs_route_comparison.csv`, shadow production payload to `scratch/golden_route_record_new.json`, full engineering analysis to `docs/gtfs_comparison_report.md`, and the unexecuted one-command cutover script `scripts/sync_gtfs_to_production.py`.
- **Menu Standardization & Bus Stop Quintile A-E Filter Integration (Phase 26)**:
  - Created standardized `GlobalNavMenu.tsx` component with header **`ETS ROUTE SCORECARD MENU`** and exact ordered items: `Landing Page`, `Explain this to me!`, `Equity Scorecard Dashboard`, `Route Directory`, and `Bus Stop Analysis`.
  - Embedded `GlobalNavMenu` across all application pages with top-left trigger button for 100% navigation consistency.
  - Updated `build_stop_vulnerability_asset.py` to assign quintile letter grades (A–E) to Edmonton city bus stops based on continuous percentile ranks, and flag regional stops as `Regional`.
  - Built interactive floating map legend `BusStopGradeLegend.tsx` for Bus Stop Analysis, enabling users to toggle Grade A (Emerald), Grade B (Blue), Grade C (Amber), Grade D (Orange), Grade E (Red), and Regional (Slate Gray) stops dynamically on both the map and directory.
- **On Demand Transit (ODT) Zones Integration (Phase 4.5)**:
  - Formulated a 21-zone neighborhood list matching official ETS ODT boundaries to capture 135 census DAs.
  - Updated `scripts/update_vulnerability_index.py` and `scripts/calculate_functional_monopoly.py` to discount vulnerability ($V_i$) by 10% and FMI monopoly score contribution by 50% for DAs in ODT zones.
  - Re-executed scoring, cap-normalization, and Monte Carlo engines to refresh JSON/Parquet databases.
  - Loaded `odt_zones.geojson` and styled translucent fill and dashed borders in `src/components/map/Map.tsx`, complete with hover tooltips and legend controls.
- **2-Pillar Sensitivity Integration (Phase 3.5)**:
  - Configured `scripts/run_two_pillar_sensitivity_analysis.py` to write 2-pillar simulation results directly to `public/data/sensitivity_summary_2_pillar.csv`.
  - Updated `src/components/CommandCentre.tsx` to read both 4-pillar and 2-pillar datasets, dynamically swapping them as active `sensitivityData` when Off-Peak (`resilience`) and Monopoly (`monopoly`) weight variables are disabled.
  - Rewired the map hover tooltip popup inside `src/components/map/Map.tsx` to dynamically query and show the correct active stability classification in Stability Focus mode.
- **Monte Carlo Stability Alignment & School Specials Exclusion (Phase 3.5 / Phase 10)**:
  - Refined Monte Carlo engine classification logic in `run_sensitivity_analysis.py` and `run_two_pillar_sensitivity_analysis.py` to bound Bedrock Essentials (Always High Equity) to `mean_score >= 10.0` and Bedrock Resilients to `mean_score < 10.0`.
  - Excluded all 65 school special routes (6xx-range) from the analytical data pipeline, updating the baseline to 170 active transit corridors.
  - Regenerated golden route records, sensitivity matrices, statistical summaries, and remote git repositories.
- **Stability Focus Component Shift (Phase 3.5)**:
  - When switching the segmented control to Stability Focus, swapped the Population-Equity Quadrant chart for a dedicated "Route Stability Class Distribution" component (visualizing Bedrock Essential/Resilient, Policy Swing, and Moderate count distributions).
- **Policy Risk Map Scatter Plot & Sensitivity Waterfall (Phase 3.5)**:
  - Swapped the Route Stability bar chart in Stability Focus for a Recharts-based Volatility vs. Mean Score scatter plot.
  - Implemented the Option 3 Policy Sensitivity Drivers waterfall in `ShapWaterfall.tsx` under Stability Focus, using OLS beta drivers to show how current weights deviate from uniform mix.
- **SHAP Waterfall Micro-Animations (Phase 3.5)**:
  - Integrated Framer Motion spring physics (`useMotionValue`, `useSpring`) to animate the SHAP waterfall bar widths and numeric text values fluidly when weights are dragged.
  - Implemented entry load animations so bars transition and expand dynamically from the baseline when a route is loaded.
- **Demographic Vulnerability Sensitivity Analysis (Phase 19)**:
  - Vectorized DA-level sensitivity analysis (88,913 weight configurations) in Python (`run_da_sensitivity_analysis.py`) and exported to `docs/da_vulnerability_sensitivity.csv`.
  - Mapped all 1,764 DAs to Edmonton neighbourhoods and merged population metrics (`map_da_to_neighbourhoods.py`), outputting `docs/da_vulnerability_sensitivity_mapped.csv`.
  - Aggregated sensitivity results (mean score and standard deviation volatility) at the neighbourhood level (both simple and population-weighted averages) to `docs/neighbourhood_vulnerability_sensitivity.csv`.
- **Continuous Capacity-Weighted Functional Monopoly Index (Phase 18)**:
  - Transitioned the Network Monopoly scoring logic from a binary 20% destination-overlap threshold to a continuous Capacity-Weighted Functional Monopoly Index ($FMI_{i,r}$).
  - Updated stops/destinations overlap loop in `calculate_functional_monopoly.py` to weight each destination by the route's trip count capacity share relative to all overlapping alternative routes.
  - Re-run demographic Z-scoring, PCA vulnerability, scoring refinement pipelines, and updated JSON/Parquet assets.
  - Re-run 4-pillar and 2-pillar Monte Carlo sensitivity simulations to update stability classifications and policy reports.
  - Documented math formulations in `docs/GRADING_METHODOLOGY.md`.
- **Draft Route Equity Research Report (Phase 5)**:
  - Authored a comprehensive, publication-grade academic and policy report detailing our methodology, transit equity scores, demographic correlations, 2-pillar vs 4-pillar sensitivity findings, and strategic transit planning recommendations.
  - Included an in-depth breakdown of the Opportunity Score (Pillar 4) weight scale from 1.0 (Schools) to 5.0 (Hospitals).
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




- **Monte Carlo Plinko Physics Simulation Widget (Phase 20)**:
  - Created `src/components/widgets/MonteCarloPlinko.tsx` representing a high-performance side-by-side Plinko simulation.
  - Implemented separate HTML5 `<canvas>` elements for two transit routes:
    - **Route 002 (Bedrock Essential)**: Custom physics applies a subtle steering force to particles, guiding them to cluster in a tight score range of 65-75 (low volatility profile).
    - **Route 003 (Policy Swing Corridor)**: Custom physics allows a wide dispersion of particles scattered across 10-60 (high volatility profile).
  - Added a global "Simulate 100 Scenarios" trigger that cascades 100 particles on both boards simultaneously with a staggered drop rate.
  - Integrated interactive live histograms and digital stats at the bottom of each board calculating the real-time Mean score and Standard Deviation (Spread) as particles land in their bins.
  - Custom-styled the board with deep navy backgrounds, glowing particle trails, pulsing peg indicators, and a clean white border layout matching the Route Equity Scorecard premium visual standards.
- **Detailed Math Explainers & Horizontal Route Layout (Phase 21)**:
  - Redesigned the layout for Route 002 and Route 003 comparisons across Sections 1, 3, 4, 5, and 6 to display horizontally on desktop (`md:flex-row`).
  - Added desktop breakout classes (`md:-mx-12 lg:-mx-24`) to visual blocks so the comparison elements span wider than standard paragraph blocks.
  - Built interactive "Tell me more about the math" toggle pages under the four core policy weight sections (Vulnerability, Destination Opportunity, Off-Peak Service, and Transit Monopoly).
  - Designed tailored visual representations for each methodology section, including demographic flag tables, weighted opportunity progress bars, headway point brackets, and FMI discount calculations.
- **Narrative Content Rewrite & Limitations Visuals (Phase 22)**:
  - Rewrote the narrative structure across all sections to align with the final approved text copy.
  - Relocated the Monte Carlo Plinko physics simulation widget to its logical home in Section 8 (Stability Focus).
  - Designed and developed a brand-new Section 9 containing a detailed breakdown of the four core scorecard limitations (Ecological Fallacy, Static Schedules, Physical Barriers, and Destination Quality vs. Quantity).
  - Implemented custom CSS-styled diagrams for each of the four limitations (Macro vs. Micro demographic split grids, Scheduled vs. Real-World timelines, Circular buffer vs. jagged walking boundary diagrams, and Raw vs. Equity-Adjusted utility cards).
- **Scorecard Layout, Content, and Directory Score Fixes (Phase 24)**:
  - Swapped the monopoly description text under the monopoly map in `Scrollytelling.tsx` to the revised explanation focusing on alternative transit routes.
  - Standardized the height of `RouteTicket` cards using `h-[220px] sm:h-[200px] md:h-[180px]` to keep all cards uniform across the scrollyteller.
  - Enlarged the stability classification bubbles (Bedrock Essentials, Policy Swing, Moderate Stability, Bedrock Resilient) in `Scrollytelling.tsx` to `text-xs md:text-sm` with wider padding and `w-2.5 h-2.5` bullet dots.
  - Removed the `ENGINE SECURE` status indicator overlay in `CommandCentre.tsx` to eliminate overlap with the Map's red deselect button.
  - Renamed "System-Wide Health Diagnostics" to "Network Wide Metrics" and removed its subheading in `CommandCentre.tsx`.
  - Corrected the route count in the distribution table description inside `NetworkDistribution.tsx` from 235 to 170.
  - Rephrased the sigmoid S-Curve score distribution description inside `NetworkDistribution.tsx` to be accessible and non-technical.
- **Policy Sensitivity Weight Box (Phase 25)**:
  - Created a custom interactive Weight Box component mapping bilinear coordinates inside an SVG square to the active four-pillar weights (Vulnerability, Off-Peak, Monopoly, Opportunity).
  - Implemented high-performance in-memory HTML5 canvas rendering for the route score sensitivity heatmap using a clean, monochromatic dark-slate to brand-blue color scheme.
  - Integrated the TernaryWeightTerrain component into the Score Breakdown card of `CommandCentre.tsx` with toggle tabs next to the SHAP Waterfall, triggering map and score calculations in real-time.
  - Integrated the clean plain-text Route Header inside the **Route Isolator** card section of `Sidebar.tsx`, replacing the select dropdown when a route is isolated with a color-coded grade badge and route description card.
