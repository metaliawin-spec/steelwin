# Python script to apply the user's latest UI and layout refinements to calculation.js
import re

calc_path = 'js/modules/calculation.js'
with open(calc_path, 'r', encoding='utf-8') as f:
    src = f.read()

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

        // Visual Frame Thickness derived from Profile item (user requested animation & matching profile thickness):
        // 4x2.5 (40mm) -> 8px (sleek)
        // 5x2.5 (45mm) -> 10px
        // 4x3 (48mm) -> 11px
        // 5x3 (50mm) -> 12px (solid default)
        // Heavy Z (60mm) -> 15px
        // Step Rebated (65mm) -> 16px
        let frameThick = 12;
        if (frameItem.sideWidthMm) {
            frameThick = Math.max(7, Math.min(18, Math.round(frameItem.sideWidthMm * 0.23)));
        }

        // 2D Frame Dimensions:
        const maxAvailW = 540;
        const maxAvailH = 250;
        const aspect = (w_mm > 0 && h_mm > 0) ? (w_mm / h_mm) : (g.cols * 50 / 140);
        let drawW, drawH;
        if (aspect >= (maxAvailW / maxAvailH)) {
            drawW = maxAvailW;
            drawH = Math.max(120, Math.round(drawW / aspect));
        } else {
            drawH = maxAvailH;
            drawW = Math.max(90, Math.round(drawH * aspect));
        }

        let gridSvg = '';
        let paneOverlays = '';
        let currentPaneLeft = 0;

        for (let i = 0; i < g.cols; i++) {
            const paneFraction = (g.paneWidths[i] && g.totalW > 0) ? (g.paneWidths[i] / g.totalW) : (1 / g.cols);
            const drawPaneW = Math.round(drawW * paneFraction);
            const parts = g.panePartitions[i] || 0;
            const pos = (g.partitionPos && g.partitionPos[i]) || 'top';
            
            // SVG mullion divider between panes
            if (i < g.cols - 1) {
                const mullionX = currentPaneLeft + drawPaneW;
                gridSvg += `<line x1="${mullionX}" y1="0" x2="${mullionX}" y2="${drawH}" stroke="#14532d" stroke-width="${Math.max(4, Math.round(frameThick * 0.75))}" />`;
            }

            // SVG horizontal partition divider line inside this pane
            const innerPaneX = currentPaneLeft + (i === 0 ? frameThick : (frameThick / 2));
            const innerPaneW = drawPaneW - (i === 0 || i === g.cols - 1 ? frameThick * 1.5 : frameThick);
            if (parts === 1) {
                let pyFraction = 0.35; // top
                if (pos === 'center') pyFraction = 0.50;
                else if (pos === 'bottom') pyFraction = 0.65;
                const py = Math.round(drawH * pyFraction);
                gridSvg += `<line x1="${innerPaneX}" y1="${py}" x2="${innerPaneX + innerPaneW}" y2="${py}" stroke="#15803d" stroke-width="${Math.max(4, Math.round(frameThick * 0.7))}" stroke-linecap="round" style="transition: all 0.25s ease;" />`;
            } else if (parts > 1) {
                for (let p = 1; p <= parts; p++) {
                    const py = Math.round(drawH * (p / (parts + 1)));
                    gridSvg += `<line x1="${innerPaneX}" y1="${py}" x2="${innerPaneX + innerPaneW}" y2="${py}" stroke="#15803d" stroke-width="${Math.max(4, Math.round(frameThick * 0.7))}" stroke-linecap="round" style="transition: all 0.25s ease;" />`;
                }
            }

            // HTML Overlay for this Pane
            paneOverlays += `
                <div style="position: absolute; left: ${currentPaneLeft}px; top: 0; width: ${drawPaneW}px; height: ${drawH}px; pointer-events: none;">
                    
                    <!-- Partition Pill Inside the Pane -->
                    <div style="position: absolute; left: 50%; top: ${Math.round(drawH * 0.10)}px; transform: translateX(-50%); pointer-events: auto; display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 15;">
                        <div 
                            onclick="window.cyclePanePartition(${i})" 
                            title="Click to cycle partitions (${parts} -> ${(parts + 1) % 3})"
                            style="background: rgba(255,255,255,0.96); border: 1.5px solid #15803d; border-radius: 6px; padding: 2px 10px; display: flex; flex-direction: column; align-items: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.12); user-select: none; transition: transform 0.15s ease;"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'"
                        >
                            <div style="font-size: 0.95rem; font-weight: 800; color: #15803d; line-height: 1;">${parts}</div>
                            <div style="font-size: 0.52rem; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                        </div>

                        ${parts === 1 ? `
                            <button 
                                type="button" 
                                onclick="window.cyclePanePartitionPos(${i})"
                                title="Click to change position: Top -> Center -> Bottom"
                                style="background: #15803d; color: white; border: none; border-radius: 4px; padding: 2px 7px; font-size: 0.60rem; font-weight: 800; text-transform: uppercase; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.15); letter-spacing: 0.5px;"
                            >
                                ${pos}
                            </button>
                        ` : ''}
                    </div>

                    <!-- Individual Pane Width Input (Only shown when multi-pane cols > 1) -->
                    ${g.cols > 1 ? `
                        <div style="position: absolute; left: 50%; top: calc(100% + 6px); transform: translateX(-50%); pointer-events: auto; display: flex; flex-direction: column; align-items: center; z-index: 15;">
                            <span style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 1px;">W(${g.unit})</span>
                            <input 
                                type="number" 
                                class="hide-spin" 
                                step="${g.unit === 'mm' ? '10' : '0.5'}" 
                                min="1" 
                                value="${g.paneWidths[i]}" 
                                onchange="window.updateIndividualPaneWidth(${i}, this.value)" 
                                style="width: 52px; height: 26px; text-align: center; font-weight: 700; font-size: 0.9rem; color: #0f172a; border: 1.5px solid #cbd5e1; border-radius: 5px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none;"
                            >
                        </div>
                    ` : ''}

                </div>
            `;

            currentPaneLeft += drawPaneW;
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
                <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0;">
                    <label style="font-size: 0.72rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${label}</label>
                    <select onchange="window.updateGrid('mat_${catKey}', this.value)" style="padding: 6px 4px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.76rem; font-weight: 600; outline: none; width: 100%; text-overflow: ellipsis;">
                        <option value="none" ${currentVal === 'none' ? 'selected' : ''}>-- None --</option>
                        ${items.map(m => `
                            <option value="${m.id}" ${(currentVal === m.id || currentVal === m.name) ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                        `).join('')}
                    </select>
                </div>
            `;
        };

        const totalWTop = g.cols > 1 ? 'calc(100% + 56px)' : 'calc(100% + 14px)';

        return `
            <style>
                .hide-spin::-webkit-inner-spin-button, .hide-spin::-webkit-outer-spin-button { -webkit-appearance: none !important; margin: 0 !important; }
                .hide-spin { -moz-appearance: textfield !important; }
            </style>
            <div class="quick-calc-container" style="display: flex; flex-direction: column; gap: 1.25rem; font-family: var(--font-main, sans-serif); max-width: 1400px; margin: 0 auto;">
                
                <!-- 1. TOP CONTROL BAR -->
                <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 12px;">
                    
                    <!-- Top Row: Status Dot on Left, Design Model & Unit Dropdown on TOP RIGHT -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                        
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                            <span style="font-size: 0.85rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">Window Studio Estimator</span>
                        </div>

                        <!-- TOP RIGHT: DESIGN MODEL & UNIT SELECT -->
                        <div style="display: flex; align-items: center; gap: 16px; margin-left: auto;">
                            <div style="text-align: right;">
                                <div style="font-size: 0.68rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">DESIGN MODEL</div>
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

                    <!-- Middle Row: 7 Material Columns Grid on a Single Sleek Row ('3. Panel' strictly) -->
                    <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; align-items: flex-end;">
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
                        <div style="flex: 1; max-width: 360px; min-width: 220px; margin-left: auto;">
                            <div style="position: relative;">
                                <input 
                                    type="text" 
                                    id="calc-search-bar" 
                                    placeholder="Search size (e.g. 100x140) or preset..." 
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

                <!-- 2. 2D INTERACTIVE MODEL CANVAS CONTAINER (Mathematically Centered, Matching Photo 2) -->
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

                    <!-- Centering Viewport Container -->
                    <div style="position: relative; width: 100%; height: 430px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; padding-bottom: 20px;">
                        
                        <!-- Centered Window Frame Wrapper (Strictly drawW x drawH, all overlays attached relative to this!) -->
                        <div style="position: relative; width: ${drawW}px; height: ${drawH}px; margin: 0 auto; transition: width 0.3s ease, height 0.3s ease;">
                            
                            <!-- SVG Window Graphics (Profiles, Rebate Bevel & Dividers) -->
                            <svg viewBox="0 0 ${drawW} ${drawH}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible;">
                                <!-- Outer profile border with dynamic profile thickness & smooth animation -->
                                <rect x="${frameThick/2}" y="${frameThick/2}" width="${drawW - frameThick}" height="${drawH - frameThick}" fill="rgba(240, 253, 244, 0.7)" stroke="#15803d" stroke-width="${frameThick}" rx="2" style="transition: stroke-width 0.25s ease;" />
                                <!-- Inner rebate bevel line for authentic profile appearance -->
                                <rect x="${frameThick}" y="${frameThick}" width="${drawW - (frameThick * 2)}" height="${drawH - (frameThick * 2)}" fill="none" stroke="#166534" stroke-width="1.5" opacity="0.45" />
                                ${gridSvg}
                            </svg>

                            <!-- Pane Overlays (Inside the pane: Partition Pill + Position Toggle, and Pane Width) -->
                            ${paneOverlays}

                            <!-- Left Height Input Badge: Tightly Attached to Window Left Edge -->
                            <div style="position: absolute; right: calc(100% + 14px); top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; background: white; padding: 6px 10px; border-radius: 8px; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.08); white-space: nowrap; z-index: 20;">
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 3px; text-transform: uppercase;">HEIGHT (${g.unit})</div>
                                <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalH}" onchange="window.updateGrid('totalH', this.value)" style="width: 66px; height: 32px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #0284c7; border: 1.5px solid #7dd3fc; border-radius: 6px; background: #f8fafc; outline: none; line-height: 1;">
                            </div>

                            <!-- Bottom Total Width Badge: Centered Directly Under Window Frame -->
                            <div style="position: absolute; top: ${totalWTop}; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 6px; background: white; padding: 5px 12px; border-radius: 8px; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.08); white-space: nowrap; z-index: 20;">
                                <span style="font-size: 0.70rem; color: #64748b; font-weight: 700;">TOTAL W:</span>
                                <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalW}" onchange="window.updateGrid('totalW', this.value)" style="width: 62px; height: 28px; text-align: center; font-weight: 800; font-size: 1rem; color: #0284c7; border: 1.5px solid #7dd3fc; border-radius: 6px; background: #f8fafc; outline: none;">
                                <span style="font-size: 0.74rem; font-weight: 700; color: #475569;">${g.unit}</span>
                            </div>

                        </div>

                        <!-- Live Estimated Price Badge (Bottom Right of Canvas, Matching Photo 2) -->
                        <div style="position: absolute; right: 20px; bottom: 16px; background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 6px 14px; box-shadow: 0 4px 12px rgba(16,185,129,0.15); display: flex; flex-direction: column; align-items: flex-end; z-index: 30;">
                            <span style="font-size: 0.65rem; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">ESTIMATED PRICE</span>
                            <span style="font-size: 1.45rem; font-weight: 900; color: #047857; line-height: 1.1;">${currency} ${Math.round(grandTotal).toLocaleString('en-IN')}</span>
                        </div>

                    </div>
                </div>

                <!-- 3. PRICING & COST BREAKDOWN SECTION -->
                <div style="display: grid; grid-template-columns: 1.6fr 1.1fr; gap: 1.5rem; align-items: start;">
                    
                    <!-- Itemized Material Breakdown Table -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); background: var(--color-bg-card);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                            <div>
                                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--color-text-heading); display: flex; align-items: center; gap: 0.5rem;">
                                    <i data-lucide="layers" style="width: 18px; height: 18px; color: var(--color-primary);"></i>
                                    Material Calculation Breakdown
                                </h3>
                                <p style="margin: 0.2rem 0 0; font-size: 0.75rem; color: var(--color-text-muted);">Itemized details</p>
                            </div>
                        </div>

                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                <thead>
                                    <tr style="border-bottom: 1px solid var(--glass-border); text-align: left; color: var(--color-text-muted); font-size: 0.72rem; text-transform: uppercase;">
                                        <th style="padding: 0.6rem 0.5rem;">Material</th>
                                        <th style="padding: 0.6rem 0.5rem;">Dimension / Spec</th>
                                        <th style="padding: 0.6rem 0.5rem;">Weight (kg/ft)</th>
                                        <th style="padding: 0.6rem 0.5rem;">Unit Rate</th>
                                        <th style="padding: 0.6rem 0.5rem; text-align: right;">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style="border-bottom: 1px dashed var(--glass-border);">
                                        <td style="padding: 0.6rem 0.5rem; font-weight: 600;">
                                            <span style="color: #3b82f6;">Profile</span><br>
                                            <small style="color: var(--color-text-muted);">${frameItem.name}</small>
                                        </td>
                                        <td style="padding: 0.6rem 0.5rem;">${outerPerimeterFt.toFixed(2)} ft (Perimeter)</td>
                                        <td style="padding: 0.6rem 0.5rem;">${frameItem.isNone ? '-' : `${frameWeightKg.toFixed(2)} Kg`}</td>
                                        <td style="padding: 0.6rem 0.5rem;">${frameItem.isNone ? '-' : `${currency}${frameItem.rate}/kg`}</td>
                                        <td style="padding: 0.6rem 0.5rem; text-align: right; font-weight: 700;">${currency}${Math.round(frameSubtotal)}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px dashed var(--glass-border);">
                                        <td style="padding: 0.6rem 0.5rem; font-weight: 600;">
                                            <span style="color: #06b6d4;">Pipe</span><br>
                                            <small style="color: var(--color-text-muted);">${pipeItem.name}</small>
                                        </td>
                                        <td style="padding: 0.6rem 0.5rem;">${pipeLenFt.toFixed(2)} ft (${g.cols - 1} mullions + ${totalPartitionDividers} parts)</td>
                                        <td style="padding: 0.6rem 0.5rem;">${pipeItem.isNone ? '-' : `${pipeWeightKg.toFixed(2)} Kg`}</td>
                                        <td style="padding: 0.6rem 0.5rem;">${pipeItem.isNone ? '-' : `${currency}${pipeItem.rate}/kg`}</td>
                                        <td style="padding: 0.6rem 0.5rem; text-align: right; font-weight: 700;">${currency}${Math.round(pipeSubtotal)}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px dashed var(--glass-border);">
                                        <td style="padding: 0.6rem 0.5rem; font-weight: 600;">
                                            <span style="color: #8b5cf6;">Panel</span><br>
                                            <small style="color: var(--color-text-muted);">${panelItem.name}</small>
                                        </td>
                                        <td style="padding: 0.6rem 0.5rem;">${panelAreaSqFt.toFixed(2)} sq.ft</td>
                                        <td style="padding: 0.6rem 0.5rem;">${panelItem.isNone ? '-' : `${panelWeightKg.toFixed(2)} Kg`}</td>
                                        <td style="padding: 0.6rem 0.5rem;">${panelItem.isNone ? '-' : `${currency}${panelItem.rate}/sq.ft`}</td>
                                        <td style="padding: 0.6rem 0.5rem; text-align: right; font-weight: 700;">${currency}${Math.round(panelSubtotal)}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px dashed var(--glass-border);">
                                        <td style="padding: 0.6rem 0.5rem; font-weight: 600;">
                                            <span style="color: #f59e0b;">Hinges</span><br>
                                            <small style="color: var(--color-text-muted);">${hingeItem.name}</small>
                                        </td>
                                        <td style="padding: 0.6rem 0.5rem;">${hingeQty} nos</td>
                                        <td style="padding: 0.6rem 0.5rem;">${hingeItem.isNone ? '-' : `${hingeWeightKg.toFixed(2)} Kg`}</td>
                                        <td style="padding: 0.6rem 0.5rem;">${hingeItem.isNone ? '-' : `${currency}${hingeItem.rate}/no`}</td>
                                        <td style="padding: 0.6rem 0.5rem; text-align: right; font-weight: 700;">${currency}${Math.round(hingeSubtotal)}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px dashed var(--glass-border);">
                                        <td style="padding: 0.6rem 0.5rem; font-weight: 600;">
                                            <span style="color: #ec4899;">Paint</span><br>
                                            <small style="color: var(--color-text-muted);">${paintItem.name}</small>
                                        </td>
                                        <td style="padding: 0.6rem 0.5rem;">${paintLtr} Ltr (${surfaceAreaFt2.toFixed(1)} sq.ft surface)</td>
                                        <td style="padding: 0.6rem 0.5rem;">${paintItem.isNone ? '-' : `${(paintLtr * 0.9).toFixed(2)} Kg`}</td>
                                        <td style="padding: 0.6rem 0.5rem;">${paintItem.isNone ? '-' : `${currency}${paintItem.rate}/ltr`}</td>
                                        <td style="padding: 0.6rem 0.5rem; text-align: right; font-weight: 700;">${currency}${Math.round(paintSubtotal)}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px dashed var(--glass-border);">
                                        <td style="padding: 0.6rem 0.5rem; font-weight: 600;">
                                            <span style="color: #10b981;">Hook & Rubber</span><br>
                                            <small style="color: var(--color-text-muted);">${hookItem.name}</small>
                                        </td>
                                        <td style="padding: 0.6rem 0.5rem;">${hookQty} nos</td>
                                        <td style="padding: 0.6rem 0.5rem;">${hookItem.isNone ? '-' : `${hookWeightKg.toFixed(2)} Kg`}</td>
                                        <td style="padding: 0.6rem 0.5rem;">${hookItem.isNone ? '-' : `${currency}${hookItem.rate}/no`}</td>
                                        <td style="padding: 0.6rem 0.5rem; text-align: right; font-weight: 700;">${currency}${Math.round(hookSubtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 0.6rem 0.5rem; font-weight: 600;">
                                            <span style="color: #ef4444;">Lock & Accessories</span><br>
                                            <small style="color: var(--color-text-muted);">${lockItem.name}</small>
                                        </td>
                                        <td style="padding: 0.6rem 0.5rem;">${lockQty} nos</td>
                                        <td style="padding: 0.6rem 0.5rem;">${lockItem.isNone ? '-' : `${lockWeightKg.toFixed(2)} Kg`}</td>
                                        <td style="padding: 0.6rem 0.5rem;">${lockItem.isNone ? '-' : `${currency}${lockItem.rate}/no`}</td>
                                        <td style="padding: 0.6rem 0.5rem; text-align: right; font-weight: 700;">${currency}${Math.round(lockSubtotal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Commercial Summary & Live Margin Controls -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); background: var(--color-bg-card); display: flex; flex-direction: column; gap: 1.25rem;">
                        <div style="border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--color-text-heading); display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="receipt" style="width: 18px; height: 18px; color: var(--color-primary);"></i>
                                Cost Summary
                            </h3>
                            <p style="margin: 0.2rem 0 0; font-size: 0.75rem; color: var(--color-text-muted);">Live Estimation</p>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--color-bg-surface); border-radius: var(--radius-md);">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.85rem; color: var(--color-text-heading);">Total Material Cost</div>
                                    <div style="font-size: 0.7rem; color: var(--color-text-muted);">Sum of itemized materials</div>
                                </div>
                                <div style="font-weight: 800; font-size: 1.05rem; color: var(--color-text-heading);">
                                    ${currency} ${Math.round(totalMaterialCost)}
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--color-bg-surface); border-radius: var(--radius-md);">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.85rem; color: var(--color-text-heading);">Labor Charges</div>
                                    <div style="font-size: 0.7rem; color: var(--color-text-muted);">Fabrication & assembly</div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">${currency}</span>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        step="50" 
                                        value="${laborCharges}" 
                                        onchange="window.updateGrid('laborCharge', this.value)" 
                                        style="width: 80px; text-align: right; padding: 4px 6px; border: 1px solid var(--glass-border); border-radius: 4px; background: var(--color-bg-card); color: var(--color-text-heading); font-weight: 700; font-size: 0.9rem;"
                                    >
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--color-bg-surface); border-radius: var(--radius-md);">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.85rem; color: var(--color-text-heading);">Margin / Profit %</div>
                                    <div style="font-size: 0.7rem; color: var(--color-text-muted);">+ ${currency} ${Math.round(addedProfit)} profit</div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="100" 
                                        step="1" 
                                        value="${profitMarginPercent}" 
                                        onchange="window.updateGrid('profitMarginPercent', this.value)" 
                                        style="width: 60px; text-align: right; padding: 4px 6px; border: 1px solid var(--glass-border); border-radius: 4px; background: var(--color-bg-card); color: var(--color-text-heading); font-weight: 700; font-size: 0.9rem;"
                                    >
                                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Grand Total Card -->
                        <div style="margin-top: 0.5rem; padding: 1.25rem; border-radius: var(--radius-md); background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(2, 132, 199, 0.12)); border: 1.5px solid rgba(16, 185, 129, 0.35); text-align: center;">
                            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; color: var(--color-primary);">
                                Final Grand Total
                            </div>
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

# Find the end of renderManualCalc (which is right before window.startQuotationStudio)
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
