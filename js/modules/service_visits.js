import { Store } from '../store.js';

window.serviceVisitFilter = window.serviceVisitFilter || 'all';
window.serviceVisitSearch = window.serviceVisitSearch || '';

export function renderServiceVisits(state) {
    const container = document.createElement('div');
    container.className = 'service-visits-view animate-fade-in';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '1.5rem';
    container.style.paddingBottom = '3rem';

    const services = state.services || [];
    const staffList = state.staff || [];
    const customers = state.customers || [];

    // Filter & Search
    const filtered = services.filter(s => {
        const statusKey = (s.status || '').toLowerCase().replace(/\s+/g, '_');
        let matchesFilter = true;
        if (window.serviceVisitFilter === 'open') {
            matchesFilter = s.status === 'Scheduled' || s.status === 'In Progress' || s.status === 'Open';
        } else if (window.serviceVisitFilter === 'pending_verification') {
            matchesFilter = s.status === 'Completed by Tech' || s.status === 'Completed' && !s.approvalDetails;
        } else if (window.serviceVisitFilter === 'approved') {
            matchesFilter = s.status === 'Approved' || s.status === 'Ready' || (s.approvalDetails && s.approvalDetails.status);
        }

        const q = (window.serviceVisitSearch || '').toLowerCase().trim();
        const matchesSearch = !q ||
            (s.customer && s.customer.toLowerCase().includes(q)) ||
            (s.phone && s.phone.includes(q)) ||
            (s.location && s.location.toLowerCase().includes(q)) ||
            (s.issue && s.issue.toLowerCase().includes(q)) ||
            (s.details && s.details.toLowerCase().includes(q)) ||
            (s.technician && s.technician.toLowerCase().includes(q));

        return matchesFilter && matchesSearch;
    });

    const totalCount = services.length;
    const openCount = services.filter(s => s.status === 'Scheduled' || s.status === 'In Progress' || s.status === 'Open').length;
    const pendingApprovalCount = services.filter(s => s.status === 'Completed by Tech' || (s.status === 'Completed' && !s.approvalDetails)).length;
    const approvedCount = services.filter(s => s.status === 'Approved' || s.status === 'Ready' || (s.approvalDetails && s.approvalDetails.status)).length;

    container.innerHTML = `
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 style="font-size: 1.75rem; margin: 0; display: flex; align-items: center; gap: 0.65rem; color: var(--color-text-heading); font-weight: 700;">
                    <span style="width: 40px; height: 40px; border-radius: 10px; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); display: flex; align-items: center; justify-content: center; color: #fbbf24;">
                        <i data-lucide="wrench" style="width: 22px; height: 22px;"></i>
                    </span>
                    Service Visit Management
                </h1>
                <p style="color: var(--color-text-muted); margin: 6px 0 0; font-size: 0.9rem;">
                    Log client service requests, upload issue photos, track technician resolution, and enforce two-tier Sales Verification Approval.
                </p>
            </div>

            <button onclick="window.openNewServiceRequestModal()" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; font-size: 0.95rem; font-weight: 600; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); background: #f59e0b; border-color: #f59e0b; color: black;">
                <i data-lucide="plus-circle" style="width: 18px; height: 18px;"></i>
                Log Service Request
            </button>
        </div>

        <!-- KPI Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div class="glass-panel visit-kpi-card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: var(--color-bg-surface-glass); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);">
                    <i data-lucide="tool" style="width: 24px; height: 24px;"></i>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Total Services</span>
                    <div class="visit-kpi-num" style="font-size: 1.6rem; font-weight: 800; color: var(--color-text-heading);">${totalCount}</div>
                </div>
            </div>

            <div class="glass-panel visit-kpi-card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(59, 130, 246, 0.15); display: flex; align-items: center; justify-content: center; color: #60a5fa;">
                    <i data-lucide="clock" style="width: 24px; height: 24px;"></i>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: #93c5fd; text-transform: uppercase; font-weight: 600;">Open / Scheduled</span>
                    <div class="visit-kpi-num" style="font-size: 1.6rem; font-weight: 800; color: #60a5fa;">${openCount}</div>
                </div>
            </div>

            <!-- Approval Stage KPI -->
            <div class="glass-panel visit-kpi-card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem; border-color: rgba(245, 158, 11, 0.4);">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(245, 158, 11, 0.2); display: flex; align-items: center; justify-content: center; color: #fbbf24;">
                    <i data-lucide="shield-alert" style="width: 24px; height: 24px;"></i>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: #fde68a; text-transform: uppercase; font-weight: 700;">Needs Sales Approval</span>
                    <div class="visit-kpi-num" style="font-size: 1.6rem; font-weight: 800; color: #fbbf24;">${pendingApprovalCount}</div>
                </div>
            </div>

            <div class="glass-panel visit-kpi-card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(34, 197, 94, 0.15); display: flex; align-items: center; justify-content: center; color: #4ade80;">
                    <i data-lucide="shield-check" style="width: 24px; height: 24px;"></i>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: #86efac; text-transform: uppercase; font-weight: 600;">Approved & Ready</span>
                    <div class="visit-kpi-num" style="font-size: 1.6rem; font-weight: 800; color: #4ade80;">${approvedCount}</div>
                </div>
            </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="glass-panel" style="padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <!-- Filter Pills -->
            <div class="visit-filter-bar" style="display: flex; gap: 0.4rem; padding: 4px; border-radius: 8px; border: 1px solid var(--glass-border);">
                ${[
                    { id: 'all', label: 'All Requests' },
                    { id: 'open', label: 'Open / Scheduled' },
                    { id: 'pending_verification', label: 'Needs Verification (Tech Done)' },
                    { id: 'approved', label: 'Approved / Ready' }
                ].map(f => `
                    <button class="visit-filter-btn ${window.serviceVisitFilter === f.id ? 'active' : ''}" onclick="window.setServiceVisitFilter('${f.id}')"
                            style="border: none; border-radius: 6px; padding: 6px 14px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; font-weight: 600; background: ${window.serviceVisitFilter === f.id ? 'var(--color-primary)' : 'transparent'}; color: ${window.serviceVisitFilter === f.id ? 'white' : 'var(--color-text-muted)'};">
                        ${f.label}
                    </button>
                `).join('')}
            </div>

            <!-- Search input -->
            <div style="position: relative; min-width: 280px;">
                <i data-lucide="search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--color-text-muted);"></i>
                <input type="text" 
                       value="${window.serviceVisitSearch || ''}" 
                       placeholder="Search customer, issue, technician..."
                       oninput="window.setServiceVisitSearch(this.value)"
                       class="glass-input" 
                       style="padding-left: 34px; width: 100%; font-size: 0.88rem;">
            </div>
        </div>

        <!-- Service Visits Cards Grid -->
        ${filtered.length === 0 ? `
            <div class="glass-panel" style="padding: 3rem; text-align: center; color: var(--color-text-muted);">
                <i data-lucide="wrench" style="width: 48px; height: 48px; opacity: 0.4; margin-bottom: 1rem;"></i>
                <h3>No Service Requests Found</h3>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Try adjusting your filter or log a new service request using the button above.</p>
            </div>
        ` : `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(460px, 1fr)); gap: 1.25rem;">
                ${filtered.map(service => renderServiceVisitCard(service)).join('')}
            </div>
        `}
    `;

    return container;
}

