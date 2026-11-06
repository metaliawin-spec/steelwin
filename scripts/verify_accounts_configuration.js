const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runVerification() {
    console.log('🚀 Starting Comprehensive Verification for Accounts Configuration & Admin Reset Module...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Listen to console and errors
    page.on('console', msg => {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    });
    page.on('pageerror', err => {
        console.error('[BROWSER EXCEPTION]:', err);
    });

    try {
        // 1. Load application
        console.log('1. Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));

        // 2. Navigate via sidebar: click Accounts Config or navigate to accounts_config
        console.log('2. Navigating to Accounts Configuration...');
        await page.evaluate(() => {
            window.navigate('accounts_config');
        });
        await new Promise(r => setTimeout(r, 1000));

        // 3. Verify all 14 modules
        console.log('3. Verifying presence of all 14 ERP modules...');
        const expectedModules = [
            'dashboard', 'customers', 'calculation', 'quotations', 'leads',
            'site_visit', 'service_visit', 'sales', 'purchase', 'payments',
            'stock_manager', 'production', 'hr', 'reports'
        ];

        const detectedModules = await page.evaluate(() => {
            const cards = document.querySelectorAll('.accounts-config-card');
            return Array.from(cards).map(c => c.getAttribute('data-module-id'));
        });

        console.log(`Detected ${detectedModules.length} module cards:`, detectedModules);
        const missing = expectedModules.filter(m => !detectedModules.includes(m));
        if (missing.length > 0) {
            throw new Error(`Missing expected modules: ${missing.join(', ')}`);
        }
        console.log('✅ All 14 ERP Modules successfully verified in the grid!');

        // Take screenshot of Accounts Configuration Grid
        const ssDir = path.join(__dirname, '..', 'screenshots');
        if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });
        
        await page.screenshot({ path: path.join(ssDir, 'accounts_config_grid.png') });
        console.log('📸 Captured: screenshots/accounts_config_grid.png');

        // 4. Test Category Filter
        console.log('4. Testing Category Filtering (Commercial)...');
        await page.evaluate(() => {
            window.setAccountsConfigCategoryFilter('Commercial');
        });
        await new Promise(r => setTimeout(r, 400));
        
        const commercialCards = await page.evaluate(() => {
            const cards = document.querySelectorAll('.accounts-config-card');
            return Array.from(cards).filter(c => c.style.display !== 'none').map(c => c.getAttribute('data-module-id'));
        });
        console.log('Commercial visible modules:', commercialCards);
        if (!commercialCards.includes('quotations') || !commercialCards.includes('customers')) {
            throw new Error('Commercial filtering failed!');
        }
        console.log('✅ Category filtering works perfectly!');

        // Reset filter
        await page.evaluate(() => {
            window.setAccountsConfigCategoryFilter('all');
        });
        await new Promise(r => setTimeout(r, 300));

        // 5. Open Edit/Configuration Modal for Quotations
        console.log('5. Opening Configuration Modal for Quotations...');
        await page.evaluate(() => {
            window.openModuleConfigModal('quotations');
        });
        await new Promise(r => setTimeout(r, 600));

        const modalVisible = await page.evaluate(() => {
            const modal = document.getElementById('moduleConfigModal');
            return modal && modal.innerText.includes('Quotations & Commercial Proposals');
        });
        if (!modalVisible) throw new Error('Module Config Modal failed to open!');
        console.log('✅ Quotations configuration modal opened successfully!');

        await page.screenshot({ path: path.join(ssDir, 'module_config_modal.png') });
        console.log('📸 Captured: screenshots/module_config_modal.png');

        // 6. Modify parameters: prefix to QT-CUSTOM- and min margin to 25%
        console.log('6. Modifying Quotations parameters...');
        await page.evaluate(() => {
            const prefixInput = document.getElementById('cfg_gen_quotePrefix') || document.getElementById('cfg_gen_codePrefix');
            if (prefixInput) prefixInput.value = 'QT-CUSTOM-';
            const marginInput = document.getElementById('cfg_fld_minGrossMarginPct') || document.getElementById('cfg_gen_defaultTaxRatePercent');
            if (marginInput) marginInput.value = '25';
            const termsInput = document.getElementById('cfg_gen_defaultPaymentTerms') || document.getElementById('cfg_fieldRules_termsAndConditionsTemplate');
            if (termsInput) termsInput.value = '50% Advance, Balance upon Delivery';

            // Submit form
            document.getElementById('hiddenModuleConfigSubmitBtn').click();
        });
        await new Promise(r => setTimeout(r, 1000));

        // 7. Verify status changed to Customized
        const quoteStatus = await page.evaluate(() => {
            const card = document.getElementById('card-mod-quotations');
            return {
                status: card.getAttribute('data-status'),
                text: card.innerText
            };
        });
        console.log('Quotations status after edit:', quoteStatus.status);
        if (quoteStatus.status !== 'Customized') {
            throw new Error(`Expected Quotations status to be Customized, got: ${quoteStatus.status}`);
        }
        if (!quoteStatus.text.includes('QT-CUSTOM-')) {
            throw new Error('Expected card to display new prefix QT-CUSTOM-');
        }
        console.log('✅ Parameter edit verified: Status is Customized with QT-CUSTOM- prefix!');

        // 8. Verify Audit Trail entry
        console.log('7. Verifying Audit Trail Log entry...');
        await page.evaluate(() => {
            window.openAuditLogsModal();
        });
        await new Promise(r => setTimeout(r, 600));

        const auditModalText = await page.evaluate(() => {
            const modal = document.getElementById('auditLogsModal');
            return modal ? modal.innerText : '';
        });
        if (!auditModalText.includes('Quotations & Commercial Proposals') || !auditModalText.includes('QT-CUSTOM-')) {
            throw new Error('Audit log did not record the Quotations parameter edit!');
        }
        console.log('✅ Audit Trail successfully recorded parameter diff!');

        await page.screenshot({ path: path.join(ssDir, 'audit_logs_modal.png') });
        console.log('📸 Captured: screenshots/audit_logs_modal.png');

        await page.evaluate(() => {
            window.closeAuditLogsModal();
        });
        await new Promise(r => setTimeout(r, 400));

        // 9. Test Single Module Reset
        console.log('8. Testing Single Module Reset on Quotations...');
        await page.evaluate(() => {
            window.promptResetModule('quotations');
        });
        await new Promise(r => setTimeout(r, 500));

        const resetModalVisible = await page.evaluate(() => {
            const m = document.getElementById('resetModuleModal');
            return m && m.innerText.includes('Reset Quotations & Commercial Proposals to Defaults?');
        });
        if (!resetModalVisible) throw new Error('Single module reset prompt failed to appear!');
        console.log('Single module reset prompt verified.');

        await page.screenshot({ path: path.join(ssDir, 'single_module_reset_modal.png') });
        console.log('📸 Captured: screenshots/single_module_reset_modal.png');

        await page.evaluate(() => {
            window.confirmResetModule('quotations');
        });
        await new Promise(r => setTimeout(r, 1000));

        const quoteStatusAfterReset = await page.evaluate(() => {
            const card = document.getElementById('card-mod-quotations');
            return {
                status: card.getAttribute('data-status'),
                text: card.innerText
            };
        });
        console.log('Quotations status after reset:', quoteStatusAfterReset.status);
        if (quoteStatusAfterReset.status !== 'Default') {
            throw new Error(`Expected Quotations status to revert to Default, got: ${quoteStatusAfterReset.status}`);
        }
        if (!quoteStatusAfterReset.text.includes('QT-') || quoteStatusAfterReset.text.includes('QT-CUSTOM-')) {
            throw new Error('Expected Quotations prefix to revert to QT-');
        }
        console.log('✅ Single module reset verified: Quotations reverted to Default factory preset!');

        // 10. Test High-Security Master Global Reset
        console.log('9. Testing High-Security Master Global Reset...');
        // First edit Customer module so there is a customized module
        await page.evaluate(async () => {
            const cfg = window.Store.getModuleConfig('customers');
            cfg.general.codePrefix = 'CLIENT-MODIFIED-';
            await window.Store.updateModuleConfig('customers', cfg);
        });
        await new Promise(r => setTimeout(r, 500));

        // Open Master Reset Modal
        await page.evaluate(() => {
            window.openGlobalResetModal();
        });
        await new Promise(r => setTimeout(r, 500));

        const globalModalVisible = await page.evaluate(() => {
            const m = document.getElementById('globalResetModal');
            return m && m.innerText.includes('Master Reset All ERP Configuration');
        });
        if (!globalModalVisible) throw new Error('Global Reset Modal failed to open!');
        console.log('Master Global Reset double-confirmation modal opened.');

        // Test button disabled state
        const initialBtnDisabled = await page.evaluate(() => {
            const btn = document.getElementById('btnConfirmMasterReset');
            return btn ? btn.disabled : false;
        });
        if (!initialBtnDisabled) throw new Error('Confirm Master Reset button MUST be disabled by default!');
        console.log('✅ Double-confirmation safety check verified: Button disabled initially.');

        // Type incorrect input
        await page.evaluate(() => {
            const input = document.getElementById('globalResetChallengeInput');
            input.value = 'TEST';
            window.checkGlobalResetInput('TEST');
        });
        const wrongInputBtnDisabled = await page.evaluate(() => {
            const btn = document.getElementById('btnConfirmMasterReset');
            return btn ? btn.disabled : false;
        });
        if (!wrongInputBtnDisabled) throw new Error('Confirm button should remain disabled on wrong input!');

        await page.screenshot({ path: path.join(ssDir, 'global_reset_modal_challenge.png') });
        console.log('📸 Captured: screenshots/global_reset_modal_challenge.png');

        // Type exact 'RESET'
        console.log('Typing RESET token into security challenge...');
        await page.evaluate(() => {
            const input = document.getElementById('globalResetChallengeInput');
            input.value = 'RESET';
            window.checkGlobalResetInput('RESET');
        });

        const correctInputBtnDisabled = await page.evaluate(() => {
            const btn = document.getElementById('btnConfirmMasterReset');
            return btn ? btn.disabled : true;
        });
        if (correctInputBtnDisabled) throw new Error('Confirm button should become enabled when RESET is typed!');
        console.log('✅ Button successfully unlocked with verified RESET token!');

        // Confirm Global Reset
        await page.evaluate(async () => {
            await window.confirmGlobalReset();
        });
        await new Promise(r => setTimeout(r, 1200));

        // Verify all 14 modules are Default
        const allStatuses = await page.evaluate(() => {
            const cards = document.querySelectorAll('.accounts-config-card');
            return Array.from(cards).map(c => ({ id: c.getAttribute('data-module-id'), status: c.getAttribute('data-status') }));
        });
        console.log('All module statuses after global reset:', allStatuses.map(s => `${s.id}:${s.status}`).join(', '));
        const nonDefaults = allStatuses.filter(s => s.status !== 'Default');
        if (nonDefaults.length > 0) {
            throw new Error(`Expected all modules to be Default, found: ${JSON.stringify(nonDefaults)}`);
        }
        console.log('✅ Global Master Reset verified: All 14 modules restored to factory baseline defaults!');

        // 11. Test Role-Based Access Control (RBAC)
        console.log('10. Testing Role-Based Access Control (RBAC Restriction)...');
        await page.evaluate(() => {
            // Switch to a non-admin employee (Rohit Sharma - Sales Executive)
            window.switchActiveUser('EMP-102');
            window.navigate('accounts_config');
        });
        await new Promise(r => setTimeout(r, 800));

        const accessRestricted = await page.evaluate(() => {
            const main = document.getElementById('main-view');
            return main && (main.innerText.includes('Access Restricted') || main.innerText.includes('Super Admin Only'));
        });
        if (!accessRestricted) throw new Error('Non-admin user was not blocked from Accounts Configuration!');
        console.log('✅ RBAC Access Restriction verified: Non-admin users are strictly blocked with Access Restricted guard!');

        await page.screenshot({ path: path.join(ssDir, 'rbac_access_restricted.png') });
        console.log('📸 Captured: screenshots/rbac_access_restricted.png');

        // Return to admin
        await page.evaluate(() => {
            window.switchActiveUser('admin');
            window.navigate('accounts_config');
        });
        await new Promise(r => setTimeout(r, 600));

        console.log('🎉 ALL VERIFICATION TESTS PASSED FLAWLESSLY!');

    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runVerification();
