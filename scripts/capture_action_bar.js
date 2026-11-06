const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\e8678a5d-8292-411e-a0f4-593081e8a15b';

async function capture() {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(() => {
        window.navigate('calculation');
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.waitForSelector('#btn-load-benchmark', { timeout: 5000 });
    await page.click('#btn-load-benchmark');
    await new Promise(r => setTimeout(r, 1000));

    // Scroll to the bottom action bar
    await page.evaluate(() => {
        const btn = document.getElementById('btn-send-to-quote');
        if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'end' });
    });
    await new Promise(r => setTimeout(r, 500));

    const snapPath = path.join(ARTIFACT_DIR, 'benchmark_action_bar_view.png');
    await page.screenshot({ path: snapPath });
    console.log(`Saved: ${snapPath}`);

    await browser.close();
}

capture();
