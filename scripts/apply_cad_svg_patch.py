import re
import sys
import os

filepath = os.path.abspath('js/modules/calculation.js')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Read calculation.js, total size: {len(content)} chars")

# --- 1. Update generateWindowCadSvg ---
old_cad_func_pattern = re.compile(
    r"export function generateWindowCadSvg\(config, options = \{\}\) \{.*?(?=window\.generateWindowCadSvg = generateWindowCadSvg;)",
    re.DOTALL
)

new_cad_func = """export function generateWindowCadSvg(config, options = {}) {
    if (!config) return '';
    const cols = Math.max(1, parseInt(config.cols) || 1);
    const totalW = parseFloat(config.width || config.totalW) || (cols * 50);
    const totalH = parseFloat(config.height || config.totalH) || 140;
    const unit = config.unit || 'cm';
    const totalWCm = convertUnit(totalW, unit, 'cm');
    const totalHCm = convertUnit(totalH, unit, 'cm');

    const paneWidths = (config.paneWidths && config.paneWidths.length === cols) 
        ? config.paneWidths 
        : Array(cols).fill(totalW / cols);
    const panePartitions = (config.panePartitions && config.panePartitions.length === cols) 
        ? config.panePartitions 
        : Array(cols).fill(0);
    const partitionPos = (config.partitionPos && config.partitionPos.length === cols) 
        ? config.partitionPos 
        : Array(cols).fill('top');
    const partitionDir = (config.partitionDir && config.partitionDir.length === cols)
        ? config.partitionDir
        : Array(cols).fill('horizontal');

    const panelId = config.panel || config.materials?.panel || 'glass_5mm_clear';
    const hasPanel = panelId !== 'none' && panelId !== '' && panelId !== false && panelId !== 'None';
    const frameId = config.frame || config.materials?.frame || 'prof_4x25';
    const is4x3 = String(frameId).toLowerCase().includes('4x3') || String(config.profileName || config.desc || '').toLowerCase().includes('4x3');

    const viewW = options.viewW || (options.isThumbnail ? 220 : 660);
    const viewH = options.viewH || (options.isThumbnail ? 160 : 380);
    const padX = options.isThumbnail ? 24 : 56;
    const padY = options.isThumbnail ? 18 : 46;
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
    const sashGap = options.isThumbnail ? 1 : 1.5;

    const profileFill = '#4a4d52';
    const profileStroke = '#181a1b';
    const strokeW = options.isThumbnail ? 1 : 1.5;
    const glassFill = '#ffffff';

    // Solid outer frame body
    let svgContent = `<rect x="${startX}" y="${startY}" width="${drawW}" height="${drawH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW * 1.2}" rx="1" />`;

    const innerStartY = startY + frameThick;
    const innerH = drawH - (frameThick * 2);
    const totalInnerW = drawW - (frameThick * 2) - ((cols - 1) * mullionThick);

    let currentX = startX + frameThick;
    let cadBestHorizDim = null;
    let cadBestVertDim = null;
    const panePositions = [];

    for (let i = 0; i < cols; i++) {
        const fraction = (paneWidths[i] && totalW > 0) ? (paneWidths[i] / totalW) : (1 / cols);
        const paneW = Math.max(5, Math.round(totalInnerW * fraction));
        const parts = panePartitions[i] || 0;
        const pos = partitionPos[i] || 'top';
        const isVert = parts >= 1 && ((partitionDir && partitionDir[i] === 'vertical') || pos === 'vertical');

        panePositions.push({ startX: currentX, endX: currentX + paneW, w: paneW, i });

        // Sub-sections in this pane
        const subSections = [];
        if (parts === 0) {
            subSections.push({ x: currentX, y: innerStartY, w: paneW, h: innerH, isVert: false });
        } else if (isVert) {
            let pxFrac = 0.50;
            if (pos === 'left') pxFrac = 0.35;
            else if (pos === 'right') pxFrac = 0.65;
            const w1 = Math.round((paneW - mullionThick) * pxFrac);
            const w2 = paneW - mullionThick - w1;
            subSections.push({ x: currentX, y: innerStartY, w: w1, h: innerH, isVert: true });
            subSections.push({ x: currentX + w1 + mullionThick, y: innerStartY, w: w2, h: innerH, isVert: true });
        } else if (parts === 1) {
            let pyFrac = 0.35;
            if (pos === 'center') pyFrac = 0.50;
            else if (pos === 'bottom') pyFrac = 0.65;
            const h1 = Math.round((innerH - mullionThick) * pyFrac);
            const h2 = innerH - mullionThick - h1;
            subSections.push({ x: currentX, y: innerStartY, w: paneW, h: h1, isVert: false });
            subSections.push({ x: currentX, y: innerStartY + h1 + mullionThick, w: paneW, h: h2, isVert: false });
        } else {
            const hEach = Math.round((innerH - (parts * mullionThick)) / (parts + 1));
            for (let p = 0; p <= parts; p++) {
                subSections.push({ x: currentX, y: innerStartY + (p * (hEach + mullionThick)), w: paneW, h: hEach, isVert: false });
            }
        }

        // Render each opening (aperture cutout)
        for (let s = 0; s < subSections.length; s++) {
            const sec = subSections[s];
            let apX = sec.x;
            let apY = sec.y;
            let apW = sec.w;
            let apH = sec.h;

            if (hasPanel) {
                svgContent += `<rect x="${sec.x}" y="${sec.y}" width="${sec.w}" height="${sec.h}" fill="#ffffff" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                const sX = sec.x + sashGap;
                const sY = sec.y + sashGap;
                const sW = sec.w - (sashGap * 2);
                const sH = sec.h - (sashGap * 2);
                if (sW > sashThick * 2 && sH > sashThick * 2) {
                    svgContent += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                    const gX = sX + sashThick;
                    const gY = sY + sashThick;
                    const gW = sW - (sashThick * 2);
                    const gH = sH - (sashThick * 2);
                    svgContent += `<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.8}" />`;
                    apX = gX; apY = gY; apW = gW; apH = gH;
                }
            } else {
                svgContent += `<rect x="${sec.x}" y="${sec.y}" width="${sec.w}" height="${sec.h}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
            }

            // Security Grill Tubes inside aperture (20x20 Square Tubes)
            const secW_cm = (sec.w / totalInnerW) * (totalW - (cols > 1 ? (cols - 1) * 2.5 : 0));
            const secH_cm = (sec.h / innerH) * totalH;
            const subKey = `${i}_${s}`;
            const paneOrient = (config.subOrientations && config.subOrientations[subKey]) || (config.paneTubeOrientations && config.paneTubeOrientations[i]) || config.grillOrientation || 'horizontal';
            const paneCount = (config.subTubeCounts && config.subTubeCounts[subKey]) ?? (config.paneTubeCounts ? config.paneTubeCounts[i] : null);
            const grill = computePaneGrill(secW_cm, secH_cm, paneOrient, paneCount);

            const pipeThickPx = Math.max(options.isThumbnail ? 2 : 3, Math.round(drawH * (2.0 / Math.max(20, totalH))));

            if (grill.count > 0 && apW > pipeThickPx * 2 && apH > pipeThickPx * 2) {
                if (paneOrient === 'horizontal') {
                    const gapPx = (apH - (grill.count * pipeThickPx)) / (grill.count + 1);
                    for (let p = 0; p < grill.count; p++) {
                        const py = apY + gapPx * (p + 1) + pipeThickPx * p;
                        svgContent += `<rect x="${apX}" y="${py}" width="${apW}" height="${pipeThickPx}" fill="#ffffff" stroke="#334155" stroke-width="${options.isThumbnail ? 0.8 : 1.1}" rx="0.5" />`;
                    }
                    const isPart = (panePartitions[i] > 0);
                    const isMainArea = isPart ? (s > 0) : true;
                    let hScore = apH;
                    if (isMainArea) hScore += 600;
                    if (i === cols - 1) hScore += 100;

                    if (!cadBestHorizDim || hScore > cadBestHorizDim.score) {
                        cadBestHorizDim = { apX, apY, apW, apH, gapPx, pipeThickPx, gapCm: grill.gapCm, i, s, score: hScore, count: grill.count };
                    }
                } else {
                    const gapPx = (apW - (grill.count * pipeThickPx)) / (grill.count + 1);
                    for (let p = 0; p < grill.count; p++) {
                        const px = apX + gapPx * (p + 1) + pipeThickPx * p;
                        svgContent += `<rect x="${px}" y="${apY}" width="${pipeThickPx}" height="${apH}" fill="#ffffff" stroke="#334155" stroke-width="${options.isThumbnail ? 0.8 : 1.1}" rx="0.5" />`;
                    }
                    if (!cadBestVertDim || s === 0) {
                        cadBestVertDim = { apX, apY, apW, apH, gapPx, pipeThickPx, gapCm: grill.gapCm, i, s, count: grill.count };
                    }
                }
            }
        }

        currentX += paneW + (i < cols - 1 ? mullionThick : 0);
    }

    // AutoCAD Dimensions & Blueprint Annotations (Matching User Reference Image 2)
    if (options.showDimensions && !options.isThumbnail) {
        const strokeCAD = '#94a3b8';
        const strokeW_CAD = 1.1;
        const fontFam = 'monospace';

        // 1. Top Dimensions: Individual Pane Widths (Image 2: 41, 100, 41)
        for (let pIdx = 0; pIdx < panePositions.length; pIdx++) {
            const pos = panePositions[pIdx];
            const pX1 = pos.startX;
            const pX2 = pos.endX;
            const dimY = startY - 16;
            const paneWCm = Math.round(convertUnit(paneWidths[pIdx] || (totalW / cols), unit, 'cm'));

            // Witness lines
            svgContent += `<line x1="${pX1}" y1="${startY}" x2="${pX1}" y2="${dimY - 5}" stroke="${strokeCAD}" stroke-width="0.9" />`;
            svgContent += `<line x1="${pX2}" y1="${startY}" x2="${pX2}" y2="${dimY - 5}" stroke="${strokeCAD}" stroke-width="0.9" />`;
            // Dimension line
            svgContent += `<line x1="${pX1}" y1="${dimY}" x2="${pX2}" y2="${dimY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />`;
            // CAD 45° Tick marks
            svgContent += `<line x1="${pX1 - 3}" y1="${dimY + 3}" x2="${pX1 + 3}" y2="${dimY - 3}" stroke="${strokeCAD}" stroke-width="1.3" />`;
            svgContent += `<line x1="${pX2 - 3}" y1="${dimY + 3}" x2="${pX2 + 3}" y2="${dimY - 3}" stroke="${strokeCAD}" stroke-width="1.3" />`;
            // Centered dimension text
            svgContent += `<text x="${(pX1 + pX2) / 2}" y="${dimY - 4}" fill="#0f172a" font-size="10.5px" font-weight="700" font-family="${fontFam}" text-anchor="middle">${paneWCm}</text>`;
        }

        // 2. Bottom Dimension: Total Window Width (Image 2: 200)
        const botDimY = startY + drawH + 20;
        const totWCm = Math.round(totalWCm);
        svgContent += `
            <line x1="${startX}" y1="${startY + drawH}" x2="${startX}" y2="${botDimY + 6}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${startX + drawW}" y1="${startY + drawH}" x2="${startX + drawW}" y2="${botDimY + 6}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${startX}" y1="${botDimY}" x2="${startX + drawW}" y2="${botDimY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
            <line x1="${startX - 3}" y1="${botDimY + 3}" x2="${startX + 3}" y2="${botDimY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <line x1="${startX + drawW - 3}" y1="${botDimY + 3}" x2="${startX + drawW + 3}" y2="${botDimY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <text x="${startX + drawW / 2}" y="${botDimY + 14}" fill="#0f172a" font-size="12px" font-weight="800" font-family="${fontFam}" text-anchor="middle">${totWCm}</text>
        `;

        // 3. Right Dimension: Total Window Height (Image 2: 160)
        const rightDimX = startX + drawW + 22;
        const totHCm = Math.round(totalHCm);
        svgContent += `
            <line x1="${startX + drawW}" y1="${startY}" x2="${rightDimX + 6}" y2="${startY}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${startX + drawW}" y1="${startY + drawH}" x2="${rightDimX + 6}" y2="${startY + drawH}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${rightDimX}" y1="${startY}" x2="${rightDimX}" y2="${startY + drawH}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
            <line x1="${rightDimX - 3}" y1="${startY + 3}" x2="${rightDimX + 3}" y2="${startY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <line x1="${rightDimX - 3}" y1="${startY + drawH + 3}" x2="${rightDimX + 3}" y2="${startY + drawH - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <text x="${rightDimX + 8}" y="${startY + drawH / 2 + 4}" fill="#0f172a" font-size="12px" font-weight="800" font-family="${fontFam}" text-anchor="start">${totHCm}</text>
        `;

        // 4. Left Dimension: Partition Heights (Image 2: 41 and 105)
        const horizPartIdx = panePartitions.findIndex((p, idx) => p > 0 && partitionDir[idx] !== 'vertical');
        const leftDimX = startX - 22;
        if (horizPartIdx !== -1) {
            const hPos = partitionPos[horizPartIdx] || 'top';
            const pyFrac = hPos === 'center' ? 0.50 : (hPos === 'bottom' ? 0.65 : 0.35);
            const divY = innerStartY + Math.round((innerH - mullionThick) * pyFrac) + Math.round(mullionThick / 2);
            const topHCm = Math.round(totHCm * pyFrac);
            const botHCm = Math.round(totHCm * (1 - pyFrac));

            svgContent += `
                <line x1="${startX}" y1="${startY}" x2="${leftDimX - 6}" y2="${startY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${startX}" y1="${divY}" x2="${leftDimX - 6}" y2="${divY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${startX}" y1="${startY + drawH}" x2="${leftDimX - 6}" y2="${startY + drawH}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${leftDimX}" y1="${startY}" x2="${leftDimX}" y2="${divY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX}" y1="${divY}" x2="${leftDimX}" y2="${startY + drawH}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX - 3}" y1="${startY + 3}" x2="${leftDimX + 3}" y2="${startY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${divY + 3}" x2="${leftDimX + 3}" y2="${divY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${startY + drawH + 3}" x2="${leftDimX + 3}" y2="${startY + drawH - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <text x="${leftDimX - 8}" y="${(startY + divY) / 2 + 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="end">${topHCm}</text>
                <text x="${leftDimX - 8}" y="${(divY + startY + drawH) / 2 + 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="end">${botHCm}</text>
            `;
        } else {
            svgContent += `
                <line x1="${startX}" y1="${startY}" x2="${leftDimX - 6}" y2="${startY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${startX}" y1="${startY + drawH}" x2="${leftDimX - 6}" y2="${startY + drawH}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${leftDimX}" y1="${startY}" x2="${leftDimX}" y2="${startY + drawH}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX - 3}" y1="${startY + 3}" x2="${leftDimX + 3}" y2="${startY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${startY + drawH + 3}" x2="${leftDimX + 3}" y2="${startY + drawH - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <text x="${leftDimX - 8}" y="${startY + drawH / 2 + 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="end">${totHCm}</text>
            `;
        }

        // 5. Grill Gap Dimensions inside apertures (Image 2: 7.8)
        if (cadBestVertDim && cadBestVertDim.gapCm > 0) {
            const p = Math.max(0, Math.floor(((cadBestVertDim.count || 2) - 1) / 2));
            const x1 = cadBestVertDim.apX + cadBestVertDim.gapPx * (p + 1) + cadBestVertDim.pipeThickPx * p;
            const x2 = x1 + cadBestVertDim.gapPx;
            const midY = cadBestVertDim.apY + cadBestVertDim.apH / 2;
            svgContent += `
                <line x1="${x1}" y1="${midY}" x2="${x2}" y2="${midY}" stroke="#16a34a" stroke-width="1.2" />
                <line x1="${x1}" y1="${midY - 4}" x2="${x1}" y2="${midY + 4}" stroke="#16a34a" stroke-width="1.1" />
                <line x1="${x2}" y1="${midY - 4}" x2="${x2}" y2="${midY + 4}" stroke="#16a34a" stroke-width="1.1" />
                <text x="${(x1 + x2) / 2}" y="${midY - 5}" fill="#16a34a" font-size="10px" font-weight="700" font-family="${fontFam}" text-anchor="middle">${cadBestVertDim.gapCm}</text>
            `;
        }
        if (cadBestHorizDim && cadBestHorizDim.gapCm > 0) {
            const p = Math.max(0, Math.floor(((cadBestHorizDim.count || 2) - 1) / 2));
            const y1 = cadBestHorizDim.apY + cadBestHorizDim.gapPx * (p + 1) + cadBestHorizDim.pipeThickPx * p;
            const y2 = y1 + cadBestHorizDim.gapPx;
            const midX = cadBestHorizDim.apX + cadBestHorizDim.apW / 2;
            svgContent += `
                <line x1="${midX}" y1="${y1}" x2="${midX}" y2="${y2}" stroke="#16a34a" stroke-width="1.2" />
                <line x1="${midX - 4}" y1="${y1}" x2="${midX + 4}" y2="${y1}" stroke="#16a34a" stroke-width="1.1" />
                <line x1="${midX - 4}" y1="${y2}" x2="${midX + 4}" y2="${y2}" stroke="#16a34a" stroke-width="1.1" />
                <text x="${midX + 7}" y="${(y1 + y2) / 2 + 3.5}" fill="#16a34a" font-size="10px" font-weight="700" font-family="${fontFam}" text-anchor="start">${cadBestHorizDim.gapCm}</text>
            `;
        }
    } else if (options.showDimensions || options.isThumbnail) {
        // Thumbnail simplified badges
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
"""

if old_cad_func_pattern.search(content):
    content = old_cad_func_pattern.sub(new_cad_func, content, count=1)
    print("Replaced generateWindowCadSvg successfully!")
else:
    print("WARNING: Could not find generateWindowCadSvg pattern!")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
