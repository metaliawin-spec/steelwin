const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1550, height: 950 });
        
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Navigate to Calculation -> Quotation Studio
        console.log('Opening Quotation Studio...');
        await page.evaluate(() => {
            window.Store.state.calcTab = 'quotes';
            window.startQuotationStudio();
        });

        await new Promise(r => setTimeout(r, 600));

        // Check visibility of Next button without scrolling
        const visibility = await page.evaluate(() => {
            const btn = document.querySelector('button[type="submit"]');
            if (!btn) return { found: false };
            const rect = btn.getBoundingClientRect();
            return {
                found: true,
                btnText: btn.innerText.trim(),
                btnTop: rect.top,
                btnBottom: rect.bottom,
                windowHeight: window.innerHeight,
                isFullyVisibleWithoutScroll: rect.bottom <= window.innerHeight
            };
        });
        console.log('Visibility Check:', visibility);

        await page.screenshot({ path: 'scripts/quotation_studio_compact_no_scroll.png' });
        console.log('Saved scripts/quotation_studio_compact_no_scroll.png');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await browser.close();
    }
})();
