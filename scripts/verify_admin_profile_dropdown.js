const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        defaultViewport: { width: 1440, height: 900 }
    });

    try {
        const page = await browser.newPage();
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));

        // Locate topbarProfileBtn
        const profileBtn = await page.$('#topbarProfileBtn');
        if (!profileBtn) {
            throw new Error('topbarProfileBtn not found');
        }

        // Click profileBtn to open dropdown
        await profileBtn.click();
        await new Promise(r => setTimeout(r, 600));

        // Evaluate dropdown status
        const dropdownDetails = await page.evaluate(() => {
            const menu = document.getElementById('adminProfileDropdownMenu');
            if (!menu) return { exists: false };

            const isVisible = window.getComputedStyle(menu).display !== 'none';
            const textContent = menu.innerText;
            const settingsBtn = document.getElementById('adminDropdownSettingsBtn');
            const logoutBtn = document.getElementById('adminDropdownLogoutBtn');

            return {
                exists: true,
                isVisible,
                textContent,
                hasSettingsBtn: !!settingsBtn,
                hasLogoutBtn: !!logoutBtn,
                logoutBtnText: logoutBtn ? logoutBtn.innerText.trim() : null,
                containsChangePassword: textContent.includes('Change Password'),
                containsChangeProfilePhoto: textContent.includes('Change Profile Photo'),
                containsSecureLogout: textContent.includes('Secure Logout'),
                containsSuperAdmin: textContent.includes('Super Administrator'),
                containsActive: textContent.includes('ACTIVE')
            };
        });

        console.log('Dropdown Details:', JSON.stringify(dropdownDetails, null, 2));

        // Save screenshot of the dropdown open
        const screenshotDir = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\3e8e9205-9986-45cb-8a72-18cbd9c38763';
        const dropdownScreenshotPath = path.join(screenshotDir, 'admin_profile_dropdown_updated.png');
        
        // Clip around top-right header area
        const menu = await page.$('#adminProfileDropdownMenu');
        const menuBox = await menu.boundingBox();
        await page.screenshot({
            path: dropdownScreenshotPath,
            clip: {
                x: Math.max(0, menuBox.x - 15),
                y: Math.max(0, menuBox.y - 60),
                width: menuBox.width + 30,
                height: menuBox.height + 80
            }
        });
        console.log('Screenshot saved to:', dropdownScreenshotPath);

        // Also take full topbar screenshot
        const fullTopbarPath = path.join(screenshotDir, 'admin_profile_dropdown_full.png');
        await page.screenshot({ path: fullTopbarPath });
        console.log('Full screenshot saved to:', fullTopbarPath);

        // Test clicking settings button
        const settingsBtn = await page.$('#adminDropdownSettingsBtn');
        if (settingsBtn) {
            await settingsBtn.click();
            await new Promise(r => setTimeout(r, 600));
            const currentRoute = await page.evaluate(() => window.location.hash || document.title);
            console.log('Post settings click state/route:', currentRoute);
        }

        console.log('Verification completed successfully!');
    } catch (err) {
        console.error('Error during verification:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
