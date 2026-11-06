import os

with open('js/modules/calculation.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace Combobox Methods
start_marker = '// Unified Direct-Typing Searchable Combobox System'
end_marker = '// Global click outside listener'

idx1 = content.find(start_marker)
idx2 = content.find(end_marker)

if idx1 == -1 or idx2 == -1:
    print(f"ERROR: markers not found: idx1={idx1}, idx2={idx2}")
    exit(1)

combobox_methods = '''// Unified Direct-Typing Searchable Combobox System
const escapeHtmlAttr = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

// Prefix match helper: strictly matches query from start of name/ID
window.matMatchesPrefix = (query, name, id) => {
    if (!query) return true;
    const norm = s => (s || '').toLowerCase().trim();
    // Compact: normalize * and × to x, remove spaces, quotes, hyphens, underscores
    const compact = s => norm(s).replace(/[*×]/g, 'x').replace(/[\\s\\-_"']/g, '');

    const qRaw = norm(query);
    const qComp = compact(query);
    if (!qComp && !qRaw) return true;

    const nRaw = norm(name);
    const nComp = compact(name);
    const idRaw = norm(id);
    const idComp = compact(id);

    // 1. Raw startsWith check on name or ID
    if (nRaw.startsWith(qRaw) || idRaw.startsWith(qRaw)) return true;

    // 2. Compact startsWith check on name or ID (e.g. "4*2.5" matches "4x2.5", "1x1" matches '1" x 1"')
    if (qComp && (nComp.startsWith(qComp) || idComp.startsWith(qComp))) return true;

    return false;
};

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

    const options = list.querySelectorAll('.mat-combobox-opt');
    let visibleCount = 0;

    options.forEach(opt => {
        const id = opt.getAttribute('data-id') || '';
        const name = opt.getAttribute('data-name') || '';

        if (!query || window.matMatchesPrefix(query, name, id)) {
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

window.selectMatComboboxOption = (optEl, boxId) => {
    if (!optEl) return;
    const id = optEl.getAttribute('data-id') || '';
    const name = optEl.getAttribute('data-name') || '';
    const rate = optEl.getAttribute('data-rate') || 0;
    window.selectMatComboboxItem(boxId, id, name, rate);
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

'''

content = content[:idx1] + combobox_methods + content[idx2:]
print("Replaced combobox methods successfully.")

# 2. Replace Quick Calc renderMatCol
quick_start_marker = '// Material Direct-Typing Search Combobox Builder for Quick Calc'
quick_end_marker = 'const totalWTop = g.cols > 1 ?'

q_idx1 = content.find(quick_start_marker)
q_idx2 = content.find(quick_end_marker)

if q_idx1 == -1 or q_idx2 == -1:
    print(f"ERROR: quick calc markers not found: q_idx1={q_idx1}, q_idx2={q_idx2}")
    exit(1)

new_render_mat_col = '''// Material Direct-Typing Search Combobox Builder for Quick Calc
        const renderMatCol = (catKey, label, allowedCats, currentVal) => {
            const items = catalog.filter(m => {
                const cat = (m.category || '').toLowerCase();
                return allowedCats.some(c => cat === c.toLowerCase() || cat.includes(c.toLowerCase()));
            });
            const selItem = items.find(m => m.id === currentVal || m.name === currentVal);
            const rawDisplayVal = currentVal === 'none' ? '-- None (Not Included) --' : (selItem ? `${selItem.name} (₹${selItem.rate})` : (currentVal || '-- None (Not Included) --'));
            const displayVal = escapeHtmlAttr(rawDisplayVal);
            const boxId = `bar-mat-root-quick-${catKey}`;

            return `
                <div id="${boxId}" class="mat-combobox-root" style="display: flex; flex-direction: column; gap: 4px; min-width: 0; position: relative;">
                    <label style="font-size: 0.72rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtmlAttr(label)}">${label}</label>
                    
                    <input type="hidden" id="quick-mat-${catKey}" value="${escapeHtmlAttr(currentVal)}">
                    
                    <div style="position: relative; width: 100%; display: flex; align-items: center;">
                        <input 
                            type="text" 
                            id="bar-mat-input-quick-${catKey}"
                            class="mat-combobox-input"
                            value="${displayVal}"
                            data-selected-id="${escapeHtmlAttr(currentVal)}"
                            data-selected-name="${displayVal}"
                            autocomplete="off"
                            onclick="this.select(); window.openMatCombobox('${boxId}', this)"
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
                                onclick="window.selectMatComboboxOption(this, '${boxId}')"
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
                                    data-id="${escapeHtmlAttr(m.id)}"
                                    data-name="${escapeHtmlAttr(m.name)}"
                                    data-rate="${m.rate}"
                                    onclick="window.selectMatComboboxOption(this, '${boxId}')"
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
        };

        '''

content = content[:q_idx1] + new_render_mat_col + content[q_idx2:]
print("Replaced Quick Calc renderMatCol successfully.")

# 3. Replace Step 2 wizard comboboxes
step2_start_marker = 'const items = catalog.filter(m => cfg.cats.includes((m.category || \'\').toLowerCase()));'
step2_end_marker = '<!-- Wizard Footer Actions'

s_idx1 = content.find(step2_start_marker)
s_idx2 = content.find(step2_end_marker)

if s_idx1 == -1 or s_idx2 == -1:
    print(f"ERROR: Step 2 markers not found: s_idx1={s_idx1}, s_idx2={s_idx2}")
    exit(1)

# Find the end of the map expression in Step 2: `}).join('')}`
map_end = content.rfind('}).join(\'\')}', s_idx1, s_idx2)
if map_end == -1:
    print("ERROR: map_end not found")
    exit(1)

new_step2_block = '''const items = catalog.filter(m => cfg.cats.includes((m.category || '').toLowerCase()));
                                    const selectedId = mats[cfg.key] || 'none';
                                    const selectedItem = items.find(m => m.id === selectedId);
                                    const rawSelectedName = selectedId === 'none' ? '-- None (Not Included) --' : (selectedItem ? `${selectedItem.name} (₹${selectedItem.rate})` : selectedId);
                                    const selectedName = escapeHtmlAttr(rawSelectedName);
                                    const boxId = `qs-mat-root-${cfg.key}`;

                                    return `
                                        <div id="${boxId}" class="mat-combobox-root" style="position: relative; width: 100%;">
                                            <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtmlAttr(cfg.label)}">
                                                ${cfg.label}
                                            </label>
                                            
                                            <!-- Hidden input preserving full compatibility with proceedToQuotationCanvas -->
                                            <input type="hidden" id="qs-mat-${cfg.key}" value="${escapeHtmlAttr(selectedId)}">
                                            
                                            <!-- The Box Itself IS The Searchable Input! -->
                                            <div style="position: relative; width: 100%; display: flex; align-items: center;">
                                                <input 
                                                    type="text" 
                                                    id="qs-mat-input-${cfg.key}"
                                                    class="glass-input mat-combobox-input"
                                                    value="${selectedName}"
                                                    data-selected-id="${escapeHtmlAttr(selectedId)}"
                                                    data-selected-name="${selectedName}"
                                                    autocomplete="off"
                                                    onclick="this.select(); window.openMatCombobox('${boxId}', this)"
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
                                                        onclick="window.selectMatComboboxOption(this, '${boxId}')"
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
                                                            data-id="${escapeHtmlAttr(m.id)}"
                                                            data-name="${escapeHtmlAttr(m.name)}"
                                                            data-rate="${m.rate}"
                                                            onclick="window.selectMatComboboxOption(this, '${boxId}')"
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
                                '''

content = content[:s_idx1] + new_step2_block + content[map_end:]
print("Replaced Step 2 wizard comboboxes successfully.")

# 4. Replace Studio Canvas renderStudioMatCol
studio_start_marker = '// Material Direct-Typing Search Combobox Builder for Quotation Studio Canvas'

st_idx1 = content.find(studio_start_marker)
st_idx2 = content.find('return `\n        <style>', st_idx1)
if st_idx2 == -1:
    st_idx2 = content.find('return `\r\n        <style>', st_idx1)

if st_idx1 == -1 or st_idx2 == -1:
    print(f"ERROR: studio canvas markers not found: st_idx1={st_idx1}, st_idx2={st_idx2}")
    exit(1)

new_studio_mat_col = '''// Material Direct-Typing Search Combobox Builder for Quotation Studio Canvas
    const renderStudioMatCol = (catKey, label, allowedCats, currentVal) => {
        const items = catalog.filter(m => {
            const cat = (m.category || '').toLowerCase();
            return allowedCats.some(c => cat === c.toLowerCase() || cat.includes(c.toLowerCase()));
        });
        const selItem = items.find(m => m.id === currentVal || m.name === currentVal);
        const rawDisplayVal = currentVal === 'none' ? '-- None (Not Included) --' : (selItem ? `${selItem.name} (₹${selItem.rate})` : (currentVal || '-- None (Not Included) --'));
        const displayVal = escapeHtmlAttr(rawDisplayVal);
        const boxId = `bar-mat-root-studio-${catKey}`;

        return `
            <div id="${boxId}" class="mat-combobox-root" style="display: flex; flex-direction: column; gap: 4px; min-width: 0; position: relative;">
                <label style="font-size: 0.72rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtmlAttr(label)}">${label}</label>
                
                <input type="hidden" id="studio-mat-${catKey}" value="${escapeHtmlAttr(currentVal)}">
                
                <div style="position: relative; width: 100%; display: flex; align-items: center;">
                    <input 
                        type="text" 
                        id="bar-mat-input-studio-${catKey}"
                        class="mat-combobox-input"
                        value="${displayVal}"
                        data-selected-id="${escapeHtmlAttr(currentVal)}"
                        data-selected-name="${displayVal}"
                        autocomplete="off"
                        onclick="this.select(); window.openMatCombobox('${boxId}', this)"
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
                            onclick="window.selectMatComboboxOption(this, '${boxId}')"
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
                                data-id="${escapeHtmlAttr(m.id)}"
                                data-name="${escapeHtmlAttr(m.name)}"
                                data-rate="${m.rate}"
                                onclick="window.selectMatComboboxOption(this, '${boxId}')"
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
    };

    '''

content = content[:st_idx1] + new_studio_mat_col + content[st_idx2:]
print("Replaced Studio Canvas renderStudioMatCol successfully.")

with open('js/modules/calculation.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("ALL PATCHES APPLIED TO calculation.js SUCCESSFULLY.")
