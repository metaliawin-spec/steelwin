const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const dimensions = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button')).filter(b => 
            b.innerText.trim() === 'Site Visits' || b.innerText.trim() === 'Services'
        );
        return buttons.map(b => {
            const rect = b.getBoundingClientRect();
            const cs = window.getComputedStyle(b);
            return {
                text: b.innerText.trim(),
                width: rect.width,
                height: rect.height,
                whiteSpace: cs.whiteSpace,
                padding: cs.padding
            };
        });
    });

    console.log('Button dimensions:', JSON.stringify(dimensions, null, 2));

    // Capture screenshot of the widget header area
    const widgetHeader = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Site Visit & Service'))?.closest('.glass-panel');
    });

    if (widgetHeader) {
        await widgetHeader.screenshot({ path: 'scripts/site_visits_and_services_matching.png' });
        console.log('Screenshot saved to scripts/site_visits_and_services_matching.png');
    }

    await browser.close();
})();
