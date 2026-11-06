const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new', 
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    const map = await page.$('#india-3d-map-svg');
    if (map) {
        await map.screenshot({ path: 'scripts/current_map_view.png' });
        console.log('Map snap done to scripts/current_map_view.png');
    }
    const mapBox = await page.$('.map-canvas-wrapper, [style*="min-height: 420px"]');
    if (mapBox) {
        await mapBox.screenshot({ path: 'scripts/current_map_box.png' });
    }
    await browser.close();
})();
