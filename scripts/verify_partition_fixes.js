const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        defaultViewport: { width: 1440, height: 960 }
    });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    await page.goto('file://' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    
    console.log('--- 1. Switching to Quick Calculation 3 Kalli ---');
    await page.evaluate(() => {
        Store.state.currentView = 'calculation';
        Store.state.calcTab = 'manual';
        Store.notify();
    });
    await new Promise(r => setTimeout(r, 600));

    // Load 3 Kalli with 150x140
    await page.evaluate(() => {
        window.loadPreset(3);
    });
    await new Promise(r => setTimeout(r, 500));

    // Check Initial 3-Kalli View
    await page.screenshot({ path: 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/test_fix_3kalli_initial.png' });
    console.log('Saved test_fix_3kalli_initial.png');

    // Test Individual Pane Partitioning with Keyboard Shortcuts:
    // Pane 1: PT (Top)
    console.log('--- 2. Testing Shortcuts: Pane 1 -> P, then PT ---');
    await page.evaluate(() => {
        window.selectPane(0); // Select Pane 1
    });
    await page.keyboard.press('p');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('t');
    await new Promise(r => setTimeout(r, 300));

    // Pane 2: PM (Middle / Center)
    console.log('--- 3. Testing Shortcuts: Pane 2 -> P, then PM ---');
    await page.evaluate(() => {
        window.selectPane(1); // Select Pane 2
    });
    await page.keyboard.press('p');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('m');
    await new Promise(r => setTimeout(r, 300));

    // Pane 3: PB (Bottom)
    console.log('--- 4. Testing Shortcuts: Pane 3 -> P, then PB ---');
    await page.evaluate(() => {
        window.selectPane(2); // Select Pane 3
    });
    await page.keyboard.press('p');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('b');
    await new Promise(r => setTimeout(r, 300));

    // Capture Canvas with Pane 1=Top, Pane 2=Middle, Pane 3=Bottom
    await page.screenshot({ path: 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/test_fix_individual_panes_top_mid_bot.png' });
    console.log('Saved test_fix_individual_panes_top_mid_bot.png');

    // Test on-screen controls: Dropdown and Radio
    console.log('--- 5. Testing Manual Controller Radio / Dropdown ---');
    await page.evaluate(() => {
        window.selectPane(1); // Middle pane
        window.setPanePartitionPos(1, 'top'); // Switch Middle pane to top via controller
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/test_fix_middle_pane_switched_to_top.png' });
    console.log('Saved test_fix_middle_pane_switched_to_top.png');

    // Check Input Box Dimensions and Text Values
    const inputMetrics = await page.evaluate(() => {
        const heightInp = document.querySelector('input[onchange*="totalH"]');
        const widthInp = document.querySelector('input[onchange*="totalW"]');
        return {
            heightVal: heightInp ? heightInp.value : null,
            heightWidth: heightInp ? heightInp.offsetWidth : null,
            heightScrollWidth: heightInp ? heightInp.scrollWidth : null,
            widthVal: widthInp ? widthInp.value : null,
            widthWidth: widthInp ? widthInp.offsetWidth : null,
            widthScrollWidth: widthInp ? widthInp.scrollWidth : null,
        };
    });
    console.log('Input Metrics:', inputMetrics);

    await browser.close();
    console.log('All verification steps completed!');
})();
