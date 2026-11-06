const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        defaultViewport: { width: 1440, height: 950 }
    });
    const page = await browser.newPage();
    await page.goto('file://' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    
    // Open Quotation Studio & Select Arun Kumar
    await page.evaluate(() => {
        window.startQuotationStudio();
        window.handleQuoteCustInput('Arun');
        const item = document.querySelector('#qs-cust-dropdown .calc-search-dropdown-item');
        if (item) item.click();
    });
    await new Promise(r => setTimeout(r, 400));
    
    // Proceed directly to Canvas Studio
    await page.evaluate(() => {
        const btn = document.getElementById('qs-btn-proceed-canvas');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    
    // Window 1: Save & New
    await page.evaluate(() => window.saveQuotationItemAndNew());
    await new Promise(r => setTimeout(r, 400));
    
    // Window 2: 5 Kalli, Qty 2 -> Save & New
    await page.evaluate(() => {
        window.loadStudioPreset(5);
        const qtyInp = document.getElementById('studio-item-qty');
        if (qtyInp) { qtyInp.value = 2; window.updateStudioQty(2); }
        window.saveQuotationItemAndNew();
    });
    await new Promise(r => setTimeout(r, 400));
    
    // Window 3: 3 Kalli, Qty 4
    await page.evaluate(() => {
        window.loadStudioPreset(3);
        const qtyInp = document.getElementById('studio-item-qty');
        if (qtyInp) { qtyInp.value = 4; window.updateStudioQty(4); }
    });
    await new Promise(r => setTimeout(r, 400));
    
    await page.screenshot({ path: 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/studio_live_saved_windows.png' });
    await browser.close();
    console.log('Saved studio_live_saved_windows.png successfully');
})();
