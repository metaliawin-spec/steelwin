const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1550, height: 1050 });
        
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

        // 1. QUICK CALCULATION VERIFICATION
        console.log('--- 1. Testing Quick Calculation Materials ---');
        await page.evaluate(() => {
            window.Store.state.calcTab = 'manual';
            window.Store.navigate('calculation');
        });
        await new Promise(r => setTimeout(r, 600));

        const quickMatKeys = ['frame', 'pipe', 'panel', 'hinge', 'paint', 'hook', 'lock'];
        const quickResults = await page.evaluate((keys) => {
            const results = {};
            keys.forEach(k => {
                const el = document.getElementById(`quick-mat-${k}`);
                if (!el) {
                    results[k] = { exists: false };
                } else {
                    const opts = Array.from(el.options).map(o => ({ value: o.value, text: o.text }));
                    results[k] = {
                        tagName: el.tagName,
                        value: el.value,
                        optionsCount: opts.length,
                        firstOption: opts[0] ? opts[0].text : null,
                        optionsList: opts.map(o => o.text)
                    };
                }
            });
            return results;
        }, quickMatKeys);

        console.log('Quick Calc Dropdown Results:', JSON.stringify(quickResults, null, 2));

        // Test changing material in Quick Calc
        await page.evaluate(() => {
            const sel = document.getElementById('quick-mat-frame');
            if (sel) {
                sel.value = 'prof_4x25';
                sel.dispatchEvent(new Event('change'));
            }
            const pipeSel = document.getElementById('quick-mat-pipe');
            if (pipeSel) {
                pipeSel.value = 'tube_sq_20x20';
                pipeSel.dispatchEvent(new Event('change'));
            }
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: 'scripts/screenshots/quick_calc_materials_verified.png' });
        console.log('Saved scripts/screenshots/quick_calc_materials_verified.png');

        // 2. QUOTATION STUDIO STEP 2 VERIFICATION
        console.log('--- 2. Testing Quotation Studio Step 2 & Canvas ---');
        await page.evaluate(() => {
            window.calcSwitchTab('quotes');
        });
        await new Promise(r => setTimeout(r, 600));

        const step2Results = await page.evaluate((keys) => {
            const results = {};
            keys.forEach(k => {
                const el = document.getElementById(`qs-mat-${k}`);
                if (!el) {
                    results[k] = { exists: false };
                } else {
                    const opts = Array.from(el.options).map(o => ({ value: o.value, text: o.text }));
                    results[k] = {
                        tagName: el.tagName,
                        value: el.value,
                        optionsCount: opts.length,
                        firstOption: opts[0] ? opts[0].text : null
                    };
                }
            });
            return results;
        }, quickMatKeys);
        console.log('Quotation Studio Step 2 Dropdown Results:', JSON.stringify(step2Results, null, 2));

        // Fill customer and proceed to Quotation Canvas
        await page.evaluate(() => {
            if (window.Store.state.quoteStudio) {
                window.Store.state.quoteStudio.customer = {
                    name: 'Test Customer',
                    mobile: '9876543210',
                    place: 'Kochi',
                    city: 'Ernakulam',
                    pincode: '682001'
                };
            }
            window.proceedToQuotationCanvas();
        });
        await new Promise(r => setTimeout(r, 600));

        const studioCanvasResults = await page.evaluate((keys) => {
            const results = {};
            keys.forEach(k => {
                const el = document.getElementById(`studio-mat-${k}`);
                if (!el) {
                    results[k] = { exists: false };
                } else {
                    const opts = Array.from(el.options).map(o => ({ value: o.value, text: o.text }));
                    results[k] = {
                        tagName: el.tagName,
                        value: el.value,
                        optionsCount: opts.length,
                        firstOption: opts[0] ? opts[0].text : null,
                        optionsList: opts.map(o => o.text)
                    };
                }
            });
            return results;
        }, quickMatKeys);
        console.log('Quotation Studio Canvas Dropdown Results:', JSON.stringify(studioCanvasResults, null, 2));

        // Change materials in Studio Canvas
        await page.evaluate(() => {
            const sel = document.getElementById('studio-mat-frame');
            if (sel) {
                sel.value = 'prof_4x2';
                sel.dispatchEvent(new Event('change'));
            }
            const pSel = document.getElementById('studio-mat-panel');
            if (pSel) {
                pSel.value = 'panel_acp_4mm';
                pSel.dispatchEvent(new Event('change'));
            }
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: 'scripts/screenshots/quotation_studio_materials_verified.png' });
        console.log('Saved scripts/screenshots/quotation_studio_materials_verified.png');

        console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
    } catch (err) {
        console.error('Error during test:', err);
    } finally {
        await browser.close();
    }
})();
