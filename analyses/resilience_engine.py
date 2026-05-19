"""
Resilience Engine - Network Vulnerability & Impact Analysis
==========================================================

Analyzes transit network redundancy and computes the socio-economic 
impact of service removals (simulated decommissionings).
"""

import pandas as pd
from typing import List, Dict, Tuple, Any

class ResilienceEngine:
    """
    Computes the impact of transit service removals on community access.
    """
    
    @staticmethod
    def calculate_service_impact(
        decommissioned_routes: List[str], 
        main_df: pd.DataFrame, 
        route_grades: List[Dict[str, Any]]
    ) -> Tuple[pd.DataFrame, int, int]:
        """
        Calculates which areas lose service and the resulting social impact.
        
        Args:
            decommissioned_routes: List of route IDs being "cut"
            main_df: Primary dashboard dataframe (DAUID, vulnerability, total_pop)
            route_grades: List of route metadata including 'da_list' (affected DAs)
            
        Returns:
            Tuple of (impact_df, total_impact_pop, total_impact_das)
        """
        if not decommissioned_routes:
            return pd.DataFrame(), 0, 0
            
        # Initialize DA service counters
        da_stats = {}
        for da_val in main_df['DAUID'].values:
            da_stats[str(da_val)] = {'total': 0, 'cut': 0}

        # Count service providers and cuts for every DA
        for r in route_grades:
            route_id = r.get('route_id')
            da_list = r.get('da_list', [])
            
            for da_val in da_list:
                ds = str(da_val)
                if ds in da_stats:
                    da_stats[ds]['total'] += 1
                    if route_id in decommissioned_routes:
                        da_stats[ds]['cut'] += 1

        impact_rows = []
        impact_pop = 0
        impact_das = 0
        
        # Calculate impact scores
        for ds, st in da_stats.items():
            if st['total'] > 0 and st['cut'] > 0:
                loss_ratio = st['cut'] / st['total']
                
                # Fetch DA attributes
                row = main_df[main_df['DAUID'] == ds]
                if row.empty:
                    continue
                    
                vuln = float(row['vulnerability'].iloc[0]) if 'vulnerability' in row.columns else 50.0
                pop = float(row['total_pop'].iloc[0])
                
                # Score: % of service lost * socio-economic vulnerability
                impact_score = loss_ratio * (vuln / 100) * 100
                
                impact_rows.append({
                    'DAUID': ds, 
                    'loss_score': impact_score,
                    'is_complete_loss': loss_ratio >= 0.99
                })
                
                if loss_ratio >= 0.99:
                    impact_pop += int(pop)
                    impact_das += 1

        impact_df = pd.DataFrame(impact_rows) if impact_rows else pd.DataFrame()
        return impact_df, impact_pop, impact_das
