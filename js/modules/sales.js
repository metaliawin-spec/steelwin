import { Store } from '../store.js';

// --- HELPERS ---

function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    num = Math.round(Number(num) || 0);
    if (num === 0) return 'Zero';
    if (num > 999999999) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return 'Zero'; var str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only ' : '';
    return str || 'Zero';
}

// --- STATE ---

let invoiceState = {
    customer: { name: '', address: '', contact: '', phone: '', gstin: '', revCharge: 'No', shipTo: '-', placeOfSupply: '' },
    customerId: '',
    details: {
        type: 'Tax Invoice',
        invPrefix: 'INV-', invNo: '1305', invPost: '',
        challanNo: '', buyerOrderNo: '', lrNo: '', destination: '', motorVehicleNo: '',
        date: new Date().toISOString().split('T')[0], challanDate: '', termsOfPayment: '', eWayNo: '', delivery: ''
    },
    items: [
        { id: 1, name: '', description: '', hsn: '7610', qty: 1, uom: 'pcs', price: 0, total: 0 }
    ],
    summary: {
        subtotalGross: 0,
        discount: { value: 0, isPercent: false },
        discountAmount: 0,
        taxableBase: 0,
        cgst: 0,
        sgst: 0,
        totalTax: 0,
        roundOff: true,
        grandTotal: 0,
        advanceEnabled: false,
        availableAdvancePool: 0,
        advancePayment: 0,
        residualAdvance: 0,
        balanceDue: 0
    },
    footer: {
        dueDate: '', bank: '', title: 'Declaration',
        detail: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
        notes: '',
        paymentType: 'CREDIT' // CREDIT, CASH, BANK_TRANSFER, CHEQUE
    },
    printOptions: {
        showLogoHeader: true,
        showBankDetails: true
    }
};

window.invoiceState = invoiceState;
window.getInvoiceState = () => invoiceState;

// --- ACTIONS ---

window.initCreateInvoice = () => {
    const store = window.Store || Store;
    if (store) {
        store.state.salesView = 'create';
        // Fresh invoice state
        invoiceState = {
            customer: { name: '', address: '', contact: '', phone: '', gstin: '', revCharge: 'No', shipTo: '-', placeOfSupply: '' },
            customerId: '',
            details: {
                type: 'Tax Invoice',
                invPrefix: 'INV-' + new Date().getFullYear() + '-', invNo: String(Math.floor(1000 + Math.random() * 9000)), invPost: '',
                challanNo: '', buyerOrderNo: '', lrNo: '', destination: '', motorVehicleNo: '',
                date: new Date().toISOString().split('T')[0], challanDate: '', termsOfPayment: '', eWayNo: '', delivery: ''
            },
            items: [
                { id: 1, name: '', description: '', hsn: '7610', qty: 1, uom: 'pcs', price: 0, total: 0 }
            ],
            summary: {
                subtotalGross: 0,
                discount: { value: 0, isPercent: false },
                discountAmount: 0,
                taxableBase: 0,
                cgst: 0,
                sgst: 0,
                totalTax: 0,
                roundOff: true,
                grandTotal: 0,
                advanceEnabled: false,
                availableAdvancePool: 0,
                advancePayment: 0,
                residualAdvance: 0,
                balanceDue: 0
            },
            footer: {
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                bank: 'HDFC', title: 'Declaration',
                detail: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
                notes: '',
                paymentType: 'CREDIT'
            },
            printOptions: {
                showLogoHeader: true,
                showBankDetails: true
            }
        };
        window.invoiceState = invoiceState;
        store.notify();
    }
};

window.backToSales = () => {
    const store = window.Store || Store;
    if (store) {
        store.state.salesView = 'list';
        store.notify();
    }
};

// Customer Selection & Unallocated Advance Detection
window.selectInvCustomer = (nameOrId) => {
    const store = window.Store || Store;
    let cust = null;
    if (typeof nameOrId === 'object' && nameOrId !== null) {
        cust = nameOrId;
    } else {
        const all = (window.UniversalCustomerSearch && window.UniversalCustomerSearch.getAllCustomers()) || (store && store.state && store.state.customers) || [];
        const q = String(nameOrId).trim().toLowerCase();
        cust = all.find(c => (c.id && c.id.toLowerCase() === q) || (c.name && c.name.trim().toLowerCase() === q));
    }

    if (cust) {
        invoiceState.customer.name = cust.name;
        invoiceState.customerId = cust.id;
        invoiceState.customer.address = cust.address || '';
        invoiceState.customer.phone = cust.mobile || cust.phone || '';
        const pool = Number(cust.advanceBalance) || 0;
        invoiceState.summary.availableAdvancePool = pool;
        invoiceState.summary.advanceEnabled = pool > 0;
        if (pool > 0) {
            // Pre-fill applied advance up to pool (can be overridden manually)
            invoiceState.summary.advancePayment = pool;
        } else {
            invoiceState.summary.advancePayment = 0;
        }
    } else {
        invoiceState.customer.name = typeof nameOrId === 'string' ? nameOrId : '';
        invoiceState.customerId = '';
        invoiceState.summary.availableAdvancePool = 0;
        invoiceState.summary.advancePayment = 0;
    }
    window.calculateInvTotals();
    window.renderInvoiceForm();
};

window.applyInvAdvance = (amount, e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    invoiceState.summary.advancePayment = parseFloat(amount) || 0;
    invoiceState.summary.advanceEnabled = true;
    window.calculateInvTotals(true);
};

window.applyInvAdvancePreset = (preset, e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    const pool = Number(invoiceState.summary.availableAdvancePool) || 0;
    const grandTotal = Number(invoiceState.summary.grandTotal) || 0;

    if (preset === 'full') {
        invoiceState.summary.advancePayment = Math.min(pool, grandTotal > 0 ? grandTotal : pool);
    } else if (preset === 'half') {
        invoiceState.summary.advancePayment = Math.round(pool / 2);
    } else if (preset === 'clear') {
        invoiceState.summary.advancePayment = 0;
    }
    invoiceState.summary.advanceEnabled = true;
    window.calculateInvTotals(true);
};

window.updateInvAdvancePayment = (val, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    invoiceState.summary.advancePayment = parseFloat(val) || 0;
    invoiceState.summary.advanceEnabled = true;
    window.calculateInvTotals(true);
};

window.updateInvPrintOption = (option, checked) => {
    invoiceState.printOptions[option] = checked;
};

window.updateInvCustomer = (field, value) => {
    invoiceState.customer[field] = value;
    window.renderInvoiceForm();
};

window.updateInvDetails = (field, value) => {
    invoiceState.details[field] = value;
    window.renderInvoiceForm();
};

window.updateInvFooter = (field, value) => {
    invoiceState.footer[field] = value;
    window.renderInvoiceForm();
};

window.setPaymentType = (type, e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    invoiceState.footer.paymentType = type;
    window.calculateInvTotals(true);

    ['CREDIT', 'CASH', 'BANK_TRANSFER', 'CHEQUE'].forEach(t => {
        const btn = document.getElementById(`paymode-btn-${t}`);
        if (btn) {
            const isActive = t === type;
            btn.style.background = isActive ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)';
            btn.style.borderColor = isActive ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.12)';
            btn.style.color = isActive ? '#ffffff' : '#94a3b8';
        }
    });
};

// Item Actions
window.addInvItem = () => {
    invoiceState.items.push({
        id: Date.now(), name: '', description: '', hsn: '7610', qty: 1, uom: 'pcs', price: 0, total: 0
    });
    window.calculateInvTotals();
};

window.removeInvItem = (index) => {
    if (invoiceState.items.length > 1) {
        invoiceState.items.splice(index, 1);
        window.calculateInvTotals();
    }
};

window.updateInvItem = (index, field, value) => {
    invoiceState.items[index][field] = value;
    window.calculateInvTotals();
};

window.toggleInvAdvanceCard = (enabled, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    invoiceState.summary.advanceEnabled = !!enabled;
    if (!enabled) {
        invoiceState.summary.advancePayment = 0;
    } else {
        const pool = Number(invoiceState.summary.availableAdvancePool) || 0;
        const grandTotal = Number(invoiceState.summary.grandTotal) || 0;
        if (pool > 0 && !invoiceState.summary.advancePayment) {
            invoiceState.summary.advancePayment = Math.min(pool, grandTotal > 0 ? grandTotal : pool);
        }
    }
    window.calculateInvTotals(false);
};

window.updateInvDiscount = (value, isPercent = null) => {
    if (value !== undefined && value !== null) invoiceState.summary.discount.value = parseFloat(value) || 0;
    if (isPercent !== null) invoiceState.summary.discount.isPercent = isPercent;
    window.calculateInvTotals();
};

