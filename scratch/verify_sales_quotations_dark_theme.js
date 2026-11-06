const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
    let browser;
    try {
        console.log('Launching Chrome for UI verification...');
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: 'new',
            defaultViewport: { width: 1440, height: 900 }
        });

        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

        // Ensure Dark Theme is active
        await page.evaluate(() => {
            if (window.setTheme) window.setTheme('dark');
        });
        await new Promise(r => setTimeout(r, 600));

        // 1. Verify Create Sales Interface
        console.log('Testing Create Sales Interface...');
        await page.evaluate(() => {
            window.navigate('sales');
        });
        await new Promise(r => setTimeout(r, 500));

        await page.evaluate(() => {
            window.initCreateInvoice();
        });
        await new Promise(r => setTimeout(r, 800));

        const createSalesScreenshot = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\c6c05c05-5968-4292-b804-64b7412f1d59\\create_sales_dark_theme.png';
        await page.screenshot({ path: createSalesScreenshot });
        console.log('Saved Create Sales screenshot to:', createSalesScreenshot);

        // Scroll to capture lower section of Create Sales
        await page.evaluate(() => {
            const mv = document.getElementById('main-view');
            if (mv) mv.scrollTop = mv.scrollHeight;
        });
        await new Promise(r => setTimeout(r, 400));
        const createSalesBottomScreenshot = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\c6c05c05-5968-4292-b804-64b7412f1d59\\create_sales_bottom_dark_theme.png';
        await page.screenshot({ path: createSalesBottomScreenshot });
        console.log('Saved Create Sales bottom screenshot to:', createSalesBottomScreenshot);

        // Check computed backgrounds in Create Sales view to ensure no bright white
        const salesWhiteElements = await page.evaluate(() => {
            const els = Array.from(document.querySelectorAll('#invoice-form-wrapper *'));
            const whiteEls = [];
            els.forEach(el => {
                const style = window.getComputedStyle(el);
                const bg = style.backgroundColor;
                const inlineBg = el.style.background || el.style.backgroundColor;
                if (bg === 'rgb(255, 255, 255)' && !el.classList.contains('btn-primary')) {
                    whiteEls.push({ tag: el.tagName, class: el.className, inlineBg, id: el.id });
                }
            });
            return whiteEls;
        });
        console.log('White elements found in Create Sales (should be 0 or empty):', salesWhiteElements);

        // 2. Verify Quotation List / Customer List in Quotations
        console.log('Testing Quotation List view...');
        await page.evaluate(() => {
            window.navigate('quotations');
        });
        await new Promise(r => setTimeout(r, 600));

        const quotationListScreenshot = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\c6c05c05-5968-4292-b804-64b7412f1d59\\quotation_list_dark_theme.png';
        await page.screenshot({ path: quotationListScreenshot, fullPage: true });
        console.log('Saved Quotation List screenshot to:', quotationListScreenshot);

        // 3. Verify Add Quotation Form
        console.log('Testing Add Quotation Form...');
        await page.evaluate(() => {
            window.initCreateQuotation();
        });
        await new Promise(r => setTimeout(r, 800));

        const addQuotationScreenshot = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\c6c05c05-5968-4292-b804-64b7412f1d59\\add_quotation_dark_theme.png';
        await page.screenshot({ path: addQuotationScreenshot, fullPage: true });
        console.log('Saved Add Quotation screenshot to:', addQuotationScreenshot);

        // Check for basic gray #262626 in Add Quotation
        const quoteGrayElements = await page.evaluate(() => {
            const els = Array.from(document.querySelectorAll('#main-view *'));
            const grayEls = [];
            els.forEach(el => {
                const inlineBg = el.style.background || el.style.backgroundColor;
                if (inlineBg && inlineBg.includes('#262626')) {
                    grayEls.push({ tag: el.tagName, class: el.className, inlineBg });
                }
            });
            return grayEls;
        });
        console.log('Basic gray #262626 elements found in Add Quotation (should be 0):', quoteGrayElements.length);

        // 4. Verify Customer Directory Modal from Quotation
        console.log('Testing Customer Directory Modal from Quotations...');
        await page.evaluate(() => {
            window.openQuoteCustomerModal();
        });
        await new Promise(r => setTimeout(r, 600));

        const quoteCustomerModalScreenshot = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\c6c05c05-5968-4292-b804-64b7412f1d59\\quote_customer_modal_dark_theme.png';
        await page.screenshot({ path: quoteCustomerModalScreenshot, fullPage: true });
        console.log('Saved Customer Directory Modal screenshot to:', quoteCustomerModalScreenshot);

        console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
    } catch (e) {
        console.error('Test error:', e);
    } finally {
        if (browser) await browser.close();
    }
})();
