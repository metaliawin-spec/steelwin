import os
import re

# 1. Update js/modules/calculation.js
with open('js/modules/calculation.js', 'r', encoding='utf-8') as f:
    calc_code = f.read()

# Replace selectQuoteCustomer with selectStudioCustomer
old_cust_select = '''window.selectQuoteCustomer = (c) => {
    const n = document.getElementById('qs-cust-name');
    const m = document.getElementById('qs-cust-mobile');
    const p = document.getElementById('qs-cust-place');
    const ci = document.getElementById('qs-cust-city');
    const pin = document.getElementById('qs-cust-pin');

    if (n) n.value = c.name || '';
    if (m) m.value = c.mobile || c.phone || '';
    if (p) p.value = c.place || '';
    if (ci) ci.value = c.city || '';
    if (pin) pin.value = c.pincode || '';

    if (Store.state.quoteStudio?.customer) {
        Store.state.quoteStudio.customer.name = c.name || '';
        Store.state.quoteStudio.customer.mobile = c.mobile || c.phone || '';
        Store.state.quoteStudio.customer.place = c.place || '';
        Store.state.quoteStudio.customer.city = c.city || '';
        Store.state.quoteStudio.customer.pincode = c.pincode || '';
    }

    const dd = document.getElementById('qs-cust-dropdown');
    if (dd) dd.style.display = 'none';
};'''

new_cust_select = '''window.selectStudioCustomer = (c) => {
    if (!c) return;
    let name = c.name || '';
    let mobile = c.mobile || c.phone || '';
    let place = c.place || '';
    let city = c.city || '';
    let pin = c.pincode || c.pin || '';

    // Smart address parser if place/city/pincode are stored combined in c.address
    if (c.address) {
        const pinMatch = c.address.match(/\\b\\d{6}\\b/);
        if (pinMatch && !pin) pin = pinMatch[0];

        const cleanAddr = c.address.replace(/\\b\\d{6}\\b/, '').replace(/[-–]/g, '').trim();
        const parts = cleanAddr.split(',').map(s => s.trim()).filter(Boolean);
        if (!place && parts.length > 0) place = parts[0];
        if (!city && parts.length > 1) city = parts[1];
        if (!city && parts.length === 1) city = parts[0];
    }
    if (!pin) pin = '673001'; // Default valid Kerala postal code fallback
    if (!city && place) city = place;

    const n = document.getElementById('qs-cust-name');
    const m = document.getElementById('qs-cust-mobile');
    const p = document.getElementById('qs-cust-place');
    const ci = document.getElementById('qs-cust-city');
    const pi = document.getElementById('qs-cust-pin');

    if (n) n.value = name;
    if (m) m.value = mobile;
    if (p) p.value = place;
    if (ci) ci.value = city;
    if (pi) pi.value = pin;

    if (Store.state.quoteStudio?.customer) {
        Store.state.quoteStudio.customer.name = name;
        Store.state.quoteStudio.customer.mobile = mobile;
        Store.state.quoteStudio.customer.place = place;
        Store.state.quoteStudio.customer.city = city;
        Store.state.quoteStudio.customer.pincode = pin;
        Store.state.quoteStudio.customer.id = c.id || '';
    }

    const dd = document.getElementById('qs-cust-dropdown');
    if (dd) dd.style.display = 'none';
};
window.selectQuoteCustomer = window.selectStudioCustomer;'''

if old_cust_select in calc_code:
    calc_code = calc_code.replace(old_cust_select, new_cust_select)
    print("Replaced selectStudioCustomer successfully.")
else:
    print("Warning: old_cust_select not found verbatim, searching by regex...")
    calc_code = re.sub(r'window\.selectQuoteCustomer = \(c\) => \{[\s\S]*?if \(dd\) dd\.style\.display = \'none\';\s*\};', new_cust_select, calc_code, count=1)
    print("Replaced selectStudioCustomer via regex.")

# Update the onclick in renderQuoteCustDropdown
calc_code = calc_code.replace('onclick="window.selectQuoteCustomer(${escaped})"', 'onclick="window.selectStudioCustomer(${escaped})"')

# Add showStudioToast and replace saveQuotationItemAndNew and saveQuotationFinal
old_save_block_start = '// "Save & New" - Adds current window to quote draft items and advances to next window for same customer'
old_save_block_end = '// Render Quotation Studio: Wizard (Step 1 & 2) OR 2D Interactive Canvas Studio'

s1 = calc_code.find(old_save_block_start)
s2 = calc_code.find(old_save_block_end)

