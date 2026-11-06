import { Store } from '../store.js';

export function renderPurchase(state) {
    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.padding = '2rem';

    const store = window.Store || Store;
    if (!store.state.purchases) store.state.purchases = [];
    if (!store.state.purchaseReturns) store.state.purchaseReturns = [];

    if (!window.purchaseSubView) window.purchaseSubView = 'orders';

    const purchases = store.state.purchases || [];
    const purchaseReturns = store.state.purchaseReturns || [];

    // Helper: Create Modal
    window.openNewPurchaseModal = () => {
        const modal = document.createElement('div');
        modal.id = 'new-purchase-modal';
        modal.className = 'modal-backdrop animate-fade-in';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 1000;
            display: flex; align-items: center; justify-content: center;
        `;
        modal.innerHTML = `
            <div class="glass-panel" style="width: 520px; padding: 2rem; background: rgba(22, 26, 36, 0.98); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
                <h2 style="margin-top: 0; margin-bottom: 1.5rem; color: #f8fafc; font-size: 1.4rem;">New Purchase Order</h2>
                
                <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                    <div>
                        ${window.UniversalCustomerSearch ? window.UniversalCustomerSearch.renderHTML({
                            id: 'purchase-vendor-search',
                            label: 'Vendor / Customer Name*',
                            placeholder: 'Please select a vendor or customer name',
                            infoTooltip: 'Search verified suppliers, clients, leads, and price calculation contacts',
                            inputId: 'np-vendor'
                        }) : `
                            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Vendor Name</label>
                            <input type="text" id="np-vendor" class="glass-input" style="width: 100%;" placeholder="e.g. Steel Suppliers">
                        `}
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted); font-size: 0.82rem;">Items Description</label>
                        <textarea id="np-items" class="glass-input" style="width: 100%; height: 60px; resize: none; background: rgba(255,255,255,0.06); color: #f8fafc; border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 0.5rem;" placeholder="e.g. 50 Sheets"></textarea>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted); font-size: 0.82rem;">Total Amount (₹)</label>
                        <input type="number" id="np-amount" class="glass-input" style="width: 100%; background: rgba(255,255,255,0.06); color: #f8fafc; border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 0.5rem;" placeholder="0.00">
                    </div>
                     <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted); font-size: 0.82rem;">Due Date</label>
                        <input type="date" id="np-date" class="glass-input" style="width: 100%; background: rgba(255,255,255,0.06); color: #f8fafc; border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 0.5rem;">
                    </div>
                </div>

                <div style="margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button class="btn" onclick="document.getElementById('new-purchase-modal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="window.createPurchase()">Create PO</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        if (window.UniversalCustomerSearch) {
            window.UniversalCustomerSearch.register('purchase-vendor-search', {
                onSelect: (cust) => {
                    const inp = document.getElementById('np-vendor');
                    if (inp) inp.value = cust.name;
                },
                onClear: () => {
                    const inp = document.getElementById('np-vendor');
                    if (inp) inp.value = '';
                }
            });
        }
    };

    window.createPurchase = () => {
        const vendor = document.getElementById('np-vendor').value;
        const items = document.getElementById('np-items').value;
        const amount = parseFloat(document.getElementById('np-amount').value);
        const date = document.getElementById('np-date').value;

        if (!vendor || !amount) return alert('Please fill required fields');

        const newPO = {
            id: `PO-${1000 + (store.state.purchases?.length || 0) + 1}`,
            vendor, items, amount,
            paidAmount: 0,
            balance: amount,
            status: 'Ordered',
            date: new Date().toISOString().split('T')[0],
            dueDate: date || new Date().toISOString().split('T')[0],
            paymentType: 'Credit'
        };

        store.state.purchases.push(newPO);
        if (typeof store.saveState === 'function') store.saveState();
        store.notify();
        document.getElementById('new-purchase-modal').remove();
    };

    // Purchase Returns Navigation Backward-Compatibility
    window.switchPurchaseSubView = (view) => {
        if (view === 'returns') {
            window.navigate('purchase_return');
        } else {
            window.navigate('purchase');
        }
    };

    window.openNewPurchaseReturnModal = () => {
        const modal = document.createElement('div');
        modal.id = 'new-pr-modal';
        modal.className = 'modal-backdrop animate-fade-in';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 1000;
            display: flex; align-items: center; justify-content: center;
        `;
        modal.innerHTML = `
            <div class="glass-panel" style="width: 520px; padding: 2rem; background: #0b111e; border: 1.5px solid rgba(239, 68, 68, 0.4); border-radius: 12px; box-shadow: 0 16px 45px rgba(0,0,0,0.7);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <i data-lucide="rotate-ccw" style="width: 22px; height: 22px; color: #ef4444;"></i>
                        <h2 style="margin: 0; color: #f8fafc; font-size: 1.35rem; font-weight: 700;">Record Purchase Return</h2>
                    </div>
                    <button type="button" onclick="document.getElementById('new-pr-modal').remove()" style="background: none; border: none; color: #94a3b8; cursor: pointer;">
                        <i data-lucide="x" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>

                <form onsubmit="window.savePurchaseReturn(event)" style="display: flex; flex-direction: column; gap: 1.15rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.4rem; font-size: 0.82rem; color: #cbd5e1; font-weight: 500;">Select Purchase Order *</label>
                        <select id="pr-po-id" class="glass-input" required style="width: 100%; font-size: 0.88rem;" onchange="window.onPurchaseReturnPoSelect(this.value)">
                            <option value="" disabled selected>Choose PO...</option>
                            ${purchases.map(p => `<option value="${p.id}" data-vendor="${p.vendor}">${p.id} • ${p.vendor} (₹${(p.amount||0).toLocaleString()})</option>`).join('')}
                        </select>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 0.4rem; font-size: 0.82rem; color: #cbd5e1; font-weight: 500;">Vendor Name</label>
                        <input type="text" id="pr-vendor" class="glass-input" required readonly style="width: 100%; opacity: 0.8; background: rgba(0,0,0,0.3);">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 0.4rem; font-size: 0.82rem; color: #cbd5e1; font-weight: 500;">Returned Material Description *</label>
                        <textarea id="pr-items" class="glass-input" required rows="2" placeholder="e.g. MS Pipe 30x30 (x5 lengths) bent during unloading" style="width: 100%;"></textarea>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.4rem; font-size: 0.82rem; color: #cbd5e1; font-weight: 500;">Credit / Refund (₹) *</label>
                            <input type="number" id="pr-amount" class="glass-input" required min="1" step="0.01" placeholder="0.00" style="width: 100%; font-weight: 700; color: #34d399;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.4rem; font-size: 0.82rem; color: #cbd5e1; font-weight: 500;">Return Date</label>
                            <input type="date" id="pr-date" class="glass-input" value="${new Date().toISOString().split('T')[0]}" style="width: 100%;">
                        </div>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 0.4rem; font-size: 0.82rem; color: #cbd5e1; font-weight: 500;">Reason for Return *</label>
                        <input type="text" id="pr-reason" class="glass-input" required placeholder="e.g. Surface corrosion, gauge mismatch, delivery defect" style="width: 100%;">
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('new-pr-modal').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary" style="background: #ef4444; border-color: #ef4444; color: white; font-weight: 600;">
                            <i data-lucide="check" style="width: 16px; height: 16px;"></i> Log Return
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) window.lucide.createIcons();
    };

    window.onPurchaseReturnPoSelect = (poId) => {
        const po = purchases.find(p => p.id === poId);
        const vendorInp = document.getElementById('pr-vendor');
        if (vendorInp && po) vendorInp.value = po.vendor;
    };

    window.savePurchaseReturn = (e) => {
        e.preventDefault();
        const poId = document.getElementById('pr-po-id').value;
        const vendor = document.getElementById('pr-vendor').value;
        const items = document.getElementById('pr-items').value;
        const creditAmount = parseFloat(document.getElementById('pr-amount').value);
        const date = document.getElementById('pr-date').value;
        const reason = document.getElementById('pr-reason').value;

        const newReturn = {
            id: `PR-${100 + store.state.purchaseReturns.length + 1}`,
            poId, vendor, items, creditAmount, date, reason,
            status: 'Processed'
        };

        store.state.purchaseReturns.unshift(newReturn);
        if (typeof store.saveState === 'function') store.saveState();
        store.notify();
        document.getElementById('new-pr-modal')?.remove();
        alert(`Purchase Return ${newReturn.id} recorded with ₹${creditAmount.toLocaleString()} vendor credit note.`);
    };

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 style="font-size: 2rem; margin: 0 0 0.35rem 0; color: #f8fafc; font-weight: 700;">Purchase Management</h1>
                <p style="color: var(--color-text-muted); margin: 0; font-size: 0.88rem;">Track vendor purchase orders, material procurements, and supplier orders.</p>
            </div>
            
            <div style="display: flex; gap: 0.75rem; align-items: center;">
                <button class="btn btn-primary" onclick="window.openNewPurchaseModal()" style="display: inline-flex; align-items: center; gap: 6px;">
                    <i data-lucide="plus" style="width: 16px; height: 16px;"></i> New Purchase Order
                </button>
            </div>
        </div>

        <!-- Primary Purchase Orders Table -->
        <div class="glass-panel" style="padding: 0; overflow: hidden; border-radius: var(--radius-lg);">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: rgba(255,255,255,0.05); border-bottom: 1px solid var(--glass-border);">
                    <tr>
                        <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 500;">PO ID</th>
                        <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 500;">Vendor</th>
                        <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 500;">Items</th>
                        <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 500;">Date</th>
                        <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 500; text-align: right;">Amount</th>
                        <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 500; text-align: right;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${purchases.length > 0 ? purchases.map(po => `
                        <tr style="border-bottom: 1px solid var(--glass-border);">
                            <td style="padding: 1rem; font-family: monospace; color: #38bdf8; font-weight: 600;">${po.id}</td>
                            <td style="padding: 1rem; font-weight: 600; color: #f8fafc;">${po.vendor}</td>
                            <td style="padding: 1rem; color: var(--color-text-muted);">${po.items}</td>
                            <td style="padding: 1rem; color: var(--color-text-muted);">${po.date}</td>
                            <td style="padding: 1rem; text-align: right; font-weight: 600; color: #34d399;">₹ ${(Number(po.amount)||0).toLocaleString()}</td>
                            <td style="padding: 1rem; text-align: right;">
                                <span style="
                                    font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 4px;
                                    background: ${po.status === 'Received' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)'};
                                    color: ${po.status === 'Received' ? '#34d399' : '#38bdf8'};
                                ">${po.status}</span>
                            </td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="6" style="padding: 3rem; text-align: center; color: var(--color-text-muted);">
                                No purchase orders found.
                            </td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    return container;
}
