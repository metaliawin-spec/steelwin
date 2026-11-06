import os

calc_path = r'c:\Users\anshi\OneDrive\Documents\code\code project\js\modules\calculation.js'

with open(calc_path, 'r', encoding='utf-8') as f:
    content = f.read()

# -------------------------------------------------------------
# 1. Unified Direct-Typing Searchable Combobox Controllers
# -------------------------------------------------------------
target_controllers = """// Global Material Preset Searchable Select Controllers (Step 2)
window.toggleStudioMatDropdown = (key, event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const dd = document.getElementById(`qs-mat-dropdown-${key}`);
    if (!dd) return;

    const isVisible = dd.style.display === 'flex';

    // Close all other open mat dropdowns
    document.querySelectorAll('[id^="qs-mat-dropdown-"]').forEach(el => {
        el.style.display = 'none';
    });

    if (!isVisible) {
        dd.style.display = 'flex';
        const searchInp = document.getElementById(`qs-mat-search-${key}`);
        if (searchInp) {
            searchInp.value = '';
            window.filterStudioMatDropdown(key, '');
            setTimeout(() => searchInp.focus(), 60);
        }
    }
};

window.filterStudioMatDropdown = (key, query) => {
    const list = document.getElementById(`qs-mat-list-${key}`);
    if (!list) return;

    const q = (query || '').trim().toLowerCase();
    const options = list.querySelectorAll('.mat-dropdown-opt');
    let visibleCount = 0;

    options.forEach(opt => {
        const text = (opt.getAttribute('data-search') || opt.innerText).toLowerCase();
        if (!q || text.includes(q)) {
            opt.style.display = 'flex';
            visibleCount++;
        } else {
            opt.style.display = 'none';
        }
    });

    let noResults = list.querySelector('.mat-no-results');
    if (visibleCount === 0) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.className = 'mat-no-results';
            noResults.style.cssText = 'padding: 14px; text-align: center; color: #64748b; font-size: 0.8rem;';
            list.appendChild(noResults);
        }
        noResults.innerText = `No materials found matching "${query}"`;
        noResults.style.display = 'block';
    } else if (noResults) {
        noResults.style.display = 'none';
    }
};

window.selectStudioMatPreset = (key, id, name, rate) => {
    const hiddenInp = document.getElementById(`qs-mat-${key}`);
    const textSpan = document.getElementById(`qs-mat-text-${key}`);
    if (hiddenInp) hiddenInp.value = id;
    if (textSpan) {
        textSpan.innerText = id === 'none' ? '-- None (Not Included) --' : `${name} (₹${rate})`;
        textSpan.style.color = id === 'none' ? '#64748b' : '#0f172a';
    }

    if (Store.state.quoteStudio?.materials) {
        Store.state.quoteStudio.materials[key] = id;
    }

    // Highlight active option
    const list = document.getElementById(`qs-mat-list-${key}`);
    if (list) {
        list.querySelectorAll('.mat-dropdown-opt').forEach(opt => {
            opt.style.backgroundColor = 'transparent';
        });
    }

    const dd = document.getElementById(`qs-mat-dropdown-${key}`);
    if (dd) dd.style.display = 'none';
};

// Global click outside listener for search, customer & material dropdowns
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

        // Close any open material dropdowns
        if (!e.target.closest('[id^="qs-mat-root-"]') && !e.target.closest('[id^="qs-mat-dropdown-"]')) {
            document.querySelectorAll('[id^="qs-mat-dropdown-"]').forEach(el => {
                el.style.display = 'none';
            });
        }
    });
}"""

