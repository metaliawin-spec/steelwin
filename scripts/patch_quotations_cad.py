import re

with open('js/modules/quotations.js', 'r', encoding='utf-8') as f:
    src = f.read()

# 1. Update openPrintQuotationModal items table
old_print_table = """            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.88rem;">
                <thead>
                    <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; color: #334155; text-transform: uppercase; font-size: 0.75rem;">
                        <th style="padding: 8px; text-align: center; width: 36px;">#</th>
                        <th style="padding: 8px; text-align: left;">Product / Description</th>
                        <th style="padding: 8px; text-align: center; width: 65px;">Qty</th>
                        <th style="padding: 8px; text-align: right; width: 85px;">Rate</th>
                        <th style="padding: 8px; text-align: right; width: 60px;">Disc</th>
                        <th style="padding: 8px; text-align: right; width: 60px;">Tax</th>
                        <th style="padding: 8px; text-align: right; width: 100px;">Amount</th>
                        <th class="no-print" style="padding: 8px; text-align: center; width: 65px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${(quote.items || []).map((it, idx) => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; text-align: center; color: #64748b;">${idx + 1}</td>
                            <td style="padding: 8px;">
                                <div style="font-weight: 700; color: #0f172a; font-size: 0.95rem;">${formatQuoteItemTitle(it, idx)}</div>
                                ${it.desc ? `<div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">${it.desc}</div>` : ''}
                                ${it.drawingSvg ? `
                                    <div class="quote-item-drawing" style="margin-top: 8px; max-width: 240px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px; background: #f8fafc;">
                                        <div style="font-size: 0.68rem; font-weight: 700; color: #475569; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">📐 2D Design Spec</div>
                                        ${it.drawingSvg}
                                    </div>
                                ` : ''}
                            </td>
                            <td style="padding: 8px; text-align: center;">${it.pieces || it.qty || 1}</td>
                            <td style="padding: 8px; text-align: right;">₹${Number(it.rate || it.price || 0).toLocaleString()}</td>
                            <td style="padding: 8px; text-align: right; color: #64748b;">${it.discount ? it.discount + '%' : '-'}</td>
                            <td style="padding: 8px; text-align: right; color: #64748b;">${it.tax ? it.tax + '%' : '-'}</td>
                            <td style="padding: 8px; text-align: right; font-weight: 600;">₹${Number(it.total || 0).toLocaleString()}</td>
                            <td class="no-print" style="padding: 8px; text-align: center;">
                                <button type="button" onclick="window.openEditQuotationModal('${quote.id}', ${idx})" style="padding: 3px 8px; font-size: 0.72rem; color: #0284c7; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;" title="Edit this item">
                                    ✏️ Edit
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>"""

new_print_table = """            <!-- Items Table (With 2D CAD Drawing on Left of Product, No Disc/Tax) -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.88rem;">
                <thead>
                    <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; color: #334155; text-transform: uppercase; font-size: 0.74rem; letter-spacing: 0.5px;">
                        <th style="padding: 10px 6px; text-align: center; width: 32px;">#</th>
                        <th style="padding: 10px 10px; text-align: center; width: 135px;">2D Drawing</th>
                        <th style="padding: 10px 10px; text-align: left;">Product / Description</th>
                        <th style="padding: 10px 6px; text-align: center; width: 60px;">Qty</th>
                        <th style="padding: 10px 8px; text-align: right; width: 95px;">Rate</th>
                        <th style="padding: 10px 8px; text-align: right; width: 110px;">Amount</th>
                        <th class="no-print" style="padding: 10px 6px; text-align: center; width: 65px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${(quote.items || []).map((it, idx) => {
                        const itemSvg = it.drawingSvg || (typeof window.generateWindowCadSvg === 'function' ? window.generateWindowCadSvg(it, { isThumbnail: true, showDimensions: true, viewW: 160, viewH: 120 }) : '');
                        return `
                        <tr style="border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                            <td style="padding: 10px 6px; text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
                            <td style="padding: 10px 6px; text-align: center;">
                                <div style="width: 125px; height: 95px; margin: 0 auto; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 2px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
                                    ${itemSvg}
                                </div>
                            </td>
                            <td style="padding: 10px;">
                                <div style="font-weight: 700; color: #0f172a; font-size: 0.95rem;">${formatQuoteItemTitle(it, idx)}</div>
                                ${it.desc ? `<div style="font-size: 0.8rem; color: #475569; margin-top: 2px;">${it.desc}</div>` : ''}
                                ${it.bomSummary ? `<div style="font-size: 0.72rem; color: #64748b; margin-top: 4px; background: #f8fafc; padding: 3px 7px; border-radius: 4px; display: inline-block; border: 1px solid #e2e8f0;">📋 ${it.bomSummary}</div>` : ''}
                            </td>
                            <td style="padding: 10px 6px; text-align: center; font-weight: 700; color: #0f172a;">${it.pieces || it.qty || 1}</td>
                            <td style="padding: 10px 8px; text-align: right; font-weight: 600; color: #334155;">₹${Number(it.rate || it.price || 0).toLocaleString()}</td>
                            <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: #0f172a; font-size: 0.95rem;">₹${Number(it.total || ((it.pieces || it.qty || 1) * (it.rate || it.price || 0))).toLocaleString()}</td>
                            <td class="no-print" style="padding: 10px 6px; text-align: center;">
                                <button type="button" onclick="window.openEditQuotationModal('${quote.id}', ${idx})" style="padding: 4px 8px; font-size: 0.72rem; color: #0284c7; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;" title="Edit this item">
                                    ✏️ Edit
                                </button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>"""

