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

    // ==========================================
    // TEST 1: Quotation - Print Options & Advance Auto-Apply
    // ==========================================
    console.log('\n--- TEST 1: Quotation Module ---');
    await page.evaluate(() => window.navigate('quotations'));
    await new Promise(r => setTimeout(r, 200));

    // Click "Create Quotation"
    await page.evaluate(() => window.initCreateQuotation());
    await new Promise(r => setTimeout(r, 200));

    // 1.1 Check Print Document Options presence
    const quotePrintOptionsText = await page.evaluate(() => {
      const el = document.querySelector('#quote-show-logo');
      const bankEl = document.querySelector('#quote-show-bank');
      return {
        hasLogoCheck: !!el && el.checked,
        hasBankCheck: !!bankEl && bankEl.checked
      };
    });
    console.log('Quotation Print Document Options:', quotePrintOptionsText);
    if (!quotePrintOptionsText.hasLogoCheck || !quotePrintOptionsText.hasBankCheck) {
      console.error('FAILED: Quotation print options checkboxes missing or not default checked!');
      passed = false;
    }

    // 1.2 Select customer "Arun Kumar" (has 15,000 advance)
    await page.evaluate(() => window.selectQuoteCustomer('Arun Kumar'));
    await new Promise(r => setTimeout(r, 200));

    // Check green indicator
    const quoteAdvanceIndicator = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const ind = spans.find(s => s.innerText.includes('Available Advance: ₹15,000'));
      return ind ? ind.innerText : null;
    });
    console.log('Quotation Green Advance Indicator:', quoteAdvanceIndicator);
    if (!quoteAdvanceIndicator) {
      console.error('FAILED: Green indicator for Arun Kumar (₹15,000) not displayed!');
      passed = false;
    }

    // Add an item so Grand Total has a value
    await page.evaluate(() => {
      window.updateQuoteItem(0, 'name', 'Steel Window Frame');
      window.updateQuoteItem(0, 'price', 25000);
      window.updateQuoteItem(0, 'qty', 1);
    });
    await new Promise(r => setTimeout(r, 200));

    // Click green indicator to auto-apply advance
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const ind = spans.find(s => s.innerText.includes('Available Advance: ₹15,000'));
      if (ind) ind.click();
    });
    await new Promise(r => setTimeout(r, 200));

    // Verify auto-fill and Balance Due recalculation
    const quoteCalcs = await page.evaluate(() => {
      const advInput = document.querySelector('input[placeholder="0"]');
      const spans = Array.from(document.querySelectorAll('span'));
      const balSpan = spans.find(s => s.innerText === 'Balance Due')?.nextElementSibling?.innerText;
      return {
        advValue: advInput?.value,
        balanceDue: balSpan
      };
    });
    console.log('Quotation Calculations after Auto-Apply:', quoteCalcs);
    if (quoteCalcs.advValue != '15000' || !quoteCalcs.balanceDue?.includes('10,000')) {
      console.error('FAILED: Advance payment not auto-filled or Balance Due incorrect!');
      passed = false;
    }

    // Test Print Template Modal for Quotation
    console.log('Testing Quotation Print Modal with Logo=false, Bank=true...');
    await page.evaluate(() => {
      window.updateQuotePrintOption('showLogoHeader', false);
      window.updateQuotePrintOption('showBankDetails', true);
    });
    // Open Print Modal
    await page.evaluate(() => window.saveQuotation(true));
    await new Promise(r => setTimeout(r, 200));

    const quoteModalCheck = await page.evaluate(() => {
      const modal = document.getElementById('quote-print-modal');
      const hasLogo = modal?.innerText.includes('Industrial Estate, Kakkanad');
      const hasBank = modal?.innerText.includes('HDFC Bank');
      const hasAdvance = modal?.innerText.includes('Advance Paid:') && modal?.innerText.includes('15,000');
      const hasBalance = modal?.innerText.includes('Balance Due:') && modal?.innerText.includes('10,000');
      return { exists: !!modal, hasLogo, hasBank, hasAdvance, hasBalance };
    });
    console.log('Quotation Print Modal Render:', quoteModalCheck);
    if (!quoteModalCheck.exists || quoteModalCheck.hasLogo || !quoteModalCheck.hasBank || !quoteModalCheck.hasAdvance) {
      console.error('FAILED: Quotation print template conditional rendering error!');
      passed = false;
    }
    // Close modal
    await page.evaluate(() => document.getElementById('quote-print-modal')?.remove());

    // Verify customer advance was deducted in store
    const arunBalanceAfter = await page.evaluate(() => {
      return (window.Store || Store).state.customers.find(c => c.name === 'Arun Kumar')?.advanceBalance;
    });
    console.log('Arun Kumar Advance Balance after saving Quote:', arunBalanceAfter);
    if (arunBalanceAfter !== 0) {
      console.error('FAILED: Customer advance balance was not deducted upon saving!');
      passed = false;
    }

    // ==========================================
    // TEST 2: Sales Invoice - Print Options & Advance Auto-Apply
    // ==========================================
    console.log('\n--- TEST 2: Sales Invoice Module ---');
    await page.evaluate(() => window.navigate('sales'));
    await new Promise(r => setTimeout(r, 200));

    // Click "Create Sale Invoice"
    await page.evaluate(() => window.initCreateInvoice());
    await new Promise(r => setTimeout(r, 200));

    // 2.1 Check Print Document Options presence
    const invPrintOptionsText = await page.evaluate(() => {
      const logoEl = document.querySelector('#inv-show-logo');
      const bankEl = document.querySelector('#inv-show-bank');
      return {
        hasLogoCheck: !!logoEl && logoEl.checked,
        hasBankCheck: !!bankEl && bankEl.checked
      };
    });
    console.log('Sales Invoice Print Document Options:', invPrintOptionsText);
    if (!invPrintOptionsText.hasLogoCheck || !invPrintOptionsText.hasBankCheck) {
      console.error('FAILED: Invoice print options checkboxes missing or not default checked!');
      passed = false;
    }

    // 2.2 Select customer "Luxury Villa Project" (has 25,000 advance)
    await page.evaluate(() => window.selectInvCustomer('Luxury Villa Project'));
    await new Promise(r => setTimeout(r, 200));

    // Check green indicator
    const invAdvanceIndicator = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const ind = spans.find(s => s.innerText.includes('Available Advance: ₹25,000'));
      return ind ? ind.innerText : null;
    });
    console.log('Sales Invoice Green Advance Indicator:', invAdvanceIndicator);
    if (!invAdvanceIndicator) {
      console.error('FAILED: Green indicator for Luxury Villa Project (₹25,000) not displayed!');
      passed = false;
    }

    // Add an item to invoice
    await page.evaluate(() => {
      window.updateInvItem(0, 'name', 'Double Glass French Window');
      window.updateInvItem(0, 'price', 60000);
      window.updateInvItem(0, 'qty', 1);
    });
    await new Promise(r => setTimeout(r, 200));

    // Click green indicator to auto-apply advance
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const ind = spans.find(s => s.innerText.includes('Available Advance: ₹25,000'));
      if (ind) ind.click();
    });
    await new Promise(r => setTimeout(r, 200));

    // Verify auto-fill and Balance Due recalculation
    const invCalcs = await page.evaluate(() => {
      const advInput = document.querySelector('input[onchange*="updateInvAdvancePayment"]');
      const spans = Array.from(document.querySelectorAll('span'));
      const balSpan = spans.find(s => s.innerText === 'Balance Due')?.nextElementSibling?.innerText;
      return {
        advValue: advInput?.value,
        balanceDue: balSpan
      };
    });
    console.log('Sales Invoice Calculations after Auto-Apply:', invCalcs);
    if (invCalcs.advValue != '25000' || !invCalcs.balanceDue?.includes('35000')) {
      console.error('FAILED: Invoice Advance payment not auto-filled or Balance Due incorrect!');
      passed = false;
    }

    // Test Print Template Modal for Invoice with Logo=true, Bank=false
    console.log('Testing Invoice Print Modal with Logo=true, Bank=false...');
    await page.evaluate(() => {
      window.updateInvPrintOption('showLogoHeader', true);
      window.updateInvPrintOption('showBankDetails', false);
    });

    await page.evaluate(() => window.saveInvoice(true));
    await new Promise(r => setTimeout(r, 200));

    const invModalCheck = await page.evaluate(() => {
      const modal = document.getElementById('inv-print-modal');
      const hasLogo = modal?.innerText.includes('WINPRO Systems');
      const hasBank = modal?.innerText.includes('50200098765432');
      const hasAdvance = modal?.innerText.includes('Advance Paid:') && modal?.innerText.includes('25,000');
      const hasBalance = modal?.innerText.includes('Balance Due:') && modal?.innerText.includes('35,000');
      return { exists: !!modal, hasLogo, hasBank, hasAdvance, hasBalance };
    });
    console.log('Invoice Print Modal Render:', invModalCheck);
    if (!invModalCheck.exists || !invModalCheck.hasLogo || invModalCheck.hasBank || !invModalCheck.hasAdvance) {
      console.error('FAILED: Invoice print template conditional rendering error!');
      passed = false;
    }
    await page.evaluate(() => document.getElementById('inv-print-modal')?.remove());

    // Verify customer advance was deducted in store
    const luxuryBalanceAfter = await page.evaluate(() => {
      return (window.Store || Store).state.customers.find(c => c.name === 'Luxury Villa Project')?.advanceBalance;
    });
    console.log('Luxury Villa Project Advance Balance after saving Invoice:', luxuryBalanceAfter);
    if (luxuryBalanceAfter !== 0) {
      console.error('FAILED: Customer advance balance was not deducted upon saving invoice!');
      passed = false;
    }

    await browser.close();

    if (passed) {
      console.log('\n🎉 ALL FEATURES IMPLEMENTED AND VERIFIED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.log('\n❌ ONE OR MORE TESTS FAILED');
      process.exit(1);
    }

  } catch (e) {
    console.error('Error during test:', e);
    process.exit(1);
  }
})();
