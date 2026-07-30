import pandas as pd
import json
import os

excel_path = r'c:\Antigravity Projects in C\Route Equity Scorecard\data\prairies_scores_quintiles_EN.xlsx'
df = pd.read_excel(excel_path)

cols = df.columns.tolist()
print("Columns:", cols)

out_info = {
    "columns": cols,
    "sample": df.head(5).to_dict(orient="records")
}

with open(r'c:\Antigravity Projects in C\Route Equity Scorecard\scratch\excel_inspection.json', 'w') as f:
    json.dump(out_info, f, indent=2)

print("Saved inspection to scratch/excel_inspection.json")
