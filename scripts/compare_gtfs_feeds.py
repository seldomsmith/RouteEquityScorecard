"""
Non-Destructive GTFS Comparative Analysis Pipeline (Phase 1)
Compares the current production dashboard baseline (`public/data/golden_route_record.json`)
against the new October 2026 ETS GTFS feed (`261002_1029` / `2026-10-16` release) across all
four Route Report Card equity categories:
  1. Vulnerability (CIMD 4-Dimension Score & 6-Indicator Social Gravity Z-Score)
  2. Off-Peak Service (`pillar_2_temporal`)
  3. Functional Monopoly (`pillar_3_monopoly`)
  4. Critical Opportunities (`pillar_4_opportunity`)

DOES NOT overwrite any live production files in `public/data/` or `data/golden_route_record.json`.
Outputs:
  - `scratch/golden_route_record_new.json`
  - `docs/gtfs_route_comparison.csv`
  - `docs/gtfs_comparison_report.md`
"""
import io
import json
import math
import os
import time
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict

import geopandas as gpd
import numpy as np
import pandas as pd
from pyproj import Transformer
from shapely.geometry import LineString, Point

WEIGHTS = {
    'pillar_1_vulnerability': 0.15,
    'pillar_2_temporal': 0.40,
    'pillar_3_monopoly': 0.10,
    'pillar_4_opportunity': 0.35,
}

ODT_NEIGHBOURHOODS = {
    'BRECKENRIDGE GREENS', 'EDGEMONT', 'POTTER GREENS', 'STEWART GREENS', 'THE HAMPTONS', 'RIVER CREE', 'ENOCH',
    'HAWKS RIDGE', 'KINOKAMAU PLAINS INDUSTRIAL', 'MISTATIM INDUSTRIAL', 'STARLING', 'TRUMPETER', 'WESTVIEW VILLAGE', 'WINTERBURN INDUSTRIAL',
    'BALWIN', 'MONTROSE', 'INDUSTRIAL HEIGHTS', 'CLOVERDALE', 'EASTGATE BUSINESS PARK',
    'AVONMORE', 'GAINER INDUSTRIAL', 'GIRARD INDUSTRIAL', 'KENILWORTH', 'KING EDWARD PARK',
    'ROPER INDUSTRIAL', 'WEIR INDUSTRIAL', 'ASPEN GARDENS', 'BROOKSIDE', 'FORT EDMONTON PARK', 'GRANDVIEW HEIGHTS', 'LANSDOWNE',
    'FALCONER HEIGHTS', 'HENDERSON ESTATES', 'JASPER PARK', 'LAURIER HEIGHTS', 'PARKVIEW', 'QUESNELL HEIGHTS', 'RIO TERRACE', 'SHERWOOD', 'VALLEY ZOO', 'WESTRIDGE',
    'CAMERON HEIGHTS', 'WEDGEWOOD HEIGHTS', 'BLACKBURNE', 'CASHMAN', 'CAVANAGH', 'THE HILLS AT CHARLESWORTH',
    'ALBANY', 'CHAMBERY', 'ELSINORE', 'NORTHWEST POLICE CAMPUS', 'RAMPART INDUSTRIAL', 'ASTER', 'TAMARACK', 'MAPLE',
    'BLACKMUD CREEK', 'GLENRIDDING RAVINE', 'GRAYDON HILL', 'HAYS RIDGE', 'KESWICK', 'RUNDLE PARK', 'RIVERDALE', 'WINDSOR PARK', 'BELGRAVIA', 'LENDRUM', 'MALMO PLAINS'
}


def percentile(values, p):
    sorted_v = sorted(values)
    if not sorted_v:
        return 0.0
    k = (len(sorted_v) - 1) * (p / 100.0)
    f = int(k)
    c = f + 1 if f + 1 < len(sorted_v) else f
    d = k - f
    return sorted_v[f] + d * (sorted_v[c] - sorted_v[f])


def zscore_normalize(values, target_mean=50.0, target_sd=20.0):
    n = len(values)
    if n == 0:
        return []
    raw_mean = sum(values) / n
    raw_sd = math.sqrt(sum((v - raw_mean) ** 2 for v in values) / n)
    if raw_sd == 0:
        return [target_mean] * n
    normalized = []
    for v in values:
        z = (v - raw_mean) / raw_sd
        score = target_mean + z * target_sd
        score = max(0.0, min(100.0, score))
        normalized.append(round(score, 2))
    return normalized


def sigmoid(x, midpoint=50.0, steepness=0.08):
    try:
        return 100.0 / (1.0 + math.exp(-steepness * (x - midpoint)))
    except OverflowError:
        return 0.0 if x < midpoint else 100.0


