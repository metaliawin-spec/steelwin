const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1500, height: 1000 });
        
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Step 1: Verify formatQuoteItemTitle helper on various inputs
        const helperResults = await page.evaluate(() => {
            return {
                test1: window.formatQuoteItemTitle({ name: 'Window W1', desc: '1 Kalli (50×140 cm) - 4X2.5' }),
                test2: window.formatQuoteItemTitle({ name: 'Window W2', width: 60, height: 120, unit: 'cm' }),
                test3: window.formatQuoteItemTitle({ name: 'Window W1 (50x140 cm)', desc: '1 Kalli (50×140 cm) - 4X2.5' }),
                test4: window.formatQuoteItemTitle({ name: 'Kitchen W3', desc: '2 Kalli (100*120 cm)' })
            };
        });
        console.log('formatQuoteItemTitle Unit Tests:', JSON.stringify(helperResults, null, 2));

        // Step 2: Create a quotation with Window W1 (50x140 cm) and Window W2 (50x140 cm)
        console.log('Creating sample quotation via Window Studio simulation...');
        const createResult = await page.evaluate(() => {
            const store = window.Store;
            store.state.quoteStudio = {
                customer: {
                    name: 'Kavitha Nair',
                    mobile: '9847112233',
                    place: 'Palarivattom',
                    city: 'Kochi',
                    pincode: '682025'
                },
                materials: {
                    frame: 'f1', pipe: 'p1', panel: 'pan1', hinge: 'h1', paint: 'pt1', hook: 'hk1', lock: 'lk1'
                },
                items: [],
                currentWindow: {
                    cols: 1,
                    rows: 1,
                    unit: 'cm',
                    totalW: 50,
                    totalH: 140,
                    paneWidths: [50],
                    panePartitions: [0],
                    partitionPos: ['top'],
                    quantity: 1,
                    laborCharge: 800,
                    profitMarginPercent: 15
                },
                currentWindowSaved: false
            };

            // Save first window and advance to second window
            window.saveQuotationItemAndNew();

            // Set second window
            store.state.quoteStudio.currentWindow = {
                cols: 1,
                rows: 1,
                unit: 'cm',
                totalW: 50,
                totalH: 140,
                paneWidths: [50],
                panePartitions: [0],
                partitionPos: ['top'],
                quantity: 1,
                laborCharge: 800,
                profitMarginPercent: 15
            };
            store.state.quoteStudio.currentWindowSaved = false;

            // Finalize quotation
            window.saveQuotationFinal();

            const quote = store.state.quotations[0];
            return {
                quoteId: quote.id,
                customer: quote.customer,
                itemCount: quote.items.length,
                item1Name: quote.items[0].name,
                item1Desc: quote.items[0].desc,
                item2Name: quote.items[1].name,
                item2Desc: quote.items[1].desc,
                total: quote.amount
            };
        });

        console.log('Quotation Created:', JSON.stringify(createResult, null, 2));

        await new Promise(r => setTimeout(r, 600));

        // Step 3: Verify the open Print Quotation modal
        const printModalData = await page.evaluate(() => {
            const modal = document.getElementById('quote-print-modal');
            if (!modal) return { open: false };
            const editBtn = modal.querySelector('button[onclick*="openEditQuotationModal"]');
            const rows = Array.from(modal.querySelectorAll('#printable-quotation tbody tr')).map(tr => {
                const titleEl = tr.querySelector('td:nth-child(2) div:first-child');
                const descEl = tr.querySelector('td:nth-child(2) div:nth-child(2)');
                const qtyEl = tr.querySelector('td:nth-child(3)');
                const rateEl = tr.querySelector('td:nth-child(4)');
                const amountEl = tr.querySelector('td:nth-child(7)');
                const editRowBtn = tr.querySelector('td:nth-child(8) button');
                return {
                    title: titleEl ? titleEl.innerText : '',
                    desc: descEl ? descEl.innerText : '',
                    qty: qtyEl ? qtyEl.innerText : '',
                    rate: rateEl ? rateEl.innerText : '',
                    amount: amountEl ? amountEl.innerText : '',
                    hasRowEditBtn: !!editRowBtn
                };
            });
            return {
                open: true,
                hasToolbarEditBtn: !!editBtn,
                rows
            };
        });

        console.log('Print Modal Verification:', JSON.stringify(printModalData, null, 2));

        await page.screenshot({ path: 'scripts/quote_print_modal_initial.png', fullPage: false });
        console.log('Captured scripts/quote_print_modal_initial.png');

        // Step 4: Open Edit Quotation Modal
        console.log('Opening Edit Quotation modal...');
        await page.evaluate((quoteId) => {
            window.openEditQuotationModal(quoteId);
        }, createResult.quoteId);

        await new Promise(r => setTimeout(r, 500));

        // Verify Edit Modal elements
        const editModalInitial = await page.evaluate(() => {
            const modal = document.getElementById('edit-quotation-modal');
            if (!modal) return { open: false };
            const customerInput = document.getElementById('edit-q-customer')?.value;
            const item1NameInput = document.getElementById('edit-q-item-name-0')?.value;
            const grandTotal = document.getElementById('edit-q-grand-total')?.innerText;
            return {
                open: true,
                customerInput,
                item1NameInput,
                grandTotal
            };
        });

        console.log('Edit Modal Initial state:', JSON.stringify(editModalInitial, null, 2));

        await page.screenshot({ path: 'scripts/quote_edit_modal_open.png', fullPage: false });
        console.log('Captured scripts/quote_edit_modal_open.png');

        // Step 5: Edit Item 1: change model name, quantity, rate, and advance payment
        console.log('Performing in-place edits in the modal...');
        await page.evaluate(() => {
            // Update item 1 name, qty, rate
            window.updateEditQuoteItemField(0, 'name', 'Window W1 Master Bedroom (50x140 cm)');
            window.updateEditQuoteItemField(0, 'qty', '2');
            window.updateEditQuoteItemField(0, 'rate', '2500');

            // Update Advance
            window.updateEditQuoteAdvance('1000');
        });

        await new Promise(r => setTimeout(r, 400));

        const editModalAfter = await page.evaluate(() => {
            const item1Total = document.getElementById('edit-q-item-total-0')?.innerText;
            const grandTotal = document.getElementById('edit-q-grand-total')?.innerText;
            const balanceDue = document.getElementById('edit-q-balance-due')?.innerText;
            return {
                item1Total,
                grandTotal,
                balanceDue
            };
        });

        console.log('Edit Modal Live Recalculations:', JSON.stringify(editModalAfter, null, 2));

        await page.screenshot({ path: 'scripts/quote_edit_modal_modified.png', fullPage: false });
        console.log('Captured scripts/quote_edit_modal_modified.png');

        // Step 6: Save changes
        console.log('Saving changes...');
        await page.evaluate(() => {
            window.saveEditedQuotation();
        });

        await new Promise(r => setTimeout(r, 600));

        // Step 7: Check that Print Preview refreshed with updated values
        const printModalUpdated = await page.evaluate(() => {
            const modal = document.getElementById('quote-print-modal');
            if (!modal) return { open: false };
            const rows = Array.from(modal.querySelectorAll('#printable-quotation tbody tr')).map(tr => {
                return {
                    title: tr.querySelector('td:nth-child(2) div:first-child')?.innerText,
                    desc: tr.querySelector('td:nth-child(2) div:nth-child(2)')?.innerText,
                    qty: tr.querySelector('td:nth-child(3)')?.innerText,
                    rate: tr.querySelector('td:nth-child(4)')?.innerText,
                    amount: tr.querySelector('td:nth-child(7)')?.innerText
                };
            });
            const grandTotalEl = Array.from(modal.querySelectorAll('div')).find(d => d.innerText === 'Grand Total:')?.nextElementSibling?.innerText;
            const advanceEl = Array.from(modal.querySelectorAll('div')).find(d => d.innerText === 'Advance Paid:')?.nextElementSibling?.innerText;
            const balanceEl = Array.from(modal.querySelectorAll('div')).find(d => d.innerText === 'Balance Due:')?.nextElementSibling?.innerText;
            return {
                rows,
                grandTotal: grandTotalEl,
                advancePaid: advanceEl,
                balanceDue: balanceEl
            };
        });

        console.log('Updated Print Modal Values:', JSON.stringify(printModalUpdated, null, 2));

        await page.screenshot({ path: 'scripts/quote_print_modal_updated.png', fullPage: false });
        console.log('Captured scripts/quote_print_modal_updated.png');

    } catch (err) {
        console.error('Error during test:', err);
    } finally {
        await browser.close();
    }
})();
