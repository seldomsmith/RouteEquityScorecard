import pandas as pd
import os

excel_path = r'c:\Antigravity Projects in C\Route Equity Scorecard\data\prairies_scores_quintiles_EN.xlsx'
print(f"Reading Excel: {excel_path}")

xl = pd.ExcelFile(excel_path)
print("Sheet names:", xl.sheet_names)

df = pd.read_excel(excel_path, sheet_name=0)
print("\nColumns:", df.columns.tolist())
print("\nShape:", df.shape)
print("\nFirst 5 rows:")
print(df.head())
