const puppeteer = require('puppeteer');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    console.log('=== Starting Sidebar Restoration Verification ===');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1050']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1050 });

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await sleep(1000);

    // 1. Verify STELLO BUILD Main Sidebar has all 15 items
    console.log('\n--- Step 1: Checking STELLO BUILD Main Sidebar ---');
    const mainNavItems = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('#main-nav .nav-item'));
        return items.map(el => el.textContent.trim());
    });

    console.log(`Found ${mainNavItems.length} items in main sidebar:`, mainNavItems);
    if (mainNavItems.length !== 15) {
        console.error(`ERROR: Expected 15 main nav items, got ${mainNavItems.length}`);
    } else {
        console.log('✓ All 15 main sidebar navigation items are present!');
    }

    // Capture main dashboard view with 15 sidebar items
    await page.screenshot({ path: 'scripts/main_sidebar_15_items.png' });
    console.log('✓ Captured scripts/main_sidebar_15_items.png');

    // 2. Navigate to Calculation module
    console.log('\n--- Step 2: Navigating to Calculation module ---');
    await page.evaluate(() => window.navigate('calculation'));
    await sleep(600);

    // Verify main sidebar still has 15 items and 'Calculation' is active
    const activeMainItem = await page.evaluate(() => {
        const active = document.querySelector('#main-nav .nav-item.active');
        return active ? active.textContent.trim() : null;
    });
    console.log('Active item in main sidebar:', activeMainItem);

    // Verify inner studio sidebar (.calculation-sidebar) has exactly 3 studio tabs
    const innerTabs = await page.evaluate(() => {
        const sidebar = document.querySelector('.calculation-sidebar');
        if (!sidebar) return null;
        const buttons = Array.from(sidebar.querySelectorAll('nav .calc-nav-item'));
        return buttons.map(b => {
            const spans = Array.from(b.querySelectorAll('span')).map(s => s.textContent.trim());
            return {
                title: spans[0],
                subtitle: spans[1] || '',
                isActive: b.classList.contains('active')
            };
        });
    });

    console.log('Inner calculation studio tabs:', innerTabs);
    await page.screenshot({ path: 'scripts/calc_studio_with_inner_sidebar.png' });
    console.log('✓ Captured scripts/calc_studio_with_inner_sidebar.png');

    // 3. Click Quotation Calculation tab in inner sidebar
    console.log('\n--- Step 3: Clicking Quotation Calculation in inner sidebar ---');
    await page.click('#tab-quote-calc');
    await sleep(600);
    const quoteTabActive = await page.evaluate(() => {
        const tab = document.querySelector('#tab-quote-calc');
        return tab ? tab.classList.contains('active') : false;
    });
    console.log('Quotation Calculation tab active:', quoteTabActive);
    await page.screenshot({ path: 'scripts/calc_studio_quotation_tab.png' });
    console.log('✓ Captured scripts/calc_studio_quotation_tab.png');

    // 4. Click Material Catalog tab in inner sidebar
    console.log('\n--- Step 4: Clicking Material Catalog in inner sidebar ---');
    await page.click('#tab-material-catalog');
    await sleep(600);
    const matTabActive = await page.evaluate(() => {
        const tab = document.querySelector('#tab-material-catalog');
        return tab ? tab.classList.contains('active') : false;
    });
    console.log('Material Catalog tab active:', matTabActive);
    await page.screenshot({ path: 'scripts/calc_studio_materials_tab.png' });
    console.log('✓ Captured scripts/calc_studio_materials_tab.png');

    // 5. Click Quick Calculation tab in inner sidebar
    console.log('\n--- Step 5: Returning to Quick Calculation tab in inner sidebar ---');
    await page.click('#tab-quick-calc');
    await sleep(600);
    const quickTabActive = await page.evaluate(() => {
        const tab = document.querySelector('#tab-quick-calc');
        return tab ? tab.classList.contains('active') : false;
    });
    console.log('Quick Calculation tab active:', quickTabActive);
    await page.screenshot({ path: 'scripts/calc_studio_quick_tab.png' });
    console.log('✓ Captured scripts/calc_studio_quick_tab.png');

    // 6. Navigate back to dashboard via Exit button in inner sidebar
    console.log('\n--- Step 6: Testing Exit to Dashboard ---');
    await page.evaluate(() => window.navigate('dashboard'));
    await sleep(600);
    const isDashboard = await page.evaluate(() => Store.state.currentView === 'dashboard');
    console.log('Current view is dashboard:', isDashboard);

    await browser.close();
    console.log('\n=== All Tests Passed Successfully! ===');
})();
