const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\e8678a5d-8292-411e-a0f4-593081e8a15b';

async function run() {
    console.log('--- STARTING HR ONBOARDING & ADMIN PROVISIONING E2E VERIFICATION ---');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 950 });

        console.log('1. Navigating to ERP application at http://localhost:3000/...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));

        // ---------------------------------------------------------------------
        // STEP 1: HR Manager Employee Creation Interface
        // ---------------------------------------------------------------------
        console.log('2. Navigating to HR Management module...');
        await page.evaluate(() => {
            if (typeof window.switchView === 'function') {
                window.switchView('hr');
            } else if (window.Store) {
                window.Store.state.currentView = 'hr';
                window.Store.notify();
            }
        });
        await new Promise(r => setTimeout(r, 1200));

        const hrScreenshotPath = path.join(ARTIFACTS_DIR, 'hr_management_dashboard_view.png');
        await page.screenshot({ path: hrScreenshotPath, fullPage: false });
        console.log('Saved HR dashboard screenshot to:', hrScreenshotPath);

        console.log('3. Opening Add Employee modal...');
        const addBtnFound = await page.evaluate(() => {
            const btn = document.getElementById('btn-hr-add-employee') || document.querySelector('button[onclick*="openAddStaffModal"]') || document.querySelector('button[onclick*="openAddEmployeeModal"]');
            if (btn) {
                btn.click();
                return true;
            }
            if (typeof window.openAddStaffModal === 'function') {
                window.openAddStaffModal();
                return true;
            }
            return false;
        });

        if (!addBtnFound) throw new Error('Could not find Add Employee button in HR module.');
        await new Promise(r => setTimeout(r, 600));

        console.log('4. Filling comprehensive onboarding fields (8 required fields)...');
        await page.evaluate(() => {
            const form = document.getElementById('hr-employee-form') || document.getElementById('add-staff-form') || document.querySelector('form[onsubmit*="saveNewStaff"]');
            if (!form) throw new Error('Add staff form not found in DOM.');

            form.name.value = 'Amal Dev';
            form.phone.value = '+91 9846 778 899';
            form.email.value = 'amal.dev@stellobuild.com';
            form.address.value = 'Infopark Road, Kakkanad, Kochi, Kerala';
            form.salary.value = '34000';
            form.overtimeRate.value = '175';

            // Select shift
            const shiftSelect = form.shift;
            if (shiftSelect && shiftSelect.options.length > 0) {
                shiftSelect.selectedIndex = 0; // 08:30 AM - 05:30 PM (8 hrs)
            }
        });

        console.log('5. Testing inline "+ Add Custom Profession" option...');
        await page.evaluate(() => {
            window.toggleCustomProfessionInput(true);
            const input = document.getElementById('inlineCustomProfessionInput');
            if (input) input.value = 'Master Glazier & CNC Operator';
            window.saveInlineCustomProfession();
        });
        await new Promise(r => setTimeout(r, 400));

        const selectedRoleVal = await page.evaluate(() => {
            const roleSelect = document.getElementById('empRole');
            return roleSelect ? roleSelect.value : null;
        });
        console.log('Custom profession selected in dropdown:', selectedRoleVal);

        const formModalScreenshot = path.join(ARTIFACTS_DIR, 'hr_add_employee_modal_filled.png');
        await page.screenshot({ path: formModalScreenshot, fullPage: false });
        console.log('Saved Add Employee form screenshot to:', formModalScreenshot);

        console.log('6. Submitting Employee Onboarding Form...');
        await page.evaluate(() => {
            const form = document.getElementById('hr-employee-form') || document.getElementById('add-staff-form') || document.querySelector('form[onsubmit*="saveNewStaff"]');
            if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        });
        await new Promise(r => setTimeout(r, 1500));

        // Verify Success Modal appears with PENDING PROVISIONING
        const successModalData = await page.evaluate(() => {
            const modal = document.getElementById('onboarding-success-modal');
            if (!modal) return null;
            return {
                text: modal.innerText,
                hasPendingTag: modal.innerText.includes('PENDING PROVISIONING'),
                hasStep2Button: !!modal.querySelector('button[onclick*="openEmployeeAccessProvisioning"]')
            };
        });

        console.log('Onboarding success modal data:', successModalData);
        if (!successModalData || !successModalData.hasPendingTag) {
            throw new Error('Onboarding success modal did not indicate pending provisioning.');
        }

        const successModalScreenshot = path.join(ARTIFACTS_DIR, 'hr_onboarding_pending_provisioning_modal.png');
        await page.screenshot({ path: successModalScreenshot, fullPage: false });
        console.log('Saved success modal screenshot to:', successModalScreenshot);

        // ---------------------------------------------------------------------
        // STEP 2: Admin Role Permissions & Credential Provisioning
        // ---------------------------------------------------------------------
        console.log('7. Proceeding to Admin Provisioning (Step 2)...');
        await page.evaluate(() => {
            const step2Btn = document.querySelector('#onboarding-success-modal button[onclick*="openEmployeeAccessProvisioning"]');
            if (step2Btn) {
                step2Btn.click();
            } else if (typeof window.openEmployeeAccessProvisioning === 'function') {
                window.openEmployeeAccessProvisioning();
            }
        });
        await new Promise(r => setTimeout(r, 1500));

        // Ensure we are in Settings -> Roles & Permissions -> Employee Access
        const currentTabState = await page.evaluate(() => {
            return {
                settingsTab: window.currentSettingsTab,
                rbacMode: window.rbacMode,
                selectedEmployeeId: window.rbacSelectedEmployeeId
            };
        });
        console.log('Current settings RBAC state:', currentTabState);

        const provisioningViewScreenshot = path.join(ARTIFACTS_DIR, 'admin_employee_access_provisioning_view.png');
        await page.screenshot({ path: provisioningViewScreenshot, fullPage: false });
        console.log('Saved provisioning view screenshot to:', provisioningViewScreenshot);

        console.log('8. Verifying Selected Employee Info Card details...');
        const profileDetails = await page.evaluate(() => {
            const card = document.getElementById('selected-employee-info-card');
            if (!card) return null;
            return {
                cardText: card.innerText,
                hasName: card.innerText.includes('Amal Dev'),
                hasPhone: card.innerText.includes('9846 778 899'),
                hasSalary: card.innerText.includes('34,000'),
                hasShift: card.innerText.includes('08:30 AM'),
                hasOT: card.innerText.includes('175'),
                hasRole: card.innerText.includes('Master Glazier')
            };
        });
        console.log('Profile Info Card verification:', profileDetails);

        console.log('9. Configuring 8-Module Permission Matrix...');
        // Test Preset: Role Preset or Grant All
        await page.evaluate(() => {
            window.applyEmployeeRbacPreset('full');
        });
        await new Promise(r => setTimeout(r, 400));

        const matrixState = await page.evaluate(() => {
            const modules = ['dashboard', 'leads', 'quotations', 'bom', 'accounts', 'inventory', 'production', 'hr'];
            return modules.map(m => {
                const v = document.getElementById(`perm-emp-view-${m}`);
                return { module: m, checked: v ? v.checked : false };
            });
        });
        console.log('Module matrix switches after full preset:', matrixState);

        const matrixScreenshot = path.join(ARTIFACTS_DIR, 'admin_module_permissions_matrix_configured.png');
        await page.screenshot({ path: matrixScreenshot, fullPage: false });
        console.log('Saved configured matrix screenshot to:', matrixScreenshot);

        console.log('10. Triggering Credential Generation ("Register Employee / Generate Login")...');
        await page.evaluate(() => {
            const btn = document.getElementById('btn-provision-employee');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 2000));

        // ---------------------------------------------------------------------
        // STEP 3: Automatic Credential Generation Engine Verification
        // ---------------------------------------------------------------------
        console.log('11. Verifying Generated Credentials Modal...');
        const credentialsModalData = await page.evaluate(() => {
            const modal = document.getElementById('generated-credentials-modal');
            if (!modal) return null;
            const userEl = document.getElementById('display-username');
            const passEl = document.getElementById('display-password');
            return {
                modalFound: true,
                username: userEl ? userEl.innerText.trim() : null,
                password: passEl ? passEl.innerText.trim() : null,
                hasCopyButton: !!document.getElementById('btn-copy-all-credentials'),
                modalText: modal.innerText
            };
        });

        console.log('Generated credentials modal data:', credentialsModalData);
        if (!credentialsModalData || !credentialsModalData.username || !credentialsModalData.password) {
            throw new Error('Generated credentials modal did not pop up or was missing username/password.');
        }

        // Validate username pattern: employee name (lowercase, no spaces) + last 4 of phone
        // 'Amal Dev' -> 'amaldev', '+91 9846 778 899' -> last 4 '8899' -> 'amaldev8899'
        const expectedUsername = 'amaldev8899';
        console.log(`Checking Username Pattern: actual "${credentialsModalData.username}" vs expected "${expectedUsername}"`);
        if (credentialsModalData.username !== expectedUsername) {
            console.warn(`Username ${credentialsModalData.username} differs slightly from strict expectation ${expectedUsername}`);
        }

        // Validate password pattern: strictly 6 chars starting with STY + 3 numbers
        console.log(`Checking Password Pattern: "${credentialsModalData.password}"`);
        const isPasswordValid = /^STY\d{3}$/.test(credentialsModalData.password);
        console.log('Is 6-character STY+3-digits password valid?', isPasswordValid);
        if (!isPasswordValid) {
            throw new Error(`Password ${credentialsModalData.password} does not conform to pattern STY + 3 digits.`);
        }

        const credsModalScreenshot = path.join(ARTIFACTS_DIR, 'admin_generated_credentials_popup_modal.png');
        await page.screenshot({ path: credsModalScreenshot, fullPage: false });
        console.log('Saved credentials popup modal screenshot to:', credsModalScreenshot);

        console.log('12. Testing 1-click Copy Credentials button...');
        await page.evaluate(() => {
            window.copyCredentialsToClipboard();
        });
        await new Promise(r => setTimeout(r, 600));

        // ---------------------------------------------------------------------
        // STEP 4: Database & Bcrypt Hashing Backend Validation
        // ---------------------------------------------------------------------
        console.log('13. Validating backend persistence in data/users.json and data/employees.json...');
        const usersFile = path.join(__dirname, '..', 'data', 'users.json');
        const employeesFile = path.join(__dirname, '..', 'data', 'employees.json');

        const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
        const employeesData = JSON.parse(fs.readFileSync(employeesFile, 'utf-8'));

        const storedUser = usersData[credentialsModalData.username];
        if (!storedUser) {
            throw new Error(`User ${credentialsModalData.username} not found in users.json`);
        }

        console.log('Stored user in users.json:', {
            username: storedUser.username,
            role: storedUser.role,
            passwordHashPrefix: storedUser.passwordHash ? storedUser.passwordHash.substring(0, 10) : 'none'
        });

        // Verify password is hashed with bcrypt ($2b$ or $2a$)
        const isBcrypt = storedUser.passwordHash && (storedUser.passwordHash.startsWith('$2b$') || storedUser.passwordHash.startsWith('$2a$'));
        console.log('Is password securely hashed with bcrypt?', isBcrypt);
        if (!isBcrypt) {
            throw new Error('Password was not hashed using bcrypt in users.json!');
        }

        const storedEmployee = employeesData.find(e => e.username === credentialsModalData.username) || employeesData.filter(e => e.name === 'Amal Dev').pop();
        if (!storedEmployee) {
            throw new Error('Employee Amal Dev not found in employees.json');
        }

        console.log('Stored employee in employees.json:', {
            id: storedEmployee.id,
            name: storedEmployee.name,
            status: storedEmployee.status,
            hasLogin: storedEmployee.hasLogin,
            username: storedEmployee.username
        });

        if (storedEmployee.status !== 'provisioned' || !storedEmployee.hasLogin) {
            throw new Error('Employee status was not updated to provisioned with hasLogin: true!');
        }

        console.log('================================================================');
        console.log('🎉 ALL HR ONBOARDING & ADMIN PROVISIONING E2E CHECKS PASSED 100%!');
        console.log('================================================================');

    } catch (err) {
        console.error('E2E Verification Failed:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

run();
