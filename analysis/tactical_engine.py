"""
🛡️ TACTICAL SERVICE PROTECTION & RESILIENCE (TSPR) 2.0
===========================================================
Calculates the Route Resilience Score (A-E) using refined expert methodology.

Methodology:
  1. VULNERABILITY CATCHMENT (35%): Distance-decay weighted "Social Gravity"
     within 400m of route stops.
  2. TEMPORAL ACCESS VALUE (25%): Real frequency ratio (Off-Peak / Peak).
     Rewards routes supporting night-shift and essential weekend travel.
  3. NETWORK MONOPOLY (25%): Identifies sole-provider corridors. 
     Weighted by frequency to distinguish high-value lifelines.
  4. ESSENTIAL OPPORTUNITY LINKAGE (15%): Direct count of Hospitals,
     Post-Secondary, Employment, and Schools served by stops.

Output: data/EDM/processed/route_defense_grades.json
"""

import pandas as pd
import numpy as np
import geopandas as gpd
import json
import os
from shapely.geometry import LineString, Point

# ── Paths ──────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data', 'EDM')
if not os.path.exists(DATA_DIR):
    DATA_DIR = os.path.join(BASE_DIR, 'ted-data-main', 'data', 'EDM')
if not os.path.exists(DATA_DIR):
    DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'YEG Transit Equity Dashboard', 'YEGTransitEquityModel3.0-2.26.26-main', 'YEGTransitEquityModel3.0-2.26.26-main', 'data', 'EDM'))

PROCESSED_DIR = os.path.join(DATA_DIR, 'processed')
RAW_DIR = os.path.join(DATA_DIR, 'raw')
OUTPUT_PATH = os.path.join(PROCESSED_DIR, 'route_defense_grades.json')
ENRICHED_INPUTS = os.path.join(PROCESSED_DIR, 'tspr_enriched_inputs.json')


def load_inputs():
    """Load all required datasets."""
    print("Loading inputs for TSPR 2.0 Engine...")

    # 1. Transit Routes
    routes_path = os.path.join(PROCESSED_DIR, 'transit_routes.json')
    if not os.path.exists(routes_path):
        raise FileNotFoundError(f"Missing {routes_path}")
    with open(routes_path) as f:
        routes_raw = json.load(f)

    all_routes = []
    for cat, route_list in routes_raw.items():
        for r in route_list:
            r['category'] = cat
            all_routes.append(r)

    # 2. Enriched Temporal & POI Data
    if not os.path.exists(ENRICHED_INPUTS):
        print("   ⚠️  Enriched inputs missing. Run analysis/recompute_tspr_inputs.py first.")
        enriched_data = {}
    else:
        with open(ENRICHED_INPUTS) as f:
            enriched_data = json.load(f)

    # 3. DA Boundaries
    geo_path = os.path.join(PROCESSED_DIR, 'da_boundaries.geojson')
    da_gdf = gpd.read_file(geo_path).to_crs(epsg=32612)
    da_gdf['DAUID'] = da_gdf['DAUID'].astype(str)

    # 4. Demographics
    demo_path = os.path.join(RAW_DIR, 'demographics.csv')
    demo_df = pd.read_csv(demo_path, dtype={'DAUID': str})

    return all_routes, enriched_data, da_gdf, demo_df


def build_route_geometries(all_routes):
    route_lines = []
    for r in all_routes:
        coords = r.get('coords', [])
        if len(coords) < 2: continue
        line_coords = [(c[1], c[0]) for c in coords]
        try:
            line = LineString(line_coords)
            route_lines.append({
                'route_id': r['route_id'], 'name': r.get('name', ''),
                'short_name': r.get('short_name', ''), 'category': r['category'],
                'trip_count': r.get('trip_count', 0), 'geometry': line
            })
        except: continue
    gdf = gpd.GeoDataFrame(route_lines, crs='EPSG:4326').to_crs(epsg=32612)
    return gdf


def compute_vulnerability_scores(demo_df):
    tp = demo_df['total_pop'].replace(0, 1)
    demo_df['vulnerability'] = demo_df[['low_income', 'minority', 'seniors']].sum(axis=1) / tp * 100
    demo_df['vulnerability'] = demo_df['vulnerability'].clip(0, 100).round(1)
    return demo_df


def spatial_join_decay(route_gdf, da_gdf, buffer_m=400):
    """Spatial join with distance decay calculation."""
    print("Calculating distance-decay catchment...")
    route_gdf['buffer_geom'] = route_gdf.geometry.buffer(buffer_m)
    route_buffered = route_gdf.set_geometry('buffer_geom')
    da_centroids = da_gdf.copy()
    da_centroids['geometry'] = da_centroids.geometry.centroid

    joined = gpd.sjoin(da_centroids[['DAUID', 'geometry']], route_buffered[['route_id', 'buffer_geom']].set_geometry('buffer_geom'),
                       how='inner', predicate='within')
    
    # Calculate exact distance from centroid to route line
    # (Not the buffer, but the actual route path)
    distances = []
    for idx, row in joined.iterrows():
        da_geom = row.geometry
        r_geom = route_gdf[route_gdf['route_id'] == row['route_id']].iloc[0].geometry
        dist = da_geom.distance(r_geom)
        distances.append(dist)
    
    joined['dist'] = distances
    # Linear Decay: 1.0 at 0m, 0.0 at buffer_m
    joined['decay_weight'] = (1 - (joined['dist'] / buffer_m)).clip(0, 1)
    
    return joined[['DAUID', 'route_id', 'decay_weight']]


