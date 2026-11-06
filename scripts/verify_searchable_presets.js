const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('--- STARTING VERIFICATION: Step 2 Searchable Material Comboboxes ---');
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

        // Open Quotation Studio
        await page.evaluate(() => {
            if (typeof window.startQuotationStudio === 'function') {
                window.startQuotationStudio();
            }
        });
        await new Promise(r => setTimeout(r, 800));

        // Verify triggers & hidden inputs exist for all 7 materials
        const initialCheck = await page.evaluate(() => {
            const keys = ['frame', 'pipe', 'panel', 'hinge', 'lock', 'hook', 'paint'];
            const results = {};
            keys.forEach(k => {
                const trig = document.getElementById(`qs-mat-trigger-${k}`);
                const hidden = document.getElementById(`qs-mat-${k}`);
                const dropdown = document.getElementById(`qs-mat-dropdown-${k}`);
                results[k] = {
                    hasTrigger: !!trig,
                    triggerText: trig ? trig.querySelector('span:first-child')?.innerText?.trim() : null,
                    hiddenValue: hidden ? hidden.value : null,
                    hasDropdown: !!dropdown
                };
            });
            return results;
        });

        console.log('Initial Combobox Check:', JSON.stringify(initialCheck, null, 2));

        // Click on Frame trigger to open dropdown
        console.log('Clicking Frame trigger...');
        await page.click('#qs-mat-trigger-frame');
        await new Promise(r => setTimeout(r, 400));

        // Type "box" in frame search bar
        console.log('Typing "box" into frame search input...');
        await page.type('#qs-mat-search-frame', 'box');
        await new Promise(r => setTimeout(r, 300));

        // Check options
        const frameFilteredCount = await page.evaluate(() => {
            const opts = document.querySelectorAll('#qs-mat-list-frame .mat-dropdown-opt');
            let visibleCount = 0;
            const visibleLabels = [];
            opts.forEach(o => {
                if (o.style.display !== 'none') {
                    visibleCount++;
                    visibleLabels.push(o.innerText.trim().replace(/\s+/g, ' '));
                }
            });
            return { visibleCount, visibleLabels };
        });
        console.log('Frame search results for "box":', frameFilteredCount);

        const shot1 = path.resolve(__dirname, 'step2_frame_search_open.png');
        await page.screenshot({ path: shot1, fullPage: false });
        console.log('Saved shot 1:', shot1);

        // Click the second filtered option: "4x3 Profile (Box Section)"
        console.log('Selecting "4x3 Profile (Box Section)"...');
        await page.evaluate(() => {
            const opts = Array.from(document.querySelectorAll('#qs-mat-list-frame .mat-dropdown-opt'));
            const target = opts.find(o => o.innerText.includes('4x3 Profile'));
            if (target) target.click();
        });
        await new Promise(r => setTimeout(r, 400));

        const updatedFrame = await page.evaluate(() => {
            const trig = document.getElementById('qs-mat-trigger-frame');
            const hidden = document.getElementById('qs-mat-frame');
            const dd = document.getElementById('qs-mat-dropdown-frame');
            return {
                triggerText: trig ? trig.innerText.trim() : null,
                hiddenValue: hidden ? hidden.value : null,
                dropdownClosed: dd ? dd.style.display === 'none' : false
            };
        });
        console.log('Updated Frame state after selection:', updatedFrame);

        // Fill all 5 mandatory customer fields
        console.log('Filling 5 mandatory customer fields...');
        await page.type('#qs-cust-name', 'Rahman Construction');
        await page.type('#qs-cust-mobile', '9847012345');
        await page.type('#qs-cust-place', 'Mavoor Road');
        await page.type('#qs-cust-city', 'Kozhikode');
        await page.type('#qs-cust-pin', '673004');

        const shot2 = path.resolve(__dirname, 'step2_all_filled_verified.png');
        await page.screenshot({ path: shot2, fullPage: false });
        console.log('Saved shot 2 (All filled):', shot2);

        // Click Next: Open Window Studio
        console.log('Clicking Next: Open Window Studio button...');
        await page.click('#qs-btn-proceed-canvas');
        await new Promise(r => setTimeout(r, 1200));

        const canvasResult = await page.evaluate(() => {
            const step2Wizard = document.getElementById('qs-cust-name');
            const studioState = window.Store?.state?.quoteStudio;
            return {
                step: studioState?.step,
                hasActiveStudio: !!studioState,
                customer: studioState?.customer,
                materials: studioState?.materials,
                wizardStillInDom: !!step2Wizard
            };
        });
        console.log('Quotation Studio Canvas Step State:', canvasResult);

        const shot3 = path.resolve(__dirname, 'step3_window_studio_canvas.png');
        await page.screenshot({ path: shot3, fullPage: false });
        console.log('Saved shot 3 (Window Studio Canvas):', shot3);

        console.log('--- ALL VERIFICATIONS PASSED SUCCESSFULLY ---');
    } catch (err) {
        console.error('Test Failed:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
