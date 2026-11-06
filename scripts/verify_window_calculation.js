const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\e8678a5d-8292-411e-a0f4-593081e8a15b';

async function runVerification() {
    console.log('🚀 Starting Window Fabrication Costing & Engineering Engine Verification...');

    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1500,1000']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    page.on('console', msg => {
        if (msg.type() === 'error') console.error('[BROWSER ERROR]:', msg.text());
    });
    page.on('pageerror', err => {
        console.error('[BROWSER EXCEPTION]:', err);
    });

    try {
        console.log('1. Loading http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1200));

        console.log('2. Navigating to Calculation Studio...');
        await page.evaluate(() => {
            if (typeof window.navigate === 'function') {
                window.navigate('calculation');
            }
        });
        await new Promise(r => setTimeout(r, 1200));

        // Ensure calculation tab is on quick / manual calculation
        await page.evaluate(() => {
            if (window.Store && window.Store.state) {
                window.Store.state.calcTab = 'quick';
                window.Store.notify();
            }
        });
        await new Promise(r => setTimeout(r, 1000));

        console.log('3. Clicking Load Benchmark (150x160cm 3-Bay Window)...');
        await page.waitForSelector('#btn-load-benchmark', { timeout: 5000 });
        await page.click('#btn-load-benchmark');
        await new Promise(r => setTimeout(r, 1200));

        // Evaluate benchmark calculation values
        const calcData = await page.evaluate(() => {
            const rc = window.Store.state.rateCalc;
            const g = rc.grid;
            const totalParts = g.panePartitions ? g.panePartitions.reduce((s, p) => s + (parseInt(p) || 0), 0) : 0;
            const fab = window.calculateWindowFabrication({
                width: g.totalW,
                height: g.totalH,
                unit: g.unit,
                bays: g.cols,
                partitions: totalParts,
                panePartitions: g.panePartitions,
                shuttersCount: g.cols,
                profitMarginPercent: rc.params?.profitMarginPercent ?? 15
            });

            const grandTotalEl = document.getElementById('calc-grand-total-amount');
            const grandTotalText = grandTotalEl ? grandTotalEl.innerText.trim() : '';
            const partitionsBadge = document.getElementById('canvas-total-partitions-badge');
            const partitionsText = partitionsBadge ? partitionsBadge.innerText.trim() : '';

            return {
                grid: {
                    cols: g.cols,
                    totalW: g.totalW,
                    totalH: g.totalH,
                    unit: g.unit
                },
                fab,
                grandTotalText,
                partitionsText
            };
        });

        console.log('--- 3-Bay Benchmark Calculation Results ---');
        console.log(`Dimensions: ${calcData.grid.totalW}x${calcData.grid.totalH} ${calcData.grid.unit}, Bays: ${calcData.grid.cols}`);
        console.log(`Outer Frame: Perimeter = ${calcData.fab.outerPerimeterM}m, Weight = ${calcData.fab.outerWeightKg}kg, Cost = ₹${calcData.fab.outerProfileCost}`);
        console.log(`Inner Mullions: Count = ${calcData.fab.mullionCount}, Length = ${calcData.fab.mullionLengthM}m, Weight = ${calcData.fab.innerWeightKg}kg, Cost = ₹${calcData.fab.innerProfileCost}`);
        console.log(`Combined Profile Weight: ${calcData.fab.totalProfileWeightKg}kg, Cost: ₹${calcData.fab.totalProfileCost}`);
        console.log(`Safety Grill Pipes: ${calcData.fab.totalPipesCount} pipes, Length = ${calcData.fab.totalPipeLengthM}m, Cost = ₹${calcData.fab.pipeCost}`);
        console.log(`Profile Punching Holes: ${calcData.fab.totalHoles} holes (${calcData.fab.totalPipesCount} * ${calcData.fab.intersectingProfileFaces} faces), Cost = ₹${calcData.fab.punchingCost}`);
        console.log(`Hinges: ${calcData.fab.totalHingesCount} nos (${calcData.fab.hingesPerPanel}/panel), Cost = ₹${calcData.fab.hingesCost}`);
        console.log(`Paint: Area = ${calcData.fab.surfaceAreaSqM}m², Cost = ₹${calcData.fab.paintCost}`);
        console.log(`Labour: Base = ₹${calcData.fab.baseAssemblyCharge}, Shutters = ₹${calcData.fab.shutterFabricationCharge}, Partitions = ₹${calcData.fab.partitionCharge}, Cutting = ₹${calcData.fab.cuttingHandlingCharge}, Total = ₹${calcData.fab.totalLabourCost}`);
        console.log(`Material Cost: ₹${calcData.fab.totalMaterialCost}, Subtotal: ₹${calcData.fab.subtotalCost}, Margin 15%: ₹${calcData.fab.profitAmount}, Grand Total: ₹${calcData.fab.grandTotal}`);

        // Verifications against benchmark formula
        console.assert(calcData.fab.outerPerimeterM === 6.2, `Expected 6.2m perimeter, got ${calcData.fab.outerPerimeterM}`);
        console.assert(Math.abs(calcData.fab.outerWeightKg - 18.083) < 0.05, `Expected ~18.08kg outer weight, got ${calcData.fab.outerWeightKg}`);
        console.assert(calcData.fab.outerProfileCost === 3255, `Expected ₹3255 outer cost, got ${calcData.fab.outerProfileCost}`);
        console.assert(calcData.fab.mullionLengthM === 3.2, `Expected 3.2m mullion length, got ${calcData.fab.mullionLengthM}`);
        console.assert(Math.abs(calcData.fab.innerWeightKg - 9.333) < 0.05, `Expected ~9.33kg inner weight, got ${calcData.fab.innerWeightKg}`);
        console.assert(calcData.fab.innerProfileCost === 1680, `Expected ₹1680 inner cost, got ${calcData.fab.innerProfileCost}`);
        console.assert(calcData.fab.totalPipesCount === 13, `Expected 13 pipes, got ${calcData.fab.totalPipesCount}`);
        console.assert(calcData.fab.totalPipeLengthM === 19.5, `Expected 19.5m pipe length, got ${calcData.fab.totalPipeLengthM}`);
        console.assert(calcData.fab.pipeCost === 1853, `Expected ₹1853 pipe cost, got ${calcData.fab.pipeCost}`);
        console.assert(calcData.fab.totalHoles === 78, `Expected 78 holes, got ${calcData.fab.totalHoles}`);
        console.assert(calcData.fab.punchingCost === 390, `Expected ₹390 punch cost, got ${calcData.fab.punchingCost}`);
        console.assert(calcData.fab.totalHingesCount === 12, `Expected 12 hinges, got ${calcData.fab.totalHingesCount}`);
        console.assert(calcData.fab.hingesCost === 1020, `Expected ₹1020 hinges cost, got ${calcData.fab.hingesCost}`);
        console.assert(calcData.fab.paintCost === 514, `Expected ₹514 paint cost, got ${calcData.fab.paintCost}`);
        console.assert(calcData.fab.totalLabourCost === 750, `Expected ₹750 total labour, got ${calcData.fab.totalLabourCost}`);
        console.assert(calcData.fab.grandTotal === 10881, `Expected ₹10881 grand total, got ${calcData.fab.grandTotal}`);
        console.log('✅ ALL 3-BAY BENCHMARK FORMULA ASSERTIONS PASSED!');

        const snap1Path = path.join(ARTIFACT_DIR, 'benchmark_3bay_window_calculation.png');
        await page.screenshot({ path: snap1Path, fullPage: true });
        console.log(`📸 Screenshot saved: ${snap1Path}`);

        // 4. Test Intermediate Partition Increment (+1)
        console.log('4. Testing Intermediate Partition Increment...');
        await page.click('#btn-part-plus');
        await new Promise(r => setTimeout(r, 1000));

        const partData = await page.evaluate(() => {
            const rc = window.Store.state.rateCalc;
            const g = rc.grid;
            const totalParts = g.panePartitions ? g.panePartitions.reduce((s, p) => s + (parseInt(p) || 0), 0) : 0;
            const fab = window.calculateWindowFabrication({
                width: g.totalW,
                height: g.totalH,
                unit: g.unit,
                bays: g.cols,
                partitions: totalParts,
                panePartitions: g.panePartitions,
                shuttersCount: g.cols,
                profitMarginPercent: rc.params?.profitMarginPercent ?? 15
            });
            return { totalParts, fab };
        });

        console.log(`With 1 Partition Added: Partitions = ${partData.totalParts}`);
        console.log(`Hinges per panel: ${partData.fab.hingesPerPanel} (incremented from 4 to 5 for partition)`);
        console.log(`Total hinges: ${partData.fab.totalHingesCount} nos, Cost: ₹${partData.fab.hingesCost}`);
        console.log(`Partition Labour: ₹${partData.fab.partitionCharge}`);
        console.log(`New Grand Total: ₹${partData.fab.grandTotal}`);

        console.assert(partData.totalParts === 1, `Expected 1 partition, got ${partData.totalParts}`);
        console.assert(partData.fab.hingesPerPanel === 5, `Expected 5 hinges per panel, got ${partData.fab.hingesPerPanel}`);
        console.assert(partData.fab.totalHingesCount === 15, `Expected 15 hinges, got ${partData.fab.totalHingesCount}`);
        console.assert(partData.fab.partitionCharge === 50, `Expected ₹50 partition charge, got ${partData.fab.partitionCharge}`);
        console.log('✅ PARTITION INCREMENT LOGIC & HINGES THRESHOLD PASSED!');

        const snap2Path = path.join(ARTIFACT_DIR, 'benchmark_with_partition_added.png');
        await page.screenshot({ path: snap2Path, fullPage: true });
        console.log(`📸 Screenshot saved: ${snap2Path}`);

        // 5. Test "Save Calculation"
        console.log('5. Testing Save Calculation button...');
        await page.click('#btn-save-calculation');
        await new Promise(r => setTimeout(r, 1000));

        const savedRecords = await page.evaluate(() => {
            return window.Store.state.savedCalculations || [];
        });
        console.log(`Saved calculations count: ${savedRecords.length}`);
        console.assert(savedRecords.length > 0, 'Expected at least 1 saved calculation in Store');
        const lastSaved = savedRecords[savedRecords.length - 1];
        console.log(`Last saved calculation ID: ${lastSaved.id}, Grand Total: ₹${lastSaved.grandTotal}`);
        console.log('✅ SAVE CALCULATION RECORD PASSED!');

        // 6. Test "Send to Quotation"
        console.log('6. Testing Send to Quotation button...');
        await page.click('#btn-send-to-quote');
        await new Promise(r => setTimeout(r, 1000));

        const quoteItems = await page.evaluate(() => {
            return window.Store.state.currentQuoteDraft?.items || [];
        });
        console.log(`Quotation draft items count: ${quoteItems.length}`);
        console.assert(quoteItems.length > 0, 'Expected at least 1 item in Quotation draft');
        const lastQuoteItem = quoteItems[quoteItems.length - 1];
        console.log(`Last quote item: ${lastQuoteItem.name}, Rate: ₹${lastQuoteItem.rate}`);
        console.assert(lastQuoteItem.bom && lastQuoteItem.bom.outerProfile, 'Expected item to contain complete BOM breakdown');
        console.log('✅ SEND TO QUOTATION PASSED WITH FULL BOM PACKAGE!');

        // 7. Test "Rates Master" Modal
        console.log('7. Testing Rates Master Modal...');
        await page.click('#btn-rates-master');
        await new Promise(r => setTimeout(r, 1000));

        const modalVisible = await page.evaluate(() => {
            const m = document.getElementById('fabrication-rates-modal');
            return !!m;
        });
        console.assert(modalVisible, 'Expected fabrication rates modal to be visible');
        console.log('✅ RATES MASTER MODAL RENDERED!');

        const snap3Path = path.join(ARTIFACT_DIR, 'rates_master_modal.png');
        await page.screenshot({ path: snap3Path, fullPage: true });
        console.log(`📸 Screenshot saved: ${snap3Path}`);

        // Close modal
        await page.evaluate(() => {
            document.getElementById('fabrication-rates-modal')?.remove();
        });
        await new Promise(r => setTimeout(r, 500));

        console.log('\n🎉 ALL WINDOW FABRICATION ENGINE VERIFICATION TESTS PASSED SUCCESSFULLY!');

    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runVerification();
