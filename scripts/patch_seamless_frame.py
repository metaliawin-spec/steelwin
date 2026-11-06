import re

with open('js/modules/calculation.js', 'r', encoding='utf-8') as f:
    src = f.read()

# 1. Replace generateWindowCadSvg function with the seamless single-frame & tight sash version
old_fn_start = "export function generateWindowCadSvg(config, options = {}) {"
old_fn_end = "window.generateWindowCadSvg = generateWindowCadSvg;"

idx_start = src.find(old_fn_start)
idx_end = src.find(old_fn_end)

if idx_start != -1 and idx_end != -1:
    end_of_def = idx_end + len(old_fn_end)
    new_fn = """export function generateWindowCadSvg(config, options = {}) {
    if (!config) return '';
    const cols = Math.max(1, parseInt(config.cols) || 1);
    const totalW = parseFloat(config.width || config.totalW) || (cols * 50);
    const totalH = parseFloat(config.height || config.totalH) || 140;
    const unit = config.unit || 'cm';
    const paneWidths = (config.paneWidths && config.paneWidths.length === cols) 
        ? config.paneWidths 
        : Array(cols).fill(totalW / cols);
    const panePartitions = (config.panePartitions && config.panePartitions.length === cols) 
        ? config.panePartitions 
        : Array(cols).fill(0);
    const partitionPos = (config.partitionPos && config.partitionPos.length === cols) 
        ? config.partitionPos 
        : Array(cols).fill('top');
    const panelId = config.panel || config.materials?.panel || 'glass_5mm_clear';
    const hasPanel = panelId !== 'none' && panelId !== '' && panelId !== false && panelId !== 'None';
    const frameId = config.frame || config.materials?.frame || 'prof_4x25';
    const is4x3 = String(frameId).toLowerCase().includes('4x3') || String(config.profileName || config.desc || '').toLowerCase().includes('4x3');

    const viewW = options.viewW || (options.isThumbnail ? 220 : 600);
    const viewH = options.viewH || (options.isThumbnail ? 160 : 360);
    const padX = options.isThumbnail ? 24 : 48;
    const padY = options.isThumbnail ? 18 : 36;
    const availW = viewW - (padX * 2);
    const availH = viewH - (padY * 2);

    const aspect = Math.max(0.15, Math.min(6, totalW / totalH));
    let drawW, drawH;
    if (aspect >= (availW / availH)) {
        drawW = availW;
        drawH = Math.max(options.isThumbnail ? 45 : 100, Math.round(drawW / aspect));
    } else {
        drawH = availH;
        drawW = Math.max(options.isThumbnail ? 35 : 80, Math.round(drawH * aspect));
    }

    const startX = Math.round(padX + (availW - drawW) / 2);
    const startY = Math.round(padY + (availH - drawH) / 2);

    // Profile thickness
    const baseThick = options.isThumbnail 
        ? (is4x3 ? 6.5 : 4.5) 
        : (is4x3 ? Math.max(14, Math.round(drawH * 0.052)) : Math.max(9, Math.round(drawH * 0.038)));
    const frameThick = Math.max(options.isThumbnail ? 4 : 8, Math.round(baseThick));
    const mullionThick = Math.max(options.isThumbnail ? 3 : 6, Math.round(frameThick * 0.72));
    const sashThick = Math.max(options.isThumbnail ? 2.5 : 5, Math.round(frameThick * 0.65));
    
    // TIGHT REBATE GAP (adippichu - no over-gap)
    const sashGap = options.isThumbnail ? 1 : 1.5;

    const profileFill = '#4a4d52';
    const profileStroke = '#181a1b';
    const strokeW = options.isThumbnail ? 1 : 1.5;
    const glassFill = '#ffffff';

    // 1. One solid continuous outer frame body (NO dividing seams, completely unified group / otta frame)
    let svgContent = `<rect x="${startX}" y="${startY}" width="${drawW}" height="${drawH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW * 1.2}" rx="1" />`;

    const innerStartY = startY + frameThick;
    const innerH = drawH - (frameThick * 2);
    const totalInnerW = drawW - (frameThick * 2) - ((cols - 1) * mullionThick);

    let currentX = startX + frameThick;

    for (let i = 0; i < cols; i++) {
        const fraction = (paneWidths[i] && totalW > 0) ? (paneWidths[i] / totalW) : (1 / cols);
        const paneW = Math.max(5, Math.round(totalInnerW * fraction));
        const parts = panePartitions[i] || 0;
        const pos = partitionPos[i] || 'top';

        // Sub-sections in this pane
        const subSections = [];
        if (parts === 0) {
            subSections.push({ y: innerStartY, h: innerH });
        } else if (parts === 1) {
            let pyFrac = 0.35;
            if (pos === 'center') pyFrac = 0.50;
            else if (pos === 'bottom') pyFrac = 0.65;
            const h1 = Math.round((innerH - mullionThick) * pyFrac);
            const h2 = innerH - mullionThick - h1;
            subSections.push({ y: innerStartY, h: h1 });
            subSections.push({ y: innerStartY + h1 + mullionThick, h: h2 });
        } else {
            const hEach = Math.round((innerH - (parts * mullionThick)) / (parts + 1));
            for (let p = 0; p <= parts; p++) {
                subSections.push({ y: innerStartY + (p * (hEach + mullionThick)), h: hEach });
            }
        }

        // Render each opening (aperture cutout)
        for (let s = 0; s < subSections.length; s++) {
            const sec = subSections[s];
            if (hasPanel) {
                // Outer aperture rebate border (white hairline / rebate opening)
                svgContent += `<rect x="${currentX}" y="${sec.y}" width="${paneW}" height="${sec.h}" fill="#ffffff" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                
                // Tight Inner Sash ("koodu") - tight fit against rebate
                const sX = currentX + sashGap;
                const sY = sec.y + sashGap;
                const sW = paneW - (sashGap * 2);
                const sH = sec.h - (sashGap * 2);
                if (sW > sashThick * 2 && sH > sashThick * 2) {
                    svgContent += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                    const gX = sX + sashThick;
                    const gY = sY + sashThick;
                    const gW = sW - (sashThick * 2);
                    const gH = sH - (sashThick * 2);
                    svgContent += `<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.8}" />`;
                }
            } else {
                // Without panel: Clean white opening with stroke, seamlessly reveals the unified frame around it
                svgContent += `<rect x="${currentX}" y="${sec.y}" width="${paneW}" height="${sec.h}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
            }
        }

        currentX += paneW + (i < cols - 1 ? mullionThick : 0);
    }

    // Dimensions
    if (options.showDimensions || options.isThumbnail) {
        const textH = options.isThumbnail ? '8.5px' : '11px';
        const boxH = options.isThumbnail ? 15 : 22;
        const boxW = options.isThumbnail ? 34 : 48;
        const leftBoxX = Math.max(2, startX - boxW - (options.isThumbnail ? 4 : 8));
        const leftBoxY = Math.round(startY + (drawH - boxH) / 2);
        svgContent += `
            <rect x="${leftBoxX}" y="${leftBoxY}" width="${boxW}" height="${boxH}" rx="3" fill="#ffffff" stroke="${profileStroke}" stroke-width="1.1" />
            <text x="${leftBoxX + boxW/2}" y="${leftBoxY + boxH/2 + (options.isThumbnail ? 3 : 3.5)}" fill="#0f172a" font-size="${textH}" font-weight="700" font-family="sans-serif" text-anchor="middle">${totalH}</text>
        `;

        const botBoxX = Math.round(startX + (drawW - boxW) / 2);
        const botBoxY = Math.min(viewH - boxH - 2, startY + drawH + (options.isThumbnail ? 3 : 6));
        svgContent += `
            <rect x="${botBoxX}" y="${botBoxY}" width="${boxW}" height="${boxH}" rx="3" fill="#ffffff" stroke="${profileStroke}" stroke-width="1.1" />
            <text x="${botBoxX + boxW/2}" y="${botBoxY + boxH/2 + (options.isThumbnail ? 3 : 3.5)}" fill="#0f172a" font-size="${textH}" font-weight="700" font-family="sans-serif" text-anchor="middle">${totalW}</text>
        `;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" style="width: 100%; height: 100%; display: block;">${svgContent}</svg>`;
}
window.generateWindowCadSvg = generateWindowCadSvg;"""
    src = src[:idx_start] + new_fn + src[end_of_def:]
    print('Updated generateWindowCadSvg to seamless version')
