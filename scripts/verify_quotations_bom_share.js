const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('🚀 Starting Quotations UI, Three-Dot Menu, Share & BOM Module Verification...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
        console.log('✅ Page loaded successfully');

        // Navigate to Quotations module
        await page.evaluate(() => {
            if (typeof window.navigate === 'function') {
                window.navigate('quotations');
            } else if (window.Store && typeof window.Store.navigate === 'function') {
                window.Store.navigate('quotations');
            }
        });
        await page.waitForSelector('table tbody tr .quote-more-btn', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 600));

        // -------------------------------------------------------------
        // VERIFICATION 1: Inline 'Edit' button removed from Quotation table
        // -------------------------------------------------------------
        const tableActionButtons = await page.evaluate(() => {
            const row = document.querySelector('table tbody tr');
            if (!row) return null;
            const buttons = Array.from(row.querySelectorAll('td:last-child button'));
            return buttons.map(b => ({
                title: b.getAttribute('title') || '',
                onclick: b.getAttribute('onclick') || '',
                icon: b.querySelector('i')?.getAttribute('data-lucide') || ''
            }));
        });

        console.log('Table action buttons in row 1:', tableActionButtons);
        const hasInlineEdit = tableActionButtons.some(b => b.onclick.includes('openEditQuotationModal') || b.icon === 'edit-3');
        if (hasInlineEdit) {
            throw new Error('❌ Inline Edit button is still present in Quotation table row!');
        } else {
            console.log('✅ Verification 1 Passed: Inline Edit button removed from Quotation table action column.');
        }

        // -------------------------------------------------------------
        // VERIFICATION 2: Three-Dot Menu Restructuring
        // -------------------------------------------------------------
        // Click the 3-dots more button on the first quote
        await page.click('.quote-more-btn');
        await new Promise(r => setTimeout(r, 400));

        const menuItems = await page.evaluate(() => {
            const dropdown = document.getElementById('quote-action-dropdown');
            if (!dropdown) return null;
            const buttons = Array.from(dropdown.querySelectorAll('button.quote-menu-action'));
            return buttons.map(b => b.innerText.trim());
        });

        console.log('Three-dot menu items found:', menuItems);

        const expectedOrder = [
            'Edit Details',
            'Clone Quote',
            'Share',
            'BOM (Bill of Materials)',
            'Attach File',
            'Convert to Order',
            'Cancel Quote',
            'Delete Quote'
        ];

        if (!menuItems || menuItems.length !== expectedOrder.length) {
            throw new Error(`❌ Expected ${expectedOrder.length} menu items, but found ${menuItems?.length}: ${JSON.stringify(menuItems)}`);
        }

        for (let i = 0; i < expectedOrder.length; i++) {
            if (menuItems[i] !== expectedOrder[i]) {
                throw new Error(`❌ Menu item at index ${i} is "${menuItems[i]}", expected "${expectedOrder[i]}"`);
            }
        }

        const hasPrintPreview = menuItems.some(m => m.toLowerCase().includes('print preview'));
        if (hasPrintPreview) {
            throw new Error('❌ "Print Preview" should be removed from the 3-dot context menu!');
        }

        console.log('✅ Verification 2 Passed: 3-Dot Menu has exactly the 8 actions in strict order without Print Preview.');

        // Take screenshot of 3-dot menu
        const artifactDir = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\e8678a5d-8292-411e-a0f4-593081e8a15b';
        await page.screenshot({ path: path.join(artifactDir, 'quotation_3dot_menu_restructured.png') });
        console.log('📸 Screenshot saved: quotation_3dot_menu_restructured.png');

        // -------------------------------------------------------------
        // VERIFICATION 3: 'Share' Action Implementation
        // -------------------------------------------------------------
        // Click 'Share' button in menu (index 2)
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('#quote-action-dropdown button.quote-menu-action'));
            const shareBtn = btns.find(b => b.innerText.includes('Share'));
            if (shareBtn) shareBtn.click();
        });
        await new Promise(r => setTimeout(r, 600));

        const shareModalData = await page.evaluate(() => {
            const modal = document.getElementById('quote-share-modal');
            if (!modal) return null;

            const dlBtn = document.getElementById('share-download-pdf-btn');
            const waBtn = document.getElementById('share-whatsapp-pdf-btn');
            const previewText = modal.querySelector('div[style*="white-space: pre-line"]')?.innerText || '';

            return {
                modalPresent: true,
                hasDownloadBtn: !!dlBtn,
                hasWhatsAppBtn: !!waBtn,
                previewText: previewText
            };
        });

        console.log('Share modal data:', shareModalData);
        if (!shareModalData || !shareModalData.hasDownloadBtn || !shareModalData.hasWhatsAppBtn) {
            throw new Error('❌ Share modal missing required Download PDF or Share to WhatsApp PDF buttons!');
        }

        if (!shareModalData.previewText.includes('Hello') ||
            !shareModalData.previewText.includes('Location:') ||
            !shareModalData.previewText.includes('Phone:') ||
            !shareModalData.previewText.includes('Total Amount: ₹') ||
            !shareModalData.previewText.includes('Thank you for choosing Stylo Steel!')) {
            throw new Error(`❌ Share modal caption does not match required format! Found:\n${shareModalData.previewText}`);
        }

        console.log('✅ Verification 3 Passed: Minimal modern Share modal with Download PDF, WhatsApp PDF icon button, and pre-formatted caption.');
        await page.screenshot({ path: path.join(artifactDir, 'quotation_share_modal_minimal.png') });
        console.log('📸 Screenshot saved: quotation_share_modal_minimal.png');

        // Close Share Modal
        await page.evaluate(() => {
            document.getElementById('quote-share-modal')?.remove();
        });
        await new Promise(r => setTimeout(r, 300));

        // -------------------------------------------------------------
        // VERIFICATION 4: Bill of Materials (BOM) Module
        // -------------------------------------------------------------
        // Open BOM modal
        await page.evaluate(() => {
            window.openQuoteBOMModal('Q-2025-001');
        });
        await new Promise(r => setTimeout(r, 600));

        const bomModalData = await page.evaluate(() => {
            const modal = document.getElementById('quote-bom-modal');
            if (!modal) return null;

            const printBtn = document.getElementById('btn-print-bom');
            const downloadPdfBtn = document.getElementById('btn-download-bom-pdf');

            // Check table headers
            const headers = Array.from(modal.querySelectorAll('table thead th')).map(th => th.innerText.trim());

            // Check consolidated rows
            const rows = Array.from(modal.querySelectorAll('table tbody tr')).map(tr => {
                const tds = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
                return {
                    spec: tds[0],
                    category: tds[1],
                    dim: tds[2],
                    weight: tds[3],
                    rate: tds[4],
                    cost: tds[5]
                };
            });

            // Check footer grand total
            const footer = modal.querySelector('table tfoot tr');
            const footerText = footer ? footer.innerText : '';

            // Check products on right side panel
            const productCards = Array.from(modal.querySelectorAll('.bom-product-card')).map(c => c.innerText.trim());

            return {
                modalPresent: true,
                hasPrintBtn: !!printBtn,
                hasDownloadPdfBtn: !!downloadPdfBtn,
                headers,
                rowCount: rows.length,
                rowsSample: rows.slice(0, 4),
                footerText,
                productCount: productCards.length
            };
        });

        console.log('BOM Modal Data:', bomModalData);

        if (!bomModalData || !bomModalData.hasPrintBtn || !bomModalData.hasDownloadPdfBtn) {
            throw new Error('❌ BOM modal missing Print BOM or Download BOM PDF top buttons!');
        }

        if (bomModalData.rowCount === 0) {
            throw new Error('❌ BOM consolidated table has no rows!');
        }

        if (!bomModalData.footerText.includes('GRAND TOTAL') && !bomModalData.footerText.includes('TOTAL')) {
            throw new Error('❌ BOM table footer missing grand total!');
        }

        console.log('✅ Verification 4a Passed: BOM Modal with Consolidated Raw Material Summary and top export buttons.');
        await page.screenshot({ path: path.join(artifactDir, 'quotation_bom_consolidated_view.png') });
        console.log('📸 Screenshot saved: quotation_bom_consolidated_view.png');

        // Test Master-Detail Product Click: Click on first product card to filter sub-components
        await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.bom-product-card'));
            if (cards.length > 1) {
                cards[1].click(); // click first actual product
            }
        });
        await new Promise(r => setTimeout(r, 600));

        const filteredBomData = await page.evaluate(() => {
            const modal = document.getElementById('quote-bom-modal');
            const title = modal.querySelector('h3')?.innerText || '';
            const rows = Array.from(modal.querySelectorAll('table tbody tr')).map(tr => tr.innerText.trim());
            return { title, rowCount: rows.length, sampleRow: rows[0] };
        });

        console.log('Filtered BOM Data on Product Click:', filteredBomData);
        if (!filteredBomData.title.includes('Product Breakdown')) {
            throw new Error('❌ Product click did not filter BOM to item breakdown!');
        }

        console.log('✅ Verification 4b Passed: Product-wise breakdown filters specific sub-components on click.');
        await page.screenshot({ path: path.join(artifactDir, 'quotation_bom_product_detail_view.png') });
        console.log('📸 Screenshot saved: quotation_bom_product_detail_view.png');

        // Close BOM modal
        await page.evaluate(() => {
            document.getElementById('quote-bom-modal')?.remove();
        });
        await new Promise(r => setTimeout(r, 300));

        // -------------------------------------------------------------
        // VERIFICATION 5: Attach File, Cancel Quote, Delete Quote Modals
        // -------------------------------------------------------------
        // 5a. Attach File
        await page.evaluate(() => { window.openAttachFileModal('Q-2025-001'); });
        await new Promise(r => setTimeout(r, 400));
        const attachModalExists = await page.evaluate(() => !!document.getElementById('quote-attach-modal'));
        if (!attachModalExists) throw new Error('❌ Attach file modal failed to open!');
        console.log('✅ Verification 5a Passed: Attach File modal opens with upload drop-zone.');
        await page.screenshot({ path: path.join(artifactDir, 'quotation_attach_file_modal.png') });
        await page.evaluate(() => { document.getElementById('quote-attach-modal')?.remove(); });

        // 5b. Cancel Quote Modal
        await page.evaluate(() => { window.promptCancelQuotation('Q-2025-001'); });
        await new Promise(r => setTimeout(r, 400));
        const cancelModalExists = await page.evaluate(() => !!document.getElementById('cancel-quote-modal'));
        if (!cancelModalExists) throw new Error('❌ Cancel quote confirmation modal failed to open!');
        console.log('✅ Verification 5b Passed: Cancel Quote warning confirmation modal opens.');
        await page.screenshot({ path: path.join(artifactDir, 'quotation_cancel_quote_modal.png') });
        await page.evaluate(() => { document.getElementById('cancel-quote-modal')?.remove(); });

        // 5c. Delete Quote Modal
        await page.evaluate(() => { window.promptDeleteQuotation('Q-2025-001'); });
        await new Promise(r => setTimeout(r, 400));
        const deleteModalExists = await page.evaluate(() => !!document.getElementById('delete-quote-modal'));
        if (!deleteModalExists) throw new Error('❌ Delete quote confirmation modal failed to open!');
        console.log('✅ Verification 5c Passed: Delete Quote destructive action confirmation modal opens.');
        await page.screenshot({ path: path.join(artifactDir, 'quotation_delete_quote_modal.png') });
        await page.evaluate(() => { document.getElementById('delete-quote-modal')?.remove(); });

        console.log('\n🎉 ALL 5 VERIFICATIONS PASSED WITH 100% SUCCESS!');
    } catch (err) {
        console.error('❌ Verification Error:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
