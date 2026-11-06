import os
import re

calc_path = r'c:\Users\anshi\OneDrive\Documents\code\code project\js\modules\calculation.js'

with open(calc_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Helper & Dropdown Controller Functions before `function renderManualCalc(state) {`
target_pre_render = """// Global Material Search state
window.calcMaterialSearchQuery = window.calcMaterialSearchQuery || '';
window.filterCalcMaterials = (q) => {
    window.calcMaterialSearchQuery = (q || '').toLowerCase().trim();
    Store.notify();
};

window.studioMaterialSearchQuery = window.studioMaterialSearchQuery || '';
window.filterStudioMaterials = (q) => {
    window.studioMaterialSearchQuery = (q || '').toLowerCase().trim();
    Store.notify();
};

// -----------------------------------------------------------------------------------------
// 1. QUICK CALCULATION (Real-Time 2D Studio - Always Starts at 1 Kalli 50x140 cm)
// -----------------------------------------------------------------------------------------
function renderManualCalc(state) {"""

replacement_pre_render = """// Global Material Search state
window.calcMaterialSearchQuery = window.calcMaterialSearchQuery || '';
window.filterCalcMaterials = (q) => {
    window.calcMaterialSearchQuery = (q || '').toLowerCase().trim();
    Store.notify();
};

window.studioMaterialSearchQuery = window.studioMaterialSearchQuery || '';
window.filterStudioMaterials = (q) => {
    window.studioMaterialSearchQuery = (q || '').toLowerCase().trim();
    Store.notify();
};

// =========================================================================
// AUTOCOMPLETE & SAVED FILES SEARCH CONTROLLER
// =========================================================================
function parseWindowSpecs(item, defaultUnit = 'cm') {
    let w = item.width ? parseFloat(item.width) : 0;
    let h = item.height ? parseFloat(item.height) : 0;
    let unit = item.unit || defaultUnit || 'cm';
    let cols = item.cols ? parseInt(item.cols) : 0;

    if (!w || !h) {
        const text = `${item.name || ''} ${item.desc || ''}`;
        const dimMatch = text.match(/(\\d+(?:\\.\\d+)?)\\s*[*xX×]\\s*(\\d+(?:\\.\\d+)?)/);
        if (dimMatch) {
            let n1 = parseFloat(dimMatch[1]);
            let n2 = parseFloat(dimMatch[2]);
            // If feet format like 4x4, 6x7, 2x2 without cm/mm, convert to cm
            if (n1 <= 12 && n2 <= 12 && !text.toLowerCase().includes('cm') && !text.toLowerCase().includes('mm')) {
                w = Math.round(n1 * 30.48);
                h = Math.round(n2 * 30.48);
                unit = 'cm';
            } else {
                w = n1;
                h = n2;
            }
        } else {
            w = 100;
            h = 140;
            unit = 'cm';
        }
    }

    if (!cols) {
        const kMatch = (item.desc || '').match(/(\\d)\\s*kalli/i);
        if (kMatch) {
            cols = parseInt(kMatch[1]);
        } else {
            const wCm = convertUnit(w, unit, 'cm');
            cols = Math.max(1, Math.min(6, Math.round(wCm / 50)));
        }
    }

    return { w, h, unit, cols };
}

window.openCalcSearchDropdown = (value) => {
    window.renderCalcSearchDropdown(value || '');
};

window.handleCalcSearchInput = (value) => {
    window.calcSearchQuery = value;
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) {
        clearBtn.style.display = value ? 'flex' : 'none';
    }
    window.renderCalcSearchDropdown(value);
};

window.handleCalcSearchKey = (event) => {
    if (event.key === 'Escape') {
        window.closeCalcSearchDropdown();
    } else if (event.key === 'Enter') {
        const val = (event.target.value || '').trim();
        if (val) {
            window.handleCalcSearch(val);
            window.closeCalcSearchDropdown();
        }
    }
};

window.closeCalcSearchDropdown = () => {
    const dd = document.getElementById('calc-search-dropdown');
    if (dd) dd.style.display = 'none';
};

window.clearCalcSearch = () => {
    window.calcSearchQuery = '';
    const input = document.getElementById('calc-search-bar');
    if (input) {
        input.value = '';
        input.focus();
    }
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    window.renderCalcSearchDropdown('');
};

window.renderCalcSearchDropdown = (query) => {
    const dd = document.getElementById('calc-search-dropdown');
    if (!dd) return;

    const q = (query || '').trim().toLowerCase();
    const g = Store.state.rateCalc?.grid || { unit: 'cm' };

    // 1. Collect all saved items from quotations
    const allSavedItems = [];
    (Store.state.quotations || []).forEach(quote => {
        (quote.items || []).forEach((it, idx) => {
            const specs = parseWindowSpecs(it, g.unit);
            allSavedItems.push({
                quoteId: quote.id,
                quoteDate: quote.date,
                customer: quote.customer || 'Customer',
                itemIndex: idx,
                name: it.name || `Window Item ${idx + 1}`,
                desc: it.desc || '',
                rate: it.rate || it.total || quote.amount || 0,
                specs: specs
            });
        });
    });

    let filteredSaved = [];
    if (!q) {
        // Show recent up to 6 saved items
        filteredSaved = allSavedItems.slice(0, 6);
    } else {
        filteredSaved = allSavedItems.filter(it => {
            return it.name.toLowerCase().includes(q) ||
                   it.desc.toLowerCase().includes(q) ||
                   it.customer.toLowerCase().includes(q) ||
                   it.quoteId.toLowerCase().includes(q) ||
                   `${it.specs.cols} kalli`.includes(q) ||
                   `${it.specs.w}x${it.specs.h}`.includes(q) ||
                   `${it.specs.w}*${it.specs.h}`.includes(q);
        }).slice(0, 8);
    }

    // 2. Standard Window Presets
    const presets = [
        { k: 1, title: '1 Kalli Window', size: '50 × 140 cm', desc: 'Single Pane Standard' },
        { k: 2, title: '2 Kalli Window', size: '100 × 140 cm', desc: 'Double Pane Casement' },
        { k: 3, title: '3 Kalli Window', size: '150 × 140 cm', desc: 'Triple Pane Standard' },
        { k: 4, title: '4 Kalli Window', size: '200 × 140 cm', desc: '4 Pane Wide Model' },
        { k: 5, title: '5 Kalli Window', size: '250 × 140 cm', desc: '5 Pane Villa Window' },
        { k: 6, title: '6 Kalli Window', size: '300 × 140 cm', desc: '6 Pane Panoramic' },
    ];
    let filteredPresets = [];
    if (!q) {
        filteredPresets = presets;
    } else {
        filteredPresets = presets.filter(p => {
            return p.title.toLowerCase().includes(q) ||
                   p.desc.toLowerCase().includes(q) ||
                   p.size.toLowerCase().includes(q) ||
                   q === 'w' || q === 'window' || q === 'preset' || q === 'kalli' ||
                   q.includes(String(p.k));
        });
    }

    // 3. Dimension Parser Match (e.g. 100x140, 120*150)
    let dimActionHtml = '';
    const dimMatch = q.match(/(\\d+(?:\\.\\d+)?)\\s*[*xX×]\\s*(\\d+(?:\\.\\d+)?)/);
    if (dimMatch) {
        const dw = parseFloat(dimMatch[1]);
        const dh = parseFloat(dimMatch[2]);
        if (dw > 0 && dh > 0) {
            const baseWCm = convertUnit(dw, g.unit, 'cm');
            const estCols = Math.max(1, Math.min(6, Math.round(baseWCm / 50)));
            dimActionHtml = `
                <div 
                    onclick="window.applyCustomDimension(${dw}, ${dh})"
                    class="calc-search-dropdown-item"
                    style="background: #f0fdf4; border-bottom: 1.5px solid #bbf7d0; display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; cursor: pointer;"
                >
                    <div>
                        <div style="font-weight: 800; font-size: 0.86rem; color: #166534; display: flex; align-items: center; gap: 6px;">
                            <span>📐</span> Apply Window Size: <strong>${dw} × ${dh} ${g.unit}</strong>
                        </div>
                        <div style="font-size: 0.73rem; color: #15803d; margin-top: 2px;">
                            Auto-configured as <strong>${estCols} Kalli</strong> (${(dw/estCols).toFixed(1)} ${g.unit} per pane)
                        </div>
                    </div>
                    <span style="font-size: 0.72rem; font-weight: 800; background: #166534; color: #ffffff; padding: 4px 9px; border-radius: 4px;">APPLY SIZE</span>
                </div>
            `;
        }
    }

    // 4. Catalog Materials (Profiles, Sections, Panels)
    let filteredMaterials = [];
    if (q && q.length >= 2) {
        const allMats = (Store.state.materialCatalog || []);
        filteredMaterials = allMats.filter(m => {
            return (m.name || '').toLowerCase().includes(q) ||
                   (m.category || '').toLowerCase().includes(q) ||
                   (m.desc || '').toLowerCase().includes(q);
        }).slice(0, 4);
    }

    // Build the Dropdown HTML
    let html = '';

    // Direct Dimension Card if present
    if (dimActionHtml) {
        html += dimActionHtml;
    }

    // Saved Files & Quotations Section
    if (filteredSaved.length > 0) {
        html += `
            <div style="padding: 7px 12px; background: #f8fafc; font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                <span>📁 Saved Files & Quotations (${filteredSaved.length})</span>
                <span style="font-size: 0.68rem; color: #0284c7; font-weight: 700;">Click to load</span>
            </div>
        `;
        filteredSaved.forEach(it => {
            html += `
                <div 
                    class="calc-search-dropdown-item"
                    onclick="window.loadSavedWindowDesign('${it.quoteId}', ${it.itemIndex})"
                    style="padding: 9px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.15s ease;"
                >
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; font-size: 0.84rem; color: #0f172a;">
                            ${it.name} • ${it.specs.w}×${it.specs.h} ${it.specs.unit} (${it.specs.cols} Kalli)
                        </span>
                        <span style="font-size: 0.72rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 2px 7px; border-radius: 4px;">
                            ${it.quoteId}
                        </span>
                    </div>
                    <div style="font-size: 0.74rem; color: #64748b; margin-top: 3px; display: flex; justify-content: space-between; align-items: center;">
                        <span>Customer: <strong style="color: #334155;">${it.customer}</strong></span>
                        <span style="font-weight: 700; color: #10b981;">₹${Number(it.rate).toLocaleString('en-IN')}</span>
                    </div>
                </div>
            `;
        });
    }

    // Standard Window Types & Presets Section
    if (filteredPresets.length > 0) {
        html += `
            <div style="padding: 7px 12px; background: #f8fafc; font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                <span>📐 Window Types & Presets</span>
                <span style="font-size: 0.68rem; color: #64748b; font-weight: 600;">Standard Models</span>
            </div>
        `;
        filteredPresets.forEach(p => {
            html += `
                <div 
                    class="calc-search-dropdown-item"
                    onclick="window.selectPresetFromSearch(${p.k})"
                    style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                >
                    <div>
                        <div style="font-weight: 700; font-size: 0.83rem; color: #0f172a;">
                            ${p.title} <span style="font-size: 0.76rem; color: #64748b; font-weight: 500;">(${p.size})</span>
                        </div>
                        <div style="font-size: 0.72rem; color: #94a3b8;">${p.desc}</div>
                    </div>
                    <span style="font-size: 0.7rem; font-weight: 700; color: #059669; background: #d1fae5; padding: 2px 6px; border-radius: 4px;">${p.k} Pane</span>
                </div>
            `;
        });
    }

    // Matching Materials Section
    if (filteredMaterials.length > 0) {
        html += `
            <div style="padding: 7px 12px; background: #f8fafc; font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                🔩 Matching Catalog Materials
            </div>
        `;
        filteredMaterials.forEach(m => {
            html += `
                <div 
                    class="calc-search-dropdown-item"
                    onclick="window.selectMaterialFromSearch('${m.id}', '${m.category}')"
                    style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                >
                    <div>
                        <div style="font-weight: 700; font-size: 0.82rem; color: #0f172a;">${m.name}</div>
                        <div style="font-size: 0.72rem; color: #64748b;">${m.category || 'Material'} • ${m.unit || 'nos'}</div>
                    </div>
                    <span style="font-size: 0.75rem; font-weight: 800; color: #0284c7;">₹${m.rate}</span>
                </div>
            `;
        });
    }

    if (!html) {
        html = `
            <div style="padding: 16px; text-align: center; color: #64748b; font-size: 0.82rem;">
                No saved window files or types matching "<strong>${query}</strong>".<br>
                <span style="font-size: 0.74rem; color: #94a3b8; margin-top: 4px; display: inline-block;">
                    Type dimensions like <strong>100x140</strong> or customer name to search.
                </span>
            </div>
        `;
    }

    dd.innerHTML = html;
    dd.style.display = 'block';
};

window.applyCustomDimension = (w, h) => {
    if (typeof window.snapshotCurrentCalc === 'function') window.snapshotCurrentCalc();
    
    // In rateCalc:
    if (Store.state.rateCalc && Store.state.rateCalc.grid) {
        const g = Store.state.rateCalc.grid;
        g.totalW = w;
        g.totalH = h;
        const baseWCm = convertUnit(w, g.unit, 'cm');
        const estimatedCols = Math.max(1, Math.min(6, Math.round(baseWCm / 50)));
        g.cols = estimatedCols;
        const paneW = parseFloat((w / estimatedCols).toFixed(1));
        g.paneWidths = Array(estimatedCols).fill(paneW);
        g.panePartitions = Array(estimatedCols).fill(0);
        g.partitionPos = Array(estimatedCols).fill('top');
    }

    // In quoteStudio currentWindow if present:
    if (Store.state.quoteStudio && Store.state.quoteStudio.currentWindow) {
        const cw = Store.state.quoteStudio.currentWindow;
        cw.totalW = w;
        cw.totalH = h;
        const baseWCm = convertUnit(w, cw.unit, 'cm');
        const estimatedCols = Math.max(1, Math.min(6, Math.round(baseWCm / 50)));
        cw.cols = estimatedCols;
        const paneW = parseFloat((w / estimatedCols).toFixed(1));
        cw.paneWidths = Array(estimatedCols).fill(paneW);
        cw.panePartitions = Array(estimatedCols).fill(0);
    }

    window.calcSearchQuery = '';
    const input = document.getElementById('calc-search-bar');
    if (input) input.value = '';
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    const dd = document.getElementById('calc-search-dropdown');
    if (dd) dd.style.display = 'none';

    Store.notify();
};

window.selectPresetFromSearch = (k) => {
    window.loadPreset(k);
    window.calcSearchQuery = '';
    const input = document.getElementById('calc-search-bar');
    if (input) input.value = '';
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    const dd = document.getElementById('calc-search-dropdown');
    if (dd) dd.style.display = 'none';
};

window.selectMaterialFromSearch = (matId, category) => {
    const rc = Store.state.rateCalc;
    if (rc && rc.materials) {
        const catKey = (category || '').toLowerCase();
        if (catKey.includes('profile')) rc.materials.frame = matId;
        else if (catKey.includes('pipe') || catKey.includes('tube')) rc.materials.pipe = matId;
        else if (catKey.includes('panel') || catKey.includes('glass')) rc.materials.panel = matId;
        else if (catKey.includes('hinge')) rc.materials.hinge = matId;
        else if (catKey.includes('lock')) rc.materials.lock = matId;
        else if (catKey.includes('hook') || catKey.includes('rubber')) rc.materials.hook = matId;
        else if (catKey.includes('paint')) rc.materials.paint = matId;
    }
    window.calcSearchQuery = '';
    const input = document.getElementById('calc-search-bar');
    if (input) input.value = '';
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    const dd = document.getElementById('calc-search-dropdown');
    if (dd) dd.style.display = 'none';

    Store.notify();
};

window.loadSavedWindowDesign = (quoteId, itemIndex) => {
    const qList = Store.state.quotations || [];
    const quote = qList.find(q => q.id === quoteId);
    if (!quote || !quote.items || !quote.items[itemIndex]) return;
    const item = quote.items[itemIndex];

    const specs = parseWindowSpecs(item, Store.state.rateCalc?.grid?.unit || 'cm');

    // 1. If currently in Quotation Studio Step 2
    if (Store.state.quoteStudio && Store.state.quoteStudio.currentWindow) {
        const cw = Store.state.quoteStudio.currentWindow;
        cw.totalW = specs.w;
        cw.totalH = specs.h;
        cw.unit = specs.unit;
        cw.cols = specs.cols;
        const paneW = parseFloat((cw.totalW / cw.cols).toFixed(1));
        cw.paneWidths = (item.paneWidths && item.paneWidths.length === cw.cols) ? [...item.paneWidths] : Array(cw.cols).fill(paneW);
        cw.panePartitions = (item.panePartitions && item.panePartitions.length === cw.cols) ? [...item.panePartitions] : Array(cw.cols).fill(0);
        cw.name = item.name || `Window W${cw.cols}`;
    }

    // 2. Also update rateCalc (Quick Calculation canvas)
    if (Store.state.rateCalc && Store.state.rateCalc.grid) {
        if (typeof window.snapshotCurrentCalc === 'function') window.snapshotCurrentCalc();
        const g = Store.state.rateCalc.grid;
        g.totalW = specs.w;
        g.totalH = specs.h;
        g.unit = specs.unit;
        g.cols = specs.cols;
        const paneW = parseFloat((g.totalW / g.cols).toFixed(1));
        g.paneWidths = (item.paneWidths && item.paneWidths.length === g.cols) ? [...item.paneWidths] : Array(g.cols).fill(paneW);
        g.panePartitions = (item.panePartitions && item.panePartitions.length === g.cols) ? [...item.panePartitions] : Array(g.cols).fill(0);
        g.partitionPos = Array(g.cols).fill('top');
    }

    if (Store.state.calculation) {
        if (quote.customer) Store.state.calculation.customerName = quote.customer;
        Store.state.calculation.itemName = item.name || `Window W${specs.cols}`;
    }

    // Reset search
    window.calcSearchQuery = '';
    const input = document.getElementById('calc-search-bar');
    if (input) input.value = '';
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    const dd = document.getElementById('calc-search-dropdown');
    if (dd) dd.style.display = 'none';

    Store.notify();
};

// Customer Autocomplete for Quotation Studio Step 1
window.showQuoteCustDropdown = (value) => {
    window.renderQuoteCustDropdown(value || '');
};

window.handleQuoteCustInput = (value) => {
    if (Store.state.quoteStudio?.customer) {
        Store.state.quoteStudio.customer.name = value;
    }
    window.renderQuoteCustDropdown(value);
};

window.renderQuoteCustDropdown = (query) => {
    const dd = document.getElementById('qs-cust-dropdown');
    if (!dd) return;

    const q = (query || '').trim().toLowerCase();
    
    // Combine Store.state.customers and customers from quotations
    const map = new Map();
    (Store.state.customers || []).forEach(c => {
        if (c.name) map.set(c.name.toLowerCase(), c);
    });
    (Store.state.quotations || []).forEach(qQuote => {
        if (qQuote.customer && !map.has(qQuote.customer.toLowerCase())) {
            map.set(qQuote.customer.toLowerCase(), {
                id: qQuote.customerId || '',
                name: qQuote.customer,
                mobile: qQuote.customerPhone || '',
                place: (qQuote.customerAddress || '').split(',')[0] || '',
                city: '',
                pincode: ''
            });
        }
    });

    const allCusts = Array.from(map.values());
    let filtered = [];
    if (!q) {
        filtered = allCusts.slice(0, 6);
    } else {
        filtered = allCusts.filter(c => {
            return (c.name || '').toLowerCase().includes(q) ||
                   (c.mobile || '').includes(q) ||
                   (c.place || '').toLowerCase().includes(q);
        }).slice(0, 8);
    }

    if (filtered.length === 0) {
        dd.style.display = 'none';
        return;
    }

    let html = `
        <div style="padding: 5px 10px; background: #f8fafc; font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
            <span>Verified Customers</span>
            <span style="font-size: 0.68rem; color: #0284c7; font-weight: 700;">Click to autofill</span>
        </div>
    `;

    filtered.forEach(c => {
        const escaped = JSON.stringify(c).replace(/"/g, '&quot;');
        html += `
            <div 
                onclick="window.selectQuoteCustomer(${escaped})"
                class="calc-search-dropdown-item"
                style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; cursor: pointer; text-align: left;"
            >
                <div style="font-weight: 700; font-size: 0.84rem; color: #0f172a;">${c.name}</div>
                <div style="font-size: 0.72rem; color: #64748b; margin-top: 1px;">
                    ${c.mobile ? '📞 ' + c.mobile : ''} ${c.place ? '• 📍 ' + c.place : ''} ${c.city ? ', ' + c.city : ''}
                </div>
            </div>
        `;
    });

    dd.innerHTML = html;
    dd.style.display = 'block';
};

window.selectQuoteCustomer = (c) => {
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
};

// Global click outside listener for search & customer dropdowns
if (!window._calcSearchClickListenerAttached) {
    window._calcSearchClickListenerAttached = true;
    document.addEventListener('click', (e) => {
        const bar = document.getElementById('calc-search-bar');
        const dd = document.getElementById('calc-search-dropdown');
        if (dd && bar && !bar.contains(e.target) && !dd.contains(e.target)) {
            dd.style.display = 'none';
        }

        const qBar = document.getElementById('qs-cust-name');
        const qDd = document.getElementById('qs-cust-dropdown');
        if (qDd && qBar && !qBar.contains(e.target) && !qDd.contains(e.target)) {
            qDd.style.display = 'none';
        }
    });
}

// -----------------------------------------------------------------------------------------
// 1. QUICK CALCULATION (Real-Time 2D Studio - Always Starts at 1 Kalli 50x140 cm)
// -----------------------------------------------------------------------------------------
function renderManualCalc(state) {"""

assert target_pre_render in content, "target_pre_render not found!"
content = content.replace(target_pre_render, replacement_pre_render, 1)

# 2. Expose snapshotCalc in renderManualCalc
target_snapshot = """        function snapshotCalc() {
            if (window.calcHistory.isRestoring) return;
            const currentRc = Store.state.rateCalc;
            if (!currentRc) return;
            window.calcHistory.past.push(JSON.stringify(currentRc));
            if (window.calcHistory.past.length > 30) window.calcHistory.past.shift();
            window.calcHistory.future = [];
        }"""

replacement_snapshot = """        function snapshotCalc() {
            if (window.calcHistory.isRestoring) return;
            const currentRc = Store.state.rateCalc;
            if (!currentRc) return;
            window.calcHistory.past.push(JSON.stringify(currentRc));
            if (window.calcHistory.past.length > 30) window.calcHistory.past.shift();
            window.calcHistory.future = [];
        }
        window.snapshotCurrentCalc = snapshotCalc;"""

assert target_snapshot in content, "target_snapshot not found!"
content = content.replace(target_snapshot, replacement_snapshot, 1)

# 3. Replace search bar HTML in renderManualCalc
target_search_html = """                        <!-- Search Bar with Live Dimension Parsing (e.g. 100x140) and Catalog Material Lookup -->
                        <div style="flex: 1; max-width: 360px; min-width: 220px; margin-left: auto;">
                            <div style="position: relative;">
                                <input 
                                    type="text" 
                                    id="calc-search-bar" 
                                    placeholder="Search size (e.g. 100x140) or preset..." 
                                    value="${window.calcSearchQuery || ''}"
                                    oninput="window.handleCalcSearch(this.value)"
                                    style="width: 100%; padding: 6px 12px 6px 30px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; outline: none; background: #f8fafc; font-weight: 600;"
                                >
                                <span style="position: absolute; left: 9px; top: 7px; font-size: 0.8rem; color: #94a3b8;">🔍</span>
                                ${window.calcSearchQuery ? `
                                    <button onclick="window.handleCalcSearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.85rem;">×</button>
                                ` : ''}
                            </div>
                        </div>"""

replacement_search_html = """                        <!-- Search Bar with Autocomplete Dropdown for Saved Files, Window Types & Models -->
                        <div style="flex: 1; max-width: 380px; min-width: 240px; margin-left: auto; position: relative;" id="calc-search-container">
                            <div style="position: relative; display: flex; align-items: center;">
                                <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; color: #64748b; pointer-events: none; z-index: 2;">🔍</span>
                                <input 
                                    type="text" 
                                    id="calc-search-bar" 
                                    autocomplete="off"
                                    placeholder="Search saved files, window types, or sizes..." 
                                    value="${window.calcSearchQuery || ''}"
                                    onfocus="window.openCalcSearchDropdown(this.value)"
                                    oninput="window.handleCalcSearchInput(this.value)"
                                    onkeydown="window.handleCalcSearchKey(event)"
                                    style="width: 100%; padding: 7px 32px 7px 32px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.84rem; outline: none; background: #ffffff !important; color: #0f172a !important; font-weight: 600; caret-color: #0284c7; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                >
                                <button 
                                    type="button"
                                    id="calc-search-clear-btn"
                                    onclick="window.clearCalcSearch()" 
                                    style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: #e2e8f0; border: none; color: #475569; width: 18px; height: 18px; border-radius: 50%; display: ${window.calcSearchQuery ? 'flex' : 'none'}; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem; font-weight: 700; line-height: 1; padding: 0;"
                                    title="Clear search"
                                >×</button>
                            </div>

                            <!-- Floating Dropdown for Saved Files, Window Types, and Presets -->
                            <div 
                                id="calc-search-dropdown" 
                                style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; width: 100%; max-height: 380px; overflow-y: auto; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 8px; box-shadow: 0 14px 30px -4px rgba(15, 23, 42, 0.25), 0 6px 14px -2px rgba(15, 23, 42, 0.12); z-index: 1000; text-align: left;"
                            ></div>
                        </div>"""

assert target_search_html in content, "target_search_html not found!"
content = content.replace(target_search_html, replacement_search_html, 1)

# 4. Enhance Quotation Studio Step 1 Customer Fields & Autocomplete
target_step1_cust = """                            <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; margin-bottom: 10px;">
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">1. Customer Name *</label>
                                    <input type="text" id="qs-cust-name" required value="${cust.name || ''}" placeholder="Full Name or Business Name" class="glass-input" style="width: 100%; font-size: 0.88rem; font-weight: 600; padding: 6px 10px;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">5. Mobile Number *</label>
                                    <input type="tel" id="qs-cust-mobile" required value="${cust.mobile || ''}" placeholder="10-digit mobile number" class="glass-input" style="width: 100%; font-size: 0.88rem; font-weight: 600; padding: 6px 10px;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">2. Place *</label>
                                    <input type="text" id="qs-cust-place" required value="${cust.place || ''}" placeholder="Area / Locality" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 6px 10px;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">3. City *</label>
                                    <input type="text" id="qs-cust-city" required value="${cust.city || ''}" placeholder="City / Town" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 6px 10px;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">4. Pincode *</label>
                                    <input type="text" id="qs-cust-pin" required value="${cust.pincode || ''}" placeholder="6-digit postal PIN" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 6px 10px;">
                                </div>
                            </div>"""

replacement_step1_cust = """                            <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; margin-bottom: 10px;">
                                <div style="position: relative;">
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">1. Customer Name *</label>
                                    <input 
                                        type="text" 
                                        id="qs-cust-name" 
                                        required 
                                        value="${cust.name || ''}" 
                                        placeholder="Full Name or Business Name" 
                                        class="glass-input" 
                                        autocomplete="off"
                                        onfocus="window.showQuoteCustDropdown(this.value)"
                                        oninput="window.handleQuoteCustInput(this.value)"
                                        style="width: 100%; font-size: 0.88rem; font-weight: 600; padding: 6px 10px; color: #0f172a !important; background: #ffffff !important;"
                                    >
                                    <div 
                                        id="qs-cust-dropdown" 
                                        style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; max-height: 220px; overflow-y: auto; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; box-shadow: 0 10px 25px rgba(15,23,42,0.18); z-index: 1000; text-align: left;"
                                    ></div>
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">5. Mobile Number *</label>
                                    <input type="tel" id="qs-cust-mobile" required value="${cust.mobile || ''}" placeholder="10-digit mobile number" class="glass-input" style="width: 100%; font-size: 0.88rem; font-weight: 600; padding: 6px 10px; color: #0f172a !important; background: #ffffff !important;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">2. Place *</label>
                                    <input type="text" id="qs-cust-place" required value="${cust.place || ''}" placeholder="Area / Locality" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 6px 10px; color: #0f172a !important; background: #ffffff !important;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">3. City *</label>
                                    <input type="text" id="qs-cust-city" required value="${cust.city || ''}" placeholder="City / Town" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 6px 10px; color: #0f172a !important; background: #ffffff !important;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">4. Pincode *</label>
                                    <input type="text" id="qs-cust-pin" required value="${cust.pincode || ''}" placeholder="6-digit postal PIN" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 6px 10px; color: #0f172a !important; background: #ffffff !important;">
                                </div>
                            </div>"""

assert target_step1_cust in content, "target_step1_cust not found!"
content = content.replace(target_step1_cust, replacement_step1_cust, 1)

# 5. Fix Studio Material Search Bar in Quotation Studio Step 2
target_mat_search = """                    <!-- Center: Search Bar -->
                    <div style="flex: 1; max-width: 320px; min-width: 200px;">
                        <div style="position: relative;">
                            <input 
                                type="text" 
                                placeholder="🔍 Search materials..." 
                                value="${window.studioMaterialSearchQuery || ''}"
                                oninput="window.filterStudioMaterials(this.value)"
                                style="width: 100%; padding: 6px 12px 6px 28px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; outline: none; background: #f8fafc;"
                            >
                            <span style="position: absolute; left: 8px; top: 7px; font-size: 0.8rem; color: #94a3b8;">🔍</span>
                        </div>
                    </div>"""

replacement_mat_search = """                    <!-- Center: Search Bar -->
                    <div style="flex: 1; max-width: 320px; min-width: 200px;">
                        <div style="position: relative;">
                            <input 
                                type="text" 
                                id="studio-mat-search-bar"
                                placeholder="🔍 Search materials..." 
                                value="${window.studioMaterialSearchQuery || ''}"
                                oninput="window.filterStudioMaterials(this.value)"
                                style="width: 100%; padding: 6px 12px 6px 28px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; outline: none; background: #ffffff !important; color: #0f172a !important; font-weight: 600;"
                            >
                            <span style="position: absolute; left: 8px; top: 7px; font-size: 0.8rem; color: #64748b;">🔍</span>
                        </div>
                    </div>"""

assert target_mat_search in content, "target_mat_search not found!"
content = content.replace(target_mat_search, replacement_mat_search, 1)

# Write updated file
with open(calc_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("calculation.js successfully patched with Search Autocomplete, Dropdowns, and Dark Solid Text!")
