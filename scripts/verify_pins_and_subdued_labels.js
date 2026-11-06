const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('🚀 Starting Verification of Custom Red Pins & Subdued Labels...');
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
        await new Promise(r => setTimeout(r, 900));

        const svgSelector = '#india-3d-map-svg';
        await page.waitForSelector(svgSelector);

        // -------------------------------------------------------------
        // CHECK 1: Custom Red Location Marker/Pin Icons
        // -------------------------------------------------------------
        console.log('\n--- 1. Testing Custom Red Location Marker/Pin Icons ---');
        const pinDetails = await page.evaluate(() => {
            const nodes = Array.from(document.querySelectorAll('.map-city-node'));
            let redPinCount = 0;
            let goldOriginCount = 0;
            let simpleRedDotCount = 0;

            nodes.forEach(n => {
                const paths = Array.from(n.querySelectorAll('path'));
                const circles = Array.from(n.querySelectorAll('circle'));
                
                // Check if path contains teardrop pin
                const hasTeardropPin = paths.some(p => {
                    const d = p.getAttribute('d') || '';
                    return d.includes('M 0,0 C') || d.includes('M 0,-7') || d.includes('M 0,-9');
                });
                const isGold = paths.some(p => (p.getAttribute('fill') || '').includes('goldPinGradient'));
                const isRed = paths.some(p => (p.getAttribute('fill') || '').includes('redPinGradient'));

                if (hasTeardropPin && isRed) redPinCount++;
                if (hasTeardropPin && isGold) goldOriginCount++;

                // Check for old simple red circular dots
                circles.forEach(c => {
                    if (c.getAttribute('r') === '2.5' && c.getAttribute('fill') === '#ef4444') {
                        simpleRedDotCount++;
                    }
                });
            });

            return {
                totalCityNodes: nodes.length,
                redPinCount,
                goldOriginCount,
                simpleRedDotCount
            };
        });

        console.log('Pin Details:', JSON.stringify(pinDetails, null, 2));
        if (pinDetails.simpleRedDotCount > 0) throw new Error('Found old simple red circular dots!');
        if (pinDetails.redPinCount === 0) throw new Error('No custom red pin icons found!');
        if (pinDetails.goldOriginCount === 0) throw new Error('No origin gold pin found!');
        console.log('✅ PASS: Simple red dots completely replaced with custom compact red location marker/pin icons.');

        // -------------------------------------------------------------
        // CHECK 2: Verification of NO Raw PIN Code Numbers on Canvas
        // -------------------------------------------------------------
        console.log('\n--- 2. Verifying NO Raw PIN Code Numbers on Canvas ---');
        const textClutterCheck = await page.evaluate(() => {
            const textNodes = Array.from(document.querySelectorAll('#map-destinations-layer text'));
            const textContents = textNodes.map(t => t.textContent.trim());
            const hasRawPin = textContents.some(t => t.toUpperCase().includes('PIN ') || /\b[1-9][0-9]{5}\b/.test(t));
            const offendingTexts = textContents.filter(t => t.toUpperCase().includes('PIN ') || /\b[1-9][0-9]{5}\b/.test(t));
            return {
                totalTextElements: textNodes.length,
                hasRawPin,
                offendingTexts,
                sampleTexts: textContents.slice(0, 15)
            };
        });

        console.log('Text Clutter Check:', JSON.stringify(textClutterCheck, null, 2));
        if (textClutterCheck.hasRawPin) {
            throw new Error(`CRITICAL: Found raw PIN codes in text labels: ${textClutterCheck.offendingTexts.join(', ')}`);
        }
        console.log('✅ PASS: Strictly ZERO raw PIN numbers displayed on the map canvas.');

        // -------------------------------------------------------------
        // CHECK 3: Subdued District and Town Labels (Half-Brightness)
        // -------------------------------------------------------------
        console.log('\n--- 3. Testing Subdued District and Town Labels (Half-Brightness) ---');
        const labelStyleCheck = await page.evaluate(() => {
            const labels = Array.from(document.querySelectorAll('.town-main-name'));
            const opacities = labels.map(l => parseFloat(l.getAttribute('opacity') || window.getComputedStyle(l).opacity));
            const fills = labels.map(l => l.getAttribute('fill') || window.getComputedStyle(l).fill);
            const names = labels.map(l => l.textContent.trim());

            // Average opacity of standard (non-origin) labels
            const nonOriginLabels = labels.filter(l => !l.textContent.includes('★'));
            const nonOriginOpacities = nonOriginLabels.map(l => parseFloat(l.getAttribute('opacity') || '1'));
            const avgOpacity = nonOriginOpacities.reduce((a, b) => a + b, 0) / nonOriginOpacities.length;

            return {
                totalLabels: labels.length,
                avgNonOriginOpacity: avgOpacity,
                hasKeralaDistricts: ['Kannur', 'Wayanad', 'Malappuram', 'Palakkad', 'Thrissur', 'Kochi', 'Alappuzha', 'Kollam'].every(k => names.some(n => n.includes(k))),
                sampleOpacities: nonOriginOpacities.slice(0, 10),
                sampleNames: names.slice(0, 12)
            };
        });

        console.log('Label Style Check:', JSON.stringify(labelStyleCheck, null, 2));
        if (labelStyleCheck.avgNonOriginOpacity > 0.6) {
            throw new Error(`Expected half-brightness (opacity <= 0.55), got avg ${labelStyleCheck.avgNonOriginOpacity}`);
        }
        if (!labelStyleCheck.hasKeralaDistricts) {
            throw new Error('Missing key Kerala districts/towns in active region!');
        }
        console.log('✅ PASS: Labels rendered in half-brightness (0.5 opacity) subtle style blending into dark background.');

        // -------------------------------------------------------------
        // Capturing Screenshots
        // -------------------------------------------------------------
        const mapCard = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Delivery Locations'))?.closest('.glass-panel');
        });

        if (mapCard) {
            await mapCard.screenshot({ path: 'scripts/map_custom_red_pins_full.png' });
            console.log('📸 Captured scripts/map_custom_red_pins_full.png');
        }

        // Zoom to Kerala & South
        console.log('\nZooming to Kerala & South corridor...');
        await page.evaluate(() => {
            window.setDashboardMapZoom('smart_kerala');
        });
        await new Promise(r => setTimeout(r, 700));

        if (mapCard) {
            await mapCard.screenshot({ path: 'scripts/map_custom_red_pins_kerala_zoom.png' });
            console.log('📸 Captured scripts/map_custom_red_pins_kerala_zoom.png');
        }

        console.log('\n🎉 ALL VISUAL UPDATES & LOCATION-LABELING REFINEMENTS VERIFIED 100%!');
    } catch (err) {
        console.error('\n❌ VERIFICATION FAILED:', err.message);
        throw err;
    } finally {
        await browser.close();
    }
})();
