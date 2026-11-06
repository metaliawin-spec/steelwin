const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Starting automated browser verification...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

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
    console.log('Navigated to localhost:3000');

    // Switch to calculation view
    await page.evaluate(() => {
        window.Store.state.currentView = 'calculation';
        window.Store.notify();
    });
    await new Promise(r => setTimeout(r, 600));

    // Verify 2D Interactive Model rendered
    const viewTitle = await page.evaluate(() => {
        return document.querySelector('h1, h2, h3')?.innerText || '';
    });
    console.log('Current page header:', viewTitle);

    // Screenshot 1: Default 1-kalli window with grill pipes and dimension
    const shotDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

    await page.screenshot({ path: path.join(shotDir, '1_default_window_model.png') });
    console.log('Saved screenshot 1: default window model');

    // Check right side partition panel
    const hasRightPanel = await page.evaluate(() => {
        const p = document.getElementById('calc-right-partition-panel');
        return !!p;
    });
    console.log('Right side partition panel present:', hasRightPanel);

    // Check pipe badge
    const pipeBadgeText = await page.evaluate(() => {
        const badges = Array.from(document.querySelectorAll('div, span'));
        const b = badges.find(el => el.innerText && el.innerText.includes('Pipe (20x20 Square Tube)'));
        return b ? b.innerText : 'NOT FOUND';
    });
    console.log('Pipe badge text:', pipeBadgeText);

    // Test shortcut: type 'p' then 'm' to arm PM
    console.log("Typing 'p' then 'm' for PM (Middle Partition)...");
    await page.keyboard.press('KeyP');
    await page.keyboard.press('KeyM');
    await new Promise(r => setTimeout(r, 200));

    // Check armed banner
    const armedBannerInfo = await page.evaluate(() => {
        const banner = document.getElementById('calc-armed-command-banner');
        return {
            exists: !!banner,
            visible: banner ? banner.style.display !== 'none' : false,
            text: banner ? banner.innerText : ''
        };
    });
    console.log('Armed banner state after PM:', armedBannerInfo);
    await page.screenshot({ path: path.join(shotDir, '2_armed_command_pm.png') });

    // Click pane to apply PM
    console.log('Clicking the window pane to apply armed command...');
    await page.evaluate(() => {
        window.handlePaneClick(0);
    });
    await new Promise(r => setTimeout(r, 400));

    const panePartitionState = await page.evaluate(() => {
        const g = window.Store.state.rateCalc.grid;
        return {
            parts: g.panePartitions[0],
            pos: g.partitionPos[0]
        };
    });
    console.log('Pane partition state after click:', panePartitionState);
    await page.screenshot({ path: path.join(shotDir, '3_middle_partition_applied.png') });

    // Test Rotate Grill shortcut: type 'r'
    console.log("Typing 'r' for Rotate Grill...");
    await page.keyboard.press('KeyR');
    await new Promise(r => setTimeout(r, 200));

    const rotateBannerInfo = await page.evaluate(() => {
        const banner = document.getElementById('calc-armed-command-banner');
        return banner ? banner.innerText : '';
    });
    console.log('Armed banner for Rotate:', rotateBannerInfo);

    // Click pane to apply rotate
    await page.evaluate(() => {
        window.handlePaneClick(0);
    });
    await new Promise(r => setTimeout(r, 400));

    const grillOrientation = await page.evaluate(() => {
        return window.Store.state.rateCalc.grid.paneTubeOrientations[0];
    });
    console.log('Grill orientation after rotate:', grillOrientation);
    await page.screenshot({ path: path.join(shotDir, '4_vertical_grill_rotated.png') });

    // Test 3 Kalli window preset
    console.log('Loading 3 Kalli preset...');
    await page.evaluate(() => {
        window.loadPreset(3);
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(shotDir, '5_three_kalli_window.png') });

    // Check Material Breakdown Table content
    const breakdownContent = await page.evaluate(() => {
        const pipeRow = Array.from(document.querySelectorAll('tr')).find(r => r.innerText.includes('Pipe (20x20 Square Tube)'));
        const laborRow = Array.from(document.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('normal (@') && d.innerText.includes('partitioned (@'));
        return {
            pipeRow: pipeRow ? pipeRow.innerText.replace(/\s+/g, ' ').trim() : 'NOT FOUND',
            laborRow: laborRow ? laborRow.innerText.replace(/\s+/g, ' ').trim() : 'NOT FOUND'
        };
    });
    console.log('Material Breakdown Pipe Row:', breakdownContent.pipeRow);
    console.log('Cost Summary Labor Row:', breakdownContent.laborRow);

    await browser.close();
    console.log('Automated verification completed successfully with', errors.length, 'page errors.');
})();
