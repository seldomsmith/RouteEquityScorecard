"""
Production Cutover Script: Promote October 2026 ETS GTFS (`261002_1029` / `2026-10-16`) to Live Dashboard.
NOTE: Run ONLY when authorized to replace live files in `public/data/`.

Atomic Operations Performed:
1. Back up current production baseline (`public/data/golden_route_record.json`, `golden_route_record.parquet`,
   `bus_stop_vulnerability.json`, `sensitivity_summary.csv`, `sensitivity_summary_2pillar.csv`) to `data/archive_baseline/`.
2. Promote `scratch/golden_route_record_new.json` -> `public/data/golden_route_record.json` & `.parquet`.
3. Update `public/data/bus_stop_vulnerability.json` with October 2026 GTFS stop frequencies & routes served
   while preserving exact continuous Statistics Canada 4-Dimension CIMD scores (`da_scores` and per-stop `das`).
4. Generate missing 400m corridor isochrone GeoJSONs in `public/data/isochrones/{route_id}.json` for all new/split routes
   (`001A`, `001B`, `071`, `505`, `509A`, `509B`, `918A`, `918B`, `F1`, `430S`-`451S`, `460`) so map clicks never 404.
5. Re-run 10,000-iteration Monte Carlo sensitivity simulations for both 4-Pillar (`public/data/sensitivity_summary.csv`)
   and 2-Pillar (`public/data/sensitivity_summary_2pillar.csv`) models.
"""
import io
import json
import os
import shutil
import subprocess
import sys
import zipfile
from collections import defaultdict

import geopandas as gpd
import pandas as pd
from shapely.geometry import LineString, Point, mapping


def backup_baseline():
    print("[1/5] Archiving current production baseline to 'data/archive_baseline/'...")
    os.makedirs("data/archive_baseline", exist_ok=True)
    files_to_backup = [
        "public/data/golden_route_record.json",
        "public/data/golden_route_record.parquet",
        "public/data/bus_stop_vulnerability.json",
        "public/data/sensitivity_summary.csv",
        "public/data/sensitivity_summary_2_pillar.csv",
        "public/data/sensitivity_summary_2pillar.csv",
    ]
    for fpath in files_to_backup:
        if os.path.exists(fpath):
            dest = os.path.join("data/archive_baseline", os.path.basename(fpath))
            shutil.copy2(fpath, dest)
            print(f"  Backed up {fpath} -> {dest}")


