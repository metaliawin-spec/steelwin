# Python script to replace renderManualCalc and append renderQuotationStudio in calculation.js
import os
import re

calc_path = 'js/modules/calculation.js'
with open(calc_path, 'r', encoding='utf-8') as f:
    src = f.read()

# Define the new implementation
new_code = '''
// Global Material Search state
window.calcMaterialSearchQuery = window.calcMaterialSearchQuery || '';
window.filterCalcMaterials = (q) => {
    window.calcMaterialSearchQuery = (q || '').toLowerCase().trim();
    Store.notify();
};

window.studioMaterialSearchQuery = window.studioMaterialSearchQuery || '';
window.filterStudioMaterials = (q) => {
    window.studioMaterialSearchQuery = (q || '').toLowerCase().trim();
    Store.notify();
};

// -----------------------------------------------------------------------------------------
// 1. QUICK CALCULATION (Real-Time 2D Studio - Always Starts at 1 Kalli 50x140 cm)
// -----------------------------------------------------------------------------------------
function renderManualCalc(state) {
    try {
        const defUnit = Store.state.settings?.preferences?.unit || 'cm';
        
        // 1. Initialize State: STRICTLY Starts on 1 KALLI (Single Pane) with 50 x 140 cm default
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

        // Units & Dimensions Normalization (using convertUnit)
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

        // Material 3: Panel / Sheet
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

        // Handlers
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
        const startY = 20 + ((maxAvailH - drawH) / 2);
        const frameThick = Math.max(4, Math.min(10, Math.round(drawH * 0.035)));

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
            if (parts > 0) {
                for (let p = 1; p <= parts; p++) {
                    const py = startY + (drawH * (p / (parts + 1)));
                    gridSvg += `<line x1="${innerX}" y1="${py}" x2="${innerX + innerW}" y2="${py}" stroke="#15803d" stroke-width="${frameThick * 0.75}" />`;
                }
            }

            if (i < g.cols - 1) {
                gridSvg += `<line x1="${currentX + drawPaneW}" y1="${startY}" x2="${currentX + drawPaneW}" y2="${startY + drawH}" stroke="#14532d" stroke-width="${frameThick}" />`;
            }

            paneOverlays += `
                <div style="position: absolute; left: ${innerX}px; top: ${innerY + 12}px; width: ${innerW}px; display: flex; justify-content: center; z-index: 20;">
                    <div 
                        onclick="window.cyclePanePartition(${i})" 
                        title="Click to cycle partitions (${parts} -> ${(parts + 1) % 3})"
                        style="background: rgba(255,255,255,0.95); border: 1.5px solid #15803d; border-radius: 5px; padding: 3px 8px; display: flex; flex-direction: column; align-items: center; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.1); user-select: none; transition: transform 0.15s ease;"
                        onmouseover="this.style.transform='scale(1.05)'"
                        onmouseout="this.style.transform='scale(1)'"
                    >
                        <div style="font-size: 0.88rem; font-weight: 800; color: #15803d; line-height: 1;">${parts}</div>
                        <div style="font-size: 0.55rem; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                    </div>
                </div>

                <div style="position: absolute; left: ${innerX}px; top: ${startY + drawH + 8}px; width: ${innerW}px; text-align: center; z-index: 20;">
                    <div style="font-size: 0.68rem; color: #64748b; font-weight: 600; margin-bottom: 2px;">W(${g.unit})</div>
                    <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.paneWidths[i]}" onchange="window.updateIndividualPaneWidth(${i}, this.value)" style="width: 58px; height: 26px; text-align: center; font-weight: 700; font-size: 0.92rem; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none;">
                </div>
            `;

            currentX += drawPaneW;
        }

        // Material Dropdown Builder with search filtering & '-- None (Not Included) --'
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
                
                <!-- 1. TOP CONTROL BAR: Design Model, Search Filter, and 7 Separate Material Columns (NO CLIENT NAME) -->
                <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                        
                        <!-- Left: Model Title & Kalli Presets -->
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div>
                                <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">DESIGN MODEL</div>
                                <div style="font-size: 1.15rem; font-weight: 800; color: #0284c7; margin-top: 1px;">${generatedModelTitle}</div>
                            </div>

                            <div style="display: flex; gap: 4px; background: #f1f5f9; padding: 3px 6px; border-radius: 6px;">
                                ${[1, 2, 3, 4, 5, 6].map(k => `
                                    <button 
                                        type="button" 
                                        onclick="window.loadPreset(${k})" 
                                        style="border: none; background: ${g.cols === k ? '#0284c7' : 'transparent'}; color: ${g.cols === k ? '#ffffff' : '#475569'}; padding: 4px 8px; font-size: 0.75rem; font-weight: 700; border-radius: 4px; cursor: pointer;"
                                        title="${k} Kalli (${k * 50}x140 cm)"
                                    >
                                        ${k} Kalli
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Center: Material Search Bar -->
                        <div style="flex: 1; max-width: 320px; min-width: 200px;">
                            <div style="position: relative;">
                                <input 
                                    type="text" 
                                    placeholder="🔍 Search materials..." 
                                    value="${window.calcMaterialSearchQuery || ''}"
                                    oninput="window.filterCalcMaterials(this.value)"
                                    style="width: 100%; padding: 6px 12px 6px 28px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; outline: none; background: #f8fafc;"
                                >
                                <span style="position: absolute; left: 8px; top: 7px; font-size: 0.8rem; color: #94a3b8;">🔍</span>
                            </div>
                        </div>

                        <!-- Right: Measurement Units (cm, mm, inch, ft, m) -->
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">UNIT:</span>
                            <div style="display: flex; background: #f1f5f9; padding: 3px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                ${['cm', 'mm', 'inch', 'ft', 'm'].map(u => `
                                    <button 
                                        type="button" 
                                        onclick="window.toggleUnit('${u}')" 
                                        style="border: none; background: ${g.unit === u ? '#10b981' : 'transparent'}; color: ${g.unit === u ? '#ffffff' : '#475569'}; padding: 4px 10px; font-size: 0.78rem; font-weight: 800; border-radius: 4px; cursor: pointer; text-transform: uppercase;"
                                    >
                                        ${u}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                    </div>

                    <!-- 7 Separate Material Columns Grid (Profile, Pipe, Panel, Hinges, Lock & Accessories, Hook & Rubber, Paint) -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; align-items: flex-end;">
                        ${renderMatCol('frame', '1. Profile / Frame', ['profile', 'frame'], rc.materials.frame)}
                        ${renderMatCol('pipe', '2. Pipe', ['pipe', 'tube'], rc.materials.pipe)}
                        ${renderMatCol('panel', '3. Panel / Sheet', ['panel', 'sheet', 'glass'], rc.materials.panel)}
                        ${renderMatCol('hinge', '4. Hinges', ['hinges', 'hinge'], rc.materials.hinge)}
                        ${renderMatCol('lock', '5. Lock & Accessories', ['lock', 'lock & accessories', 'accessories'], rc.materials.lock)}
                        ${renderMatCol('hook', '6. Hook & Rubber', ['hook', 'hook & rubber', 'rubber'], rc.materials.hook)}
                        ${renderMatCol('paint', '7. Paint', ['paint', 'coating'], rc.materials.paint)}
                    </div>
                </div>

                <!-- 2. 2D INTERACTIVE MODEL CANVAS CONTAINER -->
                <div style="background: white; border: 1px solid #cbd5e1; border-radius: 0 0 8px 8px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); position: relative;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></span>
                            <span style="font-size: 0.85rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">Interactive 2D Window Model</span>
                        </div>
                        <div style="font-size: 0.78rem; color: #64748b; font-weight: 600;">
                            Area: <strong>${areaSqFt.toFixed(2)} sq.ft</strong> (${(areaSqFt * 0.0929).toFixed(2)} m²) • Perimeter: <strong>${outerPerimeterFt.toFixed(2)} ft</strong>
                        </div>
                    </div>

                    <div style="position: relative; width: 100%; height: 380px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        
                        <!-- SVG Window Visualization -->
                        <svg viewBox="0 0 ${svgW} ${svgH}" style="width: 100%; height: 100%; max-height: 380px;">
                            <rect x="${startX}" y="${startY}" width="${drawW}" height="${drawH}" fill="rgba(240, 253, 244, 0.7)" stroke="#14532d" stroke-width="${frameThick}" rx="2" />
                            ${gridSvg}
                        </svg>

                        <!-- Pane Overlays (Partition Buttons & Width Inputs) -->
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto;">
                            ${paneOverlays}
                        </div>

                        <!-- Left Height Input Badge -->
                        <div style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; z-index: 30; background: white; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                            <div style="font-size: 0.68rem; color: #64748b; font-weight: 700; margin-bottom: 2px;">HEIGHT (${g.unit})</div>
                            <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalH}" onchange="window.updateGrid('totalH', this.value)" style="width: 70px; height: 30px; text-align: center; font-weight: 800; font-size: 1.05rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 5px; background: #ffffff; outline: none;">
                        </div>

                        <!-- Bottom Width Badge -->
                        <div style="position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; z-index: 30; background: white; padding: 4px 14px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                            <span style="font-size: 0.72rem; color: #64748b; font-weight: 700;">TOTAL W:</span>
                            <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalW}" onchange="window.updateGrid('totalW', this.value)" style="width: 75px; height: 28px; text-align: center; font-weight: 800; font-size: 1.05rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 5px; background: #ffffff; outline: none;">
                            <span style="font-size: 0.75rem; font-weight: 700; color: #475569;">${g.unit}</span>
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
                                    <!-- 1. Profile / Frame -->
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

                                    <!-- 2. Pipe -->
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

                                    <!-- 3. Panel / Sheet -->
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

                                    <!-- 4. Hinges -->
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

                                    <!-- 5. Paint -->
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

                                    <!-- 6. Hook & Rubber -->
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

                                    <!-- 7. Lock & Accessories -->
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


// -----------------------------------------------------------------------------------------
// 2. QUOTATION CALCULATION STUDIO (Full 2D Canvas + Step 1/2 Wizard + Save & New + Save)
// -----------------------------------------------------------------------------------------

// Launch or Resume Quotation Studio
window.startQuotationStudio = (customerData) => {
    const defUnit = Store.state.settings?.preferences?.unit || 'cm';
    Store.state.quoteStudio = {
        active: true,
        step: customerData ? 'canvas' : 'customer_setup', // 'customer_setup' or 'canvas'
        customer: customerData || {
            name: '',
            place: '',
            city: '',
            pincode: '',
            mobile: ''
        },
        materials: {
            frame: 'prof_box',
            pipe: 'tube_sq_1x1',
            panel: 'glass_5mm_clear',
            hinge: 'hinge_ss_4in',
            lock: 'lock_cockspur',
            hook: 'hook_stay_8in',
            paint: 'paint_epoxy_black'
        },
        items: [],
        currentWindow: {
            cols: 1, // ALWAYS START ON 1 KALLI
            rows: 1,
            unit: defUnit,
            totalW: convertUnit(50, 'cm', defUnit),
            totalH: convertUnit(140, 'cm', defUnit),
            paneWidths: [convertUnit(50, 'cm', defUnit)],
            panePartitions: [0],
            partitionPos: ['top'],
            quantity: 1,
            laborCharge: 800,
            profitMarginPercent: 15
        }
    };
    Store.state.calcTab = 'quotes';
    Store.state.currentView = 'calculation';
    Store.notify();
};

window.cancelQuotationStudio = () => {
    if (Store.state.quoteStudio?.items?.length > 0) {
        if (!confirm('Discard active quotation draft and return to quotes list?')) return;
    }
    Store.state.quoteStudio = null;
    Store.notify();
};

window.autofillQuoteCustomer = (custId) => {
    if (!custId || !Store.state.quoteStudio) return;
    const c = (Store.state.customers || []).find(cust => cust.id === custId);
    if (!c) return;
    const custState = Store.state.quoteStudio.customer;
    custState.name = c.name || '';
    custState.mobile = c.mobile || '';
    custState.place = c.place || c.address?.split(',')[0] || '';
    custState.city = c.city || (c.address?.includes(',') ? c.address.split(',')[1].trim() : '') || 'Kozhikode';
    custState.pincode = c.pincode || '673001';
    
    // Update inputs directly if in DOM
    const nameInput = document.getElementById('qs-cust-name');
    const placeInput = document.getElementById('qs-cust-place');
    const cityInput = document.getElementById('qs-cust-city');
    const pinInput = document.getElementById('qs-cust-pin');
    const mobInput = document.getElementById('qs-cust-mobile');
    if (nameInput) nameInput.value = custState.name;
    if (placeInput) placeInput.value = custState.place;
    if (cityInput) cityInput.value = custState.city;
    if (pinInput) pinInput.value = custState.pincode;
    if (mobInput) mobInput.value = custState.mobile;
};

// Wizard Step 1 & 2 validation -> Proceed to 2D Canvas Studio
window.proceedToQuotationCanvas = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!Store.state.quoteStudio) return;
    const cust = Store.state.quoteStudio.customer;

    cust.name = (document.getElementById('qs-cust-name')?.value || cust.name || '').trim();
    cust.place = (document.getElementById('qs-cust-place')?.value || cust.place || '').trim();
    cust.city = (document.getElementById('qs-cust-city')?.value || cust.city || '').trim();
    cust.pincode = (document.getElementById('qs-cust-pin')?.value || cust.pincode || '').trim();
    cust.mobile = (document.getElementById('qs-cust-mobile')?.value || cust.mobile || '').trim();

    // 5 Mandatory Fields Validation
    if (!cust.name) { alert('Please enter Customer Name (മസ്റ്റ് ആണ്).'); return; }
    if (!cust.place) { alert('Please enter Place / സ്ഥലം (മസ്റ്റ് ആണ്).'); return; }
    if (!cust.city) { alert('Please enter City (മസ്റ്റ് ആണ്).'); return; }
    if (!cust.pincode) { alert('Please enter Pincode (മസ്റ്റ് ആണ്).'); return; }
    if (!cust.mobile) { alert('Please enter Mobile Number (മസ്റ്റ് ആണ്).'); return; }

    // Save selected default materials
    const mats = Store.state.quoteStudio.materials;
    mats.frame = document.getElementById('qs-mat-frame')?.value || mats.frame;
    mats.pipe = document.getElementById('qs-mat-pipe')?.value || mats.pipe;
    mats.panel = document.getElementById('qs-mat-panel')?.value || mats.panel;
    mats.hinge = document.getElementById('qs-mat-hinge')?.value || mats.hinge;
    mats.lock = document.getElementById('qs-mat-lock')?.value || mats.lock;
    mats.hook = document.getElementById('qs-mat-hook')?.value || mats.hook;
    mats.paint = document.getElementById('qs-mat-paint')?.value || mats.paint;

    Store.state.quoteStudio.step = 'canvas';
    Store.notify();
};

// Studio Canvas Handlers
window.updateStudioGrid = (key, val) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    if (key.startsWith('mat_')) {
        const matKey = key.split('_')[1];
        Store.state.quoteStudio.materials[matKey] = val;
    } else if (key === 'cols') {
        const newCols = Math.max(1, parseInt(val) || 1);
        cw.cols = newCols;
        const defaultW = parseFloat((cw.totalW / newCols).toFixed(1));
        cw.paneWidths = Array(newCols).fill(defaultW);
        cw.panePartitions = Array(newCols).fill(0);
        cw.partitionPos = Array(newCols).fill('top');
    } else if (key === 'totalW') {
        const newTotal = parseFloat(val) || 0;
        const oldTotal = cw.totalW || 1;
        cw.totalW = newTotal;
        if (cw.paneWidths && cw.paneWidths.length === cw.cols && oldTotal > 0) {
            cw.paneWidths = cw.paneWidths.map(pw => parseFloat(((pw / oldTotal) * newTotal).toFixed(1)));
        }
    } else if (key === 'totalH') {
        cw.totalH = parseFloat(val) || 0;
    } else if (key === 'laborCharge') {
        cw.laborCharge = parseFloat(val) || 0;
    } else if (key === 'profitMarginPercent') {
        cw.profitMarginPercent = parseFloat(val) || 0;
    }
    Store.notify();
};

window.loadStudioPreset = (cols) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    const newCols = Math.max(1, parseInt(cols) || 1);
    cw.cols = newCols;
    const widthCm = newCols * 50;
    cw.totalW = convertUnit(widthCm, 'cm', cw.unit);
    cw.totalH = convertUnit(140, 'cm', cw.unit);
    const paneWInUnit = convertUnit(50, 'cm', cw.unit);
    cw.paneWidths = Array(newCols).fill(paneWInUnit);
    cw.panePartitions = Array(newCols).fill(0);
    cw.partitionPos = Array(newCols).fill('top');
    Store.notify();
};

window.toggleStudioUnit = (newUnit) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    if (newUnit === cw.unit) return;
    const oldUnit = cw.unit;
    cw.totalW = convertUnit(cw.totalW, oldUnit, newUnit);
    cw.totalH = convertUnit(cw.totalH, oldUnit, newUnit);
    if (cw.paneWidths && cw.paneWidths.length) {
        cw.paneWidths = cw.paneWidths.map(w => convertUnit(w, oldUnit, newUnit));
    }
    cw.unit = newUnit;
    Store.notify();
};

window.cycleStudioPartition = (idx) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    if (!cw.panePartitions) cw.panePartitions = Array(cw.cols).fill(0);
    const cur = cw.panePartitions[idx] || 0;
    cw.panePartitions[idx] = (cur + 1) % 3;
    Store.notify();
};

window.updateStudioPaneWidth = (idx, val) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    let newVal = parseFloat(val) || 0;
    if (newVal < 0) newVal = 0;
    if (newVal > cw.totalW) newVal = cw.totalW;
    cw.paneWidths[idx] = newVal;
    if (cw.cols > 1) {
        const remainingW = Math.max(0, cw.totalW - newVal);
        const eachOther = parseFloat((remainingW / (cw.cols - 1)).toFixed(1));
        for (let i = 0; i < cw.cols; i++) {
            if (i !== idx) cw.paneWidths[i] = eachOther;
        }
        const curSum = cw.paneWidths.reduce((a, b) => a + b, 0);
        const diff = parseFloat((cw.totalW - curSum).toFixed(1));
        if (Math.abs(diff) > 0.001) {
            const adjIdx = idx === cw.cols - 1 ? idx - 1 : idx + 1;
            cw.paneWidths[adjIdx] = parseFloat((cw.paneWidths[adjIdx] + diff).toFixed(1));
        }
    } else {
        cw.totalW = newVal;
    }
    Store.notify();
};

window.updateStudioQty = (val) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const qty = Math.max(1, parseInt(val) || 1);
    Store.state.quoteStudio.currentWindow.quantity = qty;
    Store.notify();
};

// "Save & New" - Adds current window to quote draft items and advances to next window for same customer
window.saveQuotationItemAndNew = () => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const qs = Store.state.quoteStudio;
    const cw = qs.currentWindow;
    const itemNum = qs.items.length + 1;
    const qty = Math.max(1, parseInt(cw.quantity) || 1);

    // Calculate BOM and final unit price for current window
    const w_mm = convertUnit(cw.totalW, cw.unit, 'mm');
    const h_mm = convertUnit(cw.totalH, cw.unit, 'mm');
    const w_ft = (w_mm / 25.4) / 12;
    const h_ft = (h_mm / 25.4) / 12;
    const areaSqFt = Math.max(0.01, w_ft * h_ft);
    const perimeterFt = 2 * (w_ft + h_ft);

    const catalog = Store.state.materialCatalog || [];
    const getCat = (key) => {
        const id = qs.materials[key];
        if (id === 'none' || !id) return { isNone: true, name: 'None', rate: 0, weightFactor: 0 };
        return catalog.find(m => m.id === id || m.name === id) || { name: key, rate: 0, weightFactor: 0 };
    };

    const fItem = getCat('frame');
    const pItem = getCat('pipe');
    const panItem = getCat('panel');
    const hItem = getCat('hinge');
    const paintItem = getCat('paint');
    const hookItem = getCat('hook');
    const lockItem = getCat('lock');

    const fCost = fItem.isNone ? 0 : (perimeterFt * (fItem.weightFactor || 1.45) * (fItem.rate || 180));
    const pCost = pItem.isNone ? 0 : ((((cw.cols - 1) * h_ft) + (cw.panePartitions.reduce((a,b)=>a+b,0) * (cw.totalW / cw.cols / 25.4 / 12))) * (pItem.weightFactor || 1.15) * (pItem.rate || 95));
    const panCost = panItem.isNone ? 0 : (areaSqFt * (panItem.rate || 55));
    const hCost = hItem.isNone ? 0 : (Math.max(2, cw.cols * 2) * (hItem.rate || 85));
    const paintCost = paintItem.isNone ? 0 : (Math.max(0.5, (perimeterFt * 0.45 / 12)) * (paintItem.rate || 480));
    const hookCost = hookItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (hookItem.rate || 75));
    const lockCost = lockItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (lockItem.rate || 160));

    const totalMat = fCost + pCost + panCost + hCost + paintCost + hookCost + lockCost;
    const base = totalMat + (cw.laborCharge || 800);
    const unitPrice = Math.round(base * (1 + ((cw.profitMarginPercent || 15) / 100)));
    const totalPrice = unitPrice * qty;

    const newItem = {
        id: 'W-' + Date.now(),
        itemNumber: `Window W${itemNum}`,
        name: `Window W${itemNum}`,
        desc: `${cw.cols} Kalli (${cw.totalW}x${cw.totalH} ${cw.unit}) - ${fItem.name}`,
        cols: cw.cols,
        width: cw.totalW,
        height: cw.totalH,
        unit: cw.unit,
        qty: qty,
        rate: unitPrice,
        price: unitPrice,
        total: totalPrice,
        areaSqFt: areaSqFt.toFixed(2),
        bomSummary: `${fItem.name}, ${pItem.name}, ${panItem.name}`
    };

    qs.items.push(newItem);

    // Reset current window for next window calculation (1 Kalli 50x140 cm default)
    const u = cw.unit || 'cm';
    qs.currentWindow = {
        cols: 1, // ALWAYS START ON 1 KALLI FOR NEXT WINDOW
        rows: 1,
        unit: u,
        totalW: convertUnit(50, 'cm', u),
        totalH: convertUnit(140, 'cm', u),
        paneWidths: [convertUnit(50, 'cm', u)],
        panePartitions: [0],
        partitionPos: ['top'],
        quantity: 1,
        laborCharge: 800,
        profitMarginPercent: 15
    };

    Store.notify();
    alert(`Window W${itemNum} saved! (${qty} nos • ₹${totalPrice.toLocaleString('en-IN')}). Ready to calculate Window W${itemNum + 1} for ${qs.customer.name}.`);
};

// "Save" - Finalizes quotation, creates customer if new, creates quotation in Store, and opens print modal
window.saveQuotationFinal = () => {
    if (!Store.state.quoteStudio) return;
    const qs = Store.state.quoteStudio;
    const cw = qs.currentWindow;

    // Check if current window has not been pushed yet, automatically save it as the last item
    if (cw && cw.totalW > 0 && cw.totalH > 0) {
        const qty = Math.max(1, parseInt(cw.quantity) || 1);
        const itemNum = qs.items.length + 1;

        const w_mm = convertUnit(cw.totalW, cw.unit, 'mm');
        const h_mm = convertUnit(cw.totalH, cw.unit, 'mm');
        const w_ft = (w_mm / 25.4) / 12;
        const h_ft = (h_mm / 25.4) / 12;
        const areaSqFt = Math.max(0.01, w_ft * h_ft);
        const perimeterFt = 2 * (w_ft + h_ft);

        const catalog = Store.state.materialCatalog || [];
        const getCat = (key) => {
            const id = qs.materials[key];
            if (id === 'none' || !id) return { isNone: true, name: 'None', rate: 0, weightFactor: 0 };
            return catalog.find(m => m.id === id || m.name === id) || { name: key, rate: 0, weightFactor: 0 };
        };

        const fItem = getCat('frame');
        const pItem = getCat('pipe');
        const panItem = getCat('panel');
        const hItem = getCat('hinge');
        const paintItem = getCat('paint');
        const hookItem = getCat('hook');
        const lockItem = getCat('lock');

        const fCost = fItem.isNone ? 0 : (perimeterFt * (fItem.weightFactor || 1.45) * (fItem.rate || 180));
        const pCost = pItem.isNone ? 0 : ((((cw.cols - 1) * h_ft) + (cw.panePartitions.reduce((a,b)=>a+b,0) * (cw.totalW / cw.cols / 25.4 / 12))) * (pItem.weightFactor || 1.15) * (pItem.rate || 95));
        const panCost = panItem.isNone ? 0 : (areaSqFt * (panItem.rate || 55));
        const hCost = hItem.isNone ? 0 : (Math.max(2, cw.cols * 2) * (hItem.rate || 85));
        const paintCost = paintItem.isNone ? 0 : (Math.max(0.5, (perimeterFt * 0.45 / 12)) * (paintItem.rate || 480));
        const hookCost = hookItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (hookItem.rate || 75));
        const lockCost = lockItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (lockItem.rate || 160));

        const totalMat = fCost + pCost + panCost + hCost + paintCost + hookCost + lockCost;
        const base = totalMat + (cw.laborCharge || 800);
        const unitPrice = Math.round(base * (1 + ((cw.profitMarginPercent || 15) / 100)));
        const totalPrice = unitPrice * qty;

        qs.items.push({
            id: 'W-' + Date.now(),
            itemNumber: `Window W${itemNum}`,
            name: `Window W${itemNum}`,
            desc: `${cw.cols} Kalli (${cw.totalW}x${cw.totalH} ${cw.unit}) - ${fItem.name}`,
            cols: cw.cols,
            width: cw.totalW,
            height: cw.totalH,
            unit: cw.unit,
            qty: qty,
            rate: unitPrice,
            price: unitPrice,
            total: totalPrice,
            areaSqFt: areaSqFt.toFixed(2),
            bomSummary: `${fItem.name}, ${pItem.name}, ${panItem.name}`
        });
    }

    if (qs.items.length === 0) {
        alert('Please add at least one window item to save quotation.');
        return;
    }

    // 1. Ensure Customer exists in Store
    if (!Store.state.customers) Store.state.customers = [];
    let existingCust = Store.state.customers.find(c => 
        (c.mobile && c.mobile === qs.customer.mobile) || 
        (c.name && c.name.toLowerCase() === qs.customer.name.toLowerCase())
    );

    if (!existingCust) {
        existingCust = {
            id: 'C-' + String(Store.state.customers.length + 1).padStart(3, '0'),
            name: qs.customer.name,
            place: qs.customer.place,
            city: qs.customer.city,
            pincode: qs.customer.pincode,
            address: `${qs.customer.place}, ${qs.customer.city} - ${qs.customer.pincode}`,
            mobile: qs.customer.mobile,
            orders: 1,
            totalValue: 0,
            advanceBalance: 0
        };
        Store.state.customers.push(existingCust);
    } else {
        existingCust.place = qs.customer.place || existingCust.place;
        existingCust.city = qs.customer.city || existingCust.city;
        existingCust.pincode = qs.customer.pincode || existingCust.pincode;
        existingCust.address = `${qs.customer.place || ''}, ${qs.customer.city || ''} - ${qs.customer.pincode || ''}`;
    }

    // 2. Generate Official Quotation
    if (!Store.state.quotations) Store.state.quotations = [];
    const quoteTotal = qs.items.reduce((sum, it) => sum + (it.total || 0), 0);
    const quoteNum = `Q-${new Date().getFullYear()}-${String(Store.state.quotations.length + 1).padStart(3, '0')}`;

    const newQuote = {
        id: quoteNum,
        customer: existingCust.name,
        customerId: existingCust.id,
        customerPhone: existingCust.mobile,
        customerAddress: existingCust.address,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: quoteTotal,
        total: quoteTotal,
        status: 'Draft',
        description: `Custom steel windows quotation for ${existingCust.name} (${qs.items.length} items)`,
        salesPerson: { name: Store.state.user?.name || 'Administrator', contact: Store.state.user?.phone || '9846123456' },
        items: qs.items.map(it => ({
            name: it.name,
            desc: it.desc,
            pieces: it.qty,
            qty: it.qty,
            rate: it.rate,
            price: it.price,
            total: it.total,
            uom: 'pcs'
        }))
    };

    Store.state.quotations.unshift(newQuote);
    Store.saveState();

    // Reset Studio State
    Store.state.quoteStudio = null;
    Store.notify();

    // Immediately trigger Print / View Modal
    setTimeout(() => {
        if (typeof window.openPrintQuotationModal === 'function') {
            window.openPrintQuotationModal(newQuote);
        } else {
            alert(`Quotation ${newQuote.id} created successfully! Total: ₹${quoteTotal.toLocaleString('en-IN')}`);
        }
    }, 100);
};

// Render Quotation Studio: Wizard (Step 1 & 2) OR 2D Interactive Canvas Studio
export function renderQuotationStudio(state) {
    const qs = Store.state.quoteStudio;
    if (!qs) return renderManualCalc(state);
    const catalog = Store.state.materialCatalog || [];
    const currency = Store.state.settings?.preferences?.currency || '₹';

    // ---------------------------------------------------------
    // STEP 1 & 2: Customer Details (5 Mandatory Fields) + Default Materials
    // ---------------------------------------------------------
    if (qs.step === 'customer_setup') {
        const cust = qs.customer || {};
        const mats = qs.materials || {};
        const customers = Store.state.customers || [];

        return `
            <div style="max-width: 850px; margin: 1.5rem auto; font-family: var(--font-main, sans-serif);">
                <div class="glass-panel" style="padding: 2.25rem; background: var(--color-bg-card); border-radius: 14px; border: 1px solid var(--glass-border); box-shadow: 0 10px 40px rgba(0,0,0,0.25);">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid var(--glass-border); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <h2 style="margin: 0; font-size: 1.4rem; font-weight: 800; color: var(--color-text-heading); display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="file-text" style="color: var(--color-primary);"></i>
                                Create Quotation - Client Details & Material Setup
                            </h2>
                            <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: var(--color-text-muted);">
                                Step 1: 5 Mandatory Customer Details • Step 2: Quotation Material Presets
                            </p>
                        </div>
                        <button type="button" onclick="window.cancelQuotationStudio()" class="btn btn-secondary" style="font-size: 0.82rem; padding: 6px 14px;">
                            Cancel
                        </button>
                    </div>

                    <form onsubmit="window.proceedToQuotationCanvas(event)" style="display: flex; flex-direction: column; gap: 1.5rem;">
                        
                        <!-- STEP 1: CUSTOMER DETAILS (5 MANDATORY FIELDS) -->
                        <div style="background: var(--color-bg-main); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1.25rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <span style="font-size: 0.88rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                                    Step 1: Customer Details (All 5 Fields Mandatory)
                                </span>
                                
                                <!-- Quick Select Existing Customer -->
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 0.75rem; color: var(--color-text-muted);">Quick Autofill:</span>
                                    <select onchange="window.autofillQuoteCustomer(this.value)" class="glass-input" style="font-size: 0.8rem; padding: 4px 8px; border-radius: 4px;">
                                        <option value="">-- Choose Existing Client --</option>
                                        ${customers.map(c => `<option value="${c.id}">${c.name} (${c.mobile || c.city || ''})</option>`).join('')}
                                    </select>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 12px; margin-bottom: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 4px;">1. Customer Name *</label>
                                    <input type="text" id="qs-cust-name" required value="${cust.name || ''}" placeholder="Full Name or Business Name" class="glass-input" style="width: 100%; font-size: 0.95rem; font-weight: 600; padding: 8px 12px;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 4px;">5. Mobile Number *</label>
                                    <input type="tel" id="qs-cust-mobile" required value="${cust.mobile || ''}" placeholder="10-digit mobile number" class="glass-input" style="width: 100%; font-size: 0.95rem; font-weight: 600; padding: 8px 12px;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 4px;">2. Place (സ്ഥലം) *</label>
                                    <input type="text" id="qs-cust-place" required value="${cust.place || ''}" placeholder="Area / Locality" class="glass-input" style="width: 100%; font-size: 0.9rem; padding: 8px 12px;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 4px;">3. City *</label>
                                    <input type="text" id="qs-cust-city" required value="${cust.city || ''}" placeholder="City / Town" class="glass-input" style="width: 100%; font-size: 0.9rem; padding: 8px 12px;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 4px;">4. Pincode *</label>
                                    <input type="text" id="qs-cust-pin" required value="${cust.pincode || ''}" placeholder="6-digit postal PIN" class="glass-input" style="width: 100%; font-size: 0.9rem; padding: 8px 12px;">
                                </div>
                            </div>
                        </div>

                        <!-- STEP 2: DEFAULT MATERIAL PRESETS WITH 'NONE' OPTION -->
                        <div style="background: var(--color-bg-main); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1.25rem;">
                            <div style="margin-bottom: 1rem;">
                                <span style="font-size: 0.88rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                                    Step 2: Quotation Material Presets
                                </span>
                                <p style="margin: 3px 0 0 0; font-size: 0.75rem; color: var(--color-text-muted);">
                                    Select the default materials for this customer's windows. Every material includes a '-- None (Not Included) --' option.
                                </p>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px;">
                                <!-- Profile -->
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">1. Profile / Frame</label>
                                    <select id="qs-mat-frame" class="glass-input" style="width: 100%; padding: 7px 8px; font-size: 0.82rem;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['profile', 'frame'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.frame === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Pipe -->
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">2. Pipe</label>
                                    <select id="qs-mat-pipe" class="glass-input" style="width: 100%; padding: 7px 8px; font-size: 0.82rem;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['pipe', 'tube'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.pipe === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Panel -->
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">3. Panel / Sheet</label>
                                    <select id="qs-mat-panel" class="glass-input" style="width: 100%; padding: 7px 8px; font-size: 0.82rem;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['panel', 'sheet', 'glass'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.panel === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Hinges -->
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">4. Hinges</label>
                                    <select id="qs-mat-hinge" class="glass-input" style="width: 100%; padding: 7px 8px; font-size: 0.82rem;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['hinges', 'hinge'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.hinge === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Lock & Accessories -->
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">5. Lock & Accessories</label>
                                    <select id="qs-mat-lock" class="glass-input" style="width: 100%; padding: 7px 8px; font-size: 0.82rem;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['lock', 'lock & accessories', 'accessories'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.lock === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Hook & Rubber -->
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">6. Hook & Rubber</label>
                                    <select id="qs-mat-hook" class="glass-input" style="width: 100%; padding: 7px 8px; font-size: 0.82rem;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['hook', 'hook & rubber', 'rubber'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.hook === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Paint -->
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">7. Paint</label>
                                    <select id="qs-mat-paint" class="glass-input" style="width: 100%; padding: 7px 8px; font-size: 0.82rem;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['paint', 'coating'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.paint === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Wizard Footer Actions -->
                        <div style="display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid var(--glass-border); padding-top: 1.25rem;">
                            <button type="button" class="btn btn-secondary" onclick="window.cancelQuotationStudio()" style="padding: 0.65rem 1.4rem;">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" style="padding: 0.65rem 1.8rem; font-weight: 800; display: flex; align-items: center; gap: 6px;">
                                Next: Open Window Studio <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        `;
    }

    // ---------------------------------------------------------
    // STEP 3: 2D CALCULATION CANVAS STUDIO (Exact same UI as Quick Calc + Client Banner + Quantity + Save/Save & New)
    // ---------------------------------------------------------
    const cust = qs.customer || {};
    const cw = qs.currentWindow || { cols: 1, totalW: 50, totalH: 140, unit: 'cm', paneWidths: [50], panePartitions: [0], partitionPos: ['top'], quantity: 1, laborCharge: 800, profitMarginPercent: 15 };
    const currentQty = Math.max(1, parseInt(cw.quantity) || 1);
    const draftItems = qs.items || [];
    const itemNum = draftItems.length + 1;

    // Normalization & Calculations
    const w_mm = convertUnit(cw.totalW, cw.unit, 'mm');
    const h_mm = convertUnit(cw.totalH, cw.unit, 'mm');
    const w_ft = (w_mm / 25.4) / 12;
    const h_ft = (h_mm / 25.4) / 12;
    const areaSqFt = Math.max(0.01, w_ft * h_ft);
    const outerPerimeterFt = 2 * (w_ft + h_ft);

    const getCatItem = (catKey, defaultId) => {
        const selId = qs.materials?.[catKey];
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

    // Material Costs
    const frameLenFt = frameItem.isNone ? 0 : outerPerimeterFt;
    const frameWeightKg = frameItem.isNone ? 0 : (frameLenFt * (frameItem.weightFactor || 1.45));
    const frameSubtotal = frameItem.isNone ? 0 : (frameWeightKg * (frameItem.rate || 180));

    let partitionLenFt = 0;
    let totalPartitionDividers = 0;
    if (!pipeItem.isNone) {
        for (let i = 0; i < cw.cols; i++) {
            const parts = cw.panePartitions?.[i] || 0;
            if (parts > 0) {
                totalPartitionDividers += parts;
                const pw_mm = convertUnit(cw.paneWidths?.[i] || 50, cw.unit, 'mm');
                partitionLenFt += parts * ((pw_mm / 25.4) / 12);
            }
        }
    }
    const pipeLenFt = pipeItem.isNone ? 0 : (((cw.cols - 1) * h_ft) + partitionLenFt);
    const pipeWeightKg = pipeItem.isNone ? 0 : (pipeLenFt * (pipeItem.weightFactor || 1.15));
    const pipeSubtotal = pipeItem.isNone ? 0 : (pipeWeightKg * (pipeItem.rate || 95));

    const panelAreaSqFt = panelItem.isNone ? 0 : areaSqFt;
    const panelWeightKg = panelItem.isNone ? 0 : (panelAreaSqFt * (panelItem.weightFactor || 1.15));
    const panelSubtotal = panelItem.isNone ? 0 : (panelAreaSqFt * (panelItem.rate || 55));

    const hingeQty = hingeItem.isNone ? 0 : Math.max(2, cw.cols * 2);
    const hingeWeightKg = hingeItem.isNone ? 0 : (hingeQty * (hingeItem.weightFactor || 0.18));
    const hingeSubtotal = hingeItem.isNone ? 0 : (hingeQty * (hingeItem.rate || 85));

    const surfaceAreaFt2 = paintItem.isNone ? 0 : ((frameLenFt + pipeLenFt) * 0.45);
    const paintLtr = paintItem.isNone ? 0 : Math.max(0.5, parseFloat((surfaceAreaFt2 / (paintItem.coverage || 12)).toFixed(2)));
    const paintSubtotal = paintItem.isNone ? 0 : (paintLtr * (paintItem.rate || 480));

    const hookQty = hookItem.isNone ? 0 : Math.max(1, Math.min(cw.cols, 2));
    const hookWeightKg = hookItem.isNone ? 0 : (hookQty * (hookItem.weightFactor || 0.20));
    const hookSubtotal = hookItem.isNone ? 0 : (hookQty * (hookItem.rate || 75));

    const lockQty = lockItem.isNone ? 0 : Math.max(1, Math.min(cw.cols, 2));
    const lockWeightKg = lockItem.isNone ? 0 : (lockQty * (lockItem.weightFactor || 0.25));
    const lockSubtotal = lockItem.isNone ? 0 : (lockQty * (lockItem.rate || 160));

    const totalMaterialCost = frameSubtotal + pipeSubtotal + panelSubtotal + hingeSubtotal + paintSubtotal + hookSubtotal + lockSubtotal;
    const laborCharges = parseFloat(cw.laborCharge ?? 800) || 0;
    const profitMarginPercent = parseFloat(cw.profitMarginPercent ?? 15) || 0;
    const baseCost = totalMaterialCost + laborCharges;
    const addedProfit = baseCost * (profitMarginPercent / 100);
    const grandTotal = baseCost + addedProfit;

    const generatedModelTitle = `WINDOW W${itemNum} (${cw.totalW}x${cw.totalH} ${cw.unit})`;

    // 2D Visualizer SVG
    const svgW = 820;
    const svgH = 370;
    const maxAvailW = svgW - 170;
    const maxAvailH = svgH - 75;

    const aspect = (w_mm > 0 && h_mm > 0) ? (w_mm / h_mm) : (cw.cols * 50 / 140);
    let drawW, drawH;
    if (aspect >= (maxAvailW / maxAvailH)) {
        drawW = maxAvailW;
        drawH = Math.max(120, drawW / aspect);
    } else {
        drawH = maxAvailH;
        drawW = Math.max(120, drawH * aspect);
    }

    const startX = 135 + ((maxAvailW - drawW) / 2);
    const startY = 20 + ((maxAvailH - drawH) / 2);
    const frameThick = Math.max(4, Math.min(10, Math.round(drawH * 0.035)));

    let gridSvg = '';
    let paneOverlays = '';
    let currentX = startX;

    for (let i = 0; i < cw.cols; i++) {
        const paneFraction = (cw.paneWidths?.[i] && cw.totalW > 0) ? (cw.paneWidths[i] / cw.totalW) : (1 / cw.cols);
        const drawPaneW = drawW * paneFraction;
        const innerX = currentX + (i === 0 ? frameThick : (frameThick / 2));
        const innerY = startY + frameThick;
        const innerW = drawPaneW - (i === 0 || i === cw.cols - 1 ? frameThick * 1.5 : frameThick);
        const innerH = drawH - (frameThick * 2);

        const parts = cw.panePartitions?.[i] || 0;
        if (parts > 0) {
            for (let p = 1; p <= parts; p++) {
                const py = startY + (drawH * (p / (parts + 1)));
                gridSvg += `<line x1="${innerX}" y1="${py}" x2="${innerX + innerW}" y2="${py}" stroke="#15803d" stroke-width="${frameThick * 0.75}" />`;
            }
        }

        if (i < cw.cols - 1) {
            gridSvg += `<line x1="${currentX + drawPaneW}" y1="${startY}" x2="${currentX + drawPaneW}" y2="${startY + drawH}" stroke="#14532d" stroke-width="${frameThick}" />`;
        }

        paneOverlays += `
            <div style="position: absolute; left: ${innerX}px; top: ${innerY + 12}px; width: ${innerW}px; display: flex; justify-content: center; z-index: 20;">
                <div 
                    onclick="window.cycleStudioPartition(${i})" 
                    title="Click to cycle partitions (${parts} -> ${(parts + 1) % 3})"
                    style="background: rgba(255,255,255,0.95); border: 1.5px solid #15803d; border-radius: 5px; padding: 3px 8px; display: flex; flex-direction: column; align-items: center; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.1); user-select: none; transition: transform 0.15s ease;"
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'"
                >
                    <div style="font-size: 0.88rem; font-weight: 800; color: #15803d; line-height: 1;">${parts}</div>
                    <div style="font-size: 0.55rem; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                </div>
            </div>

            <div style="position: absolute; left: ${innerX}px; top: ${startY + drawH + 8}px; width: ${innerW}px; text-align: center; z-index: 20;">
                <div style="font-size: 0.68rem; color: #64748b; font-weight: 600; margin-bottom: 2px;">W(${cw.unit})</div>
                <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.paneWidths?.[i] || 50}" onchange="window.updateStudioPaneWidth(${i}, this.value)" style="width: 58px; height: 26px; text-align: center; font-weight: 700; font-size: 0.92rem; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none;">
            </div>
        `;

        currentX += drawPaneW;
    }

    const renderStudioMatCol = (catKey, label, allowedCats, currentVal) => {
        const query = window.studioMaterialSearchQuery || '';
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
                <select onchange="window.updateStudioGrid('mat_${catKey}', this.value)" style="padding: 7px 6px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.8rem; font-weight: 600; outline: none; width: 100%;">
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
        <div class="quotation-studio-container" style="display: flex; flex-direction: column; gap: 1.25rem; font-family: var(--font-main, sans-serif); max-width: 1400px; margin: 0 auto;">
            
            <!-- 1. TOP CLIENT DETAILS BANNER (Customer Name, Mobile, Place, City, Pincode) -->
            <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 10px; padding: 14px 22px; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; box-shadow: 0 4px 16px rgba(0,0,0,0.25);">
                <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 38px; height: 38px; border-radius: 50%; background: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; color: white;">
                            ${(cust.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">QUOTATION CLIENT</div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: #ffffff;">${cust.name || 'Customer'}</div>
                        </div>
                    </div>

                    <div style="border-left: 1px solid #334155; padding-left: 16px;">
                        <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">CONTACT</div>
                        <div style="font-size: 0.92rem; font-weight: 700; color: #38bdf8;">📞 ${cust.mobile || '-'}</div>
                    </div>

                    <div style="border-left: 1px solid #334155; padding-left: 16px;">
                        <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">LOCATION</div>
                        <div style="font-size: 0.88rem; font-weight: 600; color: #cbd5e1;">📍 ${cust.place || ''}, ${cust.city || ''} - ${cust.pincode || ''}</div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="text-align: right;">
                        <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">CURRENT DESIGN</div>
                        <div style="font-size: 1.1rem; font-weight: 800; color: #10b981;">Window W${itemNum}</div>
                    </div>
                    <button 
                        type="button" 
                        onclick="Store.state.quoteStudio.step = 'customer_setup'; Store.notify();" 
                        class="btn btn-secondary" 
                        style="font-size: 0.78rem; padding: 6px 12px; background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: white;"
                    >
                        Edit Client
                    </button>
                </div>
            </div>

            <!-- 2. CONTROL BAR: Kalli Presets, Search Filter, Unit Switcher, and 7 Separate Material Columns -->
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                    
                    <!-- Left: Model Title & Kalli Presets -->
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div>
                            <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">DESIGN MODEL</div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: #0284c7; margin-top: 1px;">${generatedModelTitle}</div>
                        </div>

                        <div style="display: flex; gap: 4px; background: #f1f5f9; padding: 3px 6px; border-radius: 6px;">
                            ${[1, 2, 3, 4, 5, 6].map(k => `
                                <button 
                                    type="button" 
                                    onclick="window.loadStudioPreset(${k})" 
                                    style="border: none; background: ${cw.cols === k ? '#0284c7' : 'transparent'}; color: ${cw.cols === k ? '#ffffff' : '#475569'}; padding: 4px 8px; font-size: 0.75rem; font-weight: 700; border-radius: 4px; cursor: pointer;"
                                    title="${k} Kalli (${k * 50}x140 cm)"
                                >
                                    ${k} Kalli
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Center: Search Bar -->
                    <div style="flex: 1; max-width: 320px; min-width: 200px;">
                        <div style="position: relative;">
                            <input 
                                type="text" 
                                placeholder="🔍 Search materials..." 
                                value="${window.studioMaterialSearchQuery || ''}"
                                oninput="window.filterStudioMaterials(this.value)"
                                style="width: 100%; padding: 6px 12px 6px 28px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; outline: none; background: #f8fafc;"
                            >
                            <span style="position: absolute; left: 8px; top: 7px; font-size: 0.8rem; color: #94a3b8;">🔍</span>
                        </div>
                    </div>

                    <!-- Right: Unit Switcher (cm, mm, inch, ft, m) -->
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">UNIT:</span>
                        <div style="display: flex; background: #f1f5f9; padding: 3px; border-radius: 6px; border: 1px solid #e2e8f0;">
                            ${['cm', 'mm', 'inch', 'ft', 'm'].map(u => `
                                <button 
                                    type="button" 
                                    onclick="window.toggleStudioUnit('${u}')" 
                                    style="border: none; background: ${cw.unit === u ? '#10b981' : 'transparent'}; color: ${cw.unit === u ? '#ffffff' : '#475569'}; padding: 4px 10px; font-size: 0.78rem; font-weight: 800; border-radius: 4px; cursor: pointer; text-transform: uppercase;"
                                >
                                    ${u}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                </div>

                <!-- 7 Separate Material Columns Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; align-items: flex-end;">
                    ${renderStudioMatCol('frame', '1. Profile / Frame', ['profile', 'frame'], qs.materials.frame)}
                    ${renderStudioMatCol('pipe', '2. Pipe', ['pipe', 'tube'], qs.materials.pipe)}
                    ${renderStudioMatCol('panel', '3. Panel / Sheet', ['panel', 'sheet', 'glass'], qs.materials.panel)}
                    ${renderStudioMatCol('hinge', '4. Hinges', ['hinges', 'hinge'], qs.materials.hinge)}
                    ${renderStudioMatCol('lock', '5. Lock & Accessories', ['lock', 'lock & accessories', 'accessories'], qs.materials.lock)}
                    ${renderStudioMatCol('hook', '6. Hook & Rubber', ['hook', 'hook & rubber', 'rubber'], qs.materials.hook)}
                    ${renderStudioMatCol('paint', '7. Paint', ['paint', 'coating'], qs.materials.paint)}
                </div>
            </div>

            <!-- 3. 2D INTERACTIVE MODEL CANVAS -->
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); position: relative;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></span>
                        <span style="font-size: 0.85rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">Window W${itemNum} Interactive Canvas</span>
                    </div>
                    <div style="font-size: 0.78rem; color: #64748b; font-weight: 600;">
                        Area: <strong>${areaSqFt.toFixed(2)} sq.ft</strong> (${(areaSqFt * 0.0929).toFixed(2)} m²) • Perimeter: <strong>${outerPerimeterFt.toFixed(2)} ft</strong>
                    </div>
                </div>

                <div style="position: relative; width: 100%; height: 380px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    
                    <svg viewBox="0 0 ${svgW} ${svgH}" style="width: 100%; height: 100%; max-height: 380px;">
                        <rect x="${startX}" y="${startY}" width="${drawW}" height="${drawH}" fill="rgba(240, 253, 244, 0.7)" stroke="#14532d" stroke-width="${frameThick}" rx="2" />
                        ${gridSvg}
                    </svg>

                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto;">
                        ${paneOverlays}
                    </div>

                    <!-- Left Height Input Badge -->
                    <div style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; z-index: 30; background: white; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                        <div style="font-size: 0.68rem; color: #64748b; font-weight: 700; margin-bottom: 2px;">HEIGHT (${cw.unit})</div>
                        <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.totalH}" onchange="window.updateStudioGrid('totalH', this.value)" style="width: 70px; height: 30px; text-align: center; font-weight: 800; font-size: 1.05rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 5px; background: #ffffff; outline: none;">
                    </div>

                    <!-- Bottom Width Badge -->
                    <div style="position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; z-index: 30; background: white; padding: 4px 14px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                        <span style="font-size: 0.72rem; color: #64748b; font-weight: 700;">TOTAL W:</span>
                        <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.totalW}" onchange="window.updateStudioGrid('totalW', this.value)" style="width: 75px; height: 28px; text-align: center; font-weight: 800; font-size: 1.05rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 5px; background: #ffffff; outline: none;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: #475569;">${cw.unit}</span>
                    </div>

                </div>
            </div>

            <!-- 4. BREAKDOWN & PRICING -->
            <div style="display: grid; grid-template-columns: 1.6fr 1.1fr; gap: 1.5rem; align-items: start;">
                
                <!-- Table -->
                <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); background: var(--color-bg-card);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.6rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="layers" style="width: 18px; height: 18px; color: var(--color-primary);"></i>
                            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase;">Window W${itemNum} Material Breakdown</h3>
                        </div>
                        <span style="font-size: 0.72rem; color: var(--color-text-muted);">1 unit BOM</span>
                    </div>

                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
                            <thead>
                                <tr style="border-bottom: 1.5px solid var(--glass-border); color: var(--color-text-muted); text-align: left; font-size: 0.72rem; text-transform: uppercase;">
                                    <th style="padding: 0.5rem 0.6rem;">Material</th>
                                    <th style="padding: 0.5rem 0.6rem;">Spec / Length</th>
                                    <th style="padding: 0.5rem 0.6rem; text-align: right;">Weight</th>
                                    <th style="padding: 0.5rem 0.6rem; text-align: right;">Rate</th>
                                    <th style="padding: 0.5rem 0.6rem; text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Profile</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${frameItem.name}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #3b82f6;">${frameWeightKg > 0 ? frameWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${frameItem.isNone ? '-' : `${currency}${frameItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${frameSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Pipe</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${pipeItem.name}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #06b6d4;">${pipeWeightKg > 0 ? pipeWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${pipeItem.isNone ? '-' : `${currency}${pipeItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${pipeSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Panel</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${panelItem.name}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #8b5cf6;">${panelWeightKg > 0 ? panelWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${panelItem.isNone ? '-' : `${currency}${panelItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${panelSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Hinges</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${hingeItem.name} (${hingeQty} nos)</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #f59e0b;">${hingeWeightKg > 0 ? hingeWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${hingeItem.isNone ? '-' : `${currency}${hingeItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${hingeSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Paint</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${paintItem.name}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #ec4899;">-</td>
                                    <td style="padding: 0.6rem; text-align: right;">${paintItem.isNone ? '-' : `${currency}${paintItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${paintSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Hook & Rubber</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${hookItem.name} (${hookQty} nos)</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #10b981;">${hookWeightKg > 0 ? hookWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${hookItem.isNone ? '-' : `${currency}${hookItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${hookSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Lock & Accessories</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${lockItem.name} (${lockQty} nos)</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #ef4444;">${lockWeightKg > 0 ? lockWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${lockItem.isNone ? '-' : `${currency}${lockItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${lockSubtotal.toFixed(0)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Summary Card -->
                <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); background: var(--color-bg-card); display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.6rem;">
                        <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase;">Window W${itemNum} Price</h3>
                        <span style="font-size: 0.72rem; color: #10b981; font-weight: 700;">1 Piece Calculation</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.7rem 1rem; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--glass-border);">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Material Cost</span>
                        <span style="font-size: 1.1rem; font-weight: 800;">${currency} ${totalMaterialCost.toFixed(0)}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.7rem 1rem; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--glass-border);">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Labor Charges</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">${currency}</span>
                            <input type="number" step="50" min="0" value="${laborCharges}" onchange="window.updateStudioGrid('laborCharge', this.value)" style="width: 80px; text-align: right; padding: 4px 6px; font-weight: 800; font-size: 0.9rem; border-radius: 5px; border: 1px solid var(--glass-border); background: var(--color-bg-card); color: var(--color-text-main);">
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.7rem 1rem; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--glass-border);">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Margin / Profit %</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <input type="number" step="1" min="0" max="100" value="${profitMarginPercent}" onchange="window.updateStudioGrid('profitMarginPercent', this.value)" style="width: 60px; text-align: right; padding: 4px 6px; font-weight: 800; font-size: 0.9rem; border-radius: 5px; border: 1px solid var(--glass-border); background: var(--color-bg-card); color: #10b981;">
                            <span style="font-size: 0.85rem; font-weight: 800; color: var(--color-text-muted);">%</span>
                        </div>
                    </div>

                    <!-- Single Unit Grand Total -->
                    <div style="padding: 1.1rem 1rem; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1)); border: 2px solid rgba(16, 185, 129, 0.4); border-radius: 10px; text-align: center;">
                        <div style="font-size: 0.72rem; font-weight: 800; color: #10b981; text-transform: uppercase;">Window W${itemNum} Unit Price</div>
                        <div style="font-size: 2rem; font-weight: 900; color: var(--color-text-heading); margin: 2px 0;">
                            ${currency}${Math.round(grandTotal).toLocaleString('en-IN')}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600;">
                            ${currency} ${(grandTotal / areaSqFt).toFixed(0)} / sq.ft
                        </div>
                    </div>

                </div>

            </div>

            <!-- 5. BOTTOM ACTION BAR: Quantity Column on Left + Save & New + Save Final on Right -->
            <div class="glass-panel" style="padding: 1.1rem 1.75rem; border-radius: var(--radius-lg); background: var(--color-bg-card); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem; border-top: 2px solid var(--glass-border); box-shadow: 0 4px 20px rgba(0,0,0,0.12);">
                
                <!-- Bottom Left: Quantity Input & Batch Cost -->
                <div style="display: flex; align-items: center; gap: 1.25rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; background: var(--color-bg-main); padding: 8px 14px; border-radius: 8px; border: 1.5px solid var(--glass-border);">
                        <label style="font-size: 0.85rem; font-weight: 800; color: var(--color-text-heading); text-transform: uppercase; letter-spacing: 0.5px;">Quantity:</label>
                        <input 
                            type="number" 
                            id="studio-item-qty" 
                            min="1" 
                            step="1" 
                            value="${currentQty}" 
                            onchange="window.updateStudioQty(this.value)"
                            style="width: 65px; height: 32px; text-align: center; font-weight: 900; font-size: 1.1rem; color: var(--color-primary); border: 1.5px solid var(--color-primary); border-radius: 6px; background: var(--color-bg-card); outline: none;"
                        >
                    </div>

                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 600;">Unit: ${currency}${Math.round(grandTotal).toLocaleString('en-IN')} × ${currentQty} nos</span>
                        <span style="font-size: 1.15rem; font-weight: 900; color: #10b981;">Total: ${currency}${Math.round(grandTotal * currentQty).toLocaleString('en-IN')}</span>
                    </div>

                    ${draftItems.length > 0 ? `
                        <div style="margin-left: 0.5rem; padding: 4px 10px; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; font-size: 0.78rem; font-weight: 700; color: #3b82f6;">
                            ${draftItems.length} prior window(s) saved in this quote
                        </div>
                    ` : ''}
                </div>

                <!-- Bottom Right: Save & New, Save Final, and Cancel -->
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <button 
                        type="button" 
                        class="btn btn-secondary" 
                        onclick="window.cancelQuotationStudio()" 
                        style="padding: 0.65rem 1.2rem; font-size: 0.88rem; font-weight: 600;"
                    >
                        Cancel
                    </button>

                    <button 
                        type="button" 
                        onclick="window.saveQuotationItemAndNew()" 
                        class="btn btn-secondary"
                        style="padding: 0.65rem 1.4rem; font-size: 0.9rem; font-weight: 700; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; border-radius: 8px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3); cursor: pointer;"
                        title="Save current window calculation and calculate next window for this customer"
                    >
                        <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i>
                        Save & New
                    </button>

                    <button 
                        type="button" 
                        onclick="window.saveQuotationFinal()" 
                        class="btn btn-primary"
                        style="padding: 0.65rem 1.6rem; font-size: 0.92rem; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); cursor: pointer;"
                        title="Save all windows and finalize quotation"
                    >
                        <i data-lucide="check-circle-2" style="width: 16px; height: 16px;"></i>
                        Save
                    </button>
                </div>

            </div>

        </div>
    `;
}
'''

# Find the start of function renderManualCalc
start_match = re.search(r'function\s+renderManualCalc\s*\(state\)\s*\{', src)
if not start_match:
    print('ERROR: renderManualCalc not found!')
    exit(1)

start_idx = start_match.start()

# Find the end of renderManualCalc (which is right before function renderDesigner)
end_match = re.search(r'\n(?://[^\n]*\n)*function\s+renderDesigner\s*\(state\)\s*\{', src[start_idx:])
if not end_match:
    print('ERROR: renderDesigner boundary not found!')
    exit(1)

end_idx = start_idx + end_match.start()

print(f'Replacing renderManualCalc from {start_idx} to {end_idx} (len {end_idx - start_idx})...')
updated_src = src[:start_idx] + new_code + src[end_idx:]

with open(calc_path, 'w', encoding='utf-8') as f:
    f.write(updated_src)

print('Successfully patched calculation.js with new renderManualCalc and renderQuotationStudio!')