window.calculateInvTotals = (inPlaceUpdate = false) => {
    let grossTotal = 0;

    invoiceState.items.forEach(item => {
        const qty = parseFloat(item.qty) || 0;
        const price = parseFloat(item.price) || 0; // Rate (Inclusive of Tax)
        item.total = qty * price;
        grossTotal += item.total;
    });

    // Single consolidated footer discount
    const discVal = parseFloat(invoiceState.summary.discount.value) || 0;
    const discAmount = invoiceState.summary.discount.isPercent
        ? (grossTotal * discVal / 100)
        : discVal;

    const netAfterDiscount = Math.max(0, grossTotal - discAmount);

    // Dynamic 18% GST Slab Breakout from Tax-Inclusive Total:
    // Taxable Base = Net Total / 1.18
    const taxableBase = netAfterDiscount / 1.18;
    const totalTax = netAfterDiscount - taxableBase;
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const finalTotal = Math.round(netAfterDiscount);

    // Customer unallocated advance pool
    const store = window.Store || Store;
    const customers = (store && store.state && store.state.customers) || [];
    const cust = customers.find(c => 
        (invoiceState.customerId && c.id === invoiceState.customerId) || 
        (c.name && c.name.toLowerCase() === (invoiceState.customer.name || '').trim().toLowerCase())
    );
    const availablePool = cust ? (Number(cust.advanceBalance) || 0) : (Number(invoiceState.summary.availableAdvancePool) || 0);
    invoiceState.summary.availableAdvancePool = availablePool;

    const advanceEnabled = !!invoiceState.summary.advanceEnabled;
    const appliedAdvance = advanceEnabled ? (parseFloat(invoiceState.summary.advancePayment) || 0) : 0;
    
    // Partial allocation: calculate residual remaining in customer wallet
    const residualAdvance = availablePool > 0 ? Math.max(0, availablePool - appliedAdvance) : 0;

    // Net Balance Due = Invoice Total - Applied Advance
    const balanceDue = Math.max(0, finalTotal - appliedAdvance);

    invoiceState.summary.subtotalGross = grossTotal;
    invoiceState.summary.discountAmount = discAmount;
    invoiceState.summary.taxableBase = taxableBase;
    invoiceState.summary.cgst = cgst;
    invoiceState.summary.sgst = sgst;
    invoiceState.summary.totalTax = totalTax;
    invoiceState.summary.grandTotal = finalTotal;
    invoiceState.summary.advancePayment = appliedAdvance;
    invoiceState.summary.residualAdvance = residualAdvance;
    invoiceState.summary.balanceDue = balanceDue;

    if (inPlaceUpdate) {
        window.updateSummaryDOMOnly();
    } else {
        window.renderInvoiceForm();
    }
};

window.updateSummaryDOMOnly = () => {
    const s = invoiceState;

    const grossEl = document.getElementById('summary-gross-val');
    if (grossEl) grossEl.innerText = `₹${(s.summary.subtotalGross || 0).toFixed(2)}`;

    const discEl = document.getElementById('summary-discount-val');
    if (discEl) discEl.innerText = `- ₹${(s.summary.discountAmount || 0).toFixed(2)}`;

    const subtotalEl = document.getElementById('summary-subtotal-val');
    if (subtotalEl) subtotalEl.innerText = `₹${(s.summary.grandTotal || 0).toFixed(2)}`;

    const taxableEl = document.getElementById('summary-taxable-val');
    if (taxableEl) taxableEl.innerText = `₹${(s.summary.taxableBase || 0).toFixed(2)}`;

    const cgstEl = document.getElementById('summary-cgst-val');
    if (cgstEl) cgstEl.innerText = `₹${(s.summary.cgst || 0).toFixed(2)}`;

    const sgstEl = document.getElementById('summary-sgst-val');
    if (sgstEl) sgstEl.innerText = `₹${(s.summary.sgst || 0).toFixed(2)}`;

    const totalTaxEl = document.getElementById('summary-totaltax-val');
    if (totalTaxEl) totalTaxEl.innerText = `₹${(s.summary.totalTax || 0).toFixed(2)}`;

    const grandTotalEl = document.getElementById('summary-grandtotal-val');
    if (grandTotalEl) grandTotalEl.innerText = `₹${(s.summary.grandTotal || 0).toFixed(2)}`;

    const poolEl = document.getElementById('summary-available-pool-badge');
    if (poolEl) {
        const pool = Number(s.summary.availableAdvancePool) || 0;
        poolEl.innerText = `Available Advance: ₹${pool.toLocaleString('en-IN')}`;
        poolEl.style.color = pool > 0 ? '#34d399' : '#94a3b8';
    }

    const appliedInput = document.getElementById('applied-advance-input');
    if (appliedInput && document.activeElement !== appliedInput) {
        appliedInput.value = s.summary.advancePayment ? s.summary.advancePayment : '';
    }

    const residualBox = document.getElementById('summary-residual-wallet-box');
    const residualEl = document.getElementById('summary-residual-val');
    if (residualEl) {
        residualEl.innerText = `₹${(s.summary.residualAdvance || 0).toLocaleString('en-IN')} remaining`;
    }
    if (residualBox) {
        residualBox.style.display = (s.summary.availableAdvancePool > 0 && s.summary.advanceEnabled) ? 'flex' : 'none';
    }

    const balanceEl = document.getElementById('summary-balance-val');
    if (balanceEl) balanceEl.innerText = `₹${(s.summary.balanceDue || 0).toFixed(2)}`;

    const balanceCard = document.getElementById('summary-balance-due-card');
    const balanceLabel = document.getElementById('summary-balance-label');
    const noticeEl = document.getElementById('summary-receivable-notice');

    const isCredit = s.footer.paymentType === 'CREDIT';
    const isZero = s.summary.balanceDue === 0;

    if (balanceCard) {
        balanceCard.style.background = isZero ? 'rgba(16, 185, 129, 0.2)' : (isCredit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)');
        balanceCard.style.borderColor = isZero ? 'rgba(16, 185, 129, 0.4)' : (isCredit ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)');
    }
    if (balanceLabel) {
        balanceLabel.style.color = isZero ? '#34d399' : (isCredit ? '#fca5a5' : '#fbbf24');
    }
    if (balanceEl) {
        balanceEl.style.color = isZero ? '#34d399' : (isCredit ? '#ef4444' : '#fbbf24');
    }
    if (noticeEl) {
        noticeEl.innerText = isZero ? '✓ Fully settled with advance credit' : (isCredit ? '⚡ Will be routed to Accounts Receivable' : 'Due by maturity date');
        noticeEl.style.color = isCredit && !isZero ? '#f87171' : '#94a3b8';
    }

    const wordsEl = document.getElementById('summary-words-val');
    if (wordsEl) wordsEl.innerText = `${numberToWords(s.summary.grandTotal)} RUPEES ONLY`;
};

