import { Store } from '../store.js';

// --- HELPERS ---

function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    num = Math.round(Number(num) || 0);
    if (num === 0) return 'Zero';
    if (num > 999999999) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; var str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only ' : '';
    return str || 'Zero';
}

export function formatQuoteItemTitle(it, idx) {
    if (!it) return '';
    if (it.modelTitle && /\(\s*\d+.*[xX×*].*\)/.test(it.modelTitle)) {
        return it.modelTitle;
    }
    const itemNum = idx !== undefined ? (idx + 1) : 1;
    let name = (it.name || '').trim();
    let w = it.width, h = it.height, u = it.unit || 'cm';
    if (!w || !h) {
        const match = (it.desc || it.description || '').match(/(\d+(?:\.\d+)?)\s*[*xX×]\s*(\d+(?:\.\d+)?)\s*(cm|mm|inch|in|ft|m)?/i);
        if (match) {
            w = match[1];
            h = match[2];
            if (match[3]) u = match[3];
        }
    }
    // If name is generic like Windows 1 or Window 1, standardize to Window W1
    if (!name || /^windows?\s*\d+$/i.test(name)) {
        name = `Window W${itemNum}`;
    }
    if (w && h) {
        if (/\(\s*\d+.*[xX×*].*\)/.test(name)) {
            return name;
        }
        return `${name} (${w} x ${h} ${u})`;
    }
    return name || `Window W${itemNum}`;
}
window.formatQuoteItemTitle = formatQuoteItemTitle;

// --- STATE FOR CREATE VIEW ---

let createQuoteState = {
    id: '',
    title: 'Quotation / Estimate',
    customer: '',
    customerId: '',
    customerAddress: '',
    customerPhone: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    refNo: '',
    items: [],
    discountType: 'percentage', // or 'fixed'
    discountValue: 0,
    transport: 0,
    labour: 0,
    roundOff: true,
    advancePayment: 0,
    balanceDue: 0,
    termsRows: [],
    printOptions: {
        showLogoHeader: true,
        showBankDetails: true
    }
};

// --- ACTIONS ---

window.initCreateQuotation = (forceStandard = false) => {
    if (!forceStandard && typeof window.startQuotationStudio === 'function') {
        return window.startQuotationStudio();
    }
    const store = window.Store || Store;
    const defId = store.generateNextQuotationNumber ? store.generateNextQuotationNumber(false) : ('Q-' + new Date().getFullYear() + '-001');
    const defTitle = store.state?.settings?.quotationDefaults?.title || 'Quotation / Estimate';
    const defTerms = store.state?.settings?.quotationDefaults?.termsRows ? [...store.state.settings.quotationDefaults.termsRows] : [
        '1. Rates are valid for 15 days from the date of quotation.',
        '2. 50% advance along with confirmed work order.',
        '3. Delivery within 10-14 working days after advance and dimension approval.',
        '4. Transport & installation extra as per actual site conditions.'
    ];

    // Reset State
    createQuoteState = {
        id: defId,
        title: defTitle,
        customer: '',
        customerId: '',
        customerAddress: '',
        customerPhone: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        refNo: 'REF-' + Date.now().toString().slice(-4),
        items: [{ id: Date.now(), name: '', description: '', qty: 1, uom: 'pcs', price: 0, discount: 0, tax: 0, total: 0 }],
        discountType: 'percentage',
        discountValue: 0,
        transport: 0,
        labour: 0,
        roundOff: true,
        advancePayment: 0,
        balanceDue: 0,
        termsRows: [...defTerms],
        printOptions: {
            showLogoHeader: true,
            showBankDetails: true
        }
    };
    renderCreateView();
};

function renderCreateView() {
    const main = document.getElementById('main-view');
    if (!main) return;
    main.innerHTML = '';
    main.appendChild(renderCreateQuotationUI());
}

window.selectQuoteCustomer = (nameOrId) => {
    const store = window.Store || Store;
    let cust = null;
    if (typeof nameOrId === 'object' && nameOrId !== null) {
        cust = nameOrId;
    } else {
        const all = (window.UniversalCustomerSearch && window.UniversalCustomerSearch.getAllCustomers()) || store.state.customers || [];
        cust = all.find(c => c.id === nameOrId || (c.name && c.name.toLowerCase() === String(nameOrId).trim().toLowerCase()));
    }
    if (cust) {
        createQuoteState.customer = cust.name;
        createQuoteState.customerId = cust.id;
        createQuoteState.customerAddress = cust.address || '';
        if (cust.advanceBalance && cust.advanceBalance > 0 && !createQuoteState.advancePayment) {
            createQuoteState.advancePayment = cust.advanceBalance;
        }
    } else {
        createQuoteState.customer = typeof nameOrId === 'string' ? nameOrId : '';
        createQuoteState.customerId = '';
    }
    renderCreateView();
};

window.initQuotationFromLead = (lead) => {
    if (!lead) return;
    const items = (lead.products && lead.products.length > 0)
        ? lead.products.map((p, idx) => {
            const price = Math.round((lead.estimatedBudget || 60000) / lead.products.length);
            return {
                id: Date.now() + idx,
                name: p,
                description: `Architectural specification for ${lead.name} (${lead.city || 'Site'})`,
                qty: 1,
                uom: 'set',
                price: price,
                discount: 0,
                tax: 18,
                total: price
            };
        })
        : [{
            id: Date.now(),
            name: 'Architectural Windows Package',
            description: lead.notes || `Custom fabrication for ${lead.name}`,
            qty: 1,
            uom: 'set',
            price: Number(lead.estimatedBudget) || 45000,
            discount: 0,
            tax: 18,
            total: Number(lead.estimatedBudget) || 45000
        }];

    createQuoteState = {
        customer: lead.name,
        customerId: lead.id,
        customerAddress: lead.address ? `${lead.address}${lead.city ? ', ' + lead.city : ''}` : (lead.city || ''),
        customerPhone: lead.phone || '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        refNo: 'QT-' + (lead.id.replace('LD-', '') || Date.now().toString().slice(-4)),
        items: items,
        discountType: 'percentage',
        discountValue: 0,
        transport: 1500,
        labour: 3500,
        roundOff: true,
        advancePayment: 0,
        balanceDue: 0,
        printOptions: {
            showLogoHeader: true,
            showBankDetails: true
        }
    };

    if (window.Store && typeof window.Store.navigate === 'function') {
        window.Store.navigate('quotations');
    } else if (typeof window.navigate === 'function') {
        window.navigate('quotations');
    }
    setTimeout(() => {
        renderCreateView();
    }, 60);
};

window.applyQuoteAdvance = (amount) => {
    createQuoteState.advancePayment = amount;
    renderCreateView();
};

window.updateQuotePrintOption = (option, checked) => {
    createQuoteState.printOptions[option] = checked;
};

window.addQuoteItem = () => {
    createQuoteState.items.push({
        id: Date.now(),
        name: '',
        description: '',
        qty: 1,
        uom: 'pcs',
        price: 0,
        discount: 0,
        tax: 0,
        total: 0
    });
    renderCreateView();
};

window.removeQuoteItem = (index) => {
    if (createQuoteState.items.length > 1) {
        createQuoteState.items.splice(index, 1);
        renderCreateView();
    }
};

