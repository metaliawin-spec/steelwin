import { Store } from '../store.js';

// --- SALES RETURN & CREDIT NOTES DEDICATED MODULE ---

let returnSearchQuery = '';
let returnRefundModeFilter = 'all';

export function renderSalesReturn(state) {
    const store = window.Store || Store;
    if (!store.state.sales) store.state.sales = [];
    if (!store.state.salesReturns) store.state.salesReturns = [];

    const sales = store.state.sales || [];
    const allReturns = store.state.salesReturns || [];

    // Filtered returns
    const filteredReturns = allReturns.map(r => ({
        ...r,
        originalInvoiceId: r.originalInvoiceId || r.invoiceId || 'INV-2026-1001',
        amount: Number(r.amount !== undefined ? r.amount : r.refundAmount) || 0,
        refundMode: r.refundMode || 'Credit Note (Advance Wallet)'
    })).filter(r => {
        const matchesMode = returnRefundModeFilter === 'all' || 
            (r.refundMode && r.refundMode.toLowerCase().includes(returnRefundModeFilter.toLowerCase()));
        const q = returnSearchQuery.trim().toLowerCase();
        const matchesQuery = !q || 
            (r.id && r.id.toLowerCase().includes(q)) ||
            (r.originalInvoiceId && r.originalInvoiceId.toLowerCase().includes(q)) ||
            (r.customer && r.customer.toLowerCase().includes(q)) ||
            (r.reason && r.reason.toLowerCase().includes(q));
        return matchesMode && matchesQuery;
    });

    // KPI Metrics
    const totalCreditAmount = filteredReturns.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const creditNoteCount = filteredReturns.filter(r => (r.refundMode || '').includes('Credit Note')).length;
    const directRefundCount = filteredReturns.length - creditNoteCount;

    const container = document.createElement('div');
    container.className = 'sales-return-view animate-fade-in';
    container.style.cssText = 'display: flex; flex-direction: column; gap: 1.5rem; width: 100%; padding-bottom: 3rem;';

    container.innerHTML = `
        <!-- Top Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(245, 158, 11, 0.16); border: 1.5px solid rgba(245, 158, 11, 0.4); display: flex; align-items: center; justify-content: center; color: #f59e0b; box-shadow: 0 0 16px rgba(245, 158, 11, 0.25);">
                        <i data-lucide="rotate-ccw" style="width: 22px; height: 22px;"></i>
                    </div>
                    <div>
                        <h1 style="margin: 0; font-size: 1.85rem; font-weight: 800; color: #f8fafc; line-height: 1.2;">
                            Sales Return & Credit Notes
                        </h1>
                        <p style="margin: 2px 0 0; font-size: 0.88rem; color: var(--color-text-muted);">
                            Dedicated Return Vouchers, Credit Note Register, and Customer Ledger Balance Adjustments
                        </p>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 0.75rem; align-items: center;">
                <button type="button" class="btn btn-primary" onclick="window.openNewSalesReturnModal()" style="background: linear-gradient(135deg, #f59e0b, #d97706); border-color: #f59e0b; color: #000; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; padding: 0.65rem 1.35rem; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);">
                    <i data-lucide="plus" style="width: 18px; height: 18px;"></i> New Sales Return / Credit Note
                </button>
            </div>
        </div>

        <!-- Metric KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
            <!-- Metric 1: Total Returns -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-lg); background: var(--color-bg-card); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Return Vouchers</div>
                    <div style="font-size: 1.65rem; font-weight: 800; color: #f8fafc; margin-top: 4px;">${allReturns.length}</div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">Recorded return events</div>
                </div>
                <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(245, 158, 11, 0.12); color: #f59e0b; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="receipt" style="width: 22px; height: 22px;"></i>
                </div>
            </div>

            <!-- Metric 2: Total Credit Amount -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-lg); background: var(--color-bg-card); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: #fca5a5; text-transform: uppercase; letter-spacing: 0.5px;">Total Credit Issued</div>
                    <div style="font-size: 1.65rem; font-weight: 800; color: #ef4444; margin-top: 4px; font-family: monospace;">₹${totalCreditAmount.toLocaleString('en-IN')}</div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">Gross returned value</div>
                </div>
                <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(239, 68, 68, 0.12); color: #ef4444; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="arrow-down-left" style="width: 22px; height: 22px;"></i>
                </div>
            </div>

            <!-- Metric 3: Ledger Credit Notes -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-lg); background: var(--color-bg-card); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: #86efac; text-transform: uppercase; letter-spacing: 0.5px;">Customer Ledger Credits</div>
                    <div style="font-size: 1.65rem; font-weight: 800; color: #10b981; margin-top: 4px;">${creditNoteCount}</div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">Added to advance wallets</div>
                </div>
                <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: #10b981; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="wallet" style="width: 22px; height: 22px;"></i>
                </div>
            </div>

            <!-- Metric 4: Cash / Bank Refunds -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-lg); background: var(--color-bg-card); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.5px;">Bank / Cash Dispatched</div>
                    <div style="font-size: 1.65rem; font-weight: 800; color: #38bdf8; margin-top: 4px;">${directRefundCount}</div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">Direct refunds cleared</div>
                </div>
                <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(56, 189, 248, 0.12); color: #38bdf8; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="banknote" style="width: 22px; height: 22px;"></i>
                </div>
            </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="glass-panel" style="padding: 1rem 1.25rem; border-radius: var(--radius-md); background: var(--color-bg-card); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 260px;">
                <div style="position: relative; width: 100%; max-width: 380px;">
                    <i data-lucide="search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--color-text-muted);"></i>
                    <input type="text" value="${returnSearchQuery}" oninput="window.onSalesReturnSearch(this.value)" placeholder="Search Return #, Invoice Ref, Client..." 
                        class="glass-input" style="width: 100%; padding-left: 34px; height: 38px; border-radius: 8px; font-size: 0.85rem;">
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.65rem;">
                <span style="font-size: 0.8rem; color: var(--color-text-muted); font-weight: 500;">Refund Mode:</span>
                <div style="display: flex; gap: 4px; background: rgba(0,0,0,0.25); padding: 3px; border-radius: 8px; border: 1px solid var(--glass-border);">
                    <button type="button" onclick="window.filterSalesReturnsByMode('all')" style="padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600; background: ${returnRefundModeFilter === 'all' ? 'var(--color-primary)' : 'transparent'}; color: ${returnRefundModeFilter === 'all' ? '#fff' : 'var(--color-text-muted)'};">All</button>
                    <button type="button" onclick="window.filterSalesReturnsByMode('Credit Note')" style="padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600; background: ${returnRefundModeFilter === 'Credit Note' ? '#f59e0b' : 'transparent'}; color: ${returnRefundModeFilter === 'Credit Note' ? '#000' : 'var(--color-text-muted)'};">Credit Note</button>
                    <button type="button" onclick="window.filterSalesReturnsByMode('Bank Transfer')" style="padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600; background: ${returnRefundModeFilter === 'Bank Transfer' ? '#38bdf8' : 'transparent'}; color: ${returnRefundModeFilter === 'Bank Transfer' ? '#000' : 'var(--color-text-muted)'};">Bank</button>
                    <button type="button" onclick="window.filterSalesReturnsByMode('Cash')" style="padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600; background: ${returnRefundModeFilter === 'Cash' ? '#10b981' : 'transparent'}; color: ${returnRefundModeFilter === 'Cash' ? '#000' : 'var(--color-text-muted)'};">Cash</button>
                </div>
            </div>
        </div>

        <!-- Sales Returns Register Table -->
        <div class="glass-panel" style="overflow: hidden; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: rgba(0,0,0,0.25); border-bottom: 1px solid var(--glass-border);">
                    <tr>
                        <th style="padding: 1rem; text-align: left; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Return Voucher #</th>
                        <th style="padding: 1rem; text-align: left; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Original Tax Invoice</th>
                        <th style="padding: 1rem; text-align: left; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Customer</th>
                        <th style="padding: 1rem; text-align: left; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Date</th>
                        <th style="padding: 1rem; text-align: left; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Items / Reason</th>
                        <th style="padding: 1rem; text-align: right; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Return Amount (₹)</th>
                        <th style="padding: 1rem; text-align: center; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Settlement Mode</th>
                        <th style="padding: 1rem; text-align: center; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Ledger Status</th>
                        <th style="padding: 1rem; text-align: center; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredReturns.map(r => `
                        <tr style="border-bottom: 1px solid var(--glass-border-subtle); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                            <td style="padding: 1rem; color: #f59e0b; font-weight: 700; font-family: monospace;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <i data-lucide="file-minus" style="width: 14px; height: 14px; color: #f59e0b;"></i>
                                    ${r.id}
                                </div>
                            </td>
                            <td style="padding: 1rem;">
                                <span style="color: var(--color-primary); font-weight: 600; cursor: pointer; text-decoration: underline;" onclick="if(window.openPrintInvoiceModalById) window.openPrintInvoiceModalById('${r.originalInvoiceId}')" title="View Source Tax Invoice">
                                    ${r.originalInvoiceId}
                                </span>
                            </td>
                            <td style="padding: 1rem; font-weight: 600; color: var(--color-text-heading);">${r.customer}</td>
                            <td style="padding: 1rem; color: var(--color-text-muted); font-size: 0.85rem;">${r.date}</td>
                            <td style="padding: 1rem; color: #cbd5e1; font-size: 0.84rem; max-width: 250px;">
                                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.reason || ''}">
                                    ${r.reason || '-'}
                                </div>
                            </td>
                            <td style="padding: 1rem; text-align: right; font-weight: 800; color: #f87171; font-size: 0.95rem; font-family: monospace;">
                                ₹${Number(r.amount).toLocaleString('en-IN')}
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <span style="
                                    background: ${(r.refundMode || '').includes('Credit Note') ? 'rgba(245, 158, 11, 0.16)' : 'rgba(56, 189, 248, 0.16)'}; 
                                    color: ${(r.refundMode || '').includes('Credit Note') ? '#fbbf24' : '#38bdf8'}; 
                                    border: 1px solid ${(r.refundMode || '').includes('Credit Note') ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.35)'};
                                    padding: 2px 9px; border-radius: 9999px; font-size: 0.76rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;
                                ">
                                    ${(r.refundMode || '').includes('Credit Note') ? '💳 Credit Note' : '🏦 ' + r.refundMode}
                                </span>
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <span style="background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;">
                                    ${r.status || 'Processed'}
                                </span>
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <div style="display: flex; gap: 6px; justify-content: center;">
                                    <button type="button" class="btn btn-secondary" onclick="window.openPrintCreditNoteModal('${r.id}')" style="padding: 0.35rem 0.65rem;" title="Print Credit Note Voucher">
                                        <i data-lucide="printer" style="width: 15px; height: 15px;"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                    ${filteredReturns.length === 0 ? `
                        <tr>
                            <td colspan="9" style="padding: 3rem 1rem; text-align: center; color: var(--color-text-muted);">
                                <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; color: var(--color-text-muted);">
                                    <i data-lucide="inbox" style="width: 24px; height: 24px;"></i>
                                </div>
                                <div style="font-weight: 600; color: #f8fafc; font-size: 1rem;">No Sales Return Vouchers Found</div>
                                <p style="font-size: 0.82rem; margin: 4px 0 1rem; color: #94a3b8;">Record customer return vouchers or issue credit notes against billed invoices.</p>
                                <button type="button" class="btn btn-primary" onclick="window.openNewSalesReturnModal()" style="background: #f59e0b; border-color: #f59e0b; color: #000; font-weight: 700; padding: 0.5rem 1.25rem;">
                                    + Issue First Sales Return
                                </button>
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
    return container;
}

// Search and Filter Handlers
window.onSalesReturnSearch = (query) => {
    returnSearchQuery = query;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.filterSalesReturnsByMode = (mode) => {
    returnRefundModeFilter = mode;
    const store = window.Store || Store;
    if (store) store.notify();
};

// Modal for Creating New Sales Return / Credit Note
window.openNewSalesReturnModal = () => {
    const existing = document.getElementById('new-sr-modal');
    if (existing) existing.remove();

    const store = window.Store || Store;
    const sales = (store && store.state && store.state.sales) || [];

    const modal = document.createElement('div');
    modal.id = 'new-sr-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.88); backdrop-filter: blur(10px); z-index: 100050;
        display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 580px; max-width: 95vw; padding: 2rem; background: #0c121d; border: 1.5px solid rgba(245, 158, 11, 0.45); border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,0.85);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 36px; height: 36px; border-radius: 9px; background: rgba(245, 158, 11, 0.18); border: 1px solid rgba(245, 158, 11, 0.4); display: flex; align-items: center; justify-content: center; color: #f59e0b;">
                        <i data-lucide="rotate-ccw" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; color: #f8fafc; font-size: 1.3rem; font-weight: 700;">New Sales Return / Credit Note</h2>
                        <p style="margin: 2px 0 0; font-size: 0.76rem; color: #94a3b8;">Issue debit adjustment voucher and credit balance to customer ledger</p>
                    </div>
                </div>
                <button type="button" onclick="document.getElementById('new-sr-modal').remove()" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px;" title="Close">
                    <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                </button>
            </div>
            
            <form onsubmit="window.createSalesReturn(event)" style="display: flex; flex-direction: column; gap: 1.2rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.45rem; color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">Original Tax Invoice *</label>
                    <select id="sr-invoice-select" class="glass-input" required style="width: 100%; background: rgba(255,255,255,0.06); color: #f8fafc; border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; padding: 0.65rem;" onchange="window.onSalesReturnInvoiceSelected(this.value)">
                        <option value="">-- Select Billed Tax Invoice --</option>
                        ${sales.map(s => `<option value="${s.id}">${s.id} — ${s.customer} (Invoice Total: ₹${Number(s.amount).toLocaleString('en-IN')})</option>`).join('')}
                    </select>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">Customer Name</label>
                        <input type="text" id="sr-customer" class="glass-input" style="width: 100%; background: rgba(255,255,255,0.04); color: #94a3b8; border-radius: 8px; padding: 0.65rem;" readonly placeholder="Auto-filled from Invoice">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">Invoice Billed Value</label>
                        <input type="text" id="sr-invoice-val" class="glass-input" style="width: 100%; background: rgba(255,255,255,0.04); color: #94a3b8; border-radius: 8px; padding: 0.65rem; font-family: monospace;" readonly placeholder="₹0.00">
                    </div>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 0.45rem; color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">Return Items & Commercial Reason *</label>
                    <textarea id="sr-reason" class="glass-input" required style="width: 100%; height: 70px; resize: none; background: rgba(255,255,255,0.06); color: #f8fafc; border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; padding: 0.6rem; font-size: 0.85rem;" placeholder="e.g. Returned 2 French Windows due to dimension rework. Approved by Quality Control."></textarea>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">Return / Credit Amount (₹) *</label>
                        <input type="number" id="sr-amount" class="glass-input" min="1" step="0.01" required style="width: 100%; background: rgba(255,255,255,0.08); color: #f8fafc; border: 1.5px solid rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 0.65rem; font-weight: 700; font-size: 1rem; font-family: monospace;" placeholder="0.00">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">Settlement / Refund Mode *</label>
                        <select id="sr-refund-mode" class="glass-input" style="width: 100%; background: rgba(255,255,255,0.06); color: #f8fafc; border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; padding: 0.65rem;">
                            <option value="Credit Note">Credit Note (Credit to Customer Advance Wallet)</option>
                            <option value="Bank Transfer">Bank Refund (NEFT / RTGS Payout)</option>
                            <option value="Cash">Cash Refund (Counter Settlement)</option>
                        </select>
                    </div>
                </div>

                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 0.75rem 0.95rem; font-size: 0.78rem; color: #fde68a; display: flex; align-items: flex-start; gap: 8px;">
                    <i data-lucide="info" style="width: 16px; height: 16px; color: #f59e0b; flex-shrink: 0; margin-top: 1px;"></i>
                    <span>
                        Selecting <strong>'Credit Note'</strong> will instantly replenish the customer's advance balance in their ledger, making this amount immediately available for partial deductions on future sales orders.
                    </span>
                </div>

                <div style="margin-top: 0.75rem; display: flex; justify-content: flex-end; gap: 0.85rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('new-sr-modal').remove()" style="padding: 0.6rem 1.25rem;">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="background: #f59e0b; border-color: #f59e0b; color: #000; font-weight: 700; padding: 0.6rem 1.5rem; display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="check" style="width: 16px; height: 16px;"></i> Process & Post Return
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.onSalesReturnInvoiceSelected = (invId) => {
    const store = window.Store || Store;
    const inv = (store.state.sales || []).find(s => s.id === invId);
    const custInput = document.getElementById('sr-customer');
    const invValInput = document.getElementById('sr-invoice-val');
    const amtInput = document.getElementById('sr-amount');

    if (inv) {
        if (custInput) custInput.value = inv.customer || '';
        if (invValInput) invValInput.value = `₹${Number(inv.amount || 0).toLocaleString('en-IN')}`;
        if (amtInput && !amtInput.value) amtInput.value = inv.amount || '';
    }
};

window.createSalesReturn = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const invId = document.getElementById('sr-invoice-select').value;
    const customer = document.getElementById('sr-customer').value;
    const reason = document.getElementById('sr-reason').value;
    const amount = parseFloat(document.getElementById('sr-amount').value);
    const refundMode = document.getElementById('sr-refund-mode').value;

    if (!invId || !amount || isNaN(amount) || amount <= 0) {
        return alert('Please select an invoice and specify a valid return amount.');
    }

    const store = window.Store || Store;
    if (!store.state.salesReturns) store.state.salesReturns = [];
    if (!store.state.customerLedger) store.state.customerLedger = [];

    const returnId = `SR-${new Date().getFullYear()}-${String(100 + store.state.salesReturns.length + 1)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newReturn = {
        id: returnId,
        originalInvoiceId: invId,
        customer,
        reason,
        amount,
        refundMode,
        date: todayStr,
        status: refundMode === 'Credit Note' ? 'Credit Note Posted' : 'Refund Processed',
        timestamp: new Date().toISOString()
    };

    // If Credit Note, credit the amount back into customer's advance wallet in Store
    if (refundMode === 'Credit Note') {
        const cust = (store.state.customers || []).find(c => 
            c.name && c.name.toLowerCase() === customer.trim().toLowerCase()
        );
        if (cust) {
            cust.advanceBalance = (Number(cust.advanceBalance) || 0) + amount;
        }

        // Add transaction entry into customer financial ledger
        store.state.customerLedger.unshift({
            id: `LED-${Date.now()}`,
            invoiceId: invId,
            returnVoucherId: returnId,
            customerId: cust ? cust.id : 'CUST-GEN',
            customerName: customer,
            date: todayStr,
            type: 'CREDIT_NOTE',
            paymentMode: 'Credit Note',
            credit: amount,
            debit: 0,
            particulars: `Sales Return Credit Note ${returnId} for invoice ${invId}: ₹${amount.toLocaleString('en-IN')} added to advance pool`,
            timestamp: new Date().toISOString()
        });
    }

    store.state.salesReturns.unshift(newReturn);
    if (typeof store.saveState === 'function') store.saveState();
    store.notify();

    const modal = document.getElementById('new-sr-modal');
    if (modal) modal.remove();

    alert(`Sales Return Voucher ${newReturn.id} processed successfully! ${refundMode === 'Credit Note' ? `₹${amount.toLocaleString('en-IN')} credited to ${customer}'s advance pool.` : ''}`);
};

// Printable Credit Note Voucher Modal
window.openPrintCreditNoteModal = (srId) => {
    const store = window.Store || Store;
    const r = (store.state.salesReturns || []).find(item => item.id === srId);
    if (!r) return alert('Return record not found');

    const modal = document.createElement('div');
    modal.id = 'print-credit-note-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 100060;
        display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 680px; max-width: 95vw; background: #ffffff; color: #0f172a; padding: 2.5rem; border-radius: 12px; box-shadow: 0 25px 60px rgba(0,0,0,0.7); max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
                <div>
                    <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Credit Note Voucher</h2>
                    <p style="margin: 2px 0 0; font-size: 0.85rem; color: #475569;">StyloBuild BMS • Commercial Accounting & Reverse Billing</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.15rem; font-weight: 800; color: #f59e0b; font-family: monospace;">${r.id}</div>
                    <div style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">Date: ${r.date}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.75rem; background: #f8fafc; padding: 1.25rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Issued To (Client):</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-top: 3px;">${r.customer}</div>
                </div>
                <div>
                    <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Against Tax Invoice Ref:</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: #4338ca; margin-top: 3px; font-family: monospace;">${r.originalInvoiceId}</div>
                </div>
            </div>

            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 1.75rem;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                        <tr>
                            <th style="padding: 0.75rem 1rem; text-align: left; color: #334155;">Description / Reason</th>
                            <th style="padding: 0.75rem 1rem; text-align: center; color: #334155;">Settlement</th>
                            <th style="padding: 0.75rem 1rem; text-align: right; color: #334155;">Credit Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 1rem; color: #1e293b;">
                                <div style="font-weight: 600;">Sales Return Adjustment</div>
                                <div style="font-size: 0.82rem; color: #64748b; margin-top: 4px;">${r.reason || 'Goods returned as per commercial agreement.'}</div>
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <span style="background: #fef3c7; color: #92400e; padding: 3px 9px; border-radius: 9999px; font-weight: 700; font-size: 0.8rem;">
                                    ${r.refundMode}
                                </span>
                            </td>
                            <td style="padding: 1rem; text-align: right; font-weight: 800; font-size: 1.2rem; color: #b91c1c; font-family: monospace;">
                                ₹${Number(r.amount).toLocaleString('en-IN')}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.5rem; border-top: 1px dashed #cbd5e1;">
                <div>
                    <div style="font-size: 0.76rem; color: #64748b;">Ledger Status: <strong>${r.status || 'Processed'}</strong></div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">This is a computer generated commercial accounting credit note voucher.</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.82rem; font-weight: 700; color: #0f172a;">Authorized Signatory</div>
                    <div style="font-size: 0.74rem; color: #64748b; margin-top: 1px;">StyloBuild BMS Finance Desk</div>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('print-credit-note-modal').remove()" style="color: #334155; border-color: #cbd5e1;">
                    Close
                </button>
                <button type="button" class="btn btn-primary" onclick="window.print()" style="background: #0f172a; color: white;">
                    <i data-lucide="printer"></i> Print Voucher
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};
