import { Store } from '../store.js';

// --- STATE & UTILS ---
// We'll trust Store.state.calcTab or similar, but for specific module tabs, 
// we can use a local default or rely on the Store if we want persistence.
// For now, checks local state handling in render.

// --- RAW MATERIALS ACTIONS (Existing) ---

window.addStockItem = (e) => {
    e.preventDefault();
    const store = window.Store || Store;
    if (!store) return;

    const form = e.target;

    const newItem = {
        id: 'STK-' + Date.now(),
        category: form.category.value,
        name: form.name.value,
        quantity: parseInt(form.quantity.value) || 0,
        weight: parseFloat(form.weight.value) || 0,
        price: parseFloat(form.price.value) || 0,
        unit: 'nos'
    };

    if (!store.state.inventory) store.state.inventory = [];
    store.state.inventory.push(newItem);
    store.notify();

    form.reset();
    window.closeAddStockModal();
};

window.deleteStockItem = (id) => {
    if (confirm('Delete this stock item?')) {
        const store = window.Store || Store;
        if (store) {
            store.state.inventory = store.state.inventory.filter(i => i.id !== id);
            store.notify();
        }
    }
};

window.clearAllStock = () => {
    if (confirm('Are you sure you want to delete ALL stock items? This cannot be undone.')) {
        const store = window.Store || Store;
        if (store) {
            store.state.inventory = [];
            store.notify();
        }
    }
};