window.updateQuoteItem = (index, field, value) => {
    const item = createQuoteState.items[index];
    item[field] = value;

    const setupCost = (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
    const discountAmount = (setupCost * (parseFloat(item.discount) || 0) / 100);
    const taxableAmount = setupCost - discountAmount;
    const taxAmount = (taxableAmount * (parseFloat(item.tax) || 0) / 100);

    item.total = taxableAmount + taxAmount;
    renderCreateView();
};

window.updateQuoteGlobal = (field, value) => {
    createQuoteState[field] = value;
    renderCreateView();
};

window.addQuoteTermRow = () => {
    if (!createQuoteState.termsRows) createQuoteState.termsRows = [];
    createQuoteState.termsRows.push(`${createQuoteState.termsRows.length + 1}. `);
    renderCreateView();
};

window.removeQuoteTermRow = (index) => {
    if (!createQuoteState.termsRows) return;
    createQuoteState.termsRows.splice(index, 1);
    createQuoteState.termsRows = createQuoteState.termsRows.map((t, i) => `${i + 1}. ${t.replace(/^(\d+[\.\)]\s*)/, '')}`);
    renderCreateView();
};

window.updateQuoteTermRow = (index, value) => {
    if (!createQuoteState.termsRows) createQuoteState.termsRows = [];
    createQuoteState.termsRows[index] = `${index + 1}. ${value.replace(/^(\d+[\.\)]\s*)/, '')}`;
};

window.saveQuotation = (andPrint = false) => {
    const store = window.Store || Store;

    // Validation
    if (!createQuoteState.customer) return alert('Please select a customer');
    if (createQuoteState.items.some(i => !i.name || i.total <= 0)) return alert('Please ensure all items have names and valid amounts');

    let totalTaxable = 0;
    let totalTax = 0;

    createQuoteState.items.forEach(item => {
        const cost = (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
        const disc = (cost * (parseFloat(item.discount) || 0) / 100);
        const taxable = cost - disc;
        const tax = (taxable * (parseFloat(item.tax) || 0) / 100);
        totalTaxable += taxable;
        totalTax += tax;
    });

    let grandTotal = totalTaxable + totalTax;

    // Global Discount
    if (createQuoteState.discountValue > 0) {
        const globalDisc = createQuoteState.discountType === 'percentage'
            ? (grandTotal * createQuoteState.discountValue / 100)
            : parseFloat(createQuoteState.discountValue);
        grandTotal -= globalDisc;
    }

    grandTotal += parseFloat(createQuoteState.transport) || 0;
    grandTotal += parseFloat(createQuoteState.labour) || 0;

    if (createQuoteState.roundOff) {
        grandTotal = Math.round(grandTotal);
    }

    const appliedAdvance = parseFloat(createQuoteState.advancePayment) || 0;
    const balanceDue = Math.max(0, grandTotal - appliedAdvance);

    // Deduct applied advance from customer in database
    if (appliedAdvance > 0) {
        store.deductCustomerAdvance(createQuoteState.customerId || createQuoteState.customer, appliedAdvance);
    }

    const quoteId = (createQuoteState.id || '').trim() || (store.generateNextQuotationNumber ? store.generateNextQuotationNumber(true) : ('Q-' + Date.now().toString().slice(-6)));
    if (store.generateNextQuotationNumber && quoteId === store.generateNextQuotationNumber(false)) {
        store.generateNextQuotationNumber(true);
    }
    const quoteTitle = (createQuoteState.title || '').trim() || (store.state?.settings?.quotationDefaults?.title || 'Quotation / Estimate');
    const quoteTerms = (createQuoteState.termsRows && createQuoteState.termsRows.length > 0)
        ? [...createQuoteState.termsRows]
        : (store.state?.settings?.quotationDefaults?.termsRows ? [...store.state.settings.quotationDefaults.termsRows] : [
            '1. Rates are valid for 15 days from the date of quotation.',
            '2. 50% advance along with confirmed work order.',
            '3. Delivery within 10-14 working days after advance and dimension approval.',
            '4. Transport & installation extra as per actual site conditions.'
        ]);

    const newQuote = {
        id: quoteId,
        title: quoteTitle,
        customer: createQuoteState.customer,
        customerId: createQuoteState.customerId,
        customerAddress: createQuoteState.customerAddress,
        customerPhone: createQuoteState.customerPhone || '',
        date: createQuoteState.date,
        dueDate: createQuoteState.dueDate,
        refNo: createQuoteState.refNo,
        amount: grandTotal,
        advancePayment: appliedAdvance,
        balanceDue: balanceDue,
        status: 'Draft',
        termsRows: quoteTerms,
        printOptions: { ...createQuoteState.printOptions },
        items: createQuoteState.items.map(i => ({
            name: i.name,
            desc: i.description,
            pieces: i.qty,
            qty: i.qty,
            rate: i.price,
            price: i.price,
            discount: i.discount,
            tax: i.tax,
            total: i.total
        })),
        details: { ...createQuoteState, grandTotal, balanceDue }
    };

    if (!store.state.quotations) store.state.quotations = [];
    store.state.quotations.unshift(newQuote);
    store.notify();

    if (andPrint) {
        window.openPrintQuotationModal(newQuote);
    } else {
        alert('Quotation Saved Successfully!');
        window.backToQuotations();
    }
};

// --- VIEWS ---

function renderCreateQuotationUI() {
    const store = window.Store || Store;
    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.padding = '2rem';
    container.style.height = '100%';
    container.style.overflowY = 'auto';

    // Calculate Totals for Display
    let totalTaxable = 0;
    let totalTax = 0;
    createQuoteState.items.forEach(item => {
        const cost = (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
        const disc = (cost * (parseFloat(item.discount) || 0) / 100);
        const taxable = cost - disc;
        const tax = (taxable * (parseFloat(item.tax) || 0) / 100);
        totalTaxable += taxable;
        totalTax += tax;
    });

    let grandTotal = totalTaxable + totalTax;
    let finalDiscount = 0;

    if (createQuoteState.discountValue > 0) {
        finalDiscount = createQuoteState.discountType === 'percentage'
            ? (grandTotal * createQuoteState.discountValue / 100)
            : parseFloat(createQuoteState.discountValue);
        grandTotal -= finalDiscount;
    }

    grandTotal += parseFloat(createQuoteState.transport) || 0;
    grandTotal += parseFloat(createQuoteState.labour) || 0;

    if (createQuoteState.roundOff) {
        grandTotal = Math.round(grandTotal);
    }

    const advancePayment = parseFloat(createQuoteState.advancePayment) || 0;
    const balanceDue = Math.max(0, grandTotal - advancePayment);
    createQuoteState.balanceDue = balanceDue;

    // Check customer advance balance
    const customers = store.state.customers || [];
    const selectedCust = customers.find(c => 
        (createQuoteState.customerId && c.id === createQuoteState.customerId) || 
        (c.name && c.name.toLowerCase() === (createQuoteState.customer || '').trim().toLowerCase())
    );
    const availableAdvance = selectedCust ? (selectedCust.advanceBalance || 0) : 0;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
                <h2 style="margin: 0; font-size: 1.6rem; color: var(--color-text-heading); font-weight: 700;">Create Quotation</h2>
                <p style="color: var(--color-text-muted); font-size: 0.88rem; margin: 4px 0 0 0;">Generate detailed quote with advance balance auto-apply and print options.</p>
            </div>
            <div style="display: flex; gap: 0.75rem;">
                <button class="btn btn-secondary" onclick="window.backToQuotations()">Cancel</button>
                <button class="btn btn-secondary" onclick="window.saveQuotation(false)" style="border: 1px solid var(--color-primary); color: var(--color-primary-light);">
                    <i data-lucide="save"></i> Save Draft
                </button>
                <button class="btn btn-primary" onclick="window.saveQuotation(true)">
                    <i data-lucide="printer"></i> Save & Print
                </button>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; position: relative; z-index: 100;">
            <!-- Customer Info -->
            <div class="glass-panel glass-form-card quote-customer-card" style="padding: 1.5rem; border-radius: var(--radius-lg); color: var(--color-text-main); position: relative; z-index: 100;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                    <h4 style="margin: 0; color: var(--color-text-heading); font-size: 1.05rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="user" style="color: var(--color-primary); width: 18px; height: 18px;"></i> Customer Information
                    </h4>
                    ${availableAdvance > 0 ? `
                        <span style="font-size: 0.8rem; color: #10b981; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 2px 8px; border-radius: 4px;">
                            <i data-lucide="sparkles" style="width: 12px; height: 12px;"></i> Advance: ₹${availableAdvance.toLocaleString()}
                        </span>
                    ` : ''}
                </div>
                <div style="margin-bottom: 1rem;">
                    ${window.UniversalCustomerSearch ? window.UniversalCustomerSearch.renderHTML({
                        id: 'quote-customer-search',
                        label: 'Customer Name*',
                        value: createQuoteState.customer,
                        placeholder: 'Please select a customer name',
                        infoTooltip: 'Search verified clients, leads, and price calculation contacts'
                    }) : `<input type="text" value="${createQuoteState.customer}" oninput="window.selectQuoteCustomer(this.value)" class="glass-input" style="width: 100%;">`}
                    ${selectedCust ? `
                        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--color-text-muted); display: flex; justify-content: space-between; background: var(--input-bg); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--glass-border);">
                            <span>Customer ID: <strong style="color: var(--color-primary);">${selectedCust.id}</strong></span>
                            <span>Phone: <strong style="color: var(--color-text-heading);">${selectedCust.mobile || '-'}</strong></span>
                        </div>
                    ` : ''}
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); font-weight: 500; margin-bottom: 0.4rem;">Address</label>
                    <textarea onchange="window.updateQuoteGlobal('customerAddress', this.value)" 
                        class="glass-input glass-dimmed-input" style="width: 100%; height: 65px; resize: none; padding: 0.55rem 0.75rem;" 
                        placeholder="Customer Address">${createQuoteState.customerAddress}</textarea>
                </div>
            </div>

            <!-- Quote Details -->
            <div class="glass-panel glass-form-card" style="padding: 1.5rem; border-radius: var(--radius-lg); color: var(--color-text-main);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                    <h4 style="margin: 0; color: var(--color-text-heading); font-size: 1.05rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="calendar" style="color: var(--color-primary); width: 18px; height: 18px;"></i> Quotation Details & Numbering
                    </h4>
                    <span style="font-size: 0.75rem; color: var(--color-primary-light); background: rgba(56, 189, 248, 0.12); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">
                        Prefix: ${store.state.settings?.quotationDefaults?.prefix || 'Q-'}
                    </span>
                </div>

                <!-- Quotation Number & Title Inline Override -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); font-weight: 600; margin-bottom: 0.4rem;">
                            Quotation Number * <span style="font-size: 0.75rem; color: var(--color-primary-light);">(Editable Override)</span>
                        </label>
                        <input type="text" id="quote-number-input" value="${createQuoteState.id || ''}" 
                            onchange="window.updateQuoteGlobal('id', this.value)" 
                            class="glass-input glass-dimmed-input" 
                            style="width: 100%; padding: 0.55rem 0.75rem; font-weight: 700; color: var(--color-primary-light); font-family: monospace;" 
                            placeholder="e.g. Q-2026-001">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); font-weight: 600; margin-bottom: 0.4rem;">
                            Quotation Title * <span style="font-size: 0.75rem; color: var(--color-primary-light);">(Editable Override)</span>
                        </label>
                        <input type="text" id="quote-title-input" value="${createQuoteState.title || 'Quotation / Estimate'}" 
                            onchange="window.updateQuoteGlobal('title', this.value)" 
                            class="glass-input glass-dimmed-input" 
                            style="width: 100%; padding: 0.55rem 0.75rem; font-weight: 600;" 
                            placeholder="e.g. Quotation / Estimate">
                    </div>
                </div>

                 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); font-weight: 500; margin-bottom: 0.4rem;">Date *</label>
                        <input type="date" value="${createQuoteState.date}" onchange="window.updateQuoteGlobal('date', this.value)" class="glass-input glass-dimmed-input" style="width: 100%; padding: 0.55rem 0.75rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); font-weight: 500; margin-bottom: 0.4rem;">Valid Until</label>
                        <input type="date" value="${createQuoteState.dueDate}" onchange="window.updateQuoteGlobal('dueDate', this.value)" class="glass-input glass-dimmed-input" style="width: 100%; padding: 0.55rem 0.75rem;">
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                     <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); font-weight: 500; margin-bottom: 0.4rem;">Reference No.</label>
                     <input type="text" value="${createQuoteState.refNo}" onchange="window.updateQuoteGlobal('refNo', this.value)" 
                        class="glass-input glass-dimmed-input" style="width: 100%; padding: 0.55rem 0.75rem;" placeholder="e.g. REF-1001">
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="glass-panel glass-form-card" style="padding: 0; overflow: hidden; margin-bottom: 2rem; border-radius: var(--radius-lg); color: var(--color-text-main);">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.5px;">
                    <tr>
                        <th style="padding: 1rem; width: 50px;">#</th>
                        <th style="padding: 1rem;">Product / Description</th>
                        <th style="padding: 1rem; width: 100px; text-align: center;">Qty</th>
                        <th style="padding: 1rem; width: 120px; text-align: right;">Price</th>
                        <th style="padding: 1rem; width: 120px; text-align: right;">Total</th>
                        <th style="padding: 1rem; width: 50px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${createQuoteState.items.map((item, index) => `
                        <tr style="border-bottom: 1px solid var(--glass-border); vertical-align: middle;">
                            <td style="padding: 1rem; color: var(--color-text-muted);">${index + 1}</td>
                            <td style="padding: 1rem;">
                                <input type="text" value="${item.name}" onchange="window.updateQuoteItem(${index}, 'name', this.value)" placeholder="New Item Name" 
                                    class="glass-input" style="width: 100%; background: transparent; border: none; padding: 0.2rem; color: var(--color-text-heading); font-weight: 600;">
                                <input type="text" value="${item.description}" onchange="window.updateQuoteItem(${index}, 'description', this.value)" placeholder="Description (Optional)" 
                                    class="glass-input" style="width: 100%; background: transparent; border: none; padding: 0.2rem; font-size: 0.85rem; color: var(--color-text-muted);">
                            </td>
                            <td style="padding: 1rem;">
                                <input type="number" value="${item.qty}" min="1" onchange="window.updateQuoteItem(${index}, 'qty', this.value)" 
                                    class="glass-input glass-dimmed-input" style="width: 100%; padding: 6px; text-align: center;">
                            </td>
                            <td style="padding: 1rem;">
                                <input type="number" value="${item.price}" min="0" onchange="window.updateQuoteItem(${index}, 'price', this.value)" 
                                    class="glass-input glass-dimmed-input" style="width: 100%; padding: 6px; text-align: right;">
                            </td>

                            <td style="padding: 1rem; text-align: right; font-weight: 700; color: var(--color-text-heading);">
                                ₹${item.total.toFixed(2)}
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <button onclick="window.removeQuoteItem(${index})" style="background: none; border: none; color: #ff5c6a; cursor: pointer; padding: 4px;" title="Remove row">
                                    <i data-lucide="trash-2" style="width: 16px;"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
             <div style="padding: 1rem;">
                <button class="btn btn-primary" onclick="window.addQuoteItem()">
                    <i data-lucide="plus"></i> Add Product
                </button>
            </div>
        </div>

        <!-- Footer Totals & Advance Balance Calculation -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 2rem;">
            <div class="glass-panel glass-form-card" style="width: 400px; padding: 1.5rem; border-radius: var(--radius-lg); color: var(--color-text-main);">
                <div style="display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid var(--glass-border);">
                    <span style="color: var(--color-text-muted);">Total Taxable</span>
                    <span style="color: var(--color-text-heading); font-weight: 600;">₹${totalTaxable.toFixed(2)}</span>
                </div>
                 <div style="display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid var(--glass-border);">
                    <span style="color: var(--color-text-muted);">Total Tax</span>
                    <span style="color: var(--color-text-heading); font-weight: 600;">₹${totalTax.toFixed(2)}</span>
                </div>
                 <div style="display: flex; justify-content: space-between; padding: 0.6rem 0; align-items: center; border-bottom: 1px solid var(--glass-border);">
                    <span style="color: var(--color-text-muted);">Global Discount (%)</span>
                    <input type="number" value="${createQuoteState.discountValue}" onchange="window.updateQuoteGlobal('discountValue', this.value)" 
                        class="glass-input glass-dimmed-input" style="width: 75px; padding: 5px; text-align: center;">
                </div>
                 <div style="display: flex; justify-content: space-between; padding: 0.6rem 0; align-items: center; border-bottom: 1px solid var(--glass-border);">
                    <span style="color: var(--color-text-muted);">Transport Charges</span>
                    <input type="number" value="${createQuoteState.transport}" onchange="window.updateQuoteGlobal('transport', this.value)" 
                        class="glass-input glass-dimmed-input" style="width: 95px; padding: 5px; text-align: right;">
                </div>
                 <div style="display: flex; justify-content: space-between; padding: 0.6rem 0; align-items: center; border-bottom: 1px solid var(--glass-border);">
                    <span style="color: var(--color-text-muted);">Labour Charges</span>
                    <input type="number" value="${createQuoteState.labour}" onchange="window.updateQuoteGlobal('labour', this.value)" 
                        class="glass-input glass-dimmed-input" style="width: 95px; padding: 5px; text-align: right;">
                </div>
                 <div style="display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid var(--glass-border);">
                     <div style="display: flex; align-items: center; gap: 0.5rem;">
                         <input type="checkbox" id="roundOff" ${createQuoteState.roundOff ? 'checked' : ''} onchange="window.updateQuoteGlobal('roundOff', this.checked)">
                        <label for="roundOff" style="color: var(--color-text-muted); font-size: 0.88rem; cursor: pointer;">Round Off</label>
                     </div>
                     <span style="color: var(--color-text-heading);">${(grandTotal % 1).toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.85rem 1rem; font-size: 1.25rem; font-weight: 700; background: var(--color-primary-subtle); border: 1px solid var(--color-primary-border); border-radius: 8px; margin: 0.75rem 0; color: var(--color-primary);">
                    <span>Grand Total</span>
                    <span style="font-weight: 800; font-size: 1.35rem;">₹${grandTotal.toLocaleString()}</span>
                </div>

                <!-- Advance Payment Input with Auto-Apply Indicator -->
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0 0.25rem; align-items: center;">
                    <span style="font-weight: 600; color: var(--color-text-heading); font-size: 0.9rem;">Advance Payment</span>
                    <input type="number" min="0" value="${createQuoteState.advancePayment || ''}" 
                        onchange="window.updateQuoteGlobal('advancePayment', this.value)" 
                        placeholder="0"
                        class="glass-input glass-dimmed-input"
                        style="width: 120px; padding: 6px 10px; text-align: right; font-weight: 700; font-size: 0.95rem;">
                </div>

                <!-- Green Available Advance Indicator -->
                ${availableAdvance > 0 ? `
                    <div style="padding: 0.25rem 0 0.5rem; text-align: right;">
                        <span onclick="window.applyQuoteAdvance(${availableAdvance})" 
                              style="color: #10b981; font-weight: 600; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 3px 8px; border-radius: 4px; transition: all 0.2s;"
                              title="Click to auto-apply customer advance balance">
                            <i data-lucide="sparkles" style="width: 13px; height: 13px;"></i>
                            Available Advance: ₹${availableAdvance.toLocaleString()} (Click to auto-apply)
                        </span>
                    </div>
                ` : ''}

                <!-- Balance Due Row -->
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; font-size: 1.15rem; font-weight: 700; border-radius: 8px; background: ${balanceDue > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)'}; border: 1px solid ${balanceDue > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; margin-top: 0.6rem;">
                    <span style="color: ${balanceDue > 0 ? '#d97706' : '#059669'};">Balance Due</span>
                    <span style="color: ${balanceDue > 0 ? '#d97706' : '#059669'}; font-weight: 800; font-size: 1.2rem;">₹${balanceDue.toLocaleString()}</span>
                </div>

                 <div style="font-size: 0.8rem; color: var(--color-text-muted); text-align: right; font-style: italic; margin-top: 0.5rem;">
                    ${numberToWords(grandTotal)} Rupees Only
                </div>
            </div>
        </div>

        <!-- Global Terms / Description Management with Inline Customization -->
        <div class="glass-panel glass-form-card" style="padding: 1.5rem; margin-bottom: 2rem; border-radius: var(--radius-lg); color: var(--color-text-main);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <div>
                    <h4 style="margin: 0; color: var(--color-text-heading); font-size: 1.05rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="file-text" style="color: var(--color-primary); width: 18px; height: 18px;"></i> Terms & Conditions / Description
                    </h4>
                    <span style="font-size: 0.8rem; color: var(--color-text-muted);">Pre-populated from Settings -> Quotations. Edit, append or remove bullet points below.</span>
                </div>
                <button type="button" class="btn btn-secondary" onclick="window.addQuoteTermRow()" style="padding: 0.35rem 0.85rem; font-size: 0.82rem; display: flex; align-items: center; gap: 5px;">
                    <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add Row
                </button>
            </div>
            <div id="quote-terms-list" style="display: flex; flex-direction: column; gap: 0.6rem;">
                ${(createQuoteState.termsRows || []).map((term, tIdx) => {
                    const cleanTerm = term.replace(/^(\d+[\.\)]\s*)/, '');
                    return `
                        <div style="display: flex; gap: 0.6rem; align-items: center;">
                            <span style="width: 26px; text-align: center; font-size: 0.88rem; font-weight: 700; color: var(--color-primary);">${tIdx + 1}.</span>
                            <input type="text" class="glass-input glass-dimmed-input" style="flex: 1; padding: 0.55rem 0.85rem; font-size: 0.88rem;" value="${cleanTerm.replace(/"/g, '&quot;')}" onchange="window.updateQuoteTermRow(${tIdx}, this.value)" placeholder="Enter condition or term specification">
                            <button type="button" onclick="window.removeQuoteTermRow(${tIdx})" style="color: #ef4444; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 6px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;" title="Delete row">
                                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- Print Document Options Section (Feature 1) -->
        <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 3rem; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-lg); color: var(--color-text-main);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4 style="margin: 0; font-size: 1.05rem; display: flex; align-items: center; gap: 0.6rem; color: var(--color-primary); font-weight: 600;">
                    <i data-lucide="printer" style="width: 18px; height: 18px;"></i> Print Document Options
                </h4>
                <span style="font-size: 0.8rem; color: #94a3b8;">Controls header & bank details appearance in printed quotation</span>
            </div>
            <div style="display: flex; gap: 2.5rem; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 0.65rem; cursor: pointer; font-size: 0.95rem; font-weight: 500; color: #f8fafc;">
                    <input type="checkbox" id="quote-show-logo" 
                           ${createQuoteState.printOptions.showLogoHeader ? 'checked' : ''} 
                           onchange="window.updateQuotePrintOption('showLogoHeader', this.checked)"
                           style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--color-primary);">
                    <span>Show Company Logo/Header</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.65rem; cursor: pointer; font-size: 0.95rem; font-weight: 500; color: #f8fafc;">
                    <input type="checkbox" id="quote-show-bank" 
                           ${createQuoteState.printOptions.showBankDetails ? 'checked' : ''} 
                           onchange="window.updateQuotePrintOption('showBankDetails', this.checked)"
                           style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--color-primary);">
                    <span>Show Bank Details</span>
                </label>
            </div>
        </div>
    `;

    setTimeout(() => { 
        if (window.lucide) window.lucide.createIcons(); 
        if (window.UniversalCustomerSearch) {
            window.UniversalCustomerSearch.register('quote-customer-search', {
                onSelect: (cust) => {
                    window.selectQuoteCustomer(cust);
                },
                onClear: () => {
                    createQuoteState.customer = '';
                    createQuoteState.customerId = '';
                    createQuoteState.customerAddress = '';
                    createQuoteState.advancePayment = 0;
                    renderCreateView();
                }
            });
        }
    }, 0);
    return container;
}


// --- LIST VIEW ---

export function renderQuotations(state) {
    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    container.innerHTML = `
         <div style="padding: 2rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="margin: 0; font-size: 2rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i data-lucide="file-text" style="color: var(--color-primary);"></i> Quotations
                </h1>
                <p style="color: var(--color-text-muted); margin-top: 0.5rem;">Manage and print client quotations.</p>
            </div>
             <button class="btn btn-primary" onclick="window.initCreateQuotation()">
                <i data-lucide="plus"></i> Create Quotation
            </button>
        </div>

         <div style="flex: 1; padding: 2rem; overflow-y: auto;">
             <div class="glass-panel" style="overflow: hidden; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-lg); color: var(--color-text-main); box-shadow: 0 8px 32px rgba(0,0,0,0.36);">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: rgba(255, 255, 255, 0.04); border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.5px;">
                        <tr>
                            <th style="padding: 1rem; text-align: left;">Quote ID</th>
                            <th style="padding: 1rem; text-align: left;">Customer</th>
                            <th style="padding: 1rem; text-align: center;">Date</th>
                            <th style="padding: 1rem; text-align: center;">Validity</th>
                            <th style="padding: 1rem; text-align: right;">Amount</th>
                            <th style="padding: 1rem; text-align: center;">Status</th>
                            <th style="padding: 1rem; text-align: center;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.quotations && state.quotations.length > 0 ? state.quotations.map(q => `
                            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.06); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 1rem; font-weight: 600; color: #818cf8; font-family: monospace;">${q.id}</td>
                                <td style="padding: 1rem; color: #f8fafc; font-weight: 600;">
                                    ${q.customer}
                                </td>
                                <td style="padding: 1rem; text-align: center; color: #94a3b8;">${q.date}</td>
                                <td style="padding: 1rem; text-align: center; color: #94a3b8;">${q.validity || q.dueDate || '-'}</td>
                                <td style="padding: 1rem; text-align: right; font-weight: 700; color: #34d399;">₹ ${Number(q.amount).toLocaleString()}</td>
                                <td style="padding: 1rem; text-align: center;">
                                    <span style="padding: 4px 12px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; background: ${q.status === 'Sent' ? 'rgba(56, 189, 248, 0.15)' : q.status === 'Approved' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)'}; color: ${q.status === 'Sent' ? '#38bdf8' : q.status === 'Approved' ? '#4ade80' : '#cbd5e1'}; border: 1px solid ${q.status === 'Sent' ? 'rgba(56, 189, 248, 0.3)' : q.status === 'Approved' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.15)'};">
                                        ${q.status}
                                    </span>
                                </td>
                                <td style="padding: 1rem; text-align: center; white-space: nowrap;">
                                    <button class="btn btn-secondary" onclick="window.openPrintQuotationModalById('${q.id}')" style="padding: 0.4rem 0.75rem; margin-right: 0.35rem;" title="Print Quotation">
                                        <i data-lucide="printer" style="width: 15px;"></i>
                                    </button>
                                    <button class="btn btn-secondary quote-more-btn" onclick="window.toggleQuoteActionMenu('${q.id}', event)" style="padding: 0.4rem 0.6rem; color: #cbd5e1; border-color: rgba(255,255,255,0.2);" title="More Actions">
                                        <i data-lucide="more-vertical" style="width: 15px;"></i>
                                    </button>
                                </td>

                            </tr>
                        `).join('') : `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color: #94a3b8;">No quotations found. Create one!</td></tr>`}
                    </tbody>
                </table>
            </div>
         </div>
    `;

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
    return container;
}

// --- CUSTOMER DIRECTORY MODAL FOR QUOTATIONS ---
window.openQuoteCustomerModal = () => {
    let existing = document.getElementById('quote-customer-modal');
    if (existing) existing.remove();

    const store = window.Store || Store;
    const customers = store.state.customers || [];

    const modal = document.createElement('div');
    modal.id = 'quote-customer-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        display: flex; align-items: center; justify-content: center; z-index: 100010;
        padding: 1.5rem;
    `;

    const renderRows = (filter = '') => {
        const query = filter.toLowerCase().trim();
        const filtered = customers.filter(c => 
            !query || 
            (c.name && c.name.toLowerCase().includes(query)) ||
            (c.id && c.id.toLowerCase().includes(query)) ||
            (c.mobile && c.mobile.includes(query)) ||
            (c.district && c.district.toLowerCase().includes(query)) ||
            (c.address && c.address.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
            return `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #94a3b8;">No matching customers found.</td></tr>`;
        }

        return filtered.map(c => `
            <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.15s ease;" 
                onmouseover="this.style.background='var(--color-bg-surface-glass)'" 
                onmouseout="this.style.background='transparent'">
                <td style="padding: 0.85rem 1rem;">
                    <div style="font-weight: 600; color: var(--color-text-heading); font-size: 0.95rem;">${c.name}</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); font-family: monospace;">ID: ${c.id}</div>
                </td>
                <td style="padding: 0.85rem 1rem; color: var(--color-text-main); font-size: 0.85rem;">
                    <div>${c.mobile || '-'}</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted);">${c.email || ''}</div>
                </td>
                <td style="padding: 0.85rem 1rem; color: var(--color-text-muted); font-size: 0.85rem;">
                    ${c.district ? `${c.district}, ${c.state || ''}` : (c.address || '-')}
                </td>
                <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 700; color: #10b981; font-size: 0.92rem;">
                    ₹ ${(c.advanceBalance || 0).toLocaleString()}
                </td>
                <td style="padding: 0.85rem 1rem; text-align: center;">
                    <button type="button" class="btn btn-primary" onclick="window.selectCustomerFromModal('${c.id}')" style="padding: 0.38rem 0.85rem; font-size: 0.8rem; font-weight: 600;">
                        Select
                    </button>
                </td>
            </tr>
        `).join('');
    };

    modal.innerHTML = `
        <div class="glass-panel quote-directory-modal-card" style="width: 780px; max-width: 95vw; max-height: 85vh; border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-xl); display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(99, 102, 241, 0.16); border: 1px solid rgba(99, 102, 241, 0.35); display: flex; align-items: center; justify-content: center; color: #818cf8;">
                        <i data-lucide="users" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.25rem; color: var(--color-text-heading); font-weight: 700;">Customer Directory</h3>
                        <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--color-text-muted);">Select customer to populate Quotation details & available advance balance</p>
                    </div>
                </div>
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('quote-customer-modal').remove()" style="padding: 0.4rem 0.75rem;">
                    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                </button>
            </div>

            <div style="margin-bottom: 1rem; position: relative;">
                <input type="text" id="quote-modal-cust-search" placeholder="Search by customer name, ID, phone or location..." 
                    class="glass-input" 
                    style="width: 100%; border-radius: 8px; padding: 0.65rem 1rem 0.65rem 2.5rem; font-size: 0.9rem;">
                <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--color-text-muted);"></i>
            </div>

            <div style="flex: 1; overflow-y: auto; border: 1px solid var(--glass-border); border-radius: 8px; background: var(--color-bg-surface-glass);">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: var(--color-bg-surface); border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; position: sticky; top: 0; z-index: 5;">
                        <tr>
                            <th style="padding: 0.75rem 1rem; text-align: left;">Customer</th>
                            <th style="padding: 0.75rem 1rem; text-align: left;">Contact</th>
                            <th style="padding: 0.75rem 1rem; text-align: left;">Location</th>
                            <th style="padding: 0.75rem 1rem; text-align: right;">Advance Balance</th>
                            <th style="padding: 0.75rem 1rem; text-align: center;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="quote-modal-cust-tbody">
                        ${renderRows()}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const searchInput = document.getElementById('quote-modal-cust-search');
    const tbody = document.getElementById('quote-modal-cust-tbody');
    if (searchInput && tbody) {
        searchInput.addEventListener('input', (e) => {
            tbody.innerHTML = renderRows(e.target.value);
            if (window.lucide) window.lucide.createIcons();
        });
        searchInput.focus();
    }

    if (window.lucide) window.lucide.createIcons();
};

window.selectCustomerFromModal = (customerId) => {
    const modal = document.getElementById('quote-customer-modal');
    if (modal) modal.remove();
    window.selectQuoteCustomer(customerId);
};

window.openPrintQuotationModalById = (id) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === id);
    if (!quote) return alert('Quotation not found!');
    window.openPrintQuotationModal(quote);
};

function renderCustomerAddressHierarchy(quote) {
    const store = window.Store || Store;
    const custObj = (store.state.customers || []).find(c => c.name === quote.customer || c.id === quote.customerId) || {};
    
    // Line 1: Customer Name
    const name = quote.customer || custObj.name || 'Valued Customer';
    
    // Line 2: Address / Building
    const building = custObj.building || custObj.addressLine1 || (custObj.address && !custObj.address.includes(custObj.city || '___') ? custObj.address : '') || (quote.customerAddress ? quote.customerAddress.split(',')[0].trim() : '') || 'Site Address / Building';
    
    // Line 3: Place / City
    const place = custObj.place || custObj.area || (quote.customerAddress ? (quote.customerAddress.split(',')[1] || '').trim() : '') || '';
    const city = custObj.city || (quote.customerAddress ? (quote.customerAddress.split(',')[2] || quote.customerAddress.split(',')[1] || '').trim() : '') || 'Kochi, Kerala';
    const placeCity = [place, city].filter(Boolean).join(', ') || city;

    // Line 4: Postal PIN Code
    const pin = custObj.pincode || custObj.pin || quote.customerPin || (quote.customerAddress ? (quote.customerAddress.match(/\b\d{6}\b/) || [''])[0] : '') || '682030';
    
    // Line 5: Mobile Number
    const phone = quote.customerPhone || custObj.mobile || custObj.phone || '+91 9846123456';

    return `
        <div class="print-customer-card" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 1.15rem 1.35rem; margin-bottom: 1.5rem; text-align: left;">
            <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; color: #64748b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                <span>Quotation To / Customer Details</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.92rem; color: #1e293b; line-height: 1.4;">
                <div style="font-size: 1.22rem; font-weight: 800; color: #0f172a; margin-bottom: 2px;">${name}</div>
                <div style="color: #334155; font-weight: 500;">${building}</div>
                <div style="color: #475569;">📍 ${placeCity}</div>
                <div style="color: #475569;">📮 PIN Code: <strong style="color: #1e293b;">${pin}</strong></div>
                <div style="color: #0284c7; font-weight: 600;">📞 Mobile: <strong style="color: #0369a1;">${phone}</strong></div>
            </div>
        </div>
    `;
}
window.renderCustomerAddressHierarchy = renderCustomerAddressHierarchy;

async function ensureImagesLoaded(container) {
    if (!container) return;

    // 1. Pre-rasterize all inline SVG drawings to high-res PNGs so html2canvas renders them with 100% fidelity
    const svgs = Array.from(container.querySelectorAll('svg'));
    for (const svg of svgs) {
        try {
            const parent = svg.parentElement;
            const bbox = svg.getBoundingClientRect ? svg.getBoundingClientRect() : null;
            let w = (bbox && bbox.width > 20) ? Math.round(bbox.width) : (svg.clientWidth || (parent ? parent.clientWidth : 0));
            let h = (bbox && bbox.height > 20) ? Math.round(bbox.height) : (svg.clientHeight || (parent ? parent.clientHeight : 0));
            if (!w || w <= 0) w = parseInt(svg.getAttribute('width')) || 130;
            if (!h || h <= 0) h = parseInt(svg.getAttribute('height')) || 95;

            // 2x scale for sharp print quality
            const scale = 2;
            const targetW = w * scale;
            const targetH = h * scale;

            // Ensure XML namespaces and explicit viewBox/dimensions
            const clone = svg.cloneNode(true);
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            if (!clone.getAttribute('viewBox')) {
                clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
            }
            clone.setAttribute('width', targetW);
            clone.setAttribute('height', targetH);

            const xml = new XMLSerializer().serializeToString(clone);
            const svgDataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            const loadPromise = new Promise(resolve => {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                setTimeout(() => resolve(false), 1200);
            });
            img.src = svgDataUri;
            await loadPromise;

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetW, targetH);
            ctx.drawImage(img, 0, 0, targetW, targetH);

            const pngDataUri = canvas.toDataURL('image/png');
            const newImg = document.createElement('img');
            newImg.src = pngDataUri;
            newImg.alt = svg.getAttribute('aria-label') || '2D CAD Drawing';
            newImg.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain; display: block; margin: 0 auto; image-rendering: -webkit-optimize-contrast;';
            if (svg.parentNode) {
                svg.parentNode.replaceChild(newImg, svg);
            }
        } catch (err) {
            console.warn('SVG pre-rasterization warning:', err);
        }
    }

    // 2. Ensure all images (logos, stamps, attachments, and newly rasterized SVGs) are fully loaded
    const images = Array.from(container.querySelectorAll('img'));
    if (images.length === 0) return;
    await Promise.all(images.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 2500);
        });
    }));
}
window.ensureImagesLoaded = ensureImagesLoaded;

// --- PRINT TEMPLATE MODAL (Screenshot 4 GoGSTBill / STYLO STEEL Layout) ---

window.switchDocumentCopyBadge = (copyType) => {
    const badge = document.getElementById('print-doc-copy-badge');
    if (!badge) return;
    const labels = {
        'ORIGINAL': 'ORIGINAL FOR RECIPIENT',
        'DUPLICATE': 'DUPLICATE FOR TRANSPORTER',
        'TRANSPORT': 'TRIPLICATE FOR SUPPLIER',
        'OFFICE': 'OFFICE COPY'
    };
    badge.textContent = labels[copyType] || 'ORIGINAL FOR RECIPIENT';
};

window.openDocumentInNewTab = async (quoteId) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId) || { id: quoteId };
    const safeCust = (quote.customer || 'Customer').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `Invoice_${quote.id}_${safeCust}.pdf`;
    
    // If we have an uploaded URL or can generate one
    if (window._activePdfUrl) {
        window.open(window._activePdfUrl, '_blank');
        return;
    }
    
    try {
        if (window.showStudioToast) window.showStudioToast('Opening document in new tab...');
        if (window.generateQuotePdfBlob) {
            const blob = await window.generateQuotePdfBlob(quote);
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } else {
            const printWin = window.open('', '_blank');
            printWin.document.write(`
                <!DOCTYPE html>
                <html><head><title>Document ${quote.id}</title>
                <link rel="stylesheet" href="css/style.css">
                <style>body { background: white; margin: 20px; }</style>
                </head><body>
                ${window.renderPrintableQuotationHTML(quote)}
                </body></html>
            `);
            printWin.document.close();
        }
    } catch (err) {
        console.error('Error opening document in new tab:', err);
        window.print();
    }
};

window.copyDocumentLink = async (quoteId, btn) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId) || { id: quoteId };
    const safeCust = (quote.customer || 'Customer').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `Invoice_${quote.id}_${safeCust}.pdf`;
    const docUrl = window._activePdfUrl || `${window.location.origin}/uploads/quotations/${filename}`;
    
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(docUrl);
        } else {
            const ta = document.createElement('textarea');
            ta.value = docUrl;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        }
        if (window.showStudioToast) window.showStudioToast('Document link copied to clipboard!');
        if (btn) {
            const origHtml = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i> Copied!`;
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = origHtml;
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        }
    } catch (err) {
        console.error('Failed to copy document link:', err);
    }
};