replacement_controllers = """// Unified Direct-Typing Searchable Combobox System
window.openMatCombobox = (boxId, inputEl) => {
    const root = document.getElementById(boxId);
    if (!root) return;

    // Close all other open combobox dropdowns
    document.querySelectorAll('.mat-combobox-dropdown').forEach(dd => {
        if (dd.id !== `dropdown-${boxId}`) {
            dd.style.display = 'none';
        }
    });

    const dd = document.getElementById(`dropdown-${boxId}`);
    if (dd) {
        dd.style.display = 'flex';
        window.filterMatCombobox(boxId, '');
        if (inputEl) {
            setTimeout(() => inputEl.select(), 10);
        }
    }
};

window.toggleMatCombobox = (boxId, event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const root = document.getElementById(boxId);
    if (!root) return;
    const dd = document.getElementById(`dropdown-${boxId}`);
    if (!dd) return;

    const isVisible = dd.style.display === 'flex';
    if (isVisible) {
        dd.style.display = 'none';
    } else {
        const inp = root.querySelector('.mat-combobox-input');
        window.openMatCombobox(boxId, inp);
    }
};

window.filterMatCombobox = (boxId, query) => {
    const root = document.getElementById(boxId);
    if (!root) return;
    const list = root.querySelector('.mat-combobox-list');
    if (!list) return;

    const q = (query || '').trim().toLowerCase();
    const options = list.querySelectorAll('.mat-combobox-opt');
    let visibleCount = 0;

    options.forEach(opt => {
        const text = (opt.getAttribute('data-search') || opt.innerText).toLowerCase();
        if (!q || text.includes(q)) {
            opt.style.display = 'flex';
            visibleCount++;
        } else {
            opt.style.display = 'none';
        }
    });

    let noResults = list.querySelector('.mat-no-results');
    if (visibleCount === 0) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.className = 'mat-no-results';
            noResults.style.cssText = 'padding: 12px; text-align: center; color: #64748b; font-size: 0.78rem; font-weight: 600;';
            list.appendChild(noResults);
        }
        noResults.innerText = `No materials matching "${query}"`;
        noResults.style.display = 'block';
    } else if (noResults) {
        noResults.style.display = 'none';
    }
};

window.selectMatComboboxItem = (boxId, id, name, rate) => {
    const root = document.getElementById(boxId);
    if (!root) return;

    const hiddenInp = root.querySelector('input[type="hidden"]');
    const visibleInp = root.querySelector('.mat-combobox-input');
    const displayLabel = id === 'none' ? '-- None (Not Included) --' : `${name} (₹${rate})`;

    if (hiddenInp) hiddenInp.value = id;
    if (visibleInp) {
        visibleInp.value = displayLabel;
        visibleInp.setAttribute('data-selected-id', id);
        visibleInp.setAttribute('data-selected-name', displayLabel);
        visibleInp.title = displayLabel;
    }

    const dd = document.getElementById(`dropdown-${boxId}`);
    if (dd) dd.style.display = 'none';

    // Highlight selected
    root.querySelectorAll('.mat-combobox-opt').forEach(opt => {
        const optId = opt.getAttribute('data-id');
        opt.style.backgroundColor = (optId === id) ? '#e0f2fe' : 'transparent';
    });

    // Dispatch update based on context
    if (boxId.startsWith('qs-mat-root-')) {
        const key = boxId.replace('qs-mat-root-', '');
        if (Store.state.quoteStudio?.materials) {
            Store.state.quoteStudio.materials[key] = id;
        }
    } else if (boxId.startsWith('bar-mat-root-quick-')) {
        const catKey = boxId.replace('bar-mat-root-quick-', '');
        window.updateGrid('mat_' + catKey, id);
    } else if (boxId.startsWith('bar-mat-root-studio-')) {
        const catKey = boxId.replace('bar-mat-root-studio-', '');
        window.updateStudioGrid('mat_' + catKey, id);
    }
};

window.handleMatComboboxKey = (boxId, event) => {
    if (event.key === 'Escape') {
        const dd = document.getElementById(`dropdown-${boxId}`);
        if (dd) dd.style.display = 'none';
        const root = document.getElementById(boxId);
        const inp = root ? root.querySelector('.mat-combobox-input') : null;
        if (inp) {
            inp.value = inp.getAttribute('data-selected-name') || '';
            inp.blur();
        }
    } else if (event.key === 'Enter') {
        event.preventDefault();
        const root = document.getElementById(boxId);
        if (!root) return;
        const visibleOpt = root.querySelector('.mat-combobox-opt[style*="display: flex"], .mat-combobox-opt:not([style*="display: none"])');
        if (visibleOpt) {
            visibleOpt.click();
        }
    }
};

// Global click outside listener
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

        // Close any open combobox dropdowns if clicked outside
        if (!e.target.closest('.mat-combobox-root') && !e.target.closest('.mat-combobox-dropdown')) {
            document.querySelectorAll('.mat-combobox-dropdown').forEach(d => {
                d.style.display = 'none';
            });
            // Reset input values to selected if left uncommitted
            document.querySelectorAll('.mat-combobox-input').forEach(inp => {
                const sel = inp.getAttribute('data-selected-name');
                if (sel && inp.value !== sel) {
                    inp.value = sel;
                }
            });
        }
    });
}"""

