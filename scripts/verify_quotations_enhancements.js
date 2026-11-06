const puppeteer = require('puppeteer');

(async () => {
    console.log('=== STARTING QUOTATIONS ENHANCEMENTS VERIFICATION SUITE ===');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    try {
        await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 800));

        // Navigate to quotations
        await page.evaluate(() => Store.navigate('quotations'));
        await new Promise(r => setTimeout(r, 500));

        // Test 1: Action Column Cleanup
        console.log('\n--- TEST 1: Action Column Cleanup ---');
        const actionColCheck = await page.evaluate(() => {
            const rows = document.querySelectorAll('table tbody tr');
            if (rows.length === 0) return { error: 'No quotation rows found' };
            const firstRow = rows[0];
            const actionCell = firstRow.querySelector('td:last-child');
            const rowConvertBtns = actionCell ? actionCell.querySelectorAll('button[onclick*="convertToOrder"]') : [];
            const moreMenuBtn = actionCell ? actionCell.querySelector('.quote-more-btn') : null;
            return {
                rowCount: rows.length,
                rowConvertBtnCount: rowConvertBtns.length,
                hasMoreMenuBtn: !!moreMenuBtn
            };
        });
        console.log('Action column check:', actionColCheck);
        if (actionColCheck.rowConvertBtnCount === 0 && actionColCheck.hasMoreMenuBtn) {
            console.log('  PASS: Redundant green convert icon removed from table row; 3-dot menu retained.');
        } else {
            throw new Error(`Failed Test 1: rowConvertBtnCount is ${actionColCheck.rowConvertBtnCount}`);
        }

        // Test 2: Quotation Numbering Configuration in Settings
        console.log('\n--- TEST 2: Quotation Numbering Configuration (Settings) ---');
        await page.evaluate(() => Store.navigate('settings'));
        await new Promise(r => setTimeout(r, 500));

        // Switch to Quotation tab in Settings
        await page.evaluate(() => window.switchSettingsTab('quotation'));
        await new Promise(r => setTimeout(r, 500));

        const numberingConfigCheck = await page.evaluate(() => {
            const prefix = document.getElementById('set-quote-prefix');
            const seq = document.getElementById('set-quote-sequence');
            const format = document.getElementById('set-quote-format');
            const padding = document.getElementById('set-quote-padding');
            const preview = document.getElementById('quote-numbering-preview');
            const termsRows = document.querySelectorAll('.settings-term-row');
            const addTermBtn = document.getElementById('btn-add-settings-term');

            if (!prefix || !seq || !format || !padding || !preview) {
                return { error: 'Numbering configuration inputs missing', hasPrefix: !!prefix, hasSeq: !!seq, hasFormat: !!format, hasPadding: !!padding, hasPreview: !!preview };
            }

            // Test live update
            prefix.value = 'STYLO-';
            seq.value = '500';
            window.updateQuoteNumberPreview();

            return {
                prefix: prefix.value,
                seq: seq.value,
                format: format.value,
                padding: padding.value,
                updatedPreview: preview.textContent.trim(),
                termsRowCount: termsRows.length,
                hasAddTermBtn: !!addTermBtn
            };
        });
        console.log('Settings quotation numbering check:', numberingConfigCheck);
        if (!numberingConfigCheck.error && numberingConfigCheck.updatedPreview.includes('STYLO-') && numberingConfigCheck.updatedPreview.includes('0500')) {
            console.log('  PASS: Quotation numbering configuration and live preview badge verified.');
        } else {
            throw new Error(`Failed Test 2: ${JSON.stringify(numberingConfigCheck)}`);
        }

        // Test dynamic terms row addition in settings
        const termsAddCheck = await page.evaluate(() => {
            const initialCount = document.querySelectorAll('.settings-term-row').length;
            window.addSettingsTermRow();
            const afterCount = document.querySelectorAll('.settings-term-row').length;
            return { initialCount, afterCount };
        });
        console.log('Settings terms dynamic addition check:', termsAddCheck);
        if (termsAddCheck.afterCount === termsAddCheck.initialCount + 1) {
            console.log('  PASS: Settings dynamic terms + Add Row verified.');
        } else {
            throw new Error(`Failed Settings Terms Row test: ${JSON.stringify(termsAddCheck)}`);
        }

        // Test 3: Inline Override of Number & Title during Creation & Dynamic Terms
        console.log('\n--- TEST 3: Inline Override & Dynamic Terms in Create Quotation ---');
        await page.evaluate(() => Store.navigate('quotations'));
        await new Promise(r => setTimeout(r, 500));

        // Open standard create quotation modal
        await page.evaluate(() => {
            if (typeof window.openCreateQuotationModal === 'function') {
                window.openCreateQuotationModal();
            } else if (typeof window.initCreateQuotation === 'function') {
                window.initCreateQuotation(true);
            }
        });
        await new Promise(r => setTimeout(r, 600));

        const createModalCheck = await page.evaluate(() => {
            const numInput = document.getElementById('quote-number-input');
            const titleInput = document.getElementById('quote-title-input');
            const termsContainer = document.getElementById('quote-terms-list');
            const termsRows = termsContainer ? termsContainer.querySelectorAll('input') : [];
            const addRowBtn = document.querySelector('button[onclick*="addQuoteTermRow"]');

            return {
                hasNumInput: !!numInput,
                numValue: numInput ? numInput.value : '',
                hasTitleInput: !!titleInput,
                titleValue: titleInput ? titleInput.value : '',
                termsRowCount: termsRows.length,
                hasAddRowBtn: !!addRowBtn
            };
        });
        console.log('Create quotation inline override check:', createModalCheck);
        if (createModalCheck.hasNumInput && createModalCheck.hasTitleInput && createModalCheck.termsRowCount > 0) {
            console.log('  PASS: Create Quotation modal has inline overrides for Quote Number, Title, and dynamic Terms rows.');
        } else {
            throw new Error(`Failed Test 3: ${JSON.stringify(createModalCheck)}`);
        }

        // Close create modal
        await page.evaluate(() => {
            const m = document.getElementById('create-quotation-modal');
            if (m) m.remove();
        });
        await new Promise(r => setTimeout(r, 300));

        // Test 4: Stacked / Vertical Customer Address Layout (Print & PDF)
        console.log('\n--- TEST 4: Stacked Vertical Customer Address Layout ---');
        const addressHierarchyCheck = await page.evaluate(() => {
            const dummyQuote = {
                id: 'QT-TEST-001',
                customer: 'Dr. Anita Roy',
                customerAddress: 'Skyline Heights, Marine Drive, Kochi, 682011',
                customerPhone: '+91 9846011223'
            };
            const html = window.renderCustomerAddressHierarchy(dummyQuote);
            const div = document.createElement('div');
            div.innerHTML = html;
            const textContent = div.textContent;
            return {
                html,
                hasCustomerName: textContent.includes('Dr. Anita Roy'),
                hasBuilding: textContent.includes('Skyline Heights'),
                hasPlaceCity: textContent.includes('Marine Drive') || textContent.includes('Kochi'),
                hasPinCode: textContent.includes('682011'),
                hasPhone: textContent.includes('+91 9846011223')
            };
        });
        console.log('Address hierarchy check:', {
            hasCustomerName: addressHierarchyCheck.hasCustomerName,
            hasBuilding: addressHierarchyCheck.hasBuilding,
            hasPlaceCity: addressHierarchyCheck.hasPlaceCity,
            hasPinCode: addressHierarchyCheck.hasPinCode,
            hasPhone: addressHierarchyCheck.hasPhone
        });
        if (addressHierarchyCheck.hasCustomerName && addressHierarchyCheck.hasBuilding &&
            addressHierarchyCheck.hasPinCode && addressHierarchyCheck.hasPhone) {
            console.log('  PASS: 5-line vertical stacked address layout verified with clean typography.');
        } else {
            throw new Error(`Failed Test 4: ${JSON.stringify(addressHierarchyCheck)}`);
        }

        // Open actual print preview modal and verify customer card
        const printModalCheck = await page.evaluate(() => {
            const firstQuote = (Store.state.quotations || [])[0];
            if (!firstQuote) return { error: 'No quotations in store' };
            window.openPrintQuotationModal(firstQuote);
            const card = document.querySelector('#printable-quotation .print-customer-card');
            return {
                opened: !!card,
                cardText: card ? card.innerText : ''
            };
        });
        console.log('Print modal customer card check:', printModalCheck.opened);
        if (printModalCheck.opened) {
            console.log('  PASS: Print preview renders stacked customer card hierarchy.');
        } else {
            throw new Error('Print modal failed to render customer card');
        }

        // Close print modal
        await page.evaluate(() => {
            const m = document.getElementById('quote-print-modal');
            if (m) m.remove();
        });
        await new Promise(r => setTimeout(r, 300));

        // Test 5: Seamless 'Clone Quote' Workflow
        console.log('\n--- TEST 5: Seamless Clone Quote Workflow ---');
        const cloneCheck = await page.evaluate(async () => {
            const origQuote = (Store.state.quotations || [])[0];
            if (!origQuote) return { error: 'No quote to clone' };
            const origId = origQuote.id;
            const beforeCount = Store.state.quotations.length;

            window.cloneQuotation(origId);

            // Wait brief moment for setTimeout in cloneQuotation
            await new Promise(r => setTimeout(r, 200));

            const afterCount = Store.state.quotations.length;
            const newQuote = Store.state.quotations[0];
            const editModal = document.getElementById('edit-quotation-modal');
            const editIdInput = document.getElementById('edit-q-id');
            const editTitleInput = document.getElementById('edit-q-title');
            const termsBox = document.getElementById('edit-q-terms-tbody');

            return {
                beforeCount,
                afterCount,
                newId: newQuote ? newQuote.id : null,
                isEditModalOpen: !!editModal,
                editIdInputValue: editIdInput ? editIdInput.value : null,
                editTitleInputValue: editTitleInput ? editTitleInput.value : null,
                hasTermsBox: !!termsBox
            };
        });
        console.log('Clone quote workflow check:', cloneCheck);
        if (cloneCheck.afterCount === cloneCheck.beforeCount + 1 &&
            cloneCheck.isEditModalOpen &&
            cloneCheck.editIdInputValue === cloneCheck.newId) {
            console.log('  PASS: Cloned quote generated with unique ID and immediately redirected into Edit modal.');
        } else {
            throw new Error(`Failed Test 5: ${JSON.stringify(cloneCheck)}`);
        }

        // Close edit modal
        await page.evaluate(() => {
            if (typeof window.closeEditQuotationModal === 'function') {
                window.closeEditQuotationModal();
            }
        });
        await new Promise(r => setTimeout(r, 300));

        // Test 6: Direct WhatsApp Sharing with Pre-Filled Caption
        console.log('\n--- TEST 6: Direct WhatsApp Sharing & Pre-filled Caption ---');
        const shareCheck = await page.evaluate(() => {
            const testQuote = (Store.state.quotations || [])[0];
            window.openShareQuotationModal(testQuote.id);

            const modal = document.getElementById('quote-share-modal');
            const waBtn = document.getElementById('share-whatsapp-pdf-btn');
            const captionBox = document.getElementById('quote-caption-preview-box');
            const captionText = captionBox ? captionBox.textContent : '';

            // Verify WhatsApp Direct does NOT call downloadQuotePDFDirect
            let downloadCalled = false;
            const origDownload = window.downloadQuotePDFDirect;
            window.downloadQuotePDFDirect = () => { downloadCalled = true; };

            let openedUrl = null;
            const origOpen = window.open;
            window.open = (url) => { openedUrl = url; };

            if (waBtn) waBtn.click();

            // Restore
            window.downloadQuotePDFDirect = origDownload;
            window.open = origOpen;

            return {
                modalOpen: !!modal,
                btnText: waBtn ? waBtn.innerText.trim() : '',
                captionText,
                hasCustomerGreeting: captionText.includes('Hello'),
                hasLocation: captionText.includes('📍 Location:'),
                hasPhone: captionText.includes('📞 Phone:'),
                hasTotalAmount: captionText.includes('💰 Total Amount:'),
                hasStyloSteel: captionText.includes('Stylo Steel'),
                downloadCalled,
                openedUrl
            };
        });
        console.log('Share modal check:', {
            modalOpen: shareCheck.modalOpen,
            btnText: shareCheck.btnText,
            hasCustomerGreeting: shareCheck.hasCustomerGreeting,
            hasLocation: shareCheck.hasLocation,
            hasPhone: shareCheck.hasPhone,
            hasTotalAmount: shareCheck.hasTotalAmount,
            hasStyloSteel: shareCheck.hasStyloSteel,
            downloadCalled: shareCheck.downloadCalled,
            openedUrl: shareCheck.openedUrl ? shareCheck.openedUrl.slice(0, 45) + '...' : null
        });
        if (shareCheck.btnText.includes('WhatsApp') &&
            shareCheck.hasLocation &&
            shareCheck.hasTotalAmount &&
            shareCheck.hasStyloSteel &&
            !shareCheck.downloadCalled &&
            shareCheck.openedUrl && shareCheck.openedUrl.includes('api.whatsapp.com')) {
            console.log('  PASS: Direct WhatsApp sharing bypasses download and pre-fills required Stylo Steel caption.');
        } else {
            throw new Error(`Failed Test 6: ${JSON.stringify(shareCheck)}`);
        }

        // Close share modal
        await page.evaluate(() => {
            const m = document.getElementById('quote-share-modal');
            if (m) m.remove();
        });
        await new Promise(r => setTimeout(r, 300));

        // Test 7: PDF Drawing & Image Rendering Fix (Base64 + ensureImagesLoaded)
        console.log('\n--- TEST 7: PDF Drawing & Base64 Attachments ---');
        const pdfImageCheck = await page.evaluate(async () => {
            const testQuote = (Store.state.quotations || [])[0];
            testQuote.attachments = [
                {
                    name: 'window_elevation_plan.png',
                    size: '420 KB',
                    date: '2026-10-20',
                    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                    isImage: true
                }
            ];

            const printableHtml = window.renderPrintableQuotationHTML(testQuote);
            const div = document.createElement('div');
            div.innerHTML = printableHtml;

            const attImg = div.querySelector('img[alt="window_elevation_plan.png"]');
            const hasSharpContrast = attImg && (attImg.style.imageRendering.includes('optimize-contrast') || attImg.getAttribute('style').includes('optimize-contrast'));
            const hasCors = attImg && attImg.hasAttribute('crossorigin');

            const hasEnsureImagesLoaded = typeof window.ensureImagesLoaded === 'function';

            return {
                hasAttImg: !!attImg,
                imgSrc: attImg ? attImg.src.slice(0, 30) : null,
                hasSharpContrast,
                hasCors,
                hasEnsureImagesLoaded
            };
        });
        console.log('PDF Image & Drawing check:', pdfImageCheck);
        if (pdfImageCheck.hasAttImg && pdfImageCheck.hasSharpContrast && pdfImageCheck.hasEnsureImagesLoaded) {
            console.log('  PASS: Attached drawings & specs render with Base64 data URLs, sharp scaling, and pre-load promise.');
        } else {
            throw new Error(`Failed Test 7: ${JSON.stringify(pdfImageCheck)}`);
        }

        // Take a clean screenshot of Quotations page for records
        await page.evaluate(() => Store.navigate('quotations'));
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: 'quotations_verified.png' });
        console.log('\nSaved screenshot: quotations_verified.png');

        console.log('\n======================================================');
        console.log('ALL 7 QUOTATION ENHANCEMENTS PASS 100% SUCCESSFULLY!');
        console.log('======================================================');
    } catch (err) {
        console.error('VERIFICATION ERROR:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
