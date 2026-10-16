- [x] Create "Explain the Bus Stop Equity Scorecard to Me!" (Page 2.1)
- [x] Landing Page Reorganization (Tiered Hub - Option 2):
  - [x] Update `GlobalNavMenu.tsx`: rename label 1.1 to "Explain the Route Equity Scorecard to Me!" and 2.1 to "Explain the Bus Stop Equity Dashboard to me!"
  - [x] Implement Tiered Hub in `LandingPage.tsx`:
    - Two bold primary Dashboard buttons: "Route Report and Dashboard" and "Bus Stop Dashboard"
    - Two clean secondary links directly beneath: "Explain the Route Equity Scorecard to Me!" and "Explain the Bus Stop Equity Dashboard to me!"
    - Zero emojis and no ampersand symbols (&)
  - [x] Ensure seamless navigation wiring to `dashboard`, `scrollytelling`, `bus-stop-analysis`, and `bus-stop-scrollytelling` in `page.tsx`
  - [x] Verify code structure and responsive styling across mobile and desktop breakpoints
- [x] Update GTFS Feed with Most Recent Release (Phase 1: Non-Destructive Comparative Analysis & Pipeline Readiness)
  - [x] Audit `ETS_Bus_Schedule_GTFS_Data_Feed_-_Trips_20261016.csv` and official ETS `gtfs.zip` (`261002_1029`), and exclude 795 MB CSV in `.gitignore`
  - [x] Build `scripts/compare_gtfs_feeds.py` to evaluate all 4 equity pillars (CIMD Vulnerability, Off-Peak Service, Functional Monopoly, Opportunities) without modifying live dashboard assets
  - [x] Generate `docs/gtfs_route_comparison.csv`, `docs/gtfs_comparison_report.md`, and shadow candidate `scratch/golden_route_record_new.json`
- [x] Route Directory Dual-Feed Comparative Analysis Mode (Phase 2: Live In-App Exploration)
  - [x] Update `routeStore.ts` with 3-way directory feed switcher (`baseline`, `oct2026`, `compare`)
  - [x] Enhance `RouteDirectoryPage.tsx` with live policy weight & CIMD sliders dynamically re-scoring both feeds
  - [x] Add side-by-side 4-pillar delta columns, sorting by Δ score and pillar shifts, movement filters, and custom CSV download
  - [x] Fix Summer 2026 baseline geometry truncations in `scratch/golden_route_record_baseline_fixed.json` to eliminate false geometry shifts
- [x] Production Cutover to October 2026 Feed as Live Base (Phase 3: Execution)
  - [x] Backup historical baseline assets to `data/archive_baseline/`
  - [x] Promote October 2026 golden record to `public/data/golden_route_record.json` and `.parquet` (1-row schema, 178 routes)
  - [x] Sync stop metrics in `public/data/bus_stop_vulnerability.json` (6,755 stops) while maintaining continuous Statistics Canada CIMD scores (10,257 DAs)
  - [x] Generate missing 400m corridor walk isochrones in `public/data/isochrones/` (10 new GeoJSONs: `071`, `505`, `F1`, school/regional corridors)
  - [x] Execute Monte Carlo sensitivity simulations (`run_sensitivity_analysis.py` and `run_two_pillar_sensitivity_analysis.py`) refreshing stability classes across all 129 municipal routes
  - [x] Author comprehensive analytical research and audit report in `docs/gtfs_comparison_report.md` documenting 4-pillar shifts, Monte Carlo stability transitions, and policy recommendations
- [x] Landing Page Real Edmonton Route Alignment:
  - [x] Replaced generic schematic curves with 8 authentic central Edmonton route corridors (Capital Line LRT, Metro Line LRT, Valley Line LRT, Route 1, Route 4, Route 8, Route 2, Route 9)
  - [x] Constrained routes within the geographic box: 118 Ave (N), 63 Ave (S), 142 St (W), and 75 St (E), reflecting true road and track curves
  - [x] Positioned authentic Edmonton transit transfer hubs (Churchill, University, Whyte Ave, Government Centre, MacEwan, Stadium, Davies, Corona)
  - [x] Implemented phased traffic dispatch so only 3-5 vehicles glide concurrently across the viewport rather than crowding all at once
- [ ] Structure 20-Minute Executive Presentation (No Coding):
  - 0:00 - 3:00 | The Problem: City-wide transit equity vs. micro-scale stop realities
  - 3:00 - 7:00 | Route Equity Framework: The Four Pillars and Monte Carlo stability testing
  - 7:00 - 12:00 | Bus Stop Equity Framework: 400m DA catchments, CIMD indicators, and grade distributions
  - 12:00 - 16:00 | Live Platform Walkthrough: Command Centre & Bus Stop Spatial Analytics
  - 16:00 - 20:00 | Policy Decisions & Implementation: Resource allocation, service protection, and Q&A





