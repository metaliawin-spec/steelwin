import json
import re

with open('scripts/india_svg_data.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

# Helper to approximate bounding box of an SVG path
def get_path_bbox(path_str):
    # Find all numbers
    coords = []
    # Match pairs of numbers
    # Remove commands
    cleaned = re.sub(r'[a-zA-Z]', ' ', path_str)
    tokens = cleaned.split()
    nums = []
    for t in tokens:
        try:
            nums.append(float(t))
        except:
            pass
    # SVG path has relative/absolute coords, let's track pen position
    # But for a quick centroid, let's parse commands
    pen_x, pen_y = 0.0, 0.0
    pts = []
    
    # Simple regex tokenizer for SVG path
    cmd_tokens = re.findall(r'([a-zA-Z])|([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)', path_str)
    current_cmd = 'M'
    args = []
    
    for cmd, val in cmd_tokens:
        if cmd:
            current_cmd = cmd
            args = []
        else:
            args.append(float(val))
            if current_cmd in ['M', 'L', 'T'] and len(args) == 2:
                pen_x, pen_y = args[0], args[1]
                pts.append((pen_x, pen_y))
                args = []
            elif current_cmd in ['m', 'l', 't'] and len(args) == 2:
                pen_x += args[0]
                pen_y += args[1]
                pts.append((pen_x, pen_y))
                args = []
            elif current_cmd in ['H'] and len(args) == 1:
                pen_x = args[0]
                pts.append((pen_x, pen_y))
                args = []
            elif current_cmd in ['h'] and len(args) == 1:
                pen_x += args[0]
                pts.append((pen_x, pen_y))
                args = []
            elif current_cmd in ['V'] and len(args) == 1:
                pen_y = args[0]
                pts.append((pen_x, pen_y))
                args = []
            elif current_cmd in ['v'] and len(args) == 1:
                pen_y += args[0]
                pts.append((pen_x, pen_y))
                args = []
            elif current_cmd in ['C'] and len(args) == 6:
                pen_x, pen_y = args[4], args[5]
                pts.append((pen_x, pen_y))
                args = []
            elif current_cmd in ['c'] and len(args) == 6:
                pen_x += args[4]
                pen_y += args[5]
                pts.append((pen_x, pen_y))
                args = []
            elif current_cmd in ['S', 'Q'] and len(args) == 4:
                pen_x, pen_y = args[2], args[3]
                pts.append((pen_x, pen_y))
                args = []
            elif current_cmd in ['s', 'q'] and len(args) == 4:
                pen_x += args[2]
                pen_y += args[3]
                pts.append((pen_x, pen_y))
                args = []
            elif current_cmd in ['A'] and len(args) == 7:
                pen_x, pen_y = args[5], args[6]
                pts.append((pen_x, pen_y))
                args = []
            elif current_cmd in ['a'] and len(args) == 7:
                pen_x += args[5]
                pen_y += args[6]
                pts.append((pen_x, pen_y))
                args = []

    if not pts:
        return (0, 0, 0, 0, 0, 0)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    return (min_x, min_y, max_x, max_y, (min_x + max_x)/2, (min_y + max_y)/2)

for loc in d['locations']:
    bbox = get_path_bbox(loc['path'])
    print(f"{loc['id']:3s} {loc['name']:25s} | BBox: X:[{bbox[0]:.1f}, {bbox[2]:.1f}] Y:[{bbox[1]:.1f}, {bbox[3]:.1f}] | Center: ({bbox[4]:.1f}, {bbox[5]:.1f})")
