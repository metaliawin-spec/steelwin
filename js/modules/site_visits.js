import { Store } from '../store.js';

// State for active filter and search
window.siteVisitFilter = window.siteVisitFilter || 'all';
window.siteVisitSearch = window.siteVisitSearch || '';

// --- REUSABLE AUTOCOMPLETE & COMBOBOX HELPERS ---
if (!window.initCustomerSearchAutocomplete) {
    window.initCustomerSearchAutocomplete = function ({ nameInputId, phoneInputId, locationInputId, suggestionsId }) {
        const nameInput = document.getElementById(nameInputId);
        const phoneInput = document.getElementById(phoneInputId);
        const locInput = document.getElementById(locationInputId);
        const drop = document.getElementById(suggestionsId);
        if (!nameInput || !drop) return;

        let activeIndex = -1;

        function getCustomers() {
            if (window.UniversalCustomerSearch && typeof window.UniversalCustomerSearch.getAllCustomers === 'function') {
                return window.UniversalCustomerSearch.getAllCustomers();
            }
            const store = window.Store || Store;
            return (store && store.state && store.state.customers) || [];
        }

        function renderList(query = '') {
            const list = getCustomers();
            const q = (query || '').trim().toLowerCase();
            const filtered = q
                ? list.filter(c => {
                    const nameMatch = c.name && c.name.toLowerCase().includes(q);
                    const phoneMatch = (c.mobile && c.mobile.includes(q)) || (c.phone && c.phone.includes(q));
                    const locMatch = (c.address && c.address.toLowerCase().includes(q)) || (c.location && c.location.toLowerCase().includes(q));
                    return nameMatch || phoneMatch || locMatch;
                })
                : list;

            activeIndex = -1;

            if (filtered.length === 0) {
                drop.innerHTML = `
                    <div style="padding: 10px 14px; font-size: 0.8rem; color: #94a3b8; font-style: italic;">
                        No matching existing customer found. You can type any new customer name.
                    </div>
                `;
                drop.style.display = 'block';
                return;
            }

            drop.innerHTML = filtered.slice(0, 30).map((c, idx) => `
                <div class="cust-autocomplete-item" data-idx="${idx}" style="padding: 9px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; transition: background 0.15s ease;">
                    <div style="overflow: hidden; text-overflow: ellipsis; padding-right: 8px;">
                        <div style="font-weight: 600; font-size: 0.86rem; color: #f8fafc;">${c.name}</div>
                        <div style="font-size: 0.73rem; color: #94a3b8; display: flex; gap: 10px; margin-top: 2px;">
                            ${(c.mobile || c.phone) ? `<span>📞 ${c.mobile || c.phone}</span>` : ''}
                            ${(c.address || c.location) ? `<span>📍 ${c.address || c.location}</span>` : ''}
                        </div>
                    </div>
                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(59, 130, 246, 0.18); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.35); flex-shrink: 0;">
                        ${c.source || 'Client'}
                    </span>
                </div>
            `).join('');

            drop.style.display = 'block';

            drop.querySelectorAll('.cust-autocomplete-item').forEach((item, i) => {
                const cust = filtered[i];
                item.addEventListener('mouseenter', () => {
                    item.style.background = 'rgba(59, 130, 246, 0.25)';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = 'transparent';
                });
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    nameInput.value = cust.name;
                    if (phoneInput) phoneInput.value = cust.mobile || cust.phone || '';
                    if (locInput) locInput.value = cust.address || cust.location || '';
                    drop.style.display = 'none';
                });
            });
        }

        nameInput.addEventListener('focus', () => {
            renderList(nameInput.value);
        });

        nameInput.addEventListener('click', () => {
            renderList(nameInput.value);
        });

        nameInput.addEventListener('input', () => {
            renderList(nameInput.value);
        });

        nameInput.addEventListener('blur', () => {
            setTimeout(() => {
                drop.style.display = 'none';
            }, 250);
        });

        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                drop.style.display = 'none';
            }
        });
    };
}

