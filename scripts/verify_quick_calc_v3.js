const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1550, height: 1000 });
        
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Navigate to Calculation view
        console.log('Switching to Calculation module...');
        await page.evaluate(() => {
            window.Store.state.calcTab = 'manual';
            window.Store.navigate('calculation');
        });

        await new Promise(r => setTimeout(r, 600));

        // 1. Initial 1 Kalli screenshot (Default 50x140 cm, 5x3 profile)
        await page.screenshot({ path: 'scripts/calc_v3_1kalli_default.png' });
        console.log('Saved scripts/calc_v3_1kalli_default.png');

        // 2. Add 1 Partition & set position to CENTER (Matching Photo 1)
        console.log('Adding 1 Partition and setting position to CENTER...');
        await page.evaluate(() => {
            window.cyclePanePartition(0); // 0 -> 1 partition
            window.cyclePanePartitionPos(0); // top -> center
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: 'scripts/calc_v3_1kalli_partition_center.png' });
        console.log('Saved scripts/calc_v3_1kalli_partition_center.png');

        // 3. Switch Profile to 4x2.5 Profile (Rebated) (Matching Photo 2)
        console.log('Switching Profile to 4x2.5 Profile (Rebated)...');
        await page.evaluate(() => {
            window.updateGrid('mat_frame', 'prof_4x25');
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: 'scripts/calc_v3_1kalli_prof_4x25.png' });
        console.log('Saved scripts/calc_v3_1kalli_prof_4x25.png');

        // 4. Test 2 Kalli (100x140 cm) with both pane widths and total width
        console.log('Switching to 2 Kalli...');
        await page.evaluate(() => {
            window.loadPreset(2);
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: 'scripts/calc_v3_2kalli.png' });
        console.log('Saved scripts/calc_v3_2kalli.png');

        // 5. Test Search Bar with Dimension input "150x140"
        console.log('Testing search bar with "150x140"...');
        await page.evaluate(() => {
            window.handleCalcSearch('150x140');
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: 'scripts/calc_v3_search_150x140.png' });
        console.log('Saved scripts/calc_v3_search_150x140.png');

        // 6. Test Material Catalog Tab
        console.log('Testing Material Catalog Tab...');
        await page.evaluate(() => {
            window.calcSwitchTab('settings');
        });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: 'scripts/calc_v3_material_catalog.png' });
        console.log('Saved scripts/calc_v3_material_catalog.png');

        console.log('All verification screenshots captured successfully!');
    } catch (err) {
        console.error('Error in verification:', err);
    } finally {
        await browser.close();
    }
})();
