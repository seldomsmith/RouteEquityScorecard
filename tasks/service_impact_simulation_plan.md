# Implementation Plan — Service Impact Simulation (Draft Mode)

This plan outlines the design and integration of the "Service Impact Simulation (Draft Mode)" feature. It allows users to simulate the removal of transit routes and dynamically re-score the remaining network's equity live in-memory.

## Open Questions

> [!IMPORTANT]
> **1. Route Deletions vs. Route Additions**
> Simulating route removals (exclusions) is straightforward because we have the complete geometries and demographic data for all 170 active routes on disk. For **corridor additions**, do you want a simple UI to add mock routes (e.g., drawing lines or selecting DAs to connect), or should we focus exclusively on high-fidelity removals for this sprint?
>
> **2. Map Presentation of Excluded Routes**
> When a route is simulated as "removed", should it be completely hidden from the map, or should we render it with a dimmed, dashed grey style (so users can easily see what was removed)?

---

## Proposed Changes

### 1. In-Memory Recalculation Engine

#### [MODIFY] [useReactiveScoring.ts](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/hooks/useReactiveScoring.ts)
- Connect `removedRoutes` from the Zustand store.
- Exclude removed routes from:
  - Network-wide pillar mean calculations
  - Sigmoid midpoint/steepness calibration
  - Quintile relative grading thresholds
- This ensures that when a route is removed, all remaining routes are dynamically graded *relative only to the active network*.

### 2. UI Simulation Controls

#### [MODIFY] [Sidebar.tsx](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/components/Sidebar.tsx)
- Add a new section or tab: **Draft Mode Simulator**.
- Display the list of currently excluded routes with a quick-restore icon.
- Add a "Reset Simulation" button to restore all routes.
- Update the main Route List to style excluded routes with a distinct visual look (dimmed out, line-through, or helper badge).

#### [MODIFY] [CommandCentre.tsx](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/components/CommandCentre.tsx)
- Bind the Zustand `removedRoutes` store state to pass down active simulated routes to the sidebar and map.

### 3. Map & Interaction Updates

#### [MODIFY] [Map.tsx](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/components/map/Map.tsx)
- Feed `removedRoutes` into Mapbox filters.
- Excluded routes will be dynamically styled as dashed grey lines (or hidden, depending on user review).
- Update map tooltips to display a `[SIMULATED REMOVAL]` status when hovered/clicked.

#### [MODIFY] [ShapWaterfall.tsx](file:///c:/Antigravity%20Projects%20in%20C/Route%20Equity%20Scorecard/src/components/charts/ShapWaterfall.tsx)
- Add a prominent **"Simulate Removal" / "Restore Route"** button in the route details header, allowing users to toggle simulation state instantly for the selected route.

---

## Verification Plan

### Automated Verification
- Run `npm run build` to verify compile-time safety.

### Manual Verification
1. Select a route (e.g., Route 002) and click **Simulate Removal** inside the details sidebar.
2. Confirm the route line color changes on the map and is styled as excluded.
3. Verify that network grade distributions and the Pop-Equity Quadrant scatter plot shift reactively in real-time.
4. Open the **Draft Mode Simulator** tab in the sidebar, verify the route is listed, and click the restore button to verify it returns to normal.
