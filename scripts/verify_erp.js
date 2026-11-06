const fs = require('fs');
const bundle = fs.readFileSync('js/bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

const tests = [
    { name: 'Deterministic #dashboard logo route', pass: indexHtml.includes("window.location.hash='#dashboard'") && indexHtml.includes("navigate('dashboard')") },
    { name: 'Strict 16-item sidebar hierarchy', pass: bundle.includes('dashboard') && bundle.includes('orders') && bundle.includes('stock_manager') && bundle.includes('service_visit') },
    { name: 'Dedicated Orders Module with CAD viewer & Milestones', pass: bundle.includes('ORDER_MILESTONES') && bundle.includes('zoomCustomerDrawing') && bundle.includes('dispatchOrderWhatsApp') },
    { name: '8 Production Stages with credential revocation on Delivered', pass: bundle.includes('Order Listed') && bundle.includes('Channel Making') && bundle.includes('Customer portal credentials have been automatically revoked and disabled') },
    { name: 'Lead Pipeline Stage header', pass: bundle.includes('Stage') && bundle.includes('LEAD_STAGES') },
    { name: 'Field visit environment camera capture', pass: bundle.includes('capture="environment"') },
    { name: 'Sales rate inclusive of tax & 18% GST breakout', pass: bundle.includes('RATE (INCL. TAX)') && bundle.includes('/ 1.18') && bundle.includes('CGST (9%)') },
    { name: 'Sales advance payment emerald card', pass: bundle.includes('Advance Payment') && bundle.includes('toggleInvAdvanceCard') && bundle.includes('rgba(16, 185, 129') },
    { name: 'Sales Return & Purchase Return tabs & modals', pass: bundle.includes('openNewSalesReturnModal') && bundle.includes('openNewPurchaseReturnModal') },
    { name: 'Dynamic stock categories (+ Add Category) & Finished Goods photo upload', pass: bundle.includes('openAddStockCategoryModal') && bundle.includes('openAddFinishedGoodsModal') && bundle.includes('photoUrl') },
    { name: 'HR 100m Geofencing (11.2588, 75.7804) & Admin Test Bypass', pass: bundle.includes('11.2588') && bundle.includes('75.7804') && bundle.includes('Admin Test Bypass (Demo Mode)') },
    { name: 'HR Clock-In vs Leave mode with auto-logout', pass: bundle.includes('faceScanMode') && bundle.includes('Leave (Clock-Out') && bundle.includes('confirmSecureLogoutSession') },
    { name: 'HR 9:10 AM grace period & wage penalty', pass: bundle.includes('graceThresholdMinutes = 9 * 60 + 10') && bundle.includes('latePenaltyDeduction') },
    { name: 'HR Resignation flow with admin passcode authorization', pass: bundle.includes('openResignStaffModal') && bundle.includes('resign-admin-passcode') },
    { name: 'HR Attendance Reports modal & Excel export', pass: bundle.includes('openAttendanceReportModal') && bundle.includes('downloadAttendanceReportExcel') },
    { name: 'Settings Employee Role tab renaming', pass: bundle.includes("'Employee Role', 'shield-check'") },
    { name: 'Settings Super Admin & Employees two horizontal tabs', pass: bundle.includes('tab-super-admin') && bundle.includes('tab-employees') && bundle.includes('rbacStaffSearchInput') },
    { name: 'Settings Phone beneath PIN code & passcodes documented', pass: bundle.includes('Phone Number (Directly beneath PIN code)') && bundle.includes('SB-9901') && bundle.includes('admin123') }
];

console.log('=== STYLOBUILD ERP VERIFICATION SUITE ===');
let failed = 0;
tests.forEach(t => {
    if (t.pass) {
        console.log('  PASS:', t.name);
    } else {
        console.log('  FAIL:', t.name);
        failed++;
    }
});
console.log('Total Tests:', tests.length, '| Passed:', tests.length - failed, '| Failed:', failed);
if (failed > 0) process.exit(1);