window.downloadStockExcel = () => {
    try {
        if (typeof XLSX === 'undefined') return alert('Excel library not loaded.');
        const store = window.Store || Store;
        const inventory = store.state.inventory || [];

        const data = inventory.map(item => ({
            "Category": item.category || '-',
            "Item Name": item.name || '-',
            "Quantity": item.quantity || 0,
            "Unit Weight (Kg)": item.weight || 0,
            "Total Weight (Kg)": ((item.quantity || 0) * (item.weight || 0)).toFixed(2),
            "Unit Price (₹)": item.price || 0,
            "Total Value (₹)": ((item.quantity || 0) * (item.price || 0)).toFixed(2)
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Raw_Materials");
        XLSX.writeFile(wb, "Stock_Raw_Materials.xlsx");
    } catch (err) {
        console.error("Export Error:", err);
        alert('Export Failed: ' + err.message);
    }
};

window.openAddStockModal = () => {
    const store = window.Store || Store;
    const categories = (store.state && store.state.rawMaterialCategories) || ['Sheet', 'Pipe', 'Hardware', 'Paint', 'Gasket', 'Fasteners', 'Other'];

    const modal = document.createElement('div');
    modal.id = 'add-stock-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center; z-index: 1000;
    `;
    modal.innerHTML = `
        <div class="glass-panel stock-modal-card" style="width: 460px; padding: 2rem; border: 1px solid var(--glass-border); background: #0f172a;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="color: var(--color-text-heading); margin: 0; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="package-plus" style="color: var(--color-primary); width: 20px;"></i> Add Raw Material
                </h3>
                <button onclick="window.closeAddStockModal()" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer;"><i data-lucide="x"></i></button>
            </div>
            
            <form onsubmit="window.addStockItem(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                        <label class="stock-modal-label" style="font-size: 0.8rem; color: var(--color-text-muted);">Category *</label>
                        <button type="button" onclick="window.openAddStockCategoryModal()" style="background: none; border: none; color: #38bdf8; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                            <i data-lucide="plus-circle" style="width: 13px; height: 13px;"></i> + Add Category
                        </button>
                    </div>
                    <select name="category" id="stock-category-select" required class="glass-input" style="width: 100%; padding: 0.75rem; border-radius: 6px; background: rgba(255,255,255,0.06); color: #f8fafc;">
                        ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="stock-modal-label" style="display: block; font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--color-text-muted);">Item Name / Description *</label>
                    <input type="text" name="name" required placeholder="e.g. MS Pipe 30x30" class="glass-input" style="width: 100%; padding: 0.75rem; border-radius: 6px; background: rgba(255,255,255,0.06); color: #f8fafc;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label class="stock-modal-label" style="display: block; font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--color-text-muted);">Quantity (Pcs) *</label>
                        <input type="number" name="quantity" required min="1" class="glass-input" style="width: 100%; padding: 0.75rem; border-radius: 6px; background: rgba(255,255,255,0.06); color: #f8fafc;">
                    </div>
                    <div>
                         <label class="stock-modal-label" style="display: block; font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--color-text-muted);">Unit Weight (Kg) *</label>
                        <input type="number" name="weight" step="0.01" required class="glass-input" style="width: 100%; padding: 0.75rem; border-radius: 6px; background: rgba(255,255,255,0.06); color: #f8fafc;">
                    </div>
                </div>
                <div>
                    <label class="stock-modal-label" style="display: block; font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--color-text-muted);">Unit Price (₹) *</label>
                    <input type="number" name="price" step="0.01" required class="glass-input" style="width: 100%; padding: 0.75rem; border-radius: 6px; background: rgba(255,255,255,0.06); color: #f8fafc;">
                </div>
                <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem; padding: 0.85rem; font-weight: 600;">Add to Stock</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.closeAddStockModal = () => {
    const el = document.getElementById('add-stock-modal');
    if (el) el.remove();
};

window.openAddStockCategoryModal = () => {
    const modal = document.createElement('div');
    modal.id = 'add-category-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center; z-index: 10010;
    `;
    modal.innerHTML = `
        <div class="glass-panel" style="width: 380px; padding: 1.75rem; background: #1e293b; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 12px; box-shadow: 0 16px 36px rgba(0,0,0,0.7);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3 style="margin: 0; color: #f8fafc; font-size: 1.15rem; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="folder-plus" style="color: #38bdf8; width: 18px;"></i> New Stock Category
                </h3>
                <button onclick="document.getElementById('add-category-modal').remove()" style="background: none; border: none; color: #94a3b8; cursor: pointer;">
                    <i data-lucide="x"></i>
                </button>
            </div>
            
            <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 0.4rem; font-weight: 500;">Category Name *</label>
                <input type="text" id="new-category-name-input" placeholder="e.g. Aluminum Extrusion" class="glass-input" style="width: 100%; padding: 0.65rem 0.8rem; background: rgba(0,0,0,0.3); color: #f8fafc; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;">
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('add-category-modal').remove()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="window.saveNewStockCategory()">Save Category</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.saveNewStockCategory = () => {
    const input = document.getElementById('new-category-name-input');
    const val = input ? input.value.trim() : '';
    if (!val) return alert('Please enter a category name');

    const store = window.Store || Store;
    if (!store.state.rawMaterialCategories) {
        store.state.rawMaterialCategories = ['Sheet', 'Pipe', 'Hardware', 'Paint', 'Gasket', 'Fasteners', 'Other'];
    }

    if (!store.state.rawMaterialCategories.includes(val)) {
        store.state.rawMaterialCategories.push(val);
        if (typeof store.saveState === 'function') store.saveState();
        store.notify();
    }

    // Refresh select in add stock modal if open
    const catSelect = document.getElementById('stock-category-select');
    if (catSelect) {
        catSelect.innerHTML = store.state.rawMaterialCategories.map(c => `<option value="${c}" ${c === val ? 'selected' : ''}>${c}</option>`).join('');
    }

    document.getElementById('add-category-modal').remove();
};

// --- FINISHED GOODS ACTIONS (With Photo Upload) ---
window.currentFgPhoto = null;

window.previewFgPhoto = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            window.currentFgPhoto = e.target.result;
            const preview = document.getElementById('fg-photo-preview');
            const placeholder = document.getElementById('fg-photo-placeholder');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.openAddFinishedGoodsModal = () => {
    const store = window.Store || Store;
    const customers = store.state.customers || [];
    window.currentFgPhoto = null;

    const modal = document.createElement('div');
    modal.id = 'add-inv-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000;
    `;

    const customerOptions = customers.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

    modal.innerHTML = `
        <div class="glass-panel stock-modal-card" style="width: 480px; padding: 2rem; border: 1px solid var(--glass-border); background: #0f172a;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="color: var(--color-text-heading); margin: 0; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="box" style="color: var(--color-primary); width: 20px;"></i> Add Finished Good
                </h3>
                <button onclick="document.getElementById('add-inv-modal').remove()" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer;">
                    <i data-lucide="x"></i>
                </button>
            </div>
            
            <form onsubmit="window.saveFinishedGood(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                <!-- Product Photo Attachment -->
                <div>
                    <label class="stock-modal-label" style="display: block; font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--color-text-muted);">Product Photo</label>
                    <div style="display: flex; align-items: center; gap: 1rem; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; padding: 0.75rem;">
                        <div style="width: 70px; height: 70px; border-radius: 6px; background: rgba(0,0,0,0.3); overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);">
                            <img id="fg-photo-preview" src="" alt="Photo" style="width: 100%; height: 100%; object-fit: cover; display: none;">
                            <i id="fg-photo-placeholder" data-lucide="image" style="width: 28px; height: 28px; color: #64748b;"></i>
                        </div>
                        <div style="flex: 1;">
                            <label class="btn btn-secondary" style="font-size: 0.78rem; padding: 0.4rem 0.8rem; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                                <i data-lucide="upload" style="width: 13px;"></i> Select Photo
                                <input type="file" id="fg-photo-input" accept="image/*" style="display: none;" onchange="window.previewFgPhoto(this)">
                            </label>
                            <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">PNG, JPG up to 5MB</div>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="stock-modal-label" style="display: block; font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--color-text-muted);">Item Name / Spec *</label>
                    <input type="text" name="name" required placeholder="e.g. Living Room 3-Track Sliding Window" class="glass-input" style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.06); color: #f8fafc;">
                </div>
                 <div>
                    <label class="stock-modal-label" style="display: block; font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--color-text-muted);">Item Type *</label>
                    <select name="type" required class="glass-input" style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.06); color: #f8fafc;">
                        <option value="Window">Window</option>
                        <option value="Door">Door</option>
                        <option value="Ventilator">Ventilator</option>
                        <option value="Partition">Partition</option>
                        <option value="Facade">Facade</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label class="stock-modal-label" style="display: block; font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--color-text-muted);">Assign to Customer *</label>
                    <select name="customer" required class="glass-input" style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.06); color: #f8fafc;">
                        <option value="" disabled selected>Select Customer</option>
                        ${customerOptions}
                        <option value="Stock (Unassigned)">Stock (Unassigned)</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem; padding: 0.85rem; font-weight: 600;">Add to Inventory</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.saveFinishedGood = (e) => {
    e.preventDefault();
    const store = window.Store || Store;
    const form = e.target;

    if (!store.state.inventoryItems) store.state.inventoryItems = [];

    const newItem = {
        id: 'FG-' + (1000 + store.state.inventoryItems.length + 1),
        name: form.name.value,
        type: form.type.value,
        customer: form.customer.value,
        status: 'Ready',
        photoUrl: window.currentFgPhoto || '',
        date: new Date().toISOString().split('T')[0]
    };

    store.state.inventoryItems.push(newItem);
    if (typeof store.saveState === 'function') store.saveState();
    store.notify();
    document.getElementById('add-inv-modal').remove();
};