window.shareDocViaEmail = (quoteId) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId) || { id: quoteId };
    const custName = quote.customer || 'Valued Customer';
    const amount = Number(quote.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const date = window.formatDocDate ? window.formatDocDate(quote.date) : (quote.date || 'Today');
    const safeCust = custName.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `Invoice_${quote.id}_${safeCust}.pdf`;
    const docUrl = window._activePdfUrl || `${window.location.origin}/uploads/quotations/${filename}`;

    const subject = encodeURIComponent(`Tax Invoice / Quotation #${quote.id} - STYLO STEEL`);
    const body = encodeURIComponent(
`Dear ${custName},

Please view the details of the transaction below.

Invoice No: ${quote.id}
Invoice Date: ${date}
Amount: ${amount}

To view Document click
${docUrl}

Sincerely
STYLO STEEL`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

window.shareDocViaSMS = (quoteId) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId) || { id: quoteId };
    const cleanPhone = (quote.customerPhone || '').replace(/\D/g, '');
    const amount = Number(quote.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const date = window.formatDocDate ? window.formatDocDate(quote.date) : (quote.date || 'Today');
    const safeCust = (quote.customer || 'Customer').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `Invoice_${quote.id}_${safeCust}.pdf`;
    const docUrl = window._activePdfUrl || `${window.location.origin}/uploads/quotations/${filename}`;

    const text = encodeURIComponent(`Invoice No: ${quote.id}, Date: ${date}, Amount: ₹${amount}. View: ${docUrl} - STYLO STEEL`);
    window.location.href = `sms:${cleanPhone}?body=${text}`;
};

window.openPrintQuotationModal = (quote) => {
    if (!quote) return;
    let existing = document.getElementById('quote-print-modal');
    if (existing) existing.remove();

    const store = window.Store || Store;
    const safeCust = (quote.customer || 'Customer').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `Invoice_${quote.id}_${safeCust}.pdf`;
    window._activePdfUrl = `${window.location.origin}/uploads/quotations/${filename}`;

    const modal = document.createElement('div');
    modal.className = 'gogst-modal-backdrop animate-fade-in';
    modal.id = 'quote-print-modal';

    modal.innerHTML = `
        <div class="gogst-print-dialog">
            <!-- Header Toolbar (Screenshot 4) -->
            <div class="gogst-dialog-header">
                <h3 class="gogst-dialog-title">
                    Print / View Document
                </h3>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="gogst-top-btn" onclick="window.openDocumentInNewTab('${quote.id}')" title="Open document in new browser tab">
                        <i data-lucide="external-link" style="width: 14px; height: 14px;"></i> New Tab
                    </button>
                    <button type="button" class="gogst-top-btn" id="btn-copy-doc-link-top" onclick="window.copyDocumentLink('${quote.id}', this)" title="Copy direct document URL">
                        <i data-lucide="copy" style="width: 14px; height: 14px;"></i> Copy Link
                    </button>
                    <button type="button" class="gogst-close-btn" onclick="document.getElementById('quote-print-modal').remove()" title="Close document preview">✕</button>
                </div>
            </div>

            <!-- Printable Document Body (Screenshot 4) -->
            <div class="gogst-dialog-body">
                ${window.renderPrintableQuotationHTML(quote, 'ORIGINAL')}
            </div>

            <!-- Footer Toolbar with Copy Type Selectors & Action Buttons (Screenshot 4) -->
            <div class="gogst-dialog-footer">
                <!-- Document Copy Type Selectors -->
                <div class="gogst-copy-selectors">
                    <label class="gogst-copy-checkbox-label">
                        <input type="radio" name="gogst-doc-copy-type" value="ORIGINAL" checked onchange="window.switchDocumentCopyBadge(this.value)">
                        Original
                    </label>
                    <label class="gogst-copy-checkbox-label">
                        <input type="radio" name="gogst-doc-copy-type" value="DUPLICATE" onchange="window.switchDocumentCopyBadge(this.value)">
                        Duplicate
                    </label>
                    <label class="gogst-copy-checkbox-label">
                        <input type="radio" name="gogst-doc-copy-type" value="TRANSPORT" onchange="window.switchDocumentCopyBadge(this.value)">
                        Transport
                    </label>
                    <label class="gogst-copy-checkbox-label">
                        <input type="radio" name="gogst-doc-copy-type" value="OFFICE" onchange="window.switchDocumentCopyBadge(this.value)">
                        Office
                    </label>
                </div>

                <!-- Footer Action Buttons (Screenshot 4) -->
                <div class="gogst-footer-actions">
                    <button type="button" class="gogst-btn-close" onclick="document.getElementById('quote-print-modal').remove()">
                        <i data-lucide="x" style="width: 15px; height: 15px;"></i> Close
                    </button>
                    <button type="button" class="gogst-btn-whatsapp" onclick="window.openShareOnWhatsAppModal('${quote.id}')" title="Share via WhatsApp">
                        <i data-lucide="message-circle" style="width: 16px; height: 16px;"></i> Whatsapp
                    </button>
                    <button type="button" class="gogst-btn-email" onclick="window.shareDocViaEmail('${quote.id}')" title="Share via Email">
                        <i data-lucide="mail" style="width: 15px; height: 15px;"></i> Email
                    </button>
                    <button type="button" class="gogst-btn-sms" onclick="window.shareDocViaSMS('${quote.id}')" title="Share via SMS">
                        <i data-lucide="message-square" style="width: 15px; height: 15px;"></i> SMS
                    </button>
                    <button type="button" class="gogst-btn-download" onclick="window.downloadQuotePDFDirect('${quote.id}')" title="Download PDF document">
                        <i data-lucide="download" style="width: 15px; height: 15px;"></i> Download
                    </button>
                    <button type="button" class="gogst-btn-print" onclick="window.print()" title="Print document">
                        <i data-lucide="printer" style="width: 15px; height: 15px;"></i> Print
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
};

window.convertToOrder = (quoteId, customer, amount) => {
    if (confirm(`Convert quotation ${quoteId} to an active Production Order, Invoice, and generate Customer Tracking Portal credentials?`)) {
        const store = window.Store || Store;
        const dateStr = new Date().toISOString().split('T')[0];

        // 1. Change Quote Status
        const quote = (store.state.quotations || []).find(q => q.id === quoteId);
        if (quote) quote.status = 'Approved';

        // 2. Resolve Customer Phone for Portal Credentials
        let custPhone = quote?.phone || quote?.mobile || '';
        if (!custPhone && store.state.customers) {
            const foundCust = store.state.customers.find(c => c.name && c.name.toLowerCase() === (customer || '').toLowerCase());
            if (foundCust) custPhone = foundCust.phone || foundCust.mobile;
        }
        if (!custPhone) custPhone = '9846' + Math.floor(100000 + Math.random() * 900000);
        const cleanPhone = String(custPhone).replace(/[^0-9]/g, '');

        // 3. Create Record in Dedicated Orders Module
        if (!store.state.orders) store.state.orders = [];
        const orderId = 'ORD-' + (7000 + store.state.orders.length + 1);
        const orderItemsText = quote && quote.items ? quote.items.map(i => i.name || i.item || 'Custom Fabricated Unit').join(', ') : 'Order from Quote ' + quoteId;

        const newOrder = {
            id: orderId,
            quoteId: quoteId,
            customer: customer || 'Client',
            customerMobile: cleanPhone,
            customerAddress: quote?.address || 'Kerala, India',
            items: orderItemsText,
            amount: Number(amount) || (quote?.amount || 0),
            advancePayment: quote?.advancePayment || 0,
            balanceDue: (quote?.balanceDue !== undefined) ? quote.balanceDue : (Number(amount) || 0) - (quote?.advancePayment || 0),
            date: dateStr,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            currentMilestone: 'Order Listed',
            milestones: ['Order Listed', 'Drawing', 'Channel Making', 'Fabrication', 'Painting', 'Packing', 'Dispatched', 'Delivered'],
            milestonesHistory: [
                { stage: 'Order Listed', date: new Date().toLocaleString(), by: 'System (Quotation Conversion)' }
            ],
            assignedTechnician: 'Rajeesh Kumar',
            drawingType: 'image',
            drawingUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2531&auto=format&fit=crop',
            portalCredentials: {
                username: customer || 'Client',
                password: cleanPhone,
                active: true,
                generatedAt: new Date().toLocaleString(),
                revokedAt: null
            }
        };
        store.state.orders.unshift(newOrder);

        // 4. Create Synchronized Production Order
        if (!store.state.productionOrders) store.state.productionOrders = [];
        store.state.productionOrders.unshift({
            id: orderId,
            client: customer,
            items: orderItemsText,
            date: dateStr,
            status: 'Order Listed',
            progress: 0,
            drawing: true,
            drawingUrl: newOrder.drawingUrl,
            technician: 'Rajeesh Kumar',
            amount: Number(amount) || 0
        });

        // 5. Create Sales Invoice
        if (!store.state.sales) store.state.sales = [];
        store.state.sales.unshift({
            id: 'INV-' + new Date().getFullYear() + '-' + (1000 + store.state.sales.length + 1),
            orderId: orderId,
            customer: customer,
            date: dateStr,
            amount: Number(amount) || 0,
            paidAmount: quote?.advancePayment || 0,
            balance: quote?.balanceDue !== undefined ? quote.balanceDue : (Number(amount) || 0) - (quote?.advancePayment || 0),
            items: orderItemsText,
            status: (quote?.balanceDue === 0) ? 'Paid' : 'Pending',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            paymentType: quote?.advancePayment ? 'Advance' : 'Credit'
        });

        if (typeof store.saveState === 'function') store.saveState();
        store.notify();

        // 6. Auto-dispatch WhatsApp Notification Modal with Private Portal Link & Credentials
        if (typeof window.dispatchOrderWhatsApp === 'function') {
            window.dispatchOrderWhatsApp(orderId);
        } else {
            alert(`Order ${orderId} instantiated successfully! Credentials: Username: ${customer}, Password: ${cleanPhone}`);
        }
    }
};

window.backToQuotations = () => {
    const store = window.Store || Store;
    if (store) store.navigate('quotations');
};

// =========================================================================
// --- IN-PLACE QUOTATION EDITING SYSTEM ---
// Allows live editing of customer details, dates, items, quantities, rates,
// model names, and dimensions right from the quotation view or list!
// =========================================================================

window._editingQuote = null;

window.openEditQuotationModal = (quoteId, focusItemIndex = null) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId);
    if (!quote) return alert('Quotation not found: ' + quoteId);

    // Deep clone quote state for editing
    window._editingQuote = JSON.parse(JSON.stringify(quote));
    const eq = window._editingQuote;
    eq._originalId = quote.id;
    if (!eq.termsRows || eq.termsRows.length === 0) {
        eq.termsRows = quote.termsRows ? [...quote.termsRows] : (store.state.settings?.quotationDefaults?.termsRows ? [...store.state.settings.quotationDefaults.termsRows] : [
            '1. Rates are valid for 15 days from the date of quotation.',
            '2. 50% advance along with confirmed work order.',
            '3. Delivery within 10-14 working days after advance and dimension approval.',
            '4. Transport & installation extra as per actual site conditions.'
        ]);
    }

    // Ensure items format is uniform
    if (!eq.items) eq.items = [];
    eq.items.forEach((it, idx) => {
        it.name = formatQuoteItemTitle(it, idx);
        it.desc = it.desc || it.description || '';
        it.qty = Number(it.pieces || it.qty || 1);
        it.rate = Number(it.rate || it.price || 0);
        it.discount = Number(it.discount || 0);
        it.tax = Number(it.tax || 0);
        it.total = Number(it.total || (it.qty * it.rate));
    });

    eq.advancePayment = Number(eq.advancePayment || 0);
    eq.amount = Number(eq.amount || 0);
    eq.balanceDue = Number(eq.balanceDue !== undefined ? eq.balanceDue : (eq.amount - eq.advancePayment));

    // Remove existing edit modal if open
    const existing = document.getElementById('edit-quotation-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'edit-quotation-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(3, 7, 18, 0.88);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        display: flex; align-items: center; justify-content: center; z-index: 100020;
        padding: 1.25rem; font-family: 'Inter', sans-serif;
    `;

    modal.innerHTML = `
        <div style="background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; width: 100%; max-width: 960px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.85); color: #f8fafc;">
            
            <!-- Modal Header -->
            <div style="padding: 1.25rem 1.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, 0.7);">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(2, 132, 199, 0.2); border: 1px solid #0284c7; display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                        <i data-lucide="edit-3" style="width: 22px; height: 22px;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #f8fafc;">Edit Quotation ${eq.id}</h2>
                        <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #94a3b8;">Modify client details, item dimensions, quantities, or prices directly</p>
                    </div>
                </div>
                <button type="button" onclick="window.closeEditQuotationModal()" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 1.4rem; padding: 4px 8px; border-radius: 6px; line-height: 1;" onmouseover="this.style.color='#f8fafc'; this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='#94a3b8'; this.style.background='transparent'">✕</button>
            </div>

            <!-- Modal Scrollable Content -->
            <div style="flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
                
                <!-- Client & Meta Information Box -->
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 1.25rem;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.85rem; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="user" style="width: 14px; height: 14px;"></i> Client & Quotation Meta
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; font-weight: 600;">Quotation Number</label>
                            <input type="text" id="edit-q-id" value="${eq.id || ''}" oninput="window.updateEditQuoteMeta('id', this.value)" style="width: 100%; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #38bdf8; font-weight: 700; font-family: monospace; font-size: 0.88rem;" />
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; font-weight: 600;">Quotation Title</label>
                            <input type="text" id="edit-q-title" value="${eq.title || 'Quotation / Estimate'}" oninput="window.updateEditQuoteMeta('title', this.value)" style="width: 100%; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #f8fafc; font-size: 0.88rem;" />
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; font-weight: 500;">Customer Name</label>
                            <input type="text" id="edit-q-customer" value="${eq.customer || ''}" oninput="window.updateEditQuoteMeta('customer', this.value)" style="width: 100%; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #f8fafc; font-size: 0.88rem;" />
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; font-weight: 500;">Phone Number</label>
                            <input type="text" id="edit-q-phone" value="${eq.customerPhone || ''}" oninput="window.updateEditQuoteMeta('customerPhone', this.value)" style="width: 100%; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #f8fafc; font-size: 0.88rem;" />
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; font-weight: 500;">Quote Date</label>
                            <input type="date" id="edit-q-date" value="${eq.date || ''}" oninput="window.updateEditQuoteMeta('date', this.value)" style="width: 100%; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #f8fafc; font-size: 0.88rem;" />
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; font-weight: 500;">Valid Until</label>
                            <input type="text" id="edit-q-duedate" value="${eq.dueDate || eq.validity || '30 Days'}" oninput="window.updateEditQuoteMeta('dueDate', this.value)" style="width: 100%; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #f8fafc; font-size: 0.88rem;" />
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <label style="display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; font-weight: 500;">Customer Address / Location</label>
                            <input type="text" id="edit-q-address" value="${eq.customerAddress || ''}" oninput="window.updateEditQuoteMeta('customerAddress', this.value)" style="width: 100%; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #f8fafc; font-size: 0.88rem;" />
                        </div>
                    </div>
                </div>

                <!-- Quotation Items Box -->
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                        <div style="font-size: 0.8rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="layers" style="width: 14px; height: 14px;"></i> Products / Window Items (${eq.items.length})
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="window.addEditQuoteItem()" style="padding: 0.35rem 0.85rem; font-size: 0.8rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; gap: 5px;">
                            <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add Item
                        </button>
                    </div>

                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
                            <thead>
                                <tr style="background: rgba(255, 255, 255, 0.04); color: #94a3b8; border-bottom: 1px solid rgba(255, 255, 255, 0.1); text-transform: uppercase; font-size: 0.72rem;">
                                    <th style="padding: 8px 6px; text-align: center; width: 30px;">#</th>
                                    <th style="padding: 8px 6px; text-align: center; width: 90px;">2D View</th>
                                    <th style="padding: 8px; text-align: left; min-width: 200px;">Model Name & Dimensions</th>
                                    <th style="padding: 8px; text-align: left; min-width: 160px;">Specs / Desc</th>
                                    <th style="padding: 8px 4px; text-align: center; width: 60px;">Qty</th>
                                    <th style="padding: 8px 4px; text-align: right; width: 95px;">Rate (₹)</th>
                                    <th style="padding: 8px 6px; text-align: right; width: 100px;">Total (₹)</th>
                                    <th style="padding: 8px 4px; text-align: center; width: 75px;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="edit-q-items-tbody">
                                <!-- Rendered dynamically by window.renderEditQuoteItems() -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Terms & Conditions Management Box -->
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                        <div style="font-size: 0.8rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="file-text" style="width: 14px; height: 14px;"></i> Terms & Conditions / Description
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="window.addEditQuoteTermRow()" style="padding: 0.35rem 0.85rem; font-size: 0.8rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; gap: 5px;">
                            <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add Row
                        </button>
                    </div>
                    <div id="edit-q-terms-tbody" style="display: flex; flex-direction: column; gap: 6px;">
                        <!-- Rendered dynamically by window.renderEditQuoteTerms() -->
                    </div>
                </div>

                <!-- Financial Totals & Advance Breakdown -->
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 1.25rem; display: flex; justify-content: flex-end;">
                    <div style="width: 320px; display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem;">
                        <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                            <span>Grand Total Amount:</span>
                            <strong id="edit-q-grand-total" style="color: #38bdf8; font-size: 1.1rem;">₹${Number(eq.amount).toLocaleString()}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; color: #10b981; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
                            <span style="font-weight: 500;">Advance Payment (₹):</span>
                            <input type="number" min="0" id="edit-q-advance" value="${eq.advancePayment}" oninput="window.updateEditQuoteAdvance(this.value)" style="width: 110px; padding: 4px 8px; background: rgba(0,0,0,0.3); border: 1px solid #10b981; border-radius: 6px; color: #10b981; font-weight: 700; text-align: right; font-size: 0.95rem;" />
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #f59e0b; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 8px; font-size: 1rem;">
                            <span style="font-weight: 700;">Balance Due:</span>
                            <strong id="edit-q-balance-due" style="font-weight: 800;">₹${Number(eq.balanceDue).toLocaleString()}</strong>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Modal Footer -->
            <div style="padding: 1.25rem 1.75rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; background: rgba(30, 41, 59, 0.7);">
                <button type="button" class="btn btn-secondary" onclick="window.closeEditQuotationModal()" style="padding: 0.55rem 1.25rem;">
                    Cancel
                </button>
                <button type="button" class="btn btn-primary" onclick="window.saveEditedQuotation()" style="padding: 0.55rem 1.4rem; background: linear-gradient(135deg, #0284c7, #2563eb); border: none; font-weight: 600; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
                    <i data-lucide="check" style="width: 16px; height: 16px;"></i> Save Changes
                </button>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
    window.renderEditQuoteItems();
    window.renderEditQuoteTerms();

    if (focusItemIndex !== null && focusItemIndex !== undefined) {
        setTimeout(() => {
            const input = document.getElementById(`edit-q-item-name-${focusItemIndex}`);
            if (input) {
                input.focus();
                input.select();
            }
        }, 150);
    }

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
};

window.renderEditQuoteItems = () => {
    const tbody = document.getElementById('edit-q-items-tbody');
    if (!tbody || !window._editingQuote) return;
    const eq = window._editingQuote;

    if (eq.items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #94a3b8;">No items in this quotation. Click "+ Add Item" above.</td></tr>`;
        return;
    }

    tbody.innerHTML = eq.items.map((it, idx) => {
        const itemSvg = it.drawingSvg || (typeof window.generateWindowCadSvg === 'function' ? window.generateWindowCadSvg(it, { isThumbnail: true, showDimensions: true, viewW: 130, viewH: 95 }) : '');
        return `
        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.06); vertical-align: middle; transition: background 0.15s ease;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
            <td style="padding: 6px; text-align: center; color: #94a3b8; font-weight: 600;">${idx + 1}</td>
            <td style="padding: 6px; text-align: center;">
                <div style="width: 80px; height: 60px; margin: 0 auto; background: #ffffff; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.15);">
                    ${itemSvg}
                </div>
            </td>
            <td style="padding: 6px;">
                <input type="text" id="edit-q-item-name-${idx}" value="${it.name || ''}" oninput="window.updateEditQuoteItemField(${idx}, 'name', this.value)" placeholder="e.g. Window W1 (50x140 cm)" style="width: 100%; padding: 4px 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #f8fafc; font-size: 0.85rem; font-weight: 600;" />
            </td>
            <td style="padding: 6px;">
                <input type="text" value="${it.desc || ''}" oninput="window.updateEditQuoteItemField(${idx}, 'desc', this.value)" placeholder="e.g. 1 Kalli (50×140 cm) - 4X2.5 Profile" style="width: 100%; padding: 4px 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #cbd5e1; font-size: 0.8rem;" />
            </td>
            <td style="padding: 6px 4px;">
                <input type="number" min="1" value="${it.qty || 1}" oninput="window.updateEditQuoteItemField(${idx}, 'qty', this.value)" style="width: 55px; padding: 4px 2px; text-align: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #f8fafc; font-size: 0.85rem; font-weight: 600;" />
            </td>
            <td style="padding: 6px 4px;">
                <input type="number" min="0" value="${it.rate || 0}" oninput="window.updateEditQuoteItemField(${idx}, 'rate', this.value)" style="width: 90px; padding: 4px 6px; text-align: right; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #f8fafc; font-size: 0.85rem; font-weight: 600;" />
            </td>
            <td style="padding: 6px; text-align: right; font-weight: 700; color: #34d399; font-size: 0.9rem;" id="edit-q-item-total-${idx}">
                ₹${Number(it.total || ((it.qty || 1) * (it.rate || 0))).toLocaleString()}
            </td>
            <td style="padding: 6px 4px; text-align: center; white-space: nowrap;">
                ${(it.width && it.height) ? `
                    <button type="button" onclick="window.reopenQuoteItemInStudio('${eq.id}', ${idx})" title="Adjust 2D CAD in Studio Canvas" style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); color: #a5b4fc; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 0.72rem; margin-right: 3px; font-weight: 600;">
                        📐 Studio
                    </button>
                ` : ''}
                <button type="button" onclick="window.removeEditQuoteItem(${idx})" title="Remove item" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 0.72rem;">
                    🗑️
                </button>
            </td>
        </tr>
        `;
    }).join('');

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
};

