const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    const sidebar = await page.waitForSelector('#sidebar');
    if (sidebar) {
        await sidebar.screenshot({ path: 'scripts/sidebar_updated.png' });
        console.log('Sidebar screenshot saved to scripts/sidebar_updated.png');
    }
    await browser.close();
})();
