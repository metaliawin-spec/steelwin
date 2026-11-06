const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('🚀 Starting Verification of Progressive Double-Click Map Zoom...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1050 });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
            console.error('[Browser Error]', msg.text());
        }
    });
    page.on('pageerror', err => {
        errors.push(err.message);
        console.error('[Page Error]', err.message);
    });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 800));

        // -------------------------------------------------------------
        // STEP 1: Verify Initial Framing (Level 0: Full Framed View)
        // -------------------------------------------------------------
        console.log('\n--- 1. Testing Initial State (Level 0) ---');
        const level0 = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            return {
                exists: !!svg,
                viewBox: svg ? svg.getAttribute('viewBox') : null,
                zoomLevel: window.indiaMapZoomLevel,
                pillText: document.getElementById('map-active-region-pill')?.innerText
            };
        });
        console.log('Level 0 Details:', JSON.stringify(level0, null, 2));
        if (level0.viewBox !== '0 0 612 696') throw new Error(`Expected viewBox 0 0 612 696, got ${level0.viewBox}`);
        if (level0.zoomLevel !== 0) throw new Error(`Expected zoomLevel 0, got ${level0.zoomLevel}`);

        // -------------------------------------------------------------
        // STEP 2: First Double-Click on Kozhikode / Kerala Region (Level 1: Regional Focus)
        // -------------------------------------------------------------
        console.log('\n--- 2. Testing First Double-Click (Level 1: Regional Focus) ---');
        
        // Find screen coordinate of Kozhikode or center
        const clickCoord = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            const kozhikodeNode = Array.from(svg.querySelectorAll('.map-city-node')).find(n => n.textContent.includes('Kozhikode'));
            if (kozhikodeNode) {
                const rect = kozhikodeNode.getBoundingClientRect();
                return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            }
            const svgRect = svg.getBoundingClientRect();
            return { x: svgRect.x + svgRect.width * 0.35, y: svgRect.y + svgRect.height * 0.8 };
        });

        console.log(`Double-clicking at screen coordinates: (${clickCoord.x.toFixed(1)}, ${clickCoord.y.toFixed(1)})`);

        // Simulate native double-click
        await page.mouse.click(clickCoord.x, clickCoord.y, { clickCount: 2 });
        // Wait for smooth animation tween to complete (650ms + margin)
        await new Promise(r => setTimeout(r, 900));

        const level1 = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            const vb = svg.getAttribute('viewBox').split(' ').map(Number);
            return {
                viewBox: svg.getAttribute('viewBox'),
                x: vb[0], y: vb[1], w: vb[2], h: vb[3],
                zoomLevel: window.indiaMapZoomLevel,
                pillText: document.getElementById('map-active-region-pill')?.innerText,
                cursor: window.getComputedStyle(svg).cursor
            };
        });
        console.log('Level 1 Details:', JSON.stringify(level1, null, 2));

        if (level1.zoomLevel !== 1) throw new Error(`Expected zoomLevel 1, got ${level1.zoomLevel}`);
        if (level1.w > 300 || level1.w < 200) throw new Error(`Level 1 width out of expected range: ${level1.w}`);
        console.log('✅ Level 1 Verified: Successfully performed first-level smooth zoom-in toward target area.');

        const mapCard = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Delivery Locations'))?.closest('.glass-panel');
        });
        if (mapCard) {
            await mapCard.screenshot({ path: 'scripts/zoom_level_1_regional.png' });
            console.log('📸 Captured scripts/zoom_level_1_regional.png');
        }

        // -------------------------------------------------------------
        // STEP 3: Second Double-Click on that area (Level 2: Town-Level Deep Zoom)
        // -------------------------------------------------------------
        console.log('\n--- 3. Testing Second Double-Click (Level 2: Deep Zoom) ---');
        
        // Double-click again at the target area
        const clickCoordL2 = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            const svgRect = svg.getBoundingClientRect();
            return { x: svgRect.x + svgRect.width / 2, y: svgRect.y + svgRect.height / 2 };
        });

        await page.mouse.click(clickCoordL2.x, clickCoordL2.y, { clickCount: 2 });
        await new Promise(r => setTimeout(r, 950));

        const level2 = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            const vb = svg.getAttribute('viewBox').split(' ').map(Number);
            const deepDetailsVisible = Array.from(document.querySelectorAll('.town-deep-detail')).filter(t => parseFloat(t.getAttribute('opacity') || '0') > 0.5).length;
            return {
                viewBox: svg.getAttribute('viewBox'),
                x: vb[0], y: vb[1], w: vb[2], h: vb[3],
                zoomLevel: window.indiaMapZoomLevel,
                pillText: document.getElementById('map-active-region-pill')?.innerText,
                cursor: window.getComputedStyle(svg).cursor,
                deepDetailsVisible
            };
        });
        console.log('Level 2 Details:', JSON.stringify(level2, null, 2));

        if (level2.zoomLevel !== 2) throw new Error(`Expected zoomLevel 2, got ${level2.zoomLevel}`);
        if (level2.w > 150 || level2.w < 70) throw new Error(`Level 2 width out of expected range: ${level2.w}`);
        if (level2.deepDetailsVisible === 0) throw new Error('Town deep details should be visible in Level 2');
        console.log('✅ Level 2 Verified: Successfully performed deep zoom revealing precise town-level details.');

        if (mapCard) {
            await mapCard.screenshot({ path: 'scripts/zoom_level_2_town_deep.png' });
            console.log('📸 Captured scripts/zoom_level_2_town_deep.png');
        }

        // -------------------------------------------------------------
        // STEP 4: Final Double-Click (Reset / Full Zoom-Out)
        // -------------------------------------------------------------
        console.log('\n--- 4. Testing Final Double-Click (Reset to Full Zoom-Out) ---');

        await page.mouse.click(clickCoordL2.x, clickCoordL2.y, { clickCount: 2 });
        await new Promise(r => setTimeout(r, 950));

        const resetLevel = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            return {
                viewBox: svg.getAttribute('viewBox'),
                zoomLevel: window.indiaMapZoomLevel,
                pillText: document.getElementById('map-active-region-pill')?.innerText,
                cursor: window.getComputedStyle(svg).cursor
            };
        });
        console.log('Reset Level Details:', JSON.stringify(resetLevel, null, 2));

        if (resetLevel.zoomLevel !== 0) throw new Error(`Expected zoomLevel reset to 0, got ${resetLevel.zoomLevel}`);
        if (resetLevel.viewBox !== '0 0 612 696') throw new Error(`Expected reset viewBox 0 0 612 696, got ${resetLevel.viewBox}`);
        console.log('✅ Reset Verified: Successfully smoothly animated back to original default framed view.');

        if (mapCard) {
            await mapCard.screenshot({ path: 'scripts/zoom_level_0_reset_framed.png' });
            console.log('📸 Captured scripts/zoom_level_0_reset_framed.png');
        }

        console.log('\n🎉 ALL PROGRESSIVE DOUBLE-CLICK ZOOM TESTS PASSED 100%!');
    } catch (err) {
        console.error('\n❌ TEST FAILED:', err.message);
        throw err;
    } finally {
        await browser.close();
    }
})();
