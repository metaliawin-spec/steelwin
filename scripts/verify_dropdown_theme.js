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

        // Switch to Quotation Studio Customer Setup (Step 1 & 2)
        console.log('Opening Quotation Studio...');
        await page.evaluate(() => {
            window.Store.state.calcTab = 'quotation_studio';
            window.startQuotationStudio();
            window.Store.navigate('calculation');
        });

        await new Promise(r => setTimeout(r, 600));

        // 1. Verify Dark Mode Styles
        console.log('Testing Dark Mode...');
        await page.evaluate(() => {
            window.setTheme('dark');
        });
        await new Promise(r => setTimeout(r, 400));

        const darkModeResults = await page.evaluate(() => {
            const selectEl = document.getElementById('qs-mat-pipe');
            const options = Array.from(selectEl?.querySelectorAll('option') || []);
            const firstOpt = options[0];
            const secondOpt = options[1];

            const selStyle = window.getComputedStyle(selectEl);
            const firstOptStyle = window.getComputedStyle(firstOpt);
            const secondOptStyle = secondOpt ? window.getComputedStyle(secondOpt) : null;

            return {
                theme: document.documentElement.getAttribute('data-theme'),
                rootColorScheme: window.getComputedStyle(document.documentElement).colorScheme,
                selectBg: selStyle.backgroundColor,
                selectColor: selStyle.color,
                selectColorScheme: selStyle.colorScheme,
                optionCount: options.length,
                firstOptionText: firstOpt?.innerText,
                firstOptionBg: firstOptStyle?.backgroundColor,
                firstOptionColor: firstOptStyle?.color,
                secondOptionText: secondOpt?.innerText,
                secondOptionBg: secondOptStyle?.backgroundColor,
                secondOptionColor: secondOptStyle?.color
            };
        });

        console.log('Dark Mode Dropdown Verification:', JSON.stringify(darkModeResults, null, 2));

        // Take a screenshot of the Step 2 presets in Dark Mode
        await page.screenshot({ path: 'scripts/step2_dark_mode.png', fullPage: false });
        console.log('Saved scripts/step2_dark_mode.png');

        // Also temporarily set size="3" on #qs-mat-pipe so options are visually rendered on screen for the screenshot
        await page.evaluate(() => {
            const pipeSel = document.getElementById('qs-mat-pipe');
            if (pipeSel) pipeSel.setAttribute('size', '4');
        });
        await new Promise(r => setTimeout(r, 200));
        await page.screenshot({ path: 'scripts/dropdown_options_visible_dark.png', fullPage: false });
        console.log('Saved scripts/dropdown_options_visible_dark.png');

        // Reset size
        await page.evaluate(() => {
            const pipeSel = document.getElementById('qs-mat-pipe');
            if (pipeSel) pipeSel.removeAttribute('size');
        });

        // 2. Verify Light Mode Styles
        console.log('Testing Light Mode...');
        await page.evaluate(() => {
            window.setTheme('light');
        });
        await new Promise(r => setTimeout(r, 400));

        const lightModeResults = await page.evaluate(() => {
            const selectEl = document.getElementById('qs-mat-pipe');
            const options = Array.from(selectEl?.querySelectorAll('option') || []);
            const firstOpt = options[0];
            const secondOpt = options[1];

            const selStyle = window.getComputedStyle(selectEl);
            const firstOptStyle = window.getComputedStyle(firstOpt);
            const secondOptStyle = secondOpt ? window.getComputedStyle(secondOpt) : null;

            return {
                theme: document.documentElement.getAttribute('data-theme'),
                rootColorScheme: window.getComputedStyle(document.documentElement).colorScheme,
                selectBg: selStyle.backgroundColor,
                selectColor: selStyle.color,
                selectColorScheme: selStyle.colorScheme,
                optionCount: options.length,
                firstOptionText: firstOpt?.innerText,
                firstOptionBg: firstOptStyle?.backgroundColor,
                firstOptionColor: firstOptStyle?.color,
                secondOptionText: secondOpt?.innerText,
                secondOptionBg: secondOptStyle?.backgroundColor,
                secondOptionColor: secondOptStyle?.color
            };
        });

        console.log('Light Mode Dropdown Verification:', JSON.stringify(lightModeResults, null, 2));

        // Set size="4" on #qs-mat-pipe so options are visually rendered in Light Mode
        await page.evaluate(() => {
            const pipeSel = document.getElementById('qs-mat-pipe');
            if (pipeSel) pipeSel.setAttribute('size', '4');
        });
        await new Promise(r => setTimeout(r, 200));
        await page.screenshot({ path: 'scripts/dropdown_options_visible_light.png', fullPage: false });
        console.log('Saved scripts/dropdown_options_visible_light.png');

        // Reset size and switch back to user's dark mode
        await page.evaluate(() => {
            const pipeSel = document.getElementById('qs-mat-pipe');
            if (pipeSel) pipeSel.removeAttribute('size');
            window.setTheme('dark');
        });

    } catch (err) {
        console.error('Error during verification:', err);
    } finally {
        await browser.close();
    }
})();
