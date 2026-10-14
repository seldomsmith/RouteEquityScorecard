- [x] Create "Explain the Bus Stop Equity Scorecard to Me!" (Page 2.1)
- [x] Landing Page Reorganization (Tiered Hub - Option 2):
  - [x] Update `GlobalNavMenu.tsx`: rename label 1.1 to "Explain the Route Equity Scorecard to Me!" and 2.1 to "Explain the Bus Stop Equity Dashboard to me!"
  - [x] Implement Tiered Hub in `LandingPage.tsx`:
    - Two bold primary Dashboard buttons: "Route Report and Dashboard" and "Bus Stop Dashboard"
    - Two clean secondary links directly beneath: "Explain the Route Equity Scorecard to Me!" and "Explain the Bus Stop Equity Dashboard to me!"
    - Zero emojis and no ampersand symbols (&)
  - [x] Ensure seamless navigation wiring to `dashboard`, `scrollytelling`, `bus-stop-analysis`, and `bus-stop-scrollytelling` in `page.tsx`
  - [x] Verify code structure and responsive styling across mobile and desktop breakpoints
- [ ] Upcoming: Update GTFS Feed with Most Recent Release
  - Ingest the newest Edmonton Transit Service GTFS schedule package
  - Re-run pipeline scripts (`build_stop_vulnerability_asset.py` and DuckDB route geometry / schedule aggregations)
  - Verify route alignments, stop IDs, daily trip counts, and headways across both Route and Bus Stop dashboards
- [ ] Upcoming: Map Landing Page Subway Lines to Actual Edmonton Routes
  - Replace generic schematic background curves with actual GTFS corridor alignments (e.g. Route 2, Route 3, Route 727, Capital/Metro LRT Lines)
  - Color-code transit line segments to match official ETS brand hues or equity stability classifications
  - Align station node dots with actual Edmonton transit transfer hubs (e.g. Clareview, Downtown, University, Westmount)




