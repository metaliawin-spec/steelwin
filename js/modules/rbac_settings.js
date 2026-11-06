import { Store, DEFAULT_RBAC_CONFIG } from '../store.js';

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) PERMISSION MATRIX & ADMIN MANAGEMENT MODULE
// ============================================================================

export function renderRolesAccessRestrictedHTML(activeUser) {
    return `
        <div class="glass-panel animate-fade-in" style="padding: 3.5rem 2rem; text-align: center; max-width: 640px; margin: 3rem auto; border: 1.5px solid rgba(239, 68, 68, 0.4); border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 2px solid rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; color: #ef4444; margin: 0 auto 1.25rem;">
                <i data-lucide="shield-alert" style="width: 32px; height: 32px;"></i>
            </div>
            <h2 style="color: #f8fafc; font-size: 1.45rem; font-weight: 700; margin-bottom: 0.5rem;">Access Restricted: Super Administrator Only</h2>
            <p style="color: #94a3b8; font-size: 0.92rem; margin-bottom: 1.5rem; line-height: 1.55;">
                The <strong>Role Permissions & Access Control Matrix</strong> governs system-wide security, CRUD privileges, and data scope isolation.
                <br>Your active account <strong style="color: #f8fafc;">${activeUser.name}</strong> (${activeUser.role}) is restricted from altering role permissions.
            </p>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.8rem; color: #cbd5e1;">
                Security Policy: Only the <strong>Super Administrator</strong> (#SB-9901) can grant, modify, or revoke module CRUD privileges.
            </div>
            <div style="display: flex; justify-content: center; gap: 0.85rem; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="window.switchActiveUser('admin')" style="padding: 0.6rem 1.25rem;">
                    <i data-lucide="shield" style="width: 16px; height: 16px; margin-right: 6px;"></i> Return to Super Admin
                </button>
                <button class="btn btn-secondary" onclick="window.switchSettingsTab('profile')" style="padding: 0.6rem 1.25rem;">
                    My Profile
                </button>
            </div>
        </div>
    `;
}

