import re

with open('js/modules/calculation.js', 'r', encoding='utf-8') as f:
    src = f.read()

# 1. Add cycleStudioPartitionPos after cycleStudioPartition
pos_fn = '''
window.cycleStudioPartitionPos = (idx) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    if (!cw.partitionPos) cw.partitionPos = Array(cw.cols).fill('top');
    const order = ['top', 'center', 'bottom'];
    const cur = cw.partitionPos[idx] || 'top';
    const nextIdx = (order.indexOf(cur) + 1) % order.length;
    cw.partitionPos[idx] = order[nextIdx];
    Store.notify();
};
'''

if 'window.cycleStudioPartitionPos' not in src:
    src = src.replace('window.cycleStudioPartition = (idx) => {', pos_fn + '\nwindow.cycleStudioPartition = (idx) => {')
    print('Added cycleStudioPartitionPos')

# 2. Update renderManualCalc Canvas Graphics
# Find from "let frameThick = 12;" down to the SVG
old_manual_start = """        let frameThick = 12;
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
        }"""

new_manual_start = """        // 2D Frame Dimensions:
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

        const is4x3 = String(rc.materials?.frame || '').toLowerCase().includes('4x3') || String(frameItem.name || '').toLowerCase().includes('4x3');
        const frameThick = is4x3 ? Math.max(14, Math.round(drawH * 0.052)) : Math.max(9, Math.round(drawH * 0.038));
        const mullionThick = Math.max(6, Math.round(frameThick * 0.72));
        const sashThick = Math.max(5, Math.round(frameThick * 0.65));
        const sashGap = Math.max(3, Math.round(frameThick * 0.28));

        const hasPanel = rc.materials?.panel !== 'none' && rc.materials?.panel !== '' && !panelItem.isNone;
        const profileFill = '#4a4d52';
        const profileStroke = '#181a1b';
        const strokeW = 1.5;
        const glassFill = '#ffffff';

        let gridSvg = '';
        let paneOverlays = '';
        let currentPaneLeft = frameThick;
        const innerH = drawH - (frameThick * 2);
        const totalInnerW = drawW - (frameThick * 2) - ((g.cols - 1) * mullionThick);

        for (let i = 0; i < g.cols; i++) {
            const paneFraction = (g.paneWidths[i] && g.totalW > 0) ? (g.paneWidths[i] / g.totalW) : (1 / g.cols);
            const drawPaneW = Math.max(10, Math.round(totalInnerW * paneFraction));
            const parts = g.panePartitions[i] || 0;
            const pos = (g.partitionPos && g.partitionPos[i]) || 'top';

            // Sub-sections in this pane
            const subSections = [];
            if (parts === 0) {
                subSections.push({ y: frameThick, h: innerH });
            } else if (parts === 1) {
                let pyFraction = 0.35;
                if (pos === 'center') pyFraction = 0.50;
                else if (pos === 'bottom') pyFraction = 0.65;
                const h1 = Math.round((innerH - mullionThick) * pyFraction);
                const h2 = innerH - mullionThick - h1;
                subSections.push({ y: frameThick, h: h1 });
                subSections.push({ y: frameThick + h1 + mullionThick, h: h2 });
            } else {
                const hEach = Math.round((innerH - (parts * mullionThick)) / (parts + 1));
                for (let p = 0; p <= parts; p++) {
                    subSections.push({ y: frameThick + (p * (hEach + mullionThick)), h: hEach });
                }
            }

            // Render sub-sections
            for (let s = 0; s < subSections.length; s++) {
                const sec = subSections[s];
                if (hasPanel) {
                    gridSvg += `<rect x="${currentPaneLeft}" y="${sec.y}" width="${drawPaneW}" height="${sec.h}" fill="#f8fafc" />`;
                    const sX = currentPaneLeft + sashGap;
                    const sY = sec.y + sashGap;
                    const sW = drawPaneW - (sashGap * 2);
                    const sH = sec.h - (sashGap * 2);
                    if (sW > sashThick * 2 && sH > sashThick * 2) {
                        gridSvg += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                        const gX = sX + sashThick;
                        const gY = sY + sashThick;
                        const gW = sW - (sashThick * 2);
                        const gH = sH - (sashThick * 2);
                        gridSvg += `<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.8}" />`;
                    } else {
                        gridSvg += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                    }
                } else {
                    gridSvg += `<rect x="${currentPaneLeft}" y="${sec.y}" width="${drawPaneW}" height="${sec.h}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.7}" />`;
                }
            }

            // Horizontal dividers if parts > 0
            if (parts === 1) {
                const my = subSections[0].y + subSections[0].h;
                gridSvg += `<rect x="${currentPaneLeft}" y="${my}" width="${drawPaneW}" height="${mullionThick}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
            } else if (parts > 1) {
                for (let p = 0; p < parts; p++) {
                    const my = subSections[p].y + subSections[p].h;
                    gridSvg += `<rect x="${currentPaneLeft}" y="${my}" width="${drawPaneW}" height="${mullionThick}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                }
            }

            // Vertical mullion
            if (i < g.cols - 1) {
                const vx = currentPaneLeft + drawPaneW;
                gridSvg += `<rect x="${vx}" y="${frameThick}" width="${mullionThick}" height="${innerH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
            }

            // HTML Overlay for this Pane (Partition Pill + Pane Width)
            paneOverlays += `
                <div style="position: absolute; left: ${currentPaneLeft}px; top: 0; width: ${drawPaneW}px; height: ${drawH}px; pointer-events: none;">
                    
                    <!-- Partition Pill Inside the Pane -->
                    <div style="position: absolute; left: 50%; top: ${Math.round(drawH * 0.10)}px; transform: translateX(-50%); pointer-events: auto; display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 15;">
                        <div 
                            onclick="window.cyclePanePartition(${i})" 
                            title="Click to cycle partitions (${parts} -> ${(parts + 1) % 3})"
                            style="background: rgba(255,255,255,0.96); border: 1.5px solid #181a1b; border-radius: 6px; padding: 2px 10px; display: flex; flex-direction: column; align-items: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.18); user-select: none; transition: transform 0.15s ease;"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'"
                        >
                            <div style="font-size: 0.95rem; font-weight: 800; color: #0f172a; line-height: 1;">${parts}</div>
                            <div style="font-size: 0.52rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                        </div>

                        ${parts === 1 ? `
                            <button 
                                type="button" 
                                onclick="window.cyclePanePartitionPos(${i})"
                                title="Click to change position: Top -> Center -> Bottom"
                                style="background: #1e293b; color: white; border: 1px solid #475569; border-radius: 4px; padding: 2px 7px; font-size: 0.60rem; font-weight: 800; text-transform: uppercase; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.15); letter-spacing: 0.5px;"
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

            currentPaneLeft += drawPaneW + (i < g.cols - 1 ? mullionThick : 0);
        }"""