assert target_controllers in content, "target_controllers not found in content!"
content = content.replace(target_controllers, replacement_controllers, 1)

# -------------------------------------------------------------
# 2. Step 2 Material Presets (Wizard)
# -------------------------------------------------------------
target_step2_block = """                        <!-- STEP 2: SEARCHABLE MATERIAL PRESETS (Combobox with Top Search Bar & Real-time Filter) -->
                        <div style="background: var(--color-bg-main); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1.15rem 1.35rem;">
                            <div style="margin-bottom: 0.75rem;">
                                <span style="font-size: 0.86rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                                    Step 2: Quotation Material Presets (Searchable)
                                </span>
                                <div style="font-size: 0.76rem; color: var(--color-text-muted); margin-top: 3px;">
                                    Click any preset to browse or search live materials. Includes '-- None (Not Included) --' option.
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 10px;">
                                ${[
                                    { key: 'frame', label: '1. Profile / Frame', cats: ['profile', 'frame'] },
                                    { key: 'pipe', label: '2. Pipe', cats: ['pipe', 'tube'] },
                                    { key: 'panel', label: '3. Panel', cats: ['panel', 'sheet', 'glass'] },
                                    { key: 'hinge', label: '4. Hinges', cats: ['hinges', 'hinge'] },
                                    { key: 'lock', label: '5. Lock & Accessories', cats: ['lock', 'lock & accessories', 'accessories'] },
                                    { key: 'hook', label: '6. Hook & Rubber', cats: ['hook', 'hook & rubber', 'rubber'] },
                                    { key: 'paint', label: '7. Paint', cats: ['paint', 'coating'] }
                                ].map(cfg => {
                                    const items = catalog.filter(m => cfg.cats.includes((m.category || '').toLowerCase()));
                                    const selectedId = mats[cfg.key] || 'none';
                                    const selectedItem = items.find(m => m.id === selectedId);
                                    const selectedName = selectedId === 'none' ? '-- None (Not Included) --' : (selectedItem ? `${selectedItem.name} (₹${selectedItem.rate})` : selectedId);

                                    return `
                                        <div id="qs-mat-root-${cfg.key}" style="position: relative; width: 100%;">
                                            <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${cfg.label}">
                                                ${cfg.label}
                                            </label>
                                            
                                            <!-- Hidden input preserving full compatibility with proceedToQuotationCanvas -->
                                            <input type="hidden" id="qs-mat-${cfg.key}" value="${selectedId}">
                                            
                                            <!-- Dropdown Trigger with Live Selected Text, Search Badge & Chevron -->
                                            <div 
                                                id="qs-mat-trigger-${cfg.key}"
                                                class="glass-input quotation-preset-trigger" 
                                                onclick="window.toggleStudioMatDropdown('${cfg.key}', event)"
                                                tabindex="0"
                                                style="width: 100%; height: 44px; padding: 0 10px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; background: #ffffff !important; border: 1.5px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                                title="${selectedName}"
                                            >
                                                <span id="qs-mat-text-${cfg.key}" style="font-size: 0.83rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${selectedId === 'none' ? '#64748b' : '#0f172a'};">
                                                    ${selectedName}
                                                </span>
                                                <div style="display: flex; align-items: center; gap: 4px; color: #64748b; flex-shrink: 0; margin-left: 4px;">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                </div>
                                            </div>

                                            <!-- Dropdown Panel with Search Bar & Scrollable Catalog -->
                                            <div 
                                                id="qs-mat-dropdown-${cfg.key}" 
                                                style="display: none; position: absolute; top: calc(100% + 4px); left: 0; min-width: 270px; max-height: 300px; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 8px; box-shadow: 0 14px 30px -4px rgba(15,23,42,0.25), 0 4px 12px rgba(15,23,42,0.12); z-index: 100060; flex-direction: column; overflow: hidden;"
                                            >
                                                <!-- Top Search Bar -->
                                                <div style="padding: 8px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 2;" onclick="event.stopPropagation()">
                                                    <div style="position: relative; display: flex; align-items: center;">
                                                        <span style="position: absolute; left: 8px; font-size: 0.8rem; color: #64748b; pointer-events: none;">🔍</span>
                                                        <input 
                                                            type="text" 
                                                            id="qs-mat-search-${cfg.key}" 
                                                            placeholder="Search ${cfg.label.replace(/^\d+\.\s*/, '')}..." 
                                                            oninput="window.filterStudioMatDropdown('${cfg.key}', this.value)" 
                                                            onclick="event.stopPropagation()"
                                                            style="width: 100%; height: 34px; padding: 4px 8px 4px 28px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; font-weight: 600; color: #0f172a !important; background: #ffffff !important; outline: none;"
                                                        >
                                                    </div>
                                                </div>

                                                <!-- Scrollable Options List -->
                                                <div id="qs-mat-list-${cfg.key}" style="overflow-y: auto; max-height: 235px; padding: 4px 0;">
                                                    <!-- Option: None -->
                                                    <div 
                                                        class="mat-dropdown-opt ${selectedId === 'none' ? 'selected' : ''}" 
                                                        data-search="none not included default"
                                                        onclick="window.selectStudioMatPreset('${cfg.key}', 'none', '-- None (Not Included) --', 0)"
                                                        style="padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; background: ${selectedId === 'none' ? '#f0fdf4' : 'transparent'};"
                                                    >
                                                        <div>
                                                            <div style="font-size: 0.82rem; font-weight: 700; color: #64748b;">-- None (Not Included) --</div>
                                                            <div style="font-size: 0.70rem; color: #94a3b8;">Exclude this material from window</div>
                                                        </div>
                                                        <span style="font-size: 0.72rem; font-weight: 700; color: #64748b;">None</span>
                                                    </div>

                                                    <!-- Matching Catalog Options -->
                                                    ${items.map(m => `
                                                        <div 
                                                            class="mat-dropdown-opt ${selectedId === m.id ? 'selected' : ''}" 
                                                            data-search="${(m.name + ' ' + (m.category || '') + ' ' + (m.desc || '')).toLowerCase()}"
                                                            onclick="window.selectStudioMatPreset('${cfg.key}', '${m.id}', '${m.name.replace(/'/g, "\\\\'")}', '${m.rate}')"
                                                            style="padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc; background: ${selectedId === m.id ? '#e0f2fe' : 'transparent'};"
                                                        >
                                                            <div style="overflow: hidden; padding-right: 8px;">
                                                                <div style="font-size: 0.83rem; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.name}</div>
                                                                <div style="font-size: 0.72rem; color: #64748b;">${m.category || ''} • ₹${m.rate}/${m.unit || 'unit'}</div>
                                                            </div>
                                                            <span style="font-size: 0.76rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 2px 7px; border-radius: 4px; flex-shrink: 0;">₹${m.rate}</span>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>"""

