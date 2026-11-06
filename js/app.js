import { Store } from './store.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderCalculation } from './modules/calculation.js';
import { renderQuotations } from './modules/quotations.js';
import { renderOrders } from './modules/orders.js';
import { renderProduction } from './modules/production.js';
import { renderHR } from './modules/hr.js';
import { renderSales } from './modules/sales.js';
import { renderSalesReturn } from './modules/sales_return.js';
import { renderLeads } from './modules/leads.js';
import { renderCustomers } from './modules/customers.js';
import { renderStockManager } from './modules/stock.js';
import { renderSettings } from './modules/settings.js';
import { renderPayments } from './modules/payments.js';
import { renderPurchase } from './modules/purchase.js';
import { renderPurchaseReturn } from './modules/purchase_return.js';
import { renderSiteVisits } from './modules/site_visits.js';
import { renderServiceVisits } from './modules/service_visits.js';
import { renderReportView } from './modules/reports.js';
import { initLeoAssistant } from './modules/leo_ai.js';

// Navigation Configuration - Strict hierarchy for StyloBuild ERP
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'customers', label: 'Customers', icon: 'user-check' },
    { id: 'leads', label: 'Leads', icon: 'users' },
    { id: 'calculation', label: 'Calculations', icon: 'calculator' },
    { id: 'quotations', label: 'Quotations', icon: 'file-text' },
    { id: 'orders', label: 'Orders', icon: 'clipboard-list' },
    { id: 'sales', label: 'Sales', icon: 'shopping-cart' },
    { id: 'sales_return', label: 'Sales Return', icon: 'rotate-ccw' },
    { id: 'purchase', label: 'Purchase', icon: 'shopping-bag' },
    { id: 'purchase_return', label: 'Purchase Return', icon: 'rotate-ccw' },
    { id: 'payments', label: 'Payments', icon: 'credit-card' },
    { id: 'stock_manager', label: 'Inventory', icon: 'package' },
    { id: 'production', label: 'Production', icon: 'hammer' },
    { id: 'site_visit', label: 'Site Visits', icon: 'map-pin' },
    { id: 'service_visit', label: 'Service Visits', icon: 'wrench' },
    { id: 'hr', label: 'HR & Team', icon: 'users' },
    { id: 'reports', label: 'Statement / Reports', icon: 'bar-chart-2' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
];

// --- Global Error Handler ---
window.onerror = function (msg, url, lineNo, columnNo, error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.background = '#ffdddd';
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '20px';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.borderBottom = '1px solid red';
    errorDiv.innerHTML = `<h3>Application Error</h3><p>${msg}</p><p>Line: ${lineNo}</p><p>${error ? error.stack : ''}</p>`;
    document.body.appendChild(errorDiv);
    return false;
};

// --- Simplified Theme System API: Strictly Dark Mode & Light Mode ---
window.getCurrentTheme = function() {
    return (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 
           (typeof localStorage !== 'undefined' && localStorage.getItem('winpro_theme')) || 
           'dark';
};

window.setTheme = function(theme) {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', nextTheme);
    }
    try {
        localStorage.setItem('winpro_theme', nextTheme);
        if (window.Store && window.Store.state && window.Store.state.settings && window.Store.state.settings.preferences) {
            window.Store.state.settings.preferences.theme = nextTheme;
        }
    } catch (e) {}

    // Update UI Toggles & Indicators
    updateThemeElements(nextTheme);
    renderSidebar();
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
};

window.toggleTheme = function() {
    const cur = window.getCurrentTheme();
    const nextTheme = cur === 'dark' ? 'light' : 'dark';
    window.setTheme(nextTheme);
};

function updateThemeElements(theme) {
    const isLight = theme === 'light';
    
    // Status Badge in Top-Right User Profile Dropdown
    const statusBadge = document.getElementById('dropdownThemeStatusBadge');
    if (statusBadge) {
        statusBadge.innerText = isLight ? 'Light Mode' : 'Dark Mode';
    }

    // Segmented Buttons in Top-Right User Profile Dropdown
    const darkBtn = document.getElementById('profileThemeDarkBtn');
    const lightBtn = document.getElementById('profileThemeLightBtn');
    if (darkBtn && lightBtn) {
        if (isLight) {
            lightBtn.classList.add('active');
            darkBtn.classList.remove('active');
        } else {
            darkBtn.classList.add('active');
            lightBtn.classList.remove('active');
        }
    }
}

