# Python script to apply the user's latest UI and layout refinements to calculation.js
import os
import re

calc_path = 'js/modules/calculation.js'
with open(calc_path, 'r', encoding='utf-8') as f:
    src = f.read()

# -------------------------------------------------------------
# 1. Remove Quotation Calculation Tab & Page from Window Studio
# -------------------------------------------------------------
old_nav_quote = '''                <button class="calc-nav-item ${activeTab === 'quotes' ? 'active' : ''}" onclick="window.calcSwitchTab('quotes')" id="tab-quote-calc">
                    <i data-lucide="file-text" style="width: 18px; height: 18px;"></i>
                    <div style="display: flex; flex-direction: column; text-align: left;">
                        <span style="font-weight: 600;">Quotation Calculation</span>
                        <span style="font-size: 0.7rem; color: var(--color-text-muted); font-weight: 400;">Estimates & Client Quotes</span>
                    </div>
                </button>'''

if old_nav_quote in src:
    src = src.replace(old_nav_quote, '')
    print('Removed Quotation Calculation tab from Window Studio sidebar.')

# Also remove the renderQuotations mount block from renderCalculation
old_mount_quotes = '''    if (activeTab === 'quotes') {
        const mount = container.querySelector('#calc-inner-mount');
        if (mount) {
            if (Store.state.quoteStudio && Store.state.quoteStudio.active) {
                mount.style.padding = '1.25rem';
                mount.style.maxWidth = '1500px';
                mount.innerHTML = renderQuotationStudio(state);
            } else {
                mount.style.padding = '0';
                mount.style.maxWidth = '100%';
                mount.innerHTML = '';
                mount.appendChild(renderQuotations(state));
            }
        }
    }'''

if old_mount_quotes in src:
    src = src.replace(old_mount_quotes, '')
    print('Removed quotes mount block from renderCalculation.')

# -------------------------------------------------------------
# 2. Replace '3. Panel / Sheet' with '3. Panel' everywhere
# -------------------------------------------------------------
src = src.replace("'3. Panel / Sheet'", "'3. Panel'")
src = src.replace('"3. Panel / Sheet"', '"3. Panel"')
src = src.replace('3. Panel / Sheet', '3. Panel')
print("Replaced '3. Panel / Sheet' with '3. Panel'.")

