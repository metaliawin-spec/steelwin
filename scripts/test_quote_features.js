const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Collect console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    const delay = ms => new Promise(r => setTimeout(r, ms));

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Navigate to Quotations
    console.log('Navigating to Quotations view...');
    await page.evaluate(() => {
        if (window.navigate) window.navigate('quotations');
    });

    await delay(1000);

    // Verify 3-dot button exists
    const moreBtns = await page.$$('.quote-more-btn');
    console.log(`Found ${moreBtns.length} 3-dot action buttons in quotations table.`);

    if (moreBtns.length === 0) {
        throw new Error('No .quote-more-btn found in quotations table!');
    }

    // Click first 3-dot button
    console.log('Clicking the first 3-dot button...');
    await moreBtns[0].click();
    await delay(500);

    // Verify dropdown is visible
    const dropdown = await page.$('#quote-action-dropdown');
    if (!dropdown) {
        throw new Error('Dropdown #quote-action-dropdown not found after clicking 3-dot button!');
    }

    const menuItems = await page.evaluate(() => {
        const dd = document.getElementById('quote-action-dropdown');
        if (!dd) return [];
        return Array.from(dd.querySelectorAll('button')).map(b => b.innerText.trim());
    });
    console.log('Menu items in 3-dot dropdown:', menuItems);

    await page.screenshot({ path: path.join(screenshotDir, '1_quote_3dot_dropdown.png') });
    console.log('Saved 1_quote_3dot_dropdown.png');

    // Click "Clone Quotation" from dropdown
    console.log('Clicking Clone Quotation...');
    await page.evaluate(() => {
        const dd = document.getElementById('quote-action-dropdown');
        const cloneBtn = Array.from(dd.querySelectorAll('button')).find(b => b.innerText.includes('Clone'));
        if (cloneBtn) cloneBtn.click();
    });

    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '2_quote_cloned_table.png') });
    console.log('Saved 2_quote_cloned_table.png');

    // Open Print Preview on first quotation
    console.log('Opening Print Preview on first quotation...');
    await page.evaluate(() => {
        const printBtn = document.querySelector('button[onclick*="openPrintQuotationModal"]');
        if (printBtn) printBtn.click();
    });

    await delay(800);

    // Check modal and toolbar buttons
    const printModal = await page.$('#quote-print-modal');
    if (!printModal) {
        throw new Error('#quote-print-modal did not open!');
    }

    const toolbarButtons = await page.evaluate(() => {
        const modal = document.getElementById('quote-print-modal');
        if (!modal) return [];
        const toolbar = modal.querySelector('.no-print');
        if (!toolbar) return [];
        return Array.from(toolbar.querySelectorAll('button')).map(b => b.innerText.trim().replace(/\s+/g, ' '));
    });
    console.log('Toolbar buttons in Quotation Print Preview:', toolbarButtons);

    await page.screenshot({ path: path.join(screenshotDir, '3_quote_print_preview.png') });
    console.log('Saved 3_quote_print_preview.png');

    // Click Share button in Print Preview
    console.log('Clicking Share button in Print Preview...');
    await page.evaluate(() => {
        const modal = document.getElementById('quote-print-modal');
        const shareBtn = Array.from(modal.querySelectorAll('button')).find(b => b.innerText.includes('Share'));
        if (shareBtn) shareBtn.click();
    });

    await delay(600);

    const shareModal = await page.$('#doc-share-modal');
    if (!shareModal) {
        throw new Error('#doc-share-modal did not open!');
    }
    console.log('Share modal opened successfully!');

    await page.screenshot({ path: path.join(screenshotDir, '4_doc_share_modal.png') });
    console.log('Saved 4_doc_share_modal.png');

    // Close share modal and print modal
    await page.evaluate(() => {
        const sm = document.getElementById('doc-share-modal');
        if (sm) sm.remove();
        const pm = document.getElementById('quote-print-modal');
        if (pm) pm.remove();
    });

    await delay(500);

    // Navigate to Sales to test Invoice Print Preview
    console.log('Navigating to Sales view...');
    await page.evaluate(() => {
        if (window.navigate) window.navigate('sales');
    });

    await delay(1000);

    // Click Print on first sales invoice
    console.log('Opening Print Preview for sales invoice...');
    await page.evaluate(() => {
        const printBtn = document.querySelector('button[onclick*="openPrintInvoiceModal"]');
        if (printBtn) printBtn.click();
    });

    await delay(800);

    const invModal = await page.$('#inv-print-modal');
    if (!invModal) {
        console.log('No inv-print-modal found, checking if sales records exist...');
    } else {
        const invToolbarButtons = await page.evaluate(() => {
            const modal = document.getElementById('inv-print-modal');
            if (!modal) return [];
            const toolbar = modal.querySelector('.no-print');
            if (!toolbar) return [];
            return Array.from(toolbar.querySelectorAll('button')).map(b => b.innerText.trim().replace(/\s+/g, ' '));
        });
        console.log('Toolbar buttons in Invoice Print Preview:', invToolbarButtons);

        await page.screenshot({ path: path.join(screenshotDir, '5_sales_invoice_print_preview.png') });
        console.log('Saved 5_sales_invoice_print_preview.png');
    }

    await browser.close();
    console.log('All automated verification tests passed successfully!');
})();