if old_manual_start in src:
    src = src.replace(old_manual_start, new_manual_start)
    print('Updated renderManualCalc canvas building logic')
else:
    print('ERROR: old_manual_start not matched')

# Update the SVG wrapper in renderManualCalc
old_manual_svg = """                            <!-- SVG Window Graphics (Profiles, Rebate Bevel & Dividers) -->
                            <svg viewBox="0 0 ${drawW} ${drawH}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible;">
                                <!-- Outer profile border with dynamic profile thickness & smooth animation -->
                                <rect x="${frameThick/2}" y="${frameThick/2}" width="${drawW - frameThick}" height="${drawH - frameThick}" fill="rgba(240, 253, 244, 0.7)" stroke="#15803d" stroke-width="${frameThick}" rx="2" style="transition: stroke-width 0.25s ease;" />
                                <!-- Inner rebate bevel line for authentic profile appearance -->
                                <rect x="${frameThick}" y="${frameThick}" width="${drawW - (frameThick * 2)}" height="${drawH - (frameThick * 2)}" fill="none" stroke="#166534" stroke-width="1.5" opacity="0.45" />
                                ${gridSvg}
                            </svg>"""

new_manual_svg = """                            <!-- SVG Window Graphics (AutoCAD Profile, Mullions & Inner Sashes) -->
                            <svg viewBox="0 0 ${drawW} ${drawH}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible;">
                                <rect x="0" y="0" width="${drawW}" height="${drawH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW * 1.2}" rx="2" />
                                ${gridSvg}
                            </svg>"""

if old_manual_svg in src:
    src = src.replace(old_manual_svg, new_manual_svg)
    print('Updated renderManualCalc SVG tag')
else:
    print('ERROR: old_manual_svg not matched')

# 3. Update renderQuotationStudio Canvas Graphics
old_studio_svg_calc = """    const startX = 135 + ((maxAvailW - drawW) / 2);
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
    }"""

