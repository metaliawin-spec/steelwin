const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\e8678a5d-8292-411e-a0f4-593081e8a15b');

async function run() {
    console.log('Launching browser for verification...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    try {
        console.log('1. Navigating to http://localhost:3000/ ...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 30000 });

        // Navigate to Leads module
        console.log('2. Navigating to Leads module...');
        await page.evaluate(() => {
            if (window.navigate) window.navigate('leads');
        });
        await new Promise(r => setTimeout(r, 800));

        // Open New Lead Registration Form
        console.log('3. Opening New Lead Registration form...');
        await page.evaluate(() => {
            if (window.openNewLeadForm) window.openNewLeadForm();
        });
        await new Promise(r => setTimeout(r, 800));

        // Verify the 6 products
        const productsInfo = await page.evaluate(() => {
            const chips = Array.from(document.querySelectorAll('#lead-products-chips-grid .lead-product-chip'));
            return chips.map(c => {
                const name = c.querySelector('.product-chip-name')?.innerText?.trim();
                const badge = c.querySelector('.product-chip-badge')?.innerText?.trim();
                const checkbox = c.querySelector('input[type="checkbox"]');
                return {
                    name,
                    badge,
                    checked: checkbox?.checked,
                    value: checkbox?.value
                };
            });
        });

        console.log('Detected Lead Product Requirement Chips:', JSON.stringify(productsInfo, null, 2));

        const expectedProducts = ['Door', 'Door Frame', 'Window', 'Fancy Window', 'Decor', 'CNC'];
        const foundNames = productsInfo.map(p => p.name);
        const allPresent = expectedProducts.every(ep => foundNames.includes(ep));
        if (!allPresent) {
            throw new Error(`Product requirements mismatch! Expected: ${expectedProducts.join(', ')}, Found: ${foundNames.join(', ')}`);
        }
        console.log('✓ All 6 required products are present in the multi-select chips grid!');

        // Test clicking "Door", "Window", "CNC"
        console.log('4. Selecting Door, Window, CNC chips...');
        await page.evaluate(() => {
            const chips = Array.from(document.querySelectorAll('#lead-products-chips-grid .lead-product-chip'));
            chips.forEach(c => {
                const name = c.querySelector('.product-chip-name')?.innerText?.trim();
                if (['Door', 'Window', 'CNC'].includes(name)) {
                    const cb = c.querySelector('input[type="checkbox"]');
                    if (cb && !cb.checked) {
                        cb.click();
                    }
                }
            });
        });
        await new Promise(r => setTimeout(r, 400));

        // Fill Lead details
        await page.evaluate(() => {
            const name = document.getElementById('lead_name');
            const phone = document.getElementById('lead_phone');
            if (name) name.value = 'Dr. Faizal Rahman';
            if (phone) phone.value = '9847112233';
        });

        // Screenshot Leads Module with new product requirement chips
        const leadFormScreenshotPath = path.join(ARTIFACT_DIR, 'lead_form_product_chips_view.png');
        await page.screenshot({ path: leadFormScreenshotPath, fullPage: false });
        console.log('✓ Captured Lead form screenshot to:', leadFormScreenshotPath);

        // Test "All" and "Clear" buttons
        console.log('5. Testing "All" and "Clear" quick buttons...');
        await page.evaluate(() => window.selectAllLeadProducts(true));
        let allCheckedCount = await page.evaluate(() => document.querySelectorAll('input[name="lead_product_check"]:checked').length);
        console.log('Checked after "All":', allCheckedCount);
        if (allCheckedCount !== 6) throw new Error('Expected 6 checked products after selectAll(true)');

        await page.evaluate(() => window.selectAllLeadProducts(false));
        let clearCheckedCount = await page.evaluate(() => document.querySelectorAll('input[name="lead_product_check"]:checked').length);
        console.log('Checked after "Clear":', clearCheckedCount);
        if (clearCheckedCount !== 0) throw new Error('Expected 0 checked products after selectAll(false)');

        // Re-check Door, Window, CNC
        await page.evaluate(() => {
            const chips = Array.from(document.querySelectorAll('#lead-products-chips-grid .lead-product-chip'));
            chips.forEach(c => {
                const name = c.querySelector('.product-chip-name')?.innerText?.trim();
                if (['Door', 'Window', 'CNC'].includes(name)) {
                    const cb = c.querySelector('input[type="checkbox"]');
                    if (cb) cb.click();
                }
            });
        });

        // Navigate to Quotations module
        console.log('6. Navigating to Quotations module...');
        await page.evaluate(() => {
            if (window.navigate) window.navigate('quotations');
        });
        await new Promise(r => setTimeout(r, 800));

        // Trigger openShareQuotationModal
        console.log('7. Opening Quotation Share Modal...');
        const shareModalOpened = await page.evaluate(() => {
            const store = window.Store;
            const quotes = (store && store.state && store.state.quotations) || [];
            if (quotes.length > 0) {
                window.openShareQuotationModal(quotes[0].id);
                return quotes[0].id;
            }
            return null;
        });

        console.log('Opened Quotation Share Modal for quote:', shareModalOpened);
        await new Promise(r => setTimeout(r, 600));

        // Verify the 3 actions in the grid
        const shareModalInfo = await page.evaluate(() => {
            const modal = document.getElementById('quote-share-modal');
            if (!modal) return null;

            const btnDownload = modal.querySelector('#share-download-pdf-btn');
            const btnWhatsapp = modal.querySelector('#share-whatsapp-pdf-btn');
            const btnMore = modal.querySelector('#share-action-more');
            const btnCopy = modal.querySelector('#btn-copy-quote-caption');
            const previewBox = modal.querySelector('#quote-caption-preview-box');

            return {
                exists: true,
                downloadText: btnDownload?.innerText?.replace(/\s+/g, ' ')?.trim(),
                downloadHasIcon: Boolean(btnDownload?.querySelector('svg, i')),
                whatsappText: btnWhatsapp?.innerText?.replace(/\s+/g, ' ')?.trim(),
                whatsappHasIcon: Boolean(btnWhatsapp?.querySelector('svg, i')),
                moreText: btnMore?.innerText?.replace(/\s+/g, ' ')?.trim(),
                moreHasIcon: Boolean(btnMore?.querySelector('svg, i')),
                copyBtnText: btnCopy?.innerText?.replace(/\s+/g, ' ')?.trim(),
                copyHasIcon: Boolean(btnCopy?.querySelector('svg, i')),
                captionText: previewBox?.innerText || ''
            };
        });

        console.log('Quotation Share Modal Info:', JSON.stringify(shareModalInfo, null, 2));

        if (!shareModalInfo || !shareModalInfo.exists) {
            throw new Error('Quotation Share Modal was not rendered in DOM!');
        }

        if (!shareModalInfo.downloadText.includes('Download')) {
            throw new Error('Action 1 missing "Download" label');
        }
        if (!shareModalInfo.whatsappText.includes('WhatsApp')) {
            throw new Error('Action 2 missing "WhatsApp" label');
        }
        if (!shareModalInfo.moreText.includes('More')) {
            throw new Error('Action 3 missing "More" label');
        }

        // Verify Auto-Caption content structure
        const caption = shareModalInfo.captionText;
        console.log('Auto-Caption text content:\n' + caption);

        const hasHello = caption.includes('Hello');
        const hasLocation = caption.includes('📍 Location:');
        const hasPhone = caption.includes('📞 Phone:');
        const hasAmount = caption.includes('💰 Total Amount:');
        const hasFeedback = caption.includes('Kindly review the attached PDF quotation and let us know your feedback or confirmation.');
        const hasThankYou = caption.includes('Thank you for choosing Stylo Steel!');

        console.log('Caption Verification checks:', {
            hasHello,
            hasLocation,
            hasPhone,
            hasAmount,
            hasFeedback,
            hasThankYou
        });

        if (!hasHello || !hasLocation || !hasPhone || !hasAmount || !hasFeedback || !hasThankYou) {
            throw new Error('Auto-caption does not match the exact requested template!');
        }
        console.log('✓ Auto-Caption preview perfectly matches the required template!');

        // Test 'Copy Caption' click and toast
        console.log('8. Clicking Copy Caption button...');
        await page.click('#btn-copy-quote-caption');
        await new Promise(r => setTimeout(r, 400));

        // Check button text state and toast message
        const copyState = await page.evaluate(() => {
            const btnCopy = document.getElementById('btn-copy-quote-caption');
            const toast = document.querySelector('.studio-toast, #lead-toast-banner, .toast, [id*="toast"]');
            return {
                btnText: btnCopy?.innerText?.trim(),
                toastText: toast?.innerText?.trim() || document.body.innerText.includes('Caption copied!')
            };
        });
        console.log('Copy Button state after click:', copyState);

        // Screenshot Quotation Share Modal
        const shareModalScreenshotPath = path.join(ARTIFACT_DIR, 'quotation_share_clean_3action_grid_view.png');
        await page.screenshot({ path: shareModalScreenshotPath, fullPage: false });
        console.log('✓ Captured Quotation Share Modal screenshot to:', shareModalScreenshotPath);

        console.log('\n=============================================');
        console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
        console.log('=============================================');

    } catch (err) {
        console.error('Verification failed with error:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

run();
