import json
data = json.load(open('public/data/golden_route_record.json', encoding='utf-8'))
routes = data['routes']
scores = [r['composite_score'] for r in routes]
print(f"Composite: min={min(scores):.1f}, max={max(scores):.1f}, avg={sum(scores)/len(scores):.1f}")
grades = {}
for r in routes:
    grades[r['grade']] = grades.get(r['grade'], 0) + 1
print(f"Grades: {grades}")
print(f"Scoring: {data['metadata'].get('scoring', {})}")

# Check the Parquet was saved too
import os
p = 'public/data/golden_route_record.parquet'
print(f"Parquet exists: {os.path.exists(p)}, size: {os.path.getsize(p)/1024:.0f} KB")
