import { Store } from '../store.js';

// Global state variables for Leads Module
window.leadViewMode = window.leadViewMode || 'list'; // 'list' | 'create' | 'edit'
window.activeEditingLead = window.activeEditingLead || null;
window.activeLeadDetails = window.activeLeadDetails || null;
window.activeStatusConfirm = window.activeStatusConfirm || null;
window.activeLostModal = window.activeLostModal || null;
window.leadSearchQuery = window.leadSearchQuery || '';
window.leadFilterStatus = window.leadFilterStatus || 'all';
window.leadFilterSource = window.leadFilterSource || 'all';
window.tempUploadedLeadFiles = window.tempUploadedLeadFiles || [];
window.metaConfigData = window.metaConfigData || null;
window.metaModalOpen = window.metaModalOpen || false;

// Standard ERP Lead Stages & Colors
export const LEAD_STAGES = [
    { key: 'New Lead', label: 'New Lead', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: 'sparkles' },
    { key: 'Contacted', label: 'Contacted', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: 'phone-call' },
    { key: 'Qualified', label: 'Qualified', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: 'check-circle-2' },
    { key: 'Converted', label: 'Converted', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: 'award' },
    { key: 'Lost', label: 'Lost', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: 'x-circle' }
];

export const LEAD_SOURCES = [
    { key: 'Meta Ads', label: 'Meta Ads (FB/IG)', color: '#0666eb', icon: 'facebook' },
    { key: 'Website', label: 'Website Inquiry', color: '#0ea5e9', icon: 'globe' },
    { key: 'Direct Walk-in', label: 'Direct Walk-in', color: '#10b981', icon: 'footprints' },
    { key: 'Referral', label: 'Referral / Architect', color: '#8b5cf6', icon: 'user-check' },
    { key: 'Phone Call', label: 'Phone Call', color: '#f59e0b', icon: 'phone' }
];

export const STANDARD_PRODUCTS = [
    'Door',
    'Door Frame',
    'Window',
    'Fancy Window',
    'Decor',
    'CNC'
];

export const PRODUCT_META = {
    'Door': { icon: 'panel-left', badge: 'Entry & Room Doors', color: '#38bdf8' },
    'Door Frame': { icon: 'square', badge: 'Structural Chaukhat', color: '#818cf8' },
    'Window': { icon: 'layout-grid', badge: 'Sliding & Casement', color: '#34d399' },
    'Fancy Window': { icon: 'sparkles', badge: 'Architectural & Arched', color: '#f59e0b' },
    'Decor': { icon: 'gem', badge: 'Interior & Facades', color: '#ec4899' },
    'CNC': { icon: 'cpu', badge: 'Laser Cut & Jali Panels', color: '#a855f7' }
};

function getStageMeta(status) {
    return LEAD_STAGES.find(s => s.key.toLowerCase() === (status || '').toLowerCase()) || {
        key: status, label: status, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', icon: 'tag'
    };
}

function getSourceMeta(src) {
    return LEAD_SOURCES.find(s => s.key.toLowerCase() === (src || '').toLowerCase()) || {
        key: src, label: src, color: '#38bdf8', icon: 'tag'
    };
}