# -------------------------------------------------------------
# 3. New renderManualCalc Implementation with User Audio & Photo 2 Layout
# -------------------------------------------------------------
new_render_manual_calc = '''
function renderManualCalc(state) {
    try {
        const defUnit = Store.state.settings?.preferences?.unit || 'cm';
        
        // 1. Initialize State: STRICTLY 1 KALLI (Single Pane) with 50 x 140 cm default
        if (!state.rateCalc || !state.rateCalc.grid) {
            state.rateCalc = {
                category: 'Window',
                materials: {
                    frame: 'prof_box',
                    pipe: 'tube_sq_1x1',
                    panel: 'glass_5mm_clear',
                    hinge: 'hinge_ss_4in',
                    paint: 'paint_epoxy_black',
                    hook: 'hook_stay_8in',
                    lock: 'lock_cockspur'
                },
                grid: {
                    cols: 1, // ALWAYS START ON 1 KALLI (ഒറ്റക്കള്ളി)
                    rows: 1,
                    totalW: convertUnit(50, 'cm', defUnit),
                    totalH: convertUnit(140, 'cm', defUnit),
                    unit: defUnit,
                    paneWidths: [convertUnit(50, 'cm', defUnit)],
                    panePartitions: [0],
                    partitionPos: ['top']
                },
                params: {
                    laborCharge: 800,
                    profitMarginPercent: 15
                }
            };
        }

        const rc = state.rateCalc;
        if (!rc.materials) rc.materials = {};
        if (rc.materials.frame === undefined) rc.materials.frame = 'prof_box';
        if (rc.materials.pipe === undefined) rc.materials.pipe = 'tube_sq_1x1';
        if (rc.materials.panel === undefined) rc.materials.panel = 'glass_5mm_clear';
        if (rc.materials.hinge === undefined) rc.materials.hinge = 'hinge_ss_4in';
        if (rc.materials.paint === undefined) rc.materials.paint = 'paint_epoxy_black';
        if (rc.materials.hook === undefined) rc.materials.hook = 'hook_stay_8in';
        if (rc.materials.lock === undefined) rc.materials.lock = 'lock_cockspur';

        if (!rc.grid) rc.grid = {};
        if (!rc.grid.cols) rc.grid.cols = 1;
        if (!rc.grid.unit) rc.grid.unit = defUnit;
        if (!rc.grid.totalW) rc.grid.totalW = convertUnit(rc.grid.cols * 50, 'cm', rc.grid.unit);
        if (!rc.grid.totalH) rc.grid.totalH = convertUnit(140, 'cm', rc.grid.unit);

        if (!rc.params) rc.params = {};
        if (rc.params.laborCharge === undefined) rc.params.laborCharge = 800;
        if (rc.params.profitMarginPercent === undefined) rc.params.profitMarginPercent = 15;

        const g = rc.grid;
        const p = rc.params;
        const catalog = Store.state.materialCatalog || [];
        const currency = Store.state.settings?.preferences?.currency || '₹';

        // History tracking
        window.calcHistory = window.calcHistory || { past: [], future: [], isRestoring: false };
        if (!window.calcHistoryBound) {
            window.addEventListener('keydown', (e) => {
                if (Store.state.currentView !== 'calculation') return;
                if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); window.handleUndo(); }
                if (e.ctrlKey && e.key.toLowerCase() === 'x') { e.preventDefault(); window.handleRedo(); }
            });
            window.calcHistoryBound = true;
        }

        function snapshotCalc() {
            if (window.calcHistory.isRestoring) return;
            const currentRc = Store.state.rateCalc;
            if (!currentRc) return;
            window.calcHistory.past.push(JSON.stringify(currentRc));
            if (window.calcHistory.past.length > 30) window.calcHistory.past.shift();
            window.calcHistory.future = [];
        }

        window.handleUndo = () => {
            if (window.calcHistory.past.length === 0) return;
            const currentRc = Store.state.rateCalc;
            if (currentRc) window.calcHistory.future.push(JSON.stringify(currentRc));
            const prev = window.calcHistory.past.pop();
            window.calcHistory.isRestoring = true;
            Store.state.rateCalc = JSON.parse(prev);
            Store.notify();
            setTimeout(() => { window.calcHistory.isRestoring = false; }, 50);
        };

        window.handleRedo = () => {
            if (window.calcHistory.future.length === 0) return;
            const currentRc = Store.state.rateCalc;
            if (currentRc) window.calcHistory.future.push(JSON.stringify(currentRc));
            const next = window.calcHistory.future.pop();
            window.calcHistory.isRestoring = true;
            Store.state.rateCalc = JSON.parse(next);
            Store.notify();
            setTimeout(() => { window.calcHistory.isRestoring = false; }, 50);
        };

        // Reset to Defaults: Strictly 1 Kalli 50 x 140 cm
        window.resetQuickCalcDefaults = () => {
            snapshotCalc();
            const u = g.unit || 'cm';
            Store.state.rateCalc = {
                category: 'Window',
                materials: {
                    frame: 'prof_box',
                    pipe: 'tube_sq_1x1',
                    panel: 'glass_5mm_clear',
                    hinge: 'hinge_ss_4in',
                    paint: 'paint_epoxy_black',
                    hook: 'hook_stay_8in',
                    lock: 'lock_cockspur'
                },
                grid: {
                    cols: 1, // Reset to 1 Kalli
                    rows: 1,
                    totalW: convertUnit(50, 'cm', u),
                    totalH: convertUnit(140, 'cm', u),
                    unit: u,
                    paneWidths: [convertUnit(50, 'cm', u)],
                    panePartitions: [0],
                    partitionPos: ['top']
                },
                params: {
                    laborCharge: 800,
                    profitMarginPercent: 15
                }
            };
            window.calcSearchQuery = '';
            window.calcMaterialSearchQuery = '';
            Store.notify();
        };

        // Pane Arrays Management
        if (!g.paneWidths || g.paneWidths.length !== g.cols) {
            const equalW = parseFloat((g.totalW / g.cols).toFixed(1));
            g.paneWidths = Array(g.cols).fill(equalW);
        }
        if (!g.panePartitions || g.panePartitions.length !== g.cols) {
            g.panePartitions = Array(g.cols).fill(0);
        }
        if (!g.partitionPos || g.partitionPos.length !== g.cols) {
            g.partitionPos = Array(g.cols).fill('top');
        }

        // Units & Dimensions Normalization
        const w_mm = convertUnit(g.totalW, g.unit, 'mm');
        const h_mm = convertUnit(g.totalH, g.unit, 'mm');
        const w_ft = (w_mm / 25.4) / 12;
        const h_ft = (h_mm / 25.4) / 12;
        const areaSqFt = Math.max(0.01, w_ft * h_ft);
        const outerPerimeterFt = 2 * (w_ft + h_ft);

        // Material Lookups from Material Catalog with '-- None (Not Included) --' support
        const getCatItem = (catKey, defaultId) => {
            const selId = rc.materials?.[catKey];
            if (selId === 'none' || selId === '' || selId === false) {
                return { id: 'none', name: 'None (Not Included)', rate: 0, weightFactor: 0, isNone: true };
            }
            const found = catalog.find(m => m.id === selId || m.name === selId);
            if (found) return found;
            return catalog.find(m => (m.category || '').toLowerCase() === catKey.toLowerCase()) ||
                   { id: defaultId, name: 'Standard ' + catKey, rate: 0, weightFactor: 0 };
        };

        const frameItem = getCatItem('frame', 'prof_box');
        const pipeItem = getCatItem('pipe', 'tube_sq_1x1');
        const panelItem = getCatItem('panel', 'glass_5mm_clear');
        const hingeItem = getCatItem('hinge', 'hinge_ss_4in');
        const paintItem = getCatItem('paint', 'paint_epoxy_black');
        const hookItem = getCatItem('hook', 'hook_stay_8in');
        const lockItem = getCatItem('lock', 'lock_cockspur');

        // Material 1: Frame / Profile
        const frameLenFt = frameItem.isNone ? 0 : outerPerimeterFt;
        const frameWeightKg = frameItem.isNone ? 0 : (frameLenFt * (frameItem.weightFactor || 1.45));
        const frameSubtotal = frameItem.isNone ? 0 : (frameWeightKg * (frameItem.rate || 180));

        // Material 2: Pipe (Vertical Mullions between panes + Horizontal Partitions)
        let partitionLenFt = 0;
        let totalPartitionDividers = 0;
        if (!pipeItem.isNone) {
            for (let i = 0; i < g.cols; i++) {
                const parts = g.panePartitions[i] || 0;
                if (parts > 0) {
                    totalPartitionDividers += parts;
                    const pw_mm = convertUnit(g.paneWidths[i], g.unit, 'mm');
                    partitionLenFt += parts * ((pw_mm / 25.4) / 12);
                }
            }
        }
        const pipeLenFt = pipeItem.isNone ? 0 : (((g.cols - 1) * h_ft) + partitionLenFt);
        const pipeWeightKg = pipeItem.isNone ? 0 : (pipeLenFt * (pipeItem.weightFactor || 1.15));
        const pipeSubtotal = pipeItem.isNone ? 0 : (pipeWeightKg * (pipeItem.rate || 95));

        // Material 3: Panel
        const panelAreaSqFt = panelItem.isNone ? 0 : areaSqFt;
        const panelWeightKg = panelItem.isNone ? 0 : (panelAreaSqFt * (panelItem.weightFactor || 1.15));
        const panelSubtotal = panelItem.isNone ? 0 : (panelAreaSqFt * (panelItem.rate || 55));

        // Material 4: Hinges
        const hingeQty = hingeItem.isNone ? 0 : Math.max(2, g.cols * 2);
        const hingeWeightKg = hingeItem.isNone ? 0 : (hingeQty * (hingeItem.weightFactor || 0.18));
        const hingeSubtotal = hingeItem.isNone ? 0 : (hingeQty * (hingeItem.rate || 85));

        // Material 5: Paint
        const surfaceAreaFt2 = paintItem.isNone ? 0 : ((frameLenFt + pipeLenFt) * 0.45);
        const paintLtr = paintItem.isNone ? 0 : Math.max(0.5, parseFloat((surfaceAreaFt2 / (paintItem.coverage || 12)).toFixed(2)));
        const paintSubtotal = paintItem.isNone ? 0 : (paintLtr * (paintItem.rate || 480));

        // Material 6: Hook & Rubber
        const hookQty = hookItem.isNone ? 0 : Math.max(1, Math.min(g.cols, 2));
        const hookWeightKg = hookItem.isNone ? 0 : (hookQty * (hookItem.weightFactor || 0.20));
        const hookSubtotal = hookItem.isNone ? 0 : (hookQty * (hookItem.rate || 75));

        // Material 7: Lock & Accessories
        const lockQty = lockItem.isNone ? 0 : Math.max(1, Math.min(g.cols, 2));
        const lockWeightKg = lockItem.isNone ? 0 : (lockQty * (lockItem.weightFactor || 0.25));
        const lockSubtotal = lockItem.isNone ? 0 : (lockQty * (lockItem.rate || 160));

        // Cost Totals
        const totalMaterialCost = frameSubtotal + pipeSubtotal + panelSubtotal + hingeSubtotal + paintSubtotal + hookSubtotal + lockSubtotal;
        const laborCharges = parseFloat(p.laborCharge ?? 800) || 0;
        const profitMarginPercent = parseFloat(p.profitMarginPercent ?? 15) || 0;
        const baseCost = totalMaterialCost + laborCharges;
        const addedProfit = baseCost * (profitMarginPercent / 100);
        const grandTotal = baseCost + addedProfit;

        // Grid & Parameter Updates
        window.updateGrid = (key, val) => {
            snapshotCalc();
            if (key.startsWith('mat_')) {
                const matType = key.split('_')[1];
                rc.materials[matType] = val;
            } else if (key === 'unit') {
                window.toggleUnit(val);
                return;
            } else if (key === 'cols') {
                const newCols = Math.max(1, parseInt(val) || 1);
                g.cols = newCols;
                const defaultPaneW = parseFloat((g.totalW / newCols).toFixed(1));
                g.paneWidths = Array(newCols).fill(defaultPaneW);
                g.panePartitions = Array(newCols).fill(0);
                g.partitionPos = Array(newCols).fill('top');
            } else if (key === 'totalW') {
                const newTotal = parseFloat(val) || 0;
                const oldTotal = g.totalW || 1;
                g.totalW = newTotal;
                if (g.paneWidths && g.paneWidths.length === g.cols && oldTotal > 0) {
                    g.paneWidths = g.paneWidths.map(pw => parseFloat(((pw / oldTotal) * newTotal).toFixed(1)));
                }
            } else if (key === 'totalH') {
                g.totalH = parseFloat(val) || 0;
            } else if (key === 'laborCharge') {
                p.laborCharge = parseFloat(val) || 0;
            } else if (key === 'profitMarginPercent') {
                p.profitMarginPercent = parseFloat(val) || 0;
            }
            Store.notify();
        };

        // Kalli Preset Selection: Each Kalli adds 50 cm width! Normal default height is 140 cm.
        window.loadPreset = (cols) => {
            snapshotCalc();
            const newCols = Math.max(1, parseInt(cols) || 1);
            g.cols = newCols;
            const widthCm = newCols * 50;
            g.totalW = convertUnit(widthCm, 'cm', g.unit);
            g.totalH = convertUnit(140, 'cm', g.unit);
            const paneWInUnit = convertUnit(50, 'cm', g.unit);
            g.paneWidths = Array(newCols).fill(paneWInUnit);
            g.panePartitions = Array(newCols).fill(0);
            g.partitionPos = Array(newCols).fill('top');
            Store.notify();
        };

        window.cyclePanePartition = (index) => {
            snapshotCalc();
            if (!g.panePartitions) g.panePartitions = Array(g.cols).fill(0);
            const cur = g.panePartitions[index] || 0;
            g.panePartitions[index] = (cur + 1) % 3; // cycles 0 -> 1 -> 2 -> 0
            Store.notify();
        };

        // Partition Position Toggle (Top -> Center -> Bottom -> Top)
        window.cyclePanePartitionPos = (index) => {
            snapshotCalc();
            if (!g.partitionPos) g.partitionPos = Array(g.cols).fill('top');
            const cur = g.partitionPos[index] || 'top';
            const next = cur === 'top' ? 'center' : (cur === 'center' ? 'bottom' : 'top');
            g.partitionPos[index] = next;
            Store.notify();
        };

        // Measurement Unit Conversion: Accurate bidirectional conversion across cm, mm, inch, ft, m
        window.toggleUnit = (newUnit) => {
            if (newUnit === g.unit) return;
            snapshotCalc();
            const oldUnit = g.unit;
            g.totalW = convertUnit(g.totalW, oldUnit, newUnit);
            g.totalH = convertUnit(g.totalH, oldUnit, newUnit);
            if (g.paneWidths && g.paneWidths.length) {
                g.paneWidths = g.paneWidths.map(w => convertUnit(w, oldUnit, newUnit));
            }
            g.unit = newUnit;
            Store.notify();
        };

        window.updateIndividualPaneWidth = (index, val) => {
            snapshotCalc();
            let newVal = parseFloat(val) || 0;
            if (newVal < 0) newVal = 0;
            if (newVal > g.totalW) newVal = g.totalW;
            g.paneWidths[index] = newVal;

            if (g.cols > 1) {
                const remainingW = Math.max(0, g.totalW - newVal);
                const otherCount = g.cols - 1;
                const eachOther = parseFloat((remainingW / otherCount).toFixed(1));
                for (let i = 0; i < g.cols; i++) {
                    if (i !== index) g.paneWidths[i] = eachOther;
                }
                const curSum = g.paneWidths.reduce((a, b) => a + b, 0);
                const diff = parseFloat((g.totalW - curSum).toFixed(1));
                if (Math.abs(diff) > 0.001) {
                    const adjIdx = index === g.cols - 1 ? index - 1 : index + 1;
                    g.paneWidths[adjIdx] = parseFloat((g.paneWidths[adjIdx] + diff).toFixed(1));
                }
            } else {
                g.totalW = newVal;
            }
            Store.notify();
        };

        // Search Bar Handler (Parses window size like 100x140, presets, or material names with live catalog prices)
        window.handleCalcSearch = (query) => {
            window.calcSearchQuery = query;
            const q = (query || '').trim().toLowerCase();
            if (!q) {
                window.calcMaterialSearchQuery = '';
                Store.notify();
                return;
            }

            // Check for dimension syntax like "100x140", "150*140", "50 x 140"
            const dimMatch = q.match(/(\\d+(?:\\.\\d+)?)\\s*[*xX×]\\s*(\\d+(?:\\.\\d+)?)/);
            if (dimMatch) {
                const w = parseFloat(dimMatch[1]);
                const h = parseFloat(dimMatch[2]);
                if (w > 0 && h > 0) {
                    snapshotCalc();
                    g.totalW = w;
                    g.totalH = h;
                    const baseWCm = convertUnit(w, g.unit, 'cm');
                    const estimatedCols = Math.max(1, Math.min(6, Math.round(baseWCm / 50)));
                    g.cols = estimatedCols;
                    const paneW = parseFloat((w / estimatedCols).toFixed(1));
                    g.paneWidths = Array(estimatedCols).fill(paneW);
                    g.panePartitions = Array(estimatedCols).fill(0);
                    g.partitionPos = Array(estimatedCols).fill('top');
                    Store.notify();
                    return;
                }
            }

            // Check for "1 kalli", "2 kalli", etc.
            const kalliMatch = q.match(/(\\d)\\s*kalli/);
            if (kalliMatch) {
                window.loadPreset(parseInt(kalliMatch[1]));
                return;
            }

            // Filter materials
            window.calcMaterialSearchQuery = q;
            Store.notify();
        };

        const generatedModelTitle = `WINDOW W${g.cols} (${g.totalW}x${g.totalH} ${g.unit})`;

        // 2D Visualizer SVG
        const svgW = 820;
        const svgH = 370;
        const maxAvailW = svgW - 170;
        const maxAvailH = svgH - 75;

        const aspect = (w_mm > 0 && h_mm > 0) ? (w_mm / h_mm) : (g.cols * 50 / 140);
        let drawW, drawH;
        if (aspect >= (maxAvailW / maxAvailH)) {
            drawW = maxAvailW;
            drawH = Math.max(120, drawW / aspect);
        } else {
            drawH = maxAvailH;
            drawW = Math.max(120, drawH * aspect);
        }

        const startX = 135 + ((maxAvailW - drawW) / 2);
        const startY = 16 + ((maxAvailH - drawH) / 2);

        // Visual Frame Thickness derived from Profile item (50mm -> 12px, 40mm -> 9px, 60mm -> 15px)
        let frameThick = 9;
        if (frameItem.sideWidthMm) {
            frameThick = Math.max(7, Math.min(18, Math.round(frameItem.sideWidthMm * 0.22)));
        } else {
            frameThick = Math.max(6, Math.min(14, Math.round(drawH * 0.038)));
        }

        let gridSvg = '';
        let paneOverlays = '';
        let currentX = startX;

        for (let i = 0; i < g.cols; i++) {
            const paneFraction = (g.paneWidths[i] && g.totalW > 0) ? (g.paneWidths[i] / g.totalW) : (1 / g.cols);
            const drawPaneW = drawW * paneFraction;
            const innerX = currentX + (i === 0 ? frameThick : (frameThick / 2));
            const innerY = startY + frameThick;
            const innerW = drawPaneW - (i === 0 || i === g.cols - 1 ? frameThick * 1.5 : frameThick);
            const innerH = drawH - (frameThick * 2);

            const parts = g.panePartitions[i] || 0;
            const pos = (g.partitionPos && g.partitionPos[i]) || 'top';
            if (parts === 1) {
                let pyFraction = 0.32; // default top
                if (pos === 'center') pyFraction = 0.50;
                else if (pos === 'bottom') pyFraction = 0.68;
                const py = startY + (drawH * pyFraction);
                gridSvg += `<line x1="${innerX}" y1="${py}" x2="${innerX + innerW}" y2="${py}" stroke="#15803d" stroke-width="${frameThick * 0.8}" style="transition: all 0.2s;" />`;
            } else if (parts > 1) {
                for (let p = 1; p <= parts; p++) {
                    const py = startY + (drawH * (p / (parts + 1)));
                    gridSvg += `<line x1="${innerX}" y1="${py}" x2="${innerX + innerW}" y2="${py}" stroke="#15803d" stroke-width="${frameThick * 0.8}" style="transition: all 0.2s;" />`;
                }
            }

            if (i < g.cols - 1) {
                gridSvg += `<line x1="${currentX + drawPaneW}" y1="${startY}" x2="${currentX + drawPaneW}" y2="${startY + drawH}" stroke="#14532d" stroke-width="${frameThick}" />`;
            }

            // Pane HTML Overlay: Positioned neatly INSIDE pane with partition count & position toggle button
            paneOverlays += `
                <div style="position: absolute; left: ${innerX + Math.max(0, (innerW - 86) / 2)}px; top: ${innerY + 14}px; display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 20;">
                    <div 
                        onclick="window.cyclePanePartition(${i})" 
                        title="Click to cycle partitions (${parts} -> ${(parts + 1) % 3})"
                        style="background: rgba(255,255,255,0.96); border: 1.5px solid #15803d; border-radius: 6px; padding: 3px 10px; display: flex; flex-direction: column; align-items: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.12); user-select: none; transition: transform 0.15s ease;"
                        onmouseover="this.style.transform='scale(1.05)'"
                        onmouseout="this.style.transform='scale(1)'"
                    >
                        <div style="font-size: 0.92rem; font-weight: 800; color: #15803d; line-height: 1;">${parts}</div>
                        <div style="font-size: 0.55rem; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                    </div>

                    ${parts === 1 ? `
                        <button 
                            type="button" 
                            onclick="window.cyclePanePartitionPos(${i})"
                            title="Click to change position: Top -> Center -> Bottom"
                            style="background: #15803d; color: white; border: none; border-radius: 4px; padding: 2px 7px; font-size: 0.62rem; font-weight: 800; text-transform: uppercase; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.15);"
                        >
                            ${pos}
                        </button>
                    ` : ''}
                </div>

                <!-- Individual Pane Width Input Directly Under Pane -->
                <div style="position: absolute; left: ${innerX}px; top: ${startY + drawH + 6}px; width: ${innerW}px; text-align: center; z-index: 20;">
                    <div style="font-size: 0.65rem; color: #64748b; font-weight: 600; margin-bottom: 1px;">W(${g.unit})</div>
                    <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.paneWidths[i]}" onchange="window.updateIndividualPaneWidth(${i}, this.value)" style="width: 52px; height: 24px; text-align: center; font-weight: 700; font-size: 0.88rem; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.06); outline: none;">
                </div>
            `;

            currentX += drawPaneW;
        }

        // Material Dropdown Builder with '-- None (Not Included) --'
        const renderMatCol = (catKey, label, allowedCats, currentVal) => {
            const query = window.calcMaterialSearchQuery || '';
            const items = catalog.filter(m => {
                const cat = (m.category || '').toLowerCase();
                const matches = allowedCats.some(c => cat === c.toLowerCase() || cat.includes(c.toLowerCase()));
                if (!matches) return false;
                if (!query) return true;
                return (m.name || '').toLowerCase().includes(query) || (m.description || '').toLowerCase().includes(query);
            });

            return `
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 0.74rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${label}</label>
                    <select onchange="window.updateGrid('mat_${catKey}', this.value)" style="padding: 7px 6px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.8rem; font-weight: 600; outline: none; width: 100%;">
                        <option value="none" ${currentVal === 'none' ? 'selected' : ''}>-- None (Not Included) --</option>
                        ${items.map(m => `
                            <option value="${m.id}" ${(currentVal === m.id || currentVal === m.name) ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                        `).join('')}
                    </select>
                </div>
            `;
        };

        return `
            <style>
                .hide-spin::-webkit-inner-spin-button, .hide-spin::-webkit-outer-spin-button { -webkit-appearance: none !important; margin: 0 !important; }
                .hide-spin { -moz-appearance: textfield !important; }
            </style>
            <div class="quick-calc-container" style="display: flex; flex-direction: column; gap: 1.25rem; font-family: var(--font-main, sans-serif); max-width: 1400px; margin: 0 auto;">
                
                <!-- 1. TOP CONTROL BAR -->
                <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 14px;">
                    
                    <!-- Top Row: Status Dot on Left, Design Model & Unit Dropdown on TOP RIGHT -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                        
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                            <span style="font-size: 0.85rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">Window Studio Estimator</span>
                        </div>

                        <!-- TOP RIGHT: DESIGN MODEL & UNIT SELECT -->
                        <div style="display: flex; align-items: center; gap: 16px; margin-left: auto;">
                            <div style="text-align: right;">
                                <div style="font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">DESIGN MODEL</div>
                                <div style="font-size: 1.15rem; font-weight: 800; color: #0284c7; margin-top: 1px;">${generatedModelTitle}</div>
                            </div>

                            <!-- Unit Dropdown (Select) -->
                            <div style="display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 4px 8px;">
                                <span style="font-size: 0.72rem; color: #64748b; font-weight: 700;">UNIT:</span>
                                <select 
                                    id="calc-unit-select" 
                                    onchange="window.toggleUnit(this.value)" 
                                    style="border: none; background: transparent; font-size: 0.85rem; font-weight: 800; color: #0f172a; outline: none; cursor: pointer; text-transform: uppercase;"
                                >
                                    <option value="cm" ${g.unit === 'cm' ? 'selected' : ''}>CM</option>
                                    <option value="mm" ${g.unit === 'mm' ? 'selected' : ''}>MM</option>
                                    <option value="inch" ${g.unit === 'inch' ? 'selected' : ''}>INCH</option>
                                    <option value="ft" ${g.unit === 'ft' ? 'selected' : ''}>FT</option>
                                    <option value="m" ${g.unit === 'm' ? 'selected' : ''}>M</option>
                                </select>
                            </div>
                        </div>

                    </div>

                    <!-- Middle Row: 7 Separate Material Columns Grid ('3. Panel' instead of '3. Panel / Sheet') -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; align-items: flex-end;">
                        ${renderMatCol('frame', '1. Profile', ['profile', 'frame'], rc.materials.frame)}
                        ${renderMatCol('pipe', '2. Pipe', ['pipe', 'tube'], rc.materials.pipe)}
                        ${renderMatCol('panel', '3. Panel', ['panel', 'sheet', 'glass'], rc.materials.panel)}
                        ${renderMatCol('hinge', '4. Hinges', ['hinges', 'hinge'], rc.materials.hinge)}
                        ${renderMatCol('lock', '5. Lock & Accessories', ['lock', 'lock & accessories', 'accessories'], rc.materials.lock)}
                        ${renderMatCol('hook', '6. Hook & Rubber', ['hook', 'hook & rubber', 'rubber'], rc.materials.hook)}
                        ${renderMatCol('paint', '7. Paint', ['paint', 'coating'], rc.materials.paint)}
                    </div>

                    <!-- Bottom Row (Below Materials): Kalli Presets on Left + Search Bar on Right -->
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                        
                        <!-- Kalli Presets 1 to 6 Kalli -->
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-right: 4px;">PANES:</span>
                            <div style="display: flex; gap: 4px; background: #f1f5f9; padding: 3px 6px; border-radius: 6px;">
                                ${[1, 2, 3, 4, 5, 6].map(k => `
                                    <button 
                                        type="button" 
                                        onclick="window.loadPreset(${k})" 
                                        style="border: none; background: ${g.cols === k ? '#0284c7' : 'transparent'}; color: ${g.cols === k ? '#ffffff' : '#475569'}; padding: 4px 10px; font-size: 0.78rem; font-weight: 700; border-radius: 4px; cursor: pointer; transition: all 0.15s ease;"
                                        title="${k} Kalli (${k * 50}x140 cm)"
                                    >
                                        ${k} Kalli
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Search Bar with Live Dimension Parsing (e.g. 100x140) and Catalog Material Lookup -->
                        <div style="flex: 1; max-width: 380px; min-width: 220px; margin-left: auto;">
                            <div style="position: relative;">
                                <input 
                                    type="text" 
                                    id="calc-search-bar" 
                                    placeholder="🔍 Search size (e.g. 100x140) or preset..." 
                                    value="${window.calcSearchQuery || ''}"
                                    oninput="window.handleCalcSearch(this.value)"
                                    style="width: 100%; padding: 6px 12px 6px 30px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; outline: none; background: #f8fafc; font-weight: 600;"
                                >
                                <span style="position: absolute; left: 9px; top: 7px; font-size: 0.8rem; color: #94a3b8;">🔍</span>
                                ${window.calcSearchQuery ? `
                                    <button onclick="window.handleCalcSearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.85rem;">×</button>
                                ` : ''}
                            </div>
                        </div>

                    </div>

                </div>

                <!-- 2. 2D INTERACTIVE MODEL CANVAS CONTAINER -->
                <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); position: relative;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></span>
                            <span style="font-size: 0.85rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">Interactive 2D Window Model</span>
                        </div>
                        <div style="font-size: 0.78rem; color: #64748b; font-weight: 600;">
                            Area: <strong>${areaSqFt.toFixed(2)} sq.ft</strong> (${(areaSqFt * 0.0929).toFixed(2)} m²) • Perimeter: <strong>${outerPerimeterFt.toFixed(2)} ft</strong>
                        </div>
                    </div>

                    <div style="position: relative; width: 100%; height: 410px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        
                        <!-- SVG Window Visualization with Profile Proportions -->
                        <svg viewBox="0 0 ${svgW} ${svgH}" style="width: 100%; height: 100%; max-height: 410px;">
                            <rect x="${startX}" y="${startY}" width="${drawW}" height="${drawH}" fill="rgba(240, 253, 244, 0.75)" stroke="#15803d" stroke-width="${frameThick}" rx="2" style="transition: all 0.25s ease-out;" />
                            <!-- Inner rebate bevel line for authentic profile appearance -->
                            <rect x="${startX + frameThick/2}" y="${startY + frameThick/2}" width="${drawW - frameThick}" height="${drawH - frameThick}" fill="none" stroke="#166534" stroke-width="1.5" opacity="0.5" />
                            ${gridSvg}
                        </svg>

                        <!-- Pane Overlays (Inside the pane: Partition Button + Position Toggle) -->
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto;">
                            ${paneOverlays}
                        </div>

                        <!-- Left Height Input Badge: Positioned Right Against Window Left Edge -->
                        <div style="position: absolute; left: ${Math.max(10, startX - 84)}px; top: ${startY + (drawH / 2) - 24}px; display: flex; flex-direction: column; align-items: center; z-index: 30; background: white; padding: 5px 8px; border-radius: 6px; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                            <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 2px; text-transform: uppercase;">Height (${g.unit})</div>
                            <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalH}" onchange="window.updateGrid('totalH', this.value)" style="width: 62px; height: 28px; text-align: center; font-weight: 800; font-size: 1rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 4px; background: #ffffff; outline: none;">
                        </div>

                        <!-- Bottom Total Width Badge: Centered Directly Below Window -->
                        <div style="position: absolute; left: ${startX + (drawW / 2) - 55}px; top: ${startY + drawH + 38}px; display: flex; align-items: center; gap: 6px; z-index: 30; background: white; padding: 4px 10px; border-radius: 6px; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                            <span style="font-size: 0.7rem; color: #64748b; font-weight: 700;">TOTAL W:</span>
                            <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalW}" onchange="window.updateGrid('totalW', this.value)" style="width: 60px; height: 26px; text-align: center; font-weight: 800; font-size: 0.95rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 4px; background: #ffffff; outline: none;">
                            <span style="font-size: 0.72rem; font-weight: 700; color: #475569;">${g.unit}</span>
                        </div>

                        <!-- Live Price Badge on Bottom Right of Canvas (Matching Photo 2) -->
                        <div style="position: absolute; right: 20px; bottom: 16px; background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 6px 14px; box-shadow: 0 4px 12px rgba(16,185,129,0.15); display: flex; flex-direction: column; align-items: flex-end; z-index: 30;">
                            <span style="font-size: 0.65rem; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">ESTIMATED PRICE</span>
                            <span style="font-size: 1.4rem; font-weight: 900; color: #047857; line-height: 1.1;">${currency} ${Math.round(grandTotal).toLocaleString('en-IN')}</span>
                        </div>

                    </div>
                </div>

                <!-- 3. PRICING & COST BREAKDOWN SECTION -->
                <div style="display: grid; grid-template-columns: 1.6fr 1.1fr; gap: 1.5rem; align-items: start;">
                    
                    <!-- Itemized Material Breakdown Table -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); background: var(--color-bg-card);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.6rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="layers" style="width: 18px; height: 18px; color: var(--color-primary);"></i>
                                <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase; letter-spacing: 0.5px;">Material Calculation Breakdown</h3>
                            </div>
                            <span style="font-size: 0.72rem; color: var(--color-text-muted);">Itemized details</span>
                        </div>

                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
                                <thead>
                                    <tr style="border-bottom: 1.5px solid var(--glass-border); color: var(--color-text-muted); text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                        <th style="padding: 0.5rem 0.6rem;">Material</th>
                                        <th style="padding: 0.5rem 0.6rem;">Dimension / Spec</th>
                                        <th style="padding: 0.5rem 0.6rem; text-align: right;">Weight (Kg/Ft)</th>
                                        <th style="padding: 0.5rem 0.6rem; text-align: right;">Unit Rate</th>
                                        <th style="padding: 0.5rem 0.6rem; text-align: right;">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style="border-bottom: 1px solid var(--glass-border);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: var(--color-text-heading);">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6;"></span>
                                                Profile
                                            </div>
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">
                                            ${frameItem.name}<br>
                                            ${frameItem.isNone ? '<span style="color: #94a3b8;">Not Included</span>' : `<span style="color: var(--color-text-main); font-weight: 600;">${frameLenFt.toFixed(2)} ft</span> (Perimeter)`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #3b82f6;">
                                            ${frameWeightKg > 0 ? frameWeightKg.toFixed(2) + ' Kg' : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            ${frameItem.isNone ? '-' : `${currency}${frameItem.rate}/kg`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            ${currency}${frameSubtotal.toFixed(0)}
                                        </td>
                                    </tr>

                                    <tr style="border-bottom: 1px solid var(--glass-border);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: var(--color-text-heading);">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #06b6d4;"></span>
                                                Pipe
                                            </div>
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">
                                            ${pipeItem.name}<br>
                                            ${pipeItem.isNone ? '<span style="color: #94a3b8;">Not Included</span>' : `<span style="color: var(--color-text-main); font-weight: 600;">${pipeLenFt.toFixed(2)} ft</span> (${g.cols - 1} mullions + ${totalPartitionDividers} parts)`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #06b6d4;">
                                            ${pipeWeightKg > 0 ? pipeWeightKg.toFixed(2) + ' Kg' : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            ${pipeItem.isNone ? '-' : `${currency}${pipeItem.rate}/kg`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            ${currency}${pipeSubtotal.toFixed(0)}
                                        </td>
                                    </tr>

                                    <tr style="border-bottom: 1px solid var(--glass-border);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: var(--color-text-heading);">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #8b5cf6;"></span>
                                                Panel
                                            </div>
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">
                                            ${panelItem.name}<br>
                                            ${panelItem.isNone ? '<span style="color: #94a3b8;">Not Included</span>' : `<span style="color: var(--color-text-main); font-weight: 600;">${panelAreaSqFt.toFixed(2)} sq.ft</span>`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #8b5cf6;">
                                            ${panelWeightKg > 0 ? panelWeightKg.toFixed(2) + ' Kg' : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            ${panelItem.isNone ? '-' : `${currency}${panelItem.rate}/sq.ft`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            ${currency}${panelSubtotal.toFixed(0)}
                                        </td>
                                    </tr>

                                    <tr style="border-bottom: 1px solid var(--glass-border);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: var(--color-text-heading);">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;"></span>
                                                Hinges
                                            </div>
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">
                                            ${hingeItem.name}<br>
                                            ${hingeItem.isNone ? '<span style="color: #94a3b8;">Not Included</span>' : `<span style="color: var(--color-text-main); font-weight: 600;">${hingeQty} nos</span>`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #f59e0b;">
                                            ${hingeWeightKg > 0 ? hingeWeightKg.toFixed(2) + ' Kg' : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            ${hingeItem.isNone ? '-' : `${currency}${hingeItem.rate}/no`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            ${currency}${hingeSubtotal.toFixed(0)}
                                        </td>
                                    </tr>

                                    <tr style="border-bottom: 1px solid var(--glass-border);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: var(--color-text-heading);">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #ec4899;"></span>
                                                Paint
                                            </div>
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">
                                            ${paintItem.name}<br>
                                            ${paintItem.isNone ? '<span style="color: #94a3b8;">Not Included</span>' : `<span style="color: var(--color-text-main); font-weight: 600;">${paintLtr} Ltr</span> (${surfaceAreaFt2.toFixed(1)} sq.ft surface)`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #ec4899;">
                                            ${paintLtr > 0 ? (paintLtr * 0.9).toFixed(2) + ' Kg' : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            ${paintItem.isNone ? '-' : `${currency}${paintItem.rate}/ltr`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            ${currency}${paintSubtotal.toFixed(0)}
                                        </td>
                                    </tr>

                                    <tr style="border-bottom: 1px solid var(--glass-border);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: var(--color-text-heading);">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
                                                Hook & Rubber
                                            </div>
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">
                                            ${hookItem.name}<br>
                                            ${hookItem.isNone ? '<span style="color: #94a3b8;">Not Included</span>' : `<span style="color: var(--color-text-main); font-weight: 600;">${hookQty} nos</span>`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #10b981;">
                                            ${hookWeightKg > 0 ? hookWeightKg.toFixed(2) + ' Kg' : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            ${hookItem.isNone ? '-' : `${currency}${hookItem.rate}/no`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            ${currency}${hookSubtotal.toFixed(0)}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: var(--color-text-heading);">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"></span>
                                                Lock & Accessories
                                            </div>
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">
                                            ${lockItem.name}<br>
                                            ${lockItem.isNone ? '<span style="color: #94a3b8;">Not Included</span>' : `<span style="color: var(--color-text-main); font-weight: 600;">${lockQty} nos</span>`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #ef4444;">
                                            ${lockWeightKg > 0 ? lockWeightKg.toFixed(2) + ' Kg' : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            ${lockItem.isNone ? '-' : `${currency}${lockItem.rate}/no`}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            ${currency}${lockSubtotal.toFixed(0)}
                                        </td>
                                    </tr>

                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Cost Summary Card -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); background: var(--color-bg-card); display: flex; flex-direction: column; gap: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.6rem;">
                            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase; letter-spacing: 0.5px;">Cost Summary</h3>
                            <span style="font-size: 0.72rem; color: #10b981; font-weight: 700;">Live Estimation</span>
                        </div>

                        <!-- Material Cost -->
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--glass-border);">
                            <div>
                                <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Total Material Cost</div>
                                <div style="font-size: 0.7rem; color: var(--color-text-muted);">Sum of itemized materials</div>
                            </div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-heading);">
                                ${currency} ${totalMaterialCost.toFixed(0)}
                            </div>
                        </div>

                        <!-- Labor Charges -->
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--glass-border);">
                            <div>
                                <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Labor Charges</div>
                                <div style="font-size: 0.7rem; color: var(--color-text-muted);">Fabrication & assembly</div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">${currency}</span>
                                <input 
                                    type="number" 
                                    step="50" 
                                    min="0" 
                                    value="${laborCharges}" 
                                    onchange="window.updateGrid('laborCharge', this.value)" 
                                    style="width: 90px; text-align: right; padding: 5px 8px; font-weight: 800; font-size: 0.95rem; border-radius: 6px; border: 1px solid var(--glass-border); background: var(--color-bg-card); color: var(--color-text-main);"
                                >
                            </div>
                        </div>

                        <!-- Margin / Profit % -->
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--glass-border);">
                            <div>
                                <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Margin / Profit %</div>
                                <div style="font-size: 0.7rem; color: #10b981; font-weight: 600;">
                                    + ${currency} ${addedProfit.toFixed(0)} profit
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <input 
                                    type="number" 
                                    step="1" 
                                    min="0" 
                                    max="100" 
                                    value="${profitMarginPercent}" 
                                    onchange="window.updateGrid('profitMarginPercent', this.value)" 
                                    style="width: 70px; text-align: right; padding: 5px 8px; font-weight: 800; font-size: 0.95rem; border-radius: 6px; border: 1px solid var(--glass-border); background: var(--color-bg-card); color: #10b981;"
                                >
                                <span style="font-size: 0.9rem; font-weight: 800; color: var(--color-text-muted);">%</span>
                            </div>
                        </div>

                        <!-- Grand Total -->
                        <div style="padding: 1.25rem 1rem; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1)); border: 2px solid rgba(16, 185, 129, 0.4); border-radius: 12px; text-align: center; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);">
                            <div style="font-size: 0.75rem; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 1px;">Final Grand Total</div>
                            <div style="font-size: 2.2rem; font-weight: 900; color: var(--color-text-heading); margin: 0.25rem 0; letter-spacing: -0.5px; line-height: 1.2;">
                                <span style="font-size: 1.4rem; opacity: 0.8; font-weight: 700; margin-right: 2px;">${currency}</span>${Math.round(grandTotal).toLocaleString('en-IN')}
                            </div>
                            <div style="font-size: 0.78rem; color: var(--color-text-muted); font-weight: 600;">
                                Rate: <strong>${currency} ${(grandTotal / areaSqFt).toFixed(0)} / sq.ft</strong> (${currency} ${(grandTotal / (areaSqFt * 0.0929)).toFixed(0)} / m²)
                            </div>
                        </div>

                    </div>
                </div>

                <!-- BOTTOM ACTION BAR: Instant Real-Time Indicator & Reset Defaults -->
                <div class="glass-panel" style="padding: 1rem 1.75rem; border-radius: var(--radius-lg); background: var(--color-bg-card); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-top: 2px solid var(--glass-border);">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981; display: inline-block;"></span>
                        <span style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-heading);">Quick Instant Calculator</span>
                        <span style="font-size: 0.75rem; color: var(--color-text-muted);">• Live engineering calculations • 1 Kalli 50x140cm default</span>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <button 
                            type="button" 
                            class="btn btn-secondary" 
                            onclick="window.resetQuickCalcDefaults()" 
                            style="padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;"
                        >
                            <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i>
                            Reset Defaults
                        </button>
                    </div>
                </div>

            </div>
        `;
    } catch (err) {
        console.error("Render Error:", err);
        return `<div style="padding: 2rem; color: red;">Error rendering calculator: ${err.message}<br><small>${err.stack}</small></div>`;
    }
}
'''

# Find the boundaries of function renderManualCalc
start_match = re.search(r'function\s+renderManualCalc\s*\(state\)\s*\{', src)
if not start_match:
    print('ERROR: renderManualCalc not found!')
    exit(1)

start_idx = start_match.start()

# Find the end of renderManualCalc (which is right before "// 2. QUOTATION CALCULATION STUDIO" or "window.startQuotationStudio")
end_match = re.search(r'\n(?://[^\n]*\n)*window\.startQuotationStudio\s*=', src[start_idx:])
if not end_match:
    print('ERROR: startQuotationStudio boundary not found!')
    exit(1)

end_idx = start_idx + end_match.start()

print(f'Replacing renderManualCalc from {start_idx} to {end_idx} (len {end_idx - start_idx})...')
src = src[:start_idx] + new_render_manual_calc.strip() + '\n\n' + src[end_idx:]

with open(calc_path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Updated calculation.js successfully!')
