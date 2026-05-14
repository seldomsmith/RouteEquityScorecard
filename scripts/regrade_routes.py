"""
Re-grade all routes in the Golden Route Record using quintile-based thresholds.
This replaces the original absolute grading with a relative distribution
where each grade represents approximately 20% of the network.
"""
import json
import os
import pandas as pd

def regrade():
    path = 'public/data/golden_route_record.json'
    print("Loading Golden Route Record...")
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    routes = data['routes']
    scores = sorted([r['composite_score'] for r in routes])
    n = len(scores)
    
    # Calculate quintile cut points
    cuts = [scores[int(n * p)] for p in [0.2, 0.4, 0.6, 0.8]]
    
    print(f"Quintile thresholds: E < {cuts[0]:.1f} | D < {cuts[1]:.1f} | C < {cuts[2]:.1f} | B < {cuts[3]:.1f} | A >= {cuts[3]:.1f}")
    
    # Re-grade
    counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0}
    for r in routes:
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
        counts[r['grade']] += 1
    
    # Update grade distribution in metadata
    data['metadata']['stats']['grade_distribution'] = counts
    
    print(f"New distribution: {counts}")
    
    # Save
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f)
    print("JSON updated.")
    
    # Re-convert to Parquet
    parquet_path = 'public/data/golden_route_record.parquet'
    df = pd.DataFrame([data])
    df.to_parquet(parquet_path, engine='pyarrow', index=False)
    
    json_size = os.path.getsize(path) / (1024 * 1024)
    parquet_size = os.path.getsize(parquet_path) / (1024 * 1024)
    print(f"Parquet updated. JSON: {json_size:.2f} MB -> Parquet: {parquet_size:.2f} MB")
    print("Done!")

if __name__ == "__main__":
    regrade()