replacement_step2_block = """                        <!-- STEP 2: DIRECT-TYPING SEARCHABLE MATERIAL PRESETS -->
                        <div style="background: var(--color-bg-main); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1.15rem 1.35rem;">
                            <div style="margin-bottom: 0.75rem;">
                                <span style="font-size: 0.86rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                                    Step 2: Quotation Material Presets (Direct Search)
                                </span>
                                <div style="font-size: 0.76rem; color: var(--color-text-muted); margin-top: 3px;">
                                    Click any box to type and search materials directly. Includes '-- None (Not Included) --' option.
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 10px;">
                                ${[
                                    { key: 'frame', label: '1. Profile / Frame', cats: ['profile', 'frame'] },
                                    { key: 'pipe', label: '2. Pipe', cats: ['pipe', 'tube'] },
                                    { key: 'panel', label: '3. Panel', cats: ['panel', 'sheet', 'glass'] },
                                    { key: 'hinge', label: '4. Hinges', cats: ['hinges', 'hinge'] },
                                    { key: 'lock', label: '5. Lock & Accessories', cats: ['lock', 'lock & accessories', 'accessories'] },
                                    { key: 'hook', label: '6. Hook & Rubber', cats: ['hook', 'hook & rubber', 'rubber'] },
                                    { key: 'paint', label: '7. Paint', cats: ['paint', 'coating'] }
                                ].map(cfg => {
                                    const items = catalog.filter(m => cfg.cats.includes((m.category || '').toLowerCase()));
                                    const selectedId = mats[cfg.key] || 'none';
                                    const selectedItem = items.find(m => m.id === selectedId);
                                    const selectedName = selectedId === 'none' ? '-- None (Not Included) --' : (selectedItem ? `${selectedItem.name} (₹${selectedItem.rate})` : selectedId);
                                    const boxId = `qs-mat-root-${cfg.key}`;

                                    return `
                                        <div id="${boxId}" class="mat-combobox-root" style="position: relative; width: 100%;">
                                            <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${cfg.label}">
                                                ${cfg.label}
                                            </label>
                                            
                                            <!-- Hidden input preserving full compatibility with proceedToQuotationCanvas -->
                                            <input type="hidden" id="qs-mat-${cfg.key}" value="${selectedId}">
                                            
                                            <!-- The Box Itself IS The Searchable Input! -->
                                            <div style="position: relative; width: 100%; display: flex; align-items: center;">
                                                <input 
                                                    type="text" 
                                                    id="qs-mat-input-${cfg.key}"
                                                    class="glass-input mat-combobox-input"
                                                    value="${selectedName}"
                                                    data-selected-id="${selectedId}"
                                                    data-selected-name="${selectedName}"
                                                    autocomplete="off"
                                                    onfocus="window.openMatCombobox('${boxId}', this)"
                                                    oninput="window.filterMatCombobox('${boxId}', this.value)"
                                                    onkeydown="window.handleMatComboboxKey('${boxId}', event)"
                                                    style="width: 100%; height: 44px; padding: 0 30px 0 10px; font-size: 0.83rem; font-weight: 600; color: #0f172a !important; background: #ffffff !important; border: 1.5px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04); outline: none; text-overflow: ellipsis; cursor: text;"
                                                    title="${selectedName}"
                                                >
                                                <button 
                                                    type="button" 
                                                    onclick="window.toggleMatCombobox('${boxId}', event)"
                                                    style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: transparent; border: none; padding: 6px; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center;"
                                                    tabindex="-1"
                                                    title="Toggle options"
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                </button>
                                            </div>

                                            <!-- Dropdown Options List (Direct options list, NO separate search box!) -->
                                            <div 
                                                id="dropdown-${boxId}" 
                                                class="mat-combobox-dropdown"
                                                style="display: none; position: absolute; top: calc(100% + 4px); left: 0; min-width: 270px; max-height: 280px; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 8px; box-shadow: 0 14px 30px -4px rgba(15,23,42,0.25), 0 4px 12px rgba(15,23,42,0.12); z-index: 100060; flex-direction: column; overflow-y: auto; padding: 4px 0;"
                                            >
                                                <div class="mat-combobox-list">
                                                    <!-- Option: None -->
                                                    <div 
                                                        class="mat-combobox-opt ${selectedId === 'none' ? 'selected' : ''}" 
                                                        data-id="none"
                                                        data-name="-- None (Not Included) --"
                                                        data-rate="0"
                                                        data-search="none not included default"
                                                        onclick="window.selectMatComboboxItem('${boxId}', 'none', '-- None (Not Included) --', 0)"
                                                        style="padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; background: ${selectedId === 'none' ? '#f0fdf4' : 'transparent'};"
                                                    >
                                                        <div>
                                                            <div style="font-size: 0.82rem; font-weight: 700; color: #64748b;">-- None (Not Included) --</div>
                                                            <div style="font-size: 0.70rem; color: #94a3b8;">Exclude this material from window</div>
                                                        </div>
                                                        <span style="font-size: 0.72rem; font-weight: 700; color: #64748b;">None</span>
                                                    </div>

                                                    <!-- Matching Catalog Options -->
                                                    ${items.map(m => `
                                                        <div 
                                                            class="mat-combobox-opt ${selectedId === m.id ? 'selected' : ''}" 
                                                            data-id="${m.id}"
                                                            data-name="${m.name.replace(/"/g, '&quot;')}"
                                                            data-rate="${m.rate}"
                                                            data-search="${(m.name + ' ' + (m.category || '') + ' ' + (m.desc || '')).toLowerCase()}"
                                                            onclick="window.selectMatComboboxItem('${boxId}', '${m.id}', '${m.name.replace(/'/g, "\\\\'")}', '${m.rate}')"
                                                            style="padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc; background: ${selectedId === m.id ? '#e0f2fe' : 'transparent'};"
                                                        >
                                                            <div style="overflow: hidden; padding-right: 8px;">
                                                                <div style="font-size: 0.83rem; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.name}</div>
                                                                <div style="font-size: 0.72rem; color: #64748b;">${m.category || ''} • ₹${m.rate}/${m.unit || 'unit'}</div>
                                                            </div>
                                                            <span style="font-size: 0.76rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 2px 7px; border-radius: 4px; flex-shrink: 0;">₹${m.rate}</span>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>"""

