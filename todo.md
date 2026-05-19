# Active Todo & Review Dashboard

## Active Goal
Establish system-wide synchronization and advanced spatial diagnostics for the Route Equity Scorecard.

## Sprint Backlog
### Phase 3.5: Elite UI/UX Polish
1. **System-Wide Synchronization** [CRITICAL]
   - Reactive Scoring Engine (Z-Score & Sigmoid re-calculation in frontend)
   - Dynamic Mapbox GL JS layer updates using `.setData`
   - Synchronization of Sidebar lists, Scatterplot Quadrants, and Network Distribution curve
   - Scientific SHAP Waterfall Chart ($50.0$ baseline and positive/negative offsets)
2. **DA Vulnerability Heatmap** [HIGH]
   - Render hyper-local Dissemination Area boundaries from `da_boundaries_simple.geojson` when a route is isolated
3. **Grade-Level Route Isolation** [HIGH]
   - Isolate all routes in the network matching a specific grade (A, B, C, D, E) via legend interaction
4. **Pillar Boxplot/Spread Panel** [MEDIUM]
   - Visualizing distribution spread for each of the four equity pillars

---

## Review & Completed Work
### Completed:
- **Empirically Weighted Transit Vulnerability Index & Re-Scoring**:
  - Engineered the pipeline in `scripts/update_vulnerability_index.py` which ingests raw `data/demographics.csv`, computes percentage rates for all 6 census indicators, Z-score standardizes across all 1700+ populated Dissemination Areas, and applies PCA weights (Low Income: 1.3, Visible Minority: 1.3, Seniors: 1.0, Lone Parents: 0.6, Recent Immigrants: 1.3, Youth: 0.5) to produce continuous vulnerability index values ($V_i$) for each DA.
  - Developed and ran a high-precision UTM Zone 12N coordinate projection mapping in Shapely, calculating spatial distance-decay weights for served DAs relative to route lines with a 400m limit, re-scoring route `pillar_1_vulnerability` correctly.
  - Recalibrated network scores (capped at 95th percentile, Z-scored, sigmoided, and quintile graded) by resolving CP1252 Windows terminal emoji errors in `scripts/refine_scoring.py` and running the full pipeline end-to-end.
  - Fully integrated the new continuous demographic indicators (`lone_parent_pct`, `recent_immigrant_pct`, `youth_pct`, and `vulnerability_index`) into the frontend TypeScript schemas (`EquityMatrix.tsx` and `CommandCentre.tsx`) and enhanced the Dissemination Matrix to support real-time toggling and an expanded tooltip popover showing a complete socio-demographic profile for every DA in Edmonton.
- **Standardized Strategic Default Weights Milestone**:
  - Implemented atomic `setWeights` action in the state store (`src/store/routeStore.ts`) to concurrently apply state updates without zero-sum racing or rounding drift.
  - Set baseline starting weights in the Zustand store to the new strategic defaults: Vulnerability (15%), Temporal Risk (40%), Monopoly (10%), and Opportunity (35%).
  - Integrated the atomic `setWeights` updater into the Sidebar component (`src/components/Sidebar.tsx`), removing sequential timeouts and enabling one-click standardized baseline restoration.

