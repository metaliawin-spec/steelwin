const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Testing price tag removal from material dropdowns...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 950 });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Switch to calculation view
    await page.evaluate(() => {
        window.Store.state.currentView = 'calculation';
        window.Store.notify();
    });
    await new Promise(r => setTimeout(r, 600));

    // Inspect dropdown option texts
    const selectOptions = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('.calc-mat-select'));
        return selects.map(sel => {
            const options = Array.from(sel.options).map(o => o.text);
            return {
                id: sel.id,
                options: options.slice(0, 5) // first 5
            };
        });
    });

    console.log('Select dropdown options sample:');
    let hasPriceTag = false;
    for (const s of selectOptions) {
        console.log(`Dropdown [${s.id}]:`, s.options);
        for (const opt of s.options) {
            if (opt.includes('(₹') || opt.includes('₹')) {
                hasPriceTag = true;
                console.error(`ERROR: Option "${opt}" still contains a price tag!`);
            }
        }
    }

    if (hasPriceTag) {
        throw new Error('FAILED: Price tags still found in dropdown options!');
    }
    console.log('✓ Verified: All price tags (₹...) successfully removed from material dropdown options!');

    // Take screenshot of the material controls area
    const shotDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

    await page.screenshot({ path: path.join(shotDir, 'material_dropdowns_no_price_tag.png'), fullPage: false });
    console.log('Saved screenshot: screenshots/material_dropdowns_no_price_tag.png');

    await browser.close();
    process.exit(0);
})().catch(err => {
    console.error('TEST ERROR:', err);
    process.exit(1);
});
