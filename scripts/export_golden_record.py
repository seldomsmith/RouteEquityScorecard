import json
import os
import pandas as pd
import geopandas as gpd

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data', 'EDM')

# Handle cases where data might be in ted-data-main or sibling dashboard
if not os.path.exists(DATA_DIR):
    DATA_DIR = os.path.join(BASE_DIR, 'ted-data-main', 'data', 'EDM')
if not os.path.exists(DATA_DIR):
    DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'YEG Transit Equity Dashboard', 'YEGTransitEquityModel3.0-2.26.26-main', 'YEGTransitEquityModel3.0-2.26.26-main', 'data', 'EDM'))

PROCESSED_DIR = os.path.join(DATA_DIR, 'processed')
OUTPUT_PATH = os.path.join(PROCESSED_DIR, 'golden_route_record.json')

def export_golden_record():
    print("🚀 Starting Golden Route Record Export...")

    # 1. Load Route Grades (The Baseline)
    grades_path = os.path.join(PROCESSED_DIR, 'route_defense_grades.json')
    if not os.path.exists(grades_path):
        print(f"❌ Error: Could not find {grades_path}. Run tactical_engine.py first.")
        return

    with open(grades_path) as f:
        routes = json.load(f)

    # 2. Load DA Demographics & Boundaries
    demo_path = os.path.join(DATA_DIR, 'raw', 'demographics.csv')
    if not os.path.exists(demo_path):
        print(f"❌ Error: Missing {demo_path}")
        return
    demo_df = pd.read_csv(demo_path, dtype={'DAUID': str})
    
    geo_path = os.path.join(PROCESSED_DIR, 'da_boundaries.geojson')
    if not os.path.exists(geo_path):
        print(f"❌ Error: Missing {geo_path}")
        return
    da_gdf = gpd.read_file(geo_path)
    da_gdf['DAUID'] = da_gdf['DAUID'].astype(str)

    # Create a quick lookup for DA data
    print("   Enriching neighborhood metadata...")
    da_lookup = {}
    for _, row in da_gdf.iterrows():
        uid = row['DAUID']
        demo_match = demo_df[demo_df['DAUID'] == uid]
        demo = demo_match.iloc[0] if not demo_match.empty else {}
        
        # We only keep the fields necessary for the Elite UI to keep file size down
        tp = float(demo.get('total_pop', 0))
        if tp == 0: tp = 1
        
        da_lookup[uid] = {
            'id': uid,
            'pop': int(demo.get('total_pop', 0)),
            'low_income_pct': round(float(demo.get('low_income', 0)) / tp * 100, 1),
            'minority_pct': round(float(demo.get('minority', 0)) / tp * 100, 1),
            'senior_pct': round(float(demo.get('seniors', 0)) / tp * 100, 1),
            'center': [round(row.geometry.centroid.y, 5), round(row.geometry.centroid.x, 5)] 
        }

    # 3. Enrich Routes with DA Metadata
    for route in routes:
        route_das = route.get('da_list', [])
        enriched_das = []
        
        for da_id in route_das:
            if da_id in da_lookup:
                enriched_das.append(da_lookup[da_id])
        
        # Sort DAs by population served by the route
        enriched_das.sort(key=lambda x: x['pop'], reverse=True)
        route['da_metadata'] = enriched_das
        
        # Keep the raw da_list for backend filtering but it's optional
        # del route['da_list']

    # 4. Add System-wide Statistics (For the Reactive Sandbox)
    system_stats = {
        'avg_composite': round(sum(r['composite_score'] for r in routes) / len(routes), 1),
        'max_pop_served': max(r['total_pop_served'] for r in routes),
        'grade_distribution': {
            'A': len([r for r in routes if r['grade'] == 'A']),
            'B': len([r for r in routes if r['grade'] == 'B']),
            'C': len([r for r in routes if r['grade'] == 'C']),
            'D': len([r for r in routes if r['grade'] == 'D']),
            'E': len([r for r in routes if r['grade'] == 'E']),
        }
    }

    golden_record = {
        'metadata': {
            'version': '2.0-Standalone',
            'city': 'Edmonton',
            'generated_at': pd.Timestamp.now().isoformat(),
            'stats': system_stats
        },
        'routes': routes
    }

    # 5. Save the Record
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(golden_record, f)

    print(f"✅ Success! Golden Route Record created at: {OUTPUT_PATH}")
    print(f"📦 Total Routes Enriched: {len(routes)}")

if __name__ == "__main__":
    export_golden_record()