window.saveInvoice = (andPrint = false) => {
    const store = window.Store || Store;
    if (!invoiceState.customer.name) return alert('Please enter customer name');

    const appliedAdvance = parseFloat(invoiceState.summary.advancePayment) || 0;
    const grandTotal = invoiceState.summary.grandTotal;
    const balanceDue = invoiceState.summary.balanceDue;
    const paymentMode = invoiceState.footer.paymentType || 'CREDIT';

    // 1. Deduct applied advance amount from customer's total advance pool in the database
    if (appliedAdvance > 0) {
        store.deductCustomerAdvance(invoiceState.customerId || invoiceState.customer.name, appliedAdvance);
    }

    // 2. Customer accounts receivable update if credit or balance due
    const cust = (store.state.customers || []).find(c => 
        (invoiceState.customerId && c.id === invoiceState.customerId) || 
        (c.name && c.name.toLowerCase() === invoiceState.customer.name.trim().toLowerCase())
    );

    if (cust) {
        cust.totalValue = (Number(cust.totalValue) || 0) + grandTotal;
        if (balanceDue > 0 && paymentMode === 'CREDIT') {
            cust.outstandingBalance = (Number(cust.outstandingBalance) || 0) + balanceDue;
        }
    }

    // 3. Post to Accounts Receivable / Customer Financial Ledger
    if (!store.state.customerLedger) store.state.customerLedger = [];
    const invoiceId = `${invoiceState.details.invPrefix}${invoiceState.details.invNo}${invoiceState.details.invPost || ''}`;
    
    store.state.customerLedger.unshift({
        id: `LED-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        invoiceId: invoiceId,
        customerId: cust ? cust.id : (invoiceState.customerId || 'CUST-GEN'),
        customerName: invoiceState.customer.name,
        date: invoiceState.details.date,
        type: 'INVOICE_BILLING',
        paymentMode: paymentMode,
        invoiceTotal: grandTotal,
        advanceApplied: appliedAdvance,
        balanceDue: balanceDue,
        accountsReceivable: paymentMode === 'CREDIT' ? balanceDue : 0,
        particulars: `Tax Invoice ${invoiceId} - ${paymentMode === 'CREDIT' ? `₹${balanceDue.toLocaleString('en-IN')} routed to Accounts Receivable` : `Settled via ${paymentMode}`}`,
        timestamp: new Date().toISOString()
    });

    const newInvoice = {
        id: invoiceId,
        customer: invoiceState.customer.name,
        customerId: invoiceState.customerId || (cust ? cust.id : ''),
        date: invoiceState.details.date,
        dueDate: invoiceState.footer.dueDate || invoiceState.details.date,
        items: invoiceState.items.map(i => `${i.name || 'Item'} (${i.qty})`).join(', '),
        amount: grandTotal,
        advancePayment: appliedAdvance,
        residualAdvance: invoiceState.summary.residualAdvance || 0,
        balance: balanceDue,
        paymentType: paymentMode,
        status: balanceDue === 0 ? 'Paid' : (appliedAdvance > 0 ? (paymentMode === 'CREDIT' ? 'Credit (Partial Advance)' : 'Partially Paid') : (paymentMode === 'CREDIT' ? 'Credit Outstanding' : (paymentMode === 'ONLINE' || paymentMode === 'BANK_TRANSFER' ? 'Paid' : 'Pending'))),
        fullData: JSON.parse(JSON.stringify(invoiceState))
    };

    if (!store.state.sales) store.state.sales = [];
    store.state.sales.unshift(newInvoice);
    store.state.salesView = 'list';
    if (typeof store.saveState === 'function') store.saveState();
    store.notify();

    if (andPrint) {
        window.openPrintInvoiceModal(newInvoice.fullData);
    } else {
        alert(`Invoice ${newInvoice.id} saved successfully! ${paymentMode === 'CREDIT' && balanceDue > 0 ? `Net balance of ₹${balanceDue.toLocaleString('en-IN')} routed to Accounts Receivable.` : ''}`);
    }
};

// --- RENDERER ---

export function renderSales(state) {
    if (state.salesView === 'create') {
        const wrapper = document.createElement('div');
        wrapper.id = 'invoice-form-wrapper';
        wrapper.className = 'animate-fade-in';
        wrapper.style.paddingBottom = '100px';

        setTimeout(() => window.renderInvoiceForm(), 0);
        return wrapper;
    }

    const store = window.Store || Store;
    if (!store.state.sales) store.state.sales = [];

    const sales = store.state.sales || [];

    // Backward compatibility helper - delegates to dedicated sales_return module if available
    window.openNewSalesReturnModal = () => {
        if (typeof window.openDedicatedSalesReturnModal === 'function') {
            window.openDedicatedSalesReturnModal();
        } else if (typeof window.navigate === 'function') {
            window.navigate('sales_return');
            setTimeout(() => {
                if (typeof window.openNewSalesReturnModal === 'function') window.openNewSalesReturnModal();
            }, 50);
        }
    };

    // PRIMARY SALES INVOICE GRID (Decoupled from Sales Return)
    const container = document.createElement('div');
    container.className = 'sales-view animate-fade-in';
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 style="margin: 0; font-size: 1.8rem; font-weight: 800; color: #f8fafc;">Sales & Invoicing</h1>
                <p style="color: var(--color-text-muted); margin: 3px 0 0; font-size: 0.88rem;">Track direct sales, 18% GST tax invoices, advance payments, and accounts receivable.</p>
            </div>
            <div style="display: flex; gap: 0.75rem;">
                <button type="button" class="btn btn-primary" onclick="window.initCreateInvoice()" style="display: inline-flex; align-items: center; gap: 6px; padding: 0.65rem 1.35rem; font-weight: 700;">
                    <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Create Sale Invoice
                </button>
            </div>
        </div>

        <div class="glass-panel" style="overflow: hidden; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: rgba(0,0,0,0.25); border-bottom: 1px solid var(--glass-border);">
                    <tr>
                        <th style="padding: 1rem; text-align: left; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Invoice #</th>
                        <th style="padding: 1rem; text-align: left; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Customer</th>
                        <th style="padding: 1rem; text-align: left; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Date</th>
                        <th style="padding: 1rem; text-align: right; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Amount (₹)</th>
                        <th style="padding: 1rem; text-align: right; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Advance Paid (₹)</th>
                        <th style="padding: 1rem; text-align: right; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Balance Due (₹)</th>
                        <th style="padding: 1rem; text-align: center; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Status</th>
                        <th style="padding: 1rem; text-align: center; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${sales.map(s => `
                        <tr style="border-bottom: 1px solid var(--glass-border-subtle); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                            <td style="padding: 1rem; color: var(--color-primary); font-weight: 600; font-family: monospace;">${s.id}</td>
                            <td style="padding: 1rem; font-weight: 600; color: var(--color-text-heading);">${s.customer}</td>
                            <td style="padding: 1rem; color: var(--color-text-muted); font-size: 0.85rem;">${s.date}</td>
                            <td style="padding: 1rem; text-align: right; font-weight: 700; color: #f8fafc; font-family: monospace;">₹ ${Number(s.amount).toLocaleString('en-IN')}</td>
                            <td style="padding: 1rem; text-align: right; font-weight: 700; color: #10b981; font-family: monospace;">₹ ${(s.advancePayment || 0).toLocaleString('en-IN')}</td>
                            <td style="padding: 1rem; text-align: right; font-weight: 800; font-family: monospace; color: ${s.balance > 0 ? (s.paymentType === 'CREDIT' ? '#f87171' : '#fbbf24') : '#10b981'};">
                                ₹ ${(s.balance !== undefined ? s.balance : s.amount).toLocaleString('en-IN')}
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <span style="background: ${s.balance > 0 ? (s.paymentType === 'CREDIT' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)') : 'rgba(50, 200, 100, 0.2)'}; color: ${s.balance > 0 ? (s.paymentType === 'CREDIT' ? '#f87171' : '#fbbf24') : 'var(--color-success)'}; padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;">
                                    ${s.status}
                                </span>
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <button type="button" class="btn btn-secondary" onclick="window.openPrintInvoiceModalById('${s.id}')" style="padding: 0.35rem 0.65rem;" title="Print Invoice">
                                    <i data-lucide="printer" style="width: 15px; height: 15px;"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                    ${sales.length === 0 ? '<tr><td colspan="8" style="padding: 3rem; text-align: center; color: var(--color-text-muted);">No sales invoices recorded yet. Click "Create Sale Invoice" to start billing.</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
    return container;
}

window.openPrintInvoiceModalById = (id) => {
    const store = window.Store || Store;
    const inv = (store.state.sales || []).find(s => s.id === id);
    if (!inv) return alert('Invoice not found!');
    window.openPrintInvoiceModal(inv.fullData || inv);
};

// --- FORM RENDERER ---
window.renderInvoiceForm = () => {
    const el = document.getElementById('invoice-form-wrapper');
    if (!el) return;

    const mainView = document.getElementById('main-view');
    const prevScroll = mainView ? mainView.scrollTop : window.scrollY;

    const s = invoiceState;
    const store = window.Store || Store;
    const customers = store.state.customers || [];

    // Find available advance balance for selected customer
    const selectedCust = customers.find(c => 
        (s.customerId && c.id === s.customerId) || 
        (c.name && c.name.toLowerCase() === (s.customer.name || '').trim().toLowerCase())
    );
    const availableAdvance = selectedCust ? (selectedCust.advanceBalance || 0) : (Number(s.summary.availableAdvancePool) || 0);
    s.summary.availableAdvancePool = availableAdvance;

    const btnStyle = (type) => `
        flex: 1; padding: 0.55rem; text-align: center; cursor: pointer; border-radius: 6px;
        background: ${s.footer.paymentType === type ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)'};
        border: 1px solid ${s.footer.paymentType === type ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.12)'};
        color: ${s.footer.paymentType === type ? '#ffffff' : '#94a3b8'};
        font-weight: 600; font-size: 0.82rem; transition: all 0.2s;
    `;

    el.innerHTML = `
        <!-- Top Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <button onclick="window.backToSales()" class="btn btn-secondary" style="padding: 0.45rem 0.8rem; cursor: pointer;">
                    <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
                </button>
                <div>
                    <h2 style="margin: 0; font-size: 1.5rem; color: #f8fafc; font-weight: 700;">Create Sale Invoice</h2>
                    <p style="margin: 2px 0 0; font-size: 0.82rem; color: #94a3b8;">Issue GST tax invoice with dynamic 18% GST breakout, consolidated discount, and advance payment.</p>
                </div>
            </div>
            <div style="display: flex; gap: 0.75rem;">
                <button onclick="window.initCreateInvoice()" class="btn btn-secondary">
                    <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> Reset Form
                </button>
            </div>
        </div>

        <!-- Upper Section Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            
            <!-- Left: Customer Info -->
            <div class="glass-panel" style="padding: 1.5rem; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-lg); color: var(--color-text-main); box-shadow: 0 8px 32px rgba(0,0,0,0.36);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem;">
                    <h4 style="margin: 0; color: #f8fafc; font-size: 1.05rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="user" style="color: var(--color-primary); width: 18px; height: 18px;"></i> Customer Information
                    </h4>
                    ${availableAdvance > 0 ? `
                        <span style="font-size: 0.8rem; color: #10b981; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 2px 8px; border-radius: 4px;">
                            <i data-lucide="sparkles" style="width: 12px; height: 12px;"></i> Advance: ₹${availableAdvance.toLocaleString()}
                        </span>
                    ` : ''}
                </div>
                
                <div style="display: grid; gap: 0.85rem;">
                    <div style="display: grid; grid-template-columns: 125px 1fr; align-items: center;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">M/S. (Client)*</label>
                        <div style="width: 100%;">
                            ${window.UniversalCustomerSearch ? window.UniversalCustomerSearch.renderHTML({
                                id: 'sales-customer-search',
                                label: '',
                                value: s.customer.name,
                                placeholder: 'Please select a customer name',
                                infoTooltip: 'Search verified clients, leads, and price calculation contacts'
                            }) : `<input type="text" value="${s.customer.name}" oninput="window.selectInvCustomer(this.value)" class="glass-input" style="width: 100%;">`}
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 125px 1fr; align-items: start;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500; margin-top: 0.5rem;">Address</label>
                        <textarea onchange="window.updateInvCustomer('address', this.value)" class="glass-input" style="width: 100%; height: 60px; background: rgba(255, 255, 255, 0.06); color: #f8fafc; resize: none; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;" placeholder="Client billing address">${s.customer.address}</textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 125px 1fr; align-items: center;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Contact Person</label>
                        <input type="text" value="${s.customer.contact}" onchange="window.updateInvCustomer('contact', this.value)" placeholder="Contact Person" class="glass-input" style="width: 100%; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                    </div>
                     <div style="display: grid; grid-template-columns: 125px 1fr; align-items: center;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Phone No</label>
                        <input type="text" value="${s.customer.phone}" onchange="window.updateInvCustomer('phone', this.value)" placeholder="Phone No" class="glass-input" style="width: 100%; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                    </div>
                    <div style="display: grid; grid-template-columns: 125px 1fr; align-items: center;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">GSTIN / PAN</label>
                        <input type="text" value="${s.customer.gstin}" onchange="window.updateInvCustomer('gstin', this.value)" placeholder="GSTIN or PAN" class="glass-input" style="width: 100%; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                    </div>
                    <div style="display: grid; grid-template-columns: 125px 1fr; align-items: center;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Rev. Charge</label>
                         <select onchange="window.updateInvCustomer('revCharge', this.value)" class="glass-input" style="width: 100%; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                            <option value="No" ${s.customer.revCharge === 'No' ? 'selected' : ''}>No</option>
                            <option value="Yes" ${s.customer.revCharge === 'Yes' ? 'selected' : ''}>Yes</option>
                        </select>
                    </div>
                     <div style="display: grid; grid-template-columns: 125px 1fr; align-items: center;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Ship To</label>
                        <input type="text" value="${s.customer.shipTo}" onchange="window.updateInvCustomer('shipTo', this.value)" placeholder="Shipping Destination" class="glass-input" style="width: 100%; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                    </div>
                     <div style="display: grid; grid-template-columns: 125px 1fr; align-items: center;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Place of Supply*</label>
                        <input type="text" value="${s.customer.placeOfSupply}" onchange="window.updateInvCustomer('placeOfSupply', this.value)" placeholder="e.g. Kerala (32)" class="glass-input" style="width: 100%; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                    </div>
                </div>
            </div>

            <!-- Right: Invoice Detail -->
            <div class="glass-panel" style="padding: 1.5rem; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-lg); color: var(--color-text-main); box-shadow: 0 8px 32px rgba(0,0,0,0.36);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem;">
                    <h4 style="margin: 0; color: #f8fafc; font-size: 1.05rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="file-text" style="color: var(--color-primary); width: 18px; height: 18px;"></i> Invoice Detail
                    </h4>
                </div>

                <div style="display: grid; gap: 0.85rem;">
                     <div style="display: grid; grid-template-columns: 125px 1fr; align-items: center;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Invoice Type</label>
                         <select onchange="window.updateInvDetails('type', this.value)" class="glass-input" style="width: 100%; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                            <option value="Tax Invoice" ${s.details.type === 'Tax Invoice' ? 'selected' : ''}>Tax Invoice</option>
                            <option value="Bill of Supply" ${s.details.type === 'Bill of Supply' ? 'selected' : ''}>Bill of Supply</option>
                        </select>
                    </div>

                    <div style="display: grid; grid-template-columns: 125px 1fr 1fr; gap: 1rem; align-items: center;">
                         <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Invoice No.*</label>
                         <div style="display: flex; gap: 0.5rem; grid-column: span 2;">
                            <input type="text" value="${s.details.invPrefix}" onchange="window.updateInvDetails('invPrefix', this.value)" placeholder="Prefix" class="glass-input" style="width: 80px; background: rgba(255, 255, 255, 0.04); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-sm); padding: 0.5rem 0.6rem; text-align: center;">
                            <input type="text" value="${s.details.invNo}" onchange="window.updateInvDetails('invNo', this.value)" placeholder="No" class="glass-input" style="flex: 1; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; font-weight: 600;">
                            <input type="text" value="${s.details.invPost}" onchange="window.updateInvDetails('invPost', this.value)" placeholder="Postfix" class="glass-input" style="width: 80px; background: rgba(255, 255, 255, 0.04); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-sm); padding: 0.5rem 0.6rem; text-align: center;">
                         </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                         <div style="display: grid; grid-template-columns: 110px 1fr; align-items: center;">
                             <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Challan No.</label>
                             <input type="text" value="${s.details.challanNo}" onchange="window.updateInvDetails('challanNo', this.value)" placeholder="Challan No." class="glass-input" style="background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                         </div>
                         <div style="display: grid; grid-template-columns: 70px 1fr; align-items: center;">
                             <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Date*</label>
                             <input type="date" value="${s.details.date}" onchange="window.updateInvDetails('date', this.value)" class="glass-input" style="background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                         </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                         <div style="display: grid; grid-template-columns: 110px 1fr; align-items: center;">
                             <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Buyer's Ord</label>
                             <input type="text" value="${s.details.buyerOrderNo}" onchange="window.updateInvDetails('buyerOrderNo', this.value)" placeholder="Ord No." class="glass-input" style="background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                         </div>
                         <div style="display: grid; grid-template-columns: 70px 1fr; align-items: center;">
                             <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Chal. Date</label>
                             <input type="date" value="${s.details.challanDate}" onchange="window.updateInvDetails('challanDate', this.value)" class="glass-input" style="background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                         </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                         <div style="display: grid; grid-template-columns: 110px 1fr; align-items: center;">
                             <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">L.R. No.</label>
                             <input type="text" value="${s.details.lrNo}" onchange="window.updateInvDetails('lrNo', this.value)" placeholder="L.R. No." class="glass-input" style="background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                         </div>
                         <div style="display: grid; grid-template-columns: 70px 1fr; align-items: center;">
                             <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Terms</label>
                             <input type="text" value="${s.details.termsOfPayment}" onchange="window.updateInvDetails('termsOfPayment', this.value)" placeholder="Terms" class="glass-input" style="background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                         </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                         <div style="display: grid; grid-template-columns: 110px 1fr; align-items: center;">
                             <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Destination</label>
                             <input type="text" value="${s.details.destination}" onchange="window.updateInvDetails('destination', this.value)" placeholder="Dest." class="glass-input" style="background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                         </div>
                         <div style="display: grid; grid-template-columns: 70px 1fr; align-items: center;">
                             <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">E-Way No.</label>
                             <input type="text" value="${s.details.eWayNo}" onchange="window.updateInvDetails('eWayNo', this.value)" placeholder="No." class="glass-input" style="background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                         </div>
                    </div>

                     <div style="display: grid; grid-template-columns: 125px 1fr; align-items: center;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Motor Vehicle *</label>
                        <input type="text" value="${s.details.motorVehicleNo}" onchange="window.updateInvDetails('motorVehicleNo', this.value)" placeholder="KL 07 AA 0000" class="glass-input" style="width: 100%; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                    </div>

                     <div style="display: grid; grid-template-columns: 125px 1fr; align-items: center; margin-top: 0.25rem;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Delivery Mode</label>
                         <select onchange="window.updateInvDetails('delivery', this.value)" class="glass-input" style="width: 100%; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;">
                            <option value="">Select Delivery Mode</option>
                            <option value="Road" ${s.details.delivery === 'Road' ? 'selected' : ''}>Road</option>
                            <option value="Rail" ${s.details.delivery === 'Rail' ? 'selected' : ''}>Rail</option>
                        </select>
                    </div>

                </div>
            </div>
        </div>

        <!-- Middle: Product Items (Rate Inclusive of Tax, NO inline discount) -->
        <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 1.5rem; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-lg); color: var(--color-text-main); box-shadow: 0 8px 32px rgba(0,0,0,0.36);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4 style="margin: 0; color: #f8fafc; font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="package" style="color: var(--color-primary); width: 18px; height: 18px;"></i> Product Items (Rate Inclusive of 18% Tax)
                </h4>
                <span style="font-size: 0.76rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                    Tax Inclusive Rates • Dynamic GST Breakout Below
                </span>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                    <tr style="border-top: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04); color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">
                        <th style="padding: 0.65rem; text-align: left; width: 40px;">SR.</th>
                        <th style="padding: 0.65rem; text-align: left;">PRODUCT / OTHER CHARGES</th>
                        <th style="padding: 0.65rem; text-align: left; width: 110px;">HSN/SAC</th>
                        <th style="padding: 0.65rem; text-align: center; width: 85px;">QTY.</th>
                        <th style="padding: 0.65rem; text-align: center; width: 70px;">UOM</th>
                        <th style="padding: 0.65rem; text-align: right; width: 150px;">RATE (INCL. TAX) (₹)</th>
                        <th style="padding: 0.65rem; text-align: right; width: 130px;">TOTAL (₹)</th>
                        <th style="padding: 0.65rem; width: 35px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${s.items.map((item, idx) => `
                        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.06); vertical-align: middle;">
                            <td style="padding: 0.65rem; text-align: center; color: #94a3b8;">${idx + 1}</td>
                            <td style="padding: 0.65rem;">
                                <input type="text" value="${item.name}" onchange="window.updateInvItem(${idx}, 'name', this.value)" placeholder="Item Name" 
                                    style="width: 100%; border: none; outline: none; font-weight: 600; color: #f8fafc; background: transparent; padding: 4px;">
                                <input type="text" value="${item.description}" onchange="window.updateInvItem(${idx}, 'description', this.value)" placeholder="Item Note..." 
                                    style="width: 100%; border: 1px solid rgba(255, 255, 255, 0.08); outline: none; font-size: 0.8rem; color: #cbd5e1; background: rgba(255, 255, 255, 0.04); border-radius: 4px; padding: 4px 6px; margin-top: 4px;">
                            </td>
                            <td style="padding: 0.65rem;">
                                <input type="text" value="${item.hsn}" onchange="window.updateInvItem(${idx}, 'hsn', this.value)" placeholder="HSN" 
                                    style="width: 100%; border: 1px solid rgba(255, 255, 255, 0.1); outline: none; text-align: left; color: #f8fafc; background: rgba(255, 255, 255, 0.04); border-radius: 4px; padding: 4px 6px;">
                            </td>
                             <td style="padding: 0.65rem;">
                                <input type="number" value="${item.qty}" onchange="window.updateInvItem(${idx}, 'qty', this.value)" 
                                    style="width: 100%; border: 1px solid rgba(255, 255, 255, 0.1); outline: none; text-align: center; color: #f8fafc; background: rgba(255, 255, 255, 0.04); border-radius: 4px; padding: 4px 6px;">
                            </td>
                             <td style="padding: 0.65rem;">
                                <input type="text" value="${item.uom}" onchange="window.updateInvItem(${idx}, 'uom', this.value)" 
                                    style="width: 100%; border: 1px solid rgba(255, 255, 255, 0.1); outline: none; text-align: center; text-transform: uppercase; color: #f8fafc; background: rgba(255, 255, 255, 0.04); border-radius: 4px; padding: 4px 6px;">
                            </td>
                             <td style="padding: 0.65rem;">
                                <input type="number" value="${item.price}" onchange="window.updateInvItem(${idx}, 'price', this.value)" 
                                    style="width: 100%; border: 1px solid rgba(255, 255, 255, 0.1); outline: none; text-align: right; color: #f8fafc; background: rgba(255, 255, 255, 0.04); border-radius: 4px; padding: 4px 6px; font-weight: 600;">
                            </td>
                            <td style="padding: 0.65rem; text-align: right; font-weight: 700; color: #f8fafc;">
                                ₹${(item.total || 0).toFixed(2)}
                            </td>
                             <td style="padding: 0.65rem; text-align: center;">
                                <button onclick="window.removeInvItem(${idx})" style="color: #ff5c6a; background: none; border: none; cursor: pointer; padding: 4px;" title="Remove row">
                                    <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                    
                    <!-- Add Button Row -->
                    <tr>
                        <td colspan="8" style="padding: 0.75rem 0.5rem;">
                            <button onclick="window.addInvItem()" style="background: rgba(255, 255, 255, 0.04); border: 1px dashed rgba(255, 255, 255, 0.2); color: #cbd5e1; width: 100%; padding: 0.65rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-weight: 500;" onmouseover="this.style.borderColor='var(--color-primary)'; this.style.color='var(--color-primary)'" onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.2)'; this.style.color='#cbd5e1'">
                                + Add Product Item
                            </button>
                        </td>
                    </tr>

                    <!-- Gross Total Row in Items Table -->
                    <tr style="background: rgba(99, 102, 241, 0.12); border-top: 1px solid rgba(99, 102, 241, 0.3); font-weight: 600; color: #f8fafc;">
                        <td colspan="4"></td>
                        <td colspan="2" style="padding: 0.65rem; text-align: right; color: #cbd5e1;">Gross Items Total:</td>
                        <td style="padding: 0.65rem; text-align: right; color: #818cf8; font-weight: 800; font-size: 1.05rem;">₹${(s.summary.subtotalGross || 0).toFixed(2)}</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Footer Section Grid: Compact Left Logistics (Due Date, Bank, Terms, Remarks) & Prominent Right Commercials (Totals, Advance, Print Options) -->
        <div style="display: grid; grid-template-columns: 360px 1fr; gap: 2rem; margin-bottom: 2rem; align-items: start;">
            
            <!-- Left Footer: Compact Logistics Column (360px) -->
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                <div class="glass-panel" style="padding: 1.25rem; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 0.9rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06); padding-bottom: 0.5rem; margin-bottom: 0.25rem;">
                        <span style="font-size: 0.82rem; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px;">Payment & Due Terms</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 85px 1fr; align-items: center; gap: 0.5rem;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Due Date</label>
                        <input type="date" value="${s.footer.dueDate}" onchange="window.updateInvFooter('dueDate', this.value)" class="glass-input" style="width: 100%; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; font-size: 0.85rem;">
                    </div>
                    <div style="display: grid; grid-template-columns: 85px 1fr; align-items: center; gap: 0.5rem;">
                        <label style="color: #94a3b8; font-size: 0.85rem; font-weight: 500;">Bank</label>
                        <select onchange="window.updateInvFooter('bank', this.value)" class="glass-input" style="width: 100%; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; font-size: 0.85rem;">
                            <option value="HDFC" ${s.footer.bank === 'HDFC' ? 'selected' : ''}>HDFC Bank - Kakkanad Branch</option>
                            <option value="SBI" ${s.footer.bank === 'SBI' ? 'selected' : ''}>State Bank of India</option>
                        </select>
                    </div>
                </div>

                <div class="glass-panel" style="padding: 1.25rem; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-lg);">
                    <div style="color: #94a3b8; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem;">Terms & Conditions / Declaration</div>
                    <div style="border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; overflow: hidden; background: rgba(255, 255, 255, 0.03); margin-bottom: 0.5rem;">
                         <input type="text" value="${s.footer.title}" onchange="window.updateInvFooter('title', this.value)" style="width: 100%; border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding: 0.5rem 0.75rem; outline: none; font-weight: 600; background: transparent; color: #f8fafc; font-size: 0.85rem;">
                         <textarea onchange="window.updateInvFooter('detail', this.value)" style="width: 100%; border: none; padding: 0.5rem 0.75rem; resize: none; height: 60px; color: #94a3b8; background: transparent; font-size: 0.82rem; line-height: 1.4;">${s.footer.detail}</textarea>
                    </div>
                </div>

                <div class="glass-panel" style="padding: 1.25rem; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-lg);">
                    <label style="display: block; color: #94a3b8; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.35rem;">Document Note / Remarks</label>
                    <textarea onchange="window.updateInvFooter('notes', this.value)" class="glass-input" style="width: 100%; height: 65px; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; resize: none; font-size: 0.85rem;" placeholder="Add remarks...">${s.footer.notes}</textarea>
                </div>
            </div>

            <!-- Right Footer: Prominent Commercial Column with Totals & Print Options -->
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                
                <!-- Main Totals Summary Card -->
                <div class="glass-panel" style="padding: 1.5rem; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-lg); height: fit-content; box-shadow: 0 8px 32px rgba(0,0,0,0.36);">
                    
                    <!-- 1. Gross Items Total Summary Card -->
                    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.65rem 0.85rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                        <span style="color: #94a3b8; font-size: 0.88rem; font-weight: 500;">Gross Items Total</span>
                        <span id="summary-gross-val" style="color: #f8fafc; font-weight: 700; font-size: 0.95rem;">₹${(s.summary.subtotalGross || 0).toFixed(2)}</span>
                    </div>

                    <!-- 2. Single Consolidated Footer Discount -->
                    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.65rem 0.85rem; margin-bottom: 0.65rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                            <span style="color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">Consolidated Discount</span>
                            <div style="display: flex; gap: 4px; background: rgba(0,0,0,0.3); padding: 2px; border-radius: 4px;">
                                <button type="button" onclick="window.updateInvDiscount(null, false, event)" style="padding: 2px 7px; border: none; border-radius: 3px; font-size: 0.75rem; cursor: pointer; font-weight: 700; background: ${!s.summary.discount?.isPercent ? 'var(--color-primary)' : 'transparent'}; color: white;">₹</button>
                                <button type="button" onclick="window.updateInvDiscount(null, true, event)" style="padding: 2px 7px; border: none; border-radius: 3px; font-size: 0.75rem; cursor: pointer; font-weight: 700; background: ${s.summary.discount?.isPercent ? 'var(--color-primary)' : 'transparent'}; color: white;">%</button>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <input type="number" min="0" step="0.01" value="${s.summary.discount?.value || ''}" 
                                   oninput="window.updateInvDiscount(this.value, null, event)" 
                                   placeholder="0"
                                   style="width: 110px; background: rgba(255, 255, 255, 0.08); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 6px; padding: 5px 8px; font-size: 0.88rem; font-weight: 600;">
                            <span id="summary-discount-val" style="color: #f87171; font-weight: 600; font-size: 0.9rem;">
                                - ₹${(s.summary.discountAmount || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <!-- 3. Subtotal Summary Card -->
                    <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 0.65rem 0.85rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                        <div>
                            <span style="color: #cbd5e1; font-size: 0.88rem; font-weight: 600;">Subtotal</span>
                            <div style="font-size: 0.72rem; color: #94a3b8;">Tax-inclusive invoice base</div>
                        </div>
                        <span id="summary-subtotal-val" style="color: #f8fafc; font-weight: 700; font-size: 1.05rem;">₹${(s.summary.grandTotal || 0).toFixed(2)}</span>
                    </div>

                    <!-- 4. Dynamic 18% GST Breakout Slab (Rate Inclusive of Tax: / 1.18 & CGST 9%, SGST 9%) -->
                    <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 0.75rem 0.85rem; margin-bottom: 0.85rem; font-size: 0.84rem;">
                        <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #94a3b8;">
                            <span>Taxable Base (Net / 1.18):</span>
                            <span id="summary-taxable-val" style="color: #f8fafc; font-weight: 600;">₹${(s.summary.taxableBase || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #94a3b8;">
                            <span>CGST (9%):</span>
                            <span id="summary-cgst-val" style="color: #38bdf8; font-weight: 600;">₹${(s.summary.cgst || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #94a3b8;">
                            <span>SGST (9%):</span>
                            <span id="summary-sgst-val" style="color: #38bdf8; font-weight: 600;">₹${(s.summary.sgst || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 4px 0 2px; border-top: 1px dashed rgba(255,255,255,0.1); margin-top: 3px; color: #cbd5e1;">
                            <span style="font-weight: 600;">Total Tax (18% GST):</span>
                            <span id="summary-totaltax-val" style="color: #38bdf8; font-weight: 700;">₹${(s.summary.totalTax || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- 5. Grand Total (Invoice Total) Summary Card -->
                    <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.12)); border: 1px solid rgba(99, 102, 241, 0.35); padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; font-weight: 700; margin-bottom: 1rem; border-radius: 8px; font-size: 1.15rem; color: #ffffff;">
                        <span>Invoice Grand Total</span>
                        <span id="summary-grandtotal-val" style="color: #818cf8; font-size: 1.35rem; font-weight: 800;">₹${(s.summary.grandTotal || 0).toFixed(2)}</span>
                    </div>

                    <!-- 6. Advance Payment Section (Positioned Directly Beneath Gross & Subtotal Cards) -->
                    
                    <!-- Customer Advance Detection Interactive Widget -->
                    <div id="customer-advance-detection-widget" style="
                        background: ${availableAdvance > 0 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(5, 150, 105, 0.08))' : 'rgba(255, 255, 255, 0.03)'}; 
                        border: 1px solid ${availableAdvance > 0 ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}; 
                        border-radius: 10px; padding: 0.85rem; margin-bottom: 0.85rem; transition: all 0.25s ease;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <i data-lucide="wallet" style="width: 16px; height: 16px; color: ${availableAdvance > 0 ? '#34d399' : '#94a3b8'};"></i>
                                <span style="font-size: 0.84rem; font-weight: 700; color: #f8fafc;">Customer Advance Pool</span>
                            </div>
                            <span id="summary-available-pool-badge" style="font-size: 0.88rem; font-weight: 800; color: ${availableAdvance > 0 ? '#34d399' : '#94a3b8'};">
                                Available Advance: ₹${availableAdvance.toLocaleString('en-IN')}
                            </span>
                        </div>

                        ${availableAdvance > 0 ? `
                            <div style="display: flex; gap: 6px; margin-top: 8px;">
                                <button type="button" onclick="window.applyInvAdvancePreset('full', event)" style="flex: 1; padding: 5px 8px; font-size: 0.74rem; font-weight: 700; background: rgba(16, 185, 129, 0.25); border: 1px solid #10b981; color: #34d399; border-radius: 5px; cursor: pointer; transition: all 0.2s;" title="Apply maximum advance needed for invoice">
                                    Apply Max (₹${Math.min(availableAdvance, s.summary.grandTotal).toLocaleString('en-IN')})
                                </button>
                                <button type="button" onclick="window.applyInvAdvancePreset('half', event)" style="flex: 1; padding: 5px 8px; font-size: 0.74rem; font-weight: 600; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); color: #cbd5e1; border-radius: 5px; cursor: pointer; transition: all 0.2s;" title="Apply 50% partial deduction">
                                    Apply 50% (₹${Math.round(availableAdvance / 2).toLocaleString('en-IN')})
                                </button>
                                <button type="button" onclick="window.applyInvAdvancePreset('clear', event)" style="padding: 5px 9px; font-size: 0.74rem; font-weight: 600; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #f87171; border-radius: 5px; cursor: pointer; transition: all 0.2s;" title="Clear advance deduction">
                                    Clear
                                </button>
                            </div>
                        ` : `
                            <div style="font-size: 0.74rem; color: #94a3b8; display: flex; align-items: center; gap: 5px; margin-top: 4px;">
                                <i data-lucide="info" style="width: 13px; height: 13px;"></i>
                                <span>No ledger advance credits found for selected customer.</span>
                            </div>
                        `}
                    </div>

                    <!-- Advance Payment Emerald Green Toggle & Deduction Card -->
                    <div id="advance-payment-card" style="
                        border: ${s.summary.advanceEnabled ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)'}; 
                        background: ${s.summary.advanceEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)'}; 
                        box-shadow: ${s.summary.advanceEnabled ? '0 0 16px rgba(16, 185, 129, 0.22)' : 'none'};
                        border-radius: 10px; padding: 1rem; margin-bottom: 1rem; transition: all 0.25s ease;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s.summary.advanceEnabled ? '0.75rem' : '0'};">
                            <label onclick="event.stopPropagation()" style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin: 0; user-select: none;">
                                <input type="checkbox" id="advance-toggle-checkbox" 
                                       ${s.summary.advanceEnabled ? 'checked' : ''} 
                                       onchange="window.toggleInvAdvanceCard(this.checked, event)"
                                       style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981;">
                                <span style="font-weight: 700; font-size: 0.92rem; color: ${s.summary.advanceEnabled ? '#34d399' : '#f8fafc'}; display: flex; align-items: center; gap: 6px;">
                                    <i data-lucide="badge-percent" style="width: 16px; height: 16px;"></i> Advance Payment
                                </span>
                            </label>
                            ${s.summary.advanceEnabled ? `
                                <span style="font-size: 0.74rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 7px; border-radius: 9999px; font-weight: 700;">ACTIVE</span>
                            ` : `
                                <span style="font-size: 0.72rem; color: #94a3b8;">Optional</span>
                            `}
                        </div>

                        ${s.summary.advanceEnabled ? `
                            <!-- Partial Allocation Manual Override Input -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                                <div>
                                    <span style="font-size: 0.85rem; color: #cbd5e1; font-weight: 500;">Applied Advance:</span>
                                    <div style="font-size: 0.72rem; color: #94a3b8;">Manual override supported</div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="color: #34d399; font-weight: 700;">₹</span>
                                    <input type="number" id="applied-advance-input" min="0" max="${Math.max(availableAdvance, s.summary.grandTotal)}" 
                                           value="${s.summary.advancePayment || ''}" 
                                           oninput="window.updateInvAdvancePayment(this.value, event)" 
                                           placeholder="0.00"
                                           style="width: 130px; background: rgba(0, 0, 0, 0.45); color: #ffffff; border: 1.5px solid #10b981; border-radius: 6px; padding: 6px 10px; text-align: right; font-weight: 700; font-size: 0.95rem;">
                                </div>
                            </div>

                            <!-- Residual Advance in Customer Wallet -->
                            <div id="summary-residual-wallet-box" style="display: ${availableAdvance > 0 ? 'flex' : 'none'}; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.3); border: 1px dashed rgba(16, 185, 129, 0.35); border-radius: 6px; padding: 6px 10px; margin-bottom: 0.75rem; font-size: 0.78rem;">
                                <span style="color: #94a3b8; display: flex; align-items: center; gap: 4px;">
                                    <i data-lucide="piggy-bank" style="width: 14px; height: 14px; color: #34d399;"></i> Residual in Wallet:
                                </span>
                                <strong id="summary-residual-val" style="color: #34d399; font-weight: 700;">
                                    ₹${(s.summary.residualAdvance || 0).toLocaleString('en-IN')} remaining
                                </strong>
                            </div>

                            <!-- Net Balance Due Card & Accounts Receivable Routing Notice -->
                            <div id="summary-balance-due-card" style="background: ${s.summary.balanceDue > 0 ? (s.footer.paymentType === 'CREDIT' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)') : 'rgba(16, 185, 129, 0.2)'}; padding: 0.75rem 0.9rem; border-radius: 8px; border: 1px solid ${s.summary.balanceDue > 0 ? (s.footer.paymentType === 'CREDIT' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)') : 'rgba(16, 185, 129, 0.4)'};">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <span id="summary-balance-label" style="color: ${s.summary.balanceDue > 0 ? (s.footer.paymentType === 'CREDIT' ? '#fca5a5' : '#fbbf24') : '#34d399'}; font-size: 0.88rem; font-weight: 700;">
                                            Net Balance Due
                                        </span>
                                        <div id="summary-receivable-notice" style="font-size: 0.72rem; color: ${s.footer.paymentType === 'CREDIT' && s.summary.balanceDue > 0 ? '#f87171' : '#94a3b8'}; margin-top: 2px;">
                                            ${s.summary.balanceDue === 0 ? '✓ Fully settled with advance credit' : (s.footer.paymentType === 'CREDIT' ? '⚡ Will be routed to Accounts Receivable' : 'Due by maturity date')}
                                        </div>
                                    </div>
                                    <span id="summary-balance-val" style="color: ${s.summary.balanceDue > 0 ? (s.footer.paymentType === 'CREDIT' ? '#ef4444' : '#fbbf24') : '#34d399'}; font-size: 1.25rem; font-weight: 800;">
                                        ₹${(s.summary.balanceDue || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 1.25rem;">
                        Total in words: <br> <strong id="summary-words-val" style="color: #f8fafc; font-style: italic;">${numberToWords(s.summary.grandTotal)} RUPEES ONLY</strong>
                    </div>

                    <!-- Payment Mode Selector with Clean Support for Credit, Cash, Bank Transfer, Cheque -->
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: #94a3b8; font-weight: 500; margin-bottom: 0.5rem;">Payment Mode*</label>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button type="button" id="paymode-btn-CREDIT" onclick="window.setPaymentType('CREDIT', event)" style="${btnStyle('CREDIT')}">CREDIT</button>
                            <button type="button" id="paymode-btn-CASH" onclick="window.setPaymentType('CASH', event)" style="${btnStyle('CASH')}">CASH</button>
                            <button type="button" id="paymode-btn-BANK_TRANSFER" onclick="window.setPaymentType('BANK_TRANSFER', event)" style="${btnStyle('BANK_TRANSFER')}">BANK TRANSFER</button>
                            <button type="button" id="paymode-btn-CHEQUE" onclick="window.setPaymentType('CHEQUE', event)" style="${btnStyle('CHEQUE')}">CHEQUE</button>
                        </div>
                    </div>

                </div>

                <!-- 2. Print Document Options Section (Positioned Directly Beneath Totals Summary on the Right) -->
                <div class="glass-panel" style="padding: 1.25rem 1.5rem; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-lg); box-shadow: 0 4px 20px rgba(0,0,0,0.25);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                        <h4 style="margin: 0; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; color: var(--color-primary); font-weight: 700;">
                            <i data-lucide="printer" style="width: 16px; height: 16px;"></i> Print Document Options
                        </h4>
                        <span style="font-size: 0.72rem; color: #94a3b8; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">Tax Invoice Output</span>
                    </div>
                    <p style="font-size: 0.8rem; color: #94a3b8; margin: 0 0 1rem 0;">Control whether company logo/header and bank details appear on the printed tax invoice.</p>
                    <div style="display: flex; gap: 1.25rem; flex-wrap: wrap;">
                        <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.88rem; color: #f8fafc; font-weight: 500; background: rgba(255,255,255,0.04); padding: 0.55rem 0.9rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
                            <input type="checkbox" id="inv-show-logo" 
                                   ${s.printOptions.showLogoHeader ? 'checked' : ''} 
                                   onchange="window.updateInvPrintOption('showLogoHeader', this.checked)"
                                   style="width: 17px; height: 17px; cursor: pointer; accent-color: var(--color-primary);">
                            <span>Show Company Logo/Header</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.88rem; color: #f8fafc; font-weight: 500; background: rgba(255,255,255,0.04); padding: 0.55rem 0.9rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
                            <input type="checkbox" id="inv-show-bank" 
                                   ${s.printOptions.showBankDetails ? 'checked' : ''} 
                                   onchange="window.updateInvPrintOption('showBankDetails', this.checked)"
                                   style="width: 17px; height: 17px; cursor: pointer; accent-color: var(--color-primary);">
                            <span>Show Bank Details</span>
                        </label>
                    </div>
                </div>

            </div>
        </div>

        <!-- Sticky Bottom Actions -->
        <div style="position: fixed; bottom: 0; left: 240px; right: 0; padding: 1rem 2rem; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; z-index: 100; box-shadow: 0 -4px 20px rgba(0,0,0,0.4);">
             <button type="button" onclick="window.backToSales()" class="btn btn-secondary">
                <i data-lucide="chevron-left"></i> Back to Invoices
            </button>
            <div style="display: flex; gap: 1rem;">
                <button type="button" onclick="window.saveInvoice(true)" class="btn btn-success" style="background: #10b981; color: white; border: none; cursor: pointer; padding: 0.6rem 1.25rem; font-weight: 600;">
                    <i data-lucide="printer"></i> Save & Print
                </button>
                 <button type="button" onclick="window.saveInvoice(false)" class="btn btn-primary" style="background: var(--color-primary); color: white; border: none; cursor: pointer; padding: 0.6rem 1.25rem; font-weight: 600;">
                    <i data-lucide="save"></i> Save Invoice
                </button>
            </div>
        </div>
    `;

    if (mainView) mainView.scrollTop = prevScroll;

    setTimeout(() => { 
        if (mainView) mainView.scrollTop = prevScroll;
        if (window.lucide) window.lucide.createIcons(); 
        if (window.UniversalCustomerSearch) {
            window.UniversalCustomerSearch.register('sales-customer-search', {
                onSelect: (cust) => {
                    window.selectInvCustomer(cust);
                },
                onClear: () => {
                    invoiceState.customer.name = '';
                    invoiceState.customerId = '';
                    invoiceState.customer.address = '';
                    invoiceState.customer.phone = '';
                    invoiceState.summary.advancePayment = 0;
                    window.calculateInvTotals();
                    renderInvoiceForm();
                }
            });
        }
    }, 0);
};

// --- PRINT TEMPLATE MODAL FOR SALES INVOICE (Feature 1 conditional render) ---

window.openPrintInvoiceModal = (invData) => {
    const store = window.Store || Store;
    const settings = store.state.settings || {};
    const company = settings.company || {
        name: 'WINPRO Systems',
        address: 'Industrial Estate, Kakkanad\nKochi, Kerala - 682030',
        phone: '+91 9846 123 456',
        email: 'sales@glwindows.com',
        taxId: 'GSTIN-123456789'
    };
    const bank = settings.bank || {
        bankName: 'HDFC Bank',
        accountName: 'WINPRO Systems',
        accountNumber: '50200098765432',
        ifsc: 'HDFC0001234',
        branch: 'Kakkanad, Kochi'
    };

    const s = invData || invoiceState;
    const printOptions = s.printOptions || { showLogoHeader: true, showBankDetails: true };

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'inv-print-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.85)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'flex-start';
    modal.style.padding = '2rem';
    modal.style.overflowY = 'auto';

    const grandTotal = Number(s.summary?.grandTotal || s.amount || 0);
    const advancePaid = Number(s.summary?.advancePayment || s.advancePayment || 0);
    const balanceDue = Number(s.summary?.balanceDue !== undefined ? s.summary.balanceDue : (s.balance !== undefined ? s.balance : Math.max(0, grandTotal - advancePaid)));

    const invNo = s.details ? `${s.details.invPrefix || ''}${s.details.invNo || ''}${s.details.invPost || ''}` : (s.id || 'INV-001');
    const invDate = s.details?.date || s.date || new Date().toISOString().split('T')[0];
    const invoiceItems = Array.isArray(s.items) 
        ? s.items 
        : (typeof s.items === 'string' && s.items.trim() 
            ? [{ name: s.items, description: '', hsn: '7610', qty: 1, uom: 'nos', price: grandTotal, discount: 0, igst: 18, total: grandTotal }] 
            : []);

    modal.innerHTML = `
        <!-- Floating Actions Toolbar -->
        <div class="no-print" style="width: 100%; max-width: 850px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div style="color: white; font-size: 1rem; font-weight: 500;">
                <i data-lucide="printer" style="vertical-align: middle; margin-right: 6px;"></i> Print Preview — ${invNo}
            </div>
            <div style="display: flex; gap: 0.6rem; align-items: center;">
                <button class="btn btn-secondary" onclick="window.sharePrintDoc('Invoice', '${invNo}', 'Tax Invoice ${invNo}', '${s.customer}', ${grandTotal}, '${s.customerPhone || ''}')" style="background: #2563eb; border: 1px solid #2563eb; color: white; display: flex; align-items: center; gap: 6px;" title="Share invoice via WhatsApp, Email, etc.">
                    <i data-lucide="share-2" style="width: 15px;"></i> Share
                </button>
                <button class="btn btn-secondary" onclick="window.downloadPrintDoc('printable-invoice', '${invNo}')" style="background: #475569; border: 1px solid #64748b; color: white; display: flex; align-items: center; gap: 6px;" title="Download PDF document">
                    <i data-lucide="download" style="width: 15px;"></i> Download
                </button>
                <button class="btn btn-primary" onclick="window.print()" style="background: #10b981; border: none; color: white; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="printer" style="width: 15px;"></i> Print Document
                </button>
                <button class="btn btn-secondary" onclick="document.getElementById('inv-print-modal').remove()">
                    Close
                </button>
            </div>
        </div>

        <!-- Printable Document Body -->
        <div id="printable-invoice" style="width: 100%; max-width: 850px; background: white; color: black; padding: 2.5rem; border-radius: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); font-family: 'Inter', sans-serif;">
            
            <!-- Conditional Header: Show Company Logo/Header -->
            ${printOptions.showLogoHeader ? `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.5rem; border-bottom: 2px solid #0f172a; margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 50px; height: 50px; background: #0f172a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.6rem; font-weight: 800;">
                            WP
                        </div>
                        <div>
                            <h1 style="margin: 0; font-size: 1.6rem; color: #0f172a; font-weight: 800;">${company.name}</h1>
                            <p style="margin: 2px 0 0 0; font-size: 0.85rem; color: #475569; white-space: pre-line;">${company.address}</p>
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 0.85rem; color: #334155;">
                        <div><strong>GSTIN / UIN:</strong> ${company.taxId}</div>
                        <div><strong>Contact:</strong> ${company.phone}</div>
                        <div><strong>Email:</strong> ${company.email}</div>
                    </div>
                </div>
            ` : `
                <!-- Header Omitted for Letterhead Print -->
                <div style="height: 50px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: flex-end; font-size: 0.75rem; color: #94a3b8;" class="no-print">
                    [Company Letterhead Space — Logo/Header Hidden]
                </div>
            `}

            <!-- Document Meta Details Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.25rem;">
                <!-- Left: Billed To -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px;">Buyer / Billed To:</div>
                    <div style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">${s.customer?.name || s.customer || 'Customer'}</div>
                    ${s.customer?.address ? `<div style="font-size: 0.85rem; color: #475569; margin-top: 3px;">${s.customer.address}</div>` : ''}
                    ${s.customer?.phone ? `<div style="font-size: 0.85rem; color: #475569;">Phone: ${s.customer.phone}</div>` : ''}
                    ${s.customer?.gstin ? `<div style="font-size: 0.85rem; color: #475569;">GSTIN: ${s.customer.gstin}</div>` : ''}
                </div>

                <!-- Right: Invoice Metadata -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; font-size: 0.88rem;">
                    <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                        ${s.details?.type || 'TAX INVOICE'}
                    </div>
                    <div style="display: grid; grid-template-columns: 110px 1fr; gap: 4px; color: #334155;">
                        <span>Invoice No:</span><strong>${invNo}</strong>
                        <span>Invoice Date:</span><strong>${invDate}</strong>
                        <span>Due Date:</span><strong>${s.footer?.dueDate || s.dueDate || '-'}</strong>
                        <span>Payment Mode:</span><strong>${s.footer?.paymentType || s.paymentType || 'Credit'}</strong>
                        ${s.details?.motorVehicleNo ? `<span>Vehicle No:</span><strong>${s.details.motorVehicleNo}</strong>` : ''}
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.85rem;">
                <thead>
                    <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #0f172a; color: #0f172a; text-transform: uppercase; font-size: 0.75rem;">
                        <th style="padding: 8px; text-align: center; width: 35px;">#</th>
                        <th style="padding: 8px; text-align: left;">Description of Goods</th>
                        <th style="padding: 8px; text-align: center; width: 70px;">HSN</th>
                        <th style="padding: 8px; text-align: center; width: 60px;">Qty</th>
                        <th style="padding: 8px; text-align: right; width: 85px;">Rate (₹)</th>
                        <th style="padding: 8px; text-align: right; width: 65px;">Disc</th>
                        <th style="padding: 8px; text-align: right; width: 65px;">Tax%</th>
                        <th style="padding: 8px; text-align: right; width: 100px;">Total (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceItems.map((it, idx) => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; text-align: center; color: #64748b;">${idx + 1}</td>
                            <td style="padding: 8px;">
                                <div style="font-weight: 600; color: #0f172a;">${it.name || 'Window System'}</div>
                                ${it.description ? `<div style="font-size: 0.8rem; color: #64748b;">${it.description}</div>` : ''}
                            </td>
                            <td style="padding: 8px; text-align: center; color: #64748b;">${it.hsn || '-'}</td>
                            <td style="padding: 8px; text-align: center;">${it.qty || 1} ${it.uom || ''}</td>
                            <td style="padding: 8px; text-align: right;">₹${Number(it.price || 0).toLocaleString()}</td>
                            <td style="padding: 8px; text-align: right; color: #64748b;">${it.discount ? it.discount : '-'}</td>
                            <td style="padding: 8px; text-align: right; color: #64748b;">${it.igst ? it.igst + '%' : '-'}</td>
                            <td style="padding: 8px; text-align: right; font-weight: 600;">₹${Number(it.total || 0).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Summary Totals with Advance Balance & Balance Due -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem; align-items: flex-start;">
                <div style="flex: 1; padding-right: 2rem;">
                    <div style="font-size: 0.85rem; color: #475569; margin-bottom: 0.5rem;">
                        <strong>Amount in Words:</strong><br>
                        <span style="font-style: italic; color: #0f172a;">${numberToWords(grandTotal)} RUPEES ONLY</span>
                    </div>

                    <!-- Conditional Bank Details: Show Bank Details -->
                    ${printOptions.showBankDetails ? `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.85rem; margin-top: 1rem; font-size: 0.82rem;">
                            <div style="font-weight: 700; color: #1e293b; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                🏦 Bank Details for Payment
                            </div>
                            <div style="display: grid; grid-template-columns: 100px 1fr; gap: 2px; color: #334155;">
                                <span>Bank Name:</span><strong>${bank.bankName}</strong>
                                <span>A/C Name:</span><strong>${bank.accountName}</strong>
                                <span>A/C Number:</span><strong>${bank.accountNumber}</strong>
                                <span>IFSC Code:</span><strong>${bank.ifsc}</strong>
                                <span>Branch:</span><strong>${bank.branch}</strong>
                            </div>
                        </div>
                    ` : `
                        <div style="font-size: 0.75rem; color: #94a3b8; font-style: italic; margin-top: 1rem;" class="no-print">
                            [Bank Details Section Hidden per Print Options]
                        </div>
                    `}
                </div>

                <div style="width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; font-size: 0.9rem;">
                    <div style="display: flex; justify-content: space-between; padding: 3px 0; color: #475569;">
                        <span>Taxable Base:</span>
                        <span>₹${Number(s.summary?.taxableBase || (grandTotal / 1.18)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 3px 0; color: #475569;">
                        <span>CGST (9%):</span>
                        <span>₹${Number(s.summary?.cgst || ((grandTotal - (grandTotal / 1.18)) / 2)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 3px 0; color: #475569;">
                        <span>SGST (9%):</span>
                        <span>₹${Number(s.summary?.sgst || ((grandTotal - (grandTotal / 1.18)) / 2)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 3px 0; color: #475569; font-weight: 600;">
                        <span>Total Tax (18%):</span>
                        <span>₹${Number(s.summary?.totalTax || (grandTotal - (grandTotal / 1.18))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #e2e8f0; margin-top: 4px; font-weight: 700; font-size: 1.1rem; color: #0f172a;">
                        <span>Grand Total:</span>
                        <span>₹${grandTotal.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #10b981; border-top: 1px solid #e2e8f0; margin-top: 4px;">
                        <span>Advance Paid:</span>
                        <strong>₹${advancePaid.toLocaleString()}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #d97706; font-size: 1.05rem; border-top: 1px solid #cbd5e1; margin-top: 4px;">
                        <span style="font-weight: 700;">Balance Due:</span>
                        <strong style="font-weight: 800;">₹${balanceDue.toLocaleString()}</strong>
                    </div>
                </div>
            </div>

            <!-- Footer Declarations & Signature -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem; display: flex; justify-content: space-between; align-items: flex-end; font-size: 0.8rem; color: #64748b;">
                <div style="max-width: 500px;">
                    <strong>Declaration:</strong>
                    <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #64748b;">
                        ${s.footer?.detail || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
                    </p>
                </div>
                <div style="text-align: center; width: 180px;">
                    <div style="height: 40px;"></div>
                    <div style="border-top: 1px solid #94a3b8; padding-top: 4px; font-weight: 600; color: #0f172a;">For ${company.name}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">Authorized Signatory</div>
                </div>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
};