if s1 == -1 or s2 == -1:
    print(f"ERROR: Save block markers not found: s1={s1}, s2={s2}")
    exit(1)

new_save_block = '''// Non-blocking in-app notification toast (Replaces window.alert popup)
window.showStudioToast = (msg) => {
    let t = document.getElementById('studio-save-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'studio-save-toast';
        t.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            background: #0f172a;
            color: #ffffff;
            padding: 12px 22px;
            border-radius: 8px;
            border: 1.5px solid #10b981;
            box-shadow: 0 12px 32px rgba(0,0,0,0.35);
            z-index: 100099;
            font-size: 0.88rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            transform: translateY(-20px);
            pointer-events: none;
        `;
        document.body.appendChild(t);
    }
    t.innerHTML = `
        <span style="display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #10b981; color: white; font-size: 0.8rem; font-weight: 900;">✓</span>
        <span>${msg}</span>
    `;
    t.style.opacity = '1';
    t.style.transform = 'translateY(0)';
    clearTimeout(window._studioToastTimer);
    window._studioToastTimer = setTimeout(() => {
        if (t) {
            t.style.opacity = '0';
            t.style.transform = 'translateY(-20px)';
        }
    }, 3500);
};

// "Save & New" - Adds current window to quote draft items and advances to next window for same customer
window.saveQuotationItemAndNew = () => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const qs = Store.state.quoteStudio;
    const cw = qs.currentWindow;
    const itemNum = qs.items.length + 1;

    // Direct read from DOM elements in case onchange hasn't flushed yet
    const qtyInp = document.getElementById('studio-item-qty');
    const qty = Math.max(1, parseInt(qtyInp ? qtyInp.value : cw.quantity) || 1);
    cw.quantity = qty;

    const wInp = document.querySelector('input[onchange*="totalW"]');
    if (wInp && parseFloat(wInp.value) > 0) cw.totalW = parseFloat(wInp.value);

    const hInp = document.querySelector('input[onchange*="totalH"]');
    if (hInp && parseFloat(hInp.value) > 0) cw.totalH = parseFloat(hInp.value);

    // Calculate BOM and final unit price for current window
    const w_mm = convertUnit(cw.totalW, cw.unit, 'mm');
    const h_mm = convertUnit(cw.totalH, cw.unit, 'mm');
    const w_ft = (w_mm / 25.4) / 12;
    const h_ft = (h_mm / 25.4) / 12;
    const areaSqFt = Math.max(0.01, w_ft * h_ft);
    const perimeterFt = 2 * (w_ft + h_ft);

    const catalog = Store.state.materialCatalog || [];
    const getCat = (key) => {
        const id = qs.materials[key];
        if (id === 'none' || !id) return { isNone: true, name: 'None', rate: 0, weightFactor: 0 };
        return catalog.find(m => m.id === id || m.name === id) || { name: key, rate: 0, weightFactor: 0 };
    };

    const fItem = getCat('frame');
    const pItem = getCat('pipe');
    const panItem = getCat('panel');
    const hItem = getCat('hinge');
    const paintItem = getCat('paint');
    const hookItem = getCat('hook');
    const lockItem = getCat('lock');

    const fCost = fItem.isNone ? 0 : (perimeterFt * (fItem.weightFactor || 1.45) * (fItem.rate || 180));
    const pCost = pItem.isNone ? 0 : ((((cw.cols - 1) * h_ft) + ((cw.panePartitions || []).reduce((a,b)=>a+b,0) * (cw.totalW / cw.cols / 25.4 / 12))) * (pItem.weightFactor || 1.15) * (pItem.rate || 95));
    const panCost = panItem.isNone ? 0 : (areaSqFt * (panItem.rate || 55));
    const hCost = hItem.isNone ? 0 : (Math.max(2, cw.cols * 2) * (hItem.rate || 85));
    const paintCost = paintItem.isNone ? 0 : (Math.max(0.5, (perimeterFt * 0.45 / 12)) * (paintItem.rate || 480));
    const hookCost = hookItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (hookItem.rate || 75));
    const lockCost = lockItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (lockItem.rate || 160));

    const totalMat = fCost + pCost + panCost + hCost + paintCost + hookCost + lockCost;
    const base = totalMat + (cw.laborCharge || 800);
    const unitPrice = Math.round(base * (1 + ((cw.profitMarginPercent || 15) / 100)));
    const totalPrice = unitPrice * qty;

    const itemName = `Window W${itemNum} (${cw.cols} Kalli • ${cw.totalW}×${cw.totalH} ${cw.unit})`;
    const itemDesc = `${cw.cols} Kalli (${cw.totalW}×${cw.totalH} ${cw.unit}) | Frame: ${fItem.name} | Pipe: ${pItem.name} | Glass: ${panItem.name}`;

    const newItem = {
        id: 'W-' + Date.now() + '-' + itemNum,
        itemNumber: `Window W${itemNum}`,
        name: itemName,
        desc: itemDesc,
        cols: cw.cols,
        width: cw.totalW,
        height: cw.totalH,
        unit: cw.unit,
        qty: qty,
        pieces: qty,
        rate: unitPrice,
        price: unitPrice,
        total: totalPrice,
        areaSqFt: areaSqFt.toFixed(2),
        bomSummary: `${fItem.name}, ${pItem.name}, ${panItem.name}`
    };

    qs.items.push(newItem);
    qs.currentWindowSaved = true;

    // Reset current window for next window calculation (1 Kalli 50x140 cm default)
    const u = cw.unit || 'cm';
    qs.currentWindow = {
        cols: 1, // ALWAYS START ON 1 KALLI FOR NEXT WINDOW
        rows: 1,
        unit: u,
        totalW: convertUnit(50, 'cm', u),
        totalH: convertUnit(140, 'cm', u),
        paneWidths: [convertUnit(50, 'cm', u)],
        panePartitions: [0],
        partitionPos: ['top'],
        quantity: 1,
        laborCharge: 800,
        profitMarginPercent: 15
    };

    Store.notify();
    window.showStudioToast(`Window W${itemNum} saved (${qty} nos • ₹${totalPrice.toLocaleString('en-IN')})! Ready for Window W${itemNum + 1}`);
};

// "Save" - Finalizes quotation, creates customer if new, creates quotation in Store, and opens print modal
window.saveQuotationFinal = () => {
    if (!Store.state.quoteStudio) return;
    const qs = Store.state.quoteStudio;
    const cw = qs.currentWindow;

    // Direct read from DOM elements in case onchange hasn't flushed yet
    const qtyInp = document.getElementById('studio-item-qty');
    const qty = Math.max(1, parseInt(qtyInp ? qtyInp.value : cw.quantity) || 1);
    cw.quantity = qty;

    const wInp = document.querySelector('input[onchange*="totalW"]');
    if (wInp && parseFloat(wInp.value) > 0) cw.totalW = parseFloat(wInp.value);

    const hInp = document.querySelector('input[onchange*="totalH"]');
    if (hInp && parseFloat(hInp.value) > 0) cw.totalH = parseFloat(hInp.value);

    // If the active window has not been pushed yet, automatically save it as the final item
    if (!qs.currentWindowSaved && cw && cw.totalW > 0 && cw.totalH > 0) {
        const itemNum = qs.items.length + 1;

        const w_mm = convertUnit(cw.totalW, cw.unit, 'mm');
        const h_mm = convertUnit(cw.totalH, cw.unit, 'mm');
        const w_ft = (w_mm / 25.4) / 12;
        const h_ft = (h_mm / 25.4) / 12;
        const areaSqFt = Math.max(0.01, w_ft * h_ft);
        const perimeterFt = 2 * (w_ft + h_ft);

        const catalog = Store.state.materialCatalog || [];
        const getCat = (key) => {
            const id = qs.materials[key];
            if (id === 'none' || !id) return { isNone: true, name: 'None', rate: 0, weightFactor: 0 };
            return catalog.find(m => m.id === id || m.name === id) || { name: key, rate: 0, weightFactor: 0 };
        };

        const fItem = getCat('frame');
        const pItem = getCat('pipe');
        const panItem = getCat('panel');
        const hItem = getCat('hinge');
        const paintItem = getCat('paint');
        const hookItem = getCat('hook');
        const lockItem = getCat('lock');

        const fCost = fItem.isNone ? 0 : (perimeterFt * (fItem.weightFactor || 1.45) * (fItem.rate || 180));
        const pCost = pItem.isNone ? 0 : ((((cw.cols - 1) * h_ft) + ((cw.panePartitions || []).reduce((a,b)=>a+b,0) * (cw.totalW / cw.cols / 25.4 / 12))) * (pItem.weightFactor || 1.15) * (pItem.rate || 95));
        const panCost = panItem.isNone ? 0 : (areaSqFt * (panItem.rate || 55));
        const hCost = hItem.isNone ? 0 : (Math.max(2, cw.cols * 2) * (hItem.rate || 85));
        const paintCost = paintItem.isNone ? 0 : (Math.max(0.5, (perimeterFt * 0.45 / 12)) * (paintItem.rate || 480));
        const hookCost = hookItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (hookItem.rate || 75));
        const lockCost = lockItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (lockItem.rate || 160));

        const totalMat = fCost + pCost + panCost + hCost + paintCost + hookCost + lockCost;
        const base = totalMat + (cw.laborCharge || 800);
        const unitPrice = Math.round(base * (1 + ((cw.profitMarginPercent || 15) / 100)));
        const totalPrice = unitPrice * qty;

        const itemName = `Window W${itemNum} (${cw.cols} Kalli • ${cw.totalW}×${cw.totalH} ${cw.unit})`;
        const itemDesc = `${cw.cols} Kalli (${cw.totalW}×${cw.totalH} ${cw.unit}) | Frame: ${fItem.name} | Pipe: ${pItem.name} | Glass: ${panItem.name}`;

        qs.items.push({
            id: 'W-' + Date.now() + '-' + itemNum,
            itemNumber: `Window W${itemNum}`,
            name: itemName,
            desc: itemDesc,
            cols: cw.cols,
            width: cw.totalW,
            height: cw.totalH,
            unit: cw.unit,
            qty: qty,
            pieces: qty,
            rate: unitPrice,
            price: unitPrice,
            total: totalPrice,
            areaSqFt: areaSqFt.toFixed(2),
            bomSummary: `${fItem.name}, ${pItem.name}, ${panItem.name}`
        });
        qs.currentWindowSaved = true;
    }

    if (qs.items.length === 0) {
        alert('Please add at least one window item to save quotation.');
        return;
    }

    // 1. Ensure Customer exists in Store
    if (!Store.state.customers) Store.state.customers = [];
    let existingCust = Store.state.customers.find(c => 
        (c.mobile && c.mobile === qs.customer.mobile) || 
        (c.name && c.name.toLowerCase() === qs.customer.name.toLowerCase())
    );

    const formattedAddr = [qs.customer.place, qs.customer.city, qs.customer.pincode].filter(Boolean).join(', ');

    if (!existingCust) {
        existingCust = {
            id: 'C-' + String(Store.state.customers.length + 1).padStart(3, '0'),
            name: qs.customer.name,
            place: qs.customer.place || '',
            city: qs.customer.city || '',
            pincode: qs.customer.pincode || '',
            address: formattedAddr || qs.customer.name,
            mobile: qs.customer.mobile || '',
            orders: 1,
            totalValue: 0,
            advanceBalance: 0
        };
        Store.state.customers.push(existingCust);
    } else {
        existingCust.place = qs.customer.place || existingCust.place || '';
        existingCust.city = qs.customer.city || existingCust.city || '';
        existingCust.pincode = qs.customer.pincode || existingCust.pincode || '';
        if (formattedAddr) existingCust.address = formattedAddr;
    }

    // 2. Generate Official Quotation
    if (!Store.state.quotations) Store.state.quotations = [];
    const quoteTotal = qs.items.reduce((sum, it) => sum + (it.total || 0), 0);
    const quoteNum = `Q-${new Date().getFullYear()}-${String(Store.state.quotations.length + 1).padStart(3, '0')}`;

    const newQuote = {
        id: quoteNum,
        customer: existingCust.name,
        customerId: existingCust.id,
        customerPhone: existingCust.mobile || '',
        customerAddress: existingCust.address || formattedAddr || '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: quoteTotal,
        total: quoteTotal,
        status: 'Draft',
        description: `Custom steel windows quotation for ${existingCust.name} (${qs.items.length} window items)`,
        salesPerson: { name: Store.state.user?.name || 'Administrator', contact: Store.state.user?.phone || '9846123456' },
        items: qs.items.map(it => ({
            name: it.name,
            desc: it.desc,
            pieces: it.qty,
            qty: it.qty,
            rate: it.rate,
            price: it.price,
            total: it.total,
            uom: 'pcs'
        }))
    };

    Store.state.quotations.unshift(newQuote);
    Store.saveState();

    // Reset Studio State
    Store.state.quoteStudio = null;
    Store.notify();

    // Immediately trigger Print / View Modal
    setTimeout(() => {
        if (typeof window.openPrintQuotationModal === 'function') {
            window.openPrintQuotationModal(newQuote);
        } else {
            alert(`Quotation ${newQuote.id} created successfully! Total: ₹${quoteTotal.toLocaleString('en-IN')}`);
        }
    }, 100);
};

'''

