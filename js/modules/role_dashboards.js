import { Store } from '../store.js';

// ============================================================================
// ACCOUNTS DASHBOARD VIEW (Financial & Billing Focus)
// ============================================================================
export function renderAccountsDashboard(state, activeUser) {
    const container = document.createElement('div');
    container.className = 'dashboard animate-fade-in accounts-dashboard';
    container.style.cssText = 'display: flex; flex-direction: column; gap: 1.25rem; width: 100%;';

    const userPhoto = activeUser.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';

    container.innerHTML = `
        <!-- Top Header Bar -->
        <div class="dashboard-top-header" style="display: flex; flex-direction: column; gap: 0.45rem; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 1rem; flex-wrap: wrap;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <h2 style="font-size: 1.45rem; font-weight: 700; color: var(--color-text-heading); margin: 0; line-height: 1.2;">
                            Financial & Billing Dashboard
                        </h2>
                        <span style="font-size: 0.72rem; background: rgba(52, 211, 153, 0.2); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.4); padding: 2px 9px; border-radius: 9999px; font-weight: 700;">
                            💳 Accounts & Finance Role
                        </span>
                    </div>
                    <p style="font-size: 0.78rem; color: var(--color-text-muted); margin: 3px 0 0; line-height: 1.3;">
                        Live cash flow, receivable aging, vendor payments, purchase bills & GST reconciliation
                    </p>
                </div>

                <!-- User Profile & Session Controls -->
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem; padding: 0.35rem 0.85rem; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 9999px;">
                        <img src="${userPhoto}" alt="${activeUser.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid #34d399;">
                        <div>
                            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-text-heading);">${activeUser.name}</div>
                            <div style="font-size: 0.68rem; color: #34d399; font-weight: 600;">ID: #${activeUser.id || 'EMP-101'} • ${activeUser.role}</div>
                        </div>
                    </div>
                    <button onclick="window.switchActiveUser('admin')" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.4rem 0.85rem; display: inline-flex; align-items: center; gap: 4px;" title="Exit simulation and return to Admin">
                        <i data-lucide="shield-check" style="width: 13px; height: 13px; color: #38bdf8;"></i> Exit to Admin
                    </button>
                </div>
            </div>
        </div>

        <!-- Role Scope Notice Banner -->
        <div style="background: linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(56, 189, 248, 0.08)); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 10px; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
                <i data-lucide="shield-check" style="width: 18px; height: 18px; color: #34d399; flex-shrink: 0;"></i>
                <span style="font-size: 0.82rem; color: #cbd5e1;">
                    <strong>Financial & Billing Privilege Active:</strong> You have full ledger, invoice, payment, and expense reconciliation rights. Operational HR records and system configurations are restricted.
                </span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="window.navigate('sales')" class="btn btn-primary" style="padding: 0.35rem 0.8rem; font-size: 0.76rem;">New Tax Invoice</button>
                <button onclick="window.navigate('payments')" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.76rem;">Record Payment</button>
            </div>
        </div>

        <!-- 5 Top Financial Metric Cards -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem;">
            ${createFinancialKpiCard('Payments Received', '₹ 1,70,000', '↑ 15%', '#10b981', 'credit-card', 'M 0,25 Q 30,12 60,18 T 100,5', 'Current month collected', 'payments')}
            ${createFinancialKpiCard('Outstanding Receivables', '₹ 1,17,000', '3 Invoices', '#f59e0b', 'alert-circle', 'M 0,15 Q 35,25 70,12 T 100,20', 'Due from 3 clients', 'sales')}
            ${createFinancialKpiCard('Vendor Payables', '₹ 88,500', '2 Bills Pending', '#ef4444', 'shopping-bag', 'M 0,18 Q 40,10 70,22 T 100,16', 'Material procurement POs', 'purchase')}
            ${createFinancialKpiCard('Net Cash Flow', '+ ₹ 81,500', 'Healthy (48%)', '#38bdf8', 'trending-up', 'M 0,22 Q 25,18 55,20 T 100,6', 'Inflow minus outflow', 'payments')}
            ${createFinancialKpiCard('GST Output Liability', '₹ 42,650', '18% Slab', '#a855f7', 'file-text', 'M 0,20 Q 30,24 60,14 T 100,8', 'Current tax cycle', 'reports')}
        </div>

        <!-- Main Financial Section (2 Columns) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            
            <!-- Left Column: Aging Receivables Schedule & Cash Flow -->
            <div class="glass-panel" style="padding: 1.25rem; border-radius: var(--radius-lg); display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; color: #f59e0b;">
                            <i data-lucide="clock" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 700;">Aging Receivables Ledger</h3>
                            <p style="margin: 2px 0 0; font-size: 0.72rem; color: var(--color-text-muted);">Client payment aging and overdue balances</p>
                        </div>
                    </div>
                    <span style="font-size: 0.75rem; color: #f59e0b; font-weight: 700; background: rgba(245, 158, 11, 0.12); padding: 2px 8px; border-radius: 6px;">Total: ₹ 1,17,000</span>
                </div>

                <!-- Aging Schedule Cards -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.75rem; text-align: center;">
                        <span style="font-size: 0.7rem; color: #94a3b8; font-weight: 600;">0 - 15 Days</span>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #38bdf8; margin: 4px 0;">₹ 25,000</div>
                        <span style="font-size: 0.66rem; color: #cbd5e1;">Arun Kumar</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.75rem; text-align: center;">
                        <span style="font-size: 0.7rem; color: #94a3b8; font-weight: 600;">16 - 30 Days</span>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #10b981; margin: 4px 0;">₹ 0</div>
                        <span style="font-size: 0.66rem; color: #10b981;">No Dues</span>
                    </div>
                    <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 0.75rem; text-align: center;">
                        <span style="font-size: 0.7rem; color: #f87171; font-weight: 700;">31+ Days Overdue</span>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #ef4444; margin: 4px 0;">₹ 92,000</div>
                        <span style="font-size: 0.66rem; color: #f87171;">City Hosp + Rajesh</span>
                    </div>
                </div>

                <!-- Overdue Client List -->
                <div style="flex: 1; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); text-align: left;">
                                <th style="padding: 6px 8px;">Client / Invoice</th>
                                <th style="padding: 6px 8px;">Due Date</th>
                                <th style="padding: 6px 8px; text-align: right;">Balance</th>
                                <th style="padding: 6px 8px; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                                <td style="padding: 8px;">
                                    <div style="font-weight: 600; color: #f8fafc;">City Hospital</div>
                                    <div style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">INV-2025-003</div>
                                </td>
                                <td style="padding: 8px; color: #f87171; font-weight: 600;">05 Dec 2025 (Overdue)</td>
                                <td style="padding: 8px; text-align: right; font-weight: 700; color: #ef4444;">₹ 85,000</td>
                                <td style="padding: 8px; text-align: right;">
                                    <button onclick="alert('Payment reminder dispatched via WhatsApp to City Hospital')" class="btn btn-secondary" style="padding: 3px 8px; font-size: 0.72rem;">Remind</button>
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                                <td style="padding: 8px;">
                                    <div style="font-weight: 600; color: #f8fafc;">Arun Kumar</div>
                                    <div style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">INV-2025-002</div>
                                </td>
                                <td style="padding: 8px; color: #f59e0b;">15 Jan 2026</td>
                                <td style="padding: 8px; text-align: right; font-weight: 700; color: #f59e0b;">₹ 25,000</td>
                                <td style="padding: 8px; text-align: right;">
                                    <button onclick="window.navigate('payments')" class="btn btn-secondary" style="padding: 3px 8px; font-size: 0.72rem;">Collect</button>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px;">
                                    <div style="font-weight: 600; color: #f8fafc;">Mr. Rajesh</div>
                                    <div style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">INV-2025-004</div>
                                </td>
                                <td style="padding: 8px; color: #f87171; font-weight: 600;">10 Jan 2026 (Overdue)</td>
                                <td style="padding: 8px; text-align: right; font-weight: 700; color: #ef4444;">₹ 7,000</td>
                                <td style="padding: 8px; text-align: right;">
                                    <button onclick="alert('Follow up note logged for Rajesh')" class="btn btn-secondary" style="padding: 3px 8px; font-size: 0.72rem;">Follow Up</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right Column: Purchase Bills & Vendor Payables -->
            <div class="glass-panel" style="padding: 1.25rem; border-radius: var(--radius-lg); display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                            <i data-lucide="receipt" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 700;">Purchase Bills & Vendor Payables</h3>
                            <p style="margin: 2px 0 0; font-size: 0.72rem; color: var(--color-text-muted);">Raw material supplier invoices & payment dues</p>
                        </div>
                    </div>
                    <button onclick="window.navigate('purchase')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;">All Purchases</button>
                </div>

                <div style="flex: 1; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); text-align: left;">
                                <th style="padding: 6px 8px;">Vendor / PO</th>
                                <th style="padding: 6px 8px;">Material Items</th>
                                <th style="padding: 6px 8px; text-align: right;">Bill Amount</th>
                                <th style="padding: 6px 8px; text-align: center;">Status</th>
                                <th style="padding: 6px 8px; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                                <td style="padding: 8px;">
                                    <div style="font-weight: 600; color: #f8fafc;">Steel City Suppliers</div>
                                    <div style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">PO-1001</div>
                                </td>
                                <td style="padding: 8px; color: #cbd5e1;">Heavy Duty MS Channels (x40)</td>
                                <td style="padding: 8px; text-align: right; font-weight: 700; color: #f8fafc;">₹ 42,000</td>
                                <td style="padding: 8px; text-align: center;">
                                    <span style="font-size: 0.68rem; background: rgba(34, 197, 94, 0.15); color: #4ade80; padding: 2px 7px; border-radius: 4px; font-weight: 600;">Delivered</span>
                                </td>
                                <td style="padding: 8px; text-align: right;">
                                    <button onclick="alert('PO-1001 marked for bank payout')" class="btn btn-primary" style="padding: 3px 8px; font-size: 0.72rem;">Pay Bill</button>
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                                <td style="padding: 8px;">
                                    <div style="font-weight: 600; color: #f8fafc;">Saint-Gobain Glazing</div>
                                    <div style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">PO-1002</div>
                                </td>
                                <td style="padding: 8px; color: #cbd5e1;">Toughened Glass 18mm Panes</td>
                                <td style="padding: 8px; text-align: right; font-weight: 700; color: #f8fafc;">₹ 38,000</td>
                                <td style="padding: 8px; text-align: center;">
                                    <span style="font-size: 0.68rem; background: rgba(34, 197, 94, 0.15); color: #4ade80; padding: 2px 7px; border-radius: 4px; font-weight: 600;">Delivered</span>
                                </td>
                                <td style="padding: 8px; text-align: right;">
                                    <button onclick="alert('PO-1002 payment approved')" class="btn btn-primary" style="padding: 3px 8px; font-size: 0.72rem;">Pay Bill</button>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px;">
                                    <div style="font-weight: 600; color: #f8fafc;">Apex Fasteners</div>
                                    <div style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">PO-1003</div>
                                </td>
                                <td style="padding: 8px; color: #cbd5e1;">Friction Stays & Locks</td>
                                <td style="padding: 8px; text-align: right; font-weight: 700; color: #4ade80;">₹ 8,500</td>
                                <td style="padding: 8px; text-align: center;">
                                    <span style="font-size: 0.68rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 7px; border-radius: 4px; font-weight: 600;">Paid</span>
                                </td>
                                <td style="padding: 8px; text-align: right;">
                                    <span style="font-size: 0.72rem; color: #94a3b8;">Receipt ✓</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        <!-- Bottom Full Section: Recent Invoices & GST Output Ledger -->
        <div class="glass-panel" style="padding: 1.25rem; border-radius: var(--radius-lg);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(99, 102, 241, 0.15); display: flex; align-items: center; justify-content: center; color: #818cf8;">
                        <i data-lucide="file-spreadsheet" style="width: 18px; height: 18px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 700;">Sales Invoices & Tax Output Ledger</h3>
                        <p style="margin: 2px 0 0; font-size: 0.72rem; color: var(--color-text-muted);">Reconciled billing transactions and payment clearance</p>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="window.navigate('reports')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;">GST Statement</button>
                    <button onclick="window.navigate('sales')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;">All Invoices</button>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); text-align: left;">
                        <th style="padding: 8px;">Invoice No</th>
                        <th style="padding: 8px;">Customer</th>
                        <th style="padding: 8px;">Date</th>
                        <th style="padding: 8px; text-align: right;">Total Amount</th>
                        <th style="padding: 8px; text-align: right;">Paid</th>
                        <th style="padding: 8px; text-align: right;">Balance</th>
                        <th style="padding: 8px; text-align: center;">Status</th>
                        <th style="padding: 8px; text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${(state.sales || []).map(inv => `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                            <td style="padding: 8px; font-family: monospace; font-weight: 600; color: #38bdf8;">${inv.id}</td>
                            <td style="padding: 8px; font-weight: 600; color: #f8fafc;">${inv.customer}</td>
                            <td style="padding: 8px; color: #94a3b8;">${inv.date}</td>
                            <td style="padding: 8px; text-align: right; font-weight: 700; color: #f8fafc;">₹ ${inv.amount.toLocaleString()}</td>
                            <td style="padding: 8px; text-align: right; color: #4ade80;">₹ ${inv.paidAmount.toLocaleString()}</td>
                            <td style="padding: 8px; text-align: right; font-weight: 700; color: ${inv.balance > 0 ? '#ef4444' : '#94a3b8'};">₹ ${inv.balance.toLocaleString()}</td>
                            <td style="padding: 8px; text-align: center;">
                                <span style="font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; background: ${inv.status === 'Paid' ? 'rgba(34, 197, 94, 0.15)' : inv.status === 'Overdue' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; color: ${inv.status === 'Paid' ? '#4ade80' : inv.status === 'Overdue' ? '#f87171' : '#fbbf24'};">
                                    ${inv.status}
                                </span>
                            </td>
                            <td style="padding: 8px; text-align: right;">
                                <button onclick="window.navigate('sales')" class="btn btn-secondary" style="padding: 2px 7px; font-size: 0.72rem;">View</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    return container;
}

