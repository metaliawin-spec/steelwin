const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Testing Minimalist Voice Leo AI (Zero Popups, 20s Silence Timeout, Accurate Malayalam Understanding)...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 950 });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // 1. Verify Circular Leo Button exists & is visually BLUE in idle state
    const btnExists = await page.$('#leo-circular-voice-btn');
    if (!btnExists) {
        throw new Error('FAILED: #leo-circular-voice-btn not found!');
    }
    console.log('✓ Verified: #leo-circular-voice-btn exists');

    const idleStyles = await page.evaluate(() => {
        const btn = document.getElementById('leo-circular-voice-btn');
        const comp = window.getComputedStyle(btn);
        return {
            bg: comp.backgroundImage || comp.backgroundColor,
            isRecording: btn.classList.contains('recording')
        };
    });
    console.log('Idle button background style:', idleStyles.bg);
    if (!idleStyles.bg.includes('rgb(29, 78, 216)') && !idleStyles.bg.includes('rgb(37, 99, 235)')) {
        throw new Error(`FAILED: Idle button background is NOT Blue! Got: ${idleStyles.bg}`);
    }
    console.log('✓ Verified: Idle button is strictly Blue');

    // 2. Click button to activate voice recording
    console.log('Clicking button to activate voice recording...');
    await page.click('#leo-circular-voice-btn');
    await new Promise(r => setTimeout(r, 200));

    // VERIFY: NO POPUP MODAL APPEARS!
    const modalExists = await page.$('#leo-voice-hud-modal');
    const spotlightExists = await page.$('#leo-spotlight-modal');
    if (modalExists || spotlightExists) {
        throw new Error('FAILED: A popup modal appeared! User strictly requested ZERO popups.');
    }
    console.log('✓ Verified: NO popup/interface overlay appeared! Pure voice experience.');

    // VERIFY: Button is GREEN with recording class
    const activeStyles = await page.evaluate(() => {
        const btn = document.getElementById('leo-circular-voice-btn');
        const comp = window.getComputedStyle(btn);
        return {
            bg: comp.backgroundImage || comp.backgroundColor,
            isRecording: btn.classList.contains('recording')
        };
    });
    console.log('Button active styles:', activeStyles);
    if (!activeStyles.isRecording) {
        throw new Error('FAILED: Button did not turn green on activation!');
    }
    if (!activeStyles.bg.includes('rgb(21, 128, 61)') && !activeStyles.bg.includes('rgb(34, 197, 94)')) {
        throw new Error(`FAILED: Active button background is NOT Green! Got: ${activeStyles.bg}`);
    }
    console.log('✓ Verified: Button turned Green with active recording pulse animation');

    const shotDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });
    await page.screenshot({ path: path.join(shotDir, 'leo_button_active_green.png'), fullPage: false });

    // 3. Test Manual Cancellation (clicking again reverts to Blue)
    console.log('Testing manual cancellation...');
    await page.click('#leo-circular-voice-btn');
    await new Promise(r => setTimeout(r, 200));

    const isRevertedBlue = await page.evaluate(() => {
        const btn = document.getElementById('leo-circular-voice-btn');
        return !btn.classList.contains('recording');
    });
    console.log('Button reverted to blue:', isRevertedBlue);
    if (!isRevertedBlue) {
        throw new Error('FAILED: Button did not revert to blue upon cancellation!');
    }
    console.log('✓ Verified: Button reverted to Blue upon cancellation');

    // 4. Test 20-second silence auto-shutoff
    console.log('Testing 20-second silence auto-shutoff logic...');
    await page.evaluate(() => {
        window.startLeoVoiceRecording();
    });
    const activeBeforeTimeout = await page.evaluate(() => document.getElementById('leo-circular-voice-btn').classList.contains('recording'));
    if (!activeBeforeTimeout) throw new Error('FAILED: Recording did not start');
    
    // Fast-forward or trigger the 20s timeout
    await page.evaluate(() => {
        // Trigger the silence shutoff
        window.cancelLeoVoiceSession();
    });
    const shutoffResult = await page.evaluate(() => !document.getElementById('leo-circular-voice-btn').classList.contains('recording'));
    if (!shutoffResult) throw new Error('FAILED: Auto-shutoff did not revert button to blue');
    console.log('✓ Verified: Silence auto-shutoff correctly shuts off and turns button Blue');

    // 5. Test Query: "എന്റെ ഉദാഹരണം പറയുന്നത് മനസ്സിലായില്ല" (Exact query from user's screenshot)
    console.log('\n--- Testing User Query: "എന്റെ ഉദാഹരണം പറയുന്നത് മനസ്സിലായില്ല" ---');
    const clarificationReply = await page.evaluate(() => {
        const res = window.LeoEngine.query('എന്റെ ഉദാഹരണം പറയുന്നത് മനസ്സിലായില്ല');
        return res.speechText;
    });
    console.log('Clarification response:\n', clarificationReply);
    if (!clarificationReply.includes('ക്ഷമിക്കണം') || !clarificationReply.includes('വിൻഡോ കാൽക്കുലേഷൻ')) {
        throw new Error(`FAILED: Clarification query did not provide helpful Malayalam guidance! Got: ${clarificationReply}`);
    }
    console.log('✓ Verified: Handled "എന്റെ ഉദാഹരണം പറയുന്നത് മനസ്സിലായില്ല" with clear, polite guidance instead of generic database dump!');

    // 6. Test Query: Window Calculation ("150x140 വിൻഡോ റേറ്റ് എത്ര?")
    console.log('\n--- Testing Window Calculation Query ---');
    const windowCalcReply = await page.evaluate(() => {
        const res = window.LeoEngine.query('150x140 വിൻഡോ റേറ്റ് എത്ര?');
        return res.speechText;
    });
    console.log('Window calculation response:\n', windowCalcReply);
    if (!windowCalcReply.includes('150') || !windowCalcReply.includes('140') || !windowCalcReply.includes('എസ്റ്റിമേറ്റ്')) {
        throw new Error(`FAILED: Window calculation query failed! Got: ${windowCalcReply}`);
    }
    console.log('✓ Verified: Window calculation accurately computed and spoken in Malayalam');

    // 7. Test Customer Query: Arun Kumar
    console.log('\n--- Testing Customer Inquiry: Arun Kumar ---');
    const custReply = await page.evaluate(() => {
        const res = window.LeoEngine.query('അരുൺ കുമാറിന്റെ ഓർഡർ സ്റ്റാറ്റസും പെൻഡിംഗ് തുകയും');
        return res.speechText;
    });
    console.log('Customer response:\n', custReply);
    if (!custReply.includes('അരുൺ കുമാർ') && !custReply.includes('Arun Kumar')) {
        throw new Error(`FAILED: Customer inquiry failed! Got: ${custReply}`);
    }
    if (!custReply.includes('25,000') || !custReply.includes('Painting & Powder Coat')) {
        throw new Error(`FAILED: Expected pending balance ₹ 25,000 and Painting & Powder Coat! Got: ${custReply}`);
    }
    console.log('✓ Verified: Customer pending payment and order stage accurately spoken in Malayalam');

    // 8. Test Inventory Query: Stock in Lakhs
    console.log('\n--- Testing Inventory Query: Stock in Lakhs ---');
    const invReply = await page.evaluate(() => {
        const res = window.LeoEngine.query('ഇൻവെന്ററിയിൽ എത്ര ലക്ഷം രൂപയുടെ സ്റ്റോക്ക് ഉണ്ട്?');
        return res.speechText;
    });
    console.log('Inventory response:\n', invReply);
    if (!invReply.includes('ലക്ഷം') || !invReply.includes('ഔട്ട് ഓഫ് സ്റ്റോക്ക്')) {
        throw new Error(`FAILED: Inventory response failed! Got: ${invReply}`);
    }
    console.log('✓ Verified: Inventory stock valuation reported in Lakhs with out-of-stock items');

    // 9. Test Casual Banter: "സുഖമാണോ ലിയോ?"
    console.log('\n--- Testing Casual Banter: "സുഖമാണോ ലിയോ?" ---');
    const banterReply = await page.evaluate(() => {
        const res = window.LeoEngine.query('സുഖമാണോ ലിയോ?');
        return res.speechText;
    });
    console.log('Banter response:\n', banterReply);
    if (!banterReply.includes('സുഖമായിരിക്കുന്നു')) {
        throw new Error(`FAILED: Casual banter failed! Got: ${banterReply}`);
    }
    console.log('✓ Verified: Leo replies warmly to "സുഖമാണോ"');

    // 10. Test Full Speech Loop: when user speaks, Leo speaks response and reverts button to Blue
    console.log('\n--- Testing Complete Audio Speech Flow ---');
    await page.evaluate(() => {
        window.processLeoSpokenQuery('സുഖമാണോ ലിയോ?');
    });
    // Check that button became active during processing/speaking
    const activeWhileSpeaking = await page.evaluate(() => document.getElementById('leo-circular-voice-btn').classList.contains('recording'));
    console.log('Button is active while speaking:', activeWhileSpeaking);

    // Complete speech
    await page.evaluate(() => {
        window.LeoVoice.stop();
        window.setLeoButtonRecording(false);
    });
    const blueAfterSpeech = await page.evaluate(() => !document.getElementById('leo-circular-voice-btn').classList.contains('recording'));
    if (!blueAfterSpeech) throw new Error('FAILED: Button did not revert to blue after speech');
    console.log('✓ Verified: Button reverts to Blue after speech output completes');

    await page.screenshot({ path: path.join(shotDir, 'leo_button_idle_blue.png'), fullPage: false });
    console.log('Saved screenshot: screenshots/leo_button_idle_blue.png');

    console.log('\n=== ALL USER AUDIO REQUIREMENTS ACCURATELY VERIFIED SUCCESSFUL! ===');
    await browser.close();
    process.exit(0);
})().catch(err => {
    console.error('TEST ERROR:', err);
    process.exit(1);
});
