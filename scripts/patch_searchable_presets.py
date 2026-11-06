import os

calc_path = r'c:\Users\anshi\OneDrive\Documents\code\code project\js\modules\calculation.js'

with open(calc_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Material Preset Searchable Dropdown Controllers
target_controllers = """// Global click outside listener for search & customer dropdowns
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
}"""

replacement_controllers = """// Global Material Preset Searchable Select Controllers (Step 2)
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

assert target_controllers in content, "target_controllers not found!"
content = content.replace(target_controllers, replacement_controllers, 1)

# 2. Replace Step 2 Grid with Searchable Material Selects
target_step2_block = """                        <!-- STEP 2: DEFAULT MATERIAL PRESETS WITH INCREASED HEIGHT & CLEAR PADDING -->
                        <div style="background: var(--color-bg-main); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1.15rem 1.35rem;">
                            <div style="margin-bottom: 0.75rem;">
                                <span style="font-size: 0.86rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                                    Step 2: Quotation Material Presets
                                </span>
                                <div style="font-size: 0.76rem; color: var(--color-text-muted); margin-top: 3px;">
                                    Select the default materials for this customer's windows. Every material includes a '-- None (Not Included) --' option.
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
                                <!-- Profile -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">1. Profile / Frame</label>
                                    <select id="qs-mat-frame" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['profile', 'frame'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.frame === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Pipe -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">2. Pipe</label>
                                    <select id="qs-mat-pipe" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['pipe', 'tube'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.pipe === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Panel -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">3. Panel</label>
                                    <select id="qs-mat-panel" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['panel', 'sheet', 'glass'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.panel === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Hinges -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">4. Hinges</label>
                                    <select id="qs-mat-hinge" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['hinges', 'hinge'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.hinge === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Lock & Accessories -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px; white-space: nowrap;">5. Lock & Accessories</label>
                                    <select id="qs-mat-lock" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['lock', 'lock & accessories', 'accessories'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.lock === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Hook & Rubber -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px; white-space: nowrap;">6. Hook & Rubber</label>
                                    <select id="qs-mat-hook" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['hook', 'hook & rubber', 'rubber'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.hook === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Paint -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">7. Paint</label>
                                    <select id="qs-mat-paint" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['paint', 'coating'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.paint === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>"""

replacement_step2_block = """                        <!-- STEP 2: SEARCHABLE MATERIAL PRESETS (Combobox with Top Search Bar & Real-time Filter) -->
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
                                                            placeholder="Search ${cfg.label.replace(/^\\d+\\.\\s*/, '')}..." 
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

assert target_step2_block in content, "target_step2_block not found!"
content = content.replace(target_step2_block, replacement_step2_block, 1)

with open(calc_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Step 2 Material Presets successfully converted to Searchable Comboboxes with Top Search Bar and Filter!")
