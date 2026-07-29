import pandas as pd
import json
import os

def export_da_populations():
    # Find project root
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Read parquet
    parquet_path = os.path.join(base_dir, 'public', 'data', 'golden_route_record.parquet')
    if not os.path.exists(parquet_path):
        print(f"Error: Missing parquet file at {parquet_path}")
        return
        
    df = pd.read_parquet(parquet_path)
    
    da_pop = {}
    
    # Check if 'routes' is stored as a column of structs
    if 'routes' in df.columns:
        for idx, row in df.iterrows():
            routes_list = row['routes']
            if routes_list is None:
                continue
            
            # If routes_list is a numpy array or list
            for r in routes_list:
                if r is None:
                    continue
                # r can be a dictionary or a custom object
                da_meta = r.get('da_metadata') if isinstance(r, dict) else getattr(r, 'da_metadata', None)
                if da_meta is None:
                    continue
                for da in da_meta:
                    if da is None:
                        continue
                    da_id = da.get('id') if isinstance(da, dict) else getattr(da, 'id', None)
                    pop = da.get('pop') if isinstance(da, dict) else getattr(da, 'pop', None)
                    if da_id is not None and pop is not None:
                        da_pop[str(da_id)] = int(pop)
                        
    # Output to public/data/da_populations.json
    output_path = os.path.join(base_dir, 'public', 'data', 'da_populations.json')
    with open(output_path, 'w') as f:
        json.dump(da_pop, f, indent=2)
        
    print(f"Success: Exported {len(da_pop)} DA populations to {output_path}")

if __name__ == '__main__':
    export_da_populations()
