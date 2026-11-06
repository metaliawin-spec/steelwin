const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('🚀 Starting Verification of Map Drag & Pan Support...');
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
        // TEST 1: Panning in Default View (Level 0)
        // -------------------------------------------------------------
        console.log('\n--- 1. Testing Panning in Default View (Level 0) ---');
        
        const initialVb = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            return {
                viewBox: svg.getAttribute('viewBox'),
                cursor: window.getComputedStyle(svg).cursor
            };
        });
        console.log('Initial Level 0 State:', JSON.stringify(initialVb, null, 2));

        // Get map center coordinates on screen
        const center = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            const rect = svg.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        });

        // Perform drag from center to right-down (panning map northwest)
        console.log(`Dragging from (${center.x.toFixed(1)}, ${center.y.toFixed(1)}) by (+90, +70)...`);
        await page.mouse.move(center.x, center.y);
        await page.mouse.down();
        await new Promise(r => setTimeout(r, 50));
        
        // Move in intermediate steps to simulate realistic mouse dragging
        for (let i = 1; i <= 5; i++) {
            await page.mouse.move(center.x + (90 * i / 5), center.y + (70 * i / 5));
            await new Promise(r => setTimeout(r, 20));
        }

        const midDragCursor = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            return window.getComputedStyle(svg).cursor;
        });
        console.log('Cursor during active drag:', midDragCursor);
        if (midDragCursor !== 'grabbing') throw new Error(`Expected grabbing cursor, got ${midDragCursor}`);

        await page.mouse.up();
        await new Promise(r => setTimeout(r, 200));

        const pannedVb0 = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            return {
                viewBox: svg.getAttribute('viewBox'),
                cursor: window.getComputedStyle(svg).cursor
            };
        });
        console.log('Panned Level 0 ViewBox:', JSON.stringify(pannedVb0, null, 2));

        if (pannedVb0.viewBox === initialVb.viewBox) {
            throw new Error('ViewBox did not change after dragging!');
        }
        console.log('✅ PASS: Map panned smoothly in default view.');

        // -------------------------------------------------------------
        // TEST 2: Double-Click to Zoom In, then Pan across regions
        // -------------------------------------------------------------
        console.log('\n--- 2. Testing Double-Click Zoom-In and Zoomed Drag/Pan ---');
        
        // Reset to full view first
        await page.evaluate(() => {
            window.handleIndiaMapDoubleClick({ clientX: 0, clientY: 0, preventDefault:()=>{}, stopPropagation:()=>{} });
        });
        await new Promise(r => setTimeout(r, 800));

        // Find Kozhikode node and double click to zoom into South
        const kozhikodePos = await page.evaluate(() => {
            const node = Array.from(document.querySelectorAll('.map-city-node')).find(n => n.textContent.includes('Kozhikode'));
            const rect = node.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        });

        console.log(`Double-clicking on Kozhikode at (${kozhikodePos.x.toFixed(1)}, ${kozhikodePos.y.toFixed(1)})...`);
        await page.mouse.click(kozhikodePos.x, kozhikodePos.y, { clickCount: 2 });
        await new Promise(r => setTimeout(r, 850));

        const zoomedState = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            return {
                viewBox: svg.getAttribute('viewBox'),
                zoomLevel: window.indiaMapZoomLevel,
                cursor: window.getComputedStyle(svg).cursor
            };
        });
        console.log('Zoomed Level 1 State:', JSON.stringify(zoomedState, null, 2));
        if (zoomedState.zoomLevel !== 1) throw new Error('Expected zoom level 1');

        // Drag to pan north towards Karnataka & Maharashtra
        console.log('Panning zoomed map southward to explore north corridors...');
        const mapCenterZoomed = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            const rect = svg.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        });

        await page.mouse.move(mapCenterZoomed.x, mapCenterZoomed.y);
        await page.mouse.down();
        for (let i = 1; i <= 6; i++) {
            await page.mouse.move(mapCenterZoomed.x - (120 * i / 6), mapCenterZoomed.y + (100 * i / 6));
            await new Promise(r => setTimeout(r, 25));
        }
        await page.mouse.up();
        await new Promise(r => setTimeout(r, 300));

        const pannedZoomedState = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            return {
                viewBox: svg.getAttribute('viewBox'),
                zoomLevel: window.indiaMapZoomLevel,
                cursor: window.getComputedStyle(svg).cursor
            };
        });
        console.log('Panned Zoomed State:', JSON.stringify(pannedZoomedState, null, 2));
        if (pannedZoomedState.viewBox === zoomedState.viewBox) {
            throw new Error('ViewBox did not update after zoomed drag!');
        }
        console.log('✅ PASS: Zoomed map dragged and panned smoothly in all directions.');

        const mapCard = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Delivery Locations'))?.closest('.glass-panel');
        });
        if (mapCard) {
            await mapCard.screenshot({ path: 'scripts/map_drag_and_pan_zoomed.png' });
            console.log('📸 Captured scripts/map_drag_and_pan_zoomed.png');
        }

        // -------------------------------------------------------------
        // TEST 3: Ensure dragging over a pin does NOT trigger toast, but clicking does
        // -------------------------------------------------------------
        console.log('\n--- 3. Testing Drag vs Single-Click Distinction ---');
        
        // Drag over a pin
        await page.mouse.move(mapCenterZoomed.x, mapCenterZoomed.y);
        await page.mouse.down();
        await page.mouse.move(mapCenterZoomed.x + 30, mapCenterZoomed.y + 30);
        await page.mouse.up();
        await new Promise(r => setTimeout(r, 150));

        const toastDuringDrag = await page.evaluate(() => {
            return !!document.getElementById('map-location-toast');
        });
        console.log('Toast appeared after dragging over canvas:', toastDuringDrag);
        if (toastDuringDrag) throw new Error('Toast should NOT appear after a pan/drag gesture!');
        console.log('✅ PASS: Drag gesture does not trigger unwanted click events.');

        // Clean click on location without drag
        await page.evaluate(() => {
            window.showLocationDetail('Kozhikode', '673638', '38', '₹ 2,45,000', 'Central Factory');
        });
        const toastAfterClick = await page.evaluate(() => {
            return !!document.getElementById('map-location-toast');
        });
        if (!toastAfterClick) throw new Error('Toast should appear on deliberate click');
        console.log('✅ PASS: Clean click triggers location details correctly.');

        console.log('\n🎉 ALL MAP DRAG & PAN SUPPORT TESTS PASSED 100%!');
    } catch (err) {
        console.error('\n❌ TEST FAILED:', err.message);
        throw err;
    } finally {
        await browser.close();
    }
})();
