const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Launching browser to verify all requirements...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('BROWSER ERROR:', msg.text());
            errors.push(msg.text());
        }
    });
    page.on('pageerror', err => {
        console.error('PAGE ERROR:', err.message);
        errors.push(err.message);
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    const shotDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

    // 1. Switch to calculation view
    await page.evaluate(() => {
        window.Store.state.currentView = 'calculation';
        window.Store.notify();
    });
    await new Promise(r => setTimeout(r, 800));

    // Test 1: Check if right partition panel is removed
    const panelCheck = await page.evaluate(() => {
        const p = document.getElementById('calc-right-partition-panel');
        return { exists: !!p };
    });
    console.log('Right panel #calc-right-partition-panel removed?', !panelCheck.exists);

    // Test 2: Configure 3-Kalli window matching Image 2:
    // Total W = 200 cm, Total H = 160 cm, Pane Widths: [41, 100, 41]
    // Pane 2 (middle) partitioned Top with vertical pipes (gap 7.8)
    // Pane 3 has horizontal pipes (gap 7.8)
    await page.evaluate(() => {
        const Store = window.Store;
        window.loadPreset(3);
        const g = Store.state.rateCalc.grid;
        g.totalW = 200;
        g.totalH = 160;
        g.unit = 'cm';
        g.paneWidths = [41, 100, 41];
        g.panePartitions = [0, 1, 0];
        g.partitionPos = ['top', 'top', 'top'];
        g.partitionDir = ['horizontal', 'horizontal', 'horizontal'];
        g.activePaneIndex = 1;
        g.activeSubIndex = 0;
        if (!g.subOrientations) g.subOrientations = {};
        g.subOrientations['1_0'] = 'vertical';   // Top opening has vertical tubes
        g.subOrientations['1_1'] = 'horizontal'; // Bottom opening has horizontal tubes
        g.subOrientations['0_0'] = 'horizontal'; // Left pane horizontal tubes
        g.subOrientations['2_0'] = 'horizontal'; // Right pane horizontal tubes
        Store.notify();
    });
    await new Promise(r => setTimeout(r, 600));

    // Inspect SVG dimension lines and texts
    const cadDetails = await page.evaluate(() => {
        const svg = document.querySelector('.quick-calc-container svg');
        if (!svg) return null;
        const textNodes = Array.from(svg.querySelectorAll('text')).map(t => ({
            text: t.textContent.trim(),
            x: t.getAttribute('x'),
            y: t.getAttribute('y'),
            fill: t.getAttribute('fill')
        }));
        const lines = Array.from(svg.querySelectorAll('line')).length;
        return { textNodes, linesCount: lines };
    });
    console.log('CAD Drawing Texts in SVG:', cadDetails ? cadDetails.textNodes : 'None');

    await page.screenshot({ path: path.join(shotDir, 'verify_user_exact_image2_match.png') });
    console.log('Saved screenshot 1: verify_user_exact_image2_match.png');

    // Test 3: Test Vertical Partition (PV command)
    console.log('Testing PV (Vertical Partition) command on Pane 1...');
    await page.evaluate(() => {
        // Arm PV command and apply to pane 0
        window.armCalcCommand('PARTITION_VERTICAL', 'PV', 'Vertical Partition', 'Click any pane to apply');
        window.handleSubPaneClick(0, 0);
    });
    await new Promise(r => setTimeout(r, 600));

    // Rotate Left sub-opening of Pane 1 to vertical
    await page.evaluate(() => {
        window.toggleSubGrillOrientation(0, 0); // pane 0, sub 0 -> vertical
    });
    await new Promise(r => setTimeout(r, 600));

    const pvState = await page.evaluate(() => {
        const g = window.Store.state.rateCalc.grid;
        return {
            pane0_parts: g.panePartitions[0],
            pane0_dir: g.partitionDir[0],
            pane0_sub0_orient: g.subOrientations['0_0'],
            pane0_sub1_orient: g.subOrientations['0_1'],
        };
    });
    console.log('Pane 1 Vertical Partition state:', pvState);

    await page.screenshot({ path: path.join(shotDir, 'verify_vertical_partition_pv.png') });
    console.log('Saved screenshot 2: verify_vertical_partition_pv.png');

    // Test 4: Test 5m x 3m Window Scaling & Proportions
    console.log('Testing 5m x 3m Window Scaling (Audio 1)...');
    await page.evaluate(() => {
        const Store = window.Store;
        window.loadPreset(5);
        const g = Store.state.rateCalc.grid;
        g.totalW = 5;
        g.totalH = 3;
        g.unit = 'm';
        g.paneWidths = [1, 1, 1, 1, 1];
        g.panePartitions = [0, 0, 1, 0, 0];
        g.partitionPos = ['top', 'top', 'top', 'top', 'top'];
        g.partitionDir = ['horizontal', 'horizontal', 'horizontal', 'horizontal', 'horizontal'];
        Store.notify();
    });
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({ path: path.join(shotDir, 'verify_5mx3m_scaling.png') });
    console.log('Saved screenshot 3: verify_5mx3m_scaling.png');

    await browser.close();
    console.log('Verification finished! Total browser errors:', errors.length);
})();
