
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1550, height: 1100 });
        
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));

        // Navigate to Material Catalog
        await page.evaluate(() => {
            window.navigate('materials');
        });
        await new Promise(r => setTimeout(r, 800));

        // Check categories and rendered cards
        const catalogState = await page.evaluate(() => {
            const groups = window.Store.state.materialGroups;
            const filterBtns = Array.from(document.querySelectorAll('.calc-inner-mount, div'))
                .flatMap(d => Array.from(d.querySelectorAll('button')))
                .map(b => b.innerText.trim());
            
            // Check all card headers
            const cardHeaders = Array.from(document.querySelectorAll('h3, .glass-panel div div div'))
                .map(el => el.innerText.trim())
                .filter(t => t.length > 0);

            const hasFrameCard = document.body.innerText.includes('No items found in Frame') || 
                                 Array.from(document.querySelectorAll('*')).some(el => el.innerText === 'Frame' && el.tagName !== 'SCRIPT');

            return {
                materialGroups: groups,
                hasFrameCard,
                bodyHasFrame: document.body.innerText.includes('Frame')
            };
        });

        console.log('Catalog State:', catalogState);

        await page.screenshot({ path: 'scripts/material_catalog_no_frame.png' });
        console.log('Saved screenshot: scripts/material_catalog_no_frame.png');

        if (!catalogState.hasFrameCard && !catalogState.materialGroups.includes('Frame')) {
            console.log('✅ SUCCESS: Frame category completely removed from Material Catalog!');
        } else {
            console.error('❌ FAILURE: Frame still found:', catalogState);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await browser.close();
    }
})();
