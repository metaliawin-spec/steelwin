const puppeteer = require('puppeteer');

(async () => {
    console.log('Verifying removal of floating zoom badge...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1050 });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 800));

        const badgeExists = await page.evaluate(() => {
            const el = document.getElementById('map-zoom-level-badge');
            const hasText = Array.from(document.querySelectorAll('*')).some(el => 
                el.innerText && el.innerText.includes('Double-click to zoom • Drag to pan')
            );
            return !!el || hasText;
        });

        console.log('Badge or text exists on page:', badgeExists);
        if (badgeExists) {
            throw new Error('Floating zoom level badge still exists!');
        }

        console.log('✅ PASS: Floating zoom level badge and hint have been completely removed.');

        // Take screenshot of Delivery Locations card
        const mapCard = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Delivery Locations'))?.closest('.glass-panel');
        });

        if (mapCard) {
            await mapCard.screenshot({ path: 'scripts/map_badge_removed.png' });
            console.log('📸 Captured scripts/map_badge_removed.png');
        }

    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
