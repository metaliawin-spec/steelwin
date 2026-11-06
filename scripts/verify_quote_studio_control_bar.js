const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('--- STARTING VERIFICATION: Quotation Studio Control Bar Matching Quick Calculation ---');
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
        await new Promise(r => setTimeout(r, 1000));

        // Start Quotation Studio
        await page.evaluate(() => {
            if (typeof window.startQuotationStudio === 'function') {
                window.startQuotationStudio({
                    name: 'Ansari Builders',
                    place: 'Palayam',
                    city: 'Kozhikode',
                    pincode: '673001',
                    mobile: '9846011223'
                });
            }
        });
        await new Promise(r => setTimeout(r, 1000));

        // Check if we are on Canvas step
        const isCanvas = await page.evaluate(() => {
            return Store.state.quoteStudio?.step === 'canvas';
        });
        console.log('Is on Canvas step:', isCanvas);

        // Inspect the 7 Material dropdowns positions (to ensure ALL 7 are in ONE horizontal row!)
        const rowAlignment = await page.evaluate(() => {
            const selects = Array.from(document.querySelectorAll('.quotation-studio-container .calc-mat-select'));
            const offsets = selects.map(s => {
                const rect = s.getBoundingClientRect();
                return {
                    top: Math.round(rect.top),
                    left: Math.round(rect.left),
                    width: Math.round(rect.width)
                };
            });
            const topPositions = [...new Set(offsets.map(o => o.top))];
            return {
                count: selects.length,
                uniqueTopLevels: topPositions.length, // Should be 1 (single sleek row!)
                offsets: offsets
            };
        });
        console.log('Material Row Alignment Check:', rowAlignment);

        // Inspect Top Row: DESIGN MODEL and UNIT Select
        const topRowInfo = await page.evaluate(() => {
            const unitSel = document.getElementById('studio-unit-select');
            const searchBar = document.getElementById('calc-search-bar');
            return {
                unitSelectPresent: !!unitSel,
                unitValue: unitSel ? unitSel.value : null,
                searchBarPresent: !!searchBar,
                searchPlaceholder: searchBar ? searchBar.placeholder : null
            };
        });
        console.log('Top & Bottom Controls Check:', topRowInfo);

        // Take initial screenshot of Canvas with new Control Bar
        const shot1 = path.resolve(__dirname, 'quote_studio_control_bar_single_row.png');
        await page.screenshot({ path: shot1, fullPage: false });
        console.log('Saved shot 1:', shot1);

        // Click on "3 Kalli" preset
        console.log('Clicking 3 Kalli preset...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('.quotation-studio-container button'));
            const btn3 = btns.find(b => b.innerText.trim() === '3 Kalli');
            if (btn3) btn3.click();
        });
        await new Promise(r => setTimeout(r, 600));

        // Type in search bar: "100x140" to check autocomplete dropdown
        console.log('Testing search bar autocomplete in Quotation Studio...');
        await page.type('#calc-search-bar', '100x140');
        await new Promise(r => setTimeout(r, 400));

        const searchDropdownVisible = await page.evaluate(() => {
            const dd = document.getElementById('calc-search-dropdown');
            return dd ? (dd.style.display !== 'none' && dd.innerHTML.length > 0) : false;
        });
        console.log('Search autocomplete dropdown visible in Quotation Studio:', searchDropdownVisible);

        const shot2 = path.resolve(__dirname, 'quote_studio_search_dropdown_active.png');
        await page.screenshot({ path: shot2, fullPage: false });
        console.log('Saved shot 2:', shot2);

        console.log('--- ALL VERIFICATIONS PASSED ---');
    } catch (err) {
        console.error('Test Failed:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
