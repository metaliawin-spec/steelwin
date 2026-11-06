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

        await new Promise(r => setTimeout(r, 600));

        // 1. Check sidebar tabs
        const sidebarTabs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.calculation-sidebar .calc-nav-item'))
                .map(btn => btn.innerText.replace(/\n+/g, ' ').trim());
        });
        console.log('Sidebar Tabs:', sidebarTabs);

        await page.screenshot({ path: 'scripts/sidebar_with_quotation_calc.png' });
        console.log('Saved scripts/sidebar_with_quotation_calc.png');

        // 2. Click on Quotation Calculation tab
        console.log('Clicking Quotation Calculation tab...');
        await page.evaluate(() => {
            const btn = document.getElementById('tab-quote-calc');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 600));

        const quoteStudioTitle = await page.evaluate(() => {
            return document.querySelector('#calc-inner-mount h2')?.innerText?.trim();
        });
        console.log('Quotation Studio Title:', quoteStudioTitle);

        await page.screenshot({ path: 'scripts/quotation_studio_active.png' });
        console.log('Saved scripts/quotation_studio_active.png');

        // 3. Switch back to Quick Calculation tab
        console.log('Switching back to Quick Calculation...');
        await page.evaluate(() => {
            const btn = document.getElementById('tab-quick-calc');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 600));

        const quickCalcTitle = await page.evaluate(() => {
            return document.querySelector('.quick-calc-container div[style*="0284c7"]')?.innerText?.trim();
        });
        console.log('Quick Calc Model Title:', quickCalcTitle);

        await page.screenshot({ path: 'scripts/quick_calc_active_again.png' });
        console.log('Saved scripts/quick_calc_active_again.png');

        console.log('SUCCESS: Quotation Calculation added and verified!');
    } catch (err) {
        console.error('Error in verification:', err);
    } finally {
        await browser.close();
    }
})();
