const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 950 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
        window.Store.state.currentView = 'calculation';
        window.Store.notify();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
        window.loadPreset(3);
    });
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
        const Store = window.Store;
        const g = Store.state.rateCalc.grid;
        g.totalW = 200;
        g.totalH = 140;
        g.paneWidths = [55, 90, 55];
        g.panePartitions = [0, 1, 0];
        g.partitionPos = ['top', 'top', 'top'];
        g.subOrientations = { '1_0': 'vertical' };
        Store.notify();
    });
    await new Promise(r => setTimeout(r, 400));

    const rects = await page.evaluate(() => {
        const toObj = r => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) });
        const winSvg = Array.from(document.querySelectorAll('svg')).find(s => s.getAttribute('viewBox') && !s.getAttribute('viewBox').includes('24'));
        const panel = document.getElementById('calc-right-partition-panel');
        const viewport = winSvg.closest('div[style*="500px"]');
        return {
            svg: toObj(winSvg.getBoundingClientRect()),
            panel: toObj(panel.getBoundingClientRect()),
            viewport: toObj(viewport.getBoundingClientRect())
        };
    });
    console.log(rects);
    await browser.close();
})();