else:
    print('ERROR: generateWindowCadSvg boundaries not found')

# 2. Update renderManualCalc Canvas Building
# We want the apertures to cut into the solid frame seamlessly
old_manual_loop_start = """        const is4x3 = String(rc.materials?.frame || '').toLowerCase().includes('4x3') || String(frameItem.name || '').toLowerCase().includes('4x3');
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
            }"""

new_manual_loop_start = """        const is4x3 = String(rc.materials?.frame || '').toLowerCase().includes('4x3') || String(frameItem.name || '').toLowerCase().includes('4x3');
        const frameThick = is4x3 ? Math.max(14, Math.round(drawH * 0.052)) : Math.max(9, Math.round(drawH * 0.038));
        const mullionThick = Math.max(6, Math.round(frameThick * 0.72));
        const sashThick = Math.max(5, Math.round(frameThick * 0.65));
        const sashGap = 1.5; // TIGHT REBATE CLEARANCE (adippichu - no over-gap)

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

            // Render sub-sections as apertures cutout into the solid frame (unified group - no seam lines)
            for (let s = 0; s < subSections.length; s++) {
                const sec = subSections[s];
                if (hasPanel) {
                    // Outer aperture rebate border (white hairline / rebate opening)
                    gridSvg += `<rect x="${currentPaneLeft}" y="${sec.y}" width="${drawPaneW}" height="${sec.h}" fill="#ffffff" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
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
                    }
                } else {
                    gridSvg += `<rect x="${currentPaneLeft}" y="${sec.y}" width="${drawPaneW}" height="${sec.h}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                }
            }"""