if (!window.initStaffSearchCombobox) {
    window.initStaffSearchCombobox = function ({ inputId, suggestionsId, staffList = [] }) {
        const input = document.getElementById(inputId);
        const drop = document.getElementById(suggestionsId);
        if (!input || !drop) return;

        function renderList(query = '', showAll = false) {
            const q = (query || '').trim().toLowerCase();
            const filtered = (!showAll && q)
                ? staffList.filter(s => (s.name && s.name.toLowerCase().includes(q)) ||
                                        (s.role && s.role.toLowerCase().includes(q)))
                : staffList;

            if (filtered.length === 0) {
                drop.innerHTML = `
                    <div style="padding: 10px 14px; font-size: 0.8rem; color: #94a3b8; font-style: italic;">
                        No staff found matching "${query}"
                    </div>
                `;
                drop.style.display = 'block';
                return;
            }

            drop.innerHTML = filtered.map((s, idx) => {
                const isSelected = input.value.trim().toLowerCase() === s.name.toLowerCase();
                return `
                    <div class="staff-combobox-item" data-idx="${idx}" style="padding: 9px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; transition: background 0.15s ease; ${isSelected ? 'background: rgba(59, 130, 246, 0.18);' : ''}">
                        <div style="font-weight: 600; font-size: 0.86rem; color: #f8fafc;">
                            ${s.name} ${isSelected ? '<span style="color: #60a5fa; font-size: 0.75rem; margin-left: 4px;">✓</span>' : ''}
                        </div>
                        <span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
                            ${s.role || 'Staff'}
                        </span>
                    </div>
                `;
            }).join('');

            drop.style.display = 'block';

            drop.querySelectorAll('.staff-combobox-item').forEach((item, i) => {
                const staff = filtered[i];
                item.addEventListener('mouseenter', () => {
                    item.style.background = 'rgba(59, 130, 246, 0.25)';
                });
                item.addEventListener('mouseleave', () => {
                    const isSelected = input.value.trim().toLowerCase() === staff.name.toLowerCase();
                    item.style.background = isSelected ? 'rgba(59, 130, 246, 0.18)' : 'transparent';
                });
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    input.value = staff.name;
                    drop.style.display = 'none';
                });
            });
        }

        input.addEventListener('focus', () => {
            renderList('', true);
        });

        input.addEventListener('click', () => {
            renderList('', true);
        });

        input.addEventListener('input', () => {
            renderList(input.value, false);
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                drop.style.display = 'none';
            }, 250);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                drop.style.display = 'none';
            }
        });
    };
}

