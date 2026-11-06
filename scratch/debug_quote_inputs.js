const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Switch to light mode
    await page.evaluate(() => {
        window.setTheme('light');
        window.navigate('quotations');
    });
    await new Promise(r => setTimeout(r, 600));

    // Click "Create Quotation"
    await page.evaluate(() => {
        if (window.renderCreateQuotation) {
            window.renderCreateQuotation();
        } else {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Create Quotation'));
            if (btn) btn.click();
        }
    });
    await new Promise(r => setTimeout(r, 600));

    // Inspect inputs
    const info = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, textarea, .ucs-trigger'));
        return inputs.slice(0, 10).map(el => {
            const cs = window.getComputedStyle(el);
            return {
                tag: el.tagName,
                className: el.className,
                placeholder: el.placeholder || '',
                backgroundColor: cs.backgroundColor,
                color: cs.color,
                boxShadow: cs.boxShadow,
                borderColor: cs.borderColor
            };
        });
    });

    console.log('Inputs info in light mode Create Quotation:', JSON.stringify(info, null, 2));

    await page.screenshot({ path: 'scratch/quote_light_debug.png' });
    await browser.close();
})();
