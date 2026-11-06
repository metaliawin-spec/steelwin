const puppeteer = require('puppeteer-core');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Navigate to settings -> employees
    await page.evaluate(() => {
        window.navigate('settings');
        if (window.Store && window.Store.state) {
            window.Store.state.activeSettingsTab = 'employees';
            window.Store.notify();
        }
    });
    await new Promise(r => setTimeout(r, 600));

    const screenshotPath = path.join(__dirname, '..', 'settings_employees_tab.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Settings screenshot saved to: ${screenshotPath}`);

    // Now switch to employee Farhan Ali and go to production (view only)
    await page.evaluate(() => {
        window.switchActiveUser('EMP-103');
        window.navigate('production');
    });
    await new Promise(r => setTimeout(r, 600));

    const viewOnlyPath = path.join(__dirname, '..', 'employee_view_only_mode.png');
    await page.screenshot({ path: viewOnlyPath, fullPage: false });
    console.log(`View-Only screenshot saved to: ${viewOnlyPath}`);

    await browser.close();
})();
