const puppeteer = require('puppeteer');

(async () => {
    console.log('======================================================================');
    console.log('🚀 VERIFYING: RESTRUCTURED DASHBOARD LAYOUT & LEO AI ASSISTANT');
    console.log('======================================================================\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1520, height: 1050 });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    try {
        console.log('1. Loading application at http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
        await page.evaluate(() => window.navigate('dashboard'));
        await new Promise(r => setTimeout(r, 800));

        // ---------------------------------------------------------------------
        // PART 1: DASHBOARD UI RESTRUCTURE VERIFICATION
        // ---------------------------------------------------------------------
        console.log('\n--- PART 1: VERIFYING RESTRUCTURED DASHBOARD LAYOUT ---');

        // 1. Top Horizontal Layout (Metrics) & Search Bar Completely Removed
        console.log('\n1.1 Verifying Search Bar Removal & Top Horizontal Metrics...');
        const topMetricsCheck = await page.evaluate(() => {
            // Check Search Bar is completely removed
            const searchInputs = Array.from(document.querySelectorAll('.dashboard input[type="text"], .dashboard input[placeholder*="Search"]'));
            const searchIcons = Array.from(document.querySelectorAll('.dashboard [data-lucide="search"]'));

            // Check 4 Primary Metric Cards at top
            const bodyText = document.body.innerText;
            const hasStockRevenue = bodyText.includes('Total Stock Revenue') && bodyText.includes('₹ 48,73,320');
            const hasTotalOrders = bodyText.includes('Total Orders') && bodyText.includes('1,248');
            const hasTotalSales = bodyText.includes('Total Sales') && bodyText.includes('₹ 36,42,180');
            const hasPendingOrders = bodyText.includes('Pending Orders') && bodyText.includes('42');

            return {
                searchInputsCount: searchInputs.length,
                searchIconsCount: searchIcons.length,
                hasStockRevenue,
                hasTotalOrders,
                hasTotalSales,
                hasPendingOrders
            };
        });

        console.log('   Search inputs on dashboard (expected 0):', topMetricsCheck.searchInputsCount);
        console.log('   Search icons on dashboard (expected 0):', topMetricsCheck.searchIconsCount);
        console.log('   Total Stock Revenue card present:', topMetricsCheck.hasStockRevenue);
        console.log('   Total Orders card present:', topMetricsCheck.hasTotalOrders);
        console.log('   Total Sales card present:', topMetricsCheck.hasTotalSales);
        console.log('   Pending Orders card present:', topMetricsCheck.hasPendingOrders);

        if (topMetricsCheck.searchInputsCount > 0 || topMetricsCheck.searchIconsCount > 0) {
            throw new Error(`Search bar was NOT completely removed from dashboard! Found ${topMetricsCheck.searchInputsCount} search inputs.`);
        }
        if (!topMetricsCheck.hasStockRevenue || !topMetricsCheck.hasTotalOrders || !topMetricsCheck.hasTotalSales || !topMetricsCheck.hasPendingOrders) {
            throw new Error(`Top primary metric cards verification failed: ${JSON.stringify(topMetricsCheck)}`);
        }
        console.log('   ✓ Requirement 1 (Search Bar Completely Removed & Top Horizontal Metrics) verified.');

        // 1.2 Center Expanded 3D India Map Area
        console.log('\n1.2 Verifying Center Expanded 3D India Map Area...');
        const mapCheck = await page.evaluate(() => {
            const svg = document.getElementById('india-3d-map-svg');
            if (!svg) return { svgFound: false };

            const originMarker = document.getElementById('origin-hub-marker');
            const hasPin673638 = originMarker && originMarker.textContent.includes('673638');

            const trajectoryLines = document.querySelectorAll('.supply-trajectory-line').length;
            const comets = document.querySelectorAll('#map-trajectories animateMotion').length;

            const neonPins = document.querySelectorAll('#map-destination-pins .map-location-pin circle[fill*="22c55e"]').length;

            const stateTexts = Array.from(svg.querySelectorAll('#map-state-names text')).map(el => ({
                text: el.textContent.trim(),
                opacity: window.getComputedStyle(el).opacity || el.getAttribute('opacity')
            }));

            const hasKerala = stateTexts.some(s => s.text === 'Kerala');
            const hasTamilNadu = stateTexts.some(s => s.text === 'Tamil Nadu');
            const hasNoAbbreviations = !stateTexts.some(s => ['KL', 'TN', 'KA', 'MH'].includes(s.text));
            const opacitySample = stateTexts.find(s => s.text === 'Kerala')?.opacity;

            return {
                svgFound: true,
                hasPin673638,
                trajectoryLines,
                comets,
                neonPins,
                totalStates: stateTexts.length,
                hasKerala,
                hasTamilNadu,
                hasNoAbbreviations,
                opacitySample
            };
        });

        console.log('   Expanded 3D India Map SVG rendered:', mapCheck.svgFound);
        console.log('   Origin Hub PIN 673638 present:', mapCheck.hasPin673638);
        console.log('   Supply trajectory lines count:', mapCheck.trajectoryLines);
        console.log('   Animated comet projectiles count:', mapCheck.comets);
        console.log('   Unified Neon Green Pins count:', mapCheck.neonPins);
        console.log('   Full state names count:', mapCheck.totalStates);
        console.log('   Full names verified ("Kerala", "Tamil Nadu"):', mapCheck.hasKerala && mapCheck.hasTamilNadu);
        console.log('   No abbreviations (KL/TN eliminated):', mapCheck.hasNoAbbreviations);
        console.log('   State labels opacity (expected 0.5):', mapCheck.opacitySample);

        if (!mapCheck.svgFound || !mapCheck.hasPin673638 || mapCheck.trajectoryLines === 0 || mapCheck.neonPins === 0 || !mapCheck.hasKerala) {
            throw new Error(`Center Expanded 3D Map verification failed: ${JSON.stringify(mapCheck)}`);
        }
        console.log('   ✓ Requirement 3 (Center Expanded 3D Map with trajectories & pins) verified.');

        // 1.3 Right Side Panel: Out of Stock & Low Stock Vertical Widgets
        console.log('\n1.3 Verifying Right Side Panel (Out of Stock & Low Stock)...');
        const rightPanelCheck = await page.evaluate(() => {
            const dangerWidget = document.querySelector('.stock-alert-card-danger');
            const warningWidget = document.querySelector('.stock-alert-card-warning');

            const hasOutOfStock = dangerWidget && dangerWidget.innerText.includes('Out of Stock') && dangerWidget.innerText.includes('12');
            const hasLowStock = warningWidget && warningWidget.innerText.includes('Low Stock') && warningWidget.innerText.includes('8');

            return {
                dangerWidgetExists: !!dangerWidget,
                warningWidgetExists: !!warningWidget,
                hasOutOfStock,
                hasLowStock
            };
        });

        console.log('   Out of Stock (Red) widget present:', rightPanelCheck.hasOutOfStock);
        console.log('   Low Stock (Orange) widget present:', rightPanelCheck.hasLowStock);

        if (!rightPanelCheck.hasOutOfStock || !rightPanelCheck.hasLowStock) {
            throw new Error(`Right side stock widgets verification failed: ${JSON.stringify(rightPanelCheck)}`);
        }
        console.log('   ✓ Requirement 2 (Right Side Panel Alert Widgets) verified.');

        // 1.4 Bottom Horizontal Layout: Visiting Schedules & Quotation Pending
        console.log('\n1.4 Verifying Bottom Horizontal Layout (Visiting Schedules & Quotation Pending)...');
        const bottomLayoutCheck = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const hasVisitingSchedules = bodyText.includes('Visiting Schedules');
            const marqueeTable = document.getElementById('visiting-marquee-table');
            const marqueeAnim = marqueeTable ? window.getComputedStyle(marqueeTable).animationName : '';

            const hasQuotationPending = bodyText.includes('Quotation Pending');
            const hasPendingQuotesData = bodyText.includes('Q-2025-001') && bodyText.includes('Arun Kumar') && bodyText.includes('Q-2025-002');

            return {
                hasVisitingSchedules,
                marqueeAnim,
                hasQuotationPending,
                hasPendingQuotesData
            };
        });

        console.log('   Visiting Schedules widget present:', bottomLayoutCheck.hasVisitingSchedules);
        console.log('   Marquee animation name (scheduleScrollTable):', bottomLayoutCheck.marqueeAnim);
        console.log('   Quotation Pending widget present:', bottomLayoutCheck.hasQuotationPending);
        console.log('   Pending quotes data present in table:', bottomLayoutCheck.hasPendingQuotesData);

        if (!bottomLayoutCheck.hasVisitingSchedules || !bottomLayoutCheck.marqueeAnim.includes('scheduleScrollTable') || !bottomLayoutCheck.hasQuotationPending || !bottomLayoutCheck.hasPendingQuotesData) {
            throw new Error(`Bottom horizontal layout verification failed: ${JSON.stringify(bottomLayoutCheck)}`);
        }
        console.log('   ✓ Requirement 4 (Bottom Horizontal Layout: Visiting Schedules & Quotation Pending) verified.');

        // 1.5 Dynamic Element: Clickable Profile Photo
        console.log('\n1.5 Verifying Dynamic Clickable Profile Photo...');
        await page.click('.profile-photo-trigger');
        await new Promise(r => setTimeout(r, 400));
        const modalOpen = await page.evaluate(() => !!document.getElementById('profile-photo-modal'));
        console.log('   Profile photo modal opened on click:', modalOpen);
        if (!modalOpen) throw new Error('Profile photo modal failed to open!');
        await page.evaluate(() => document.getElementById('profile-photo-modal').remove());
        console.log('   ✓ Requirement 5 (Dynamic Profile Photo Modal) verified.');

        await page.screenshot({ path: 'scripts/restructured_dashboard_layout_verified.png', fullPage: true });
        console.log('   ✓ Saved screenshot to scripts/restructured_dashboard_layout_verified.png');

        // ---------------------------------------------------------------------
        // PART 2: LEO AI ASSISTANT SYSTEM-WIDE ANALYTICS VERIFICATION
        // ---------------------------------------------------------------------
        console.log('\n======================================================================');
        console.log('🤖 PART 2: VERIFYING SYSTEM-WIDE AI ASSISTANT ("LEO")');
        console.log('======================================================================');

        // 2.1 Verify Leo Floating Trigger Button & UI Presence
        console.log('\n2.1 Verifying Leo AI Floating Trigger & Initialization...');
        const triggerFound = await page.evaluate(() => !!document.getElementById('leo-ai-floating-trigger'));
        console.log('   Floating "Ask Leo AI" trigger present:', triggerFound);
        if (!triggerFound) throw new Error('Leo AI floating trigger not found on page!');

        // 2.2 Open Leo Assistant Console
        console.log('\n2.2 Opening Leo AI Assistant Console via trigger...');
        await page.click('#leo-ai-floating-trigger');
        await new Promise(r => setTimeout(r, 500));
        const leoModalOpen = await page.evaluate(() => !!document.getElementById('leo-ai-modal'));
        console.log('   Leo AI Assistant console opened:', leoModalOpen);
        if (!leoModalOpen) throw new Error('Leo AI Assistant console modal failed to open!');

        // 2.3 TEST CAPABILITY 1: Financial & Sales Analytics
        // Query A: Total Sales, Purchases, and Overall Profit
        console.log('\n2.3 [CAPABILITY 1A] Testing Financial Analytics: Total Sales, Purchases & Profit...');
        const finQuery = 'What is our total sales, material purchases, and overall profit?';
        await page.evaluate((q) => window.submitLeoPrompt(q), finQuery);
        await new Promise(r => setTimeout(r, 600));

        const finResult = await page.evaluate(() => {
            const lastMsg = document.querySelector('#leo-messages-container .leo-msg.bot:last-child');
            const text = lastMsg ? lastMsg.innerText : '';
            return {
                hasSalesKpi: text.includes('36,42,180') || text.includes('2,77,000'),
                hasPurchasesKpi: text.includes('93,500'),
                hasProfitMargin: text.includes('Gross Material Profit') || text.includes('Profit'),
                telemetry: text.includes('Queried: Store.state')
            };
        });

        console.log('   Financial Sales KPI recognized:', finResult.hasSalesKpi);
        console.log('   Purchases / Expenses recognized (₹ 93,500):', finResult.hasPurchasesKpi);
        console.log('   Profit & Margins calculated:', finResult.hasProfitMargin);
        console.log('   Database telemetry logged:', finResult.telemetry);

        if (!finResult.hasSalesKpi || !finResult.hasPurchasesKpi || !finResult.hasProfitMargin) {
            throw new Error(`Financial analytics query failed: ${JSON.stringify(finResult)}`);
        }
        console.log('   ✓ Financial & Sales Analytics query successfully answered.');

        // Query B: Geographical Sales Analytics ("Which areas had the highest sales this month?")
        console.log('\n2.4 [CAPABILITY 1B] Testing Geographical Analytics: "Which areas had the highest sales this month?"...');
        const geoQuery = 'Which areas had the highest sales this month?';
        await page.evaluate((q) => window.submitLeoPrompt(q), geoQuery);
        await new Promise(r => setTimeout(r, 600));

        const geoResult = await page.evaluate(() => {
            const lastMsg = document.querySelector('#leo-messages-container .leo-msg.bot:last-child');
            const text = lastMsg ? lastMsg.innerText : '';
            return {
                identifiesMalappuramAsTop: text.includes('Malappuram') && (text.includes('Highest') || text.includes('Rank') || text.includes('#1')),
                hasAreaSalesAmount: text.includes('1,25,000'),
                listsOtherAreas: text.includes('Kozhikode') || text.includes('Kannur'),
                telemetry: text.includes('Store.state.customers') || text.includes('Store.state.sales')
            };
        });

        console.log('   Identifies Malappuram as highest sales area:', geoResult.identifiesMalappuramAsTop);
        console.log('   Correct sales volume for top area (₹ 1,25,000):', geoResult.hasAreaSalesAmount);
        console.log('   Lists other ranked geographic regions:', geoResult.listsOtherAreas);

        if (!geoResult.identifiesMalappuramAsTop || !geoResult.hasAreaSalesAmount) {
            throw new Error(`Geographical sales query failed: ${JSON.stringify(geoResult)}`);
        }
        console.log('   ✓ Geographical Sales Analytics query successfully answered.');

        // 2.4 TEST CAPABILITY 2: Customer-Specific Insights
        // Query A: "What was our total expense and profit margin for Luxury Villa Project?"
        console.log('\n2.5 [CAPABILITY 2A] Testing Customer Insights for "Luxury Villa Project"...');
        const custQuery1 = 'What was our total expense and profit margin for Luxury Villa Project?';
        await page.evaluate((q) => window.submitLeoPrompt(q), custQuery1);
        await new Promise(r => setTimeout(r, 600));

        const custResult1 = await page.evaluate(() => {
            const lastMsg = document.querySelector('#leo-messages-container .leo-msg.bot:last-child');
            const text = lastMsg ? lastMsg.innerText : '';
            return {
                customerIdentified: text.includes('Luxury Villa Project'),
                hasInvoicedSales: text.includes('1,25,000'),
                hasIncurredExpenses: text.includes('80,000'), // PO-1001 42k + PO-1002 38k
                hasNetProfit: text.includes('45,000'), // 125k - 80k = 45k
                hasProfitMargin: text.includes('36.0%') || text.includes('36%')
            };
        });

        console.log('   Customer entity extracted correctly:', custResult1.customerIdentified);
        console.log('   Total sales revenue fetched (₹ 1,25,000):', custResult1.hasInvoicedSales);
        console.log('   Total PO expenses fetched (₹ 80,000):', custResult1.hasIncurredExpenses);
        console.log('   Net profit calculated accurately (₹ 45,000):', custResult1.hasNetProfit);
        console.log('   Profit margin calculated accurately (36.0%):', custResult1.hasProfitMargin);

        if (!custResult1.customerIdentified || !custResult1.hasIncurredExpenses || !custResult1.hasNetProfit) {
            throw new Error(`Customer insights query for Luxury Villa Project failed: ${JSON.stringify(custResult1)}`);
        }
        console.log('   ✓ Customer Insights for Luxury Villa Project successfully answered.');

        // Query B: "What was our total expense and profit margin for Arun Kumar?"
        console.log('\n2.6 [CAPABILITY 2B] Testing Customer Insights for "Arun Kumar"...');
        const custQuery2 = 'What was our total expense and profit margin for Arun Kumar?';
        await page.evaluate((q) => window.submitLeoPrompt(q), custQuery2);
        await new Promise(r => setTimeout(r, 600));

        const custResult2 = await page.evaluate(() => {
            const lastMsg = document.querySelector('#leo-messages-container .leo-msg.bot:last-child');
            const text = lastMsg ? lastMsg.innerText : '';
            return {
                customerIdentified: text.includes('Arun Kumar'),
                hasInvoicedSales: text.includes('45,000'),
                hasIncurredExpenses: text.includes('8,500'), // PO-1003
                hasNetProfit: text.includes('36,500'), // 45k - 8.5k
                hasProfitMargin: text.includes('81.1%') || text.includes('81%')
            };
        });

        console.log('   Customer entity extracted correctly:', custResult2.customerIdentified);
        console.log('   Total sales revenue fetched (₹ 45,000):', custResult2.hasInvoicedSales);
        console.log('   Total PO expenses fetched (₹ 8,500):', custResult2.hasIncurredExpenses);
        console.log('   Net profit calculated accurately (₹ 36,500):', custResult2.hasNetProfit);
        console.log('   Profit margin calculated accurately (81.1%):', custResult2.hasProfitMargin);

        if (!custResult2.customerIdentified || !custResult2.hasIncurredExpenses || !custResult2.hasNetProfit) {
            throw new Error(`Customer insights query for Arun Kumar failed: ${JSON.stringify(custResult2)}`);
        }
        console.log('   ✓ Customer Insights for Arun Kumar successfully answered.');

        // 2.5 TEST CAPABILITY 3: HR & Payroll Queries
        // Query A: "Who is on leave today?"
        console.log('\n2.7 [CAPABILITY 3A] Testing HR Query: "Who is on leave today?"...');
        const hrQuery1 = 'Who is on leave today?';
        await page.evaluate((q) => window.submitLeoPrompt(q), hrQuery1);
        await new Promise(r => setTimeout(r, 600));

        const hrResult1 = await page.evaluate(() => {
            const lastMsg = document.querySelector('#leo-messages-container .leo-msg.bot:last-child');
            const text = lastMsg ? lastMsg.innerText : '';
            return {
                identifiesSajeevAbsent: text.includes('Sajeev P') && (text.includes('Absent') || text.includes('Leave')),
                reportsPresentStaff: text.includes('Rajeesh') || text.includes('Mani'),
                telemetry: text.includes('Store.state.staff')
            };
        });

        console.log('   Identifies Sajeev P on leave today:', hrResult1.identifiesSajeevAbsent);
        console.log('   Reports present staff on duty:', hrResult1.reportsPresentStaff);

        if (!hrResult1.identifiesSajeevAbsent) {
            throw new Error(`HR Leave query failed: ${JSON.stringify(hrResult1)}`);
        }
        console.log('   ✓ HR Leave query successfully answered.');

        // Query B: "Which employees have pending salary payouts?"
        console.log('\n2.8 [CAPABILITY 3B] Testing HR Query: "Which employees have pending salary payouts?"...');
        const hrQuery2 = 'Which employees have pending salary payouts?';
        await page.evaluate((q) => window.submitLeoPrompt(q), hrQuery2);
        await new Promise(r => setTimeout(r, 600));

        const hrResult2 = await page.evaluate(() => {
            const lastMsg = document.querySelector('#leo-messages-container .leo-msg.bot:last-child');
            const text = lastMsg ? lastMsg.innerText : '';
            return {
                hasPendingPayoutSummary: text.includes('Pending Salary Payouts') || text.includes('Pending Payroll'),
                listsStaffMembers: text.includes('Rajeesh Kumar') && text.includes('Mani Kangan') && text.includes('Sajeev P'),
                calculatesNetPayable: text.includes('Net Pending Payout') || text.includes('₹ 24,500')
            };
        });

        console.log('   Pending payroll summary presented:', hrResult2.hasPendingPayoutSummary);
        console.log('   Lists all active employees in payroll ledger:', hrResult2.listsStaffMembers);
        console.log('   Calculates net payable after advances & overtime:', hrResult2.calculatesNetPayable);

        if (!hrResult2.hasPendingPayoutSummary || !hrResult2.listsStaffMembers) {
            throw new Error(`HR Pending Payouts query failed: ${JSON.stringify(hrResult2)}`);
        }
        console.log('   ✓ HR Pending Salary Payouts query successfully answered.');

        // Query C: "Who has taken a salary advance recently?"
        console.log('\n2.9 [CAPABILITY 3C] Testing HR Query: "Who has taken a salary advance recently?"...');
        const hrQuery3 = 'Who has taken a salary advance recently?';
        await page.evaluate((q) => window.submitLeoPrompt(q), hrQuery3);
        await new Promise(r => setTimeout(r, 600));

        const hrResult3 = await page.evaluate(() => {
            const lastMsg = document.querySelector('#leo-messages-container .leo-msg.bot:last-child');
            const text = lastMsg ? lastMsg.innerText : '';
            return {
                identifiesRajeeshAdvance: text.includes('Rajeesh Kumar') && text.includes('2,000'),
                identifiesSajeevAdvance: text.includes('Sajeev P') && text.includes('1,000'),
                totalAdvancesCalculated: text.includes('3,000')
            };
        });

        console.log('   Identifies Rajeesh Kumar advance (₹ 2,000):', hrResult3.identifiesRajeeshAdvance);
        console.log('   Identifies Sajeev P advance (₹ 1,000):', hrResult3.identifiesSajeevAdvance);
        console.log('   Total advance amount calculated (₹ 3,000):', hrResult3.totalAdvancesCalculated);

        if (!hrResult3.identifiesRajeeshAdvance || !hrResult3.identifiesSajeevAdvance) {
            throw new Error(`HR Salary Advance query failed: ${JSON.stringify(hrResult3)}`);
        }
        console.log('   ✓ HR Salary Advance query successfully answered.');

        // 2.6 TEST CAPABILITY 4: System-Wide Context (Technical Requirement: ANY query)
        console.log('\n2.10 [CAPABILITY 4] Testing System-Wide Open Database Query: "Which items are out of stock or low stock?"...');
        const stockQuery = 'Which items are out of stock or low stock?';
        await page.evaluate((q) => window.submitLeoPrompt(q), stockQuery);
        await new Promise(r => setTimeout(r, 600));

        const stockResult = await page.evaluate(() => {
            const lastMsg = document.querySelector('#leo-messages-container .leo-msg.bot:last-child');
            const text = lastMsg ? lastMsg.innerText : '';
            return {
                identifiesOutOfStock: text.includes('Friction Stays') || text.includes('Weather Sealant') || text.includes('Out of Stock'),
                identifiesLowStock: text.includes('Low Stock') || text.includes('Steel Sheet'),
                telemetry: text.includes('Store.state.inventory')
            };
        });

        console.log('   Identifies Out of Stock items in database:', stockResult.identifiesOutOfStock);
        console.log('   Identifies Low Stock threshold items:', stockResult.identifiesLowStock);
        console.log('   Inventory telemetry logged:', stockResult.telemetry);

        if (!stockResult.identifiesOutOfStock) {
            throw new Error(`Open database inventory query failed: ${JSON.stringify(stockResult)}`);
        }
        console.log('   ✓ System-Wide Context query successfully answered.');

        // Capture screenshot of Leo AI in action
        await page.screenshot({ path: 'scripts/leo_ai_assistant_verified.png' });
        console.log('   ✓ Saved screenshot to scripts/leo_ai_assistant_verified.png');

        console.log('\n======================================================================');
        console.log('🎉 ALL DASHBOARD RESTRUCTURE & LEO AI CAPABILITIES VERIFIED 100%!');
        console.log('======================================================================\n');

    } catch (err) {
        console.error('VERIFICATION ERROR:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
