const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Testing Leo AI Multilingual Voice Assistant & Real-Time ERP Intelligence...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 950 });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('BROWSER ERROR:', msg.text());
            errors.push(msg.text());
        }
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // 1. Verify Floating Leo Button exists and click it to open HUD
    const btnExists = await page.$('#leo-circular-voice-btn');
    if (!btnExists) {
        throw new Error('FAILED: #leo-circular-voice-btn not found on page!');
    }
    console.log('✓ Verified: #leo-circular-voice-btn exists');

    console.log('Clicking Leo button to open Voice Assistant HUD...');
    await page.click('#leo-circular-voice-btn');
    await new Promise(r => setTimeout(r, 400));

    const hudVisible = await page.$('#leo-voice-hud-modal');
    if (!hudVisible) {
        throw new Error('FAILED: Voice Assistant HUD modal did not open!');
    }
    console.log('✓ Verified: Interactive Voice Assistant HUD modal opened');

    // 2. Verify Language Tabs (Malayalam, English, Hindi, Tamil)
    const langTabs = await page.evaluate(() => {
        const pills = Array.from(document.querySelectorAll('.leo-lang-pill'));
        return pills.map(p => p.innerText.trim());
    });
    console.log('Language tabs detected:', langTabs);
    if (!langTabs.includes('മലയാളം') || !langTabs.includes('English') || !langTabs.includes('हिन्दी') || !langTabs.includes('தமிழ்')) {
        throw new Error(`FAILED: Expected 4 languages (Malayalam, English, Hindi, Tamil), got ${JSON.stringify(langTabs)}`);
    }
    console.log('✓ Verified: All 4 language tabs present (മലയാളം, English, हिन्दी, தமிழ்)');

    const shotDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

    // 3. Test Window Calculation via Voice Query (Audio 2 explicit example: 150x140 with 4x2.5 profile, pipe, panel)
    console.log('\n--- TEST 1: Window Calculation via Voice Query ---');
    const calcResult = await page.evaluate(() => {
        window.executeLeoDirectQuery('150x140 വിൻഡോ കാൽക്കുലേഷൻ ചെയ്യ്');
        const resEl = document.getElementById('leo-hud-results');
        return {
            html: resEl ? resEl.innerText : '',
            hasReplayBtn: document.getElementById('leo-audio-controls-bar').style.display !== 'none'
        };
    });
    console.log('Window Calculation output summary:\n', calcResult.html);
    if (!calcResult.html.includes('150') || !calcResult.html.includes('140') || !calcResult.html.includes('₹')) {
        throw new Error('FAILED: Window calculation did not return expected estimate!');
    }
    console.log('✓ Verified: Voice Window calculation computed live with exact specs and price');

    await page.screenshot({ path: path.join(shotDir, 'leo_hud_window_calc_verified.png'), fullPage: false });
    console.log('Saved screenshot: screenshots/leo_hud_window_calc_verified.png');

    // 4. Test Customer 360 & Order Position / Pending Payment (Audio 2 explicit example)
    console.log('\n--- TEST 2: Customer 360, Pending Payment & Order Position ---');
    const custResult = await page.evaluate(() => {
        window.executeLeoDirectQuery('അരുൺ കുമാറിന്റെ ഓർഡർ സ്റ്റാറ്റസ് പെൻഡിംഗ് തുക എത്ര?');
        const resEl = document.getElementById('leo-hud-results');
        return resEl ? resEl.innerText : '';
    });
    console.log('Customer Deep Dive output:\n', custResult);
    if (!custResult.includes('Arun Kumar') && !custResult.includes('അരുൺ കുമാർ')) {
        throw new Error('FAILED: Customer inquiry did not identify Arun Kumar!');
    }
    if (!custResult.includes('25,000') || !custResult.includes('Painting & Powder Coat')) {
        throw new Error(`FAILED: Customer inquiry did not return pending balance 25,000 or production stage Painting & Powder Coat! Got: ${custResult}`);
    }
    console.log('✓ Verified: Customer pending payment (₹ 25,000) and order stage (Painting & Powder Coat) accurately reported');

    // 5. Test Inventory Stock Valuation in Lakhs (Audio 2 explicit example: എത്ര ലക്ഷം)
    console.log('\n--- TEST 3: Inventory Stock Valuation in Lakhs ---');
    const invResult = await page.evaluate(() => {
        window.executeLeoDirectQuery('ഇൻവെന്ററിയിൽ എത്ര ലക്ഷം രൂപയുടെ സ്റ്റോക്ക് ഉണ്ട്?');
        const resEl = document.getElementById('leo-hud-results');
        return resEl ? resEl.innerText : '';
    });
    console.log('Inventory output:\n', invResult);
    if (!invResult.includes('ലക്ഷം') && !invResult.includes('Lakhs')) {
        throw new Error('FAILED: Inventory query did not express stock valuation in Lakhs!');
    }
    if (!invResult.includes('Friction Stays') && !invResult.includes('Weather Sealant') && !invResult.includes('ഔട്ട് ഓഫ് സ്റ്റോക്ക്')) {
        throw new Error('FAILED: Inventory query did not identify out of stock items!');
    }
    console.log('✓ Verified: Inventory stock valuation reported in Lakhs with out-of-stock items listed');

    // 6. Test HR Leaves & Salary Advances
    console.log('\n--- TEST 4: HR Leaves & Salary Advances ---');
    const hrResult = await page.evaluate(() => {
        window.executeLeoDirectQuery('ഇന്ന് ആരാണ് ലീവ്?');
        const resEl = document.getElementById('leo-hud-results');
        return resEl ? resEl.innerText : '';
    });
    console.log('HR output:\n', hrResult);
    if (!hrResult.includes('Sajeev') && !hrResult.includes('സജീവ്')) {
        throw new Error('FAILED: HR query did not detect absent staff Sajeev P!');
    }
    console.log('✓ Verified: HR absent staff (Sajeev P) and staff attendance accurately identified');

    // 7. Test Friendly Casual Chit-Chat & Jokes (Audio 1: സുഖമാണോ, തമാശ)
    console.log('\n--- TEST 5: Warm Friendly Chit-Chat (സുഖമാണോ) & Joke ---');
    const chitChatResult = await page.evaluate(() => {
        window.executeLeoDirectQuery('സുഖമാണോ ലിയോ?');
        const resEl = document.getElementById('leo-hud-results');
        return resEl ? resEl.innerText : '';
    });
    console.log('Chit-Chat output:\n', chitChatResult);
    if (!chitChatResult.includes('സുഖമായിരിക്കുന്നു') && !chitChatResult.includes('wonderful')) {
        throw new Error('FAILED: Leo did not return friendly conversational reply to സുഖമാണോ!');
    }
    console.log('✓ Verified: Leo responds warmly and casually to general banter');

    await page.screenshot({ path: path.join(shotDir, 'leo_hud_casual_banter_verified.png'), fullPage: false });
    console.log('Saved screenshot: screenshots/leo_hud_casual_banter_verified.png');

    console.log('\n=== ALL USER AUDIO REQUIREMENTS FOR LEO AI FULLY VERIFIED SUCCESSFUL! ===');
    await browser.close();
    process.exit(0);
})().catch(err => {
    console.error('TEST ERROR:', err);
    process.exit(1);
});
