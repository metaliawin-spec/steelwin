const puppeteer = require('puppeteer');
const fs = require('fs');

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

        // 1. Verify Window Studio Sidebar Tabs
        const sidebarTabs = await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.calculation-sidebar .calc-nav-item'))
                .map(btn => btn.innerText.replace(/\n+/g, ' ').trim());
            const hasQuoteCalc = !!document.getElementById('tab-quote-calc');
            return { tabs, hasQuoteCalc };
        });
        console.log('Sidebar Tabs:', sidebarTabs);

        // 2. Verify Quick Calc Controls
        const quickCalcElements = await page.evaluate(() => {
            const modelTitle = document.querySelector('.quick-calc-container div[style*="0284c7"]')?.innerText;
            const unitSelect = document.getElementById('calc-unit-select')?.value;
            const unitOptions = Array.from(document.querySelectorAll('#calc-unit-select option')).map(o => o.value);
            
            // Material Labels
            const matLabels = Array.from(document.querySelectorAll('.quick-calc-container label')).map(l => l.innerText.trim());
            
            // Kalli Presets
            const kalliButtons = Array.from(document.querySelectorAll('.quick-calc-container button'))
                .filter(b => b.innerText.includes('Kalli'))
                .map(b => b.innerText.trim());
            
            // Search Bar
            const searchInput = document.getElementById('calc-search-bar');
            
            // 2D Canvas Elements
            const heightBadge = document.querySelector('div[style*="Height"]') || document.querySelector('div:has(> input[onchange*="totalH"])');
            const totalWBadge = document.querySelector('div:has(> input[onchange*="totalW"])');
            const estimatedPrice = document.querySelector('div[style*="ESTIMATED PRICE"]')?.parentElement?.innerText?.replace(/\n+/g, ' ');
            const partitionPills = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('PARTITION')).map(d => d.innerText.trim());

            return {
                modelTitle,
                unitSelect,
                unitOptions,
                matLabels,
                kalliButtons,
                hasSearchBar: !!searchInput,
                searchPlaceholder: searchInput?.placeholder,
                estimatedPrice,
                partitionPills
            };
        });
        console.log('Quick Calc Elements:', JSON.stringify(quickCalcElements, null, 2));

        // Take initial 1 Kalli screenshot
        await page.screenshot({ path: 'scripts/quick_calc_v2_1kalli.png' });
        console.log('Saved scripts/quick_calc_v2_1kalli.png');

        // 3. Test Partition Toggle & Position Toggle
        console.log('Testing partition cycle and position toggle...');
        await page.evaluate(() => {
            window.cyclePanePartition(0); // 0 -> 1 partition
        });
        await new Promise(r => setTimeout(r, 400));

        let partitionState1 = await page.evaluate(() => {
            const partitionPill = Array.from(document.querySelectorAll('div')).find(d => d.innerText.includes('PARTITION'))?.innerText?.trim();
            const posBtn = Array.from(document.querySelectorAll('button')).find(b => ['top', 'center', 'bottom'].includes(b.innerText.trim().toLowerCase()))?.innerText?.trim();
            return { partitionPill, posBtn };
        });
        console.log('After cycle to 1 partition:', partitionState1);

        // Click position toggle to change to center
        await page.evaluate(() => {
            window.cyclePanePartitionPos(0); // top -> center
        });
        await new Promise(r => setTimeout(r, 400));

        let partitionState2 = await page.evaluate(() => {
            const posBtn = Array.from(document.querySelectorAll('button')).find(b => ['top', 'center', 'bottom'].includes(b.innerText.trim().toLowerCase()))?.innerText?.trim();
            return { posBtn };
        });
        console.log('After cycle position:', partitionState2);

        await page.screenshot({ path: 'scripts/quick_calc_v2_partition_center.png' });
        console.log('Saved scripts/quick_calc_v2_partition_center.png');

        // 4. Test Search Bar with Dimension input "100x140"
        console.log('Testing search bar with "100x140"...');
        await page.evaluate(() => {
            window.handleCalcSearch('100x140');
        });
        await new Promise(r => setTimeout(r, 400));

        const searchResult = await page.evaluate(() => {
            const modelTitle = document.querySelector('.quick-calc-container div[style*="0284c7"]')?.innerText;
            const estimatedPrice = document.querySelector('div[style*="ESTIMATED PRICE"]')?.parentElement?.innerText?.replace(/\n+/g, ' ');
            return { modelTitle, estimatedPrice };
        });
        console.log('Search 100x140 result:', searchResult);

        // 5. Test Material Catalog Tab
        console.log('Testing Material Catalog Tab...');
        await page.evaluate(() => {
            window.calcSwitchTab('settings');
        });
        await new Promise(r => setTimeout(r, 600));

        const catalogState = await page.evaluate(() => {
            const groupButtons = Array.from(document.querySelectorAll('button'))
                .filter(b => ['all', 'profile', 'pipe', 'panel', 'hinges', 'paint', 'lock & accessories', 'hook & rubber', 'frame']
                .some(name => b.innerText.toLowerCase().includes(name)))
                .map(b => b.innerText.trim());
            return { groupButtons };
        });
        console.log('Material Catalog groups:', catalogState);

        await page.screenshot({ path: 'scripts/quick_calc_v2_catalog.png' });
        console.log('Saved scripts/quick_calc_v2_catalog.png');

    } catch (err) {
        console.error('Error in verification:', err);
    } finally {
        await browser.close();
    }
})();
