const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1000 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Check if the removed elements are gone
    const logoutBtn = await page.$('#sidebar-secure-logout-btn');
    const userCard = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('#sidebar *'));
        return els.some(el => el.textContent.includes('SB-9901'));
    });

    console.log('logoutBtn exists in sidebar:', !!logoutBtn);
    console.log('userCard with SB-9901 exists in sidebar:', userCard);

    const artifactDir = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\3e8e9205-9986-45cb-8a72-18cbd9c38763';
    await page.screenshot({ path: path.join(artifactDir, 'sidebar_without_user_badge_and_logout.png') });
    console.log('Captured sidebar_without_user_badge_and_logout.png');

    await browser.close();
})();