if old_print_table in src:
    src = src.replace(old_print_table, new_print_table)
    print('Updated openPrintQuotationModal items table')
else:
    print('ERROR: old_print_table not matched')

# 2. Update openEditQuotationModal thead and tbody
old_edit_thead = """                                <tr style="background: rgba(255, 255, 255, 0.04); color: #94a3b8; border-bottom: 1px solid rgba(255, 255, 255, 0.1); text-transform: uppercase; font-size: 0.72rem;">
                                    <th style="padding: 8px 6px; text-align: center; width: 30px;">#</th>
                                    <th style="padding: 8px; text-align: left; min-width: 220px;">Model Name & Dimensions</th>
                                    <th style="padding: 8px; text-align: left; min-width: 180px;">Specs / Desc</th>
                                    <th style="padding: 8px 4px; text-align: center; width: 60px;">Qty</th>
                                    <th style="padding: 8px 4px; text-align: right; width: 95px;">Rate (₹)</th>
                                    <th style="padding: 8px 4px; text-align: right; width: 60px;">Disc %</th>
                                    <th style="padding: 8px 4px; text-align: right; width: 60px;">Tax %</th>
                                    <th style="padding: 8px 6px; text-align: right; width: 100px;">Total (₹)</th>
                                    <th style="padding: 8px 4px; text-align: center; width: 75px;">Actions</th>
                                </tr>"""

new_edit_thead = """                                <tr style="background: rgba(255, 255, 255, 0.04); color: #94a3b8; border-bottom: 1px solid rgba(255, 255, 255, 0.1); text-transform: uppercase; font-size: 0.72rem;">
                                    <th style="padding: 8px 6px; text-align: center; width: 30px;">#</th>
                                    <th style="padding: 8px 6px; text-align: center; width: 90px;">2D View</th>
                                    <th style="padding: 8px; text-align: left; min-width: 200px;">Model Name & Dimensions</th>
                                    <th style="padding: 8px; text-align: left; min-width: 160px;">Specs / Desc</th>
                                    <th style="padding: 8px 4px; text-align: center; width: 60px;">Qty</th>
                                    <th style="padding: 8px 4px; text-align: right; width: 95px;">Rate (₹)</th>
                                    <th style="padding: 8px 6px; text-align: right; width: 100px;">Total (₹)</th>
                                    <th style="padding: 8px 4px; text-align: center; width: 75px;">Actions</th>
                                </tr>"""

if old_edit_thead in src:
    src = src.replace(old_edit_thead, new_edit_thead)
    print('Updated openEditQuotationModal thead')
else:
    print('ERROR: old_edit_thead not matched')

old_edit_tbody = """    tbody.innerHTML = eq.items.map((it, idx) => `
        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.06); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
            <td style="padding: 6px; text-align: center; color: #94a3b8; font-weight: 600;">${idx + 1}</td>
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
            <td style="padding: 6px 4px;">
                <input type="number" min="0" max="100" value="${it.discount || 0}" oninput="window.updateEditQuoteItemField(${idx}, 'discount', this.value)" style="width: 50px; padding: 4px 2px; text-align: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #94a3b8; font-size: 0.82rem;" />
            </td>
            <td style="padding: 6px 4px;">
                <input type="number" min="0" max="100" value="${it.tax || 0}" oninput="window.updateEditQuoteItemField(${idx}, 'tax', this.value)" style="width: 50px; padding: 4px 2px; text-align: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #94a3b8; font-size: 0.82rem;" />
            </td>
            <td style="padding: 6px; text-align: right; font-weight: 700; color: #34d399; font-size: 0.9rem;" id="edit-q-item-total-${idx}">
                ₹${Number(it.total || 0).toLocaleString()}
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
    `).join('');"""

