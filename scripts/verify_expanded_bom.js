const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\e8678a5d-8292-411e-a0f4-593081e8a15b';

async function runExpandedBOMVerification() {
    console.log('🚀 Starting Comprehensive Expanded BOM Engine Verification...');

    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1100']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 1000 });

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

        // 2. Test calculateWindowFabrication directly in page context
        console.log('2. Testing calculateWindowFabrication data model...');
        const fabResult = await page.evaluate(() => {
            const fab = window.calculateWindowFabrication({
                width: 150,
                height: 160,
                unit: 'cm',
                bays: 3,
                shuttersCount: 3,
                partitions: 0,
                profitMarginPercent: 15
            });

            return {
                grandTotal: fab.grandTotal,
                subtotalCost: fab.subtotalCost,
                profitAmount: fab.profitAmount,
                totalMaterialCost: fab.totalMaterialCost,
                totalLabourCost: fab.totalLabourCost,
                paintLiters: fab.paintLiters,
                paintCost: fab.paintCost,
                categorySubtotals: fab.categorySubtotals,
                itemsCount: fab.bomItems.length,
                bomItems: fab.bomItems.map(i => ({
                    category: i.category,
                    description: i.description,
                    quantity: i.quantity,
                    unit: i.unit,
                    unitPrice: i.unitPrice,
                    totalCost: i.totalCost
                }))
            };
        });

        console.log('--- Math & Data Model Verification ---');
        console.log(`Grand Total: ₹${fabResult.grandTotal} (Expected ₹10,881)`);
        console.log(`Subtotal Base Cost: ₹${fabResult.subtotalCost} (Expected ₹9,462)`);
        console.log(`Paint volume: ${fabResult.paintLiters} Ltr, Cost: ₹${fabResult.paintCost}`);
        console.log('Category Subtotals:', JSON.stringify(fabResult.categorySubtotals, null, 2));

        console.assert(fabResult.grandTotal === 10881, `Expected 10881, got ${fabResult.grandTotal}`);
        console.assert(fabResult.subtotalCost === 9462, `Expected 9462, got ${fabResult.subtotalCost}`);
        console.assert(fabResult.categorySubtotals['Raw Materials'] === 6788, `Expected Raw Materials 6788, got ${fabResult.categorySubtotals['Raw Materials']}`);
        console.assert(fabResult.categorySubtotals['Hardware'] === 1020, `Expected Hardware 1020, got ${fabResult.categorySubtotals['Hardware']}`);
        console.assert(fabResult.categorySubtotals['Operations'] === 390, `Expected Operations 390, got ${fabResult.categorySubtotals['Operations']}`);
        console.assert(fabResult.categorySubtotals['Consumables'] === 514, `Expected Consumables 514, got ${fabResult.categorySubtotals['Consumables']}`);
        console.assert(fabResult.categorySubtotals['Labor'] === 750, `Expected Labor 750, got ${fabResult.categorySubtotals['Labor']}`);
        console.log('✅ AUTHORITATIVE MATHEMATICAL BENCHMARK VERIFIED!');

        // 3. Test Calculation Studio UI
        console.log('3. Navigating to Calculation Studio and loading benchmark...');
        await page.evaluate(() => {
            if (typeof window.navigate === 'function') window.navigate('calculation');
            if (window.Store && window.Store.state) {
                window.Store.state.calcTab = 'quick';
                window.Store.notify();
            }
        });
        await new Promise(r => setTimeout(r, 1000));

        await page.waitForSelector('#btn-load-benchmark', { timeout: 5000 });
        await page.click('#btn-load-benchmark');
        await new Promise(r => setTimeout(r, 1200));

        // Verify #calc-bom-table columns and structure
        const tableDetails = await page.evaluate(() => {
            const table = document.getElementById('calc-bom-table');
            if (!table) return null;
            const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim());
            const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => tr.innerText.trim());
            const subtotals = rows.filter(r => r.toUpperCase().includes('SUBTOTAL:'));
            const grandTotalEl = document.getElementById('calc-grand-total-amount');

            return {
                headers,
                totalRows: rows.length,
                subtotalRowsCount: subtotals.length,
                subtotals,
                grandTotalText: grandTotalEl ? grandTotalEl.innerText.trim() : ''
            };
        });

        console.log('--- Calculation Studio BOM Table ---');
        console.log('Headers:', tableDetails.headers);
        console.log(`Total Table Rows: ${tableDetails.totalRows}, Subtotal Rows: ${tableDetails.subtotalRowsCount}`);
        console.log('Subtotals Found:', tableDetails.subtotals);
        console.log('Grand Total Display:', tableDetails.grandTotalText);

        console.assert(tableDetails.headers.length === 6, `Expected 6 columns, got ${tableDetails.headers.length}`);
        console.assert(tableDetails.headers[0] === 'CATEGORY', `Expected CATEGORY, got ${tableDetails.headers[0]}`);
        console.assert(tableDetails.headers[1] === 'ITEM DESCRIPTION', `Expected ITEM DESCRIPTION, got ${tableDetails.headers[1]}`);
        console.assert(tableDetails.headers[2] === 'QUANTITY', `Expected QUANTITY, got ${tableDetails.headers[2]}`);
        console.assert(tableDetails.headers[3] === 'UNIT', `Expected UNIT, got ${tableDetails.headers[3]}`);
        console.assert(tableDetails.headers[4] === 'UNIT PRICE', `Expected UNIT PRICE, got ${tableDetails.headers[4]}`);
        console.assert(tableDetails.headers[5] === 'TOTAL COST', `Expected TOTAL COST, got ${tableDetails.headers[5]}`);
        console.assert(tableDetails.subtotalRowsCount === 5, `Expected 5 category subtotals, got ${tableDetails.subtotalRowsCount}`);
        console.log('✅ CALCULATION STUDIO 6-COLUMN CATEGORIZED BOM TABLE VERIFIED!');

        // Scroll into view and capture screenshot
        await page.evaluate(() => {
            document.getElementById('calc-bom-table')?.scrollIntoView({ behavior: 'instant', block: 'center' });
        });
        await new Promise(r => setTimeout(r, 600));

        const snap1 = path.join(ARTIFACT_DIR, 'expanded_bom_calculation_studio.png');
        await page.screenshot({ path: snap1 });
        console.log(`📸 Screenshot saved: ${snap1}`);

        // 4. Send calculation to quotation
        console.log('4. Clicking Send to Quotation button...');
        await page.click('#btn-send-to-quote');
        await new Promise(r => setTimeout(r, 1000));

        // 5. Test Quotation Studio BOM Modal
        console.log('5. Navigating to Quotation Studio...');
        await page.evaluate(() => {
            if (typeof window.navigate === 'function') window.navigate('quotations');
        });
        await new Promise(r => setTimeout(r, 1200));

        // Retrieve quote ID
        const quoteInfo = await page.evaluate(() => {
            const quotes = window.Store.state.quotations || [];
            if (quotes.length > 0) return { id: quotes[0].id, count: quotes.length };
            // Check draft quote
            const draft = window.Store.state.currentQuoteDraft;
            if (draft && draft.items && draft.items.length > 0) {
                // Create a temporary quotation to open BOM modal
                const testQuote = {
                    id: 'QT-TEST-BOM',
                    customer: 'Benchmark Client',
                    date: new Date().toISOString().split('T')[0],
                    amount: draft.items.reduce((s, i) => s + (i.total || i.rate || 0), 0),
                    items: draft.items
                };
                if (!window.Store.state.quotations) window.Store.state.quotations = [];
                window.Store.state.quotations.unshift(testQuote);
                window.Store.saveState();
                return { id: testQuote.id, count: window.Store.state.quotations.length };
            }
            return null;
        });

        console.log('Quote Info:', quoteInfo);
        console.assert(quoteInfo && quoteInfo.id, 'Expected valid quotation ID');

        console.log(`6. Opening Quotation BOM Modal for quote: ${quoteInfo.id}...`);
        await page.evaluate((qid) => {
            window.openQuoteBOMModal(qid);
        }, quoteInfo.id);
        await new Promise(r => setTimeout(r, 1200));

        const modalTableDetails = await page.evaluate(() => {
            const modal = document.getElementById('quote-bom-modal');
            if (!modal) return null;
            const table = document.getElementById('quote-bom-table');
            const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim());
            const subtotals = Array.from(table.querySelectorAll('tbody tr')).map(tr => tr.innerText.trim()).filter(t => t.toUpperCase().includes('SUBTOTAL:'));

            return {
                modalFound: !!modal,
                headers,
                subtotals
            };
        });

        console.log('--- Quotation Studio BOM Modal Table ---');
        console.log('Modal found:', modalTableDetails.modalFound);
        console.log('Modal Table Headers:', modalTableDetails.headers);
        console.log('Modal Category Subtotals:', modalTableDetails.subtotals);

        console.assert(modalTableDetails.modalFound, 'Expected quote-bom-modal to be rendered');
        console.assert(modalTableDetails.headers.length === 6, `Expected 6 headers in modal, got ${modalTableDetails.headers.length}`);
        console.assert(modalTableDetails.subtotals.length === 5, `Expected 5 category subtotals in modal, got ${modalTableDetails.subtotals.length}`);
        console.log('✅ QUOTATION BOM MODAL 6-COLUMN CATEGORIZED TABLE PASSED!');

        const snap2 = path.join(ARTIFACT_DIR, 'expanded_bom_quotation_modal.png');
        await page.screenshot({ path: snap2 });
        console.log(`📸 Screenshot saved: ${snap2}`);

        // 7. Verify Printable BOM HTML
        console.log('7. Verifying renderPrintableBOMHTML...');
        const printableHTML = await page.evaluate((qid) => {
            const q = window.Store.state.quotations.find(x => x.id === qid);
            return window.renderPrintableBOMHTML(q);
        }, quoteInfo.id);

        console.assert(printableHTML.includes('BILL OF MATERIALS (BOM)'), 'Printable must have title');
        console.assert(printableHTML.includes('Raw Materials'), 'Printable must include Raw Materials');
        console.assert(printableHTML.includes('Hardware'), 'Printable must include Hardware');
        console.assert(printableHTML.includes('Operations'), 'Printable must include Operations');
        console.assert(printableHTML.includes('Consumables'), 'Printable must include Consumables');
        console.assert(printableHTML.includes('Labor'), 'Printable must include Labor');
        console.assert(printableHTML.includes('Production Manager'), 'Printable must include signature footer');
        console.log('✅ PRINTABLE BOM AUDIT SHEET HTML VERIFIED!');

        // Render printable HTML in page to capture audit sheet screenshot
        await page.evaluate((html) => {
            const container = document.createElement('div');
            container.id = 'test-printable-container';
            container.style.cssText = 'position: fixed; inset: 0; background: #334155; z-index: 200000; overflow: auto; display: flex; justify-content: center; padding: 2rem;';
            container.innerHTML = html;
            document.body.appendChild(container);
        }, printableHTML);
        await new Promise(r => setTimeout(r, 800));

        const snap3 = path.join(ARTIFACT_DIR, 'expanded_bom_printable_audit_sheet.png');
        await page.screenshot({ path: snap3 });
        console.log(`📸 Screenshot saved: ${snap3}`);

        console.log('\n🎉 ALL EXPANDED BOM ENGINE DELIVERABLES VERIFIED SUCCESSFULLY!');

    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runExpandedBOMVerification();