// Clean Theme Modal (Strictly Dark Mode vs Light Mode)
window.openThemeSelectorModal = function() {
    let existing = document.getElementById('themeSelectorModal');
    if (existing) existing.remove();

    const currentTheme = window.getCurrentTheme();

    const themes = [
        {
            id: 'dark',
            name: 'Dark Mode (Localy Slate)',
            tag: 'Photo 2 Official Balanced Palette',
            badge: 'Dark Mode',
            desc: 'Comfortable dark slate canvas (#0f1219) with periwinkle indigo primary, warm amber milestones, and coral red accents.',
            swatches: ['#0f1219', '#6366f1', '#fdbb3d', '#ff5c6a']
        },
        {
            id: 'light',
            name: 'Light Mode (Architectural Luxury)',
            tag: 'Photo 4 Architectural Palette',
            badge: 'Light Mode',
            desc: 'Crisp porcelain white surfaces (#ffffff) with Deep Ocean Petrol Teal (#184e68) and Warm Sand Greige (#c2b49a).',
            swatches: ['#f5f7fa', '#184e68', '#c2b49a', '#059669']
        }
    ];

    const modalHtml = `
        <div class="theme-modal-backdrop" id="themeSelectorModal" onclick="if(event.target === this) window.closeThemeSelectorModal()">
            <div class="theme-modal-dialog">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                            <div style="width: 36px; height: 36px; border-radius: 9px; background: var(--color-primary-subtle); display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
                                <i data-lucide="palette" style="width: 20px; height: 20px;"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--color-text-heading);">Theme & Appearance</h3>
                                <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--color-text-muted);">Select from modern UI color palettes with high-contrast Dark & Light modes</p>
                            </div>
                        </div>
                    </div>
                    <button type="button" onclick="window.closeThemeSelectorModal()" style="background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 6px;" title="Close">
                        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    ${themes.map(t => {
                        const isSelected = currentTheme === t.id;
                        return `
                            <div class="theme-preset-card ${isSelected ? 'is-active' : ''}" onclick="window.setTheme('${t.id}'); window.closeThemeSelectorModal();">
                                ${isSelected ? `<div class="active-indicator"><i data-lucide="check" style="width: 14px; height: 14px;"></i></div>` : ''}
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                                    <span style="font-size: 0.7rem; font-weight: 700; color: var(--color-primary); background: var(--color-primary-subtle); padding: 1px 7px; border-radius: 9999px; border: 1px solid var(--glass-border);">
                                        ${t.badge}
                                    </span>
                                    <span style="font-size: 0.68rem; color: var(--color-text-subtle);">${t.tag}</span>
                                </div>
                                <div style="font-weight: 700; font-size: 0.98rem; color: var(--color-text-heading);">${t.name}</div>
                                <div style="font-size: 0.74rem; color: var(--color-text-muted); line-height: 1.35;">${t.desc}</div>
                                
                                <div class="theme-swatches-strip">
                                    ${t.swatches.map(hex => `<span class="theme-swatch-circle" style="background: ${hex};" title="${hex}"></span>`).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.65rem;">
                    <button type="button" class="btn btn-primary" onclick="window.closeThemeSelectorModal()" style="padding: 0.5rem 1.4rem; font-size: 0.82rem;">
                        Done
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
};

window.closeThemeSelectorModal = function() {
    const el = document.getElementById('themeSelectorModal');
    if (el) el.remove();
};

async function initApp() {
    try {
        // Initialize Theme Mode
        const initialTheme = window.getCurrentTheme();
        document.documentElement.setAttribute('data-theme', initialTheme);

        renderSidebar();
        Store.subscribe(updateView);
        
        // Listen for direct URL hash routing (e.g. #settings, #quotations)
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '').trim();
            if (hash && Store.state.currentView !== hash) {
                window.navigate(hash);
            }
        });

        // Initialize view based on initial hash or default dashboard
        const initialHash = window.location.hash.replace('#', '').trim();
        if (initialHash) {
            window.navigate(initialHash);
        } else {
            updateView(Store.state); // Initial render
        }

        initLeoAssistant(); // Initialize system-wide Leo AI Assistant
        updateThemeElements(initialTheme);
        setTimeout(() => window.checkOverdueReceivables('login'), 1000);
    } catch (e) {
        console.error('Init Failed:', e);
        document.body.innerHTML = `<div style="padding:2rem; color:red;"><h3>Initialization Failed</h3><p>${e.message}</p><pre>${e.stack}</pre></div>`;
    }
}

