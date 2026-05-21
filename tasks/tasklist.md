# Route Equity Scorecard - Task List

## Phase 1: Planning and Documentation
- [x] Create `tasks/tasklist.md` for project tracking <!-- id: 1 -->
- [x] Create `projectproposal.md` with the executive summary and technical vision <!-- id: 0 -->
- [x] Create `lessons.md` for continuous improvement <!-- id: 2 -->
- [x] Analyze proposal and generate clarifying questions for the user <!-- id: 3 -->

## Phase 2: Golden Record & Elite Frontend
- [x] Establish "Golden Record" schema and sample data <!-- id: 4 -->
- [x] Initialize Next.js project with Tailwind CSS <!-- id: 5 -->
- [x] Set up "Command Centre" design system in `index.css` <!-- id: 11 -->
- [x] Integrate DuckDB-Wasm for high-performance data querying <!-- id: 7 -->
- [x] Convert Golden Record to Apache Parquet for high-speed cold starts <!-- id: 16 -->
- [x] Implement Interactive Spatial Intelligence Map (Mapbox GL JS) <!-- id: 6 -->

## Phase 3: Analytical & Explainer Components
- [x] Develop SHAP Waterfall Panel for route insights <!-- id: 9 -->
- [x] Create Equity-Ridership Scatterplot (Quadrant Chart) <!-- id: 12 -->
- [x] Implement Equity Dissemination Matrix <!-- id: 13 -->
- [x] Build Narrative Briefing Generator <!-- id: 14 -->

## Phase 3.5: Elite UI/UX Polish
- [x] Add Map Fullscreen Toggle <!-- id: 17 -->
- [x] Add "Clear Selection" overlay button to Map <!-- id: 18 -->
- [x] Build Aggregate Distribution Panel (Bell curve & Grade table) <!-- id: 19 -->
- [x] Ensure System-Wide Synchronization <!-- id: 30, priority: critical -->
  - [x] Implement reactive scoring pipeline in frontend (`useReactiveScoring.ts` — composite → sigmoid → quintile → SHAP)
  - [x] Connect dynamic data source to Map layer (`source.setData()` hot-swap in `Map.tsx`)
  - [x] Update Sidebar, EquityQuadrant, and NetworkDistribution to consume the dynamic, synchronized route data (via `CommandCentre.tsx` rewire)
  - [x] Rewrite ShapWaterfall to draw a true mathematical waterfall chart starting from city-wide baseline of 50.0 and illustrating positive/negative SHAP adjustments
- [x] Standardize Strategic Default Weights <!-- id: 32, priority: critical -->
  - [x] Implement `setWeights` in `src/store/routeStore.ts` and update default state to 15/40/10/35
  - [x] Update **Reset** button handler in `src/components/Sidebar.tsx` to use the new atomic `setWeights` action
  - [x] Verify slider behaviors, reset behavior, and visual scorecard synchronization
- [x] Add Pillar Boxplot/Spread visualization <!-- id: 20, priority: medium -->
  - [x] Render the range bars for all four pillars inside the Network Diagnostics panel to show spread and dispersion
- [x] Add Grade-level Route Isolation <!-- id: 21, priority: high -->
  - [x] Add interactive grade badges in the sidebar or map legends that isolate all routes of grade A, B, C, D, or E when clicked
- [x] Add DA Vulnerability Heatmap overlay when a route is isolated <!-- id: 22, priority: high -->
  - [x] Load `public/data/da_boundaries_simple.geojson` as a Mapbox GL source
  - [x] Highlight the specific DAs served by the selected route with a custom color scale representing low-income or vulnerability levels
- [x] Implement Command K Spotlight Search for instant route/DA snapping <!-- id: 23, priority: medium -->
- [x] Add Custom "Tick-Snapping" Zero-Sum Sliders with micro-haptics <!-- id: 24, priority: medium -->
- [x] Refactor Policy Sliders to use a unified medium gray color and a larger black thumb dot to prevent map color confusion <!-- id: 39, priority: high -->
- [ ] Add Micro-Animations to SHAP Waterfall (e.g. spring physics via Framer Motion) <!-- id: 25, priority: low -->
- [ ] Design and Implement "Policy Sensitivity Explorer" UI Tab (interactive OLS driver scatterplots and dynamic simplex terrain) <!-- id: 38, priority: future -->
- [ ] Implement "Time-Pulse" 24-hour Simulation Playback (Temporal risk visualization) <!-- id: 26, priority: future -->
- [ ] Brainstorm Spatial 3D Extrusion Map features <!-- id: 27, priority: future -->

## Phase 3.6: Quadrant & Diagnostics Dashboard Polish [COMPLETE]
- [x] Update title of quadrant scatterplot to "Population-Equity Quadrant" <!-- id: 40, priority: high -->
- [x] Standardize and lock X and Y axes domains and reference lines dynamically from overall network statistics <!-- id: 41, priority: high -->
- [x] Implement two-way route isolation sync on the quadrant scatterplot (dim non-selected routes, highlight selected, and allow click interaction) <!-- id: 42, priority: critical -->
- [x] Remove "Pillar Score Dispersion (Boxplot Spread)" visualization and clean up unused calculations <!-- id: 43, priority: medium -->
- [x] Rename the continuous index button in the Dissemination Matrix to "Composite Vulnerability Score" <!-- id: 44, priority: high -->

## Phase 4: Empirically Weighted Transit Vulnerability Index [COMPLETE]
- [x] Acquire and copy raw demographics.csv into workspace data directory <!-- id: 33, priority: critical -- >
- [x] Create scripts/update_vulnerability_index.py (PCA, Z-Score, Spatial decay) <!-- id: 34, priority: critical -- >
- [x] Run scripts/update_vulnerability_index.py to rebuild golden_route_record <!-- id: 35, priority: critical -- >
- [x] Run scripts/refine_scoring.py to re-grade and standardize scores <!-- id: 36, priority: critical -- >
- [x] Verify scoring parity, SHAPWaterfall baseline, and frontend reactive rendering <!-- id: 37, priority: critical -- >

## Phase 4.5: Data Pipeline & Integration (Future)
- [ ] Integrate additional vulnerability groups (e.g., "New Immigrants") into the data pipeline and scoring model <!-- id: 31, priority: high -->
- [ ] Decide on R5 Data Pipeline migration vs. pre-processing <!-- id: 15 -->
- [ ] Implement service impact simulation logic (Draft Mode) <!-- id: 8 -->
- [ ] Finalize PostGIS/Python backend if needed <!-- id: 10 -->

## Phase 4.6: Heatmap Defect Fix & Git Synchronization [COMPLETE]
- [x] Apply resilient parser in `CommandCentre.tsx` for vulnerability keys <!-- id: 45, priority: high -->
- [x] Run Git synchronization pipeline to commit and push generated assets and parser fixes <!-- id: 46, priority: critical -->

## Phase 5: PhD-Level Research & Analytics
- [x] Ensure dynamic weight changes actively recalculate and alter Quintile distributions across the network <!-- id: 28, priority: high -->
- [ ] Draft the core findings for the Route Equity Research Report <!-- id: 29 -->

