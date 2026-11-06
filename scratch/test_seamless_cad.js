const fs = require('fs');

function generateWindowCadSvg(config, options = {}) {
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
    
    // TIGHT REBATE CLEARANCE (adippichu - no over-gap)
    const sashGap = options.isThumbnail ? 1 : 1.5;

    const profileFill = '#4a4d52';
    const profileStroke = '#181a1b';
    const strokeW = options.isThumbnail ? 1 : 1.5;
    const glassFill = '#ffffff';

    // 1. One solid continuous outer frame body (NO seams, completely unified group)
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
            <rect x="${leftBoxX}" y="${leftBoxY}" width="${boxW}" height="${boxH}" rx="3" fill="#ffffff" stroke="#181a1b" stroke-width="1.1" />
            <text x="${leftBoxX + boxW/2}" y="${leftBoxY + boxH/2 + (options.isThumbnail ? 3 : 3.5)}" fill="#0f172a" font-size="${textH}" font-weight="700" font-family="sans-serif" text-anchor="middle">${totalH}</text>
        `;

        const botBoxX = Math.round(startX + (drawW - boxW) / 2);
        const botBoxY = Math.min(viewH - boxH - 2, startY + drawH + (options.isThumbnail ? 3 : 6));
        svgContent += `
            <rect x="${botBoxX}" y="${botBoxY}" width="${boxW}" height="${boxH}" rx="3" fill="#ffffff" stroke="#181a1b" stroke-width="1.1" />
            <text x="${botBoxX + boxW/2}" y="${botBoxY + boxH/2 + (options.isThumbnail ? 3 : 3.5)}" fill="#0f172a" font-size="${textH}" font-weight="700" font-family="sans-serif" text-anchor="middle">${totalW}</text>
        `;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" style="width: 100%; height: 100%; display: block;">${svgContent}</svg>`;
}

const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 30px; margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; max-width: 1300px; margin: 0 auto; }
    .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .card h3 { margin-top: 0; font-size: 0.95rem; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
    .preview-box { width: 100%; height: 260px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
</style>
</head>
<body>
    <div style="max-width: 1300px; margin: 0 auto 24px auto;">
        <h1 style="color: #0f172a; margin: 0 0 8px 0;">Seamless Single-Frame (Otta Frame) & Tight Sash Gap</h1>
        <p style="color: #64748b; margin: 0;">No black seams at partition ends. Continuous welded frame structure. Tight rebate clearance.</p>
    </div>
    <div class="grid">
        <div class="card">
            <h3>1. Single Window (60×160) - Tight Panel Sash</h3>
            <div class="preview-box">
                ${generateWindowCadSvg({ cols: 1, width: 60, height: 160, unit: 'cm', panel: 'glass_5mm_clear', frame: 'prof_4x25' }, { showDimensions: true })}
            </div>
        </div>
        <div class="card">
            <h3>2. 3-Kalli (150×140) - Seamless Frame & Tight Sashes</h3>
            <div class="preview-box">
                ${generateWindowCadSvg({ cols: 3, width: 150, height: 140, unit: 'cm', panel: 'glass_5mm_clear', frame: 'prof_4x25' }, { showDimensions: true })}
            </div>
        </div>
        <div class="card">
            <h3>3. 3-Kalli WITH Partition - One Unified Frame</h3>
            <div class="preview-box">
                ${generateWindowCadSvg({ cols: 3, width: 150, height: 140, panePartitions: [0, 1, 0], partitionPos: ['top', 'top', 'top'], unit: 'cm', panel: 'glass_5mm_clear', frame: 'prof_4x25' }, { showDimensions: true })}
            </div>
        </div>
        <div class="card">
            <h3>4. 3-Kalli Without Panel - Pure Seamless Frame</h3>
            <div class="preview-box">
                ${generateWindowCadSvg({ cols: 3, width: 150, height: 140, unit: 'cm', panel: 'none', frame: 'prof_4x25' }, { showDimensions: true })}
            </div>
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_seamless_preview.html', html);
console.log('scratch/test_seamless_preview.html written successfully');
