import os
import pandas as pd
import numpy as np

def main():
    print("=" * 60)
    print("MAPPING DAs TO NEIGHBOURHOODS & AGGREGATING STATISTICS")
    print("=" * 60)

    # 1. File Paths
    da_sensitivity_path = 'docs/da_vulnerability_sensitivity.csv'
    demographics_path = 'data/demographics.csv'
    # Absolute path to the neighbourhood mapping file in the dashboard workspace
    mapping_path = r'\\cepfile2\users4\matdow\Home\Desktop\Antigravity Projects\YEG Transit Equity Dashboard\YEGTransitEquityModel3.0-2.26.26-main\YEGTransitEquityModel3.0-2.26.26-main\data\EDM\processed\da_neighbourhood_map.csv'

    # Check existence
    for path in [da_sensitivity_path, demographics_path, mapping_path]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Required file not found at: {path}")

    # 2. Load Datasets
    print("Loading datasets...")
    df_sens = pd.read_csv(da_sensitivity_path)
    df_demo = pd.read_csv(demographics_path)
    df_map = pd.read_csv(mapping_path)

    # 3. Clean up keys for merging
    df_sens['DAID'] = df_sens['DAID'].astype(str).str.strip()
    df_demo['DAUID'] = df_demo['DAUID'].astype(str).str.strip()
    df_map['DAUID'] = df_map['DAUID'].astype(str).str.strip()

    # Get population mapping
    df_pop = df_demo[['DAUID', 'total_pop']].rename(columns={'DAUID': 'DAID'})
    df_pop['total_pop'] = df_pop['total_pop'].fillna(0.0)

    # Clean mapping
    df_map_clean = df_map[['DAUID', 'neighbourhood']].rename(columns={'DAUID': 'DAID'})
    df_map_clean['neighbourhood'] = df_map_clean['neighbourhood'].astype(str).str.strip().str.upper()

    # 4. Merge DA-level files
    print("Merging DA-level sensitivity data with populations and neighbourhoods...")
    df_merged = pd.merge(df_sens, df_pop, on='DAID', how='left')
    df_merged = pd.merge(df_merged, df_map_clean, on='DAID', how='left')

    # Fill missing neighbourhoods with 'UNKNOWN'
    df_merged['neighbourhood'] = df_merged['neighbourhood'].fillna('UNKNOWN')

    # Output detailed DA mapping
    detailed_out_path = 'docs/da_vulnerability_sensitivity_mapped.csv'
    df_detailed = df_merged[['DAID', 'neighbourhood', 'total_pop', 'Mean Score', 'Std Dev']].rename(
        columns={'neighbourhood': 'Neighbourhood', 'total_pop': 'Total Population'}
    )
    df_detailed.to_csv(detailed_out_path, index=False)
    print(f"Exported detailed mapping to {detailed_out_path}")

    # 5. Aggregate to Neighbourhood Level
    print("Aggregating sensitivity results to neighbourhood level...")
    # Group by Neighbourhood
    groups = df_merged.groupby('neighbourhood')

    agg_records = []
    for name, group in groups:
        # Exclude unpopulated DAs or where population is zero or NaN
        populated_group = group[group['total_pop'] > 0]
        
        total_pop = group['total_pop'].sum()
        da_count = len(group)
        pop_da_count = len(populated_group)

        if pop_da_count == 0:
            # All DAs are unpopulated
            simple_mean = 0.0
            weighted_mean = 0.0
            simple_std = 0.0
            weighted_std = 0.0
        else:
            # Simple averages of populated DAs
            simple_mean = populated_group['Mean Score'].mean()
            simple_std = populated_group['Std Dev'].mean()

            # Weighted averages
            total_pop_populated = populated_group['total_pop'].sum()
            if total_pop_populated > 0:
                weighted_mean = np.sum(populated_group['Mean Score'] * populated_group['total_pop']) / total_pop_populated
                weighted_std = np.sum(populated_group['Std Dev'] * populated_group['total_pop']) / total_pop_populated
            else:
                weighted_mean = simple_mean
                weighted_std = simple_std

        agg_records.append({
            'Neighbourhood': name,
            'Total Population': int(total_pop),
            'DA Count': da_count,
            'Populated DA Count': pop_da_count,
            'Simple Mean Score': round(simple_mean, 2),
            'Weighted Mean Score': round(weighted_mean, 2),
            'Simple Std Dev (Volatility)': round(simple_std, 2),
            'Weighted Std Dev (Volatility)': round(weighted_std, 2)
        })

    df_agg = pd.DataFrame(agg_records)
    # Sort alphabetically by neighbourhood
    df_agg = df_agg.sort_values(by='Neighbourhood')

    agg_out_path = 'docs/neighbourhood_vulnerability_sensitivity.csv'
    df_agg.to_csv(agg_out_path, index=False)
    print(f"Exported aggregated neighbourhood scores to {agg_out_path}")
    print("=" * 60)

if __name__ == '__main__':
    main()
