import pandas as pd
import json
import os

def convert_to_parquet():
    print("Starting conversion of Golden Record to Apache Parquet...")
    
    json_path = 'public/data/golden_route_record.json'
    parquet_path = 'public/data/golden_route_record.parquet'
    
    if not os.path.exists(json_path):
        print(f"Error: Cannot find {json_path}")
        return

    # Read the JSON file
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Convert the single dictionary into a DataFrame with one row
    # This preserves the exact nested structure (metadata, routes, da_metadata)
    df = pd.DataFrame([data])
    
    # Save to Parquet format (requires pyarrow or fastparquet)
    print("Compressing into high-performance Parquet binary...")
    df.to_parquet(parquet_path, engine='pyarrow', index=False)
    
    # Print file sizes to show the difference
    json_size = os.path.getsize(json_path) / (1024 * 1024)
    parquet_size = os.path.getsize(parquet_path) / (1024 * 1024)
    
    print(f"Conversion Complete!")
    print(f"Original JSON Size: {json_size:.2f} MB")
    print(f"New Parquet Size:  {parquet_size:.2f} MB (Much faster for DuckDB to read)")

if __name__ == "__main__":
    convert_to_parquet()