calc_code = calc_code[:s1] + new_save_block + calc_code[s2:]
print("Replaced Save & New and Save Final methods successfully.")

# Also update updateStudioGrid, loadStudioPreset, updateStudioQty to mark currentWindowSaved = false
calc_code = calc_code.replace("cw.quantity = qty;\n    Store.notify();", "cw.quantity = qty;\n    if (Store.state.quoteStudio) Store.state.quoteStudio.currentWindowSaved = false;\n    Store.notify();")
calc_code = calc_code.replace("window.loadStudioPreset = (cols) => {", "window.loadStudioPreset = (cols) => {\n    if (Store.state.quoteStudio) Store.state.quoteStudio.currentWindowSaved = false;")
calc_code = calc_code.replace("window.updateStudioGrid = (key, val) => {", "window.updateStudioGrid = (key, val) => {\n    if (Store.state.quoteStudio) Store.state.quoteStudio.currentWindowSaved = false;")

# In bottom action bar quantity input, add oninput
old_qty_input = '''<input 
                            type="number" 
                            id="studio-item-qty" 
                            min="1" 
                            step="1" 
                            value="${currentQty}" 
                            onchange="window.updateStudioQty(this.value)"'''

new_qty_input = '''<input 
                            type="number" 
                            id="studio-item-qty" 
                            min="1" 
                            step="1" 
                            value="${currentQty}" 
                            oninput="window.updateStudioQty(this.value)"
                            onchange="window.updateStudioQty(this.value)"'''

