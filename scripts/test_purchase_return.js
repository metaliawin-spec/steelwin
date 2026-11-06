const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Launching browser to verify Purchase Return module & sidebar...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        await page.goto('http://127.0.0.1:3000/index.html', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 1000));

        // Dismiss overdue modal and prevent auto-popup
        await page.evaluate(() => {
            window.checkOverdueReceivables = () => {};
            const overdue = document.getElementById('overdue-invoices-alert-modal');
            if (overdue) overdue.remove();
        });

        // 1. Check sidebar nav items
        const navList = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('#nav-container button, .nav-item'));
            return buttons.map(b => b.innerText.trim().replace(/\n.*/s, ''));
        });
        console.log('Detected Sidebar Nav Items:', navList);

        const salesIdx = navList.findIndex(t => t.includes('Sales') && !t.includes('Return'));
        const salesReturnIdx = navList.findIndex(t => t.includes('Sales Return'));
        const purchaseIdx = navList.findIndex(t => t.includes('Purchase') && !t.includes('Return'));
        const purchaseReturnIdx = navList.findIndex(t => t.includes('Purchase Return'));
        const paymentsIdx = navList.findIndex(t => t.includes('Payments'));

        console.log(`Indices: Sales=${salesIdx}, Sales Return=${salesReturnIdx}, Purchase=${purchaseIdx}, Purchase Return=${purchaseReturnIdx}, Payments=${paymentsIdx}`);

        if (purchaseReturnIdx === purchaseIdx + 1 && paymentsIdx === purchaseReturnIdx + 1) {
            console.log('SUCCESS: Purchase Return is directly beneath Purchase and above Payments!');
        } else {
            console.error('FAILURE: Sidebar ordering is incorrect!');
        }

        const artifactDir = path.join('C:', 'Users', 'anshi', '.gemini', 'antigravity-ide', 'brain', '34602a91-8f8b-42eb-ab29-bcbc8589f961');

        // 2. Navigate to 'purchase' and verify primary PO grid
        await page.evaluate(() => {
            document.getElementById('overdue-invoices-alert-modal')?.remove();
            window.navigate('purchase');
        });
        await new Promise(r => setTimeout(r, 600));
        await page.evaluate(() => document.getElementById('overdue-invoices-alert-modal')?.remove());

        const purchaseHeader = await page.evaluate(() => {
            const h1 = document.querySelector('h1');
            const tabs = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('All Purchase Orders'));
            return { title: h1 ? h1.innerText : '', hasTabs: tabs.length > 0 };
        });
        console.log('Purchase View Inspection:', purchaseHeader);

        const screenshot1 = path.join(artifactDir, 'purchase_view.png');
        await page.screenshot({ path: screenshot1, fullPage: false });
        console.log('Saved screenshot 1:', screenshot1);

        // 3. Navigate to 'purchase_return' and verify standalone dashboard
        await page.evaluate(() => {
            document.getElementById('overdue-invoices-alert-modal')?.remove();
            window.navigate('purchase_return');
        });
        await new Promise(r => setTimeout(r, 600));
        await page.evaluate(() => document.getElementById('overdue-invoices-alert-modal')?.remove());

        const prData = await page.evaluate(() => {
            const h1 = document.querySelector('h1');
            const kpis = Array.from(document.querySelectorAll('.glass-panel')).map(p => p.innerText.slice(0, 40));
            const rows = document.querySelectorAll('.purchase-return-view table tbody tr').length;
            return { title: h1 ? h1.innerText : '', kpiCount: kpis.length, rowCount: rows };
        });
        console.log('Purchase Return View Inspection:', prData);

        const screenshot2 = path.join(artifactDir, 'purchase_return_dashboard.png');
        await page.screenshot({ path: screenshot2, fullPage: false });
        console.log('Saved screenshot 2:', screenshot2);

        // 3b. Navigate to 'sales_return' and verify header
        await page.evaluate(() => {
            document.getElementById('overdue-invoices-alert-modal')?.remove();
            window.navigate('sales_return');
        });
        await new Promise(r => setTimeout(r, 600));
        await page.evaluate(() => document.getElementById('overdue-invoices-alert-modal')?.remove());

        const screenshotSalesReturn = path.join(artifactDir, 'sales_return_dashboard.png');
        await page.screenshot({ path: screenshotSalesReturn, fullPage: false });
        console.log('Saved screenshot Sales Return:', screenshotSalesReturn);

        // 4. Open New Purchase Return Modal
        await page.evaluate(() => window.openNewPurchaseReturnModal());
        await new Promise(r => setTimeout(r, 500));

        const modalOpen = await page.evaluate(() => {
            const m = document.getElementById('new-purchase-return-modal') || document.getElementById('new-pr-modal');
            return !!m;
        });
        console.log('Purchase Return Modal Opened:', modalOpen);

        const screenshot3 = path.join(artifactDir, 'purchase_return_modal.png');
        await page.screenshot({ path: screenshot3, fullPage: false });
        console.log('Saved screenshot 3:', screenshot3);

        // Close modal
        await page.evaluate(() => {
            document.getElementById('new-purchase-return-modal')?.remove();
            document.getElementById('new-pr-modal')?.remove();
        });

        // Auto-dismiss dialogs
        page.on('dialog', async dialog => {
            console.log('Dialog popped:', dialog.message());
            await dialog.dismiss();
        });

        // 5. Test Debit Note Print Voucher modal
        await page.evaluate(() => {
            const list = (window.Store && window.Store.state.purchaseReturns) || [];
            const returnId = list.length > 0 ? list[0].id : 'PR-101';
            if (typeof window.openPrintDebitNoteModal === 'function') {
                window.openPrintDebitNoteModal(returnId);
            }
        });
        await new Promise(r => setTimeout(r, 600));

        const printModalOpen = await page.evaluate(() => {
            const pm = document.getElementById('print-debit-note-modal');
            return !!pm;
        });
        console.log('Debit Note Print Modal Opened:', printModalOpen);

        const screenshot4 = path.join(artifactDir, 'purchase_return_print_voucher.png');
        await page.screenshot({ path: screenshot4, fullPage: false });
        console.log('Saved screenshot 4:', screenshot4);

    } catch (err) {
        console.error('Verification error:', err);
    } finally {
        await browser.close();
        console.log('Browser test completed.');
    }
})();
