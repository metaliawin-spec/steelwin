import { Store } from '../store.js';

export function renderInventory(state) {
    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.padding = '2rem';

    // Ensure mock data exists
    if (!state.inventoryItems) {
        state.inventoryItems = [
            { id: 'FG-1001', name: 'Aluminium Sliding Window 4x4', type: 'Window', customer: 'Anshid', status: 'Ready', date: '2025-12-10' },
            { id: 'FG-1002', name: 'Bathroom Ventilator', type: 'Ventilator', customer: 'Global Construction', status: 'Delivered', date: '2025-12-08' }
        ];
    }
    const inventory = state.inventoryItems;
    const customers = state.customers || [];

    // --- Actions ---
    window.openAddInventoryModal = () => {
        const modal = document.createElement('div');
        modal.id = 'add-inv-modal';
        modal.className = 'modal-backdrop animate-fade-in';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;
        `;

        // Customer Options
        const customerOptions = customers.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

        modal.innerHTML = `
            <div class="glass-panel" style="width: 400px; padding: 2rem; background: var(--color-bg-sidebar);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2rem;">
                    <h3>Add Finished Good</h3>
                    <button onclick="document.getElementById('add-inv-modal').remove()" style="background: none; border: none; color: white; cursor: pointer;">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <form onsubmit="window.saveInventoryItem(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: #aaa;">Item Name</label>
                        <input type="text" name="name" required placeholder="e.g. Living Room Window" class="glass-input" style="width: 100%; background: #333; color: white;">
                    </div>
                     <div>
                        <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: #aaa;">Item Type</label>
                        <select name="type" required class="glass-input" style="width: 100%; background: #333; color: white;">
                            <option value="Window">Window</option>
                            <option value="Door">Door</option>
                            <option value="Ventilator">Ventilator</option>
                            <option value="Partition">Partition</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: #aaa;">Assign to Customer</label>
                        <select name="customer" required class="glass-input" style="width: 100%; background: #333; color: white;">
                            <option value="" disabled selected>Select Customer</option>
                            ${customerOptions}
                            <option value="Stock (Unassigned)">Stock (Unassigned)</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Add to Inventory</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) window.lucide.createIcons();
    };

    window.saveInventoryItem = (e) => {
        e.preventDefault();
        const form = e.target;
        const newItem = {
            id: 'FG-' + (1000 + inventory.length + 1),
            name: form.name.value,
            type: form.type.value,
            customer: form.customer.value,
            status: 'Ready',
            date: new Date().toISOString().split('T')[0]
        };

        state.inventoryItems.push(newItem);
        Store.notify();
        document.getElementById('add-inv-modal').remove();
    };

    window.toggleInvStatus = (id) => {
        const item = state.inventoryItems.find(i => i.id === id);
        if (item) {
            item.status = item.status === 'Ready' ? 'Delivered' : 'Ready';
            Store.notify();
        }
    }

    // --- View ---
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
                <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">Finished Goods Inventory</h1>
                <p style="color: var(--color-text-muted);">Manage completed items and allocate to customers.</p>
            </div>
            <button class="btn btn-primary" onclick="window.openAddInventoryModal()">
                <i data-lucide="plus"></i> Add Finished Item
            </button>
        </div>

        <div class="glass-panel" style="padding: 0; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: rgba(255,255,255,0.05); border-bottom: 1px solid var(--glass-border);">
                    <tr>
                        <th style="padding: 1rem; color: var(--color-text-muted);">ID</th>
                        <th style="padding: 1rem; color: var(--color-text-muted);">Item Name</th>
                        <th style="padding: 1rem; color: var(--color-text-muted);">Type</th>
                        <th style="padding: 1rem; color: var(--color-text-muted);">Assigned Customer</th>
                         <th style="padding: 1rem; color: var(--color-text-muted);">Date</th>
                        <th style="padding: 1rem; color: var(--color-text-muted);">Status</th>
                        <th style="padding: 1rem; color: var(--color-text-muted);">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventory.length > 0 ? inventory.map(item => `
                        <tr style="border-bottom: 1px solid var(--glass-border);">
                            <td style="padding: 1rem; font-family: monospace;">${item.id}</td>
                            <td style="padding: 1rem; font-weight: 500;">${item.name}</td>
                            <td style="padding: 1rem; color: var(--color-text-muted);">${item.type}</td>
                            <td style="padding: 1rem; font-weight: 600; color: var(--color-primary);">${item.customer}</td>
                            <td style="padding: 1rem; color: var(--color-text-muted);">${item.date}</td>
                            <td style="padding: 1rem;">
                                <span style="
                                    font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 4px;
                                    background: ${item.status === 'Delivered' ? 'rgba(var(--hue-success), 0.2)' : 'rgba(255, 165, 0, 0.2)'};
                                    color: ${item.status === 'Delivered' ? 'var(--color-success)' : 'orange'};
                                ">${item.status}</span>
                            </td>
                            <td style="padding: 1rem;">
                                <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="window.toggleInvStatus('${item.id}')">
                                    ${item.status === 'Ready' ? 'Mark Delivered' : 'Mark Ready'}
                                </button>
                            </td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="7" style="padding: 3rem; text-align: center; color: var(--color-text-muted);">
                                No finished goods in inventory.
                            </td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
    `;

    return container;
}
