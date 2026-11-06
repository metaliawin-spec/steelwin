const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: 'new',
            defaultViewport: { width: 1440, height: 900 }
        });

        const page = await browser.newPage();
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        await page.evaluate(() => {
            if (window.setTheme) window.setTheme('dark');
            window.navigate('sales');
        });
        await new Promise(r => setTimeout(r, 600));

        await page.evaluate(() => {
            window.initCreateInvoice();
        });
        await new Promise(r => setTimeout(r, 600));

        // Open UCS in Sales
        await page.evaluate(() => {
            const trigger = document.querySelector('#sales-customer-search .ucs-trigger');
            if (trigger) trigger.click();
        });
        await new Promise(r => setTimeout(r, 400));

        const salesUcsPath = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\c6c05c05-5968-4292-b804-64b7412f1d59\\universal_search_sales_open.png';
        await page.screenshot({ path: salesUcsPath });
        console.log('Saved sales UCS open screenshot:', salesUcsPath);
    } catch (e) {
        console.error(e);
    } finally {
        if (browser) await browser.close();
    }
})();