new_studio_svg_calc = """    const startX = 135 + ((maxAvailW - drawW) / 2);
    const startY = 20 + ((maxAvailH - drawH) / 2);

    const is4x3 = String(qs.materials?.frame || '').toLowerCase().includes('4x3') || String(frameItem.name || '').toLowerCase().includes('4x3');
    const frameThick = is4x3 ? Math.max(14, Math.round(drawH * 0.052)) : Math.max(9, Math.round(drawH * 0.038));
    const mullionThick = Math.max(6, Math.round(frameThick * 0.72));
    const sashThick = Math.max(5, Math.round(frameThick * 0.65));
    const sashGap = Math.max(3, Math.round(frameThick * 0.28));

    const hasPanel = qs.materials?.panel !== 'none' && qs.materials?.panel !== '' && !panelItem.isNone;
    const profileFill = '#4a4d52';
    const profileStroke = '#181a1b';
    const strokeW = 1.5;
    const glassFill = '#ffffff';

    let gridSvg = '';
    let paneOverlays = '';
    let currentX = startX + frameThick;
    const innerStartY = startY + frameThick;
    const innerH = drawH - (frameThick * 2);
    const totalInnerW = drawW - (frameThick * 2) - ((cw.cols - 1) * mullionThick);

    for (let i = 0; i < cw.cols; i++) {
        const paneFraction = (cw.paneWidths?.[i] && cw.totalW > 0) ? (cw.paneWidths[i] / cw.totalW) : (1 / cw.cols);
        const drawPaneW = Math.max(10, Math.round(totalInnerW * paneFraction));
        const parts = cw.panePartitions?.[i] || 0;
        const pos = (cw.partitionPos && cw.partitionPos[i]) || 'top';

        // Sub-sections in this pane (based on horizontal partition)
        const subSections = [];
        if (parts === 0) {
            subSections.push({ y: innerStartY, h: innerH });
        } else if (parts === 1) {
            let pyFraction = 0.35;
            if (pos === 'center') pyFraction = 0.50;
            else if (pos === 'bottom') pyFraction = 0.65;
            const h1 = Math.round((innerH - mullionThick) * pyFraction);
            const h2 = innerH - mullionThick - h1;
            subSections.push({ y: innerStartY, h: h1 });
            subSections.push({ y: innerStartY + h1 + mullionThick, h: h2 });
        } else {
            const hEach = Math.round((innerH - (parts * mullionThick)) / (parts + 1));
            for (let p = 0; p <= parts; p++) {
                subSections.push({ y: innerStartY + (p * (hEach + mullionThick)), h: hEach });
            }
        }

        // Render each sub-section
        for (let s = 0; s < subSections.length; s++) {
            const sec = subSections[s];
            if (hasPanel) {
                gridSvg += `<rect x="${currentX}" y="${sec.y}" width="${drawPaneW}" height="${sec.h}" fill="#f8fafc" />`;
                const sX = currentX + sashGap;
                const sY = sec.y + sashGap;
                const sW = drawPaneW - (sashGap * 2);
                const sH = sec.h - (sashGap * 2);
                if (sW > sashThick * 2 && sH > sashThick * 2) {
                    gridSvg += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                    const gX = sX + sashThick;
                    const gY = sY + sashThick;
                    const gW = sW - (sashThick * 2);
                    const gH = sH - (sashThick * 2);
                    gridSvg += `<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.8}" />`;
                } else {
                    gridSvg += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                }
            } else {
                gridSvg += `<rect x="${currentX}" y="${sec.y}" width="${drawPaneW}" height="${sec.h}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.7}" />`;
            }
        }

        // Horizontal dividers if parts > 0
        if (parts === 1) {
            const my = subSections[0].y + subSections[0].h;
            gridSvg += `<rect x="${currentX}" y="${my}" width="${drawPaneW}" height="${mullionThick}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
        } else if (parts > 1) {
            for (let p = 0; p < parts; p++) {
                const my = subSections[p].y + subSections[p].h;
                gridSvg += `<rect x="${currentX}" y="${my}" width="${drawPaneW}" height="${mullionThick}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
            }
        }

        // Vertical mullion
        if (i < cw.cols - 1) {
            const vx = currentX + drawPaneW;
            gridSvg += `<rect x="${vx}" y="${innerStartY}" width="${mullionThick}" height="${innerH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
        }

        paneOverlays += `
            <div style="position: absolute; left: ${currentX}px; top: ${innerStartY + 10}px; width: ${drawPaneW}px; display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 20;">
                <div 
                    onclick="window.cycleStudioPartition(${i})" 
                    title="Click to cycle partitions (${parts} -> ${(parts + 1) % 3})"
                    style="background: rgba(255,255,255,0.96); border: 1.5px solid #181a1b; border-radius: 5px; padding: 2px 8px; display: flex; flex-direction: column; align-items: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.18); user-select: none; transition: transform 0.15s ease;"
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'"
                >
                    <div style="font-size: 0.88rem; font-weight: 800; color: #0f172a; line-height: 1;">${parts}</div>
                    <div style="font-size: 0.52rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                </div>

                ${parts === 1 ? `
                    <button 
                        type="button" 
                        onclick="window.cycleStudioPartitionPos(${i})"
                        title="Click to change position: Top -> Center -> Bottom"
                        style="background: #1e293b; color: white; border: 1px solid #475569; border-radius: 4px; padding: 2px 6px; font-size: 0.58rem; font-weight: 800; text-transform: uppercase; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.15); letter-spacing: 0.5px;"
                    >
                        ${pos}
                    </button>
                ` : ''}
            </div>

            <div style="position: absolute; left: ${currentX}px; top: ${startY + drawH + 8}px; width: ${drawPaneW}px; text-align: center; z-index: 20;">
                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 2px;">W(${cw.unit})</div>
                <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.paneWidths?.[i] || 50}" onchange="window.updateStudioPaneWidth(${i}, this.value)" style="width: 58px; height: 26px; text-align: center; font-weight: 700; font-size: 0.92rem; color: #0f172a; border: 1.5px solid #cbd5e1; border-radius: 5px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none;">
            </div>
        `;

        currentX += drawPaneW + (i < cw.cols - 1 ? mullionThick : 0);
    }"""

