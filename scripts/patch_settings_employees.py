import os

settings_path = os.path.abspath('js/modules/settings.js')

with open(settings_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update tab navigation list to include 'employees'
old_tab_nav = """            <!-- Sidebar -->
            <div style="width: 250px; border-right: 1px solid var(--glass-border); padding: 1rem 0; background: rgba(0,0,0,0.1);">
                ${renderTabNav('profile', 'User Profile', 'user')}
                ${renderTabNav('roles', 'Roles & Permissions', 'shield-check')}"""

new_tab_nav = """            <!-- Sidebar -->
            <div style="width: 250px; border-right: 1px solid var(--glass-border); padding: 1rem 0; background: rgba(0,0,0,0.1);">
                ${renderTabNav('profile', 'User Profile', 'user')}
                ${renderTabNav('employees', 'Employees & Roles', 'user-check')}
                ${renderTabNav('roles', 'Roles & Permissions', 'shield-check')}"""

if old_tab_nav in code:
    code = code.replace(old_tab_nav, new_tab_nav, 1)
    print("Added 'employees' to tab navigation.")
else:
    print("Warning: old_tab_nav not found!")

# 2. Add tabs['employees'] right before tabs['roles']
old_roles_anchor = "        'roles': `"

employees_tab_code = """        'employees': renderEmployeesTabHTML(state),
        'roles': `"""

if old_roles_anchor in code:
    code = code.replace(old_roles_anchor, employees_tab_code, 1)
    print("Inserted 'employees' tab anchor.")
else:
    print("Warning: old_roles_anchor not found!")

# 3. Add employee management functions and helpers at the end of settings.js
helpers_code = '''

// ============================================================================
// EMPLOYEE DIRECTORY, ROLES & PERMISSIONS MODULE (Enterprise RBAC)
// ============================================================================

const CORE_MODULES_LIST = [
    { id: 'dashboard', name: 'Dashboard', icon: 'layout-dashboard', desc: 'Main business KPIs, charts & maps' },
    { id: 'customers', name: 'Customers', icon: 'user-check', desc: 'Client profiles, addresses & ledgers' },
    { id: 'calculation', name: 'Calculation', icon: 'calculator', desc: 'Window & Grill estimation CAD studio' },
    { id: 'quotations', name: 'Quotations', icon: 'file-text', desc: 'Quotation drafting, pricing & printing' },
    { id: 'leads', name: 'Leads & CRM', icon: 'users', desc: 'Prospects, pipeline & follow-ups' },
    { id: 'site_visit', name: 'Site Visit', icon: 'map-pin', desc: 'On-site measurement & scheduling' },
    { id: 'service_visit', name: 'Service Visit', icon: 'wrench', desc: 'Maintenance & technician dispatch' },
    { id: 'sales', name: 'Sales & Invoices', icon: 'shopping-cart', desc: 'Tax invoices, advances & balances' },
    { id: 'purchase', name: 'Purchase & Expense', icon: 'shopping-bag', desc: 'Vendor orders & raw materials bills' },
    { id: 'payments', name: 'Payments', icon: 'credit-card', desc: 'Cashflow, receipts & overdue logs' },
    { id: 'stock_manager', name: 'Inventory', icon: 'package', desc: 'Raw material stock, pricing & alerts' },
    { id: 'production', name: 'Production', icon: 'hammer', desc: 'Shopfloor orders, cutting & assembly' },
    { id: 'hr', name: 'HR & Team', icon: 'users', desc: 'Workforce attendance, face scan & OT' },
    { id: 'reports', name: 'Statements & Reports', icon: 'bar-chart-2', desc: 'P&L, sales reports & statements' }
];

const PRESET_ROLE_CONFIGS = {
    accounts: {
        role: 'Accounts Executive',
        dept: 'Accounts',
        salary: 28000,
        otRate: 150,
        perms: { dashboard: 'view', customers: 'view', calculation: 'none', quotations: 'view', leads: 'none', site_visit: 'none', service_visit: 'none', sales: 'functional', purchase: 'functional', payments: 'functional', stock_manager: 'view', production: 'none', hr: 'view', reports: 'functional' }
    },
    sales: {
        role: 'Sales Executive',
        dept: 'Sales',
        salary: 30000,
        otRate: 160,
        perms: { dashboard: 'view', customers: 'functional', calculation: 'functional', quotations: 'functional', leads: 'functional', site_visit: 'functional', service_visit: 'view', sales: 'functional', purchase: 'none', payments: 'view', stock_manager: 'view', production: 'none', hr: 'view', reports: 'view' }
    },
    designing: {
        role: 'Window & CAD Designer',
        dept: 'Designing',
        salary: 35000,
        otRate: 180,
        perms: { dashboard: 'view', customers: 'view', calculation: 'functional', quotations: 'functional', leads: 'none', site_visit: 'none', service_visit: 'none', sales: 'none', purchase: 'none', payments: 'none', stock_manager: 'view', production: 'view', hr: 'view', reports: 'none' }
    },
    supervisor: {
        role: 'Operations Supervisor',
        dept: 'Supervisor',
        salary: 32000,
        otRate: 170,
        perms: { dashboard: 'view', customers: 'view', calculation: 'view', quotations: 'view', leads: 'view', site_visit: 'functional', service_visit: 'functional', sales: 'view', purchase: 'view', payments: 'none', stock_manager: 'functional', production: 'functional', hr: 'functional', reports: 'view' }
    },
    production: {
        role: 'Production Floor Lead',
        dept: 'Production',
        salary: 29000,
        otRate: 155,
        perms: { dashboard: 'view', customers: 'none', calculation: 'view', quotations: 'none', leads: 'none', site_visit: 'none', service_visit: 'none', sales: 'none', purchase: 'none', payments: 'none', stock_manager: 'functional', production: 'functional', hr: 'view', reports: 'none' }
    },
    machinery: {
        role: 'CNC Machinery Operator',
        dept: 'Production',
        salary: 24000,
        otRate: 140,
        perms: { dashboard: 'none', customers: 'none', calculation: 'none', quotations: 'none', leads: 'none', site_visit: 'none', service_visit: 'none', sales: 'none', purchase: 'none', payments: 'none', stock_manager: 'view', production: 'functional', hr: 'view', reports: 'none' }
    },
    fabrication: {
        role: 'Fabrication Specialist',
        dept: 'Fabrication',
        salary: 26000,
        otRate: 150,
        perms: { dashboard: 'none', customers: 'none', calculation: 'view', quotations: 'none', leads: 'none', site_visit: 'view', service_visit: 'none', sales: 'none', purchase: 'none', payments: 'none', stock_manager: 'view', production: 'functional', hr: 'view', reports: 'none' }
    },
    painting: {
        role: 'Painting & Coating Specialist',
        dept: 'Painting Section',
        salary: 22000,
        otRate: 130,
        perms: { dashboard: 'none', customers: 'none', calculation: 'none', quotations: 'none', leads: 'none', site_visit: 'none', service_visit: 'none', sales: 'none', purchase: 'none', payments: 'none', stock_manager: 'view', production: 'functional', hr: 'view', reports: 'none' }
    },
    all_view: {
        role: 'General Reviewer',
        dept: 'General',
        salary: 25000,
        otRate: 150,
        perms: { dashboard: 'view', customers: 'view', calculation: 'view', quotations: 'view', leads: 'view', site_visit: 'view', service_visit: 'view', sales: 'view', purchase: 'view', payments: 'view', stock_manager: 'view', production: 'view', hr: 'view', reports: 'view' }
    }
};

function renderEmployeesTabHTML(state) {
    const store = window.Store || Store;
    const staffList = (store && store.state && store.state.staff) || state.staff || [];
    const activeUser = (store && typeof store.getActiveUser === 'function') ? store.getActiveUser() : { id: 'SB-9901', name: 'Shamsudheen V.K.', role: 'Super Administrator', isSuperAdmin: true };

    const totalOT = staffList.reduce((acc, s) => acc + (parseFloat(s.overtimeHours) || 0), 0);
    const totalOTAmount = staffList.reduce((acc, s) => acc + (parseFloat(s.overtime) || 0), 0);
    const depts = Array.from(new Set(staffList.map(s => s.department || 'Operations')));

    return `
        <div class="glass-panel" style="padding: 2rem; margin-bottom: 1.5rem;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <h2 style="margin: 0; font-size: 1.45rem; color: #f8fafc; font-weight: 700;">Employee Directory & Role Access</h2>
                        <span style="font-size: 0.74rem; background: linear-gradient(135deg, #0284c7, #2563eb); color: white; padding: 2px 10px; border-radius: 9999px; font-weight: 700; letter-spacing: 0.3px;">ENTERPRISE RBAC</span>
                    </div>
                    <p style="color: var(--color-text-muted); margin: 4px 0 0; font-size: 0.85rem;">
                        Manage employees across Accounts, Sales, Designing, Supervisor, Production, Machinery, Fabrication, and Painting. Configure shift timings, overtime (OT), and module-level View-Only vs Functional access.
                    </p>
                </div>
                <div style="display: flex; gap: 0.65rem; align-items: center;">
                    <button onclick="window.openAddEmployeeModal()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; padding: 0.6rem 1.25rem; font-size: 0.88rem;">
                        <i data-lucide="user-plus" style="width: 17px; height: 17px;"></i> Add New Employee
                    </button>
                </div>
            </div>

            <!-- Metric Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1rem; text-align: center;">
                    <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Total Staff</span>
                    <div style="font-size: 1.6rem; font-weight: 800; color: #38bdf8; margin-top: 2px;">${staffList.length}</div>
                    <span style="font-size: 0.7rem; color: #94a3b8;">Company Employees</span>
                </div>
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1rem; text-align: center;">
                    <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Active Session</span>
                    <div style="font-size: 1.05rem; font-weight: 700; color: ${activeUser.isSuperAdmin ? '#4ade80' : '#fbbf24'}; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${activeUser.name}
                    </div>
                    <span style="font-size: 0.7rem; color: #94a3b8;">${activeUser.role}</span>
                </div>
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1rem; text-align: center;">
                    <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Departments</span>
                    <div style="font-size: 1.6rem; font-weight: 800; color: #a855f7; margin-top: 2px;">${depts.length}</div>
                    <span style="font-size: 0.7rem; color: #94a3b8;">Functional Divisions</span>
                </div>
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1rem; text-align: center;">
                    <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Total Logged OT</span>
                    <div style="font-size: 1.6rem; font-weight: 800; color: #22c55e; margin-top: 2px;">${totalOT.toFixed(1)}h</div>
                    <span style="font-size: 0.7rem; color: #4ade80;">₹ ${totalOTAmount.toLocaleString()} Overtime Pay</span>
                </div>
            </div>

            <!-- Active User Switch Banner -->
            ${!activeUser.isSuperAdmin ? `
                <div style="margin-bottom: 1.5rem; padding: 0.85rem 1.15rem; border-radius: 8px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(99, 102, 241, 0.15)); border: 1px solid rgba(245, 158, 11, 0.4); display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-size: 1.2rem;">👤</span>
                        <div>
                            <span style="font-size: 0.88rem; font-weight: 700; color: #fbbf24;">Simulating Employee View: ${activeUser.name} (${activeUser.role})</span>
                            <div style="font-size: 0.74rem; color: #cbd5e1;">The sidebar navigation and module controls reflect this employee's assigned access permissions.</div>
                        </div>
                    </div>
                    <button onclick="window.switchActiveUser('admin')" class="btn" style="padding: 0.4rem 1rem; font-size: 0.8rem; font-weight: 600; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                        <i data-lucide="shield" style="width: 14px; height: 14px;"></i> Switch Back to Super Admin
                    </button>
                </div>
            ` : ''}

            <!-- Filter & Search Toolbar -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;" id="emp-dept-filters">
                    ${['All', 'Accounts', 'Sales', 'Designing', 'Supervisor', 'Production', 'Fabrication', 'Painting Section'].map(dept => {
                        const activeDept = window.employeeFilterDept || 'All';
                        const isSel = activeDept === dept;
                        return `
                            <button type="button" onclick="window.filterEmployeeDepartment('${dept}')" style="
                                padding: 5px 12px; border-radius: 20px; font-size: 0.76rem; font-weight: 600; cursor: pointer; border: 1px solid ${isSel ? 'var(--color-primary)' : 'var(--glass-border)'};
                                background: ${isSel ? 'var(--button-primary-bg)' : 'rgba(255,255,255,0.04)'}; color: ${isSel ? 'white' : 'var(--color-text-muted)'};
                                transition: all 0.2s;
                            ">
                                ${dept}
                            </button>
                        `;
                    }).join('')}
                </div>
                <div style="position: relative; min-width: 260px;">
                    <i data-lucide="search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--color-text-muted);"></i>
                    <input type="text" id="emp-search-input" value="${window.employeeSearchKeyword || ''}" placeholder="Search employee, ID, role..." class="glass-input" oninput="window.searchEmployees(this.value)" style="width: 100%; padding-left: 32px; font-size: 0.82rem; height: 34px;">
                </div>
            </div>

            <!-- Employee List Container -->
            <div id="employees-cards-container" style="display: flex; flex-direction: column; gap: 1rem;">
                ${renderEmployeeCardsList(staffList, activeUser)}
            </div>
        </div>
    `;
}

function renderEmployeeCardsList(staffList, activeUser) {
    const curFilter = window.employeeFilterDept || 'All';
    const keyword = (window.employeeSearchKeyword || '').toLowerCase().trim();

    const filtered = staffList.filter(emp => {
        if (curFilter !== 'All' && (emp.department || '').toLowerCase() !== curFilter.toLowerCase()) {
            return false;
        }
        if (keyword) {
            const str = `${emp.name} ${emp.id} ${emp.role} ${emp.department} ${emp.phone}`.toLowerCase();
            if (!str.includes(keyword)) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        return `
            <div style="text-align: center; padding: 3rem 1rem; background: rgba(255,255,255,0.02); border: 1px dashed var(--glass-border); border-radius: 12px; color: var(--color-text-muted);">
                <i data-lucide="users" style="width: 44px; height: 44px; margin-bottom: 0.75rem; opacity: 0.4;"></i>
                <div style="font-size: 1rem; font-weight: 600; color: #f8fafc;">No matching employees found</div>
                <div style="font-size: 0.8rem; margin-top: 4px;">Try selecting another department or click 'Add New Employee' to register a team member.</div>
            </div>
        `;
    }

    return filtered.map(emp => {
        const perms = emp.permissions || {};
        const functionalCount = Object.values(perms).filter(v => v === 'functional').length;
        const viewCount = Object.values(perms).filter(v => v === 'view').length;
        const isCurrentActive = activeUser.id === emp.id;

        return `
            <div style="
                background: ${isCurrentActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(14, 165, 233, 0.12))' : 'rgba(255,255,255,0.03)'};
                border: 1.5px solid ${isCurrentActive ? 'var(--color-primary)' : 'var(--glass-border)'};
                border-radius: var(--radius-md); padding: 1.25rem 1.4rem; transition: all 0.2s ease;
                box-shadow: ${isCurrentActive ? '0 0 15px var(--color-primary-glow)' : 'none'};
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                    <!-- Left: Employee Identity & Role -->
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="position: relative;">
                            <img src="${emp.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}" alt="${emp.name}" style="width: 58px; height: 58px; border-radius: 50%; object-fit: cover; border: 2px solid ${isCurrentActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)'};">
                            <span style="position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; border-radius: 50%; background: ${emp.status === 'Present' ? '#22c55e' : (emp.status === 'On Site' ? '#38bdf8' : '#94a3b8')}; border: 2px solid #0f1219;" title="${emp.status || 'Active'}"></span>
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                                <h3 style="margin: 0; font-size: 1.15rem; color: #f8fafc; font-weight: 700;">${emp.name}</h3>
                                <span style="font-size: 0.7rem; font-family: monospace; background: rgba(255,255,255,0.08); padding: 1px 7px; border-radius: 4px; color: #94a3b8; font-weight: 600;">${emp.id}</span>
                                <span style="font-size: 0.72rem; padding: 2px 9px; border-radius: 9999px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-weight: 600;">
                                    ${emp.role}
                                </span>
                                <span style="font-size: 0.7rem; padding: 2px 8px; border-radius: 9999px; background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); font-weight: 600;">
                                    ${emp.department || 'Operations'}
                                </span>
                                ${isCurrentActive ? `<span style="font-size: 0.68rem; background: #22c55e; color: #052e16; font-weight: 800; padding: 1px 7px; border-radius: 9999px;">ACTIVE SESSION</span>` : ''}
                            </div>
                            <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                                <span><i data-lucide="phone" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${emp.phone || '-'}</span>
                                <span>&bull;</span>
                                <span><i data-lucide="mail" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${emp.email || '-'}</span>
                                <span>&bull;</span>
                                <span><i data-lucide="map-pin" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${emp.place || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Quick Action Controls -->
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                        ${isCurrentActive ? `
                            <button onclick="window.switchActiveUser('admin')" class="btn" style="padding: 0.45rem 0.95rem; font-size: 0.8rem; font-weight: 600; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                                <i data-lucide="shield" style="width: 14px; height: 14px;"></i> Return to Admin
                            </button>
                        ` : `
                            <button onclick="window.switchActiveUser('${emp.id}')" class="btn" style="padding: 0.45rem 0.95rem; font-size: 0.8rem; font-weight: 600; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;" title="Test the system as this employee">
                                <i data-lucide="log-in" style="width: 14px; height: 14px;"></i> Test As User
                            </button>
                        `}
                        <button onclick="window.openEditEmployeeModal('${emp.id}')" class="btn btn-secondary" style="padding: 0.45rem 0.85rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;" title="Edit Access & Profile">
                            <i data-lucide="sliders" style="width: 14px; height: 14px; color: var(--color-primary);"></i> Edit Permissions
                        </button>
                        <button onclick="window.openEmployeeAttendanceLog('${emp.id}')" class="btn btn-secondary" style="padding: 0.45rem 0.85rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;" title="View HR Attendance & Overtime">
                            <i data-lucide="clock" style="width: 14px; height: 14px; color: #22c55e;"></i> Attendance & OT
                        </button>
                        <button onclick="window.deleteEmployee('${emp.id}')" class="btn btn-secondary" style="padding: 0.45rem 0.65rem; font-size: 0.8rem; color: #f87171; border-color: rgba(239, 68, 68, 0.3);" title="Delete Employee">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>

                <!-- Middle Section: Salary, HR Timing & OT Breakdown -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; background: rgba(0,0,0,0.22); border-radius: 8px; padding: 0.75rem 1rem; margin-top: 1rem; border: 1px solid rgba(255,255,255,0.04);">
                    <div>
                        <span style="font-size: 0.7rem; color: #94a3b8;">Monthly Salary</span>
                        <div style="font-size: 0.95rem; font-weight: 700; color: #f8fafc; margin-top: 1px;">₹ ${(emp.monthlySalary || 0).toLocaleString()}</div>
                    </div>
                    <div>
                        <span style="font-size: 0.7rem; color: #94a3b8;">Shift & Reporting</span>
                        <div style="font-size: 0.9rem; font-weight: 600; color: #cbd5e1; margin-top: 1px;">
                            ${emp.shiftHours || 8} hrs/day • <span style="color: #38bdf8;">${emp.reportingTime || '08:30 AM'}</span>
                        </div>
                    </div>
                    <div>
                        <span style="font-size: 0.7rem; color: #94a3b8;">Work Days / Late</span>
                        <div style="font-size: 0.9rem; font-weight: 600; color: #cbd5e1; margin-top: 1px;">
                            <span style="color: #22c55e;">${emp.presentDays || 0} Present</span> • <span style="${(emp.lateDays || 0) > 0 ? 'color: #f59e0b;' : 'color: #94a3b8;'}">${emp.lateDays || 0} Late</span>
                        </div>
                    </div>
                    <div>
                        <span style="font-size: 0.7rem; color: #94a3b8;">Overtime (OT) Logged</span>
                        <div style="font-size: 0.95rem; font-weight: 700; color: #4ade80; margin-top: 1px;">
                            ${(emp.overtimeHours || 0).toFixed(1)} hrs <span style="font-size: 0.75rem; color: #86efac;">(+₹${(emp.overtime || 0).toLocaleString()})</span>
                        </div>
                    </div>
                </div>

                <!-- Bottom Section: Side Menu Module Permissions Matrix Summary -->
                <div style="margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid rgba(255,255,255,0.06);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.74rem; font-weight: 600; color: #cbd5e1;">Assigned Side Menu Module Permissions:</span>
                        <div style="display: flex; gap: 8px; font-size: 0.7rem;">
                            <span style="color: #4ade80;">● ${functionalCount} Functional</span>
                            <span style="color: #fbbf24;">● ${viewCount} View-Only</span>
                            <span style="color: #94a3b8;">● ${CORE_MODULES_LIST.length - functionalCount - viewCount} Hidden</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        ${CORE_MODULES_LIST.map(mod => {
                            const level = perms[mod.id] || 'none';
                            if (level === 'none') return '';
                            const isFunctional = level === 'functional';
                            return `
                                <span style="
                                    font-size: 0.72rem; padding: 2px 8px; border-radius: 5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;
                                    background: ${isFunctional ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)'};
                                    color: ${isFunctional ? '#4ade80' : '#fbbf24'};
                                    border: 1px solid ${isFunctional ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'};
                                " title="${isFunctional ? 'Full Functional Access (Operate & Edit)' : 'View-Only Access (Read-Only)'}">
                                    ${isFunctional ? '⚡' : '👁️'} ${mod.name}
                                </span>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ----------------------------------------------------------------------------
// MODAL: ADD / EDIT EMPLOYEE WITH GRANULAR PERMISSION MATRIX
// ----------------------------------------------------------------------------

window.openAddEmployeeModal = () => {
    window.renderEmployeeModal(null);
};

window.openEditEmployeeModal = (empId) => {
    const store = window.Store || Store;
    const staffList = (store && store.state && store.state.staff) || [];
    const emp = staffList.find(s => s.id === empId);
    if (!emp) return alert('Employee not found.');
    window.renderEmployeeModal(emp);
};

window.renderEmployeeModal = (emp) => {
    const isEdit = !!emp;
    const existing = document.getElementById('employee-form-modal');
    if (existing) existing.remove();

    const empData = emp || {
        id: 'EMP-' + (Math.floor(Math.random() * 800) + 200),
        name: '',
        role: 'Window & CAD Designer',
        department: 'Designing',
        phone: '',
        email: '',
        place: 'Kozhikode, Kerala',
        monthlySalary: 28000,
        shiftHours: 8,
        reportingTime: '08:30 AM',
        overtimeRate: 150,
        permissions: { dashboard: 'view', calculation: 'functional', quotations: 'functional', hr: 'view' }
    };

    const modal = document.createElement('div');
    modal.id = 'employee-form-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; z-index: 100020;
        padding: 1.5rem; overflow-y: auto;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 820px; max-width: 95vw; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background: #0b0f17; border: 1px solid var(--color-primary-border); border-radius: 12px; box-shadow: 0 25px 65px rgba(0,0,0,0.9);">
            <!-- Modal Header -->
            <div style="padding: 1.25rem 1.75rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; background: var(--button-primary-bg); display: flex; align-items: center; justify-content: center; color: white;">
                        <i data-lucide="${isEdit ? 'sliders' : 'user-plus'}" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.2rem; color: #f8fafc; font-weight: 700;">
                            ${isEdit ? `Edit Employee & Permissions: ${empData.name}` : 'Register New Company Employee'}
                        </h3>
                        <p style="margin: 2px 0 0; font-size: 0.76rem; color: var(--color-text-muted);">
                            Assign profession, department, HR shift timings, and configure side-menu module access.
                        </p>
                    </div>
                </div>
                <button type="button" onclick="window.closeEmployeeModal()" style="background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 6px;">
                    <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                </button>
            </div>

            <!-- Modal Form Body -->
            <form onsubmit="window.saveEmployeeData(event)" style="flex: 1; overflow-y: auto; padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.5rem;">
                <input type="hidden" id="emp-form-id" value="${empData.id}">
                <input type="hidden" id="emp-form-is-edit" value="${isEdit ? 'true' : 'false'}">

                <!-- SECTION 1: Personal & Professional Identity -->
                <div>
                    <h4 style="margin: 0 0 0.85rem; font-size: 0.92rem; color: var(--color-primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                        1. Personal & Professional Details
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">Full Name *</label>
                            <input type="text" id="emp-name" required value="${empData.name || ''}" placeholder="e.g. Farhan Ali" class="glass-input" style="width: 100%; font-size: 0.9rem;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">Profession / Role *</label>
                            <select id="emp-role" class="glass-input" style="width: 100%; font-size: 0.88rem;" onchange="window.handleRoleSelectChange(this.value)">
                                <option value="Accounts Executive" ${empData.role === 'Accounts Executive' ? 'selected' : ''}>Accounts & Finance Executive</option>
                                <option value="Sales Executive" ${empData.role === 'Sales Executive' ? 'selected' : ''}>Sales & Business Development</option>
                                <option value="Window & CAD Designer" ${empData.role === 'Window & CAD Designer' ? 'selected' : ''}>Window & CAD Designer</option>
                                <option value="Operations Supervisor" ${empData.role === 'Operations Supervisor' ? 'selected' : ''}>Operations & Site Supervisor</option>
                                <option value="Production Floor Lead" ${empData.role === 'Production Floor Lead' ? 'selected' : ''}>Production Floor Lead</option>
                                <option value="CNC Machinery Operator" ${empData.role === 'CNC Machinery Operator' ? 'selected' : ''}>CNC Machinery Operator</option>
                                <option value="Fabrication Specialist" ${empData.role === 'Fabrication Specialist' ? 'selected' : ''}>Fabrication Specialist</option>
                                <option value="Painting & Coating Specialist" ${empData.role === 'Painting & Coating Specialist' ? 'selected' : ''}>Painting & Coating Specialist</option>
                                <option value="Custom" ${!['Accounts Executive','Sales Executive','Window & CAD Designer','Operations Supervisor','Production Floor Lead','CNC Machinery Operator','Fabrication Specialist','Painting & Coating Specialist'].includes(empData.role) ? 'selected' : ''}>Custom Profession...</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">Department *</label>
                            <select id="emp-dept" class="glass-input" style="width: 100%; font-size: 0.88rem;">
                                <option value="Accounts" ${empData.department === 'Accounts' ? 'selected' : ''}>Accounts</option>
                                <option value="Sales" ${empData.department === 'Sales' ? 'selected' : ''}>Sales</option>
                                <option value="Designing" ${empData.department === 'Designing' ? 'selected' : ''}>Designing</option>
                                <option value="Supervisor" ${empData.department === 'Supervisor' ? 'selected' : ''}>Supervisor</option>
                                <option value="Production" ${empData.department === 'Production' ? 'selected' : ''}>Production</option>
                                <option value="Fabrication" ${empData.department === 'Fabrication' ? 'selected' : ''}>Fabrication</option>
                                <option value="Painting Section" ${empData.department === 'Painting Section' ? 'selected' : ''}>Painting Section</option>
                                <option value="General" ${empData.department === 'General' ? 'selected' : ''}>General / Admin</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">Monthly Salary (₹) *</label>
                            <input type="number" id="emp-salary" required value="${empData.monthlySalary || 28000}" class="glass-input" style="width: 100%; font-size: 0.9rem;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">Mobile Phone *</label>
                            <input type="tel" id="emp-phone" required value="${empData.phone || ''}" placeholder="+91 9846..." class="glass-input" style="width: 100%;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">Email Address</label>
                            <input type="email" id="emp-email" value="${empData.email || ''}" placeholder="staff@stellobuild.com" class="glass-input" style="width: 100%;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">Location / Place</label>
                            <input type="text" id="emp-place" value="${empData.place || 'Kozhikode, Kerala'}" class="glass-input" style="width: 100%;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">Avatar Photo URL</label>
                            <input type="text" id="emp-photo" value="${empData.photo || ''}" placeholder="https://..." class="glass-input" style="width: 100%; font-size: 0.78rem;">
                        </div>
                    </div>
                </div>

                <!-- SECTION 2: HR Rules, Shift Hours & Overtime Parameters -->
                <div style="border-top: 1px solid var(--glass-border); padding-top: 1.25rem;">
                    <h4 style="margin: 0 0 0.85rem; font-size: 0.92rem; color: #22c55e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                        2. HR Shift & Overtime (OT) Automation
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">Standard Shift Duration</label>
                            <select id="emp-shift-hours" class="glass-input" style="width: 100%;">
                                <option value="8" ${(empData.shiftHours || 8) == 8 ? 'selected' : ''}>8 Hours Shift</option>
                                <option value="9" ${(empData.shiftHours || 8) == 9 ? 'selected' : ''}>9 Hours Shift</option>
                                <option value="10" ${(empData.shiftHours || 8) == 10 ? 'selected' : ''}>10 Hours Shift</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">Reporting Time (Late Arrival Mark)</label>
                            <input type="text" id="emp-reporting-time" value="${empData.reportingTime || '08:30 AM'}" placeholder="08:30 AM" class="glass-input" style="width: 100%;">
                            <span style="font-size: 0.68rem; color: #94a3b8;">Arrival after this is flagged as Late</span>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">Overtime (OT) Hourly Rate (₹)</label>
                            <input type="number" id="emp-ot-rate" value="${empData.overtimeRate || 150}" class="glass-input" style="width: 100%;">
                            <span style="font-size: 0.68rem; color: #4ade80;">Auto-calculated for hours beyond shift</span>
                        </div>
                    </div>
                </div>

                <!-- SECTION 3: Side Menu Permissions Matrix -->
                <div style="border-top: 1px solid var(--glass-border); padding-top: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
                        <div>
                            <h4 style="margin: 0; font-size: 0.92rem; color: #38bdf8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                3. Side Menu Module Permissions Matrix
                            </h4>
                            <p style="margin: 2px 0 0; font-size: 0.76rem; color: #94a3b8;">
                                Set access for each module: <strong>Hidden (No Access)</strong>, <strong>View Only</strong> (read-only, no administrative changes), or <strong>Functional Access</strong> (operate & calculate).
                            </p>
                        </div>
                    </div>

                    <!-- Role Presets 1-Click Bar -->
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; background: rgba(56, 189, 248, 0.08); padding: 0.6rem 0.85rem; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.25);">
                        <span style="font-size: 0.75rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="zap" style="width: 13px; height: 13px;"></i> Apply Preset:
                        </span>
                        <button type="button" class="btn" onclick="window.applyRolePresetInForm('accounts')" style="padding: 2px 8px; font-size: 0.72rem; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border);">Accounts</button>
                        <button type="button" class="btn" onclick="window.applyRolePresetInForm('sales')" style="padding: 2px 8px; font-size: 0.72rem; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border);">Sales</button>
                        <button type="button" class="btn" onclick="window.applyRolePresetInForm('designing')" style="padding: 2px 8px; font-size: 0.72rem; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border);">Designer</button>
                        <button type="button" class="btn" onclick="window.applyRolePresetInForm('supervisor')" style="padding: 2px 8px; font-size: 0.72rem; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border);">Supervisor</button>
                        <button type="button" class="btn" onclick="window.applyRolePresetInForm('production')" style="padding: 2px 8px; font-size: 0.72rem; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border);">Production</button>
                        <button type="button" class="btn" onclick="window.applyRolePresetInForm('fabrication')" style="padding: 2px 8px; font-size: 0.72rem; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border);">Fabrication</button>
                        <button type="button" class="btn" onclick="window.applyRolePresetInForm('painting')" style="padding: 2px 8px; font-size: 0.72rem; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border);">Painting</button>
                        <button type="button" class="btn" onclick="window.applyRolePresetInForm('all_view')" style="padding: 2px 8px; font-size: 0.72rem; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24;">All View-Only</button>
                    </div>

                    <!-- Permissions Table -->
                    <div style="border: 1px solid var(--glass-border); border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.15);">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
                            <thead style="background: rgba(255,255,255,0.04); border-bottom: 1px solid var(--glass-border);">
                                <tr>
                                    <th style="padding: 0.65rem 1rem; text-align: left; color: #cbd5e1;">Side Menu Module</th>
                                    <th style="padding: 0.65rem 0.5rem; text-align: center; color: #94a3b8; width: 110px;">🔴 Hidden</th>
                                    <th style="padding: 0.65rem 0.5rem; text-align: center; color: #fbbf24; width: 130px;">🟡 View Only</th>
                                    <th style="padding: 0.65rem 0.5rem; text-align: center; color: #4ade80; width: 150px;">🟢 Functional</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${CORE_MODULES_LIST.map(mod => {
                                    const curVal = (empData.permissions && empData.permissions[mod.id]) || 'none';
                                    const isHR = mod.id === 'hr';
                                    return `
                                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                                            <td style="padding: 0.55rem 1rem;">
                                                <div style="font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
                                                    <i data-lucide="${mod.icon}" style="width: 14px; height: 14px; color: var(--color-primary);"></i>
                                                    ${mod.name}
                                                    ${isHR ? `<span style="font-size: 0.65rem; background: rgba(34, 197, 94, 0.2); color: #4ade80; padding: 1px 6px; border-radius: 4px;">Mandatory HR</span>` : ''}
                                                </div>
                                                <div style="font-size: 0.7rem; color: #64748b;">${mod.desc}</div>
                                            </td>
                                            <td style="padding: 0.55rem 0.5rem; text-align: center;">
                                                <label style="cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                                    <input type="radio" name="perm_${mod.id}" value="none" ${curVal === 'none' && !isHR ? 'checked' : ''} ${isHR ? 'disabled' : ''} style="accent-color: #ef4444; width: 16px; height: 16px; cursor: pointer;">
                                                </label>
                                            </td>
                                            <td style="padding: 0.55rem 0.5rem; text-align: center;">
                                                <label style="cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                                    <input type="radio" name="perm_${mod.id}" value="view" ${curVal === 'view' ? 'checked' : ''} style="accent-color: #f59e0b; width: 16px; height: 16px; cursor: pointer;">
                                                </label>
                                            </td>
                                            <td style="padding: 0.55rem 0.5rem; text-align: center;">
                                                <label style="cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                                    <input type="radio" name="perm_${mod.id}" value="functional" ${curVal === 'functional' || (isHR && curVal === 'none') ? 'checked' : ''} style="accent-color: #22c55e; width: 16px; height: 16px; cursor: pointer;">
                                                </label>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modal Actions -->
                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid var(--glass-border); padding-top: 1rem; margin-top: 0.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="window.closeEmployeeModal()" style="padding: 0.55rem 1.25rem;">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" style="padding: 0.55rem 1.6rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="check" style="width: 16px; height: 16px;"></i> ${isEdit ? 'Save Changes' : 'Register Employee'}
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.closeEmployeeModal = () => {
    const el = document.getElementById('employee-form-modal');
    if (el) el.remove();
};

window.handleRoleSelectChange = (roleVal) => {
    const deptSelect = document.getElementById('emp-dept');
    if (!deptSelect) return;
    
    // Auto-select matching department
    if (roleVal.includes('Accounts')) deptSelect.value = 'Accounts';
    else if (roleVal.includes('Sales')) deptSelect.value = 'Sales';
    else if (roleVal.includes('CAD') || roleVal.includes('Designer')) deptSelect.value = 'Designing';
    else if (roleVal.includes('Supervisor')) deptSelect.value = 'Supervisor';
    else if (roleVal.includes('Production') || roleVal.includes('Machinery')) deptSelect.value = 'Production';
    else if (roleVal.includes('Fabricat')) deptSelect.value = 'Fabrication';
    else if (roleVal.includes('Paint')) deptSelect.value = 'Painting Section';
};

window.applyRolePresetInForm = (presetKey) => {
    const preset = PRESET_ROLE_CONFIGS[presetKey];
    if (!preset) return;

    if (preset.salary) {
        const salInp = document.getElementById('emp-salary');
        if (salInp) salInp.value = preset.salary;
    }
    if (preset.otRate) {
        const otInp = document.getElementById('emp-ot-rate');
        if (otInp) otInp.value = preset.otRate;
    }

    CORE_MODULES_LIST.forEach(mod => {
        const val = preset.perms[mod.id] || 'none';
        const radio = document.querySelector(`input[name="perm_${mod.id}"][value="${val}"]`);
        if (radio) radio.checked = true;
    });
};

window.saveEmployeeData = (e) => {
    e.preventDefault();
    const store = window.Store || Store;
    if (!store) return;

    const id = document.getElementById('emp-form-id').value;
    const isEdit = document.getElementById('emp-form-is-edit').value === 'true';

    const name = document.getElementById('emp-name').value.trim();
    const roleSelect = document.getElementById('emp-role');
    const role = roleSelect.value === 'Custom' ? 'Team Member' : roleSelect.value;
    const department = document.getElementById('emp-dept').value;
    const phone = document.getElementById('emp-phone').value.trim();
    const email = document.getElementById('emp-email').value.trim();
    const place = document.getElementById('emp-place').value.trim();
    const monthlySalary = parseInt(document.getElementById('emp-salary').value) || 25000;
    const shiftHours = parseInt(document.getElementById('emp-shift-hours').value) || 8;
    const reportingTime = document.getElementById('emp-reporting-time').value.trim() || '08:30 AM';
    const overtimeRate = parseInt(document.getElementById('emp-ot-rate').value) || 150;
    const photo = document.getElementById('emp-photo').value.trim() || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;

    // Collect module permissions
    const permissions = {};
    CORE_MODULES_LIST.forEach(mod => {
        const checked = document.querySelector(`input[name="perm_${mod.id}"]:checked`);
        permissions[mod.id] = checked ? checked.value : 'none';
    });
    // HR is mandatory for employee
    if (permissions.hr === 'none') permissions.hr = 'view';

    if (isEdit) {
        store.updateStaff(id, {
            name,
            role,
            department,
            phone,
            email,
            place,
            monthlySalary,
            shiftHours,
            reportingTime,
            overtimeRate,
            photo,
            permissions
        });
        alert(`Employee ${name} updated successfully!`);
    } else {
        const newEmp = {
            id,
            name,
            role,
            department,
            status: 'Present',
            location: 'Main Facility',
            checkIn: '08:30 AM',
            checkOut: '-',
            photo,
            place,
            phone,
            email,
            monthlySalary,
            shiftHours,
            reportingTime,
            overtimeRate,
            overtimeHours: 0,
            overtime: 0,
            advance: 0,
            presentDays: 1,
            absentDays: 0,
            leaves: 0,
            lateDays: 0,
            joiningDate: new Date().toISOString().split('T')[0],
            permissions,
            attendanceHistory: [
                {
                    date: new Date().toISOString().split('T')[0],
                    checkIn: '08:30 AM',
                    checkOut: '-',
                    status: 'Present',
                    isLate: false,
                    overtimeHours: 0
                }
            ]
        };
        store.addStaff(newEmp);
        alert(`Employee ${name} registered successfully with ID ${id}!`);
    }

    window.closeEmployeeModal();
    if (window.currentSettingsTab === 'employees') {
        store.notify();
    }
};

window.deleteEmployee = (empId) => {
    const store = window.Store || Store;
    if (!store) return;
    const emp = (store.state.staff || []).find(s => s.id === empId);
    const name = emp ? emp.name : empId;

    if (confirm(`Are you sure you want to remove employee ${name} (${empId})?`)) {
        store.deleteStaff(empId);
        alert(`Employee ${name} removed.`);
    }
};

window.switchActiveUser = (userId) => {
    const store = window.Store || Store;
    if (!store) return;

    store.switchUser(userId);
    const active = store.getActiveUser();
    alert(`Switched active user session to: ${active.name} (${active.role})`);
};

window.filterEmployeeDepartment = (dept) => {
    window.employeeFilterDept = dept;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.searchEmployees = (keyword) => {
    window.employeeSearchKeyword = keyword;
    const store = window.Store || Store;
    if (store) store.notify();
};

// ----------------------------------------------------------------------------
// MODAL: ATTENDANCE & OVERTIME LOG DETAILS
// ----------------------------------------------------------------------------

window.openEmployeeAttendanceLog = (empId) => {
    const store = window.Store || Store;
    const staffList = (store && store.state && store.state.staff) || [];
    const emp = staffList.find(s => s.id === empId);
    if (!emp) return alert('Employee not found.');

    const existing = document.getElementById('employee-attendance-modal');
    if (existing) existing.remove();

    const history = emp.attendanceHistory || [
        { date: '2026-10-18', checkIn: emp.checkIn || '08:30 AM', checkOut: emp.checkOut || '05:30 PM', status: 'Present', isLate: false, overtimeHours: 1.5, method: 'Face Scan' },
        { date: '2026-10-17', checkIn: '08:25 AM', checkOut: '06:00 PM', status: 'Present', isLate: false, overtimeHours: 2.0, method: 'Biometric' },
        { date: '2026-10-16', checkIn: '08:45 AM', checkOut: '05:30 PM', status: 'Present', isLate: true, overtimeHours: 0, method: 'Face Scan' }
    ];

    const modal = document.createElement('div');
    modal.id = 'employee-attendance-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; z-index: 100030;
        padding: 1.5rem; overflow-y: auto;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 740px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background: #0b0f17; border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 12px; box-shadow: 0 25px 65px rgba(0,0,0,0.9);">
            <!-- Modal Header -->
            <div style="padding: 1.25rem 1.75rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: rgba(34, 197, 94, 0.05);">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${emp.photo || 'https://via.placeholder.com/50'}" alt="${emp.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #22c55e;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.2rem; color: #f8fafc; font-weight: 700;">${emp.name} &bull; Attendance & OT Log</h3>
                        <p style="margin: 2px 0 0; font-size: 0.76rem; color: #94a3b8;">
                            ${emp.role} &bull; ${emp.department} &bull; Shift: ${emp.shiftHours || 8}h &bull; Reporting: <span style="color: #38bdf8;">${emp.reportingTime || '08:30 AM'}</span>
                        </p>
                    </div>
                </div>
                <button type="button" onclick="window.closeEmployeeAttendanceLogModal()" style="background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 6px;">
                    <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                </button>
            </div>

            <div style="flex: 1; overflow-y: auto; padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                <!-- Summary Stats -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;">
                    <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 0.75rem; text-align: center;">
                        <span style="font-size: 0.7rem; color: #86efac; text-transform: uppercase;">Days Present</span>
                        <div style="font-size: 1.4rem; font-weight: 800; color: #22c55e;">${emp.presentDays || 0}</div>
                    </div>
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 0.75rem; text-align: center;">
                        <span style="font-size: 0.7rem; color: #fca5a5; text-transform: uppercase;">Days Absent</span>
                        <div style="font-size: 1.4rem; font-weight: 800; color: #ef4444;">${emp.absentDays || 0}</div>
                    </div>
                    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 0.75rem; text-align: center;">
                        <span style="font-size: 0.7rem; color: #fde68a; text-transform: uppercase;">Late Arrivals</span>
                        <div style="font-size: 1.4rem; font-weight: 800; color: #f59e0b;">${emp.lateDays || 0}</div>
                    </div>
                    <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 0.75rem; text-align: center;">
                        <span style="font-size: 0.7rem; color: #bae6fd; text-transform: uppercase;">OT Generated</span>
                        <div style="font-size: 1.3rem; font-weight: 800; color: #38bdf8;">${(emp.overtimeHours || 0).toFixed(1)}h</div>
                        <span style="font-size: 0.68rem; color: #4ade80;">₹${(emp.overtime || 0).toLocaleString()}</span>
                    </div>
                </div>

                <!-- Add Overtime Quick Form -->
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 1rem;">
                    <h4 style="margin: 0 0 0.65rem; font-size: 0.88rem; color: #f8fafc; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                        <i data-lucide="plus-circle" style="width: 15px; height: 15px; color: #38bdf8;"></i> Log Additional Overtime (OT)
                    </h4>
                    <form onsubmit="window.submitEmployeeOT(event, '${emp.id}')" style="display: grid; grid-template-columns: 1fr 1fr 2fr auto; gap: 0.65rem; align-items: flex-end;">
                        <div>
                            <label style="display: block; font-size: 0.72rem; color: #94a3b8; margin-bottom: 2px;">OT Hours</label>
                            <input type="number" id="manual-ot-hours" step="0.5" min="0.5" max="12" required value="2.0" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 0.4rem 0.6rem;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.72rem; color: #94a3b8; margin-bottom: 2px;">OT Rate (₹/hr)</label>
                            <input type="number" id="manual-ot-rate" value="${emp.overtimeRate || 150}" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 0.4rem 0.6rem;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.72rem; color: #94a3b8; margin-bottom: 2px;">Reason / Job Description</label>
                            <input type="text" id="manual-ot-reason" placeholder="e.g. Late shift for urgent site delivery" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 0.4rem 0.6rem;">
                        </div>
                        <button type="submit" class="btn btn-primary" style="padding: 0.45rem 1rem; font-size: 0.82rem; font-weight: 600;">
                            Add OT
                        </button>
                    </form>
                </div>

                <!-- History Log Table -->
                <div>
                    <h4 style="margin: 0 0 0.65rem; font-size: 0.88rem; color: #f8fafc; font-weight: 600;">Daily Attendance & Shift History</h4>
                    <div style="border: 1px solid var(--glass-border); border-radius: 8px; overflow: hidden;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
                            <thead style="background: rgba(255,255,255,0.04); border-bottom: 1px solid var(--glass-border);">
                                <tr>
                                    <th style="padding: 0.55rem 0.85rem; text-align: left; color: #94a3b8;">Date</th>
                                    <th style="padding: 0.55rem 0.85rem; text-align: left; color: #94a3b8;">Check-In</th>
                                    <th style="padding: 0.55rem 0.85rem; text-align: left; color: #94a3b8;">Check-Out</th>
                                    <th style="padding: 0.55rem 0.85rem; text-align: left; color: #94a3b8;">Status</th>
                                    <th style="padding: 0.55rem 0.85rem; text-align: right; color: #94a3b8;">OT Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.map(row => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                                        <td style="padding: 0.55rem 0.85rem; font-weight: 600; color: #f8fafc;">${row.date}</td>
                                        <td style="padding: 0.55rem 0.85rem; color: #cbd5e1;">
                                            ${row.checkIn || '-'}
                                            ${row.isLate ? `<span style="font-size: 0.68rem; background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 1px 5px; border-radius: 4px; margin-left: 4px;">Late</span>` : ''}
                                        </td>
                                        <td style="padding: 0.55rem 0.85rem; color: #cbd5e1;">${row.checkOut || '-'}</td>
                                        <td style="padding: 0.55rem 0.85rem;">
                                            <span style="font-size: 0.72rem; padding: 1px 7px; border-radius: 9999px; background: ${row.status === 'Present' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${row.status === 'Present' ? '#4ade80' : '#f87171'};">
                                                ${row.status}
                                            </span>
                                        </td>
                                        <td style="padding: 0.55rem 0.85rem; text-align: right; font-weight: 700; color: ${(row.overtimeHours || 0) > 0 ? '#4ade80' : '#64748b'};">
                                            ${(row.overtimeHours || 0) > 0 ? `+${row.overtimeHours}h` : '-'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div style="padding: 1rem 1.75rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="window.closeEmployeeAttendanceLogModal()" style="padding: 0.45rem 1.25rem;">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.closeEmployeeAttendanceLogModal = () => {
    const el = document.getElementById('employee-attendance-modal');
    if (el) el.remove();
};

window.submitEmployeeOT = (e, empId) => {
    e.preventDefault();
    const hours = parseFloat(document.getElementById('manual-ot-hours').value) || 0;
    const rate = parseInt(document.getElementById('manual-ot-rate').value) || 150;
    const reason = document.getElementById('manual-ot-reason').value.trim() || 'Manual OT approval';

    const store = window.Store || Store;
    if (store && typeof store.logStaffOvertime === 'function') {
        store.logStaffOvertime(empId, hours, reason);
        alert(`Successfully logged ${hours} hours Overtime (+₹${Math.round(hours * rate)})!`);
        window.openEmployeeAttendanceLog(empId);
    }
};

'''

code = code + helpers_code

with open(settings_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Successfully injected employee management module into settings.js!")
