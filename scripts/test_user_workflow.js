const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        defaultViewport: { width: 1440, height: 900 }
    });

    const page = await browser.newPage();
    const indexPath = 'file://' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');

    page.on('dialog', async dialog => {
        console.log('DIALOG DETECTED:', dialog.type(), dialog.message());
        await dialog.dismiss();
    });

    await page.goto(indexPath, { waitUntil: 'networkidle0' });

    // 1. Open Quotation Studio
    await page.evaluate(() => {
        window.startQuotationStudio();
    });
    await new Promise(r => setTimeout(r, 400));

    // 2. Select customer "Arun Kumar" using the verified customer dropdown or type
    console.log('Testing customer autocomplete for "Arun"...');
    await page.evaluate(() => {
        const inp = document.getElementById('qs-cust-name');
        inp.value = 'Arun';
        window.handleQuoteCustInput('Arun');
    });
    await new Promise(r => setTimeout(r, 300));

    const ddItems = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('#qs-cust-dropdown .calc-search-dropdown-item'));
        return items.map(it => it.innerText.split('\n')[0]);
    });
    console.log('Customer dropdown items for "Arun":', ddItems);

    // Click Arun Kumar
    await page.evaluate(() => {
        const first = document.querySelector('#qs-cust-dropdown .calc-search-dropdown-item');
        if (first) first.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const custFields = await page.evaluate(() => {
        return {
            name: document.getElementById('qs-cust-name')?.value,
            place: document.getElementById('qs-cust-place')?.value,
            city: document.getElementById('qs-cust-city')?.value,
            pin: document.getElementById('qs-cust-pin')?.value,
            mobile: document.getElementById('qs-cust-mobile')?.value,
            quoteStudioStep: Store.state.quoteStudio?.step,
            currentView: document.querySelector('h2')?.innerText || document.querySelector('h1')?.innerText
        };
    });
    console.log('Customer fields after clicking dropdown:', custFields);

    // Proceed to Step 2
    await page.evaluate(() => {
        const btn = document.querySelector('#qs-form-step-1 button[type="submit"]');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Step 2: Proceed to Canvas
    await page.evaluate(() => {
        const btn = document.getElementById('qs-btn-proceed-canvas');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('--- TESTING 3 WINDOW WORKFLOW ---');
    // Window 1: 1 Kalli, 50x140 cm, Qty 1 -> Save & New
    console.log('Saving Window 1 (1 Kalli, Qty 1)...');
    await page.evaluate(() => {
        window.saveQuotationItemAndNew();
    });
    await new Promise(r => setTimeout(r, 500));

    // Window 2: 5 Kalli, Qty 2 -> Save & New
    console.log('Configuring Window 2 (5 Kalli, Qty 2)...');
    await page.evaluate(() => {
        window.loadStudioPreset(5);
        const qtyInp = document.getElementById('studio-item-qty');
        if (qtyInp) {
            qtyInp.value = 2;
            window.updateStudioQty(2);
        }
    });
    await new Promise(r => setTimeout(r, 400));

    console.log('Saving Window 2...');
    await page.evaluate(() => {
        window.saveQuotationItemAndNew();
    });
    await new Promise(r => setTimeout(r, 500));

    // Window 3: 3 Kalli, Qty 4 -> Save (Final)
    console.log('Configuring Window 3 (3 Kalli, Qty 4)...');
    await page.evaluate(() => {
        window.loadStudioPreset(3);
        const qtyInp = document.getElementById('studio-item-qty');
        if (qtyInp) {
            qtyInp.value = 4;
            window.updateStudioQty(4);
        }
    });
    await new Promise(r => setTimeout(r, 400));

    console.log('Saving Window 3 and finalizing quote...');
    await page.evaluate(() => {
        window.saveQuotationFinal();
    });
    await new Promise(r => setTimeout(r, 800));

    // Inspect the generated quotation in Store and in the modal
    const quoteResult = await page.evaluate(() => {
        const q = Store.state.quotations?.[0];
        const modal = document.getElementById('quote-print-modal');
        const rows = Array.from(document.querySelectorAll('#printable-quotation tbody tr')).map(tr => {
            const cols = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.replace(/\n+/g, ' '));
            return cols;
        });
        return {
            quoteId: q?.id,
            customer: q?.customer,
            itemCount: q?.items?.length,
            items: q?.items,
            modalVisible: !!modal,
            modalRows: rows
        };
    });

    console.log('Generated Quote Result:', JSON.stringify(quoteResult, null, 2));

    await page.screenshot({ path: path.resolve(__dirname, 'test_quote_output.png') });
    await browser.close();
})();
