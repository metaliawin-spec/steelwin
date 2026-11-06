const fs = require('fs');
const path = require('path');

const calcPath = path.join(__dirname, '..', 'js', 'modules', 'calculation.js');
let content = fs.readFileSync(calcPath, 'utf8');

// We will replace renderManualCalc and add renderQuotationStudio
const newCalcModuleCode = `
// ==========================================
// 1. QUICK CALCULATION (renderManualCalc)
// ==========================================

function initQuickCalcState() {
    const defUnit = Store.state.settings?.preferences?.unit || 'cm';
    if (!Store.state.rateCalc || !Store.state.rateCalc.grid) {
        Store.state.rateCalc = {
            category: 'Window',
            materials: {
                frame: 'prof_box',
                pipe: 'tube_sq_1x1',
                panel: 'glass_5mm_clear',
                hinges: 'hinge_ss_4in',
                lock: 'lock_cockspur',
                hook: 'hook_stay_8in',
                paint: 'paint_epoxy_black'
            },
            grid: {
                cols: 1, // ALWAYS 1 KALLI (SINGLE PANE / ഒരൊറ്റക്കള്ളി) BY DEFAULT!
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
}

function renderManualCalc(state) {
    try {
        initQuickCalcState();
        const rc = state.rateCalc;
        if (!rc.materials) rc.materials = {};
        if (rc.materials.frame === undefined) rc.materials.frame = 'prof_box';
        if (rc.materials.pipe === undefined) rc.materials.pipe = 'tube_sq_1x1';
        if (rc.materials.panel === undefined) rc.materials.panel = 'glass_5mm_clear';
        if (rc.materials.hinges === undefined) rc.materials.hinges = 'hinge_ss_4in';
        if (rc.materials.lock === undefined) rc.materials.lock = 'lock_cockspur';
        if (rc.materials.hook === undefined) rc.materials.hook = 'hook_stay_8in';
        if (rc.materials.paint === undefined) rc.materials.paint = 'paint_epoxy_black';

        const g = rc.grid;
        if (!g.cols) g.cols = 1;
        if (!g.unit) g.unit = 'cm';
        if (!g.totalW) g.totalW = convertUnit(g.cols * 50, 'cm', g.unit);
        if (!g.totalH) g.totalH = convertUnit(140, 'cm', g.unit);

        const p = rc.params || (rc.params = { laborCharge: 800, profitMarginPercent: 15 });
        const catalog = Store.state.materialCatalog || [];
        const currency = Store.state.settings?.preferences?.currency || '₹';

        // History tracking wrapper
        window.calcHistory = window.calcHistory || { past: [], future: [], isRestoring: false };
        function snapshotCalc() {
            if (window.calcHistory.isRestoring) return;
            const currentRc = Store.state.rateCalc;
            if (!currentRc) return;
            window.calcHistory.past.push(JSON.stringify(currentRc));
            if (window.calcHistory.past.length > 30) window.calcHistory.past.shift();
            window.calcHistory.future = [];
        }

        // Reset to Defaults (Strictly 1 Kalli, 50x140 cm)
        window.resetQuickCalcDefaults = () => {
            snapshotCalc();
            const u = g.unit || 'cm';
            Store.state.rateCalc = {
                category: 'Window',
                materials: {
                    frame: 'prof_box',
                    pipe: 'tube_sq_1x1',
                    panel: 'glass_5mm_clear',
                    hinges: 'hinge_ss_4in',
                    lock: 'lock_cockspur',
                    hook: 'hook_stay_8in',
                    paint: 'paint_epoxy_black'
                },
                grid: {
                    cols: 1,
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

        // Kalli Preset Handler: 1 Kalli = 50x140, 2 Kalli = 100x140 (+50cm per kalli), Height 140cm
        window.loadPreset = (cols) => {
            snapshotCalc();
            const c = Math.max(1, parseInt(cols) || 1);
            g.cols = c;
            const totalW_cm = c * 50;
            const totalH_cm = 140;
            g.totalW = convertUnit(totalW_cm, 'cm', g.unit);
            g.totalH = convertUnit(totalH_cm, 'cm', g.unit);
            const paneW = convertUnit(50, 'cm', g.unit);
            g.paneWidths = Array(c).fill(paneW);
            g.panePartitions = Array(c).fill(0);
            g.partitionPos = Array(c).fill('top');
            Store.notify();
        };

        // General update handler
        window.updateGrid = (key, val) => {
            snapshotCalc();
            if (key.startsWith('mat_')) {
                const matType = key.split('_')[1];
                rc.materials[matType] = val;
            } else if (key === 'unit') {
                window.toggleUnit(val);
                return;
            } else if (key === 'cols') {
                const c = Math.max(1, parseInt(val) || 1);
                g.cols = c;
                const totalW_cm = c * 50;
                g.totalW = convertUnit(totalW_cm, 'cm', g.unit);
                g.totalH = convertUnit(140, 'cm', g.unit);
                const paneW = convertUnit(50, 'cm', g.unit);
                g.paneWidths = Array(c).fill(paneW);
                g.panePartitions = Array(c).fill(0);
                g.partitionPos = Array(c).fill('top');
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

        // Bidirectional Unit Conversion (cm, mm, in, ft, m)
        window.toggleUnit = (newUnit) => {
            if (!newUnit || newUnit === g.unit) return;
            snapshotCalc();
            const oldUnit = g.unit;
            g.totalW = convertUnit(g.totalW, oldUnit, newUnit);
            g.totalH = convertUnit(g.totalH, oldUnit, newUnit);
            if (g.paneWidths && g.paneWidths.length) {
                g.paneWidths = g.paneWidths.map(pw => convertUnit(pw, oldUnit, newUnit));
            }
            g.unit = newUnit;
            if (Store.state.settings && Store.state.settings.preferences) {
                Store.state.settings.preferences.unit = newUnit;
                Store.saveState();
            }
            Store.notify();
        };

        // Individual Pane Width adjustment
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

        // Cycle Pane Partition (0 -> 1 -> 2 -> 0)
        window.cyclePanePartition = (index) => {
            snapshotCalc();
            if (!g.panePartitions) g.panePartitions = Array(g.cols).fill(0);
            const cur = g.panePartitions[index] || 0;
            g.panePartitions[index] = (cur + 1) % 3;
            Store.notify();
        };

        // Ensure pane array integrity
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

        // Normalized mm & engineering dimensions for BOM calculations
        const w_mm = convertUnit(g.totalW, g.unit, 'mm');
        const h_mm = convertUnit(g.totalH, g.unit, 'mm');
        const w_ft = (w_mm / 25.4) / 12;
        const h_ft = (h_mm / 25.4) / 12;
        const areaSqFt = Math.max(0.01, w_ft * h_ft);
        const outerPerimeterFt = 2 * (w_ft + h_ft);

        // Material Lookups with None option support
        const getCatItem = (catKey, defaultId) => {
            const selId = rc.materials?.[catKey];
            if (selId === 'none' || selId === 'None') return null;
            return catalog.find(m => m.id === selId || m.name === selId) ||
                   catalog.find(m => (m.category || '').toLowerCase() === catKey.toLowerCase()) ||
                   catalog.find(m => m.id === defaultId) ||
                   null;
        };

        const frameItem = getCatItem('frame', 'prof_box');
        const pipeItem = getCatItem('pipe', 'tube_sq_1x1');
        const panelItem = getCatItem('panel', 'glass_5mm_clear');
        const hingeItem = getCatItem('hinges', 'hinge_ss_4in');
        const paintItem = getCatItem('paint', 'paint_epoxy_black');
        const hookItem = getCatItem('hook', 'hook_stay_8in');
        const lockItem = getCatItem('lock', 'lock_cockspur');

        // --- Material 1: Frame / Profile ---
        let frameLenFt = 0, frameWeightKg = 0, frameSubtotal = 0;
        if (frameItem) {
            frameLenFt = outerPerimeterFt;
            frameWeightKg = frameLenFt * (frameItem.weightFactor || frameItem.weight16G || 1.45);
            frameSubtotal = frameWeightKg * (frameItem.rate || 180);
        }

        // --- Material 2: Pipe ---
        let partitionLenFt = 0;
        let totalPartitionDividers = 0;
        for (let i = 0; i < g.cols; i++) {
            const parts = g.panePartitions[i] || 0;
            if (parts > 0) {
                totalPartitionDividers += parts;
                const pw_mm = convertUnit(g.paneWidths[i], g.unit, 'mm');
                partitionLenFt += parts * ((pw_mm / 25.4) / 12);
            }
        }
        let pipeLenFt = 0, pipeWeightKg = 0, pipeSubtotal = 0;
        if (pipeItem) {
            pipeLenFt = ((g.cols - 1) * h_ft) + partitionLenFt;
            pipeWeightKg = pipeLenFt * (pipeItem.weightFactor || pipeItem.weightPerLength || 1.15);
            pipeSubtotal = pipeWeightKg * (pipeItem.rate || 95);
        }

        // --- Material 3: Panel ---
        let panelAreaSqFt = 0, panelWeightKg = 0, panelSubtotal = 0;
        if (panelItem) {
            panelAreaSqFt = areaSqFt;
            panelWeightKg = panelAreaSqFt * (panelItem.weightFactor || 1.15);
            panelSubtotal = panelAreaSqFt * (panelItem.rate || 55);
        }

        // --- Material 4: Hinges ---
        let hingeQty = 0, hingeWeightKg = 0, hingeSubtotal = 0;
        if (hingeItem) {
            hingeQty = Math.max(2, g.cols * 2);
            hingeWeightKg = hingeQty * (hingeItem.weightFactor || 0.18);
            hingeSubtotal = hingeQty * (hingeItem.rate || 85);
        }

        // --- Material 5: Paint ---
        let paintSubtotal = 0, paintLtr = 0;
        if (paintItem) {
            if (paintItem.pricingMode === 'kalli') {
                paintSubtotal = g.cols * (paintItem.pricePerKalli || paintItem.rate || 450);
            } else {
                paintSubtotal = areaSqFt * (paintItem.pricePerSqFt || paintItem.rate || 35);
            }
        }

        // --- Material 6: Hook & Rubber ---
        let hookQty = 0, hookWeightKg = 0, hookSubtotal = 0;
        if (hookItem) {
            hookQty = Math.max(1, Math.min(g.cols, 2));
            hookWeightKg = hookQty * (hookItem.weightFactor || 0.20);
            hookSubtotal = hookQty * (hookItem.rate || 75);
        }

        // --- Material 7: Lock & Accessories ---
        let lockQty = 0, lockWeightKg = 0, lockSubtotal = 0;
        if (lockItem) {
            lockQty = Math.max(1, Math.min(g.cols, 2));
            lockWeightKg = lockQty * (lockItem.weightFactor || 0.25);
            lockSubtotal = lockQty * (lockItem.rate || 160);
        }

        // --- Totals ---
        const totalMaterialCost = frameSubtotal + pipeSubtotal + panelSubtotal + hingeSubtotal + paintSubtotal + hookSubtotal + lockSubtotal;
        const laborCharges = parseFloat(p.laborCharge ?? 800) || 0;
        const profitMarginPercent = parseFloat(p.profitMarginPercent ?? 15) || 0;
        const baseCost = totalMaterialCost + laborCharges;
        const addedProfit = baseCost * (profitMarginPercent / 100);
        const grandTotal = baseCost + addedProfit;

        // Model Title
        const generatedModelTitle = \`WINDOW W\${g.cols} (\${g.totalW}x\${g.totalH} \${g.unit})\`;

        // 2D Scaled SVG Drawing Canvas
        const svgW = 820;
        const svgH = 370;
        const maxAvailW = svgW - 170;
        const maxAvailH = svgH - 75;
        const scale = Math.min(maxAvailW / Math.max(10, w_mm), maxAvailH / Math.max(10, h_mm));
        const drawW = w_mm * scale;
        const drawH = h_mm * scale;
        const startX = (svgW - drawW) / 2 + 25;
        const startY = (svgH - drawH) / 2 - 10;
        const frameThick = Math.max(10, Math.min(22, 65 * scale));

        let gridSvg = \`
            <defs>
                <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#15803d" />
                    <stop offset="100%" stop-color="#166534" />
                </linearGradient>
                <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#f0fdf4" stop-opacity="0.9" />
                    <stop offset="50%" stop-color="#e0f2fe" stop-opacity="0.7" />
                    <stop offset="100%" stop-color="#f8fafc" stop-opacity="0.95" />
                </linearGradient>
            </defs>
            <rect x="\${startX}" y="\${startY}" width="\${drawW}" height="\${drawH}" rx="4" fill="url(#frameGrad)" stroke="#14532d" stroke-width="2" />
        \`;

        let currentX = startX + frameThick;
        let paneOverlays = '';

        for (let i = 0; i < g.cols; i++) {
            const pw_val = g.paneWidths[i] || (g.totalW / g.cols);
            const pane_w_mm = convertUnit(pw_val, g.unit, 'mm');
            const drawPaneW = Math.max(10, (pane_w_mm / w_mm) * (drawW - frameThick * 2));
            const innerX = currentX;
            const innerY = startY + frameThick;
            const innerW = drawPaneW - (i < g.cols - 1 ? frameThick / 2 : 0);
            const innerH = drawH - frameThick * 2;

            gridSvg += \`<rect x="\${innerX}" y="\${innerY}" width="\${innerW}" height="\${innerH}" fill="url(#glassGrad)" stroke="#16a34a" stroke-width="1.5" />\`;

            // Draw Partitions if any
            const parts = g.panePartitions[i] || 0;
            if (parts > 0) {
                const segH = innerH / (parts + 1);
                for (let j = 1; j <= parts; j++) {
                    const lineY = innerY + segH * j;
                    gridSvg += \`<line x1="\${innerX}" y1="\${lineY}" x2="\${innerX + innerW}" y2="\${lineY}" stroke="#15803d" stroke-width="\${Math.max(3, frameThick * 0.6)}" stroke-dasharray="0" />\`;
                }
            }

            // Divider Line between panes
            if (i < g.cols - 1) {
                gridSvg += \`<line x1="\${currentX + drawPaneW}" y1="\${startY}" x2="\${currentX + drawPaneW}" y2="\${startY + drawH}" stroke="#14532d" stroke-width="\${frameThick}" />\`;
            }

            // Pane Overlays
            paneOverlays += \`
                <div style="position: absolute; left: \${innerX}px; top: \${innerY + 12}px; width: \${innerW}px; display: flex; justify-content: center; z-index: 20;">
                    <div 
                        onclick="window.cyclePanePartition(\${i})" 
                        title="Click to cycle partitions (\${parts} -> \${(parts + 1) % 3})"
                        style="background: rgba(255,255,255,0.95); border: 1.5px solid #15803d; border-radius: 5px; padding: 3px 8px; display: flex; flex-direction: column; align-items: center; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.1); user-select: none;"
                    >
                        <div style="font-size: 0.88rem; font-weight: 800; color: #15803d; line-height: 1;">\${parts}</div>
                        <div style="font-size: 0.55rem; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                    </div>
                </div>

                <div style="position: absolute; left: \${innerX}px; top: \${startY + drawH + 8}px; width: \${innerW}px; text-align: center; z-index: 20;">
                    <div style="font-size: 0.68rem; color: #64748b; font-weight: 600; margin-bottom: 2px;">W(\${g.unit})</div>
                    <input type="number" class="hide-spin" step="\${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="\${g.paneWidths[i]}" onchange="window.updateIndividualPaneWidth(\${i}, this.value)" style="width: 58px; height: 26px; text-align: center; font-weight: 700; font-size: 0.92rem; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none;">
                </div>
            \`;

            currentX += drawPaneW;
        }

        // Material Filter helper
        window.filterQuickMatDropdowns = (query) => {
            const q = (query || '').toLowerCase().trim();
            const selects = document.querySelectorAll('.quick-mat-select');
            selects.forEach(sel => {
                Array.from(sel.options).forEach(opt => {
                    if (opt.value === 'none') { opt.hidden = false; return; }
                    opt.hidden = q && !opt.text.toLowerCase().includes(q);
                });
            });
        };

        return \`
            <style>
                .hide-spin::-webkit-inner-spin-button, .hide-spin::-webkit-outer-spin-button { -webkit-appearance: none !important; margin: 0 !important; }
                .hide-spin { -moz-appearance: textfield !important; }
            </style>
            <div class="quick-calc-container" style="display: flex; flex-direction: column; gap: 1.25rem; font-family: var(--font-main, sans-serif); max-width: 1350px; margin: 0 auto;">
                
                <!-- 1. TOP WHITE CONTAINER: Model Title & Clean Material Dropdowns (NO CLIENT NAME IN QUICK CALC) -->
                <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px 8px 0 0; padding: 16px 22px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px;">
                        <div>
                            <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">ESTIMATION MODEL</div>
                            <div style="font-size: 1.2rem; font-weight: 800; color: #0284c7; margin-top: 2px;">\${generatedModelTitle}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="background: rgba(22, 163, 74, 0.1); color: #16a34a; font-weight: 700; font-size: 0.78rem; padding: 3px 10px; border-radius: 4px; border: 1px solid rgba(22, 163, 74, 0.2);">
                                \${g.cols} Kalli (\${g.cols === 1 ? 'Single Pane / ഒറ്റക്കള്ളി' : g.cols + ' Panes'})
                            </span>
                            <button onclick="window.resetQuickCalcDefaults()" class="btn btn-secondary" style="font-size: 0.78rem; padding: 4px 10px;">
                                <i data-lucide="rotate-ccw" style="width: 13px; height: 13px;"></i> Reset
                            </button>
                        </div>
                    </div>

                    <!-- Material Search Filter Bar -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Material Specifications (With None Option):</span>
                        <div style="position: relative; width: 220px;">
                            <input type="text" placeholder="🔍 Search materials..." oninput="window.filterQuickMatDropdowns(this.value)" style="width: 100%; padding: 4px 8px 4px 24px; font-size: 0.78rem; border: 1px solid #cbd5e1; border-radius: 4px; outline: none;">
                            <i data-lucide="search" style="position: absolute; left: 6px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; color: #94a3b8;"></i>
                        </div>
                    </div>

                    <!-- SEPARATE MATERIAL COLUMNS (Frame, Pipe, Panel, Hinges, Lock & Acc, Hook & Rubber, Paint) with NONE option -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 10px; align-items: flex-end;">
                        <!-- 1. Frame / Profile -->
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                            <label style="font-size: 0.72rem; font-weight: 700; color: #475569;">Frame / Profile</label>
                            <select class="quick-mat-select" onchange="window.updateGrid('mat_frame', this.value)" style="padding: 6px 8px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.8rem; font-weight: 600; outline: none;">
                                <option value="none" \${rc.materials.frame === 'none' ? 'selected' : ''}>-- None (Excluded) --</option>
                                \${catalog.filter(m => ['profile', 'frame'].includes((m.category || '').toLowerCase())).map(m => \`
                                    <option value="\${m.id}" \${(rc.materials.frame === m.id || rc.materials.frame === m.name) ? 'selected' : ''}>\${m.name}</option>
                                \`).join('')}
                            </select>
                        </div>

                        <!-- 2. Pipe -->
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                            <label style="font-size: 0.72rem; font-weight: 700; color: #475569;">Pipe</label>
                            <select class="quick-mat-select" onchange="window.updateGrid('mat_pipe', this.value)" style="padding: 6px 8px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.8rem; font-weight: 600; outline: none;">
                                <option value="none" \${rc.materials.pipe === 'none' ? 'selected' : ''}>-- None (Excluded) --</option>
                                \${catalog.filter(m => (m.category || '').toLowerCase() === 'pipe').map(m => \`
                                    <option value="\${m.id}" \${(rc.materials.pipe === m.id || rc.materials.pipe === m.name) ? 'selected' : ''}>\${m.name}</option>
                                \`).join('')}
                            </select>
                        </div>

                        <!-- 3. Panel -->
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                            <label style="font-size: 0.72rem; font-weight: 700; color: #475569;">Panel / Sheet</label>
                            <select class="quick-mat-select" onchange="window.updateGrid('mat_panel', this.value)" style="padding: 6px 8px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.8rem; font-weight: 600; outline: none;">
                                <option value="none" \${rc.materials.panel === 'none' ? 'selected' : ''}>-- None (Excluded) --</option>
                                \${catalog.filter(m => ['panel', 'sheet', 'glass'].includes((m.category || '').toLowerCase())).map(m => \`
                                    <option value="\${m.id}" \${(rc.materials.panel === m.id || rc.materials.panel === m.name) ? 'selected' : ''}>\${m.name}</option>
                                \`).join('')}
                            </select>
                        </div>

                        <!-- 4. Hinges -->
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                            <label style="font-size: 0.72rem; font-weight: 700; color: #475569;">Hinges</label>
                            <select class="quick-mat-select" onchange="window.updateGrid('mat_hinges', this.value)" style="padding: 6px 8px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.8rem; font-weight: 600; outline: none;">
                                <option value="none" \${rc.materials.hinges === 'none' ? 'selected' : ''}>-- None (Excluded) --</option>
                                \${catalog.filter(m => ['hinges', 'hinge'].includes((m.category || '').toLowerCase())).map(m => \`
                                    <option value="\${m.id}" \${(rc.materials.hinges === m.id || rc.materials.hinges === m.name) ? 'selected' : ''}>\${m.name}</option>
                                \`).join('')}
                            </select>
                        </div>

                        <!-- 5. Lock & Accessories -->
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                            <label style="font-size: 0.72rem; font-weight: 700; color: #475569;">Lock & Accessories</label>
                            <select class="quick-mat-select" onchange="window.updateGrid('mat_lock', this.value)" style="padding: 6px 8px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.8rem; font-weight: 600; outline: none;">
                                <option value="none" \${rc.materials.lock === 'none' ? 'selected' : ''}>-- None (Excluded) --</option>
                                \${catalog.filter(m => ['lock & accessories', 'lock', 'accessories'].includes((m.category || '').toLowerCase())).map(m => \`
                                    <option value="\${m.id}" \${(rc.materials.lock === m.id || rc.materials.lock === m.name) ? 'selected' : ''}>\${m.name}</option>
                                \`).join('')}
                            </select>
                        </div>

                        <!-- 6. Hook & Rubber -->
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                            <label style="font-size: 0.72rem; font-weight: 700; color: #475569;">Hook & Rubber</label>
                            <select class="quick-mat-select" onchange="window.updateGrid('mat_hook', this.value)" style="padding: 6px 8px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.8rem; font-weight: 600; outline: none;">
                                <option value="none" \${rc.materials.hook === 'none' ? 'selected' : ''}>-- None (Excluded) --</option>
                                \${catalog.filter(m => ['hook & rubber', 'hook', 'rubber'].includes((m.category || '').toLowerCase())).map(m => \`
                                    <option value="\${m.id}" \${(rc.materials.hook === m.id || rc.materials.hook === m.name) ? 'selected' : ''}>\${m.name}</option>
                                \`).join('')}
                            </select>
                        </div>

                        <!-- 7. Paint -->
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                            <label style="font-size: 0.72rem; font-weight: 700; color: #475569;">Paint</label>
                            <select class="quick-mat-select" onchange="window.updateGrid('mat_paint', this.value)" style="padding: 6px 8px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.8rem; font-weight: 600; outline: none;">
                                <option value="none" \${rc.materials.paint === 'none' ? 'selected' : ''}>-- None (Excluded) --</option>
                                \${catalog.filter(m => (m.category || '').toLowerCase() === 'paint').map(m => \`
                                    <option value="\${m.id}" \${(rc.materials.paint === m.id || rc.materials.paint === m.name) ? 'selected' : ''}>\${m.name}</option>
                                \`).join('')}
                            </select>
                        </div>

                        <!-- 8. Measure Unit (cm, mm, in, ft, m) -->
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                            <label style="font-size: 0.72rem; font-weight: 700; color: #166534;">Measure Unit</label>
                            <select onchange="window.toggleUnit(this.value)" style="padding: 6px 8px; border: 1.5px solid #86efac; background: #f0fdf4; color: #15803d; font-weight: 800; border-radius: 5px; font-size: 0.82rem; outline: none; cursor: pointer;">
                                <option value="cm" \${g.unit === 'cm' ? 'selected' : ''}>cm (Centimeter)</option>
                                <option value="mm" \${g.unit === 'mm' ? 'selected' : ''}>mm (Millimeter)</option>
                                <option value="inch" \${g.unit === 'inch' ? 'selected' : ''}>in (Inch)</option>
                                <option value="ft" \${g.unit === 'ft' ? 'selected' : ''}>ft (Feet)</option>
                                <option value="m" \${g.unit === 'm' ? 'selected' : ''}>m (Meter)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 2. DARK TOOLBAR: WINDOW PANES & KALLI SELECTOR -->
                <div style="background: linear-gradient(to bottom, #475569, #334155); padding: 10px 14px; border-radius: 0 0 8px 8px; display: flex; align-items: center; overflow-x: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-top: -1.25rem;">
                    <div style="display: flex; align-items: stretch; border: 1px solid rgba(255,255,255,0.25); border-radius: 5px; overflow: hidden; background: rgba(0,0,0,0.25);">
                        <div style="padding: 7px 14px; display: flex; align-items: center; background: rgba(255,255,255,0.06); color: #90caf9; font-size: 0.85rem; font-weight: 800; letter-spacing: 0.5px; border-right: 1px solid rgba(255,255,255,0.18);">
                            WINDOW PANES:
                        </div>

                        <div style="display: flex; align-items: center; padding: 0 12px; border-right: 1px solid rgba(255,255,255,0.18); background: rgba(0,0,0,0.15);">
                            <span style="color: #e2e8f0; font-size: 0.82rem; font-weight: 600; margin-right: 6px;">Custom Kalli:</span>
                            <input type="number" min="1" max="15" value="\${g.cols}" style="width: 42px; height: 24px; text-align: center; padding: 0; font-weight: 800; border-radius: 3px; border: 1px solid #64748b; background: #1e293b; color: white; font-size: 0.85rem;" onchange="window.updateGrid('cols', this.value)" onkeydown="if(event.key==='Enter'){ window.updateGrid('cols', this.value); this.blur(); }">
                        </div>

                        \${[1, 2, 3, 4, 5].map((c, idx) => \`
                            <button 
                                onclick="window.loadPreset(\${c})" 
                                style="
                                    background: \${g.cols === c ? '#16a34a' : 'transparent'}; 
                                    color: white; 
                                    border: none; 
                                    border-right: \${idx < 4 ? '1px solid rgba(255,255,255,0.18)' : 'none'}; 
                                    padding: 7px 16px; 
                                    font-weight: 700; 
                                    font-size: 0.85rem; 
                                    cursor: pointer; 
                                    transition: all 0.15s ease-in-out;
                                    \${g.cols === c ? 'box-shadow: inset 0 0 10px rgba(0,0,0,0.2);' : ''}
                                "
                            >
                                \${c} Kalli
                            </button>
                        \`).join('')}
                    </div>
                </div>

                <!-- 3. MAIN WHITE CANVAS CARD FOR 2D WINDOW DRAWING -->
                <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 24px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); position: relative; min-height: 420px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    
                    <div style="position: relative; width: \${svgW}px; height: \${svgH}px;">
                        
                        <!-- Height Dimension Input on Left Side -->
                        <div style="position: absolute; left: \${startX - 75}px; top: \${startY + (drawH / 2) - 32}px; z-index: 25; text-align: center;">
                            <div style="background: #f0f9ff; border: 1.5px solid #38bdf8; border-radius: 6px; padding: 5px 10px; box-shadow: 0 2px 8px rgba(56, 189, 248, 0.15); display: flex; flex-direction: column; align-items: center;">
                                <span style="font-size: 0.72rem; font-weight: 700; color: #0284c7;">Height</span>
                                <input type="number" class="hide-spin" step="\${g.unit === 'mm' ? '10' : '1'}" min="10" value="\${g.totalH}" onchange="window.updateGrid('totalH', this.value)" style="width: 52px; text-align: center; font-weight: 800; font-size: 1rem; color: #0f172a; border: none; background: transparent; outline: none; padding: 1px 0;">
                                <span style="font-size: 0.68rem; color: #64748b; font-weight: 700;">\${g.unit}</span>
                            </div>
                        </div>

                        <!-- Overall Width Dimension Input Below Window -->
                        <div style="position: absolute; left: \${startX}px; top: \${startY + drawH + 52}px; width: \${drawW}px; text-align: center; z-index: 20;">
                            <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 2px;">Overall Width</div>
                            <div style="display: inline-flex; align-items: center; gap: 6px; background: #fffbeb; border: 2px solid #f59e0b; border-radius: 6px; padding: 4px 14px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12);">
                                <input type="number" class="hide-spin" step="\${g.unit === 'mm' ? '10' : '1'}" min="10" value="\${g.totalW}" onchange="window.updateGrid('totalW', this.value)" style="width: 65px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #b45309; border: none; background: transparent; outline: none;">
                                <span style="font-size: 0.85rem; color: #b45309; font-weight: 800;">\${g.unit}</span>
                            </div>
                        </div>

                        <!-- Scaled SVG Window Frame -->
                        <svg width="\${svgW}" height="\${svgH}" style="position: absolute; left: 0; top: 0; z-index: 1;">
                            \${gridSvg}
                        </svg>

                        <!-- HTML Overlays: 0 PARTITION Pills & Individual Pane Widths -->
                        \${paneOverlays}

                    </div>

                    <!-- Live Grand Total Price Tag -->
                    <div style="position: absolute; right: 28px; bottom: 24px; z-index: 25;">
                        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 6px; padding: 8px 18px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.12); display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 1.35rem; font-weight: 900; color: #15803d; letter-spacing: 0.5px;">₹ \${Math.round(grandTotal).toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                </div>

                <!-- PRICING & COST BREAKDOWN SECTION -->
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
                                    <!-- 1. Frame -->
                                    <tr style="border-bottom: 1px solid var(--glass-border);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: var(--color-text-heading);">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6;"></span>
                                                Frame
                                            </div>
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">
                                            \${frameItem ? frameItem.name : '<em style="color:#ef4444">None (Excluded)</em>'}<br>
                                            \${frameItem ? \`<span style="color: var(--color-text-main); font-weight: 600;">\${frameLenFt.toFixed(2)} ft</span> (Perimeter)\` : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #3b82f6;">
                                            \${frameWeightKg.toFixed(2)} Kg
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            \${frameItem ? \`\${currency}\${frameItem.rate}/kg\` : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            \${currency}\${frameSubtotal.toFixed(0)}
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
                                            \${pipeItem ? pipeItem.name : '<em style="color:#ef4444">None (Excluded)</em>'}<br>
                                            \${pipeItem ? \`<span style="color: var(--color-text-main); font-weight: 600;">\${pipeLenFt.toFixed(2)} ft</span> (\${g.cols - 1} mullions + \${totalPartitionDividers} parts)\` : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #06b6d4;">
                                            \${pipeWeightKg.toFixed(2)} Kg
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            \${pipeItem ? \`\${currency}\${pipeItem.rate}/kg\` : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            \${currency}\${pipeSubtotal.toFixed(0)}
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
                                            \${panelItem ? panelItem.name : '<em style="color:#ef4444">None (Excluded)</em>'}<br>
                                            \${panelItem ? \`<span style="color: var(--color-text-main); font-weight: 600;">\${panelAreaSqFt.toFixed(2)} sq.ft</span>\` : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #8b5cf6;">
                                            \${panelWeightKg.toFixed(2)} Kg
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            \${panelItem ? \`\${currency}\${panelItem.rate}/sq.ft\` : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            \${currency}\${panelSubtotal.toFixed(0)}
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
                                            \${hingeItem ? hingeItem.name : '<em style="color:#ef4444">None (Excluded)</em>'}<br>
                                            \${hingeItem ? \`<span style="color: var(--color-text-main); font-weight: 600;">\${hingeQty} Pcs</span>\` : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #f59e0b;">
                                            \${hingeWeightKg.toFixed(2)} Kg
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            \${hingeItem ? \`\${currency}\${hingeItem.rate}/pc\` : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            \${currency}\${hingeSubtotal.toFixed(0)}
                                        </td>
                                    </tr>

                                    <!-- 5. Paint -->
                                    <tr style="border-bottom: 1px solid var(--glass-border);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: var(--color-text-heading);">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
                                                Paint
                                            </div>
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">
                                            \${paintItem ? paintItem.name : '<em style="color:#ef4444">None (Excluded)</em>'}<br>
                                            \${paintItem ? \`<span style="color: var(--color-text-main); font-weight: 600;">\${paintItem.pricingMode === 'kalli' ? g.cols + ' Kalli' : areaSqFt.toFixed(2) + ' sq.ft'}</span>\` : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #10b981;">-</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            \${paintItem ? (paintItem.pricingMode === 'kalli' ? \`\${currency}\${paintItem.pricePerKalli || paintItem.rate}/kalli\` : \`\${currency}\${paintItem.pricePerSqFt || paintItem.rate}/sqft\`) : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            \${currency}\${paintSubtotal.toFixed(0)}
                                        </td>
                                    </tr>

                                    <!-- 6. Hook & Rubber -->
                                    <tr style="border-bottom: 1px solid var(--glass-border);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: var(--color-text-heading);">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #ec4899;"></span>
                                                Hook & Rubber
                                            </div>
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">
                                            \${hookItem ? hookItem.name : '<em style="color:#ef4444">None (Excluded)</em>'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #ec4899;">
                                            \${hookWeightKg.toFixed(2)} Kg
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            \${hookItem ? \`\${currency}\${hookItem.rate}/pc\` : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            \${currency}\${hookSubtotal.toFixed(0)}
                                        </td>
                                    </tr>

                                    <!-- 7. Lock & Accessories -->
                                    <tr style="border-bottom: 1.5px solid var(--glass-border);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: var(--color-text-heading);">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"></span>
                                                Lock & Acc.
                                            </div>
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">
                                            \${lockItem ? lockItem.name : '<em style="color:#ef4444">None (Excluded)</em>'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #ef4444;">
                                            \${lockWeightKg.toFixed(2)} Kg
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: var(--color-text-main);">
                                            \${lockItem ? \`\${currency}\${lockItem.rate}/pc\` : '-'}
                                        </td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            \${currency}\${lockSubtotal.toFixed(0)}
                                        </td>
                                    </tr>

                                    <!-- Total Material Row -->
                                    <tr style="background: rgba(16, 185, 129, 0.08);">
                                        <td colspan="2" style="padding: 0.75rem 0.6rem; font-weight: 800; color: #10b981; font-size: 0.9rem;">
                                            TOTAL MATERIAL BREAKDOWN
                                        </td>
                                        <td style="padding: 0.75rem 0.6rem; text-align: right; font-weight: 800; color: var(--color-text-heading);">
                                            \${(frameWeightKg + pipeWeightKg + panelWeightKg + hingeWeightKg + hookWeightKg + lockWeightKg).toFixed(2)} Kg
                                        </td>
                                        <td style="padding: 0.75rem 0.6rem; text-align: right; font-size: 0.75rem; color: var(--color-text-muted);">
                                            Itemized
                                        </td>
                                        <td style="padding: 0.75rem 0.6rem; text-align: right; font-weight: 900; font-size: 1.05rem; color: #10b981;">
                                            \${currency}\${totalMaterialCost.toFixed(0)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Cost Summary Card -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); background: var(--color-bg-card); display: flex; flex-direction: column; gap: 1.1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.6rem;">
                            <i data-lucide="receipt" style="width: 18px; height: 18px; color: var(--color-primary);"></i>
                            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase; letter-spacing: 0.5px;">Cost Summary Card</h3>
                        </div>

                        <!-- Total Material Cost Field -->
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--glass-border);">
                            <div>
                                <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Total Material Cost</div>
                                <div style="font-size: 0.7rem; color: var(--color-text-muted);">Sum of all active materials</div>
                            </div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-heading);">
                                \${currency} \${totalMaterialCost.toFixed(0)}
                            </div>
                        </div>

                        <!-- Labor Charges Field -->
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--glass-border);">
                            <div>
                                <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Labor Charges</div>
                                <div style="font-size: 0.7rem; color: var(--color-text-muted);">Fabrication & installation</div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">\${currency}</span>
                                <input 
                                    type="number" 
                                    step="50" 
                                    min="0" 
                                    value="\${laborCharges}" 
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
                                    + \${currency} \${addedProfit.toFixed(0)} profit
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <input 
                                    type="number" 
                                    step="1" 
                                    min="0" 
                                    max="100" 
                                    value="\${profitMarginPercent}" 
                                    onchange="window.updateGrid('profitMarginPercent', this.value)" 
                                    style="width: 70px; text-align: right; padding: 5px 8px; font-weight: 800; font-size: 0.95rem; border-radius: 6px; border: 1px solid var(--glass-border); background: var(--color-bg-card); color: #10b981;"
                                >
                                <span style="font-size: 0.9rem; font-weight: 800; color: var(--color-text-muted);">%</span>
                            </div>
                        </div>

                        <!-- Final Grand Total Display -->
                        <div style="padding: 1.25rem 1rem; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1)); border: 2px solid rgba(16, 185, 129, 0.4); border-radius: 12px; text-align: center; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);">
                            <div style="font-size: 0.75rem; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 1px;">Final Grand Total</div>
                            <div style="font-size: 2.2rem; font-weight: 900; color: var(--color-text-heading); margin: 0.25rem 0; letter-spacing: -0.5px; line-height: 1.2;">
                                <span style="font-size: 1.4rem; opacity: 0.8; font-weight: 700; margin-right: 2px;">\${currency}</span>\${Math.round(grandTotal).toLocaleString('en-IN')}
                            </div>
                            <div style="font-size: 0.78rem; color: var(--color-text-muted); font-weight: 600;">
                                Rate: <strong>\${currency} \${(grandTotal / areaSqFt).toFixed(0)} / sq.ft</strong> (\${currency} \${(grandTotal / (areaSqFt * 0.0929)).toFixed(0)} / m²)
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        \`;
    } catch (err) {
        console.error("Render Error:", err);
        return \`<div style="padding: 2rem; color: red;">Error rendering calculator: \${err.message}</div>\`;
    }
}


// ==========================================
// 2. QUOTATION CALCULATION STUDIO (renderQuotationStudio)
// ==========================================

// Global start helper for quotation studio
window.startQuotationStudio = () => {
    Store.state.quoteStudio = {
        active: true,
        step: 'details', // 'details' | 'canvas'
        customerName: '',
        place: '',
        city: '',
        pincode: '',
        mobile: '',
        materials: {
            frame: 'prof_box',
            pipe: 'tube_sq_1x1',
            panel: 'glass_5mm_clear',
            hinges: 'hinge_ss_4in',
            lock: 'lock_cockspur',
            hook: 'hook_stay_8in',
            paint: 'paint_epoxy_black'
        },
        quantity: 1,
        grid: {
            cols: 1,
            totalW: 50,
            totalH: 140,
            unit: 'cm',
            paneWidths: [50],
            panePartitions: [0],
            partitionPos: ['top']
        }
    };
    Store.state.currentQuoteDraft = {
        customer: '',
        customerId: '',
        place: '',
        city: '',
        pincode: '',
        mobile: '',
        items: []
    };
    Store.state.calcTab = 'quotes';
    Store.state.currentView = 'calculation';
    Store.notify();
};

window.cancelQuotationStudio = () => {
    if (confirm('Cancel quotation studio and return to quotes list?')) {
        Store.state.quoteStudio.active = false;
        Store.notify();
    }
};

window.quoteStudioSelectCustomer = (custId) => {
    const cust = (Store.state.customers || []).find(c => c.id === custId);
    if (cust) {
        document.getElementById('quote-cust-name').value = cust.name || '';
        document.getElementById('quote-cust-place').value = cust.place || cust.location || '';
        document.getElementById('quote-cust-city').value = cust.city || '';
        document.getElementById('quote-cust-pincode').value = cust.pincode || '';
        document.getElementById('quote-cust-mobile').value = cust.mobile || cust.phone || '';
    }
};

window.quoteStudioProceedToCanvas = () => {
    const name = document.getElementById('quote-cust-name')?.value.trim();
    const place = document.getElementById('quote-cust-place')?.value.trim();
    const city = document.getElementById('quote-cust-city')?.value.trim();
    const pincode = document.getElementById('quote-cust-pincode')?.value.trim();
    const mobile = document.getElementById('quote-cust-mobile')?.value.trim();

    // 5 Mandatory Customer Fields Validation
    if (!name || !place || !city || !pincode || !mobile) {
        alert('Please fill in all 5 mandatory customer fields:\\n1. Customer Name\\n2. Place (സ്ഥലം / Area)\\n3. City\\n4. Pincode\\n5. Mobile Number');
        return;
    }

    const qs = Store.state.quoteStudio;
    qs.customerName = name;
    qs.place = place;
    qs.city = city;
    qs.pincode = pincode;
    qs.mobile = mobile;

    qs.materials.frame = document.getElementById('quote-mat-frame')?.value || 'prof_box';
    qs.materials.pipe = document.getElementById('quote-mat-pipe')?.value || 'tube_sq_1x1';
    qs.materials.panel = document.getElementById('quote-mat-panel')?.value || 'glass_5mm_clear';
    qs.materials.hinges = document.getElementById('quote-mat-hinges')?.value || 'hinge_ss_4in';
    qs.materials.lock = document.getElementById('quote-mat-lock')?.value || 'lock_cockspur';
    qs.materials.hook = document.getElementById('quote-mat-hook')?.value || 'hook_stay_8in';
    qs.materials.paint = document.getElementById('quote-mat-paint')?.value || 'paint_epoxy_black';

    Store.state.currentQuoteDraft.customer = name;
    Store.state.currentQuoteDraft.place = place;
    Store.state.currentQuoteDraft.city = city;
    Store.state.currentQuoteDraft.pincode = pincode;
    Store.state.currentQuoteDraft.mobile = mobile;

    // Advance to 2D Canvas step
    qs.step = 'canvas';
    qs.quantity = 1;
    qs.grid = {
        cols: 1,
        totalW: 50,
        totalH: 140,
        unit: 'cm',
        paneWidths: [50],
        panePartitions: [0],
        partitionPos: ['top']
    };

    Store.notify();
};

export function renderQuotationStudio(state) {
    const qs = Store.state.quoteStudio || (Store.state.quoteStudio = { active: true, step: 'details' });
    const draft = Store.state.currentQuoteDraft || { items: [] };
    const catalog = Store.state.materialCatalog || [];
    const currency = Store.state.settings?.preferences?.currency || '₹';

    // STEP 1: CUSTOMER DETAILS (5 MANDATORY FIELDS) & MATERIALS
    if (qs.step === 'details') {
        return \`
            <div style="padding: 1.5rem 2rem; max-width: 950px; margin: 0 auto; height: 100%; overflow-y: auto;">
                <div class="glass-panel" style="padding: 2rem; border-radius: 14px; background: var(--color-bg-card); border: 1px solid var(--glass-border); box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
                        <div>
                            <span style="font-size: 0.75rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 1px;">Step 1 of 2</span>
                            <h2 style="margin: 4px 0 0; font-size: 1.5rem; font-weight: 800; color: var(--color-text-heading); display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="file-plus" style="color: var(--color-primary);"></i> Create Quotation Calculation
                            </h2>
                            <p style="margin: 4px 0 0; font-size: 0.85rem; color: var(--color-text-muted);">
                                Enter customer profile and select default material specifications.
                            </p>
                        </div>
                        <button onclick="window.cancelQuotationStudio()" class="btn btn-secondary" style="font-size: 0.82rem; padding: 6px 12px;">
                            <i data-lucide="x"></i> Exit
                        </button>
                    </div>

                    <!-- Quick Select Customer -->
                    <div style="margin-bottom: 1.5rem; background: rgba(59, 130, 246, 0.08); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2);">
                        <label style="font-size: 0.8rem; font-weight: 700; color: #3b82f6; display: block; margin-bottom: 5px;">
                            Quick Auto-Fill from Existing Customer Database (Optional):
                        </label>
                        <select onchange="window.quoteStudioSelectCustomer(this.value)" class="glass-input" style="width: 100%; padding: 8px 10px; font-size: 0.88rem;">
                            <option value="">-- Choose Existing Customer or Fill Details Below --</option>
                            \${(Store.state.customers || []).map(c => \`<option value="\${c.id}">\${c.name} (\${c.mobile || ''} • \${c.address || ''})</option>\`).join('')}
                        </select>
                    </div>

                    <!-- 5 MANDATORY CUSTOMER FIELDS -->
                    <div style="margin-bottom: 1.75rem;">
                        <h4 style="margin: 0 0 1rem; font-size: 0.95rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase; letter-spacing: 0.5px;">
                            Customer Information (All 5 Fields Required):
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 4px;">
                                    1. Customer Name <span style="color: #ef4444;">*</span>
                                </label>
                                <input type="text" id="quote-cust-name" required placeholder="e.g. Arun Kumar" value="\${qs.customerName || ''}" class="glass-input" style="width: 100%; padding: 9px 12px; font-size: 0.92rem; font-weight: 600;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 4px;">
                                    2. Place (സ്ഥലം / Area) <span style="color: #ef4444;">*</span>
                                </label>
                                <input type="text" id="quote-cust-place" required placeholder="e.g. Manjeri, Edapally" value="\${qs.place || ''}" class="glass-input" style="width: 100%; padding: 9px 12px; font-size: 0.92rem;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 4px;">
                                    3. City <span style="color: #ef4444;">*</span>
                                </label>
                                <input type="text" id="quote-cust-city" required placeholder="e.g. Malappuram, Kochi" value="\${qs.city || ''}" class="glass-input" style="width: 100%; padding: 9px 12px; font-size: 0.92rem;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 4px;">
                                    4. Pincode <span style="color: #ef4444;">*</span>
                                </label>
                                <input type="text" id="quote-cust-pincode" required placeholder="e.g. 676121" value="\${qs.pincode || ''}" class="glass-input" style="width: 100%; padding: 9px 12px; font-size: 0.92rem;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 4px;">
                                    5. Mobile Number <span style="color: #ef4444;">*</span>
                                </label>
                                <input type="tel" id="quote-cust-mobile" required placeholder="e.g. 9846112233" value="\${qs.mobile || ''}" class="glass-input" style="width: 100%; padding: 9px 12px; font-size: 0.92rem; font-weight: 600;">
                            </div>
                        </div>
                    </div>

                    <!-- SEPARATE MATERIAL COLUMNS (WITH 'NONE' OPTION) -->
                    <div style="border-top: 1px solid var(--glass-border); padding-top: 1.5rem; margin-bottom: 1.75rem;">
                        <h4 style="margin: 0 0 1rem; font-size: 0.95rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase; letter-spacing: 0.5px;">
                            Select Materials for Calculation (With 'None' Option):
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                            <!-- Frame -->
                            <div>
                                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 4px;">Frame / Profile</label>
                                <select id="quote-mat-frame" class="glass-input" style="width: 100%; padding: 7px 10px; font-size: 0.85rem;">
                                    <option value="none">-- None (Not Included) --</option>
                                    \${catalog.filter(m => ['profile', 'frame'].includes((m.category || '').toLowerCase())).map(m => \`
                                        <option value="\${m.id}" \${qs.materials?.frame === m.id ? 'selected' : ''}>\${m.name}</option>
                                    \`).join('')}
                                </select>
                            </div>

                            <!-- Pipe -->
                            <div>
                                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 4px;">Pipe</label>
                                <select id="quote-mat-pipe" class="glass-input" style="width: 100%; padding: 7px 10px; font-size: 0.85rem;">
                                    <option value="none">-- None (Not Included) --</option>
                                    \${catalog.filter(m => (m.category || '').toLowerCase() === 'pipe').map(m => \`
                                        <option value="\${m.id}" \${qs.materials?.pipe === m.id ? 'selected' : ''}>\${m.name}</option>
                                    \`).join('')}
                                </select>
                            </div>

                            <!-- Panel -->
                            <div>
                                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 4px;">Panel / Glass</label>
                                <select id="quote-mat-panel" class="glass-input" style="width: 100%; padding: 7px 10px; font-size: 0.85rem;">
                                    <option value="none">-- None (Not Included) --</option>
                                    \${catalog.filter(m => ['panel', 'glass', 'sheet'].includes((m.category || '').toLowerCase())).map(m => \`
                                        <option value="\${m.id}" \${qs.materials?.panel === m.id ? 'selected' : ''}>\${m.name}</option>
                                    \`).join('')}
                                </select>
                            </div>

                            <!-- Hinges -->
                            <div>
                                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 4px;">Hinges</label>
                                <select id="quote-mat-hinges" class="glass-input" style="width: 100%; padding: 7px 10px; font-size: 0.85rem;">
                                    <option value="none">-- None (Not Included) --</option>
                                    \${catalog.filter(m => ['hinges', 'hinge'].includes((m.category || '').toLowerCase())).map(m => \`
                                        <option value="\${m.id}" \${qs.materials?.hinges === m.id ? 'selected' : ''}>\${m.name}</option>
                                    \`).join('')}
                                </select>
                            </div>

                            <!-- Lock & Accessories -->
                            <div>
                                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 4px;">Lock & Accessories</label>
                                <select id="quote-mat-lock" class="glass-input" style="width: 100%; padding: 7px 10px; font-size: 0.85rem;">
                                    <option value="none">-- None (Not Included) --</option>
                                    \${catalog.filter(m => ['lock & accessories', 'lock', 'accessories'].includes((m.category || '').toLowerCase())).map(m => \`
                                        <option value="\${m.id}" \${qs.materials?.lock === m.id ? 'selected' : ''}>\${m.name}</option>
                                    \`).join('')}
                                </select>
                            </div>

                            <!-- Hook & Rubber -->
                            <div>
                                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 4px;">Hook & Rubber</label>
                                <select id="quote-mat-hook" class="glass-input" style="width: 100%; padding: 7px 10px; font-size: 0.85rem;">
                                    <option value="none">-- None (Not Included) --</option>
                                    \${catalog.filter(m => ['hook & rubber', 'hook', 'rubber'].includes((m.category || '').toLowerCase())).map(m => \`
                                        <option value="\${m.id}" \${qs.materials?.hook === m.id ? 'selected' : ''}>\${m.name}</option>
                                    \`).join('')}
                                </select>
                            </div>

                            <!-- Paint -->
                            <div>
                                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 4px;">Paint</label>
                                <select id="quote-mat-paint" class="glass-input" style="width: 100%; padding: 7px 10px; font-size: 0.85rem;">
                                    <option value="none">-- None (Not Included) --</option>
                                    \${catalog.filter(m => (m.category || '').toLowerCase() === 'paint').map(m => \`
                                        <option value="\${m.id}" \${qs.materials?.paint === m.id ? 'selected' : ''}>\${m.name}</option>
                                    \`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- PROCEED TO 2D CANVAS BUTTON -->
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid var(--glass-border); padding-top: 1.25rem;">
                        <button type="button" class="btn btn-secondary" onclick="window.cancelQuotationStudio()">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="window.quoteStudioProceedToCanvas()" style="padding: 0.65rem 1.75rem; font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;">
                            Next: Configure Window 2D Models <i data-lucide="arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        \`;
    }

    // STEP 2: 2D INTERACTIVE WINDOW CANVAS FOR QUOTATION
    const g = qs.grid || (qs.grid = {
        cols: 1,
        totalW: 50,
        totalH: 140,
        unit: 'cm',
        paneWidths: [50],
        panePartitions: [0],
        partitionPos: ['top']
    });

    if (!g.cols) g.cols = 1;
    if (!g.unit) g.unit = 'cm';
    if (!g.totalW) g.totalW = convertUnit(g.cols * 50, 'cm', g.unit);
    if (!g.totalH) g.totalH = convertUnit(140, 'cm', g.unit);
    if (!g.paneWidths || g.paneWidths.length !== g.cols) {
        g.paneWidths = Array(g.cols).fill(convertUnit(50, 'cm', g.unit));
    }
    if (!g.panePartitions || g.panePartitions.length !== g.cols) {
        g.panePartitions = Array(g.cols).fill(0);
    }

    const w_mm = convertUnit(g.totalW, g.unit, 'mm');
    const h_mm = convertUnit(g.totalH, g.unit, 'mm');
    const w_ft = (w_mm / 25.4) / 12;
    const h_ft = (h_mm / 25.4) / 12;
    const areaSqFt = Math.max(0.01, w_ft * h_ft);
    const outerPerimeterFt = 2 * (w_ft + h_ft);

    // Lookups for materials
    const getCatItem = (catKey, defaultId) => {
        const selId = qs.materials?.[catKey];
        if (selId === 'none' || selId === 'None') return null;
        return catalog.find(m => m.id === selId || m.name === selId) ||
               catalog.find(m => (m.category || '').toLowerCase() === catKey.toLowerCase()) ||
               catalog.find(m => m.id === defaultId) ||
               null;
    };

    const frameItem = getCatItem('frame', 'prof_box');
    const pipeItem = getCatItem('pipe', 'tube_sq_1x1');
    const panelItem = getCatItem('panel', 'glass_5mm_clear');
    const hingeItem = getCatItem('hinges', 'hinge_ss_4in');
    const paintItem = getCatItem('paint', 'paint_epoxy_black');
    const hookItem = getCatItem('hook', 'hook_stay_8in');
    const lockItem = getCatItem('lock', 'lock_cockspur');

    let frameLenFt = 0, frameWeightKg = 0, frameSubtotal = 0;
    if (frameItem) {
        frameLenFt = outerPerimeterFt;
        frameWeightKg = frameLenFt * (frameItem.weightFactor || frameItem.weight16G || 1.45);
        frameSubtotal = frameWeightKg * (frameItem.rate || 180);
    }

    let partitionLenFt = 0;
    let totalPartitionDividers = 0;
    for (let i = 0; i < g.cols; i++) {
        const parts = g.panePartitions[i] || 0;
        if (parts > 0) {
            totalPartitionDividers += parts;
            const pw_mm = convertUnit(g.paneWidths[i], g.unit, 'mm');
            partitionLenFt += parts * ((pw_mm / 25.4) / 12);
        }
    }
    let pipeLenFt = 0, pipeWeightKg = 0, pipeSubtotal = 0;
    if (pipeItem) {
        pipeLenFt = ((g.cols - 1) * h_ft) + partitionLenFt;
        pipeWeightKg = pipeLenFt * (pipeItem.weightFactor || pipeItem.weightPerLength || 1.15);
        pipeSubtotal = pipeWeightKg * (pipeItem.rate || 95);
    }

    let panelAreaSqFt = 0, panelWeightKg = 0, panelSubtotal = 0;
    if (panelItem) {
        panelAreaSqFt = areaSqFt;
        panelWeightKg = panelAreaSqFt * (panelItem.weightFactor || 1.15);
        panelSubtotal = panelAreaSqFt * (panelItem.rate || 55);
    }

    let hingeQty = 0, hingeWeightKg = 0, hingeSubtotal = 0;
    if (hingeItem) {
        hingeQty = Math.max(2, g.cols * 2);
        hingeWeightKg = hingeQty * (hingeItem.weightFactor || 0.18);
        hingeSubtotal = hingeQty * (hingeItem.rate || 85);
    }

    let paintSubtotal = 0;
    if (paintItem) {
        if (paintItem.pricingMode === 'kalli') {
            paintSubtotal = g.cols * (paintItem.pricePerKalli || paintItem.rate || 450);
        } else {
            paintSubtotal = areaSqFt * (paintItem.pricePerSqFt || paintItem.rate || 35);
        }
    }

    let hookQty = 0, hookWeightKg = 0, hookSubtotal = 0;
    if (hookItem) {
        hookQty = Math.max(1, Math.min(g.cols, 2));
        hookWeightKg = hookQty * (hookItem.weightFactor || 0.20);
        hookSubtotal = hookQty * (hookItem.rate || 75);
    }

    let lockQty = 0, lockWeightKg = 0, lockSubtotal = 0;
    if (lockItem) {
        lockQty = Math.max(1, Math.min(g.cols, 2));
        lockWeightKg = lockQty * (lockItem.weightFactor || 0.25);
        lockSubtotal = lockQty * (lockItem.rate || 160);
    }

    const totalMaterialCost = frameSubtotal + pipeSubtotal + panelSubtotal + hingeSubtotal + paintSubtotal + hookSubtotal + lockSubtotal;
    const laborCharges = 800;
    const profitMarginPercent = 15;
    const baseCost = totalMaterialCost + laborCharges;
    const addedProfit = baseCost * (profitMarginPercent / 100);
    const unitPrice = baseCost + addedProfit;
    const windowQty = parseInt(qs.quantity) || 1;
    const batchTotal = unitPrice * windowQty;

    // 2D Scaled SVG Drawing Canvas
    const svgW = 820;
    const svgH = 370;
    const maxAvailW = svgW - 170;
    const maxAvailH = svgH - 75;
    const scale = Math.min(maxAvailW / Math.max(10, w_mm), maxAvailH / Math.max(10, h_mm));
    const drawW = w_mm * scale;
    const drawH = h_mm * scale;
    const startX = (svgW - drawW) / 2 + 25;
    const startY = (svgH - drawH) / 2 - 10;
    const frameThick = Math.max(10, Math.min(22, 65 * scale));

    let gridSvg = \`
        <defs>
            <linearGradient id="frameGradQuote" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#15803d" />
                <stop offset="100%" stop-color="#166534" />
            </linearGradient>
            <linearGradient id="glassGradQuote" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#f0fdf4" stop-opacity="0.9" />
                <stop offset="50%" stop-color="#e0f2fe" stop-opacity="0.7" />
                <stop offset="100%" stop-color="#f8fafc" stop-opacity="0.95" />
            </linearGradient>
        </defs>
        <rect x="\${startX}" y="\${startY}" width="\${drawW}" height="\${drawH}" rx="4" fill="url(#frameGradQuote)" stroke="#14532d" stroke-width="2" />
    \`;

    let currentX = startX + frameThick;
    let paneOverlays = '';

    for (let i = 0; i < g.cols; i++) {
        const pw_val = g.paneWidths[i] || (g.totalW / g.cols);
        const pane_w_mm = convertUnit(pw_val, g.unit, 'mm');
        const drawPaneW = Math.max(10, (pane_w_mm / w_mm) * (drawW - frameThick * 2));
        const innerX = currentX;
        const innerY = startY + frameThick;
        const innerW = drawPaneW - (i < g.cols - 1 ? frameThick / 2 : 0);
        const innerH = drawH - frameThick * 2;

        gridSvg += \`<rect x="\${innerX}" y="\${innerY}" width="\${innerW}" height="\${innerH}" fill="url(#glassGradQuote)" stroke="#16a34a" stroke-width="1.5" />\`;

        const parts = g.panePartitions[i] || 0;
        if (parts > 0) {
            const segH = innerH / (parts + 1);
            for (let j = 1; j <= parts; j++) {
                const lineY = innerY + segH * j;
                gridSvg += \`<line x1="\${innerX}" y1="\${lineY}" x2="\${innerX + innerW}" y2="\${lineY}" stroke="#15803d" stroke-width="\${Math.max(3, frameThick * 0.6)}" />\`;
            }
        }

        if (i < g.cols - 1) {
            gridSvg += \`<line x1="\${currentX + drawPaneW}" y1="\${startY}" x2="\${currentX + drawPaneW}" y2="\${startY + drawH}" stroke="#14532d" stroke-width="\${frameThick}" />\`;
        }

        paneOverlays += \`
            <div style="position: absolute; left: \${innerX}px; top: \${innerY + 12}px; width: \${innerW}px; display: flex; justify-content: center; z-index: 20;">
                <div 
                    onclick="window.cycleQuoteStudioPartition(\${i})" 
                    style="background: rgba(255,255,255,0.95); border: 1.5px solid #15803d; border-radius: 5px; padding: 3px 8px; display: flex; flex-direction: column; align-items: center; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.1); user-select: none;"
                >
                    <div style="font-size: 0.88rem; font-weight: 800; color: #15803d; line-height: 1;">\${parts}</div>
                    <div style="font-size: 0.55rem; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                </div>
            </div>

            <div style="position: absolute; left: \${innerX}px; top: \${startY + drawH + 8}px; width: \${innerW}px; text-align: center; z-index: 20;">
                <div style="font-size: 0.68rem; color: #64748b; font-weight: 600; margin-bottom: 2px;">W(\${g.unit})</div>
                <input type="number" class="hide-spin" step="\${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="\${g.paneWidths[i]}" onchange="window.updateQuoteStudioPaneWidth(\${i}, this.value)" style="width: 58px; height: 26px; text-align: center; font-weight: 700; font-size: 0.92rem; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none;">
            </div>
        \`;

        currentX += drawPaneW;
    }

    // Quotation Studio Handlers
    window.loadQuoteStudioPreset = (cols) => {
        const c = Math.max(1, parseInt(cols) || 1);
        g.cols = c;
        const totalW_cm = c * 50;
        g.totalW = convertUnit(totalW_cm, 'cm', g.unit);
        g.totalH = convertUnit(140, 'cm', g.unit);
        const paneW = convertUnit(50, 'cm', g.unit);
        g.paneWidths = Array(c).fill(paneW);
        g.panePartitions = Array(c).fill(0);
        Store.notify();
    };

    window.updateQuoteStudioGrid = (key, val) => {
        if (key === 'cols') {
            window.loadQuoteStudioPreset(val);
        } else if (key === 'totalW') {
            g.totalW = parseFloat(val) || 0;
            const each = parseFloat((g.totalW / g.cols).toFixed(1));
            g.paneWidths = Array(g.cols).fill(each);
        } else if (key === 'totalH') {
            g.totalH = parseFloat(val) || 0;
        } else if (key === 'unit') {
            const oldUnit = g.unit;
            g.totalW = convertUnit(g.totalW, oldUnit, val);
            g.totalH = convertUnit(g.totalH, oldUnit, val);
            g.paneWidths = g.paneWidths.map(pw => convertUnit(pw, oldUnit, val));
            g.unit = val;
        }
        Store.notify();
    };

    window.updateQuoteStudioPaneWidth = (idx, val) => {
        g.paneWidths[idx] = parseFloat(val) || 0;
        Store.notify();
    };

    window.cycleQuoteStudioPartition = (idx) => {
        const cur = g.panePartitions[idx] || 0;
        g.panePartitions[idx] = (cur + 1) % 3;
        Store.notify();
    };

    window.updateQuoteStudioQty = (val) => {
        qs.quantity = Math.max(1, parseInt(val) || 1);
        Store.notify();
    };

    // Save & New Action: Saves current window, increments to Window W2, resets 2D canvas for SAME client
    window.quoteStudioSaveAndNew = () => {
        const windowIndex = draft.items.length + 1;
        const currentItem = {
            id: 'item_' + Date.now(),
            name: \`Window W\${windowIndex} (\${g.totalW}x\${g.totalH} \${g.unit})\`,
            desc: \`\${g.cols} Kalli • \${frameItem?.name || 'Frame'} • \${pipeItem?.name || 'Pipe'}\`,
            width: g.totalW,
            height: g.totalH,
            unit: g.unit,
            pieces: parseInt(qs.quantity) || 1,
            rate: Math.round(unitPrice),
            total: Math.round(batchTotal),
            drawingSvg: \`<svg width="180" height="90" viewBox="0 0 \${svgW} \${svgH}">\${gridSvg}</svg>\`
        };

        draft.items.push(currentItem);
        alert(\`✅ Product "Window W\${windowIndex}" (Qty: \${currentItem.pieces}) added to quotation!\\nTotal windows in quote: \${draft.items.length}.\\nNow configuring Window W\${draft.items.length + 1}.\`);

        // Reset canvas for next window of SAME client
        qs.quantity = 1;
        qs.grid = {
            cols: 1,
            totalW: convertUnit(50, 'cm', g.unit),
            totalH: convertUnit(140, 'cm', g.unit),
            unit: g.unit,
            paneWidths: [convertUnit(50, 'cm', g.unit)],
            panePartitions: [0],
            partitionPos: ['top']
        };

        Store.notify();
    };

    // Save Action: Saves all windows, auto-saves customer, completes Quotation
    window.quoteStudioSaveFinalQuotation = () => {
        const windowIndex = draft.items.length + 1;
        const currentItem = {
            id: 'item_' + Date.now(),
            name: \`Window W\${windowIndex} (\${g.totalW}x\${g.totalH} \${g.unit})\`,
            desc: \`\${g.cols} Kalli • \${frameItem?.name || 'Frame'} • \${pipeItem?.name || 'Pipe'}\`,
            width: g.totalW,
            height: g.totalH,
            unit: g.unit,
            pieces: parseInt(qs.quantity) || 1,
            rate: Math.round(unitPrice),
            total: Math.round(batchTotal),
            drawingSvg: \`<svg width="180" height="90" viewBox="0 0 \${svgW} \${svgH}">\${gridSvg}</svg>\`
        };

        const finalItems = [...(draft.items || []), currentItem];
        const totalAmount = finalItems.reduce((sum, it) => sum + (it.total || 0), 0);

        // Auto-save or update customer in Store.state.customers
        const clientName = qs.customerName;
        const existingCust = (Store.state.customers || []).find(c => c.name && c.name.toLowerCase() === clientName.toLowerCase());
        const customerId = existingCust?.id || ('C-' + Date.now().toString().slice(-4));

        if (!existingCust) {
            Store.state.customers.push({
                id: customerId,
                name: clientName,
                place: qs.place,
                city: qs.city,
                pincode: qs.pincode,
                mobile: qs.mobile,
                phone: qs.mobile,
                address: \`\${qs.place}, \${qs.city} - \${qs.pincode}\`,
                orders: 1,
                totalValue: totalAmount
            });
        }

        const quoteId = \`Q-\${new Date().getFullYear()}-\${Math.floor(100 + Math.random() * 900)}\`;
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

        const newQuotation = {
            id: quoteId,
            customer: clientName,
            customerId: customerId,
            customerPhone: qs.mobile,
            customerAddress: \`\${qs.place}, \${qs.city} - \${qs.pincode}\`,
            date: today,
            dueDate: dueDate,
            amount: totalAmount,
            status: 'Draft',
            salesPerson: { name: Store.state.user?.name || 'Admin', contact: Store.state.user?.phone || '+91 9846 112 233' },
            paymentTerms: '50% Advance, Balance before delivery.',
            validity: '30 Days',
            description: \`Quotation package with \${finalItems.length} window item\${finalItems.length > 1 ? 's' : ''}.\`,
            items: finalItems
        };

        if (!Store.state.quotations) Store.state.quotations = [];
        Store.state.quotations.unshift(newQuotation);

        // Clear studio state
        qs.active = false;
        Store.clearDraftQuote();
        Store.saveState();
        Store.notify();

        // Launch Print Preview Modal
        setTimeout(() => {
            if (window.openPrintQuotationModal) {
                window.openPrintQuotationModal(newQuotation);
            }
        }, 100);
    };

    const draftTotalSoFar = draft.items.reduce((s, it) => s + (it.total || 0), 0);

    return \`
        <div style="display: flex; flex-direction: column; gap: 1.25rem; font-family: var(--font-main, sans-serif); max-width: 1350px; margin: 0 auto; padding: 1.5rem 0;">
            
            <!-- CLIENT BANNER (Name, Place, City, Pincode, Mobile) -->
            <div style="background: linear-gradient(135deg, rgba(2, 132, 199, 0.1), rgba(16, 185, 129, 0.08)); border: 1.5px solid #0284c7; border-radius: 8px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <div style="font-size: 0.72rem; color: #0284c7; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;">QUOTATION FOR CLIENT</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-text-heading); margin-top: 2px;">
                        \${qs.customerName}
                    </div>
                    <div style="font-size: 0.82rem; color: var(--color-text-muted); margin-top: 2px;">
                        📍 \${qs.place}, \${qs.city} (\${qs.pincode}) • 📞 \${qs.mobile}
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="text-align: right; background: white; padding: 6px 14px; border-radius: 6px; border: 1px solid #cbd5e1;">
                        <span style="font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Draft Progress</span>
                        <div style="font-size: 0.95rem; font-weight: 800; color: #15803d;">
                            \${draft.items.length} Window(s) Saved • Total: \${currency}\${draftTotalSoFar.toLocaleString('en-IN')}
                        </div>
                    </div>
                    <button onclick="Store.state.quoteStudio.step = 'details'; Store.notify();" class="btn btn-secondary" style="font-size: 0.78rem; padding: 6px 10px;">
                        <i data-lucide="edit-3"></i> Edit Details
                    </button>
                </div>
            </div>

            <!-- DARK TOOLBAR: WINDOW PANES & KALLI SELECTOR -->
            <div style="background: linear-gradient(to bottom, #475569, #334155); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; overflow-x: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: stretch; border: 1px solid rgba(255,255,255,0.25); border-radius: 5px; overflow: hidden; background: rgba(0,0,0,0.25);">
                    <div style="padding: 7px 14px; display: flex; align-items: center; background: rgba(255,255,255,0.06); color: #90caf9; font-size: 0.85rem; font-weight: 800; letter-spacing: 0.5px; border-right: 1px solid rgba(255,255,255,0.18);">
                        WINDOW PANES:
                    </div>

                    <div style="display: flex; align-items: center; padding: 0 12px; border-right: 1px solid rgba(255,255,255,0.18); background: rgba(0,0,0,0.15);">
                        <span style="color: #e2e8f0; font-size: 0.82rem; font-weight: 600; margin-right: 6px;">Custom Kalli:</span>
                        <input type="number" min="1" max="15" value="\${g.cols}" style="width: 42px; height: 24px; text-align: center; padding: 0; font-weight: 800; border-radius: 3px; border: 1px solid #64748b; background: #1e293b; color: white; font-size: 0.85rem;" onchange="window.updateQuoteStudioGrid('cols', this.value)">
                    </div>

                    \${[1, 2, 3, 4, 5].map((c, idx) => \`
                        <button 
                            onclick="window.loadQuoteStudioPreset(\${c})" 
                            style="
                                background: \${g.cols === c ? '#16a34a' : 'transparent'}; 
                                color: white; 
                                border: none; 
                                border-right: \${idx < 4 ? '1px solid rgba(255,255,255,0.18)' : 'none'}; 
                                padding: 7px 16px; 
                                font-weight: 700; 
                                font-size: 0.85rem; 
                                cursor: pointer;
                            "
                        >
                            \${c} Kalli
                        </button>
                    \`).join('')}
                </div>

                <!-- Unit Selector -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: white; font-size: 0.8rem; font-weight: 700;">Unit:</span>
                    <select onchange="window.updateQuoteStudioGrid('unit', this.value)" style="padding: 5px 8px; border-radius: 4px; background: #1e293b; color: white; border: 1px solid #64748b; font-weight: 700; font-size: 0.82rem;">
                        <option value="cm" \${g.unit === 'cm' ? 'selected' : ''}>cm</option>
                        <option value="mm" \${g.unit === 'mm' ? 'selected' : ''}>mm</option>
                        <option value="inch" \${g.unit === 'inch' ? 'selected' : ''}>in</option>
                        <option value="ft" \${g.unit === 'ft' ? 'selected' : ''}>ft</option>
                        <option value="m" \${g.unit === 'm' ? 'selected' : ''}>m</option>
                    </select>
                </div>
            </div>

            <!-- 2D CANVAS -->
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 24px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); position: relative; min-height: 420px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="position: relative; width: \${svgW}px; height: \${svgH}px;">
                    <!-- Height Input -->
                    <div style="position: absolute; left: \${startX - 75}px; top: \${startY + (drawH / 2) - 32}px; z-index: 25; text-align: center;">
                        <div style="background: #f0f9ff; border: 1.5px solid #38bdf8; border-radius: 6px; padding: 5px 10px; display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 0.72rem; font-weight: 700; color: #0284c7;">Height</span>
                            <input type="number" step="\${g.unit === 'mm' ? '10' : '1'}" min="10" value="\${g.totalH}" onchange="window.updateQuoteStudioGrid('totalH', this.value)" style="width: 52px; text-align: center; font-weight: 800; font-size: 1rem; color: #0f172a; border: none; background: transparent; outline: none;">
                            <span style="font-size: 0.68rem; color: #64748b; font-weight: 700;">\${g.unit}</span>
                        </div>
                    </div>

                    <!-- Overall Width Input -->
                    <div style="position: absolute; left: \${startX}px; top: \${startY + drawH + 52}px; width: \${drawW}px; text-align: center; z-index: 20;">
                        <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 2px;">Overall Width</div>
                        <div style="display: inline-flex; align-items: center; gap: 6px; background: #fffbeb; border: 2px solid #f59e0b; border-radius: 6px; padding: 4px 14px;">
                            <input type="number" step="\${g.unit === 'mm' ? '10' : '1'}" min="10" value="\${g.totalW}" onchange="window.updateQuoteStudioGrid('totalW', this.value)" style="width: 65px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #b45309; border: none; background: transparent; outline: none;">
                            <span style="font-size: 0.85rem; color: #b45309; font-weight: 800;">\${g.unit}</span>
                        </div>
                    </div>

                    <!-- SVG -->
                    <svg width="\${svgW}" height="\${svgH}" style="position: absolute; left: 0; top: 0; z-index: 1;">
                        \${gridSvg}
                    </svg>

                    <!-- Pane Overlays -->
                    \${paneOverlays}
                </div>

                <!-- Price Tag -->
                <div style="position: absolute; right: 28px; bottom: 24px; z-index: 25;">
                    <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 6px; padding: 8px 18px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.12);">
                        <span style="font-size: 1.35rem; font-weight: 900; color: #15803d;">₹ \${Math.round(unitPrice).toLocaleString('en-IN')}</span>
                        <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; margin-left: 4px;">/ unit</span>
                    </div>
                </div>
            </div>

            <!-- BOTTOM BAR: QUANTITY ON BOTTOM LEFT & SAVE / SAVE & NEW ON BOTTOM RIGHT -->
            <div class="glass-panel" style="padding: 1.25rem 2rem; border-radius: 12px; background: var(--color-bg-card); border: 1.5px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                <!-- Bottom Left: Quantity Input -->
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="background: rgba(255,255,255,0.06); padding: 8px 16px; border-radius: 8px; border: 1px solid var(--glass-border); display: flex; align-items: center; gap: 10px;">
                        <label style="font-size: 0.95rem; font-weight: 800; color: var(--color-text-heading); text-transform: uppercase; letter-spacing: 0.5px;">
                            Quantity:
                        </label>
                        <input 
                            type="number" 
                            id="quote-window-qty" 
                            min="1" 
                            max="999" 
                            value="\${windowQty}" 
                            onchange="window.updateQuoteStudioQty(this.value)"
                            style="width: 65px; height: 36px; text-align: center; font-size: 1.2rem; font-weight: 900; color: #10b981; border: 2px solid #10b981; border-radius: 6px; background: white; outline: none;"
                        >
                        <span style="font-size: 0.85rem; color: var(--color-text-muted); font-weight: 600;">Pcs</span>
                    </div>

                    <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-heading);">
                        Batch Total: <span style="color: #10b981;">₹ \${Math.round(batchTotal).toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <!-- Bottom Right Actions: Save & New, Save, Cancel -->
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <button 
                        type="button" 
                        onclick="window.quoteStudioSaveAndNew()" 
                        class="btn btn-secondary" 
                        id="btn-quote-save-new"
                        style="padding: 0.65rem 1.4rem; font-weight: 700; font-size: 0.92rem; border-color: rgba(59, 130, 246, 0.4); color: #60a5fa; display: flex; align-items: center; gap: 6px;"
                    >
                        <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i> Save & New Window
                    </button>

                    <button 
                        type="button" 
                        onclick="window.quoteStudioSaveFinalQuotation()" 
                        class="btn btn-primary" 
                        id="btn-quote-save-final"
                        style="padding: 0.65rem 1.75rem; font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;"
                    >
                        <i data-lucide="check-circle-2" style="width: 18px; height: 18px;"></i> Save & Create Quotation
                    </button>

                    <button 
                        type="button" 
                        onclick="window.cancelQuotationStudio()" 
                        class="btn btn-secondary" 
                        style="padding: 0.65rem 1rem; font-size: 0.85rem;"
                    >
                        Cancel
                    </button>
                </div>
            </div>

        </div>
    \`;
}
`;

console.log('Replacing renderManualCalc and inserting renderQuotationStudio...');
const startCalcIdx = content.indexOf('function renderManualCalc(state) {');
const endCalcIdx = content.indexOf('function renderDesigner(state) {');

if (startCalcIdx !== -1 && endCalcIdx !== -1) {
    content = content.slice(0, startCalcIdx) + newCalcModuleCode + '\n\n' + content.slice(endCalcIdx);
    console.log('Calculation and Quotation Studio updated successfully.');
} else {
    console.error('Could not find renderManualCalc boundaries!', { startCalcIdx, endCalcIdx });
}

fs.writeFileSync(calcPath, content, 'utf8');
`;

fs.writeFileSync(path.join(__dirname, 'build_calc_and_quote_studio.js'), buildScript, 'utf8');
console.log('Wrote build_calc_and_quote_studio.js');