function renderServiceVisitCard(service) {
    const isApproved = service.status === 'Approved' || service.status === 'Ready' || (service.approvalDetails && service.approvalDetails.status);
    const isPendingApproval = service.status === 'Completed by Tech' || (service.status === 'Completed' && !service.approvalDetails);
    const isOpen = !isApproved && !isPendingApproval;

    let statusBg = 'rgba(59, 130, 246, 0.15)';
    let statusColor = '#60a5fa';
    let statusBorder = 'rgba(59, 130, 246, 0.4)';
    let statusLabel = service.status;

    if (isApproved) {
        statusBg = 'rgba(34, 197, 94, 0.15)';
        statusColor = '#4ade80';
        statusBorder = 'rgba(34, 197, 94, 0.4)';
        statusLabel = 'Approved / Ready';
    } else if (isPendingApproval) {
        statusBg = 'rgba(245, 158, 11, 0.15)';
        statusColor = '#fbbf24';
        statusBorder = 'rgba(245, 158, 11, 0.4)';
        statusLabel = 'Needs Sales Verification';
    }

    const issueFiles = service.issueFiles || [];
    const res = service.resolutionDetails;
    const app = service.approvalDetails;

    return `
        <div class="glass-panel service-visit-card" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1.25rem; border-radius: 12px; border: 1px solid var(--glass-border); position: relative; overflow: hidden;">
            
            <!-- Top Bar: ID, Date, Status Badge -->
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-family: monospace; font-weight: 700; color: var(--color-text-muted); font-size: 0.85rem;">${service.id}</span>
                        <span style="background: var(--color-bg-surface-glass); border: 1px solid var(--glass-border); padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; color: var(--color-text-main);">
                            <i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i>
                            ${service.date} ${service.time ? `• ${service.time}` : ''}
                        </span>
                        ${service.priority ? `
                            <span style="background: ${service.priority === 'Urgent' || service.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'}; color: ${service.priority === 'Urgent' || service.priority === 'High' ? '#f87171' : '#60a5fa'}; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">
                                ${service.priority}
                            </span>
                        ` : ''}
                    </div>

                    <span style="background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                        <span style="width: 6px; height: 6px; border-radius: 50%; background: ${statusColor};"></span>
                        ${statusLabel}
                    </span>
                </div>

                <!-- Customer Title & Contacts -->
                <h3 style="margin: 0 0 0.4rem; font-size: 1.2rem; color: var(--color-text-heading); font-weight: 700;">
                    ${service.customer}
                </h3>

                <div style="display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.85rem; color: var(--color-text-muted);">
                    ${service.phone ? `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="phone" style="width: 14px; height: 14px; color: #60a5fa;"></i>
                            <a href="tel:${service.phone}" style="color: #60a5fa; text-decoration: none;">${service.phone}</a>
                        </div>
                    ` : ''}
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="map-pin" style="width: 14px; height: 14px; color: #f87171;"></i>
                        <span>${service.location || 'Site Location'}</span>
                    </div>
                </div>

                <!-- Specific Issue / Complaint Box -->
                <div class="visit-notes-box" style="margin-top: 0.85rem; padding: 0.85rem; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; font-size: 0.85rem;">
                    <div style="font-weight: 700; color: #ef4444; margin-bottom: 2px; display: flex; align-items: center; gap: 0.4rem;">
                        <i data-lucide="alert-triangle" style="width: 14px; height: 14px;"></i>
                        ${service.issue || service.title || 'Reported Issue'}
                    </div>
                    <div style="color: var(--color-text-main); font-size: 0.82rem; margin-top: 2px;">
                        ${service.details || service.notes || 'Service complaint logged.'}
                    </div>
                </div>

                <!-- Initial Issue Photos/Files Uploaded -->
                ${issueFiles.length > 0 ? `
                    <div style="margin-top: 0.75rem;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 0.35rem;">
                            Issue Photos / Attachments (${issueFiles.length})
                        </span>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                            ${issueFiles.map(f => `
                                <div onclick="window.previewSiteFile('${f.name}', '${f.type}', '${f.size}')"
                                     class="visit-file-chip"
                                     style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; color: #ef4444; cursor: pointer; border: 1px solid var(--glass-border);">
                                    <i data-lucide="${f.type === 'video' ? 'video' : f.type === 'pdf' ? 'file-text' : 'image'}" style="width: 12px; height: 12px;"></i>
                                    <span>${f.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Technician Resolution Details (Staff Update Feature) -->
                ${res ? `
                    <div style="margin-top: 1rem; padding: 0.85rem; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                            <span style="font-size: 0.78rem; font-weight: 700; color: #2563eb; display: flex; align-items: center; gap: 0.35rem;">
                                <i data-lucide="check" style="width: 14px; height: 14px;"></i>
                                Technician Work Resolution
                            </span>
                            <span style="font-size: 0.7rem; color: var(--color-text-muted);">${res.completedDate || 'Completed'}</span>
                        </div>
                        <div style="font-size: 0.82rem; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                            ${res.notes}
                        </div>
                        ${res.partsReplaced ? `
                            <div style="font-size: 0.75rem; color: var(--color-text-muted);">
                                Parts / Materials: <strong style="color: var(--color-text-main);">${res.partsReplaced}</strong>
                            </div>
                        ` : ''}
                        <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px;">
                            Completed by: <strong style="color: #2563eb;">${res.technician || service.technician}</strong>
                        </div>

                        ${res.files && res.files.length > 0 ? `
                            <div style="display: flex; gap: 0.4rem; margin-top: 0.5rem; flex-wrap: wrap;">
                                ${res.files.map(rf => `
                                    <div onclick="window.previewSiteFile('${rf.name}', '${rf.type}', '${rf.size}')"
                                         class="visit-file-chip"
                                         style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 3px 6px; border-radius: 4px; font-size: 0.72rem; color: #2563eb; cursor: pointer; border: 1px solid var(--glass-border);">
                                        <i data-lucide="${rf.type === 'video' ? 'video' : 'image'}" style="width: 12px; height: 12px;"></i>
                                        <span>${rf.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- Sales Team Verification Approval Banner -->
                ${app ? `
                    <div style="margin-top: 0.85rem; padding: 0.85rem; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                            <span style="font-size: 0.78rem; font-weight: 700; color: #16a34a; display: flex; align-items: center; gap: 0.35rem;">
                                <i data-lucide="shield-check" style="width: 15px; height: 15px;"></i>
                                Sales Team Quality Verified & ${app.status || 'Approved'}
                            </span>
                            <span style="font-size: 0.7rem; color: var(--color-text-muted);">${app.verifiedDate || 'Verified'}</span>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--color-text-heading); margin-bottom: 0.25rem;">
                            ${app.notes || 'Verified client satisfaction. Ready for billing.'}
                        </div>
                        <div style="font-size: 0.74rem; color: var(--color-text-muted);">
                            Verified by: <strong style="color: var(--color-text-main);">${app.verifiedBy || 'Sales Lead'}</strong>
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Footer & Actions (Staff Resolution vs Sales Verification) -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 1rem; margin-top: 0.5rem; flex-wrap: wrap; gap: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: black;">
                        ${(service.technician || 'T').charAt(0)}
                    </div>
                    <div>
                        <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-heading);">${service.technician || 'Unassigned Tech'}</div>
                        <div style="font-size: 0.7rem; color: var(--color-text-muted);">Service Technician</div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    
                    <!-- Technician Staff Update Button -->
                    <button onclick="window.openServiceResolutionModal('${service.id}')"
                            class="btn btn-secondary"
                            style="padding: 0.45rem 0.85rem; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.35rem; border-color: #f59e0b; color: #d97706;"
                            title="Technician: enter resolution details and upload photos">
                        <i data-lucide="check-square" style="width: 14px; height: 14px;"></i>
                        ${res ? 'Update Resolution' : 'Staff Complete'}
                    </button>

                    <!-- Sales Approval / Verification Workflow Button -->
                    ${isPendingApproval ? `
                        <button onclick="window.openSalesApprovalModal('${service.id}')"
                                class="btn btn-primary"
                                style="padding: 0.45rem 1rem; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; background: #22c55e; border-color: #22c55e; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);"
                                title="Sales Staff: Verify completed service and mark Approved/Ready">
                            <i data-lucide="shield-check" style="width: 15px; height: 15px;"></i>
                            Verify & Approve (Sales)
                        </button>
                    ` : isApproved ? `
                        <button onclick="window.openSalesApprovalModal('${service.id}')"
                                class="btn btn-secondary"
                                style="padding: 0.45rem 0.75rem; font-size: 0.75rem; border-color: rgba(34, 197, 94, 0.4); color: #16a34a;"
                                title="View sales verification details">
                            <i data-lucide="check-circle" style="width: 13px; height: 13px;"></i>
                            Approved
                        </button>
                    ` : ''}

                </div>
            </div>

        </div>
    `;
}

// --- GLOBAL WINDOW HANDLERS FOR SERVICE VISITS ---

window.setServiceVisitFilter = (filter) => {
    window.serviceVisitFilter = filter;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.setServiceVisitSearch = (query) => {
    window.serviceVisitSearch = query;
    const store = window.Store || Store;
    if (store) store.notify();
};

// --- MODAL: LOG NEW SERVICE REQUEST ---
window.openNewServiceRequestModal = () => {
    const store = window.Store || Store;
    const customers = store.state.customers || [];
    const staffList = store.state.staff || [];

    window.newServiceUploadedFiles = [];

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'new-service-modal';
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
                    <i data-lucide="wrench" style="color: #f59e0b;"></i>
                    Log Service Request
                </h3>
                <button onclick="document.getElementById('new-service-modal').remove()" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer;">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <form onsubmit="window.saveNewServiceRequest(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                
                <!-- Universal Customer Search -->
                <div>
                    ${window.UniversalCustomerSearch ? window.UniversalCustomerSearch.renderHTML({
                        id: 'service-customer-search',
                        label: 'Search / Select Customer (Auto-populates details)',
                        placeholder: 'Please select a customer name',
                        infoTooltip: 'Search verified clients, leads, and price calculation contacts'
                    }) : `
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.35rem;">Select Customer</label>
                        <select onchange="window.autoFillServiceCustomer(this.value)" class="glass-input" style="width: 100%;">
                            <option value="">-- Select Existing Client --</option>
                        </select>
                    `}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                            Customer Name <span style="color: #ef4444;">*</span>
                        </label>
                        <input type="text" id="srv-cust-name" required placeholder="e.g. Arun Kumar" class="glass-input" style="width: 100%;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                            Customer Phone / Contact <span style="color: #ef4444;">*</span>
                        </label>
                        <input type="text" id="srv-cust-phone" required placeholder="e.g. 9846112233" class="glass-input" style="width: 100%;">
                    </div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                        Site Location / Address <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="text" id="srv-location" required placeholder="e.g. Kozhikode, Kerala" class="glass-input" style="width: 100%;">
                </div>

                <!-- Specific Issue / Complaint -->
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                        Specific Issue / Complaint Title <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="text" id="srv-issue-title" required placeholder="e.g. Friction stay hinge loose, window vibrating in wind" class="glass-input" style="width: 100%;">
                </div>

                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                        Complaint Details & Observations
                    </label>
                    <textarea id="srv-issue-details" rows="2" placeholder="e.g. Master bedroom French window top transom loose; customer noticed rattling during heavy winds." class="glass-input" style="width: 100%; resize: vertical;"></textarea>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem;">Priority</label>
                        <select id="srv-priority" class="glass-input" style="width: 100%;">
                            <option value="Urgent">Urgent</option>
                            <option value="High" selected>High</option>
                            <option value="Medium">Medium</option>
                            <option value="Routine">Routine</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem;">Service Date *</label>
                        <input type="date" id="srv-date" required value="${new Date().toISOString().split('T')[0]}" class="glass-input" style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem;">Assign Technician *</label>
                        <select id="srv-tech" class="glass-input" style="width: 100%;">
                            ${staffList.map(s => `<option value="${s.name}">${s.name} (${s.role})</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Issue File Uploads (Photos/Videos of the Complaint) -->
                <div style="border: 2px dashed rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 1rem; background: rgba(245, 158, 11, 0.05); text-align: center;">
                    <i data-lucide="image" style="width: 28px; height: 28px; color: #fbbf24; margin-bottom: 0.25rem;"></i>
                    <div style="font-size: 0.88rem; font-weight: 600; color: var(--color-text-heading);">Upload Issue Photos or Defect Videos</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); margin: 2px 0 0.75rem;">Attach photos of damaged hardware, rattling glass, or defect proof</div>

                    <input type="file" id="srv-file-input" multiple accept="image/*,video/*,application/pdf" style="display: none;" onchange="window.handleNewServiceFileSelect(event)">

                    <button type="button" onclick="document.getElementById('srv-file-input').click()" class="btn btn-secondary" style="padding: 0.45rem 1rem; font-size: 0.82rem; border-color: #f59e0b; color: #fbbf24;">
                        <i data-lucide="paperclip" style="width: 14px; height: 14px;"></i> Choose Issue Files
                    </button>

                    <div id="srv-uploaded-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 0.75rem;">
                        <!-- Dynamically populated -->
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" onclick="document.getElementById('new-service-modal').remove()" class="btn btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" style="padding: 0.6rem 1.5rem; background: #f59e0b; border-color: #f59e0b; color: black; font-weight: 700;">
                        <i data-lucide="check" style="width: 16px; height: 16px;"></i> Log Request
                    </button>
                </div>

            </form>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    if (window.UniversalCustomerSearch) {
        window.UniversalCustomerSearch.register('service-customer-search', {
            onSelect: (cust) => {
                const nameInp = document.getElementById('srv-cust-name');
                const phoneInp = document.getElementById('srv-cust-phone');
                const locInp = document.getElementById('srv-location');
                if (nameInp) nameInp.value = cust.name;
                if (phoneInp) phoneInp.value = cust.mobile || cust.phone || '';
                if (locInp) locInp.value = cust.address || cust.location || '';
            },
            onClear: () => {
                const nameInp = document.getElementById('srv-cust-name');
                const phoneInp = document.getElementById('srv-cust-phone');
                const locInp = document.getElementById('srv-location');
                if (nameInp) nameInp.value = '';
                if (phoneInp) phoneInp.value = '';
                if (locInp) locInp.value = '';
            }
        });
    }
};

window.autoFillServiceCustomer = (custId) => {
    const store = window.Store || Store;
    const c = (store.state.customers || []).find(it => it.id === custId);
    if (c) {
        document.getElementById('srv-cust-name').value = c.name;
        document.getElementById('srv-cust-phone').value = c.mobile || '';
        document.getElementById('srv-location').value = c.address || '';
    }
};

window.handleNewServiceFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(f => {
        const isVideo = f.type.includes('video') || f.name.match(/\.(mp4|mov)$/i);
        const isPdf = f.name.toLowerCase().endsWith('.pdf');
        window.newServiceUploadedFiles.push({
            name: f.name,
            type: isVideo ? 'video' : isPdf ? 'pdf' : 'image',
            size: (f.size / (1024 * 1024)).toFixed(1) + ' MB'
        });
    });
    renderNewServiceUploadedBadges();
};

function renderNewServiceUploadedBadges() {
    const container = document.getElementById('srv-uploaded-list');
    if (!container) return;
    container.innerHTML = window.newServiceUploadedFiles.map((f, i) => `
        <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; color: #fde68a;">
            <i data-lucide="${f.type === 'video' ? 'video' : f.type === 'pdf' ? 'file-text' : 'image'}" style="width: 12px; height: 12px;"></i>
            <span>${f.name}</span>
            <span style="opacity: 0.7;">(${f.size})</span>
            <button type="button" onclick="window.removeNewServiceFile(${i})" style="background: none; border: none; color: #f87171; cursor: pointer; padding: 0 2px;">&times;</button>
        </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
}

window.removeNewServiceFile = (index) => {
    window.newServiceUploadedFiles.splice(index, 1);
    renderNewServiceUploadedBadges();
};

window.saveNewServiceRequest = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const store = window.Store || Store;

    const customer = document.getElementById('srv-cust-name').value.trim();
    const phone = document.getElementById('srv-cust-phone').value.trim();
    const location = document.getElementById('srv-location').value.trim();
    const issue = document.getElementById('srv-issue-title').value.trim();
    const details = document.getElementById('srv-issue-details').value.trim();
    const priority = document.getElementById('srv-priority').value;
    const date = document.getElementById('srv-date').value;
    const technician = document.getElementById('srv-tech').value;

    const issueFiles = [...window.newServiceUploadedFiles];
    if (issueFiles.length === 0) {
        issueFiles.push({ name: 'complaint_photo.jpg', type: 'image', size: '1.2 MB' });
    }

    const newService = {
        id: 'SRV-' + Math.floor(800 + Math.random() * 199),
        customer,
        phone,
        location,
        issue,
        details,
        priority,
        date,
        technician,
        status: 'Scheduled',
        issueFiles,
        resolutionDetails: null,
        approvalDetails: null
    };

    store.addServiceVisit(newService);
    document.getElementById('new-service-modal')?.remove();
};

// --- MODAL: STAFF UPDATE FEATURE (TECHNICIAN COMPLETION OF WORK) ---
window.openServiceResolutionModal = (serviceId) => {
    const store = window.Store || Store;
    const s = (store.state.services || []).find(it => it.id === serviceId);
    if (!s) return alert('Service Request not found!');

    window.serviceResolutionUploadedFiles = [];

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'service-resolution-modal';
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
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; color: #d97706;">
                        <i data-lucide="check-square" style="color: #d97706;"></i>
                        Technician Work Resolution Update
                    </h3>
                    <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--color-text-muted);">
                        Record completed repair work, parts used, and upload resolution photos for Sales verification.
                    </p>
                </div>
                <button onclick="document.getElementById('service-resolution-modal').remove()" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer;">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <form onsubmit="window.saveServiceResolution(event, '${s.id}')" style="display: flex; flex-direction: column; gap: 1rem;">
                
                <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 0.85rem; font-size: 0.85rem;">
                    <div style="color: #ef4444; font-weight: 700;">Issue: ${s.issue}</div>
                    <div style="color: var(--color-text-main); font-size: 0.8rem; margin-top: 2px;">Client: <strong>${s.customer}</strong> • Site: ${s.location}</div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                        Details of Resolution (Work Performed) <span style="color: #ef4444;">*</span>
                    </label>
                    <textarea id="res-notes" required rows="3" placeholder="e.g. Replaced worn 4-inch friction stay hinges, resealed outer transom weather bead with neutral silicone, lubricated lock espag mechanism, tested 10 opening cycles smoothly." class="glass-input" style="width: 100%; resize: vertical;"></textarea>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                            Parts / Hardware Replaced
                        </label>
                        <input type="text" id="res-parts" placeholder="e.g. 2x SS Hinges 4in, 1x Weather Silicone" class="glass-input" style="width: 100%;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.35rem; font-weight: 600;">
                            Technician Name
                        </label>
                        <input type="text" id="res-tech" value="${s.technician || 'Service Tech'}" required class="glass-input" style="width: 100%;">
                    </div>
                </div>

                <!-- Upload Photos and Details of Resolution with Native Camera Support -->
                <div style="border: 2px dashed rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 1rem; background: rgba(245, 158, 11, 0.05); text-align: center;">
                    <i data-lucide="camera" style="width: 28px; height: 28px; color: #d97706; margin-bottom: 0.25rem;"></i>
                    <div style="font-size: 0.88rem; font-weight: 600; color: var(--color-text-heading);">Service Verification: Photos & Videos</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); margin: 2px 0 0.75rem;">Capture on-site resolution photos directly or attach video proof</div>

                    <!-- Native Camera Capture Input -->
                    <input type="file" id="res-camera-input" accept="image/*" capture="environment" style="display: none;" onchange="window.handleResolutionFileSelect(event)">
                    <!-- Standard File Input -->
                    <input type="file" id="res-file-input" multiple accept="image/*,video/*" style="display: none;" onchange="window.handleResolutionFileSelect(event)">

                    <div style="display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap;">
                        <button type="button" onclick="document.getElementById('res-camera-input').click()" class="btn btn-primary" style="padding: 0.45rem 1rem; font-size: 0.82rem; background: #f59e0b; border-color: #f59e0b; color: black; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                            <i data-lucide="camera" style="width: 14px; height: 14px;"></i> Snap Photo (Camera)
                        </button>
                        <button type="button" onclick="document.getElementById('res-file-input').click()" class="btn btn-secondary" style="padding: 0.45rem 1rem; font-size: 0.82rem; border-color: #f59e0b; color: #d97706; display: inline-flex; align-items: center; gap: 5px;">
                            <i data-lucide="folder-open" style="width: 14px; height: 14px;"></i> Browse Files
                        </button>
                    </div>

                    <div id="res-uploaded-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 0.75rem;">
                        <!-- Dynamically populated with preview thumbnails -->
                    </div>
                </div>

                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 6px; padding: 0.65rem 0.85rem; font-size: 0.78rem; color: #d97706;">
                    <strong>ℹ️ Workflow Notice:</strong> Submitting will mark this task as <em>Completed by Technician</em> and automatically route it to the <strong>Sales Team for Quality Verification & Approval</strong>.
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" onclick="document.getElementById('service-resolution-modal').remove()" class="btn btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" style="padding: 0.6rem 1.5rem; background: #f59e0b; border-color: #f59e0b; color: black; font-weight: 700;">
                        <i data-lucide="check" style="width: 16px; height: 16px;"></i> Submit for Sales Verification
                    </button>
                </div>

            </form>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.handleResolutionFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(f => {
        const isVideo = f.type.includes('video') || f.name.match(/\.(mp4|mov)$/i);
        const isImg = f.type.includes('image') || f.name.match(/\.(jpg|jpeg|png|webp)$/i);
        let previewUrl = null;
        if (isImg && typeof URL !== 'undefined') {
            previewUrl = URL.createObjectURL(f);
        }
        window.serviceResolutionUploadedFiles.push({
            name: f.name,
            type: isVideo ? 'video' : 'image',
            size: (f.size / (1024 * 1024)).toFixed(1) + ' MB',
            previewUrl: previewUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=200&auto=format&fit=crop'
        });
    });
    renderResolutionUploadedBadges();
};

function renderResolutionUploadedBadges() {
    const container = document.getElementById('res-uploaded-list');
    if (!container) return;
    container.innerHTML = window.serviceResolutionUploadedFiles.map((f, i) => `
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; color: #fde68a;">
            ${f.previewUrl ? `<img src="${f.previewUrl}" alt="Preview" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover;">` : `<i data-lucide="${f.type === 'video' ? 'video' : 'image'}" style="width: 14px; height: 14px;"></i>`}
            <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.name}</span>
            <span style="opacity: 0.7;">(${f.size})</span>
            <button type="button" onclick="window.removeResolutionFile(${i})" style="background: none; border: none; color: #f87171; cursor: pointer; padding: 0 2px; font-weight: bold;">&times;</button>
        </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
}

window.removeResolutionFile = (index) => {
    window.serviceResolutionUploadedFiles.splice(index, 1);
    renderResolutionUploadedBadges();
};

window.saveServiceResolution = (e, serviceId) => {
    if (e && e.preventDefault) e.preventDefault();
    const store = window.Store || Store;

    const notes = document.getElementById('res-notes').value.trim();
    const partsReplaced = document.getElementById('res-parts').value.trim();
    const technician = document.getElementById('res-tech').value.trim();

    const files = [...window.serviceResolutionUploadedFiles];
    if (files.length === 0) {
        files.push({ name: 'work_completed_proof.jpg', type: 'image', size: '1.7 MB' });
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const resolutionData = {
        completedDate: dateStr,
        technician,
        notes,
        partsReplaced,
        files
    };

    store.completeServiceByTech(serviceId, resolutionData);
    document.getElementById('service-resolution-modal')?.remove();
};

// --- MODAL: APPROVAL WORKFLOW (SALES TEAM VERIFICATION) ---
window.openSalesApprovalModal = (serviceId) => {
    const store = window.Store || Store;
    const s = (store.state.services || []).find(it => it.id === serviceId);
    if (!s) return alert('Service Request not found!');

    const res = s.resolutionDetails || { notes: 'Repair completed by technician.', technician: s.technician };
    const app = s.approvalDetails;

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'sales-approval-modal';
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
        <div class="glass-panel visit-modal-content" style="width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 2rem; border: 1px solid rgba(34, 197, 94, 0.4); border-radius: var(--radius-lg); box-shadow: 0 10px 40px rgba(0,0,0,0.4);">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <div>
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; color: #4ade80;">
                        <i data-lucide="shield-check" style="color: #4ade80;"></i>
                        Sales Team Verification & Approval
                    </h3>
                    <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--color-text-muted);">
                        Review completed technician work, confirm customer satisfaction, and approve task status.
                    </p>
                </div>
                <button onclick="document.getElementById('sales-approval-modal').remove()" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer;">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1rem;">
                
                <!-- Summary of Job & Work Done -->
                <div class="visit-notes-box" style="border: 1px solid var(--glass-border); border-radius: 8px; padding: 1rem; font-size: 0.85rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-weight: 700; color: var(--color-text-heading); font-size: 1rem;">${s.customer}</span>
                        <span style="color: #60a5fa; font-family: monospace;">${s.id}</span>
                    </div>
                    <div style="color: #f87171; margin-bottom: 0.5rem;">Complaint: <strong>${s.issue}</strong></div>
                    
                    <div class="visit-notes-box" style="border-radius: 6px; padding: 0.75rem; border: 1px solid var(--glass-border); margin-top: 0.5rem;">
                        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700; margin-bottom: 2px;">
                            Technician Resolution (${res.completedDate || 'Recently'})
                        </div>
                        <div style="color: var(--color-text-main); font-size: 0.82rem;">${res.notes}</div>
                        ${res.partsReplaced ? `<div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px;">Parts: ${res.partsReplaced}</div>` : ''}
                    </div>
                </div>

                <!-- Verification Form Fields -->
                <form onsubmit="window.submitSalesApproval(event, '${s.id}')" style="display: flex; flex-direction: column; gap: 1rem;">
                    
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">
                            Sales Staff Verifier Name *
                        </label>
                        <input type="text" id="app-verifier" value="${(app && app.verifiedBy) || 'Rohit Sharma (Sales Lead)'}" required class="glass-input" style="width: 100%;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">
                            Customer Verification & Quality Notes *
                        </label>
                        <textarea id="app-notes" required rows="3" placeholder="e.g. Spoke with customer Arun Kumar. Confirmed French window opens smoothly and noise issue is completely resolved. Approved for warranty sign-off." class="glass-input" style="width: 100%; resize: vertical;">${(app && app.notes) || ''}</textarea>
                    </div>

                    <!-- Checklist -->
                    <div style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 6px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.8rem; color: var(--color-text-main);">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" checked required> Customer satisfaction confirmed via phone or visit
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" checked required> Resolution quality and parts used verified
                        </label>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                        <button type="button" onclick="document.getElementById('sales-approval-modal').remove()" class="btn btn-secondary">
                            Close
                        </button>
                        
                        <button type="button" onclick="window.markServiceApprovalStatus('${s.id}', 'Ready')" class="btn btn-secondary" style="border-color: #3b82f6; color: #60a5fa; font-weight: 600;">
                            <i data-lucide="check" style="width: 14px; height: 14px;"></i> Mark as Ready
                        </button>

                        <button type="submit" class="btn btn-primary" style="padding: 0.6rem 1.5rem; background: #22c55e; border-color: #22c55e; font-weight: 700; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);">
                            <i data-lucide="shield-check" style="width: 16px; height: 16px;"></i> Mark as Approved
                        </button>
                    </div>

                </form>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.submitSalesApproval = (e, serviceId) => {
    if (e && e.preventDefault) e.preventDefault();
    window.markServiceApprovalStatus(serviceId, 'Approved');
};

window.markServiceApprovalStatus = (serviceId, statusChoice) => {
    const store = window.Store || Store;
    const verifiedBy = document.getElementById('app-verifier')?.value.trim() || 'Sales Staff';
    const notes = document.getElementById('app-notes')?.value.trim() || 'Client satisfaction confirmed. Approved by Sales.';

    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const approvalData = {
        verifiedBy,
        verifiedDate: dateStr,
        status: statusChoice || 'Approved',
        notes
    };

    store.approveServiceBySales(serviceId, approvalData);
    document.getElementById('sales-approval-modal')?.remove();
};