def calculate_tspr_2(route_gdf, route_da_map, demo_df, enriched_data):
    print("Calculating TSPR 2.0 Grades...")
    
    # Merge demographics
    merged = route_da_map.merge(demo_df[['DAUID', 'total_pop', 'vulnerability']], on='DAUID', how='left')
    
    # PILLAR 1: VULNERABILITY (35%) - Distance Decay
    merged['social_gravity'] = merged['total_pop'] * merged['vulnerability'] * merged['decay_weight']
    p1 = merged.groupby('route_id').agg(
        total_pop_served=('total_pop', 'sum'),
        das_served=('DAUID', 'nunique'),
        p1_raw=('social_gravity', 'sum')
    ).reset_index()
    
    # PILLAR 2: TEMPORAL (25%) - Peak/Off-Peak Ratio
    p2_list = []
    for rid in p1['route_id']:
        stats = enriched_data.get(rid, {'trips_peak': 1, 'trips_night': 0})
        peak = max(stats.get('trips_peak', 1), 1)
        night = stats.get('trips_night', 0)
        ratio = (night / peak) * 100
        p2_list.append(ratio)
    p1['p2_raw'] = p2_list

    # PILLAR 3: MONOPOLY (25%) - Frequency Weighted
    da_counts = route_da_map.groupby('DAUID')['route_id'].nunique().reset_index()
    da_counts.columns = ['DAUID', 'num_routes']
    mono_map = route_da_map.merge(da_counts, on='DAUID')
    mono_map['is_monopoly'] = (mono_map['num_routes'] == 1).astype(int)
    
    p3 = mono_map.groupby('route_id').agg(monopoly_das=('is_monopoly', 'sum')).reset_index()
    p1 = p1.merge(p3, on='route_id', how='left')
    
    # Weight monopoly by log(trips) to reward "vital lifelines"
    p1['p3_raw'] = p1['monopoly_das'] * np.log1p(route_gdf.set_index('route_id').loc[p1['route_id']]['trip_count'].values)

    # PILLAR 4: OPPORTUNITY (15%) - Real POIs
    p1['p4_raw'] = [enriched_data.get(rid, {}).get('poi_score', 0) for rid in p1['route_id']]

    # ── Normalization (Min-Max) ──────────────────────────────────
    def min_max(col):
        c_min, c_max = col.min(), col.max()
        if c_max == c_min: return col * 0 + 50
        return (col - c_min) / (c_max - c_min) * 100

    p1['pillar_1'] = min_max(p1['p1_raw']).round(1)
    p1['pillar_2'] = min_max(p1['p2_raw']).round(1)
    p1['pillar_3'] = min_max(p1['p3_raw']).round(1)
    p1['pillar_4'] = min_max(p1['p4_raw']).round(1)

    # Composite
    p1['composite_score'] = (
        p1['pillar_1'] * 0.35 + p1['pillar_2'] * 0.25 +
        p1['pillar_3'] * 0.25 + p1['pillar_4'] * 0.15
    ).round(1)

    def get_grade(s):
        if s >= 80: return 'A'
        if s >= 65: return 'B'
        if s >= 50: return 'C'
        if s >= 35: return 'D'
        return 'E'
    p1['grade'] = p1['composite_score'].apply(get_grade)

    drivers = {
        'pillar_1': 'Vulnerability Density', 'pillar_2': 'Off Peak Service',
        'pillar_3': 'Network Monopoly', 'pillar_4': 'Critical Opportunity'
    }
    p1['primary_driver'] = p1[['pillar_1', 'pillar_2', 'pillar_3', 'pillar_4']].idxmax(axis=1).map(drivers)
    
    return p1


def save_results(df, route_gdf, route_da_map):
    route_gdf_4326 = route_gdf.to_crs(epsg=4326)
    results = []
    for _, row in df.iterrows():
        rid = row['route_id']
        geom = route_gdf_4326[route_gdf_4326['route_id'] == rid].iloc[0]
        da_list = route_da_map[route_da_map['route_id'] == rid]['DAUID'].tolist()
        
        # Get UTM geometry to calculate route length in kilometres
        utm_geom = route_gdf[route_gdf['route_id'] == rid].iloc[0].geometry
        length_km = round(utm_geom.length / 1000.0, 2)
        
        results.append({
            'route_id': str(rid), 'name': geom['name'], 'short_name': geom['short_name'],
            'grade': row['grade'], 'composite_score': float(row['composite_score']),
            'pillar_1_vulnerability': float(row['pillar_1']),
            'pillar_2_temporal': float(row['pillar_2']),
            'pillar_3_monopoly': float(row['pillar_3']),
            'pillar_4_opportunity': float(row['pillar_4']),
            'primary_driver': row['primary_driver'],
            'total_pop_served': int(row['total_pop_served']),
            'das_served': int(row['das_served']),
            'monopoly_das': int(row['monopoly_das']),
            'da_list': da_list,
            'coords': [[c[1], c[0]] for c in geom.geometry.coords],
            'trip_count': int(geom.get('trip_count', 0)),
            'category': str(geom.get('category', 'bus_regular')),
            'route_length_km': length_km
        })
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"TSPR 2.0 Complete. Results at {OUTPUT_PATH}")


def run():
    all_routes, enriched, da_gdf, demo_df = load_inputs()
    route_gdf = build_route_geometries(all_routes)
    demo_df = compute_vulnerability_scores(demo_df)
    route_da_map = spatial_join_decay(route_gdf, da_gdf)
    final_df = calculate_tspr_2(route_gdf, route_da_map, demo_df, enriched)
    save_results(final_df, route_gdf, route_da_map)

if __name__ == '__main__':
    run()
