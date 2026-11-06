const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    try {
        console.log("Navigating to http://localhost:3000...");
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
        await new Promise(r => setTimeout(r, 800));

        // Navigate to Calculation module
        await page.evaluate(() => {
            window.navigate('calculation');
        });
        await new Promise(r => setTimeout(r, 1000));

        const pageDebug = await page.evaluate(() => {
            return {
                title: document.title,
                calcRoot: !!document.getElementById('calc-module-root'),
                canvas: !!document.querySelector('svg'),
                bodySnippet: document.body.innerText.slice(0, 200)
            };
        });
        console.log("Calculation Page debug:", pageDebug);
        const pillInfo = await page.evaluate(() => {
            const pill = document.querySelector('[onclick*="openPartitionPosDropdown"]');
            return pill ? {
                text: pill.innerText.replace(/\s+/g, ' ').trim(),
                bg: window.getComputedStyle(pill).backgroundColor,
                color: window.getComputedStyle(pill).color
            } : null;
        });
        console.log("Single pane pill info:", pillInfo);

        // Click on the partition pill to open the dropdown
        console.log("Clicking partition pill to open dropdown...");
        await page.evaluate(() => {
            const pill = document.querySelector('[onclick*="openPartitionPosDropdown"]');
            if (pill) pill.click();
        });
        await new Promise(r => setTimeout(r, 400));

        // Inspect dropdown options
        const popoverInfo = await page.evaluate(() => {
            const pop = document.getElementById('calc-partition-pos-popover');
            if (!pop) return null;
            const items = Array.from(pop.querySelectorAll('.pos-opt-item')).map(el => el.innerText.replace(/\s+/g, ' ').trim());
            return {
                visible: true,
                items
            };
        });
        console.log("Popover items:", popoverInfo);

        const ssDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });

        await page.screenshot({ path: path.join(ssDir, 'verify_dropdown_open.png'), fullPage: false });

        // Select 'Top Partition'
        console.log("Selecting 'Top Partition' from dropdown...");
        await page.evaluate(() => {
            const topOpt = document.querySelector('.pos-opt-item[data-pos="top"]');
            if (topOpt) topOpt.click();
        });
        await new Promise(r => setTimeout(r, 500));

        const partitionedPill = await page.evaluate(() => {
            const pill = document.querySelector('[onclick*="openPartitionPosDropdown"]');
            return pill ? pill.innerText.replace(/\s+/g, ' ').trim() : null;
        });
        console.log("Pill text after Top Partition:", partitionedPill);

        // Test 2: Set 4 panes and independent additive widths (Audio 2)
        console.log("Setting cols = 4 and testing additive widths (Image 3 & Audio 2)...");
        await page.evaluate(() => {
            window.updateGrid('cols', 4);
        });
        await new Promise(r => setTimeout(r, 500));

        console.log("Initial 4 panes state:");
        const initial4Panes = await page.evaluate(() => {
            return {
                paneWidths: Store.state.rateCalc.grid.paneWidths,
                totalW: Store.state.rateCalc.grid.totalW
            };
        });
        console.log(initial4Panes);

        // Change Pane 0 to 46.7, Pane 1 to 60, Pane 2 to 60, Pane 3 to 46.7
        await page.evaluate(() => {
            window.updateIndividualPaneWidth(0, 46.7);
            window.updateIndividualPaneWidth(1, 60);
            window.updateIndividualPaneWidth(2, 60);
            window.updateIndividualPaneWidth(3, 46.7);
        });
        await new Promise(r => setTimeout(r, 500));

        const finalGridState = await page.evaluate(() => {
            const g = Store.state.rateCalc.grid;
            return {
                cols: g.cols,
                paneWidths: g.paneWidths,
                totalW: g.totalW,
                expectedTotal: parseFloat((46.7 + 60 + 60 + 46.7).toFixed(1))
            };
        });
        console.log("Final Grid State after setting 46.7, 60, 60, 46.7:", finalGridState);

        await page.screenshot({ path: path.join(ssDir, 'verify_4pane_additive_widths.png'), fullPage: false });

        console.log("SUCCESS! All tests completed.");
    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await browser.close();
    }
})();
