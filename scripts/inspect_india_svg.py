import json

with open('scripts/india_svg_data.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

print('viewBox:', d.get('viewBox'))
print('Number of states:', len(d['locations']))
for loc in d['locations']:
    print(f"{loc['id']}: {loc['name']}")
