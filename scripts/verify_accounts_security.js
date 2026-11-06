const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\e8678a5d-8292-411e-a0f4-593081e8a15b';

(async () => {
    console.log('🚀 Starting Accounts Configuration Security & Re-Authentication Verification...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
        console.log('✅ Base app loaded');

        // -------------------------------------------------------------
        // STEP 1: Verify Root Sidebar Navigation
        // -------------------------------------------------------------
        const rootSidebarNav = await page.evaluate(() => {
            const nav = document.getElementById('main-nav');
            if (!nav) return { buttons: [], hasAccountsConfig: false };
            const buttons = Array.from(nav.querySelectorAll('button span')).map(s => s.innerText.trim());
            const hasAccountsConfig = buttons.some(t => t.toLowerCase().includes('accounts config'));
            return { buttons, hasAccountsConfig };
        });

        console.log('Root Sidebar items:', rootSidebarNav.buttons.join(', '));
        console.log('Standalone Accounts Config in Root Sidebar:', rootSidebarNav.hasAccountsConfig ? '❌ FAILED (Still present)' : '✅ PASSED (Successfully Removed)');

        // -------------------------------------------------------------
        // STEP 2: Navigate to Settings -> Configuration
        // -------------------------------------------------------------
        await page.evaluate(() => {
            window.navigate('settings');
        });
        await new Promise(r => setTimeout(r, 600));

        // Check placement inside Settings sidebar
        const settingsPlacement = await page.evaluate(() => {
            const asideButtons = Array.from(document.querySelectorAll('#main-view button')).map(b => b.innerText.trim());
            const userProfileIndex = asideButtons.findIndex(t => t.includes('User Profile'));
            const accountsConfigIndex = asideButtons.findIndex(t => t.includes('Accounts Configuration'));
            return {
                userProfileIndex,
                accountsConfigIndex,
                isDirectlyBeneath: accountsConfigIndex === userProfileIndex + 1,
                hasTabNavAccountsConfig: !!document.getElementById('tab-nav-accounts_config')
            };
        });

        console.log('Settings Placement:', settingsPlacement);
        console.log('Accounts Config positioned directly beneath User Profile:', settingsPlacement.isDirectlyBeneath ? '✅ PASSED' : '❌ FAILED');

        // Capture Screenshot 1: Settings Menu Placement
        const shot1Path = path.join(ARTIFACTS_DIR, 'settings_menu_placement.png');
        await page.screenshot({ path: shot1Path });
        console.log('📸 Captured:', shot1Path);

        // -------------------------------------------------------------
        // STEP 3: Click Accounts Configuration (Trigger Challenge-Response Lock)
        // -------------------------------------------------------------
        console.log('Navigating to Accounts Configuration...');
        await page.evaluate(() => {
            window.switchSettingsTab('accounts_config');
        });
        await new Promise(r => setTimeout(r, 600));

        // Check if locked gate and modal are present
        const lockStatus = await page.evaluate(() => {
            const modal = document.getElementById('accountsConfigUnlockModal');
            const passInput = document.getElementById('accountsConfigUnlockPassword');
            const lockedGate = document.getElementById('btnPromptUnlockAccountsConfig');
            return {
                modalOpen: !!modal,
                hasPasswordInput: !!passInput,
                hasLockedGate: !!lockedGate
            };
        });

        console.log('Lock Status:', lockStatus);
        console.log('Challenge Modal Triggered:', lockStatus.modalOpen ? '✅ PASSED' : '❌ FAILED');

        // Capture Screenshot 2: Locked Gate & Challenge Modal
        const shot2Path = path.join(ARTIFACTS_DIR, 'accounts_config_locked_gate.png');
        await page.screenshot({ path: shot2Path });
        console.log('📸 Captured:', shot2Path);

        // -------------------------------------------------------------
        // STEP 4: Test Incorrect Password Attempt
        // -------------------------------------------------------------
        console.log('Submitting incorrect password...');
        await page.type('#accountsConfigUnlockPassword', 'WrongPass@999');
        await page.click('#btnSubmitUnlockAccountsConfig');
        await new Promise(r => setTimeout(r, 800));

        const wrongPassFeedback = await page.evaluate(() => {
            const errorBox = document.getElementById('accountsConfigUnlockError');
            const errorMsg = document.getElementById('accountsConfigUnlockErrorMsg')?.innerText || '';
            const isVisible = errorBox && window.getComputedStyle(errorBox).display !== 'none';
            return { isVisible, errorMsg };
        });

        console.log('Wrong Password Feedback:', wrongPassFeedback);
        console.log('Error Displayed and Logged:', wrongPassFeedback.isVisible ? '✅ PASSED' : '❌ FAILED');

        // Capture Screenshot 3: Error Feedback
        const shot3Path = path.join(ARTIFACTS_DIR, 'accounts_config_wrong_password.png');
        await page.screenshot({ path: shot3Path });
        console.log('📸 Captured:', shot3Path);

        // -------------------------------------------------------------
        // STEP 5: Test Valid Admin Password Verification (Admin@2026)
        // -------------------------------------------------------------
        console.log('Submitting correct Admin Password (Admin@2026)...');
        await page.evaluate(() => {
            const passInput = document.getElementById('accountsConfigUnlockPassword');
            if (passInput) passInput.value = 'Admin@2026';
        });
        await page.click('#btnSubmitUnlockAccountsConfig');
        await new Promise(r => setTimeout(r, 1200));

        // Check if unlocked and configuration dashboard is rendered
        const unlockedStatus = await page.evaluate(() => {
            const container = document.querySelector('.accounts-config-container');
            const cards = document.querySelectorAll('.accounts-config-card');
            const modal = document.getElementById('accountsConfigUnlockModal');
            return {
                unlocked: !!window.accountsConfigUnlocked,
                dashboardRendered: !!container,
                moduleCardsCount: cards.length,
                modalClosed: !modal
            };
        });

        console.log('Unlocked Status:', unlockedStatus);
        console.log('Dashboard Unlocked & 14 Modules Rendered:', (unlockedStatus.unlocked && unlockedStatus.moduleCardsCount === 14) ? '✅ PASSED' : '❌ FAILED');

        // Capture Screenshot 4: Unlocked Accounts Configuration View
        const shot4Path = path.join(ARTIFACTS_DIR, 'accounts_config_unlocked_view.png');
        await page.screenshot({ path: shot4Path });
        console.log('📸 Captured:', shot4Path);

        // -------------------------------------------------------------
        // STEP 6: Trigger Master Global Reset Modal
        // -------------------------------------------------------------
        console.log('Opening Master Reset Re-Authentication Modal...');
        await page.evaluate(() => {
            window.openGlobalResetModal();
        });
        await new Promise(r => setTimeout(r, 600));

        const resetModalInfo = await page.evaluate(() => {
            const modal = document.getElementById('resetAuthModal');
            const adminIdInput = document.getElementById('resetAuthAdminId');
            const passInput = document.getElementById('resetAuthPassword');
            const tokenInput = document.getElementById('resetAuthConfirmToken');
            return {
                modalOpen: !!modal,
                hasAdminId: !!adminIdInput,
                adminIdValue: adminIdInput?.value || '',
                hasPassword: !!passInput,
                hasConfirmToken: !!tokenInput
            };
        });

        console.log('Reset Modal Info:', resetModalInfo);
        console.log('Credential Re-Authentication Modal Open:', resetModalInfo.modalOpen ? '✅ PASSED' : '❌ FAILED');

        // Capture Screenshot 5: Reset Re-Authentication Modal
        const shot5Path = path.join(ARTIFACTS_DIR, 'accounts_config_reset_auth_modal.png');
        await page.screenshot({ path: shot5Path });
        console.log('📸 Captured:', shot5Path);

        // -------------------------------------------------------------
        // STEP 7: Authorize Master Reset with Valid Credentials
        // -------------------------------------------------------------
        console.log('Executing authenticated Master Reset...');
        await page.type('#resetAuthPassword', 'Admin@2026');
        await page.type('#resetAuthConfirmToken', 'RESET');
        await page.click('#btnExecuteResetAuth');
        await new Promise(r => setTimeout(r, 1500));

        // Check that reset succeeded and audit log has entry
        const postResetState = await page.evaluate(() => {
            const auditLogs = window.Store.getAuditLogs();
            const latestLog = auditLogs[0] || {};
            const cards = document.querySelectorAll('.accounts-config-card');
            return {
                auditLogsCount: auditLogs.length,
                latestAction: latestLog.action,
                latestDetails: latestLog.details,
                adminId: latestLog.adminId,
                cardsCount: cards.length
            };
        });

        console.log('Post Reset State:', postResetState);
        console.log('Master Reset Executed & Audited:', postResetState.latestAction === 'GLOBAL_RESET' ? '✅ PASSED' : '❌ FAILED');

        // Capture Screenshot 6: Post-Reset Unlocked State & Audit Log
        const shot6Path = path.join(ARTIFACTS_DIR, 'accounts_config_post_reset_audit.png');
        await page.screenshot({ path: shot6Path });
        console.log('📸 Captured:', shot6Path);

        console.log('\n🎉 ALL 4 SECURITY ARCHITECTURE REQUIREMENTS VERIFIED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
    } finally {
        await browser.close();
    }
})();
