import { Store } from '../store.js';

/**
 * ============================================================================
 * UNIFIED REPORT & STATEMENT SYSTEM (GLOBAL FOR ALL REPORTS)
 * ============================================================================
 * Supports:
 * 1. Stock Revenue Report & Inventory Statement
 * 2. Total Orders Report & Production Pipeline
 * 3. Total Sales Report & Invoicing Statement
 * 4. Total Purchases Report & Material Procurement Statement
 * 5. Pending Orders Report & Queue Statement
 *
 * Global Unified Filtering:
 * - Quick Options: Monthly, Quarterly, Annually (Yearly), All Time
 * - Custom Date Range: Calendar UI with 'From Date' and 'To Date' selectors
 * - Search & Status Filters
 * - CSV Export & Clean Print View
 */

// Global Filter State
if (!window.reportFilterState) {
    const today = new Date('2026-10-13');
    const startOfYear = '2026-01-01';
    const endOfYear = '2026-12-31';
    window.reportFilterState = {
        mode: 'annually', // 'monthly', 'quarterly', 'annually', 'custom', 'all'
        fromDate: startOfYear,
        toDate: endOfYear,
        searchQuery: '',
        statusFilter: 'ALL'
    };
}

export function renderReportView(state, defaultReportType = 'sales') {
    const reportType = state.currentReportType || defaultReportType;
    const filter = window.reportFilterState;

    const container = document.createElement('div');
    container.className = 'report-view animate-fade-in';
    container.style.cssText = 'display: flex; flex-direction: column; gap: 1.25rem; width: 100%;';

    // Report Meta Definitions
    const reportMeta = {
        'stock': {
            title: 'Total Stock Revenue & Inventory Statement',
            icon: 'package',
            color: '#22c55e',
            subtitle: 'Valuation of raw materials, manufactured sections, hardware, and safety stock'
        },
        'orders': {
            title: 'Total Orders & Fabrication Statement',
            icon: 'file-text',
            color: '#38bdf8',
            subtitle: 'Production scheduling, fabrication pipeline, and client delivery orders'
        },
        'sales': {
            title: 'Total Sales Revenue & Invoicing Statement',
            icon: 'trending-up',
            color: '#22c55e',
            subtitle: 'Official tax invoices, commercial billings, advance receipts, and customer balances'
        },
        'purchases': {
            title: 'Total Purchases & Vendor Procurement Statement',
            icon: 'shopping-bag',
            color: '#a855f7',
            subtitle: 'Procurement bills, material supply orders, and vendor credit statements'
        },
        'pending_orders': {
            title: 'Pending Deliveries & Work In Progress Statement',
            icon: 'truck',
            color: '#f59e0b',
            subtitle: 'Orders currently undergoing cutting, welding, coating, quality check, or transit'
        }
    }[reportType] || {
        title: 'Enterprise Statement Report',
        icon: 'bar-chart-2',
        color: '#38bdf8',
        subtitle: 'Audited performance records and transactions'
    };

    // Filter Dataset based on active report type and date range
    const dataset = getFilteredDataset(state, reportType, filter);

    container.innerHTML = `
        <!-- Top Navigation & Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.25rem;">
                    <button class="btn btn-secondary" onclick="window.navigate('dashboard')" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 5px;">
                        <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i> Back to Dashboard
                    </button>
                    <span style="color: #64748b;">/</span>
                    <span style="font-size: 0.8rem; color: #94a3b8; font-weight: 500;">Financial & Operations Statements</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.4rem;">
                    <div style="width: 42px; height: 42px; border-radius: 10px; background: ${reportMeta.color}20; display: flex; align-items: center; justify-content: center; color: ${reportMeta.color}; box-shadow: 0 0 15px ${reportMeta.color}30;">
                        <i data-lucide="${reportMeta.icon}" style="width: 22px; height: 22px;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; font-size: 1.5rem; color: var(--color-text-heading); font-weight: 700; letter-spacing: -0.3px;">
                            ${reportMeta.title}
                        </h2>
                        <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--color-text-muted);">
                            ${reportMeta.subtitle}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Report Quick Switcher Tabs -->
            <div class="report-switcher-bar" style="display: flex; align-items: center; gap: 0.4rem; padding: 4px; border-radius: 10px; border: 1px solid var(--glass-border); flex-wrap: wrap;">
                ${renderReportTabButton('stock', 'Stock Revenue', 'package', reportType)}
                ${renderReportTabButton('orders', 'Total Orders', 'file-text', reportType)}
                ${renderReportTabButton('sales', 'Total Sales', 'trending-up', reportType)}
                ${renderReportTabButton('purchases', 'Total Purchases', 'shopping-bag', reportType)}
                ${renderReportTabButton('pending_orders', 'Pending Orders', 'truck', reportType)}
            </div>
        </div>

        <!-- Unified Global Date Filtering System Bar -->
        <div class="glass-panel" style="padding: 1.15rem 1.4rem; border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <!-- Left: Quick Filter Modes -->
                <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                    <span style="font-size: 0.78rem; color: var(--color-text-main); font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                        <i data-lucide="calendar" style="width: 14px; height: 14px; color: #38bdf8;"></i> Unified Period:
                    </span>
                    <button class="btn-filter-pill ${filter.mode === 'monthly' ? 'active' : ''}" onclick="window.setReportFilterMode('monthly')">
                        Monthly
                    </button>
                    <button class="btn-filter-pill ${filter.mode === 'quarterly' ? 'active' : ''}" onclick="window.setReportFilterMode('quarterly')">
                        Quarterly
                    </button>
                    <button class="btn-filter-pill ${filter.mode === 'annually' ? 'active' : ''}" onclick="window.setReportFilterMode('annually')">
                        Annually (Yearly)
                    </button>
                    <button class="btn-filter-pill ${filter.mode === 'all' ? 'active' : ''}" onclick="window.setReportFilterMode('all')">
                        All Records
                    </button>
                </div>

                <!-- Right: Active Period Badge -->
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.74rem; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); padding: 4px 10px; border-radius: 9999px; font-weight: 600;">
                        Showing: ${formatDateRangeLabel(filter)}
                    </span>
                </div>
            </div>

            <!-- Custom Date Range Calendar UI -->
            <div style="display: flex; align-items: center; gap: 0.85rem; padding-top: 0.85rem; border-top: 1px solid var(--glass-border); flex-wrap: wrap;">
                <span style="font-size: 0.76rem; color: var(--color-text-muted); font-weight: 500;">Custom Date Range:</span>
                
                <div style="display: flex; align-items: center; gap: 0.45rem;">
                    <label for="report-filter-from" style="font-size: 0.74rem; color: var(--color-text-main);">From Date:</label>
                    <input type="date" id="report-filter-from" value="${filter.fromDate}" class="glass-input" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; width: 140px; border-radius: 6px;">
                </div>

                <div style="display: flex; align-items: center; gap: 0.45rem;">
                    <label for="report-filter-to" style="font-size: 0.74rem; color: var(--color-text-main);">To Date:</label>
                    <input type="date" id="report-filter-to" value="${filter.toDate}" class="glass-input" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; width: 140px; border-radius: 6px;">
                </div>

                <button class="btn btn-primary" onclick="window.applyCustomReportDateRange()" style="padding: 0.4rem 0.95rem; font-size: 0.78rem; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                    <i data-lucide="calendar-check" style="width: 14px; height: 14px;"></i> Fetch Report
                </button>

                <button class="btn btn-secondary" onclick="window.resetReportDateFilter()" style="padding: 0.4rem 0.85rem; font-size: 0.78rem;">
                    Reset
                </button>

                <div style="margin-left: auto; display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="window.exportCurrentReportCSV('${reportType}')" style="padding: 0.4rem 0.85rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 5px;">
                        <i data-lucide="download" style="width: 14px; height: 14px; color: #4ade80;"></i> Export CSV
                    </button>
                    <button class="btn btn-secondary" onclick="window.printCurrentReportStatement()" style="padding: 0.4rem 0.85rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 5px;">
                        <i data-lucide="printer" style="width: 14px; height: 14px; color: #38bdf8;"></i> Print Statement
                    </button>
                </div>
            </div>
        </div>

        <!-- Dynamic KPI Summary Tiles for Filtered Period -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
            ${renderSummaryKpiTiles(reportType, dataset)}
        </div>

        <!-- Detailed Statement Table & Search Toolbar -->
        <div class="glass-panel" style="padding: 1.25rem 1.4rem; border-radius: var(--radius-lg); overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 700;">
                        Statement Records (${dataset.items.length})
                    </h3>
                </div>

                <!-- Table Search Filter -->
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="position: relative; width: 260px;">
                        <i data-lucide="search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #94a3b8;"></i>
                        <input type="text" id="report-search-input" value="${filter.searchQuery}" oninput="window.setReportSearchQuery(this.value)" placeholder="Search transactions, clients..." class="glass-input" style="padding: 0.4rem 0.65rem 0.4rem 32px; font-size: 0.78rem; border-radius: 6px; width: 100%;">
                    </div>
                </div>
            </div>

            <!-- Table Body -->
            <div style="overflow-x: auto;">
                ${renderReportDataTable(reportType, dataset.items)}
            </div>
        </div>
    `;

    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
    }, 0);

    return container;
}

