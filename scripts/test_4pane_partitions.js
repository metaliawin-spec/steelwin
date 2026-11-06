const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
        await new Promise(r => setTimeout(r, 800));

        await page.evaluate(() => {
            window.navigate('calculation');
        });
        await new Promise(r => setTimeout(r, 1000));

        // Set 4 panes with 46.7, 60, 60, 46.7
        await page.evaluate(() => {
            window.updateGrid('cols', 4);
            window.updateIndividualPaneWidth(0, 46.7);
            window.updateIndividualPaneWidth(1, 60);
            window.updateIndividualPaneWidth(2, 60);
            window.updateIndividualPaneWidth(3, 46.7);

            // Set Top partition on pane 1, and Middle partition on pane 2
            window.setPanePartitionPos(1, 'top');
            window.setPanePartitionPos(2, 'center');
        });
        await new Promise(r => setTimeout(r, 600));

        const ssDir = path.join(__dirname, 'screenshots');
        await page.screenshot({ path: path.join(ssDir, 'verify_4pane_partitioned_result.png'), fullPage: false });
        console.log("Captured verify_4pane_partitioned_result.png successfully!");
    } finally {
        await browser.close();
    }
})();
