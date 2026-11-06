import json
import re

# Read fetched @svg-maps/india file
with open(r'C:\Users\anshi\.gemini\antigravity-ide\brain\3e8e9205-9986-45cb-8a72-18cbd9c38763\.system_generated\steps\329\content.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract json
start_idx = text.find('export default ')
if start_idx != -1:
    raw_json = text[start_idx + len('export default '):].strip()
    data = json.loads(raw_json)
    print(f"Loaded India SVG data: viewBox={data.get('viewBox')}, num locations={len(data.get('locations', []))}")
    for loc in data.get('locations', []):
        print(f" - {loc.get('id')}: {loc.get('name')}")
else:
    print("Could not find export default in file")
