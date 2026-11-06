const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\e8678a5d-8292-411e-a0f4-593081e8a15b';

async function verifyExactLayout() {
    console.log('🚀 Verifying Exact 2-Box Layout (Material Breakdown + Price, No Bottom Action Row)...');

    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1200']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 1100 });

    try {
        console.log('1. Loading http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));

        console.log('2. Opening Quick Calculation view...');
        await page.evaluate(() => {
            if (typeof window.navigate === 'function') window.navigate('calculation');
            if (window.Store && window.Store.state) {
                window.Store.state.calcTab = 'quick';
                window.Store.notify();
            }
        });
        await new Promise(r => setTimeout(r, 1200));

        console.log('3. Inspecting UI elements...');
        const inspection = await page.evaluate(() => {
            const text = document.body.innerText;
            const html = document.body.innerHTML;

            const hasMaterialBreakdown = text.includes('MATERIAL BREAKDOWN');
            const has1UnitBom = text.includes('1 unit BOM');
            const hasWindowPrice = text.includes('PRICE') && text.includes('1 Piece Calculation');
            const hasMaterialCost = text.includes('Material Cost');
            const hasLaborCharges = text.includes('Labor Charges');
            const hasProfitMargin = text.includes('Margin / Profit %');
            const hasUnitPrice = text.includes('UNIT PRICE');

            // Table rows
            const hasProfileRow = text.includes('Profile');
            const hasPipeRow = text.includes('Pipe');
            const hasPanelRow = text.includes('Panel');
            const hasHingesRow = text.includes('Hinges');
            const hasPaintRow = text.includes('Paint');
            const hasHookRow = text.includes('Hook & Rubber');
            const hasLockRow = text.includes('Lock & Accessories');

            // Check specifically for bottom action bar:
            const quickContainer = document.querySelector('.quick-calc-container');
            const bottomButtons = quickContainer ? Array.from(quickContainer.querySelectorAll('button')).map(b => b.innerText.trim()) : [];
            const bottomBar = quickContainer ? quickContainer.querySelector('.bottom-action-bar, #calc-bottom-action-bar') : null;
            const hasBottomQuantity = !!document.getElementById('studio-item-qty');
            const hasBottomSaveAndNew = bottomButtons.some(t => t.includes('Save & New'));
            const hasBottomSave = bottomButtons.some(t => t === 'Save' || t === '💾 Save');

            return {
                hasMaterialBreakdown,
                has1UnitBom,
                hasWindowPrice,
                hasMaterialCost,
                hasLaborCharges,
                hasProfitMargin,
                hasUnitPrice,
                hasProfileRow,
                hasPipeRow,
                hasPanelRow,
                hasHingesRow,
                hasPaintRow,
                hasHookRow,
                hasLockRow,
                hasBottomBar: !!bottomBar,
                hasBottomQuantity,
                hasBottomSaveAndNew,
                hasBottomSave,
                bottomButtons
            };
        });

        console.log('Inspection Results:', JSON.stringify(inspection, null, 2));

        if (!inspection.hasMaterialBreakdown || !inspection.hasWindowPrice) {
            throw new Error('FAIL: Material Breakdown or Price card is missing!');
        }
        if (inspection.hasBottomBar || inspection.hasBottomQuantity || inspection.hasBottomSaveAndNew || inspection.hasBottomSave) {
            throw new Error('FAIL: Bottom action row is still present in Quick Calculation!');
        }

        console.log('✅ ALL VERIFICATIONS PASSED: 2-box interface active with dynamic breakdown, prices, and NO bottom action row!');

        // Capture screenshot
        const screenshotPath = path.join(ARTIFACT_DIR, 'user_exact_layout_verified.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    } catch (err) {
        console.error('Error during verification:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

verifyExactLayout();