assert target_step2_block in content, "target_step2_block not found in content!"
content = content.replace(target_step2_block, replacement_step2_block, 1)

# -------------------------------------------------------------
# 3. Quick Calculation: renderMatCol direct-typing combobox
# -------------------------------------------------------------
target_quick_renderMatCol = """        // Material Dropdown Builder with '-- None (Not Included) --'
        const renderMatCol = (catKey, label, allowedCats, currentVal) => {
            const query = window.calcMaterialSearchQuery || '';
            const items = catalog.filter(m => {
                const cat = (m.category || '').toLowerCase();
                const matches = allowedCats.some(c => cat === c.toLowerCase() || cat.includes(c.toLowerCase()));
                if (!matches) return false;
                if (!query) return true;
                return (m.name || '').toLowerCase().includes(query) || (m.description || '').toLowerCase().includes(query);
            });

            return `
                <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0;">
                    <label style="font-size: 0.72rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${label}</label>
                    <select class="calc-mat-select" onchange="window.updateGrid('mat_${catKey}', this.value)" style="padding: 6px 4px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.76rem; font-weight: 600; outline: none; width: 100%; text-overflow: ellipsis;">
                        <option value="none" ${currentVal === 'none' ? 'selected' : ''}>-- None (Not Included) --</option>
                        ${items.map(m => `
                            <option value="${m.id}" ${(currentVal === m.id || currentVal === m.name) ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                        `).join('')}
                    </select>
                </div>
            `;
        };"""

