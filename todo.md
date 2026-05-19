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
- **Standardized Strategic Default Weights Milestone**:
  - Implemented atomic `setWeights` action in the state store (`src/store/routeStore.ts`) to concurrently apply state updates without zero-sum racing or rounding drift.
  - Set baseline starting weights in the Zustand store to the new strategic defaults: Vulnerability (15%), Temporal Risk (40%), Monopoly (10%), and Opportunity (35%).
  - Integrated the atomic `setWeights` updater into the Sidebar component (`src/components/Sidebar.tsx`), removing sequential timeouts and enabling one-click standardized baseline restoration.