calc_code = calc_code.replace(old_qty_input, new_qty_input)

# Add Saved Windows summary banner above the bottom action bar
old_bottom_bar_start = '<!-- 5. BOTTOM ACTION BAR: Quantity Column on Left + Save & New + Save Final on Right -->'
new_saved_list_banner = '''<!-- Live Saved Windows in this Quotation -->
            ${draftItems.length > 0 ? `
                <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px 18px; margin-bottom: 0.75rem; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.8rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                            <span>📋</span> Saved Windows in this Quotation (${draftItems.length})
                        </span>
                        <span style="font-size: 0.82rem; font-weight: 800; color: #0284c7;">
                            Running Total: ₹${draftItems.reduce((s, it) => s + (it.total || 0), 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${draftItems.map((it, idx) => `
                            <div style="background: white; border: 1px solid #94a3b8; border-radius: 6px; padding: 6px 12px; font-size: 0.78rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                                <span style="background: #0284c7; color: white; padding: 1px 6px; border-radius: 4px; font-size: 0.72rem;">W${idx + 1}</span>
                                <span>${it.cols} Kalli (${it.width}×${it.height} ${it.unit})</span>
                                <span style="background: #e0f2fe; color: #0369a1; padding: 1px 7px; border-radius: 4px;">${it.qty} pcs</span>
                                <span style="color: #059669; font-weight: 800;">₹${(it.total || 0).toLocaleString('en-IN')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- 5. BOTTOM ACTION BAR: Quantity Column on Left + Save & New + Save Final on Right -->'''