if old_studio_svg_calc in src:
    src = src.replace(old_studio_svg_calc, new_studio_svg_calc)
    print('Updated renderQuotationStudio canvas building logic')
else:
    print('ERROR: old_studio_svg_calc not matched')

# Update SVG rect in renderQuotationStudio
old_studio_svg_rect = """                    <svg viewBox="0 0 ${svgW} ${svgH}" style="width: 100%; height: 100%; max-height: 380px;">
                        <rect x="${startX}" y="${startY}" width="${drawW}" height="${drawH}" fill="rgba(240, 253, 244, 0.7)" stroke="#14532d" stroke-width="${frameThick}" rx="2" />
                        ${gridSvg}
                    </svg>"""

new_studio_svg_rect = """                    <svg viewBox="0 0 ${svgW} ${svgH}" style="width: 100%; height: 100%; max-height: 380px;">
                        <rect x="${startX}" y="${startY}" width="${drawW}" height="${drawH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW * 1.2}" rx="2" />
                        ${gridSvg}
                    </svg>"""

if old_studio_svg_rect in src:
    src = src.replace(old_studio_svg_rect, new_studio_svg_rect)
    print('Updated renderQuotationStudio SVG rect')
else:
    print('ERROR: old_studio_svg_rect not matched')

# 4. Update saveQuotationItemAndNew and saveQuotationFinal item definitions
old_save_item = """    const newItem = {
        id: 'W-' + Date.now() + '-' + itemNum,
        itemNumber: `Window W${itemNum}`,
        name: itemName,
        desc: itemDesc,
        modelTitle: modelTitle,
        cols: cw.cols,
        width: cw.totalW,
        height: cw.totalH,
        unit: cw.unit,
        qty: qty,
        pieces: qty,
        rate: unitPrice,
        price: unitPrice,
        total: totalPrice,
        areaSqFt: areaSqFt.toFixed(2),
        bomSummary: `${fItem.name}, ${pItem.name}, ${panItem.name}`
    };"""

new_save_item = """    const newItem = {
        id: 'W-' + Date.now() + '-' + itemNum,
        itemNumber: `Window W${itemNum}`,
        name: itemName,
        desc: itemDesc,
        modelTitle: modelTitle,
        cols: cw.cols,
        width: cw.totalW,
        height: cw.totalH,
        unit: cw.unit,
        paneWidths: [...(cw.paneWidths || Array(cw.cols).fill(cw.totalW / cw.cols))],
        panePartitions: [...(cw.panePartitions || Array(cw.cols).fill(0))],
        partitionPos: [...(cw.partitionPos || Array(cw.cols).fill('top'))],
        frame: qs.materials.frame,
        pipe: qs.materials.pipe,
        panel: qs.materials.panel,
        hinge: qs.materials.hinge,
        lock: qs.materials.lock,
        hook: qs.materials.hook,
        paint: qs.materials.paint,
        qty: qty,
        pieces: qty,
        rate: unitPrice,
        price: unitPrice,
        total: totalPrice,
        areaSqFt: areaSqFt.toFixed(2),
        bomSummary: `${fItem.name}, ${pItem.name}, ${panItem.name}`
    };
    newItem.drawingSvg = window.generateWindowCadSvg(newItem, { isThumbnail: true, showDimensions: true, viewW: 160, viewH: 120 });"""