if old_manual_loop_start in src:
    src = src.replace(old_manual_loop_start, new_manual_loop_start)
    print('Updated renderManualCalc to seamless single-frame & tight sash')
else:
    print('ERROR: old_manual_loop_start not matched')

# 3. Update renderQuotationStudio Canvas Building
old_studio_loop_start = """    const is4x3 = String(qs.materials?.frame || '').toLowerCase().includes('4x3') || String(frameItem.name || '').toLowerCase().includes('4x3');
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
        }"""

new_studio_loop_start = """    const is4x3 = String(qs.materials?.frame || '').toLowerCase().includes('4x3') || String(frameItem.name || '').toLowerCase().includes('4x3');
    const frameThick = is4x3 ? Math.max(14, Math.round(drawH * 0.052)) : Math.max(9, Math.round(drawH * 0.038));
    const mullionThick = Math.max(6, Math.round(frameThick * 0.72));
    const sashThick = Math.max(5, Math.round(frameThick * 0.65));
    const sashGap = 1.5; // TIGHT REBATE CLEARANCE (adippichu - no over-gap)

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

        // Render each sub-section as apertures cutout into the solid frame (unified group - no seam lines)
        for (let s = 0; s < subSections.length; s++) {
            const sec = subSections[s];
            if (hasPanel) {
                // Outer aperture rebate border (white hairline / rebate opening)
                gridSvg += `<rect x="${currentX}" y="${sec.y}" width="${drawPaneW}" height="${sec.h}" fill="#ffffff" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
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
                }
            } else {
                gridSvg += `<rect x="${currentX}" y="${sec.y}" width="${drawPaneW}" height="${sec.h}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
            }
        }"""

if old_studio_loop_start in src:
    src = src.replace(old_studio_loop_start, new_studio_loop_start)
    print('Updated renderQuotationStudio to seamless single-frame & tight sash')
else:
    print('ERROR: old_studio_loop_start not matched')

with open('js/modules/calculation.js', 'w', encoding='utf-8') as f:
    f.write(src)

print('Seamless frame patch applied successfully')
