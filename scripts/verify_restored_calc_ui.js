const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1550, height: 1000 });
        
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Navigate to Calculation view
        console.log('Switching to Calculation module...');
        await page.evaluate(() => {
            window.Store.state.calcTab = 'manual';
            window.Store.navigate('calculation');
        });

        await new Promise(r => setTimeout(r, 800));

        // Verify elements on page
        const verification = await page.evaluate(() => {
            const clientLabel = document.querySelector('span, div');
            const modelTitle = document.querySelector('.quick-calc-container div[style*="0284c7"]')?.innerText;
            const measureSelect = document.querySelector('select[style*="81c784"]')?.value;
            const panesToolbar = document.querySelector('div[style*="linear-gradient"]');
            const kalliActive = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('3 Kalli') && b.style.background.includes('16a34a'));
            const customKalliInput = document.querySelector('input[style*="#1e293b"]')?.value;
            const heightInput = document.querySelector('div[style*="38bdf8"] input')?.value;
            const overallWidthInput = document.querySelector('div[style*="f59e0b"] input')?.value;
            const partitionPills = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('PARTITION')).map(d => d.innerText.trim());
            const priceTag = document.querySelector('div[style*="86efac"] span')?.innerText;

            return {
                modelTitle,
                measureSelect,
                hasPanesToolbar: !!panesToolbar,
                hasKalliActive: !!kalliActive,
                kalliActiveText: kalliActive?.innerText,
                customKalliInput,
                heightInput,
                overallWidthInput,
                partitionPillCount: partitionPills.length,
                partitionPillsSample: partitionPills.slice(0, 3),
                priceTag
            };
        });

        console.log('UI Verification Results:', JSON.stringify(verification, null, 2));

        // Capture screenshot
        const screenshotPath = 'scripts/restored_original_calc_ui.png';
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`Saved screenshot to ${screenshotPath}`);

    } catch (err) {
        console.error('Test error:', err);
    } finally {
        await browser.close();
    }
})();
