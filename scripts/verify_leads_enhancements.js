const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\e8678a5d-8292-411e-a0f4-593081e8a15b');

async function run() {
    console.log('=== VERIFYING LEADS ENHANCEMENTS & UI ALIGNMENT ===');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    try {
        console.log('1. Navigating to http://127.0.0.1:3000/ ...');
        await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0', timeout: 30000 });

        console.log('2. Navigating to Leads module...');
        await page.evaluate(async () => {
            // Dismiss startup alert if present
            const overdueModal = document.getElementById('overdue-invoices-alert-modal');
            if (overdueModal) overdueModal.remove();

            if (window.Store) {
                await window.Store.updateLeadStatus('LD-1010', 'New Lead', 'Test Setup');
            }
            if (window.navigate) window.navigate('leads');
        });
        await new Promise(r => setTimeout(r, 800));

        // Take a screenshot of the main Leads table with 'Currently Stage' column
        const tableScreenshotPath = path.join(ARTIFACT_DIR, 'leads_table_currently_stage.png');
        await page.screenshot({ path: tableScreenshotPath });
        console.log('✓ Captured table screenshot to:', tableScreenshotPath);

        // Requirement 2: Column Renaming & Cleanup
        console.log('3. Validating table columns & header renaming...');
        const tableHeaders = await page.evaluate(() => {
            const ths = Array.from(document.querySelectorAll('.leads-module-container table thead th'));
            return ths.map(th => th.innerText.trim());
        });
        console.log('Detected table headers:', tableHeaders);

        if (!tableHeaders.includes('CURRENTLY STAGE')) {
            throw new Error(`Expected column 'CURRENTLY STAGE' in headers, but found: ${tableHeaders.join(', ')}`);
        }
        if (tableHeaders.includes('PIPELINE STAGE') || tableHeaders.includes('MOVE STAGE')) {
            throw new Error(`Old column 'Pipeline Stage' or 'Move Stage' is still present!`);
        }
        console.log('✓ Header successfully renamed strictly to "Currently Stage"!');

        // Check that redundant inline dropdowns or action triggers in the column are removed
        const inlineDropdownCount = await page.evaluate(() => {
            return document.querySelectorAll('.leads-module-container table tbody select').length;
        });
        console.log('Detected inline dropdown selects in leads table:', inlineDropdownCount);
        if (inlineDropdownCount > 0) {
            throw new Error(`Found ${inlineDropdownCount} redundant inline select dropdowns in the table! They should be removed.`);
        }
        console.log('✓ Redundant inline dropdowns successfully removed!');

        // Requirement 3: Clickable status badge triggering Confirmation & Transition Modal
        console.log('4. Testing clickable status badge & Confirmation Modal...');
        const clickResult = await page.evaluate(() => {
            const btn = document.querySelector('.lead-stage-badge-btn');
            if (!btn) return { error: 'No badge found' };
            try {
                btn.click();
                const modal = document.getElementById('lead-stage-transition-modal-backdrop');
                return {
                    clicked: true,
                    btnText: btn.innerText.trim(),
                    btnId: btn.id,
                    modalFound: Boolean(modal),
                    activeTransition: window.activeStageTransition
                };
            } catch (e) {
                return { error: e.message, stack: e.stack };
            }
        });
        console.log('Click result:', clickResult);
        await new Promise(r => setTimeout(r, 500));

        // Verify the Confirmation & Transition Modal
        const modalInfo = await page.evaluate(() => {
            const modal = document.getElementById('lead-stage-transition-modal-backdrop');
            if (!modal) return null;
            const prompt = modal.querySelector('h4')?.innerText?.trim();
            const chips = Array.from(modal.querySelectorAll('.lead-stage-chip-btn')).map(c => c.dataset.stageKey);
            const updateBtn = modal.querySelector('#btn-update-lead-stage')?.innerText?.trim();
            return {
                exists: true,
                prompt,
                chips,
                updateBtn
            };
        });

        console.log('Modal inspection:', modalInfo);
        if (!modalInfo || !modalInfo.exists) {
            throw new Error('Confirmation & Transition Modal failed to open upon clicking the status badge!');
        }

        if (modalInfo.prompt !== 'Select the new stage for this lead') {
            throw new Error(`Modal prompt mismatch! Expected "Select the new stage for this lead", got: "${modalInfo.prompt}"`);
        }
        console.log('✓ Modal prompt asks: "Select the new stage for this lead"');

        const expectedChips = ['New Lead', 'Contacted', 'Qualified', 'Converted', 'Lost'];
        const chipsMatch = expectedChips.every(c => modalInfo.chips.includes(c));
        if (!chipsMatch) {
            throw new Error(`Expected stage chips: ${expectedChips.join(', ')}, but found: ${modalInfo.chips.join(', ')}`);
        }
        console.log('✓ Modal presents clean chips for: New Lead, Contacted, Qualified, Converted, and Lost!');

        if (!modalInfo.updateBtn || !modalInfo.updateBtn.includes('Update Stage')) {
            throw new Error(`Expected 'Update Stage' confirm button in modal, but found: "${modalInfo.updateBtn}"`);
        }
        console.log('✓ "Update Stage" confirmation button is present!');

        // Take a screenshot of the Transition Modal
        const modalScreenshotPath = path.join(ARTIFACT_DIR, 'leads_stage_transition_modal.png');
        await page.screenshot({ path: modalScreenshotPath });
        console.log('✓ Captured modal screenshot to:', modalScreenshotPath);

        // Select 'Contacted' stage chip
        console.log('5. Selecting "Contacted" stage chip and confirming update...');
        await page.click('button[data-stage-key="Contacted"]');
        await new Promise(r => setTimeout(r, 300));

        // Click "Update Stage"
        await page.click('#btn-update-lead-stage');
        await new Promise(r => setTimeout(r, 600));

        // Verify Toast Notification
        const toastText = await page.evaluate(() => {
            const toast = document.getElementById('lead-toast-banner');
            return toast ? toast.innerText.trim() : null;
        });
        console.log('Detected toast notification:', toastText);
        if (!toastText || !toastText.includes('Lead status updated to Contacted')) {
            throw new Error(`Expected toast "Lead status updated to Contacted", but got: "${toastText}"`);
        }
        console.log('✓ Toast notification successfully confirmed: "Lead status updated to Contacted"!');

        // Verify that the table badge updated to 'Contacted'
        const updatedBadgeText = await page.evaluate(() => {
            const btn = document.querySelector('.lead-stage-badge-btn');
            return btn ? btn.innerText.trim() : null;
        });
        console.log('Updated lead status badge in table:', updatedBadgeText);
        if (!updatedBadgeText || !updatedBadgeText.includes('Contacted')) {
            throw new Error(`Lead table badge failed to update to Contacted! Current badge: "${updatedBadgeText}"`);
        }
        console.log('✓ Lead stage state change successfully persisted and reflected in table UI!');

        // Requirement 1: Lead Details Preview Drawer / Modal Alignment
        console.log('6. Testing Lead Details Preview Drawer viewport alignment...');
        const clickDropdown = await page.evaluate(() => {
            const btn = document.querySelector('button[onclick*="toggleLeadRowActions"]');
            if (!btn) return { error: 'No 3-dot button found' };
            // Simulate button click with event
            const event = new MouseEvent('click', { bubbles: true, cancelable: true });
            btn.dispatchEvent(event);
            const dropdown = document.getElementById('lead-row-actions-dropdown');
            const viewBtn = dropdown ? dropdown.querySelector('button[data-testid*="lead-action-view"]') : null;
            if (viewBtn) {
                viewBtn.click();
                return {
                    dropdownOpened: true,
                    viewBtnText: viewBtn.innerText.trim(),
                    drawerOpened: Boolean(document.getElementById('lead-details-drawer-backdrop'))
                };
            }
            return {
                dropdownOpened: Boolean(dropdown),
                viewBtnFound: Boolean(viewBtn)
            };
        });
        console.log('Dropdown & View click result:', clickDropdown);
        if (!clickDropdown || !clickDropdown.dropdownOpened) {
            throw new Error(`Failed to open 3-dot row actions dropdown! Info: ${JSON.stringify(clickDropdown)}`);
        }
        await new Promise(r => setTimeout(r, 600));

        // Verify Drawer positioning and dimensions
        const drawerMetrics = await page.evaluate(() => {
            const backdrop = document.getElementById('lead-details-drawer-backdrop');
            const panel = document.querySelector('.lead-drawer-panel');
            if (!backdrop || !panel) return null;

            const bRect = backdrop.getBoundingClientRect();
            const pRect = panel.getBoundingClientRect();
            const winH = window.innerHeight;
            const winW = window.innerWidth;

            return {
                backdropTop: bRect.top,
                backdropHeight: bRect.height,
                backdropBottom: bRect.bottom,
                panelTop: pRect.top,
                panelHeight: pRect.height,
                panelRight: pRect.right,
                panelWidth: pRect.width,
                windowHeight: winH,
                windowWidth: winW,
                zIndex: window.getComputedStyle(backdrop).zIndex
            };
        });

        console.log('Drawer metrics:', drawerMetrics);
        if (!drawerMetrics) {
            throw new Error('Lead Details slide-over drawer failed to open!');
        }

        // Check vertical alignment: panelTop must be 0 and height must equal viewport height (full-height docked drawer)
        if (drawerMetrics.panelTop !== 0) {
            throw new Error(`Vertical offset issue! Drawer panel top is ${drawerMetrics.panelTop}px, expected 0px`);
        }
        if (Math.abs(drawerMetrics.panelHeight - drawerMetrics.windowHeight) > 2) {
            throw new Error(`Drawer height ${drawerMetrics.panelHeight}px does not match window height ${drawerMetrics.windowHeight}px!`);
        }
        console.log('✓ Slide-over drawer is docked full-height at top: 0 with 0px vertical offset!');

        // Take a screenshot of the aligned full-height slide-over drawer
        const drawerScreenshotPath = path.join(ARTIFACT_DIR, 'leads_preview_drawer_alignment.png');
        await page.screenshot({ path: drawerScreenshotPath });
        console.log('✓ Captured drawer alignment screenshot to:', drawerScreenshotPath);

        // Close drawer
        await page.evaluate(() => {
            if (window.closeLeadDetails) window.closeLeadDetails();
        });
        await new Promise(r => setTimeout(r, 400));

        const drawerClosed = await page.evaluate(() => {
            return document.getElementById('lead-details-drawer-backdrop') === null;
        });
        if (!drawerClosed) {
            throw new Error('Drawer failed to close cleanly!');
        }
        console.log('✓ Drawer closed cleanly!');

        console.log('\n==================================================');
        console.log('ALL LEADS MODULE SPECIFICATIONS VERIFIED 100% PASS!');
        console.log('==================================================\n');

    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

run();
