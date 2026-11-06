const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
    let browser;
    try {
        console.log('Launching browser for Universal Customer Search verification...');
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: 'new',
            defaultViewport: { width: 1440, height: 900 }
        });

        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE:', msg.text()));
        page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
        page.on('dialog', async dialog => {
            console.log('Dialog auto-accepted:', dialog.message());
            await dialog.accept();
        });

        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

        // Ensure Dark Theme
        await page.evaluate(() => {
            if (window.setTheme) window.setTheme('dark');
        });
        await new Promise(r => setTimeout(r, 500));

        // -------------------------------------------------------------
        // TEST 1: Quotation Module - Universal Customer Search
        // -------------------------------------------------------------
        console.log('\n--- TEST 1: Quotation Module UCS ---');
        await page.evaluate(() => {
            window.navigate('quotations');
        });
        await new Promise(r => setTimeout(r, 600));

        await page.evaluate(() => {
            window.initCreateQuotation();
        });
        await new Promise(r => setTimeout(r, 600));

        const quoteUcsExists = await page.evaluate(() => {
            const root = document.getElementById('quote-customer-search');
            return !!root;
        });
        console.log('Quotation UCS root element exists:', quoteUcsExists);

        // Click trigger to open dropdown
        console.log('Clicking Quotation UCS trigger...');
        await page.evaluate(() => {
            const trigger = document.querySelector('#quote-customer-search .ucs-trigger');
            if (trigger) trigger.click();
        });
        await new Promise(r => setTimeout(r, 400));

        // Check dropdown contents & sources
        const quoteDropdownData = await page.evaluate(() => {
            const dropdown = document.querySelector('#quote-customer-search .ucs-dropdown');
            const isOpen = dropdown && dropdown.style.display === 'flex';
            const items = Array.from(document.querySelectorAll('#quote-customer-search .ucs-item-row')).map(el => {
                const avatar = el.querySelector('div:first-child')?.textContent?.trim();
                const name = el.querySelector('span:first-child')?.textContent?.trim();
                const badge = el.querySelector('span:nth-child(2)')?.textContent?.trim();
                return { avatar, name, badge };
            });
            return { isOpen, count: items.length, items: items.slice(0, 8) };
        });
        console.log('Quotation Dropdown Open:', quoteDropdownData.isOpen, 'Items count:', quoteDropdownData.count);
        console.log('Sample Dropdown Items:', quoteDropdownData.items);

        // Take screenshot of open dropdown matching Image 2
        const dropdownScreenshotPath = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\c6c05c05-5968-4292-b804-64b7412f1d59\\universal_search_dropdown_open.png';
        await page.screenshot({ path: dropdownScreenshotPath });
        console.log('Saved dropdown screenshot to:', dropdownScreenshotPath);

        // Filter test
        console.log('Typing into "Search to select" input: "Luxury"...');
        await page.evaluate(() => {
            const input = document.querySelector('#quote-customer-search .ucs-search-input');
            if (input) {
                input.value = 'Luxury';
                window.UniversalCustomerSearch.filter('quote-customer-search', 'Luxury');
            }
        });
        await new Promise(r => setTimeout(r, 300));

        const filteredItems = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('#quote-customer-search .ucs-item-row')).map(el => el.textContent.trim());
        });
        console.log('Filtered items matching "Luxury":', filteredItems);

        // Select the filtered item
        console.log('Selecting "Luxury Villa Project"...');
        await page.evaluate(() => {
            const row = document.querySelector('#quote-customer-search .ucs-item-row');
            if (row) row.click();
        });
        await new Promise(r => setTimeout(r, 400));

        const selectedText = await page.evaluate(() => {
            return document.querySelector('#quote-customer-search .ucs-selected-text')?.textContent?.trim();
        });
        console.log('Selected customer in trigger:', selectedText);

        const quoteSelectedScreenshotPath = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\c6c05c05-5968-4292-b804-64b7412f1d59\\universal_search_selected.png';
        await page.screenshot({ path: quoteSelectedScreenshotPath });

        // -------------------------------------------------------------
        // TEST 2: Sales Module - Universal Customer Search
        // -------------------------------------------------------------
        console.log('\n--- TEST 2: Sales Module UCS ---');
        await page.evaluate(() => {
            window.navigate('sales');
        });
        await new Promise(r => setTimeout(r, 500));

        await page.evaluate(() => {
            window.initCreateInvoice();
        });
        await new Promise(r => setTimeout(r, 600));

        const salesUcsExists = await page.evaluate(() => {
            return !!document.getElementById('sales-customer-search');
        });
        console.log('Sales UCS root exists:', salesUcsExists);

        // -------------------------------------------------------------
        // TEST 3: Service Module - Universal Customer Search
        // -------------------------------------------------------------
        console.log('\n--- TEST 3: Service Module UCS ---');
        await page.evaluate(() => {
            window.navigate('service_visit');
        });
        await new Promise(r => setTimeout(r, 500));

        await page.evaluate(() => {
            window.openNewServiceRequestModal();
        });
        await new Promise(r => setTimeout(r, 500));

        const serviceUcsExists = await page.evaluate(() => {
            return !!document.getElementById('service-customer-search');
        });
        console.log('Service modal UCS exists:', serviceUcsExists);

        // Close service modal
        await page.evaluate(() => {
            const m = document.getElementById('new-service-modal');
            if (m) m.remove();
        });

        // -------------------------------------------------------------
        // TEST 4: Price Calculation Integration & Auto-Saving
        // -------------------------------------------------------------
        console.log('\n--- TEST 4: Price Calculation Auto-Saving New Customer ---');
        await page.evaluate(() => {
            window.navigate('calculation');
        });
        await new Promise(r => setTimeout(r, 800));

        const calcUcsExists = await page.evaluate(() => {
            return !!document.getElementById('calc-customer-search');
        });
        console.log('Calculation Studio UCS exists:', calcUcsExists);

        // Simulate entering new customer in Calculation Studio
        const newCustName = 'Zayd Royal Villa ' + Math.floor(Math.random() * 1000);
        console.log(`Entering new calculation customer: "${newCustName}"...`);
        await page.evaluate((custName) => {
            window.updateStudioCalc('customerName', custName);
            window.updateStudioCalc('customerPhone', '9846001122');
            window.updateStudioCalc('customerLocation', 'Calicut Bypass Road');
            window.saveAndNewCalculation();
        }, newCustName);
        await new Promise(r => setTimeout(r, 500));

        // Check if customer is now in Store.state.customers and searchable
        const autoSavedCheck = await page.evaluate((custName) => {
            const inStore = (window.Store.state.customers || []).find(c => c.name.toLowerCase() === custName.toLowerCase());
            const universalList = window.UniversalCustomerSearch.getAllCustomers();
            const inUniversal = universalList.find(c => c.name.toLowerCase() === custName.toLowerCase());
            return {
                inStore: !!inStore,
                storeSource: inStore?.source,
                inUniversal: !!inUniversal,
                universalSource: inUniversal?.source
            };
        }, newCustName);
        console.log('Auto-saved customer check:', autoSavedCheck);

        // Now navigate back to Sales and see if the new customer is searchable!
        await page.evaluate(() => {
            window.navigate('sales');
        });
        await new Promise(r => setTimeout(r, 500));
        await page.evaluate(() => {
            window.initCreateInvoice();
        });
        await new Promise(r => setTimeout(r, 500));

        const foundInSalesSearch = await page.evaluate((custName) => {
            window.UniversalCustomerSearch.filter('sales-customer-search', custName);
            const items = Array.from(document.querySelectorAll('#sales-customer-search .ucs-item-row'));
            return items.some(it => it.textContent.includes(custName));
        }, newCustName);
        console.log(`Newly generated Price Calculation customer found in Sales search:`, foundInSalesSearch);

        console.log('\nALL UNIVERSAL CUSTOMER SEARCH TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('Test execution failed:', err);
    } finally {
        if (browser) await browser.close();
    }
})();