window.toggleFinishedGoodStatus = (id) => {
    const store = window.Store || Store;
    const item = store.state.inventoryItems.find(i => i.id === id);
    if (item) {
        item.status = item.status === 'Ready' ? 'Delivered' : 'Ready';
        if (typeof store.saveState === 'function') store.saveState();
        store.notify();
    }
};

window.filterStockTable = (query) => {
    const filter = query.toLowerCase();
    const rows = document.querySelectorAll('.stock-row');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    });
};

window.setStockTab = (tabId) => {
    const store = window.Store || Store;
    store.state.stockTab = tabId;
    store.notify(); // Re-render existing view
};

// --- RENDERERS ---

function renderRawMaterials(state) {
    const inventory = state.inventory || [];
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const totalWeight = inventory.reduce((sum, i) => sum + (i.weight * i.quantity), 0);

    return `
        <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
            <div style="flex: 1;">
                 <!-- Cards -->
                 <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;" class="no-print">
                    <div class="glass-panel" style="padding: 1.5rem;">
                        <div style="color: var(--color-text-muted); font-size: 0.9rem;">Total Value</div>
                        <div style="font-size: 1.8rem; font-weight: 600; color: var(--color-success);">₹ ${totalValue.toLocaleString()}</div>
                    </div>
                     <div class="glass-panel" style="padding: 1.5rem;">
                        <div style="color: var(--color-text-muted); font-size: 0.9rem;">Total Weight</div>
                        <div style="font-size: 1.8rem; font-weight: 600; color: var(--color-accent);">${totalWeight.toFixed(2)} <span style="font-size: 1rem; color: #888;">kg</span></div>
                    </div>
                     <div class="glass-panel" style="padding: 1.5rem;">
                        <div style="color: var(--color-text-muted); font-size: 0.9rem;">Items</div>
                        <div style="font-size: 1.8rem; font-weight: 600;">${totalItems}</div>
                    </div>
                </div>

                <!-- Toolbar -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                     <button class="btn btn-secondary" onclick="window.downloadStockExcel()">
                        <i data-lucide="sheet"></i> Download Excel
                     </button>
                     <div style="display: flex; gap: 0.75rem;">
                         <button class="btn btn-secondary" onclick="window.openAddStockCategoryModal()">
                            <i data-lucide="folder-plus"></i> + Add Category
                         </button>
                         <button class="btn btn-primary" onclick="window.openAddStockModal()">
                            <i data-lucide="plus"></i> Add Raw Material
                         </button>
                     </div>
                </div>

                <!-- Table -->
                <div class="glass-panel" style="overflow: hidden; background: white; color: black;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
                            <tr>
                                <th style="padding: 1rem; text-align: left;">Item Name</th>
                                <th style="padding: 1rem; text-align: center;">Category</th>
                                <th style="padding: 1rem; text-align: center;">Qty</th>
                                <th style="padding: 1rem; text-align: right;">Weight</th>
                                <th style="padding: 1rem; text-align: right;">Value</th>
                                <th class="no-print" style="width: 50px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inventory.length > 0 ? inventory.map(item => `
                                <tr class="stock-row" style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 1rem; font-weight: 500;">
                                        ${item.name}
                                        <div style="font-size: 0.75rem; color: #666;">ID: ${item.id}</div>
                                    </td>
                                    <td style="padding: 1rem; text-align: center;">
                                        <span style="padding: 4px 10px; border-radius: 12px; background: #eee; font-size: 0.8rem;">${item.category}</span>
                                    </td>
                                    <td style="padding: 1rem; text-align: center; font-weight: 600;">${item.quantity}</td>
                                    <td style="padding: 1rem; text-align: right;">${item.weight} kg</td>
                                    <td style="padding: 1rem; text-align: right;">₹ ${(item.price * item.quantity).toLocaleString()}</td>
                                    <td class="no-print" style="padding: 1rem; text-align: center;">
                                        <button onclick="window.deleteStockItem('${item.id}')" style="background: none; border: none; color: #ff3b30; cursor: pointer;">
                                            <i data-lucide="trash-2" style="width: 16px;"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="6" style="padding: 2rem; text-align: center; color: #888;">No items found.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderFinishedGoods(state) {
    if (!state.inventoryItems) state.inventoryItems = [];
    const inventory = state.inventoryItems;

    return `
         <div style="margin-bottom: 2rem;">
            <!-- Toolbar -->
             <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
                <button class="btn btn-primary" onclick="window.openAddFinishedGoodsModal()">
                    <i data-lucide="plus"></i> Add Finished Item
                </button>
            </div>

            <div class="glass-panel" style="padding: 0; overflow: hidden; background: white; color: black;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
                        <tr>
                            <th style="padding: 1rem; width: 60px;">Photo</th>
                            <th style="padding: 1rem;">ID</th>
                            <th style="padding: 1rem;">Item Name</th>
                            <th style="padding: 1rem;">Type</th>
                            <th style="padding: 1rem;">Assigned Customer</th>
                            <th style="padding: 1rem;">Status</th>
                            <th style="padding: 1rem;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inventory.length > 0 ? inventory.map(item => `
                            <tr class="stock-row" style="border-bottom: 1px solid #eee;">
                                <td style="padding: 0.75rem 1rem;">
                                    ${item.photoUrl ? `
                                        <img src="${item.photoUrl}" alt="FG Photo" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; border: 1px solid #ddd; cursor: pointer;" onclick="window.openImagePreviewModal ? window.openImagePreviewModal('${item.photoUrl}', '${item.name}') : window.open('${item.photoUrl}')">
                                    ` : `
                                        <div style="width: 44px; height: 44px; border-radius: 6px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">
                                            <i data-lucide="image" style="width: 20px; height: 20px;"></i>
                                        </div>
                                    `}
                                </td>
                                <td style="padding: 1rem; font-family: monospace; color: #666;">${item.id}</td>
                                <td style="padding: 1rem; font-weight: 500;">${item.name}</td>
                                <td style="padding: 1rem; color: #666;">${item.type}</td>
                                <td style="padding: 1rem; font-weight: 600; color: var(--color-primary);">${item.customer}</td>
                                <td style="padding: 1rem;">
                                    <span style="font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 4px; background: ${item.status === 'Delivered' ? '#e8f5e9' : '#fff3e0'}; color: ${item.status === 'Delivered' ? '#2e7d32' : 'orange'};">
                                        ${item.status}
                                    </span>
                                </td>
                                <td style="padding: 1rem;">
                                    <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="window.toggleFinishedGoodStatus('${item.id}')">
                                        ${item.status === 'Ready' ? 'Mark Delivered' : 'Mark Ready'}
                                    </button>
                                </td>
                            </tr>
                        `).join('') : `<tr><td colspan="7" style="padding: 2rem; text-align: center; color: #888;">No finished goods inventory.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- MAIN RENDERER ---

export function renderStockManager(state) {
    // Default active tab
    const activeTab = state.stockTab || 'raw';

    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    container.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column;">
            
            <!-- Header with Search -->
            <div style="padding: 2rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="margin: 0; font-size: 2rem; display: flex; align-items: center; gap: 0.75rem;">
                        <i data-lucide="layers" style="color: var(--color-primary);"></i> Stock Manager
                    </h1>
                    <p style="color: var(--color-text-muted); margin-top: 0.5rem;">Manage raw materials and finished goods inventory.</p>
                </div>
                
                <div class="no-print" style="display: flex; gap: 1rem; align-items: center;">
                    <div style="position: relative;">
                         <input type="text" placeholder="Search..." onkeyup="window.filterStockTable(this.value)" 
                            class="glass-input" style="padding: 0.7rem 1rem 0.7rem 2.5rem; width: 250px;">
                         <i data-lucide="search" style="position: absolute; left: 0.8rem; top: 50%; transform: translateY(-50%); width: 16px; color: var(--color-text-muted);"></i>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div style="padding: 0 2rem; margin-top: 1rem; border-bottom: 1px solid var(--glass-border); display: flex; gap: 2rem;">
                <button onclick="window.setStockTab('raw')" style="
                    padding: 1rem 0; background: none; border: none; color: ${activeTab === 'raw' ? 'var(--color-primary)' : 'var(--color-text-muted)'}; 
                    border-bottom: 2px solid ${activeTab === 'raw' ? 'var(--color-primary)' : 'transparent'}; cursor: pointer; font-weight: 500;">
                    Raw Materials
                </button>
                <button onclick="window.setStockTab('finished')" style="
                    padding: 1rem 0; background: none; border: none; color: ${activeTab === 'finished' ? 'var(--color-primary)' : 'var(--color-text-muted)'}; 
                    border-bottom: 2px solid ${activeTab === 'finished' ? 'var(--color-primary)' : 'transparent'}; cursor: pointer; font-weight: 500;">
                    Finished Goods
                </button>
            </div>

            <!-- Tab Content -->
            <div style="flex: 1; padding: 2rem; overflow-y: auto;">
                ${activeTab === 'raw' ? renderRawMaterials(state) : renderFinishedGoods(state)}
            </div>
        </div>
    `;

    // Re-initialize icons just in case
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);

    return container;
}
