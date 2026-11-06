const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('--- Starting Leo Multilingual Voice & AI Verification ---');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 950 });

        // Listen for console messages
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('PAGE ERROR:', msg.text());
            }
        });

        // Handle dialogs (alerts)
        page.on('dialog', async dialog => {
            console.log('Dialog popped up:', dialog.message());
            await dialog.dismiss();
        });

        // 1. Navigate to localhost
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // 2. Test Store Leo Voice Settings
        const initialVoiceSettings = await page.evaluate(() => {
            return window.Store ? window.Store.state.leoVoiceSettings : null;
        });
        console.log('Initial Store leoVoiceSettings:', initialVoiceSettings);

        // 3. Test Settings Navigation & Leo Voice Tab
        console.log('Switching to Settings -> Leo Voice & AI tab...');
        await page.evaluate(() => {
            window.navigate('settings');
        });
        await new Promise(r => setTimeout(r, 600));

        await page.evaluate(() => {
            window.switchSettingsTab('leo_voice');
        });
        await new Promise(r => setTimeout(r, 600));

        // Verify the 4 voice models are present in the DOM
        const voiceModelsInfo = await page.evaluate(() => {
            const cards = document.querySelectorAll('.leo-voice-card');
            const models = Array.from(cards).map(card => {
                const title = card.querySelector('h4')?.innerText;
                const badge = card.querySelector('span[style*="border-radius: 9999px"]')?.innerText;
                const subtitle = card.querySelector('span[style*="color: #94a3b8"]')?.innerText;
                return { title, badge, subtitle };
            });
            return {
                cardCount: cards.length,
                models,
                activeLabel: document.getElementById('current-active-voice-label')?.innerText
            };
        });
        console.log('Rendered Voice Models in Settings:', JSON.stringify(voiceModelsInfo, null, 2));

        if (voiceModelsInfo.cardCount !== 4) {
            throw new Error(`Expected exactly 4 voice cards, found ${voiceModelsInfo.cardCount}`);
        }

        // Test Voice Selection in Settings (Select Malavika, Malayali flow)
        console.log('Selecting Malavika (Voice 2) and setting language to ml-IN...');
        await page.evaluate(() => {
            window.selectLeoVoice('malavika-expressive');
            const langSelect = document.getElementById('set-leo-lang');
            if (langSelect) {
                langSelect.value = 'ml-IN';
                window.handleSettingsLanguageChange('ml-IN');
            }
            const rateSlider = document.getElementById('set-leo-rate');
            if (rateSlider) rateSlider.value = '0.95';
            const pitchSlider = document.getElementById('set-leo-pitch');
            if (pitchSlider) pitchSlider.value = '1.1';
            window.saveLeoVoiceSettings();
        });
        await new Promise(r => setTimeout(r, 500));

        // Take screenshot of settings voice tab
        const settingsScreenshotPath = path.join(__dirname, '..', 'leo_voice_settings_verified.png');
        await page.screenshot({ path: settingsScreenshotPath });
        console.log('Saved settings screenshot to:', settingsScreenshotPath);

        // Copy to artifact directory
        const artifactDir = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\2a9f5f14-fdec-4ff4-a3fd-c05be7726680';
        if (fs.existsSync(artifactDir)) {
            fs.copyFileSync(settingsScreenshotPath, path.join(artifactDir, 'leo_voice_settings_verified.png'));
        }

        // 4. Test Leo Live Voice & Multilingual Assistant Modal
        console.log('Opening Leo AI Assistant Modal...');
        await page.evaluate(() => {
            window.openLeoAI();
        });
        await new Promise(r => setTimeout(r, 700));

        // Test query 1: Malayalam Sales Query
        console.log('Testing Query 1: Malayalam Sales Query...');
        const q1Result = await page.evaluate(() => {
            return window.LeoEngine.query('ഈ മാസത്തെ ആകെ വിൽപ്പന എത്രയാണ്?');
        });
        console.log('Q1 Result (Malayalam Sales):', {
            lang: q1Result.lang,
            speechText: q1Result.speechText,
            summaryText: q1Result.summaryText
        });

        // Test query 2: Malayalam Customer Specific Query (Luxury Villa Project profit & expense)
        console.log('Testing Query 2: Malayalam Customer Query for Luxury Villa Project...');
        const q2Result = await page.evaluate(() => {
            return window.LeoEngine.query('ലക്ഷ്വറി വില്ല പ്രോജക്ടിന്റെ ആകെ ലാഭവും ചെലവും എത്രയാണ്?');
        });
        console.log('Q2 Result (Malayalam Customer):', {
            lang: q2Result.lang,
            speechText: q2Result.speechText,
            summaryText: q2Result.summaryText
        });

        // Test query 3: Malayalam HR Leave Query
        console.log('Testing Query 3: Malayalam HR Leave Query...');
        const q3Result = await page.evaluate(() => {
            return window.LeoEngine.query('ഇന്ന് ആരാണ് അവധിയിൽ ഉള്ളത്?');
        });
        console.log('Q3 Result (Malayalam HR Leave):', {
            lang: q3Result.lang,
            speechText: q3Result.speechText,
            summaryText: q3Result.summaryText
        });

        // Test query 4: Malayalam HR Pending Payouts
        console.log('Testing Query 4: Malayalam HR Pending Payouts...');
        const q4Result = await page.evaluate(() => {
            return window.LeoEngine.query('ശമ്പള കുടിശ്ശികയുള്ള ജീവനക്കാർ ആരൊക്കെയാണ്?');
        });
        console.log('Q4 Result (Malayalam Pending Payout):', {
            lang: q4Result.lang,
            speechText: q4Result.speechText,
            summaryText: q4Result.summaryText
        });

        // Test query 5: Hindi Query
        console.log('Testing Query 5: Hindi Purchase Query...');
        const q5Result = await page.evaluate(() => {
            return window.LeoEngine.query('कुल खरीद मात्रा कितनी है?');
        });
        console.log('Q5 Result (Hindi Purchase):', {
            lang: q5Result.lang,
            speechText: q5Result.speechText,
            summaryText: q5Result.summaryText
        });

        // Test query 6: Tamil Query
        console.log('Testing Query 6: Tamil Leave Query...');
        const q6Result = await page.evaluate(() => {
            return window.LeoEngine.query('இன்று யார் விடுப்பில் உள்ளனர்?');
        });
        console.log('Q6 Result (Tamil Leave):', {
            lang: q6Result.lang,
            speechText: q6Result.speechText,
            summaryText: q6Result.summaryText
        });

        // Test query 7: English Net Profit Query
        console.log('Testing Query 7: English Net Profit Query...');
        const q7Result = await page.evaluate(() => {
            return window.LeoEngine.query('What is our net profit for this month?');
        });
        console.log('Q7 Result (English Profit):', {
            lang: q7Result.lang,
            speechText: q7Result.speechText,
            summaryText: q7Result.summaryText
        });

        // Test interactive submission in modal UI
        console.log('Submitting query in Leo Modal UI...');
        await page.evaluate(() => {
            window.submitLeoPrompt('ലക്ഷ്വറി വില്ല പ്രോജക്ടിന്റെ ആകെ ലാഭവും ചെലവും എത്രയാണ്?');
        });
        await new Promise(r => setTimeout(r, 1000));

        // Capture Modal screenshot
        const modalScreenshotPath = path.join(__dirname, '..', 'leo_ai_multilingual_voice_modal_verified.png');
        await page.screenshot({ path: modalScreenshotPath });
        console.log('Saved modal screenshot to:', modalScreenshotPath);
        if (fs.existsSync(artifactDir)) {
            fs.copyFileSync(modalScreenshotPath, path.join(artifactDir, 'leo_ai_multilingual_voice_modal_verified.png'));
        }

        console.log('--- All tests passed successfully! ---');
    } catch (err) {
        console.error('Test failed:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