window.renderEditQuoteTerms = () => {
    const container = document.getElementById('edit-q-terms-tbody');
    if (!container || !window._editingQuote) return;
    const eq = window._editingQuote;
    if (!eq.termsRows || eq.termsRows.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 1rem; color: #94a3b8; font-size: 0.82rem;">No terms specified. Click "+ Add Row" above to add terms & conditions.</div>`;
        return;
    }
    container.innerHTML = eq.termsRows.map((term, idx) => `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.8rem; font-weight: 700; color: #38bdf8; width: 22px; text-align: right;">${idx + 1}.</span>
            <input type="text" value="${escapeHtml(term)}" oninput="window.updateEditQuoteTermRow(${idx}, this.value)" placeholder="Enter quotation condition / note..." style="flex: 1; padding: 0.45rem 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #f8fafc; font-size: 0.85rem;" />
            <button type="button" onclick="window.removeEditQuoteTermRow(${idx})" title="Remove term" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 0.8rem; transition: background 0.15s ease;" onmouseover="this.style.background='rgba(239, 68, 68, 0.35)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">✕</button>
        </div>
    `).join('');
};

window.addEditQuoteTermRow = () => {
    const eq = window._editingQuote;
    if (!eq) return;
    if (!eq.termsRows) eq.termsRows = [];
    const num = eq.termsRows.length + 1;
    eq.termsRows.push(`${num}. Delivery and payment as agreed.`);
    window.renderEditQuoteTerms();
};

window.removeEditQuoteTermRow = (idx) => {
    const eq = window._editingQuote;
    if (!eq || !eq.termsRows) return;
    eq.termsRows.splice(idx, 1);
    window.renderEditQuoteTerms();
};

window.updateEditQuoteTermRow = (idx, text) => {
    const eq = window._editingQuote;
    if (!eq || !eq.termsRows) return;
    eq.termsRows[idx] = text;
};

window.closeEditQuotationModal = () => {
    const modal = document.getElementById('edit-quotation-modal');
    if (modal) modal.remove();
    window._editingQuote = null;
};

window.updateEditQuoteMeta = (field, val) => {
    if (!window._editingQuote) return;
    window._editingQuote[field] = val;
};

window.updateEditQuoteAdvance = (val) => {
    if (!window._editingQuote) return;
    window._editingQuote.advancePayment = Math.max(0, parseFloat(val) || 0);
    window.recalcEditQuoteTotals();
};

window.updateEditQuoteItemField = (idx, field, val) => {
    const eq = window._editingQuote;
    if (!eq || !eq.items[idx]) return;
    const it = eq.items[idx];

    if (field === 'qty') it.qty = Math.max(1, parseInt(val) || 1);
    else if (field === 'rate') it.rate = Math.max(0, parseFloat(val) || 0);
    else it[field] = val;

    // Recalculate line total simply as qty * rate (No discount/tax per instructions)
    it.total = Math.round((it.qty || 1) * (it.rate || 0));

    const totalEl = document.getElementById(`edit-q-item-total-${idx}`);
    if (totalEl) totalEl.textContent = `₹${Number(it.total).toLocaleString()}`;

    window.recalcEditQuoteTotals();
};

window.recalcEditQuoteTotals = () => {
    const eq = window._editingQuote;
    if (!eq) return;

    let grand = 0;
    (eq.items || []).forEach(it => {
        grand += (Number(it.total) || 0);
    });

    eq.amount = grand;
    eq.total = grand;
    const adv = Number(eq.advancePayment) || 0;
    eq.balanceDue = Math.max(0, grand - adv);

    const grandEl = document.getElementById('edit-q-grand-total');
    if (grandEl) grandEl.textContent = `₹${grand.toLocaleString()}`;

    const balEl = document.getElementById('edit-q-balance-due');
    if (balEl) balEl.textContent = `₹${eq.balanceDue.toLocaleString()}`;
};

window.addEditQuoteItem = () => {
    const eq = window._editingQuote;
    if (!eq) return;
    const num = (eq.items.length + 1);
    const newItem = {
        name: `Window W${num} (50x140 cm)`,
        desc: `1 Kalli (50×140 cm)`,
        qty: 1,
        pieces: 1,
        rate: 2200,
        price: 2200,
        discount: 0,
        tax: 0,
        total: 2200,
        cols: 1,
        width: 50,
        height: 140,
        unit: 'cm'
    };
    eq.items.push(newItem);
    window.renderEditQuoteItems();
    window.recalcEditQuoteTotals();
};

window.removeEditQuoteItem = (idx) => {
    const eq = window._editingQuote;
    if (!eq) return;
    if (eq.items.length <= 1) {
        alert('A quotation must contain at least one item.');
        return;
    }
    eq.items.splice(idx, 1);
    window.renderEditQuoteItems();
    window.recalcEditQuoteTotals();
};

window.reopenQuoteItemInStudio = (quoteId, itemIndex) => {
    const eq = window._editingQuote;
    if (!eq || !eq.items[itemIndex]) return;
    const item = eq.items[itemIndex];
    const store = window.Store || Store;

    // Initialize or adapt Quote Studio state
    if (!store.state.quoteStudio) {
        store.state.quoteStudio = {
            customer: {
                name: eq.customer,
                mobile: eq.customerPhone,
                place: eq.customerAddress,
                city: '',
                pincode: ''
            },
            materials: {
                frame: 'f1', pipe: 'p1', panel: 'pan1', hinge: 'h1', paint: 'pt1', hook: 'hk1', lock: 'lk1'
            },
            items: [],
            currentWindow: null
        };
    }

    const u = item.unit || 'cm';
    store.state.quoteStudio.currentWindow = {
        cols: item.cols || 1,
        rows: 1,
        unit: u,
        totalW: item.width || 50,
        totalH: item.height || 140,
        paneWidths: [item.width || 50],
        panePartitions: [0],
        partitionPos: ['top'],
        quantity: item.qty || 1,
        laborCharge: 800,
        profitMarginPercent: 15
    };
    store.state.quoteStudio.currentWindowSaved = false;

    // Close modals
    window.closeEditQuotationModal();
    const printModal = document.getElementById('quote-print-modal');
    if (printModal) printModal.remove();

    // Switch to calculation/studio view
    store.navigate('calculation');
    if (window.showStudioToast) {
        window.showStudioToast(`Loaded ${item.name} into Window Studio for 2D CAD editing!`);
    }
};

window.saveEditedQuotation = () => {
    const eq = window._editingQuote;
    if (!eq) return;

    if (!eq.customer || !eq.customer.trim()) {
        alert('Customer name cannot be empty.');
        return;
    }

    if (eq.items.length === 0) {
        alert('Please keep at least one item in the quotation.');
        return;
    }

    const store = window.Store || Store;
    const qList = store.state.quotations || [];
    const origId = eq._originalId || eq.id;
    const idx = qList.findIndex(q => q.id === origId);

    if (idx !== -1) {
        const newId = (eq.id || origId).trim();
        // Check uniqueness if ID was changed
        if (newId !== origId && qList.some(q => q.id === newId)) {
            alert(`Quotation number "${newId}" already exists. Please choose a unique quotation number.`);
            return;
        }
        eq.id = newId;

        // Clean up terms rows (strip blank rows)
        if (eq.termsRows) {
            eq.termsRows = eq.termsRows.filter(t => t && t.trim().length > 0);
        }

        // Sync pieces & price for compatibility with sales & orders
        eq.items.forEach(it => {
            it.pieces = it.qty;
            it.price = it.rate;
            it.modelTitle = it.name;
        });

        // Update in state
        qList[idx] = { ...qList[idx], ...eq };
        delete qList[idx]._originalId;
        store.saveState();
        store.notify();

        // If print preview was open behind edit modal, re-render it with fresh values
        const printModal = document.getElementById('quote-print-modal');
        if (printModal) {
            printModal.remove();
            window.openPrintQuotationModal(qList[idx]);
        }

        window.closeEditQuotationModal();

        if (window.showStudioToast) {
            window.showStudioToast(`Quotation ${eq.id} updated successfully!`);
        } else {
            alert(`Quotation ${eq.id} updated successfully!`);
        }
    }
};

// =========================================================================
// --- CLONE, DELETE & 3-DOT MORE ACTIONS MENU ---
// =========================================================================

window.cloneQuotation = (quoteId) => {
    const store = window.Store || Store;
    const qList = store.state.quotations || [];
    const orig = qList.find(q => q.id === quoteId);
    if (!orig) return alert('Quotation not found!');

    // Close any open action menu
    const existingMenu = document.getElementById('quote-action-dropdown');
    if (existingMenu) existingMenu.remove();

    const clone = JSON.parse(JSON.stringify(orig));
    const newId = (typeof store.generateNextQuotationNumber === 'function') 
        ? store.generateNextQuotationNumber(true) 
        : ('QT-' + Date.now().toString().slice(-6));
    
    clone.id = newId;
    clone.title = orig.title || 'Quotation / Estimate';
    clone.date = new Date().toISOString().split('T')[0];
    clone.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    clone.status = 'Draft';
    clone.refNo = orig.refNo ? `${orig.refNo}-CLONE` : `${orig.id}-CLONE`;
    clone.description = (orig.description || `Custom steel windows quotation for ${orig.customer}`) + ' (Cloned)';
    if (orig.termsRows) clone.termsRows = [...orig.termsRows];

    qList.unshift(clone);
    store.saveState();
    store.notify();

    if (window.showStudioToast) {
        window.showStudioToast(`Quotation cloned successfully as ${newId}! Opening editor...`);
    } else {
        alert(`Quotation cloned successfully as ${newId}!`);
    }

    // Immediately redirect user session into the Edit Quotation view of the cloned record
    setTimeout(() => {
        if (typeof window.openEditQuotationModal === 'function') {
            window.openEditQuotationModal(newId);
        }
    }, 100);
};

window.deleteQuotation = (quoteId) => {
    const store = window.Store || Store;
    const qList = store.state.quotations || [];
    const idx = qList.findIndex(q => q.id === quoteId);
    if (idx === -1) return;

    // Close any open action menu
    const existingMenu = document.getElementById('quote-action-dropdown');
    if (existingMenu) existingMenu.remove();

    if (confirm(`Are you sure you want to delete Quotation ${quoteId}?`)) {
        qList.splice(idx, 1);
        store.saveState();
        store.notify();
        if (window.showStudioToast) {
            window.showStudioToast(`Quotation ${quoteId} deleted.`);
        }
    }
};

window.toggleQuoteActionMenu = (quoteId, event) => {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const existing = document.getElementById('quote-action-dropdown');
    if (existing && existing.dataset.quoteId === quoteId) {
        existing.remove();
        return;
    }
    if (existing) existing.remove();

    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId);
    if (!quote) return;

    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();

    const menu = document.createElement('div');
    menu.id = 'quote-action-dropdown';
    menu.dataset.quoteId = quoteId;
    menu.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 5}px;
        left: ${Math.max(10, rect.right - 215)}px;
        width: 215px;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 10px;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.75);
        z-index: 100050;
        padding: 6px 0;
        font-family: 'Inter', sans-serif;
        display: flex;
        flex-direction: column;
    `;

    menu.innerHTML = `
        <button type="button" class="quote-menu-action" onclick="window.openEditQuotationModal('${quoteId}'); document.getElementById('quote-action-dropdown')?.remove();" style="background: transparent; border: none; padding: 8px 14px; color: #f8fafc; font-size: 0.83rem; font-weight: 500; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 9px; width: 100%; transition: background 0.15s ease;" onmouseover="this.style.background='rgba(56,189,248,0.12)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="edit-3" style="width: 15px; height: 15px; color: #38bdf8;"></i> <span>Edit Details</span>
        </button>
        <button type="button" class="quote-menu-action" onclick="window.cloneQuotation('${quoteId}'); document.getElementById('quote-action-dropdown')?.remove();" style="background: transparent; border: none; padding: 8px 14px; color: #f8fafc; font-size: 0.83rem; font-weight: 500; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 9px; width: 100%; transition: background 0.15s ease;" onmouseover="this.style.background='rgba(129,140,248,0.12)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="copy" style="width: 15px; height: 15px; color: #818cf8;"></i> <span>Clone Quote</span>
        </button>
        <button type="button" class="quote-menu-action" onclick="window.openShareQuotationModal('${quoteId}'); document.getElementById('quote-action-dropdown')?.remove();" style="background: transparent; border: none; padding: 8px 14px; color: #f8fafc; font-size: 0.83rem; font-weight: 500; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 9px; width: 100%; transition: background 0.15s ease;" onmouseover="this.style.background='rgba(34,197,94,0.12)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="share-2" style="width: 15px; height: 15px; color: #34d399;"></i> <span>Share</span>
        </button>
        <button type="button" class="quote-menu-action" onclick="window.openQuoteBOMModal('${quoteId}'); document.getElementById('quote-action-dropdown')?.remove();" style="background: transparent; border: none; padding: 8px 14px; color: #f8fafc; font-size: 0.83rem; font-weight: 500; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 9px; width: 100%; transition: background 0.15s ease;" onmouseover="this.style.background='rgba(245,158,11,0.12)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="layers" style="width: 15px; height: 15px; color: #f59e0b;"></i> <span>BOM (Bill of Materials)</span>
        </button>
        <button type="button" class="quote-menu-action" onclick="window.openAttachFileModal('${quoteId}'); document.getElementById('quote-action-dropdown')?.remove();" style="background: transparent; border: none; padding: 8px 14px; color: #f8fafc; font-size: 0.83rem; font-weight: 500; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 9px; width: 100%; transition: background 0.15s ease;" onmouseover="this.style.background='rgba(167,139,250,0.12)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="paperclip" style="width: 15px; height: 15px; color: #a78bfa;"></i> <span>Attach File</span>
        </button>
        <button type="button" class="quote-menu-action" onclick="window.convertToOrder('${quoteId}', '${(quote.customer || '').replace(/'/g, "\\'")}', ${quote.amount}); document.getElementById('quote-action-dropdown')?.remove();" style="background: transparent; border: none; padding: 8px 14px; color: #f8fafc; font-size: 0.83rem; font-weight: 500; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 9px; width: 100%; transition: background 0.15s ease;" onmouseover="this.style.background='rgba(16,185,129,0.12)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="package-check" style="width: 15px; height: 15px; color: #10b981;"></i> <span>Convert to Order</span>
        </button>
        <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0;"></div>
        <button type="button" class="quote-menu-action" onclick="window.promptCancelQuotation('${quoteId}'); document.getElementById('quote-action-dropdown')?.remove();" style="background: transparent; border: none; padding: 8px 14px; color: #fbbf24; font-size: 0.83rem; font-weight: 500; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 9px; width: 100%; transition: background 0.15s ease;" onmouseover="this.style.background='rgba(251,191,36,0.12)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="ban" style="width: 15px; height: 15px; color: #fbbf24;"></i> <span>Cancel Quote</span>
        </button>
        <button type="button" class="quote-menu-action" onclick="window.promptDeleteQuotation('${quoteId}'); document.getElementById('quote-action-dropdown')?.remove();" style="background: transparent; border: none; padding: 8px 14px; color: #f87171; font-size: 0.83rem; font-weight: 600; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 9px; width: 100%; transition: background 0.15s ease;" onmouseover="this.style.background='rgba(239,68,68,0.15)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="trash-2" style="width: 15px; height: 15px; color: #ef4444;"></i> <span>Delete Quote</span>
        </button>
    `;

    document.body.appendChild(menu);
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);

    const onDocClick = (e) => {
        if (!e.target.closest('#quote-action-dropdown') && !e.target.closest('.quote-more-btn')) {
            const d = document.getElementById('quote-action-dropdown');
            if (d) d.remove();
            document.removeEventListener('click', onDocClick);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', onDocClick);
    }, 50);
};

// =========================================================================
// --- UNIVERSAL PRINT DOCUMENT EXPORT: DOWNLOAD & SHARE ---
// Available globally across Quotations, Sales Invoices, Reports & Orders
// =========================================================================

window.downloadPrintDoc = async (elementId, filename) => {
    const el = document.getElementById(elementId);
    if (!el) return alert('Document element not found!');

    if (window.ensureImagesLoaded) {
        await window.ensureImagesLoaded(el);
    }

    if (window.html2pdf) {
        const opt = {
            margin: [8, 8, 8, 8],
            filename: `${filename}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        if (window.showStudioToast) {
            window.showStudioToast(`Generating ${filename}.pdf...`);
        }
        window.html2pdf().set(opt).from(el).save().then(() => {
            if (window.showStudioToast) window.showStudioToast(`Downloaded ${filename}.pdf successfully!`);
        }).catch(err => {
            console.error('html2pdf error:', err);
            window.print();
        });
    } else {
        if (window.showStudioToast) {
            window.showStudioToast('Select "Save as PDF" destination in the print dialog');
        }
        window.print();
    }
};

