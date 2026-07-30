import pandas as pd

excel_path = r'c:\Antigravity Projects in C\Route Equity Scorecard\data\prairies_scores_quintiles_EN.xlsx'
df = pd.read_excel(excel_path)

print("=" * 60)
print("EXCEL COLUMN NAMES:")
for i, col in enumerate(df.columns):
    print(f"  [{i}] {col}")

print("\n" + "=" * 60)
# Look for DA 48111084 or similar Edmonton DAs
da_col = [c for c in df.columns if 'DA' in str(c).upper() or 'DISSEMINATION' in str(c).upper()][0]
print(f"DA Column: {da_col}")

sample_das = [48111084, 48111080, 48111083, 48111280, 48111079]
df[da_col] = df[da_col].astype(str).str.split('.').str[0].str.strip()

matching = df[df[da_col].isin([str(d) for d in sample_das])]
print("\nMATCHING DA ROWS:")
print(matching)