export function renderSiteVisits(state) {
    const container = document.createElement('div');
    container.className = 'site-visits-view animate-fade-in';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '1.5rem';
    container.style.paddingBottom = '3rem';

    const visits = state.siteVisits || [];
    const staffList = state.staff || [];
    const customers = state.customers || [];

    // Filter and search
    const filtered = visits.filter(v => {
        const matchesFilter = window.siteVisitFilter === 'all' || v.status.toLowerCase().replace(/\s+/g, '_') === window.siteVisitFilter;
        const q = (window.siteVisitSearch || '').toLowerCase().trim();
        const matchesSearch = !q || 
            (v.customer && v.customer.toLowerCase().includes(q)) ||
            (v.phone && v.phone.includes(q)) ||
            (v.location && v.location.toLowerCase().includes(q)) ||
            (v.purpose && v.purpose.toLowerCase().includes(q));
        return matchesFilter && matchesSearch;
    });

    const totalCount = visits.length;
    const scheduledCount = visits.filter(v => v.status === 'Scheduled').length;
    const inProgressCount = visits.filter(v => v.status === 'In Progress').length;
    const completedCount = visits.filter(v => v.status === 'Completed').length;

    container.innerHTML = `
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 style="font-size: 1.75rem; margin: 0; display: flex; align-items: center; gap: 0.65rem; color: var(--color-text-heading); font-weight: 700;">
                    <span style="width: 40px; height: 40px; border-radius: 10px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); display: flex; align-items: center; justify-content: center; color: #60a5fa;">
                        <i data-lucide="map-pin" style="width: 22px; height: 22px;"></i>
                    </span>
                    Site Visit Management
                </h1>
                <p style="color: var(--color-text-muted); margin: 6px 0 0; font-size: 0.9rem;">
                    Schedule on-site structural inspections, capture location maps, architectural PDFs, and field staff updates.
                </p>
            </div>

            <button onclick="window.openNewSiteVisitModal()" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; font-size: 0.95rem; font-weight: 600; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">
                <i data-lucide="plus-circle" style="width: 18px; height: 18px;"></i>
                Schedule Site Visit
            </button>
        </div>

        <!-- KPI Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div class="glass-panel visit-kpi-card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: var(--color-bg-surface-glass); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);">
                    <i data-lucide="calendar" style="width: 24px; height: 24px;"></i>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Total Site Visits</span>
                    <div class="visit-kpi-num" style="font-size: 1.6rem; font-weight: 800; color: var(--color-text-heading);">${totalCount}</div>
                </div>
            </div>

            <div class="glass-panel visit-kpi-card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(59, 130, 246, 0.15); display: flex; align-items: center; justify-content: center; color: #60a5fa;">
                    <i data-lucide="clock" style="width: 24px; height: 24px;"></i>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: #93c5fd; text-transform: uppercase; font-weight: 600;">Scheduled Visits</span>
                    <div class="visit-kpi-num" style="font-size: 1.6rem; font-weight: 800; color: #60a5fa;">${scheduledCount}</div>
                </div>
            </div>

            <div class="glass-panel visit-kpi-card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; color: #fbbf24;">
                    <i data-lucide="activity" style="width: 24px; height: 24px;"></i>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: #fde68a; text-transform: uppercase; font-weight: 600;">In Progress</span>
                    <div class="visit-kpi-num" style="font-size: 1.6rem; font-weight: 800; color: #fbbf24;">${inProgressCount}</div>
                </div>
            </div>

            <div class="glass-panel visit-kpi-card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(34, 197, 94, 0.15); display: flex; align-items: center; justify-content: center; color: #4ade80;">
                    <i data-lucide="check-circle" style="width: 24px; height: 24px;"></i>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: #86efac; text-transform: uppercase; font-weight: 600;">Completed</span>
                    <div class="visit-kpi-num" style="font-size: 1.6rem; font-weight: 800; color: #4ade80;">${completedCount}</div>
                </div>
            </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="glass-panel" style="padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <!-- Filter Pills -->
            <div class="visit-filter-bar" style="display: flex; gap: 0.4rem; padding: 4px; border-radius: 8px; border: 1px solid var(--glass-border);">
                ${[
                    { id: 'all', label: 'All Visits' },
                    { id: 'scheduled', label: 'Scheduled' },
                    { id: 'in_progress', label: 'In Progress' },
                    { id: 'completed', label: 'Completed' }
                ].map(f => `
                    <button class="visit-filter-btn ${window.siteVisitFilter === f.id ? 'active' : ''}" onclick="window.setSiteVisitFilter('${f.id}')"
                            style="border: none; border-radius: 6px; padding: 6px 14px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; font-weight: 600; background: ${window.siteVisitFilter === f.id ? 'var(--color-primary)' : 'transparent'}; color: ${window.siteVisitFilter === f.id ? 'white' : 'var(--color-text-muted)'};">
                        ${f.label}
                    </button>
                `).join('')}
            </div>

            <!-- Search input -->
            <div style="position: relative; min-width: 280px;">
                <i data-lucide="search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--color-text-muted);"></i>
                <input type="text" 
                       value="${window.siteVisitSearch || ''}" 
                       placeholder="Search by customer, phone, location..."
                       oninput="window.setSiteVisitSearch(this.value)"
                       class="glass-input" 
                       style="padding-left: 34px; width: 100%; font-size: 0.88rem;">
            </div>
        </div>

        <!-- Site Visits Grid -->
        ${filtered.length === 0 ? `
            <div class="glass-panel" style="padding: 3rem; text-align: center; color: var(--color-text-muted);">
                <i data-lucide="map-pin-off" style="width: 48px; height: 48px; opacity: 0.4; margin-bottom: 1rem;"></i>
                <h3>No Site Visits Found</h3>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Try adjusting your filter or schedule a new site visit using the button above.</p>
            </div>
        ` : `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 1.25rem;">
                ${filtered.map(visit => renderSiteVisitCard(visit)).join('')}
            </div>
        `}
    `;

    return container;
}