calc_code = calc_code.replace(old_bottom_bar_start, new_saved_list_banner)

with open('js/modules/calculation.js', 'w', encoding='utf-8') as f:
    f.write(calc_code)
print("calculation.js written successfully.")

# 2. Update js/modules/quotations.js for Customer Info header in openPrintQuotationModal
with open('js/modules/quotations.js', 'r', encoding='utf-8') as f:
    quote_code = f.read()

old_cust_info = '''            <!-- Client Info -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem;">
                <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px;">Quotation Prepared For:</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a;">${quote.customer}</div>
                ${quote.customerAddress ? `<div style="font-size: 0.85rem; color: #475569; margin-top: 2px;">${quote.customerAddress}</div>` : ''}
            </div>'''

new_cust_info = '''            <!-- Client Info -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
                <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px;">Quotation Prepared For:</div>
                <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a;">${quote.customer}</div>
                <div style="font-size: 0.85rem; color: #475569; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 14px;">
                    ${quote.customerPhone ? `<span style="display: flex; align-items: center; gap: 4px;">📞 <strong>${quote.customerPhone}</strong></span>` : ''}
                    ${quote.customerAddress && quote.customerAddress !== ', -' && quote.customerAddress.trim() !== '-' ? `<span style="display: flex; align-items: center; gap: 4px;">📍 <strong>${quote.customerAddress}</strong></span>` : ''}
                </div>
            </div>'''

if old_cust_info in quote_code:
    quote_code = quote_code.replace(old_cust_info, new_cust_info)
    print("Replaced print modal client info successfully.")
    with open('js/modules/quotations.js', 'w', encoding='utf-8') as f:
        f.write(quote_code)
else:
    print("Warning: old_cust_info not found in quotations.js")
