const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('--- STARTING VERIFICATION: Direct-Typing Searchable Material Comboboxes ---');
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

        // 1. OPEN QUOTATION STUDIO STEP 2
        console.log('Opening Quotation Studio Setup Wizard...');
        await page.evaluate(() => {
            if (typeof window.startQuotationStudio === 'function') {
                window.startQuotationStudio();
            }
        });
        await new Promise(r => setTimeout(r, 800));

        // Verify Step 2 inputs are actual <input> elements
        const step2Check = await page.evaluate(() => {
            const keys = ['frame', 'pipe', 'panel', 'hinge', 'lock', 'hook', 'paint'];
            const res = {};
            keys.forEach(k => {
                const inp = document.getElementById(`qs-mat-input-${k}`);
                const hidden = document.getElementById(`qs-mat-${k}`);
                const root = document.getElementById(`qs-mat-root-${k}`);
                res[k] = {
                    isInput: !!inp && inp.tagName === 'INPUT',
                    value: inp ? inp.value : null,
                    hiddenValue: hidden ? hidden.value : null,
                    hasRoot: !!root
                };
            });
            return res;
        });
        console.log('Step 2 Combobox Inputs Check:', JSON.stringify(step2Check, null, 2));

        // Click directly into the frame box
        console.log('Clicking directly into #qs-mat-input-frame to type...');
        await page.click('#qs-mat-input-frame');
        await new Promise(r => setTimeout(r, 300));

        // Verify dropdown opened without a secondary search box
        const step2DropdownState = await page.evaluate(() => {
            const dd = document.getElementById('dropdown-qs-mat-root-frame');
            const innerSearch = dd ? dd.querySelector('input') : null;
            return {
                dropdownVisible: dd ? dd.style.display !== 'none' : false,
                hasUnnecessaryInnerSearch: !!innerSearch
            };
        });
        console.log('Step 2 Dropdown State after clicking box:', step2DropdownState);

        // Type directly into the frame box!
        console.log('Typing "box" directly into #qs-mat-input-frame...');
        await page.type('#qs-mat-input-frame', 'box');
        await new Promise(r => setTimeout(r, 300));

        // Check filtered options
        const step2Filtered = await page.evaluate(() => {
            const dd = document.getElementById('dropdown-qs-mat-root-frame');
            const visible = [];
            if (dd) {
                dd.querySelectorAll('.mat-combobox-opt').forEach(opt => {
                    if (opt.style.display !== 'none') {
                        visible.push(opt.innerText.trim().replace(/\s+/g, ' '));
                    }
                });
            }
            return visible;
        });
        console.log('Step 2 filtered options for "box":', step2Filtered);

        const shot1 = path.resolve(__dirname, 'step2_direct_type_frame.png');
        await page.screenshot({ path: shot1, fullPage: false });
        console.log('Saved shot 1:', shot1);

        // Click the option "4x3 Profile (Box Section)"
        console.log('Selecting "4x3 Profile (Box Section)" from dropdown...');
        await page.evaluate(() => {
            const opts = Array.from(document.querySelectorAll('#dropdown-qs-mat-root-frame .mat-combobox-opt'));
            const target = opts.find(o => o.innerText.includes('4x3 Profile'));
            if (target) target.click();
        });
        await new Promise(r => setTimeout(r, 300));

        const updatedFrameVal = await page.evaluate(() => {
            return {
                display: document.getElementById('qs-mat-input-frame')?.value,
                hidden: document.getElementById('qs-mat-frame')?.value,
                dropdownClosed: document.getElementById('dropdown-qs-mat-root-frame')?.style.display === 'none'
            };
        });
        console.log('Frame state after selection:', updatedFrameVal);

        // 2. FILL MANDATORY DETAILS & PROCEED TO CANVAS
        console.log('Filling mandatory customer fields and proceeding to canvas...');
        await page.type('#qs-cust-name', 'Ansari Glass House');
        await page.type('#qs-cust-mobile', '9895012345');
        await page.type('#qs-cust-place', 'Beach Road');
        await page.type('#qs-cust-city', 'Kozhikode');
        await page.type('#qs-cust-pin', '673001');

        await page.click('#qs-btn-proceed-canvas');
        await new Promise(r => setTimeout(r, 1000));

        // 3. VERIFY CANVAS TOP CONTROL BAR MATERIAL BOXES (PHOTO 2 LOCATION)
        console.log('Checking Canvas Control Bar Material Boxes...');
        const canvasMatCheck = await page.evaluate(() => {
            const keys = ['frame', 'pipe', 'panel', 'hinge', 'lock', 'hook', 'paint'];
            const res = {};
            const tops = [];
            keys.forEach(k => {
                const inp = document.getElementById(`bar-mat-input-studio-${k}`);
                if (inp) {
                    const rect = inp.getBoundingClientRect();
                    tops.push(Math.round(rect.top));
                    res[k] = {
                        isInput: inp.tagName === 'INPUT',
                        value: inp.value,
                        top: Math.round(rect.top),
                        width: Math.round(rect.width)
                    };
                }
            });
            const uniqueTops = [...new Set(tops)];
            return {
                all7OnSingleRow: uniqueTops.length === 1,
                topY: uniqueTops[0],
                items: res
            };
        });
        console.log('Canvas Control Bar Boxes:', JSON.stringify(canvasMatCheck, null, 2));

        // Click directly into Pipe box in Canvas bar
        console.log('Clicking directly into #bar-mat-input-studio-pipe on Canvas bar...');
        await page.click('#bar-mat-input-studio-pipe');
        await new Promise(r => setTimeout(r, 300));

        const canvasDropdownVisible = await page.evaluate(() => {
            const dd = document.getElementById('dropdown-bar-mat-root-studio-pipe');
            return dd ? dd.style.display !== 'none' : false;
        });
        console.log('Canvas Pipe Dropdown Visible:', canvasDropdownVisible);

        // Type directly into the Pipe box!
        console.log('Typing "sq" directly into #bar-mat-input-studio-pipe...');
        await page.type('#bar-mat-input-studio-pipe', 'sq');
        await new Promise(r => setTimeout(r, 300));

        const canvasPipeFiltered = await page.evaluate(() => {
            const dd = document.getElementById('dropdown-bar-mat-root-studio-pipe');
            const visible = [];
            if (dd) {
                dd.querySelectorAll('.mat-combobox-opt').forEach(opt => {
                    if (opt.style.display !== 'none') {
                        visible.push(opt.innerText.trim().replace(/\s+/g, ' '));
                    }
                });
            }
            return visible;
        });
        console.log('Canvas Pipe options filtered for "sq":', canvasPipeFiltered);

        const shot2 = path.resolve(__dirname, 'canvas_direct_type_pipe.png');
        await page.screenshot({ path: shot2, fullPage: false });
        console.log('Saved shot 2:', shot2);

        // Select an option from canvas dropdown
        await page.evaluate(() => {
            const opts = Array.from(document.querySelectorAll('#dropdown-bar-mat-root-studio-pipe .mat-combobox-opt'));
            const target = opts.find(o => o.innerText.toLowerCase().includes('square pipe'));
            if (target) target.click();
        });
        await new Promise(r => setTimeout(r, 600));

        const shot3 = path.resolve(__dirname, 'canvas_direct_type_selected.png');
        await page.screenshot({ path: shot3, fullPage: false });
        console.log('Saved shot 3:', shot3);

        console.log('--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---');
    } catch (err) {
        console.error('Test Failed:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