function renderSiteVisitCard(visit) {
    const isCompleted = visit.status === 'Completed';
    const isInProgress = visit.status === 'In Progress';

    const statusBg = isCompleted ? 'rgba(34, 197, 94, 0.15)' : isInProgress ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)';
    const statusColor = isCompleted ? '#4ade80' : isInProgress ? '#fbbf24' : '#60a5fa';
    const statusBorder = isCompleted ? 'rgba(34, 197, 94, 0.4)' : isInProgress ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)';

    const files = visit.initialFiles || [];
    const updates = visit.staffUpdates || [];
    const latestUpdate = updates.length > 0 ? updates[0] : null;

    return `
        <div class="glass-panel site-visit-card" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1.25rem; border-radius: 12px; border: 1px solid var(--glass-border); position: relative; overflow: hidden;">
            
            <!-- Top Row: ID, Date, Status -->
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-family: monospace; font-weight: 700; color: var(--color-text-muted); font-size: 0.85rem;">${visit.id}</span>
                        <span style="background: var(--color-bg-surface-glass); border: 1px solid var(--glass-border); padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; color: var(--color-text-main);">
                            <i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i>
                            ${visit.date} ${visit.time ? `• ${visit.time}` : ''}
                        </span>
                    </div>

                    <span style="background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                        <span style="width: 6px; height: 6px; border-radius: 50%; background: ${statusColor};"></span>
                        ${visit.status}
                    </span>
                </div>

                <!-- Customer Title & Location -->
                <h3 style="margin: 0 0 0.4rem; font-size: 1.2rem; color: var(--color-text-heading); font-weight: 700;">
                    ${visit.customer}
                </h3>
                
                <div style="display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.85rem; color: var(--color-text-muted);">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="phone" style="width: 14px; height: 14px; color: #60a5fa;"></i>
                        <a href="tel:${visit.phone}" style="color: #60a5fa; text-decoration: none;">${visit.phone}</a>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="map-pin" style="width: 14px; height: 14px; color: #f87171;"></i>
                        <span>${visit.location}</span>
                    </div>
                </div>

                <!-- Purpose & Notes -->
                <div class="visit-notes-box" style="margin-top: 0.85rem; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--glass-border); font-size: 0.85rem;">
                    <div style="font-weight: 600; color: var(--color-text-heading); margin-bottom: 2px;">
                        ${visit.purpose || 'Site Inspection & Measurement'}
                    </div>
                    ${visit.notes ? `<div style="color: var(--color-text-muted); font-size: 0.8rem;">${visit.notes}</div>` : ''}
                </div>

                <!-- Google Maps Link Button -->
                ${visit.mapsUrl ? `
                    <div style="margin-top: 0.75rem;">
                        <a href="${visit.mapsUrl}" target="_blank" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; font-size: 0.8rem; border-color: rgba(239, 68, 68, 0.4); color: #ef4444; text-decoration: none;">
                            <i data-lucide="navigation" style="width: 14px; height: 14px; color: #ef4444;"></i>
                            Open in Google Maps
                        </a>
                    </div>
                ` : ''}

                <!-- Initial Uploaded Site Files (Photos / PDFs) -->
                ${files.length > 0 ? `
                    <div style="margin-top: 0.85rem;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 0.4rem;">
                            Site Documents & Photos (${files.length})
                        </span>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                            ${files.map(f => `
                                <div onclick="window.previewSiteFile('${f.name}', '${f.type}', '${f.size}')" 
                                     class="visit-file-chip"
                                     style="display: inline-flex; align-items: center; gap: 0.4rem; border: 1px solid var(--glass-border); padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; cursor: pointer; transition: background 0.15s;"
                                     onmouseover="this.style.background='rgba(59, 130, 246, 0.15)'" onmouseout="this.style.background=''">
                                    <i data-lucide="${f.type === 'pdf' ? 'file-text' : 'image'}" style="width: 13px; height: 13px; color: ${f.type === 'pdf' ? '#f87171' : '#60a5fa'};"></i>
                                    <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.name}</span>
                                    <span style="font-size: 0.68rem; color: var(--color-text-muted);">(${f.size || 'PDF'})</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Field Staff Update Box (if staff updated) -->
                ${latestUpdate ? `
                    <div style="margin-top: 1rem; padding: 0.85rem; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                            <span style="font-size: 0.75rem; font-weight: 700; color: #16a34a; display: flex; align-items: center; gap: 0.35rem;">
                                <i data-lucide="check-circle" style="width: 13px; height: 13px;"></i>
                                Staff Completion Update
                            </span>
                            <span style="font-size: 0.7rem; color: var(--color-text-muted);">${latestUpdate.date || 'Recently'}</span>
                        </div>
                        <div style="font-size: 0.82rem; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                            ${latestUpdate.notes}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted);">
                            Updated by: <strong style="color: var(--color-text-main);">${latestUpdate.staff || visit.staff}</strong>
                        </div>

                        ${latestUpdate.files && latestUpdate.files.length > 0 ? `
                            <div style="display: flex; gap: 0.4rem; margin-top: 0.5rem; flex-wrap: wrap;">
                                ${latestUpdate.files.map(uf => `
                                    <div onclick="window.previewSiteFile('${uf.name}', '${uf.type}', '${uf.size}')"
                                         class="visit-file-chip"
                                         style="display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); padding: 3px 6px; border-radius: 4px; font-size: 0.72rem; color: #16a34a; cursor: pointer;">
                                        <i data-lucide="${uf.type === 'video' ? 'video' : uf.type === 'pdf' ? 'file-text' : 'image'}" style="width: 12px; height: 12px;"></i>
                                        <span>${uf.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>

            <!-- Footer: Assigned Staff & Action Button -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 1rem; margin-top: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: white;">
                        ${(visit.staff || 'S').charAt(0)}
                    </div>
                    <div>
                        <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-heading);">${visit.staff || 'Unassigned'}</div>
                        <div style="font-size: 0.7rem; color: var(--color-text-muted);">Field Executive</div>
                    </div>
                </div>

                <!-- Staff Update Action Button -->
                <button onclick="window.openStaffUpdateModal('${visit.id}')" 
                        class="btn btn-secondary" 
                        style="padding: 0.5rem 0.9rem; font-size: 0.82rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; border-color: var(--color-primary); color: var(--color-primary);"
                        title="Upload photos/videos and update visit status">
                    <i data-lucide="upload-cloud" style="width: 15px; height: 15px;"></i>
                    Staff Update
                </button>
            </div>

        </div>
    `;
}

// --- GLOBAL WINDOW HANDLERS FOR SITE VISITS ---

window.setSiteVisitFilter = (filter) => {
    window.siteVisitFilter = filter;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.setSiteVisitSearch = (query) => {
    window.siteVisitSearch = query;
    const store = window.Store || Store;
    if (store) store.notify();
};

// --- MODAL: SCHEDULE NEW SITE VISIT ---
window.openNewSiteVisitModal = () => {
    const store = window.Store || Store;
    const customers = store.state.customers || [];
    const staffList = store.state.staff || [];

    // Session array for uploaded files in the modal
    window.newSiteVisitUploadedFiles = [];

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'new-site-visit-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.8)';
    modal.style.backdropFilter = 'blur(6px)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '1rem';

    modal.innerHTML = `
        <div class="glass-panel visit-modal-content" style="width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto; padding: 2rem; border: 1px solid var(--glass-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl);">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; color: var(--color-text-heading);">
                    <i data-lucide="map-pin" style="color: var(--color-primary);"></i>
                    Schedule New Site Visit
                </h3>
                <button onclick="document.getElementById('new-site-visit-modal').remove()" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer;">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <form onsubmit="window.saveNewSiteVisit(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="position: relative;" id="sv-cust-wrapper">
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                            Customer Name <span style="color: #ef4444;">*</span>
                        </label>
                        <div style="position: relative;">
                            <input type="text" id="sv-cust-name" required placeholder="Type or select customer..." class="glass-input" style="width: 100%; padding-right: 32px;" autocomplete="off">
                            <i data-lucide="chevron-down" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--color-text-muted); pointer-events: none;"></i>
                        </div>
                        <div id="sv-cust-suggestions" class="custom-autocomplete-dropdown" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; max-height: 220px; overflow-y: auto; z-index: 10005;"></div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                            Phone Number <span style="color: #ef4444;">*</span>
                        </label>
                        <input type="text" id="sv-cust-phone" required placeholder="e.g. 9846112233" class="glass-input" style="width: 100%;">
                    </div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                        Site Location / Address <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="text" id="sv-location" required placeholder="e.g. Kozhikode, Kerala" class="glass-input" style="width: 100%;">
                </div>

                <!-- Google Maps Link -->
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600; display: flex; justify-content: space-between;">
                        <span>Google Maps Link</span>
                        <a href="https://maps.google.com" target="_blank" style="font-size: 0.72rem; color: #60a5fa; text-decoration: none;">Open Google Maps to copy link</a>
                    </label>
                    <div style="position: relative;">
                        <i data-lucide="map" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #ef4444;"></i>
                        <input type="url" id="sv-maps-url" placeholder="https://maps.google.com/?q=..." class="glass-input" style="width: 100%; padding-left: 36px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem;">Visit Date *</label>
                        <input type="date" id="sv-date" required value="${new Date().toISOString().split('T')[0]}" class="glass-input" style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem;">Visit Time</label>
                        <input type="time" id="sv-time" value="10:00" class="glass-input" style="width: 100%;">
                    </div>
                    <div style="position: relative;" id="sv-staff-wrapper">
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem;">Assign Staff *</label>
                        <div style="position: relative;">
                            <input type="text" id="sv-staff" required placeholder="Search or select staff..." value="${staffList.length > 0 ? staffList[0].name : ''}" class="glass-input" style="width: 100%; padding-right: 30px; cursor: pointer;" autocomplete="off">
                            <i data-lucide="chevron-down" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--color-text-muted); pointer-events: none;"></i>
                        </div>
                        <div id="sv-staff-suggestions" class="custom-autocomplete-dropdown" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; max-height: 200px; overflow-y: auto; z-index: 10005;"></div>
                    </div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem;">Purpose & Scope</label>
                    <input type="text" id="sv-purpose" placeholder="e.g. Opening measurement, lintel check, structural verification" class="glass-input" style="width: 100%;">
                </div>

                <!-- File Upload Feature: Photos or PDF files -->
                <div style="border: 2px dashed rgba(59, 130, 246, 0.4); border-radius: 8px; padding: 1rem; background: rgba(59, 130, 246, 0.05); text-align: center;">
                    <i data-lucide="file-up" style="width: 28px; height: 28px; color: #60a5fa; margin-bottom: 0.25rem;"></i>
                    <div style="font-size: 0.88rem; font-weight: 600; color: var(--color-text-heading);">Upload Site Photos or Architectural PDFs</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); margin: 2px 0 0.75rem;">Supports JPG, PNG, PDF blueprints (Select multiple files)</div>
                    
                    <input type="file" id="sv-file-input" multiple accept="image/*,application/pdf" style="display: none;" onchange="window.handleNewSiteVisitFileSelect(event)">
                    
                    <button type="button" onclick="document.getElementById('sv-file-input').click()" class="btn btn-secondary" style="padding: 0.45rem 1rem; font-size: 0.82rem; border-color: #3b82f6; color: #60a5fa;">
                        <i data-lucide="paperclip" style="width: 14px; height: 14px;"></i> Choose Files
                    </button>

                    <!-- File preview badges container -->
                    <div id="sv-uploaded-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 0.75rem;">
                        <!-- Dynamically populated -->
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" onclick="document.getElementById('new-site-visit-modal').remove()" class="btn btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" style="padding: 0.6rem 1.5rem; font-weight: 600;">
                        <i data-lucide="check" style="width: 16px; height: 16px;"></i> Schedule Visit
                    </button>
                </div>

            </form>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    window.initCustomerSearchAutocomplete({
        nameInputId: 'sv-cust-name',
        phoneInputId: 'sv-cust-phone',
        locationInputId: 'sv-location',
        suggestionsId: 'sv-cust-suggestions'
    });

    window.initStaffSearchCombobox({
        inputId: 'sv-staff',
        suggestionsId: 'sv-staff-suggestions',
        staffList: staffList
    });
};

