"""
Build Destination Catchments
Maps OpenStreetMap/Census POIs to transit routes based on a 400m physical buffer of their stops.
Saves the mapping to `data/destination_catchments.json`.
"""
import json
import os
import pandas as pd
import numpy as np
from pyproj import Transformer
from scipy.spatial import KDTree

def main():
    print("=" * 60)
    print("BUILDING DESTINATION CATCHMENTS")
    print("=" * 60)

    # Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Locate route_stops.json and pois_mapped.csv in dashboard workspace
    dashboard_dir = os.path.abspath(os.path.join(BASE_DIR, '..', 'YEG Transit Equity Dashboard', 'YEGTransitEquityModel3.0-2.26.26-main', 'YEGTransitEquityModel3.0-2.26.26-main'))
    if not os.path.exists(dashboard_dir):
        dashboard_dir = os.path.abspath(os.path.join(BASE_DIR, '..', 'YEG Transit Equity Dashboard'))
        
    route_stops_path = os.path.join(dashboard_dir, 'data', 'EDM', 'processed', 'route_stops.json')
    pois_mapped_path = os.path.join(dashboard_dir, 'data', 'EDM', 'processed', 'pois_mapped.csv')

    print(f"Loading route stops from: {route_stops_path}")
    print(f"Loading POIs from: {pois_mapped_path}")

    if not os.path.exists(route_stops_path):
        raise FileNotFoundError(f"Missing route_stops.json at {route_stops_path}")
    if not os.path.exists(pois_mapped_path):
        raise FileNotFoundError(f"Missing pois_mapped.csv at {pois_mapped_path}")

    # 1. Load data
    with open(route_stops_path, 'r', encoding='utf-8') as f:
        route_stops = json.load(f)
    df_pois = pd.read_csv(pois_mapped_path)
    
    print(f"Loaded {len(route_stops)} routes and {len(df_pois)} POIs.")

    # 2. Project coordinates to UTM Zone 12N (EPSG:32612) for accurate metric distance queries
    print("Projecting coordinates to UTM Zone 12N...")
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:32612", always_xy=True)

    # Project POIs
    poi_lons = df_pois['lon'].values
    poi_lats = df_pois['lat'].values
    poi_x, poi_y = transformer.transform(poi_lons, poi_lats)
    poi_coords = np.column_stack((poi_x, poi_y))

    # Identify hospital POIs dynamically using a robust column sniff
    is_hospital = pd.Series(False, index=df_pois.index)
    for col in ['category', 'theme', 'amenity', 'poi_type', 'type']:
        if col in df_pois.columns:
            is_hospital |= df_pois[col].astype(str).str.lower().str.contains('hospital|emergency_room', na=False)
    hospital_indices = set(df_pois[is_hospital].index)
    print(f"   Sniffed {len(hospital_indices)} Hospital/Emergency POIs in dataset.")

    # Build KDTree for fast spatial queries
    poi_tree = KDTree(poi_coords)

    # 3. For each route, map POIs (400m standard catchment, 800m for hospitals)
    print("Mapping POIs to routes (400m standard, 800m hospital catchment)...")
    catchments = {}
    
    for route_id, stops in route_stops.items():
        if not stops:
            catchments[route_id] = []
            continue
        
        # Project stops
        stop_lons = [s['lon'] for s in stops]
        stop_lats = [s['lat'] for s in stops]
        stop_x, stop_y = transformer.transform(stop_lons, stop_lats)
        stop_coords = np.column_stack((stop_x, stop_y))
        
        # Query KDTree for POIs
        matched_poi_indices = set()
        for coord in stop_coords:
            # 1. Standard POIs within 400m
            indices_400 = poi_tree.query_ball_point(coord, r=400.0)
            matched_poi_indices.update(indices_400)
            
            # 2. Hospital POIs within 800m
            indices_800 = poi_tree.query_ball_point(coord, r=800.0)
            hospitals_800 = [idx for idx in indices_800 if idx in hospital_indices]
            matched_poi_indices.update(hospitals_800)
            
        # Convert indices to POI identifiers
        # We can use the integer index as a unique POI ID
        catchments[route_id] = sorted(list(matched_poi_indices))
        
    # Create data directory if it doesn't exist
    os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)
    output_path = os.path.join(BASE_DIR, 'data', 'destination_catchments.json')
    
    print(f"Saving destination catchments lookup to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(catchments, f, indent=2)

    # Print summary statistics
    lengths = [len(v) for v in catchments.values()]
    print(f"Catchments generated:")
    print(f"  Total routes mapped: {len(catchments)}")
    print(f"  Min POIs per route: {min(lengths)}")
    print(f"  Max POIs per route: {max(lengths)}")
    print(f"  Avg POIs per route: {sum(lengths)/len(lengths):.1f}")
    print("=" * 60)

if __name__ == "__main__":
    main()