// Helper: Filter Dataset
function getFilteredDataset(state, reportType, filter) {
    const { fromDate, toDate, searchQuery } = filter;
    const fromTime = fromDate ? new Date(fromDate + 'T00:00:00').getTime() : 0;
    const toTime = toDate ? new Date(toDate + 'T23:59:59').getTime() : Infinity;

    if (reportType === 'stock') {
        const inventory = state.inventory || [];
        const catalog = state.materialCatalog || [];
        // Combine inventory with catalog for full stock revenue statement
        let allItems = [
            ...inventory.map(i => ({
                id: i.id,
                name: i.name,
                category: i.category || 'Standard Section',
                qty: i.quantity || 0,
                unit: i.unit || 'pcs',
                rate: i.price || 0,
                val: (i.quantity || 0) * (i.price || 0),
                min: i.min || 10,
                status: (i.quantity || 0) <= 0 ? 'Out of Stock' : (i.quantity || 0) <= (i.min || 10) ? 'Low Stock' : 'Optimal Stock',
                date: '2026-10-10'
            })),
            ...catalog.map((c, idx) => ({
                id: c.id,
                name: c.name,
                category: c.category || 'Profile',
                qty: (idx % 3 === 0 ? 40 : idx % 2 === 0 ? 120 : 65),
                unit: c.unit || 'kg',
                rate: c.rate || 150,
                val: (idx % 3 === 0 ? 40 : idx % 2 === 0 ? 120 : 65) * (c.rate || 150),
                min: 25,
                status: 'Optimal Stock',
                date: '2026-09-15'
            }))
        ];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            allItems = allItems.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
        }

        const totalVal = allItems.reduce((acc, i) => acc + i.val, 0);
        return {
            items: allItems,
            totalAmount: totalVal,
            count: allItems.length,
            metricA: totalVal,
            metricB: allItems.filter(i => i.status === 'Optimal Stock').length,
            metricC: allItems.filter(i => i.status !== 'Optimal Stock').length
        };
    }

    if (reportType === 'orders') {
        let orders = (state.productionOrders || []).filter(o => {
            const oDate = new Date(o.date).getTime();
            return oDate >= fromTime && oDate <= toTime;
        });

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            orders = orders.filter(o => o.client.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.items.toLowerCase().includes(q));
        }

        const totalAmount = orders.reduce((acc, o) => acc + (o.amount || 0), 0);
        return {
            items: orders,
            totalAmount,
            count: orders.length,
            metricA: totalAmount,
            metricB: orders.filter(o => o.status === 'Delivered').length,
            metricC: orders.filter(o => o.status !== 'Delivered').length
        };
    }

    if (reportType === 'sales') {
        let sales = (state.sales || []).filter(s => {
            const sDate = new Date(s.date).getTime();
            return sDate >= fromTime && sDate <= toTime;
        });

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            sales = sales.filter(s => s.customer.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.items && s.items.toLowerCase().includes(q)));
        }

        const totalAmount = sales.reduce((acc, s) => acc + (s.amount || 0), 0);
        const totalPaid = sales.reduce((acc, s) => acc + (s.paidAmount || s.amount - (s.balance || 0)), 0);
        const totalBalance = sales.reduce((acc, s) => acc + (s.balance || 0), 0);

        return {
            items: sales,
            totalAmount,
            totalPaid,
            totalBalance,
            count: sales.length,
            metricA: totalAmount,
            metricB: totalPaid,
            metricC: totalBalance
        };
    }

    if (reportType === 'purchases') {
        let purchases = (state.purchases || []).filter(p => {
            const pDate = new Date(p.date).getTime();
            return pDate >= fromTime && pDate <= toTime;
        });

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            purchases = purchases.filter(p => p.vendor.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.items.toLowerCase().includes(q));
        }

        const totalAmount = purchases.reduce((acc, p) => acc + (p.amount || 0), 0);
        const totalPaid = purchases.reduce((acc, p) => acc + (p.paidAmount || p.amount), 0);
        const totalBalance = purchases.reduce((acc, p) => acc + (p.balance || 0), 0);

        return {
            items: purchases,
            totalAmount,
            totalPaid,
            totalBalance,
            count: purchases.length,
            metricA: totalAmount,
            metricB: totalPaid,
            metricC: totalBalance
        };
    }

    if (reportType === 'pending_orders') {
        let pending = (state.productionOrders || []).filter(o => {
            const isNotDelivered = o.status !== 'Delivered' && (o.progress === undefined || o.progress < 6);
            const oDate = new Date(o.date).getTime();
            return isNotDelivered && oDate >= fromTime && oDate <= toTime;
        });

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            pending = pending.filter(o => o.client.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.items.toLowerCase().includes(q));
        }

        const totalAmount = pending.reduce((acc, o) => acc + (o.amount || 0), 0);
        return {
            items: pending,
            totalAmount,
            count: pending.length,
            metricA: totalAmount,
            metricB: pending.filter(o => o.progress >= 4).length,
            metricC: pending.filter(o => o.progress < 4).length
        };
    }

    return { items: [], totalAmount: 0, count: 0 };
}