function renderSidebar() {
    const navContainer = document.getElementById('main-nav');
    if (!navContainer) return;

    const cur = Store.state.currentView;
    const store = window.Store || Store;
    const activeUser = (typeof store.getActiveUser === 'function') ? store.getActiveUser() : { isSuperAdmin: true, name: 'Shamsudheen V.K.', role: 'Super Administrator' };
    const isSuperAdmin = activeUser.isSuperAdmin !== false;
    const perms = activeUser.permissions || {};

    // Filter nav items strictly by RBAC role permissions
    const visibleItems = navItems.filter(item => {
        if (item.adminOnly && !isSuperAdmin) return false;
        if (isSuperAdmin) return true;
        return store.can(item.id, 'view');
    });

    let html = '';

    // If simulating employee session, display employee identity card in sidebar
    if (!isSuperAdmin) {
        html += `
            <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(56, 189, 248, 0.16)); border: 1px solid var(--color-primary-border); border-radius: 10px; padding: 0.65rem 0.75rem; margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <img src="${activeUser.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}" alt="${activeUser.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--color-primary); flex-shrink: 0;">
                    <div style="min-width: 0; flex: 1;">
                        <div style="font-weight: 700; font-size: 0.8rem; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${activeUser.name}</div>
                        <div style="font-size: 0.68rem; color: var(--color-primary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${activeUser.role}</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.45rem; padding-top: 0.45rem; border-top: 1px solid rgba(255,255,255,0.08);">
                    <span style="font-size: 0.65rem; color: #94a3b8;">${activeUser.department || 'Operations'}</span>
                    <button type="button" onclick="window.switchActiveUser('admin')" style="background: transparent; border: none; color: #ef4444; font-size: 0.66rem; font-weight: 700; cursor: pointer; padding: 0; display: inline-flex; align-items: center; gap: 3px;" title="Exit simulation and return to Admin">
                        <i data-lucide="shield" style="width: 11px; height: 11px;"></i> Return to Admin
                    </button>
                </div>
            </div>
        `;
    }

    visibleItems.forEach(item => {
        let isActive = false;
        if (item.id === 'calculation') {
            isActive = (cur === 'calculation' || cur === 'calc_quick' || cur === 'calc_detailed');
        } else if (item.id === 'reports') {
            isActive = (cur === 'reports' || (cur && cur.startsWith('report_')));
        } else if (item.id === 'settings') {
            isActive = (cur === 'settings' || cur === 'accounts_config');
        } else {
            isActive = (cur === item.id);
        }

        const isViewOnly = !isSuperAdmin && perms[item.id] === 'view';

        html += `
            <button 
                class="nav-item ${isActive ? 'active' : ''}" 
                onclick="window.navigate('${item.id}')"
                style="
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0.62rem 0.85rem; 
                    background: ${isActive ? 'var(--button-primary-bg)' : 'transparent'}; 
                    border: 1px solid ${isActive ? 'var(--color-primary)' : 'transparent'};
                    color: ${isActive ? 'white' : 'var(--color-text-main)'};
                    border-radius: var(--radius-md); 
                    cursor: pointer; 
                    width: 100%; text-align: left;
                    font-weight: ${isActive ? '600' : '500'};
                    font-size: 0.88rem;
                    box-shadow: ${isActive ? 'var(--shadow-sm), 0 2px 8px var(--color-primary-glow)' : 'none'};
                    transition: all var(--transition-fast);
                "
                onmouseover="if(!this.classList.contains('active')) { this.style.background='var(--color-bg-card-hover)'; this.style.color='var(--color-text-heading)'; }"
                onmouseout="if(!this.classList.contains('active')) { this.style.background='transparent'; this.style.color='var(--color-text-main)'; }"
            >
                <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0;">
                    <i data-lucide="${item.icon}" style="width: 17px; height: 17px; color: ${isActive ? 'white' : 'var(--color-primary)'}; flex-shrink: 0;"></i>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.label}</span>
                </div>
                ${isViewOnly ? `
                    <span style="font-size: 0.65rem; color: #fbbf24; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 1px 5px; border-radius: 4px; font-weight: 700;" title="View-Only Permission">
                        👁️ View
                    </span>
                ` : ''}
            </button>
        `;
    });

    navContainer.innerHTML = html;

    // Render Sidebar Footer
    const sidebarFooter = document.getElementById('sidebar-footer') || document.querySelector('#sidebar > div:last-child');
    if (sidebarFooter) {
        sidebarFooter.innerHTML = `
            <div style="font-size: 0.65rem; color: var(--color-text-muted); text-align: center; border-top: 1px solid var(--glass-border); padding-top: 0.6rem;">
                STELLO BUILD BMS v2.8.0
            </div>
        `;
    }

    if (window.lucide) window.lucide.createIcons();
}

