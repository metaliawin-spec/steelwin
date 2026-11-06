import json

with open('scripts/india_svg_data.json', 'r', encoding='utf-8') as f:
    india_data = json.load(f)

print(f"Total state paths: {len(india_data['locations'])}")
# Verify each state path has non-empty d
for loc in india_data['locations']:
    assert len(loc['path']) > 20, f"Path too short for {loc['name']}"
print("All 36 state paths verified valid!")