window.sharePrintDoc = (docType, docId, docTitle, customerName, totalAmount, customerPhone = '') => {
    window.openShareOnWhatsAppModal({
        id: docId,
        type: docType,
        title: docTitle,
        customer: customerName,
        amount: totalAmount,
        customerPhone: customerPhone
    }, docType);
};

window.shareDocToWhatsApp = (whatsappUrl, docId) => {
    window.open(whatsappUrl, '_blank');
};

window.copyDocShareText = (btn, text) => {
    navigator.clipboard.writeText(text).then(() => {
        const label = document.getElementById('share-copy-btn-label');
        if (label) label.textContent = '✓ Copied!';
        if (window.showStudioToast) window.showStudioToast('Quote details copied to clipboard!');
        setTimeout(() => {
            if (label) label.textContent = 'Copy';
        }, 2500);
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
};

window.nativeShareDoc = async (title, text, docId = 'Quotation') => {
    if (!navigator.share) return;
    const el = document.getElementById('printable-quotation');
    if (el && window.html2pdf && navigator.canShare) {
        try {
            if (window.showStudioToast) window.showStudioToast('Preparing PDF for sharing...');
            const opt = {
                margin: [8, 8, 8, 8],
                filename: `${docId}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            const pdfBlob = await window.html2pdf().set(opt).from(el).outputPdf('blob');
            const file = new File([pdfBlob], `${docId}.pdf`, { type: 'application/pdf' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title,
                    text
                });
                return;
            }
        } catch (e) {
            console.warn('PDF share failed, falling back to text:', e);
        }
    }
    navigator.share({ title, text }).catch(() => {});
};

// =========================================================================
// --- FEATURE 3: STYLO STEEL DOCUMENT GENERATION & WHATSAPP SHARING ENGINE
// =========================================================================

window.formatDocDate = (dateStr) => {
    try {
        const d = dateStr ? new Date(dateStr) : new Date();
        if (isNaN(d.getTime())) return dateStr || '24-Sep-2026';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = String(d.getDate()).padStart(2, '0');
        const mon = months[d.getMonth()];
        const yr = d.getFullYear();
        return `${day}-${mon}-${yr}`;
    } catch (e) {
        return dateStr || '24-Sep-2026';
    }
};

window.formatDocPdfFilename = (docType = 'Invoice', docId = '4', customerName = 'Customer') => {
    const safeType = String(docType || 'Invoice').replace(/[^a-zA-Z0-9]/g, '');
    const cleanId = String(docId || '4').replace(/[^a-zA-Z0-9]/g, '');
    const cleanCust = String(customerName || 'Customer').trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${safeType}_${cleanId}-${cleanCust}-${hh}-${mm}-${ss}.pdf`;
};

// Generates an offline high-density SVG QR code identical to WhatsApp Web authentication screen (Screenshot 3)
window.generateWhatsAppQrSvg = (size = 180) => {
    // Standard high-density QR matrix representation for WhatsApp Web auth
    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" style="display: block; margin: 0 auto; shape-rendering: crispEdges;">
            <rect width="100" height="100" fill="#ffffff"/>
            <!-- Top-Left Position Detection Pattern -->
            <rect x="6" y="6" width="28" height="28" fill="#000000"/>
            <rect x="10" y="10" width="20" height="20" fill="#ffffff"/>
            <rect x="14" y="14" width="12" height="12" fill="#000000"/>

            <!-- Top-Right Position Detection Pattern -->
            <rect x="66" y="6" width="28" height="28" fill="#000000"/>
            <rect x="70" y="10" width="20" height="20" fill="#ffffff"/>
            <rect x="74" y="14" width="12" height="12" fill="#000000"/>

            <!-- Bottom-Left Position Detection Pattern -->
            <rect x="6" y="66" width="28" height="28" fill="#000000"/>
            <rect x="10" y="70" width="20" height="20" fill="#ffffff"/>
            <rect x="14" y="74" width="12" height="12" fill="#000000"/>

            <!-- Timing and Alignment Patterns -->
            <line x1="38" y1="12" x2="62" y2="12" stroke="#000000" stroke-width="4" stroke-dasharray="4,4"/>
            <line x1="12" y1="38" x2="12" y2="62" stroke="#000000" stroke-width="4" stroke-dasharray="4,4"/>
            <rect x="70" y="70" width="16" height="16" fill="#000000"/>
            <rect x="74" y="74" width="8" height="8" fill="#ffffff"/>
            <rect x="76" y="76" width="4" height="4" fill="#000000"/>

            <!-- Dense Data Matrix Elements -->
            <rect x="38" y="20" width="4" height="8" fill="#000000"/>
            <rect x="46" y="16" width="6" height="4" fill="#000000"/>
            <rect x="56" y="20" width="6" height="8" fill="#000000"/>
            <rect x="38" y="32" width="8" height="4" fill="#000000"/>
            <rect x="50" y="30" width="6" height="8" fill="#000000"/>
            <rect x="60" y="34" width="4" height="4" fill="#000000"/>
            <rect x="20" y="38" width="6" height="8" fill="#000000"/>
            <rect x="30" y="42" width="6" height="4" fill="#000000"/>
            <rect x="40" y="40" width="8" height="8" fill="#000000"/>
            <rect x="52" y="42" width="6" height="6" fill="#000000"/>
            <rect x="64" y="40" width="6" height="8" fill="#000000"/>
            <rect x="74" y="42" width="6" height="4" fill="#000000"/>
            <rect x="84" y="38" width="8" height="6" fill="#000000"/>
            <rect x="22" y="50" width="4" height="10" fill="#000000"/>
            <rect x="30" y="52" width="6" height="6" fill="#000000"/>
            <rect x="42" y="52" width="6" height="8" fill="#000000"/>
            <rect x="52" y="50" width="8" height="4" fill="#000000"/>
            <rect x="64" y="52" width="4" height="8" fill="#000000"/>
            <rect x="72" y="54" width="8" height="6" fill="#000000"/>
            <rect x="84" y="50" width="6" height="8" fill="#000000"/>
            <rect x="38" y="66" width="6" height="6" fill="#000000"/>
            <rect x="48" y="68" width="8" height="6" fill="#000000"/>
            <rect x="60" y="66" width="6" height="4" fill="#000000"/>
            <rect x="38" y="76" width="8" height="6" fill="#000000"/>
            <rect x="50" y="78" width="6" height="6" fill="#000000"/>
            <rect x="60" y="74" width="6" height="8" fill="#000000"/>
            <rect x="38" y="86" width="6" height="6" fill="#000000"/>
            <rect x="48" y="88" width="10" height="4" fill="#000000"/>
            <rect x="62" y="86" width="4" height="8" fill="#000000"/>
            <rect x="70" y="90" width="8" height="4" fill="#000000"/>
            <rect x="82" y="86" width="8" height="6" fill="#000000"/>
        </svg>
    `;
};

// =========================================================================
// --- UNIVERSAL PRINTABLE DOCUMENT HTML GENERATOR (Screenshot 4) ---
// =========================================================================

window.renderPrintableQuotationHTML = (quote, copyType = 'ORIGINAL') => {
    const store = window.Store || Store;
    const settings = store.state.settings || {};
    const company = settings.company || {
        name: 'STYLO STEEL',
        address: 'STYLO TOWER\nKONDOTTY ROAD MUNDAKKULAM\nMalappuram, Kerala - 673638',
        phone: '8086888500',
        email: 'Buildstello@gmail.com',
        website: 'stylosteel.com',
        taxId: '895CFBPJ4043Q1ZE',
        pan: '895CFBPJ4043Q1ZE'
    };

    const copyLabels = {
        'ORIGINAL': 'ORIGINAL FOR RECIPIENT',
        'DUPLICATE': 'DUPLICATE FOR TRANSPORTER',
        'TRANSPORT': 'TRIPLICATE FOR SUPPLIER',
        'OFFICE': 'OFFICE COPY'
    };
    const badgeText = copyLabels[copyType] || 'ORIGINAL FOR RECIPIENT';

    const custObj = (store.state.customers || []).find(c => c.name === quote.customer || c.id === quote.customerId) || {};
    const custName = quote.customer || custObj.name || 'Subair Nechikkattu';
    const custAddress = quote.customerLocation || quote.customerAddress || custObj.address || custObj.district || custObj.place || 'Kozhissery, Kakkanchery, Kerala';
    const custPhone = quote.customerPhone || custObj.mobile || custObj.phone || '8086888500';
    const custGstin = quote.customerGst || custObj.gstNumber || custObj.taxId || '-';
    const docDate = window.formatDocDate(quote.date);
    const docId = quote.id || '4';
    const docTitle = quote.title ? quote.title.toUpperCase() : 'TAX INVOICE';
    const vehicleNo = quote.vehicleNo || quote.vehicle || 'Kl85';

    const items = (quote.items && quote.items.length > 0) ? quote.items : [
        { name: 'Window 204x177', width: 204, height: 177, qty: 1, rate: 22400, total: 22400 },
        { name: 'Window 244x63', width: 244, height: 63, qty: 1, rate: 11900, total: 11900 },
        { name: 'Window 154x131', width: 154, height: 131, qty: 1, rate: 16400, total: 16400 },
        { name: 'Window 192x155', width: 192, height: 155, qty: 1, rate: 20200, total: 20200 },
        { name: 'Window 153x155', width: 153, height: 155, qty: 1, rate: 17600, total: 17600 },
        { name: 'Window 178x186', width: 178, height: 186, qty: 1, rate: 22000, total: 22000 },
        { name: 'Window 108x45', width: 108, height: 45, qty: 1, rate: 3600, total: 3600 },
        { name: 'Window 204x152', width: 204, height: 152, qty: 2, rate: 21800, total: 43600 },
        { name: 'V 70x45', width: 70, height: 45, qty: 3, rate: 3100, total: 9300 },
        { name: 'V 70x20', width: 70, height: 20, qty: 1, rate: 2100, total: 2100 },
        { name: 'Window 243x510', width: 243, height: 510, qty: 1, rate: 59900, total: 59900 }
    ];

    let grandTotal = 0;
    items.forEach(it => {
        const qty = Number(it.pieces || it.qty || 1);
        const rate = Number(it.rate || it.price || 0);
        grandTotal += Number(it.total !== undefined ? it.total : (qty * rate));
    });
    if (quote.amount && quote.amount > 0 && Math.abs(grandTotal - Number(quote.amount)) > 10) {
        grandTotal = Number(quote.amount);
    }

    return `
        <div id="printable-quotation" class="gogst-document-page" style="width: 100%; max-width: 860px; background: #ffffff; color: #000000; padding: 2rem; border: 1.5px solid #000000; font-family: 'Inter', Arial, sans-serif; box-sizing: border-box;">
            
            <!-- STYLO STEEL Letterhead Top Section (Screenshot 4) -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;">
                <div>
                    <h1 style="margin: 0; font-size: 1.65rem; color: #000000; font-weight: 800; letter-spacing: 0.5px; line-height: 1.1;">STYLO STEEL</h1>
                    <div style="margin-top: 4px; font-size: 0.85rem; color: #1e293b; line-height: 1.35; white-space: pre-line;">STYLO TOWER
KONDOTTY ROAD MUNDAKKULAM
Malappuram, Kerala - 673638</div>
                </div>
                <div style="text-align: right; font-size: 0.84rem; color: #1e293b; line-height: 1.45;">
                    <div><strong>Name :</strong> STYLO STEEL</div>
                    <div><strong>Phone :</strong> 8086888500</div>
                    <div><strong>Email :</strong> Buildstello@gmail.com</div>
                    <div><strong>Website :</strong> stylosteel.com</div>
                </div>
            </div>

            <!-- PAN, Document Title & Copy Type Banner (Screenshot 4) -->
            <div style="border: 1.5px solid #000000; border-bottom: none; display: grid; grid-template-columns: 1.1fr 1fr 1.1fr; align-items: center; padding: 6px 12px; font-size: 0.85rem; background: #ffffff;">
                <div style="font-weight: 800; color: #000000;">PAN : 895CFBPJ4043Q1ZE</div>
                <div style="font-weight: 800; font-size: 1.15rem; text-align: center; color: #000000; letter-spacing: 0.5px;">${docTitle}</div>
                <div style="text-align: right; font-weight: 800; font-size: 0.78rem; color: #000000;" id="print-doc-copy-badge">${badgeText}</div>
            </div>

            <!-- Details of Buyer / Consignee / Invoice Metadata (3-Column Bordered Table in Screenshot 4) -->
            <div style="border: 1.5px solid #000000; border-bottom: none; display: grid; grid-template-columns: 1fr 1fr 0.9fr; font-size: 0.78rem; line-height: 1.45;">
                <!-- Column 1: Details of Buyer | Billed to -->
                <div style="padding: 6px 10px; border-right: 1.5px solid #000000;">
                    <div style="font-weight: 700; text-decoration: underline; margin-bottom: 4px; color: #000000;">Details of Buyer | Billed to :</div>
                    <div><strong>Name</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(custName)}</div>
                    <div><strong>Address</strong> &nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(custAddress)}</div>
                    <div><strong>Phone</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(custPhone)}</div>
                    <div><strong>GSTIN</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(custGstin)}</div>
                    <div><strong>State</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Kerala ( 32 )</div>
                    <div><strong>Place of Supply</strong>: Kerala ( 32 )</div>
                </div>

                <!-- Column 2: Details of Consignee | Shipped to -->
                <div style="padding: 6px 10px; border-right: 1.5px solid #000000;">
                    <div style="font-weight: 700; text-decoration: underline; margin-bottom: 4px; color: #000000;">Details of Consignee | Shipped to :</div>
                    <div><strong>Name</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(custName)}</div>
                    <div><strong>Address</strong> &nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(custAddress)}</div>
                    <div><strong>Phone</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(custPhone)}</div>
                    <div><strong>GSTIN</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(custGstin)}</div>
                    <div><strong>State</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Kerala ( 32 )</div>
                </div>

                <!-- Column 3: Invoice Metadata -->
                <div style="padding: 6px 10px;">
                    <div style="margin-bottom: 4px;"><strong>Invoice No.</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <strong style="font-size: 0.95rem;">${docId}</strong></div>
                    <div style="margin-bottom: 4px;"><strong>Invoice Date</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${docDate}</div>
                    <div><strong>Moter Vehicle No.</strong> : ${vehicleNo}</div>
                </div>
            </div>

            <!-- Items Table (Screenshot 4 Full Bordered Grid with 2D Technical Drawings) -->
            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; font-size: 0.78rem; margin-bottom: 0;">
                <thead>
                    <tr style="border-bottom: 1.5px solid #000000; text-align: center; font-weight: 700; background: #ffffff;">
                        <th style="padding: 6px 4px; border-right: 1px solid #000000; width: 36px;">Sr.<br>No.</th>
                        <th style="padding: 6px 8px; border-right: 1px solid #000000; text-align: left;">Name of Product / Service</th>
                        <th style="padding: 6px 4px; border-right: 1px solid #000000; width: 70px;">HSN / SAC</th>
                        <th style="padding: 6px 4px; border-right: 1px solid #000000; width: 45px;">Qty</th>
                        <th style="padding: 6px 6px; border-right: 1px solid #000000; width: 85px;">Rate</th>
                        <th style="padding: 6px 6px; border-right: 1px solid #000000; width: 95px;">Taxable Value</th>
                        <th style="padding: 4px; border-right: 1px solid #000000; width: 85px;" colspan="2">
                            <div style="border-bottom: 1px solid #000000; padding-bottom: 2px;">CGST</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; font-size: 0.7rem; padding-top: 2px;">
                                <span>%</span><span>Amount</span>
                            </div>
                        </th>
                        <th style="padding: 4px; border-right: 1px solid #000000; width: 85px;" colspan="2">
                            <div style="border-bottom: 1px solid #000000; padding-bottom: 2px;">SGST</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; font-size: 0.7rem; padding-top: 2px;">
                                <span>%</span><span>Amount</span>
                            </div>
                        </th>
                        <th style="padding: 6px 6px; width: 95px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((it, idx) => {
                        const qty = Number(it.pieces || it.qty || 1);
                        const rate = Number(it.rate || it.price || 0);
                        const taxable = Number(it.total !== undefined ? it.total : (qty * rate));
                        const title = it.title || it.name || formatQuoteItemTitle(it, idx);
                        const itemImg = it.drawingUrl || it.imageUrl || it.image || it.photo;
                        const itemSvg = it.drawingSvg || (typeof window.generateWindowCadSvg === 'function' ? window.generateWindowCadSvg(it, { isThumbnail: true, showDimensions: true, viewW: 100, viewH: 70 }) : '');

                        return `
                        <tr style="border-bottom: 1px solid #000000; vertical-align: middle;">
                            <td style="padding: 6px 4px; text-align: center; border-right: 1px solid #000000; font-weight: 600;">${idx + 1}</td>
                            <td style="padding: 6px 8px; border-right: 1px solid #000000;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 80px; height: 60px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;">
                                        ${itemImg ? `
                                            <img src="${itemImg}" alt="${title}" style="max-width: 100%; max-height: 100%; object-fit: contain; image-rendering: -webkit-optimize-contrast; display: block;" crossOrigin="anonymous" />
                                        ` : (itemSvg ? itemSvg : `
                                            <div style="color: #94a3b8; font-size: 0.65rem; text-align: center;">2D Plan</div>
                                        `)}
                                    </div>
                                    <div>
                                        <div style="font-weight: 700; color: #000000; font-size: 0.85rem;">${escapeHtml(title)}</div>
                                        ${it.desc ? `<div style="font-size: 0.72rem; color: #475569; margin-top: 2px;">${escapeHtml(it.desc)}</div>` : ''}
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 6px 4px; text-align: center; border-right: 1px solid #000000; color: #475569;">${it.hsn || '7308'}</td>
                            <td style="padding: 6px 4px; text-align: center; border-right: 1px solid #000000; font-weight: 600;">${qty.toFixed(2)}</td>
                            <td style="padding: 6px 6px; text-align: right; border-right: 1px solid #000000;">${rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td style="padding: 6px 6px; text-align: right; border-right: 1px solid #000000; font-weight: 600;">${taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td style="padding: 6px 2px; text-align: center; border-right: 1px solid #000000; width: 35px; color: #475569;">0</td>
                            <td style="padding: 6px 4px; text-align: right; border-right: 1px solid #000000; width: 45px; color: #475569;">0</td>
                            <td style="padding: 6px 2px; text-align: center; border-right: 1px solid #000000; width: 35px; color: #475569;">0</td>
                            <td style="padding: 6px 4px; text-align: right; border-right: 1px solid #000000; width: 45px; color: #475569;">0</td>
                            <td style="padding: 6px 6px; text-align: right; font-weight: 800; color: #000000;">${taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr style="font-weight: 800; background: #f8fafc; border-top: 1.5px solid #000000;">
                        <td colspan="3" style="padding: 8px 10px; border-right: 1px solid #000000; text-align: right;">Total / Summary</td>
                        <td style="padding: 8px 4px; text-align: center; border-right: 1px solid #000000;">${items.reduce((s, it) => s + Number(it.pieces || it.qty || 1), 0).toFixed(2)}</td>
                        <td style="padding: 8px 6px; border-right: 1px solid #000000;"></td>
                        <td style="padding: 8px 6px; text-align: right; border-right: 1px solid #000000;">${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td colspan="4" style="border-right: 1px solid #000000; text-align: center; color: #64748b; font-size: 0.72rem;">0.00</td>
                        <td style="padding: 8px 6px; text-align: right; font-size: 0.95rem; color: #000000;">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                </tfoot>
            </table>

            <!-- Bottom Bank Details & Authorized Signatory Block (Screenshot 4) -->
            <div style="border: 1.5px solid #000000; border-top: none; display: flex; justify-content: space-between; align-items: flex-end; padding: 12px 14px; font-size: 0.8rem; background: #ffffff;">
                <div style="flex: 1; padding-right: 1rem;">
                    <div><strong>Amount Chargeable (in words):</strong></div>
                    <div style="font-style: italic; color: #0f172a; margin-top: 2px;">${numberToWords(grandTotal)} Rupees Only</div>
                    
                    <div style="margin-top: 8px; font-size: 0.76rem; color: #334155;">
                        <strong>Bank Details:</strong> HDFC Bank | A/C: 50200098765432 | IFSC: HDFC0001234 | Branch: Kakkanad, Kochi
                    </div>
                </div>
                <div style="text-align: center; width: 200px;">
                    <div style="font-size: 0.75rem; color: #475569; margin-bottom: 25px;">For STYLO STEEL</div>
                    <div style="border-top: 1px solid #000000; padding-top: 3px; font-weight: 700; color: #000000;">Authorized Signatory</div>
                </div>
            </div>

        </div>
    `;
};