if old_save_item in src:
    src = src.replace(old_save_item, new_save_item)
    print('Updated saveQuotationItemAndNew')
else:
    print('ERROR: old_save_item not matched')

old_save_final_push = """        qs.items.push({
            id: 'W-' + Date.now() + '-' + itemNum,
            itemNumber: `Window W${itemNum}`,
            name: itemName,
            desc: itemDesc,
            modelTitle: modelTitle,
            cols: cw.cols,
            width: cw.totalW,
            height: cw.totalH,
            unit: cw.unit,
            qty: qty,
            pieces: qty,
            rate: unitPrice,
            price: unitPrice,
            total: totalPrice,
            areaSqFt: areaSqFt.toFixed(2),
            bomSummary: `${fItem.name}, ${pItem.name}, ${panItem.name}`
        });"""

new_save_final_push = """        const autoItem = {
            id: 'W-' + Date.now() + '-' + itemNum,
            itemNumber: `Window W${itemNum}`,
            name: itemName,
            desc: itemDesc,
            modelTitle: modelTitle,
            cols: cw.cols,
            width: cw.totalW,
            height: cw.totalH,
            unit: cw.unit,
            paneWidths: [...(cw.paneWidths || Array(cw.cols).fill(cw.totalW / cw.cols))],
            panePartitions: [...(cw.panePartitions || Array(cw.cols).fill(0))],
            partitionPos: [...(cw.partitionPos || Array(cw.cols).fill('top'))],
            frame: qs.materials.frame,
            pipe: qs.materials.pipe,
            panel: qs.materials.panel,
            hinge: qs.materials.hinge,
            lock: qs.materials.lock,
            hook: qs.materials.hook,
            paint: qs.materials.paint,
            qty: qty,
            pieces: qty,
            rate: unitPrice,
            price: unitPrice,
            total: totalPrice,
            areaSqFt: areaSqFt.toFixed(2),
            bomSummary: `${fItem.name}, ${pItem.name}, ${panItem.name}`
        };
        autoItem.drawingSvg = window.generateWindowCadSvg(autoItem, { isThumbnail: true, showDimensions: true, viewW: 160, viewH: 120 });
        qs.items.push(autoItem);"""

if old_save_final_push in src:
    src = src.replace(old_save_final_push, new_save_final_push)
    print('Updated saveQuotationFinal auto-push')
else:
    print('ERROR: old_save_final_push not matched')

old_quote_map = """        items: qs.items.map(it => ({
            name: it.name,
            desc: it.desc,
            modelTitle: it.modelTitle || it.name,
            pieces: it.qty,
            qty: it.qty,
            rate: it.rate,
            price: it.price,
            total: it.total,
            uom: 'pcs',
            cols: it.cols,
            width: it.width,
            height: it.height,
            unit: it.unit
        }))"""

new_quote_map = """        items: qs.items.map(it => ({
            name: it.name,
            desc: it.desc,
            modelTitle: it.modelTitle || it.name,
            pieces: it.qty,
            qty: it.qty,
            rate: it.rate,
            price: it.price,
            total: it.total,
            uom: 'pcs',
            cols: it.cols,
            width: it.width,
            height: it.height,
            unit: it.unit,
            paneWidths: it.paneWidths,
            panePartitions: it.panePartitions,
            partitionPos: it.partitionPos,
            frame: it.frame,
            pipe: it.pipe,
            panel: it.panel,
            bomSummary: it.bomSummary,
            drawingSvg: it.drawingSvg || window.generateWindowCadSvg(it, { isThumbnail: true, showDimensions: true, viewW: 160, viewH: 120 })
        }))"""

if old_quote_map in src:
    src = src.replace(old_quote_map, new_quote_map)
    print('Updated saveQuotationFinal newQuote.items mapping')
else:
    print('ERROR: old_quote_map not matched')

with open('js/modules/calculation.js', 'w', encoding='utf-8') as f:
    f.write(src)

print('Canvas update patch finished successfully')