new_edit_tbody = """    tbody.innerHTML = eq.items.map((it, idx) => {
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
    }).join('');"""

if old_edit_tbody in src:
    src = src.replace(old_edit_tbody, new_edit_tbody)
    print('Updated openEditQuotationModal tbody')
else:
    print('ERROR: old_edit_tbody not matched')

# Update updateEditQuoteItemField
old_update_field = """window.updateEditQuoteItemField = (idx, field, val) => {
    const eq = window._editingQuote;
    if (!eq || !eq.items[idx]) return;
    const it = eq.items[idx];

    if (field === 'qty') it.qty = Math.max(1, parseInt(val) || 1);
    else if (field === 'rate') it.rate = Math.max(0, parseFloat(val) || 0);
    else if (field === 'discount') it.discount = Math.min(100, Math.max(0, parseFloat(val) || 0));
    else if (field === 'tax') it.tax = Math.max(0, parseFloat(val) || 0);
    else it[field] = val;

    // Recalculate line total
    const sub = (it.qty || 1) * (it.rate || 0);
    const disc = sub * ((it.discount || 0) / 100);
    const taxable = sub - disc;
    const taxAmt = taxable * ((it.tax || 0) / 100);
    it.total = Math.round(taxable + taxAmt);

    const totalEl = document.getElementById(`edit-q-item-total-${idx}`);
    if (totalEl) totalEl.textContent = `₹${Number(it.total).toLocaleString()}`;

    window.recalcEditQuoteTotals();
};"""

new_update_field = """window.updateEditQuoteItemField = (idx, field, val) => {
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
};"""

if old_update_field in src:
    src = src.replace(old_update_field, new_update_field)
    print('Updated updateEditQuoteItemField')
else:
    print('ERROR: old_update_field not matched')

# 3. Update renderCreateQuotationUI (table headers and columns)
old_create_table = """                <thead style="background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.5px;">
                    <tr>
                        <th style="padding: 1rem; width: 50px;">#</th>
                        <th style="padding: 1rem;">Product / Description</th>
                        <th style="padding: 1rem; width: 100px; text-align: center;">Qty</th>
                        <th style="padding: 1rem; width: 120px; text-align: right;">Price</th>
                        <th style="padding: 1rem; width: 100px; text-align: center;">Disc(%)</th>
                        <th style="padding: 1rem; width: 100px; text-align: center;">Tax(%)</th>
                        <th style="padding: 1rem; width: 120px; text-align: right;">Total</th>
                        <th style="padding: 1rem; width: 50px;"></th>
                    </tr>
                </thead>"""

new_create_table = """                <thead style="background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.5px;">
                    <tr>
                        <th style="padding: 1rem; width: 50px;">#</th>
                        <th style="padding: 1rem;">Product / Description</th>
                        <th style="padding: 1rem; width: 100px; text-align: center;">Qty</th>
                        <th style="padding: 1rem; width: 120px; text-align: right;">Price</th>
                        <th style="padding: 1rem; width: 120px; text-align: right;">Total</th>
                        <th style="padding: 1rem; width: 50px;"></th>
                    </tr>
                </thead>"""

if old_create_table in src:
    src = src.replace(old_create_table, new_create_table)
    print('Updated renderCreateQuotationUI thead')
else:
    print('ERROR: old_create_table not matched')

# Update createQuoteState item row mapping
old_create_row = """                             <td style="padding: 1rem;">
                                <input type="number" value="${item.discount}" min="0" max="100" onchange="window.updateQuoteItem(${index}, 'discount', this.value)" 
                                    class="glass-input glass-dimmed-input" style="width: 100%; padding: 6px; text-align: center;">
                            </td>
                             <td style="padding: 1rem;">
                                <input type="number" value="${item.tax}" min="0" max="100" onchange="window.updateQuoteItem(${index}, 'tax', this.value)" 
                                    class="glass-input glass-dimmed-input" style="width: 100%; padding: 6px; text-align: center;">
                            </td>"""

if old_create_row in src:
    src = src.replace(old_create_row, '')
    print('Removed discount and tax from renderCreateQuotationUI tbody')
else:
    print('ERROR: old_create_row not matched')

with open('js/modules/quotations.js', 'w', encoding='utf-8') as f:
    f.write(src)

print('quotations.js patch finished successfully')