def promote_golden_route_record():
    print("\n[2/5] Promoting October 2026 route record to 'public/data/golden_route_record.json' & '.parquet'...")
    cand_path = "scratch/golden_route_record_new.json"
    if not os.path.exists(cand_path):
        raise FileNotFoundError(
            f"Candidate record '{cand_path}' not found. Run 'py scripts/compare_gtfs_feeds.py' first."
        )
    shutil.copy2(cand_path, "public/data/golden_route_record.json")

    with open(cand_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    # Export to Parquet matching exact 1-row schema {'metadata': ..., 'routes': [...]}
    df = pd.DataFrame([{"metadata": payload["metadata"], "routes": payload["routes"]}])
    df.to_parquet("public/data/golden_route_record.parquet", index=False)
    print(f"  Promoted {len(payload['routes'])} routes to JSON and Parquet (1-row schema).")
    return payload["routes"]


def update_bus_stop_vulnerability_unified(gtfs_zip_path: str):
    print("\n[3/5] Updating 'public/data/bus_stop_vulnerability.json' (preserving continuous CIMD + syncing GTFS metrics)...")
    asset_path = "public/data/bus_stop_vulnerability.json"
    with open(asset_path, "r", encoding="utf-8") as f:
        asset = json.load(f)

    # Extract stop-level service metrics from the new GTFS zip
    MERGE_AB_MAP = {
        "001A": "001", "001B": "001",
        "509A": "509", "509B": "509",
        "918A": "918", "918B": "918",
    }
    with zipfile.ZipFile(gtfs_zip_path, "r") as z:
        routes_df = pd.read_csv(io.BytesIO(z.read("routes.txt")), dtype={"route_id": str, "route_short_name": str})
        routes_df["route_short_name"] = routes_df["route_short_name"].str.strip().replace(MERGE_AB_MAP)
        route_map = dict(zip(routes_df["route_id"], routes_df["route_short_name"]))

        trips_df = pd.read_csv(
            io.BytesIO(z.read("trips.txt")),
            usecols=["trip_id", "route_id", "service_id"],
            dtype={"trip_id": str, "route_id": str, "service_id": str},
        )
        cal_dates = pd.read_csv(io.BytesIO(z.read("calendar_dates.txt")), dtype=str)

        rep_date = cal_dates["date"].value_counts().index[0]
        active_services = set(cal_dates[cal_dates["date"] == rep_date]["service_id"])
        rep_trips = trips_df[trips_df["service_id"].isin(active_services)]
        active_trip_set = set(rep_trips["trip_id"])
        trip_to_route = dict(zip(trips_df["trip_id"], trips_df["route_id"].map(route_map)))

        stop_routes = defaultdict(set)
        stop_peak_counts = defaultdict(int)
        stop_offpeak_counts = defaultdict(int)
        stop_total_counts = defaultdict(int)

        with z.open("stop_times.txt") as st_file:
            for chunk in pd.read_csv(
                st_file, usecols=["trip_id", "arrival_time", "stop_id"], chunksize=500000, dtype=str
            ):
                chunk["route_name"] = chunk["trip_id"].map(trip_to_route)
                for sid, rname in zip(chunk["stop_id"], chunk["route_name"]):
                    if pd.notna(rname):
                        stop_routes[sid].add(str(rname))

                day_chunk = chunk[chunk["trip_id"].isin(active_trip_set)]
                for sid, arr_time in zip(day_chunk["stop_id"], day_chunk["arrival_time"]):
                    try:
                        hour = int(arr_time.split(":")[0])
                    except Exception:
                        continue
                    stop_total_counts[sid] += 1
                    if hour in (7, 8, 16, 17):
                        stop_peak_counts[sid] += 1
                    elif 9 <= hour <= 15:
                        stop_offpeak_counts[sid] += 1

    # Merge updated GTFS service metrics into existing continuous-CIMD stops
    for stop in asset.get("stops", []):
        sid = str(stop["stop_id"])
        rset = stop_routes.get(sid)
        if rset:
            sorted_routes = sorted(list(rset), key=lambda x: (int(x) if x.isdigit() else 9999, x))
            tot = stop_total_counts.get(sid, 0)
            stop["routes_served"] = sorted_routes
            stop["route_count"] = len(sorted_routes)
            stop["peak_trips_per_hour"] = round(stop_peak_counts.get(sid, 0) / 4.0, 1) if tot > 0 else 0.0
            stop["offpeak_trips_per_hour"] = round(stop_offpeak_counts.get(sid, 0) / 7.0, 1) if tot > 0 else 0.0
            stop["daily_trips"] = tot
        else:
            stop["routes_served"] = []
            stop["route_count"] = None
            stop["peak_trips_per_hour"] = None
            stop["offpeak_trips_per_hour"] = None
            stop["daily_trips"] = None

    with open(asset_path, "w", encoding="utf-8") as f:
        json.dump(asset, f, separators=(",", ":"))
    print(f"  Updated {len(asset.get('stops', []))} stops in '{asset_path}' while keeping continuous 'da_scores'.")


def generate_missing_isochrones(routes):
    print("\n[4/5] Ensuring 400m corridor isochrones exist in 'public/data/isochrones/' for all routes...")
    iso_dir = "public/data/isochrones"
    os.makedirs(iso_dir, exist_ok=True)
    generated = 0

    for r in routes:
        rid = str(r["route_id"])
        iso_path = os.path.join(iso_dir, f"{rid}.json")
        if os.path.exists(iso_path):
            continue

        coords = r.get("coords", [])
        if not coords:
            continue

        # In golden record, coords are [[lat, lon], ...]. Convert to [lon, lat] for GeoJSON/EPSG:4326
        geom_coords = [(lon, lat) for lat, lon in coords]
        geom = LineString(geom_coords) if len(geom_coords) >= 2 else Point(geom_coords[0])
        gdf = gpd.GeoDataFrame([{"route_id": rid}], geometry=[geom], crs="EPSG:4326").to_crs(epsg=3400)
        buffered = gdf.geometry.iloc[0].buffer(400.0).simplify(5.0)
        buffered_4326 = gpd.GeoSeries([buffered], crs="EPSG:3400").to_crs(epsg=4326).iloc[0]

        payload = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "route_id": rid,
                        "walk_limit_m": 400,
                        "buffer_radius_m": 400,
                        "node_count": len(coords),
                    },
                    "geometry": mapping(buffered_4326),
                }
            ],
        }
        with open(iso_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, separators=(",", ":"))
        generated += 1
        print(f"  Generated missing isochrone: {iso_path}")

    print(f"  Isochrone check complete ({generated} new files created).")


def run_monte_carlo_simulations():
    print("\n[5/5] Running 4-Pillar and 2-Pillar Monte Carlo Sensitivity Simulations...")
    subprocess.run([sys.executable, "scripts/run_sensitivity_analysis.py"], check=True)
    subprocess.run([sys.executable, "scripts/run_two_pillar_sensitivity_analysis.py"], check=True)

    # Re-export parquet to capture updated stability_class written by sensitivity scripts
    with open("public/data/golden_route_record.json", "r", encoding="utf-8") as f:
        final_payload = json.load(f)
    df = pd.DataFrame([{"metadata": final_payload["metadata"], "routes": final_payload["routes"]}])
    df.to_parquet("public/data/golden_route_record.parquet", index=False)
    print("  Synchronized golden_route_record.parquet with stability classifications.")
    print("  Monte Carlo sensitivity summaries updated.")


def main():
    gtfs_zip = "scratch/gtfs_20261016.zip"
    if not os.path.exists(gtfs_zip):
        raise FileNotFoundError(f"Cached GTFS zip '{gtfs_zip}' not found.")

    backup_baseline()
    routes = promote_golden_route_record()
    update_bus_stop_vulnerability_unified(gtfs_zip)
    generate_missing_isochrones(routes)
    run_monte_carlo_simulations()
    print("\n[COMPLETE] October 2026 GTFS feed is now live in 'public/data/'.")


if __name__ == "__main__":
    main()
