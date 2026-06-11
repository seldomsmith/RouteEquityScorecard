"""
DA-Level Vulnerability Score Sensitivity Analysis
Performs a vectorized Monte Carlo sensitivity sweep of the demographic weights
at the Dissemination Area (DA) level.
"""
import itertools
import os
import time
import numpy as np
import pandas as pd

def main():
    print("=" * 60)
    print("DA-LEVEL VULNERABILITY SENSITIVITY SWEEP")
    print("=" * 60)
    start_time = time.time()

    # 1. Ingest raw demographics
    demographics_path = 'data/demographics.csv'
    if not os.path.exists(demographics_path):
        raise FileNotFoundError(f"Demographics file not found at {demographics_path}")

    df_demo = pd.read_csv(demographics_path)
    total_pop = df_demo['total_pop'].fillna(0.0)
    populated_mask = (total_pop > 0)
    print(f"Loaded {len(df_demo)} DAs ({populated_mask.sum()} populated).")

    # 2. Compute percentage rates (exactly matching update_vulnerability_index.py)
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

    # 3. Z-score normalize across populated DAs (ddof=0 matching update_vulnerability_index.py)
    df_populated = df_demo[populated_mask].copy()
    indicators = {
        'low_income_pct': 'z_low_income',
        'minority_pct': 'z_minority',
        'senior_pct': 'z_seniors',
        'lone_parent_pct': 'z_lone_parents',
        'recent_immigrant_pct': 'z_recent_immigrants',
        'youth_pct': 'z_youth'
    }

    # Extract Z-score values to numpy matrix
    z_scores_list = []
    for pct_col, z_col in indicators.items():
        mean_val = df_populated[pct_col].mean()
        std_val = df_populated[pct_col].std(ddof=0)
        
        if std_val == 0:
            scores = np.zeros(len(df_populated))
        else:
            scores = (df_populated[pct_col].values - mean_val) / std_val
        z_scores_list.append(scores)

    # Shape: (1762, 6)
    z_matrix = np.column_stack(z_scores_list)

    # 4. Generate the 88,913 zero-sum weight configurations
    print("Generating weight combinations (summing to 6.0 in 0.1 steps)...")
    # Sweep range 5 to 15 represents 0.5 to 1.5. Sum must be 60.
    values = list(range(5, 16))
    configs_int = []
    for p in itertools.product(values, repeat=6):
        if sum(p) == 60:
            configs_int.append(p)
            
    configs = np.array(configs_int, dtype=np.float64) / 10.0
    num_configs = len(configs)
    print(f"Generated exactly {num_configs} valid combinations.")

    # 5. Run Vectorized Sensitivity Matrix Multiplication
    print("Calculating weighted Z-score composites...")
    # Weighted Z: shape (1762, 88913). We divide by weight sum (6.0)
    weighted_z = np.dot(z_matrix, configs.T) / 6.0

    print("Scaling and standardizing to [0, 100]...")
    # Continuous scaling min/max values per configuration
    min_wz = np.min(weighted_z, axis=0) # shape (88913,)
    max_wz = np.max(weighted_z, axis=0) # shape (88913,)
    range_wz = max_wz - min_wz
    
    # Avoid division by zero
    range_wz = np.where(range_wz == 0.0, 1.0, range_wz)
    
    # Scale to [0, 100]
    scaled_vuln = 100.0 * (weighted_z - min_wz) / range_wz

    # 6. Calculate mean and standard deviation (volatility) for each DA
    print("Computing mean and standard deviation per Dissemination Area...")
    da_means = np.mean(scaled_vuln, axis=1)
    da_stds = np.std(scaled_vuln, axis=1)

    # 7. Create output DataFrame including 0-pop DAs
    df_out = pd.DataFrame(index=df_demo.index)
    df_out['DAID'] = df_demo['DAUID'].astype(str).str.strip()
    df_out['Mean Score'] = 0.0
    df_out['Std Dev'] = 0.0
    
    # Populate stats for populated DAs
    df_out.loc[populated_mask, 'Mean Score'] = np.round(da_means, 2)
    df_out.loc[populated_mask, 'Std Dev'] = np.round(da_stds, 2)

    # Export to CSV
    output_path = 'docs/da_vulnerability_sensitivity.csv'
    df_out.to_csv(output_path, index=False)
    print(f"Analysis complete. Exported results to '{output_path}'.")
    
    end_time = time.time()
    print(f"Execution took {end_time - start_time:.2f} seconds.")
    print("=" * 60)

if __name__ == "__main__":
    main()