export function renderEmployeeAccessProvisioningView(state, activeUser) {
    const store = window.Store || Store;
    const staffList = (store.state && store.state.staff) || [];
    const rbac = (store.state && store.state.rbac) || DEFAULT_RBAC_CONFIG;
    const roles = rbac.roles || DEFAULT_RBAC_CONFIG.roles;
    const userOverrides = rbac.userOverrides || {};
    const auditLogs = rbac.auditLogs || [];

    if (!window.rbacEmployeeFilter) window.rbacEmployeeFilter = 'all';

    // Pending vs Provisioned Counts
    const pendingList = staffList.filter(s => s.status === 'pending_provisioning' || s.provisioningStatus === 'pending_provisioning' || !s.hasLogin);
    const provisionedList = staffList.filter(s => s.status === 'provisioned' || s.provisioningStatus === 'provisioned' || s.hasLogin);

    // Selected Employee
    let selectedEmpId = window.rbacSelectedEmployeeId;
    let selectedEmp = staffList.find(s => s.id === selectedEmpId);
    if (!selectedEmp) {
        selectedEmp = pendingList[0] || staffList[0] || { id: 'EMP-103', name: 'Employee', role: 'Glazing Specialist' };
        selectedEmpId = selectedEmp.id;
        window.rbacSelectedEmployeeId = selectedEmpId;
    }

    const isPending = selectedEmp.status === 'pending_provisioning' || selectedEmp.provisioningStatus === 'pending_provisioning' || !selectedEmp.hasLogin;

    // Filter staff list based on filter pill
    const filteredStaff = staffList.filter(s => {
        if (window.rbacEmployeeFilter === 'pending') {
            return s.status === 'pending_provisioning' || s.provisioningStatus === 'pending_provisioning' || !s.hasLogin;
        }
        if (window.rbacEmployeeFilter === 'provisioned') {
            return s.status === 'provisioned' || s.provisioningStatus === 'provisioned' || s.hasLogin;
        }
        return true;
    });

    // The 8 Canonical Sidebar Modules from HR.md requirement 2.3:
    // Dashboard, Leads, Quotations, BOM, Accounts, Inventory, Production, HR
    const sidebarModules = [
        { id: 'dashboard', name: 'Dashboard', category: 'Core', icon: 'layout-dashboard', desc: 'KPI metric tiles, real-time revenue analytics & system status' },
        { id: 'leads', name: 'Leads & CRM', category: 'Commercial', icon: 'users', desc: 'Meta Lead Ads webhook pipeline, customer contact records & stage tracker' },
        { id: 'quotations', name: 'Quotations', category: 'Commercial', icon: 'file-text', desc: 'Commercial proposals, item pricing, PDF generator & export' },
        { id: 'bom', name: 'BOM / Window & Door Calculation', category: 'Engineering', icon: 'calculator', desc: 'Parametric window aperture sizing, 1/2/3-Kalli partitions, profile cutting lists' },
        { id: 'accounts', name: 'Accounts & Invoicing', category: 'Finance', icon: 'receipt', desc: 'Sales invoices, payment receipts, GST ledgers & cash book' },
        { id: 'inventory', name: 'Inventory & Raw Stock', category: 'Operations', icon: 'boxes', desc: 'Raw steel/aluminum extrusions, glass panes, friction stays & hardware' },
        { id: 'production', name: 'Production & Fabrication', category: 'Operations', icon: 'factory', desc: 'Factory job orders, cutting, welding, powder coating & QC inspection' },
        { id: 'hr', name: 'HR & Workforce', category: 'Administration', icon: 'user-check', desc: 'Employee onboarding, biometric shifts, payroll sheets & advance tracking' }
    ];

    // Current permissions for this employee:
    const savedPerms = userOverrides[selectedEmp.id] || selectedEmp.permissions || {};

    const resolveInitialModulePerm = (modId, roleStr) => {
        if (savedPerms[modId]) {
            const p = savedPerms[modId];
            if (typeof p === 'object') {
                return {
                    view: p.view !== false,
                    create: !!p.create || !!p.functional,
                    read: p.read !== false,
                    update: !!p.update || !!p.functional,
                    delete: !!p.delete,
                    scope: p.scope || 'all'
                };
            } else if (p === 'functional' || p === 'full') {
                return { view: true, create: true, read: true, update: true, delete: false, scope: 'all' };
            } else if (p === 'view') {
                return { view: true, create: false, read: true, update: false, delete: false, scope: 'all' };
            } else {
                return { view: false, create: false, read: false, update: false, delete: false, scope: 'none' };
            }
        }

        const roleLower = (roleStr || '').toLowerCase();
        if (modId === 'dashboard') {
            return { view: true, create: false, read: true, update: false, delete: false, scope: 'all' };
        }
        if (roleLower.includes('account')) {
            if (['accounts', 'quotations'].includes(modId)) return { view: true, create: true, read: true, update: true, delete: false, scope: 'all' };
            if (['dashboard', 'inventory'].includes(modId)) return { view: true, create: false, read: true, update: false, delete: false, scope: 'all' };
            return { view: false, create: false, read: false, update: false, delete: false, scope: 'none' };
        }
        if (roleLower.includes('sale')) {
            if (['leads', 'quotations'].includes(modId)) return { view: true, create: true, read: true, update: true, delete: false, scope: 'all' };
            if (['dashboard', 'bom'].includes(modId)) return { view: true, create: false, read: true, update: false, delete: false, scope: 'all' };
            return { view: false, create: false, read: false, update: false, delete: false, scope: 'none' };
        }
        if (roleLower.includes('fab') || roleLower.includes('prod') || roleLower.includes('glaz') || roleLower.includes('design')) {
            if (['bom', 'production'].includes(modId)) return { view: true, create: true, read: true, update: true, delete: false, scope: 'all' };
            if (['dashboard', 'inventory'].includes(modId)) return { view: true, create: false, read: true, update: false, delete: false, scope: 'all' };
            return { view: false, create: false, read: false, update: false, delete: false, scope: 'none' };
        }
        return { view: ['dashboard', 'production'].includes(modId), create: false, read: ['dashboard', 'production'].includes(modId), update: false, delete: false, scope: 'all' };
    };

    const totalEmpCount = staffList.length;
    const pendingCount = pendingList.length;
    const provisionedCount = provisionedList.length;

    return `
        <div class="glass-panel animate-fade-in rbac-matrix-container" style="padding: 1.75rem 2rem; margin-bottom: 2rem;">
            
            <!-- 1. HEADER WITH STATS & ACTION CONTROLS -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                        <h2 style="margin: 0; font-size: 1.45rem; color: #f8fafc; font-weight: 700; letter-spacing: -0.3px;">
                            Role Permissions & Access Control Matrix
                        </h2>
                        <span style="font-size: 0.72rem; background: linear-gradient(135deg, #0284c7, #2563eb); color: white; padding: 2px 10px; border-radius: 9999px; font-weight: 700; letter-spacing: 0.4px;">
                            ENTERPRISE RBAC
                        </span>
                        <span style="font-size: 0.72rem; background: rgba(34, 197, 94, 0.15); color: #34d399; border: 1px solid rgba(34, 197, 94, 0.35); padding: 2px 9px; border-radius: 9999px; font-weight: 600;">
                            Live Synced
                        </span>
                    </div>
                    <p style="color: var(--color-text-muted); margin: 4px 0 0; font-size: 0.85rem; line-height: 1.4;">
                        Step 2: Admin Role Permissions &amp; System Credential Provisioning for HR-Registered Employees.
                    </p>
                </div>

                <!-- Action Toolbar -->
                <div style="display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center;">
                    <button type="button" class="btn btn-secondary" onclick="window.openRbacAuditModal()" style="font-size: 0.8rem; padding: 0.5rem 0.9rem; display: inline-flex; align-items: center; gap: 5px;" title="View security audit trail">
                        <i data-lucide="history" style="width: 14px; height: 14px;"></i> Audit Trail (${auditLogs.length})
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="window.openRbacSchemaModal()" style="font-size: 0.8rem; padding: 0.5rem 0.9rem; display: inline-flex; align-items: center; gap: 5px;" title="View Database SQL Schema">
                        <i data-lucide="database" style="width: 14px; height: 14px; color: #38bdf8;"></i> SQL DDL Schema
                    </button>
                    <button type="button" id="btn-top-provision" class="btn btn-primary" onclick="window.triggerEmployeeProvisioning('${selectedEmp.id}')" style="font-size: 0.84rem; padding: 0.55rem 1.35rem; display: inline-flex; align-items: center; gap: 6px; font-weight: 700; background: linear-gradient(135deg, #0284c7, #2563eb); border: none; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.45);">
                        <i data-lucide="key" style="width: 15px; height: 15px;"></i> ${isPending ? 'Register Employee / Generate Login' : 'Update Access & Credentials'}
                    </button>
                </div>
            </div>

            <!-- 2. MODE SELECTOR (System Roles vs User Overrides vs Employee Access) -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div style="display: inline-flex; background: rgba(0,0,0,0.35); padding: 4px; border-radius: 10px; border: 1px solid var(--glass-border);">
                    <button type="button" id="tab-mode-role" onclick="window.switchRbacMode('role')" 
                        style="padding: 0.45rem 1.1rem; font-size: 0.82rem; font-weight: 600; border: none; border-radius: 7px; cursor: pointer; transition: all 0.2s;
                        background: transparent; color: var(--color-text-muted);">
                        🏢 System Roles (${roles.length})
                    </button>
                    <button type="button" id="tab-mode-user" onclick="window.switchRbacMode('user')" 
                        style="padding: 0.45rem 1.1rem; font-size: 0.82rem; font-weight: 600; border: none; border-radius: 7px; cursor: pointer; transition: all 0.2s;
                        background: transparent; color: var(--color-text-muted);">
                        👤 User Overrides
                    </button>
                    <button type="button" id="tab-mode-employee-access" onclick="window.switchRbacMode('employee_access')" 
                        style="padding: 0.45rem 1.1rem; font-size: 0.82rem; font-weight: 700; border: none; border-radius: 7px; cursor: pointer; transition: all 0.2s;
                        background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; box-shadow: 0 2px 10px rgba(2, 132, 199, 0.45);">
                        🔑 Employee Access &amp; Provisioning
                    </button>
                </div>

                <!-- KPI Metric Pills -->
                <div style="display: flex; gap: 0.65rem; font-size: 0.78rem;">
                    <span style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); padding: 4px 10px; border-radius: 6px; font-weight: 600;">
                        👥 Total HR Staff: <strong>${totalEmpCount}</strong>
                    </span>
                    <span style="background: ${pendingCount > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)'}; color: ${pendingCount > 0 ? '#fbbf24' : '#94a3b8'}; border: 1px solid ${pendingCount > 0 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(255,255,255,0.1)'}; padding: 4px 10px; border-radius: 6px; font-weight: 700; ${pendingCount > 0 ? 'box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);' : ''}">
                        ⏳ Pending Provisioning: <strong>${pendingCount}</strong>
                    </span>
                    <span style="background: rgba(52, 211, 153, 0.12); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.25); padding: 4px 10px; border-radius: 6px; font-weight: 600;">
                        🟢 Active Logins: <strong>${provisionedCount}</strong>
                    </span>
                </div>
            </div>

            <!-- 3. EMPLOYEE SELECTOR (Step 2 - Requirement 2.1) -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1.15rem 1.35rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <span style="width: 28px; height: 28px; border-radius: 6px; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                            <i data-lucide="user-check" style="width: 16px; height: 16px;"></i>
                        </span>
                        <label for="rbac-employee-select" style="font-size: 0.92rem; font-weight: 700; color: #f8fafc;">
                            Select HR-Registered Employee for Provisioning:
                        </label>
                    </div>

                    <!-- Filter Pills -->
                    <div style="display: flex; gap: 0.4rem; font-size: 0.74rem;">
                        <button type="button" onclick="window.setRbacEmployeeFilter('all')" 
                            style="padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer; transition: all 0.2s;
                            border: 1px solid ${window.rbacEmployeeFilter === 'all' ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)'};
                            background: ${window.rbacEmployeeFilter === 'all' ? 'var(--color-primary-glow)' : 'transparent'};
                            color: ${window.rbacEmployeeFilter === 'all' ? '#38bdf8' : 'var(--color-text-muted)'}; font-weight: 600;">
                            All Employees (${totalEmpCount})
                        </button>
                        <button type="button" onclick="window.setRbacEmployeeFilter('pending')" 
                            style="padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer; transition: all 0.2s;
                            border: 1px solid ${window.rbacEmployeeFilter === 'pending' ? '#fbbf24' : 'rgba(255,255,255,0.08)'};
                            background: ${window.rbacEmployeeFilter === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'transparent'};
                            color: ${window.rbacEmployeeFilter === 'pending' ? '#fbbf24' : 'var(--color-text-muted)'}; font-weight: 600;">
                            ⏳ Pending (${pendingCount})
                        </button>
                        <button type="button" onclick="window.setRbacEmployeeFilter('provisioned')" 
                            style="padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer; transition: all 0.2s;
                            border: 1px solid ${window.rbacEmployeeFilter === 'provisioned' ? '#34d399' : 'rgba(255,255,255,0.08)'};
                            background: ${window.rbacEmployeeFilter === 'provisioned' ? 'rgba(52, 211, 153, 0.2)' : 'transparent'};
                            color: ${window.rbacEmployeeFilter === 'provisioned' ? '#34d399' : 'var(--color-text-muted)'}; font-weight: 600;">
                            🟢 Provisioned (${provisionedCount})
                        </button>
                    </div>
                </div>

                <div style="position: relative;">
                    <select id="rbac-employee-select" onchange="window.switchRbacSelectedEmployee(this.value)" class="glass-input" style="width: 100%; padding: 0.75rem 1rem; font-size: 0.92rem; font-weight: 600; border-radius: 8px; border-color: rgba(56, 189, 248, 0.4); background: #0f172a; color: #f8fafc; cursor: pointer;">
                        ${filteredStaff.map(emp => {
                            const empPending = emp.status === 'pending_provisioning' || emp.provisioningStatus === 'pending_provisioning' || !emp.hasLogin;
                            const isSelected = emp.id === selectedEmpId;
                            return `
                                <option value="${emp.id}" ${isSelected ? 'selected' : ''}>
                                    ${empPending ? '⏳ [PENDING APPROVAL]' : '🟢 [ACTIVE LOGIN]'} ${emp.name} (#${emp.id}) — ${emp.role} ${emp.username ? '(@' + emp.username + ')' : ''}
                                </option>
                            `;
                        }).join('')}
                    </select>
                </div>
            </div>

            <!-- 4. SELECTED EMPLOYEE INFO CARD (Step 2 - Requirement 2.2) -->
            <div id="selected-employee-info-card" style="background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1.5px solid ${isPending ? 'rgba(245, 158, 11, 0.4)' : 'rgba(52, 211, 153, 0.35)'}; border-left: 5px solid ${isPending ? '#fbbf24' : '#34d399'}; border-radius: 12px; padding: 1.35rem 1.6rem; margin-bottom: 1.75rem; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                
                <!-- Provisioning Status Banner -->
                <div style="background: ${isPending ? 'rgba(245, 158, 11, 0.12)' : 'rgba(52, 211, 153, 0.12)'}; border: 1px solid ${isPending ? 'rgba(245, 158, 11, 0.35)' : 'rgba(52, 211, 153, 0.35)'}; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <i data-lucide="${isPending ? 'shield-alert' : 'shield-check'}" style="width: 20px; height: 20px; color: ${isPending ? '#fbbf24' : '#34d399'};"></i>
                        <span style="font-size: 0.84rem; color: #f8fafc; line-height: 1.4;">
                            ${isPending 
                                ? '<strong>Status: Pending Provisioning</strong> — Employee profile registered in HR. System login is NOT active yet. Configure the 8 sidebar module permissions below and click <strong>Register Employee / Generate Login</strong>.'
                                : `<strong>Status: Provisioned &amp; Active</strong> — System Login is live. Username: <code style="color: #38bdf8; font-weight: 700; background: rgba(56, 189, 248, 0.15); padding: 2px 7px; border-radius: 4px;">${selectedEmp.username || (selectedEmp.name.toLowerCase().replace(/[^a-z0-9]/g, '') + (selectedEmp.phone || '').replace(/\D/g, '').slice(-4))}</code>`
                            }
                        </span>
                    </div>
                    <span style="font-size: 0.72rem; padding: 3px 10px; border-radius: 9999px; font-weight: 700; background: ${isPending ? 'rgba(245, 158, 11, 0.25)' : 'rgba(52, 211, 153, 0.25)'}; color: ${isPending ? '#fbbf24' : '#34d399'}; border: 1px solid ${isPending ? 'rgba(245, 158, 11, 0.5)' : 'rgba(52, 211, 153, 0.5)'};">
                        ${isPending ? '⏳ AWAITING CREDENTIALS' : '🟢 ACTIVE LOGIN ACCOUNT'}
                    </span>
                </div>

                <!-- Profile Header & 6 Registered Fields -->
                <div style="display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap;">
                    <!-- Avatar with Camera/Photo Preview -->
                    <div style="position: relative; flex-shrink: 0;">
                        <img src="${selectedEmp.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}" alt="${selectedEmp.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid ${isPending ? '#fbbf24' : '#38bdf8'}; box-shadow: 0 0 20px ${isPending ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.35)'};">
                        <span style="position: absolute; bottom: 0; right: 0; width: 22px; height: 22px; border-radius: 50%; background: ${isPending ? '#fbbf24' : '#22c55e'}; border: 2px solid #0f172a; display: flex; align-items: center; justify-content: center; color: #000; font-size: 0.65rem; font-weight: 800;">
                            ${isPending ? '!' : '✓'}
                        </span>
                    </div>

                    <!-- Profile Metadata Grid -->
                    <div style="flex: 1; min-width: 280px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                                    <h3 style="margin: 0; font-size: 1.35rem; color: #f8fafc; font-weight: 800;">${selectedEmp.name}</h3>
                                    <span style="font-family: monospace; font-size: 0.74rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 4px; font-weight: 700;">
                                        #${selectedEmp.id}
                                    </span>
                                    <span style="font-size: 0.74rem; background: rgba(168, 85, 247, 0.18); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.35); padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                                        ${selectedEmp.role}
                                    </span>
                                </div>
                                <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 3px;">
                                    Department: <strong style="color: #cbd5e1;">${selectedEmp.department || 'Operations'}</strong>
                                </div>
                            </div>
                        </div>

                        <!-- 6 Step-1 Registered Profile Fields -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; font-size: 0.82rem; background: rgba(0,0,0,0.25); padding: 0.95rem 1.15rem; border-radius: 10px; border: 1px solid var(--glass-border);">
                            <div>
                                <span style="color: #94a3b8; display: block; font-size: 0.72rem; margin-bottom: 2px;">Phone Number</span>
                                <strong style="color: #f8fafc; font-family: monospace;">${selectedEmp.phone}</strong>
                            </div>
                            <div>
                                <span style="color: #94a3b8; display: block; font-size: 0.72rem; margin-bottom: 2px;">Email Address</span>
                                <span style="color: #cbd5e1;">${selectedEmp.email || 'None provided'}</span>
                            </div>
                            <div>
                                <span style="color: #94a3b8; display: block; font-size: 0.72rem; margin-bottom: 2px;">Location / Address</span>
                                <span style="color: #cbd5e1;">${selectedEmp.address || selectedEmp.place || selectedEmp.location || 'Kozhikode, Kerala'}</span>
                            </div>
                            <div>
                                <span style="color: #94a3b8; display: block; font-size: 0.72rem; margin-bottom: 2px;">Monthly Salary</span>
                                <strong style="color: #4ade80;">₹${(selectedEmp.monthlySalary || selectedEmp.salary || 0).toLocaleString()}</strong>
                            </div>
                            <div>
                                <span style="color: #94a3b8; display: block; font-size: 0.72rem; margin-bottom: 2px;">Assigned Shift (Timings)</span>
                                <span style="color: #cbd5e1;">${selectedEmp.shift || (selectedEmp.reportingTime ? selectedEmp.reportingTime + ' (8 hrs)' : '08:30 AM - 05:30 PM (8 hrs)')}</span>
                            </div>
                            <div>
                                <span style="color: #94a3b8; display: block; font-size: 0.72rem; margin-bottom: 2px;">Overtime Rate</span>
                                <strong style="color: #fbbf24;">₹${selectedEmp.overtimeRate || 150} / hr</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 5. MODULE PERMISSION MATRIX (Step 2 - Requirement 2.3) -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                    <h3 style="margin: 0; font-size: 1.15rem; color: #f8fafc; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="shield" style="width: 18px; height: 18px; color: #38bdf8;"></i> 8-Module Sidebar Permission Matrix
                    </h3>
                    <p style="margin: 2px 0 0; font-size: 0.8rem; color: #94a3b8;">
                        Configure View/Hide visibility and CRUD operational functionalities for each sidebar module.
                    </p>
                </div>

                <!-- Quick Presets -->
                <div style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
                    <button type="button" onclick="window.applyEmployeeRbacPreset('full')" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.74rem;">
                        ⚡ Grant All Modules
                    </button>
                    <button type="button" onclick="window.applyEmployeeRbacPreset('viewonly')" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.74rem;">
                        👁️ View Only All
                    </button>
                    <button type="button" onclick="window.applyEmployeeRbacPreset('role')" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.74rem; color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);">
                        👔 Role Preset (${selectedEmp.role})
                    </button>
                    <button type="button" onclick="window.applyEmployeeRbacPreset('revoke')" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.74rem; color: #f87171;">
                        ❌ Revoke All
                    </button>
                </div>
            </div>

            <!-- Permission Matrix Table -->
            <div style="border: 1px solid var(--glass-border); border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.25); margin-bottom: 1.75rem;">
                <table class="rbac-matrix-table" style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
                    <thead style="background: rgba(255,255,255,0.04); border-bottom: 1px solid var(--glass-border);">
                        <tr>
                            <th style="padding: 0.85rem 1rem; font-weight: 700; color: #f8fafc; width: 280px;">Sidebar Module</th>
                            <th style="padding: 0.85rem 0.75rem; font-weight: 700; color: #f8fafc; text-align: center; width: 110px;">
                                Visibility (View)
                            </th>
                            <th style="padding: 0.85rem 0.65rem; font-weight: 700; color: #f8fafc; text-align: center; width: 65px;" title="Create new records">
                                Create (C)
                            </th>
                            <th style="padding: 0.85rem 0.65rem; font-weight: 700; color: #f8fafc; text-align: center; width: 65px;" title="Read & view detailed records">
                                Read (R)
                            </th>
                            <th style="padding: 0.85rem 0.65rem; font-weight: 700; color: #f8fafc; text-align: center; width: 65px;" title="Update & edit existing records">
                                Update (U)
                            </th>
                            <th style="padding: 0.85rem 0.65rem; font-weight: 700; color: #f8fafc; text-align: center; width: 65px;" title="Delete & destroy records">
                                Delete (D)
                            </th>
                            <th style="padding: 0.85rem 0.85rem; font-weight: 700; color: #f8fafc; width: 160px;">
                                Data Scope
                            </th>
                            <th style="padding: 0.85rem 1rem; font-weight: 700; color: #f8fafc; text-align: right; width: 130px;">
                                Access Level
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sidebarModules.map(mod => {
                            const p = resolveInitialModulePerm(mod.id, selectedEmp.role);
                            const isView = !!p.view;
                            const isCreate = !!p.create;
                            const isRead = !!p.read;
                            const isUpdate = !!p.update;
                            const isDelete = !!p.delete;
                            const scope = p.scope || (isView ? 'all' : 'none');

                            // Status badge
                            let badgeLabel = 'No Access';
                            let badgeStyle = 'background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25);';
                            if (isView && isCreate && isRead && isUpdate && isDelete) {
                                badgeLabel = 'Full CRUD';
                                badgeStyle = 'background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); font-weight: 700;';
                            } else if (isView && (isCreate || isUpdate)) {
                                badgeLabel = 'Functional';
                                badgeStyle = 'background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.35); font-weight: 600;';
                            } else if (isView && isRead) {
                                badgeLabel = 'View Only';
                                badgeStyle = 'background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);';
                            }

                            const catColors = {
                                'Core': '#38bdf8',
                                'Commercial': '#4ade80',
                                'Engineering': '#60a5fa',
                                'Finance': '#c084fc',
                                'Operations': '#fbbf24',
                                'Administration': '#f43f5e'
                            };
                            const catColor = catColors[mod.category] || '#94a3b8';

                            return `
                                <tr class="rbac-emp-row ${!isView ? 'rbac-row-disabled' : ''}" id="rbac-emp-row-${mod.id}" style="border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                    <!-- Module Identity -->
                                    <td style="padding: 0.85rem 1rem;">
                                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                                            <div style="width: 34px; height: 34px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; color: ${catColor}; flex-shrink: 0;">
                                                <i data-lucide="${mod.icon}" style="width: 17px; height: 17px;"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 700; color: #f8fafc; font-size: 0.88rem;">${mod.name}</div>
                                                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                                                    <span style="font-size: 0.68rem; padding: 1px 6px; border-radius: 4px; background: ${catColor}18; color: ${catColor}; font-weight: 600;">
                                                        ${mod.category}
                                                    </span>
                                                    <span style="font-size: 0.72rem; color: #64748b;">${mod.desc}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <!-- Visibility View/Hide Switch -->
                                    <td style="padding: 0.85rem 0.75rem; text-align: center;">
                                        <label style="position: relative; display: inline-block; width: 38px; height: 22px; cursor: pointer;">
                                            <input type="checkbox" id="perm-emp-view-${mod.id}" ${isView ? 'checked' : ''} onchange="window.toggleEmployeeModuleView('${mod.id}', this.checked)" style="opacity: 0; width: 0; height: 0;">
                                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isView ? '#0284c7' : 'rgba(255,255,255,0.12)'}; transition: .25s; border-radius: 20px;">
                                                <span style="position: absolute; height: 16px; width: 16px; left: ${isView ? '19px' : '3px'}; bottom: 3px; background-color: white; transition: .25s; border-radius: 50%;"></span>
                                            </span>
                                        </label>
                                    </td>

                                    <!-- Create (C) -->
                                    <td style="padding: 0.85rem 0.65rem; text-align: center;">
                                        <input type="checkbox" id="perm-emp-c-${mod.id}" ${isCreate ? 'checked' : ''} ${!isView ? 'disabled' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--color-primary); opacity: ${isView ? '1' : '0.3'};">
                                    </td>

                                    <!-- Read (R) -->
                                    <td style="padding: 0.85rem 0.65rem; text-align: center;">
                                        <input type="checkbox" id="perm-emp-r-${mod.id}" ${isRead ? 'checked' : ''} ${!isView ? 'disabled' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--color-primary); opacity: ${isView ? '1' : '0.3'};">
                                    </td>

                                    <!-- Update (U) -->
                                    <td style="padding: 0.85rem 0.65rem; text-align: center;">
                                        <input type="checkbox" id="perm-emp-u-${mod.id}" ${isUpdate ? 'checked' : ''} ${!isView ? 'disabled' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--color-primary); opacity: ${isView ? '1' : '0.3'};">
                                    </td>

                                    <!-- Delete (D) -->
                                    <td style="padding: 0.85rem 0.65rem; text-align: center;">
                                        <input type="checkbox" id="perm-emp-d-${mod.id}" ${isDelete ? 'checked' : ''} ${!isView ? 'disabled' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: #ef4444; opacity: ${isView ? '1' : '0.3'};">
                                    </td>

                                    <!-- Data Scope -->
                                    <td style="padding: 0.85rem 0.85rem;">
                                        <select id="perm-emp-scope-${mod.id}" class="glass-input" ${!isView ? 'disabled' : ''} style="padding: 0.35rem 0.6rem; font-size: 0.78rem; border-radius: 6px; width: 100%; opacity: ${isView ? '1' : '0.4'};">
                                            <option value="all" ${scope === 'all' ? 'selected' : ''}>🏢 All Company</option>
                                            <option value="department" ${scope === 'department' ? 'selected' : ''}>🏬 Department</option>
                                            <option value="own" ${scope === 'own' ? 'selected' : ''}>👤 Own Records</option>
                                            <option value="none" ${scope === 'none' ? 'selected' : ''}>🚫 Restricted</option>
                                        </select>
                                    </td>

                                    <!-- Effective Status Badge -->
                                    <td style="padding: 0.85rem 1rem; text-align: right;">
                                        <span id="badge-emp-status-${mod.id}" style="font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; white-space: nowrap; ${badgeStyle}">
                                            ${badgeLabel}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- 6. ACTION FOOTER (Step 2 - Requirement 2.4 & Automatic Credential Generation Engine) -->
            <div style="background: linear-gradient(135deg, rgba(2, 132, 199, 0.1), rgba(37, 99, 235, 0.05)); border: 1.5px solid rgba(56, 189, 248, 0.35); border-radius: 12px; padding: 1.25rem 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <div style="font-size: 0.95rem; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="sparkles" style="width: 17px; height: 17px; color: #38bdf8;"></i>
                        Automatic Credential Generation Engine
                    </div>
                    <div style="font-size: 0.78rem; color: #cbd5e1; margin-top: 3px; line-height: 1.45;">
                        Username: <code style="color: #38bdf8; font-weight: 700;">[name][phone_last4]</code> &bull; Password: <code style="color: #4ade80; font-weight: 700;">STY[3-digits]</code> &bull; Stored securely via Bcrypt hashing.
                    </div>
                </div>

                <div style="display: flex; gap: 0.75rem; align-items: center;">
                    <button type="button" class="btn btn-secondary" onclick="window.applyEmployeeRbacPreset('role')" style="padding: 0.65rem 1.15rem; font-size: 0.85rem;">
                        Reset to Role Preset
                    </button>
                    <button type="button" id="btn-provision-employee" class="btn btn-primary" onclick="window.triggerEmployeeProvisioning('${selectedEmp.id}')" style="display: inline-flex; align-items: center; gap: 8px; padding: 0.7rem 1.85rem; font-size: 0.92rem; font-weight: 800; background: linear-gradient(135deg, #0284c7, #2563eb); border: none; box-shadow: 0 4px 20px rgba(2, 132, 199, 0.5); cursor: pointer;">
                        <i data-lucide="key" style="width: 17px; height: 17px;"></i> ${isPending ? 'Register Employee / Generate Login' : 'Update Access & Re-Generate Login'}
                    </button>
                </div>
            </div>

        </div>
    `;
}

// ============================================================================
// EMPLOYEE ROLE & ACCESS CONTROL (TWO HORIZONTAL TABS: SUPER ADMIN & EMPLOYEES)
// ============================================================================

function renderSuperAdminTabHTML(state, activeUser, auditLogs) {
    return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Profile & Root Status Card -->
            <div class="glass-panel" style="padding: 1.75rem 2rem; border-left: 4px solid #38bdf8;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 1.25rem;">
                        <img src="${activeUser.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}" alt="Super Admin" style="width: 64px; height: 64px; border-radius: 50%; border: 3px solid #38bdf8; object-fit: cover; box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                                <h2 style="margin: 0; font-size: 1.4rem; color: #f8fafc; font-weight: 700;">${activeUser.name || 'Shamsudheen V.K.'}</h2>
                                <span style="font-size: 0.72rem; padding: 2px 9px; border-radius: 9999px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); font-weight: 700;">
                                    ROOT SUPER ADMINISTRATOR
                                </span>
                                <span style="font-size: 0.7rem; background: #22c55e; color: #022c22; padding: 1px 7px; border-radius: 9999px; font-weight: 700;">ACTIVE</span>
                            </div>
                            <div style="font-size: 0.82rem; color: #94a3b8; margin-top: 4px;">
                                User ID: <strong style="color: #38bdf8; font-family: monospace;">SB-9901</strong> • ${activeUser.email || 'admin@stellobuild.com'} • Executive Operations &amp; Supply Chain
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Root Privileges Breakdown Card -->
            <div class="glass-panel" style="padding: 1.75rem 2rem;">
                <h3 style="margin: 0 0 1rem; font-size: 1.15rem; color: #f8fafc; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="shield-check" style="color: #38bdf8; width: 20px;"></i> System Root Privileges &amp; Master Authority
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                    <div style="background: rgba(56, 189, 248, 0.06); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 1rem;">
                        <div style="font-weight: 700; color: #38bdf8; font-size: 0.9rem; margin-bottom: 4px;">16/16 Module Full CRUD Authority</div>
                        <p style="margin: 0; font-size: 0.78rem; color: #cbd5e1; line-height: 1.45;">Full Create, Read, Update, and Delete authority across all modules (Orders, Sales, Production, BOM, HR, Settings, Accounts).</p>
                    </div>
                    <div style="background: rgba(34, 197, 94, 0.06); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 8px; padding: 1rem;">
                        <div style="font-weight: 700; color: #4ade80; font-size: 0.9rem; margin-bottom: 4px;">Master Security Bypass</div>
                        <p style="margin: 0; font-size: 0.78rem; color: #cbd5e1; line-height: 1.45;">Exempt from field geofences, accounts config lockouts, and stage progression gating. Universal root override access.</p>
                    </div>
                    <div style="background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 1rem;">
                        <div style="font-weight: 700; color: #fbbf24; font-size: 0.9rem; margin-bottom: 4px;">HR &amp; Resignation Authority</div>
                        <p style="margin: 0; font-size: 0.78rem; color: #cbd5e1; line-height: 1.45;">Exclusive authority to authorize staff resignation, revoke credentials, adjust wages, and override attendance penalties.</p>
                    </div>
                    <div style="background: rgba(168, 85, 247, 0.06); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 8px; padding: 1rem;">
                        <div style="font-weight: 700; color: #c084fc; font-size: 0.9rem; margin-bottom: 4px;">Audit &amp; Compliance Governance</div>
                        <p style="margin: 0; font-size: 0.78rem; color: #cbd5e1; line-height: 1.45;">Live immutable audit logging tracking permission changes, invoice deletions, and credential modifications.</p>
                    </div>
                </div>
            </div>

            <!-- Administrative Passcodes Card -->
            <div class="glass-panel" style="padding: 1.75rem 2rem; border: 1.5px solid rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.03);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; color: #f8fafc; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="key" style="color: #fbbf24; width: 20px;"></i> Administrative Authorization Passcodes
                        </h3>
                        <p style="margin: 4px 0 1rem; font-size: 0.8rem; color: #94a3b8;">
                            High-privilege system passcodes required for sensitive operational challenges and administrative approvals.
                        </p>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 0.75rem 1.25rem;">
                                <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Root Employee Passcode</div>
                                <div style="font-size: 1.3rem; font-weight: 800; color: #fbbf24; font-family: monospace; letter-spacing: 1px;">SB-9901</div>
                                <div style="font-size: 0.7rem; color: #cbd5e1; margin-top: 2px;">Used for employee exit, admin gates &amp; root override</div>
                            </div>
                            <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 0.75rem 1.25rem;">
                                <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Master Admin Authorization Key</div>
                                <div style="font-size: 1.3rem; font-weight: 800; color: #38bdf8; font-family: monospace; letter-spacing: 1px;">admin123</div>
                                <div style="font-size: 0.7rem; color: #cbd5e1; margin-top: 2px;">Used for Accounts Config unlock &amp; resignation flow</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Audit Trail Summary Card -->
            <div class="glass-panel" style="padding: 1.75rem 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                    <h3 style="margin: 0; font-size: 1.15rem; color: #f8fafc; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="history" style="color: #38bdf8; width: 18px;"></i> Security &amp; Access Audit Trail (${auditLogs.length})
                    </h3>
                    <button type="button" class="btn btn-secondary" onclick="window.openRbacAuditModal()" style="font-size: 0.78rem; padding: 0.4rem 0.85rem;">
                        View Full Audit Modal
                    </button>
                </div>
                <div style="max-height: 250px; overflow-y: auto; border: 1px solid var(--glass-border); border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                        <thead style="background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--glass-border); color: #94a3b8; text-align: left;">
                            <tr>
                                <th style="padding: 8px 12px;">Timestamp</th>
                                <th style="padding: 8px 12px;">Actor</th>
                                <th style="padding: 8px 12px;">Action</th>
                                <th style="padding: 8px 12px;">Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(auditLogs.length > 0 ? auditLogs.slice(0, 8) : [
                                { timestamp: '2026-10-18 09:00:00', actor: 'SB-9901 (Super Admin)', action: 'System RBAC Initialized', target: 'Enterprise Security Matrix' },
                                { timestamp: '2026-10-18 08:30:00', actor: 'SB-9901 (Super Admin)', action: 'Session Master Login', target: 'StyloBuild ERP Core' }
                            ]).map(log => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                                    <td style="padding: 8px 12px; font-family: monospace; color: #94a3b8;">${log.timestamp}</td>
                                    <td style="padding: 8px 12px; font-weight: 600; color: #38bdf8;">${log.actor}</td>
                                    <td style="padding: 8px 12px; color: #f8fafc;">${log.action}</td>
                                    <td style="padding: 8px 12px; color: #cbd5e1;">${log.target || log.targetId || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderEmployeesTabHTML(state, selectedStaff, staffList, erpModules, resolveModulePerm) {
    const isLoginActive = selectedStaff.hasLogin !== false && !selectedStaff.isResigned;

    return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- Searchable Live Autocomplete Staff Dropdown -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1.25rem 1.5rem; position: relative;">
                <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #f8fafc; margin-bottom: 0.5rem;">
                    🔍 Search &amp; Select Employee for Role Permission Matrix:
                </label>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; position: relative;">
                    <div style="flex: 2; min-width: 280px; position: relative;">
                        <input type="text" id="rbacStaffSearchInput" 
                            placeholder="Type employee name, ID (e.g. EMP-101), or role to search staff..." 
                            value="${selectedStaff ? `${selectedStaff.name} (${selectedStaff.id})` : ''}"
                            oninput="window.filterRbacStaffDropdown(this.value)" 
                            onfocus="window.filterRbacStaffDropdown(this.value)"
                            class="glass-input" 
                            style="width: 100%; padding: 0.65rem 0.85rem; font-size: 0.9rem;"
                            autocomplete="off"
                        >
                        <div id="rbacStaffSearchResults" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; width: 100%; background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 8px; max-height: 250px; overflow-y: auto; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.8);"></div>
                    </div>
                    <div style="flex: 1; min-width: 220px;">
                        <select id="rbacStaffSelect" onchange="window.selectRbacEmployee(this.value)" class="glass-input" style="width: 100%; padding: 0.65rem 0.85rem; font-size: 0.9rem;">
                            ${staffList.map(s => `
                                <option value="${s.id}" ${s.id === selectedStaff.id ? 'selected' : ''}>
                                    ${s.name} (${s.id}) • ${s.role}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <!-- Selected Employee Profile & Quick Presets Banner -->
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid var(--glass-border); border-left: 4px solid #f59e0b; border-radius: 12px; padding: 1.25rem 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 46px; height: 46px; border-radius: 50%; background: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 800; color: white;">
                            ${(selectedStaff.name || 'E').charAt(0)}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                                <h3 style="margin: 0; font-size: 1.2rem; color: #f8fafc; font-weight: 700;">${selectedStaff.name}</h3>
                                <span style="font-size: 0.72rem; font-family: monospace; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 1px 7px; border-radius: 4px; font-weight: 700;">
                                    ${selectedStaff.id}
                                </span>
                                <span style="font-size: 0.7rem; padding: 2px 8px; border-radius: 9999px; ${isLoginActive ? 'background: rgba(34, 197, 94, 0.15); color: #34d399; border: 1px solid rgba(34, 197, 94, 0.35);' : 'background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);'} font-weight: 700;">
                                    ${isLoginActive ? 'Active Credentials' : 'Login Pending'}
                                </span>
                            </div>
                            <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 3px;">
                                Primary Role: <strong style="color: #f8fafc;">${selectedStaff.role}</strong> • Department: ${selectedStaff.department || 'Operations & Fabrication'}
                            </div>
                        </div>
                    </div>

                    <!-- Presets -->
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button type="button" onclick="window.applyEmployeePreset('fullcrud')" class="btn btn-secondary" style="padding: 0.4rem 0.85rem; font-size: 0.76rem; font-weight: 600;">
                            ⚡ Full Access
                        </button>
                        <button type="button" onclick="window.applyEmployeePreset('readonly')" class="btn btn-secondary" style="padding: 0.4rem 0.85rem; font-size: 0.76rem; font-weight: 600;">
                            👁️ Read-Only
                        </button>
                        <button type="button" onclick="window.applyEmployeePreset('manager')" class="btn btn-secondary" style="padding: 0.4rem 0.85rem; font-size: 0.76rem; font-weight: 600;">
                            🛠️ Manager (No Delete)
                        </button>
                        <button type="button" onclick="window.applyEmployeePreset('hideall')" class="btn btn-secondary" style="padding: 0.4rem 0.85rem; font-size: 0.76rem; font-weight: 600; color: #f87171;">
                            ❌ Hide All
                        </button>
                    </div>
                </div>
            </div>

            <!-- 16-Module Granular Matrix Table -->
            <div style="overflow-x: auto; border: 1px solid var(--glass-border); border-radius: 10px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead style="background: rgba(0,0,0,0.35); border-bottom: 1px solid var(--glass-border); color: #94a3b8; text-transform: uppercase; font-size: 0.74rem; letter-spacing: 0.5px;">
                        <tr>
                            <th style="padding: 12px 16px; text-align: left;">ERP Module</th>
                            <th style="padding: 12px 16px; text-align: center;">Visibility (View/Hide)</th>
                            <th style="padding: 12px 12px; text-align: center;">Create</th>
                            <th style="padding: 12px 12px; text-align: center;">Read</th>
                            <th style="padding: 12px 12px; text-align: center;">Update</th>
                            <th style="padding: 12px 12px; text-align: center;">Delete</th>
                            <th style="padding: 12px 16px; text-align: left;">Data Scope</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${erpModules.map(mod => {
                            const p = resolveModulePerm(mod.id);
                            return `
                                <tr id="row-emp-${mod.id}" style="border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; ${!p.view ? 'opacity: 0.55;' : ''}" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding: 12px 16px;">
                                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                                            <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(56, 189, 248, 0.1); display: flex; align-items: center; justify-content: center; color: #38bdf8; flex-shrink: 0;">
                                                <i data-lucide="${mod.icon}" style="width: 16px; height: 16px;"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 700; color: #f8fafc; font-size: 0.88rem;">${mod.name}</div>
                                                <div style="font-size: 0.72rem; color: #94a3b8;">${mod.desc}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 12px 16px; text-align: center;">
                                        <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 22px;">
                                            <input type="checkbox" id="perm-emp-v-${mod.id}" ${p.view ? 'checked' : ''} onchange="window.toggleEmployeeModuleRow('${mod.id}', this.checked)">
                                            <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #334155; transition: .3s; border-radius: 22px;"></span>
                                        </label>
                                    </td>
                                    <td style="padding: 12px 12px; text-align: center;">
                                        <input type="checkbox" id="perm-emp-c-${mod.id}" ${p.create ? 'checked' : ''} ${!p.view ? 'disabled' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: #0284c7;">
                                    </td>
                                    <td style="padding: 12px 12px; text-align: center;">
                                        <input type="checkbox" id="perm-emp-r-${mod.id}" ${p.read ? 'checked' : ''} ${!p.view ? 'disabled' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: #0284c7;">
                                    </td>
                                    <td style="padding: 12px 12px; text-align: center;">
                                        <input type="checkbox" id="perm-emp-u-${mod.id}" ${p.update ? 'checked' : ''} ${!p.view ? 'disabled' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: #0284c7;">
                                    </td>
                                    <td style="padding: 12px 12px; text-align: center;">
                                        <input type="checkbox" id="perm-emp-d-${mod.id}" ${p.delete ? 'checked' : ''} ${!p.view ? 'disabled' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: #ef4444;">
                                    </td>
                                    <td style="padding: 12px 16px;">
                                        <select id="perm-emp-s-${mod.id}" ${!p.view ? 'disabled' : ''} class="glass-input" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; border-radius: 6px;">
                                            <option value="all" ${p.scope === 'all' ? 'selected' : ''}>All Records</option>
                                            <option value="own" ${p.scope === 'own' ? 'selected' : ''}>Own Assigned</option>
                                        </select>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Bottom Persistence Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--glass-border); flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.65rem; font-size: 0.78rem; color: #94a3b8;">
                    <i data-lucide="info" style="width: 15px; height: 15px; color: #38bdf8;"></i>
                    <span>Permissions update dynamically and control sidebar visibility in real time.</span>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button type="button" class="btn btn-secondary" onclick="window.resetEmployeeRbacToDefaults('${selectedStaff.id}')" style="padding: 0.55rem 1.15rem; font-size: 0.84rem;">
                        Reset Role Defaults
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.saveSelectedEmployeePermissions('${selectedStaff.id}')" style="padding: 0.55rem 1.5rem; font-size: 0.84rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #0284c7, #2563eb); border: none; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.45); cursor: pointer;">
                        <i data-lucide="check" style="width: 15px; height: 15px;"></i> Save Employee Permissions
                    </button>
                </div>
            </div>

        </div>
    `;
}

export function renderRolesPermissionsMatrixTabHTML(state, activeUser) {
    const store = window.Store || Store;
    const rbac = (store.state && store.state.rbac) || DEFAULT_RBAC_CONFIG;
    const staffList = (store.state && store.state.staff) || [];
    const auditLogs = rbac.auditLogs || [];
    const userOverrides = rbac.userOverrides || {};

    // Active Horizontal Tab: 'super_admin' or 'employees' (Default is 'employees')
    if (!window.rbacRoleActiveTab) window.rbacRoleActiveTab = 'employees';
    const activeTab = window.rbacRoleActiveTab;

    // Selected Employee for the 'employees' tab
    if (!window.rbacSelectedEmployeeId) {
        window.rbacSelectedEmployeeId = (staffList[0] && staffList[0].id) || 'EMP-101';
    }
    const selectedStaff = staffList.find(s => s.id === window.rbacSelectedEmployeeId) || staffList[0] || {
        id: 'EMP-101', name: 'Staff Member', role: 'Operations', department: 'Fabrication'
    };

    // The 16 ERP Modules with categories and descriptions
    const erpModules = [
        { id: 'dashboard', name: 'Dashboard', category: 'Core', icon: 'layout-dashboard', desc: 'KPI metric tiles, real-time revenue analytics & system status' },
        { id: 'customers', name: 'Customers', category: 'Commercial', icon: 'user-check', desc: 'Client directory, customer addresses, GSTIN & transaction ledgers' },
        { id: 'leads', name: 'Leads & CRM', category: 'Commercial', icon: 'users', desc: 'Meta Lead Ads pipeline, stage progression & customer inquiries' },
        { id: 'calculation', name: 'BOM / Calculations', category: 'Operations', icon: 'calculator', desc: 'Window & door aperture sizing, partition formulas & cutting lists' },
        { id: 'quotations', name: 'Quotations', category: 'Commercial', icon: 'file-text', desc: 'Commercial proposals, item pricing, PDF generator & WhatsApp export' },
        { id: 'orders', name: 'Orders & Customer Portal', category: 'Commercial', icon: 'clipboard-list', desc: 'Dedicated client order tracking, interactive CAD viewer & 8 milestones' },
        { id: 'sales', name: 'Sales & Billing', category: 'Finance', icon: 'shopping-cart', desc: 'Tax invoices, 18% GST breakout, advance adjustments & accounts receivable' },
        { id: 'sales_return', name: 'Sales Return', category: 'Finance', icon: 'rotate-ccw', desc: 'Return vouchers, credit notes, stock recovery & ledger debits' },
        { id: 'purchase', name: 'Purchase & Bills', category: 'Finance', icon: 'shopping-bag', desc: 'Vendor purchase orders, inventory expenses & procurement orders' },
        { id: 'purchase_return', name: 'Purchase Return', category: 'Finance', icon: 'rotate-ccw', desc: 'Vendor debit notes, material returns, refunds & payable ledger credits' },
        { id: 'payments', name: 'Payments & Receipts', category: 'Finance', icon: 'credit-card', desc: 'Cash flow receipts, customer credits & bank reconciliation' },
        { id: 'stock_manager', name: 'Inventory & Stock', category: 'Operations', icon: 'package', desc: 'Raw material stock, dynamic categories, finished goods photo gallery' },
        { id: 'production', name: 'Production Floor', category: 'Operations', icon: 'hammer', desc: '8-stage workflow (Order Listed to Delivered), universal drawing preview' },
        { id: 'site_visit', name: 'Site Visits', category: 'Operations', icon: 'map-pin', desc: 'On-site field surveys, aperture verification & mobile photo capture' },
        { id: 'service_visit', name: 'Service Visits', category: 'Operations', icon: 'wrench', desc: 'Post-delivery maintenance, hardware repairs & field sign-offs' },
        { id: 'hr', name: 'HR & Workforce', category: 'Operations', icon: 'users', desc: '100m geo-fenced face attendance kiosk, 9:10 AM grace & OT payroll' },
        { id: 'reports', name: 'Statement & Reports', category: 'Finance', icon: 'bar-chart-2', desc: 'Comprehensive financial statements, tax registers & Excel reports' },
        { id: 'settings', name: 'Settings & Security', category: 'System', icon: 'settings', desc: 'Company parameters, employee role matrix & administrative passcodes' }
    ];

    // Current permissions for selected employee
    const staffPerms = userOverrides[selectedStaff.id] || selectedStaff.permissions || {};

    const resolveModulePerm = (modId) => {
        if (staffPerms[modId]) {
            const p = staffPerms[modId];
            if (typeof p === 'object') {
                return {
                    view: p.view !== false,
                    create: !!p.create,
                    read: p.read !== false,
                    update: !!p.update,
                    delete: !!p.delete,
                    scope: p.scope || 'all'
                };
            } else if (p === 'full') {
                return { view: true, create: true, read: true, update: true, delete: true, scope: 'all' };
            } else if (p === 'functional') {
                return { view: true, create: true, read: true, update: true, delete: false, scope: 'all' };
            } else if (p === 'view') {
                return { view: true, create: false, read: true, update: false, delete: false, scope: 'all' };
            } else {
                return { view: false, create: false, read: false, update: false, delete: false, scope: 'none' };
            }
        }
        // Base role defaults
        const roleLower = (selectedStaff.role || '').toLowerCase();
        if (roleLower.includes('admin')) {
            return { view: true, create: true, read: true, update: true, delete: true, scope: 'all' };
        }
        if (roleLower.includes('account')) {
            const hasFin = ['dashboard', 'sales', 'sales_return', 'purchase', 'purchase_return', 'payments', 'reports', 'customers', 'quotations', 'orders'].includes(modId);
            return { view: hasFin, create: ['sales', 'sales_return', 'purchase', 'purchase_return', 'payments'].includes(modId), read: hasFin, update: ['sales', 'sales_return', 'purchase', 'purchase_return', 'payments'].includes(modId), delete: false, scope: 'all' };
        }
        if (roleLower.includes('sale')) {
            const hasSale = ['dashboard', 'customers', 'leads', 'quotations', 'orders', 'site_visit'].includes(modId);
            return { view: hasSale, create: ['leads', 'quotations', 'orders', 'site_visit'].includes(modId), read: hasSale, update: ['leads', 'quotations', 'orders'].includes(modId), delete: false, scope: 'all' };
        }
        // Operations / Production default
        const hasOps = ['dashboard', 'calculation', 'orders', 'stock_manager', 'production', 'service_visit', 'site_visit'].includes(modId);
        return { view: hasOps, create: ['production', 'calculation'].includes(modId), read: hasOps, update: ['production'].includes(modId), delete: false, scope: 'all' };
    };

    return `
        <div class="glass-panel animate-fade-in rbac-matrix-container" style="padding: 1.75rem 2rem; margin-bottom: 2rem;">
            
            <!-- 1. HEADER -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                        <h2 style="margin: 0; font-size: 1.45rem; color: #f8fafc; font-weight: 700; letter-spacing: -0.3px;">
                            Employee Role &amp; Access Control Matrix
                        </h2>
                        <span style="font-size: 0.72rem; background: linear-gradient(135deg, #0284c7, #2563eb); color: white; padding: 2px 10px; border-radius: 9999px; font-weight: 700; letter-spacing: 0.4px;">
                            ENTERPRISE RBAC
                        </span>
                        <span style="font-size: 0.72rem; background: rgba(34, 197, 94, 0.15); color: #34d399; border: 1px solid rgba(34, 197, 94, 0.35); padding: 2px 9px; border-radius: 9999px; font-weight: 600;">
                            Live Synced
                        </span>
                    </div>
                    <p style="color: var(--color-text-muted); margin: 4px 0 0; font-size: 0.85rem; line-height: 1.4;">
                        Configure Super Admin root authority or customize granular individual View/Hide and CRUD permissions for staff.
                    </p>
                </div>

                <div style="display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center;">
                    <button type="button" class="btn btn-secondary" onclick="window.openRbacAuditModal()" style="font-size: 0.8rem; padding: 0.5rem 0.9rem; display: inline-flex; align-items: center; gap: 5px;">
                        <i data-lucide="history" style="width: 14px; height: 14px;"></i> Audit Trail (${auditLogs.length})
                    </button>
                </div>
            </div>

            <!-- 2. TWO HORIZONTAL TABS: SUPER ADMIN & EMPLOYEES -->
            <div style="display: flex; gap: 0.75rem; border-bottom: 2px solid var(--glass-border); margin-bottom: 1.75rem; padding-bottom: 0.5rem;">
                <button type="button" id="tab-super-admin" onclick="window.switchRbacRoleTab('super_admin')" 
                    style="padding: 0.65rem 1.4rem; font-size: 0.95rem; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s;
                    background: ${activeTab === 'super_admin' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(255,255,255,0.04)'};
                    color: ${activeTab === 'super_admin' ? '#ffffff' : '#94a3b8'}; box-shadow: ${activeTab === 'super_admin' ? '0 4px 16px rgba(2, 132, 199, 0.4)' : 'none'};">
                    <i data-lucide="shield" style="width: 17px; height: 17px;"></i> Super Admin
                </button>
                <button type="button" id="tab-employees" onclick="window.switchRbacRoleTab('employees')" 
                    style="padding: 0.65rem 1.4rem; font-size: 0.95rem; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s;
                    background: ${activeTab === 'employees' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(255,255,255,0.04)'};
                    color: ${activeTab === 'employees' ? '#ffffff' : '#94a3b8'}; box-shadow: ${activeTab === 'employees' ? '0 4px 16px rgba(2, 132, 199, 0.4)' : 'none'};">
                    <i data-lucide="users" style="width: 17px; height: 17px;"></i> Employees
                </button>
            </div>

            <!-- 3. TAB CONTENT -->
            ${activeTab === 'super_admin' ? renderSuperAdminTabHTML(state, activeUser, auditLogs) : renderEmployeesTabHTML(state, selectedStaff, staffList, erpModules, resolveModulePerm)}

        </div>
    `;
}

window.saveSelectedEmployeePermissions = async (staffId) => {
    const store = window.Store || Store;
    const rbac = (store.state && store.state.rbac) || DEFAULT_RBAC_CONFIG;
    const modules = [
        'dashboard', 'customers', 'leads', 'calculation', 'quotations', 'orders',
        'sales', 'sales_return', 'purchase', 'purchase_return', 'payments', 'stock_manager', 'production', 'site_visit',
        'service_visit', 'hr', 'reports', 'settings'
    ];

    const newMatrix = {};
    modules.forEach(modId => {
        const v = document.getElementById(`perm-emp-v-${modId}`);
        const c = document.getElementById(`perm-emp-c-${modId}`);
        const r = document.getElementById(`perm-emp-r-${modId}`);
        const u = document.getElementById(`perm-emp-u-${modId}`);
        const d = document.getElementById(`perm-emp-d-${modId}`);
        const s = document.getElementById(`perm-emp-s-${modId}`);

        const isView = v ? v.checked : false;
        newMatrix[modId] = {
            view: isView,
            create: isView ? (c ? c.checked : false) : false,
            read: isView ? (r ? r.checked : false) : false,
            update: isView ? (u ? u.checked : false) : false,
            delete: isView ? (d ? d.checked : false) : false,
            scope: isView ? (s ? s.value : 'all') : 'none'
        };
    });

    if (!rbac.userOverrides) rbac.userOverrides = {};
    rbac.userOverrides[staffId] = newMatrix;

    if (!rbac.auditLogs) rbac.auditLogs = [];
    rbac.auditLogs.unshift({
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'SB-9901 (Super Admin)',
        action: 'Updated Granular Permission Matrix',
        target: `Employee #${staffId}`
    });

    store.saveState();
    store.notify();
    if (typeof window.showRbacToast === 'function') {
        window.showRbacToast(`✅ Permissions successfully saved for employee #${staffId}!`);
    } else {
        alert(`✅ Permissions successfully saved for employee #${staffId}!`);
    }
};

window.applyEmployeePreset = (type) => {
    const modules = [
        'dashboard', 'customers', 'leads', 'calculation', 'quotations', 'orders',
        'sales', 'purchase', 'payments', 'stock_manager', 'production', 'site_visit',
        'service_visit', 'hr', 'reports', 'settings'
    ];

    modules.forEach(modId => {
        const v = document.getElementById(`perm-emp-v-${modId}`);
        const c = document.getElementById(`perm-emp-c-${modId}`);
        const r = document.getElementById(`perm-emp-r-${modId}`);
        const u = document.getElementById(`perm-emp-u-${modId}`);
        const d = document.getElementById(`perm-emp-d-${modId}`);

        if (type === 'fullcrud') {
            if (v) v.checked = true;
            if (c) { c.checked = true; c.disabled = false; }
            if (r) { r.checked = true; r.disabled = false; }
            if (u) { u.checked = true; u.disabled = false; }
            if (d) { d.checked = true; d.disabled = false; }
            window.toggleEmployeeModuleRow(modId, true);
        } else if (type === 'readonly') {
            if (v) v.checked = true;
            if (c) { c.checked = false; c.disabled = false; }
            if (r) { r.checked = true; r.disabled = false; }
            if (u) { u.checked = false; u.disabled = false; }
            if (d) { d.checked = false; d.disabled = false; }
            window.toggleEmployeeModuleRow(modId, true);
        } else if (type === 'manager') {
            if (v) v.checked = true;
            if (c) { c.checked = true; c.disabled = false; }
            if (r) { r.checked = true; r.disabled = false; }
            if (u) { u.checked = true; u.disabled = false; }
            if (d) { d.checked = false; d.disabled = false; }
            window.toggleEmployeeModuleRow(modId, true);
        } else if (type === 'hideall') {
            if (v) v.checked = false;
            window.toggleEmployeeModuleRow(modId, false);
        }
    });
};

window.toggleEmployeeModuleRow = (modId, isChecked) => {
    const row = document.getElementById(`row-emp-${modId}`);
    if (row) row.style.opacity = isChecked ? '1' : '0.55';
    ['c', 'r', 'u', 'd', 's'].forEach(suffix => {
        const el = document.getElementById(`perm-emp-${suffix}-${modId}`);
        if (el) el.disabled = !isChecked;
    });
};

window.switchRbacRoleTab = (tab) => {
    window.rbacRoleActiveTab = tab;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.filterRbacStaffDropdown = (query) => {
    const listEl = document.getElementById('rbacStaffSearchResults');
    if (!listEl) return;
    const store = window.Store || Store;
    const staff = store.state.staff || [];
    const q = (query || '').toLowerCase().trim();

    if (!q) {
        listEl.style.display = 'none';
        return;
    }

    const matches = staff.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.id && s.id.toLowerCase().includes(q)) || 
        (s.role && s.role.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q))
    );

    if (matches.length === 0) {
        listEl.innerHTML = `<div style="padding: 0.75rem 1rem; color: #94a3b8; font-size: 0.8rem;">No matching employees found for "${query}"</div>`;
        listEl.style.display = 'block';
        return;
    }

    listEl.innerHTML = matches.map(s => `
        <div onclick="window.selectRbacEmployee('${s.id}')" 
            style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--glass-border); cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: background 0.15s;"
            onmouseover="this.style.background='rgba(56, 189, 248, 0.12)'"
            onmouseout="this.style.background='transparent'"
        >
            <div style="display: flex; align-items: center; gap: 0.65rem;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: white;">
                    ${(s.name || 'E').charAt(0)}
                </div>
                <div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: #f8fafc;">${s.name}</div>
                    <div style="font-size: 0.72rem; color: #94a3b8;">${s.role} • ${s.department || 'Operations'}</div>
                </div>
            </div>
            <span style="font-size: 0.72rem; font-family: monospace; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 2px 6px; border-radius: 4px;">${s.id}</span>
        </div>
    `).join('');
    listEl.style.display = 'block';
};

window.selectRbacEmployee = (empId) => {
    window.rbacSelectedEmployeeId = empId;
    window.rbacSelectedUserId = empId;
    const searchInput = document.getElementById('rbacStaffSearchInput');
    const store = window.Store || Store;
    const emp = (store.state.staff || []).find(s => s.id === empId);
    if (searchInput && emp) {
        searchInput.value = `${emp.name} (${emp.id})`;
    }
    const listEl = document.getElementById('rbacStaffSearchResults');
    if (listEl) listEl.style.display = 'none';
    const selectEl = document.getElementById('rbacStaffSelect');
    if (selectEl) selectEl.value = empId;
    if (store) store.notify();
};

window.resetEmployeeRbacToDefaults = (staffId) => {
    const store = window.Store || Store;
    if (store.state.rbac && store.state.rbac.userOverrides) {
        delete store.state.rbac.userOverrides[staffId];
    }
    store.saveState();
    store.notify();
    if (typeof window.showRbacToast === 'function') {
        window.showRbacToast(`🔄 Reset employee #${staffId} permissions to default role matrix.`);
    } else {
        alert(`🔄 Reset employee #${staffId} permissions to default role matrix.`);
    }
};

// ============================================================================
// GLOBAL INTERACTIVE EVENT HANDLERS & MODALS
// ============================================================================

window.switchRbacRole = (roleId) => {
    window.rbacMode = 'role';
    window.rbacSelectedRoleId = roleId;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.switchRbacMode = (mode) => {
    window.rbacMode = mode;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.switchRbacTargetUser = (userId) => {
    window.rbacMode = 'user';
    window.rbacSelectedUserId = userId;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.switchRbacSelectedEmployee = (empId) => {
    window.rbacMode = 'employee_access';
    window.rbacSelectedEmployeeId = empId;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.setRbacEmployeeFilter = (filter) => {
    window.rbacEmployeeFilter = filter;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.openEmployeeAccessProvisioning = (empId) => {
    window.currentSettingsTab = 'roles';
    window.rbacMode = 'employee_access';
    if (empId) {
        window.rbacSelectedEmployeeId = empId;
    }
    if (typeof window.navigate === 'function') {
        window.navigate('settings');
    }
    if (typeof window.switchSettingsTab === 'function') {
        window.switchSettingsTab('roles');
    }
    const store = window.Store || Store;
    if (store) store.notify();
};

window.toggleEmployeeModuleView = (modId, isChecked) => {
    const c = document.getElementById(`perm-emp-c-${modId}`);
    const r = document.getElementById(`perm-emp-r-${modId}`);
    const u = document.getElementById(`perm-emp-u-${modId}`);
    const d = document.getElementById(`perm-emp-d-${modId}`);
    const s = document.getElementById(`perm-emp-scope-${modId}`);
    const row = document.getElementById(`rbac-emp-row-${modId}`);
    const badge = document.getElementById(`badge-emp-status-${modId}`);

    if (c) c.disabled = !isChecked;
    if (r) r.disabled = !isChecked;
    if (u) u.disabled = !isChecked;
    if (d) d.disabled = !isChecked;
    if (s) s.disabled = !isChecked;

    if (isChecked) {
        if (row) row.classList.remove('rbac-row-disabled');
        if (r && !r.checked) r.checked = true;
        if (s && s.value === 'none') s.value = 'all';
        if (badge) {
            badge.textContent = 'View Only';
            badge.style.cssText = 'font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; white-space: nowrap; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);';
        }
    } else {
        if (row) row.classList.add('rbac-row-disabled');
        if (c) c.checked = false;
        if (r) r.checked = false;
        if (u) u.checked = false;
        if (d) d.checked = false;
        if (s) s.value = 'none';
        if (badge) {
            badge.textContent = 'No Access';
            badge.style.cssText = 'font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; white-space: nowrap; background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25);';
        }
    }
};

window.applyEmployeeRbacPreset = (presetType) => {
    const modules = ['dashboard', 'leads', 'quotations', 'bom', 'accounts', 'inventory', 'production', 'hr'];
    const store = window.Store || Store;
    const staffList = (store.state && store.state.staff) || [];
    const emp = staffList.find(s => s.id === window.rbacSelectedEmployeeId) || staffList[0] || {};
    const roleLower = (emp.role || '').toLowerCase();

    modules.forEach(modId => {
        const v = document.getElementById(`perm-emp-view-${modId}`);
        const c = document.getElementById(`perm-emp-c-${modId}`);
        const r = document.getElementById(`perm-emp-r-${modId}`);
        const u = document.getElementById(`perm-emp-u-${modId}`);
        const d = document.getElementById(`perm-emp-d-${modId}`);
        const s = document.getElementById(`perm-emp-scope-${modId}`);
        const row = document.getElementById(`rbac-emp-row-${modId}`);
        const badge = document.getElementById(`badge-emp-status-${modId}`);

        if (presetType === 'full') {
            if (v) v.checked = true;
            if (c) { c.disabled = false; c.checked = true; }
            if (r) { r.disabled = false; r.checked = true; }
            if (u) { u.disabled = false; u.checked = true; }
            if (d) { d.disabled = false; d.checked = true; }
            if (s) { s.disabled = false; s.value = 'all'; }
            if (row) row.classList.remove('rbac-row-disabled');
            if (badge) {
                badge.textContent = 'Full CRUD';
                badge.style.cssText = 'font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; white-space: nowrap; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); font-weight: 700;';
            }
        } else if (presetType === 'viewonly') {
            if (v) v.checked = true;
            if (c) { c.disabled = false; c.checked = false; }
            if (r) { r.disabled = false; r.checked = true; }
            if (u) { u.disabled = false; u.checked = false; }
            if (d) { d.disabled = false; d.checked = false; }
            if (s) { s.disabled = false; s.value = 'all'; }
            if (row) row.classList.remove('rbac-row-disabled');
            if (badge) {
                badge.textContent = 'View Only';
                badge.style.cssText = 'font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; white-space: nowrap; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);';
            }
        } else if (presetType === 'role') {
            let isV = false, isCrud = false;
            if (modId === 'dashboard') { isV = true; isCrud = false; }
            else if (roleLower.includes('account')) {
                if (['accounts', 'quotations'].includes(modId)) { isV = true; isCrud = true; }
                else if (['inventory'].includes(modId)) { isV = true; isCrud = false; }
            } else if (roleLower.includes('sale')) {
                if (['leads', 'quotations'].includes(modId)) { isV = true; isCrud = true; }
                else if (['bom'].includes(modId)) { isV = true; isCrud = false; }
            } else if (roleLower.includes('fab') || roleLower.includes('prod') || roleLower.includes('glaz') || roleLower.includes('design')) {
                if (['bom', 'production'].includes(modId)) { isV = true; isCrud = true; }
                else if (['inventory'].includes(modId)) { isV = true; isCrud = false; }
            } else if (roleLower.includes('hr')) {
                if (['hr'].includes(modId)) { isV = true; isCrud = true; }
            } else {
                if (['production'].includes(modId)) { isV = true; isCrud = false; }
            }

            if (v) v.checked = isV;
            if (c) { c.disabled = !isV; c.checked = isCrud; }
            if (r) { r.disabled = !isV; r.checked = isV; }
            if (u) { u.disabled = !isV; u.checked = isCrud; }
            if (d) { d.disabled = !isV; d.checked = false; }
            if (s) { s.disabled = !isV; s.value = isV ? 'all' : 'none'; }
            if (row) {
                if (isV) row.classList.remove('rbac-row-disabled');
                else row.classList.add('rbac-row-disabled');
            }
            if (badge) {
                if (isCrud) {
                    badge.textContent = 'Functional';
                    badge.style.cssText = 'font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; white-space: nowrap; background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.35); font-weight: 600;';
                } else if (isV) {
                    badge.textContent = 'View Only';
                    badge.style.cssText = 'font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; white-space: nowrap; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);';
                } else {
                    badge.textContent = 'No Access';
                    badge.style.cssText = 'font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; white-space: nowrap; background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25);';
                }
            }
        } else if (presetType === 'revoke') {
            const isCore = modId === 'dashboard';
            if (v) v.checked = isCore;
            if (c) { c.disabled = !isCore; c.checked = false; }
            if (r) { r.disabled = !isCore; r.checked = isCore; }
            if (u) { u.disabled = !isCore; u.checked = false; }
            if (d) { d.disabled = !isCore; d.checked = false; }
            if (s) { s.disabled = !isCore; s.value = isCore ? 'own' : 'none'; }
            if (row) {
                if (isCore) row.classList.remove('rbac-row-disabled');
                else row.classList.add('rbac-row-disabled');
            }
            if (badge) {
                badge.textContent = isCore ? 'View Only' : 'No Access';
                badge.style.cssText = isCore 
                    ? 'font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; white-space: nowrap; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);'
                    : 'font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; white-space: nowrap; background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25);';
            }
        }
    });
};

window.triggerEmployeeProvisioning = async (employeeId) => {
    const store = window.Store || Store;
    const staffList = (store.state && store.state.staff) || [];
    const emp = staffList.find(s => s.id === employeeId);
    if (!emp) {
        alert('Please select a valid employee profile to provision.');
        return;
    }

    const btn = document.getElementById('btn-provision-employee');
    const btnTop = document.getElementById('btn-top-provision');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width: 16px; height: 16px;"></i> Generating Credentials...';
    }
    if (btnTop) btnTop.disabled = true;
    if (window.lucide) window.lucide.createIcons();

    const modules = ['dashboard', 'leads', 'quotations', 'bom', 'accounts', 'inventory', 'production', 'hr'];
    const permissions = {};

    modules.forEach(modId => {
        const v = document.getElementById(`perm-emp-view-${modId}`);
        const c = document.getElementById(`perm-emp-c-${modId}`);
        const r = document.getElementById(`perm-emp-r-${modId}`);
        const u = document.getElementById(`perm-emp-u-${modId}`);
        const d = document.getElementById(`perm-emp-d-${modId}`);
        const s = document.getElementById(`perm-emp-scope-${modId}`);

        const isView = v ? v.checked : false;
        permissions[modId] = {
            view: isView,
            create: isView ? (c ? c.checked : false) : false,
            read: isView ? (r ? r.checked : false) : false,
            update: isView ? (u ? u.checked : false) : false,
            delete: isView ? (d ? d.checked : false) : false,
            functional: isView ? ((c && c.checked) || (u && u.checked)) : false,
            scope: isView ? (s ? s.value : 'all') : 'none'
        };
    });

    try {
        const activeUser = (typeof store.getActiveUser === 'function') ? store.getActiveUser() : (store.state.user || { id: 'SB-9901' });
        const result = await store.provisionEmployeeAccess(employeeId, permissions, activeUser.id, emp.role);
        
        // Show Generated Credentials Popup Modal
        window.showGeneratedCredentialsModal(result, emp);

        if (typeof renderSidebar === 'function') {
            renderSidebar();
        }
    } catch (err) {
        alert('Provisioning failed: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
        if (btnTop) btnTop.disabled = false;
        if (window.lucide) window.lucide.createIcons();
    }
};

window.showGeneratedCredentialsModal = (data, emp) => {
    const existing = document.getElementById('generated-credentials-modal');
    if (existing) existing.remove();

    const username = data.username || (data.credentials && data.credentials.username) || (emp && emp.username) || '';
    const tempPassword = data.tempPassword || (data.credentials && (data.credentials.tempPassword || data.credentials.password)) || '';

    const modal = document.createElement('div');
    modal.id = 'generated-credentials-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px);
        display: flex; align-items: center; justify-content: center; z-index: 100030;
        padding: 1.5rem;
    `;

    const credentialsText = `STELLO BUILD BMS — EMPLOYEE LOGIN CREDENTIALS\n` +
        `-----------------------------------------\n` +
        `Employee Name:  ${emp.name}\n` +
        `Employee ID:    #${emp.id}\n` +
        `Role:           ${emp.role}\n` +
        `Username:       ${username}\n` +
        `Temp Password:  ${tempPassword}\n` +
        `Access URL:     http://localhost:3000/\n` +
        `-----------------------------------------\n` +
        `Security Notice: Hashed with Bcrypt. Password change required upon first sign-in.`;

    window.lastGeneratedCredentialsString = credentialsText;

    modal.innerHTML = `
        <div class="glass-panel animate-scale-up" style="width: 540px; max-width: 95vw; background: #0b1120; border: 1.5px solid rgba(56, 189, 248, 0.5); border-radius: 16px; padding: 2rem; box-shadow: 0 25px 75px rgba(0,0,0,0.9); text-align: center; position: relative;">
            
            <!-- Close icon button -->
            <button type="button" onclick="document.getElementById('generated-credentials-modal').remove()" style="position: absolute; top: 1.25rem; right: 1.25rem; background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>

            <!-- Success Glow Icon -->
            <div style="width: 68px; height: 68px; border-radius: 50%; background: rgba(34, 197, 94, 0.15); border: 2.5px solid #22c55e; display: flex; align-items: center; justify-content: center; color: #22c55e; margin: 0 auto 1.25rem; box-shadow: 0 0 25px rgba(34, 197, 94, 0.35);">
                <i data-lucide="key" style="width: 34px; height: 34px;"></i>
            </div>

            <div style="display: inline-block; padding: 2px 10px; border-radius: 9999px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 0.5rem; border: 1px solid rgba(56, 189, 248, 0.35);">
                CREDENTIALS GENERATED &amp; BCRYPT HASHED
            </div>

            <h2 style="margin: 0 0 0.4rem; font-size: 1.45rem; font-weight: 800; color: #f8fafc;">
                System Access Provisioned!
            </h2>
            <p style="margin: 0 0 1.5rem; font-size: 0.88rem; color: #94a3b8; line-height: 1.45;">
                Login access has been granted for <strong style="color: #f8fafc;">${emp.name}</strong> (${emp.role}).
                <br>Record updated to <strong style="color: #4ade80;">provisioned</strong> with RBAC module permissions active.
            </p>

            <!-- Credential Display Box -->
            <div style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; text-align: left;">
                
                <!-- Username Row -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 0.85rem;">
                    <div>
                        <span style="display: block; font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">System Username</span>
                        <span id="display-username" style="font-family: 'Fira Code', monospace; font-size: 1.15rem; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px;">${username}</span>
                    </div>
                    <button type="button" onclick="navigator.clipboard.writeText('${username}'); window.showRbacToast('Username copied to clipboard!');" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                        <i data-lucide="copy" style="width: 13px; height: 13px;"></i> Copy
                    </button>
                </div>

                <!-- Password Row -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 0.85rem;">
                    <div>
                        <span style="display: block; font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Temporary Password</span>
                        <span id="display-password" style="font-family: 'Fira Code', monospace; font-size: 1.25rem; font-weight: 800; color: #4ade80; letter-spacing: 1.5px;">${tempPassword}</span>
                    </div>
                    <button type="button" onclick="navigator.clipboard.writeText('${tempPassword}'); window.showRbacToast('Password copied to clipboard!');" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                        <i data-lucide="copy" style="width: 13px; height: 13px;"></i> Copy
                    </button>
                </div>

                <!-- Pattern Info Line -->
                <div style="display: flex; justify-content: space-between; font-size: 0.74rem; color: #64748b;">
                    <span>Pattern: <code>[name][phone_last4]</code></span>
                    <span>Pattern: <code>STY + 3 digits (6 chars)</code></span>
                </div>
            </div>

            <!-- Security Notice -->
            <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.78rem; color: #cbd5e1; text-align: left; display: flex; align-items: center; gap: 0.65rem;">
                <i data-lucide="lock" style="width: 16px; height: 16px; color: #38bdf8; flex-shrink: 0;"></i>
                <span>Password has been encrypted using <strong>Bcrypt with 10 salt rounds</strong> before database persistence. Share these plaintext credentials with the employee.</span>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.75rem;">
                <button type="button" id="btn-copy-all-credentials" class="btn btn-primary" onclick="window.copyCredentialsToClipboard()" style="flex: 2; padding: 0.75rem 1.25rem; font-size: 0.92rem; font-weight: 700; background: linear-gradient(135deg, #0284c7, #2563eb); border: none; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.45); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                    <i data-lucide="clipboard-copy" style="width: 16px; height: 16px;"></i> Copy Credentials
                </button>
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('generated-credentials-modal').remove()" style="flex: 1; padding: 0.75rem 1.25rem; font-size: 0.9rem; font-weight: 600;">
                    Done
                </button>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.copyCredentialsToClipboard = () => {
    const text = window.lastGeneratedCredentialsString || 'Credentials unavailable';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
    }

    const btn = document.getElementById('btn-copy-all-credentials');
    if (btn) {
        btn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px;"></i> Copied to Clipboard!';
        btn.style.background = '#16a34a';
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
            if (btn) {
                btn.innerHTML = '<i data-lucide="clipboard-copy" style="width: 16px; height: 16px;"></i> Copy Credentials';
                btn.style.background = 'linear-gradient(135deg, #0284c7, #2563eb)';
                if (window.lucide) window.lucide.createIcons();
            }
        }, 2500);
    }

    window.showRbacToast('📋 Complete credentials bundle copied to clipboard!');
};

window.setRbacCategoryFilter = (cat) => {
    window.rbacCategoryFilter = cat;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.toggleRbacModuleView = (moduleId, isChecked) => {
    const c = document.getElementById(`perm-create-${moduleId}`);
    const r = document.getElementById(`perm-read-${moduleId}`);
    const u = document.getElementById(`perm-update-${moduleId}`);
    const d = document.getElementById(`perm-delete-${moduleId}`);
    const s = document.getElementById(`perm-scope-${moduleId}`);

    if (c) c.disabled = !isChecked;
    if (r) r.disabled = !isChecked;
    if (u) u.disabled = !isChecked;
    if (d) d.disabled = !isChecked;
    if (s) s.disabled = !isChecked;

    if (isChecked) {
        if (r && !r.checked) r.checked = true;
        if (s && s.value === 'none') s.value = 'all';
    } else {
        if (c) c.checked = false;
        if (r) r.checked = false;
        if (u) u.checked = false;
        if (d) d.checked = false;
        if (s) s.value = 'none';
    }
    const store = window.Store || Store;
    if (store) store.notify();
};

window.applyRbacPreset = (presetType) => {
    const store = window.Store || Store;
    const rbac = (store.state && store.state.rbac) || DEFAULT_RBAC_CONFIG;
    const modules = rbac.modules || DEFAULT_RBAC_CONFIG.modules;

    modules.forEach(mod => {
        const v = document.getElementById(`perm-view-${mod.id}`);
        const c = document.getElementById(`perm-create-${mod.id}`);
        const r = document.getElementById(`perm-read-${mod.id}`);
        const u = document.getElementById(`perm-update-${mod.id}`);
        const d = document.getElementById(`perm-delete-${mod.id}`);
        const s = document.getElementById(`perm-scope-${mod.id}`);

        if (presetType === 'readonly') {
            if (v) v.checked = true;
            if (c) c.checked = false;
            if (r) r.checked = true;
            if (u) u.checked = false;
            if (d) d.checked = false;
            if (s) s.value = 'all';
        } else if (presetType === 'fullcrud') {
            if (v) v.checked = true;
            if (c) c.checked = true;
            if (r) r.checked = true;
            if (u) u.checked = true;
            if (d) d.checked = true;
            if (s) s.value = 'all';
        } else if (presetType === 'revoke') {
            const isCore = ['dashboard', 'hr'].includes(mod.id);
            if (v) v.checked = isCore;
            if (c) c.checked = false;
            if (r) r.checked = isCore;
            if (u) u.checked = false;
            if (d) d.checked = false;
            if (s) s.value = isCore ? 'own' : 'none';
        }
    });

    store.notify();
};

window.saveRbacPermissionsMatrix = async () => {
    const store = window.Store || Store;
    const rbac = (store.state && store.state.rbac) || DEFAULT_RBAC_CONFIG;
    const modules = rbac.modules || DEFAULT_RBAC_CONFIG.modules;

    const newMatrix = {};
    modules.forEach(mod => {
        const v = document.getElementById(`perm-view-${mod.id}`);
        const c = document.getElementById(`perm-create-${mod.id}`);
        const r = document.getElementById(`perm-read-${mod.id}`);
        const u = document.getElementById(`perm-update-${mod.id}`);
        const d = document.getElementById(`perm-delete-${mod.id}`);
        const s = document.getElementById(`perm-scope-${mod.id}`);

        const isView = v ? v.checked : false;
        newMatrix[mod.id] = {
            view: isView,
            create: isView ? (c ? c.checked : false) : false,
            read: isView ? (r ? r.checked : false) : false,
            update: isView ? (u ? u.checked : false) : false,
            delete: isView ? (d ? d.checked : false) : false,
            scope: isView ? (s ? s.value : 'all') : 'none'
        };
    });

    const isRoleMode = window.rbacMode === 'role';
    const targetRoleId = window.rbacSelectedRoleId || 'accounts';
    const targetUserId = window.rbacSelectedUserId || 'EMP-101';

    if (isRoleMode) {
        await store.updateRolePermissions(targetRoleId, newMatrix);
        showRbacToast(`✅ Permissions matrix updated for role: ${targetRoleId.toUpperCase()}!`);
    } else {
        await store.updateUserPermissionOverrides(targetUserId, newMatrix);
        showRbacToast(`✅ Custom permission overrides saved for user: #${targetUserId}!`);
    }

    if (typeof renderSidebar === 'function') {
        renderSidebar();
    }
};

window.resetCurrentRbacRole = async () => {
    if (!confirm('Are you sure you want to reset this role to system factory default permissions?')) return;
    const store = window.Store || Store;
    const targetRoleId = window.rbacSelectedRoleId || 'accounts';
    await store.resetRolePermissions(targetRoleId);
    showRbacToast(`🔄 Role ${targetRoleId.toUpperCase()} successfully reset to defaults.`);
};

function showRbacToast(msg) {
    window.showRbacToast = showRbacToast;
    const existing = document.getElementById('rbac-toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'rbac-toast-notification';
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 100050;
        background: #0f172a; border: 1.5px solid #22c55e; color: #f8fafc;
        padding: 0.85rem 1.4rem; border-radius: 10px; font-size: 0.88rem; font-weight: 600;
        box-shadow: 0 10px 35px rgba(0,0,0,0.7), 0 0 15px rgba(34, 197, 94, 0.4);
        display: flex; align-items: center; gap: 0.65rem; animation: slideUp 0.3s ease;
    `;
    toast.innerHTML = `<i data-lucide="check-circle" style="color: #22c55e; width: 18px; height: 18px;"></i> ${msg}`;
    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s';
        setTimeout(() => toast.remove(), 400);
    }, 3200);
}
window.showRbacToast = showRbacToast;

// SQL DDL Schema Modal
window.openRbacSchemaModal = () => {
    const existing = document.getElementById('rbac-schema-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'rbac-schema-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; z-index: 100020;
    `;

    const sqlCode = `-- ============================================================================
-- STELLO BUILD BMS - ENTERPRISE ROLE-BASED ACCESS CONTROL (RBAC) SCHEMA
-- Database Compatibility: PostgreSQL 14+ / MySQL 8.0+ / SQLite 3
-- ============================================================================

CREATE TABLE erp_roles (
    role_id VARCHAR(50) PRIMARY KEY,
    role_code VARCHAR(30) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    hierarchy_level INT NOT NULL DEFAULT 4,
    badge_color VARCHAR(20) DEFAULT '#38bdf8',
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE erp_modules (
    module_id VARCHAR(50) PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'box',
    route_path VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE erp_role_permissions (
    id VARCHAR(64) PRIMARY KEY,
    role_id VARCHAR(50) NOT NULL REFERENCES erp_roles(role_id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL REFERENCES erp_modules(module_id) ON DELETE CASCADE,
    can_view BOOLEAN NOT NULL DEFAULT FALSE,
    can_create BOOLEAN NOT NULL DEFAULT FALSE,
    can_read BOOLEAN NOT NULL DEFAULT FALSE,
    can_update BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    data_scope VARCHAR(20) NOT NULL DEFAULT 'none',
    CONSTRAINT unq_role_module UNIQUE (role_id, module_id)
);

CREATE TABLE erp_users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    role_id VARCHAR(50) NOT NULL REFERENCES erp_roles(role_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE erp_user_permission_overrides (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES erp_users(user_id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL REFERENCES erp_modules(module_id) ON DELETE CASCADE,
    can_view BOOLEAN NOT NULL DEFAULT FALSE,
    can_create BOOLEAN NOT NULL DEFAULT FALSE,
    can_read BOOLEAN NOT NULL DEFAULT FALSE,
    can_update BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    data_scope VARCHAR(20) NOT NULL DEFAULT 'none',
    CONSTRAINT unq_user_module UNIQUE (user_id, module_id)
);`;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 800px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; background: #0b1120; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 14px; overflow: hidden; box-shadow: 0 25px 65px rgba(0,0,0,0.85);">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                        <i data-lucide="database" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; color: #f8fafc; font-weight: 700;">Database RBAC Schema DDL (SQL)</h3>
                        <div style="font-size: 0.74rem; color: #94a3b8;">DDL Architecture for PostgreSQL / MySQL / SQLite database engines</div>
                    </div>
                </div>
                <button type="button" onclick="document.getElementById('rbac-schema-modal').remove()" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px;">
                    <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                </button>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem;">
                <pre style="margin: 0; background: #040810; padding: 1.25rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); color: #38bdf8; font-family: 'Fira Code', monospace; font-size: 0.8rem; line-height: 1.5; overflow-x: auto;"><code>${sqlCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
            </div>
            <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.76rem; color: #cbd5e1;">Available on disk at: <code style="color: #38bdf8;">data/rbac_schema.sql</code></span>
                <div style="display: flex; gap: 0.65rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('rbac-schema-modal').remove()" style="padding: 0.45rem 1.2rem;">Close</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

// RBAC Security Audit Modal
window.openRbacAuditModal = () => {
    const existing = document.getElementById('rbac-audit-modal');
    if (existing) existing.remove();

    const store = window.Store || Store;
    const rbac = (store.state && store.state.rbac) || DEFAULT_RBAC_CONFIG;
    const auditLogs = rbac.auditLogs || [];

    const modal = document.createElement('div');
    modal.id = 'rbac-audit-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; z-index: 100020;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 750px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; background: #0b1120; border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 14px; overflow: hidden; box-shadow: 0 25px 65px rgba(0,0,0,0.85);">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(52, 211, 153, 0.15); display: flex; align-items: center; justify-content: center; color: #34d399;">
                        <i data-lucide="shield-check" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; color: #f8fafc; font-weight: 700;">RBAC Security Audit Trail</h3>
                        <div style="font-size: 0.74rem; color: #94a3b8;">Immutable logging of role modifications & permission overrides</div>
                    </div>
                </div>
                <button type="button" onclick="document.getElementById('rbac-audit-modal').remove()" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px;">
                    <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                </button>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem;">
                ${auditLogs.length === 0 ? `
                    <div style="text-align: center; padding: 3rem 1rem; color: #94a3b8;">
                        <i data-lucide="shield" style="width: 42px; height: 42px; margin-bottom: 0.75rem; opacity: 0.4;"></i>
                        <p style="margin: 0; font-size: 0.95rem;">No security modification events logged yet.</p>
                        <span style="font-size: 0.75rem; color: #64748b;">Events are logged automatically when permissions are updated.</span>
                    </div>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${auditLogs.map(log => `
                            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem 1.15rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 3px;">
                                        <span style="font-weight: 700; font-size: 0.85rem; color: #f8fafc;">${log.action || 'PERM_UPDATE'}</span>
                                        <span style="font-size: 0.68rem; padding: 1px 6px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-family: monospace;">
                                            ${log.targetRole || log.targetUser || 'GLOBAL'}
                                        </span>
                                    </div>
                                    <div style="font-size: 0.8rem; color: #cbd5e1;">${log.details || 'Permissions updated'}</div>
                                    <div style="font-size: 0.72rem; color: #64748b; margin-top: 4px;">Admin ID: ${log.adminId || 'SB-9901'}</div>
                                </div>
                                <span style="font-size: 0.72rem; color: #94a3b8; white-space: nowrap;">${new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
            <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('rbac-audit-modal').remove()" style="padding: 0.45rem 1.2rem;">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};