// Helper: Tab Button
function renderReportTabButton(id, label, icon, activeReportType) {
    const isActive = activeReportType === id;
    return `
        <button class="report-tab-btn ${isActive ? 'active' : ''}" onclick="window.switchReportType('${id}')" style="
            display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; font-size: 0.78rem; font-weight: ${isActive ? '700' : '500'};
            border-radius: 6px; cursor: pointer; border: 1px solid ${isActive ? 'var(--color-primary)' : 'transparent'};
            background: ${isActive ? 'var(--color-primary)' : 'transparent'};
            color: ${isActive ? '#ffffff' : 'var(--color-text-muted)'}; transition: all 0.2s ease;
        ">
            <i data-lucide="${icon}" style="width: 14px; height: 14px;"></i> ${label}
        </button>
    `;
}

// Helper: Date Range Label
function formatDateRangeLabel(filter) {
    if (filter.mode === 'all') return 'All Time Records (Full Ledger)';
    if (filter.mode === 'monthly') return `Current Month (${filter.fromDate} to ${filter.toDate})`;
    if (filter.mode === 'quarterly') return `Quarterly Period (${filter.fromDate} to ${filter.toDate})`;
    if (filter.mode === 'annually') return `Fiscal Year (${filter.fromDate} to ${filter.toDate})`;
    return `Custom Range: ${filter.fromDate} to ${filter.toDate}`;
}