def parse_xlsx_raw(excel_path):
    """Native Python zipfile + XML parser for .xlsx to compute continuous Min-Max CIMD scores."""
    with zipfile.ZipFile(excel_path, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in ss_tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text = "".join([t.text or "" for t in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')])
                shared_strings.append(text)

        sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        sheet_data = sheet_tree.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData')

        rows = []
        for row_elem in sheet_data.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_vals = {}
            for cell in row_elem.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                r_ref = cell.attrib.get('r', '')
                t_type = cell.attrib.get('t', '')
                v_elem = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = v_elem.text if v_elem is not None else None
                if t_type == 's' and val is not None:
                    val = shared_strings[int(val)] if int(val) < len(shared_strings) else val
                col_letter = "".join([c for c in r_ref if c.isalpha()])
                row_vals[col_letter] = val
            rows.append(row_vals)

        df = pd.DataFrame(rows)
        header = df.iloc[0]
        df = df[1:].copy()
        df.columns = [str(c).strip() for c in header]
        return df


def load_continuous_cimd_scores(excel_path="data/prairies_scores_quintiles_EN.xlsx"):
    df_excel = parse_xlsx_raw(excel_path)
    da_col = next((c for c in df_excel.columns if 'DA' in c.upper() or 'DISSEMINATION' in c.upper()), None)
    econ_col = next((c for c in df_excel.columns if 'ECONOMIC' in c.upper() and ('FACTOR' in c.upper() or 'SCORE' in c.upper()) and 'QUINTILE' not in c.upper()), None)
    res_col = next((c for c in df_excel.columns if 'RESIDENTIAL' in c.upper() and ('FACTOR' in c.upper() or 'SCORE' in c.upper()) and 'QUINTILE' not in c.upper()), None)
    eth_col = next((c for c in df_excel.columns if 'ETHNO' in c.upper() and ('FACTOR' in c.upper() or 'SCORE' in c.upper()) and 'QUINTILE' not in c.upper()), None)
    sit_col = next((c for c in df_excel.columns if 'SITUATIONAL' in c.upper() and ('FACTOR' in c.upper() or 'SCORE' in c.upper()) and 'QUINTILE' not in c.upper()), None)

    df_excel['da_str'] = df_excel[da_col].astype(str).str.split('.').str[0].str.strip()
    for target, col in [('raw_econ', econ_col), ('raw_res', res_col), ('raw_eth', eth_col), ('raw_sit', sit_col)]:
        df_excel[target] = pd.to_numeric(df_excel[col], errors='coerce')

    def min_max_scale(series):
        min_v, max_v = series.min(), series.max()
        if max_v == min_v:
            return pd.Series(50.0, index=series.index)
        return 1.0 + 99.0 * ((series - min_v) / (max_v - min_v))

    df_excel['norm_econ'] = min_max_scale(df_excel['raw_econ'])
    df_excel['norm_res'] = min_max_scale(df_excel['raw_res'])
    df_excel['norm_eth'] = min_max_scale(df_excel['raw_eth'])
    df_excel['norm_sit'] = min_max_scale(df_excel['raw_sit'])

    cimd_scores = {}
    for _, row in df_excel.iterrows():
        da_str = row['da_str']
        if not da_str or da_str == 'nan':
            continue
        econ = round(float(row['norm_econ']), 1) if not pd.isna(row['norm_econ']) else 50.0
        res = round(float(row['norm_res']), 1) if not pd.isna(row['norm_res']) else 50.0
        eth = round(float(row['norm_eth']), 1) if not pd.isna(row['norm_eth']) else 50.0
        sit = round(float(row['norm_sit']), 1) if not pd.isna(row['norm_sit']) else 50.0
        equal_score = round((econ + res + eth + sit) / 4.0, 1)
        cimd_scores[da_str] = {
            "econ": econ,
            "res": res,
            "eth": eth,
            "sit": sit,
            "equal": equal_score,
            "economic": econ
        }
    return cimd_scores


def load_da_demographics_and_vi():
    df_demo = pd.read_csv('data/demographics.csv')
    total_pop = df_demo['total_pop'].fillna(0.0)

    def safe_pct(col_name):
        return (df_demo[col_name].fillna(0.0) / total_pop).fillna(0.0).replace([float('inf'), float('-inf')], 0.0) * 100.0

    df_demo['low_income_pct'] = safe_pct('low_income')
    df_demo['minority_pct'] = safe_pct('minority')
    df_demo['senior_pct'] = safe_pct('seniors')
    df_demo['lone_parent_pct'] = safe_pct('lone_parent')
    df_demo['recent_immigrant_pct'] = safe_pct('recent_immigrant')
    df_demo['youth_pct'] = safe_pct('youth_15_24')

    zero_pop_mask = (total_pop == 0)
    for col in ['low_income_pct', 'minority_pct', 'senior_pct', 'lone_parent_pct', 'recent_immigrant_pct', 'youth_pct']:
        df_demo.loc[zero_pop_mask, col] = 0.0

    populated_mask = (total_pop > 0)
    df_populated = df_demo[populated_mask].copy()

    indicators = {
        'low_income_pct': 'z_low_income',
        'minority_pct': 'z_minority',
        'senior_pct': 'z_seniors',
        'lone_parent_pct': 'z_lone_parents',
        'recent_immigrant_pct': 'z_recent_immigrants',
        'youth_pct': 'z_youth'
    }
    for z_col in indicators.values():
        df_demo[z_col] = 0.0

    for pct_col, z_col in indicators.items():
        mean_val = df_populated[pct_col].mean()
        std_val = df_populated[pct_col].std(ddof=0)
        if std_val > 0:
            df_demo.loc[populated_mask, z_col] = (df_demo.loc[populated_mask, pct_col] - mean_val) / std_val

    weighted_z = sum(df_demo[col] for col in indicators.values()) / 6.0
    df_demo['weighted_z'] = weighted_z

    min_wz = df_demo.loc[populated_mask, 'weighted_z'].min()
    max_wz = df_demo.loc[populated_mask, 'weighted_z'].max()
    df_demo['vulnerability_index'] = 0.0
    if max_wz > min_wz:
        df_demo.loc[populated_mask, 'vulnerability_index'] = 100.0 * (df_demo.loc[populated_mask, 'weighted_z'] - min_wz) / (max_wz - min_wz)

    for col in ['low_income_pct', 'minority_pct', 'senior_pct', 'lone_parent_pct', 'recent_immigrant_pct', 'youth_pct', 'vulnerability_index']:
        df_demo[col] = df_demo[col].round(2)

    neighbourhood_lookup = {}
    fallback_path = 'docs/da_vulnerability_sensitivity_mapped.csv'
    if os.path.exists(fallback_path):
        map_df = pd.read_csv(fallback_path, dtype={'DAID': str})
        neighbourhood_lookup = dict(zip(map_df['DAID'].str.strip(), map_df['Neighbourhood'].str.strip().str.upper()))

    for idx, row in df_demo.iterrows():
        dauid_str = str(int(float(row['DAUID'])))
        nh = neighbourhood_lookup.get(dauid_str, "UNKNOWN")
        if any(odt_nh in nh or nh in odt_nh for odt_nh in ODT_NEIGHBOURHOODS):
            df_demo.at[idx, 'vulnerability_index'] = round(df_demo.at[idx, 'vulnerability_index'] * 0.90, 2)

    da_lookup = {}
    for _, row in df_demo.iterrows():
        dauid_str = str(int(float(row['DAUID'])))
        da_lookup[dauid_str] = {
            'pop': int(row['total_pop']),
            'low_income_pct': float(row['low_income_pct']),
            'minority_pct': float(row['minority_pct']),
            'senior_pct': float(row['senior_pct']),
            'lone_parent_pct': float(row['lone_parent_pct']),
            'recent_immigrant_pct': float(row['recent_immigrant_pct']),
            'youth_pct': float(row['youth_pct']),
            'vulnerability_index': float(row['vulnerability_index']),
            'neighbourhood': neighbourhood_lookup.get(dauid_str, "UNKNOWN")
        }
    return da_lookup, neighbourhood_lookup


def ensure_latest_gtfs_zip():
    os.makedirs('scratch', exist_ok=True)
    zip_path = 'scratch/gtfs_20261016.zip'
    if not os.path.exists(zip_path):
        url = 'https://gtfs.edmonton.ca/TMGTFSRealTimeWebService/GTFS/gtfs.zip'
        print(f"  Downloading official ETS GTFS archive from {url} -> {zip_path}...")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req, timeout=30).read()
        with open(zip_path, 'wb') as f:
            f.write(data)
    return zip_path


def is_school_route(rid, sname):
    rid_s = str(rid).strip()
    sname_s = str(sname).strip()
    return rid_s.startswith('6') or sname_s.startswith('6') or rid_s.startswith('F6')


def is_regional_route(rid, sname):
    rid_s = str(rid).strip()
    sname_s = str(sname).strip()
    return (
        rid_s.startswith('A') or rid_s.startswith('L') or rid_s.startswith('4') or rid_s.startswith('F') or
        rid_s in ['540', '560', '747'] or
        sname_s.startswith('A') or sname_s.startswith('L') or sname_s.startswith('4') or sname_s.startswith('F') or
        sname_s in ['540', '560', '747']
    )


def main():
    start_t = time.time()
    print("=" * 72)
    print("GTFS COMPARATIVE ANALYSIS ENGINE (SHADOW PIPELINE - NON-DESTRUCTIVE)")
    print("=" * 72)

    # 1. Load Baseline Golden Record
    with open('public/data/golden_route_record.json', 'r', encoding='utf-8') as f:
        baseline_data = json.load(f)
    baseline_routes = {str(r['route_id']): r for r in baseline_data['routes']}
    print(f"[1/6] Loaded current baseline: {len(baseline_routes)} routes "
          f"({sum(1 for r in baseline_routes.values() if not r.get('is_regional'))} municipal, "
          f"{sum(1 for r in baseline_routes.values() if r.get('is_regional'))} regional).")

    # 2. Load CIMD & Census Demographic Lookups
    print("[2/6] Loading continuous Statistics Canada CIMD scores & Census DA demographics...")
    cimd_scores = load_continuous_cimd_scores()
    da_lookup, neighbourhood_lookup = load_da_demographics_and_vi()

    # Recompute baseline cimd_vuln_score using exact active 4-dimension formula in useReactiveScoring.ts
    for rid, r in baseline_routes.items():
        das = r.get('da_metadata', [])
        pop_sum = sum(d['pop'] for d in das if str(d['id']) in cimd_scores)
        vuln_sum = sum(cimd_scores[str(d['id'])]['equal'] * d['pop'] for d in das if str(d['id']) in cimd_scores)
        r['cimd_4dim_exact'] = round(vuln_sum / pop_sum, 2) if pop_sum > 0 else float(r.get('cimd_vuln_score', r['pillar_1_vulnerability']))

    # 3. Load DA Boundaries & Centroids in UTM Zone 12N (EPSG:32612)
    print("[3/6] Projecting Dissemination Area boundaries to UTM Zone 12N (EPSG:32612)...")
    da_gdf = gpd.read_file('public/data/da_boundaries_simple.geojson').to_crs(epsg=32612)
    da_gdf['DAUID'] = da_gdf['DAUID'].astype(str).str.strip()
    da_centroids = da_gdf.copy()
    da_centroids['geometry'] = da_centroids.geometry.centroid
    da_wgs84 = da_gdf.to_crs(epsg=4326)
    da_center_wgs84 = {
        row['DAUID']: [round(row.geometry.centroid.y, 5), round(row.geometry.centroid.x, 5)]
        for _, row in da_wgs84.iterrows()
    }
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:32612", always_xy=True)

    # 4. Ingest New GTFS Package (261002_1029 / 2026-10-16)
    print("[4/6] Ingesting new GTFS feed (routes, trips, shapes, stop_times)...")
    gtfs_zip_path = ensure_latest_gtfs_zip()
    with zipfile.ZipFile(gtfs_zip_path, 'r') as z:
        feed_info = pd.read_csv(z.open('feed_info.txt'), dtype=str).iloc[0].to_dict()
        print(f"  Feed Version: {feed_info.get('feed_version')} "
              f"({feed_info.get('feed_start_date')} to {feed_info.get('feed_end_date')})")
        routes_df = pd.read_csv(z.open('routes.txt'), dtype=str)
        trips_df = pd.read_csv(z.open('trips.txt'), usecols=['route_id', 'service_id', 'trip_id', 'trip_headsign', 'direction_id', 'shape_id'], dtype=str)
        shapes_df = pd.read_csv(z.open('shapes.txt'), dtype={'shape_id': str, 'shape_pt_lat': float, 'shape_pt_lon': float, 'shape_pt_sequence': int})

        # Merge split A/B branches (001A/001B -> 001, 509A/509B -> 509, 918A/918B -> 918) into single composite routes
        MERGE_AB_MAP = {
            '001A': '001', '001B': '001',
            '509A': '509', '509B': '509',
            '918A': '918', '918B': '918',
        }
        routes_df['route_id'] = routes_df['route_id'].str.strip().replace(MERGE_AB_MAP)
        routes_df['route_short_name'] = routes_df['route_short_name'].str.strip().replace(MERGE_AB_MAP)
        routes_df = routes_df.drop_duplicates(subset=['route_id'], keep='first').copy()
        trips_df['orig_route_id'] = trips_df['route_id'].str.strip()
        trips_df['route_id'] = trips_df['orig_route_id'].replace(MERGE_AB_MAP)

        # Stream stop_times.txt to collect:
        # (a) First departure time per trip_id (for Pillar 2 peak vs night ratio)
        # (b) Unique stop_ids served per route_id (for Pillar 3 & Pillar 4 POI catchments)
        trip_to_route = dict(zip(trips_df['trip_id'], trips_df['route_id']))
        trip_first_dep = {}
        route_stops = defaultdict(set)

        print("  Streaming stop_times.txt for temporal windows & stop-route linkages...")
        with z.open('stop_times.txt') as st_f:
            for chunk in pd.read_csv(st_f, usecols=['trip_id', 'departure_time', 'stop_id', 'stop_sequence'], chunksize=500000, dtype=str):
                chunk['rid'] = chunk['trip_id'].map(trip_to_route)
                for rid, grp in chunk.groupby('rid'):
                    route_stops[rid].update(grp['stop_id'].unique())
                seq1 = chunk[chunk['stop_sequence'] == '1']
                for tid, dep in zip(seq1['trip_id'], seq1['departure_time']):
                    trip_first_dep[tid] = dep

    # Reconstruct exact per-stop POI catchments from `data/destination_catchments.json`
    with open('data/destination_catchments.json', 'r', encoding='utf-8') as f:
        orig_catchments = {str(k): set(v) for k, v in json.load(f).items()}

    stop_to_hist_routes = defaultdict(list)
    for rid, sset in route_stops.items():
        if rid in orig_catchments and len(orig_catchments[rid]) > 0:
            for sid in sset:
                stop_to_hist_routes[sid].append(rid)

    stop_pois = {}
    for sid, rids in stop_to_hist_routes.items():
        stop_pois[sid] = set.intersection(*(orig_catchments[r] for r in rids))

    # Build new route catchments from stop_pois
    new_catchments = {}
    for rid, sset in route_stops.items():
        if rid in orig_catchments:
            # Reconstruct from current stops (reflects any stop additions/removals)
            recon = set().union(*(stop_pois.get(s, set()) for s in sset)) if sset else set()
            new_catchments[rid] = recon if recon else orig_catchments[rid]
        else:
            new_catchments[rid] = set().union(*(stop_pois.get(s, set()) for s in sset)) if sset else set()

    # Pre-group shapes by shape_id
    shapes_sorted = shapes_df.sort_values(['shape_id', 'shape_pt_sequence'])
    shape_coords_map = {}
    for sh_id, grp in shapes_sorted.groupby('shape_id'):
        pts = list(zip(grp['shape_pt_lat'], grp['shape_pt_lon']))
        shape_coords_map[sh_id] = pts

    # 5. Build New Route Objects & Raw Pillar Metrics
    print("[5/6] Computing spatial catchments and raw pillar scores for new GTFS routes...")
    trip_counts_by_route = trips_df['route_id'].value_counts().to_dict()

    # Peak (07:30-08:30) and Night (21:30-22:30) trip counts per route
    peak_trips_by_route = defaultdict(int)
    night_trips_by_route = defaultdict(int)
    for tid, dep in trip_first_dep.items():
        if not isinstance(dep, str):
            continue
        rid = trip_to_route.get(tid)
        if '07:30:00' <= dep <= '08:30:00':
            peak_trips_by_route[rid] += 1
        if '21:30:00' <= dep <= '22:30:00':
            night_trips_by_route[rid] += 1

    new_routes_list = []
    for _, r_row in routes_df.iterrows():
        rid = str(r_row['route_id']).strip()
        sname = str(r_row.get('route_short_name', rid)).strip()
        lname = str(r_row.get('route_long_name', '')).strip()

        if is_school_route(rid, sname):
            continue

        r_trips = trips_df[trips_df['route_id'] == rid]
        if r_trips.empty:
            continue

        # Select primary representative shape:
        # Filter to main service shapes (>= 20% of max shape frequency for this route)
        # and choose the longest main shape so directional loops (e.g. 527, 921) use full alignment
        # while ignoring 1-trip or 6-trip garage pull-out short turns (e.g. 004, 007, 507, 904).
        first_shape_id = r_trips['shape_id'].iloc[0]
        sh_vc = r_trips['shape_id'].value_counts()
        max_sh_count = sh_vc.iloc[0]
        candidate_shapes = [sh for sh, cnt in sh_vc.items() if cnt >= max_sh_count * 0.20]
        top_shape_id = max(
            candidate_shapes,
            key=lambda sh: len(shape_coords_map.get(sh, []))
        )

        raw_pts = shape_coords_map.get(top_shape_id, [])
        # Decimate by 2 if > 200 points to match golden_route_record coordinate density
        coords = [[float(lat), float(lon)] for lat, lon in (raw_pts[::2] if len(raw_pts) > 200 else raw_pts)]
        if len(raw_pts) >= 2 and coords[-1] != [float(raw_pts[-1][0]), float(raw_pts[-1][1])]:
            coords.append([float(raw_pts[-1][0]), float(raw_pts[-1][1])])

        # Project line to EPSG:32612 (for merged A/B routes 001, 509, 918, union both main branch geometries for DA distance check)
        if len(raw_pts) >= 2:
            utm_pts = [transformer.transform(lon, lat) for lat, lon in raw_pts]
            primary_line = LineString(utm_pts)
            length_km = round(primary_line.length / 1000.0, 2)
            if rid in ('001', '509', '918') and len(candidate_shapes) > 1:
                from shapely.ops import unary_union
                branch_lines = []
                for sh_cand in candidate_shapes:
                    pts_cand = shape_coords_map.get(sh_cand, [])
                    if len(pts_cand) >= 2:
                        branch_lines.append(LineString([transformer.transform(lon, lat) for lat, lon in pts_cand]))
                route_line = unary_union(branch_lines) if branch_lines else primary_line
            else:
                route_line = primary_line
        else:
            route_line = None
            length_km = 0.0

        # Find DAs with centroid within 400m of route_line (with polygon buffer fallback for large industrial DAs like Route 505)
        da_list = []
        da_metadata = []
        total_social_gravity = 0.0
        total_pop_served = 0

        if route_line is not None:
            dists = da_centroids.geometry.distance(route_line)
            within_mask = dists <= 400.0
            matched_das = da_centroids[within_mask]
            if matched_das.empty:
                # Industrial corridor fallback: DAs whose polygon intersects 400m buffer
                poly_mask = da_gdf.geometry.intersects(route_line.buffer(400.0))
                matched_das = da_centroids[poly_mask]
            for idx_da, da_row in matched_das.iterrows():
                da_id = str(da_row['DAUID'])
                dist_m = float(dists.loc[idx_da])
                decay_weight = max(0.05, 1.0 - (dist_m / 400.0)) if dist_m <= 400.0 else 0.10
                da_info = da_lookup.get(da_id, {
                    'pop': 0, 'low_income_pct': 0.0, 'minority_pct': 0.0,
                    'senior_pct': 0.0, 'lone_parent_pct': 0.0,
                    'recent_immigrant_pct': 0.0, 'youth_pct': 0.0,
                    'vulnerability_index': 0.0, 'neighbourhood': 'UNKNOWN'
                })
                pop = da_info['pop']
                vi = da_info['vulnerability_index']
                total_social_gravity += pop * vi * decay_weight
                total_pop_served += pop
                da_list.append(da_id)
                da_metadata.append({
                    'id': da_id,
                    'pop': pop,
                    'low_income_pct': da_info['low_income_pct'],
                    'minority_pct': da_info['minority_pct'],
                    'senior_pct': da_info['senior_pct'],
                    'lone_parent_pct': da_info['lone_parent_pct'],
                    'recent_immigrant_pct': da_info['recent_immigrant_pct'],
                    'youth_pct': da_info['youth_pct'],
                    'vulnerability_index': vi,
                    'neighbourhood': da_info['neighbourhood'],
                    'center': da_center_wgs84.get(da_id, [53.5444, -113.4909])
                })

        da_metadata.sort(key=lambda x: x['pop'], reverse=True)

        # Compute CIMD 4-Dimension Equal-Weighted Route Vulnerability Score
        cimd_pop_sum = sum(d['pop'] for d in da_metadata if str(d['id']) in cimd_scores)
        cimd_vuln_sum = sum(cimd_scores[str(d['id'])]['equal'] * d['pop'] for d in da_metadata if str(d['id']) in cimd_scores)
        cimd_4dim_exact = round(cimd_vuln_sum / cimd_pop_sum, 2) if cimd_pop_sum > 0 else 50.0
        cimd_vuln_score = int(round(cimd_4dim_exact))

        # Pillar 2 raw: night / peak ratio
        t_peak = max(peak_trips_by_route.get(rid, 0), 1)
        t_night = night_trips_by_route.get(rid, 0)
        p2_raw = (t_night / t_peak) * 100.0 if peak_trips_by_route.get(rid, 0) > 0 else 0.0

        # Pillar 4 raw: POI catchment count
        p4_raw = float(len(new_catchments.get(rid, set())))

        # Preserve baseline route name formatting ("001 — Downtown - Capilano")
        if rid in baseline_routes:
            display_name = baseline_routes[rid]['name']
            category = baseline_routes[rid].get('category', 'bus_regular')
        else:
            display_name = f"{sname} — {lname}" if lname else sname
            category = 'lrt' if rid.endswith('R') else ('bus_high_freq' if len(rid) == 3 and rid.startswith('0') else 'bus_regular')

        new_routes_list.append({
            'route_id': rid,
            'name': display_name,
            'short_name': sname,
            'is_regional': is_regional_route(rid, sname),
            'trip_count': int(trip_counts_by_route.get(rid, 0)),
            'route_length_km': length_km,
            'total_pop_served': int(total_pop_served),
            'das_served': len(da_list),
            'da_list': da_list,
            'da_metadata': da_metadata,
            'coords': coords,
            'category': category,
            'cimd_vuln_score': cimd_vuln_score,
            'cimd_4dim_exact': cimd_4dim_exact,
            'p1_raw': round(total_social_gravity, 2),
            'p2_raw': round(p2_raw, 2),
            'p4_raw': round(p4_raw, 2),
            'top_shape_id': top_shape_id,
            'first_shape_id': first_shape_id,
        })

    # Compute Pillar 3 (Continuous Functional Monopoly Index) across all new routes
    da_to_routes = defaultdict(list)
    for r in new_routes_list:
        for da_id in r['da_list']:
            da_to_routes[da_id].append(r['route_id'])

    trip_lookup = {r['route_id']: float(r['trip_count']) for r in new_routes_list}

    for r in new_routes_list:
        rid = r['route_id']
        route_dests = new_catchments.get(rid, set())
        route_cap = trip_lookup.get(rid, 0.0)
        total_fmi = 0.0

        for da_id in r['da_list']:
            if not route_dests:
                continue
            alternatives = [alt_id for alt_id in da_to_routes.get(da_id, []) if alt_id != rid]
            if not alternatives:
                da_fmi = 1.0
            else:
                da_fmi_sum = 0.0
                for dest in route_dests:
                    dest_alts = [alt_id for alt_id in alternatives if dest in new_catchments.get(alt_id, set())]
                    alt_cap_sum = sum(trip_lookup.get(alt_id, 0.0) for alt_id in dest_alts)
                    dest_fmi = route_cap / (route_cap + alt_cap_sum) if (route_cap + alt_cap_sum) > 0 else 0.0
                    da_fmi_sum += dest_fmi
                da_fmi = da_fmi_sum / len(route_dests)

            nh = neighbourhood_lookup.get(da_id, 'UNKNOWN')
            if any(odt_nh in nh or nh in odt_nh for odt_nh in ODT_NEIGHBOURHOODS):
                da_fmi *= 0.50
            total_fmi += da_fmi

        r['monopoly_das'] = total_fmi
        r['p3_raw'] = round(total_fmi * math.log1p(route_cap), 2)

    # Separate Municipal vs Regional routes and run Phase A Normalization (Cap 95th -> Z-Score -> Sigmoid -> Quintiles)
    muni_routes = [r for r in new_routes_list if not r['is_regional']]
    reg_routes = [r for r in new_routes_list if r['is_regional']]

    for raw_key, norm_key in [
        ('p1_raw', 'pillar_1_vulnerability'),
        ('p2_raw', 'pillar_2_temporal'),
        ('p3_raw', 'pillar_3_monopoly'),
        ('p4_raw', 'pillar_4_opportunity'),
    ]:
        vals = [r[raw_key] for r in muni_routes]
        cap = percentile(vals, 95)
        capped_vals = [min(v, cap) for v in vals]
        norm_vals = zscore_normalize(capped_vals, target_mean=50.0, target_sd=20.0)
        for i, r in enumerate(muni_routes):
            r[norm_key] = norm_vals[i]

    # Compute Composite Score (both Static Z-Score P1 and Dynamic CIMD P1 matching useReactiveScoring.ts)
    n_muni = len(muni_routes)
    raw_comps = []
    cimd_raw_comps = []
    for r in muni_routes:
        c_static = (
            r['pillar_1_vulnerability'] * WEIGHTS['pillar_1_vulnerability'] +
            r['pillar_2_temporal'] * WEIGHTS['pillar_2_temporal'] +
            r['pillar_3_monopoly'] * WEIGHTS['pillar_3_monopoly'] +
            r['pillar_4_opportunity'] * WEIGHTS['pillar_4_opportunity']
        )
        c_cimd = (
            r['cimd_4dim_exact'] * WEIGHTS['pillar_1_vulnerability'] +
            r['pillar_2_temporal'] * WEIGHTS['pillar_2_temporal'] +
            r['pillar_3_monopoly'] * WEIGHTS['pillar_3_monopoly'] +
            r['pillar_4_opportunity'] * WEIGHTS['pillar_4_opportunity']
        )
        r['composite_raw'] = c_static
        r['cimd_composite_raw'] = c_cimd
        raw_comps.append(c_static)
        cimd_raw_comps.append(c_cimd)

    comp_mean = sum(raw_comps) / n_muni
    comp_sd = math.sqrt(sum((v - comp_mean) ** 2 for v in raw_comps) / n_muni)
    steepness = 4.0 / (2.0 * comp_sd) if comp_sd > 0 else 0.08

    for r in muni_routes:
        r['composite_score'] = round(sigmoid(r['composite_raw'], comp_mean, steepness), 2)

    sorted_scores = sorted(r['composite_score'] for r in muni_routes)
    cuts = [sorted_scores[int(n_muni * p)] for p in [0.2, 0.4, 0.6, 0.8]]
    grade_counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0}

    drivers_map = {
        'pillar_1_vulnerability': 'Vulnerability Density',
        'pillar_2_temporal': 'Off Peak Service',
        'pillar_3_monopoly': 'Network Monopoly',
        'pillar_4_opportunity': 'Critical Opportunity'
    }

    for r in muni_routes:
        s = r['composite_score']
        if s >= cuts[3]:
            r['grade'] = 'A'
        elif s >= cuts[2]:
            r['grade'] = 'B'
        elif s >= cuts[1]:
            r['grade'] = 'C'
        elif s >= cuts[0]:
            r['grade'] = 'D'
        else:
            r['grade'] = 'E'
        grade_counts[r['grade']] += 1
        top_p = max(WEIGHTS.keys(), key=lambda k: r[k])
        r['primary_driver'] = drivers_map[top_p]

    for r in reg_routes:
        r['pillar_1_vulnerability'] = 0.0
        r['pillar_2_temporal'] = 0.0
        r['pillar_3_monopoly'] = 0.0
        r['pillar_4_opportunity'] = 0.0
        r['composite_score'] = 0.0
        r['grade'] = 'Regional'
        r['primary_driver'] = 'Regional'

    all_new_routes = muni_routes + reg_routes
    new_routes_by_id = {r['route_id']: r for r in all_new_routes}

    # Save shadow golden record
    shadow_payload = {
        'metadata': {
            'version': '2.1-GTFS-261002_1029-Shadow',
            'city': 'Edmonton',
            'generated_at': pd.Timestamp.now().isoformat(),
            'feed_version': feed_info.get('feed_version'),
            'stats': {
                'avg_composite': round(sum(r['composite_score'] for r in muni_routes) / n_muni, 1),
                'max_pop_served': max(r['total_pop_served'] for r in muni_routes),
                'grade_distribution': grade_counts
            },
            'scoring': {
                'normalization': 'z-score (mean=50, SD=20)',
                'outlier_cap': '95th percentile',
                'composite_transform': 'sigmoid',
                'sigmoid_midpoint': round(comp_mean, 2),
                'sigmoid_steepness': round(steepness, 4),
                'grading': 'quintile-based relative'
            }
        },
        'routes': all_new_routes
    }
    with open('scratch/golden_route_record_new.json', 'w', encoding='utf-8') as f:
        json.dump(shadow_payload, f, indent=2)

    # 6. Recompute Clean Bug-Fixed Baseline (fixing the legacy drop_duplicates('route_id') short-turn truncation bug
    # on the Summer 2026 baseline while keeping Summer 2026 trip counts, off-peak ratios, and route inventory)
    print("[6/7] Recomputing clean bug-fixed Summer 2026 baseline (isolating true schedule shifts from legacy geometry truncation)...")
    fixed_baseline_list = []
    for rid, old_r in baseline_routes.items():
        r_copy = json.loads(json.dumps(old_r))
        # If the route exists in the full-corridor spatial pass and had a truncated stub in the legacy pipeline,
        # restore its full-corridor DA catchment and geometry while keeping its Summer 2026 schedule metrics (trip_count, pillar_2_temporal)
        if rid in new_routes_by_id and not r_copy.get('is_regional'):
            nr = new_routes_by_id[rid]
            r_copy['coords'] = nr['coords']
            r_copy['route_length_km'] = nr['route_length_km']
            r_copy['das_served'] = nr['das_served']
            r_copy['da_list'] = nr['da_list']
            r_copy['da_metadata'] = nr['da_metadata']
            r_copy['total_pop_served'] = nr['total_pop_served']
            r_copy['cimd_vuln_score'] = nr['cimd_vuln_score']
            r_copy['cimd_4dim_exact'] = nr['cimd_4dim_exact']
            r_copy['p1_raw'] = nr['p1_raw']
        else:
            r_copy['p1_raw'] = float(r_copy.get('pillar_1_vulnerability', 0.0))
        fixed_baseline_list.append(r_copy)

    # Recompute Pillar 3 (Functional Monopoly) on the bug-fixed baseline using Summer 2026 trip_count and full-corridor DA lists
    base_da_to_routes = defaultdict(list)
    for r in fixed_baseline_list:
        for da_id in r.get('da_list', []):
            base_da_to_routes[str(da_id)].append(r['route_id'])

    base_trip_lookup = {r['route_id']: float(r.get('trip_count', 0)) for r in fixed_baseline_list}

    for r in fixed_baseline_list:
        rid = r['route_id']
        if r.get('is_regional'):
            continue
        route_dests = orig_catchments.get(rid, new_catchments.get(rid, set()))
        route_cap = base_trip_lookup.get(rid, 0.0)
        total_fmi = 0.0
        for da_id in r.get('da_list', []):
            da_str = str(da_id)
            if not route_dests:
                continue
            alternatives = [alt_id for alt_id in base_da_to_routes.get(da_str, []) if alt_id != rid]
            if not alternatives:
                da_fmi = 1.0
            else:
                da_fmi_sum = 0.0
                for dest in route_dests:
                    dest_alts = [alt_id for alt_id in alternatives if dest in orig_catchments.get(alt_id, new_catchments.get(alt_id, set()))]
                    alt_cap_sum = sum(base_trip_lookup.get(alt_id, 0.0) for alt_id in dest_alts)
                    dest_fmi = route_cap / (route_cap + alt_cap_sum) if (route_cap + alt_cap_sum) > 0 else 0.0
                    da_fmi_sum += dest_fmi
                da_fmi = da_fmi_sum / len(route_dests)
            nh = neighbourhood_lookup.get(da_str, 'UNKNOWN')
            if any(odt_nh in nh or nh in odt_nh for odt_nh in ODT_NEIGHBOURHOODS):
                da_fmi *= 0.50
            total_fmi += da_fmi
        r['monopoly_das'] = total_fmi
        r['p3_raw'] = round(total_fmi * math.log1p(route_cap), 2)
        r['p4_raw'] = float(len(route_dests))

    base_muni = [r for r in fixed_baseline_list if not r.get('is_regional')]
    base_reg = [r for r in fixed_baseline_list if r.get('is_regional')]

    # Normalize P1, P3, P4 on bug-fixed baseline (keeping Summer 2026 P2 off-peak scores intact)
    for raw_key, norm_key in [
        ('p1_raw', 'pillar_1_vulnerability'),
        ('p3_raw', 'pillar_3_monopoly'),
        ('p4_raw', 'pillar_4_opportunity'),
    ]:
        vals = [r[raw_key] for r in base_muni]
        cap = percentile(vals, 95)
        capped_vals = [min(v, cap) for v in vals]
        norm_vals = zscore_normalize(capped_vals, target_mean=50.0, target_sd=20.0)
        for i, r in enumerate(base_muni):
            r[norm_key] = norm_vals[i]

    n_base_muni = len(base_muni)
    base_raw_comps = []
    for r in base_muni:
        c_static = (
            r['pillar_1_vulnerability'] * WEIGHTS['pillar_1_vulnerability'] +
            r['pillar_2_temporal'] * WEIGHTS['pillar_2_temporal'] +
            r['pillar_3_monopoly'] * WEIGHTS['pillar_3_monopoly'] +
            r['pillar_4_opportunity'] * WEIGHTS['pillar_4_opportunity']
        )
        r['composite_raw'] = c_static
        base_raw_comps.append(c_static)

    b_mean = sum(base_raw_comps) / n_base_muni
    b_sd = math.sqrt(sum((v - b_mean) ** 2 for v in base_raw_comps) / n_base_muni)
    b_steep = 4.0 / (2.0 * b_sd) if b_sd > 0 else 0.08
    for r in base_muni:
        r['composite_score'] = round(sigmoid(r['composite_raw'], b_mean, b_steep), 2)

    b_sorted = sorted(r['composite_score'] for r in base_muni)
    b_cuts = [b_sorted[int(n_base_muni * p)] for p in [0.2, 0.4, 0.6, 0.8]]
    b_grade_counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0}
    for r in base_muni:
        s = r['composite_score']
        r['grade'] = 'A' if s >= b_cuts[3] else ('B' if s >= b_cuts[2] else ('C' if s >= b_cuts[1] else ('D' if s >= b_cuts[0] else 'E')))
        b_grade_counts[r['grade']] += 1
        top_p = max(WEIGHTS.keys(), key=lambda k: r[k])
        r['primary_driver'] = drivers_map[top_p]

    fixed_baseline_by_id = {r['route_id']: r for r in (base_muni + base_reg)}

    fixed_baseline_payload = {
        'metadata': {
            **baseline_data.get('metadata', {}),
            'version': '2.0-Summer2026-GeometryFixed',
            'stats': {
                'avg_composite': round(sum(r['composite_score'] for r in base_muni) / n_base_muni, 1),
                'max_pop_served': max(r['total_pop_served'] for r in base_muni),
                'grade_distribution': b_grade_counts
            }
        },
        'routes': base_muni + base_reg
    }
    with open('scratch/golden_route_record_baseline_fixed.json', 'w', encoding='utf-8') as f:
        json.dump(fixed_baseline_payload, f, indent=2)

    # 7. Build Route-by-Route Comparative Table (comparing Clean Bug-Fixed Baseline vs. October 2026 GTFS)
    print("[7/7] Generating comparative analysis CSV (Clean Bug-Fixed Baseline vs. October 2026)...")
    comparison_rows = []

    all_route_ids = sorted(set(fixed_baseline_by_id.keys()) | set(new_routes_by_id.keys()))
    for rid in all_route_ids:
        old_r = fixed_baseline_by_id.get(rid)
        raw_old_r = baseline_routes.get(rid)
        new_r = new_routes_by_id.get(rid)

        status = 'Unchanged ID'
        if rid in ('001', '509', '918') and old_r and new_r:
            status = f"Merged {rid}A/{rid}B -> {rid}"
        elif old_r is None:
            status = 'New Route'
        elif new_r is None:
            status = 'Retired / Removed'

        row = {
            'route_id': rid,
            'name': (new_r or old_r)['name'],
            'status': status,
            'is_regional': (new_r or old_r).get('is_regional', False),
            'old_grade': old_r['grade'] if old_r else None,
            'new_grade': new_r['grade'] if new_r else None,
            'old_composite': old_r['composite_score'] if old_r else None,
            'new_composite': new_r['composite_score'] if new_r else None,
            'delta_composite': round(new_r['composite_score'] - old_r['composite_score'], 2) if (old_r and new_r) else None,
            # Category 1: Vulnerability (CIMD 4-Dimension & Social Gravity Z-score)
            'old_cimd_vuln': old_r['cimd_4dim_exact'] if old_r else None,
            'new_cimd_vuln': new_r['cimd_4dim_exact'] if new_r else None,
            'delta_cimd_vuln': round(new_r['cimd_4dim_exact'] - old_r['cimd_4dim_exact'], 2) if (old_r and new_r) else None,
            'old_p1_vuln_z': old_r['pillar_1_vulnerability'] if old_r else None,
            'new_p1_vuln_z': new_r['pillar_1_vulnerability'] if new_r else None,
            'delta_p1_vuln_z': round(new_r['pillar_1_vulnerability'] - old_r['pillar_1_vulnerability'], 2) if (old_r and new_r) else None,
            # Category 2: Off-Peak Service (Pillar 2)
            'old_p2_offpeak': old_r['pillar_2_temporal'] if old_r else None,
            'new_p2_offpeak': new_r['pillar_2_temporal'] if new_r else None,
            'delta_p2_offpeak': round(new_r['pillar_2_temporal'] - old_r['pillar_2_temporal'], 2) if (old_r and new_r) else None,
            # Category 3: Functional Monopoly (Pillar 3)
            'old_p3_monopoly': old_r['pillar_3_monopoly'] if old_r else None,
            'new_p3_monopoly': new_r['pillar_3_monopoly'] if new_r else None,
            'delta_p3_monopoly': round(new_r['pillar_3_monopoly'] - old_r['pillar_3_monopoly'], 2) if (old_r and new_r) else None,
            # Category 4: Opportunities (Pillar 4)
            'old_p4_opportunity': old_r['pillar_4_opportunity'] if old_r else None,
            'new_p4_opportunity': new_r['pillar_4_opportunity'] if new_r else None,
            'delta_p4_opportunity': round(new_r['pillar_4_opportunity'] - old_r['pillar_4_opportunity'], 2) if (old_r and new_r) else None,
            # Structural Metadata
            'old_das_served': old_r['das_served'] if old_r else None,
            'new_das_served': new_r['das_served'] if new_r else None,
            'delta_das': (new_r['das_served'] - old_r['das_served']) if (old_r and new_r) else None,
            'old_pop_served': old_r['total_pop_served'] if old_r else None,
            'new_pop_served': new_r['total_pop_served'] if new_r else None,
            'delta_pop': (new_r['total_pop_served'] - old_r['total_pop_served']) if (old_r and new_r) else None,
            'old_trips': old_r['trip_count'] if old_r else None,
            'new_trips': new_r['trip_count'] if new_r else None,
            'delta_trips': (new_r['trip_count'] - old_r['trip_count']) if (old_r and new_r) else None,
            'old_length_km': old_r.get('route_length_km') if old_r else None,
            'new_length_km': new_r.get('route_length_km') if new_r else None,
            'legacy_unfixed_das': raw_old_r['das_served'] if raw_old_r else None,
            'legacy_unfixed_composite': raw_old_r['composite_score'] if raw_old_r else None,
        }
        comparison_rows.append(row)

    df_comp = pd.DataFrame(comparison_rows)
    csv_out = 'docs/gtfs_route_comparison.csv'
    df_comp.to_csv(csv_out, index=False)
    print(f"[SUCCESS] Wrote full route comparison table ({len(df_comp)} rows) to '{csv_out}'.")
    print(f"Completed in {time.time() - start_t:.2f}s.")


if __name__ == '__main__':
    main()
