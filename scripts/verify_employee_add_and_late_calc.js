const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
    console.log('--- TESTING EMPLOYEE ADDITION & LATE ARRIVAL DETECTION ---');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Add a new staff member dynamically
    const newStaff = {
        name: 'Anupama Krishnan',
        role: 'Assistant Accounts Manager',
        department: 'Accounts',
        place: 'Calicut, Kerala',
        phone: '+91 9946 112 233',
        email: 'anupama.acc@stellobuild.com',
        monthlySalary: 28000,
        shiftHours: 8,
        reportingTime: '08:30 AM',
        overtimeRate: 150,
        permissions: {
            dashboard: 'view',
            sales: 'functional',
            payments: 'functional',
            quotations: 'view',
            customers: 'view',
            hr: 'functional'
        }
    };

    const addedId = await page.evaluate((staff) => {
        const id = 'EMP-' + (Store.state.staff.length + 101);
        Store.addStaff({
            id,
            ...staff,
            status: 'Absent',
            checkIn: '-',
            checkOut: '-',
            presentDays: 20,
            lateDays: 0,
            overtimeHours: 0,
            overtime: 0
        });
        return id;
    }, newStaff);

    console.log('Added new employee with ID:', addedId);

    // Test Late Check-In Detection: check in at 09:20 AM (Reporting time was 08:30 AM)
    const lateCheckResult = await page.evaluate((empId) => {
        return Store.logStaffCheckIn(empId, '09:20 AM', 'Biometric Kiosk');
    }, addedId);

    console.log('Late check-in result for 09:20 AM:', lateCheckResult);
    if (!lateCheckResult.isLate) {
        throw new Error('Late check-in was NOT flagged as late!');
    }

    const updatedEmp = await page.evaluate((empId) => {
        return Store.state.staff.find(s => s.id === empId);
    }, addedId);
    console.log(`Updated Employee lateDays: ${updatedEmp.lateDays}, status: ${updatedEmp.status}`);
    if (updatedEmp.lateDays !== 1 || updatedEmp.status !== 'Present') {
        throw new Error('Employee lateDays was not incremented!');
    }

    // Test Clock-Out with Overtime: check out at 06:50 PM (9.5 hours worked, shift is 8h -> 1.5h OT)
    const checkOutResult = await page.evaluate((empId) => {
        return Store.logStaffCheckOut(empId, '06:50 PM');
    }, addedId);
    console.log('Check-Out result with Overtime:', checkOutResult);
    if (checkOutResult.otHours <= 0 || checkOutResult.otPay <= 0) {
        throw new Error('Overtime hours were not calculated on clock-out!');
    }

    console.log('✅ All dynamic employee addition, late arrival detection, and checkout OT tests PASSED!');
    await browser.close();
})();