window.navigate = (viewId) => {
    let targetView = viewId;
    let targetModule = viewId;
    if (viewId === 'accounts_config') {
        window.currentSettingsTab = 'accounts_config';
        targetView = 'settings';
        targetModule = 'accounts_config';
        if (typeof window.isAccountsConfigUnlocked === 'function' && !window.isAccountsConfigUnlocked()) {
            setTimeout(() => {
                if (typeof window.openAccountsConfigUnlockModal === 'function') {
                    window.openAccountsConfigUnlockModal();
                }
            }, 60);
        }
    } else if (viewId === 'calculation' || viewId === 'calc_detailed' || viewId === 'calc_quick') {
        if (!Store.state.calcTab) Store.state.calcTab = 'manual';
        targetView = 'calculation';
        targetModule = 'calculation';
    } else if (viewId === 'materials' || viewId === 'material_catalog') {
        Store.state.calcTab = 'settings';
        targetView = 'calculation';
        targetModule = 'calculation';
    } else if (['reports', 'report_stock', 'report_orders', 'report_sales', 'report_purchases', 'report_pending_orders'].includes(viewId)) {
        targetModule = 'reports';
    }

    try {
        if (window.location.hash !== '#' + viewId) {
            window.location.hash = viewId;
        }
    } catch (e) {}

    Store.navigate(targetView);
};

// Global Secure Logout Handlers
window.handleAdminLogout = () => {
    window.openSecureLogoutModal();
};

window.checkOverdueReceivables = (triggerSource = 'login') => {
    const store = window.Store || Store;
    if (!store || !store.state) return;
    const activeUser = (typeof store.getActiveUser === 'function') ? store.getActiveUser() : { isSuperAdmin: true };
    if (!activeUser.isSuperAdmin) return; // Only notify Admin

    const sales = store.state.sales || [];
    const todayStr = new Date().toISOString().split('T')[0];

    const overdueList = sales.filter(inv => {
        const hasBalance = (Number(inv.balance) || 0) > 0;
        const isPastDue = inv.dueDate && inv.dueDate < todayStr;
        const isExplicitOverdue = (inv.status || '').toLowerCase() === 'overdue';
        return hasBalance && (isPastDue || isExplicitOverdue);
    });

    if (overdueList.length > 0) {
        window.openOverdueInvoicesModal(overdueList, triggerSource);
    }
};

