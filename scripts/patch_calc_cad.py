import re

with open('js/modules/calculation.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add generateWindowCadSvg after convertUnit
cad_svg_fn = '''
export function generateWindowCadSvg(config, options = {}) {
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

    // Profile thickness: 4x3 is visibly bolder than 4x2
    const baseThick = options.isThumbnail 
        ? (is4x3 ? 6.5 : 4.5) 
        : (is4x3 ? Math.max(14, Math.round(drawH * 0.052)) : Math.max(9, Math.round(drawH * 0.036)));
    const frameThick = Math.max(options.isThumbnail ? 4 : 8, Math.round(baseThick));
    const mullionThick = Math.max(options.isThumbnail ? 3 : 6, Math.round(frameThick * 0.72));
    const sashThick = Math.max(options.isThumbnail ? 2.5 : 5, Math.round(frameThick * 0.65));
    const sashGap = Math.max(options.isThumbnail ? 1.5 : 3, Math.round(frameThick * 0.28));

    const profileFill = '#4a4d52';
    const profileStroke = '#181a1b';
    const strokeW = options.isThumbnail ? 1 : 1.5;
    const glassFill = '#ffffff';

    let panesSvg = '';
    let currentX = startX + frameThick;
    const innerStartY = startY + frameThick;
    const innerH = drawH - (frameThick * 2);
    const totalInnerW = drawW - (frameThick * 2) - ((cols - 1) * mullionThick);

    for (let i = 0; i < cols; i++) {
        const fraction = (paneWidths[i] && totalW > 0) ? (paneWidths[i] / totalW) : (1 / cols);
        const paneW = Math.max(5, Math.round(totalInnerW * fraction));
        const parts = panePartitions[i] || 0;
        const pos = partitionPos[i] || 'top';

        // Sub-sections in this pane (based on horizontal partition)
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

        // Render each sub-section
        for (let s = 0; s < subSections.length; s++) {
            const sec = subSections[s];
            if (hasPanel) {
                // Background opening
                panesSvg += `<rect x="${currentX}" y="${sec.y}" width="${paneW}" height="${sec.h}" fill="#f8fafc" />`;
                // Inner Sash Frame ("koodu")
                const sX = currentX + sashGap;
                const sY = sec.y + sashGap;
                const sW = paneW - (sashGap * 2);
                const sH = sec.h - (sashGap * 2);
                if (sW > sashThick * 2 && sH > sashThick * 2) {
                    panesSvg += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                    const gX = sX + sashThick;
                    const gY = sY + sashThick;
                    const gW = sW - (sashThick * 2);
                    const gH = sH - (sashThick * 2);
                    panesSvg += `<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.8}" />`;
                } else {
                    panesSvg += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                }
            } else {
                // Without panel: Clean white opening with stroke
                panesSvg += `<rect x="${currentX}" y="${sec.y}" width="${paneW}" height="${sec.h}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.7}" />`;
            }
        }

        // Draw horizontal divider mullions if parts > 0
        if (parts === 1) {
            const my = subSections[0].y + subSections[0].h;
            panesSvg += `<rect x="${currentX}" y="${my}" width="${paneW}" height="${mullionThick}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
        } else if (parts > 1) {
            for (let p = 0; p < parts; p++) {
                const my = subSections[p].y + subSections[p].h;
                panesSvg += `<rect x="${currentX}" y="${my}" width="${paneW}" height="${mullionThick}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
            }
        }

        // Draw vertical mullion between kallis
        if (i < cols - 1) {
            const vx = currentX + paneW;
            panesSvg += `<rect x="${vx}" y="${innerStartY}" width="${mullionThick}" height="${innerH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
        }

        currentX += paneW + (i < cols - 1 ? mullionThick : 0);
    }

    // Outer frame rect
    const outerSvg = `<rect x="${startX}" y="${startY}" width="${drawW}" height="${drawH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW * 1.2}" />`;

    // Dimension lines & badges if requested or thumbnail
    let dimSvg = '';
    if (options.showDimensions || options.isThumbnail) {
        const textH = options.isThumbnail ? '8.5px' : '11px';
        const boxH = options.isThumbnail ? 15 : 22;
        const boxW = options.isThumbnail ? 34 : 48;
        // Left Height dimension box (matching photos)
        const leftBoxX = Math.max(2, startX - boxW - (options.isThumbnail ? 4 : 8));
        const leftBoxY = Math.round(startY + (drawH - boxH) / 2);
        dimSvg += `
            <rect x="${leftBoxX}" y="${leftBoxY}" width="${boxW}" height="${boxH}" rx="3" fill="#ffffff" stroke="#181a1b" stroke-width="1.1" />
            <text x="${leftBoxX + boxW/2}" y="${leftBoxY + boxH/2 + (options.isThumbnail ? 3 : 3.5)}" fill="#0f172a" font-size="${textH}" font-weight="700" font-family="sans-serif" text-anchor="middle">${totalH}</text>
        `;

        // Bottom Width dimension box (matching photos)
        const botBoxX = Math.round(startX + (drawW - boxW) / 2);
        const botBoxY = Math.min(viewH - boxH - 2, startY + drawH + (options.isThumbnail ? 3 : 6));
        dimSvg += `
            <rect x="${botBoxX}" y="${botBoxY}" width="${boxW}" height="${boxH}" rx="3" fill="#ffffff" stroke="#181a1b" stroke-width="1.1" />
            <text x="${botBoxX + boxW/2}" y="${botBoxY + boxH/2 + (options.isThumbnail ? 3 : 3.5)}" fill="#0f172a" font-size="${textH}" font-weight="700" font-family="sans-serif" text-anchor="middle">${totalW}</text>
        `;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" style="width: 100%; height: 100%; display: block;">${outerSvg}${panesSvg}${dimSvg}</svg>`;
}
window.generateWindowCadSvg = generateWindowCadSvg;
'''

if 'export function generateWindowCadSvg' not in code:
    code = code.replace("window.convertUnit = convertUnit;\n", "window.convertUnit = convertUnit;\n" + cad_svg_fn + "\n")
    print('Inserted generateWindowCadSvg at top of calculation.js')

with open('js/modules/calculation.js', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patch part 1 complete.')