window.autoFillSiteVisitCustomer = (custId) => {
    const store = window.Store || Store;
    const c = (store.state.customers || []).find(it => it.id === custId);
    if (c) {
        document.getElementById('sv-cust-name').value = c.name;
        document.getElementById('sv-cust-phone').value = c.mobile || '';
        document.getElementById('sv-location').value = c.address || '';
    }
};

window.handleNewSiteVisitFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(f => {
        const isPdf = f.name.toLowerCase().endsWith('.pdf') || f.type.includes('pdf');
        const fileObj = {
            name: f.name,
            type: isPdf ? 'pdf' : 'image',
            size: (f.size / (1024 * 1024)).toFixed(1) + ' MB'
        };
        window.newSiteVisitUploadedFiles.push(fileObj);
    });
    renderNewSiteVisitUploadedBadges();
};

function renderNewSiteVisitUploadedBadges() {
    const container = document.getElementById('sv-uploaded-list');
    if (!container) return;
    container.innerHTML = window.newSiteVisitUploadedFiles.map((f, i) => `
        <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; color: #93c5fd;">
            <i data-lucide="${f.type === 'pdf' ? 'file-text' : 'image'}" style="width: 12px; height: 12px;"></i>
            <span>${f.name}</span>
            <span style="opacity: 0.7;">(${f.size})</span>
            <button type="button" onclick="window.removeNewSiteVisitFile(${i})" style="background: none; border: none; color: #f87171; cursor: pointer; padding: 0 2px;">&times;</button>
        </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
}

window.removeNewSiteVisitFile = (index) => {
    window.newSiteVisitUploadedFiles.splice(index, 1);
    renderNewSiteVisitUploadedBadges();
};

window.saveNewSiteVisit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const store = window.Store || Store;

    const customer = document.getElementById('sv-cust-name').value.trim();
    const phone = document.getElementById('sv-cust-phone').value.trim();
    const location = document.getElementById('sv-location').value.trim();
    const mapsUrl = document.getElementById('sv-maps-url').value.trim();
    const date = document.getElementById('sv-date').value;
    const time = document.getElementById('sv-time').value;
    const staff = document.getElementById('sv-staff').value;
    const purpose = document.getElementById('sv-purpose').value.trim() || 'Site Inspection & Measurement';

    // Fallback files if user didn't choose any
    const initialFiles = [...window.newSiteVisitUploadedFiles];
    if (initialFiles.length === 0) {
        initialFiles.push({ name: 'site_plan_preliminary.pdf', type: 'pdf', size: '1.5 MB' });
    }

    const newVisit = {
        id: 'SV-' + Math.floor(100 + Math.random() * 900),
        customer,
        phone,
        location,
        mapsUrl,
        date,
        time,
        staff,
        purpose,
        status: 'Scheduled',
        initialFiles,
        staffUpdates: []
    };

    store.addSiteVisit(newVisit);
    document.getElementById('new-site-visit-modal')?.remove();
};

// --- MODAL: STAFF UPDATE FEATURE (Photos/Videos & Status) ---
window.openStaffUpdateModal = (visitId) => {
    const store = window.Store || Store;
    const visit = (store.state.siteVisits || []).find(v => v.id === visitId);
    if (!visit) return alert('Site Visit not found!');

    window.staffUpdateUploadedFiles = [];

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'staff-update-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.85)';
    modal.style.backdropFilter = 'blur(6px)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '1rem';

    modal.innerHTML = `
        <div class="glass-panel visit-modal-content" style="width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; padding: 2rem; border: 1px solid var(--glass-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl);">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <div>
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; color: #16a34a;">
                        <i data-lucide="clipboard-check" style="color: #16a34a;"></i>
                        Staff Field Update — ${visit.customer}
                    </h3>
                    <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--color-text-muted);">
                        Record site inspection completion, upload verified photos/videos, and update status.
                    </p>
                </div>
                <button onclick="document.getElementById('staff-update-modal').remove()" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer;">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <form onsubmit="window.saveStaffVisitUpdate(event, '${visit.id}')" style="display: flex; flex-direction: column; gap: 1rem;">
                
                <div style="background: var(--color-bg-surface-glass); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem; font-size: 0.85rem;">
                    <div style="color: var(--color-text-heading);">Site Location: <strong>${visit.location}</strong></div>
                    <div style="color: var(--color-text-muted); font-size: 0.78rem; margin-top: 2px;">Assigned Field Executive: <strong>${visit.staff}</strong></div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                            Update Visit Status *
                        </label>
                        <select id="staff-update-status" class="glass-input" style="width: 100%;">
                            <option value="Completed" selected>Completed</option>
                            <option value="In Progress">In Progress (Needs Follow-up)</option>
                            <option value="Scheduled">Rescheduled</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                            Field Executive Name *
                        </label>
                        <input type="text" id="staff-update-name" value="${visit.staff || 'Field Staff'}" required class="glass-input" style="width: 100%;">
                    </div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                        Field Measurements & Findings / Notes *
                    </label>
                    <textarea id="staff-update-notes" required rows="3" placeholder="e.g. Verified masonry plumb and window aperture: 120x150cm with 15mm plaster margin. Sill leveled. Site ready for fabrication." class="glass-input" style="width: 100%; resize: vertical;"></textarea>
                </div>

                <!-- Staff Photos/Videos Upload Section with Native Camera Support -->
                <div style="border: 2px dashed rgba(34, 197, 94, 0.4); border-radius: 8px; padding: 1rem; background: rgba(34, 197, 94, 0.05); text-align: center;">
                    <i data-lucide="camera" style="width: 28px; height: 28px; color: #16a34a; margin-bottom: 0.25rem;"></i>
                    <div style="font-size: 0.88rem; font-weight: 600; color: var(--color-text-heading);">Field Verification: Photos & Videos</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); margin: 2px 0 0.75rem;">Capture on-site photos directly with device camera or attach files</div>

                    <!-- Native Camera Capture Input -->
                    <input type="file" id="staff-camera-input" accept="image/*" capture="environment" style="display: none;" onchange="window.handleStaffUpdateFileSelect(event)">
                    <!-- Standard File Browser Input -->
                    <input type="file" id="staff-file-input" multiple accept="image/*,video/*,application/pdf" style="display: none;" onchange="window.handleStaffUpdateFileSelect(event)">

                    <div style="display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap;">
                        <button type="button" onclick="document.getElementById('staff-camera-input').click()" class="btn btn-primary" style="padding: 0.45rem 1rem; font-size: 0.82rem; background: #16a34a; border-color: #16a34a; color: white; display: inline-flex; align-items: center; gap: 5px;">
                            <i data-lucide="camera" style="width: 14px; height: 14px;"></i> Snap Photo (Camera)
                        </button>
                        <button type="button" onclick="document.getElementById('staff-file-input').click()" class="btn btn-secondary" style="padding: 0.45rem 1rem; font-size: 0.82rem; border-color: #22c55e; color: #16a34a; display: inline-flex; align-items: center; gap: 5px;">
                            <i data-lucide="folder-open" style="width: 14px; height: 14px;"></i> Browse Files
                        </button>
                    </div>

                    <div id="staff-update-files-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 0.75rem;">
                        <!-- Dynamically populated with preview thumbnails -->
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" onclick="document.getElementById('staff-update-modal').remove()" class="btn btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" style="padding: 0.6rem 1.5rem; background: #22c55e; border-color: #22c55e; font-weight: 600;">
                        <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i> Submit Staff Update
                    </button>
                </div>

            </form>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.handleStaffUpdateFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(f => {
        const isVideo = f.type.includes('video') || f.name.match(/\.(mp4|mov|avi)$/i);
        const isPdf = f.type.includes('pdf') || f.name.endsWith('.pdf');
        const isImg = f.type.includes('image') || f.name.match(/\.(jpg|jpeg|png|webp)$/i);
        
        let previewUrl = null;
        if (isImg && typeof URL !== 'undefined') {
            previewUrl = URL.createObjectURL(f);
        }

        window.staffUpdateUploadedFiles.push({
            name: f.name,
            type: isVideo ? 'video' : isPdf ? 'pdf' : 'image',
            size: (f.size / (1024 * 1024)).toFixed(1) + ' MB',
            previewUrl: previewUrl || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=200&auto=format&fit=crop'
        });
    });
    renderStaffUpdateUploadedBadges();
};

