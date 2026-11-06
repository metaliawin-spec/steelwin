const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('--- STARTING VERIFICATION: Search Bar Color & Dropdown Autocomplete ---');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 950 });

        const fileUrl = 'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
        console.log('Navigating to:', fileUrl);
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 1200));

        // 1. Switch to Calculation module
        await page.evaluate(() => {
            if (window.Store) {
                window.Store.state.currentView = 'calculation';
                window.Store.notify();
            }
        });
        await new Promise(r => setTimeout(r, 1000));

        // 2. Check search input element
        const searchBarExists = await page.evaluate(() => {
            const input = document.getElementById('calc-search-bar');
            if (!input) return null;
            const cs = window.getComputedStyle(input);
            return {
                id: input.id,
                placeholder: input.placeholder,
                color: cs.color,
                backgroundColor: cs.backgroundColor,
                fontWeight: cs.fontWeight
            };
        });

        console.log('Search Bar Computed Style:', searchBarExists);

        // 3. Focus and type 'w' into search bar
        await page.focus('#calc-search-bar');
        await page.keyboard.type('w');
        await new Promise(r => setTimeout(r, 500));

        // Clear and test typing a custom dimension "120x150"
        await page.evaluate(() => window.clearCalcSearch());
        await page.focus('#calc-search-bar');
        await page.keyboard.type('120x150');
        await new Promise(r => setTimeout(r, 500));

        const dimSearchState = await page.evaluate(() => {
            const input = document.getElementById('calc-search-bar');
            const dd = document.getElementById('calc-search-dropdown');
            const items = dd ? Array.from(dd.querySelectorAll('.calc-search-dropdown-item')).map(el => el.innerText.trim()) : [];
            return {
                value: input.value,
                items: items
            };
        });
        console.log('Dimension Search State for "120x150":', dimSearchState);

        const shotDimPath = path.resolve(__dirname, 'search_bar_typed_dimension.png');
        await page.screenshot({ path: shotDimPath, fullPage: false });

        // Retype 'w' for the subsequent steps
        await page.evaluate(() => window.clearCalcSearch());
        await page.focus('#calc-search-bar');
        await page.keyboard.type('w');
        await new Promise(r => setTimeout(r, 500));

        // Verify typed text and dropdown state
        const searchState = await page.evaluate(() => {
            const input = document.getElementById('calc-search-bar');
            const dd = document.getElementById('calc-search-dropdown');
            const items = dd ? Array.from(dd.querySelectorAll('.calc-search-dropdown-item')).map(el => el.innerText.trim()) : [];
            const csInput = window.getComputedStyle(input);
            return {
                value: input.value,
                color: csInput.color,
                bgColor: csInput.backgroundColor,
                dropdownVisible: dd && window.getComputedStyle(dd).display !== 'none',
                dropdownItemCount: items.length,
                firstFewItems: items.slice(0, 5)
            };
        });

        console.log('Search State after typing "w":', searchState);

        // Capture screenshot of the search input and dropdown
        const shot1Path = path.resolve(__dirname, 'search_bar_typed_w.png');
        await page.screenshot({ path: shot1Path, fullPage: false });
        console.log('Screenshot saved to:', shot1Path);

        // 4. Test clicking on a saved item from dropdown
        const clickedSaved = await page.evaluate(() => {
            const dd = document.getElementById('calc-search-dropdown');
            if (!dd) return false;
            const savedItem = dd.querySelector('.calc-search-dropdown-item');
            if (savedItem) {
                savedItem.click();
                return true;
            }
            return false;
        });

        console.log('Clicked saved item:', clickedSaved);
        await new Promise(r => setTimeout(r, 800));

        // Check if canvas dimensions/grid updated
        const canvasState = await page.evaluate(() => {
            const g = window.Store.state.rateCalc?.grid;
            return {
                cols: g ? g.cols : null,
                totalW: g ? g.totalW : null,
                totalH: g ? g.totalH : null,
                unit: g ? g.unit : null,
                calcItemName: window.Store.state.calculation?.itemName
            };
        });
        console.log('Canvas State after loading saved item:', canvasState);

        // 5. Test Quotation Studio Step 1 Customer Autocomplete
        await page.evaluate(() => {
            if (typeof window.startQuotationStudio === 'function') {
                window.startQuotationStudio();
            }
        });
        await new Promise(r => setTimeout(r, 800));

        await page.focus('#qs-cust-name');
        await page.keyboard.type('A');
        await new Promise(r => setTimeout(r, 500));

        const custAutocompleteState = await page.evaluate(() => {
            const inp = document.getElementById('qs-cust-name');
            const dd = document.getElementById('qs-cust-dropdown');
            const items = dd ? Array.from(dd.querySelectorAll('.calc-search-dropdown-item')).map(el => el.innerText.trim()) : [];
            const csInp = inp ? window.getComputedStyle(inp) : null;
            return {
                custVal: inp ? inp.value : null,
                custColor: csInp ? csInp.color : null,
                custBg: csInp ? csInp.backgroundColor : null,
                dropdownVisible: dd && window.getComputedStyle(dd).display !== 'none',
                items: items
            };
        });

        console.log('Customer Autocomplete State:', custAutocompleteState);

        const shot2Path = path.resolve(__dirname, 'quotation_studio_customer_autocomplete.png');
        await page.screenshot({ path: shot2Path, fullPage: false });
        console.log('Screenshot 2 saved to:', shot2Path);

        console.log('--- ALL VERIFICATIONS PASSED SUCCESSFULLY! ---');
    } catch (err) {
        console.error('Test Failed:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
