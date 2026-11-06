
export function renderPayments(state) {
    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.padding = '2rem';

    // State for Tabs
    if (!window.currentPaymentType) window.currentPaymentType = 'inward'; // 'inward' (sales) or 'outward' (purchase)
    if (!window.currentPaymentTab) window.currentPaymentTab = 'pending';

    const sales = state.sales || [];
    const purchases = state.purchases || [];

    // Logic for Views
    const today = new Date();

    // Inward Lists (Sales)
    const in_pending = sales.filter(s => s.balance > 0 && new Date(s.dueDate) >= today);
    const in_overdue = sales.filter(s => s.balance > 0 && new Date(s.dueDate) < today);
    const in_advance = sales.filter(s => s.paymentType === 'Advance' || s.status === 'Advance');

    // Outward Lists (Purchases)
    const out_pending = purchases.filter(p => p.balance > 0 && new Date(p.dueDate) >= today);
    const out_overdue = purchases.filter(p => p.balance > 0 && new Date(p.dueDate) < today);
    const out_processed = purchases.filter(p => p.balance === 0); // Just "completed" for now

    // Determine Active Lists based on Payment Type
    const isInward = window.currentPaymentType === 'inward';
    const active_pending = isInward ? in_pending : out_pending;
    const active_overdue = isInward ? in_overdue : out_overdue;
    const active_third = isInward ? in_advance : out_processed; // Advance for Inward, Processed for Outward

    // Helper: Modals
    window.openAdvancePaymentModal = () => {
        const modal = document.createElement('div');
        modal.id = 'adv-pay-modal';
        modal.className = 'modal-backdrop animate-fade-in';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 1000;
            display: flex; align-items: center; justify-content: center;
        `;
        modal.innerHTML = `
            <div class="glass-panel" style="width: 400px; padding: 2rem; background: var(--color-bg-sidebar);">
                <h3 style="margin-top: 0;">Record Advance Payment</h3>
                <p style="color: var(--color-text-muted); font-size: 0.9rem;">Received from Customer</p>
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    <input type="text" id="adv-cust" class="glass-input" placeholder="Customer Name">
                    <input type="number" id="adv-amt" class="glass-input" placeholder="Amount (₹)">
                    <input type="text" id="adv-note" class="glass-input" placeholder="Reference / Note">
                </div>
                <div style="margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button class="btn" onclick="document.getElementById('adv-pay-modal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="window.saveAdvancePayment()">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.saveAdvancePayment = () => {
        const cust = document.getElementById('adv-cust').value;
        const amt = parseFloat(document.getElementById('adv-amt').value);
        if (!cust || !amt) return alert('Details required');

        const store = window.Store || Store;
        store.state.sales.push({
            id: `ADV-${Date.now().toString().slice(-4)}`,
            customer: cust, date: new Date().toISOString().split('T')[0],
            amount: amt, paidAmount: amt, balance: 0,
            items: 'Ad-hoc Advance Payment', status: 'Advance',
            dueDate: new Date().toISOString().split('T')[0], paymentType: 'Advance'
        });
        store.notify();
        document.getElementById('adv-pay-modal').remove();
    };


    // Helper: Tab Button
    const renderSummaryCard = (id, label, count, color, icon) => {
        const isActive = window.currentPaymentTab === id;
        return `
            <button onclick="window.switchPaymentTab('${id}')" 
                class="glass-panel"
                style="
                    flex: 1; padding: 1.5rem; text-align: left; cursor: pointer;
                    background: ${isActive ? 'var(--glass-bg)' : 'transparent'};
                    border: 1px solid ${isActive ? color : 'var(--glass-border)'};
                    transition: all 0.2s; position: relative; overflow: hidden;
                "
            >
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <span style="color: var(--color-text-muted); font-size: 0.9rem; font-weight: 600; text-transform: uppercase;">${label}</span>
                    <div style="
                        width: 32px; height: 32px; border-radius: 50%; 
                        background: ${color}20; color: ${color}; 
                        display: flex; align-items: center; justify-content: center;
                    ">
                        <i data-lucide="${icon}" style="width: 18px;"></i>
                    </div>
                </div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--color-text-main);">
                    ${count}
                </div>
                ${isActive ? `<div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; background: ${color};"></div>` : ''}
            </button>
        `;
    };

    // Helper: List Render
    const renderList = (items, emptyMsg) => {
        if (items.length === 0) return `<div style="text-align: center; padding: 4rem; color: var(--color-text-muted);"><i data-lucide="inbox" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 1rem;"></i><p>${emptyMsg}</p></div>`;
        return `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${items.map(item => `
                     <div class="glass-panel" style="padding: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="
                                width: 48px; height: 48px; border-radius: 50%; 
                                background: var(--color-bg-main); display: flex; align-items: center; justify-content: center;
                                border: 1px solid var(--glass-border);
                            ">
                                <span style="font-weight: 600; font-size: 1.1rem;">${(item.customer || item.vendor).charAt(0)}</span>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.1rem;">${item.customer || item.vendor}</h3>
                                <div style="display: flex; gap: 0.75rem; align-items: center; margin-top: 0.25rem;">
                                    <span style="font-size: 0.85rem; color: var(--color-text-muted);">${item.id}</span>
                                    <span style="font-size: 0.85rem; color: var(--color-text-muted);">•</span>
                                    <span style="font-size: 0.85rem; color: var(--color-text-muted);">Due: ${item.dueDate}</span>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.2rem; font-weight: 700; color: ${item.balance > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">
                                ₹ ${item.balance > 0 ? item.balance.toLocaleString() : item.amount.toLocaleString()}
                            </div>
                             <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0.25rem;">
                                ${item.balance > 0 ? 'Balance Due' : 'Paid'}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
                <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">Payments</h1>
                <p style="color: var(--color-text-muted);">Manage cash flow, track overdue invoices, and record payments.</p>
            </div>
            
            <div style="display: flex; gap: 1rem; align-items: center;">
                 <div class="glass-panel" style="padding: 4px; display: flex; gap: 4px; border-radius: 8px;">
                    <button onclick="window.switchPaymentType('inward')" 
                        style="padding: 8px 16px; border-radius: 6px; border: none; font-weight: 500; cursor: pointer; transition: all 0.2s;
                        background: ${isInward ? 'var(--color-primary)' : 'transparent'}; color: ${isInward ? 'white' : 'var(--color-text-muted)'};">
                        Inward (Sales)
                    </button>
                    <button onclick="window.switchPaymentType('outward')" 
                        style="padding: 8px 16px; border-radius: 6px; border: none; font-weight: 500; cursor: pointer; transition: all 0.2s;
                        background: ${!isInward ? 'var(--color-primary)' : 'transparent'}; color: ${!isInward ? 'white' : 'var(--color-text-muted)'};">
                        Outward (Purchase)
                    </button>
                 </div>
                 <button class="btn btn-primary" onclick="window.openAdvancePaymentModal()">
                    <i data-lucide="plus"></i> ${isInward ? 'Advance Pay' : 'Vendor Advance'}
                </button>
            </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
            ${renderSummaryCard('pending', 'Pending', active_pending.length, 'var(--color-warning)', 'clock')}
            ${renderSummaryCard('overdue', 'Overdue', active_overdue.length, 'var(--color-danger)', 'alert-circle')}
            ${renderSummaryCard('third', isInward ? 'Advance' : 'Completed', active_third.length, 'var(--color-success)', isInward ? 'wallet' : 'check-circle')}
        </div>

        <div class="glass-panel" style="flex: 1; padding: 2rem; overflow-y: auto;">
             <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; font-size: 1.25rem;">
                   ${window.currentPaymentTab.charAt(0).toUpperCase() + window.currentPaymentTab.slice(1)} List
                </h2>
            </div>
            ${window.currentPaymentTab === 'pending' ? renderList(active_pending, 'No pending items.') :
            window.currentPaymentTab === 'overdue' ? renderList(active_overdue, 'No overdue items.') :
                renderList(active_third, 'No items found.')}
        </div>
    `;

    return container;
}

window.switchPaymentType = (type) => {
    window.currentPaymentType = type;
    window.currentPaymentTab = 'pending'; // Reset tab on switch
    const store = window.Store || Store;
    if (store) store.notify();
};

// Global Tab Switcher (Existing)
window.switchPaymentTab = (tab) => {
    window.currentPaymentTab = tab;
    const store = window.Store || Store;
    if (store) store.notify();
};
