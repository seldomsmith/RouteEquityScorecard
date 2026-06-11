"""
Calculate Functional Monopoly
Evaluates Functional Redundancy index (destination-overlap) for all routes and DAs they serve.
Updates `monopoly_das` and raw `pillar_3_monopoly` in the golden route records.
"""
import json
import os
import math
import numpy as np

def main():
    print("=" * 60)
    print("CALCULATING FUNCTIONAL MONOPOLY")
    print("=" * 60)

    # Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    golden_json_paths = [
        'public/data/golden_route_record.json',
        'data/golden_route_record.json'
    ]
    
    catchments_path = os.path.join(BASE_DIR, 'data', 'destination_catchments.json')
    if not os.path.exists(catchments_path):
        raise FileNotFoundError(f"Missing destination catchments at {catchments_path}. Run build_destination_catchments.py first.")
        
    dashboard_dir = os.path.abspath(os.path.join(BASE_DIR, '..', 'YEG Transit Equity Dashboard', 'YEGTransitEquityModel3.0-2.26.26-main', 'YEGTransitEquityModel3.0-2.26.26-main'))
    if not os.path.exists(dashboard_dir):
        dashboard_dir = os.path.abspath(os.path.join(BASE_DIR, '..', 'YEG Transit Equity Dashboard'))
        
    transit_routes_path = os.path.join(dashboard_dir, 'data', 'EDM', 'processed', 'transit_routes.json')
    if not os.path.exists(transit_routes_path):
        raise FileNotFoundError(f"Missing transit_routes.json at {transit_routes_path}")

    # 1. Load inputs
    with open(catchments_path, 'r', encoding='utf-8') as f:
        catchments = json.load(f)
        
    catchment_sets = {str(k): set(v) for k, v in catchments.items()}
        
    with open(transit_routes_path, 'r', encoding='utf-8') as f:
        transit_routes_raw = json.load(f)
        
    # Build a trip_count lookup from transit_routes.json
    trip_counts = {}
    for cat, route_list in transit_routes_raw.items():
        for r in route_list:
            trip_counts[str(r['route_id'])] = float(r.get('trip_count', 0))

    # Read from public golden record as baseline
    primary_path = 'public/data/golden_route_record.json'
    if not os.path.exists(primary_path):
        raise FileNotFoundError(f"Primary golden route record not found at {primary_path}")
        
    with open(primary_path, 'r', encoding='utf-8') as f:
        golden_data = json.load(f)

    routes = golden_data['routes']
    
    # 2. Build mapping of DA ID -> list of route IDs serving that DA
    da_to_routes = {}
    for r in routes:
        route_id = str(r['route_id'])
        for da_id in r.get('da_list', []):
            da_id_str = str(da_id)
            if da_id_str not in da_to_routes:
                da_to_routes[da_id_str] = []
            da_to_routes[da_id_str].append(route_id)

    # 3. Evaluate functional monopoly status for each route and its DAs using Continuous FMI
    route_monopoly_da_counts = {}
    
    for r in routes:
        route_id = str(r['route_id'])
        total_fmi = 0.0
        da_list = r.get('da_list', [])
        
        # Get destinations and capacity for this route
        route_dests = set(catchments.get(route_id, []))
        route_cap = trip_counts.get(route_id, 0.0)
        
        for da_id in da_list:
            da_id_str = str(da_id)
            
            # If route serves no destinations, its monopoly contribution is 0
            if not route_dests:
                continue
                
            # Alternatives serving the same DA
            alternatives = [alt_id for alt_id in da_to_routes.get(da_id_str, []) if alt_id != route_id]
            
            # If no alternatives, it is a pure monopoly for this DA
            if not alternatives:
                total_fmi += 1.0
                continue
                
            # Calculate FMI by iterating through destinations of route r
            da_fmi_sum = 0.0
            for dest in route_dests:
                # Find which alternatives also serve this destination
                dest_alts = [alt_id for alt_id in alternatives if dest in catchment_sets.get(alt_id, set())]
                
                # Capacity of alternatives serving this destination
                alt_cap_sum = sum(trip_counts.get(alt_id, 0.0) for alt_id in dest_alts)
                
                # FMI for this destination
                dest_fmi = route_cap / (route_cap + alt_cap_sum) if (route_cap + alt_cap_sum) > 0 else 0.0
                da_fmi_sum += dest_fmi
                
            # Average FMI across all destinations of this route
            da_fmi = da_fmi_sum / len(route_dests)
            total_fmi += da_fmi
            
        route_monopoly_da_counts[route_id] = total_fmi

    # 4. Update the scores in both golden records files
    for path in golden_json_paths:
        if not os.path.exists(path):
            print(f"  Warning: Golden record not found at {path}, skipping.")
            continue
            
        print(f"Updating monopoly scores in '{path}'...")
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        for r in data['routes']:
            route_id = str(r['route_id'])
            m_das = route_monopoly_da_counts.get(route_id, 0)
            r['monopoly_das'] = m_das
            
            # Calculate raw monopoly score (weighted by log1p of daily trip count)
            trip_count = trip_counts.get(route_id, 0.0)
            p3_raw = m_das * math.log1p(trip_count)
            r['pillar_3_monopoly'] = round(p3_raw, 2)
            
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f)
            
    print(f"Functional Monopoly calculations complete.")
    print("=" * 60)

if __name__ == "__main__":
    main()
