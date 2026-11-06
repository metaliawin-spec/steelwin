const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/anshi/.gemini/antigravity-ide/brain/e8678a5d-8292-411e-a0f4-593081e8a15b');

(async () => {
    console.log('Testing Profile Dropdown Search Bar & Theme Switcher Relocation...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        await page.goto('http://localhost:3000/#dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1000));

        // Close any startup modal (e.g. Overdue Invoices Alert)
        await page.evaluate(() => {
            const modalBtns = Array.from(document.querySelectorAll('button'));
            const ackBtn = modalBtns.find(b => b.textContent && b.textContent.includes('Acknowledge & Close'));
            if (ackBtn) ackBtn.click();
            const closeX = document.querySelector('.modal-backdrop button');
            if (closeX) closeX.click();
        });
        await new Promise(r => setTimeout(r, 500));

        // 1. Verify Theme Switcher is NOT in dashboard profile dropdown
        const themeToggleInDropdown = await page.$('#adminProfileDropdownMenu .profile-dropdown-theme-toggle');
        if (themeToggleInDropdown) {
            throw new Error('FAILED: Theme toggle is still present inside admin profile dropdown!');
        }
        console.log('✓ PASS: Theme toggle removed from dashboard profile dropdown');

        // 2. Open Admin Profile Dropdown
        await page.evaluate(() => window.toggleAdminProfileMenu());
        await new Promise(r => setTimeout(r, 300));

        const isMenuVisible = await page.$eval('#adminProfileDropdownMenu', el => el.style.display !== 'none');
        if (!isMenuVisible) {
            throw new Error('FAILED: Profile dropdown menu did not open!');
        }
        console.log('✓ PASS: Profile dropdown menu opened');

        // 3. Verify Search Bar exists
        const searchInput = await page.$('#adminDropdownStaffSearch');
        if (!searchInput) {
            throw new Error('FAILED: #adminDropdownStaffSearch not found in dropdown!');
        }
        console.log('✓ PASS: Live search bar present in dropdown');

        // 4. Test live filter by typing a name
        const totalItems = await page.$$eval('.profile-staff-item', els => els.length);
        console.log(`Initial total profiles listed: ${totalItems}`);

        // Capture screenshot of dropdown with full list
        const screenshotAll = path.join(ARTIFACT_DIR, 'profile_dropdown_with_search.png');
        await page.screenshot({ path: screenshotAll });
        console.log(`📸 Saved screenshot of full profile dropdown to: ${screenshotAll}`);

        // Type 'admin'
        await page.type('#adminDropdownStaffSearch', 'admin');
        await new Promise(r => setTimeout(r, 200));

        const visibleItemsAfterAdmin = await page.$$eval('.profile-staff-item', els => els.filter(e => e.style.display !== 'none').length);
        console.log(`Visible after typing "admin": ${visibleItemsAfterAdmin}`);
        if (visibleItemsAfterAdmin < 1) {
            throw new Error('FAILED: Admin profile should be visible for query "admin"!');
        }
        console.log('✓ PASS: Search filtering operates properly on Admin profile');

        // Capture screenshot of filtered list
        const screenshotFiltered = path.join(ARTIFACT_DIR, 'profile_dropdown_filtered.png');
        await page.screenshot({ path: screenshotFiltered });
        console.log(`📸 Saved screenshot of filtered dropdown to: ${screenshotFiltered}`);

        // Type nonexistent query
        await page.evaluate(() => {
            const input = document.getElementById('adminDropdownStaffSearch');
            input.value = 'xyznonexistent123';
            window.filterProfileDropdownStaff(input.value);
        });
        await new Promise(r => setTimeout(r, 200));

        const emptyVisible = await page.$eval('#profileStaffEmptyState', el => el.style.display !== 'none');
        if (!emptyVisible) {
            throw new Error('FAILED: Empty state not shown when no results match!');
        }
        console.log('✓ PASS: Empty state properly displayed when no employees match search');

        // Clear query
        await page.evaluate(() => {
            const input = document.getElementById('adminDropdownStaffSearch');
            input.value = '';
            window.filterProfileDropdownStaff('');
        });
        await new Promise(r => setTimeout(r, 200));
        const restoredCount = await page.$$eval('.profile-staff-item', els => els.filter(e => e.style.display !== 'none').length);
        if (restoredCount !== totalItems) {
            throw new Error(`FAILED: Expected ${totalItems} restored items, got ${restoredCount}`);
        }
        console.log('✓ PASS: Resetting search restored all staff profiles');

        // Close menu
        await page.evaluate(() => window.closeAdminProfileMenu());
        await new Promise(r => setTimeout(r, 200));

        // 5. Navigate to Settings and verify Theme & Appearance tab
        await page.goto('http://localhost:3000/#settings', { waitUntil: 'networkidle0', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1000));

        // Switch to appearance tab
        await page.evaluate(() => {
            if (typeof window.switchSettingsTab === 'function') {
                window.switchSettingsTab('appearance');
            }
        });
        await new Promise(r => setTimeout(r, 500));

        const appearanceTitle = await page.evaluate(() => {
            return document.body.innerText.includes('Theme & Appearance') && 
                   document.body.innerText.includes('Dark Mode') && 
                   document.body.innerText.includes('Light Mode');
        });
        if (!appearanceTitle) {
            throw new Error('FAILED: Theme & Appearance tab content not found in Settings!');
        }
        console.log('✓ PASS: Theme & Appearance tab in Settings contains full Dark & Light mode configuration');

        console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
    } catch (err) {
        console.error('Error during test:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
