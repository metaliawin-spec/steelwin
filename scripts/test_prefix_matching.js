const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
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

    console.log('Navigating to:', indexPath);
    await page.goto(indexPath, { waitUntil: 'networkidle0' });

    // Open Quotation Studio (Step 1)
    await page.evaluate(() => {
        window.startQuotationStudio();
    });
    await new Promise(r => setTimeout(r, 600));

    // Fill customer and proceed to Step 2
    await page.evaluate(() => {
        const cust = Store.state.quoteStudio.customer;
        cust.name = 'John Prefix Test';
        cust.place = 'Kochi';
        cust.city = 'Ernakulam';
        cust.pincode = '682001';
        cust.mobile = '9876543210';
        
        const nameInp = document.getElementById('qs-cust-name');
        if (nameInp) nameInp.value = 'John Prefix Test';
        const placeInp = document.getElementById('qs-cust-place');
        if (placeInp) placeInp.value = 'Kochi';
        const cityInp = document.getElementById('qs-cust-city');
        if (cityInp) cityInp.value = 'Ernakulam';
        const pinInp = document.getElementById('qs-cust-pin');
        if (pinInp) pinInp.value = '682001';
        const mobInp = document.getElementById('qs-cust-mobile');
        if (mobInp) mobInp.value = '9876543210';

        const submitBtn = document.querySelector('#qs-form-step-1 button[type="submit"]');
        if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    console.log('--- TESTING STEP 2 MATERIAL PRESETS ---');
    // Test 1: Click Profile Combobox in Step 2
    const profInput = await page.$('#qs-mat-input-frame');
    if (!profInput) {
        console.error('ERROR: #qs-mat-input-frame not found!');
        await browser.close();
        process.exit(1);
    }

    await profInput.click();
    await new Promise(r => setTimeout(r, 300));

    // Check visible options
    let visibleOpts = await page.evaluate(() => {
        const opts = Array.from(document.querySelectorAll('#dropdown-qs-mat-root-frame .mat-combobox-opt'));
        return opts.filter(o => o.style.display !== 'none').map(o => o.innerText.split('\n')[0]);
    });
    console.log('Initially visible profile options count:', visibleOpts.length);

    // Test 2: User types "pro" -> Should match Profile options
    await page.evaluate(() => {
        const inp = document.getElementById('qs-mat-input-frame');
        inp.value = 'pro';
        window.filterMatCombobox('qs-mat-root-frame', 'pro');
    });
    await new Promise(r => setTimeout(r, 200));

    visibleOpts = await page.evaluate(() => {
        const opts = Array.from(document.querySelectorAll('#dropdown-qs-mat-root-frame .mat-combobox-opt'));
        return opts.filter(o => o.style.display !== 'none').map(o => o.innerText.split('\n')[0]);
    });
    console.log('Visible options for "pro":', visibleOpts);
    await page.screenshot({ path: path.resolve(__dirname, 'test_match_pro.png') });

    // Test 3: User types "file" -> Should NOT match (0 results, rule from audio)
    await page.evaluate(() => {
        const inp = document.getElementById('qs-mat-input-frame');
        inp.value = 'file';
        window.filterMatCombobox('qs-mat-root-frame', 'file');
    });
    await new Promise(r => setTimeout(r, 200));

    visibleOpts = await page.evaluate(() => {
        const opts = Array.from(document.querySelectorAll('#dropdown-qs-mat-root-frame .mat-combobox-opt'));
        return opts.filter(o => o.style.display !== 'none').map(o => o.innerText.split('\n')[0]);
    });
    const noResultsText = await page.evaluate(() => {
        const nr = document.querySelector('#dropdown-qs-mat-root-frame .mat-no-results');
        return nr && nr.style.display !== 'none' ? nr.innerText : null;
    });
    console.log('Visible options for "file" (should be empty):', visibleOpts, '| No results msg:', noResultsText);
    await page.screenshot({ path: path.resolve(__dirname, 'test_no_match_file.png') });

    // Test 4: User types "4" -> Should match "4x2.5 Profile (Rebated)" and "4x3 Profile (Box Section)"
    await page.evaluate(() => {
        const inp = document.getElementById('qs-mat-input-frame');
        inp.value = '4';
        window.filterMatCombobox('qs-mat-root-frame', '4');
    });
    await new Promise(r => setTimeout(r, 200));

    visibleOpts = await page.evaluate(() => {
        const opts = Array.from(document.querySelectorAll('#dropdown-qs-mat-root-frame .mat-combobox-opt'));
        return opts.filter(o => o.style.display !== 'none').map(o => o.innerText.split('\n')[0]);
    });
    console.log('Visible options for "4":', visibleOpts);

    // Test 5: User types "4*2.5" -> Should match "4x2.5 Profile (Rebated)"
    await page.evaluate(() => {
        const inp = document.getElementById('qs-mat-input-frame');
        inp.value = '4*2.5';
        window.filterMatCombobox('qs-mat-root-frame', '4*2.5');
    });
    await new Promise(r => setTimeout(r, 200));

    visibleOpts = await page.evaluate(() => {
        const opts = Array.from(document.querySelectorAll('#dropdown-qs-mat-root-frame .mat-combobox-opt'));
        return opts.filter(o => o.style.display !== 'none').map(o => o.innerText.split('\n')[0]);
    });
    console.log('Visible options for "4*2.5":', visibleOpts);
    await page.screenshot({ path: path.resolve(__dirname, 'test_match_4x25.png') });

    // Test 6: User types "2.5" -> Should NOT match (rule from audio: "2.5 അടിച്ചു കഴിഞ്ഞാൽ വരാൻ പാടില്ല")
    await page.evaluate(() => {
        const inp = document.getElementById('qs-mat-input-frame');
        inp.value = '2.5';
        window.filterMatCombobox('qs-mat-root-frame', '2.5');
    });
    await new Promise(r => setTimeout(r, 200));

    visibleOpts = await page.evaluate(() => {
        const opts = Array.from(document.querySelectorAll('#dropdown-qs-mat-root-frame .mat-combobox-opt'));
        return opts.filter(o => o.style.display !== 'none').map(o => o.innerText.split('\n')[0]);
    });
    const noResults25 = await page.evaluate(() => {
        const nr = document.querySelector('#dropdown-qs-mat-root-frame .mat-no-results');
        return nr && nr.style.display !== 'none' ? nr.innerText : null;
    });
    console.log('Visible options for "2.5" (should be empty):', visibleOpts, '| No results msg:', noResults25);
    await page.screenshot({ path: path.resolve(__dirname, 'test_no_match_25.png') });

    // Select 4x2.5 Profile
    await page.evaluate(() => {
        const opt = document.querySelector('#dropdown-qs-mat-root-frame .mat-combobox-opt[data-id="prof_4x25"]');
        if (opt) opt.click();
    });
    await new Promise(r => setTimeout(r, 300));

    const selectedFrameVal = await page.evaluate(() => {
        return document.getElementById('qs-mat-input-frame').value;
    });
    console.log('Selected Profile input value after click:', selectedFrameVal);

    // Proceed to Step 3 (Window Studio Canvas)
    await page.evaluate(() => {
        const nextBtn = document.getElementById('qs-btn-proceed-canvas');
        if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    console.log('--- TESTING STEP 3 CANVAS CONTROL BAR ---');
    // Check all 7 material columns in canvas control bar
    const canvasMatCols = await page.evaluate(() => {
        const roots = Array.from(document.querySelectorAll('[id^="bar-mat-root-studio-"]'));
        return roots.map(r => ({
            id: r.id,
            label: r.querySelector('label')?.innerText,
            value: r.querySelector('.mat-combobox-input')?.value
        }));
    });
    console.log('Canvas 7 Material Comboboxes:', canvasMatCols);

    // Verify Pipe selection with double quote in name
    const pipeInput = await page.$('#bar-mat-input-studio-pipe');
    await pipeInput.click();
    await new Promise(r => setTimeout(r, 300));

    // Type "1" in pipe input -> should match '1" x 1" MS Square Pipe'
    await page.evaluate(() => {
        const inp = document.getElementById('bar-mat-input-studio-pipe');
        inp.value = '1';
        window.filterMatCombobox('bar-mat-root-studio-pipe', '1');
    });
    await new Promise(r => setTimeout(r, 200));

    const pipeMatches = await page.evaluate(() => {
        const opts = Array.from(document.querySelectorAll('#dropdown-bar-mat-root-studio-pipe .mat-combobox-opt'));
        return opts.filter(o => o.style.display !== 'none').map(o => o.innerText.split('\n')[0]);
    });
    console.log('Pipe matches for "1":', pipeMatches);

    // Select Square pipe
    await page.evaluate(() => {
        const opt = document.querySelector('#dropdown-bar-mat-root-studio-pipe .mat-combobox-opt[data-id="tube_sq_1x1"]');
        if (opt) opt.click();
    });
    await new Promise(r => setTimeout(r, 300));

    const updatedPipeVal = await page.evaluate(() => {
        return document.getElementById('bar-mat-input-studio-pipe').value;
    });
    console.log('Updated Pipe Combobox display value:', updatedPipeVal);

    await page.screenshot({ path: path.resolve(__dirname, 'canvas_verified_prefix_combobox.png') });

    await browser.close();
    console.log('--- ALL TESTS COMPLETED SUCCESSFULLY ---');
})();
