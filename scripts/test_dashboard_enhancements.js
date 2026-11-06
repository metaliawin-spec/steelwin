const puppeteer = require('puppeteer');

(async () => {
    console.log('--- STARTING VERIFICATION: DASHBOARD ENHANCEMENTS ---');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    try {
        console.log('1. Loading dashboard at http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
        await page.evaluate(() => window.navigate('dashboard'));
        await new Promise(r => setTimeout(r, 600));

        // --- TEST 1: Auto-scrolling 'Visiting Schedules' ---
        console.log('\n--- VERIFYING REQUIREMENT 1: Auto-scrolling Visiting Schedules ---');
        const marqueeCheck = await page.evaluate(() => {
            const viewport = document.getElementById('visiting-viewport');
            const track = document.getElementById('visiting-track');
            if (!viewport || !track) return { success: false, reason: 'Viewport or track element missing' };

            const computedStyle = window.getComputedStyle(track);
            const animName = computedStyle.animationName;
            const items = Array.from(track.querySelectorAll('.schedule-marquee-item')).map(el => el.innerText);

            const hasLuxuryVilla = items.some(t => t.includes('Luxury Villa Project'));
            const count = items.length;

            return {
                success: animName.includes('marqueeScrollVertical') && count > 4 && hasLuxuryVilla,
                animName,
                itemCount: count,
                hasLuxuryVilla,
                items: items.slice(0, 4)
            };
        });

        console.log('   Animation name:', marqueeCheck.animName);
        console.log('   Total items in marquee track:', marqueeCheck.itemCount);
        console.log('   Contains "Luxury Villa Project":', marqueeCheck.hasLuxuryVilla);

        if (!marqueeCheck.success) {
            throw new Error(`Visiting Schedules auto-scroll check failed: ${JSON.stringify(marqueeCheck)}`);
        }
        console.log('   ✓ Auto-scrolling Visiting Schedules vertical marquee verified successfully.');

        // --- TEST 2: Inventory Alerts Widget ---
        console.log('\n--- VERIFYING REQUIREMENT 2: Inventory Alerts Widget ---');
        const inventoryAlertsCheck = await page.evaluate(() => {
            const bodyText = document.body.innerText.toLowerCase();
            const hasInvAlerts = bodyText.includes('inventory alerts');
            const hasOutOfStock = bodyText.includes('out of stock');
            const hasOutOfStockSoon = bodyText.includes('out of stock soon');

            const alertBoxes = Array.from(document.querySelectorAll('.inventory-alert-box')).map(el => el.innerText);

            return {
                hasInvAlerts,
                hasOutOfStock,
                hasOutOfStockSoon,
                alertBoxesCount: alertBoxes.length,
                alertBoxes
            };
        });

        console.log('   Has "Inventory Alerts" caption:', inventoryAlertsCheck.hasInvAlerts);
        console.log('   Has "Out of Stock" section:', inventoryAlertsCheck.hasOutOfStock);
        console.log('   Has "Out of Stock Soon" section:', inventoryAlertsCheck.hasOutOfStockSoon);

        if (!inventoryAlertsCheck.hasInvAlerts || !inventoryAlertsCheck.hasOutOfStock || !inventoryAlertsCheck.hasOutOfStockSoon) {
            throw new Error(`Inventory Alerts check failed: ${JSON.stringify(inventoryAlertsCheck)}`);
        }
        console.log('   ✓ Inventory Alerts Widget (Out of Stock & Out of Stock Soon) verified successfully.');

        // --- TEST 3: Delivered Orders Widget ---
        console.log('\n--- VERIFYING REQUIREMENT 3: Delivered Orders Widget ---');
        const deliveredOrdersCheck = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const hasDeliveredHeading = bodyText.includes('Delivered Orders');
            const deliveredCards = Array.from(document.querySelectorAll('.delivered-order-card')).map(el => el.innerText);

            return {
                hasDeliveredHeading,
                cardCount: deliveredCards.length,
                firstCardPreview: deliveredCards[0] || 'none'
            };
        });

        console.log('   Has "Delivered Orders" heading:', deliveredOrdersCheck.hasDeliveredHeading);
        console.log('   Delivered order cards rendered:', deliveredOrdersCheck.cardCount);
        console.log('   Delivered order preview:', deliveredOrdersCheck.firstCardPreview.replace(/\n/g, ' '));

        if (!deliveredOrdersCheck.hasDeliveredHeading || deliveredOrdersCheck.cardCount === 0) {
            throw new Error(`Delivered Orders check failed: ${JSON.stringify(deliveredOrdersCheck)}`);
        }
        console.log('   ✓ Delivered Orders Widget verified successfully.');

        // --- TEST 4: 'Today Focus' UI Fix (Solid White View All Button) ---
        console.log('\n--- VERIFYING REQUIREMENT 4: Today Focus "View All" Button White Background ---');
        const viewAllBtnCheck = await page.evaluate(() => {
            const btn = document.querySelector('.btn-view-all-white') || document.querySelector('button[onclick*="showAllTasksModal"]');
            if (!btn) return { exists: false };

            const style = window.getComputedStyle(btn);
            const bgColor = style.backgroundColor;
            const textColor = style.color;
            const isWhite = bgColor === 'rgb(255, 255, 255)' || bgColor === '#ffffff' || bgColor === 'white';

            return {
                exists: true,
                bgColor,
                textColor,
                isWhite,
                innerText: btn.innerText.trim()
            };
        });

        console.log('   Button found:', viewAllBtnCheck.exists);
        console.log('   Computed Background Color:', viewAllBtnCheck.bgColor);
        console.log('   Computed Text Color:', viewAllBtnCheck.textColor);
        console.log('   Is Solid White:', viewAllBtnCheck.isWhite);

        if (!viewAllBtnCheck.exists || !viewAllBtnCheck.isWhite) {
            throw new Error(`Today Focus View All button color check failed: ${JSON.stringify(viewAllBtnCheck)}`);
        }
        console.log('   ✓ "Today Focus" View All button has solid white background and crisp contrast.');

        // Test clicking View All button
        await page.click('.btn-view-all-white');
        await new Promise(r => setTimeout(r, 400));
        const modalOpen = await page.evaluate(() => !!document.getElementById('tasks-modal'));
        console.log('   View All Tasks modal opened on click:', modalOpen);
        if (modalOpen) {
            await page.evaluate(() => document.getElementById('tasks-modal').remove());
        }

        // Capture screenshot of the enhanced dashboard
        await page.screenshot({ path: 'scripts/dashboard_enhanced_verified.png', fullPage: true });
        console.log('   ✓ Saved full-page dashboard verification screenshot to scripts/dashboard_enhanced_verified.png');

        console.log('\n======================================================');
        console.log('🎉 ALL 4 DASHBOARD REQUIREMENTS VERIFIED 100% SUCCESSFULLY!');
        console.log('======================================================');

    } catch (err) {
        console.error('VERIFICATION ERROR:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
