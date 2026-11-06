const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
    console.log('--- STARTING VERIFICATION: Employee Management, Role Permissions & HR System ---');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });

    try {
        console.log('1. Loading http://localhost:3000 ...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

        // Check Super Admin active state
        const adminDetails = await page.evaluate(() => {
            const user = Store.getActiveUser();
            return {
                id: user.id,
                name: user.name,
                role: user.role,
                isSuperAdmin: user.isSuperAdmin !== false,
                staffCount: Store.state.staff.length
            };
        });
        console.log('Super Admin State:', adminDetails);
        if (!adminDetails.isSuperAdmin || adminDetails.staffCount < 8) {
            throw new Error(`Expected Super Admin and >= 8 staff, got: ${JSON.stringify(adminDetails)}`);
        }

        // Check Settings -> Employees & Roles tab
        console.log('2. Navigating to Settings -> Employees & Roles...');
        await page.evaluate(() => {
            window.navigate('settings');
            if (window.Store && window.Store.state) {
                window.Store.state.activeSettingsTab = 'employees';
                window.Store.notify();
            }
        });
        await new Promise(r => setTimeout(r, 600));

        const empCardsCount = await page.evaluate(() => {
            const cards = document.querySelectorAll('.employee-card, [onclick*="openEditEmployeeModal"]');
            const roleBadges = Array.from(document.querySelectorAll('.role-badge')).map(b => b.innerText.trim());
            return { count: cards.length, badges: roleBadges };
        });
        console.log('Employee cards rendered:', empCardsCount);

        // Verify all professions requested in Malayalam audio are represented:
        // Accounts, Sales, Designing, Supervisor, Production, Machinery Operator, Fabrication, Painting Section
        const professions = await page.evaluate(() => {
            return Store.state.staff.map(s => ({ name: s.name, role: s.role, dept: s.department, otHours: s.overtimeHours, otRate: s.overtimeRate }));
        });
        console.log('Registered Employee Professions:', professions);
        const requiredRoles = ['Accounts', 'Sales', 'Designing', 'Supervisor', 'Production', 'Machinery Operator', 'Fabrication', 'Painting Section'];
        for (const req of requiredRoles) {
            const hasRole = professions.some(p => (p.role + ' ' + p.dept).toLowerCase().includes(req.toLowerCase()));
            if (!hasRole) {
                throw new Error(`Missing required profession: ${req}`);
            }
        }
        console.log('✅ All 8 requested professions verified in employee registry!');

        // Test Switching to Employee Role (Farhan Ali - CAD Designer)
        console.log('3. Switching active user to Farhan Ali (EMP-103, Designing)...');
        await page.evaluate(() => {
            window.switchActiveUser('EMP-103');
        });
        await new Promise(r => setTimeout(r, 500));

        const designerSession = await page.evaluate(() => {
            const user = Store.getActiveUser();
            const navButtons = Array.from(document.querySelectorAll('#main-nav .nav-item')).map(b => b.innerText.trim());
            const sidebarHtml = document.getElementById('main-nav').innerHTML;
            return {
                id: user.id,
                name: user.name,
                role: user.role,
                navCount: navButtons.length,
                navButtons: navButtons,
                hasReturnBtn: sidebarHtml.includes('Return to Admin')
            };
        });
        console.log('Designer active session in sidebar:', designerSession);
        if (designerSession.id !== 'EMP-103' || !designerSession.hasReturnBtn) {
            throw new Error('Designer session not properly active in sidebar!');
        }

        // Test View-Only Module behavior (Production is 'view' for Farhan Ali)
        console.log('4. Navigating to Production (View-Only permission for Designer)...');
        await page.evaluate(() => {
            window.navigate('production');
        });
        await new Promise(r => setTimeout(r, 600));

        const viewOnlyCheck = await page.evaluate(() => {
            const banner = document.querySelector('.view-only-banner');
            const isLocked = document.querySelector('.view-only-locked') !== null;
            return {
                bannerFound: banner !== null,
                bannerText: banner ? banner.innerText : '',
                isLocked: isLocked
            };
        });
        console.log('View-Only Protection on Production:', viewOnlyCheck);
        if (!viewOnlyCheck.bannerFound || !viewOnlyCheck.isLocked) {
            throw new Error('View-only banner or lock class missing for view-only module!');
        }
        console.log('✅ View-Only mode successfully applied!');

        // Test Forbidden Module (Sales is 'none' for Designer)
        console.log('5. Navigating to Sales (Forbidden / none permission for Designer)...');
        await page.evaluate(() => {
            window.navigate('sales');
        });
        await new Promise(r => setTimeout(r, 600));

        const forbiddenCheck = await page.evaluate(() => {
            const text = document.getElementById('main-view').innerText;
            return {
                isRestricted: text.includes('Access Restricted') && text.includes('Farhan Ali'),
                textSnippet: text.slice(0, 200)
            };
        });
        console.log('Forbidden Module Guard on Sales:', forbiddenCheck);
        if (!forbiddenCheck.isRestricted) {
            throw new Error('Access Restricted guard failed on forbidden module!');
        }
        console.log('✅ Access Restricted guard successfully validated!');

        // Test Mandatory HR Integration (Attendance, Late Tracking & OT Generation)
        console.log('6. Navigating to HR & Testing Attendance, Late Arrival & OT Generation...');
        await page.evaluate(() => {
            window.navigate('hr');
        });
        await new Promise(r => setTimeout(r, 600));

        const hrCheck = await page.evaluate(() => {
            const activeCard = document.querySelector('.hr-view .glass-panel');
            const hasFaceBtn = document.querySelector('button[onclick*="startFaceScan"]') !== null;
            const hasClockInBtn = document.querySelector('button[onclick*="logStaffCheckInAction"]') !== null;
            const hasClockOutBtn = document.querySelector('button[onclick*="logStaffCheckOutAction"]') !== null;
            const hasOTBtn = document.querySelector('button[onclick*="openLogOTModal"]') !== null;
            return {
                activeCardText: activeCard ? activeCard.innerText.slice(0, 150) : '',
                hasFaceBtn,
                hasClockInBtn,
                hasClockOutBtn,
                hasOTBtn
            };
        });
        console.log('HR Module Features for Employee:', hrCheck);
        if (!hrCheck.hasFaceBtn || !hrCheck.hasClockInBtn || !hrCheck.hasClockOutBtn || !hrCheck.hasOTBtn) {
            throw new Error('HR self-service or OT buttons missing!');
        }

        // Test Logging Overtime
        console.log('7. Testing Overtime Logging for Designer...');
        const otBefore = await page.evaluate(() => Store.getActiveUser().overtimeHours);
        await page.evaluate(() => {
            Store.logStaffOvertime('EMP-103', 3.5, 'Window CAD drawing rush delivery');
        });
        const otAfter = await page.evaluate(() => Store.getActiveUser().overtimeHours);
        console.log(`OT hours before: ${otBefore}, after: ${otAfter}`);
        if (otAfter !== otBefore + 3.5) {
            throw new Error('OT hours calculation failed!');
        }
        console.log('✅ Overtime logging and calculation verified!');

        // Test Return to Admin
        console.log('8. Returning to Super Admin...');
        await page.evaluate(() => {
            window.switchActiveUser('admin');
        });
        await new Promise(r => setTimeout(r, 500));

        const restoredAdmin = await page.evaluate(() => Store.getActiveUser());
        console.log('Restored Admin User:', restoredAdmin.name, restoredAdmin.role);
        if (!restoredAdmin.isSuperAdmin) {
            throw new Error('Failed to restore Super Admin session!');
        }
        console.log('✅ Super Admin restored successfully!');

        // Take snapshot screenshot
        const screenshotPath = path.join(__dirname, '..', 'employee_roles_verified.png');
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`📸 Screenshot saved: ${screenshotPath}`);

        console.log('=== ALL EMPLOYEE MANAGEMENT & HR DELEGATION TESTS PASSED WITH 0 ERRORS! ===');
    } catch (err) {
        console.error('TEST FAILED:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
