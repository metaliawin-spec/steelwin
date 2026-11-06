const puppeteer = require('puppeteer');

(async () => {
    console.log('--- STARTING VERIFICATION: SERVICE & SITE VISIT MANAGEMENT MODULE ---');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    try {
        console.log('1. Loading application at http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

        // --- STEP 1: Verify Dashboard Caption Update ---
        console.log('2. Checking Dashboard caption "Visiting Schedules"...');
        await page.evaluate(() => window.navigate('dashboard'));
        await new Promise(r => setTimeout(r, 400));

        const dashboardText = await page.evaluate(() => document.body.innerText);
        if (!dashboardText.includes('Visiting Schedules')) {
            throw new Error('Dashboard does not contain "Visiting Schedules" caption!');
        }
        if (dashboardText.includes('Service Schedule')) {
            throw new Error('Dashboard still contains old "Service Schedule" caption!');
        }
        console.log('   ✓ Dashboard successfully updated from "Service Schedule" to "Visiting Schedules".');

        // --- STEP 2: Verify Sidebar Navigation Options ---
        console.log('3. Checking Sidebar Navigation for "Site Visit" and "Service Visit"...');
        const sidebarText = await page.evaluate(() => document.getElementById('main-nav').innerText);
        if (!sidebarText.includes('Site Visit') || !sidebarText.includes('Service Visit')) {
            throw new Error('Sidebar missing "Site Visit" or "Service Visit" menu options!');
        }
        console.log('   ✓ Sidebar contains both "Site Visit" and "Service Visit" navigation options.');

        // --- STEP 3: Test Site Visit Module ---
        console.log('4. Navigating to Site Visit module...');
        await page.evaluate(() => window.navigate('site_visit'));
        await new Promise(r => setTimeout(r, 500));

        const siteVisitTitle = await page.evaluate(() => document.body.innerText.includes('Site Visit Management'));
        if (!siteVisitTitle) throw new Error('Site Visit module page failed to render!');
        console.log('   ✓ Site Visit Management page rendered successfully.');

        // Test Add New Site Visit Modal & Form
        console.log('5. Testing "Schedule New Site Visit" form (Customer, Phone, Location, Google Maps link, file upload)...');
        await page.evaluate(() => window.openNewSiteVisitModal());
        await new Promise(r => setTimeout(r, 300));

        await page.evaluate(() => {
            // Select customer Arun Kumar to auto-fill
            window.autoFillSiteVisitCustomer('C-001');
            document.getElementById('sv-maps-url').value = 'https://maps.google.com/?q=11.2588,75.7804';
            document.getElementById('sv-purpose').value = 'French Door Balcony Plumb & Aperture Check';
            // Add a mock attached PDF file
            window.newSiteVisitUploadedFiles.push({
                name: 'balcony_elevation_blueprint.pdf',
                type: 'pdf',
                size: '2.1 MB'
            });
            window.saveNewSiteVisit();
        });
        await new Promise(r => setTimeout(r, 500));

        const siteVisitCreated = await page.evaluate(() => {
            const list = window.Store.state.siteVisits || [];
            const latest = list[0];
            return {
                customer: latest?.customer,
                phone: latest?.phone,
                location: latest?.location,
                mapsUrl: latest?.mapsUrl,
                purpose: latest?.purpose,
                hasFiles: latest?.initialFiles?.length > 0
            };
        });

        if (siteVisitCreated.customer !== 'Arun Kumar' || !siteVisitCreated.mapsUrl.includes('maps.google.com') || !siteVisitCreated.hasFiles) {
            throw new Error(`Site visit creation failed: ${JSON.stringify(siteVisitCreated)}`);
        }
        console.log(`   ✓ Site visit scheduled for "${siteVisitCreated.customer}" with Google Maps link and PDF attachments.`);

        // Test Staff Update Feature for Site Visit
        console.log('6. Testing Staff Update feature on Site Visit (upload completion photos/videos & update status)...');
        const latestVisitId = await page.evaluate(() => window.Store.state.siteVisits[0].id);

        await page.evaluate((id) => window.openStaffUpdateModal(id), latestVisitId);
        await new Promise(r => setTimeout(r, 300));

        await page.evaluate((id) => {
            document.getElementById('staff-update-status').value = 'Completed';
            document.getElementById('staff-update-name').value = 'Rajeesh Kumar';
            document.getElementById('staff-update-notes').value = 'All masonry openings verified: 180x210cm French door plumb confirmed. Site ready for installation.';
            window.staffUpdateUploadedFiles.push(
                { name: 'opening_measured_sill.jpg', type: 'image', size: '1.8 MB' },
                { name: 'walkthrough_opening.mp4', type: 'video', size: '4.2 MB' }
            );
            window.saveStaffVisitUpdate(null, id);
        }, latestVisitId);
        await new Promise(r => setTimeout(r, 500));

        const siteVisitUpdated = await page.evaluate((id) => {
            const v = window.Store.state.siteVisits.find(item => item.id === id);
            return {
                status: v?.status,
                updatesCount: v?.staffUpdates?.length,
                latestNotes: v?.staffUpdates?.[0]?.notes,
                hasMedia: v?.staffUpdates?.[0]?.files?.length >= 2
            };
        }, latestVisitId);

        if (siteVisitUpdated.status !== 'Completed' || !siteVisitUpdated.hasMedia) {
            throw new Error(`Staff update on site visit failed: ${JSON.stringify(siteVisitUpdated)}`);
        }
        console.log('   ✓ Staff completion update recorded with status "Completed", staff notes, photos, and video proof.');

        // Take screenshot of Site Visit page
        await page.screenshot({ path: 'scripts/site_visits_verified.png', fullPage: true });
        console.log('   ✓ Saved screenshot to scripts/site_visits_verified.png');

        // --- STEP 4: Test Service Visit Module ---
        console.log('7. Navigating to Service Visit module...');
        await page.evaluate(() => window.navigate('service_visit'));
        await new Promise(r => setTimeout(r, 500));

        const serviceTitle = await page.evaluate(() => document.body.innerText.includes('Service Visit Management'));
        if (!serviceTitle) throw new Error('Service Visit module page failed to render!');
        console.log('   ✓ Service Visit Management page rendered successfully.');

        // Test Log New Service Request Form
        console.log('8. Testing "Log Service Request" form (Customer, Details, Location, Issue, file upload)...');
        await page.evaluate(() => window.openNewServiceRequestModal());
        await new Promise(r => setTimeout(r, 300));

        await page.evaluate(() => {
            window.autoFillServiceCustomer('C-002'); // Luxury Villa Project
            document.getElementById('srv-issue-title').value = 'Balcony French Door Lock Latch Jammed';
            document.getElementById('srv-issue-details').value = 'Espag rod transmission lock gets stuck during locking; client requested urgent repair.';
            document.getElementById('srv-priority').value = 'Urgent';
            window.newServiceUploadedFiles.push({
                name: 'stuck_lock_photo.jpg',
                type: 'image',
                size: '1.4 MB'
            });
            window.saveNewServiceRequest();
        });
        await new Promise(r => setTimeout(r, 500));

        const newServiceCreated = await page.evaluate(() => {
            const list = window.Store.state.services || [];
            const latest = list[0];
            return {
                id: latest?.id,
                customer: latest?.customer,
                issue: latest?.issue,
                priority: latest?.priority,
                status: latest?.status,
                hasFiles: latest?.issueFiles?.length > 0
            };
        });

        if (newServiceCreated.customer !== 'Luxury Villa Project' || !newServiceCreated.issue.includes('Lock Latch') || !newServiceCreated.hasFiles) {
            throw new Error(`Service request logging failed: ${JSON.stringify(newServiceCreated)}`);
        }
        console.log(`   ✓ Service request "${newServiceCreated.id}" logged for "${newServiceCreated.customer}" with issue details and photo.`);

        // Test Staff Update Feature (Technician Resolution)
        console.log('9. Testing Staff Update feature on Service Visit (technician resolution details & photos)...');
        await page.evaluate((id) => window.openServiceResolutionModal(id), newServiceCreated.id);
        await new Promise(r => setTimeout(r, 300));

        await page.evaluate((id) => {
            document.getElementById('res-notes').value = 'Disassembled lock gearbox, cleaned debris, lubricated espag transmission rod, and adjusted striker plate alignment. Tested 10 smooth locking cycles.';
            document.getElementById('res-parts').value = '1x Espag Rod Cam, Lubricant spray';
            document.getElementById('res-tech').value = 'Mani Kangan';
            window.serviceResolutionUploadedFiles.push({
                name: 'repaired_lock_alignment.jpg',
                type: 'image',
                size: '1.9 MB'
            });
            window.saveServiceResolution(null, id);
        }, newServiceCreated.id);
        await new Promise(r => setTimeout(r, 500));

        const serviceTechDone = await page.evaluate((id) => {
            const s = window.Store.state.services.find(item => item.id === id);
            return {
                status: s?.status,
                hasResolution: !!s?.resolutionDetails,
                resolutionNotes: s?.resolutionDetails?.notes,
                hasProofPhoto: s?.resolutionDetails?.files?.length > 0
            };
        }, newServiceCreated.id);

        if (serviceTechDone.status !== 'Completed by Tech' || !serviceTechDone.hasResolution || !serviceTechDone.hasProofPhoto) {
            throw new Error(`Technician resolution update failed: ${JSON.stringify(serviceTechDone)}`);
        }
        console.log('   ✓ Technician completed work; task status transitioned to "Completed by Tech" (Needs Sales Verification).');

        // Test Approval Workflow (Sales Team Verification)
        console.log('10. Testing Approval Workflow: Sales Team Verification & Mark as Approved/Ready...');
        await page.evaluate((id) => window.openSalesApprovalModal(id), newServiceCreated.id);
        await new Promise(r => setTimeout(r, 300));

        await page.evaluate((id) => {
            document.getElementById('app-verifier').value = 'Rohit Sharma (Sales Manager)';
            document.getElementById('app-notes').value = 'Contacted Luxury Villa Project manager; confirmed French door lock functions with zero resistance. Quality approved.';
            window.markServiceApprovalStatus(id, 'Approved');
        }, newServiceCreated.id);
        await new Promise(r => setTimeout(r, 500));

        const serviceApproved = await page.evaluate((id) => {
            const s = window.Store.state.services.find(item => item.id === id);
            return {
                status: s?.status,
                verifiedBy: s?.approvalDetails?.verifiedBy,
                approvalNotes: s?.approvalDetails?.notes
            };
        }, newServiceCreated.id);

        if (serviceApproved.status !== 'Approved' || !serviceApproved.verifiedBy.includes('Rohit Sharma')) {
            throw new Error(`Sales verification approval failed: ${JSON.stringify(serviceApproved)}`);
        }
        console.log(`   ✓ CRITICAL APPROVAL WORKFLOW MET: Service verified by "${serviceApproved.verifiedBy}" and marked as "Approved".`);

        // Take screenshot of Service Visit page showing verification
        await page.screenshot({ path: 'scripts/service_visits_verified.png', fullPage: true });
        console.log('   ✓ Saved screenshot to scripts/service_visits_verified.png');

        console.log('\n======================================================');
        console.log('🎉 ALL SERVICE & SITE VISIT MANAGEMENT REQUIREMENTS VERIFIED 100%!');
        console.log('======================================================');

    } catch (err) {
        console.error('❌ VERIFICATION FAILED:', err);
        if (errors.length > 0) {
            console.error('Browser console errors:', errors);
        }
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
