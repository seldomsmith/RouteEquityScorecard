# GTFS Real Schedule Integration & Synthetic Data Purge Plan

## Executive Summary
Audit confirmed that `BusStopGraphsPage.tsx` currently synthesizes transit service metrics using client-side heuristics based on census Dissemination Area polygon counts (`Math.floor(daCount * 1.5)` for routes, and `Math.floor(routesServed * 2.5)` for trips/hr). This caused stop #7990 to report 8 routes and stop #7674 to report 20 trips/hr.

Under this plan, all synthetic data is removed completely. Real schedule metrics from the Edmonton Transit Service (ETS) GTFS feed (`gtfs.zip` containing `routes.txt`, `trips.txt`, and `stop_times.txt`) will be integrated directly into the offline pre-computation pipeline (`build_stop_vulnerability_asset.py`), embedding actual routes served and actual peak/off-peak trips per hour into `bus_stop_vulnerability.json`. Any stop without scheduled service in the feed will remain `null` / blank with no synthetic fallbacks.

---

## 1. Ground Truth Discovery & Benchmark
Extraction from ETS GTFS archives for the flagged stops proves the actual ground truth:
* **Stop #7990 (64 St & 164 Ave):**
  * Synthetic formula reported: **8 routes**
  * Actual GTFS schedule: **3 routes** (`['118', '612', '620']` — 1 community route + 2 school specials).
* **Stop #7674 (84 St & 160 Ave):**
  * Synthetic formula reported: **20 trips/hr**
  * Actual GTFS schedule: **1 route** (`['117']`), running **2 to 3 trips/hr** on a typical weekday (peak 3 buses/hr, off-peak 2 buses/hr).

---

## 2. Proposed Architecture & Data Contract

### Pre-computed Schema in `bus_stop_vulnerability.json`
Each stop object in `stops[]` will be enriched with real GTFS service attributes:
```json
{
  "stop_id": "7674",
  "stop_name": "84 Street & 160 Avenue",
  "lon": -113.470801,
  "lat": 53.620809,
  "routes_served": ["117"],
  "route_count": 1,
  "peak_trips_per_hour": 3.0,
  "offpeak_trips_per_hour": 2.0,
  "daily_trips": 39
}
```
* If a stop does NOT appear in `stop_times.txt` (e.g. inactive, closed, or purely regional flag stop):
  * `routes_served: []`
  * `route_count: null`
  * `peak_trips_per_hour: null`
  * `offpeak_trips_per_hour: null`
  * `daily_trips: null`
* **Zero synthetic approximations or proxy multipliers.**

### Standard Definition of Service Metrics
Using standard transit industry definitions on a representative standard weekday service (`calendar.txt` / `calendar_dates.txt` / weekday `service_id` ending in `1111100`):
1. **`routes_served`:** Unique set of `route_short_name`s stopping at the stop ID.
2. **`peak_trips_per_hour`:** Average scheduled arrivals per hour during AM/PM peak windows (07:00–09:00 and 15:30–17:30).
3. **`offpeak_trips_per_hour`:** Average scheduled arrivals per hour during midday base service (09:00–15:00).
4. **`daily_trips`:** Total scheduled departures on a standard weekday.

---

## 3. Implementation Steps

### Step 1: Update `scripts/build_stop_vulnerability_asset.py`
* Ingest GTFS feed (`gtfs.zip` or unpacked tables `routes.txt`, `trips.txt`, `stop_times.txt`).
* Stream/chunk `stop_times.txt` (151 MB, ~3.6M rows) to calculate per-`stop_id`:
  * Unique `route_short_name` list.
  * Weekday arrival counts during peak (07:00–09:00, 15:30–17:30) and off-peak (09:00–15:00).
* Join directly into the bus stop pre-computation output dictionary.
* Re-run `build_stop_vulnerability_asset.py` to regenerate `public/data/bus_stop_vulnerability.json`.

### Step 2: Remove All Synthetic Fallbacks in Frontend
* In `src/components/widgets/BusStopDirectory.tsx`:
  * Update TypeScript `BusStopRecord` to include `routes_served?: string[]`, `route_count?: number | null`, `peak_trips_per_hour?: number | null`, `offpeak_trips_per_hour?: number | null`.
* In `src/components/BusStopGraphsPage.tsx`:
  * Delete lines 158–160 (all synthetic `Math.floor(daCount * 1.5)` and `Math.floor(routesServed * 2.5)` formulas).
  * Update `processedStops` to pull `s.route_count ?? null` and `s.peak_trips_per_hour ?? null` directly from the record.
  * In `routeScatterData` and `frequencyScatterData`: filter out records where metric is `null`, or plot them cleanly with explicit "No Scheduled Service Data" indicators.
  * Update Tooltip popovers to display:
    * Actual Route Count & specific Route Badges (e.g., `Routes: 118, 612, 620` instead of a generic number).
    * Actual Peak and Off-Peak Hourly Service Frequency (e.g., `3 Trips / Hr (Peak), 2 Trips / Hr (Off-Peak)`).
    * If data is missing/null, display `"No scheduled service data"` instead of a made-up number.
* Update CSV export in `BusStopGraphsPage.tsx` to export true route lists and verified frequencies.

### Step 3: Verification & Audit
* Inspect generated `public/data/bus_stop_vulnerability.json` for stop #7990 and stop #7674.
* Verify TypeScript compilation with `npm run build` / type checking.
* Confirm that no synthetic heuristics exist anywhere in the repository.
