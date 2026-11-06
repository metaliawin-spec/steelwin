const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    // 1. Capture Dark Mode Top (Photo 2 - Localy Obsidian)
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
        window.setTheme('dark');
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'scripts/theme_dark_mode.png' });

    // 2. Open Theme Selector Modal in Dark Mode
    await page.evaluate(() => {
        window.openThemeSelectorModal();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'scripts/theme_modal.png' });

    // Close modal
    await page.evaluate(() => {
        window.closeThemeSelectorModal();
    });
    await new Promise(r => setTimeout(r, 300));

    // 3. Capture Light Mode Top (Photo 4 - Nordic Teal & Sand)
    await page.evaluate(() => {
        window.setTheme('light');
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'scripts/theme_light_mode.png' });

    // Open Theme Selector Modal in Light Mode
    await page.evaluate(() => {
        window.openThemeSelectorModal();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'scripts/theme_modal_light.png' });

    // Close modal
    await page.evaluate(() => {
        window.closeThemeSelectorModal();
    });
    await new Promise(r => setTimeout(r, 300));

    // 4. Capture Plum Mode Top (Photo 3 - Wine Velvet)
    await page.evaluate(() => {
        window.setTheme('plum');
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'scripts/theme_plum_mode.png' });

    // Reset back to Dark mode
    await page.evaluate(() => {
        window.setTheme('dark');
    });

    await browser.close();
    console.log('All theme snapshots captured successfully.');
})();