// Helper: Summary KPI Tiles
function renderSummaryKpiTiles(reportType, dataset) {
    if (reportType === 'stock') {
        return `
            ${createReportKpiCard('Total Stock Valuation', `₹ ${Number(dataset.totalAmount || 0).toLocaleString()}`, 'Optimal', '#22c55e', 'package')}
            ${createReportKpiCard('Total Material SKUs', `${dataset.count} Items`, 'Active', '#38bdf8', 'boxes')}
            ${createReportKpiCard('Optimal Stock SKUs', `${dataset.metricB || 0}`, 'In Warehouse', '#4ade80', 'check-circle')}
            ${createReportKpiCard('Low / Out of Stock', `${dataset.metricC || 0}`, 'Alert', '#ef4444', 'alert-triangle')}
        `;
    }
    if (reportType === 'orders') {
        return `
            ${createReportKpiCard('Total Orders Value', `₹ ${Number(dataset.totalAmount || 0).toLocaleString()}`, 'Statement Total', '#38bdf8', 'file-text')}
            ${createReportKpiCard('Total Placed Orders', `${dataset.count}`, 'In Period', '#60a5fa', 'shopping-cart')}
            ${createReportKpiCard('Completed & Delivered', `${dataset.metricB || 0}`, 'Dispatched', '#22c55e', 'truck')}
            ${createReportKpiCard('In Fabrication Queue', `${dataset.metricC || 0}`, 'Active W.I.P.', '#f59e0b', 'hammer')}
        `;
    }
    if (reportType === 'sales') {
        return `
            ${createReportKpiCard('Total Sales Revenue', `₹ ${Number(dataset.totalAmount || 0).toLocaleString()}`, 'Invoiced', '#22c55e', 'trending-up')}
            ${createReportKpiCard('Realized Payments', `₹ ${Number(dataset.metricB || 0).toLocaleString()}`, 'Cleared', '#4ade80', 'credit-card')}
            ${createReportKpiCard('Pending Receivables', `₹ ${Number(dataset.metricC || 0).toLocaleString()}`, 'Due Balance', '#f59e0b', 'alert-circle')}
            ${createReportKpiCard('Total Invoices', `${dataset.count}`, 'Issued', '#38bdf8', 'file-check')}
        `;
    }
    if (reportType === 'purchases') {
        return `
            ${createReportKpiCard('Total Procurement Spend', `₹ ${Number(dataset.totalAmount || 0).toLocaleString()}`, 'Material POs', '#a855f7', 'shopping-bag')}
            ${createReportKpiCard('Supplier Payments Cleared', `₹ ${Number(dataset.metricB || 0).toLocaleString()}`, 'Settled', '#22c55e', 'check')}
            ${createReportKpiCard('Accounts Payable', `₹ ${Number(dataset.metricC || 0).toLocaleString()}`, 'Outstanding', '#f59e0b', 'clock')}
            ${createReportKpiCard('Total Purchase Orders', `${dataset.count}`, 'Procured', '#c084fc', 'clipboard-list')}
        `;
    }
    if (reportType === 'pending_orders') {
        return `
            ${createReportKpiCard('Pending Orders Valuation', `₹ ${Number(dataset.totalAmount || 0).toLocaleString()}`, 'W.I.P Value', '#f59e0b', 'truck')}
            ${createReportKpiCard('Pending Work Items', `${dataset.count} Orders`, 'Queue Length', '#fbbf24', 'clock')}
            ${createReportKpiCard('Finishing & QC Stage', `${dataset.metricB || 0}`, 'Near Delivery', '#22c55e', 'check-circle')}
            ${createReportKpiCard('Cutting & Welding Stage', `${dataset.metricC || 0}`, 'Fabrication', '#38bdf8', 'hammer')}
        `;
    }
    return '';
}

