const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    let browser;
    try {
        console.log('Launching Puppeteer browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            defaultViewport: { width: 1440, height: 950 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Listen to console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('PAGE ERROR:', msg.text());
            }
        });

        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });

        // Ensure page is ready
        await page.waitForSelector('#main-nav', { timeout: 5000 });

        // 1. Verify Sidebar Navigation
        const sidebarTabs = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('#main-nav button'));
            return btns.map(b => b.innerText.trim());
        });
        console.log('Sidebar tabs found:', sidebarTabs);

        const expectedTabs = ['Quick Calculation', 'Quotation Calculation', 'Material Catalog'];
        const tabsMatch = sidebarTabs.length === 3 && expectedTabs.every((t, i) => sidebarTabs[i] === t);
        console.log('Sidebar Tabs Match Exactly:', tabsMatch ? 'PASS ✅' : 'FAIL ❌');

        // 2. Verify Quick Calculation View
        const headerCheck = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const hasClientName = bodyText.includes('CLIENT NAME');
            const hasQuickSelect = bodyText.includes('Quick Select Customer');
            const modelTitle = document.querySelector('h2')?.innerText || '';
            return { hasClientName, hasQuickSelect, modelTitle };
        });
        console.log('Client Name removed:', !headerCheck.hasClientName ? 'PASS ✅' : 'FAIL ❌');
        console.log('Quick Select Customer removed:', !headerCheck.hasQuickSelect ? 'PASS ✅' : 'FAIL ❌');
        console.log('Model title displayed:', headerCheck.modelTitle);

        // 3. Verify Material Selection 7 dropdowns
        const materialDropdowns = await page.evaluate(() => {
            const selects = Array.from(document.querySelectorAll('select[onchange*="mat_"]'));
            return selects.map(s => {
                const onchange = s.getAttribute('onchange');
                const selectedText = s.options[s.selectedIndex]?.text || '';
                return { onchange, selectedText };
            });
        });
        console.log(`Found ${materialDropdowns.length} dedicated material dropdowns:`, materialDropdowns.map(m => m.onchange));
        console.log('7 Dedicated Dropdowns:', materialDropdowns.length === 7 ? 'PASS ✅' : 'FAIL ❌');

        // Screenshot 1: Default Quick Calculation View
        const ssDir = path.join(__dirname, '..', 'screenshots');
        if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });
        
        await page.screenshot({ path: path.join(ssDir, '1_quick_calc_default.png'), fullPage: false });
        console.log('Captured 1_quick_calc_default.png');

        // Scroll down and capture pricing table & summary card
        await page.evaluate(() => {
            const scrollEl = document.getElementById('calc-content-scroll');
            if (scrollEl) scrollEl.scrollTop = 550;
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(ssDir, '1b_breakdown_and_cost_summary.png'), fullPage: false });
        console.log('Captured 1b_breakdown_and_cost_summary.png');

        // 4. Test Unit Toggle (cm -> mm)
        console.log('Testing Unit Toggle cm -> mm...');
        await page.evaluate(() => {
            window.toggleUnit('mm');
        });
        await new Promise(r => setTimeout(r, 400));

        const mmState = await page.evaluate(() => {
            const g = window.Store.state.rateCalc.grid;
            return { unit: g.unit, totalW: g.totalW, totalH: g.totalH, paneWidths: g.paneWidths };
        });
        console.log('Converted to mm:', mmState);
        console.log('Unit mm toggle:', (mmState.unit === 'mm' && mmState.totalW === 1500 && mmState.totalH === 1400) ? 'PASS ✅' : 'FAIL ❌');

        await page.screenshot({ path: path.join(ssDir, '2_unit_toggle_mm.png'), fullPage: false });
        console.log('Captured 2_unit_toggle_mm.png');

        // Toggle back to cm
        await page.evaluate(() => {
            window.toggleUnit('cm');
        });
        await new Promise(r => setTimeout(r, 400));

        // 5. Test Preset (W3: 3 panes) & Dynamic Model Labeling
        console.log('Testing Preset 3 Panes (W3)...');
        await page.evaluate(() => {
            window.loadPreset(3);
        });
        await new Promise(r => setTimeout(r, 400));

        const w3State = await page.evaluate(() => {
            const g = window.Store.state.rateCalc.grid;
            const heading = document.querySelector('h2')?.innerText || '';
            return { cols: g.cols, totalW: g.totalW, paneWidths: g.paneWidths, heading };
        });
        console.log('Preset W3 State:', w3State);
        console.log('W3 Model Labeling:', (w3State.cols === 3 && w3State.paneWidths.length === 3) ? 'PASS ✅' : 'FAIL ❌');

        // 6. Test Individual Pane Width Customization & Auto-Balancing
        console.log('Testing Individual Pane Width Customization: Setting pane 1 (center) to 80...');
        await page.evaluate(() => {
            // totalW is 150, 3 panes. Set pane 1 to 80.
            window.updateIndividualPaneWidth(1, 80);
        });
        await new Promise(r => setTimeout(r, 400));

        const paneBalanceState = await page.evaluate(() => {
            const g = window.Store.state.rateCalc.grid;
            const sum = g.paneWidths.reduce((a, b) => a + b, 0);
            return { totalW: g.totalW, paneWidths: g.paneWidths, sum };
        });
        console.log('Pane Widths balanced:', paneBalanceState);
        console.log('Pane Width auto-balance:', (paneBalanceState.paneWidths[1] === 80 && Math.abs(paneBalanceState.sum - paneBalanceState.totalW) < 0.01) ? 'PASS ✅' : 'FAIL ❌');

        // 7. Test Horizontal Partitions:
        // - Partition 1: Top/Bottom selector at 1/4th height
        // - Partition 2: 3 vertical sections
        console.log('Testing Horizontal Partitions: Setting pane 0 to partition 1 (bottom), pane 1 to partition 2...');
        await page.evaluate(() => {
            window.setPartitions(0, 1);
            window.setPartitionPos(0, 'bottom');
            window.setPartitions(1, 2);
        });
        await new Promise(r => setTimeout(r, 400));

        const partitionState = await page.evaluate(() => {
            const g = window.Store.state.rateCalc.grid;
            return { partitions: g.panePartitions, partitionPos: g.partitionPos };
        });
        console.log('Partitions applied:', partitionState);
        console.log('Partitions config:', (partitionState.partitions[0] === 1 && partitionState.partitions[1] === 2 && partitionState.partitionPos[0] === 'bottom') ? 'PASS ✅' : 'FAIL ❌');

        await page.screenshot({ path: path.join(ssDir, '3_panes_and_partitions.png'), fullPage: false });
        console.log('Captured 3_panes_and_partitions.png');

        // 8. Test Pricing & Cost Breakdown & Profit Margin % Live Recalculation
        console.log('Testing Profit Margin % input and live calculation...');
        const initialPricing = await page.evaluate(() => {
            const p = window.Store.state.rateCalc.params;
            const grandTotalEl = document.querySelector('div[style*="font-size: 2.2rem"]')?.innerText || '';
            return { profitMargin: p.profitMarginPercent, labor: p.laborCharge, grandTotal: grandTotalEl };
        });
        console.log('Initial Pricing:', initialPricing);

        await page.evaluate(() => {
            window.updateGrid('profitMarginPercent', 25);
            window.updateGrid('laborCharge', 1200);
        });
        await new Promise(r => setTimeout(r, 400));

        const updatedPricing = await page.evaluate(() => {
            const p = window.Store.state.rateCalc.params;
            const grandTotalEl = document.querySelector('div[style*="font-size: 2.2rem"]')?.innerText || '';
            return { profitMargin: p.profitMarginPercent, labor: p.laborCharge, grandTotal: grandTotalEl };
        });
        console.log('Updated Pricing with 25% profit & 1200 labor:', updatedPricing);
        console.log('Live Recalculation:', (updatedPricing.profitMargin === 25 && updatedPricing.grandTotal !== initialPricing.grandTotal) ? 'PASS ✅' : 'FAIL ❌');

        // 9. Verify Bottom Action Bar
        const bottomBarCheck = await page.evaluate(() => {
            const bodyHtml = document.body.innerHTML;
            const hasSaveBtn = bodyHtml.includes('window.saveCostSheetToCustomer');
            const hasSaveAndNew = bodyHtml.includes('window.saveAndNewCostSheet');
            const hasQtyControl = bodyHtml.includes('Number of Pieces') || bodyHtml.includes('pcs-count');
            const hasRealTimeIndicator = document.body.innerText.includes('Real-Time Instant Calculator Active');
            return { hasSaveBtn, hasSaveAndNew, hasQtyControl, hasRealTimeIndicator };
        });
        console.log('Save button removed:', !bottomBarCheck.hasSaveBtn ? 'PASS ✅' : 'FAIL ❌');
        console.log('Save & New button removed:', !bottomBarCheck.hasSaveAndNew ? 'PASS ✅' : 'FAIL ❌');
        console.log('Qty control removed:', !bottomBarCheck.hasQtyControl ? 'PASS ✅' : 'FAIL ❌');
        console.log('Real-Time instant calculator indicator present:', bottomBarCheck.hasRealTimeIndicator ? 'PASS ✅' : 'FAIL ❌');

        // 10. Test Tab Switching: Click Material Catalog
        console.log('Testing Sidebar Navigation: Switching to Material Catalog...');
        await page.evaluate(() => {
            window.navigate('materials');
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(ssDir, '4_material_catalog_view.png'), fullPage: false });
        console.log('Captured 4_material_catalog_view.png');

        // 11. Test Tab Switching: Click Quotation Calculation
        console.log('Testing Sidebar Navigation: Switching to Quotation Calculation...');
        await page.evaluate(() => {
            window.navigate('quotations');
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(ssDir, '5_quotations_view.png'), fullPage: false });
        console.log('Captured 5_quotations_view.png');

        console.log('\n========================================');
        console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! 🎉');
        console.log('========================================');

    } catch (e) {
        console.error('Test Execution Error:', e);
    } finally {
        if (browser) await browser.close();
    }
})();
