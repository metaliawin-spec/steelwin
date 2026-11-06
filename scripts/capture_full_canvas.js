const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        defaultViewport: { width: 1440, height: 1100 }
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

    // Pane 1: Top, Pane 2: Middle, Pane 3: Bottom
    await page.evaluate(() => {
        window.setPanePartitionCount(0, 1);
        window.setPanePartitionPos(0, 'top');
        window.setPanePartitionCount(1, 1);
        window.setPanePartitionPos(1, 'center');
        window.setPanePartitionCount(2, 1);
        window.setPanePartitionPos(2, 'bottom');
        window.selectPane(1);
    });
    await new Promise(r => setTimeout(r, 400));

    // Capture the interactive canvas area specifically
    const canvasElement = await page.$('.quick-calc-container');
    if (canvasElement) {
        await canvasElement.screenshot({ path: 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/verified_full_canvas_with_totalw.png' });
        console.log('Saved verified_full_canvas_with_totalw.png');
    }

    await browser.close();
})();
