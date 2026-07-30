"""
Build Bus Stop Vulnerability Pre-Computation Asset with Min-Max Continuous Raw CIMD Factor Scores
Formula: Normalized Score = 1.0 + 99.0 * ((Raw - Min) / (Max - Min))
Outputs to `public/data/bus_stop_vulnerability.json`.
"""
import json
import os
import time
import pandas as pd
import geopandas as gpd

def main():
    print("=" * 60)
    print("BUILDING MIN-MAX CONTINUOUS BUS STOP VULNERABILITY ASSET")
    print("=" * 60)
    start_time = time.time()

    # 1. Load Bus Stops GeoJSON
    candidate_paths = [
        "public/data/stops_with_jobs.geojson",
        "data/stops_with_jobs.geojson",
    ]
    stops_geojson_path = None
    for p in candidate_paths:
        if os.path.exists(p):
            stops_geojson_path = p
            break

    if not stops_geojson_path:
        raise FileNotFoundError(f"Stops GeoJSON not found in paths: {candidate_paths}")

    print(f"\n[1/5] Ingesting bus stops from '{stops_geojson_path}'...")
    gdf_stops = gpd.read_file(stops_geojson_path)
    print(f"  Loaded {len(gdf_stops)} bus stops.")

    # 2. Load DA Boundaries GeoJSON
    da_geojson_path = "public/data/da_boundaries_simple.geojson"
    if not os.path.exists(da_geojson_path):
        da_geojson_path = "data/da_boundaries.geojson"

    print(f"\n[2/5] Ingesting DA boundaries from '{da_geojson_path}'...")
    gdf_das = gpd.read_file(da_geojson_path)
    print(f"  Loaded {len(gdf_das)} Dissemination Areas (DAs).")

    # Ensure DAUID is string
    gdf_das['DAUID'] = gdf_das['DAUID'].astype(str).str.strip()

    # 3. Load Granular Raw Continuous CIMD Factor Scores from Excel
    excel_path = "data/prairies_scores_quintiles_EN.xlsx"
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Excel file not found at '{excel_path}'")

    print(f"\n[3/5] Loading raw continuous factor scores from Excel '{excel_path}'...")
    df_excel = pd.read_excel(excel_path)

    # Detect DA column
    da_col = next((c for c in df_excel.columns if 'DA' in str(c).upper() or 'DISSEMINATION' in str(c).upper()), None)
    if not da_col:
        raise ValueError("Could not find DAUID column in Excel file.")

    # Detect Raw Factor Score Columns (prefer 'Factor score' or 'score' over 'Quintile')
    econ_col = next((c for c in df_excel.columns if 'ECONOMIC' in str(c).upper() and ('FACTOR' in str(c).upper() or 'SCORE' in str(c).upper()) and 'QUINTILE' not in str(c).upper()), None)
    res_col = next((c for c in df_excel.columns if 'RESIDENTIAL' in str(c).upper() and ('FACTOR' in str(c).upper() or 'SCORE' in str(c).upper()) and 'QUINTILE' not in str(c).upper()), None)
    eth_col = next((c for c in df_excel.columns if 'ETHNO' in str(c).upper() and ('FACTOR' in str(c).upper() or 'SCORE' in str(c).upper()) and 'QUINTILE' not in str(c).upper()), None)
    sit_col = next((c for c in df_excel.columns if 'SITUATIONAL' in str(c).upper() and ('FACTOR' in str(c).upper() or 'SCORE' in str(c).upper()) and 'QUINTILE' not in str(c).upper()), None)

    # Fallback if specific Factor Score title isn't separate
    if not econ_col: econ_col = [c for c in df_excel.columns if 'ECONOMIC' in str(c).upper()][0]
    if not res_col: res_col = [c for c in df_excel.columns if 'RESIDENTIAL' in str(c).upper()][0]
    if not eth_col: eth_col = [c for c in df_excel.columns if 'ETHNO' in str(c).upper()][0]
    if not sit_col: sit_col = [c for c in df_excel.columns if 'SITUATIONAL' in str(c).upper()][0]

    print(f"  Target Columns Identified:")
    print(f"    DA: {da_col}")
    print(f"    Econ: {econ_col}")
    print(f"    Res:  {res_col}")
    print(f"    Eth:  {eth_col}")
    print(f"    Sit:  {sit_col}")

    # Prepare DataFrame & numeric values
    df_excel['da_str'] = df_excel[da_col].astype(str).str.split('.').str[0].str.strip()
    df_excel['raw_econ'] = pd.to_numeric(df_excel[econ_col], errors='coerce')
    df_excel['raw_res'] = pd.to_numeric(df_excel[res_col], errors='coerce')
    df_excel['raw_eth'] = pd.to_numeric(df_excel[eth_col], errors='coerce')
    df_excel['raw_sit'] = pd.to_numeric(df_excel[sit_col], errors='coerce')

    # Min-Max Scaling helper (1.0 to 100.0)
    def min_max_scale(series):
        min_v = series.min()
        max_v = series.max()
        if max_v == min_v:
            return pd.Series(50.0, index=series.index)
        return 1.0 + 99.0 * ((series - min_v) / (max_v - min_v))

    df_excel['norm_econ'] = min_max_scale(df_excel['raw_econ'])
    df_excel['norm_res'] = min_max_scale(df_excel['raw_res'])
    df_excel['norm_eth'] = min_max_scale(df_excel['raw_eth'])
    df_excel['norm_sit'] = min_max_scale(df_excel['raw_sit'])

    cimd_scores = {}
    da_scores_export = {}

    for _, row in df_excel.iterrows():
        da_str = row['da_str']
        if not da_str or da_str == 'nan':
            continue

        econ = round(float(row['norm_econ']), 1) if not pd.isna(row['norm_econ']) else 50.0
        res = round(float(row['norm_res']), 1) if not pd.isna(row['norm_res']) else 50.0
        eth = round(float(row['norm_eth']), 1) if not pd.isna(row['norm_eth']) else 50.0
        sit = round(float(row['norm_sit']), 1) if not pd.isna(row['norm_sit']) else 50.0

        equal_score = round((econ + res + eth + sit) / 4.0, 1)

        item = {
            "econ": econ,
            "res": res,
            "eth": eth,
            "sit": sit,
            "equal": equal_score,
            "economic": econ
        }
        cimd_scores[da_str] = item
        da_scores_export[da_str] = item

    print(f"  Successfully computed Min-Max continuous scores for {len(cimd_scores)} DAs.")

    # 4. Project Geometries to Alberta 10-TM (EPSG:3400 - meters)
    print("\n[4/5] Projecting to EPSG:3400 and computing 400m geodesic buffers...")
    gdf_stops_3400 = gdf_stops.to_crs(epsg=3400)
    gdf_das_3400 = gdf_das.to_crs(epsg=3400)

    # Build spatial index on DA polygons
    da_sindex = gdf_das_3400.sindex

    # 5. Spatial Buffer Intersections & Area-Weighted Scoring
    print("\n[5/5] Performing spatial buffer area intersections for all stops...")
    stops_data = []

    for idx, stop in gdf_stops_3400.iterrows():
        stop_id = str(stop.get("stop_id", "")).strip()
        stop_name = str(stop.get("stop_name", "")).strip().replace('"', '')
        orig_geom = gdf_stops.geometry.iloc[idx]
        lon, lat = orig_geom.x, orig_geom.y

        # Create 400m geodesic buffer
        stop_geom_3400 = stop.geometry
        buffer_3400 = stop_geom_3400.buffer(400.0)

        # Intersecting DAs
        possible_matches_index = list(da_sindex.intersection(buffer_3400.bounds))
        possible_matches = gdf_das_3400.iloc[possible_matches_index]
        precise_matches = possible_matches[possible_matches.intersects(buffer_3400)]

        da_breakdown = []
        total_overlap_area = 0.0

        for _, da_row in precise_matches.iterrows():
            da_id = str(da_row["DAUID"]).strip()
            da_geom = da_row.geometry
            intersection = buffer_3400.intersection(da_geom)
            overlap_area = intersection.area

            if overlap_area > 0:
                total_overlap_area += overlap_area
                da_info = cimd_scores.get(da_id, {"equal": 50.0, "economic": 50.0, "econ": 50.0, "res": 50.0, "eth": 50.0, "sit": 50.0})
                da_breakdown.append({
                    "da_id": da_id,
                    "overlap_area": overlap_area,
                    "equal_score": da_info["equal"],
                    "economic_score": da_info["economic"],
                    "econ": da_info.get("econ", 50.0),
                    "res": da_info.get("res", 50.0),
                    "eth": da_info.get("eth", 50.0),
                    "sit": da_info.get("sit", 50.0)
                })

        weighted_equal_score = 0.0
        weighted_econ_score = 0.0
        processed_da_list = []

        if total_overlap_area > 0:
            for item in da_breakdown:
                pct = item["overlap_area"] / total_overlap_area
                weighted_equal_score += item["equal_score"] * pct
                weighted_econ_score += item["economic_score"] * pct

                processed_da_list.append({
                    "da_id": item["da_id"],
                    "pct": round(pct * 100.0, 1),
                    "equal_score": item["equal_score"],
                    "economic_score": item["economic_score"],
                    "econ": item["econ"],
                    "res": item["res"],
                    "eth": item["eth"],
                    "sit": item["sit"]
                })
        else:
            weighted_equal_score = 50.0
            weighted_econ_score = 50.0

        stops_data.append({
            "stop_id": stop_id,
            "stop_name": stop_name,
            "lon": round(lon, 6),
            "lat": round(lat, 6),
            "equal_score": round(weighted_equal_score, 1),
            "economic_score": round(weighted_econ_score, 1),
            "is_regional": False,
            "das": processed_da_list
        })

    # Sort and calculate dynamic quintiles across stops
    municipal_stops = [s for s in stops_data if not s["is_regional"]]
    sorted_equal = sorted(municipal_stops, key=lambda x: x["equal_score"])
    sorted_econ = sorted(municipal_stops, key=lambda x: x["economic_score"])
    n = len(municipal_stops) or 1

    equal_rank = {s["stop_id"]: idx for idx, s in enumerate(sorted_equal)}
    econ_rank = {s["stop_id"]: idx for idx, s in enumerate(sorted_econ)}

    for s in stops_data:
        if s["is_regional"]:
            s["equal_percentile"] = None
            s["economic_percentile"] = None
            s["equal_grade"] = "Regional"
            s["economic_grade"] = "Regional"
        else:
            eq_pct = round((equal_rank[s["stop_id"]] / (n - 1 or 1)) * 100.0, 1)
            ec_pct = round((econ_rank[s["stop_id"]] / (n - 1 or 1)) * 100.0, 1)
            s["equal_percentile"] = eq_pct
            s["economic_percentile"] = ec_pct

            def get_grade(pct):
                if pct >= 80.0: return "A"
                if pct >= 60.0: return "B"
                if pct >= 40.0: return "C"
                if pct >= 20.0: return "D"
                return "E"

            s["equal_grade"] = get_grade(eq_pct)
            s["economic_grade"] = get_grade(ec_pct)

    # Export
    output_asset = {
        "total_stops": len(stops_data),
        "da_scores": da_scores_export,
        "stops": stops_data
    }

    output_path = "public/data/bus_stop_vulnerability.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output_asset, f, indent=None)

    elapsed = round(time.time() - start_time, 2)
    print(f"\n✅ SUCCESS: Continuous Min-Max asset generated at '{output_path}' with {len(stops_data)} stops in {elapsed}s.")

if __name__ == '__main__':
    main()
