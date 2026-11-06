import re
import os

filepath = os.path.abspath('js/modules/calculation.js')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update shortcut bar position to bottom-left (bottom: 14px; left: 16px)
old_shortcut_bar = """                        <!-- Sleek Bottom Floating Shortcuts Bar (Audio 1 & Audio 2: Reminds user of all commands without crowding canvas) -->
                        <div style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); background: rgba(248, 250, 252, 0.95); backdrop-filter: blur(4px); border: 1px solid #cbd5e1; border-radius: 20px; padding: 5px 18px; font-size: 0.72rem; color: #475569; display: flex; align-items: center; gap: 8px; z-index: 20; box-shadow: 0 2px 8px rgba(0,0,0,0.06); pointer-events: none;">
                            <span style="font-weight: 800; color: #1e293b;">⌨️ Shortcuts:</span>
                            <span><strong style="color: #0284c7;">PT</strong> Top</span> •
                            <span><strong style="color: #0284c7;">PM</strong> Mid</span> •
                            <span><strong style="color: #0284c7;">PB</strong> Btm</span> •
                            <span><strong style="color: #0284c7;">PV</strong> Vertical</span> •
                            <span><strong style="color: #0284c7;">R</strong> Rotate</span> •
                            <span><strong style="color: #0284c7;">PPN</strong> Pipes</span> •
                            <span><strong style="color: #0284c7;">NP</strong> Clear</span>
                        </div>"""

new_shortcut_bar = """                        <!-- Sleek Bottom Floating Shortcuts Bar (Positioned bottom-left to prevent overlap with Total W input) -->
                        <div style="position: absolute; bottom: 14px; left: 16px; background: rgba(248, 250, 252, 0.96); backdrop-filter: blur(4px); border: 1.5px solid #cbd5e1; border-radius: 20px; padding: 5px 14px; font-size: 0.70rem; color: #475569; display: flex; align-items: center; gap: 7px; z-index: 20; box-shadow: 0 2px 8px rgba(0,0,0,0.06); pointer-events: none;">
                            <span style="font-weight: 800; color: #0f172a;">⌨️ Shortcuts:</span>
                            <span><strong style="color: #0284c7;">PT</strong> Top</span> •
                            <span><strong style="color: #0284c7;">PM</strong> Mid</span> •
                            <span><strong style="color: #0284c7;">PB</strong> Btm</span> •
                            <span><strong style="color: #0284c7;">PV</strong> Vert</span> •
                            <span><strong style="color: #0284c7;">R</strong> Rotate</span> •
                            <span><strong style="color: #0284c7;">PPN</strong> Pipes</span> •
                            <span><strong style="color: #0284c7;">NP</strong> Clear</span>
                        </div>"""

if old_shortcut_bar in content:
    content = content.replace(old_shortcut_bar, new_shortcut_bar, 1)
    print("Updated shortcut bar position.")
else:
    print("WARNING: old_shortcut_bar not found!")


# 2. Update toggleSubGrillOrientation subLabel
old_toggle_orient = """    const subLabel = (targetObj.panePartitions?.[paneIndex] || 0) > 0 ? (subIndex === 0 ? 'Top' : 'Main') : '';
    window.showStudioToast(`Pane ${paneIndex + 1} ${subLabel} grill rotated to ${next.toUpperCase()}`);"""

new_toggle_orient = """    const isVert = (targetObj.panePartitions?.[paneIndex] || 0) > 0 && targetObj.partitionDir?.[paneIndex] === 'vertical';
    const subLabel = (targetObj.panePartitions?.[paneIndex] || 0) > 0 
        ? (isVert ? (subIndex === 0 ? 'Left Opening' : 'Right Opening') : (subIndex === 0 ? 'Top Opening' : 'Main Opening')) 
        : '';
    window.showStudioToast(`Pane ${paneIndex + 1} ${subLabel} grill rotated to ${next.toUpperCase()}`);"""

if old_toggle_orient in content:
    content = content.replace(old_toggle_orient, new_toggle_orient, 1)
    print("Updated toggleSubGrillOrientation subLabel.")
else:
    print("WARNING: old_toggle_orient not found!")


# 3. Update promptSubPipeCount subLabel
old_prompt_pipe = """    const subLabel = (targetObj.panePartitions?.[paneIndex] || 0) > 0 ? (subIndex === 0 ? 'Top Opening' : 'Main Opening') : '';"""
new_prompt_pipe = """    const isVert = (targetObj.panePartitions?.[paneIndex] || 0) > 0 && targetObj.partitionDir?.[paneIndex] === 'vertical';
    const subLabel = (targetObj.panePartitions?.[paneIndex] || 0) > 0 
        ? (isVert ? (subIndex === 0 ? 'Left Opening' : 'Right Opening') : (subIndex === 0 ? 'Top Opening' : 'Main Opening')) 
        : '';"""

if old_prompt_pipe in content:
    content = content.replace(old_prompt_pipe, new_prompt_pipe, 1)
    print("Updated promptSubPipeCount subLabel.")
else:
    print("WARNING: old_prompt_pipe not found!")


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied visual polish to calculation.js successfully!")
