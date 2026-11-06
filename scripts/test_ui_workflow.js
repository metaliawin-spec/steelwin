const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('--- STARTING ERP UI & ADVANCE WORKFLOW TEST ---');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    // 1. Load ERP app
    await page.goto('http://localhost:3000/#sales', { waitUntil: 'networkidle0' });
    console.log('Loaded #sales view');

    // 2. Click "+ Create Invoice"
    await page.waitForSelector('button', { visible: true });
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const createBtn = btns.find(b => b.textContent.includes('Create Invoice') || b.textContent.includes('+ Create Invoice'));
        if (createBtn) createBtn.click();
        else window.initCreateInvoice();
    });

    await page.waitForFunction(() => document.getElementById('invoice-form-wrapper') !== null);
    console.log('Invoice form rendered');

    // 3. Select Customer Arun Kumar (has ₹15,000 advance pool)
    const selectCustomerResult = await page.evaluate(() => {
        window.selectInvCustomer('Arun Kumar');
        return {
            customer: window.invoiceState.customer.name,
            pool: window.invoiceState.summary.availableAdvancePool,
            grandTotal: window.invoiceState.summary.grandTotal
        };
    });
    console.log('Selected customer:', selectCustomerResult);

    // 4. Verify Advance Pool widget and presets
    await page.waitForFunction(() => {
        const el = document.getElementById('summary-available-pool-badge');
        return el && el.innerText.includes('15,000');
    });
    console.log('Advance pool widget detected customer advance: ₹15,000');

    // 5. Test Partial Allocation Presets (e.g., Apply 50%)
    const presetResult = await page.evaluate(() => {
        window.applyInvAdvancePreset('half');
        return {
            applied: window.invoiceState.summary.advancePayment,
            residual: window.invoiceState.summary.residualAdvance,
            balanceDue: window.invoiceState.summary.balanceDue
        };
    });
    console.log('Preset 50% result:', presetResult);

    // 6. Test Manual Override
    const manualResult = await page.evaluate(() => {
        window.updateInvAdvancePayment(10000);
        return {
            applied: window.invoiceState.summary.advancePayment,
            residual: window.invoiceState.summary.residualAdvance,
            balanceDue: window.invoiceState.summary.balanceDue
        };
    });
    console.log('Manual override (₹10,000) result:', manualResult);

    // 7. Test Payment Mode Selection
    await page.evaluate(() => {
        window.setPaymentType('CREDIT');
    });

    const creditNotice = await page.evaluate(() => {
        const notice = document.getElementById('summary-receivable-notice');
        return notice ? notice.innerText : '';
    });
    console.log('Credit routing notice:', creditNotice);

    // Take screenshot of sales creation form with advance adjustment
    const scrDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(scrDir)) fs.mkdirSync(scrDir, { recursive: true });
    await page.screenshot({ path: path.join(scrDir, 'sales_invoice_advance_workflow.png'), fullPage: true });
    console.log('Saved screenshot: reports/sales_invoice_advance_workflow.png');

    // 8. Test Sidebar Decoupling & Standalone Sales Return
    console.log('Testing Sidebar Decoupling...');
    await page.evaluate(() => {
        window.navigate('sales_return');
    });
    await page.waitForFunction(() => {
        const title = document.querySelector('#main-view h1');
        return title && title.innerText.includes('Sales Return');
    });

    const returnPageTitle = await page.evaluate(() => {
        const h1 = document.querySelector('#main-view h1');
        return h1 ? h1.innerText : '';
    });
    console.log('Sales Return page title:', returnPageTitle);

    // Verify Sales Return modal opens
    const modalOpened = await page.evaluate(() => {
        if (typeof window.openNewSalesReturnModal === 'function') {
            window.openNewSalesReturnModal();
            return !!document.getElementById('new-sr-modal');
        }
        return false;
    });
    console.log('Sales Return modal opened successfully:', modalOpened);

    await page.screenshot({ path: path.join(scrDir, 'standalone_sales_return_module.png'), fullPage: true });
    console.log('Saved screenshot: reports/standalone_sales_return_module.png');

    await browser.close();

    console.log('--- TEST FINISHED SUCCESSFULLY ---');
    console.log('Console Errors:', errors.length);
    if (errors.length > 0) {
        console.error('Console errors detected:', errors);
        process.exit(1);
    }
})();
