import re

with open('js/modules/calculation.js', 'r', encoding='utf-8') as f:
    src = f.read()

# 1. Remove controller bar from renderManualCalc
manual_bar_start = '<!-- ON-SCREEN MANUAL PANE & PARTITION CONTROLLER BAR (Dual Selection & Control) -->'
manual_bar_end = '<!-- Centering Viewport Container -->'

idx1 = src.find(manual_bar_start)
idx2 = src.find(manual_bar_end)

if idx1 != -1 and idx2 != -1 and idx1 < idx2:
    src = src[:idx1] + src[idx2:]
    print("Removed controller bar from renderManualCalc")
else:
    print("ERROR: Could not find manual calc controller bar boundaries")

# 2. Remove controller bar from renderQuotationStudio
studio_bar_start = '<!-- Studio Pane & Partition Controller Bar -->'
studio_bar_end = '<div style="position: relative; width: 100%; height: 380px; background: #ffffff;'

idx3 = src.find(studio_bar_start)
idx4 = src.find(studio_bar_end)

if idx3 != -1 and idx4 != -1 and idx3 < idx4:
    src = src[:idx3] + src[idx4:]
    print("Removed controller bar from renderQuotationStudio")
else:
    print("ERROR: Could not find studio controller bar boundaries")

with open('js/modules/calculation.js', 'w', encoding='utf-8') as f:
    f.write(src)

print("Finished removing controller bars successfully")