replacement_quick_renderMatCol = """        // Material Direct-Typing Search Combobox Builder for Quick Calc
        const renderMatCol = (catKey, label, allowedCats, currentVal) => {
            const items = catalog.filter(m => {
                const cat = (m.category || '').toLowerCase();
                return allowedCats.some(c => cat === c.toLowerCase() || cat.includes(c.toLowerCase()));
            });
            const selItem = items.find(m => m.id === currentVal || m.name === currentVal);
            const displayVal = currentVal === 'none' ? '-- None (Not Included) --' : (selItem ? `${selItem.name} (₹${selItem.rate})` : (currentVal || '-- None (Not Included) --'));
            const boxId = `bar-mat-root-quick-${catKey}`;

            return `
                <div id="${boxId}" class="mat-combobox-root" style="display: flex; flex-direction: column; gap: 4px; min-width: 0; position: relative;">
                    <label style="font-size: 0.72rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${label}">${label}</label>
                    
                    <input type="hidden" id="quick-mat-${catKey}" value="${currentVal}">
                    
                    <div style="position: relative; width: 100%; display: flex; align-items: center;">
                        <input 
                            type="text" 
                            id="bar-mat-input-quick-${catKey}"
                            class="mat-combobox-input"
                            value="${displayVal}"
                            data-selected-id="${currentVal}"
                            data-selected-name="${displayVal}"
                            autocomplete="off"
                            onfocus="window.openMatCombobox('${boxId}', this)"
                            oninput="window.filterMatCombobox('${boxId}', this.value)"
                            onkeydown="window.handleMatComboboxKey('${boxId}', event)"
                            style="width: 100%; height: 32px; padding: 4px 22px 4px 6px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.76rem; font-weight: 600; outline: none; text-overflow: ellipsis; box-sizing: border-box; cursor: text;"
                            title="${displayVal}"
                        >
                        <button 
                            type="button"
                            onclick="window.toggleMatCombobox('${boxId}', event)"
                            style="position: absolute; right: 2px; top: 50%; transform: translateY(-50%); background: transparent; border: none; padding: 3px; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center;"
                            tabindex="-1"
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    </div>

                    <!-- Dropdown Options List -->
                    <div 
                        id="dropdown-${boxId}"
                        class="mat-combobox-dropdown"
                        style="display: none; position: absolute; top: calc(100% + 4px); left: 0; min-width: 250px; max-height: 260px; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; box-shadow: 0 12px 28px rgba(15,23,42,0.22); z-index: 100060; flex-direction: column; overflow-y: auto; padding: 4px 0;"
                    >
                        <div class="mat-combobox-list">
                            <!-- Option: None -->
                            <div 
                                class="mat-combobox-opt ${currentVal === 'none' ? 'selected' : ''}" 
                                data-id="none"
                                data-name="-- None (Not Included) --"
                                data-rate="0"
                                data-search="none not included default"
                                onclick="window.selectMatComboboxItem('${boxId}', 'none', '-- None (Not Included) --', 0)"
                                style="padding: 7px 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; background: ${currentVal === 'none' ? '#f0fdf4' : 'transparent'};"
                            >
                                <div>
                                    <div style="font-size: 0.78rem; font-weight: 700; color: #64748b;">-- None (Not Included) --</div>
                                </div>
                                <span style="font-size: 0.70rem; font-weight: 700; color: #64748b;">None</span>
                            </div>

                            <!-- Options from catalog -->
                            ${items.map(m => `
                                <div 
                                    class="mat-combobox-opt ${(currentVal === m.id || currentVal === m.name) ? 'selected' : ''}" 
                                    data-id="${m.id}"
                                    data-name="${m.name.replace(/"/g, '&quot;')}"
                                    data-rate="${m.rate}"
                                    data-search="${(m.name + ' ' + (m.category || '')).toLowerCase()}"
                                    onclick="window.selectMatComboboxItem('${boxId}', '${m.id}', '${m.name.replace(/'/g, "\\\\'")}', '${m.rate}')"
                                    style="padding: 7px 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc; background: ${(currentVal === m.id || currentVal === m.name) ? '#e0f2fe' : 'transparent'};"
                                >
                                    <div style="overflow: hidden; padding-right: 6px;">
                                        <div style="font-size: 0.78rem; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.name}</div>
                                        <div style="font-size: 0.68rem; color: #64748b;">${m.category || ''} • ₹${m.rate}</div>
                                    </div>
                                    <span style="font-size: 0.72rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; flex-shrink: 0;">₹${m.rate}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        };"""

