const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        defaultViewport: { width: 1440, height: 960 }
    });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    await page.goto('file://' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    
    console.log('--- 1. Testing Quick Calculation AutoCAD Canvas ---');
    await page.evaluate(() => {
        Store.state.currentView = 'calculation';
        Store.state.calcTab = 'manual';
        Store.notify();
    });
    await new Promise(r => setTimeout(r, 600));

    // Capture Quick Calc 1 Kalli (Default WITH panel)
    await page.screenshot({ path: 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/test_quick_calc_1kalli_with_panel.png' });
    console.log('Saved test_quick_calc_1kalli_with_panel.png');

    // Switch to 3 Kalli
    await page.evaluate(() => {
        window.loadPreset(3);
        const wInp = document.querySelector('input[onchange*="totalW"]');
        if (wInp) { wInp.value = 150; window.updateGrid('totalW', 150); }
        const hInp = document.querySelector('input[onchange*="totalH"]');
        if (hInp) { hInp.value = 140; window.updateGrid('totalH', 140); }
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/test_quick_calc_3kalli_150x140_with_panel.png' });
    console.log('Saved test_quick_calc_3kalli_150x140_with_panel.png');

    // Add Partition to Center Pane (Pane 1)
    await page.evaluate(() => {
        window.cyclePanePartition(1); // 1 partition on middle pane
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/test_quick_calc_3kalli_center_partition.png' });
    console.log('Saved test_quick_calc_3kalli_center_partition.png');

    // Switch Panel to None (Without Panel)
    await page.evaluate(() => {
        const rc = Store.state.rateCalc;
        rc.materials.panel = 'none';
        Store.notify();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/test_quick_calc_without_panel.png' });
    console.log('Saved test_quick_calc_without_panel.png');

    console.log('--- 2. Testing Quotation Studio & Generation ---');
    await page.evaluate(() => {
        window.startQuotationStudio({
            name: 'Sunil Menon',
            place: 'Edappally',
            city: 'Kochi',
            pincode: '682024',
            mobile: '9846011223'
        });
    });
    await new Promise(r => setTimeout(r, 600));

    // Window 1: 1 Kalli 60x160 WITH Panel
    await page.evaluate(() => {
        window.loadStudioPreset(1);
        const wInp = document.querySelector('input[onchange*="totalW"]');
        if (wInp) { wInp.value = 60; window.updateStudioGrid('totalW', 60); }
        const hInp = document.querySelector('input[onchange*="totalH"]');
        if (hInp) { hInp.value = 160; window.updateStudioGrid('totalH', 160); }
        window.saveQuotationItemAndNew();
    });
    await new Promise(r => setTimeout(r, 500));

    // Window 2: 3 Kalli 150x140 WITH Panel + Center Partition
    await page.evaluate(() => {
        window.loadStudioPreset(3);
        const wInp = document.querySelector('input[onchange*="totalW"]');
        if (wInp) { wInp.value = 150; window.updateStudioGrid('totalW', 150); }
        const hInp = document.querySelector('input[onchange*="totalH"]');
        if (hInp) { hInp.value = 140; window.updateStudioGrid('totalH', 140); }
        window.cycleStudioPartition(1); // 1 partition on middle pane
        const qtyInp = document.getElementById('studio-item-qty');
        if (qtyInp) { qtyInp.value = 3; window.updateStudioQty(3); }
        window.saveQuotationFinal();
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture Official Quotation Print Modal
    await page.screenshot({ path: 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/test_quotation_print_modal_cad_drawing.png' });
    console.log('Saved test_quotation_print_modal_cad_drawing.png');

    // Open Edit Quotation Modal
    await page.evaluate(() => {
        const quote = Store.state.quotations[0];
        window.openEditQuotationModal(quote.id);
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/test_quotation_edit_modal_no_disc_tax.png' });
    console.log('Saved test_quotation_edit_modal_no_disc_tax.png');

    await browser.close();
    console.log('All tests completed successfully!');
})();
