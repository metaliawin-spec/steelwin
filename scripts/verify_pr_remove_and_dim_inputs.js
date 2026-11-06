const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Testing PR Remove, 2D Canvas Reset Button, and Editable Panel (Poli) Height Dimension (49 -> 53)...');
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

    // Switch to calculation view
    await page.evaluate(() => {
        window.Store.state.currentView = 'calculation';
        window.Store.notify();
    });
    await new Promise(r => setTimeout(r, 600));

    // 1. Verify Shortcuts Bar shows "PR Remove" and is clickable
    const shortcutsBarText = await page.evaluate(() => {
        const bar = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Shortcuts:'));
        return bar ? bar.innerText : '';
    });
    console.log('Shortcuts bar text:', shortcutsBarText);
    if (!shortcutsBarText.includes('PR Remove')) {
        throw new Error('FAILED: Shortcuts bar does not contain "PR Remove"!');
    }
    console.log('✓ Verified: Shortcuts bar contains "PR Remove"');

    // 2. Verify Top-Right Reset button exists in 2D canvas box
    const resetBtnExists = await page.evaluate(() => {
        const btn = document.getElementById('calc-reset-window-btn');
        return btn !== null && btn.innerText.includes('Reset');
    });
    console.log('Top-Right Reset Button exists:', resetBtnExists);
    if (!resetBtnExists) {
        throw new Error('FAILED: Dedicated top-right Reset button not found!');
    }
    console.log('✓ Verified: Dedicated top-right Reset button exists');

    // 3. Configure a 3-Kalli window (200x140 cm) with center pane partitioned with Top partition
    await page.evaluate(() => {
        window.loadPreset(3);
    });
    await new Promise(r => setTimeout(r, 400));

    await page.evaluate(() => {
        const Store = window.Store;
        const g = Store.state.rateCalc.grid;
        g.totalW = 200;
        g.totalH = 140;
        g.unit = 'cm';
        g.paneWidths = [50, 100, 50];
        g.panePartitions = [0, 1, 0];
        g.partitionPos = ['top', 'top', 'top'];
        g.activePaneIndex = 1;
        Store.notify();
    });
    await new Promise(r => setTimeout(r, 600));

    // 4. Verify initial panel height dimension inputs (49 top, 91 bottom for 140cm window at 35%)
    const initialDims = await page.evaluate(() => {
        const topIn = document.getElementById('calc-top-dim-input');
        const botIn = document.getElementById('calc-bot-dim-input');
        return {
            topVal: topIn ? topIn.value : null,
            botVal: botIn ? botIn.value : null
        };
    });
    console.log('Initial partition dimensions:', initialDims);
    if (initialDims.topVal !== '49' || initialDims.botVal !== '91') {
        throw new Error(`FAILED: Expected initial dimensions 49 & 91, got ${initialDims.topVal} & ${initialDims.botVal}`);
    }
    console.log('✓ Verified: Initial top panel height is 49 cm, bottom is 91 cm');

    // 5. Change top panel height from 49 to 53 (as explicitly requested by user in audio)
    console.log('Changing top panel height from 49 to 53...');
    await page.evaluate(() => {
        const topIn = document.getElementById('calc-top-dim-input');
        topIn.value = '53';
        topIn.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 600));

    // 6. Verify that top panel is now 53, bottom panel is 87 (140 - 53), and state partitionHeights[1] is 53
    const updatedDims = await page.evaluate(() => {
        const topIn = document.getElementById('calc-top-dim-input');
        const botIn = document.getElementById('calc-bot-dim-input');
        const g = window.Store.state.rateCalc.grid;
        return {
            topVal: topIn ? topIn.value : null,
            botVal: botIn ? botIn.value : null,
            storedHeight: g.partitionHeights ? g.partitionHeights[1] : null
        };
    });
    console.log('Updated partition dimensions after changing to 53:', updatedDims);
    if (updatedDims.topVal !== '53' || updatedDims.botVal !== '87' || updatedDims.storedHeight !== 53) {
        throw new Error(`FAILED: Expected top 53, bottom 87, stored 53; got: ${JSON.stringify(updatedDims)}`);
    }
    console.log('✓ Verified: Top panel height successfully updated to 53 cm, bottom panel automatically adjusted to 87 cm');

    const shotDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

    await page.screenshot({ path: path.join(shotDir, 'poli_height_53_verified.png'), fullPage: false });
    console.log('Saved screenshot: screenshots/poli_height_53_verified.png');

    // 7. Test removing partition using PR Remove
    console.log('Testing PR Remove on active pane...');
    await page.evaluate(() => {
        window.removePanePartition(1);
    });
    await new Promise(r => setTimeout(r, 500));

    const partsAfterRemove = await page.evaluate(() => {
        const g = window.Store.state.rateCalc.grid;
        return {
            parts: g.panePartitions[1],
            heights: g.partitionHeights ? g.partitionHeights[1] : undefined,
            topInExists: document.getElementById('calc-top-dim-input') !== null
        };
    });
    console.log('After PR Remove:', partsAfterRemove);
    if (partsAfterRemove.parts !== 0 || partsAfterRemove.topInExists) {
        throw new Error(`FAILED: Partition was not removed cleanly! ${JSON.stringify(partsAfterRemove)}`);
    }
    console.log('✓ Verified: Partition removed cleanly with PR Remove');

    await page.screenshot({ path: path.join(shotDir, 'partition_removed_verified.png'), fullPage: false });
    console.log('Saved screenshot: screenshots/partition_removed_verified.png');

    // 8. Re-add partition, customize width, then test Reset button
    console.log('Adding partition and testing canvas Reset button...');
    await page.evaluate(() => {
        window.setPanePartitionPos(1, 'quarter', 'horizontal', 1);
        const g = window.Store.state.rateCalc.grid;
        g.paneWidths[0] = 70;
        window.Store.notify();
    });
    await new Promise(r => setTimeout(r, 500));

    // Click the dedicated top-right Reset button
    await page.click('#calc-reset-window-btn');
    await new Promise(r => setTimeout(r, 600));

    const stateAfterReset = await page.evaluate(() => {
        const g = window.Store.state.rateCalc.grid;
        return {
            partitions: g.panePartitions,
            paneWidths: g.paneWidths
        };
    });
    console.log('State after Canvas Reset:', stateAfterReset);
    const allZeroParts = stateAfterReset.partitions.every(p => p === 0);
    const equalWidths = stateAfterReset.paneWidths.every(w => Math.abs(w - (200 / 3)) < 1);
    if (!allZeroParts || !equalWidths) {
        throw new Error(`FAILED: Canvas Reset did not restore clean default! ${JSON.stringify(stateAfterReset)}`);
    }
    console.log('✓ Verified: Canvas Reset button cleanly resets all partitions and custom widths to default');

    await page.screenshot({ path: path.join(shotDir, 'canvas_reset_verified.png'), fullPage: false });
    console.log('Saved screenshot: screenshots/canvas_reset_verified.png');

    console.log('\n=== ALL USER AUDIO REQUIREMENTS FULLY VERIFIED SUCCESSFUL! ===');
    await browser.close();
    process.exit(0);
})().catch(err => {
    console.error('TEST ERROR:', err);
    process.exit(1);
});