assert target_quick_renderMatCol in content, "target_quick_renderMatCol not found in content!"
content = content.replace(target_quick_renderMatCol, replacement_quick_renderMatCol, 1)

# -------------------------------------------------------------
# 4. Quotation Studio Canvas: renderStudioMatCol direct-typing combobox
# -------------------------------------------------------------
target_studio_renderMatCol = """    const renderStudioMatCol = (catKey, label, allowedCats, currentVal) => {
        const query = window.studioMaterialSearchQuery || window.calcMaterialSearchQuery || '';
        const items = catalog.filter(m => {
            const cat = (m.category || '').toLowerCase();
            const matches = allowedCats.some(c => cat === c.toLowerCase() || cat.includes(c.toLowerCase()));
            if (!matches) return false;
            if (!query) return true;
            return (m.name || '').toLowerCase().includes(query) || (m.description || '').toLowerCase().includes(query);
        });

        return `
            <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0;">
                <label style="font-size: 0.72rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${label}">${label}</label>
                <select class="calc-mat-select" onchange="window.updateStudioGrid('mat_${catKey}', this.value)" style="padding: 6px 4px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.76rem; font-weight: 600; outline: none; width: 100%; text-overflow: ellipsis;">
                    <option value="none" ${currentVal === 'none' ? 'selected' : ''}>-- None (Not Included) --</option>
                    ${items.map(m => `
                        <option value="${m.id}" ${(currentVal === m.id || currentVal === m.name) ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                    `).join('')}
                </select>
            </div>
        `;
    };"""

