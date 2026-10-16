# Bus Stop CIMD Combinations & Monte Carlo Sensitivity Report

Generated: October 2026 | Dataset: 6,755 Stops (5724 Municipal Edmonton Stops)

## 1. Executive Summary

Municipal equity scores at individual bus stops depend on four Statistics Canada CIMD indicators:
Economic Deprivation, Residential Instability, Ethnocultural Composition, and Situational Vulnerability.

To test the durability of stop scores against changing political preferences or methodological choices, we computed stop scores and relative quintile grades across all 15 active binary toggle combinations ($2^4 - 1$).

### Classification Distribution

| Stability Classification | Stop Count | Share of Municipal Stops | Core Characteristic |
| :--- | :--- | :--- | :--- |
| **Essential Equity Bus Stop** | 822 | 14.4% | Grade A or B across >=85% of combinations; non-negotiable priority |
| **High Swing Bus Stop** | 4,045 | 70.7% | Grade spread >=3 letter grades; highly sensitive to specific indicator weighting |
| **Low Swing Bus Stop** | 642 | 11.2% | Intermediate variation (1-2 grade spread); predictable baseline stops |
| **Always Low Equity Bus Stop** | 215 | 3.8% | Grade D or E across >=85% of combinations; affluent or low-need catchments |

## 2. Exemplary Case Study Stops

### Stop #6586 (121 Street & 145 Avenue) • Essential Equity Bus Stop
- **Mean Score**: 82.1 (Volatility $\sigma = 9.1$)
- **Grade Breakdown**: {'A': 12, 'B': 3, 'C': 0, 'D': 0, 'E': 0}
- **High Equity Rate**: 100.0% (Always Grade A or B)

### Stop #2821 (104 Street & 82 Avenue) • High Swing Bus Stop
- **Mean Score**: 58.1 (Volatility $\sigma = 20.6$)
- **Grade Breakdown**: {'A': 2, 'B': 1, 'C': 3, 'D': 4, 'E': 5}
- **Score Range**: 20.0 to 100.0 (4-grade spread from A to E)
- **Driver Analysis**: Scores 100.0 under Residential Instability (dense student/renter apartments on Whyte Ave), but drops to 20.0 under Economic Deprivation.

### Stop #1745 (130 Street & 107 Avenue) • Always Low Equity Bus Stop
- **Mean Score**: 43.3 (Volatility $\sigma = 5.9$)
- **Grade Breakdown**: {'A': 0, 'B': 0, 'C': 1, 'D': 2, 'E': 12}
- **Low Need Rate**: 93.3% (Grade D or E in 14/15 combinations)
