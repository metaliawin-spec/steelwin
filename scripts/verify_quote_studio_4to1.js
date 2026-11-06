const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('--- STARTING VERIFICATION: Quotation Studio 4:1 Layout & Height ---');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 950 });

        const fileUrl = 'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
        console.log('Navigating to:', fileUrl);
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 1000));

        // Open Quotation Studio
        await page.evaluate(() => {
            if (typeof window.startQuotationStudio === 'function') {
                window.startQuotationStudio();
            }
        });
        await new Promise(r => setTimeout(r, 800));

        // Inspect row 1 grid styles and input heights
        const layoutInfo = await page.evaluate(() => {
            const nameInp = document.getElementById('qs-cust-name');
            const mobileInp = document.getElementById('qs-cust-mobile');
            const placeInp = document.getElementById('qs-cust-place');
            const frameSel = document.getElementById('qs-mat-frame');

            const row1Grid = nameInp ? nameInp.closest('div[style*="grid"]') : null;

            return {
                row1GridTemplate: row1Grid ? row1Grid.style.gridTemplateColumns : null,
                nameWidth: nameInp ? nameInp.offsetWidth : null,
                nameHeight: nameInp ? nameInp.offsetHeight : null,
                mobileWidth: mobileInp ? mobileInp.offsetWidth : null,
                mobileHeight: mobileInp ? mobileInp.offsetHeight : null,
                placeHeight: placeInp ? placeInp.offsetHeight : null,
                frameSelectHeight: frameSel ? frameSel.offsetHeight : null,
                ratio: (nameInp && mobileInp) ? (nameInp.offsetWidth / mobileInp.offsetWidth).toFixed(2) : null
            };
        });

        console.log('Layout Measurements:', layoutInfo);

        const shotPath = path.resolve(__dirname, 'quotation_studio_4to1_verified.png');
        await page.screenshot({ path: shotPath, fullPage: false });
        console.log('Screenshot saved to:', shotPath);

        console.log('--- VERIFICATION COMPLETE ---');
    } catch (err) {
        console.error('Test Failed:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
