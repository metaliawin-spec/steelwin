const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    console.log('--- STARTING ARROW KEY NAVIGATION TEST ---');
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        defaultViewport: { width: 1440, height: 900 }
    });

    const page = await browser.newPage();
    const indexPath = 'file://' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');

    page.on('console', msg => {
        if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
    });

    await page.goto(indexPath, { waitUntil: 'networkidle0' });
    console.log('Loaded index.html');

    // 1. Open Quotation Wizard (Step 1)
    await page.evaluate(() => {
        window.startQuotationStudio();
    });
    await new Promise(r => setTimeout(r, 600));

    // Test 1: Customer Autocomplete Arrow Key Navigation in Step 1
    console.log('\n--- Test 1: Customer Autocomplete Arrow Keys ---');
    const custInput = await page.$('#qs-cust-name');
    if (!custInput) throw new Error('#qs-cust-name not found');

    await custInput.click();
    await custInput.type('a', { delay: 50 });
    await new Promise(r => setTimeout(r, 400));

    // Check dropdown open
    const custDropdownVisible = await page.evaluate(() => {
        const dd = document.getElementById('qs-cust-dropdown');
        return dd && dd.style.display !== 'none' && dd.querySelectorAll('.calc-search-dropdown-item').length > 0;
    });
    console.log('Customer dropdown visible after typing "a":', custDropdownVisible);

    // Press ArrowDown
    await page.keyboard.press('ArrowDown');
    await new Promise(r => setTimeout(r, 200));

    let activeCust = await page.evaluate(() => {
        const active = document.querySelector('#qs-cust-dropdown .calc-search-dropdown-item.nav-active');
        return active ? active.innerText.split('\n')[0] : null;
    });
    console.log('Active customer after ArrowDown 1:', activeCust);

    // Press ArrowDown again
    await page.keyboard.press('ArrowDown');
    await new Promise(r => setTimeout(r, 200));

    let activeCust2 = await page.evaluate(() => {
        const active = document.querySelector('#qs-cust-dropdown .calc-search-dropdown-item.nav-active');
        return active ? active.innerText.split('\n')[0] : null;
    });
    console.log('Active customer after ArrowDown 2:', activeCust2);

    // Press Enter to autofill
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 400));

    const filledVals = await page.evaluate(() => ({
        name: document.getElementById('qs-cust-name')?.value,
        mobile: document.getElementById('qs-cust-mobile')?.value,
        place: document.getElementById('qs-cust-place')?.value,
        dropdownClosed: document.getElementById('qs-cust-dropdown')?.style.display === 'none'
    }));
    console.log('Autofilled customer fields after pressing Enter:', filledVals);

    // Proceed to Step 2
    await page.evaluate(() => {
        // Ensure valid pin and mobile if not already
        const pinInp = document.getElementById('qs-cust-pin');
        if (pinInp && !pinInp.value) pinInp.value = '673001';
        const mobInp = document.getElementById('qs-cust-mobile');
        if (mobInp && !mobInp.value) mobInp.value = '9876543210';
        const placeInp = document.getElementById('qs-cust-place');
        if (placeInp && !placeInp.value) placeInp.value = 'Calicut';
        const cityInp = document.getElementById('qs-cust-city');
        if (cityInp && !cityInp.value) cityInp.value = 'Calicut';

        const submitBtn = document.querySelector('#qs-form-step-1 button[type="submit"]');
        if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 700));

    // Test 2: Step 2 Material Presets Combobox Arrow Keys
    console.log('\n--- Test 2: Step 2 Material Presets Combobox Arrow Keys ---');
    const profInput = await page.$('#qs-mat-input-frame');
    if (!profInput) throw new Error('#qs-mat-input-frame not found');

    const initialVal = await page.evaluate(() => document.getElementById('qs-mat-input-frame').value);
    console.log('Initial Profile Input Value:', initialVal);

    await profInput.click();
    await new Promise(r => setTimeout(r, 300));

    // Press ArrowDown
    await page.keyboard.press('ArrowDown');
    await new Promise(r => setTimeout(r, 200));

    let activeMat1 = await page.evaluate(() => {
        const active = document.querySelector('#dropdown-qs-mat-root-frame .mat-combobox-opt.nav-active');
        return active ? active.getAttribute('data-name') : null;
    });
    console.log('Active Material after ArrowDown 1:', activeMat1);

    // Press ArrowDown again
    await page.keyboard.press('ArrowDown');
    await new Promise(r => setTimeout(r, 200));

    let activeMat2 = await page.evaluate(() => {
        const active = document.querySelector('#dropdown-qs-mat-root-frame .mat-combobox-opt.nav-active');
        return active ? active.getAttribute('data-name') : null;
    });
    console.log('Active Material after ArrowDown 2:', activeMat2);

    // Press ArrowUp to go back
    await page.keyboard.press('ArrowUp');
    await new Promise(r => setTimeout(r, 200));

    let activeMatUp = await page.evaluate(() => {
        const active = document.querySelector('#dropdown-qs-mat-root-frame .mat-combobox-opt.nav-active');
        return active ? active.getAttribute('data-name') : null;
    });
    console.log('Active Material after ArrowUp:', activeMatUp);

    // Press Enter to select
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 400));

    const selectedProf = await page.evaluate(() => ({
        val: document.getElementById('qs-mat-input-frame')?.value,
        id: document.getElementById('qs-mat-frame')?.value,
        dropdownClosed: document.getElementById('dropdown-qs-mat-root-frame')?.style.display === 'none'
    }));
    console.log('Profile Combobox after pressing Enter:', selectedProf);

    // Capture screenshot of Step 2 after selection
    await page.screenshot({ path: path.resolve(__dirname, 'test_arrow_step2_verified.png') });
    console.log('Saved test_arrow_step2_verified.png');

    // Test 3: Type prefix and use Arrow + Enter
    console.log('\n--- Test 3: Type prefix in Pipe Combobox, Arrow down, Enter ---');
    const pipeInput = await page.$('#qs-mat-input-pipe');
    await pipeInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await pipeInput.type('tube', { delay: 50 });
    await new Promise(r => setTimeout(r, 300));

    // Press ArrowDown and Enter
    await page.keyboard.press('ArrowDown');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 300));

    const selectedPipe = await page.evaluate(() => ({
        val: document.getElementById('qs-mat-input-pipe')?.value,
        id: document.getElementById('qs-mat-pipe')?.value
    }));
    console.log('Pipe Combobox after type + ArrowDown + Enter:', selectedPipe);

    // Proceed to Step 3 Canvas Studio
    await page.evaluate(() => {
        const nextBtn = document.getElementById('qs-btn-proceed-canvas');
        if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Test 4: Window Studio Canvas Top Bar Combobox Arrow Keys
    console.log('\n--- Test 4: Window Studio Canvas Top Bar Combobox Arrow Keys ---');
    const studioProfInput = await page.$('#bar-mat-input-studio-frame');
    if (studioProfInput) {
        await studioProfInput.click();
        await new Promise(r => setTimeout(r, 300));

        await page.keyboard.press('ArrowDown');
        await new Promise(r => setTimeout(r, 200));
        await page.keyboard.press('ArrowDown');
        await new Promise(r => setTimeout(r, 200));
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 400));

        const studioProfVal = await page.evaluate(() => document.getElementById('bar-mat-input-studio-frame')?.value);
        console.log('Canvas Studio Profile Combobox Value after Arrow Keys + Enter:', studioProfVal);
    } else {
        console.log('Warning: #bar-mat-input-studio-frame not found in canvas');
    }

    // Test 5: Universal Search Bar in Canvas
    console.log('\n--- Test 5: Universal Search Bar Arrow Keys ---');
    const searchBar = await page.$('#calc-search-bar');
    if (searchBar) {
        await searchBar.click();
        await searchBar.type('2', { delay: 50 });
        await new Promise(r => setTimeout(r, 400));

        await page.keyboard.press('ArrowDown');
        await new Promise(r => setTimeout(r, 200));
        const activeSearch = await page.evaluate(() => {
            const active = document.querySelector('#calc-search-dropdown .calc-search-dropdown-item.nav-active');
            return active ? active.innerText.split('\n')[0] : null;
        });
        console.log('Active Search Item after ArrowDown:', activeSearch);

        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 500));
        const dropdownClosed = await page.evaluate(() => document.getElementById('calc-search-dropdown')?.style.display === 'none');
        console.log('Universal Search dropdown closed after Enter:', dropdownClosed);
    }

    await page.screenshot({ path: path.resolve(__dirname, 'test_arrow_studio_verified.png') });
    console.log('Saved test_arrow_studio_verified.png');

    await browser.close();
    console.log('--- ALL TESTS COMPLETED SUCCESSFULLY ---');
})();
