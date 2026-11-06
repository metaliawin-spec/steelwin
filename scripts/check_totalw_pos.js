const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        defaultViewport: { width: 1440, height: 960 }
    });
    const page = await browser.newPage();
    await page.goto('file://' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
        Store.state.currentView = 'calculation';
        Store.state.calcTab = 'manual';
        Store.notify();
        window.loadPreset(3);
    });
    await new Promise(r => setTimeout(r, 600));

    const totalWBox = await page.evaluate(() => {
        const inp = document.querySelector('input[onchange*="totalW"]');
        const viewport = inp ? inp.closest('div[style*="height: 430px"]') : null;
        if (!inp) return null;
        const rect = inp.getBoundingClientRect();
        const vRect = viewport ? viewport.getBoundingClientRect() : null;
        return {
            val: inp.value,
            rect: { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
            viewportRect: vRect ? { top: vRect.top, bottom: vRect.bottom, height: vRect.height } : null,
            isInsideViewport: vRect ? (rect.bottom <= vRect.bottom) : null
        };
    });
    console.log('Total W Box:', totalWBox);
    await browser.close();
})();
