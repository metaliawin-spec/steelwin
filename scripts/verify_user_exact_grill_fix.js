const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Testing exact user scenario: 3-Kalli window, middle pane partitioned into Top and Bottom, only Top rotated vertical...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 950 });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('BROWSER LOG ERROR:', msg.text());
            errors.push(msg.text());
        }
    });
    page.on('pageerror', err => {
        console.error('PAGE ERROR:', err.message);
        errors.push(err.message);
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Switch to calculation view first
    await page.evaluate(() => {
        window.Store.state.currentView = 'calculation';
        window.Store.notify();
    });
    await new Promise(r => setTimeout(r, 800));

    // Load 3 kalli preset
    await page.evaluate(() => {
        window.loadPreset(3);
    });
    await new Promise(r => setTimeout(r, 400));

    // Configure 3-kalli pane widths and middle partition
    await page.evaluate(() => {
        const Store = window.Store;
        const g = Store.state.rateCalc.grid;
        g.totalW = 200;
        g.totalH = 140;
        g.unit = 'cm';
        g.paneWidths = [55, 90, 55];
        g.panePartitions = [0, 1, 0];
        g.partitionPos = ['top', 'top', 'top'];
        g.activePaneIndex = 1;
        g.activeSubIndex = 0;
        if (!g.subOrientations) g.subOrientations = {};
        Store.notify();
    });
    await new Promise(r => setTimeout(r, 600));

    const shotDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

    await page.screenshot({ path: path.join(shotDir, 'step1_3kalli_middle_partitioned.png') });
    console.log('Saved screenshot 1: 3-kalli middle partitioned (all horizontal)');

    // Now rotate ONLY the top opening of pane 2 (index 1, subIndex 0)
    console.log('Toggling sub grill orientation for Pane 2 Top opening (index 1, subIndex 0)...');
    await page.evaluate(() => {
        window.toggleSubGrillOrientation(1, 0);
    });
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({ path: path.join(shotDir, 'step2_top_vertical_bottom_horizontal.png') });
    console.log('Saved screenshot 2: middle pane top vertical, bottom horizontal!');

    // Check orientations state
    const orientations = await page.evaluate(() => {
        const g = window.Store.state.rateCalc.grid;
        return {
            pane1: (g.subOrientations && g.subOrientations['0_0']) || (g.paneTubeOrientations && g.paneTubeOrientations[0]) || 'horizontal',
            pane2_top: (g.subOrientations && g.subOrientations['1_0']) || 'horizontal',
            pane2_main: (g.subOrientations && g.subOrientations['1_1']) || 'horizontal',
            pane3: (g.subOrientations && g.subOrientations['2_0']) || (g.paneTubeOrientations && g.paneTubeOrientations[2]) || 'horizontal',
        };
    });
    console.log('Sub-section orientations:', orientations);

    // Check SVG text elements for dimensions
    const svgDimTexts = await page.evaluate(() => {
        const svg = document.querySelector('.quick-calc-container svg');
        if (!svg) return [];
        const texts = Array.from(svg.querySelectorAll('text')).map(t => ({
            text: t.textContent.trim(),
            x: t.getAttribute('x'),
            y: t.getAttribute('y'),
            fill: t.getAttribute('fill')
        }));
        return texts;
    });
    console.log('SVG Dimension Texts:', svgDimTexts);

    // Verify there are no overlapping/dotted lines across frame
    const dashedLines = await page.evaluate(() => {
        const lines = Array.from(document.querySelectorAll('svg line[stroke-dasharray]'));
        return lines.length;
    });
    console.log('Number of dotted dashed lines in SVG:', dashedLines);

    // Check Right side Partition panel has separate Top and Main buttons
    const rightPanelContent = await page.evaluate(() => {
        const p = document.getElementById('calc-right-partition-panel');
        return p ? p.innerText : '';
    });
    console.log('Right panel content preview:\n', rightPanelContent);

    // Now test shortcut R when armed:
    console.log("Testing armed ROTATE_GRILL shortcut: pressing 'r' and clicking Pane 1...");
    await page.keyboard.press('KeyR');
    await new Promise(r => setTimeout(r, 200));

    // Click Pane 1 (subIndex 0)
    await page.evaluate(() => {
        window.handleSubPaneClick(0, 0);
    });
    await new Promise(r => setTimeout(r, 400));

    const pane1Orient = await page.evaluate(() => {
        const g = window.Store.state.rateCalc.grid;
        return (g.subOrientations && g.subOrientations['0_0']) || 'horizontal';
    });
    console.log('Pane 1 orientation after armed R click:', pane1Orient);

    await page.screenshot({ path: path.join(shotDir, 'step3_armed_rotate_pane1.png') });
    console.log('Saved screenshot 3: Pane 1 rotated via armed R command');

    await browser.close();
    console.log('Test completed with errors count:', errors.length);
})();