replacement_studio_renderMatCol = """    // Material Direct-Typing Search Combobox Builder for Quotation Studio Canvas
    const renderStudioMatCol = (catKey, label, allowedCats, currentVal) => {
        const items = catalog.filter(m => {
            const cat = (m.category || '').toLowerCase();
            return allowedCats.some(c => cat === c.toLowerCase() || cat.includes(c.toLowerCase()));
        });
        const selItem = items.find(m => m.id === currentVal || m.name === currentVal);
        const displayVal = currentVal === 'none' ? '-- None (Not Included) --' : (selItem ? `${selItem.name} (₹${selItem.rate})` : (currentVal || '-- None (Not Included) --'));
        const boxId = `bar-mat-root-studio-${catKey}`;

        return `
            <div id="${boxId}" class="mat-combobox-root" style="display: flex; flex-direction: column; gap: 4px; min-width: 0; position: relative;">
                <label style="font-size: 0.72rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${label}">${label}</label>
                
                <input type="hidden" id="studio-mat-${catKey}" value="${currentVal}">
                
                <div style="position: relative; width: 100%; display: flex; align-items: center;">
                    <input 
                        type="text" 
                        id="bar-mat-input-studio-${catKey}"
                        class="mat-combobox-input"
                        value="${displayVal}"
                        data-selected-id="${currentVal}"
                        data-selected-name="${displayVal}"
                        autocomplete="off"
                        onfocus="window.openMatCombobox('${boxId}', this)"
                        oninput="window.filterMatCombobox('${boxId}', this.value)"
                        onkeydown="window.handleMatComboboxKey('${boxId}', event)"
                        style="width: 100%; height: 32px; padding: 4px 22px 4px 6px; border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 5px; font-size: 0.76rem; font-weight: 600; outline: none; text-overflow: ellipsis; box-sizing: border-box; cursor: text;"
                        title="${displayVal}"
                    >
                    <button 
                        type="button"
                        onclick="window.toggleMatCombobox('${boxId}', event)"
                        style="position: absolute; right: 2px; top: 50%; transform: translateY(-50%); background: transparent; border: none; padding: 3px; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center;"
                        tabindex="-1"
                    >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                </div>

                <!-- Dropdown Options List -->
                <div 
                    id="dropdown-${boxId}"
                    class="mat-combobox-dropdown"
                    style="display: none; position: absolute; top: calc(100% + 4px); left: 0; min-width: 250px; max-height: 260px; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; box-shadow: 0 12px 28px rgba(15,23,42,0.22); z-index: 100060; flex-direction: column; overflow-y: auto; padding: 4px 0;"
                >
                    <div class="mat-combobox-list">
                        <!-- Option: None -->
                        <div 
                            class="mat-combobox-opt ${currentVal === 'none' ? 'selected' : ''}" 
                            data-id="none"
                            data-name="-- None (Not Included) --"
                            data-rate="0"
                            data-search="none not included default"
                            onclick="window.selectMatComboboxItem('${boxId}', 'none', '-- None (Not Included) --', 0)"
                            style="padding: 7px 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; background: ${currentVal === 'none' ? '#f0fdf4' : 'transparent'};"
                        >
                            <div>
                                <div style="font-size: 0.78rem; font-weight: 700; color: #64748b;">-- None (Not Included) --</div>
                            </div>
                            <span style="font-size: 0.70rem; font-weight: 700; color: #64748b;">None</span>
                        </div>

                        <!-- Options from catalog -->
                        ${items.map(m => `
                            <div 
                                class="mat-combobox-opt ${(currentVal === m.id || currentVal === m.name) ? 'selected' : ''}" 
                                data-id="${m.id}"
                                data-name="${m.name.replace(/"/g, '&quot;')}"
                                data-rate="${m.rate}"
                                data-search="${(m.name + ' ' + (m.category || '')).toLowerCase()}"
                                onclick="window.selectMatComboboxItem('${boxId}', '${m.id}', '${m.name.replace(/'/g, "\\\\'")}', '${m.rate}')"
                                style="padding: 7px 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc; background: ${(currentVal === m.id || currentVal === m.name) ? '#e0f2fe' : 'transparent'};"
                            >
                                <div style="overflow: hidden; padding-right: 6px;">
                                    <div style="font-size: 0.78rem; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.name}</div>
                                    <div style="font-size: 0.68rem; color: #64748b;">${m.category || ''} • ₹${m.rate}</div>
                                </div>
                                <span style="font-size: 0.72rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; flex-shrink: 0;">₹${m.rate}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    };"""

assert target_studio_renderMatCol in content, "target_studio_renderMatCol not found in content!"
content = content.replace(target_studio_renderMatCol, replacement_studio_renderMatCol, 1)

with open(calc_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Direct-typing searchable comboboxes implemented across Step 2 and Canvas Control Bars!")
