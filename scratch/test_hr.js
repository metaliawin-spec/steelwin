const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
    
    await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Switch view to HR
    const switched = await page.evaluate(() => {
        window.switchView('hr');
        return {
            currentView: window.Store.state.currentView,
            hasOpenAddStaff: typeof window.openAddStaffModal === 'function'
        };
    });
    console.log('Switched to HR:', switched);
    await new Promise(r => setTimeout(r, 1000));

    // Open Add Staff Modal
    const modalRes = await page.evaluate(() => {
        window.openAddStaffModal();
        const modal = document.getElementById('add-staff-modal');
        const form = document.getElementById('hr-employee-form');
        return {
            modalFound: !!modal,
            formFound: !!form,
            formId: form ? form.id : null,
            formInputs: form ? Array.from(form.elements).map(e => ({ name: e.name, id: e.id, type: e.type })) : []
        };
    });
    console.log('Modal opened:', modalRes);

    await browser.close();
})();