// =========================================================================
// --- PDF BLOBS & DOWNLOAD CONTROLLER ---
// =========================================================================

window.blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

window.generateQuotePdfBlob = async (quote) => {
    if (!quote) throw new Error('No quotation provided');
    if (!window.html2pdf) throw new Error('html2pdf library is not loaded');

    // Create temporary offscreen container for clean compilation
    const tempContainer = document.createElement('div');
    tempContainer.id = 'temp-pdf-render-box-' + Date.now();
    tempContainer.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 860px; background: white;';
    tempContainer.innerHTML = window.renderPrintableQuotationHTML(quote, 'ORIGINAL');
    document.body.appendChild(tempContainer);

    try {
        const el = tempContainer.querySelector('#printable-quotation') || tempContainer;
        
        // 1. Pre-rasterize all SVGs and ensure all images are completely loaded
        if (window.ensureImagesLoaded) {
            await window.ensureImagesLoaded(el);
        }

        // 2. Compile to high-fidelity PDF blob
        const safeCust = (quote.customer || 'Customer').replace(/[^a-zA-Z0-9_\-]/g, '_');
        const filename = window.formatDocPdfFilename('Invoice', quote.id, quote.customer);
        const opt = {
            margin: [6, 6, 6, 6],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfBlob = await window.html2pdf().set(opt).from(el).outputPdf('blob');
        return pdfBlob;
    } finally {
        tempContainer.remove();
    }
};

window.downloadQuotePDFDirect = async (quoteId) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId) || { id: quoteId };

    if (window.showStudioToast) window.showStudioToast(`Generating PDF for ${quote.id}...`);

    try {
        const pdfBlob = await window.generateQuotePdfBlob(quote);
        const filename = window.formatDocPdfFilename('Invoice', quote.id, quote.customer);

        const blobUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(blobUrl);
        }, 1500);

        if (window.showStudioToast) window.showStudioToast(`Downloaded ${filename} successfully!`);
    } catch (err) {
        console.error('PDF generation error:', err);
        if (window.showStudioToast) window.showStudioToast('PDF generation failed, opening print dialog...');
        window.print();
    }
};

// =========================================================================
// --- WHATSAPP AUTHENTICATION & DEVICE PAIRING CONTROLLER (Screenshot 3 & 5)
// =========================================================================

window.disconnectWhatsAppDevice = () => {
    const store = window.Store || Store;
    if (!store.state.settings) store.state.settings = {};
    if (!store.state.settings.whatsapp) store.state.settings.whatsapp = {};
    store.state.settings.whatsapp.connected = false;
    if (store.save) store.save();

    // Re-render open WhatsApp modal if currently present
    const modal = document.getElementById('gogst-whatsapp-share-modal');
    if (modal && window._activeWhatsAppShareContext) {
        window.openShareOnWhatsAppModal(window._activeWhatsAppShareContext.quote, window._activeWhatsAppShareContext.docType);
    }
    if (window.showStudioToast) window.showStudioToast('WhatsApp device disconnected. Scan QR to reconnect.');
};

window.connectWhatsAppDevice = () => {
    const store = window.Store || Store;
    if (!store.state.settings) store.state.settings = {};
    if (!store.state.settings.whatsapp) store.state.settings.whatsapp = {};
    store.state.settings.whatsapp.connected = true;
    if (store.save) store.save();

    const modal = document.getElementById('gogst-whatsapp-share-modal');
    if (modal && window._activeWhatsAppShareContext) {
        window.openShareOnWhatsAppModal(window._activeWhatsAppShareContext.quote, window._activeWhatsAppShareContext.docType);
    }
    if (window.showStudioToast) window.showStudioToast('✓ WhatsApp phone +91 8086888500 connected successfully!');
};

// =========================================================================
// --- EXACT "SHARE ON WHATSAPP" MODAL CONTROLLER (Screenshot 2) ---
// =========================================================================

window.openShareOnWhatsAppModal = (quoteOrId, docType = 'Invoice') => {
    let existing = document.getElementById('gogst-whatsapp-share-modal');
    if (existing) existing.remove();
    let oldShare = document.getElementById('quote-share-modal');
    if (oldShare) oldShare.remove();

    const store = window.Store || Store;
    let quote = null;
    if (typeof quoteOrId === 'object' && quoteOrId !== null) {
        quote = quoteOrId;
    } else {
        quote = (store.state.quotations || []).find(q => q.id === quoteOrId) || { id: quoteOrId };
    }

    window._activeWhatsAppShareContext = { quote, docType };

    const custObj = (store.state.customers || []).find(c => c.name === quote.customer || c.id === quote.customerId) || {};
    const custName = quote.customer || custObj.name || 'Subair Nechikkattu';
    let rawPhone = quote.customerPhone || custObj.mobile || custObj.phone || '8086888500';
    const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^91/, '');
    const phoneInputVal = cleanPhone || '8086888500';

    const docId = quote.id || '4';
    const docDate = window.formatDocDate(quote.date);
    const amountVal = Number(quote.amount || 308200).toFixed(2);
    const filename = window.formatDocPdfFilename(docType, docId, custName);
    const directDocUrl = `${window.location.origin}/uploads/quotations/${filename}`;

    const defaultMsg = 
