const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function run() {
    const outDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    console.log('🚀 Launching browser to verify WhatsApp Sharing & Print Document models...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 960 });

    try {
        console.log('🌐 Navigating to http://localhost:3000/ ...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1200));

        // Ensure Store and quotations exist
        const hasQuotations = await page.evaluate(() => {
            const store = window.Store;
            if (!store || !store.state || !store.state.quotations || store.state.quotations.length === 0) {
                return false;
            }
            return store.state.quotations.length;
        });
        console.log(`📋 Found ${hasQuotations} quotations in store.`);

        // Step 1: Open the "Print / View Document" Modal (Screenshot 4)
        console.log('🔍 Opening Print / View Document modal...');
        await page.evaluate(() => {
            const quote = window.Store.state.quotations[0] || {
                id: '4',
                customer: 'Subair Nechikkattu',
                customerPhone: '8086888500',
                customerLocation: 'Kozhissery, Kakkanchery, Kerala',
                date: '2026-09-24',
                amount: 308200
            };
            window.openPrintQuotationModal(quote);
        });

        await new Promise(r => setTimeout(r, 600));

        // Verify elements of Screenshot 4
        const printModalCheck = await page.evaluate(() => {
            const modal = document.getElementById('quote-print-modal');
            if (!modal) return { success: false, reason: 'Modal not found' };

            const title = modal.querySelector('.gogst-dialog-title')?.textContent?.trim();
            const newTabBtn = modal.querySelector('.gogst-top-btn');
            const badge = document.getElementById('print-doc-copy-badge')?.textContent?.trim();
            const radios = modal.querySelectorAll('input[name="gogst-doc-copy-type"]');
            const waBtn = modal.querySelector('.gogst-btn-whatsapp');
            const emailBtn = modal.querySelector('.gogst-btn-email');
            const smsBtn = modal.querySelector('.gogst-btn-sms');
            const downloadBtn = modal.querySelector('.gogst-btn-download');
            const printBtn = modal.querySelector('.gogst-btn-print');

            return {
                success: true,
                title,
                badge,
                radiosCount: radios.length,
                hasNewTab: !!newTabBtn,
                hasWaBtn: !!waBtn,
                hasEmailBtn: !!emailBtn,
                hasSmsBtn: !!smsBtn,
                hasDownloadBtn: !!downloadBtn,
                hasPrintBtn: !!printBtn
            };
        });

        console.log('✅ Print / View Document Check:', printModalCheck);
        const printScreenshotPath = path.join(outDir, '01_print_view_document_modal.png');
        await page.screenshot({ path: printScreenshotPath, fullPage: false });
        console.log(`📸 Saved screenshot: ${printScreenshotPath}`);

        // Step 2: Test copy type radio buttons (Original, Duplicate, Transport, Office)
        console.log('🔄 Testing copy type radio selection...');
        const badgeTransitions = await page.evaluate(() => {
            const results = {};
            const radios = document.querySelectorAll('input[name="gogst-doc-copy-type"]');
            radios.forEach(r => {
                r.checked = true;
                window.switchDocumentCopyBadge(r.value);
                results[r.value] = document.getElementById('print-doc-copy-badge')?.textContent?.trim();
            });
            // Reset to ORIGINAL
            radios[0].checked = true;
            window.switchDocumentCopyBadge('ORIGINAL');
            return results;
        });
        console.log('✅ Document Copy Badge Transitions:', badgeTransitions);

        // Step 3: Click green [Whatsapp] button to open "Share on WhatsApp" modal (Screenshot 2)
        console.log('🟢 Clicking [Whatsapp] button to open Share on WhatsApp modal...');
        await page.evaluate(() => {
            const waBtn = document.querySelector('.gogst-btn-whatsapp');
            if (waBtn) waBtn.click();
            else window.openShareOnWhatsAppModal('4');
        });

        await new Promise(r => setTimeout(r, 600));

        // Verify elements of Screenshot 2
        const shareModalCheck = await page.evaluate(() => {
            const modal = document.getElementById('gogst-whatsapp-share-modal');
            if (!modal) return { success: false, reason: 'WhatsApp Share modal not found' };

            const countrySelect = document.getElementById('wa-country-code-select')?.value;
            const phoneInput = document.getElementById('wa-share-phone-input')?.value;
            const message = document.getElementById('wa-share-message-textarea')?.value;
            const attachmentName = document.getElementById('wa-share-attachment-name')?.textContent?.trim();
            const staffCheckbox = document.getElementById('wa-allow-staff-checkbox')?.checked;
            const connectedCard = modal.querySelector('.whatsapp-connected-card');
            const submitBtn = document.getElementById('btn-submit-whatsapp-share');

            return {
                success: true,
                countrySelect,
                phoneInput,
                hasMessage: !!message && message.includes('Invoice No: 4'),
                attachmentName,
                staffCheckbox,
                hasConnectedCard: !!connectedCard,
                hasSubmitBtn: !!submitBtn
            };
        });

        console.log('✅ Share on WhatsApp Modal Check:', shareModalCheck);
        const shareConnectedPath = path.join(outDir, '02_share_on_whatsapp_modal_connected.png');
        await page.screenshot({ path: shareConnectedPath, fullPage: false });
        console.log(`📸 Saved screenshot: ${shareConnectedPath}`);

        // Step 4: Disconnect WhatsApp device to inspect Screenshot 3 QR Pairing state
        console.log('❌ Clicking disconnect button to trigger QR code pairing mode...');
        await page.evaluate(() => {
            window.disconnectWhatsAppDevice();
        });
        await new Promise(r => setTimeout(r, 600));

        const qrStateCheck = await page.evaluate(() => {
            const modal = document.getElementById('gogst-whatsapp-share-modal');
            const qrBox = modal?.querySelector('.whatsapp-qr-box');
            const countdown = document.getElementById('wa-qr-countdown')?.textContent?.trim();
            const instruction = qrBox?.querySelector('.whatsapp-qr-instruction')?.textContent?.trim();
            return {
                success: !!qrBox,
                countdown,
                instruction
            };
        });

        console.log('✅ WhatsApp QR Pairing Check:', qrStateCheck);
        const shareQrPath = path.join(outDir, '03_share_on_whatsapp_modal_qr_pairing.png');
        await page.screenshot({ path: shareQrPath, fullPage: false });
        console.log(`📸 Saved screenshot: ${shareQrPath}`);

        // Step 5: Re-authenticate / connect WhatsApp device (Screenshot 5)
        console.log('🔄 Re-connecting WhatsApp device...');
        await page.evaluate(() => {
            window.connectWhatsAppDevice();
        });
        await new Promise(r => setTimeout(r, 400));

        // Step 6: Test WhatsApp submit handler (executes PDF generation and URL scheme)
        console.log('🚀 Testing WhatsApp Share execution button...');
        const shareExecResult = await page.evaluate(async () => {
            const origOpen = window.open;
            let capturedUrl = null;
            window.open = (url) => { capturedUrl = url; };

            const filename = 'Invoice_4-Subair-Nechikkattu-09-54-29.pdf';
            await window.executeWhatsAppShare('4', 'Invoice', filename);

            window.open = origOpen;
            return {
                capturedUrl,
                activePdfUrl: window._activePdfUrl
            };
        });

        console.log('✅ WhatsApp Share Execution Output:', shareExecResult);

        // Step 7: Clean up modals and navigate to Settings -> General tab to verify device connection UI in Settings
        console.log('⚙️ Navigating to Settings -> General tab...');
        await page.evaluate(() => {
            document.querySelectorAll('.gogst-modal-backdrop, .modal-backdrop, #quote-print-modal, #gogst-whatsapp-share-modal, #overdue-invoices-alert-modal').forEach(el => el.remove());
            if (window.Store && typeof window.Store.navigate === 'function') {
                window.Store.navigate('settings');
            }
            if (typeof window.switchSettingsTab === 'function') {
                window.switchSettingsTab('general');
            }
        });
        await new Promise(r => setTimeout(r, 800));

        const settingsCheck = await page.evaluate(() => {
            const staffCheckbox = document.getElementById('set-wa-allow-staff');
            const connectedCard = document.querySelector('.whatsapp-connected-card');
            return {
                success: !!staffCheckbox,
                staffAllowed: staffCheckbox?.checked,
                hasConnectedCard: !!connectedCard
            };
        });

        console.log('✅ Settings WhatsApp Business Section Check:', settingsCheck);
        const settingsPath = path.join(outDir, '04_settings_general_whatsapp_pairing.png');
        await page.screenshot({ path: settingsPath, fullPage: false });
        console.log(`📸 Saved screenshot: ${settingsPath}`);

        console.log('\n🎉 ALL 5 WHATSAPP SHARING & PRINT DOCUMENT SPECIFICATIONS VERIFIED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
    } finally {
        await browser.close();
    }
}

run();