function createReportKpiCard(label, val, badge, color, icon) {
    return `
        <div class="glass-panel report-kpi-card" style="padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <span class="report-kpi-label" style="font-size: 0.74rem; color: var(--color-text-muted); font-weight: 500;">${label}</span>
                <span style="font-size: 0.68rem; color: ${color}; background: ${color}15; border: 1px solid ${color}30; padding: 1px 7px; border-radius: 9999px; font-weight: 700;">
                    ${badge}
                </span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div class="report-kpi-val" style="font-size: 1.35rem; font-weight: 700; color: var(--color-text-heading); letter-spacing: -0.3px;">${val}</div>
                <div style="width: 28px; height: 28px; border-radius: 6px; background: ${color}20; display: flex; align-items: center; justify-content: center; color: ${color};">
                    <i data-lucide="${icon}" style="width: 15px; height: 15px;"></i>
                </div>
            </div>
        </div>
    `;
}

// Helper: Render Data Table
function renderReportDataTable(reportType, items) {
    if (!items || items.length === 0) {
        return `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--color-text-muted);">
                <i data-lucide="inbox" style="width: 44px; height: 44px; margin-bottom: 0.75rem; opacity: 0.4;"></i>
                <div style="font-size: 1rem; font-weight: 600; color: var(--color-text-heading);">No statement records found for this period</div>
                <p style="font-size: 0.78rem; margin: 4px 0 0;">Try selecting 'Annually (Yearly)' or 'All Records' in the date filter above.</p>
            </div>
        `;
    }

    if (reportType === 'stock') {
        return `
            <table class="report-data-table" style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); font-size: 0.75rem; text-transform: uppercase;">
                        <th style="padding: 10px 12px;">SKU / ID</th>
                        <th style="padding: 10px 12px;">Item Name</th>
                        <th style="padding: 10px 12px;">Category</th>
                        <th style="padding: 10px 12px; text-align: right;">Quantity</th>
                        <th style="padding: 10px 12px; text-align: right;">Unit Rate (₹)</th>
                        <th style="padding: 10px 12px; text-align: right;">Total Valuation (₹)</th>
                        <th style="padding: 10px 12px; text-align: center;">Stock Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(it => `
                        <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.15s ease;" onmouseover="this.style.background='var(--color-bg-surface-glass)'" onmouseout="this.style.background='transparent'">
                            <td style="padding: 10px 12px; font-family: monospace; color: #38bdf8; font-weight: 600;">${it.id}</td>
                            <td style="padding: 10px 12px; font-weight: 600; color: var(--color-text-heading);">${it.name}</td>
                            <td style="padding: 10px 12px; color: var(--color-text-main);">${it.category}</td>
                            <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: var(--color-text-heading);">${it.qty} ${it.unit}</td>
                            <td style="padding: 10px 12px; text-align: right; color: var(--color-text-main);">₹ ${Number(it.rate).toLocaleString()}</td>
                            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #22c55e;">₹ ${Number(it.val).toLocaleString()}</td>
                            <td style="padding: 10px 12px; text-align: center;">
                                <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background: ${it.status === 'Optimal Stock' ? 'rgba(34, 197, 94, 0.15)' : it.status === 'Low Stock' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${it.status === 'Optimal Stock' ? '#4ade80' : it.status === 'Low Stock' ? '#fbbf24' : '#f87171'}; border: 1px solid currentColor;">
                                    ${it.status}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    if (reportType === 'orders' || reportType === 'pending_orders') {
        return `
            <table class="report-data-table" style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); font-size: 0.75rem; text-transform: uppercase;">
                        <th style="padding: 10px 12px;">Order ID</th>
                        <th style="padding: 10px 12px;">Customer / Project</th>
                        <th style="padding: 10px 12px;">Order Date</th>
                        <th style="padding: 10px 12px;">Target Delivery</th>
                        <th style="padding: 10px 12px;">Items Description</th>
                        <th style="padding: 10px 12px; text-align: right;">Amount (₹)</th>
                        <th style="padding: 10px 12px; text-align: center;">Fabrication Stage</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(o => `
                        <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.15s ease;" onmouseover="this.style.background='var(--color-bg-surface-glass)'" onmouseout="this.style.background='transparent'">
                            <td style="padding: 10px 12px; font-family: monospace; color: #38bdf8; font-weight: 600;">${o.id}</td>
                            <td style="padding: 10px 12px; font-weight: 600; color: var(--color-text-heading);">${o.client}</td>
                            <td style="padding: 10px 12px; color: var(--color-text-muted);">${o.date}</td>
                            <td style="padding: 10px 12px; color: var(--color-text-main);">${o.targetDate || '-'}</td>
                            <td style="padding: 10px 12px; color: var(--color-text-main); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${o.items}">${o.items}</td>
                            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #22c55e;">₹ ${Number(o.amount || 0).toLocaleString()}</td>
                            <td style="padding: 10px 12px; text-align: center;">
                                <span style="font-size: 0.72rem; padding: 2px 9px; border-radius: 9999px; font-weight: 600; background: ${o.status === 'Delivered' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)'}; color: ${o.status === 'Delivered' ? '#4ade80' : '#38bdf8'}; border: 1px solid currentColor;">
                                    ${o.status}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    if (reportType === 'sales') {
        return `
            <table class="report-data-table" style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); font-size: 0.75rem; text-transform: uppercase;">
                        <th style="padding: 10px 12px;">Invoice #</th>
                        <th style="padding: 10px 12px;">Customer Name</th>
                        <th style="padding: 10px 12px;">Invoice Date</th>
                        <th style="padding: 10px 12px;">Goods / Description</th>
                        <th style="padding: 10px 12px; text-align: right;">Total Amount</th>
                        <th style="padding: 10px 12px; text-align: right;">Paid Amount</th>
                        <th style="padding: 10px 12px; text-align: right;">Balance Due</th>
                        <th style="padding: 10px 12px; text-align: center;">Payment Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(s => `
                        <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.15s ease;" onmouseover="this.style.background='var(--color-bg-surface-glass)'" onmouseout="this.style.background='transparent'">
                            <td style="padding: 10px 12px; font-family: monospace; color: #38bdf8; font-weight: 600;">${s.id}</td>
                            <td style="padding: 10px 12px; font-weight: 600; color: var(--color-text-heading);">${s.customer}</td>
                            <td style="padding: 10px 12px; color: var(--color-text-muted);">${s.date}</td>
                            <td style="padding: 10px 12px; color: var(--color-text-main);">${s.items || 'Fabricated Windows'}</td>
                            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: var(--color-text-heading);">₹ ${Number(s.amount || 0).toLocaleString()}</td>
                            <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #22c55e;">₹ ${Number(s.paidAmount || (s.amount - (s.balance || 0))).toLocaleString()}</td>
                            <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: ${(s.balance || 0) > 0 ? '#f59e0b' : 'var(--color-text-muted)'};">₹ ${Number(s.balance || 0).toLocaleString()}</td>
                            <td style="padding: 10px 12px; text-align: center;">
                                <span style="font-size: 0.72rem; padding: 2px 9px; border-radius: 9999px; font-weight: 600; background: ${s.status === 'Paid' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; color: ${s.status === 'Paid' ? '#4ade80' : '#fbbf24'}; border: 1px solid currentColor;">
                                    ${s.status}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    if (reportType === 'purchases') {
        return `
            <table class="report-data-table" style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); font-size: 0.75rem; text-transform: uppercase;">
                        <th style="padding: 10px 12px;">PO #</th>
                        <th style="padding: 10px 12px;">Vendor / Supplier</th>
                        <th style="padding: 10px 12px;">Order Date</th>
                        <th style="padding: 10px 12px;">Items Supplied</th>
                        <th style="padding: 10px 12px; text-align: right;">Amount (₹)</th>
                        <th style="padding: 10px 12px; text-align: center;">Payment Mode</th>
                        <th style="padding: 10px 12px; text-align: center;">PO Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(p => `
                        <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.15s ease;" onmouseover="this.style.background='var(--color-bg-surface-glass)'" onmouseout="this.style.background='transparent'">
                            <td style="padding: 10px 12px; font-family: monospace; color: #a855f7; font-weight: 600;">${p.id}</td>
                            <td style="padding: 10px 12px; font-weight: 600; color: var(--color-text-heading);">${p.vendor}</td>
                            <td style="padding: 10px 12px; color: var(--color-text-muted);">${p.date}</td>
                            <td style="padding: 10px 12px; color: var(--color-text-main);">${p.items}</td>
                            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #22c55e;">₹ ${Number(p.amount || 0).toLocaleString()}</td>
                            <td style="padding: 10px 12px; text-align: center; color: var(--color-text-main);">${p.paymentType || 'Bank Transfer'}</td>
                            <td style="padding: 10px 12px; text-align: center;">
                                <span style="font-size: 0.72rem; padding: 2px 9px; border-radius: 9999px; font-weight: 600; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3);">
                                    ${p.status}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    return '';
}

// ============================================================================
// GLOBAL CONTROLLERS & ACTIONS FOR REPORT SYSTEM
// ============================================================================

window.switchReportType = (type) => {
    const store = window.Store || Store;
    store.state.currentReportType = type;
    store.notify();
};

window.setReportFilterMode = (mode) => {
    const state = window.reportFilterState;
    state.mode = mode;

    if (mode === 'monthly') {
        // Current month
        state.fromDate = '2026-10-01';
        state.toDate = '2026-10-31';
    } else if (mode === 'quarterly') {
        // Current Quarter Q4 2026
        state.fromDate = '2026-10-01';
        state.toDate = '2026-12-31';
    } else if (mode === 'annually') {
        // Full Year 2026
        state.fromDate = '2026-01-01';
        state.toDate = '2026-12-31';
    } else if (mode === 'all') {
        state.fromDate = '2020-01-01';
        state.toDate = '2030-12-31';
    }

    const store = window.Store || Store;
    store.notify();
};

window.applyCustomReportDateRange = () => {
    const fromEl = document.getElementById('report-filter-from');
    const toEl = document.getElementById('report-filter-to');
    if (!fromEl || !toEl) return;

    if (!fromEl.value || !toEl.value) {
        return alert('Please select both From Date and To Date');
    }

    window.reportFilterState.mode = 'custom';
    window.reportFilterState.fromDate = fromEl.value;
    window.reportFilterState.toDate = toEl.value;

    const store = window.Store || Store;
    store.notify();
};

window.resetReportDateFilter = () => {
    window.reportFilterState = {
        mode: 'annually',
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        searchQuery: '',
        statusFilter: 'ALL'
    };
    const store = window.Store || Store;
    store.notify();
};

window.setReportSearchQuery = (val) => {
    window.reportFilterState.searchQuery = val;
    const store = window.Store || Store;
    store.notify();
};

window.exportCurrentReportCSV = (reportType) => {
    const store = window.Store || Store;
    const dataset = getFilteredDataset(store.state, reportType, window.reportFilterState);
    if (!dataset.items || dataset.items.length === 0) {
        return alert('No records to export');
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    const keys = Object.keys(dataset.items[0]);
    csvContent += keys.join(',') + '\r\n';

    dataset.items.forEach(row => {
        const rowValues = keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`);
        csvContent += rowValues.join(',') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_statement_${window.reportFilterState.fromDate}_to_${window.reportFilterState.toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

window.printCurrentReportStatement = () => {
    window.print();
};
