# Active Todo & Review Dashboard

## Active Goal
Refining analytical modeling, service impact simulations, and advanced research reporting.

## Sprint Backlog
### Phase 3.5: Elite UI/UX Polish & Explainer Upgrades
1. **SHAP Waterfall Micro-Animations** [LOW]
   - Integrate Framer Motion spring physics to animate the SHAP waterfall bar adjustments fluidly when weights are dragged.

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


