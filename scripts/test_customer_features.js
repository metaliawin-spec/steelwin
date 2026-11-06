const puppeteer = require('puppeteer');

(async () => {
  let passed = true;
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('[BROWSER ERROR]', msg.text());
    });
    page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    console.log('App loaded at http://localhost:3000');

    // 1. Navigate to customers view
    console.log('\n--- TEST 1: Navigating to Customers Module ---');
    await page.evaluate(() => window.navigate('customers'));
    await new Promise(r => setTimeout(r, 200));

    // Verify customers table rendered
    const customerCount = await page.evaluate(() => {
      return document.querySelectorAll('tr[onclick*="viewCustomer"]').length;
    });
    console.log(`Found ${customerCount} customers in table.`);
    if (customerCount === 0) {
      console.error('FAILED: No customers rendered in customer list table');
      passed = false;
    }

    // 2. Open Customer Profile for Arun Kumar
    console.log('\n--- TEST 2: Opening Customer Profile for Arun Kumar ---');
    await page.evaluate(() => window.viewCustomerDetails('Arun Kumar'));
    await new Promise(r => setTimeout(r, 300));

    // Check KPIs
    const kpiData = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('.kpi-card')).map(c => c.innerText.replace(/\n+/g, ' '));
      return texts;
    });
    console.log('Customer Profile KPIs:', kpiData);

    // 3. Verify Order Tracking Tab
    console.log('\n--- TEST 3: Testing Order Tracking Section ---');
    await page.evaluate(() => window.switchCustomerTab('orders'));
    await new Promise(r => setTimeout(r, 200));

    const orderSection = await page.evaluate(() => {
      const ordersContainer = document.querySelector('#customer-orders-view');
      const orderCards = document.querySelectorAll('#customer-orders-view .card');
      const dropdowns = document.querySelectorAll('#customer-orders-view select[onchange*="updateCustomerOrderStatus"]');
      const steppers = document.querySelectorAll('#customer-orders-view [style*="grid-template-columns"]');
      return {
        hasContainer: !!ordersContainer,
        cardCount: orderCards.length,
        hasDropdowns: dropdowns.length > 0,
        stepperCount: steppers.length
      };
    });
    console.log('Order Tracking Details:', orderSection);
    if (!orderSection.hasContainer || orderSection.cardCount === 0 || !orderSection.hasDropdowns) {
      console.error('FAILED: Order tracking section failed to render orders or status updater dropdowns!');
      passed = false;
    }

    // Test live status updater on an order
    console.log('\n--- TEST 4: Testing Live Order Status Update ---');
    const updateResult = await page.evaluate(() => {
      const select = document.querySelector('#customer-orders-view select[onchange*="updateCustomerOrderStatus"]');
      if (select) {
        select.value = 'Painting & Coat';
        select.dispatchEvent(new Event('change'));
        return true;
      }
      return false;
    });
    await new Promise(r => setTimeout(r, 300));
    console.log('Status updated in UI:', updateResult);

    // 4. Verify Unified Activity & Transaction History Timeline
    console.log('\n--- TEST 5: Testing Unified Activity & Transaction History Timeline ---');
    await page.evaluate(() => window.switchCustomerTab('timeline'));
    await new Promise(r => setTimeout(r, 200));

    const timelineData = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.timeline-item'));
      const filterPills = Array.from(document.querySelectorAll('.filter-pill, button[onclick*="filterCustomerTimeline"]'));
      return {
        totalTimelineItems: items.length,
        filterCount: filterPills.length,
        itemsSummary: items.slice(0, 5).map(it => it.innerText.split('\n').filter(Boolean).slice(0, 3).join(' | '))
      };
    });
    console.log('Unified Timeline data:', timelineData);
    if (timelineData.totalTimelineItems === 0) {
      console.error('FAILED: Unified timeline has no items!');
      passed = false;
    }

    // Test Timeline Filters
    console.log('\n--- TEST 6: Testing Timeline Category Filters ---');
    for (const cat of ['sales', 'services', 'purchases', 'quotes']) {
      await page.evaluate((c) => window.filterCustomerTimeline(c), cat);
      await new Promise(r => setTimeout(r, 150));
      const filteredCount = await page.evaluate(() => {
        return document.querySelectorAll('.timeline-item').length;
      });
      console.log(`Filter [${cat}] returned ${filteredCount} item(s).`);
    }

    // Reset filter to 'all'
    await page.evaluate(() => window.filterCustomerTimeline('all'));
    await new Promise(r => setTimeout(r, 150));

    // 5. Test Adding a Service Interaction
    console.log('\n--- TEST 7: Testing Logging Customer Service Visit ---');
    await page.evaluate(() => window.openAddCustomerServiceModal('Arun Kumar'));
    await new Promise(r => setTimeout(r, 200));

    const modalExists = await page.evaluate(() => !!document.querySelector('#add-service-modal'));
    console.log('Service Modal Opened:', modalExists);
    if (!modalExists) {
      console.error('FAILED: Add Service modal did not open!');
      passed = false;
    }

    // Fill and submit service modal
    await page.evaluate(() => {
      document.querySelector('#srv-title').value = 'Window Gasket & Roller Replacement';
      document.querySelector('#srv-cost').value = '1800';
      document.querySelector('#srv-notes').value = 'Lubricated tracks and replaced worn rollers.';
      window.submitCustomerService();
    });
    await new Promise(r => setTimeout(r, 300));

    // Check if new service appears in timeline
    const hasNewService = await page.evaluate(() => {
      const text = document.querySelector('#customer-timeline-container')?.innerText || '';
      return text.includes('Window Gasket & Roller Replacement') && text.includes('1,800');
    });
    console.log('New service reflected in timeline:', hasNewService);
    if (!hasNewService) {
      console.error('FAILED: New service not reflected in unified timeline!');
      passed = false;
    }

    // 6. Test direct file protocol (file:///)
    console.log('\n--- TEST 8: Testing Standalone file:/// Execution ---');
    const filePath = 'file:///D:/code%20project/index.html';
    await page.goto(filePath, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 500));

    const fileModeSuccess = await page.evaluate(() => {
      window.navigate('customers');
      window.viewCustomerDetails('Arun Kumar');
      const timelineCards = document.querySelectorAll('.timeline-item');
      return {
        hasTimeline: timelineCards.length > 0,
        appTitle: document.title
      };
    });
    console.log('file:/// Execution Check:', fileModeSuccess);
    if (!fileModeSuccess.hasTimeline) {
      console.error('FAILED: Features not working in file:/// mode!');
      passed = false;
    }

    await browser.close();

    if (passed) {
      console.log('\n🎉 ALL ORDER TRACKING & UNIFIED TIMELINE FEATURES PASSED PERFECTLY!');
      process.exit(0);
    } else {
      console.log('\n❌ ONE OR MORE TESTS FAILED');
      process.exit(1);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
})();
