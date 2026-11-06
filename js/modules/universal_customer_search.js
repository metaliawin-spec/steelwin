import { Store } from '../store.js';

/**
 * Universal Customer Search Bar & Dropdown
 * Reusable across Sales, Purchase, Quotation, Service, and Calculation modules.
 * Queries:
 * 1. Primary Customers Database (Verified Clients)
 * 2. Leads Database (Prospective Clients)
 * 3. Customers generated from Price Calculation / Quotations
 */

// Registry for instance callbacks and state
const ucsInstances = {};

export const UniversalCustomerSearch = {
    instances: ucsInstances,

    /**
     * Compute initials following Image 2 specifications:
     * - "ABDU RAZAQ VENGARA" -> "AV"
     * - "abdu salam" -> "AS"
     * - "9895399322" -> "9"
     * - ".." -> "."
     */
    getInitials(name) {
        if (!name || typeof name !== 'string') return '?';
        const trimmed = name.trim();
        if (!trimmed) return '?';

        // Starts with a number
        if (/^\d/.test(trimmed)) {
            return trimmed.charAt(0);
        }
        // Starts with a special symbol
        if (/^[^\w\s]/.test(trimmed)) {
            return trimmed.charAt(0);
        }

        const parts = trimmed.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return trimmed.slice(0, 2).toUpperCase();
    },

    /**
     * Aggregates customers collectively from:
     * 1. Primary Customers Database
     * 2. Leads Database
     * 3. Price Calculation / Quotation drafts
     */
    getAllCustomers() {
        const store = window.Store || Store;
        if (store && typeof store.getUniversalCustomers === 'function') {
            return store.getUniversalCustomers();
        }

        const list = [];
        const seen = new Set();
        const state = (store && store.state) || {};

        // 1. Primary Customers (Verified Clients)
        (state.customers || []).forEach(c => {
            if (!c || !c.name) return;
            const name = c.name.trim();
            const key = name.toLowerCase();
            seen.add(key);
            list.push({
                id: c.id || `C-${Math.floor(100 + Math.random() * 900)}`,
                name,
                mobile: c.mobile || c.phone || '',
                address: c.address || c.location || '',
                advanceBalance: parseFloat(c.advanceBalance) || 0,
                source: c.source || 'Verified Client',
                sourceType: c.source === 'Price Calculation' ? 'calculation' : 'customer',
                isVerified: c.source !== 'Price Calculation',
                raw: c
            });
        });

        // 2. Leads Database (Prospective Clients)
        (state.leads || []).forEach(l => {
            if (!l || !l.name) return;
            const name = l.name.trim();
            const key = name.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            list.push({
                id: l.id || `L-${Math.floor(100 + Math.random() * 900)}`,
                name,
                mobile: l.phone || l.mobile || '',
                address: l.address || l.location || l.interest || '',
                advanceBalance: 0,
                source: 'Lead',
                sourceType: 'lead',
                isVerified: false,
                raw: l
            });
        });

        // 3. Price Calculation Studio & Drafts
        if (state.calcStudio && state.calcStudio.customerName) {
            const name = state.calcStudio.customerName.trim();
            const key = name.toLowerCase();
            if (name && !seen.has(key)) {
                seen.add(key);
                list.push({
                    id: state.calcStudio.customerId || `CALC-${Math.floor(100 + Math.random() * 900)}`,
                    name,
                    mobile: state.calcStudio.customerPhone || '',
                    address: state.calcStudio.customerLocation || '',
                    advanceBalance: 0,
                    source: 'Price Calculation',
                    sourceType: 'calculation',
                    isVerified: false,
                    raw: state.calcStudio
                });
            }
        }

        if (state.currentQuoteDraft && state.currentQuoteDraft.customer) {
            const name = state.currentQuoteDraft.customer.trim();
            const key = name.toLowerCase();
            if (name && !seen.has(key)) {
                seen.add(key);
                list.push({
                    id: state.currentQuoteDraft.customerId || `DRAFT-${Math.floor(100 + Math.random() * 900)}`,
                    name,
                    mobile: state.currentQuoteDraft.customerPhone || '',
                    address: state.currentQuoteDraft.customerAddress || '',
                    advanceBalance: 0,
                    source: 'Price Calculation',
                    sourceType: 'calculation',
                    isVerified: false,
                    raw: state.currentQuoteDraft
                });
            }
        }

        (state.quotations || []).forEach(q => {
            if (!q || !q.customer) return;
            const name = q.customer.trim();
            const key = name.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                list.push({
                    id: q.customerId || q.id,
                    name,
                    mobile: q.customerPhone || '',
                    address: q.customerAddress || '',
                    advanceBalance: parseFloat(q.advancePayment) || 0,
                    source: 'Price Calculation',
                    sourceType: 'calculation',
                    isVerified: false,
                    raw: q
                });
            }
        });

        return list;
    },

    /**
     * Render HTML string for template-based views
     */
    renderHTML(options = {}) {
        const id = options.id || 'ucs-' + Math.floor(Math.random() * 100000);
        const placeholder = options.placeholder || 'Please select a customer name';
        const label = options.label !== undefined ? options.label : 'Customer Name*';
        const infoTooltip = options.infoTooltip || 'Search verified clients, leads, and price calculation contacts';
        const initialValue = options.value || '';
        const required = !!options.required;
        const inputId = options.inputId || `${id}-input`;

        // Register callback if passed
        if (options.onSelect) {
            ucsInstances[id] = ucsInstances[id] || {};
            ucsInstances[id].onSelect = options.onSelect;
        }
        if (options.onClear) {
            ucsInstances[id] = ucsInstances[id] || {};
            ucsInstances[id].onClear = options.onClear;
        }

        const labelHtml = label ? `
            <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.35rem; font-size: 0.78rem; font-weight: 600;">
                <span style="color: #cbd5e1;">${label}</span>
                ${infoTooltip ? `
                    <span title="${infoTooltip}" style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 14px;
                        height: 14px;
                        border-radius: 50%;
                        background: rgba(56, 189, 248, 0.2);
                        color: #38bdf8;
                        font-size: 0.68rem;
                        font-weight: 700;
                        font-family: sans-serif;
                        cursor: help;
                    ">i</span>
                ` : ''}
            </div>
        ` : '';

        return `
            <div class="ucs-root" id="${id}" style="position: relative; width: 100%; font-family: inherit;">
                ${labelHtml}
                
                <!-- Trigger Input (matching Image 1) -->
                <div class="ucs-trigger" onclick="window.UniversalCustomerSearch.toggle('${id}', event)" tabindex="0" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 0.65rem 0.85rem;
                    border-radius: 8px;
                    cursor: pointer;
                    user-select: none;
                    box-sizing: border-box;
                ">
                    <span class="ucs-selected-text" style="
                        font-size: 0.88rem;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    ">${initialValue || placeholder}</span>

                    <div style="display: flex; align-items: center; gap: 0.4rem; color: #94a3b8; flex-shrink: 0;">
                        <span class="ucs-clear-btn" onclick="window.UniversalCustomerSearch.clear('${id}', event)" style="
                            display: ${initialValue ? 'inline-flex' : 'none'};
                            align-items: center;
                            justify-content: center;
                            font-size: 1.15rem;
                            line-height: 1;
                            padding: 0 4px;
                            cursor: pointer;
                            border-radius: 4px;
                        " title="Clear selection">&times;</span>
                        <svg class="ucs-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s ease;">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>

                <input type="hidden" id="${inputId}" class="ucs-hidden-val" value="${initialValue || ''}" ${required ? 'required' : ''}>

                <!-- Dropdown Menu (matching Image 2) -->
                <div class="ucs-dropdown" style="
                    display: none;
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    width: 100%;
                    min-width: 280px;
                    max-height: 380px;
                    border-radius: 10px;
                    z-index: 100060;
                    flex-direction: column;
                    overflow: hidden;
                    box-sizing: border-box;
                    animation: ucsFadeIn 0.18s ease-out;
                ">
                    <!-- Top Search Bar (Image 2) -->
                    <div class="ucs-search-box-wrap">
                        <input type="text" class="ucs-search-input" placeholder="Search or type new client..." 
                            oninput="window.UniversalCustomerSearch.filter('${id}', this.value)" 
                            onchange="window.UniversalCustomerSearch.syncTypedValue('${id}', this.value)"
                            onblur="window.UniversalCustomerSearch.syncTypedValue('${id}', this.value)"
                            onkeydown="window.UniversalCustomerSearch.handleKeyDown('${id}', event)">
                    </div>

                    <!-- Customer items list -->
                    <div class="ucs-items-list" style="overflow-y: auto; max-height: 290px; padding: 0.4rem;"></div>
                </div>
            </div>
        `;
    },

    /**
     * Register callbacks for an existing or rendered UCS instance
     */
    register(id, callbacks = {}) {
        ucsInstances[id] = ucsInstances[id] || {};
        if (callbacks.onSelect) ucsInstances[id].onSelect = callbacks.onSelect;
        if (callbacks.onClear) ucsInstances[id].onClear = callbacks.onClear;
    },

    /**
     * Elevate stacking context of all parent cards while dropdown is open
     */
    elevateParentHierarchy(root) {
        root.classList.add('is-open');
        root.style.zIndex = '100050';
        let p = root.parentElement;
        while (p && p !== document.body) {
            if (p.classList.contains('glass-panel') || 
                p.classList.contains('glass-form-card') || 
                p.classList.contains('quote-customer-card') ||
                p.classList.contains('calc-customer-card') ||
                p.classList.contains('customer-identity-card') ||
                (p.style && p.style.display === 'grid')) {
                if (!p.dataset.origZIndex) {
                    p.dataset.origZIndex = p.style.zIndex || 'auto';
                }
                p.style.zIndex = '100040';
                p.style.position = 'relative';
            }
            p = p.parentElement;
        }
    },

    /**
     * Reset stacking context elevation when dropdown closes
     */
    resetElevation(root) {
        root.classList.remove('is-open');
        root.style.zIndex = '';
        let p = root.parentElement;
        while (p && p !== document.body) {
            if (p.dataset && p.dataset.origZIndex !== undefined) {
                p.style.zIndex = p.dataset.origZIndex === 'auto' ? '' : p.dataset.origZIndex;
                delete p.dataset.origZIndex;
            }
            p = p.parentElement;
        }
    },

    /**
     * Toggle dropdown visibility
     */
    toggle(id, event) {
        if (event) event.stopPropagation();
        const root = document.getElementById(id);
        if (!root) return;
        const dropdown = root.querySelector('.ucs-dropdown');
        const trigger = root.querySelector('.ucs-trigger');
        const chevron = root.querySelector('.ucs-chevron');
        const searchInput = root.querySelector('.ucs-search-input');

        const isCurrentlyOpen = dropdown && dropdown.style.display === 'flex';

        // Close any other open UCS dropdowns first
        document.querySelectorAll('.ucs-root').forEach(other => {
            if (other.id !== id) {
                const dd = other.querySelector('.ucs-dropdown');
                const ch = other.querySelector('.ucs-chevron');
                const tr = other.querySelector('.ucs-trigger');
                if (dd) dd.style.display = 'none';
                if (ch) ch.style.transform = 'rotate(0deg)';
                if (tr) {
                    tr.style.borderColor = '';
                    tr.style.boxShadow = '';
                }
                this.resetElevation(other);
            }
        });

        if (isCurrentlyOpen) {
            dropdown.style.display = 'none';
            if (chevron) chevron.style.transform = 'rotate(0deg)';
            if (trigger) {
                trigger.style.borderColor = '';
                trigger.style.boxShadow = '';
            }
            this.resetElevation(root);
        } else {
            dropdown.style.display = 'flex';
            if (chevron) chevron.style.transform = 'rotate(180deg)';
            this.elevateParentHierarchy(root);
            this.filter(id, searchInput ? searchInput.value : '');
            if (searchInput) {
                setTimeout(() => {
                    searchInput.focus();
                    searchInput.select();
                }, 30);
            }
        }
    },

    /**
     * Filter customer items in real-time
     */
    filter(id, query = '') {
        const root = document.getElementById(id);
        if (!root) return;
        const itemsList = root.querySelector('.ucs-items-list');
        const hiddenVal = root.querySelector('.ucs-hidden-val');
        const currentVal = hiddenVal ? hiddenVal.value : '';
        if (!itemsList) return;

        const allCustomers = this.getAllCustomers();
        const q = (query || '').trim().toLowerCase();

        const filtered = allCustomers.filter(c => {
            if (!q) return true;
            const nameMatch = String(c.name || '').toLowerCase().includes(q);
            const phoneMatch = String(c.mobile || '').toLowerCase().includes(q);
            const addrMatch = String(c.address || '').toLowerCase().includes(q);
            const idMatch = String(c.id || '').toLowerCase().includes(q);
            const sourceMatch = String(c.source || '').toLowerCase().includes(q);
            return nameMatch || phoneMatch || addrMatch || idMatch || sourceMatch;
        });

        itemsList.innerHTML = '';

        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = `
                padding: 1.25rem 1rem;
                text-align: center;
                color: var(--color-text-muted);
                font-size: 0.85rem;
            `;
            if (q) {
                empty.innerHTML = `
                    <div style="margin-bottom: 0.5rem; color: var(--color-text-muted);">No existing customer found for "<strong>${q}</strong>"</div>
                    <button type="button" class="btn btn-primary" style="padding: 0.4rem 0.85rem; font-size: 0.82rem;" onclick="window.UniversalCustomerSearch.select('${id}', { name: '${q.replace(/'/g, "\\'")}', id: '', mobile: '', address: '', source: 'New Customer' })">
                        + Use "${q}" as New Client
                    </button>
                `;
            } else {
                empty.textContent = 'No matching clients or leads found.';
            }
            itemsList.appendChild(empty);
        } else {
            filtered.forEach(cust => {
                const isSelected = currentVal && cust.name && cust.name.toLowerCase() === currentVal.toLowerCase();
                const row = document.createElement('div');
                row.className = 'ucs-item-row' + (isSelected ? ' is-selected' : '');
                row.dataset.cust = JSON.stringify(cust);

                // Avatar Circle
                const avatar = document.createElement('div');
                avatar.className = 'ucs-avatar';
                avatar.textContent = this.getInitials(cust.name);

                // Details Column
                const details = document.createElement('div');
                details.style.cssText = `
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.15rem;
                `;

                // Top Row: Name + Source Pill
                const topRow = document.createElement('div');
                topRow.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.5rem;
                `;

                const nameText = document.createElement('span');
                nameText.className = 'ucs-item-name';
                nameText.textContent = cust.name;

                const sourcePill = document.createElement('span');
                sourcePill.style.cssText = `
                    font-size: 0.65rem;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 9999px;
                    flex-shrink: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                `;
                if (cust.source === 'Verified Client' || cust.isVerified) {
                    sourcePill.style.background = 'rgba(16, 185, 129, 0.15)';
                    sourcePill.style.color = '#34d399';
                    sourcePill.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                    sourcePill.textContent = 'Verified';
                } else if (cust.source === 'Lead' || cust.sourceType === 'lead') {
                    sourcePill.style.background = 'rgba(245, 158, 11, 0.15)';
                    sourcePill.style.color = '#fbbf24';
                    sourcePill.style.border = '1px solid rgba(245, 158, 11, 0.3)';
                    sourcePill.textContent = 'Lead';
                } else {
                    sourcePill.style.background = 'rgba(168, 85, 247, 0.15)';
                    sourcePill.style.color = '#c084fc';
                    sourcePill.style.border = '1px solid rgba(168, 85, 247, 0.3)';
                    sourcePill.textContent = 'Price Calc';
                }

                topRow.appendChild(nameText);
                topRow.appendChild(sourcePill);

                // Subtitle Row: Phone / Address / Advance
                const subRow = document.createElement('div');
                subRow.className = 'ucs-item-sub';
                subRow.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-size: 0.74rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                `;

                let subHtml = '';
                if (cust.mobile) {
                    subHtml += `<span>&#128222; ${cust.mobile}</span>`;
                }
                if (cust.address) {
                    subHtml += `<span>• ${cust.address}</span>`;
                }
                if (cust.advanceBalance > 0) {
                    subHtml += `<span style="color: #10b981; font-weight: 600;">• Adv: ₹${Number(cust.advanceBalance).toLocaleString('en-IN')}</span>`;
                }
                if (!subHtml) {
                    subHtml = `<span>ID: ${cust.id}</span>`;
                }
                subRow.innerHTML = subHtml;

                details.appendChild(topRow);
                details.appendChild(subRow);

                row.appendChild(avatar);
                row.appendChild(details);

                row.onclick = (e) => {
                    e.stopPropagation();
                    window.UniversalCustomerSearch.select(id, cust);
                };

                itemsList.appendChild(row);
            });
        }

        // Add custom new customer option if search text doesn't exist
        if (q.length > 0 && !filtered.some(f => f.name.toLowerCase() === q)) {
            const addOption = document.createElement('div');
            addOption.className = 'ucs-item-row';
            addOption.style.cssText = `
                display: flex;
                align-items: center;
                gap: 0.6rem;
                padding: 0.65rem 0.85rem;
                margin-top: 4px;
                border-top: 1px solid var(--glass-border);
                border-radius: 6px;
                color: var(--color-primary);
                font-size: 0.84rem;
                font-weight: 600;
                cursor: pointer;
            `;
            addOption.innerHTML = `
                <span style="font-size: 1.1rem; line-height: 1;">+</span>
                <span>Use "<strong>${query.trim()}</strong>" as New Customer</span>
            `;
            addOption.onclick = (e) => {
                e.stopPropagation();
                const store = window.Store || Store;
                const created = store && typeof store.addCustomer === 'function'
                    ? store.addCustomer({ name: query.trim(), source: 'Direct' })
                    : { name: query.trim(), id: `C-${Date.now().toString().slice(-4)}`, source: 'Direct' };
                window.UniversalCustomerSearch.select(id, created);
            };
            itemsList.appendChild(addOption);
        }
    },

    /**
     * Handle keyboard navigation (ArrowDown, ArrowUp, Enter, Escape) in search input
     */
    handleKeyDown(id, event) {
        const root = document.getElementById(id);
        if (!root) return;
        const dropdown = root.querySelector('.ucs-dropdown');
        const itemsList = root.querySelector('.ucs-items-list');

        if (event.key === 'Escape') {
            this.close(id);
            return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!dropdown || dropdown.style.display === 'none') {
                this.open(id);
            }
            if (!itemsList) return;

            const rows = Array.from(itemsList.querySelectorAll('.ucs-item-row'));
            if (rows.length === 0) return;

            event.preventDefault();
            let activeIdx = rows.findIndex(r => r.classList.contains('nav-active'));

            if (event.key === 'ArrowDown') {
                activeIdx = (activeIdx === -1) ? 0 : (activeIdx + 1) % rows.length;
            } else {
                activeIdx = (activeIdx <= 0) ? rows.length - 1 : activeIdx - 1;
            }

            rows.forEach(r => {
                r.classList.remove('nav-active');
                r.style.backgroundColor = 'transparent';
                r.style.outline = 'none';
            });

            const target = rows[activeIdx];
            if (target) {
                target.classList.add('nav-active');
                target.style.backgroundColor = '#dbeafe';
                target.style.outline = '2px solid #0284c7';
                target.style.outlineOffset = '-2px';
                target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            if (itemsList) {
                const activeRow = itemsList.querySelector('.ucs-item-row.nav-active');
                if (activeRow) {
                    activeRow.click();
                    return;
                }
            }
            this.handleEnter(id);
        }
    },

    /**
     * Handle Enter key in search input
     */
    handleEnter(id) {
        const root = document.getElementById(id);
        if (!root) return;
        const searchInput = root.querySelector('.ucs-search-input');
        const val = searchInput ? searchInput.value.trim() : '';
        if (!val) return;

        const firstRow = root.querySelector('.ucs-item-row[data-cust]');
        if (firstRow && firstRow.dataset.cust) {
            try {
                const c = JSON.parse(firstRow.dataset.cust);
                this.select(id, c);
                return;
            } catch(e){}
        }

        const store = window.Store || Store;
        const created = store && typeof store.addCustomer === 'function'
            ? store.addCustomer({ name: val, source: 'Direct' })
            : { name: val, id: `C-${Date.now().toString().slice(-4)}`, source: 'Direct' };
        this.select(id, created);
    },

    /**
     * Sync typed value from search input into hidden input and UI
     */
    syncTypedValue(id, val) {
        const root = document.getElementById(id);
        if (!root) return;
        const hiddenVal = root.querySelector('.ucs-hidden-val');
        const textSpan = root.querySelector('.ucs-selected-text');
        const clearBtn = root.querySelector('.ucs-clear-btn');
        const clean = (val || '').trim();
        if (clean && hiddenVal && !hiddenVal.value) {
            hiddenVal.value = clean;
            if (textSpan) {
                textSpan.textContent = clean;
                textSpan.style.color = 'var(--color-text-main)';
            }
            if (clearBtn) clearBtn.style.display = 'inline-flex';
            hiddenVal.dispatchEvent(new Event('change', { bubbles: true }));
        }
    },

    /**
     * Retrieve current customer name from UCS instance
     */
    getValue(id) {
        const root = document.getElementById(id);
        if (!root) return '';
        const hiddenVal = root.querySelector('.ucs-hidden-val');
        if (hiddenVal && hiddenVal.value && hiddenVal.value.trim()) return hiddenVal.value.trim();
        const searchInput = root.querySelector('.ucs-search-input');
        if (searchInput && searchInput.value && searchInput.value.trim()) return searchInput.value.trim();
        const textSpan = root.querySelector('.ucs-selected-text');
        if (textSpan && textSpan.textContent && textSpan.textContent !== 'Please select a customer name' && textSpan.textContent.trim()) {
            return textSpan.textContent.trim();
        }
        return '';
    },

    /**
     * Select a customer
     */
    select(id, cust) {
        const root = document.getElementById(id);
        if (!root) return;
        const textSpan = root.querySelector('.ucs-selected-text');
        const hiddenVal = root.querySelector('.ucs-hidden-val');
        const clearBtn = root.querySelector('.ucs-clear-btn');
        const dropdown = root.querySelector('.ucs-dropdown');
        const trigger = root.querySelector('.ucs-trigger');
        const chevron = root.querySelector('.ucs-chevron');

        if (textSpan) {
            textSpan.textContent = cust.name;
            textSpan.style.color = 'var(--color-text-main)';
        }
        if (hiddenVal) {
            hiddenVal.value = cust.name;
            hiddenVal.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (clearBtn) clearBtn.style.display = 'inline-flex';

        if (dropdown) dropdown.style.display = 'none';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        if (trigger) {
            trigger.style.borderColor = '';
            trigger.style.boxShadow = '';
        }

        this.resetElevation(root);

        // Invoke registered callback
        if (ucsInstances[id] && typeof ucsInstances[id].onSelect === 'function') {
            ucsInstances[id].onSelect(cust);
        }
    },

    /**
     * Clear current selection
     */
    clear(id, event) {
        if (event) event.stopPropagation();
        const root = document.getElementById(id);
        if (!root) return;
        const textSpan = root.querySelector('.ucs-selected-text');
        const hiddenVal = root.querySelector('.ucs-hidden-val');
        const clearBtn = root.querySelector('.ucs-clear-btn');
        const searchInput = root.querySelector('.ucs-search-input');
        const dropdown = root.querySelector('.ucs-dropdown');
        const chevron = root.querySelector('.ucs-chevron');
        const trigger = root.querySelector('.ucs-trigger');

        if (textSpan) {
            textSpan.textContent = 'Please select a customer name';
            textSpan.style.color = 'var(--color-text-muted)';
        }
        if (hiddenVal) {
            hiddenVal.value = '';
            hiddenVal.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (clearBtn) clearBtn.style.display = 'none';
        if (searchInput) searchInput.value = '';
        if (dropdown) dropdown.style.display = 'none';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        if (trigger) {
            trigger.style.borderColor = '';
            trigger.style.boxShadow = '';
        }

        this.resetElevation(root);

        if (ucsInstances[id] && typeof ucsInstances[id].onClear === 'function') {
            ucsInstances[id].onClear();
        }
    },

    /**
     * Set value programmatically
     */
    setValue(id, customerName) {
        const all = this.getAllCustomers();
        const found = all.find(c => c.name.toLowerCase() === String(customerName).trim().toLowerCase());
        if (found) {
            this.select(id, found);
        } else if (customerName) {
            this.select(id, { name: customerName, id: '', mobile: '', address: '', advanceBalance: 0, source: 'Selected' });
        } else {
            this.clear(id);
        }
    },

    /**
     * Create interactive DOM Element
     */
    create(options = {}) {
        const temp = document.createElement('div');
        temp.innerHTML = this.renderHTML(options);
        const comp = temp.firstElementChild;
        return comp;
    },

    /**
     * Mount inside a container element
     */
    mount(targetElement, options = {}) {
        if (!targetElement) return null;
        targetElement.innerHTML = '';
        const comp = this.create(options);
        targetElement.appendChild(comp);
        return comp;
    }
};

// Global click outside listener
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.ucs-root').forEach(root => {
            if (!root.contains(e.target)) {
                const dropdown = root.querySelector('.ucs-dropdown');
                const chevron = root.querySelector('.ucs-chevron');
                const trigger = root.querySelector('.ucs-trigger');
                if (dropdown && dropdown.style.display !== 'none') {
                    dropdown.style.display = 'none';
                    if (chevron) chevron.style.transform = 'rotate(0deg)';
                    if (trigger) {
                        trigger.style.borderColor = '';
                        trigger.style.boxShadow = '';
                    }
                    if (window.UniversalCustomerSearch) {
                        window.UniversalCustomerSearch.resetElevation(root);
                    }
                }
            }
        });
    });
}

// Global exposure
window.UniversalCustomerSearch = UniversalCustomerSearch;