// In-App Toast Notification
export function showLeadToast(msg, type = 'success') {
    let toast = document.getElementById('lead-toast-banner');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'lead-toast-banner';
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 0.85rem 1.35rem;
            border-radius: var(--radius-md, 8px);
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.65rem;
            z-index: 100050;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            opacity: 0;
            transform: translateY(20px);
        `;
        document.body.appendChild(toast);
    }

    const isSuccess = type === 'success';
    const isError = type === 'error';
    const isInfo = type === 'info';

    toast.style.background = '#090e17';
    toast.style.color = '#ffffff';
    toast.style.border = `1.5px solid ${isSuccess ? '#22c55e' : (isError ? '#ef4444' : '#38bdf8')}`;
    
    const iconName = isSuccess ? 'check-circle' : (isError ? 'alert-triangle' : 'info');
    const iconColor = isSuccess ? '#22c55e' : (isError ? '#ef4444' : '#38bdf8');
    
    toast.innerHTML = `
        <i data-lucide="${iconName}" style="color: ${iconColor}; width: 18px; height: 18px; flex-shrink: 0;"></i>
        <span>${msg}</span>
    `;

    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    clearTimeout(window._leadToastTimer);
    window._leadToastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
    }, 4000);
}
window.showLeadToast = showLeadToast;

// Sound Chime for New Meta Leads
function playLeadChime() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
}

// =============================================================================
// MAIN ENTRY POINT: renderLeads
// =============================================================================
export function renderLeads(state) {
    const container = document.createElement('div');
    container.className = 'leads-module-container';
    container.style.cssText = 'width: 100%; min-height: 100%;';

    const leads = state.leads || (Store && Store.state && Store.state.leads) || [];

    if (window.leadViewMode === 'create' || window.leadViewMode === 'edit') {
        container.appendChild(renderFullPageLeadForm(window.activeEditingLead));
    } else {
        container.appendChild(renderLeadsList(leads));
    }

    // Settings / Webhook modal overlay
    if (window.metaModalOpen) {
        container.appendChild(renderMetaConfigModal());
    }

    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
    }, 20);

    return container;
}

// =============================================================================
// 1. FULL-PAGE LEAD CREATION & EDIT INTERFACE
// =============================================================================
function renderFullPageLeadForm(lead = null) {
    const isEdit = Boolean(lead && lead.id);
    const formContainer = document.createElement('div');
    formContainer.className = 'full-page-lead-form animate-fade-in';
    formContainer.style.cssText = 'padding: 0.5rem 0 3rem;';

    // Populate default values or editing values
    const currentName = isEdit ? (lead.name || '') : '';
    const currentPhone = isEdit ? (lead.phone || '') : '';
    const currentEmail = isEdit ? (lead.email || '') : '';
    const currentAddress = isEdit ? (lead.address || '') : '';
    const currentCity = isEdit ? (lead.city || 'Kozhikode') : 'Kozhikode';
    const currentSource = isEdit ? (lead.source || 'Direct Walk-in') : 'Direct Walk-in';
    const currentTimeline = isEdit ? (lead.expectedTimeline || 'Immediate (1-2 Weeks)') : 'Immediate (1-2 Weeks)';
    const currentBudget = isEdit ? (lead.estimatedBudget || 150000) : 150000;
    const currentAssigned = isEdit ? (lead.assignedTo || 'Rohit Sharma (Sales)') : 'Rohit Sharma (Sales)';
    const currentNotes = isEdit ? (lead.notes || '') : '';
    const selectedProducts = isEdit ? (lead.products || []) : [];

    // Initialize temporary files array
    if (isEdit && lead.attachments && Array.isArray(lead.attachments) && window.tempUploadedLeadFiles.length === 0) {
        window.tempUploadedLeadFiles = [...lead.attachments];
    }

    formContainer.innerHTML = `
        <!-- Top Navigation Bar / Breadcrumb -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem;">
                    <button type="button" onclick="window.cancelLeadForm()" style="background: transparent; border: none; color: var(--color-primary); cursor: pointer; padding: 0; font-size: 0.82rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                        <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i> Leads Pipeline
                    </button>
                    <span>/</span>
                    <span style="color: #cbd5e1;">${isEdit ? 'Edit Lead #' + lead.id : 'New Lead Registration'}</span>
                </div>
                <h1 style="margin: 0; font-size: 1.75rem; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                        <i data-lucide="${isEdit ? 'edit' : 'user-plus'}" style="width: 22px; height: 22px;"></i>
                    </div>
                    ${isEdit ? `Edit Lead Details: ${lead.name} (${lead.id})` : 'Dedicated Full-Page Lead Creation Interface'}
                </h1>
                <p style="margin: 0.35rem 0 0; color: var(--color-text-muted); font-size: 0.9rem;">
                    Capture complete client coordinates, site location, timeline, product requirements checklist, and attach architectural floor plans.
                </p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <button type="button" class="btn btn-secondary" onclick="window.cancelLeadForm()" style="padding: 0.65rem 1.25rem; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 6px;">
                    <i data-lucide="x" style="width: 16px; height: 16px;"></i> Cancel
                </button>
                <button type="button" class="btn btn-primary" onclick="window.submitLeadForm('${isEdit ? lead.id : ''}')" style="padding: 0.65rem 1.45rem; font-size: 0.88rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.35);">
                    <i data-lucide="save" style="width: 16px; height: 16px;"></i> ${isEdit ? 'Update Lead Record' : 'Save Lead'}
                </button>
            </div>
        </div>

        <!-- 2-Column Responsive Form Layout -->
        <form id="leadCreationForm" onsubmit="event.preventDefault(); window.submitLeadForm('${isEdit ? lead.id : ''}');">
            <div style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 1.5rem; align-items: start;">
                
                <!-- Left Column: Customer & Site Coordinates -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    
                    <!-- Basic Information Card -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg, 12px);">
                        <h3 style="margin: 0 0 1rem; font-size: 1.05rem; font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                            <i data-lucide="user" style="width: 18px; height: 18px; color: #38bdf8;"></i> Client & Contact Details
                        </h3>

                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <!-- Customer Name -->
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.4rem;">
                                    Customer / Organization Name <span style="color: #ef4444;">*</span>
                                </label>
                                <div style="position: relative;">
                                    <i data-lucide="user" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--color-text-muted);"></i>
                                    <input type="text" id="lead_name" value="${escapeHtml(currentName)}" required placeholder="e.g. Dr. Faizal Rahman or Skyline Builders" 
                                           style="width: 100%; padding: 0.65rem 0.85rem 0.65rem 2.5rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: var(--radius-md, 8px); color: white; font-size: 0.92rem;" />
                                </div>
                                <div id="err_lead_name" style="display: none; color: #ef4444; font-size: 0.76rem; margin-top: 0.25rem;">Customer Name is required.</div>
                            </div>

                            <!-- Phone / WhatsApp & Email -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div>
                                    <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.4rem;">
                                        Phone / WhatsApp <span style="color: #ef4444;">*</span>
                                    </label>
                                    <div style="position: relative;">
                                        <i data-lucide="phone" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #22c55e;"></i>
                                        <input type="tel" id="lead_phone" value="${escapeHtml(currentPhone)}" required placeholder="+91 9847 112 233" 
                                               oninput="window.validateLeadPhone(this.value)"
                                               style="width: 100%; padding: 0.65rem 0.85rem 0.65rem 2.5rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: var(--radius-md, 8px); color: white; font-size: 0.92rem;" />
                                    </div>
                                    <div id="err_lead_phone" style="display: none; color: #ef4444; font-size: 0.76rem; margin-top: 0.25rem;">Valid 10-digit phone number is required.</div>
                                </div>

                                <div>
                                    <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.4rem;">
                                        Email Address
                                    </label>
                                    <div style="position: relative;">
                                        <i data-lucide="mail" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--color-text-muted);"></i>
                                        <input type="email" id="lead_email" value="${escapeHtml(currentEmail)}" placeholder="client@example.com" 
                                               style="width: 100%; padding: 0.65rem 0.85rem 0.65rem 2.5rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: var(--radius-md, 8px); color: white; font-size: 0.92rem;" />
                                    </div>
                                </div>
                            </div>

                            <!-- Full Address / Site Location -->
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.4rem;">
                                    Full Address / Site Location
                                </label>
                                <textarea id="lead_address" rows="2" placeholder="e.g. Villa 14, Hilltop Enclave, Wayanad Road"
                                          style="width: 100%; padding: 0.65rem 0.85rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: var(--radius-md, 8px); color: white; font-size: 0.9rem; resize: vertical;">${escapeHtml(currentAddress)}</textarea>
                            </div>

                            <!-- City / District -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div>
                                    <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.4rem;">
                                        City / District
                                    </label>
                                    <select id="lead_city" style="width: 100%; padding: 0.65rem 0.85rem; background: #0f172a; border: 1px solid var(--glass-border); border-radius: var(--radius-md, 8px); color: white; font-size: 0.9rem;">
                                        ${['Kozhikode', 'Kochi', 'Malappuram', 'Wayanad', 'Kannur', 'Thrissur', 'Palakkad', 'Trivandrum', 'Kottayam', 'Kasaragod', 'Outside Kerala'].map(c => `
                                            <option value="${c}" ${c === currentCity ? 'selected' : ''}>${c}</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <div>
                                    <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.4rem;">
                                        Lead Source
                                    </label>
                                    <select id="lead_source" style="width: 100%; padding: 0.65rem 0.85rem; background: #0f172a; border: 1px solid var(--glass-border); border-radius: var(--radius-md, 8px); color: white; font-size: 0.9rem;">
                                        <option value="Meta Ads" ${currentSource === 'Meta Ads' ? 'selected' : ''}>Meta Ads (FB/IG)</option>
                                        <option value="Website" ${currentSource === 'Website' ? 'selected' : ''}>Website Inquiry</option>
                                        <option value="Direct Walk-in" ${currentSource === 'Direct Walk-in' ? 'selected' : ''}>Direct Walk-in</option>
                                        <option value="Referral" ${currentSource === 'Referral' ? 'selected' : ''}>Referral / Architect</option>
                                        <option value="Phone Call" ${currentSource === 'Phone Call' ? 'selected' : ''}>Phone Call</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Commercial Parameters Card -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg, 12px);">
                        <h3 style="margin: 0 0 1rem; font-size: 1.05rem; font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                            <i data-lucide="clock" style="width: 18px; height: 18px; color: #fbbf24;"></i> Execution Timeline & Commercials
                        </h3>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.4rem;">
                                    Expected Timeline
                                </label>
                                <select id="lead_timeline" style="width: 100%; padding: 0.65rem 0.85rem; background: #0f172a; border: 1px solid var(--glass-border); border-radius: var(--radius-md, 8px); color: white; font-size: 0.9rem;">
                                    <option value="Immediate (1-3 Days)" ${currentTimeline === 'Immediate (1-3 Days)' ? 'selected' : ''}>Immediate (1-3 Days)</option>
                                    <option value="Immediate (1-2 Weeks)" ${currentTimeline === 'Immediate (1-2 Weeks)' ? 'selected' : ''}>Immediate (1-2 Weeks)</option>
                                    <option value="Within 1 Month" ${currentTimeline === 'Within 1 Month' ? 'selected' : ''}>Within 1 Month</option>
                                    <option value="2-3 Months" ${currentTimeline === '2-3 Months' ? 'selected' : ''}>2-3 Months</option>
                                    <option value="Future Planning" ${currentTimeline === 'Future Planning' ? 'selected' : ''}>Future Planning / In Design</option>
                                </select>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.4rem;">
                                    Estimated Budget (₹)
                                </label>
                                <div style="position: relative;">
                                    <span style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #34d399; font-weight: 700;">₹</span>
                                    <input type="number" id="lead_budget" value="${currentBudget}" step="5000" min="0" placeholder="150000"
                                           style="width: 100%; padding: 0.65rem 0.85rem 0.65rem 2.2rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: var(--radius-md, 8px); color: white; font-size: 0.92rem;" />
                                </div>
                            </div>
                        </div>

                        <div style="margin-top: 1rem;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.4rem;">
                                Assigned Sales Executive
                            </label>
                            <select id="lead_assigned" style="width: 100%; padding: 0.65rem 0.85rem; background: #0f172a; border: 1px solid var(--glass-border); border-radius: var(--radius-md, 8px); color: white; font-size: 0.9rem;">
                                <option value="Rohit Sharma (Sales)" ${currentAssigned === 'Rohit Sharma (Sales)' ? 'selected' : ''}>Rohit Sharma (Sales Executive)</option>
                                <option value="Anshid (Projects Lead)" ${currentAssigned === 'Anshid (Projects Lead)' ? 'selected' : ''}>Anshid (Projects Lead)</option>
                                <option value="Shamsudheen V.K. (Director)" ${currentAssigned === 'Shamsudheen V.K. (Director)' ? 'selected' : ''}>Shamsudheen V.K. (Director / Super Admin)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Notes / Admin Remarks Card -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg, 12px);">
                        <h3 style="margin: 0 0 1rem; font-size: 1.05rem; font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                            <i data-lucide="file-text" style="width: 18px; height: 18px; color: #a855f7;"></i> Notes & Technical Remarks
                        </h3>
                        <textarea id="lead_notes" rows="3" placeholder="Enter special architectural preferences, elevation specifications, site visit notes, glass specifications, or customer constraints..."
                                  style="width: 100%; padding: 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: var(--radius-md, 8px); color: white; font-size: 0.9rem; resize: vertical;">${escapeHtml(currentNotes)}</textarea>
                    </div>

                </div>

                <!-- Right Column: Products Checklist & File Attachment Dropzone -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    
                    <!-- Products / Requirements Checklist Card (Dedicated Multi-Select Chips) -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg, 12px);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="check-square" style="width: 18px; height: 18px; color: #10b981;"></i> Product Requirements
                            </h3>
                            <div style="display: flex; align-items: center; gap: 0.4rem;">
                                <button type="button" onclick="window.selectAllLeadProducts(true)" style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 0.72rem; padding: 2px 7px; border-radius: 6px; cursor: pointer;">All</button>
                                <button type="button" onclick="window.selectAllLeadProducts(false)" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); color: #94a3b8; font-size: 0.72rem; padding: 2px 7px; border-radius: 6px; cursor: pointer;">Clear</button>
                                <span style="font-size: 0.72rem; color: var(--color-primary); background: rgba(56, 189, 248, 0.12); padding: 2px 8px; border-radius: 12px; font-weight: 600;">Multi-Select</span>
                            </div>
                        </div>

                        <p style="margin: 0 0 1rem; font-size: 0.82rem; color: var(--color-text-muted);">
                            Select all architectural product categories required by the customer:
                        </p>

                        <!-- Dedicated Multi-Select Chips Grid (2 Columns) -->
                        <div id="lead-products-chips-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                            ${STANDARD_PRODUCTS.map((prod) => {
                                const isChecked = selectedProducts.includes(prod);
                                const meta = (PRODUCT_META && PRODUCT_META[prod]) || { icon: 'box', badge: 'Fabrication', color: '#38bdf8' };
                                return `
                                    <label class="lead-product-chip" data-product="${escapeHtml(prod)}" style="
                                        display: flex; align-items: center; justify-content: space-between; gap: 0.65rem; padding: 0.75rem 0.85rem;
                                        background: ${isChecked ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.03)'};
                                        border: 1.5px solid ${isChecked ? meta.color : 'rgba(255, 255, 255, 0.08)'};
                                        border-radius: var(--radius-md, 10px); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                                        user-select: none;
                                    " onmouseover="if(!this.querySelector('input').checked) { this.style.borderColor='rgba(255,255,255,0.25)'; this.style.background='rgba(255,255,255,0.06)'; }"
                                       onmouseout="if(!this.querySelector('input').checked) { this.style.borderColor='rgba(255,255,255,0.08)'; this.style.background='rgba(255,255,255,0.03)'; }">
                                        
                                        <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0;">
                                            <div class="product-chip-icon" style="
                                                width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
                                                background: ${isChecked ? meta.color + '25' : 'rgba(255, 255, 255, 0.05)'};
                                                border: 1px solid ${isChecked ? meta.color + '60' : 'rgba(255, 255, 255, 0.1)'};
                                                display: flex; align-items: center; justify-content: center;
                                                color: ${isChecked ? meta.color : '#94a3b8'}; transition: all 0.2s ease;
                                            ">
                                                <i data-lucide="${meta.icon}" style="width: 17px; height: 17px;"></i>
                                            </div>
                                            <div style="min-width: 0;">
                                                <div class="product-chip-name" style="font-size: 0.88rem; font-weight: ${isChecked ? '700' : '600'}; color: ${isChecked ? '#f8fafc' : '#cbd5e1'}; line-height: 1.2;">
                                                    ${prod}
                                                </div>
                                                <div class="product-chip-badge" style="font-size: 0.68rem; color: ${isChecked ? meta.color : '#64748b'}; line-height: 1.2; margin-top: 2px;">
                                                    ${meta.badge}
                                                </div>
                                            </div>
                                        </div>

                                        <input type="checkbox" name="lead_product_check" value="${escapeHtml(prod)}" ${isChecked ? 'checked' : ''} 
                                               onchange="window.handleLeadProductChipChange(this)"
                                               style="width: 18px; height: 18px; accent-color: ${meta.color}; cursor: pointer; flex-shrink: 0;" />
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- File Attachment Dropzone Card -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg, 12px);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="paperclip" style="width: 18px; height: 18px; color: #38bdf8;"></i> Drawings & Attachments Dropzone
                            </h3>
                            <span style="font-size: 0.75rem; color: #94a3b8;" id="lead-file-count">${window.tempUploadedLeadFiles.length} file(s) attached</span>
                        </div>

                        <!-- Dropzone Box -->
                        <div id="leadDropzoneBox" 
                             ondragover="event.preventDefault(); this.style.borderColor='var(--color-primary)'; this.style.background='rgba(56, 189, 248, 0.08)';"
                             ondragleave="event.preventDefault(); this.style.borderColor='var(--glass-border)'; this.style.background='rgba(0,0,0,0.2)';"
                             ondrop="window.handleLeadDrop(event)"
                             style="
                                border: 2px dashed var(--glass-border); border-radius: var(--radius-md, 10px);
                                padding: 1.75rem 1rem; text-align: center; background: rgba(0,0,0,0.2);
                                transition: all 0.2s; cursor: pointer; margin-bottom: 1rem;
                             " onclick="document.getElementById('leadFileInput').click()">
                            <input type="file" id="leadFileInput" multiple accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf,.cad" style="display: none;" onchange="window.handleLeadFileInput(event)" />
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(56, 189, 248, 0.12); color: #38bdf8; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;">
                                <i data-lucide="upload-cloud" style="width: 24px; height: 24px;"></i>
                            </div>
                            <div style="font-weight: 600; font-size: 0.92rem; color: #f8fafc; margin-bottom: 0.25rem;">
                                Drag & Drop Floor Plans, Sketches or Photos
                            </div>
                            <div style="font-size: 0.78rem; color: var(--color-text-muted);">
                                Supports PDF, PNG, JPG, CAD drawings (up to 25MB each)
                            </div>
                            <button type="button" class="btn btn-secondary" style="margin-top: 0.75rem; font-size: 0.78rem; padding: 0.35rem 0.85rem;" onclick="event.stopPropagation(); document.getElementById('leadFileInput').click();">
                                Browse Local Files
                            </button>
                        </div>

                        <!-- Uploaded Files List -->
                        <div id="leadUploadedFilesList" style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${renderUploadedFileList(window.tempUploadedLeadFiles)}
                        </div>
                    </div>

                    <!-- Action Bar -->
                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                        <button type="button" class="btn btn-secondary" onclick="window.cancelLeadForm()" style="padding: 0.7rem 1.35rem;">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary" style="padding: 0.7rem 1.6rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                            <i data-lucide="check" style="width: 16px; height: 16px;"></i> ${isEdit ? 'Save Changes' : 'Create & Register Lead'}
                        </button>
                    </div>

                </div>

            </div>
        </form>
    `;

    return formContainer;
}

function renderUploadedFileList(files) {
    if (!files || files.length === 0) {
        return `<div style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 0.5rem;">No site plans or photos uploaded yet.</div>`;
    }

    return files.map((f, idx) => {
        const isPdf = f.name.toLowerCase().endsWith('.pdf');
        const isCad = f.name.toLowerCase().endsWith('.dwg') || f.name.toLowerCase().endsWith('.dxf');
        const iconName = isPdf ? 'file-text' : (isCad ? 'compass' : 'image');
        const iconColor = isPdf ? '#ef4444' : (isCad ? '#38bdf8' : '#22c55e');

        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-md, 6px);">
                <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0; flex: 1;">
                    <i data-lucide="${iconName}" style="width: 16px; height: 16px; color: ${iconColor}; flex-shrink: 0;"></i>
                    <div style="min-width: 0; flex: 1;">
                        <div style="font-size: 0.84rem; color: #f8fafc; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(f.name)}">
                            ${escapeHtml(f.name)}
                        </div>
                        <div style="font-size: 0.7rem; color: var(--color-text-muted);">
                            ${f.size || '1.5 MB'} • Uploaded
                        </div>
                    </div>
                </div>
                <button type="button" onclick="window.removeLeadFile(${idx})" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Remove File">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
            </div>
        `;
    }).join('');
}

// File Dropzone Handlers
window.handleLeadFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => {
        window.tempUploadedLeadFiles.push({
            id: 'att-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            name: f.name,
            type: f.type || 'application/octet-stream',
            size: (f.size / (1024 * 1024)).toFixed(1) + ' MB',
            date: new Date().toISOString().split('T')[0]
        });
    });
    updateUploadedFilesUI();
};

window.handleLeadDrop = (e) => {
    e.preventDefault();
    const box = document.getElementById('leadDropzoneBox');
    if (box) {
        box.style.borderColor = 'var(--glass-border)';
        box.style.background = 'rgba(0,0,0,0.2)';
    }
    const files = Array.from(e.dataTransfer.files || []);
    files.forEach(f => {
        window.tempUploadedLeadFiles.push({
            id: 'att-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            name: f.name,
            type: f.type || 'application/octet-stream',
            size: (f.size / (1024 * 1024)).toFixed(1) + ' MB',
            date: new Date().toISOString().split('T')[0]
        });
    });
    updateUploadedFilesUI();
};

window.removeLeadFile = (idx) => {
    window.tempUploadedLeadFiles.splice(idx, 1);
    updateUploadedFilesUI();
};

function updateUploadedFilesUI() {
    const listEl = document.getElementById('leadUploadedFilesList');
    if (listEl) {
        listEl.innerHTML = renderUploadedFileList(window.tempUploadedLeadFiles);
        if (window.lucide) window.lucide.createIcons();
    }
    const countEl = document.getElementById('lead-file-count');
    if (countEl) {
        countEl.innerText = `${window.tempUploadedLeadFiles.length} file(s) attached`;
    }
}

window.handleLeadProductChipChange = (inputEl) => {
    const label = inputEl.closest('.lead-product-chip');
    if (!label) return;
    const prod = inputEl.value;
    const meta = (PRODUCT_META && PRODUCT_META[prod]) || { color: '#38bdf8' };
    const checked = inputEl.checked;
    
    label.style.background = checked ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.03)';
    label.style.borderColor = checked ? meta.color : 'rgba(255, 255, 255, 0.08)';
    
    const iconBox = label.querySelector('.product-chip-icon');
    if (iconBox) {
        iconBox.style.background = checked ? meta.color + '25' : 'rgba(255, 255, 255, 0.05)';
        iconBox.style.borderColor = checked ? meta.color + '60' : 'rgba(255, 255, 255, 0.1)';
        iconBox.style.color = checked ? meta.color : '#94a3b8';
    }
    const nameEl = label.querySelector('.product-chip-name');
    if (nameEl) {
        nameEl.style.fontWeight = checked ? '700' : '600';
        nameEl.style.color = checked ? '#f8fafc' : '#cbd5e1';
    }
    const badgeEl = label.querySelector('.product-chip-badge');
    if (badgeEl) {
        badgeEl.style.color = checked ? meta.color : '#64748b';
    }
};

window.selectAllLeadProducts = (select) => {
    const checkboxes = document.querySelectorAll('input[name="lead_product_check"]');
    checkboxes.forEach(cb => {
        cb.checked = Boolean(select);
        window.handleLeadProductChipChange(cb);
    });
};

window.validateLeadPhone = (val) => {
    const digits = val.replace(/[^0-9]/g, '');
    const err = document.getElementById('err_lead_phone');
    if (err) {
        if (digits.length < 10) {
            err.style.display = 'block';
            err.innerText = 'Phone number should be at least 10 digits.';
            return false;
        } else {
            err.style.display = 'none';
            return true;
        }
    }
    return digits.length >= 10;
};

// Cancel & Open Form Handlers
window.openNewLeadForm = () => {
    window.leadViewMode = 'create';
    window.activeEditingLead = null;
    window.tempUploadedLeadFiles = [];
    if (Store && typeof Store.notify === 'function') {
        Store.notify();
    } else {
        window.navigate('leads');
    }
};

window.openEditLeadForm = (leadId) => {
    const store = window.Store || Store;
    const leads = (store && store.state && store.state.leads) || [];
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    window.leadViewMode = 'edit';
    window.activeEditingLead = lead;
    window.tempUploadedLeadFiles = lead.attachments ? [...lead.attachments] : [];
    if (Store && typeof Store.notify === 'function') {
        Store.notify();
    } else {
        window.navigate('leads');
    }
};

window.cancelLeadForm = () => {
    window.leadViewMode = 'list';
    window.activeEditingLead = null;
    window.tempUploadedLeadFiles = [];
    if (Store && typeof Store.notify === 'function') {
        Store.notify();
    } else {
        window.navigate('leads');
    }
};

window.submitLeadForm = async (editLeadId = '') => {
    const nameInput = document.getElementById('lead_name');
    const phoneInput = document.getElementById('lead_phone');
    const emailInput = document.getElementById('lead_email');
    const addressInput = document.getElementById('lead_address');
    const cityInput = document.getElementById('lead_city');
    const sourceInput = document.getElementById('lead_source');
    const timelineInput = document.getElementById('lead_timeline');
    const budgetInput = document.getElementById('lead_budget');
    const assignedInput = document.getElementById('lead_assigned');
    const notesInput = document.getElementById('lead_notes');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';

    let hasError = false;

    // Validate Customer Name
    const nameErr = document.getElementById('err_lead_name');
    if (!name) {
        if (nameErr) nameErr.style.display = 'block';
        if (nameInput) nameInput.style.borderColor = '#ef4444';
        hasError = true;
    } else {
        if (nameErr) nameErr.style.display = 'none';
        if (nameInput) nameInput.style.borderColor = 'var(--glass-border)';
    }

    // Validate Phone Number
    const phoneErr = document.getElementById('err_lead_phone');
    const digits = phone.replace(/[^0-9]/g, '');
    if (!phone || digits.length < 10) {
        if (phoneErr) {
            phoneErr.style.display = 'block';
            phoneErr.innerText = 'Valid phone number (minimum 10 digits) is required.';
        }
        if (phoneInput) phoneInput.style.borderColor = '#ef4444';
        hasError = true;
    } else {
        if (phoneErr) phoneErr.style.display = 'none';
        if (phoneInput) phoneInput.style.borderColor = 'var(--glass-border)';
    }

    if (hasError) {
        showLeadToast('Please complete all required fields.', 'error');
        return;
    }

    // Collect checked products
    const productCheckboxes = document.querySelectorAll('input[name="lead_product_check"]:checked');
    const products = Array.from(productCheckboxes).map(cb => cb.value);

    const leadPayload = {
        name: name,
        phone: phone,
        email: emailInput ? emailInput.value.trim() : '',
        address: addressInput ? addressInput.value.trim() : '',
        city: cityInput ? cityInput.value : 'Kozhikode',
        source: sourceInput ? sourceInput.value : 'Direct Walk-in',
        expectedTimeline: timelineInput ? timelineInput.value : 'Immediate (1-2 Weeks)',
        estimatedBudget: budgetInput ? Number(budgetInput.value) || 150000 : 150000,
        assignedTo: assignedInput ? assignedInput.value : 'Rohit Sharma (Sales)',
        notes: notesInput ? notesInput.value.trim() : '',
        products: products,
        attachments: [...window.tempUploadedLeadFiles]
    };

    const store = window.Store || Store;

    if (editLeadId) {
        // Edit existing lead
        await store.updateLead(editLeadId, leadPayload);
        showLeadToast(`Lead ${editLeadId} updated successfully!`);
    } else {
        // Create new lead
        leadPayload.status = 'New Lead';
        const res = await store.addLead(leadPayload);
        const newId = (res && res.lead && res.lead.id) || 'LD-NEW';
        showLeadToast(`New Lead ${newId} registered successfully!`);
    }

    // Reset View Mode
    window.leadViewMode = 'list';
    window.activeEditingLead = null;
    window.tempUploadedLeadFiles = [];
    store.notify();
};

// =============================================================================
// 2. LEADS PIPELINE LIST VIEW
// =============================================================================
function renderLeadsList(leads) {
    const listWrapper = document.createElement('div');
    listWrapper.className = 'leads-pipeline-view animate-fade-in';

    // Filter leads by search, status, and source
    const q = (window.leadSearchQuery || '').toLowerCase().trim();
    const statusFilter = window.leadFilterStatus || 'all';
    const sourceFilter = window.leadFilterSource || 'all';

    const filteredLeads = leads.filter(l => {
        if (statusFilter !== 'all' && l.status !== statusFilter) return false;
        if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
        if (q) {
            const matchName = (l.name || '').toLowerCase().includes(q);
            const matchPhone = (l.phone || '').toLowerCase().includes(q);
            const matchId = (l.id || '').toLowerCase().includes(q);
            const matchCity = (l.city || '').toLowerCase().includes(q);
            const matchAddress = (l.address || '').toLowerCase().includes(q);
            if (!matchName && !matchPhone && !matchId && !matchCity && !matchAddress) return false;
        }
        return true;
    });

    listWrapper.innerHTML = `
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--color-primary); letter-spacing: 0.05em; background: rgba(56, 189, 248, 0.1); padding: 2px 8px; border-radius: 4px;">
                        CRM & Sales Pipeline
                    </span>
                    <span style="font-size: 0.75rem; color: #22c55e; background: rgba(34, 197, 94, 0.1); padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                        <span style="width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite;"></span> Meta Webhook Active
                    </span>
                </div>
                <h1 style="margin: 0; font-size: 1.75rem; font-weight: 700; color: #f8fafc;">Leads & CRM Pipeline</h1>
                <p style="margin: 0.25rem 0 0; color: var(--color-text-muted); font-size: 0.88rem;">
                    Capture, qualify, and convert potential customers into Quotations & Confirmed Fabrication Orders.
                </p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary" onclick="window.openMetaModal()" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.86rem; padding: 0.6rem 1.15rem; border-color: rgba(56, 189, 248, 0.3);">
                    <i data-lucide="radio" style="width: 16px; height: 16px; color: #38bdf8;"></i> Meta Ads Webhook
                </button>
                <button type="button" class="btn btn-primary" onclick="window.openNewLeadForm()" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.88rem; padding: 0.6rem 1.35rem; font-weight: 600; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.35);">
                    <i data-lucide="user-plus" style="width: 16px; height: 16px;"></i> Add New Lead
                </button>
            </div>
        </div>

        <!-- 5-Stage Pipeline Metric Cards -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
            ${LEAD_STAGES.map(stage => {
                const count = leads.filter(l => l.status === stage.key).length;
                const isSelected = (window.leadFilterStatus === stage.key);
                return `
                    <div class="glass-panel" 
                         onclick="window.toggleLeadStatusFilter('${stage.key}')"
                         style="
                            padding: 1rem 1.15rem; border-left: 4px solid ${stage.color}; border-radius: var(--radius-md, 10px);
                            cursor: pointer; transition: all 0.2s; background: ${isSelected ? 'rgba(255,255,255,0.08)' : 'var(--color-bg-card)'};
                            box-shadow: ${isSelected ? '0 0 15px ' + stage.color + '44' : 'none'};
                         " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                            <span style="font-size: 0.78rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em;">
                                ${stage.label}
                            </span>
                            <div style="width: 24px; height: 24px; border-radius: 6px; background: ${stage.bg}; display: flex; align-items: center; justify-content: center; color: ${stage.color};">
                                <i data-lucide="${stage.icon}" style="width: 14px; height: 14px;"></i>
                            </div>
                        </div>
                        <div style="display: flex; align-items: baseline; justify-content: space-between;">
                            <div style="font-size: 1.65rem; font-weight: 700; color: #f8fafc;">${count}</div>
                            <span style="font-size: 0.72rem; color: ${stage.color}; font-weight: 600;">
                                ${leads.length > 0 ? Math.round((count / leads.length) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="glass-panel" style="padding: 0.85rem 1rem; margin-bottom: 1rem; border-radius: var(--radius-md, 10px); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
            <!-- Search Bar -->
            <div style="position: relative; flex: 1; max-width: 380px; min-width: 240px;">
                <i data-lucide="search" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--color-text-muted);"></i>
                <input type="text" value="${escapeHtml(window.leadSearchQuery)}" placeholder="Search by customer name, phone, city, or ID..." 
                       oninput="window.setLeadSearchQuery(this.value)"
                       style="width: 100%; padding: 0.5rem 0.85rem 0.5rem 2.35rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: var(--radius-md, 6px); color: white; font-size: 0.86rem;" />
            </div>

            <!-- Source Filter Pills -->
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                <span style="font-size: 0.76rem; color: var(--color-text-muted); margin-right: 0.2rem;">Source:</span>
                <button type="button" onclick="window.setLeadSourceFilter('all')" 
                        style="padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.76rem; font-weight: 600; cursor: pointer; border: 1px solid ${sourceFilter === 'all' ? 'var(--color-primary)' : 'var(--glass-border)'}; background: ${sourceFilter === 'all' ? 'var(--button-primary-bg)' : 'transparent'}; color: ${sourceFilter === 'all' ? '#fff' : 'var(--color-text-muted)'};">
                    All Sources
                </button>
                ${LEAD_SOURCES.map(s => {
                    const active = (sourceFilter === s.key);
                    return `
                        <button type="button" onclick="window.setLeadSourceFilter('${s.key}')" 
                                style="padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.76rem; font-weight: 600; cursor: pointer; border: 1px solid ${active ? s.color : 'var(--glass-border)'}; background: ${active ? s.color + '22' : 'transparent'}; color: ${active ? s.color : 'var(--color-text-muted)'};">
                            ${s.label}
                        </button>
                    `;
                }).join('')}
                
                ${(statusFilter !== 'all' || sourceFilter !== 'all' || q) ? `
                    <button type="button" onclick="window.clearLeadFilters()" style="background: transparent; border: none; color: #ef4444; font-size: 0.76rem; font-weight: 600; cursor: pointer; padding: 0.35rem 0.5rem;">
                        Reset Filters
                    </button>
                ` : ''}
            </div>
        </div>

        <!-- Leads Table -->
        <div class="glass-panel" style="overflow: visible; border-radius: var(--radius-lg, 12px); border: 1px solid var(--glass-border);">
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--glass-border);">
                        <tr>
                            <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; min-width: 200px;">Lead / Client</th>
                            <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; min-width: 190px;">Contact & Location</th>
                            <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; min-width: 200px;">Products Required</th>
                            <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; min-width: 130px;">Timeline & Budget</th>
                            <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; text-align: center; min-width: 140px;">Currently Stage</th>
                            <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; text-align: center; min-width: 60px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredLeads.length === 0 ? `
                            <tr>
                                <td colspan="6" style="padding: 3.5rem 1rem; text-align: center; color: var(--color-text-muted);">
                                    <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; color: #94a3b8;">
                                        <i data-lucide="inbox" style="width: 24px; height: 24px;"></i>
                                    </div>
                                    <div style="font-size: 1rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.25rem;">No leads found</div>
                                    <div style="font-size: 0.82rem;">Try adjusting your search criteria or register a new lead.</div>
                                </td>
                            </tr>
                        ` : filteredLeads.map(lead => {
                            const stageMeta = getStageMeta(lead.status);
                            const sourceMeta = getSourceMeta(lead.source);
                            const hasAttachments = lead.attachments && lead.attachments.length > 0;
                            const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');

                            return `
                                <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                    
                                    <!-- Lead / Client -->
                                    <td style="padding: 0.9rem 1rem;">
                                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                                            <div style="width: 34px; height: 34px; border-radius: 50%; background: ${sourceMeta.color}22; border: 1px solid ${sourceMeta.color}44; display: flex; align-items: center; justify-content: center; color: ${sourceMeta.color}; font-weight: 700; font-size: 0.84rem; flex-shrink: 0;">
                                                ${(lead.name || 'L').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style="font-weight: 600; font-size: 0.92rem; color: #f8fafc; cursor: pointer;" onclick="window.openLeadDetails('${lead.id}')">
                                                    ${escapeHtml(lead.name)}
                                                </div>
                                                <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 2px;">
                                                    <span style="font-family: monospace; font-size: 0.72rem; color: var(--color-primary);">${lead.id}</span>
                                                    <span style="font-size: 0.68rem; padding: 1px 6px; border-radius: 10px; background: ${sourceMeta.color}15; color: ${sourceMeta.color}; border: 1px solid ${sourceMeta.color}33;">
                                                        ${sourceMeta.label}
                                                    </span>
                                                    ${hasAttachments ? `
                                                        <span style="font-size: 0.68rem; color: #38bdf8;" title="${lead.attachments.length} attachment(s)">
                                                            📎 ${lead.attachments.length}
                                                        </span>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <!-- Contact & Location -->
                                    <td style="padding: 0.9rem 1rem;">
                                        <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.84rem; color: #cbd5e1;">
                                            <i data-lucide="phone" style="width: 13px; height: 13px; color: #22c55e;"></i>
                                            <span>${escapeHtml(lead.phone)}</span>
                                            ${cleanPhone ? `
                                                <a href="https://wa.me/${cleanPhone}" target="_blank" title="Chat on WhatsApp" style="color: #22c55e; margin-left: 2px; display: inline-flex;">
                                                    <i data-lucide="message-circle" style="width: 14px; height: 14px;"></i>
                                                </a>
                                            ` : ''}
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.74rem; color: var(--color-text-muted); margin-top: 3px;">
                                            <i data-lucide="map-pin" style="width: 12px; height: 12px; color: #ef4444;"></i>
                                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
                                                ${escapeHtml(lead.city || 'Kozhikode')}${lead.address ? ' • ' + escapeHtml(lead.address) : ''}
                                            </span>
                                        </div>
                                    </td>

                                    <!-- Products Required -->
                                    <td style="padding: 0.9rem 1rem; max-width: 220px;">
                                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                            ${(lead.products && lead.products.length > 0) ? lead.products.slice(0, 2).map(p => `
                                                <span style="font-size: 0.7rem; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); padding: 1px 6px; border-radius: 4px; color: #cbd5e1; white-space: nowrap;">
                                                    ${escapeHtml(p)}
                                                </span>
                                            `).join('') : '<span style="font-size: 0.74rem; color: var(--color-text-muted);">Standard Window</span>'}
                                            ${(lead.products && lead.products.length > 2) ? `
                                                <span style="font-size: 0.7rem; color: var(--color-primary); font-weight: 600;" title="${lead.products.slice(2).join(', ')}">
                                                    +${lead.products.length - 2} more
                                                </span>
                                            ` : ''}
                                        </div>
                                    </td>

                                    <!-- Timeline & Budget -->
                                    <td style="padding: 0.9rem 1rem;">
                                        <div style="font-size: 0.84rem; font-weight: 600; color: #34d399;">
                                            ₹${Number(lead.estimatedBudget || 0).toLocaleString('en-IN')}
                                        </div>
                                        <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;">
                                            ${escapeHtml(lead.expectedTimeline || 'Within 1 Month')}
                                        </div>
                                    </td>

                                    <!-- Currently Stage: Clickable Interactive Status Badge -->
                                    <td style="padding: 0.9rem 1rem; text-align: center;">
                                        <button type="button"
                                                id="lead-stage-btn-${lead.id}"
                                                data-testid="lead-stage-badge-${lead.id}"
                                                onclick="window.openLeadStageTransitionModal('${lead.id}')"
                                                class="lead-stage-badge-btn"
                                                title="Click to update stage for ${escapeHtml(lead.name)}"
                                                style="
                                                    display: inline-flex; align-items: center; gap: 6px;
                                                    background: ${stageMeta.bg}; color: ${stageMeta.color};
                                                    border: 1px solid ${stageMeta.color}55;
                                                    padding: 4px 12px; border-radius: 9999px; font-size: 0.78rem; font-weight: 600;
                                                    cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                                                    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                                                "
                                                onmouseover="this.style.transform='translateY(-1px) scale(1.02)'; this.style.boxShadow='0 4px 14px ${stageMeta.color}40'; this.style.borderColor='${stageMeta.color}';"
                                                onmouseout="this.style.transform='none'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.25)'; this.style.borderColor='${stageMeta.color}55';">
                                            <i data-lucide="${stageMeta.icon}" style="width: 13px; height: 13px;"></i>
                                            <span>${stageMeta.label}</span>
                                            <i data-lucide="chevron-down" style="width: 12px; height: 12px; opacity: 0.6; margin-left: 2px;"></i>
                                        </button>
                                    </td>

                                    <!-- Row Action Menu (Three-dot button) -->
                                    <td style="padding: 0.9rem 1rem; text-align: center; position: relative;">
                                        <button type="button" class="btn" onclick="window.toggleLeadRowActions('${lead.id}', this, event)"
                                                style="padding: 0.4rem; background: transparent; border: 1px solid transparent; border-radius: 6px; color: var(--color-text-muted); cursor: pointer;"
                                                onmouseover="this.style.background='rgba(255,255,255,0.06)'; this.style.color='white';" onmouseout="this.style.background='transparent'; this.style.color='var(--color-text-muted)';">
                                            <i data-lucide="more-horizontal" style="width: 18px; height: 18px;"></i>
                                        </button>
                                    </td>

                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    return listWrapper;
}

// =============================================================================
// 3. ROW ACTION CONTEXT MENU HANDLERS
// =============================================================================
window.toggleLeadRowActions = (leadId, btn, event) => {
    event.stopPropagation();
    const existing = document.getElementById('lead-row-actions-dropdown');
    if (existing) {
        existing.remove();
        if (existing.dataset.leadId === leadId) return;
    }

    const rect = btn.getBoundingClientRect();
    const dropdown = document.createElement('div');
    dropdown.id = 'lead-row-actions-dropdown';
    dropdown.dataset.leadId = leadId;
    dropdown.className = 'glass-panel animate-fade-in';
    dropdown.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 6}px;
        left: ${Math.max(10, rect.right - 200)}px;
        width: 200px;
        padding: 0.4rem;
        z-index: 100020;
        background: #090e17;
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md, 8px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.7);
        display: flex;
        flex-direction: column;
        gap: 2px;
    `;

    dropdown.innerHTML = `
        <button type="button" data-testid="lead-action-view-${leadId}" onclick="window.openLeadDetails('${leadId}'); window.closeLeadDropdown();" class="btn" 
                style="justify-content: flex-start; font-size: 0.82rem; padding: 0.5rem 0.65rem; background: transparent; color: #f8fafc; border-radius: 6px;"
                onmouseover="this.style.background='rgba(56, 189, 248, 0.12)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="eye" style="width: 14px; height: 14px; color: #38bdf8; margin-right: 8px;"></i> View / Preview
        </button>

        <button type="button" onclick="window.openEditLeadForm('${leadId}'); window.closeLeadDropdown();" class="btn" 
                style="justify-content: flex-start; font-size: 0.82rem; padding: 0.5rem 0.65rem; background: transparent; color: #f8fafc; border-radius: 6px;"
                onmouseover="this.style.background='rgba(56, 189, 248, 0.12)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="edit" style="width: 14px; height: 14px; color: #fbbf24; margin-right: 8px;"></i> Edit Details
        </button>

        <button type="button" onclick="window.convertLeadToQuotation('${leadId}'); window.closeLeadDropdown();" class="btn" 
                style="justify-content: flex-start; font-size: 0.82rem; padding: 0.5rem 0.65rem; background: transparent; color: #34d399; font-weight: 600; border-radius: 6px;"
                onmouseover="this.style.background='rgba(52, 211, 153, 0.12)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="file-text" style="width: 14px; height: 14px; color: #34d399; margin-right: 8px;"></i> Convert to Quotation
        </button>

        <div style="height: 1px; background: var(--glass-border); margin: 3px 0;"></div>

        <button type="button" onclick="window.initiateMarkAsLost('${leadId}'); window.closeLeadDropdown();" class="btn" 
                style="justify-content: flex-start; font-size: 0.82rem; padding: 0.5rem 0.65rem; background: transparent; color: #ef4444; border-radius: 6px;"
                onmouseover="this.style.background='rgba(239, 68, 68, 0.12)'" onmouseout="this.style.background='transparent'">
            <i data-lucide="x-circle" style="width: 14px; height: 14px; color: #ef4444; margin-right: 8px;"></i> Mark as Lost / Archive
        </button>
    `;

    document.body.appendChild(dropdown);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
        window.addEventListener('click', window.closeLeadDropdown);
    }, 0);
};

window.closeLeadDropdown = () => {
    const dropdown = document.getElementById('lead-row-actions-dropdown');
    if (dropdown) dropdown.remove();
    window.removeEventListener('click', window.closeLeadDropdown);
};

// =============================================================================
// 4. INTERACTIVE STAGE PROGRESSION CONFIRMATION & TRANSITION MODAL
// =============================================================================
window.activeStageTransition = window.activeStageTransition || null;

window.openLeadStageTransitionModal = (leadId, preselectedStage = null) => {
    const store = window.Store || Store;
    const leads = (store && store.state && store.state.leads) || [];
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    window.closeLeadStageTransitionModal();

    window.activeStageTransition = {
        leadId,
        customerName: lead.name,
        currentStage: lead.status || 'New Lead',
        selectedStage: preselectedStage,
        reason: '',
        notes: ''
    };

    const currentMeta = getStageMeta(lead.status);

    const backdrop = document.createElement('div');
    backdrop.id = 'lead-stage-transition-modal-backdrop';
    backdrop.className = 'lead-stage-modal-backdrop animate-fade-in';
    backdrop.onclick = (e) => {
        if (e.target === backdrop) window.closeLeadStageTransitionModal();
    };

    backdrop.innerHTML = `
        <div class="lead-stage-modal-card" onclick="event.stopPropagation()">
            
            <!-- Modal Header -->
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: space-between; background: rgba(15, 23, 42, 0.75);">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                        <i data-lucide="git-commit" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #f8fafc;">
                            Update Lead Stage
                        </h3>
                        <div style="font-size: 0.78rem; color: var(--color-text-muted); margin-top: 2px;">
                            Lead: <strong style="color: var(--color-primary);">${escapeHtml(lead.id)}</strong> • <span style="color: #cbd5e1;">${escapeHtml(lead.name)}</span>
                        </div>
                    </div>
                </div>

                <button type="button" onclick="window.closeLeadStageTransitionModal()" style="background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 6px;" title="Close">
                    <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                </button>
            </div>

            <!-- Modal Content Body -->
            <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; max-height: calc(85vh - 130px); overflow-y: auto;">
                
                <!-- Current Active Stage Summary Pill -->
                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); padding: 0.65rem 1rem; border-radius: 8px;">
                    <span style="font-size: 0.82rem; color: var(--color-text-muted); font-weight: 500;">
                        Currently Active Stage:
                    </span>
                    <span style="
                        display: inline-flex; align-items: center; gap: 5px;
                        background: ${currentMeta.bg}; color: ${currentMeta.color};
                        border: 1px solid ${currentMeta.color}55;
                        padding: 3px 10px; border-radius: 9999px; font-size: 0.78rem; font-weight: 600;
                    ">
                        <i data-lucide="${currentMeta.icon}" style="width: 12px; height: 12px;"></i>
                        ${currentMeta.label}
                    </span>
                </div>

                <!-- Prompt & Stage Selection -->
                <div>
                    <h4 style="margin: 0 0 0.35rem; font-size: 0.95rem; font-weight: 600; color: #f8fafc;">
                        Select the new stage for this lead
                    </h4>
                    <p style="margin: 0 0 0.85rem; font-size: 0.78rem; color: var(--color-text-muted);">
                        Choose the target pipeline stage to advance or update this opportunity.
                    </p>

                    <!-- Selection Buttons / Chips -->
                    <div id="lead-stage-chips-container" style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${LEAD_STAGES.map(s => {
                            const isCurrent = (s.key === lead.status);
                            const isTarget = (s.key === preselectedStage);
                            return `
                                <button type="button"
                                        id="chip-stage-${s.key.replace(/\s+/g, '-').toLowerCase()}"
                                        data-stage-key="${s.key}"
                                        class="lead-stage-chip-btn ${isTarget ? 'is-active' : ''}"
                                        style="--chip-brand-color: ${s.color}; --chip-brand-bg: ${s.bg}; --chip-brand-glow: ${s.color}35;"
                                        onclick="window.selectLeadTransitionStage('${s.key}')">
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="width: 32px; height: 32px; border-radius: 8px; background: ${s.bg}; border: 1px solid ${s.color}44; display: flex; align-items: center; justify-content: center; color: ${s.color};">
                                            <i data-lucide="${s.icon}" style="width: 16px; height: 16px;"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.88rem; font-weight: 600; color: #f8fafc;">
                                                ${s.label}
                                            </div>
                                            <div style="font-size: 0.72rem; color: var(--color-text-muted);">
                                                ${s.key === 'New Lead' ? 'Initial intake & coordinates' : 
                                                  s.key === 'Contacted' ? 'Sales rep telecon completed' : 
                                                  s.key === 'Qualified' ? 'Architectural & budget confirmed' : 
                                                  s.key === 'Converted' ? 'Ready for formal quotation' : 
                                                  'Archived / Competitor / Inactive'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        ${isCurrent ? `
                                            <span style="font-size: 0.68rem; font-weight: 600; padding: 2px 8px; border-radius: 9999px; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); color: #94a3b8;">
                                                Current
                                            </span>
                                        ` : ''}
                                        <div class="chip-selection-check" style="width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid ${isTarget ? s.color : 'rgba(255,255,255,0.2)'}; display: flex; align-items: center; justify-content: center; background: ${isTarget ? s.color : 'transparent'};">
                                            ${isTarget ? `<i data-lucide="check" style="width: 12px; height: 12px; color: white;"></i>` : ''}
                                        </div>
                                    </div>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Lost Reason (conditionally shown if 'Lost' is selected) -->
                <div id="stage_lost_reason_section" style="display: ${preselectedStage === 'Lost' ? 'block' : 'none'};">
                    <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.4rem;">
                        Reason for Loss <span style="color: #ef4444;">*</span>
                    </label>
                    <select id="stage_lost_reason" style="width: 100%; padding: 0.65rem 0.85rem; background: #0f172a; border: 1px solid var(--glass-border); border-radius: 8px; color: white; font-size: 0.88rem;">
                        <option value="Budget Mismatch / Price High">Budget Mismatch / Price High</option>
                        <option value="Selected Another Fabricator (Competitor)">Selected Another Fabricator (Competitor)</option>
                        <option value="Project Postponed or Delayed">Project Postponed or Delayed</option>
                        <option value="Customer Unreachable after 3+ attempts">Customer Unreachable after 3+ attempts</option>
                        <option value="Out of Geographic Service Area">Out of Geographic Service Area</option>
                        <option value="Other Architectural Constraints">Other Architectural Constraints</option>
                    </select>
                </div>

                <!-- Optional Activity / Transition Notes -->
                <div>
                    <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.4rem;">
                        Activity / Transition Notes (Optional)
                    </label>
                    <input type="text" id="stage_transition_notes" placeholder="e.g., Telecon completed with client; site visit requested" 
                           style="width: 100%; padding: 0.65rem 0.85rem; background: rgba(0,0,0,0.35); border: 1px solid var(--glass-border); border-radius: 8px; color: white; font-size: 0.88rem;" />
                </div>

            </div>

            <!-- Modal Action Footer -->
            <div style="padding: 1.15rem 1.5rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; background: rgba(15, 23, 42, 0.75);">
                <button type="button" class="btn btn-secondary" onclick="window.closeLeadStageTransitionModal()" style="padding: 0.65rem 1.25rem; font-size: 0.86rem;">
                    Cancel
                </button>
                <button type="button" class="btn btn-primary" id="btn-update-lead-stage" onclick="window.submitLeadStageTransition()"
                        style="padding: 0.65rem 1.45rem; font-size: 0.86rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.35);">
                    <i data-lucide="check" style="width: 16px; height: 16px;"></i> Update Stage
                </button>
            </div>

        </div>
    `;

    document.body.appendChild(backdrop);

    // Escape key listener
    window._leadStageEscListener = (e) => {
        if (e.key === 'Escape') window.closeLeadStageTransitionModal();
    };
    window.addEventListener('keydown', window._leadStageEscListener);

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
};

window.selectLeadTransitionStage = (stageKey) => {
    if (!window.activeStageTransition) return;
    window.activeStageTransition.selectedStage = stageKey;

    const container = document.getElementById('lead-stage-chips-container');
    if (container) {
        const chips = container.querySelectorAll('.lead-stage-chip-btn');
        chips.forEach(chip => {
            const isMatch = chip.dataset.stageKey === stageKey;
            chip.classList.toggle('is-active', isMatch);
            const checkEl = chip.querySelector('.chip-selection-check');
            if (checkEl) {
                const meta = getStageMeta(chip.dataset.stageKey);
                if (isMatch) {
                    checkEl.style.borderColor = meta.color;
                    checkEl.style.background = meta.color;
                    checkEl.innerHTML = '<i data-lucide="check" style="width: 12px; height: 12px; color: white;"></i>';
                } else {
                    checkEl.style.borderColor = 'rgba(255,255,255,0.2)';
                    checkEl.style.background = 'transparent';
                    checkEl.innerHTML = '';
                }
            }
        });
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    const lostSection = document.getElementById('stage_lost_reason_section');
    if (lostSection) {
        lostSection.style.display = (stageKey === 'Lost') ? 'block' : 'none';
    }

    const updateBtn = document.getElementById('btn-update-lead-stage');
    if (updateBtn) {
        const targetMeta = getStageMeta(stageKey);
        updateBtn.style.background = targetMeta.color;
        updateBtn.style.boxShadow = `0 4px 15px ${targetMeta.color}44`;
    }
};

window.submitLeadStageTransition = async () => {
    if (!window.activeStageTransition) return;
    const { leadId, currentStage, selectedStage } = window.activeStageTransition;

    if (!selectedStage) {
        showLeadToast('Please select the new stage for this lead', 'info');
        return;
    }

    if (selectedStage === currentStage) {
        showLeadToast(`Lead is already in '${currentStage}' stage. Please pick a new stage.`, 'info');
        return;
    }

    const reasonEl = document.getElementById('stage_lost_reason');
    const reason = (selectedStage === 'Lost' && reasonEl) ? reasonEl.value : '';
    const notesEl = document.getElementById('stage_transition_notes');
    const notes = notesEl ? notesEl.value.trim() : '';

    const store = window.Store || Store;
    await store.updateLeadStatus(leadId, selectedStage, reason ? (reason + (notes ? ' - ' + notes : '')) : notes);

    // Toast notification strictly confirming the transition
    showLeadToast(`Lead status updated to ${selectedStage}`);

    window.closeLeadStageTransitionModal();
    if (store && typeof store.notify === 'function') {
        store.notify();
    }
};

window.closeLeadStageTransitionModal = () => {
    const backdrop = document.getElementById('lead-stage-transition-modal-backdrop');
    if (backdrop) backdrop.remove();
    if (window._leadStageEscListener) {
        window.removeEventListener('keydown', window._leadStageEscListener);
        window._leadStageEscListener = null;
    }
    window.activeStageTransition = null;
};

// Backwards-compatible wrappers
window.initiateStageTransition = (leadId, targetStage, currentStage) => {
    window.openLeadStageTransitionModal(leadId, targetStage);
};

window.initiateMarkAsLost = (leadId) => {
    window.openLeadStageTransitionModal(leadId, 'Lost');
};

window.cancelStageTransition = () => {
    window.closeLeadStageTransitionModal();
};

window.confirmStageTransition = () => {
    window.submitLeadStageTransition();
};

function renderStatusConfirmModal(confirmState) {
    // Fallback if ever called directly
    return document.createElement('div');
}

// =============================================================================
// 5. VIEW / PREVIEW DETAILS DOCKED SLIDE-OVER DRAWER
// =============================================================================
window.openLeadDetails = (leadId) => {
    const store = window.Store || Store;
    const leads = (store && store.state && store.state.leads) || [];
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    window.activeLeadDetails = lead;
    window.closeLeadDetails();

    const drawer = renderLeadDetailsDrawer(lead);
    document.body.appendChild(drawer);

    window._leadDrawerEscListener = (e) => {
        if (e.key === 'Escape') window.closeLeadDetails();
    };
    window.addEventListener('keydown', window._leadDrawerEscListener);

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
};

window.closeLeadDetails = () => {
    const drawer = document.getElementById('lead-details-drawer-backdrop');
    if (drawer) {
        drawer.remove();
    }
    if (window._leadDrawerEscListener) {
        window.removeEventListener('keydown', window._leadDrawerEscListener);
        window._leadDrawerEscListener = null;
    }
    window.activeLeadDetails = null;
};

function renderLeadDetailsDrawer(lead) {
    const backdrop = document.createElement('div');
    backdrop.id = 'lead-details-drawer-backdrop';
    backdrop.className = 'lead-drawer-backdrop animate-fade-in';
    backdrop.onclick = (e) => {
        if (e.target === backdrop) window.closeLeadDetails();
    };

    const stageMeta = getStageMeta(lead.status);
    const sourceMeta = getSourceMeta(lead.source);
    const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');

    backdrop.innerHTML = `
        <div class="lead-drawer-panel" onclick="event.stopPropagation()">
            
            <!-- Drawer Fixed Top Header -->
            <div style="padding: 1.25rem 1.75rem; border-bottom: 1px solid var(--glass-border); background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <div style="width: 44px; height: 44px; border-radius: 50%; background: ${sourceMeta.color}22; border: 1.5px solid ${sourceMeta.color}; display: flex; align-items: center; justify-content: center; color: ${sourceMeta.color}; font-weight: 700; font-size: 1.15rem; flex-shrink: 0;">
                        ${(lead.name || 'L').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #f8fafc;">
                                ${escapeHtml(lead.name)}
                            </h2>
                            <button type="button" 
                                    onclick="window.openLeadStageTransitionModal('${lead.id}')"
                                    title="Click to update stage"
                                    style="
                                        display: inline-flex; align-items: center; gap: 5px;
                                        background: ${stageMeta.bg}; color: ${stageMeta.color};
                                        border: 1px solid ${stageMeta.color}55;
                                        padding: 2px 10px; border-radius: 9999px; font-size: 0.74rem; font-weight: 600;
                                        cursor: pointer; transition: all 0.2s;
                                    "
                                    onmouseover="this.style.boxShadow='0 2px 8px ${stageMeta.color}44';"
                                    onmouseout="this.style.boxShadow='none';">
                                <i data-lucide="${stageMeta.icon}" style="width: 12px; height: 12px;"></i>
                                <span>${stageMeta.label}</span>
                                <i data-lucide="chevron-down" style="width: 11px; height: 11px; opacity: 0.7;"></i>
                            </button>
                        </div>
                        <div style="font-size: 0.78rem; color: var(--color-text-muted); margin-top: 3px; display: flex; align-items: center; gap: 0.5rem;">
                            <span>Lead ID: <strong style="color: var(--color-primary); font-family: monospace;">${lead.id}</strong></span>
                            <span>•</span>
                            <span style="color: ${sourceMeta.color}; font-weight: 600;">${sourceMeta.label}</span>
                        </div>
                    </div>
                </div>

                <button type="button" onclick="window.closeLeadDetails()" 
                        style="background: transparent; border: 1px solid var(--glass-border); border-radius: 8px; color: var(--color-text-muted); cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" 
                        title="Close Drawer"
                        onmouseover="this.style.color='#f8fafc'; this.style.borderColor='rgba(255,255,255,0.3)';"
                        onmouseout="this.style.color='var(--color-text-muted)'; this.style.borderColor='var(--glass-border)';">
                    <i data-lucide="x" style="width: 18px; height: 18px;"></i>
                </button>
            </div>

            <!-- Drawer Scrollable Body -->
            <div style="flex: 1; overflow-y: auto; padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                
                <!-- Quick Coordinates Strip -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 0.85rem;">
                        <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em;">Phone & WhatsApp</div>
                        <div style="font-size: 0.88rem; color: #f8fafc; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-top: 3px;">
                            <span>${escapeHtml(lead.phone)}</span>
                            ${cleanPhone ? `
                                <a href="https://wa.me/${cleanPhone}" target="_blank" style="color: #22c55e; display: inline-flex;" title="Direct WhatsApp Chat">
                                    <i data-lucide="message-circle" style="width: 15px; height: 15px;"></i>
                                </a>
                            ` : ''}
                        </div>
                    </div>

                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 0.85rem;">
                        <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em;">Site Location</div>
                        <div style="font-size: 0.88rem; color: #f8fafc; font-weight: 600; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${escapeHtml(lead.city || 'Kozhikode')}
                        </div>
                    </div>

                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 0.85rem;">
                        <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em;">Estimated Budget</div>
                        <div style="font-size: 0.95rem; color: #34d399; font-weight: 700; margin-top: 3px;">
                            ₹${Number(lead.estimatedBudget || 0).toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>

                <!-- Site Address, Expected Timeline & Rep -->
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1rem; font-size: 0.85rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.6rem;">
                    <div>
                        <strong style="color: #94a3b8; font-size: 0.76rem; text-transform: uppercase; display: block; margin-bottom: 2px;">Site Coordinates & Address:</strong>
                        <span style="color: #f8fafc;">${escapeHtml(lead.address || 'Address not specified')}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06);">
                        <div>
                            <strong style="color: #94a3b8; font-size: 0.76rem; text-transform: uppercase; display: block; margin-bottom: 2px;">Expected Timeline:</strong>
                            <span style="color: #38bdf8; font-weight: 600;">${escapeHtml(lead.expectedTimeline || 'Within 1 Month')}</span>
                        </div>
                        <div>
                            <strong style="color: #94a3b8; font-size: 0.76rem; text-transform: uppercase; display: block; margin-bottom: 2px;">Assigned Representative:</strong>
                            <span style="color: #f8fafc;">${escapeHtml(lead.assignedTo || 'Rohit Sharma (Sales)')}</span>
                        </div>
                    </div>
                    ${lead.notes ? `
                        <div style="padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06); font-style: italic; color: #94a3b8;">
                            "${escapeHtml(lead.notes)}"
                        </div>
                    ` : ''}
                </div>

                <!-- Products Required Checklist -->
                <div>
                    <h4 style="margin: 0 0 0.5rem; font-size: 0.84rem; color: #f8fafc; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">
                        Products & Requirements Checklist
                    </h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${(lead.products && lead.products.length > 0) ? lead.products.map(p => {
                            const meta = PRODUCT_META[p] || { icon: 'package', color: '#38bdf8' };
                            return `
                                <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); color: #e0f2fe; padding: 4px 10px; border-radius: 8px;">
                                    <i data-lucide="${meta.icon}" style="width: 14px; height: 14px; color: ${meta.color};"></i>
                                    <span>${escapeHtml(p)}</span>
                                </div>
                            `;
                        }).join('') : '<span style="font-size: 0.8rem; color: var(--color-text-muted);">No specific products selected</span>'}
                    </div>
                </div>

                <!-- Uploaded Architectural Documents -->
                <div>
                    <h4 style="margin: 0 0 0.5rem; font-size: 0.84rem; color: #f8fafc; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">
                        Drawings & Site Attachments (${(lead.attachments || []).length})
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                        ${(lead.attachments && lead.attachments.length > 0) ? lead.attachments.map(att => `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.85rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 8px;">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <i data-lucide="file" style="width: 15px; height: 15px; color: #38bdf8;"></i>
                                    <span style="font-size: 0.84rem; color: #f8fafc; font-weight: 500;">${escapeHtml(att.name)}</span>
                                    <span style="font-size: 0.72rem; color: var(--color-text-muted);">(${att.size || '1.2 MB'})</span>
                                </div>
                                <button type="button" class="btn btn-secondary" style="padding: 3px 10px; font-size: 0.74rem;" onclick="alert('Viewing attachment: ${escapeHtml(att.name)}')">
                                    Preview
                                </button>
                            </div>
                        `).join('') : '<div style="font-size: 0.8rem; color: var(--color-text-muted); background: rgba(255,255,255,0.02); border: 1px dashed var(--glass-border); padding: 0.75rem; border-radius: 8px;">No architectural attachments uploaded for this lead.</div>'}
                    </div>
                </div>

                <!-- Activity Timeline -->
                <div>
                    <h4 style="margin: 0 0 0.65rem; font-size: 0.84rem; color: #f8fafc; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">
                        Activity & Audit Timeline
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 0.6rem; max-height: 200px; overflow-y: auto; padding-right: 4px;">
                        ${(lead.timeline && lead.timeline.length > 0) ? lead.timeline.map(t => `
                            <div style="display: flex; gap: 0.75rem; font-size: 0.8rem; border-left: 2px solid var(--color-primary); padding-left: 0.75rem; margin-left: 4px;">
                                <div style="color: var(--color-text-muted); font-size: 0.72rem; white-space: nowrap;">
                                    ${new Date(t.timestamp).toLocaleDateString()} ${new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div>
                                    <strong style="color: #f8fafc;">${escapeHtml(t.user || 'System')}:</strong>
                                    <span style="color: #cbd5e1;">${escapeHtml(t.notes || t.action)}</span>
                                </div>
                            </div>
                        `).join('') : '<div style="font-size: 0.8rem; color: var(--color-text-muted);">No activity history logged yet.</div>'}
                    </div>
                </div>

            </div>

            <!-- Drawer Fixed Footer -->
            <div style="padding: 1rem 1.75rem; border-top: 1px solid var(--glass-border); background: rgba(15, 23, 42, 0.95); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                <button type="button" class="btn btn-secondary" onclick="window.closeLeadDetails()" style="padding: 0.65rem 1.25rem; font-size: 0.86rem;">
                    Close
                </button>
                <div style="display: flex; gap: 0.75rem;">
                    <button type="button" class="btn btn-secondary" onclick="window.openEditLeadForm('${lead.id}'); window.closeLeadDetails();" style="padding: 0.65rem 1.25rem; font-size: 0.86rem; display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="edit" style="width: 14px; height: 14px; color: #fbbf24;"></i> Edit Details
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.convertLeadToQuotation('${lead.id}'); window.closeLeadDetails();" style="padding: 0.65rem 1.45rem; font-size: 0.86rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(52, 211, 153, 0.35); background: #10b981;">
                        <i data-lucide="file-text" style="width: 15px; height: 15px;"></i> Convert to Quotation
                    </button>
                </div>
            </div>

        </div>
    `;

    return backdrop;
}

// Fallback compatibility
function renderLeadDetailsModal(lead) {
    return renderLeadDetailsDrawer(lead);
}

// =============================================================================
// 6. CONVERT TO QUOTATION INTEGRATION
// =============================================================================
window.convertLeadToQuotation = async (leadId) => {
    const store = window.Store || Store;
    const leads = (store && store.state && store.state.leads) || [];
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Automatically transition status to 'Converted'
    if (lead.status !== 'Converted') {
        await store.updateLeadStatus(leadId, 'Converted', 'Lead converted to formal Quotation');
    }

    // Call quotation pre-filler
    if (typeof window.initQuotationFromLead === 'function') {
        window.initQuotationFromLead(lead);
    } else {
        // Fallback navigate
        if (typeof window.navigate === 'function') window.navigate('quotations');
    }

    showLeadToast(`Lead ${lead.id} successfully converted! Customer & requirements loaded into Quotation builder.`);
};

// =============================================================================
// 7. META (FACEBOOK & INSTAGRAM) LEAD ADS WEBHOOK MODAL
// =============================================================================
window.openMetaModal = async () => {
    window.metaModalOpen = true;
    try {
        const res = await fetch('/api/leads/meta-config');
        if (res.ok) {
            const data = await res.json();
            window.metaConfigData = data.config;
        }
    } catch (e) {}

    if (Store && typeof Store.notify === 'function') Store.notify();
};

window.closeMetaModal = () => {
    window.metaModalOpen = false;
    if (Store && typeof Store.notify === 'function') Store.notify();
};

function renderMetaConfigModal() {
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop animate-fade-in';
    modalBackdrop.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; z-index: 100030;
    `;

    const cfg = window.metaConfigData || {
        pageId: '108429188410294',
        formId: '892340192841029',
        verifyToken: 'stello_meta_verify_token_2026',
        pageAccessToken: 'EAAGNO4...Meta_Permanent_System_Page_Access_Token...',
        webhookUrl: 'https://erp.stellobuild.com/api/webhooks/meta',
        totalLeadsCaptured: 24,
        webhookAuditLogs: []
    };

    modalBackdrop.innerHTML = `
        <div class="glass-panel" style="width: 680px; max-width: 95vw; max-height: 90vh; overflow-y: auto; background: #090e17; border: 1.5px solid #0666eb; border-radius: var(--radius-lg, 12px); padding: 1.75rem; box-shadow: 0 25px 60px rgba(6, 102, 235, 0.35);">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(6, 102, 235, 0.2); border: 1.5px solid #0666eb; display: flex; align-items: center; justify-content: center; color: #0666eb;">
                        <i data-lucide="radio" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #f8fafc;">
                            Meta Lead Ads Integration & Webhook Listener
                        </h3>
                        <div style="font-size: 0.78rem; color: var(--color-text-muted); margin-top: 2px;">
                            Real-time Facebook & Instagram Lead Gen sync via Meta Graph API v20.0
                        </div>
                    </div>
                </div>

                <button type="button" onclick="window.closeMetaModal()" style="background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px;">
                    <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                </button>
            </div>

            <!-- Real-Time Sync Indicator & Stats -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(6, 102, 235, 0.1); border: 1px solid rgba(6, 102, 235, 0.3); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 10px #22c55e;"></span>
                    <span style="font-size: 0.86rem; color: #e0f2fe; font-weight: 600;">Webhook Listener Active</span>
                    <span style="font-size: 0.74rem; color: #94a3b8;">(Auto-Sync Enabled)</span>
                </div>
                <div style="font-size: 0.82rem; color: #cbd5e1;">
                    Total Ingested Leads: <strong style="color: #38bdf8; font-size: 0.95rem;">${cfg.totalLeadsCaptured || 0}</strong>
                </div>
            </div>

            <!-- Meta Credentials Form -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.35rem;">
                        Meta Page ID
                    </label>
                    <input type="text" id="meta_page_id" value="${escapeHtml(cfg.pageId || '')}" 
                           style="width: 100%; padding: 0.55rem 0.75rem; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; color: white; font-size: 0.85rem;" />
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.35rem;">
                        Lead Gen Form ID
                    </label>
                    <input type="text" id="meta_form_id" value="${escapeHtml(cfg.formId || '')}" 
                           style="width: 100%; padding: 0.55rem 0.75rem; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; color: white; font-size: 0.85rem;" />
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.35rem;">
                        Webhook Verify Token
                    </label>
                    <input type="text" id="meta_verify_token" value="${escapeHtml(cfg.verifyToken || '')}" 
                           style="width: 100%; padding: 0.55rem 0.75rem; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; color: white; font-size: 0.85rem;" />
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.35rem;">
                        Page Access Token (Graph API)
                    </label>
                    <input type="password" id="meta_access_token" value="${escapeHtml(cfg.pageAccessToken || '')}" 
                           style="width: 100%; padding: 0.55rem 0.75rem; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; color: white; font-size: 0.85rem;" />
                </div>
            </div>

            <!-- Webhook Callback URL -->
            <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.35rem;">
                    Webhook Callback URL (Paste into Meta App Dashboard)
                </label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" readonly value="${window.location.origin}/api/webhooks/meta" 
                           id="metaWebhookUrlField"
                           style="width: 100%; padding: 0.55rem 0.75rem; background: rgba(0,0,0,0.6); border: 1px solid var(--glass-border); border-radius: 6px; color: #38bdf8; font-family: monospace; font-size: 0.82rem;" />
                    <button type="button" class="btn btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('metaWebhookUrlField').value); showLeadToast('Webhook URL copied to clipboard!');" style="white-space: nowrap; font-size: 0.8rem; padding: 0.55rem 0.85rem;">
                        Copy URL
                    </button>
                </div>
            </div>

            <!-- Test Simulation Banner -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-weight: 600; font-size: 0.86rem; color: #f8fafc;">Live Webhook Ingestion Simulator</div>
                    <div style="font-size: 0.74rem; color: var(--color-text-muted);">Simulate an instantaneous lead ad submission from Instagram Kerala campaigns.</div>
                </div>
                <button type="button" class="btn btn-primary" onclick="window.triggerSimulateMetaLead()" style="padding: 0.5rem 1.1rem; font-size: 0.82rem; font-weight: 600; background: linear-gradient(135deg, #0666eb, #0ea5e9);">
                    <i data-lucide="zap" style="width: 14px; height: 14px; margin-right: 4px;"></i> Simulate Meta Lead
                </button>
            </div>

            <!-- Recent Webhook Ingestion Logs -->
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.5rem; font-size: 0.85rem; color: #f8fafc; font-weight: 600; text-transform: uppercase;">
                    Recent Webhook Audit Logs
                </h4>
                <div style="max-height: 140px; overflow-y: auto; border: 1px solid var(--glass-border); border-radius: 6px; background: rgba(0,0,0,0.3);">
                    ${(cfg.webhookAuditLogs && cfg.webhookAuditLogs.length > 0) ? `
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem; text-align: left;">
                            <thead style="background: rgba(0,0,0,0.4); border-bottom: 1px solid var(--glass-border);">
                                <tr>
                                    <th style="padding: 6px 10px; color: var(--color-text-muted);">Timestamp</th>
                                    <th style="padding: 6px 10px; color: var(--color-text-muted);">Leadgen ID</th>
                                    <th style="padding: 6px 10px; color: var(--color-text-muted);">Customer</th>
                                    <th style="padding: 6px 10px; color: var(--color-text-muted); text-align: right;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cfg.webhookAuditLogs.map(l => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                                        <td style="padding: 6px 10px; color: #94a3b8;">${new Date(l.timestamp).toLocaleTimeString()}</td>
                                        <td style="padding: 6px 10px; font-family: monospace; color: #38bdf8;">${l.leadgenId || l.id}</td>
                                        <td style="padding: 6px 10px; color: #f8fafc;">${escapeHtml(l.customer || 'Meta Inquirer')}</td>
                                        <td style="padding: 6px 10px; text-align: right; color: #22c55e; font-weight: 600;">SUCCESS_SAVED</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<div style="padding: 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.78rem;">No webhook logs yet. Use the Simulator button above to test.</div>'}
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button type="button" class="btn btn-secondary" onclick="window.closeMetaModal()" style="padding: 0.6rem 1.25rem;">
                    Close
                </button>
                <button type="button" class="btn btn-primary" onclick="window.saveMetaConfigSettings()" style="padding: 0.6rem 1.45rem; font-weight: 600;">
                    Save Meta Settings
                </button>
            </div>

        </div>
    `;

    return modalBackdrop;
}

window.saveMetaConfigSettings = async () => {
    const pageId = document.getElementById('meta_page_id')?.value;
    const formId = document.getElementById('meta_form_id')?.value;
    const verifyToken = document.getElementById('meta_verify_token')?.value;
    const pageAccessToken = document.getElementById('meta_access_token')?.value;

    try {
        const res = await fetch('/api/leads/meta-config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageId, formId, verifyToken, pageAccessToken })
        });
        if (res.ok) {
            const data = await res.json();
            window.metaConfigData = data.config;
            showLeadToast('Meta Ads Webhook configuration saved successfully!');
            window.closeMetaModal();
        }
    } catch (e) {
        showLeadToast('Failed to save Meta configuration', 'error');
    }
};

window.triggerSimulateMetaLead = async () => {
    try {
        const res = await fetch('/api/leads/simulate-meta-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            const data = await res.json();
            playLeadChime();
            showLeadToast(`🎉 Meta Lead Captured: ${data.lead.name} (${data.lead.id}) from Instagram Ads!`);

            // Refresh leads in Store
            const store = window.Store || Store;
            await store.syncLeads();
            
            // Refresh Meta modal data
            if (window.metaConfigData && data.log) {
                if (!window.metaConfigData.webhookAuditLogs) window.metaConfigData.webhookAuditLogs = [];
                window.metaConfigData.webhookAuditLogs.unshift(data.log);
                window.metaConfigData.totalLeadsCaptured = (window.metaConfigData.totalLeadsCaptured || 0) + 1;
            }
            store.notify();
        }
    } catch (e) {
        showLeadToast('Failed to simulate Meta lead', 'error');
    }
};

// Filter Handlers
window.setLeadSearchQuery = (query) => {
    window.leadSearchQuery = query;
    if (Store && typeof Store.notify === 'function') Store.notify();
};

window.toggleLeadStatusFilter = (stageKey) => {
    window.leadFilterStatus = (window.leadFilterStatus === stageKey) ? 'all' : stageKey;
    if (Store && typeof Store.notify === 'function') Store.notify();
};

window.setLeadSourceFilter = (sourceKey) => {
    window.leadFilterSource = sourceKey;
    if (Store && typeof Store.notify === 'function') Store.notify();
};

window.clearLeadFilters = () => {
    window.leadSearchQuery = '';
    window.leadFilterStatus = 'all';
    window.leadFilterSource = 'all';
    if (Store && typeof Store.notify === 'function') Store.notify();
};

// Utility Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