window.openOverdueInvoicesModal = (overdueList, triggerSource = 'login') => {
    const existing = document.getElementById('overdue-invoices-alert-modal');
    if (existing) existing.remove();

    const totalOverdueBalance = overdueList.reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);
    const modal = document.createElement('div');
    modal.id = 'overdue-invoices-alert-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.88); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center; z-index: 100050; padding: 1.5rem;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 580px; max-width: 95vw; background: #0b111e; border: 1.5px solid rgba(239, 68, 68, 0.5); border-radius: var(--radius-lg, 14px); padding: 1.75rem; box-shadow: 0 25px 70px rgba(0,0,0,0.9); animation: modalSlideUp 0.25s ease-out;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(239, 68, 68, 0.16); border: 1.5px solid rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; color: #ef4444; flex-shrink: 0; box-shadow: 0 0 20px rgba(239, 68, 68, 0.35);">
                        <i data-lucide="alert-octagon" style="width: 26px; height: 26px;"></i>
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <h3 style="margin: 0; font-size: 1.25rem; color: #f8fafc; font-weight: 700;">Overdue Invoices Alert</h3>
                            <span style="font-size: 0.68rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 1px 7px; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">
                                ${triggerSource === 'logout' ? 'Pre-Logout Notice' : 'Admin Login Alert'}
                            </span>
                        </div>
                        <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">
                            Immediate commercial attention required: <strong>${overdueList.length}</strong> invoice(s) have passed payment maturity.
                        </p>
                    </div>
                </div>
                <button type="button" onclick="document.getElementById('overdue-invoices-alert-modal').remove()" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px;" title="Dismiss">
                    <i data-lucide="x" style="width: 18px; height: 18px;"></i>
                </button>
            </div>

            <!-- Overdue Metric Card -->
            <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.08)); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.75rem; color: #fca5a5; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Outstanding Overdue</div>
                    <div style="font-size: 1.6rem; font-weight: 800; color: #ef4444; margin-top: 2px; font-family: monospace;">₹${totalOverdueBalance.toLocaleString('en-IN')}</div>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 0.78rem; color: #cbd5e1; background: rgba(0,0,0,0.3); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
                        ${overdueList.length} Delayed Accounts
                    </span>
                </div>
            </div>

            <!-- Invoices List -->
            <div style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.5rem; padding-right: 4px;">
                ${overdueList.map(inv => `
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(239, 68, 68, 0.2); border-left: 3px solid #ef4444; border-radius: 8px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 700; font-size: 0.88rem; color: #f8fafc;">${inv.customer || 'Customer'}</div>
                            <div style="font-size: 0.74rem; color: #94a3b8; display: flex; gap: 8px; margin-top: 2px; font-family: monospace;">
                                <span style="color: #38bdf8;">${inv.id}</span>
                                <span>•</span>
                                <span style="color: #fca5a5;">Due: ${inv.dueDate || 'Matured'}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; font-size: 0.95rem; color: #f87171; font-family: monospace;">₹${(Number(inv.balance) || 0).toLocaleString('en-IN')}</div>
                            <span style="font-size: 0.65rem; background: rgba(239, 68, 68, 0.15); color: #fca5a5; padding: 1px 6px; border-radius: 4px;">Matured</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Footer Buttons -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('overdue-invoices-alert-modal').remove()" style="padding: 0.55rem 1.25rem; font-size: 0.84rem;">
                    Acknowledge & Close
                </button>
                <button type="button" class="btn btn-primary" onclick="document.getElementById('overdue-invoices-alert-modal').remove(); window.navigate('sales');" style="padding: 0.55rem 1.45rem; font-size: 0.84rem; font-weight: 700; background: linear-gradient(135deg, #0284c7, #2563eb); display: inline-flex; align-items: center; gap: 6px;">
                    <i data-lucide="shopping-cart" style="width: 15px; height: 15px;"></i> View Sales Invoices
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.openSecureLogoutModal = () => {
    const existing = document.getElementById('secure-logout-modal');
    if (existing) existing.remove();

    const user = (window.Store && window.Store.state.user) || Store.state.user || {};
    const store = window.Store || Store;
    const sales = (store && store.state && store.state.sales) || [];
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = sales.filter(inv => (Number(inv.balance) || 0) > 0 && inv.dueDate && inv.dueDate < todayStr).length;

    const modal = document.createElement('div');
    modal.id = 'secure-logout-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px);
        display: flex; align-items: center; justify-content: center; z-index: 100010;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 440px; max-width: 95vw; background: #090e17; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: 0 25px 65px rgba(0,0,0,0.85); text-align: center;">
            <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(239, 68, 68, 0.16); border: 2px solid rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; color: #ef4444; margin: 0 auto 1.25rem; box-shadow: 0 0 25px rgba(239, 68, 68, 0.35);">
                <i data-lucide="shield-alert" style="width: 30px; height: 30px;"></i>
            </div>
            <h3 style="margin: 0 0 0.5rem; font-size: 1.3rem; color: #f8fafc; font-weight: 700;">Confirm Secure Logout</h3>
            <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #94a3b8; line-height: 1.5;">
                You are currently logged in as <strong style="color: #38bdf8;">${user.role || 'Super Administrator'}</strong> (<span style="color: #cbd5e1;">${user.name || 'Shamsudheen V.K.'}</span> • <span style="font-family: monospace; color: #a855f7;">${user.id || 'SB-9901'}</span>).
                <br>Are you sure you want to end your active session and lock the dashboard?
            </p>

            ${overdueCount > 0 ? `
                <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 8px; padding: 0.65rem 0.85rem; margin-bottom: 1.25rem; font-size: 0.78rem; color: #fca5a5; display: flex; align-items: center; gap: 8px; text-align: left;">
                    <i data-lucide="alert-triangle" style="width: 18px; height: 18px; color: #ef4444; flex-shrink: 0;"></i>
                    <span>Notice: <strong>${overdueCount} overdue invoice(s)</strong> remain outstanding. Review before end-of-day logout.</span>
                </div>
            ` : ''}

            <div style="display: flex; gap: 0.75rem; justify-content: center;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('secure-logout-modal').remove()" style="padding: 0.6rem 1.35rem; font-size: 0.85rem;">
                    Cancel
                </button>
                <button type="button" id="confirm-logout-btn" class="btn" onclick="window.confirmSecureLogoutSession()" style="padding: 0.6rem 1.45rem; font-size: 0.85rem; font-weight: 600; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: 1px solid #ef4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); cursor: pointer;">
                    Confirm Logout
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.confirmSecureLogoutSession = () => {
    const modal = document.getElementById('secure-logout-modal');
    if (modal) modal.remove();
    alert('Session securely terminated. User logged out.');
    window.location.reload();
};

window.switchActiveUser = (userId) => {
    const store = window.Store || Store;
    if (typeof store.switchUser === 'function') {
        store.switchUser(userId);
    } else {
        store.state.activeUserId = userId;
        store.notify();
    }
    if (userId === 'admin' || userId === 'SB-9901') {
        setTimeout(() => window.checkOverdueReceivables('login'), 350);
    }
};

function updateView(state) {
    try {
        // Update Sidebar Active State
        renderSidebar();

        const main = document.getElementById('main-view');
        if (!main) return;

        const prevScroll = main.scrollTop;
        let newContent = null;

        const store = window.Store || Store;
        const activeUser = (typeof store.getActiveUser === 'function') ? store.getActiveUser() : { isSuperAdmin: true, name: 'Shamsudheen V.K.', role: 'Super Administrator' };
        const isSuperAdmin = activeUser.isSuperAdmin !== false;
        const perms = activeUser.permissions || {};

        // Resolve module permission key
        let permKey = state.currentView;
        if (['calculation', 'calc_detailed', 'calc_quick', 'materials', 'material_catalog'].includes(permKey)) {
            permKey = 'calculation';
        } else if (['report_stock', 'report_orders', 'report_sales', 'report_purchases', 'report_pending_orders', 'reports'].includes(permKey)) {
            permKey = 'reports';
        } else if (permKey === 'settings' && window.currentSettingsTab === 'accounts_config') {
            permKey = 'accounts_config';
        } else if (permKey === 'sales_return') {
            permKey = perms['sales_return'] ? 'sales_return' : 'sales';
        } else if (permKey === 'purchase_return') {
            permKey = perms['purchase_return'] ? 'purchase_return' : 'purchase';
        }

        const canAccess = isSuperAdmin || store.can(permKey, 'view');

        // If permission is completely denied, show graceful Access Restricted panel
        if (!canAccess) {
            const roleCode = (typeof store.getRoleCode === 'function') ? store.getRoleCode() : 'production';
            let roleExplanation = `The active role <strong style="color: #f8fafc;">${activeUser.name}</strong> (${activeUser.role}) does not have permission to access the <span style="color: var(--color-primary); font-weight: 600;">${permKey}</span> module.`;
            
            if (roleCode === 'accounts' && (permKey === 'settings' || permKey === 'accounts_config')) {
                roleExplanation = `<strong>Accounts & Finance Role Policy:</strong> System settings, accounts configuration, and employee master records are restricted strictly to Super Administrators.`;
            } else if (roleCode === 'sales' && (permKey === 'purchase' || permKey === 'purchase_return' || permKey === 'reports' || permKey === 'settings' || permKey === 'accounts_config')) {
                roleExplanation = `<strong>Sales Team Policy:</strong> Raw material procurement costs, balance sheets, and administrative settings are restricted.`;
            } else if (roleCode === 'production' && (permKey === 'sales' || permKey === 'sales_return' || permKey === 'purchase' || permKey === 'purchase_return' || permKey === 'payments' || permKey === 'customers' || permKey === 'quotations' || permKey === 'settings' || permKey === 'accounts_config')) {
                roleExplanation = `<strong>Staff / Production Policy:</strong> Commercial sales invoices, pricing quotations, and financial statements are restricted from production floor operations.`;
            }

            const deniedDiv = document.createElement('div');
            deniedDiv.className = 'glass-panel animate-fade-in route-guard-restricted';
            deniedDiv.style.cssText = 'padding: 3.5rem 2rem; text-align: center; max-width: 640px; margin: 3rem auto; border: 1.5px solid rgba(239, 68, 68, 0.45); border-radius: 16px; box-shadow: 0 15px 45px rgba(0,0,0,0.6);';
            deniedDiv.innerHTML = `
                <div style="width: 68px; height: 68px; border-radius: 50%; background: rgba(239, 68, 68, 0.16); border: 2px solid rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; color: #ef4444; margin: 0 auto 1.35rem; box-shadow: 0 0 25px rgba(239, 68, 68, 0.35);">
                    <i data-lucide="shield-alert" style="width: 36px; height: 36px;"></i>
                </div>
                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 9999px; padding: 3px 12px; margin-bottom: 0.85rem; font-size: 0.74rem; font-weight: 700; color: #f87171;">
                    <i data-lucide="lock" style="width: 12px; height: 12px;"></i> HTTP 403 • DIRECT ROUTE ACCESS BLOCKED
                </div>
                <h2 style="color: #f8fafc; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Access Restricted</h2>
                <p style="color: #cbd5e1; font-size: 0.94rem; margin-bottom: 1.5rem; line-height: 1.6;">
                    ${roleExplanation}
                </p>
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.75rem; font-size: 0.82rem; color: #94a3b8; text-align: left;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Attempted Route:</span>
                        <code style="color: #ef4444; font-weight: 700;">#/${permKey}</code>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Active Session ID:</span>
                        <code style="color: #38bdf8;">${activeUser.id} (${activeUser.role})</code>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Enforcement Layer:</span>
                        <span style="color: #34d399;">Frontend Route Guard + Server-Side Middleware</span>
                    </div>
                </div>
                <div style="display: flex; justify-content: center; gap: 0.85rem; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="window.navigate('dashboard')" style="padding: 0.6rem 1.35rem; display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="layout-dashboard" style="width: 16px; height: 16px;"></i> My Role Dashboard
                    </button>
                    <button class="btn btn-secondary" onclick="window.navigate('hr')" style="padding: 0.6rem 1.25rem; display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="user-check" style="width: 16px; height: 16px;"></i> My Attendance & HR
                    </button>
                    <button class="btn btn-secondary" onclick="window.switchActiveUser('admin')" style="padding: 0.6rem 1.25rem; display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="shield" style="width: 16px; height: 16px; color: #38bdf8;"></i> Return to Admin
                    </button>
                </div>
            `;
            newContent = deniedDiv;
        } else {
            switch (state.currentView) {
                case 'dashboard':
                    newContent = renderDashboard(state);
                    break;
                case 'calculation':
                case 'calc_detailed':
                case 'calc_quick':
                    if (!state.calcTab) state.calcTab = 'manual';
                    newContent = renderCalculation(state);
                    break;
                case 'materials':
                case 'material_catalog':
                    state.calcTab = 'settings';
                    newContent = renderCalculation(state);
                    break;
                case 'quotations':
                    newContent = renderQuotations(state);
                    break;
                case 'orders':
                    newContent = renderOrders(state);
                    break;
                case 'production':
                    newContent = renderProduction(state);
                    break;
                case 'hr':
                    newContent = renderHR(state);
                    break;
                case 'sales':
                    newContent = renderSales(state);
                    break;
                case 'sales_return':
                    newContent = renderSalesReturn(state);
                    break;
                case 'leads':
                    newContent = renderLeads(state);
                    break;
                case 'site_visit':
                    newContent = renderSiteVisits(state);
                    break;
                case 'service_visit':
                    newContent = renderServiceVisits(state);
                    break;
                case 'customers':
                    newContent = renderCustomers(state);
                    break;
                case 'purchase':
                    newContent = renderPurchase(state);
                    break;
                case 'purchase_return':
                    newContent = renderPurchaseReturn(state);
                    break;
                case 'payments':
                    newContent = renderPayments(state);
                    break;
                case 'stock_manager':
                    newContent = renderStockManager(state);
                    break;
                case 'settings':
                    newContent = renderSettings(state);
                    break;
                case 'accounts_config':
                    window.currentSettingsTab = 'accounts_config';
                    newContent = renderSettings(state);
                    break;
                case 'report_stock':
                    state.currentReportType = 'stock';
                    newContent = renderReportView(state, 'stock');
                    break;
                case 'report_orders':
                    state.currentReportType = 'orders';
                    newContent = renderReportView(state, 'orders');
                    break;
                case 'report_sales':
                    state.currentReportType = 'sales';
                    newContent = renderReportView(state, 'sales');
                    break;
                case 'report_purchases':
                    state.currentReportType = 'purchases';
                    newContent = renderReportView(state, 'purchases');
                    break;
                case 'report_pending_orders':
                    state.currentReportType = 'pending_orders';
                    newContent = renderReportView(state, 'pending_orders');
                    break;
                case 'reports':
                    newContent = renderReportView(state, state.currentReportType || 'sales');
                    break;
                default: {
                    const defDiv = document.createElement('div');
                    defDiv.className = 'glass-panel';
                    defDiv.style.cssText = 'padding: 2rem; text-align: center;';
                    defDiv.innerHTML = `
                        <h2>${state.currentView.charAt(0).toUpperCase() + state.currentView.slice(1)}</h2>
                        <p style="color: var(--color-text-muted); margin-top: 1rem;">Module under construction...</p>
                    `;
                    newContent = defDiv;
                    break;
                }
            }

            // Handle View-Only mode wrapper & styling
            const isViewOnly = !isSuperAdmin && !store.can(permKey, 'update') && !store.can(permKey, 'create') && store.can(permKey, 'view') && permKey !== 'dashboard';
            if (isViewOnly && newContent) {
                // If the returned element is a DOM node, wrap or prepend the View-Only Banner
                const wrapper = document.createElement('div');
                wrapper.className = 'view-only-locked-wrapper animate-fade-in';

                const banner = document.createElement('div');
                banner.className = 'view-only-banner';
                banner.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 36px; height: 36px; border-radius: 9px; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); display: flex; align-items: center; justify-content: center; color: #fbbf24; flex-shrink: 0;">
                            <i data-lucide="eye" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div>
                            <div style="font-weight: 700; font-size: 0.9rem; color: #fef3c7; display: flex; align-items: center; gap: 0.5rem;">
                                <span>View-Only Access Mode</span>
                                <span class="role-badge role-badge-supervisor" style="font-size: 0.65rem;">READ ONLY</span>
                            </div>
                            <div style="font-size: 0.76rem; color: #cbd5e1; line-height: 1.35; margin-top: 2px;">
                                You are signed in as <strong style="color: #fbbf24;">${activeUser.name}</strong> (${activeUser.role}). You have full inspection visibility, but record creation, modification, and deletion are disabled for this role.
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0;">
                        <button type="button" class="btn btn-secondary view-only-exempt" onclick="window.switchActiveUser('admin')" style="font-size: 0.76rem; padding: 0.4rem 0.85rem; border-color: rgba(245, 158, 11, 0.4); color: #fbbf24; background: rgba(245, 158, 11, 0.08);">
                            <i data-lucide="shield" style="width: 13px; height: 13px; margin-right: 4px;"></i> Return to Admin
                        </button>
                    </div>
                `;

                if (newContent instanceof HTMLElement) {
                    newContent.classList.add('view-only-locked');
                    wrapper.appendChild(banner);
                    wrapper.appendChild(newContent);
                    newContent = wrapper;
                }
            }
        }

        if (newContent) {
            main.replaceChildren(newContent);
            main.scrollTop = prevScroll;
        }

        if (window.lucide) window.lucide.createIcons();
    } catch (e) {
        console.error('Render Failed:', e);
        const main = document.getElementById('main-view');
        if (main) main.innerHTML = `<div style="padding:2rem; color:red;"><h3>Render Failed</h3><p>${e.message}</p><pre>${e.stack}</pre></div>`;
    }
}

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal-backdrop');
        if (modals.length > 0) {
            const lastModal = modals[modals.length - 1];
            if (lastModal.id === 'add-stock-modal' && window.closeAddStockModal) {
                window.closeAddStockModal();
                return;
            }
            lastModal.remove();
            return;
        }
        const backBtn = document.querySelector('button[onclick="window.backToQuotations()"]');
        if (backBtn && typeof window.backToQuotations === 'function') {
            window.backToQuotations();
            return;
        }
    }
});

// Start
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