function renderStaffUpdateUploadedBadges() {
    const container = document.getElementById('staff-update-files-list');
    if (!container) return;
    container.innerHTML = window.staffUpdateUploadedFiles.map((f, i) => `
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; color: #86efac;">
            ${f.previewUrl ? `<img src="${f.previewUrl}" alt="Preview" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover;">` : `<i data-lucide="${f.type === 'video' ? 'video' : f.type === 'pdf' ? 'file-text' : 'image'}" style="width: 14px; height: 14px;"></i>`}
            <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.name}</span>
            <span style="opacity: 0.7;">(${f.size})</span>
            <button type="button" onclick="window.removeStaffUpdateFile(${i})" style="background: none; border: none; color: #f87171; cursor: pointer; padding: 0 2px; font-weight: bold;">&times;</button>
        </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
}

window.removeStaffUpdateFile = (index) => {
    window.staffUpdateUploadedFiles.splice(index, 1);
    renderStaffUpdateUploadedBadges();
};

window.saveStaffVisitUpdate = (e, visitId) => {
    if (e && e.preventDefault) e.preventDefault();
    const store = window.Store || Store;

    const status = document.getElementById('staff-update-status').value;
    const staff = document.getElementById('staff-update-name').value.trim();
    const notes = document.getElementById('staff-update-notes').value.trim();

    const files = [...window.staffUpdateUploadedFiles];
    if (files.length === 0) {
        files.push({ name: 'site_photo_verified.jpg', type: 'image', size: '1.9 MB' });
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const staffUpdate = {
        staff,
        date: dateStr,
        status,
        notes,
        files
    };

    store.addSiteVisitStaffUpdate(visitId, staffUpdate);
    document.getElementById('staff-update-modal')?.remove();
};

// --- PREVIEW FILE MODAL ---
window.previewSiteFile = (fileName, fileType, fileSize) => {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.85)';
    modal.style.backdropFilter = 'blur(6px)';
    modal.style.zIndex = '11000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '1rem';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div class="glass-panel visit-modal-content" style="width: 100%; max-width: 500px; padding: 2rem; border-radius: 12px; text-align: center; border: 1px solid var(--glass-border); box-shadow: var(--shadow-xl);">
            <div style="width: 64px; height: 64px; border-radius: 16px; background: rgba(59, 130, 246, 0.15); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #60a5fa;">
                <i data-lucide="${fileType === 'pdf' ? 'file-text' : fileType === 'video' ? 'video' : 'image'}" style="width: 32px; height: 32px;"></i>
            </div>
            <h3 style="margin: 0 0 0.5rem; color: var(--color-text-heading); font-size: 1.2rem;">${fileName}</h3>
            <p style="color: var(--color-text-muted); font-size: 0.85rem; margin: 0 0 1.5rem;">
                Format: <strong>${fileType.toUpperCase()}</strong> • Size: <strong>${fileSize || 'Standard'}</strong>
            </p>
            <div style="background: var(--color-bg-surface-glass); border: 1px dashed var(--glass-border); border-radius: 8px; padding: 2rem; margin-bottom: 1.5rem; color: var(--color-text-muted); font-size: 0.85rem;">
                ${fileType === 'pdf' ? '📄 Architectural Blueprint / Floor Plan Preview' : fileType === 'video' ? '🎥 Field Site Walkthrough Video Proof' : '📷 High-Resolution Site Inspection Photo'}
            </div>
            <button class="btn btn-primary" onclick="this.closest('.modal-backdrop').remove()" style="padding: 0.6rem 2rem;">
                Close Preview
            </button>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};