`Dear ${custName},

    Please view the details of the transaction below.

    Invoice No: ${docId}
    Invoice Date: ${docDate}
    Amount: ${amountVal}

    To view Document click
${directDocUrl}

    Sincerely
    STYLO STEEL`;

    const waSettings = store.state.settings?.whatsapp || {
        allowStaffSharing: true,
        connected: true,
        phone: '+91 8086888500'
    };

    const modal = document.createElement('div');
    modal.id = 'gogst-whatsapp-share-modal';
    modal.className = 'gogst-modal-backdrop animate-fade-in';

    modal.innerHTML = `
        <div class="gogst-share-dialog">
            <!-- Modal Header (Screenshot 2) -->
            <div class="gogst-dialog-header">
                <h3 class="gogst-dialog-title" style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">
                    Share on WhatsApp
                </h3>
                <button type="button" class="gogst-close-btn" onclick="document.getElementById('gogst-whatsapp-share-modal').remove()">✕</button>
            </div>

            <!-- Form Content (Screenshot 2) -->
            <div style="padding: 1.5rem 1.75rem; background: #ffffff;">
                
                <!-- Row 1: Mobile Number* with [+91 ▾] Country Code Selector (Screenshot 2) -->
                <div class="gogst-form-row">
                    <label class="gogst-form-label">Mobile Number*</label>
                    <div class="gogst-phone-group">
                        <select id="wa-country-code-select" class="gogst-country-select">
                            <option value="+91" selected>+91</option>
                            <option value="+971">+971</option>
                            <option value="+966">+966</option>
                            <option value="+968">+968</option>
                            <option value="+974">+974</option>
                            <option value="+965">+965</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                        </select>
                        <input type="tel" id="wa-share-phone-input" class="gogst-phone-input" value="${phoneInputVal}" placeholder="Enter 10-digit mobile number">
                    </div>
                </div>

                <!-- Row 2: Message* Textarea (Screenshot 2) -->
                <div class="gogst-form-row">
                    <label class="gogst-form-label">Message*</label>
                    <textarea id="wa-share-message-textarea" class="gogst-message-textarea" rows="10">${defaultMsg}</textarea>
                </div>

                <!-- Row 3: Attachment Box with Red PDF Icon & Filename (Screenshot 2) -->
                <div class="gogst-form-row">
                    <label class="gogst-form-label">Attachment</label>
                    <div>
                        <div class="gogst-attachment-card">
                            <div class="gogst-pdf-badge">PDF</div>
                            <div class="gogst-attachment-filename" id="wa-share-attachment-name">
                                ${filename}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Row 4: WhatsApp Connection & Staff Sharing Status (Screenshot 3 & 5) -->
                <div style="border-top: 1px solid #e2e8f0; padding-top: 1.25rem; margin-top: 1.25rem;">
                    <!-- Staff member checkbox (Screenshot 3 & 5) -->
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #1e293b; font-weight: 500; cursor: pointer;">
                        <input type="checkbox" id="wa-allow-staff-checkbox" ${waSettings.allowStaffSharing ? 'checked' : ''} style="accent-color: #0d9488; width: 18px; height: 18px;">
                        Allow staff member to send WhatsApp using connected phone number.
                    </label>

                    <!-- Device connection state conditional display -->
                    <div id="wa-device-status-container" style="margin-top: 12px;">
                        ${waSettings.connected ? `
                            <!-- Connected Card (Screenshot 5) -->
                            <div class="whatsapp-connected-card">
                                <div class="wa-logo">
                                    <i data-lucide="phone" style="width: 17px; height: 17px; fill: white;"></i>
                                </div>
                                <div class="wa-info">
                                    <div>Connected with</div>
                                    <strong>${waSettings.phone || '+91 8086888500'}</strong>
                                </div>
                                <button type="button" class="wa-disconnect-btn" onclick="window.disconnectWhatsAppDevice()" title="Disconnect phone number">✕</button>
                            </div>
                        ` : `
                            <!-- Disconnected / QR Pairing Mode (Screenshot 3) -->
                            <div class="whatsapp-qr-box">
                                <div class="whatsapp-qr-image-wrapper">
                                    ${window.generateWhatsAppQrSvg(160)}
                                </div>
                                <div class="whatsapp-countdown-badge" id="wa-qr-countdown">18</div>
                                <p class="whatsapp-qr-instruction">Scan the QR from your phone WhatsApp to authenticate</p>
                                <button type="button" class="btn btn-secondary" onclick="window.connectWhatsAppDevice()" style="margin-top: 12px; font-size: 0.8rem; padding: 4px 12px; color: #0d9488; border-color: #0d9488;">
                                    ✓ Authenticate / Pair Device
                                </button>
                            </div>
                        `}
                    </div>
                </div>

            </div>

            <!-- Footer Toolbar (Screenshot 2) -->
            <div class="gogst-dialog-footer" style="background: #ffffff; border-top: 1px solid #e2e8f0; padding: 1rem 1.75rem;">
                <button type="button" class="gogst-btn-close" onclick="document.getElementById('gogst-whatsapp-share-modal').remove()">
                    <i data-lucide="x" style="width: 15px; height: 15px;"></i> Close
                </button>
                <button type="button" id="btn-submit-whatsapp-share" class="gogst-btn-whatsapp" style="background: #00a884; font-size: 0.92rem; padding: 0.6rem 1.4rem;" onclick="window.executeWhatsAppShare('${docId}', '${docType}', '${filename}')">
                    <i data-lucide="send" style="width: 16px; height: 16px;"></i> Share on WhatsApp
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
        // Start countdown timer for QR code if in disconnected state
        if (!waSettings.connected) {
            let count = 18;
            const timerEl = document.getElementById('wa-qr-countdown');
            if (timerEl) {
                const interval = setInterval(() => {
                    count--;
                    if (count <= 0) count = 20;
                    if (document.getElementById('wa-qr-countdown')) {
                        document.getElementById('wa-qr-countdown').textContent = String(count);
                    } else {
                        clearInterval(interval);
                    }
                }, 1000);
            }
        }
    }, 0);
};

// =========================================================================
// --- SUBMIT CONTROLLER: EXECUTE WHATSAPP SHARE FLOW ---
// =========================================================================

window.executeWhatsAppShare = async (docId, docType, filename) => {
    const phoneInput = document.getElementById('wa-share-phone-input');
    const countrySelect = document.getElementById('wa-country-code-select');
    const msgTextarea = document.getElementById('wa-share-message-textarea');
    const submitBtn = document.getElementById('btn-submit-whatsapp-share');

    const countryCode = countrySelect ? countrySelect.value.replace('+', '') : '91';
    const rawNumber = phoneInput ? phoneInput.value.replace(/\D/g, '') : '8086888500';
    const fullPhone = `${countryCode}${rawNumber}`;
    let shareText = msgTextarea ? msgTextarea.value : '';

    const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.75';
        submitBtn.innerHTML = `
            <span class="spinner-border" style="width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block;"></span>
            Preparing Share...
        `;
    }

    try {
        const store = window.Store || Store;
        const quote = (store.state.quotations || []).find(q => q.id === docId) || window._activeWhatsAppShareContext?.quote || { id: docId };

        // 1. Generate crystal-clear PDF blob with pre-rasterized 2D CAD technical drawings
        let pdfBlob = null;
        if (window.generateQuotePdfBlob) {
            pdfBlob = await window.generateQuotePdfBlob(quote);
        }

        // 2. Upload PDF to server to guarantee the direct document link resolves instantly
        if (pdfBlob) {
            try {
                const base64Data = await window.blobToBase64(pdfBlob);
                const uploadRes = await fetch('/api/upload-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, dataBase64: base64Data })
                });
                const uploadJson = await uploadRes.json();
                if (uploadJson && uploadJson.success && uploadJson.fullUrl) {
                    window._activePdfUrl = uploadJson.fullUrl;
                    if (!shareText.includes(uploadJson.fullUrl) && shareText.includes('/uploads/quotations/')) {
                        shareText = shareText.replace(/https?:\/\/[^\s]+\/uploads\/quotations\/[^\s]+/, uploadJson.fullUrl);
                    }
                }
            } catch (upErr) {
                console.warn('PDF server upload failed, falling back to local origin:', upErr);
            }

            // 3. Trigger local browser download so user has the file immediately available to attach
            const blobUrl = URL.createObjectURL(pdfBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            setTimeout(() => {
                downloadLink.remove();
                URL.revokeObjectURL(blobUrl);
            }, 1500);
        }

        // 4. Copy the message to clipboard
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareText);
            }
        } catch (copyErr) {}

        // 5. Try device native share with binary file if supported (e.g. Android/iOS/modern Web Share API)
        if (pdfBlob && navigator.share && navigator.canShare) {
            try {
                const file = new File([pdfBlob], filename, { type: 'application/pdf' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Invoice ${docId} - STYLO STEEL`,
                        text: shareText
                    });
                    if (window.showStudioToast) window.showStudioToast('✓ Document shared successfully on WhatsApp!');
                    document.getElementById('gogst-whatsapp-share-modal')?.remove();
                    return;
                }
            } catch (shareErr) {
                console.warn('Direct file share declined or not supported, continuing to WhatsApp URL Scheme:', shareErr);
            }
        }

        // 6. Direct WhatsApp URL Scheme
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(shareText)}`;
        if (window.showStudioToast) {
            window.showStudioToast('✓ PDF downloaded & caption copied! WhatsApp opening — attach file to chat.');
        }

        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
            document.getElementById('gogst-whatsapp-share-modal')?.remove();
        }, 350);

    } catch (err) {
        console.error('WhatsApp share error:', err);
        if (window.showStudioToast) window.showStudioToast('Error: ' + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = origBtnHtml;
            if (window.lucide) window.lucide.createIcons();
        }
    }
};

window.openShareQuotationModal = (quoteId) => {
    window.openShareOnWhatsAppModal(quoteId, 'Quotation');
};

// =========================================================================
// --- FEATURE 4: BILL OF MATERIALS (BOM) ENGINE & MODULE ---
// =========================================================================

function parseItemDimensions(it) {
    let w = Number(it.width);
    let h = Number(it.height);
    let u = (it.unit || 'cm').toLowerCase();

    if (!w || !h) {
        const textToSearch = `${it.name || ''} ${it.desc || it.description || ''}`;
        const match = textToSearch.match(/(\d+(?:\.\d+)?)\s*[*xX×]\s*(\d+(?:\.\d+)?)\s*(cm|mm|inch|in|ft|m)?/i);
        if (match) {
            w = parseFloat(match[1]);
            h = parseFloat(match[2]);
            if (match[3]) u = match[3].toLowerCase();
        }
    }

    if (!w || !h) {
        const lower = (it.name || '').toLowerCase();
        if (lower.includes('door') || lower.includes('french')) {
            w = 90; h = 210; u = 'cm';
        } else if (lower.includes('vent')) {
            w = 60; h = 60; u = 'cm';
        } else {
            w = 120; h = 120; u = 'cm';
        }
    }

    // If small values like 4x4 or 6x7 without explicit unit, assume feet
    if (w <= 12 && h <= 12 && (u === 'cm' || !u)) {
        w = w * 30.48;
        h = h * 30.48;
        u = 'cm';
    }

    let factorToMeters = 0.01;
    if (u === 'mm') factorToMeters = 0.001;
    else if (u === 'in' || u === 'inch') factorToMeters = 0.0254;
    else if (u === 'ft') factorToMeters = 0.3048;
    else if (u === 'm') factorToMeters = 1.0;

    const wM = w * factorToMeters;
    const hM = h * factorToMeters;
    const wMm = Math.round(wM * 1000);
    const hMm = Math.round(hM * 1000);

    return { w, h, u, wM, hM, wMm, hMm };
}

window.calculateQuoteBOM = (quote) => {
    if (!quote || !quote.items || quote.items.length === 0) {
        return {
            itemsBOM: [],
            consolidated: [],
            categorySubtotals: {
                'Raw Materials': 0,
                'Hardware': 0,
                'Operations': 0,
                'Consumables': 0,
                'Labor': 0
            },
            grandTotalCost: 0,
            totalWeightKg: 0,
            totalLinearMeters: 0,
            totalComponentsCount: 0
        };
    }

    const itemsBOM = [];
    const consolidatedMap = new Map();

    quote.items.forEach((it, idx) => {
        const itemTitle = formatQuoteItemTitle(it, idx);
        const qty = Number(it.pieces || it.qty || 1);
        const rate = Number(it.rate || it.price || 0);
        const totalAmount = Number(it.total || (qty * rate));
        const dims = parseItemDimensions(it);

        const subComponents = [];

        // Check if service or non-fabricated charge
        const isService = /fixing|labo[u]?r|transport|installation|freight|delivery|service/i.test(it.name || '') || 
                          /fixing|labor|labour|service/i.test(it.desc || '');

        if (isService) {
            subComponents.push({
                category: 'Labor',
                description: it.name || 'Site Installation & Fixing',
                spec: it.desc || 'Site installation, alignment & welding consumables',
                quantity: qty,
                unit: 'Job',
                weightKg: 0,
                unitPrice: rate,
                unitPriceLabel: `₹${rate.toLocaleString()}/Job`,
                totalCost: totalAmount
            });
        } else if (it.bom && it.bom.bomItems && Array.isArray(it.bom.bomItems) && it.bom.bomItems.length > 0) {
            // Pulled directly from authoritative Window Fabrication Costing Engine
            it.bom.bomItems.forEach(item => {
                const scaledQty = Number((item.quantity * qty).toFixed(2));
                const scaledWeight = Number(((item.weightKg || 0) * qty).toFixed(2));
                const scaledCost = Math.round(item.totalCost * qty);

                subComponents.push({
                    category: item.category,
                    description: item.description,
                    spec: item.spec,
                    quantity: scaledQty,
                    unit: item.unit,
                    weightKg: scaledWeight,
                    unitPrice: item.unitPrice,
                    unitPriceLabel: item.unitPriceLabel,
                    totalCost: scaledCost
                });
            });
        } else {
            // Dynamic window calculation from parsed dimensions
            const estBays = it.bays || Math.max(1, Math.min(6, Math.round(dims.wM / 0.50)));
            let fab = null;
            if (typeof window.calculateWindowFabrication === 'function') {
                fab = window.calculateWindowFabrication({
                    width: dims.w,
                    height: dims.h,
                    unit: dims.u,
                    bays: estBays,
                    shuttersCount: estBays,
                    partitions: it.partitions || 0
                });
            }

            if (fab && fab.bomItems && fab.bomItems.length > 0) {
                fab.bomItems.forEach(item => {
                    const scaledQty = Number((item.quantity * qty).toFixed(2));
                    const scaledWeight = Number(((item.weightKg || 0) * qty).toFixed(2));
                    const scaledCost = Math.round(item.totalCost * qty);

                    subComponents.push({
                        category: item.category,
                        description: item.description,
                        spec: item.spec,
                        quantity: scaledQty,
                        unit: item.unit,
                        weightKg: scaledWeight,
                        unitPrice: item.unitPrice,
                        unitPriceLabel: item.unitPriceLabel,
                        totalCost: scaledCost
                    });
                });
            } else {
                // Fallback structured calculation if engine not loaded
                const perimeterPerUnit = 2 * (dims.wM + dims.hM);
                const frameWeight = Number((perimeterPerUnit * 2.9167 * qty).toFixed(2));
                const frameCost = Math.round(frameWeight * 180);
                subComponents.push({
                    category: 'Raw Materials',
                    description: 'Outer Frame Profile (240mm Sheet Benchmark)',
                    spec: `Perimeter: ${perimeterPerUnit.toFixed(2)}m (2 × [${dims.wM.toFixed(2)}m + ${dims.hM.toFixed(2)}m])`,
                    quantity: frameWeight,
                    unit: 'Kg',
                    weightKg: frameWeight,
                    unitPrice: 180,
                    unitPriceLabel: '₹180/Kg',
                    totalCost: frameCost
                });
            }
        }

        const itemTotalCost = subComponents.reduce((sum, c) => sum + c.totalCost, 0);
        const itemTotalWeight = subComponents.reduce((sum, c) => sum + c.weightKg, 0);

        itemsBOM.push({
            index: idx,
            name: it.name,
            title: itemTitle,
            desc: it.desc,
            qty: qty,
            dimensions: dims,
            dimLabel: `${dims.w} x ${dims.h} ${dims.u} (${dims.wMm}x${dims.hMm} mm)`,
            subComponents: subComponents,
            totalCost: itemTotalCost,
            totalWeight: itemTotalWeight
        });

        // Accumulate into consolidated aggregate map
        subComponents.forEach(c => {
            const mapKey = `${c.category}__${c.description}__${c.unit}`;
            if (consolidatedMap.has(mapKey)) {
                const existing = consolidatedMap.get(mapKey);
                existing.quantity = Number((existing.quantity + c.quantity).toFixed(2));
                existing.weightKg = Number((existing.weightKg + c.weightKg).toFixed(2));
                existing.totalCost += c.totalCost;
            } else {
                consolidatedMap.set(mapKey, { ...c });
            }
        });
    });

    const consolidated = Array.from(consolidatedMap.values());
    const categorySubtotals = {
        'Raw Materials': consolidated.filter(c => c.category === 'Raw Materials').reduce((s, c) => s + c.totalCost, 0),
        'Hardware': consolidated.filter(c => c.category === 'Hardware').reduce((s, c) => s + c.totalCost, 0),
        'Operations': consolidated.filter(c => c.category === 'Operations').reduce((s, c) => s + c.totalCost, 0),
        'Consumables': consolidated.filter(c => c.category === 'Consumables').reduce((s, c) => s + c.totalCost, 0),
        'Labor': consolidated.filter(c => c.category === 'Labor').reduce((s, c) => s + c.totalCost, 0)
    };

    const grandTotalCost = consolidated.reduce((sum, c) => sum + c.totalCost, 0);
    const totalWeightKg = consolidated.reduce((sum, c) => sum + c.weightKg, 0);
    const totalLinearMeters = consolidated
        .filter(c => c.unit === 'Mtr' || c.unit === 'm')
        .reduce((sum, c) => sum + c.quantity, 0);

    return {
        itemsBOM,
        consolidated,
        categorySubtotals,
        grandTotalCost,
        totalWeightKg,
        totalLinearMeters,
        totalComponentsCount: consolidated.length
    };
};

function getCategoryBadgeStyle(cat) {
    switch (cat) {
        case 'Raw Materials':
        case 'Profile':
            return 'background: rgba(56, 189, 248, 0.18); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35);';
        case 'Hardware':
            return 'background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);';
        case 'Operations':
            return 'background: rgba(167, 139, 250, 0.18); color: #c084fc; border: 1px solid rgba(167, 139, 250, 0.35);';
        case 'Consumables':
        case 'Finishing':
            return 'background: rgba(236, 72, 153, 0.18); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.35);';
        case 'Labor':
            return 'background: rgba(34, 197, 94, 0.18); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35);';
        default:
            return 'background: rgba(148, 163, 184, 0.18); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.35);';
    }
}

window.openQuoteBOMModal = (quoteId, selectedItemIndex = null) => {
    let existing = document.getElementById('quote-bom-modal');
    if (existing) existing.remove();

    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId);
    if (!quote) return alert('Quotation not found: ' + quoteId);

    const bomData = window.calculateQuoteBOM(quote);
    const selectedItem = selectedItemIndex !== null ? bomData.itemsBOM.find(i => i.index === selectedItemIndex) : null;

    const displayRows = selectedItem ? selectedItem.subComponents : bomData.consolidated;
    const displayTotalCost = selectedItem ? selectedItem.totalCost : bomData.grandTotalCost;
    const displayTotalWeight = selectedItem ? selectedItem.totalWeight : bomData.totalWeightKg;

    const categories = ['Raw Materials', 'Hardware', 'Operations', 'Consumables', 'Labor'];
    const catStyles = {
        'Raw Materials': { badge: 'background: rgba(56, 189, 248, 0.18); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35);', subBg: 'rgba(56, 189, 248, 0.06)', color: '#38bdf8' },
        'Hardware': { badge: 'background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);', subBg: 'rgba(245, 158, 11, 0.06)', color: '#fbbf24' },
        'Operations': { badge: 'background: rgba(167, 139, 250, 0.18); color: #c084fc; border: 1px solid rgba(167, 139, 250, 0.35);', subBg: 'rgba(167, 139, 250, 0.06)', color: '#c084fc' },
        'Consumables': { badge: 'background: rgba(236, 72, 153, 0.18); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.35);', subBg: 'rgba(236, 72, 153, 0.06)', color: '#f472b6' },
        'Labor': { badge: 'background: rgba(34, 197, 94, 0.18); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35);', subBg: 'rgba(34, 197, 94, 0.06)', color: '#4ade80' }
    };

    const modal = document.createElement('div');
    modal.id = 'quote-bom-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(3, 7, 18, 0.88);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        display: flex; align-items: center; justify-content: center; z-index: 100060;
        padding: 1.25rem; font-family: 'Inter', sans-serif;
    `;

    modal.innerHTML = `
        <div style="background: #0b1329; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 16px; width: 100%; max-width: 1240px; height: 90vh; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.9); color: #f8fafc;">
            <!-- Top Header & Actions Bar -->
            <div style="padding: 1.15rem 1.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.85); flex-shrink: 0;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(245, 158, 11, 0.16); border: 1.5px solid #f59e0b; display: flex; align-items: center; justify-content: center; color: #fbbf24;">
                        <i data-lucide="layers" style="width: 22px; height: 22px;"></i>
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #f8fafc;">Bill of Materials (BOM)</h2>
                            <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; font-family: monospace;">${quote.id}</span>
                        </div>
                        <p style="margin: 3px 0 0 0; font-size: 0.8rem; color: #94a3b8;">${quote.customer} • ${quote.date} • Total Quote Value: <strong style="color: #34d399;">₹${Number(quote.amount).toLocaleString('en-IN')}</strong></p>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 10px;">
                    <button type="button" class="btn btn-secondary" id="btn-print-bom" onclick="window.printQuoteBOM('${quote.id}')" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #f8fafc; display: flex; align-items: center; gap: 6px; padding: 0.5rem 1rem; font-size: 0.84rem; font-weight: 600; border-radius: 8px;">
                        <i data-lucide="printer" style="width: 15px; height: 15px; color: #38bdf8;"></i> Print BOM
                    </button>
                    <button type="button" class="btn btn-primary" id="btn-download-bom-pdf" onclick="window.downloadQuoteBOMPDF('${quote.id}')" style="background: linear-gradient(135deg, #0284c7, #2563eb); border: none; color: white; display: flex; align-items: center; gap: 6px; padding: 0.5rem 1.1rem; font-size: 0.84rem; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);">
                        <i data-lucide="download" style="width: 15px; height: 15px;"></i> Download BOM PDF
                    </button>
                    <button type="button" onclick="document.getElementById('quote-bom-modal').remove()" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 1.4rem; padding: 4px 8px; line-height: 1; margin-left: 6px;" onmouseover="this.style.color='#f8fafc'" onmouseout="this.style.color='#94a3b8'">✕</button>
                </div>
            </div>

            <!-- Summary Metric Cards Strip -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding: 1rem 1.75rem; background: rgba(0, 0, 0, 0.25); border-bottom: 1px solid rgba(255, 255, 255, 0.08); flex-shrink: 0;">
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.75rem 1rem;">
                    <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Grand Total Cost</div>
                    <div style="font-size: 1.35rem; font-weight: 800; color: #34d399; margin-top: 2px;">₹ ${Math.round(bomData.grandTotalCost).toLocaleString('en-IN')}</div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.75rem 1rem;">
                    <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Total Raw Material Weight</div>
                    <div style="font-size: 1.35rem; font-weight: 800; color: #38bdf8; margin-top: 2px;">${bomData.totalWeightKg.toFixed(1)} <span style="font-size: 0.85rem; font-weight: 500; color: #94a3b8;">Kg</span></div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.75rem 1rem;">
                    <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Total Profiles & Pipes Length</div>
                    <div style="font-size: 1.35rem; font-weight: 800; color: #a78bfa; margin-top: 2px;">${bomData.totalLinearMeters.toFixed(1)} <span style="font-size: 0.85rem; font-weight: 500; color: #94a3b8;">Meters</span></div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.75rem 1rem;">
                    <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Fabricated Items In Quote</div>
                    <div style="font-size: 1.35rem; font-weight: 800; color: #fbbf24; margin-top: 2px;">${quote.items?.length || 0} <span style="font-size: 0.85rem; font-weight: 500; color: #94a3b8;">Products</span></div>
                </div>
            </div>

            <!-- Master-Detail Body: Left = Consolidated / Filtered Table, Right = Product List -->
            <div style="flex: 1; display: grid; grid-template-columns: 1fr 340px; overflow: hidden;">
                <!-- Left Main Column: Consolidated or Filtered Breakdown Table -->
                <div style="padding: 1.25rem 1.75rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; border-right: 1px solid rgba(255, 255, 255, 0.08);">
                    <!-- Table View Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                                ${selectedItem ? `
                                    <i data-lucide="filter" style="width: 16px; height: 16px; color: #38bdf8;"></i> Product Breakdown: <span style="color: #38bdf8;">${selectedItem.title}</span> (${selectedItem.qty} Units)
                                ` : `
                                    <i data-lucide="layers" style="width: 16px; height: 16px; color: #fbbf24;"></i> Consolidated Bill of Materials Summary
                                `}
                            </h3>
                            <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #94a3b8;">
                                ${selectedItem ? 'Individual sub-components, hardware, hole punching operations, paint & labor tiers' : 'Categorized materials, hardware, operations & labor aggregated across every quotation item'}
                            </p>
                        </div>

                        ${selectedItem ? `
                            <button type="button" class="btn btn-secondary" onclick="window.openQuoteBOMModal('${quote.id}', null)" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; display: flex; align-items: center; gap: 4px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.3);">
                                <i data-lucide="arrow-left" style="width: 13px; height: 13px;"></i> View Consolidated Summary
                            </button>
                        ` : ''}
                    </div>

                    <!-- 6-Column Categorized BOM Table with Category Subtotals -->
                    <div style="border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; overflow: hidden; background: rgba(15, 23, 42, 0.4);">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;" id="quote-bom-table">
                            <thead>
                                <tr style="background: rgba(30, 41, 59, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                    <th style="padding: 10px 12px; text-align: left; width: 130px;">Category</th>
                                    <th style="padding: 10px 14px; text-align: left;">Item Description</th>
                                    <th style="padding: 10px 12px; text-align: right; width: 95px;">Quantity</th>
                                    <th style="padding: 10px 10px; text-align: center; width: 65px;">Unit</th>
                                    <th style="padding: 10px 12px; text-align: right; width: 105px;">Unit Price</th>
                                    <th style="padding: 10px 14px; text-align: right; width: 125px;">Total Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${categories.map(cat => {
                                    const catRows = displayRows.filter(r => r.category === cat);
                                    if (!catRows || catRows.length === 0) return '';
                                    const cStyle = catStyles[cat] || catStyles['Raw Materials'];
                                    const catSubtotal = catRows.reduce((sum, r) => sum + r.totalCost, 0);

                                    const rowsHtml = catRows.map(row => `
                                        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                                            <td style="padding: 10px 12px; vertical-align: top;">
                                                <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; ${cStyle.badge}">
                                                    ${cat}
                                                </span>
                                            </td>
                                            <td style="padding: 10px 14px; vertical-align: top;">
                                                <div style="font-weight: 600; color: #f8fafc; font-size: 0.85rem;">${row.description || row.spec}</div>
                                                ${row.spec && row.spec !== row.description ? `<div style="font-size: 0.73rem; color: #94a3b8; margin-top: 2px;">📐 ${row.spec}</div>` : ''}
                                            </td>
                                            <td style="padding: 10px 12px; text-align: right; vertical-align: top; font-weight: 600; color: #cbd5e1; font-family: monospace;">
                                                ${typeof row.quantity === 'number' ? (row.unit === 'Kg' || row.unit === 'Mtr' || row.unit === 'Ltr' || row.unit === 'Sq.Ft' ? row.quantity.toFixed(2) : row.quantity) : row.quantity}
                                            </td>
                                            <td style="padding: 10px; text-align: center; vertical-align: top;">
                                                <span style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.70rem; font-weight: 700; color: #94a3b8;">
                                                    ${row.unit || 'Nos'}
                                                </span>
                                            </td>
                                            <td style="padding: 10px 12px; text-align: right; vertical-align: top; color: #94a3b8; font-size: 0.8rem;">
                                                ${row.unitPriceLabel || ('₹ ' + row.unitPrice)}
                                            </td>
                                            <td style="padding: 10px 14px; text-align: right; vertical-align: top; font-weight: 700; color: #34d399; font-size: 0.92rem;">
                                                ₹ ${Math.round(row.totalCost).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    `).join('');

                                    const subtotalRowHtml = `
                                        <tr style="background: ${cStyle.subBg}; border-top: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 2px solid rgba(255, 255, 255, 0.12);">
                                            <td colspan="4" style="padding: 8px 12px; font-size: 0.76rem; font-weight: 800; color: ${cStyle.color}; text-transform: uppercase; letter-spacing: 0.6px;">
                                                ↳ Subtotal: ${cat}
                                            </td>
                                            <td style="padding: 8px 12px; text-align: right; font-size: 0.72rem; color: #94a3b8; font-weight: 600;">
                                                ${catRows.length} Line Item${catRows.length > 1 ? 's' : ''}
                                            </td>
                                            <td style="padding: 8px 14px; text-align: right; font-weight: 800; color: ${cStyle.color}; font-size: 0.95rem;">
                                                ₹ ${Math.round(catSubtotal).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    `;

                                    return rowsHtml + subtotalRowHtml;
                                }).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background: rgba(30, 41, 59, 0.9); border-top: 2px solid rgba(255, 255, 255, 0.2); font-weight: 800;">
                                    <td colspan="4" style="padding: 12px 14px; text-align: left; color: #f8fafc; font-size: 0.92rem;">
                                        ${selectedItem ? `Item Grand Total Cost (${selectedItem.qty} Units)` : 'Grand Total Fabrication Cost'}
                                    </td>
                                    <td style="padding: 12px 12px; text-align: right; color: #38bdf8; font-family: monospace; font-size: 0.85rem;">
                                        ${displayTotalWeight > 0 ? displayTotalWeight.toFixed(2) + ' kg' : 'TOTAL'}
                                    </td>
                                    <td style="padding: 12px 14px; text-align: right; color: #34d399; font-size: 1.15rem; font-weight: 900;">
                                        ₹ ${Math.round(displayTotalCost).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- Right Side Panel: Product-Wise Breakdown (Master-Detail) -->
                <div style="background: rgba(15, 23, 42, 0.6); display: flex; flex-direction: column; overflow: hidden;">
                    <div style="padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: rgba(30, 41, 59, 0.4);">
                        <div style="font-size: 0.82rem; font-weight: 700; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: space-between;">
                            <span>Fabricated Items</span>
                            <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 500;">Click to view audit cut-list</span>
                        </div>
                    </div>

                    <div style="flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.65rem;">
                        <!-- Consolidated 'All Products' Master Button -->
                        <div class="bom-product-card" onclick="window.openQuoteBOMModal('${quote.id}', null)" 
                            style="padding: 0.85rem 1rem; border-radius: 10px; cursor: pointer; transition: all 0.18s ease; display: flex; align-items: center; justify-content: space-between; ${selectedItemIndex === null ? 'background: rgba(245, 158, 11, 0.15); border: 1.5px solid #f59e0b; box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);' : 'background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);'}">
                            <div>
                                <div style="font-weight: 700; font-size: 0.88rem; color: ${selectedItemIndex === null ? '#fbbf24' : '#f8fafc'};">
                                    Consolidated Summary
                                </div>
                                <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">All ${quote.items?.length || 0} products aggregated</div>
                            </div>
                            <div style="text-align: right;">
                                <span style="font-size: 0.82rem; font-weight: 800; color: #34d399;">₹ ${Math.round(bomData.grandTotalCost).toLocaleString('en-IN')}</span>
                                <div style="font-size: 0.7rem; color: #38bdf8;">${bomData.totalWeightKg.toFixed(1)} kg</div>
                            </div>
                        </div>

                        <!-- Individual Product Cards -->
                        ${bomData.itemsBOM.map((it) => {
                            const isSelected = selectedItemIndex === it.index;
                            return `
                                <div class="bom-product-card" onclick="window.openQuoteBOMModal('${quote.id}', ${it.index})" 
                                    style="padding: 0.85rem 1rem; border-radius: 10px; cursor: pointer; transition: all 0.18s ease; display: flex; align-items: center; justify-content: space-between; ${isSelected ? 'background: rgba(56, 189, 248, 0.15); border: 1.5px solid #38bdf8; box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);' : 'background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);'}"
                                    onmouseover="if (!${isSelected}) this.style.background='rgba(255,255,255,0.06)'"
                                    onmouseout="if (!${isSelected}) this.style.background='rgba(255,255,255,0.03)'">
                                    <div>
                                        <div style="font-weight: 700; font-size: 0.86rem; color: ${isSelected ? '#38bdf8' : '#f8fafc'}; display: flex; align-items: center; gap: 6px;">
                                            ${it.title}
                                        </div>
                                        <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                                            Qty: <strong style="color: #cbd5e1;">${it.qty}</strong> • ${it.dimensions.wMm}x${it.dimensions.hMm} mm
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 0.84rem; font-weight: 700; color: #34d399;">₹ ${Math.round(it.totalCost).toLocaleString('en-IN')}</div>
                                        <div style="font-size: 0.7rem; color: #94a3b8;">${it.totalWeight.toFixed(1)} kg</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
};

// =========================================================================
// --- BOM PRINT & PDF EXPORT GENERATORS ---
// =========================================================================

window.renderPrintableBOMHTML = (quote) => {
    const bomData = window.calculateQuoteBOM(quote);
    const store = window.Store || Store;
    const settings = store.state.settings || {};
    const company = settings.company || {
        name: 'Stylo Steel Industries',
        address: 'Industrial Estate, Kakkanad, Kochi, Kerala - 682030',
        phone: '+91 9846 123 456',
        taxId: 'GSTIN-123456789'
    };

    const categories = ['Raw Materials', 'Hardware', 'Operations', 'Consumables', 'Labor'];

    return `
        <div id="printable-quotation-bom" style="width: 100%; max-width: 860px; background: white; color: black; padding: 2.5rem; border-radius: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-family: 'Inter', sans-serif;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 2px solid #0284c7; margin-bottom: 1.25rem;">
                <div>
                    <h1 style="margin: 0; font-size: 1.5rem; color: #0f172a; font-weight: 800;">BILL OF MATERIALS (BOM)</h1>
                    <div style="font-size: 0.95rem; font-weight: 700; color: #0284c7; margin-top: 2px;">FABRICATION SPECIFICATION & COST AUDIT SHEET</div>
                    <div style="font-size: 0.82rem; color: #64748b; margin-top: 4px;">Quotation Ref: <strong>${quote.id}</strong> • Date: <strong>${quote.date}</strong></div>
                </div>
                <div style="text-align: right; font-size: 0.82rem; color: #475569;">
                    <div style="font-weight: 700; font-size: 1.1rem; color: #0f172a;">${company.name}</div>
                    <div>${company.address.replace(/\n/g, ', ')}</div>
                    <div>Phone: ${company.phone} | GSTIN: ${company.taxId}</div>
                </div>
            </div>

            <!-- Customer & Project Info -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.85rem 1.25rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Customer / Project Name</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">${quote.customer}</div>
                    <div style="font-size: 0.8rem; color: #475569;">${quote.customerAddress || 'Kerala, India'}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Grand Material & Labor Cost</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: #10b981;">₹ ${Math.round(bomData.grandTotalCost).toLocaleString('en-IN')}</div>
                    <div style="font-size: 0.8rem; color: #0284c7; font-weight: 600;">Total Weight: ${bomData.totalWeightKg.toFixed(1)} Kg</div>
                </div>
            </div>

            <!-- Section 1: Consolidated Categorized Bill of Materials -->
            <div style="margin-bottom: 1.5rem;">
                <h3 style="margin: 0 0 8px 0; font-size: 0.95rem; text-transform: uppercase; color: #0f172a; border-left: 4px solid #0284c7; padding-left: 8px;">
                    1. Consolidated Bill of Materials Breakdown
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 6px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; color: #334155; text-transform: uppercase; font-size: 0.72rem;">
                            <th style="padding: 7px 10px; text-align: left; width: 110px;">Category</th>
                            <th style="padding: 7px 10px; text-align: left;">Item Description</th>
                            <th style="padding: 7px 10px; text-align: right; width: 85px;">Quantity</th>
                            <th style="padding: 7px 10px; text-align: center; width: 60px;">Unit</th>
                            <th style="padding: 7px 10px; text-align: right; width: 95px;">Unit Price</th>
                            <th style="padding: 7px 10px; text-align: right; width: 105px;">Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categories.map(cat => {
                            const catRows = bomData.consolidated.filter(r => r.category === cat);
                            if (!catRows || catRows.length === 0) return '';
                            const subtotal = catRows.reduce((sum, r) => sum + r.totalCost, 0);

                            const rowsHtml = catRows.map((row, i) => `
                                <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                                    <td style="padding: 6px 10px; font-size: 0.74rem; font-weight: 700; color: #475569;">${cat}</td>
                                    <td style="padding: 6px 10px; font-weight: 600; color: #0f172a;">
                                        <div>${row.description || row.spec}</div>
                                        ${row.spec && row.spec !== row.description ? `<div style="font-size: 0.70rem; color: #64748b;">${row.spec}</div>` : ''}
                                    </td>
                                    <td style="padding: 6px 10px; text-align: right; font-family: monospace; font-weight: 600;">
                                        ${typeof row.quantity === 'number' ? (row.unit === 'Kg' || row.unit === 'Mtr' || row.unit === 'Ltr' || row.unit === 'Sq.Ft' ? row.quantity.toFixed(2) : row.quantity) : row.quantity}
                                    </td>
                                    <td style="padding: 6px 10px; text-align: center; font-size: 0.72rem; color: #64748b;">
                                        ${row.unit || 'Nos'}
                                    </td>
                                    <td style="padding: 6px 10px; text-align: right; color: #64748b;">
                                        ${row.unitPriceLabel || ('₹ ' + row.unitPrice)}
                                    </td>
                                    <td style="padding: 6px 10px; text-align: right; font-weight: 700; color: #0f172a;">
                                        ₹ ${Math.round(row.totalCost).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            `).join('');

                            const subtotalHtml = `
                                <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 1.5px solid #94a3b8; font-weight: 700;">
                                    <td colspan="4" style="padding: 6px 10px; font-size: 0.74rem; color: #0284c7; text-transform: uppercase;">
                                        ↳ Subtotal: ${cat}
                                    </td>
                                    <td style="padding: 6px 10px; text-align: right; font-size: 0.70rem; color: #64748b;">
                                        ${catRows.length} Line Items
                                    </td>
                                    <td style="padding: 6px 10px; text-align: right; color: #0f172a; font-size: 0.85rem; font-weight: 800;">
                                        ₹ ${Math.round(subtotal).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            `;

                            return rowsHtml + subtotalHtml;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background: #e2e8f0; font-weight: 800; border-top: 2px solid #94a3b8;">
                            <td colspan="4" style="padding: 8px 10px; text-align: left; color: #0f172a;">GRAND TOTAL FABRICATION ESTIMATE</td>
                            <td style="padding: 8px 10px; text-align: right; color: #64748b;">TOTAL</td>
                            <td style="padding: 8px 10px; text-align: right; color: #10b981; font-size: 0.95rem;">₹ ${Math.round(bomData.grandTotalCost).toLocaleString('en-IN')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <!-- Section 2: Product-Wise Fabrication & Cut-List Breakdown -->
            <div style="margin-bottom: 1.5rem;">
                <h3 style="margin: 0 0 8px 0; font-size: 0.95rem; text-transform: uppercase; color: #0f172a; border-left: 4px solid #10b981; padding-left: 8px;">
                    2. Product-Wise Fabrication & Component Cut-List
                </h3>
                ${bomData.itemsBOM.map((it, idx) => `
                    <div style="margin-bottom: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                        <div style="background: #f1f5f9; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1;">
                            <div style="font-weight: 700; color: #0f172a; font-size: 0.88rem;">
                                ${idx + 1}. ${it.title} <span style="font-weight: 500; color: #475569; font-size: 0.8rem;">(Qty: ${it.qty} Pcs • ${it.dimensions.wMm}x${it.dimensions.hMm} mm)</span>
                            </div>
                            <div style="font-weight: 700; color: #10b981; font-size: 0.85rem;">
                                Material & Labor: ₹ ${Math.round(it.totalCost).toLocaleString('en-IN')} | Weight: ${it.totalWeight.toFixed(1)} kg
                            </div>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
                            <tbody>
                                ${it.subComponents.map(c => `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 5px 10px; width: 18%; font-weight: 700; color: #475569;">${c.category}</td>
                                        <td style="padding: 5px 10px; width: 38%; font-weight: 600; color: #334155;">${c.description}</td>
                                        <td style="padding: 5px 10px; color: #64748b; font-size: 0.73rem;">${c.spec || '-'}</td>
                                        <td style="padding: 5px 10px; text-align: right; width: 12%; font-family: monospace;">${c.quantity} ${c.unit}</td>
                                        <td style="padding: 5px 10px; text-align: right; width: 14%; font-weight: 600;">₹ ${Math.round(c.totalCost).toLocaleString('en-IN')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `).join('')}
            </div>

            <!-- Signatures / Fabrication Approval Footer -->
            <div style="margin-top: 2rem; border-top: 1px solid #cbd5e1; padding-top: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end; font-size: 0.78rem; color: #475569;">
                <div style="text-align: center; width: 150px;">
                    <div style="height: 35px;"></div>
                    <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; font-weight: 600;">Prepared By (Designer)</div>
                </div>
                <div style="text-align: center; width: 150px;">
                    <div style="height: 35px;"></div>
                    <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; font-weight: 600;">Production Manager</div>
                </div>
                <div style="text-align: center; width: 150px;">
                    <div style="height: 35px;"></div>
                    <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; font-weight: 600;">Store / Material Release</div>
                </div>
            </div>
        </div>
    `;
};

window.printQuoteBOM = (quoteId) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId);
    if (!quote) return alert('Quotation not found!');

    let existing = document.getElementById('bom-print-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'bom-print-modal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85);
        z-index: 100095; display: flex; flex-direction: column; align-items: center;
        padding: 2rem; overflow-y: auto; font-family: 'Inter', sans-serif;
    `;

    modal.innerHTML = `
        <div class="no-print" style="width: 100%; max-width: 820px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div style="color: white; font-size: 1rem; font-weight: 600;">
                <i data-lucide="printer" style="vertical-align: middle; margin-right: 6px;"></i> Print BOM — ${quote.id}
            </div>
            <div style="display: flex; gap: 0.6rem; align-items: center;">
                <button class="btn btn-primary" onclick="window.print()" style="background: #10b981; border: none; color: white; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="printer" style="width: 15px;"></i> Print Document
                </button>
                <button class="btn btn-secondary" onclick="window.downloadQuoteBOMPDF('${quote.id}')" style="background: #0284c7; border: 1px solid #0284c7; color: white; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="download" style="width: 15px;"></i> Save PDF
                </button>
                <button class="btn btn-secondary" onclick="document.getElementById('bom-print-modal').remove()">
                    Close
                </button>
            </div>
        </div>
        ${window.renderPrintableBOMHTML(quote)}
    `;

    document.body.appendChild(modal);
    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
        window.print();
    }, 150);
};

window.downloadQuoteBOMPDF = (quoteId) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId);
    if (!quote) return alert('Quotation not found!');

    if (window.showStudioToast) window.showStudioToast(`Generating Bill of Materials PDF for ${quote.id}...`);

    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 800px; background: white;';
    tempContainer.innerHTML = window.renderPrintableBOMHTML(quote);
    document.body.appendChild(tempContainer);

    const el = tempContainer.querySelector('#printable-quotation-bom') || tempContainer;

    if (window.html2pdf) {
        const safeCust = (quote.customer || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
        const opt = {
            margin: [8, 8, 8, 8],
            filename: `BOM_${quote.id}_${safeCust}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        window.html2pdf().set(opt).from(el).save().then(() => {
            tempContainer.remove();
            if (window.showStudioToast) window.showStudioToast(`BOM_${quote.id}_${safeCust}.pdf downloaded successfully!`);
        }).catch(err => {
            console.error('BOM PDF generation error:', err);
            tempContainer.remove();
            window.print();
        });
    } else {
        tempContainer.remove();
        window.print();
    }
};

// =========================================================================
// --- FEATURE 2 (ACTIONS 5, 7, 8): ATTACH FILE, CANCEL & DELETE QUOTE ---
// =========================================================================

window.openAttachFileModal = (quoteId) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId);
    if (!quote) return alert('Quotation not found: ' + quoteId);

    if (!quote.attachments) quote.attachments = [];

    let existing = document.getElementById('quote-attach-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'quote-attach-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(3, 7, 18, 0.85);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        display: flex; align-items: center; justify-content: center; z-index: 100080;
        padding: 1.25rem; font-family: 'Inter', sans-serif;
    `;

    const renderAttachments = () => {
        if (!quote.attachments || quote.attachments.length === 0) {
            return `<div style="text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.85rem;">No files attached yet. Upload drawings or specs below.</div>`;
        }
        return quote.attachments.map((att, idx) => {
            const isImg = att.isImage || (att.type && att.type.startsWith('image/')) || (att.url && (att.url.startsWith('data:image') || /\.(png|jpe?g|webp|svg|gif)$/i.test(att.name)));
            return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 6px; background: rgba(167, 139, 250, 0.15); border: 1px solid #a78bfa; display: flex; align-items: center; justify-content: center; color: #a78bfa; overflow: hidden;">
                        ${isImg ? `
                            <img src="${att.url}" alt="${att.name}" style="width: 100%; height: 100%; object-fit: cover;" />
                        ` : `
                            <i data-lucide="file" style="width: 18px; height: 18px;"></i>
                        `}
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.85rem; color: #f8fafc;">${att.name}</div>
                        <div style="font-size: 0.72rem; color: #94a3b8;">${att.size || '350 KB'} • ${att.date || new Date().toISOString().split('T')[0]}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <a href="${att.url || '#'}" download="${att.name}" target="_blank" style="padding: 4px 8px; font-size: 0.75rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid #38bdf8; border-radius: 4px; text-decoration: none;">Download</a>
                    <button type="button" onclick="window.removeQuoteAttachment('${quote.id}', ${idx})" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px 6px;">✕</button>
                </div>
            </div>
            `;
        }).join('');
    };

    modal.innerHTML = `
        <div style="background: #0b1329; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 16px; width: 100%; max-width: 520px; overflow: hidden; box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.85); color: #f8fafc;">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.8);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(167, 139, 250, 0.15); border: 1px solid #a78bfa; display: flex; align-items: center; justify-content: center; color: #a78bfa;">
                        <i data-lucide="paperclip" style="width: 18px; height: 18px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #f8fafc;">Attached Files & Drawings</h3>
                        <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #94a3b8;">${quote.id} • ${quote.customer}</p>
                    </div>
                </div>
                <button type="button" onclick="document.getElementById('quote-attach-modal').remove()" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 1.3rem; padding: 4px 6px;">✕</button>
            </div>

            <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
                <div style="border: 2px dashed rgba(167, 139, 250, 0.35); border-radius: 12px; padding: 1.75rem 1rem; text-align: center; background: rgba(167, 139, 250, 0.04); cursor: pointer;" onclick="document.getElementById('quote-file-input').click()">
                    <i data-lucide="upload-cloud" style="width: 36px; height: 36px; color: #a78bfa; margin-bottom: 8px;"></i>
                    <div style="font-size: 0.9rem; font-weight: 600; color: #f8fafc;">Click to upload drawings or site files</div>
                    <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">Supports PDF, DWG, DXF, PNG, JPG (up to 25MB)</div>
                    <input type="file" id="quote-file-input" style="display: none;" onchange="window.handleQuoteFileUpload('${quote.id}', this)" />
                </div>

                <div>
                    <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Attached Documents (${quote.attachments.length})</div>
                    <div id="quote-attachments-container">
                        ${renderAttachments()}
                    </div>
                </div>
            </div>

            <div style="padding: 0.9rem 1.5rem; background: rgba(15, 23, 42, 0.6); border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('quote-attach-modal').remove()" style="padding: 0.4rem 1rem; font-size: 0.85rem;">Done</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
};

window.handleQuoteFileUpload = (quoteId, input) => {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId);
    if (!quote) return;
    if (!quote.attachments) quote.attachments = [];

    const sizeStr = file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB';
    
    // Read file as Base64 Data URL for permanent offline/PDF canvas rendering
    const reader = new FileReader();
    reader.onload = (e) => {
        quote.attachments.push({
            name: file.name,
            size: sizeStr,
            date: new Date().toISOString().split('T')[0],
            url: e.target.result,
            isImage: file.type.startsWith('image/')
        });
        store.saveState();
        store.notify();
        window.openAttachFileModal(quoteId);
        if (window.showStudioToast) window.showStudioToast(`Attached "${file.name}" successfully!`);
    };
    reader.readAsDataURL(file);
};

window.removeQuoteAttachment = (quoteId, idx) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId);
    if (!quote || !quote.attachments) return;
    quote.attachments.splice(idx, 1);
    store.saveState();
    store.notify();
    window.openAttachFileModal(quoteId);
    if (window.showStudioToast) window.showStudioToast('Attachment removed.');
};

window.promptCancelQuotation = (quoteId) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId);
    if (!quote) return alert('Quotation not found: ' + quoteId);

    let existing = document.getElementById('cancel-quote-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'cancel-quote-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(3, 7, 18, 0.85);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        display: flex; align-items: center; justify-content: center; z-index: 100090;
        padding: 1.25rem; font-family: 'Inter', sans-serif;
    `;

    modal.innerHTML = `
        <div style="background: #0f172a; border: 1.5px solid rgba(245, 158, 11, 0.4); border-radius: 14px; width: 100%; max-width: 440px; overflow: hidden; box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.85); color: #f8fafc;">
            <div style="padding: 1.75rem 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem;">
                <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); border: 1.5px solid #f59e0b; display: flex; align-items: center; justify-content: center; color: #fbbf24;">
                    <i data-lucide="alert-triangle" style="width: 28px; height: 28px;"></i>
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #f8fafc;">Cancel Quotation ${quote.id}?</h3>
                    <p style="margin: 8px 0 0 0; font-size: 0.84rem; color: #94a3b8; line-height: 1.5;">
                        Are you sure you want to cancel quotation <strong style="color: #f8fafc;">${quote.id}</strong> for <strong style="color: #f8fafc;">${quote.customer}</strong>? 
                        <br><span style="color: #fbbf24; font-weight: 500;">The status will be updated to 'Cancelled' and active follow-ups will be stopped.</span>
                    </p>
                </div>
                <div style="display: flex; gap: 0.75rem; width: 100%; margin-top: 0.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('cancel-quote-modal').remove()" style="flex: 1; padding: 0.6rem 1rem;">
                        Keep Active
                    </button>
                    <button type="button" class="btn" onclick="window.confirmCancelQuotation('${quote.id}')" style="flex: 1; padding: 0.6rem 1rem; background: #d97706; border: 1px solid #f59e0b; color: white; font-weight: 600;">
                        Yes, Cancel Quote
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
};

