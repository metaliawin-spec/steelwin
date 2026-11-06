const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1550, height: 1000 });
        
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Step 1: Navigate to Quick Calc
        console.log('Testing Quick Calc (Manual Calc)...');
        await page.evaluate(() => {
            window.Store.state.calcTab = 'manual';
            window.Store.navigate('calculation');
        });

        await new Promise(r => setTimeout(r, 600));

        const quickCalcTest = await page.evaluate(() => {
            // Find WINDOW PANES toolbar
            const allDivs = Array.from(document.querySelectorAll('div'));
            const panesLabel = allDivs.find(d => d.innerText.trim() === 'WINDOW PANES:');
            const customKalliSpan = allDivs.find(d => d.innerText.includes('Custom Kalli:'));
            const customKalliInput = customKalliSpan ? customKalliSpan.querySelector('input') : null;
            const buttons = customKalliSpan?.parentElement ? Array.from(customKalliSpan.parentElement.querySelectorAll('button')).map(b => ({
                text: b.innerText.trim(),
                bg: b.style.background
            })) : [];

            return {
                hasPanesLabel: !!panesLabel,
                labelColor: panesLabel?.style.color,
                hasCustomKalliInput: !!customKalliInput,
                customKalliVal: customKalliInput?.value,
                buttonCount: buttons.length,
                buttons
            };
        });

        console.log('Quick Calc Toolbar Test:', JSON.stringify(quickCalcTest, null, 2));

        // Click 2 Kalli button in Quick Calc
        console.log('Clicking 2 Kalli in Quick Calc...');
        await page.evaluate(() => {
            window.loadPreset(2);
        });
        await new Promise(r => setTimeout(r, 400));

        const after2Kalli = await page.evaluate(() => {
            const allDivs = Array.from(document.querySelectorAll('div'));
            const customKalliSpan = allDivs.find(d => d.innerText.includes('Custom Kalli:'));
            const customKalliInput = customKalliSpan?.querySelector('input');
            const btn2 = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '2 Kalli');
            return {
                customKalliVal: customKalliInput?.value,
                btn2Bg: btn2?.style.background
            };
        });
        console.log('After clicking 2 Kalli:', JSON.stringify(after2Kalli, null, 2));

        // Step 2: Test Studio Calculation Canvas
        console.log('Switching to Quotation Studio (Step 3 Canvas)...');
        await page.evaluate(() => {
            window.startQuotationStudio({
                name: 'Anand Varma',
                place: 'Kochi',
                city: 'Ernakulam',
                pincode: '682001',
                mobile: '9447000000'
            });
            window.Store.state.calcTab = 'quotes';
            window.Store.notify();
        });

        await new Promise(r => setTimeout(r, 600));

        const studioTest = await page.evaluate(() => {
            const allDivs = Array.from(document.querySelectorAll('div'));
            const panesLabel = allDivs.find(d => d.innerText.trim() === 'WINDOW PANES:');
            const customKalliSpan = allDivs.find(d => d.innerText.includes('Custom Kalli:'));
            const customKalliInput = customKalliSpan ? customKalliSpan.querySelector('input') : null;
            const buttons = customKalliSpan?.parentElement ? Array.from(customKalliSpan.parentElement.querySelectorAll('button')).map(b => ({
                text: b.innerText.trim(),
                bg: b.style.background
            })) : [];

            // Quantity element
            const qtyInput = document.getElementById('studio-item-qty');
            const qtyComputed = qtyInput ? window.getComputedStyle(qtyInput) : null;

            return {
                hasPanesLabel: !!panesLabel,
                hasCustomKalliInput: !!customKalliInput,
                customKalliVal: customKalliInput?.value,
                buttonCount: buttons.length,
                buttons,
                qtyVal: qtyInput?.value,
                qtyAppearance: qtyComputed?.appearance || qtyComputed?.webkitAppearance
            };
        });

        console.log('Studio Canvas Toolbar & Qty Test:', JSON.stringify(studioTest, null, 2));

        // Test typing Custom Kalli = 4
        console.log('Testing custom kalli = 4 via input change...');
        await page.evaluate(() => {
            window.loadStudioPreset(4);
        });
        await new Promise(r => setTimeout(r, 400));

        const afterCustom4 = await page.evaluate(() => {
            const customKalliInput = document.querySelector('input[onchange*="loadStudioPreset"]');
            const btn4 = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '4 Kalli');
            const designModelTitle = Array.from(document.querySelectorAll('div')).find(d => d.innerText.includes('DESIGN MODEL'))?.nextElementSibling?.innerText;
            return {
                customKalliVal: customKalliInput?.value,
                btn4Bg: btn4?.style.background,
                designModelTitle
            };
        });
        console.log('After setting Custom Kalli to 4:', JSON.stringify(afterCustom4, null, 2));

        // Capture screenshot of the toolbar in action
        await page.screenshot({ path: 'scripts/window_panes_toolbar_verified.png', fullPage: false });
        console.log('Captured scripts/window_panes_toolbar_verified.png');

    } catch (err) {
        console.error('Error during test:', err);
    } finally {
        await browser.close();
    }
})();
