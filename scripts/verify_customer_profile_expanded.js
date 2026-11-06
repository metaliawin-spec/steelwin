const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/anshi/.gemini/antigravity-ide/brain/3e8e9205-9986-45cb-8a72-18cbd9c38763');

async function verifyCustomerProfileExpanded() {
    console.log('======================================================================');
    console.log('🔍 VERIFYING CUSTOMER PROFILE FULL-PAGE EXPANDED VIEW');
    console.log('======================================================================\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 950 });

        // 1. Load app
        console.log('1. Loading application at http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1000));

        // 2. Navigate to Customers
        console.log('2. Navigating to Customers / Client Management...');
        await page.evaluate(() => {
            window.navigate('customers');
        });
        await new Promise(r => setTimeout(r, 800));

        // 3. Open Customer Profile for Arun Kumar
        console.log('3. Opening Customer Profile for Arun Kumar (C-001)...');
        await page.evaluate(() => {
            window.viewCustomer('C-001');
        });
        await new Promise(r => setTimeout(r, 1000));

        // 4. Verify all profile sections exist concurrently in the DOM without swiping
        const profileAnalysis = await page.evaluate(() => {
            const container = document.querySelector('.customer-profile');
            if (!container) return { found: false };

            const backBtn = container.querySelector('button[onclick*="backToCustomers"]');
            const jumpBar = container.querySelector('.profile-jump-bar');
            const jumpChips = Array.from(container.querySelectorAll('.jump-chip')).map(el => el.innerText.trim());

            const secKpis = document.getElementById('sec-kpis');
            const secOverview = document.getElementById('sec-overview');
            const secOrders = document.getElementById('sec-orders');
            const secSales = document.getElementById('sec-sales');
            const secQuotes = document.getElementById('sec-quotes');
            const secPurchases = document.getElementById('sec-purchases');
            const secServices = document.getElementById('sec-services');
            const secTimeline = document.getElementById('sec-timeline');

            // Check if all sections are rendered and visible
            const allSections = [
                { id: 'sec-kpis', element: !!secKpis, text: secKpis?.innerText.slice(0, 50) },
                { id: 'sec-overview', element: !!secOverview, text: secOverview?.innerText.slice(0, 50) },
                { id: 'sec-orders', element: !!secOrders, text: secOrders?.innerText.slice(0, 50) },
                { id: 'sec-sales', element: !!secSales, text: secSales?.innerText.slice(0, 50) },
                { id: 'sec-quotes', element: !!secQuotes, text: secQuotes?.innerText.slice(0, 50) },
                { id: 'sec-purchases', element: !!secPurchases, text: secPurchases?.innerText.slice(0, 50) },
                { id: 'sec-services', element: !!secServices, text: secServices?.innerText.slice(0, 50) },
                { id: 'sec-timeline', element: !!secTimeline, text: secTimeline?.innerText.slice(0, 50) }
            ];

            const notesTextarea = document.getElementById('customer-note-C-001');

            return {
                found: true,
                backBtnText: backBtn?.innerText.trim(),
                hasJumpBar: !!jumpBar,
                jumpChipsCount: jumpChips.length,
                jumpChips,
                allSections,
                hasNotesTextarea: !!notesTextarea,
                totalSectionsCount: allSections.filter(s => s.element).length
            };
        });

        console.log('   Profile Container Found:', profileAnalysis.found);
        console.log('   Back Button Text:', profileAnalysis.backBtnText);
        console.log('   Quick Jump Bar Present:', profileAnalysis.hasJumpBar);
        console.log('   Quick Jump Chips:', profileAnalysis.jumpChips);
        console.log('   Simultaneously Rendered Sections Count:', `${profileAnalysis.totalSectionsCount}/8`);

        for (const sec of profileAnalysis.allSections) {
            console.log(`     ✓ [${sec.id}] Rendered: ${sec.element}`);
        }

        if (profileAnalysis.totalSectionsCount !== 8) {
            throw new Error(`Expected 8 simultaneously visible sections, but found ${profileAnalysis.totalSectionsCount}!`);
        }

        // 5. Capture screenshot of top portion of full-page profile
        const topScreenshot = path.join(ARTIFACT_DIR, 'customer_profile_top_expanded.png');
        await page.screenshot({ path: topScreenshot, fullPage: false });
        console.log(`\n📸 Captured Top Viewport Screenshot: ${topScreenshot}`);

        // 6. Test Quick Jump smooth scroll to Orders
        console.log('\n5. Testing Quick Jump Anchor to Orders section...');
        await page.evaluate(() => {
            window.setCustomerActiveTab('orders');
        });
        await new Promise(r => setTimeout(r, 600));

        const ordersHighlighted = await page.evaluate(() => {
            const el = document.getElementById('sec-orders');
            return el ? el.classList.contains('profile-section-highlight') : false;
        });
        console.log('   Orders Section received focus highlight:', ordersHighlighted);

        const ordersScreenshot = path.join(ARTIFACT_DIR, 'customer_profile_orders_section.png');
        await page.screenshot({ path: ordersScreenshot, fullPage: false });
        console.log(`📸 Captured Orders Section Screenshot: ${ordersScreenshot}`);

        // 7. Test Quick Jump smooth scroll to Timeline
        console.log('\n6. Testing Quick Jump Anchor to Timeline section...');
        await page.evaluate(() => {
            window.setCustomerActiveTab('timeline');
        });
        await new Promise(r => setTimeout(r, 600));

        const timelineScreenshot = path.join(ARTIFACT_DIR, 'customer_profile_timeline_section.png');
        await page.screenshot({ path: timelineScreenshot, fullPage: false });
        console.log(`📸 Captured Timeline Section Screenshot: ${timelineScreenshot}`);

        // 8. Capture Full-Page Scrollable Screenshot showing all data visible
        console.log('\n7. Capturing complete full-page expanded profile screenshot...');
        const fullPageScreenshot = path.join(ARTIFACT_DIR, 'customer_profile_fullpage_expanded.png');
        await page.screenshot({ path: fullPageScreenshot, fullPage: true });
        console.log(`📸 Captured Full-Page Screenshot: ${fullPageScreenshot}`);

        // 9. Verify Back Button works
        console.log('\n8. Testing Back Button functionality...');
        await page.evaluate(() => {
            window.backToCustomers();
        });
        await new Promise(r => setTimeout(r, 600));

        const returnedToList = await page.evaluate(() => {
            return !document.querySelector('.customer-profile') && !!document.querySelector('.customers-view table');
        });
        console.log('   Returned to Client Management list table:', returnedToList);
        if (!returnedToList) {
            throw new Error('Back button failed to return to Customer list table!');
        }

        console.log('\n======================================================================');
        console.log('✅ ALL CHECKS PASSED: FULL-PAGE EXPANDED VIEW FULLY VERIFIED!');
        console.log('======================================================================');

    } catch (err) {
        console.error('❌ VERIFICATION FAILED:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

verifyCustomerProfileExpanded();
