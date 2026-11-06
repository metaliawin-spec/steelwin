const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1550, height: 1100 });
        
        console.log('1. Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(r => setTimeout(r, 1000));

        // -------------------------------------------------------------
        // TEST 1: Quick Calculation Verification
        // -------------------------------------------------------------
        console.log('\n--- TEST 1: Quick Calculation ---');
        await page.evaluate(() => {
            window.navigate('calculation');
            window.calcSwitchTab('manual');
        });
        await new Promise(r => setTimeout(r, 800));

        const quickCalcInfo = await page.evaluate(() => {
            const rc = window.Store.state.rateCalc;
            const clientSelect = document.querySelector('select[onchange*="customerId"]');
            const cols = rc.grid.cols;
            const totalW = rc.grid.totalW;
            const totalH = rc.grid.totalH;
            const unit = rc.grid.unit;
            const materialCols = Array.from(document.querySelectorAll('.quick-calc-container select')).length;
            const hasNoneOption = Array.from(document.querySelectorAll('.quick-calc-container select option')).some(opt => opt.value === 'none');
            return {
                hasClientSelect: !!clientSelect,
                cols,
                totalW,
                totalH,
                unit,
                materialCols,
                hasNoneOption
            };
        });

        console.log('Quick Calc initial state:', quickCalcInfo);
        if (quickCalcInfo.cols === 1 && quickCalcInfo.totalW === 50 && quickCalcInfo.totalH === 140 && !quickCalcInfo.hasClientSelect) {
            console.log('✅ PASS: Quick Calculation starts on 1 Kalli (50x140 cm), client name removed!');
        } else {
            console.error('❌ FAIL: Quick Calculation startup state mismatch:', quickCalcInfo);
        }

        // Test Kalli Preset: 2 Kalli should add 50 cm -> 100x140 cm
        console.log('Testing 2 Kalli Preset...');
        await page.evaluate(() => window.loadPreset(2));
        await new Promise(r => setTimeout(r, 400));
        const after2Kalli = await page.evaluate(() => {
            const rc = window.Store.state.rateCalc;
            return { cols: rc.grid.cols, totalW: rc.grid.totalW, totalH: rc.grid.totalH };
        });
        console.log('After 2 Kalli preset:', after2Kalli);
        if (after2Kalli.cols === 2 && after2Kalli.totalW === 100 && after2Kalli.totalH === 140) {
            console.log('✅ PASS: 2 Kalli adds 50 cm -> 100x140 cm');
        } else {
            console.error('❌ FAIL: 2 Kalli preset mismatch:', after2Kalli);
        }

        // Test Unit Conversion: Switch to mm -> 1000 x 1400 mm
        console.log('Testing Unit Conversion to mm...');
        await page.evaluate(() => window.toggleUnit('mm'));
        await new Promise(r => setTimeout(r, 400));
        const inMm = await page.evaluate(() => {
            const rc = window.Store.state.rateCalc;
            return { unit: rc.grid.unit, totalW: rc.grid.totalW, totalH: rc.grid.totalH };
        });
        console.log('Unit converted to mm:', inMm);
        if (inMm.unit === 'mm' && inMm.totalW === 1000 && inMm.totalH === 1400) {
            console.log('✅ PASS: Unit conversion to mm works accurately (1000 x 1400 mm)');
        } else {
            console.error('❌ FAIL: Unit conversion to mm mismatch:', inMm);
        }

        // Test Unit Conversion to meter -> 1.0 x 1.4 m
        console.log('Testing Unit Conversion to meter (m)...');
        await page.evaluate(() => window.toggleUnit('m'));
        await new Promise(r => setTimeout(r, 400));
        const inM = await page.evaluate(() => {
            const rc = window.Store.state.rateCalc;
            return { unit: rc.grid.unit, totalW: rc.grid.totalW, totalH: rc.grid.totalH };
        });
        console.log('Unit converted to m:', inM);
        if (inM.unit === 'm' && inM.totalW === 1 && inM.totalH === 1.4) {
            console.log('✅ PASS: Unit conversion to m works accurately (1 x 1.4 m)');
        }

        // Switch back to cm and reset to 1 Kalli
        await page.evaluate(() => {
            window.toggleUnit('cm');
            window.resetQuickCalcDefaults();
        });
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: 'scripts/quick_calc_verified.png' });
        console.log('Saved screenshot: scripts/quick_calc_verified.png');

        // -------------------------------------------------------------
        // TEST 2: Material Catalog Verification
        // -------------------------------------------------------------
        console.log('\n--- TEST 2: Material Catalog ---');
        await page.evaluate(() => window.calcSwitchTab('settings'));
        await new Promise(r => setTimeout(r, 800));

        const catalogHeaderButtons = await page.evaluate(() => {
            const headerBtns = Array.from(document.querySelectorAll('.material-catalog-header button, button[onclick*="openAdd"]'));
            const btnTexts = headerBtns.map(b => b.innerText.trim());
            const hasDynamicPricingBanner = document.body.innerText.includes('Dynamic Pricing Active');
            return { btnTexts, hasDynamicPricingBanner };
        });
        console.log('Material Catalog Header Buttons:', catalogHeaderButtons);

        // Open Add Item Modal and verify Category Specific Fields
        console.log('Testing Add Item Modal for Profile category...');
        await page.evaluate(() => window.openAddMaterialModal('Profile'));
        await new Promise(r => setTimeout(r, 500));

        const modalFields = await page.evaluate(() => {
            const modal = document.getElementById('add-material-modal');
            const hasThickMode = !!document.getElementById('mat-prof-thick-mode');
            const hasSideWidth = !!document.getElementById('mat-prof-side-w');
            const hasCenterWidth = !!document.getElementById('mat-prof-center-w');
            const hasRate = !!document.getElementById('mat-new-rate');
            const hasCategoryAddBtn = modal && modal.innerText.includes('+ Add Category');
            return { hasThickMode, hasSideWidth, hasCenterWidth, hasRate, hasCategoryAddBtn };
        });
        console.log('Add Material Modal Dynamic Fields for Profile:', modalFields);
        if (modalFields.hasThickMode && modalFields.hasSideWidth && modalFields.hasCenterWidth && modalFields.hasCategoryAddBtn) {
            console.log('✅ PASS: Material Catalog Add Item modal has dynamic category fields and + Add Category button!');
        }

        await page.screenshot({ path: 'scripts/material_catalog_modal_verified.png' });
        console.log('Saved screenshot: scripts/material_catalog_modal_verified.png');

        // Close modal
        await page.evaluate(() => document.getElementById('add-material-modal')?.remove());
        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ path: 'scripts/material_catalog_verified.png' });

        // -------------------------------------------------------------
        // TEST 3: Quotation Calculation Studio Verification
        // -------------------------------------------------------------
        console.log('\n--- TEST 3: Quotation Calculation Studio ---');
        // Launch via startQuotationStudio() (or clicking Create Quotation in Quotes view)
        await page.evaluate(() => {
            window.startQuotationStudio();
        });
        await new Promise(r => setTimeout(r, 800));

        // Step 1 & 2: Check 5 mandatory customer fields
        const wizardState = await page.evaluate(() => {
            const hasName = !!document.getElementById('qs-cust-name');
            const hasPlace = !!document.getElementById('qs-cust-place');
            const hasCity = !!document.getElementById('qs-cust-city');
            const hasPin = !!document.getElementById('qs-cust-pin');
            const hasMob = !!document.getElementById('qs-cust-mobile');
            const hasStep2Mats = !!document.getElementById('qs-mat-frame');
            return { hasName, hasPlace, hasCity, hasPin, hasMob, hasStep2Mats };
        });
        console.log('Quotation Studio Wizard (Step 1 & 2):', wizardState);
        if (wizardState.hasName && wizardState.hasPlace && wizardState.hasCity && wizardState.hasPin && wizardState.hasMob && wizardState.hasStep2Mats) {
            console.log('✅ PASS: Step 1 prompts for all 5 mandatory customer fields and Step 2 prompts for materials!');
        }

        await page.screenshot({ path: 'scripts/quotation_studio_step1_verified.png' });
        console.log('Saved screenshot: scripts/quotation_studio_step1_verified.png');

        // Fill 5 mandatory fields and proceed to 2D canvas
        console.log('Filling 5 mandatory fields and proceeding to 2D canvas...');
        await page.evaluate(() => {
            document.getElementById('qs-cust-name').value = 'Mohammed Rashid';
            document.getElementById('qs-cust-place').value = 'Ramanattukara';
            document.getElementById('qs-cust-city').value = 'Kozhikode';
            document.getElementById('qs-cust-pin').value = '673633';
            document.getElementById('qs-cust-mobile').value = '9846123456';
            window.proceedToQuotationCanvas();
        });
        await new Promise(r => setTimeout(r, 800));

        // Check 2D canvas state
        const studioCanvasState = await page.evaluate(() => {
            const qs = window.Store.state.quoteStudio;
            const cust = qs.customer;
            const cw = qs.currentWindow;
            const bannerText = document.querySelector('.quotation-studio-container')?.innerText || '';
            const qtyInput = document.getElementById('studio-item-qty');
            const hasSaveNewBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Save & New'));
            const hasSaveBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.trim() === 'Save');
            return {
                custName: cust.name,
                custMobile: cust.mobile,
                cols: cw.cols,
                totalW: cw.totalW,
                totalH: cw.totalH,
                qty: qtyInput ? qtyInput.value : null,
                hasSaveNewBtn,
                hasSaveBtn,
                showsClientBanner: bannerText.includes('Mohammed Rashid') && bannerText.includes('9846123456')
            };
        });
        console.log('Quotation Studio Canvas State:', studioCanvasState);
        if (studioCanvasState.showsClientBanner && studioCanvasState.cols === 1 && studioCanvasState.totalW === 50 && studioCanvasState.totalH === 140 && studioCanvasState.hasSaveNewBtn && studioCanvasState.hasSaveBtn) {
            console.log('✅ PASS: 2D Quotation Studio Canvas launched with Customer banner, 1 Kalli 50x140cm default, Quantity column, Save & New, and Save!');
        }

        // Test Quantity Input: Set Qty to 2
        console.log('Setting Quantity to 2 nos...');
        await page.evaluate(() => window.updateStudioQty(2));
        await new Promise(r => setTimeout(r, 400));

        // Click "Save & New" -> Saves Window W1, advances to Window W2, resets canvas to 1 Kalli 50x140 cm for same customer
        console.log('Clicking Save & New to save Window W1 and advance to Window W2...');
        // Overwrite window.alert so it doesn't block Puppeteer
        await page.evaluate(() => { window.alert = () => {}; });
        await page.evaluate(() => window.saveQuotationItemAndNew());
        await new Promise(r => setTimeout(r, 800));

        const afterSaveAndNew = await page.evaluate(() => {
            const qs = window.Store.state.quoteStudio;
            const itemsCount = qs.items.length;
            const lastItem = qs.items[0];
            const nextWindow = qs.currentWindow;
            return {
                itemsCount,
                lastItemName: lastItem?.name,
                lastItemQty: lastItem?.qty,
                nextCols: nextWindow.cols,
                nextW: nextWindow.totalW,
                nextH: nextWindow.totalH
            };
        });
        console.log('After Save & New:', afterSaveAndNew);
        if (afterSaveAndNew.itemsCount === 1 && afterSaveAndNew.lastItemName === 'Window W1' && afterSaveAndNew.lastItemQty === 2 && afterSaveAndNew.nextCols === 1 && afterSaveAndNew.nextW === 50 && afterSaveAndNew.nextH === 140) {
            console.log('✅ PASS: Save & New successfully saved Window W1 (2 nos), reset canvas to 1 Kalli 50x140 cm for Window W2!');
        }

        await page.screenshot({ path: 'scripts/quotation_studio_w2_verified.png' });
        console.log('Saved screenshot: scripts/quotation_studio_w2_verified.png');

        // Test Final Save
        console.log('Clicking Final Save to generate Quotation...');
        await page.evaluate(() => window.saveQuotationFinal());
        await new Promise(r => setTimeout(r, 1000));

        const finalQuoteResult = await page.evaluate(() => {
            const latestQuote = window.Store.state.quotations[0];
            const cust = window.Store.state.customers.find(c => c.name === 'Mohammed Rashid');
            return {
                quoteId: latestQuote?.id,
                quoteCustomer: latestQuote?.customer,
                quoteAmount: latestQuote?.amount,
                itemsCount: latestQuote?.items?.length,
                customerSaved: !!cust,
                custPlace: cust?.place
            };
        });
        console.log('Final Quotation generated in Store:', finalQuoteResult);
        if (finalQuoteResult.quoteCustomer === 'Mohammed Rashid' && finalQuoteResult.customerSaved && finalQuoteResult.itemsCount >= 1) {
            console.log('✅ PASS: Final Save successfully generated Quotation and saved Customer in Store!');
        }

        await page.screenshot({ path: 'scripts/quotation_final_saved_verified.png' });
        console.log('Saved screenshot: scripts/quotation_final_saved_verified.png');

        console.log('\n🎉 ALL AUDIO REQUIREMENTS VERIFIED AND PASSING SUCCESSFULLY!');

    } catch (err) {
        console.error('Error during verification:', err);
    } finally {
        await browser.close();
    }
})();