// ============================================================================
// SALES TEAM DASHBOARD VIEW (Sales Pipeline Focus)
// ============================================================================
export function renderSalesDashboard(state, activeUser) {
    const container = document.createElement('div');
    container.className = 'dashboard animate-fade-in sales-dashboard';
    container.style.cssText = 'display: flex; flex-direction: column; gap: 1.25rem; width: 100%;';

    const userPhoto = activeUser.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

    container.innerHTML = `
        <!-- Top Header Bar -->
        <div class="dashboard-top-header" style="display: flex; flex-direction: column; gap: 0.45rem; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 1rem; flex-wrap: wrap;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <h2 style="font-size: 1.45rem; font-weight: 700; color: var(--color-text-heading); margin: 0; line-height: 1.2;">
                            Commercial Sales & CRM Dashboard
                        </h2>
                        <span style="font-size: 0.72rem; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 2px 9px; border-radius: 9999px; font-weight: 700;">
                            📈 Sales Team Role
                        </span>
                    </div>
                    <p style="font-size: 0.78rem; color: var(--color-text-muted); margin: 3px 0 0; line-height: 1.3;">
                        Active inquiries, quotations pipeline, scheduled site visits, conversion velocity & order tracking
                    </p>
                </div>

                <!-- User Profile & Session Controls -->
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem; padding: 0.35rem 0.85rem; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 9999px;">
                        <img src="${userPhoto}" alt="${activeUser.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid #fbbf24;">
                        <div>
                            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-text-heading);">${activeUser.name}</div>
                            <div style="font-size: 0.68rem; color: #fbbf24; font-weight: 600;">ID: #${activeUser.id || 'EMP-102'} • ${activeUser.role}</div>
                        </div>
                    </div>
                    <button onclick="window.switchActiveUser('admin')" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.4rem 0.85rem; display: inline-flex; align-items: center; gap: 4px;" title="Exit simulation and return to Admin">
                        <i data-lucide="shield-check" style="width: 13px; height: 13px; color: #38bdf8;"></i> Exit to Admin
                    </button>
                </div>
            </div>
        </div>

        <!-- Role Scope Notice Banner -->
        <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(234, 88, 12, 0.08)); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
                <i data-lucide="target" style="width: 18px; height: 18px; color: #fbbf24; flex-shrink: 0;"></i>
                <span style="font-size: 0.82rem; color: #cbd5e1;">
                    <strong>Commercial Pipeline Focus:</strong> Access permitted for Leads, Site Measurements, Quotations, and Order tracking. Restricted from raw procurement costs, full company balance sheets, and system settings.
                </span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="window.navigate('quotations')" class="btn btn-primary" style="padding: 0.35rem 0.8rem; font-size: 0.76rem;">New Quotation</button>
                <button onclick="window.navigate('leads')" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.76rem;">Add Lead</button>
            </div>
        </div>

        <!-- 5 Top Sales Pipeline Sparkline Cards -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem;">
            ${createFinancialKpiCard('Active Leads', '24 Leads', '↑ 8 this week', '#fbbf24', 'users', 'M 0,20 Q 30,12 60,18 T 100,5', 'Inquiries in pipeline', 'leads')}
            ${createFinancialKpiCard('Assigned Site Visits', '4 Scheduled', 'Aperture checks', '#38bdf8', 'map-pin', 'M 0,25 Q 35,14 65,22 T 100,8', 'Measurements assigned', 'site_visit')}
            ${createFinancialKpiCard('Quotations Pipeline', '₹ 5,48,000', '6 Quotes', '#a855f7', 'file-text', 'M 0,18 Q 30,26 60,15 T 100,4', 'Active customer quotes', 'quotations')}
            ${createFinancialKpiCard('Conversion Rate', '68.4%', '↑ 8.2% vs target', '#10b981', 'check-circle-2', 'M 0,26 Q 25,18 55,20 T 100,3', 'Lead to confirmed order', 'sales')}
            ${createFinancialKpiCard('Monthly Target', '72.8%', '₹ 3.64L / 5.0L', '#f97316', 'award', 'M 0,22 Q 30,20 60,12 T 100,6', 'Sales quota progress', 'sales')}
        </div>

        <!-- Main Sales Section (2 Columns) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            
            <!-- Left Column: Interactive Sales Funnel & Scheduled Site Visits -->
            <div class="glass-panel" style="padding: 1.25rem; border-radius: var(--radius-lg); display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; color: #fbbf24;">
                            <i data-lucide="filter" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 700;">Sales Pipeline Funnel</h3>
                            <p style="margin: 2px 0 0; font-size: 0.72rem; color: var(--color-text-muted);">Stage progression from lead to signed invoice</p>
                        </div>
                    </div>
                    <span style="font-size: 0.75rem; color: #4ade80; font-weight: 700; background: rgba(34, 197, 94, 0.12); padding: 2px 8px; border-radius: 6px;">Pipeline: ₹ 25.4L</span>
                </div>

                <!-- Funnel Horizontal Stages -->
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem;">
                    ${[
                        { stage: '1. New Inquiries / Leads', count: '24 Leads', val: '₹ 12,80,000', pct: 100, color: '#38bdf8' },
                        { stage: '2. Site Measurement Scheduled', count: '9 Sites', val: '₹ 7,20,000', pct: 75, color: '#60a5fa' },
                        { stage: '3. Formal Quote Sent', count: '6 Quotes', val: '₹ 5,48,000', pct: 55, color: '#a855f7' },
                        { stage: '4. Commercial Negotiation', count: '3 Quotes', val: '₹ 2,40,000', pct: 35, color: '#f59e0b' },
                        { stage: '5. Confirmed Active Orders', count: '14 Orders', val: '₹ 3,64,218', pct: 25, color: '#10b981' }
                    ].map(st => `
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 6px; padding: 0.5rem 0.75rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; margin-bottom: 3px;">
                                <span style="font-weight: 600; color: #f8fafc;">${st.stage}</span>
                                <span style="color: ${st.color}; font-weight: 700;">${st.count} • ${st.val}</span>
                            </div>
                            <div style="height: 5px; width: 100%; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                                <div style="height: 100%; width: ${st.pct}%; background: ${st.color}; border-radius: 3px;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Assigned Site Measurements -->
                <div style="border-top: 1px solid var(--glass-border); padding-top: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Assigned Site Visits (Aperture Measurement)</span>
                        <button onclick="window.navigate('site_visit')" class="btn btn-secondary" style="padding: 2px 7px; font-size: 0.7rem;">Open Map</button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 6px 8px; border-radius: 6px; font-size: 0.78rem;">
                            <div>
                                <strong style="color: #f8fafc;">Luxury Villa Project</strong>
                                <span style="color: #94a3b8; font-size: 0.7rem;"> • Malappuram</span>
                            </div>
                            <span style="color: #38bdf8; font-weight: 600;">Today 10:30 AM</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 6px 8px; border-radius: 6px; font-size: 0.78rem;">
                            <div>
                                <strong style="color: #f8fafc;">Green Valley Villa</strong>
                                <span style="color: #94a3b8; font-size: 0.7rem;"> • Wayanad</span>
                            </div>
                            <span style="color: #fbbf24; font-weight: 600;">Tomorrow 11:00 AM</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Active Quotations Tracker & Quick Share -->
            <div class="glass-panel" style="padding: 1.25rem; border-radius: var(--radius-lg); display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(168, 85, 247, 0.15); display: flex; align-items: center; justify-content: center; color: #c084fc;">
                            <i data-lucide="file-check" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 700;">Active Quotations Tracker</h3>
                            <p style="margin: 2px 0 0; font-size: 0.72rem; color: var(--color-text-muted);">Client estimates with 1-click WhatsApp & PDF share</p>
                        </div>
                    </div>
                    <button onclick="window.navigate('quotations')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;">View All Quotes</button>
                </div>

                <div style="flex: 1; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); text-align: left;">
                                <th style="padding: 6px 8px;">Quote ID</th>
                                <th style="padding: 6px 8px;">Customer</th>
                                <th style="padding: 6px 8px; text-align: right;">Amount</th>
                                <th style="padding: 6px 8px; text-align: center;">Status</th>
                                <th style="padding: 6px 8px; text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(state.quotations || []).map(q => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                                    <td style="padding: 8px; font-family: monospace; font-weight: 600; color: #38bdf8;">${q.id}</td>
                                    <td style="padding: 8px;">
                                        <div style="font-weight: 600; color: #f8fafc;">${q.customer}</div>
                                        <div style="font-size: 0.68rem; color: #94a3b8;">${q.location || 'Kerala'}</div>
                                    </td>
                                    <td style="padding: 8px; text-align: right; font-weight: 700; color: #4ade80;">₹ ${q.amount.toLocaleString()}</td>
                                    <td style="padding: 8px; text-align: center;">
                                        <span style="font-size: 0.68rem; padding: 2px 7px; border-radius: 4px; font-weight: 600; background: ${q.status === 'Sent' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; color: ${q.status === 'Sent' ? '#38bdf8' : '#fbbf24'};">
                                            ${q.status}
                                        </span>
                                    </td>
                                    <td style="padding: 8px; text-align: right;">
                                        <div style="display: flex; gap: 4px; justify-content: flex-end;">
                                            <button onclick="window.openShareQuotationModal('${q.id}')" title="Share via WhatsApp / PDF" class="btn btn-secondary" style="padding: 3px 6px; font-size: 0.7rem; color: #22c55e;">
                                                <i data-lucide="share-2" style="width: 12px; height: 12px;"></i>
                                            </button>
                                            <button onclick="window.openQuoteBOMModal('${q.id}')" title="View BOM" class="btn btn-secondary" style="padding: 3px 6px; font-size: 0.7rem; color: #f59e0b;">
                                                <i data-lucide="layers" style="width: 12px; height: 12px;"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        <!-- Bottom Full Section: Order Tracking & Client Inquiries -->
        <div class="glass-panel" style="padding: 1.25rem; border-radius: var(--radius-lg);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(34, 197, 94, 0.15); display: flex; align-items: center; justify-content: center; color: #4ade80;">
                        <i data-lucide="shopping-bag" style="width: 18px; height: 18px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 700;">Won Orders & Fabrication Tracking</h3>
                        <p style="margin: 2px 0 0; font-size: 0.72rem; color: var(--color-text-muted);">Real-time workshop status for client updates</p>
                    </div>
                </div>
                <button onclick="window.navigate('customers')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;">Customer Directory</button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                ${(state.productionOrders || []).slice(0, 3).map(ord => `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.45rem;">
                            <span style="font-family: monospace; font-weight: 700; color: #38bdf8; font-size: 0.78rem;">${ord.id}</span>
                            <span style="font-size: 0.68rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 1px 6px; border-radius: 4px; font-weight: 600;">${ord.status}</span>
                        </div>
                        <div style="font-weight: 700; color: #f8fafc; font-size: 0.9rem;">${ord.client}</div>
                        <div style="font-size: 0.75rem; color: #cbd5e1; margin: 3px 0 8px;">${ord.items}</div>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px;">
                            <span style="color: #94a3b8;">Target: ${ord.targetDate || 'In Assembly'}</span>
                            <strong style="color: #4ade80;">₹ ${(ord.amount || 45000).toLocaleString()}</strong>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    return container;
}

// ============================================================================
// STAFF / PRODUCTION DASHBOARD VIEW (Operations & Fabrication Focus)
// ============================================================================
export function renderProductionDashboard(state, activeUser) {
    const container = document.createElement('div');
    container.className = 'dashboard animate-fade-in production-dashboard';
    container.style.cssText = 'display: flex; flex-direction: column; gap: 1.25rem; width: 100%;';

    const userPhoto = activeUser.photo || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80';

    const uRole = (activeUser.role || '').toLowerCase();
    let dashboardTitle = 'Workshop Operations & Fabrication Dashboard';
    let roleBadge = '🔨 Staff / Production Role';
    let roleDesc = 'Cutting lists, machine cell job cards, fabrication stages, quality testing & self-attendance logs';
    if (uRole.includes('cad') || uRole.includes('design') || uRole.includes('drawing')) {
        dashboardTitle = 'CAD Design & Drawing Studio Dashboard';
        roleBadge = '📐 Drawing & CAD Role';
        roleDesc = 'Live technical shop drawings, structural CAD geometry, cutting plans & architectural approvals';
    } else if (uRole.includes('cnc') || uRole.includes('machin')) {
        dashboardTitle = 'CNC Machinery & Cutting Cell Dashboard';
        roleBadge = '⚙️ CNC Machinery Role';
        roleDesc = 'Automated cutting schedules, profile punch sequences, machine telemetry & tool calibration';
    } else if (uRole.includes('sup') || uRole.includes('operat')) {
        dashboardTitle = 'Operations Supervision & Field Dashboard';
        roleBadge = '🛡️ Supervisor Role';
        roleDesc = 'Floor operations, site survey synchronization, task dispatch & workforce quality tracking';
    } else if (uRole.includes('fab') || uRole.includes('weld')) {
        dashboardTitle = 'Fabrication & Assembly Floor Dashboard';
        roleBadge = '🔥 Fabrication Role';
        roleDesc = 'Welding bays, sash assembly, structural joinery, quality testing & job card tracking';
    } else if (uRole.includes('pack')) {
        dashboardTitle = 'Finishing & Packing Bay Dashboard';
        roleBadge = '📦 Packing Role';
        roleDesc = 'Protective packaging, hardware inspection, dispatch readiness & quality compliance';
    } else if (uRole.includes('deliver') || uRole.includes('driver')) {
        dashboardTitle = 'Logistics & Delivery Fleet Dashboard';
        roleBadge = '🚚 Delivery Role';
        roleDesc = 'Order dispatch tracking, route optimization, customer delivery handovers & site verification';
    }

    container.innerHTML = `
        <!-- Top Header Bar -->
        <div class="dashboard-top-header" style="display: flex; flex-direction: column; gap: 0.45rem; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 1rem; flex-wrap: wrap;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <h2 style="font-size: 1.45rem; font-weight: 700; color: var(--color-text-heading); margin: 0; line-height: 1.2;">
                            ${dashboardTitle}
                        </h2>
                        <span style="font-size: 0.72rem; background: rgba(167, 139, 250, 0.2); color: #c4b5fd; border: 1px solid rgba(167, 139, 240, 0.4); padding: 2px 9px; border-radius: 9999px; font-weight: 700;">
                            ${roleBadge}
                        </span>
                    </div>
                    <p style="font-size: 0.78rem; color: var(--color-text-muted); margin: 3px 0 0; line-height: 1.3;">
                        ${roleDesc}
                    </p>
                </div>

                <!-- User Profile & Session Controls -->
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem; padding: 0.35rem 0.85rem; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 9999px;">
                        <img src="${userPhoto}" alt="${activeUser.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid #a78bfa;">
                        <div>
                            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-text-heading);">${activeUser.name}</div>
                            <div style="font-size: 0.68rem; color: #a78bfa; font-weight: 600;">ID: #${activeUser.id || 'EMP-105'} • ${activeUser.role}</div>
                        </div>
                    </div>
                    <button onclick="window.switchActiveUser('admin')" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.4rem 0.85rem; display: inline-flex; align-items: center; gap: 4px;" title="Exit simulation and return to Admin">
                        <i data-lucide="shield-check" style="width: 13px; height: 13px; color: #38bdf8;"></i> Exit to Admin
                    </button>
                </div>
            </div>
        </div>

        <!-- Role Scope Notice Banner -->
        <div style="background: linear-gradient(135deg, rgba(167, 139, 250, 0.12), rgba(99, 102, 241, 0.08)); border: 1px solid rgba(167, 139, 250, 0.3); border-radius: 10px; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
                <i data-lucide="wrench" style="width: 18px; height: 18px; color: #a78bfa; flex-shrink: 0;"></i>
                <span style="font-size: 0.82rem; color: #cbd5e1;">
                    <strong>Operations & Workshop Floor Privilege:</strong> Access permitted for Fabrication Job Cards, Material Cut-Lists, and Self-Attendance. Commercial pricing, balance sheets, and administrative configurations are restricted.
                </span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="window.openCuttingSheetModal('ORD-4385')" class="btn btn-primary" style="padding: 0.35rem 0.8rem; font-size: 0.76rem;">View Active Cut Sheet</button>
                <button onclick="window.navigate('production')" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.76rem;">All Orders</button>
            </div>
        </div>

        <!-- 5 Top Operations Sparkline Cards -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem;">
            ${createFinancialKpiCard('Assigned Jobs', '14 Jobs', 'Bay 2 & CNC Cell', '#a78bfa', 'hammer', 'M 0,22 Q 30,12 60,18 T 100,6', 'Active fabrication queue', 'production')}
            ${createFinancialKpiCard('In-Progress Assembly', '8 Orders', 'Welding & fitting', '#38bdf8', 'settings', 'M 0,16 Q 35,26 70,14 T 100,5', 'On assembly stations', 'production')}
            ${createFinancialKpiCard('Quality Passed', '6 Orders', 'Tested & signed', '#10b981', 'check-circle-2', 'M 0,25 Q 30,15 60,20 T 100,4', 'Ready for packing', 'production')}
            ${createFinancialKpiCard('On-Time Delivery', '94.2%', 'Factory benchmark', '#22c55e', 'truck', 'M 0,24 Q 25,18 55,20 T 100,5', 'Schedule adherence', 'production')}
            ${createFinancialKpiCard('Attendance / Shift', 'Clocked In', '08:15 AM (8h shift)', '#f59e0b', 'clock', 'M 0,20 Q 30,22 60,14 T 100,8', '18.0h OT Logged this mo', 'hr')}
        </div>

        <!-- Main Production Section (2 Columns) -->
        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.25rem;">
            
            <!-- Left Column: Today's Work Queue & Job Cards with Stage Stepper -->
            <div class="glass-panel" style="padding: 1.25rem; border-radius: var(--radius-lg); display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(167, 139, 250, 0.15); display: flex; align-items: center; justify-content: center; color: #a78bfa;">
                            <i data-lucide="clipboard-list" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 700;">Assigned Fabrication Job Cards</h3>
                            <p style="margin: 2px 0 0; font-size: 0.72rem; color: var(--color-text-muted);">Workshop cutting, assembly & finishing progress</p>
                        </div>
                    </div>
                    <span style="font-size: 0.75rem; color: #38bdf8; font-weight: 700; background: rgba(56, 189, 248, 0.12); padding: 2px 8px; border-radius: 6px;">3 Active Orders</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                    ${[
                        { id: 'ORD-4385', client: 'Malabar Residency', items: 'Soundproof Sliding Windows (x8)', stage: 'Assembling', step: 3, tech: 'Rajeesh Kumar' },
                        { id: 'ORD-4372', client: 'Skyline Heights', items: 'Balcony French Doors & Enclosure (x4)', stage: 'Powder Coating', step: 4, tech: 'Mani Kangan' },
                        { id: 'ORD-4390', client: 'Arun Kumar', items: 'Tata MS Box Window 4x4cm (x5)', stage: 'CNC Cutting', step: 2, tech: 'Suresh Babu' }
                    ].map(j => `
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="font-family: monospace; font-weight: 700; color: #38bdf8; font-size: 0.85rem;">${j.id}</span>
                                        <strong style="color: #f8fafc; font-size: 0.95rem;">${j.client}</strong>
                                    </div>
                                    <div style="font-size: 0.78rem; color: #cbd5e1; margin-top: 2px;">${j.items}</div>
                                </div>
                                <button onclick="window.openCuttingSheetModal('${j.id}')" class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.74rem; display: inline-flex; align-items: center; gap: 4px;">
                                    <i data-lucide="scissors" style="width: 12px; height: 12px;"></i> Cut Sheet
                                </button>
                            </div>

                            <!-- Stage Stepper -->
                            <div style="margin-top: 0.75rem; padding-top: 0.65rem; border-top: 1px solid rgba(255,255,255,0.06);">
                                <div style="display: flex; justify-content: space-between; font-size: 0.68rem; margin-bottom: 4px;">
                                    <span style="color: ${j.step >= 1 ? '#4ade80' : '#64748b'}; font-weight: 600;">1. Material Issued</span>
                                    <span style="color: ${j.step >= 2 ? '#4ade80' : '#64748b'}; font-weight: 600;">2. Cut & Miter</span>
                                    <span style="color: ${j.step >= 3 ? '#4ade80' : '#64748b'}; font-weight: 600;">3. Assembled</span>
                                    <span style="color: ${j.step >= 4 ? '#4ade80' : '#64748b'}; font-weight: 600;">4. Powder Coated</span>
                                    <span style="color: ${j.step >= 5 ? '#4ade80' : '#64748b'}; font-weight: 600;">5. Ready</span>
                                </div>
                                <div style="height: 6px; width: 100%; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
                                    <div style="height: 100%; width: ${(j.step / 5) * 100}%; background: linear-gradient(90deg, #38bdf8, #22c55e); border-radius: 4px;"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Right Column: Self-Attendance & Workshop Stock Check -->
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                
                <!-- Self Attendance & Overtime -->
                <div class="glass-panel" style="padding: 1.25rem; border-radius: var(--radius-lg);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                            <div style="width: 34px; height: 34px; border-radius: 8px; background: rgba(34, 197, 94, 0.15); display: flex; align-items: center; justify-content: center; color: #4ade80;">
                                <i data-lucide="user-check" style="width: 17px; height: 17px;"></i>
                            </div>
                            <h3 style="margin: 0; font-size: 1.05rem; color: var(--color-text-heading); font-weight: 700;">My Shift & Overtime</h3>
                        </div>
                        <span style="font-size: 0.7rem; background: #22c55e; color: #022c22; padding: 2px 7px; border-radius: 9999px; font-weight: 700;">CLOCKED IN</span>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; margin-bottom: 0.85rem;">
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 6px; padding: 0.6rem; text-align: center;">
                            <span style="font-size: 0.68rem; color: #94a3b8;">Today's Check-In</span>
                            <div style="font-size: 1rem; font-weight: 700; color: #f8fafc; margin-top: 2px;">08:15 AM</div>
                            <span style="font-size: 0.64rem; color: #4ade80;">On Time ✓</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 6px; padding: 0.6rem; text-align: center;">
                            <span style="font-size: 0.68rem; color: #94a3b8;">Monthly OT Hours</span>
                            <div style="font-size: 1rem; font-weight: 700; color: #38bdf8; margin-top: 2px;">18.0 Hours</div>
                            <span style="font-size: 0.64rem; color: #38bdf8;">₹ 2,700 Earned</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="alert('Clock-out registered at ' + new Date().toLocaleTimeString())" class="btn btn-secondary" style="flex: 1; padding: 0.45rem; font-size: 0.78rem;">
                            <i data-lucide="log-out" style="width: 13px; height: 13px; margin-right: 4px;"></i> End Shift / Clock Out
                        </button>
                    </div>
                </div>

                <!-- Raw Material Stock Availability on Floor -->
                <div class="glass-panel" style="padding: 1.25rem; border-radius: var(--radius-lg); flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                            <div style="width: 34px; height: 34px; border-radius: 8px; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                                <i data-lucide="box" style="width: 17px; height: 17px;"></i>
                            </div>
                            <h3 style="margin: 0; font-size: 1.05rem; color: var(--color-text-heading); font-weight: 700;">Workshop Floor Stock</h3>
                        </div>
                        <button onclick="window.navigate('stock_manager')" class="btn btn-secondary" style="padding: 2px 7px; font-size: 0.7rem;">Inventory</button>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.78rem;">
                        <div style="display: flex; justify-content: space-between; padding: 5px 8px; background: rgba(255,255,255,0.02); border-radius: 4px;">
                            <span style="color: #cbd5e1;">5x3 Tata Box Profile 16G</span>
                            <strong style="color: #4ade80;">240 m (Healthy)</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 5px 8px; background: rgba(255,255,255,0.02); border-radius: 4px;">
                            <span style="color: #cbd5e1;">20x20 Square Tube 1.2mm</span>
                            <strong style="color: #4ade80;">180 m (Healthy)</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 5px 8px; background: rgba(255,255,255,0.02); border-radius: 4px;">
                            <span style="color: #cbd5e1;">5mm Clear Toughened Glass</span>
                            <strong style="color: #38bdf8;">45 sheets</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 5px 8px; background: rgba(255,255,255,0.02); border-radius: 4px;">
                            <span style="color: #cbd5e1;">Heavy Duty SS Butt Hinges 4"</span>
                            <strong style="color: #f59e0b;">12 pcs (Low)</strong>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    `;

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    return container;
}

// Sparkline KPI Card Helper
function createFinancialKpiCard(title, value, change, color, icon, sparklineD, subtext, navTarget) {
    return `
        <div onclick="window.navigate('${navTarget}')" class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-lg); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='none';">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <span style="font-size: 0.74rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase;">${title}</span>
                <div style="width: 32px; height: 32px; border-radius: 8px; background: ${color}20; display: flex; align-items: center; justify-content: center; color: ${color};">
                    <i data-lucide="${icon}" style="width: 16px; height: 16px;"></i>
                </div>
            </div>
            <div style="display: flex; align-items: baseline; gap: 0.45rem; margin-bottom: 0.35rem;">
                <span style="font-size: 1.35rem; font-weight: 800; color: var(--color-text-heading);">${value}</span>
                <span style="font-size: 0.72rem; color: ${color}; font-weight: 700;">${change}</span>
            </div>
            <div style="font-size: 0.68rem; color: var(--color-text-muted);">${subtext}</div>
        </div>
    `;
}

// Modal for Production Cutting & Measurement Sheet
window.openCuttingSheetModal = (orderId) => {
    const existing = document.getElementById('cutting-sheet-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'cutting-sheet-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 100050;';

    modal.innerHTML = `
        <div class="glass-panel" style="width: 820px; max-width: 95vw; max-height: 90vh; background: #0b111e; border: 1px solid var(--color-primary-border); border-radius: var(--radius-lg); padding: 1.75rem; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 65px rgba(0,0,0,0.9);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                        <i data-lucide="scissors" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.25rem; color: #f8fafc; font-weight: 700;">Fabrication Cutting & Measurement Sheet</h3>
                        <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">Order: <strong style="color: #38bdf8;">${orderId}</strong> • Malabar Residency • Acoustic Sliding Windows</p>
                    </div>
                </div>
                <button onclick="document.getElementById('cutting-sheet-modal').remove()" style="background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>

            <div style="flex: 1; overflow-y: auto; padding-right: 4px;">
                <h4 style="margin: 0 0 0.5rem; color: #f8fafc; font-size: 0.95rem;">1. Outer Frame Profile Cuts (5x3 Tata MS Box 16G)</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 1.25rem;">
                    <thead>
                        <tr style="background: rgba(255,255,255,0.04); color: #94a3b8; text-align: left;">
                            <th style="padding: 6px 8px;">Part Specification</th>
                            <th style="padding: 6px 8px;">Length (mm)</th>
                            <th style="padding: 6px 8px;">Qty Required</th>
                            <th style="padding: 6px 8px;">Miter Angle</th>
                            <th style="padding: 6px 8px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                            <td style="padding: 7px 8px; color: #f8fafc; font-weight: 600;">Top Transom Rail</td>
                            <td style="padding: 7px 8px; font-family: monospace; color: #38bdf8; font-weight: 700;">1219 mm</td>
                            <td style="padding: 7px 8px;">16 Pcs</td>
                            <td style="padding: 7px 8px;">45° / 45°</td>
                            <td style="padding: 7px 8px; color: #4ade80;">Cut & Tagged ✓</td>
                        </tr>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                            <td style="padding: 7px 8px; color: #f8fafc; font-weight: 600;">Bottom Sill Rail</td>
                            <td style="padding: 7px 8px; font-family: monospace; color: #38bdf8; font-weight: 700;">1219 mm</td>
                            <td style="padding: 7px 8px;">16 Pcs</td>
                            <td style="padding: 7px 8px;">45° / 45°</td>
                            <td style="padding: 7px 8px; color: #4ade80;">Cut & Tagged ✓</td>
                        </tr>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                            <td style="padding: 7px 8px; color: #f8fafc; font-weight: 600;">Left / Right Stiles</td>
                            <td style="padding: 7px 8px; font-family: monospace; color: #38bdf8; font-weight: 700;">1219 mm</td>
                            <td style="padding: 7px 8px;">32 Pcs</td>
                            <td style="padding: 7px 8px;">45° / 45°</td>
                            <td style="padding: 7px 8px; color: #fbbf24;">In Progress</td>
                        </tr>
                    </tbody>
                </table>

                <h4 style="margin: 0 0 0.5rem; color: #f8fafc; font-size: 0.95rem;">2. Glass Pane Cut Sizes (5mm Clear Toughened)</h4>
                <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 0.85rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                        <span style="color: #f8fafc; font-weight: 600;">Net Pane Cut Size (Deducting 60mm Frame + 2mm EPDM clearance):</span>
                        <strong style="color: #38bdf8; font-family: monospace; font-size: 1rem;">1159 mm × 1159 mm (8 Panes)</strong>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem; font-size: 0.8rem; color: #cbd5e1;">
                    <strong>Workshop Assembly Note:</strong> Apply 2 coats of Zinc Chromate Red Oxide primer to welded internal corners before glass placement. Ensure EPDM gasket is seated without stretching.
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid var(--glass-border); padding-top: 1rem; margin-top: 1rem;">
                <button onclick="window.print()" class="btn btn-secondary" style="padding: 0.5rem 1.25rem;">
                    <i data-lucide="printer" style="width: 14px; height: 14px; margin-right: 4px;"></i> Print Sheet
                </button>
                <button onclick="document.getElementById('cutting-sheet-modal').remove()" class="btn btn-primary" style="padding: 0.5rem 1.5rem;">Done</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};