window.confirmCancelQuotation = (quoteId) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId);
    if (quote) {
        quote.status = 'Cancelled';
        store.saveState();
        store.notify();
        document.getElementById('cancel-quote-modal')?.remove();
        if (window.showStudioToast) window.showStudioToast(`Quotation ${quoteId} marked as Cancelled.`);
    }
};

window.promptDeleteQuotation = (quoteId) => {
    const store = window.Store || Store;
    const quote = (store.state.quotations || []).find(q => q.id === quoteId);
    if (!quote) return alert('Quotation not found: ' + quoteId);

    let existing = document.getElementById('delete-quote-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'delete-quote-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(3, 7, 18, 0.88);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        display: flex; align-items: center; justify-content: center; z-index: 100090;
        padding: 1.25rem; font-family: 'Inter', sans-serif;
    `;

    modal.innerHTML = `
        <div style="background: #0f172a; border: 1.5px solid rgba(239, 68, 68, 0.4); border-radius: 14px; width: 100%; max-width: 440px; overflow: hidden; box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.85); color: #f8fafc;">
            <div style="padding: 1.75rem 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem;">
                <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 1.5px solid #ef4444; display: flex; align-items: center; justify-content: center; color: #ef4444;">
                    <i data-lucide="trash-2" style="width: 28px; height: 28px;"></i>
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #f8fafc;">Permanently Delete Quotation?</h3>
                    <p style="margin: 8px 0 0 0; font-size: 0.84rem; color: #94a3b8; line-height: 1.5;">
                        Are you sure you want to permanently delete <strong style="color: #ef4444;">${quote.id}</strong> (${quote.customer} — ₹${Number(quote.amount).toLocaleString('en-IN')})?
                        <br><span style="color: #fca5a5; font-size: 0.78rem;">⚠️ WARNING: This destructive action cannot be undone. All item specifications and pricing records for this quote will be permanently removed.</span>
                    </p>
                </div>
                <div style="display: flex; gap: 0.75rem; width: 100%; margin-top: 0.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('delete-quote-modal').remove()" style="flex: 1; padding: 0.6rem 1rem;">
                        Cancel
                    </button>
                    <button type="button" class="btn" onclick="window.confirmDeleteQuotation('${quote.id}')" style="flex: 1; padding: 0.6rem 1rem; background: #dc2626; border: 1px solid #ef4444; color: white; font-weight: 600;">
                        Yes, Delete Quote
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
};

window.confirmDeleteQuotation = (quoteId) => {
    const store = window.Store || Store;
    const qList = store.state.quotations || [];
    const idx = qList.findIndex(q => q.id === quoteId);
    if (idx !== -1) {
        qList.splice(idx, 1);
        store.saveState();
        store.notify();
        document.getElementById('delete-quote-modal')?.remove();
        if (window.showStudioToast) window.showStudioToast(`Quotation ${quoteId} permanently deleted.`);
    }
};


