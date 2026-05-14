import json
import math

data = json.load(open('public/data/golden_route_record.json', encoding='utf-8'))
scores = sorted([r['composite_score'] for r in data['routes']])
n = len(scores)

cuts = [scores[int(n * p)] for p in [0.2, 0.4, 0.6, 0.8]]

def bucket(s):
    if s < cuts[0]: return 'E'
    if s < cuts[1]: return 'D'
    if s < cuts[2]: return 'C'
    if s < cuts[3]: return 'B'
    return 'A'

groups = {'A': [], 'B': [], 'C': [], 'D': [], 'E': []}
for s in scores:
    groups[bucket(s)].append(s)

print("Quintile Analysis:")
print(f"{'Grade':<6} {'Count':<7} {'Min':>6} {'Max':>6} {'Spread':>7} {'Mean':>7} {'StdDev':>7} {'Tight?'}")
print("-" * 60)

for g in ['A', 'B', 'C', 'D', 'E']:
    vals = groups[g]
    mn, mx = min(vals), max(vals)
    spread = mx - mn
    mean = sum(vals) / len(vals)
    variance = sum((v - mean) ** 2 for v in vals) / len(vals)
    sd = math.sqrt(variance)
    tight = "Yes" if sd < 3 else ("Medium" if sd < 5 else "Wide")
    print(f"  {g:<4} {len(vals):<7} {mn:>6.1f} {mx:>6.1f} {spread:>7.1f} {mean:>7.1f} {sd:>7.1f}   {tight}")

print()
print("Key insight: If 'Spread' is large but 'StdDev' is small,")
print("most routes cluster tightly with a few outliers.")
print("If both are large, the grade covers genuinely diverse routes.")
