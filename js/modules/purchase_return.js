import { Store } from '../store.js';

// --- PURCHASE RETURN & DEBIT NOTES DEDICATED MODULE ---

let prSearchQuery = '';
let prRefundModeFilter = 'all';

export function renderPurchaseReturn(state) {
    const store = window.Store || Store;
    if (!store.state.purchases) store.state.purchases = [];
    if (!store.state.purchaseReturns) store.state.purchaseReturns = [];

    const purchases = store.state.purchases || [];
    const allReturns = store.state.purchaseReturns || [];

    // Filtered returns
    const filteredReturns = allReturns.map(r => ({
        ...r,
        poId: r.poId || r.originalPoId || 'PO-1001',
        vendor: r.vendor || r.supplier || 'Vendor',
        items: r.items || 'Material Items',
        creditAmount: Number(r.creditAmount !== undefined ? r.creditAmount : r.amount) || 0,
        refundMode: r.refundMode || 'Debit Note (Vendor Account)',
        status: r.status || 'Processed'
    })).filter(r => {
        const matchesMode = prRefundModeFilter === 'all' || 
            (r.refundMode && r.refundMode.toLowerCase().includes(prRefundModeFilter.toLowerCase()));
        const q = prSearchQuery.trim().toLowerCase();
        const matchesQuery = !q || 
            (r.id && r.id.toLowerCase().includes(q)) ||
            (r.poId && r.poId.toLowerCase().includes(q)) ||
            (r.vendor && r.vendor.toLowerCase().includes(q)) ||
            (r.reason && r.reason.toLowerCase().includes(q)) ||
            (r.items && r.items.toLowerCase().includes(q));
        return matchesMode && matchesQuery;
    });

    // KPI Metrics
    const totalDebitIssued = filteredReturns.reduce((sum, r) => sum + (Number(r.creditAmount) || 0), 0);
    const debitNoteCount = filteredReturns.filter(r => (r.refundMode || '').includes('Debit Note')).length;
    const directRefundCount = filteredReturns.length - debitNoteCount;

    const container = document.createElement('div');
    container.className = 'purchase-return-view animate-fade-in';
    container.style.cssText = 'display: flex; flex-direction: column; gap: 1.5rem; width: 100%; padding-bottom: 3rem;';

    container.innerHTML = `
        <!-- Top Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(239, 68, 68, 0.16); border: 1.5px solid rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; color: #ef4444; box-shadow: 0 0 16px rgba(239, 68, 68, 0.25);">
                        <i data-lucide="rotate-ccw" style="width: 22px; height: 22px;"></i>
                    </div>
                    <div>
                        <h1 style="margin: 0; font-size: 1.85rem; font-weight: 800; color: #f8fafc; line-height: 1.2;">
                            Purchase Return & Debit Notes
                        </h1>
                        <p style="margin: 2px 0 0; font-size: 0.88rem; color: var(--color-text-muted);">
                            Dedicated Vendor Return Vouchers, Debit Note Register, and Supplier Payable Adjustments
                        </p>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 0.75rem; align-items: center;">
                <button type="button" class="btn btn-primary" onclick="window.openNewPurchaseReturnModal()" style="background: linear-gradient(135deg, #ef4444, #dc2626); border-color: #ef4444; color: #fff; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; padding: 0.65rem 1.35rem; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.35);">
                    <i data-lucide="plus" style="width: 18px; height: 18px;"></i> New Purchase Return / Debit Note
                </button>
            </div>
        </div>

        <!-- Metric KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
            <!-- Metric 1: Total Returns -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-lg); background: var(--color-bg-card); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.35rem;">
                        RETURN VOUCHERS
                    </div>
                    <div style="font-size: 1.85rem; font-weight: 800; color: #f8fafc; line-height: 1.1;">
                        ${filteredReturns.length}
                    </div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">
                        Recorded vendor return events
                    </div>
                </div>
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(239, 68, 68, 0.12); display: flex; align-items: center; justify-content: center; color: #ef4444;">
                    <i data-lucide="receipt" style="width: 22px; height: 22px;"></i>
                </div>
            </div>

            <!-- Metric 2: Total Debit Amount -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-lg); background: var(--color-bg-card); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.35rem;">
                        TOTAL DEBIT ISSUED
                    </div>
                    <div style="font-size: 1.85rem; font-weight: 800; color: #f87171; line-height: 1.1;">
                        ₹${totalDebitIssued.toLocaleString('en-IN')}
                    </div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">
                        Gross returned procurement value
                    </div>
                </div>
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(239, 68, 68, 0.12); display: flex; align-items: center; justify-content: center; color: #f87171;">
                    <i data-lucide="trending-down" style="width: 22px; height: 22px;"></i>
                </div>
            </div>

            <!-- Metric 3: Debit Notes Issued -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-lg); background: var(--color-bg-card); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.35rem;">
                        VENDOR DEBIT NOTES
                    </div>
                    <div style="font-size: 1.85rem; font-weight: 800; color: #34d399; line-height: 1.1;">
                        ${debitNoteCount}
                    </div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">
                        Applied against accounts payable
                    </div>
                </div>
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(16, 185, 129, 0.12); display: flex; align-items: center; justify-content: center; color: #34d399;">
                    <i data-lucide="wallet" style="width: 22px; height: 22px;"></i>
                </div>
            </div>

            <!-- Metric 4: Direct Bank Refunds -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-lg); background: var(--color-bg-card); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.35rem;">
                        BANK / CASH DISPATCHED
                    </div>
                    <div style="font-size: 1.85rem; font-weight: 800; color: #38bdf8; line-height: 1.1;">
                        ${directRefundCount}
                    </div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">
                        Supplier direct refunds cleared
                    </div>
                </div>
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(56, 189, 248, 0.12); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                    <i data-lucide="banknote" style="width: 22px; height: 22px;"></i>
                </div>
            </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="glass-panel" style="padding: 1rem 1.25rem; border-radius: var(--radius-md); background: var(--color-bg-card); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; max-width: 450px;">
                <div style="position: relative; width: 100%;">
                    <i data-lucide="search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--color-text-muted);"></i>
                    <input 
                        type="text" 
                        placeholder="Search Return #, PO Ref, Vendor..." 
                        value="${prSearchQuery}"
                        oninput="window.updatePurchaseReturnSearch(this.value)"
                        class="glass-input" 
                        style="width: 100%; padding-left: 2.2rem; background: rgba(255, 255, 255, 0.05); color: #f8fafc; border: 1px solid var(--glass-border); border-radius: 8px; font-size: 0.88rem;"
                    >
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.8rem; color: var(--color-text-muted); font-weight: 600;">Refund Mode:</span>
                <div style="display: flex; gap: 4px; background: rgba(0,0,0,0.3); padding: 3px; border-radius: 6px; border: 1px solid var(--glass-border);">
                    ${['all', 'Debit Note', 'Bank', 'Cash'].map(mode => `
                        <button 
                            type="button" 
                            onclick="window.setPurchaseReturnFilter('${mode}')" 
                            style="
                                padding: 4px 10px; font-size: 0.78rem; font-weight: 600; border-radius: 4px; border: none; cursor: pointer; transition: all 0.2s;
                                background: ${prRefundModeFilter === mode ? '#ef4444' : 'transparent'};
                                color: ${prRefundModeFilter === mode ? '#ffffff' : 'var(--color-text-muted)'};
                            "
                        >
                            ${mode === 'all' ? 'All' : mode}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Primary Purchase Return Vouchers Register Table -->
        <div class="glass-panel" style="padding: 0; border-radius: var(--radius-lg); overflow: hidden; background: var(--color-bg-card); border: 1px solid var(--glass-border);">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: rgba(239, 68, 68, 0.08); border-bottom: 1px solid rgba(239, 68, 68, 0.3);">
                    <tr>
                        <th style="padding: 1rem; font-size: 0.82rem; color: #fca5a5; font-weight: 600;">Return Voucher #</th>
                        <th style="padding: 1rem; font-size: 0.82rem; color: #fca5a5; font-weight: 600;">Original PO Ref</th>
                        <th style="padding: 1rem; font-size: 0.82rem; color: #fca5a5; font-weight: 600;">Vendor / Supplier</th>
                        <th style="padding: 1rem; font-size: 0.82rem; color: #fca5a5; font-weight: 600;">Date</th>
                        <th style="padding: 1rem; font-size: 0.82rem; color: #fca5a5; font-weight: 600;">Returned Items & Reason</th>
                        <th style="padding: 1rem; text-align: right; font-size: 0.82rem; color: #fca5a5; font-weight: 600;">Return Amount (₹)</th>
                        <th style="padding: 1rem; text-align: center; font-size: 0.82rem; color: #fca5a5; font-weight: 600;">Settlement Mode</th>
                        <th style="padding: 1rem; text-align: center; font-size: 0.82rem; color: #fca5a5; font-weight: 600;">Ledger Status</th>
                        <th style="padding: 1rem; text-align: center; font-size: 0.82rem; color: #fca5a5; font-weight: 600;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredReturns.length > 0 ? filteredReturns.map(r => `
                        <tr style="border-bottom: 1px solid var(--glass-border-subtle); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                            <td style="padding: 1rem; color: #ef4444; font-weight: 700; font-family: monospace;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <i data-lucide="file-minus" style="width: 14px; height: 14px; color: #ef4444;"></i>
                                    ${r.id}
                                </div>
                            </td>
                            <td style="padding: 1rem;">
                                <span style="color: var(--color-primary); font-weight: 600; font-family: monospace;">
                                    ${r.poId}
                                </span>
                            </td>
                            <td style="padding: 1rem; font-weight: 600; color: var(--color-text-heading);">${r.vendor}</td>
                            <td style="padding: 1rem; color: var(--color-text-muted); font-size: 0.85rem;">${r.date}</td>
                            <td style="padding: 1rem; color: #cbd5e1; font-size: 0.84rem; max-width: 250px;">
                                <div style="font-weight: 600; color: #f8fafc;">${r.items}</div>
                                <div style="color: #f87171; font-size: 0.76rem; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.reason || ''}">
                                    Reason: ${r.reason || '-'}
                                </div>
                            </td>
                            <td style="padding: 1rem; text-align: right; font-weight: 800; color: #34d399; font-size: 0.95rem; font-family: monospace;">
                                ₹${Number(r.creditAmount).toLocaleString('en-IN')}
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <span style="
                                    background: ${(r.refundMode || '').includes('Debit Note') ? 'rgba(239, 68, 68, 0.16)' : 'rgba(56, 189, 248, 0.16)'}; 
                                    color: ${(r.refundMode || '').includes('Debit Note') ? '#fca5a5' : '#38bdf8'}; 
                                    border: 1px solid ${(r.refundMode || '').includes('Debit Note') ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.35)'};
                                    padding: 2px 9px; border-radius: 9999px; font-size: 0.76rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;
                                ">
                                    ${(r.refundMode || '').includes('Debit Note') ? '🧾 Debit Note' : '🏦 ' + r.refundMode}
                                </span>
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <span style="background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;">
                                    ${r.status || 'Processed'}
                                </span>
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <div style="display: flex; gap: 6px; justify-content: center;">
                                    <button type="button" class="btn btn-secondary" onclick="window.openPrintDebitNoteModal('${r.id}')" style="padding: 0.35rem 0.65rem;" title="Print Debit Note Voucher">
                                        <i data-lucide="printer" style="width: 15px; height: 15px;"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="9" style="padding: 3.5rem; text-align: center; color: var(--color-text-muted);">
                                <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
                                    <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); display: flex; align-items: center; justify-content: center; color: #ef4444;">
                                        <i data-lucide="rotate-ccw" style="width: 26px; height: 26px;"></i>
                                    </div>
                                    <div style="font-size: 1.05rem; font-weight: 600; color: #f8fafc;">No purchase returns found</div>
                                    <p style="font-size: 0.85rem; max-width: 400px; margin: 0; line-height: 1.5;">
                                        Record defective material returns, damaged deliveries, and generate supplier debit notes.
                                    </p>
                                    <button type="button" class="btn btn-primary" onclick="window.openNewPurchaseReturnModal()" style="background: #ef4444; border-color: #ef4444; color: #fff; font-weight: 700; margin-top: 0.5rem; padding: 0.5rem 1.25rem;">
                                        + Record First Return
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
    `;

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
    return container;
}

// Search & Filter Callbacks
window.updatePurchaseReturnSearch = (query) => {
    prSearchQuery = query;
    const store = window.Store || Store;
    if (store && typeof store.notify === 'function') store.notify();
};

window.setPurchaseReturnFilter = (filter) => {
    prRefundModeFilter = filter;
    const store = window.Store || Store;
    if (store && typeof store.notify === 'function') store.notify();
};

// Global Action: Modal to Record Purchase Return & Generate Debit Note
window.openNewPurchaseReturnModal = () => {
    const existing = document.getElementById('new-pr-modal');
    if (existing) existing.remove();

    const store = window.Store || Store;
    const purchases = (store && store.state && store.state.purchases) || [];

    const modal = document.createElement('div');
    modal.id = 'new-pr-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.88); backdrop-filter: blur(10px); z-index: 100050;
        display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 580px; max-width: 95vw; padding: 2rem; background: #0c121d; border: 1.5px solid rgba(239, 68, 68, 0.45); border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,0.85);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 36px; height: 36px; border-radius: 9px; background: rgba(239, 68, 68, 0.18); border: 1px solid rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; color: #ef4444;">
                        <i data-lucide="rotate-ccw" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: #f8fafc;">New Purchase Return / Debit Note</h3>
                        <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--color-text-muted);">Issue debit adjustment voucher and reduce vendor accounts payable</p>
                    </div>
                </div>
                <button type="button" onclick="document.getElementById('new-pr-modal').remove()" style="background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 6px;">
                    <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                </button>
            </div>

            <form onsubmit="window.saveStandalonePurchaseReturn(event)" style="display: flex; flex-direction: column; gap: 1.15rem;">
                <!-- Select Purchase Order -->
                <div>
                    <label style="display: block; font-size: 0.82rem; color: #cbd5e1; font-weight: 600; margin-bottom: 0.4rem;">
                        Original Purchase Order Ref *
                    </label>
                    <select id="sr-pr-po-id" class="glass-input" required style="width: 100%;" onchange="window.onStandalonePrPoSelect(this.value)">
                        <option value="" disabled selected>-- Select Procurement PO --</option>
                        ${purchases.map(p => `
                            <option value="${p.id}" data-vendor="${p.vendor}" data-amount="${p.amount}">
                                ${p.id} • ${p.vendor} (₹${Number(p.amount || 0).toLocaleString('en-IN')})
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: #cbd5e1; font-weight: 500; margin-bottom: 0.4rem;">Vendor Name</label>
                        <input type="text" id="sr-pr-vendor" class="glass-input" readonly placeholder="Auto-filled from PO" style="width: 100%; opacity: 0.8; background: rgba(0,0,0,0.3);">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: #cbd5e1; font-weight: 500; margin-bottom: 0.4rem;">PO Billed Value</label>
                        <input type="text" id="sr-pr-po-amount" class="glass-input" readonly placeholder="₹0.00" style="width: 100%; opacity: 0.8; background: rgba(0,0,0,0.3); font-weight: 700; color: #38bdf8;">
                    </div>
                </div>

                <!-- Returned Items & Reason -->
                <div>
                    <label style="display: block; font-size: 0.82rem; color: #cbd5e1; font-weight: 600; margin-bottom: 0.4rem;">
                        Return Items & Rejection Reason *
                    </label>
                    <textarea id="sr-pr-reason" class="glass-input" required rows="2" placeholder="e.g. Returned 4 pairs of SS Friction Stays due to arm distortion. Rejected during QA." style="width: 100%;"></textarea>
                </div>

                <!-- Amount & Settlement Mode -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: #cbd5e1; font-weight: 600; margin-bottom: 0.4rem;">
                            Return / Debit Amount (₹) *
                        </label>
                        <input type="number" id="sr-pr-amount" class="glass-input" required min="1" step="0.01" placeholder="0.00" style="width: 100%; font-weight: 800; font-size: 1.05rem; color: #34d399;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: #cbd5e1; font-weight: 600; margin-bottom: 0.4rem;">
                            Settlement / Refund Mode *
                        </label>
                        <select id="sr-pr-mode" class="glass-input" style="width: 100%;">
                            <option value="Debit Note (Vendor Account)" selected>Debit Note (Credit to Supplier Ledger)</option>
                            <option value="Bank Refund">Direct Bank Refund</option>
                            <option value="Cash Refund">Cash Dispatched</option>
                        </select>
                    </div>
                </div>

                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.78rem; color: #fca5a5; display: flex; align-items: flex-start; gap: 8px;">
                    <i data-lucide="info" style="width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px;"></i>
                    <span>
                        Selecting <strong>'Debit Note'</strong> will instantly reduce your Accounts Payable to this supplier or create an advance credit pool against future material purchases.
                    </span>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.75rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('new-pr-modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #ef4444, #dc2626); border-color: #ef4444; color: #fff; font-weight: 700; padding: 0.6rem 1.45rem; display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="check" style="width: 16px; height: 16px;"></i> Process & Post Return
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.onStandalonePrPoSelect = (poId) => {
    const store = window.Store || Store;
    const po = (store.state.purchases || []).find(p => p.id === poId);
    if (!po) return;

    const vendorInp = document.getElementById('sr-pr-vendor');
    const amtInp = document.getElementById('sr-pr-po-amount');
    const returnAmtInp = document.getElementById('sr-pr-amount');

    if (vendorInp) vendorInp.value = po.vendor || '';
    if (amtInp) amtInp.value = `₹${Number(po.amount || 0).toLocaleString('en-IN')}`;
    if (returnAmtInp && !returnAmtInp.value) returnAmtInp.value = po.amount || '';
};

window.saveStandalonePurchaseReturn = (e) => {
    e.preventDefault();
    const store = window.Store || Store;
    const poId = document.getElementById('sr-pr-po-id').value;
    const vendor = document.getElementById('sr-pr-vendor').value;
    const reason = document.getElementById('sr-pr-reason').value;
    const creditAmount = parseFloat(document.getElementById('sr-pr-amount').value) || 0;
    const mode = document.getElementById('sr-pr-mode').value;

    if (!poId || !vendor || creditAmount <= 0) {
        return alert('Please select a Purchase Order and enter a valid return amount.');
    }

    if (!store.state.purchaseReturns) store.state.purchaseReturns = [];

    const returnId = `PR-${100 + store.state.purchaseReturns.length + 1}`;
    const debitNoteId = `DN-${new Date().getFullYear()}-${100 + store.state.purchaseReturns.length + 1}`;

    const newReturn = {
        id: returnId,
        poId: poId,
        vendor: vendor,
        items: reason,
        reason: reason,
        creditAmount: creditAmount,
        refundMode: mode,
        debitNoteId: debitNoteId,
        date: new Date().toISOString().split('T')[0],
        status: 'Processed',
        createdAt: new Date().toISOString()
    };

    store.state.purchaseReturns.unshift(newReturn);

    // Update vendor ledger entry
    if (!store.state.vendorLedger) store.state.vendorLedger = [];
    store.state.vendorLedger.unshift({
        id: `VLED-${Date.now()}`,
        voucherId: returnId,
        debitNoteId: debitNoteId,
        poId: poId,
        vendor: vendor,
        date: newReturn.date,
        type: 'PURCHASE_RETURN_DEBIT_NOTE',
        debitAmount: creditAmount,
        particulars: `Purchase Return ${returnId} against ${poId} - Debit Note ${debitNoteId} issued`,
        timestamp: new Date().toISOString()
    });

    if (typeof store.saveState === 'function') store.saveState();
    store.notify();

    const modal = document.getElementById('new-pr-modal');
    if (modal) modal.remove();

    alert(`Purchase Return ${returnId} recorded successfully with Debit Note ${debitNoteId} for ₹${creditAmount.toLocaleString('en-IN')}.`);
};

// Printable Debit Note Modal
window.openPrintDebitNoteModal = (returnId) => {
    const store = window.Store || Store;
    const r = (store.state.purchaseReturns || []).find(item => item.id === returnId);
    if (!r) return alert('Purchase return voucher not found');

    const modal = document.createElement('div');
    modal.id = 'print-debit-note-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 100060;
        display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 700px; max-width: 95vw; background: #ffffff; color: #1e293b; padding: 2.5rem; border-radius: 12px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); max-height: 90vh; overflow-y: auto;">
            <!-- Actions -->
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 1.5rem;" class="no-print">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('print-debit-note-modal').remove()" style="padding: 0.45rem 1rem;">Close</button>
                <button type="button" class="btn btn-primary" onclick="window.print()" style="padding: 0.45rem 1.25rem; background: #ef4444; border: none; color: white;">
                    <i data-lucide="printer" style="width: 16px; height: 16px;"></i> Print Voucher
                </button>
            </div>

            <!-- Debit Note Document -->
            <div style="border: 2px solid #0f172a; padding: 1.5rem; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 1rem; margin-bottom: 1.25rem;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #0f172a; text-transform: uppercase;">DEBIT NOTE VOUCHER</h2>
                        <div style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">Procurement Reversal & Vendor Debit Adjustment</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.1rem; font-weight: 800; color: #ef4444; font-family: monospace;">${r.debitNoteId || r.id}</div>
                        <div style="font-size: 0.82rem; color: #64748b;">Date: ${r.date}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; font-size: 0.88rem;">
                    <div style="background: #f8fafc; padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid #e2e8f0;">
                        <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Issued To (Supplier):</div>
                        <div style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-top: 3px;">${r.vendor}</div>
                        <div style="color: #64748b; font-size: 0.82rem;">Source PO Ref: <strong style="color: #0f172a;">${r.poId}</strong></div>
                    </div>
                    <div style="background: #f8fafc; padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid #e2e8f0;">
                        <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Accounting Impact:</div>
                        <div style="font-size: 0.95rem; font-weight: 700; color: #059669; margin-top: 3px;">${r.refundMode || 'Debit Note (Payable Offset)'}</div>
                        <div style="color: #64748b; font-size: 0.82rem;">Voucher Status: <strong style="color: #059669;">${r.status || 'Processed'}</strong></div>
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <div style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 0.4rem;">Particulars of Rejection / Returned Goods:</div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.85rem; font-size: 0.9rem; color: #1e293b; line-height: 1.5;">
                        ${r.items || r.reason}
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-bottom: 2rem;">
                    <div style="width: 280px; background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 8px; padding: 0.85rem 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 700; color: #991b1b; font-size: 0.95rem;">Total Debit Value:</span>
                            <span style="font-weight: 800; color: #dc2626; font-size: 1.35rem; font-family: monospace;">₹${Number(r.creditAmount).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-top: 3rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1; font-size: 0.82rem; color: #64748b;">
                    <div>Prepared by: <strong>Accounts Dept</strong></div>
                    <div>Authorized Signatory: <strong>Purchase Manager</strong></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};
