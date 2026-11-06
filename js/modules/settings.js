import { Store } from '../store.js';

// --- Accounts Configuration Master Security Gate State ---
window.accountsConfigUnlocked = false;
window.accountsConfigUnlockExpiresAt = 0;
window.adminAccessToken = null;

window.isAccountsConfigUnlocked = () => {
    if (!window.accountsConfigUnlocked) return false;
    if (Date.now() > window.accountsConfigUnlockExpiresAt) {
        window.accountsConfigUnlocked = false;
        window.adminAccessToken = null;
        return false;
    }
    return true;
};

// --- SETTINGS VIEW ---
export function renderSettings(state) {
    const company = state.settings?.company || {};
    const preferences = state.settings?.preferences || {};
    const user = state.user || {};

    const store = window.Store || Store;
    const activeUser = (typeof store.getActiveUser === 'function') ? store.getActiveUser() : (state.user || { isSuperAdmin: true, name: 'Shamsudheen V.K.', role: 'Super Administrator' });
    const isSuperAdmin = activeUser.isSuperAdmin !== false;

    // Initialize active tab if needed
    if (state.activeSettingsTab) {
        window.currentSettingsTab = state.activeSettingsTab;
        delete state.activeSettingsTab;
    } else if (!window.currentSettingsTab) {
        window.currentSettingsTab = 'profile';
    }

    const renderTabNav = (id, label, icon) => {
        const isActive = window.currentSettingsTab === id;
        return `
            <button onclick="window.switchSettingsTab('${id}')" 
                style="
                    display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; 
                    background: ${isActive ? 'var(--color-primary-glow)' : 'transparent'}; 
                    color: ${isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}; 
                    border-left: 3px solid ${isActive ? 'var(--color-primary)' : 'transparent'};
                    text-align: left; cursor: pointer; transition: all 0.2s; font-size: 0.95rem;
                "
                onmouseover="this.style.background = '${isActive ? 'var(--color-primary-glow)' : 'rgba(255,255,255,0.05)'}'"
                onmouseout="this.style.background = '${isActive ? 'var(--color-primary-glow)' : 'transparent'}'"
            >
                <i data-lucide="${icon}" style="width: 18px;"></i> ${label}
            </button>
        `;
    };

    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    // Content for each tab
    const tabs = {
        'accounts_config': !isSuperAdmin ? renderAccountsAccessRestrictedHTML(activeUser) : (!window.isAccountsConfigUnlocked() ? renderAccountsConfigLockedGate(activeUser) : renderAccountsConfigTabHTML(state)),
        'profile': `
            <div class="glass-panel" style="padding: 2rem; margin-bottom: 1.5rem; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 1.15rem;">
                        <div style="position: relative;">
                            <img class="admin-profile-avatar" src="${user.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}" alt="User Profile" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid #38bdf8; object-fit: cover; box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);">
                            <button type="button" onclick="window.openProfilePhotoModal()" title="Update Profile Photo" style="position: absolute; bottom: -2px; right: -2px; width: 26px; height: 26px; border-radius: 50%; background: #0284c7; border: 2px solid #090e17; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                                <i data-lucide="camera" style="width: 13px; height: 13px;"></i>
                            </button>
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                                <h2 style="margin: 0; font-size: 1.45rem; color: #f8fafc; font-weight: 700;">${user.name || 'Shamsudheen V.K.'}</h2>
                                <span style="font-size: 0.72rem; padding: 2px 9px; border-radius: 9999px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                                    <i data-lucide="shield" style="width: 11px; height: 11px;"></i> Super Administrator
                                </span>
                                <span style="font-size: 0.7rem; background: #22c55e; color: #022c22; padding: 1px 7px; border-radius: 9999px; font-weight: 700;">ACTIVE</span>
                            </div>
                            <div style="font-size: 0.82rem; color: #94a3b8; margin-top: 4px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                <span><strong style="color: #cbd5e1;">User ID:</strong> <span style="color: #38bdf8; font-family: monospace; font-weight: 700;">${user.id || 'SB-9901'}</span></span>
                                <span>&bull;</span>
                                <span>${user.email || 'admin@stellobuild.com'}</span>
                                <span>&bull;</span>
                                <span>${user.department || 'Executive Operations & Supply Chain'}</span>
                            </div>
                        </div>
                    </div>
                    ${isSuperAdmin ? `
                    <div style="display: flex; gap: 0.75rem;">
                        <button type="button" class="btn" onclick="window.openChangePasswordModal()" style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; font-weight: 600; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                            <i data-lucide="key" style="width: 16px; height: 16px;"></i> Change Password
                        </button>
                    </div>
                    ` : ''}
                </div>

                <h3 style="margin: 0 0 1rem; font-size: 1.1rem; color: #f8fafc; font-weight: 600;">Executive Profile Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.85rem;">System User ID (Permanent)</label>
                        <input type="text" id="prof-user-id" value="${user.id || 'SB-9901'}" class="glass-input" readonly style="width: 100%; opacity: 0.75; font-family: monospace; font-weight: 600; background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.1); cursor: not-allowed;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.85rem;">Assigned Primary Role</label>
                        <input type="text" value="${user.role || 'Super Administrator'}" class="glass-input" readonly style="width: 100%; opacity: 0.75; font-weight: 600; color: #38bdf8; background: rgba(56, 189, 248, 0.08); border-color: rgba(56, 189, 248, 0.25); cursor: not-allowed;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: #cbd5e1; font-size: 0.85rem; font-weight: 500;">Current User's Name *</label>
                        <input type="text" id="prof-user-name" value="${user.name || 'Shamsudheen V.K.'}" class="glass-input" style="width: 100%; font-size: 0.95rem; font-weight: 600;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: #cbd5e1; font-size: 0.85rem; font-weight: 500;">Location / City *</label>
                        <input type="text" id="prof-user-location" value="${user.location || 'Kozhikode, Kerala'}" class="glass-input" style="width: 100%; font-size: 0.95rem; font-weight: 500;" placeholder="e.g. Kozhikode, Kerala">
                    </div>
                    <div style="grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
                        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.45rem; color: #cbd5e1; font-size: 0.85rem; font-weight: 500;">Postal PIN Code *</label>
                                <input type="text" id="prof-user-pincode" value="${user.pincode || '673638'}" maxlength="6" class="glass-input" style="width: 100%; font-size: 0.95rem; font-weight: 600; letter-spacing: 1px;" placeholder="e.g. 673638">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.45rem; color: #cbd5e1; font-size: 0.85rem; font-weight: 500;">Phone Number (Directly beneath PIN code) *</label>
                                <input type="tel" id="prof-user-phone" value="${user.phone || '+91 9846 123 456'}" class="glass-input" style="width: 100%; font-size: 0.95rem; font-weight: 500;">
                            </div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.85rem;">Email Address</label>
                            <input type="email" id="prof-user-email" value="${user.email || 'admin@stellobuild.com'}" class="glass-input" style="width: 100%;">
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.75rem; border-top: 1px solid var(--glass-border); padding-top: 1.25rem;">
                    <button type="button" class="btn btn-primary" onclick="window.saveUserProfileSettings()" style="display: inline-flex; align-items: center; gap: 6px; padding: 0.6rem 1.4rem; font-weight: 600;">
                        <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i> Save Profile
                    </button>
                </div>
            </div>

            <!-- Security & Password Summary Card with Administrative Passcodes -->
            <div class="glass-panel" style="padding: 1.75rem 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; align-items: flex-start; gap: 1rem;">
                        <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; color: #fbbf24; flex-shrink: 0; margin-top: 2px;">
                            <i data-lucide="lock" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 1.05rem; color: #f8fafc; font-weight: 600;">Password & Administrative Passcodes</h4>
                            <p style="margin: 2px 0 0.75rem; font-size: 0.78rem; color: #94a3b8;">Super Administrator credentials and high-security authorization passcodes.</p>
                            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 6px; padding: 6px 12px; font-size: 0.78rem;">
                                    <span style="color: #94a3b8;">Root Employee PIN:</span> <strong style="color: #fbbf24; font-family: monospace; letter-spacing: 0.5px;">SB-9901</strong>
                                </div>
                                <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; padding: 6px 12px; font-size: 0.78rem;">
                                    <span style="color: #94a3b8;">Master Admin Passcode:</span> <strong style="color: #38bdf8; font-family: monospace; letter-spacing: 0.5px;">admin123</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${isSuperAdmin ? `
                    <button type="button" class="btn btn-secondary" onclick="window.openChangePasswordModal()" style="display: inline-flex; align-items: center; gap: 6px; padding: 0.5rem 1.15rem; font-weight: 500;">
                        <i data-lucide="key" style="width: 15px; height: 15px; color: #fbbf24;"></i> Change Password
                    </button>
                    ` : ''}
                </div>
            </div>
        `,
        'employees': renderEmployeesTabHTML(state),
        'roles': (typeof renderRolesPermissionsMatrixTabHTML === 'function')
            ? (!isSuperAdmin ? renderRolesAccessRestrictedHTML(activeUser) : renderRolesPermissionsMatrixTabHTML(state, activeUser))
            : '<div style="padding: 2rem;">Loading RBAC Matrix...</div>',
        'general': `
            <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.35rem; font-weight: 700; color: #f8fafc;">General Company Settings</h2>
                        <p style="margin: 4px 0 0 0; color: var(--color-text-muted); font-size: 0.85rem;">Company letterhead, tax registration, and default measurement parameters.</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div style="grid-column: span 2;">
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Company Name</label>
                        <input type="text" id="set-comp-name" value="${company.name || 'STYLO STEEL'}" class="glass-input" style="width: 100%; font-size: 1.1rem; font-weight: 600;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Phone Number</label>
                        <input type="text" id="set-comp-phone" value="${company.phone || '8086888500'}" class="glass-input" style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Email Address</label>
                        <input type="email" id="set-comp-email" value="${company.email || 'Buildstello@gmail.com'}" class="glass-input" style="width: 100%;">
                    </div>
                    <div style="grid-column: span 2;">
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Address</label>
                        <textarea id="set-comp-address" class="glass-input" style="width: 100%; height: 80px; resize: none;">${company.address || 'STYLO TOWER\nKONDOTTY ROAD MUNDAKKULAM\nMalappuram, Kerala - 673638'}</textarea>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Tax ID / GSTIN / PAN</label>
                        <input type="text" id="set-comp-tax" value="${company.taxId || '895CFBPJ4043Q1ZE'}" class="glass-input" style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Default Measurement Unit</label>
                        <select id="set-pref-unit" class="glass-input" style="width: 100%;">
                            <option value="cm" ${preferences.unit === 'cm' ? 'selected' : ''}>Centimeters (cm)</option>
                            <option value="mm" ${preferences.unit === 'mm' ? 'selected' : ''}>Millimeters (mm)</option>
                            <option value="inch" ${preferences.unit === 'inch' ? 'selected' : ''}>Inches (in)</option>
                            <option value="ft" ${preferences.unit === 'ft' ? 'selected' : ''}>Feet (ft)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Currency Symbol</label>
                        <input type="text" id="set-pref-currency" list="currencies" value="${preferences.currency || '₹'}" class="glass-input" style="width: 100%;" placeholder="e.g. ₹, $, AED, OMR...">
                        <datalist id="currencies">
                            <option value="₹">₹ (INR)</option>
                            <option value="$">$ (USD)</option>
                            <option value="€">€ (EUR)</option>
                            <option value="£">£ (GBP)</option>
                            <option value="AED">AED (Dirham)</option>
                            <option value="SAR">SAR (Riyal)</option>
                            <option value="KWD">KWD (Dinar)</option>
                            <option value="OMR">OMR (Rial)</option>
                            <option value="QAR">QAR (Riyal)</option>
                            <option value="BHD">BHD (Dinar)</option>
                        </datalist>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" class="btn btn-primary" onclick="window.saveGeneralCompanySettings()" style="display: inline-flex; align-items: center; gap: 6px; padding: 0.55rem 1.35rem; font-weight: 600;">
                        <i data-lucide="check" style="width: 15px; height: 15px;"></i> Save Company Details
                    </button>
                </div>
            </div>

            <!-- WhatsApp Business Integration & Pairing (Screenshot 3 & Screenshot 5) -->
            <div class="glass-panel" style="padding: 2rem; background: rgba(15, 23, 42, 0.45); border: 1px solid var(--glass-border); border-radius: var(--radius-lg);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 0.6rem; font-size: 1.25rem; color: #f8fafc; font-weight: 700;">
                            <i data-lucide="message-circle" style="color: #25d366; width: 22px; height: 22px;"></i>
                            WhatsApp Business Integration & Device Pairing
                        </h3>
                        <p style="margin: 4px 0 0 0; color: var(--color-text-muted); font-size: 0.85rem;">
                            Direct sharing and instant PDF dispatch for Quotations, Tax Invoices & Order specifications.
                        </p>
                    </div>
                    <div>
                        <span style="font-size: 0.75rem; padding: 4px 10px; border-radius: 9999px; background: rgba(37, 211, 102, 0.15); color: #4ade80; border: 1px solid rgba(37, 211, 102, 0.3); font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                            <span style="width: 7px; height: 7px; border-radius: 50%; background: #25d366;"></span>
                            WhatsApp Web Sync
                        </span>
                    </div>
                </div>

                <div style="background: #ffffff; border-radius: 12px; padding: 1.75rem 2rem; color: #0f172a; max-width: 620px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);">
                    <!-- Staff member toggle (Screenshot 3 & 5) -->
                    <label style="display: flex; align-items: center; gap: 10px; font-size: 0.95rem; color: #1e293b; font-weight: 500; cursor: pointer; margin-bottom: 1rem;">
                        <input type="checkbox" id="set-wa-allow-staff" ${state.settings?.whatsapp?.allowStaffSharing !== false ? 'checked' : ''} onchange="window.toggleStaffWhatsAppSharing(this.checked)" style="accent-color: #0d9488; width: 20px; height: 20px; cursor: pointer;">
                        Allow staff member to send WhatsApp using connected phone number.
                    </label>

                    <!-- Connected State (Screenshot 5) vs Disconnected / QR Pairing State (Screenshot 3) -->
                    <div id="settings-wa-device-status-box" style="margin-top: 14px;">
                        ${state.settings?.whatsapp?.connected !== false ? `
                            <div class="whatsapp-connected-card">
                                <div class="wa-logo">
                                    <i data-lucide="phone" style="width: 17px; height: 17px; fill: white;"></i>
                                </div>
                                <div class="wa-info">
                                    <div style="font-size: 0.85rem; color: #475569;">Connected with</div>
                                    <strong style="font-size: 1.05rem; color: #0f172a;">${state.settings?.whatsapp?.phone || '+91 8086888500'}</strong>
                                </div>
                                <button type="button" class="wa-disconnect-btn" onclick="window.disconnectWhatsAppDevice(); window.switchSettingsTab('general');" title="Disconnect WhatsApp Device">✕</button>
                            </div>
                        ` : `
                            <div class="whatsapp-qr-box">
                                <div class="whatsapp-qr-image-wrapper">
                                    ${window.generateWhatsAppQrSvg ? window.generateWhatsAppQrSvg(180) : ''}
                                </div>
                                <div class="whatsapp-countdown-badge" id="settings-wa-qr-countdown">18</div>
                                <p class="whatsapp-qr-instruction">Scan the QR from your phone WhatsApp to authenticate</p>
                                <button type="button" class="btn btn-secondary" onclick="window.connectWhatsAppDevice(); window.switchSettingsTab('general');" style="margin-top: 14px; font-size: 0.85rem; padding: 6px 16px; color: #0d9488; border-color: #0d9488; font-weight: 600; cursor: pointer;">
                                    ✓ Authenticate / Pair Device
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `,
        'quotation': (() => {
            const qDef = state.settings?.quotationDefaults || {};
            const prefix = qDef.prefix !== undefined ? qDef.prefix : 'QT-';
            const nextSeq = qDef.nextSequence !== undefined ? qDef.nextSequence : 1001;
            const numberFormat = qDef.numberFormat || '{PREFIX}{YYYY}-{SEQ}';
            const paddingDigits = qDef.paddingDigits || 4;
            const termsRows = (qDef.termsRows && qDef.termsRows.length > 0) ? qDef.termsRows : [
                'Rates are valid for 30 days from quotation date.',
                '50% Advance with purchase order confirmation, balance before delivery.',
                'Delivery timeline: 14 to 21 working days after site measurement sign-off.',
                'Site installation and transport extra as quoted unless specifically included.',
                'All structural steel products carry a 5-year anti-rust structural warranty.'
            ];

            const now = new Date();
            const yyyy = String(now.getFullYear());
            const yy = yyyy.slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const seqStr = String(nextSeq).padStart(paddingDigits, '0');
            const previewNumber = numberFormat
                .replace('{PREFIX}', prefix)
                .replace('{YYYY}', yyyy)
                .replace('{YY}', yy)
                .replace('{MM}', mm)
                .replace('{SEQ}', seqStr);

            return `
             <!-- 1. Quotation Numbering & Series Configuration Card -->
             <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="margin: 0; display: flex; align-items: center; gap: 0.6rem; font-size: 1.35rem; color: var(--color-text-heading); font-weight: 700;">
                            <i data-lucide="hash" style="color: var(--color-primary); width: 22px; height: 22px;"></i>
                            Quotation Numbering Configuration
                        </h2>
                        <p style="margin: 4px 0 0 0; color: var(--color-text-muted); font-size: 0.85rem;">
                            Manage custom prefixes, running sequence counters, and dynamic series formats for new quotes.
                        </p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.65rem; background: var(--color-primary-subtle); border: 1.5px solid var(--color-primary-border); padding: 6px 14px; border-radius: 9999px;">
                        <span style="font-size: 0.72rem; color: var(--color-primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Next Preview:</span>
                        <span id="quote-numbering-preview" style="font-family: monospace; font-size: 0.95rem; font-weight: 800; color: var(--color-primary);">${previewNumber}</span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500;">Quotation Prefix</label>
                        <input type="text" id="set-quote-prefix" value="${prefix}" oninput="window.updateQuoteNumberPreview()" class="glass-input" style="width: 100%; font-family: monospace; font-weight: 700;" placeholder="e.g. QT-, EST-, SB-">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500;">Next Sequence Number</label>
                        <input type="number" id="set-quote-sequence" value="${nextSeq}" oninput="window.updateQuoteNumberPreview()" class="glass-input" style="width: 100%; font-family: monospace; font-weight: 700;" min="1" step="1">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500;">Numbering Pattern / Format</label>
                        <select id="set-quote-format" onchange="window.updateQuoteNumberPreview()" class="glass-input" style="width: 100%; font-family: monospace;">
                            <option value="{PREFIX}{YYYY}-{SEQ}" ${numberFormat === '{PREFIX}{YYYY}-{SEQ}' ? 'selected' : ''}>{PREFIX}{YYYY}-{SEQ} (e.g. ${prefix}${yyyy}-${seqStr})</option>
                            <option value="{PREFIX}{SEQ}" ${numberFormat === '{PREFIX}{SEQ}' ? 'selected' : ''}>{PREFIX}{SEQ} (e.g. ${prefix}${seqStr})</option>
                            <option value="{PREFIX}{YY}{MM}-{SEQ}" ${numberFormat === '{PREFIX}{YY}{MM}-{SEQ}' ? 'selected' : ''}>{PREFIX}{YY}{MM}-{SEQ} (e.g. ${prefix}${yy}${mm}-${seqStr})</option>
                            <option value="{PREFIX}EST-{SEQ}" ${numberFormat === '{PREFIX}EST-{SEQ}' ? 'selected' : ''}>{PREFIX}EST-{SEQ} (e.g. ${prefix}EST-${seqStr})</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500;">Sequence Padding (Digits)</label>
                        <select id="set-quote-padding" onchange="window.updateQuoteNumberPreview()" class="glass-input" style="width: 100%; font-family: monospace;">
                            <option value="3" ${paddingDigits == 3 ? 'selected' : ''}>3 Digits (001)</option>
                            <option value="4" ${paddingDigits == 4 ? 'selected' : ''}>4 Digits (0001)</option>
                            <option value="5" ${paddingDigits == 5 ? 'selected' : ''}>5 Digits (00001)</option>
                            <option value="6" ${paddingDigits == 6 ? 'selected' : ''}>6 Digits (000001)</option>
                        </select>
                    </div>
                </div>
             </div>

             <!-- 2. Global Terms & Conditions / Description Management Card -->
             <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="margin: 0; display: flex; align-items: center; gap: 0.6rem; font-size: 1.35rem; color: var(--color-text-heading); font-weight: 700;">
                            <i data-lucide="list" style="color: #38bdf8; width: 22px; height: 22px;"></i>
                            Global Terms / Description Management
                        </h2>
                        <p style="margin: 4px 0 0 0; color: var(--color-text-muted); font-size: 0.85rem;">
                            Define global default description and terms bullet points automatically pre-populated on new quotations.
                        </p>
                    </div>
                    <button type="button" class="btn btn-secondary" onclick="window.addSettingsTermRow()" style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 600; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35);">
                        <i data-lucide="plus" style="width: 14px; height: 14px;"></i> + Add Row
                    </button>
                </div>

                <div id="settings-quote-terms-container" style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
                    ${termsRows.map((term, tIdx) => `
                        <div class="settings-term-row" style="display: flex; align-items: center; gap: 0.65rem;">
                            <span style="width: 26px; height: 26px; border-radius: 6px; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 700; color: #94a3b8; flex-shrink: 0;">${tIdx + 1}</span>
                            <input type="text" class="glass-input settings-quote-term-input" value="${term.replace(/"/g, '&quot;')}" style="flex: 1;" placeholder="Enter term or condition bullet point...">
                            <button type="button" onclick="this.parentElement.remove(); window.renumberSettingsTerms();" style="width: 34px; height: 34px; border-radius: 6px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;" title="Delete row">
                                ✕
                            </button>
                        </div>
                    `).join('')}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; border-top: 1px solid var(--glass-border); padding-top: 1.5rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500;">Default Description Summary</label>
                        <textarea id="set-quote-desc" class="glass-input" style="width: 100%; height: 75px; resize: none;">${qDef.defaultDescription || ''}</textarea>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500;">Default Payment Terms Summary</label>
                        <textarea id="set-quote-terms" class="glass-input" style="width: 100%; height: 75px; resize: none;">${qDef.paymentTerms || ''}</textarea>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500;">Default Validity</label>
                        <input type="text" id="set-quote-validity" value="${qDef.validity || '30 Days'}" class="glass-input" style="width: 100%;" placeholder="e.g. 30 Days">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500;">Footer / Signatory Text</label>
                        <input type="text" id="set-quote-footer" value="${qDef.footerText || 'Authorized Signatory'}" class="glass-input" style="width: 100%;">
                    </div>
                </div>
             </div>

            <div class="glass-panel" style="padding: 2rem;">
                <h3 style="margin-top: 0; margin-bottom: 1rem;">Visual Theme</h3>
                <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Select design for Quotations & Invoices.</p>
                 <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;">
                        ${[
                { id: 'theme-classic-blue', name: 'Standard Blue', color: '#2563eb' },
                { id: 'theme-modern-clean', name: 'Modern Clean', color: '#0f172a' },
                { id: 'theme-prof-slate', name: 'Professional Slate', color: '#475569' },
                { id: 'theme-corp-green', name: 'Corporate Green', color: '#16a34a' },
                { id: 'theme-royal-purple', name: 'Royal Purple', color: '#9333ea' },
                { id: 'theme-crimson-bold', name: 'Crimson Bold', color: '#dc2626' },
                { id: 'theme-min-mono', name: 'Minimalist Mono', color: '#000000' },
                { id: 'theme-classic-serif', name: 'Classic Serif', color: '#57534e' },
                { id: 'theme-dark-print', name: 'Dark Mode (Print)', color: '#18181b' },
                { id: 'theme-compact-grid', name: 'Compact Grid', color: '#0284c7' }
            ].map(theme => `
                            <label style="cursor: pointer; position: relative;">
                                <input type="radio" name="quote-theme" value="${theme.id}" 
                                    ${(state.settings?.quotationTheme || 'theme-classic-blue') === theme.id ? 'checked' : ''}
                                    style="position: absolute; opacity: 0;"
                                >
                                <div class="theme-card" style="
                                    padding: 1rem; border: 2px solid var(--glass-border); border-radius: 8px; 
                                    text-align: center; transition: all 0.2s; background: rgba(255,255,255,0.03);
                                ">
                                    <div style="width: 100%; height: 40px; background: ${theme.color}; border-radius: 4px; margin-bottom: 0.5rem; opacity: 0.8;"></div>
                                    <span style="font-size: 0.8rem; font-weight: 500;">${theme.name}</span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                     <style>
                        input[name="quote-theme"]:checked + .theme-card {
                            border-color: var(--color-primary);
                            background: var(--color-primary-glow);
                        }
                    </style>
            </div>
            `;
        })(),
        'hr': `
            <div class="glass-panel" style="padding: 2rem;">
                <h2 style="margin-top: 0; margin-bottom: 2rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">HR & Team Settings</h2>
                <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Standard Work Days / Month</label>
                        <input type="number" id="set-hr-days" value="${state.settings?.hrDefaults?.workDays || 26}" class="glass-input" style="width: 100%;">
                    </div>
                     <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Default Daily Shift (Hours)</label>
                        <input type="number" id="set-hr-hours" value="${state.settings?.hrDefaults?.workHours || 8}" class="glass-input" style="width: 100%;">
                    </div>
                </div>
            </div>
        `,
        'users': `
            <div class="glass-panel" style="padding: 2rem;">
                <h2 style="margin-top: 0; margin-bottom: 2rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">User Management</h2>
                <div style="text-align: center; padding: 3rem; color: var(--color-text-muted);">
                    <i data-lucide="users" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Multi-user management is available in the Pro version.</p>
                    <p style="font-size: 0.9rem;">Current User: Admin (System Owner)</p>
                </div>
            </div>

            <div class="glass-panel" style="padding: 2rem; margin-top: 1rem; border: 1px solid var(--color-success);">
                <h3 style="color: var(--color-success); margin-top: 0;">Security & Backup</h3>
                <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Secure your data by downloading a local backup of the database.</p>
                 <button class="btn btn-primary" style="background: var(--color-success); border-color: var(--color-success);" onclick="window.backupDatabase()">
                    <i data-lucide="download-cloud"></i> Backup Database (.json)
                </button>
            </div>

             <div class="glass-panel" style="padding: 2rem; margin-top: 1rem; border: 1px solid var(--color-danger);">
                <h3 style="color: var(--color-danger); margin-top: 0;">Danger Zone</h3>
                <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Manage your local application data.</p>
                 <button class="btn" style="border: 1px solid var(--color-danger); color: var(--color-danger); background: transparent;" onclick="confirm('Are you sure you want to reset all data?') && window.resetAllData()">
                    <i data-lucide="trash-2"></i> Factory Reset / Clear Data
                </button>
            </div>
        `,
        'rates': `
            <div class="glass-panel" style="padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0;">Rate & Formula Rules </h2>
                    <span style="background: var(--color-primary-glow); color: var(--color-primary); padding: 4px 10px; border-radius: 4px; font-size: 0.8rem;">Admin Editable</span>
                </div>
                
                <p style="color: var(--color-text-muted); margin-bottom: 2rem;">Configure base excel-like calculation rules and extra charges per partition/pane.</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Extra Charge Per Window Partition (₹)</label>
                        <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: -0.25rem; margin-bottom: 0.5rem;">Cost added for every center partition/pane extra created.</p>
                        <input type="number" id="set-rate-partition" value="${state.calcSettings?.partition_extra?.rate || 350}" class="glass-input" style="width: 100%; border-color: var(--color-primary);">
                    </div>
                </div>

                <div style="background: rgba(255,165,0,0.1); border-left: 3px solid orange; padding: 1rem; margin-top: 2rem; border-radius: 0 4px 4px 0;">
                    <i data-lucide="info" style="color: orange; float: left; margin-right: 10px; width: 20px;"></i>
                    <p style="font-size: 0.85rem; color: #fff; margin: 0;"><strong>Formula Example:</strong> If center partition is there = (Base Cost + Partition Charge). You can modify all advanced material pricing parameters later via the dedicated Production module.</p>
                </div>
            </div>
        `,
        'leo_voice': `
            <div class="glass-panel" style="padding: 2rem; margin-bottom: 1.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.65rem; color: #f8fafc;">
                            <i data-lucide="mic" style="color: #38bdf8;"></i> Leo Live Voice & Language Configuration
                        </h2>
                        <p style="color: var(--color-text-muted); margin: 4px 0 0; font-size: 0.88rem;">
                            Configure Leo's Text-to-Speech (TTS) models, choose between 4 distinct native AI voices (2 Female, 2 Male), and select your preferred language.
                        </p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span style="font-size: 0.75rem; padding: 4px 10px; border-radius: 9999px; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                            <span style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e;"></span>
                            Native Neural TTS Engine Active
                        </span>
                    </div>
                </div>

                <!-- SECTION 1: Exactly 4 Voice Models (2 Female, 2 Male) -->
                <div style="margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; color: #f8fafc; font-weight: 600;">AI Voice Models (4 Distinct Personas)</h3>
                            <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">Choose between 2 female voices and 2 male voices with native Indian & South Indian accents.</p>
                        </div>
                        <span style="font-size: 0.76rem; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.25);">
                            Active: <strong id="current-active-voice-label">${(state.leoVoiceSettings?.activeVoiceId || 'malavika-expressive').includes('malavika') ? 'Malavika (Female)' : (state.leoVoiceSettings?.activeVoiceId || '').includes('ananya') ? 'Ananya (Female)' : (state.leoVoiceSettings?.activeVoiceId || '').includes('rahul') ? 'Rahul (Male)' : 'Madhavan (Male)'}</strong>
                        </span>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
                        
                        <!-- VOICE 1: Ananya (Female) -->
                        <div class="leo-voice-card ${(state.leoVoiceSettings?.activeVoiceId || 'malavika-expressive') === 'ananya-warm' ? 'active' : ''}" id="card-voice-ananya" onclick="window.selectLeoVoice('ananya-warm')">
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                                        <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #f43f5e, #fb7185); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; box-shadow: 0 0 12px rgba(244, 63, 94, 0.35);">
                                            👩‍💼
                                        </div>
                                        <div>
                                            <div style="display: flex; align-items: center; gap: 0.45rem;">
                                                <h4 style="margin: 0; font-size: 1.1rem; color: #f8fafc; font-weight: 700;">Ananya</h4>
                                                <span style="font-size: 0.7rem; padding: 1px 7px; border-radius: 9999px; background: rgba(244, 63, 94, 0.2); color: #fda4af; border: 1px solid rgba(244, 63, 94, 0.4); font-weight: 600;">Female • Voice 1</span>
                                            </div>
                                            <span style="font-size: 0.76rem; color: #94a3b8;">Warm & Professional Corporate Voice</span>
                                        </div>
                                    </div>
                                    <input type="radio" name="leo-voice-model" value="ananya-warm" ${(state.leoVoiceSettings?.activeVoiceId || 'malavika-expressive') === 'ananya-warm' ? 'checked' : ''} style="cursor: pointer; accent-color: #38bdf8;">
                                </div>
                                <p style="margin: 0 0 0.85rem; font-size: 0.8rem; color: #cbd5e1; line-height: 1.45;">
                                    Articulate, balanced executive tone. Delivers financial metrics and quotation breakdowns with warm conversational clarity.
                                </p>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 1rem;">
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #94a3b8;">English (Indian)</span>
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #94a3b8;">Hindi</span>
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #94a3b8;">Malayalam</span>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem;">
                                <span style="font-size: 0.74rem; color: #64748b;">Pitch: 1.05 • Rate: 0.98</span>
                                <button type="button" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.35rem;" onclick="event.stopPropagation(); window.previewLeoVoice('ananya-warm')">
                                    <i data-lucide="volume-2" style="width: 14px; height: 14px; color: #38bdf8;"></i> Listen Sample
                                </button>
                            </div>
                        </div>

                        <!-- VOICE 2: Malavika (Female - Native Malayalam / South Indian) -->
                        <div class="leo-voice-card ${(state.leoVoiceSettings?.activeVoiceId || 'malavika-expressive') === 'malavika-expressive' ? 'active' : ''}" id="card-voice-malavika" onclick="window.selectLeoVoice('malavika-expressive')">
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                                        <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #ec4899, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; box-shadow: 0 0 12px rgba(236, 72, 153, 0.35);">
                                            👩‍🔬
                                        </div>
                                        <div>
                                            <div style="display: flex; align-items: center; gap: 0.45rem;">
                                                <h4 style="margin: 0; font-size: 1.1rem; color: #f8fafc; font-weight: 700;">Malavika</h4>
                                                <span style="font-size: 0.7rem; padding: 1px 7px; border-radius: 9999px; background: rgba(236, 72, 153, 0.2); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4); font-weight: 600;">Female • Voice 2</span>
                                            </div>
                                            <span style="font-size: 0.76rem; color: #94a3b8;">Expressive & Native Malayali Intonation</span>
                                        </div>
                                    </div>
                                    <input type="radio" name="leo-voice-model" value="malavika-expressive" ${(state.leoVoiceSettings?.activeVoiceId || 'malavika-expressive') === 'malavika-expressive' ? 'checked' : ''} style="cursor: pointer; accent-color: #38bdf8;">
                                </div>
                                <p style="margin: 0 0 0.85rem; font-size: 0.8rem; color: #cbd5e1; line-height: 1.45;">
                                    100% natural native Malayalam speaker accent, melody, and conversational cadence. Eliminates robotic tones completely.
                                </p>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 1rem;">
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-weight: 600;">Malayalam (100% Native)</span>
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #94a3b8;">Tamil</span>
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #94a3b8;">English</span>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem;">
                                <span style="font-size: 0.74rem; color: #64748b;">Pitch: 1.12 • Rate: 0.96</span>
                                <button type="button" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.35rem;" onclick="event.stopPropagation(); window.previewLeoVoice('malavika-expressive')">
                                    <i data-lucide="volume-2" style="width: 14px; height: 14px; color: #38bdf8;"></i> Listen Sample
                                </button>
                            </div>
                        </div>

                        <!-- VOICE 3: Rahul (Male) -->
                        <div class="leo-voice-card ${(state.leoVoiceSettings?.activeVoiceId || 'malavika-expressive') === 'rahul-confident' ? 'active' : ''}" id="card-voice-rahul" onclick="window.selectLeoVoice('rahul-confident')">
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                                        <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #0284c7, #2563eb); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; box-shadow: 0 0 12px rgba(2, 132, 199, 0.35);">
                                            👨‍💼
                                        </div>
                                        <div>
                                            <div style="display: flex; align-items: center; gap: 0.45rem;">
                                                <h4 style="margin: 0; font-size: 1.1rem; color: #f8fafc; font-weight: 700;">Rahul</h4>
                                                <span style="font-size: 0.7rem; padding: 1px 7px; border-radius: 9999px; background: rgba(2, 132, 199, 0.2); color: #38bdf8; border: 1px solid rgba(2, 132, 199, 0.4); font-weight: 600;">Male • Voice 3</span>
                                            </div>
                                            <span style="font-size: 0.76rem; color: #94a3b8;">Confident & Analytical Corporate Advisor</span>
                                        </div>
                                    </div>
                                    <input type="radio" name="leo-voice-model" value="rahul-confident" ${(state.leoVoiceSettings?.activeVoiceId || 'malavika-expressive') === 'rahul-confident' ? 'checked' : ''} style="cursor: pointer; accent-color: #38bdf8;">
                                </div>
                                <p style="margin: 0 0 0.85rem; font-size: 0.8rem; color: #cbd5e1; line-height: 1.45;">
                                    Authoritative, calm, clear business analyst voice. Delivers procurement figures, operational KPIs, and profit margins with sharp confidence.
                                </p>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 1rem;">
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #94a3b8;">English (Indian)</span>
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #94a3b8;">Hindi</span>
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #94a3b8;">Tamil</span>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem;">
                                <span style="font-size: 0.74rem; color: #64748b;">Pitch: 0.90 • Rate: 0.98</span>
                                <button type="button" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.35rem;" onclick="event.stopPropagation(); window.previewLeoVoice('rahul-confident')">
                                    <i data-lucide="volume-2" style="width: 14px; height: 14px; color: #38bdf8;"></i> Listen Sample
                                </button>
                            </div>
                        </div>

                        <!-- VOICE 4: Madhavan (Male - Deep Native Malayali Baritone) -->
                        <div class="leo-voice-card ${(state.leoVoiceSettings?.activeVoiceId || 'malavika-expressive') === 'madhavan-deep' ? 'active' : ''}" id="card-voice-madhavan" onclick="window.selectLeoVoice('madhavan-deep')">
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                                        <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #059669, #0d9488); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; box-shadow: 0 0 12px rgba(5, 150, 105, 0.35);">
                                            👨‍🔧
                                        </div>
                                        <div>
                                            <div style="display: flex; align-items: center; gap: 0.45rem;">
                                                <h4 style="margin: 0; font-size: 1.1rem; color: #f8fafc; font-weight: 700;">Madhavan</h4>
                                                <span style="font-size: 0.7rem; padding: 1px 7px; border-radius: 9999px; background: rgba(5, 150, 105, 0.2); color: #34d399; border: 1px solid rgba(5, 150, 105, 0.4); font-weight: 600;">Male • Voice 4</span>
                                            </div>
                                            <span style="font-size: 0.76rem; color: #94a3b8;">Deep & Resonant Native Baritone</span>
                                        </div>
                                    </div>
                                    <input type="radio" name="leo-voice-model" value="madhavan-deep" ${(state.leoVoiceSettings?.activeVoiceId || 'malavika-expressive') === 'madhavan-deep' ? 'checked' : ''} style="cursor: pointer; accent-color: #38bdf8;">
                                </div>
                                <p style="margin: 0 0 0.85rem; font-size: 0.8rem; color: #cbd5e1; line-height: 1.45;">
                                    Deep, resonant, friendly native advisor voice with authentic Malayalam baritone. Clear, trustworthy conversational delivery for factory operations.
                                </p>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 1rem;">
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(52, 211, 153, 0.15); color: #34d399; font-weight: 600;">Malayalam (Native Baritone)</span>
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #94a3b8;">Tamil</span>
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #94a3b8;">English</span>
                                    <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #94a3b8;">Hindi</span>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem;">
                                <span style="font-size: 0.74rem; color: #64748b;">Pitch: 0.82 • Rate: 0.94</span>
                                <button type="button" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.35rem;" onclick="event.stopPropagation(); window.previewLeoVoice('madhavan-deep')">
                                    <i data-lucide="volume-2" style="width: 14px; height: 14px; color: #38bdf8;"></i> Listen Sample
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- SECTION 2: Multilingual Language & Audio Preferences -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; border-top: 1px solid var(--glass-border); padding-top: 1.5rem; margin-bottom: 1.5rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.88rem; font-weight: 600; color: #cbd5e1;">
                            Default Speech & Conversation Language
                        </label>
                        <select id="set-leo-lang" class="glass-input" style="width: 100%; padding: 0.65rem 0.85rem; font-size: 0.9rem; background: #0f172a;" onchange="window.handleSettingsLanguageChange(this.value)">
                            <option value="en-IN" ${(state.leoVoiceSettings?.language || 'en-IN') === 'en-IN' ? 'selected' : ''}>English (Indian Business Accent)</option>
                            <option value="ml-IN" ${(state.leoVoiceSettings?.language || 'en-IN') === 'ml-IN' ? 'selected' : ''}>Malayalam (Regional Flow)</option>
                            <option value="hi-IN" ${(state.leoVoiceSettings?.language || 'en-IN') === 'hi-IN' ? 'selected' : ''}>Hindi (हिन्दी - Native Pronunciation)</option>
                            <option value="ta-IN" ${(state.leoVoiceSettings?.language || 'en-IN') === 'ta-IN' ? 'selected' : ''}>Tamil (தமிழ் - Fluent South Indian Flow)</option>
                        </select>
                        <div style="font-size: 0.74rem; color: #64748b; margin-top: 4px;">
                            Leo automatically understands inputs in any of these languages and responds with the matching native TTS voice.
                        </div>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.88rem; font-weight: 600; color: #cbd5e1;">
                            Voice Automation Options
                        </label>
                        <div style="display: flex; flex-direction: column; gap: 0.65rem; background: rgba(0,0,0,0.25); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                            <label style="display: flex; align-items: center; gap: 0.65rem; cursor: pointer; margin: 0; font-size: 0.85rem; color: #f8fafc;">
                                <input type="checkbox" id="set-leo-autospeak" ${(state.leoVoiceSettings?.autoSpeak !== false) ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: #38bdf8;">
                                <span>Automatically Speak AI Responses Aloud</span>
                            </label>
                            <span style="font-size: 0.72rem; color: #94a3b8; margin-left: 26px;">
                                When enabled, Leo speaks the answer using your active voice model immediately after analyzing data.
                            </span>
                        </div>
                    </div>
                </div>

                <!-- SECTION 3: Pitch & Speed Acoustics Fine-Tuning -->
                <div style="border-top: 1px solid var(--glass-border); padding-top: 1.5rem;">
                    <h4 style="margin: 0 0 1rem; font-size: 1rem; color: #f8fafc; font-weight: 600;">Speech Acoustics Fine-Tuning</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 500;">Speech Speed (Rate)</label>
                                <span id="label-leo-rate" style="font-size: 0.82rem; color: #38bdf8; font-weight: 700; font-family: monospace;">${state.leoVoiceSettings?.speechRate || 1.0}x</span>
                            </div>
                            <input type="range" id="set-leo-rate" min="0.8" max="1.3" step="0.05" value="${state.leoVoiceSettings?.speechRate || 1.0}" oninput="document.getElementById('label-leo-rate').innerText = this.value + 'x'" style="width: 100%; accent-color: #38bdf8;">
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 500;">Pitch Modulation</label>
                                <span id="label-leo-pitch" style="font-size: 0.82rem; color: #38bdf8; font-weight: 700; font-family: monospace;">${state.leoVoiceSettings?.speechPitch || 1.0}</span>
                            </div>
                            <input type="range" id="set-leo-pitch" min="0.7" max="1.3" step="0.05" value="${state.leoVoiceSettings?.speechPitch || 1.0}" oninput="document.getElementById('label-leo-pitch').innerText = this.value" style="width: 100%; accent-color: #38bdf8;">
                        </div>
                    </div>
                </div>

                <!-- Action buttons -->
                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; border-top: 1px solid var(--glass-border); padding-top: 1.25rem;">
                    <button type="button" class="btn btn-secondary" onclick="window.previewActiveLeoVoice()">
                        <i data-lucide="play" style="width: 15px; height: 15px;"></i> Test Current Voice
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.saveLeoVoiceSettings()" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600;">
                        <i data-lucide="check" style="width: 16px; height: 16px;"></i> Save Voice Configuration
                    </button>
                </div>
            </div>
        `
    };

    // Dedicated Theme & Appearance Tab (Strictly 1 Light Mode & 1 Dark Mode)
    const activeTheme = (typeof window.getCurrentTheme === 'function') ? window.getCurrentTheme() : 'dark';
    tabs['appearance'] = `
        <div class="glass-panel" style="padding: 2rem; margin-bottom: 1.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h2 style="margin: 0; font-size: 1.45rem; color: var(--color-text-heading); font-weight: 700; display: flex; align-items: center; gap: 0.65rem;">
                        <i data-lucide="palette" style="color: var(--color-primary);"></i> Theme & Visual Appearance
                    </h2>
                    <p style="color: var(--color-text-muted); margin: 4px 0 0; font-size: 0.88rem;">
                        Choose between strictly high-contrast Dark Mode and architectural Light Mode. Both are optimized for long work sessions.
                    </p>
                </div>
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-size: 0.78rem; padding: 4px 12px; border-radius: 9999px; background: var(--color-primary-subtle); color: var(--color-primary); border: 1px solid var(--color-primary-border); font-weight: 600;">
                        Active: ${activeTheme === 'light' ? '☀️ Light Mode (Architectural Luxury)' : '🌙 Dark Mode (Localy Slate)'}
                    </span>
                </div>
            </div>

            <!-- 2 Mode Selection Cards (Dark Mode vs Light Mode) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                
                <!-- 1. DARK MODE CARD -->
                <div onclick="window.setTheme('dark'); window.switchSettingsTab('appearance');" style="
                    border: 2px solid ${activeTheme === 'dark' ? 'var(--color-primary)' : 'var(--glass-border)'};
                    background: ${activeTheme === 'dark' ? 'var(--color-primary-glow)' : 'var(--color-bg-card)'};
                    border-radius: var(--radius-lg); padding: 1.5rem; cursor: pointer; transition: all 0.2s ease;
                    box-shadow: ${activeTheme === 'dark' ? '0 0 20px var(--color-primary-glow)' : 'none'};
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                            <div style="width: 42px; height: 42px; border-radius: 10px; background: #0f1219; border: 1px solid rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                                🌙
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 700;">Dark Mode</h3>
                                <span style="font-size: 0.72rem; color: var(--color-text-muted);">Photo 2 • Localy Balanced Palette</span>
                            </div>
                        </div>
                        ${activeTheme === 'dark' ? `
                            <span style="background: var(--color-primary); color: white; padding: 2px 10px; border-radius: 9999px; font-size: 0.72rem; font-weight: 700;">ACTIVE</span>
                        ` : `
                            <span style="background: var(--glass-bg); color: var(--color-text-muted); border: 1px solid var(--glass-border); padding: 2px 8px; border-radius: 9999px; font-size: 0.72rem;">Select</span>
                        `}
                    </div>
                    <p style="font-size: 0.82rem; color: var(--color-text-muted); margin: 0 0 1rem; line-height: 1.45;">
                        Engineered on comfortable Dark Slate surfaces with Periwinkle Blue primary navigation, Warm Amber milestones, and Coral Red live alerts.
                    </p>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="width: 22px; height: 22px; border-radius: 50%; background: #0f1219; border: 1px solid rgba(255,255,255,0.3);" title="Dark Slate Background #0f1219"></span>
                        <span style="width: 22px; height: 22px; border-radius: 50%; background: #6366f1; border: 1px solid rgba(255,255,255,0.2);" title="Periwinkle Blue Primary #6366f1"></span>
                        <span style="width: 22px; height: 22px; border-radius: 50%; background: #fdbb3d; border: 1px solid rgba(255,255,255,0.2);" title="Warm Amber Accent #fdbb3d"></span>
                        <span style="width: 22px; height: 22px; border-radius: 50%; background: #ff5c6a; border: 1px solid rgba(255,255,255,0.2);" title="Coral Highlight #ff5c6a"></span>
                    </div>
                </div>

                <!-- 2. LIGHT MODE CARD -->
                <div onclick="window.setTheme('light'); window.switchSettingsTab('appearance');" style="
                    border: 2px solid ${activeTheme === 'light' ? 'var(--color-primary)' : 'var(--glass-border)'};
                    background: ${activeTheme === 'light' ? 'var(--color-primary-glow)' : 'var(--color-bg-card)'};
                    border-radius: var(--radius-lg); padding: 1.5rem; cursor: pointer; transition: all 0.2s ease;
                    box-shadow: ${activeTheme === 'light' ? '0 0 20px var(--color-primary-glow)' : 'none'};
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                            <div style="width: 42px; height: 42px; border-radius: 10px; background: #ffffff; border: 1px solid rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                                ☀️
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 700;">Light Mode</h3>
                                <span style="font-size: 0.72rem; color: var(--color-text-muted);">Photo 4 • Architectural Luxury</span>
                            </div>
                        </div>
                        ${activeTheme === 'light' ? `
                            <span style="background: var(--color-primary); color: white; padding: 2px 10px; border-radius: 9999px; font-size: 0.72rem; font-weight: 700;">ACTIVE</span>
                        ` : `
                            <span style="background: var(--glass-bg); color: var(--color-text-muted); border: 1px solid var(--glass-border); padding: 2px 8px; border-radius: 9999px; font-size: 0.72rem;">Select</span>
                        `}
                    </div>
                    <p style="font-size: 0.82rem; color: var(--color-text-muted); margin: 0 0 1rem; line-height: 1.45;">
                        Crisp porcelain white surfaces with Deep Ocean Petrol Teal headings and Warm Sand Greige accents for exceptional contrast and day-time readability.
                    </p>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="width: 22px; height: 22px; border-radius: 50%; background: #f5f7fa; border: 1px solid rgba(0,0,0,0.2);" title="Porcelain Canvas #f5f7fa"></span>
                        <span style="width: 22px; height: 22px; border-radius: 50%; background: #184e68; border: 1px solid rgba(0,0,0,0.1);" title="Ocean Petrol Teal Primary #184e68"></span>
                        <span style="width: 22px; height: 22px; border-radius: 50%; background: #c2b49a; border: 1px solid rgba(0,0,0,0.1);" title="Warm Sand Champagne #c2b49a"></span>
                        <span style="width: 22px; height: 22px; border-radius: 50%; background: #059669; border: 1px solid rgba(0,0,0,0.1);" title="Emerald Success #059669"></span>
                    </div>
                </div>

            </div>

            <!-- Readability & Legibility Verification Preview -->
            <div style="border-top: 1px solid var(--glass-border); padding-top: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem; font-size: 0.95rem; color: var(--color-text-heading); font-weight: 600;">Theme Legibility & Contrast Preview</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
                    <div style="background: var(--color-bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1rem;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Headings & Text</span>
                        <h5 style="margin: 4px 0 2px; color: var(--color-text-heading); font-size: 0.95rem;">Crystal-Clear Legibility</h5>
                        <p style="margin: 0; color: var(--color-text-main); font-size: 0.8rem;">Every element adheres to WCAG high-contrast standards.</p>
                    </div>
                    <div style="background: var(--color-bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1rem;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Interactive Buttons</span>
                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                            <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.78rem;">Primary Action</button>
                            <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.78rem;">Secondary</button>
                        </div>
                    </div>
                    <div style="background: var(--color-bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1rem;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Form Fields</span>
                        <input type="text" class="glass-input" value="High contrast input field" style="width: 100%; margin-top: 6px; padding: 4px 8px; font-size: 0.8rem;" readonly>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Materials Filter State
    if (!window.settingsMatFilter) window.settingsMatFilter = 'all';

    const catalog = Store.state.materialCatalog || [];
    const filteredCatalog = catalog.filter(m => {
        if (window.settingsMatFilter === 'all') return true;
        return m.category.toLowerCase().includes(window.settingsMatFilter.toLowerCase());
    });

    tabs['materials'] = `
            <div class="glass-panel" style="padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="layers" style="color: var(--color-primary);"></i> Material Catalog & Dynamic Pricing
                        </h2>
                        <p style="color: var(--color-text-muted); margin: 4px 0 0; font-size: 0.88rem;">
                            Configure individual component materials, Units of Measurement (UoM), and per-unit dynamic pricing for design calculations.
                        </p>
                    </div>
                    <button onclick="window.openAddMaterialModal()" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1rem; font-size: 0.9rem;">
                        <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i> Add Material
                    </button>
                </div>

                <!-- Category Filter Pills -->
                <div style="display: flex; gap: 0.4rem; margin-bottom: 1.25rem; flex-wrap: wrap; background: rgba(0,0,0,0.25); padding: 5px; border-radius: 8px; border: 1px solid var(--glass-border);">
                    <button onclick="window.setSettingsMatFilter('all')" 
                            style="border: none; border-radius: 5px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; background: ${(!window.settingsMatFilter || window.settingsMatFilter === 'all') ? 'var(--color-primary)' : 'transparent'}; color: ${(!window.settingsMatFilter || window.settingsMatFilter === 'all') ? 'white' : '#aaa'}; font-weight: ${(!window.settingsMatFilter || window.settingsMatFilter === 'all') ? '600' : '400'};">
                        All Items
                    </button>
                    ${(Store.state.materialGroups || ['Frame', 'Pipe', 'Panel', 'Hinges', 'Lock', 'Hook', 'Paint', 'Thinner']).map(g => `
                        <button onclick="window.setSettingsMatFilter('${g}')" 
                                style="border: none; border-radius: 5px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; background: ${window.settingsMatFilter === g ? 'var(--color-primary)' : 'transparent'}; color: ${window.settingsMatFilter === g ? 'white' : '#aaa'}; font-weight: ${window.settingsMatFilter === g ? '600' : '400'};">
                            ${g}
                        </button>
                    `).join('')}
                </div>

                <!-- Material Catalog Table -->
                <div style="background: rgba(0,0,0,0.25); border-radius: 8px; border: 1px solid var(--glass-border); overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.05); border-bottom: 1px solid var(--glass-border); color: #cbd5e1; font-size: 0.8rem; text-transform: uppercase;">
                                <th style="padding: 10px 14px;">Material Component</th>
                                <th style="padding: 10px 14px;">Category</th>
                                <th style="padding: 10px 14px; width: 150px;">Unit of Measure (UoM)</th>
                                <th style="padding: 10px 14px; text-align: right; width: 140px;">Unit Price (₹)</th>
                                <th style="padding: 10px 14px; width: 130px;">Weight/Spec</th>
                                <th style="padding: 10px 14px; text-align: center; width: 60px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredCatalog.length === 0 ? `
                                <tr>
                                    <td colspan="6" style="padding: 2.5rem; text-align: center; color: var(--color-text-muted);">
                                        No materials found in this category. Click "Add Material" to create one.
                                    </td>
                                </tr>
                            ` : filteredCatalog.map(item => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding: 10px 14px;">
                                        <div style="font-weight: 600; color: #f8fafc;">${item.name}</div>
                                        <div style="font-size: 0.75rem; color: #94a3b8; font-family: monospace;">ID: ${item.id}</div>
                                    </td>
                                    <td style="padding: 10px 14px;">
                                        <span style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);">
                                            ${item.category}
                                        </span>
                                    </td>
                                    <td style="padding: 10px 14px;">
                                        <!-- UoM Selector Dropdown -->
                                        <select onchange="window.updateMaterialCatalogItem('${item.id}', 'unit', this.value)" 
                                                class="glass-input" 
                                                style="padding: 4px 8px; font-size: 0.82rem; background: #262626; color: white; width: 100%; border-radius: 4px;">
                                            <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>Kilograms (kg)</option>
                                            <option value="pcs" ${item.unit === 'pcs' || item.unit === 'nos' ? 'selected' : ''}>Pieces (nos/pcs)</option>
                                            <option value="ltr" ${item.unit === 'ltr' ? 'selected' : ''}>Liters (ltr)</option>
                                            <option value="sq.ft" ${item.unit === 'sq.ft' ? 'selected' : ''}>Square Feet (sq.ft)</option>
                                            <option value="mtr" ${item.unit === 'mtr' ? 'selected' : ''}>Meters (mtr)</option>
                                        </select>
                                    </td>
                                    <td style="padding: 10px 14px; text-align: right;">
                                        <div style="display: inline-flex; align-items: center; gap: 4px; justify-content: flex-end;">
                                            <span style="color: #4ade80; font-weight: 600;">₹</span>
                                            <input type="number" 
                                                   step="0.5" 
                                                   value="${item.rate}" 
                                                   onchange="window.updateMaterialCatalogItem('${item.id}', 'rate', this.value)" 
                                                   class="glass-input" 
                                                   style="width: 85px; text-align: right; font-weight: 700; color: #4ade80; padding: 4px 6px; font-size: 0.88rem; background: rgba(0,0,0,0.3);">
                                        </div>
                                    </td>
                                    <td style="padding: 10px 14px; color: #94a3b8; font-size: 0.8rem;">
                                        ${item.weightFactor ? `${item.weightFactor} kg/${item.unit === 'sq.ft' ? 'sq.ft' : 'm'}` : item.coverage ? `${item.coverage} m²/ltr` : '-'}
                                    </td>
                                    <td style="padding: 10px 14px; text-align: center;">
                                        <button onclick="window.deleteMaterialCatalogItem('${item.id}')" 
                                                title="Delete Material" 
                                                style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 4px;">
                                            <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
    `;

    container.innerHTML = `
        <div style="padding: 1.5rem 2rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="margin: 0; font-size: 1.8rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i data-lucide="settings" style="color: var(--color-primary);"></i> Configuration
                </h1>
            </div>
            <button class="btn btn-primary" onclick="window.saveSettings()">
                <i data-lucide="save"></i> Save Changes
            </button>
        </div>

        <div style="flex: 1; display: flex; overflow: hidden;">
            <!-- Sidebar -->
            <div style="width: 250px; border-right: 1px solid var(--glass-border); padding: 1rem 0; background: rgba(0,0,0,0.1);">
                ${renderTabNav('profile', 'User Profile', 'user')}
                ${isSuperAdmin ? `
                    <button onclick="window.switchSettingsTab('accounts_config')" 
                        id="tab-nav-accounts_config"
                        style="
                            display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 12px 16px; border: none; 
                            background: ${window.currentSettingsTab === 'accounts_config' ? 'var(--color-primary-glow)' : 'transparent'}; 
                            color: ${window.currentSettingsTab === 'accounts_config' ? 'var(--color-primary)' : 'var(--color-text-muted)'}; 
                            border-left: 3px solid ${window.currentSettingsTab === 'accounts_config' ? 'var(--color-primary)' : 'transparent'};
                            text-align: left; cursor: pointer; transition: all 0.2s; font-size: 0.95rem;
                        "
                        onmouseover="this.style.background = '${window.currentSettingsTab === 'accounts_config' ? 'var(--color-primary-glow)' : 'rgba(255,255,255,0.05)'}'"
                        onmouseout="this.style.background = '${window.currentSettingsTab === 'accounts_config' ? 'var(--color-primary-glow)' : 'transparent'}'"
                    >
                        <span style="display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="sliders" style="width: 18px;"></i> Accounts Configuration
                        </span>
                        ${!window.isAccountsConfigUnlocked() 
                            ? '<i data-lucide="lock" style="width: 14px; height: 14px; color: #f59e0b;" title="Authentication Challenge Required"></i>' 
                            : '<i data-lucide="unlock" style="width: 14px; height: 14px; color: #22c55e;" title="Session Active"></i>'}
                    </button>
                ` : ''}
                ${renderTabNav('employees', 'Employees & Roles', 'user-check')}
                ${renderTabNav('roles', 'Employee Role', 'shield-check')}
                ${renderTabNav('appearance', 'Theme & Appearance', 'palette')}
                ${renderTabNav('general', 'General / Company', 'building')}
                ${renderTabNav('leo_voice', 'Leo Voice & AI', 'mic')}
                ${renderTabNav('materials', 'Material Catalog', 'box')}
                ${renderTabNav('rates', 'Calculation Rules', 'percent')}
                ${renderTabNav('quotation', 'Quotations & Sales', 'file-text')}
                ${renderTabNav('hr', 'HR & Payroll', 'users')}
                ${renderTabNav('users', 'System & Backup', 'database')}
            </div>

            <!-- Content -->
            <div style="flex: 1; overflow-y: auto; padding: 2rem;">
                <div style="max-width: ${window.currentSettingsTab === 'accounts_config' || window.currentSettingsTab === 'roles' ? '1250px' : '900px'}; margin: 0 auto; width: 100%;">
                    ${tabs[window.currentSettingsTab]}
                </div>
            </div>
        </div>
    `;

    return container;
}

// --- GLOBAL HELPERS for SETTINGS ---
window.switchSettingsTab = (tabId) => {
    window.currentSettingsTab = tabId;
    if (tabId === 'accounts_config' && !window.isAccountsConfigUnlocked()) {
        setTimeout(() => {
            if (typeof window.openAccountsConfigUnlockModal === 'function') {
                window.openAccountsConfigUnlockModal();
            }
        }, 50);
    }
    const store = window.Store || Store;
    if (store) store.notify();
};

window.saveUserProfileSettings = () => {
    const store = window.Store || Store;
    const name = document.getElementById('prof-user-name')?.value.trim();
    const phone = document.getElementById('prof-user-phone')?.value.trim();
    const location = document.getElementById('prof-user-location')?.value.trim();
    const pincode = document.getElementById('prof-user-pincode')?.value.trim();
    const email = document.getElementById('prof-user-email')?.value.trim();

    if (!name) return alert('Please enter Current User Name');
    if (!phone) return alert('Please enter Phone Number');

    store.updateUserProfile({ name, phone, location, pincode, email });
    alert('User Profile updated successfully!');
};

window.saveGeneralCompanySettings = () => {
    const store = window.Store || Store;
    if (!store.state.settings) store.state.settings = {};
    if (!store.state.settings.company) store.state.settings.company = {};
    if (!store.state.settings.preferences) store.state.settings.preferences = {};

    const name = document.getElementById('set-comp-name')?.value.trim();
    const phone = document.getElementById('set-comp-phone')?.value.trim();
    const email = document.getElementById('set-comp-email')?.value.trim();
    const address = document.getElementById('set-comp-address')?.value.trim();
    const taxId = document.getElementById('set-comp-tax')?.value.trim();
    const unit = document.getElementById('set-pref-unit')?.value;
    const currency = document.getElementById('set-pref-currency')?.value.trim();

    if (name) store.state.settings.company.name = name;
    if (phone) store.state.settings.company.phone = phone;
    if (email) store.state.settings.company.email = email;
    if (address) store.state.settings.company.address = address;
    if (taxId) {
        store.state.settings.company.taxId = taxId;
        store.state.settings.company.pan = taxId;
    }
    if (unit) store.state.settings.preferences.unit = unit;
    if (currency) store.state.settings.preferences.currency = currency;

    if (store.saveState) store.saveState();
    if (window.showStudioToast) {
        window.showStudioToast('✓ General company settings saved successfully!');
    } else {
        alert('Company settings saved successfully!');
    }
};

window.toggleStaffWhatsAppSharing = (isChecked) => {
    const store = window.Store || Store;
    if (!store.state.settings) store.state.settings = {};
    if (!store.state.settings.whatsapp) store.state.settings.whatsapp = {};
    store.state.settings.whatsapp.allowStaffSharing = isChecked;
    if (store.saveState) store.saveState();
    if (window.showStudioToast) {
        window.showStudioToast(isChecked ? 'Staff WhatsApp sharing enabled.' : 'Staff WhatsApp sharing disabled.');
    }
};

window.setSettingsMatFilter = (filterId) => {
    window.settingsMatFilter = filterId;
    const store = window.Store || Store;
    if (store) store.notify();
};

window.updateMaterialCatalogItem = (id, field, value) => {
    const store = window.Store || Store;
    store.updateMaterial(id, field, value);
};

window.deleteMaterialCatalogItem = (id) => {
    if (confirm('Are you sure you want to delete this material from the catalog?')) {
        const store = window.Store || Store;
        store.deleteMaterial(id);
    }
};

window.addSettingsTermRow = () => {
    const container = document.getElementById('settings-quote-terms-container');
    if (!container) return;
    const count = container.querySelectorAll('.settings-term-row').length + 1;
    const row = document.createElement('div');
    row.className = 'settings-term-row';
    row.style.cssText = 'display: flex; align-items: center; gap: 0.65rem;';
    row.innerHTML = `
        <span style="width: 26px; height: 26px; border-radius: 6px; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 700; color: #94a3b8; flex-shrink: 0;">${count}</span>
        <input type="text" class="glass-input settings-quote-term-input" value="" style="flex: 1;" placeholder="Enter term or condition bullet point...">
        <button type="button" onclick="this.parentElement.remove(); window.renumberSettingsTerms();" style="width: 34px; height: 34px; border-radius: 6px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;" title="Delete row">
            ✕
        </button>
    `;
    container.appendChild(row);
    const input = row.querySelector('input');
    if (input) input.focus();
};

window.renumberSettingsTerms = () => {
    const container = document.getElementById('settings-quote-terms-container');
    if (!container) return;
    container.querySelectorAll('.settings-term-row').forEach((r, idx) => {
        const badge = r.querySelector('span');
        if (badge) badge.textContent = idx + 1;
    });
};

window.updateQuoteNumberPreview = () => {
    const prefix = document.getElementById('set-quote-prefix')?.value !== undefined ? document.getElementById('set-quote-prefix').value : 'QT-';
    const seq = parseInt(document.getElementById('set-quote-sequence')?.value) || 1001;
    const format = document.getElementById('set-quote-format')?.value || '{PREFIX}{YYYY}-{SEQ}';
    const padding = parseInt(document.getElementById('set-quote-padding')?.value) || 4;

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const yy = yyyy.slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const seqStr = String(seq).padStart(padding, '0');

    const preview = format
        .replace('{PREFIX}', prefix)
        .replace('{YYYY}', yyyy)
        .replace('{YY}', yy)
        .replace('{MM}', mm)
        .replace('{SEQ}', seqStr);

    const el = document.getElementById('quote-numbering-preview');
    if (el) el.textContent = preview;
};

// Unified Material Modal Handlers are defined in calculation.js
if (!window.addNewMaterial) window.addNewMaterial = window.openAddMaterialModal;
window.updateMaterial = (key, field, val) => {
    const store = window.Store || Store;
    store.updateMaterial(key, field, val);
};

window.saveSettings = () => {
    const store = window.Store || Store;
    const existing = store.state.settings || {};

    const newSettings = {
        ...existing,
        // We only update what is present in DOM to avoid overwriting hidden tabs with null (if we strictly read only value)
        // BUT since we re-render, hidden inputs don't exist.
        // STRATEGY: We must MERGE current form values into the specific section of Store.
        // Wait, if an input is not in DOM (hidden tab), document.getElementById will be null.
        // FIX: saveSettings MUST only update the CURRENT tab's data, OR we need the object to be robust.
        // BETTER: We should persist data to Store on Tab Switch? 
        // OR: Simpler: Just handle active tab saving properly.
    };

    // Helper to safely get value
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : null;
    };

    // Update Company (if on General tab)
    if (window.currentSettingsTab === 'general') {
        newSettings.company = {
            ...existing.company,
            name: getVal('set-comp-name') || existing.company?.name,
            address: getVal('set-comp-address') || existing.company?.address,
            phone: getVal('set-comp-phone') || existing.company?.phone,
            email: getVal('set-comp-email') || existing.company?.email,
            taxId: getVal('set-comp-tax') || existing.company?.taxId
        };
        newSettings.preferences = {
            ...existing.preferences,
            currency: getVal('set-pref-currency') || existing.preferences?.currency,
            unit: getVal('set-pref-unit') || existing.preferences?.unit || 'cm'
        };
    }

    // Update Quotations (if on Quote tab)
    if (window.currentSettingsTab === 'quotation') {
        const termsInputs = Array.from(document.querySelectorAll('.settings-quote-term-input'));
        const termsRows = termsInputs.length > 0
            ? termsInputs.map(i => i.value.trim()).filter(Boolean)
            : existing.quotationDefaults?.termsRows;

        newSettings.quotationDefaults = {
            ...existing.quotationDefaults,
            prefix: getVal('set-quote-prefix') || existing.quotationDefaults?.prefix || 'QT-',
            nextSequence: parseInt(getVal('set-quote-sequence')) || existing.quotationDefaults?.nextSequence || 1001,
            numberFormat: getVal('set-quote-format') || existing.quotationDefaults?.numberFormat || '{PREFIX}{YYYY}-{SEQ}',
            paddingDigits: parseInt(getVal('set-quote-padding')) || existing.quotationDefaults?.paddingDigits || 4,
            validity: getVal('set-quote-validity') || existing.quotationDefaults?.validity,
            paymentTerms: getVal('set-quote-terms') || existing.quotationDefaults?.paymentTerms,
            footerText: getVal('set-quote-footer') || existing.quotationDefaults?.footerText,
            defaultDescription: getVal('set-quote-desc') || existing.quotationDefaults?.defaultDescription,
            termsRows: termsRows
        };
        const themeOption = document.querySelector('input[name="quote-theme"]:checked');
        if (themeOption) newSettings.quotationTheme = themeOption.value;
    }

    // Update HR (if on HR tab)
    if (window.currentSettingsTab === 'hr') {
        newSettings.hrDefaults = {
            ...existing.hrDefaults,
            workDays: getVal('set-hr-days') || existing.hrDefaults?.workDays,
            workHours: getVal('set-hr-hours') || existing.hrDefaults?.workHours
        };
    }

    // Update Rates (if on Rates tab)
    if (window.currentSettingsTab === 'rates') {
        if (!store.state.calcSettings) store.state.calcSettings = {};
        store.state.calcSettings.partition_extra = {
             name: 'Partition Charge',
             unit: 'nos',
             rate: parseInt(getVal('set-rate-partition')) || 350
        };
    }

    // Update Leo Voice (if on Leo Voice tab)
    if (window.currentSettingsTab === 'leo_voice') {
        const selectedVoice = document.querySelector('input[name="leo-voice-model"]:checked');
        const langVal = getVal('set-leo-lang');
        const rateVal = parseFloat(getVal('set-leo-rate')) || 1.0;
        const pitchVal = parseFloat(getVal('set-leo-pitch')) || 1.0;
        const autoSpeakEl = document.getElementById('set-leo-autospeak');
        const autoSpeakVal = autoSpeakEl ? autoSpeakEl.checked : true;

        store.updateLeoVoiceSettings({
            activeVoiceId: selectedVoice ? selectedVoice.value : (store.state.leoVoiceSettings?.activeVoiceId || 'malavika-expressive'),
            language: langVal || (store.state.leoVoiceSettings?.language || 'en-IN'),
            speechRate: rateVal,
            speechPitch: pitchVal,
            autoSpeak: autoSpeakVal
        });
    }

    store.state.settings = newSettings;
    store.notify();

    // Feedback
    const btn = document.querySelector('button[onclick="window.saveSettings()"]');
    if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check"></i> Saved`;
        setTimeout(() => { btn.innerHTML = original; if (window.lucide) window.lucide.createIcons(); }, 1500);
    }
};

window.selectLeoVoice = (voiceId) => {
    const store = window.Store || Store;
    store.updateLeoVoiceSettings({ activeVoiceId: voiceId });
    document.querySelectorAll('.leo-voice-card').forEach(c => c.classList.remove('active'));
    const targetCard = document.getElementById(`card-voice-${voiceId.split('-')[0]}`);
    if (targetCard) targetCard.classList.add('active');
    const radio = document.querySelector(`input[name="leo-voice-model"][value="${voiceId}"]`);
    if (radio) radio.checked = true;
    const label = document.getElementById('current-active-voice-label');
    if (label) {
        label.innerText = voiceId.includes('malavika') ? 'Malavika (Female)' : voiceId.includes('ananya') ? 'Ananya (Female)' : voiceId.includes('rahul') ? 'Rahul (Male)' : 'Madhavan (Male)';
    }
    if (window.LeoVoice && window.LeoVoice.previewVoice) {
        const lang = document.getElementById('set-leo-lang')?.value || store.state.leoVoiceSettings?.language || 'ml-IN';
        window.LeoVoice.previewVoice(voiceId, lang);
    }
};

window.previewLeoVoice = (voiceId) => {
    const store = window.Store || Store;
    const lang = document.getElementById('set-leo-lang')?.value || store.state.leoVoiceSettings?.language || 'ml-IN';
    if (window.LeoVoice && window.LeoVoice.previewVoice) {
        window.LeoVoice.previewVoice(voiceId, lang);
    }
};

window.previewActiveLeoVoice = () => {
    const store = window.Store || Store;
    const activeVoiceId = store.state.leoVoiceSettings?.activeVoiceId || 'malavika-expressive';
    const lang = document.getElementById('set-leo-lang')?.value || store.state.leoVoiceSettings?.language || 'ml-IN';
    if (window.LeoVoice && window.LeoVoice.previewVoice) {
        window.LeoVoice.previewVoice(activeVoiceId, lang);
    }
};

window.handleSettingsLanguageChange = (lang) => {
    const store = window.Store || Store;
    store.updateLeoVoiceSettings({ language: lang });
};

window.saveLeoVoiceSettings = () => {
    const store = window.Store || Store;
    const selectedVoice = document.querySelector('input[name="leo-voice-model"]:checked');
    const lang = document.getElementById('set-leo-lang')?.value;
    const rate = parseFloat(document.getElementById('set-leo-rate')?.value) || 1.0;
    const pitch = parseFloat(document.getElementById('set-leo-pitch')?.value) || 1.0;
    const autoSpeak = document.getElementById('set-leo-autospeak')?.checked;

    store.updateLeoVoiceSettings({
        activeVoiceId: selectedVoice ? selectedVoice.value : 'malavika-expressive',
        language: lang || (store.state.leoVoiceSettings?.language || 'en-IN'),
        speechRate: rate,
        speechPitch: pitch,
        autoSpeak: autoSpeak !== false
    });
    alert('Leo Voice Configuration saved successfully!');
};

window.backupDatabase = () => {
    const store = window.Store || Store;
    if (!store || !store.state) return alert('No database state found.');

    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.state, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "WINPRO_Database_Backup_" + new Date().toISOString().split('T')[0] + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert('Database backup downloaded successfully.');
    } catch (e) {
        console.error(e);
        alert('Failed to backup database.');
    }
};

window.resetAllData = () => {
    localStorage.removeItem('glErpState');
    localStorage.removeItem('gl_erp_state');
    location.reload();
};


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

window.openLegacyEmployeeModal = () => {
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

// =============================================================================
// ACCOUNTS CONFIGURATION & ADMIN MASTER CONTROL MODULE (14 ERP MODULES)
// =============================================================================

function renderAccountsAccessRestrictedHTML(activeUser) {
    return `
        <div class="glass-panel animate-fade-in" style="padding: 3.5rem 2rem; text-align: center; max-width: 650px; margin: 3rem auto; border: 1.5px solid rgba(239, 68, 68, 0.4); border-radius: var(--radius-lg); box-shadow: 0 15px 45px rgba(0,0,0,0.6);">
            <div style="width: 68px; height: 68px; border-radius: 50%; background: rgba(239, 68, 68, 0.16); border: 2px solid rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; color: #ef4444; margin: 0 auto 1.35rem; box-shadow: 0 0 25px rgba(239, 68, 68, 0.35);">
                <i data-lucide="shield-alert" style="width: 36px; height: 36px;"></i>
            </div>
            <h2 style="color: #f8fafc; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Access Restricted: Super Admin Only</h2>
            <p style="color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.75rem;">
                The <strong>Accounts Configuration & Admin Master Control</strong> module manages architectural parameters, calculation formulas, sequence prefixes, and factory reset baselines for all 14 ERP modules.
                <br><br>
                Current user profile <strong style="color: #38bdf8;">${activeUser.name || 'Staff User'}</strong> (<span style="color: #cbd5e1;">${activeUser.role || 'Employee'}</span>) is restricted from modifying master ERP settings.
            </p>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.75rem; font-size: 0.82rem; color: #cbd5e1;">
                Security Policy: Only users with the <strong>Super Administrator</strong> master key (#SB-9901) can alter global account configurations.
            </div>
            <div style="display: flex; justify-content: center; gap: 1rem;">
                <button type="button" class="btn btn-primary" onclick="window.switchActiveUser('admin')" style="padding: 0.65rem 1.5rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
                    <i data-lucide="shield-check" style="width: 17px; height: 17px;"></i> Switch to Super Admin
                </button>
                <button type="button" class="btn btn-secondary" onclick="window.switchSettingsTab('profile')" style="padding: 0.65rem 1.25rem;">
                    My Profile
                </button>
            </div>
        </div>
    `;
}

function renderAccountsConfigLockedGate(activeUser) {
    const defaultAdminId = activeUser.id || 'SB-9901';
    const defaultAdminName = activeUser.name || 'Shamsudheen V.K.';

    return `
        <div class="glass-panel animate-fade-in" style="max-width: 680px; margin: 3rem auto; padding: 3rem 2.5rem; text-align: center; border: 1.5px solid rgba(245, 158, 11, 0.45); border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.7);">
            
            <div class="security-lock-glow" style="width: 80px; height: 80px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); border: 2.5px solid #f59e0b; display: flex; align-items: center; justify-content: center; color: #f59e0b; margin: 0 auto 1.5rem;">
                <i data-lucide="lock" style="width: 42px; height: 42px;"></i>
            </div>

            <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 9999px; padding: 4px 14px; margin-bottom: 1rem; font-size: 0.74rem; font-weight: 800; letter-spacing: 0.5px; color: #fbbf24;">
                <i data-lucide="shield-alert" style="width: 13px; height: 13px;"></i> HIGH-PRIVILEGE ARCHITECTURAL ZONE • ACCESS LOCKED
            </div>

            <h2 style="color: #f8fafc; font-size: 1.65rem; font-weight: 700; margin: 0 0 0.85rem; letter-spacing: -0.3px;">
                Accounts Configuration Master Gate
            </h2>

            <p style="color: #94a3b8; font-size: 0.92rem; line-height: 1.65; margin: 0 auto 1.75rem; max-width: 540px;">
                The Accounts Configuration module controls architectural calculation formulas, numbering sequences, field validation, and factory reset baselines for all 14 ERP modules.
                <br><br>
                To prevent accidental changes or session hijacking, <strong>Super Administrator password re-authentication</strong> is strictly required before loading configuration controls.
            </p>

            <!-- Admin Identity Badge -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; text-align: left; gap: 1rem; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid #38bdf8; overflow: hidden; background: #0f172a;">
                        <img src="${activeUser.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div>
                        <div style="font-weight: 700; color: #f8fafc; font-size: 0.95rem;">${defaultAdminName}</div>
                        <div style="font-size: 0.76rem; color: #38bdf8; font-family: monospace; font-weight: 600;">ID: #${defaultAdminId} • Super Administrator</div>
                    </div>
                </div>
                <div style="font-size: 0.72rem; color: #94a3b8; background: rgba(0,0,0,0.4); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                    Challenge-Response Gateway
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                <button type="button" class="btn btn-primary" onclick="window.openAccountsConfigUnlockModal()" id="btnPromptUnlockAccountsConfig" style="padding: 0.75rem 1.85rem; font-size: 0.95rem; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 0 25px var(--color-primary-glow);">
                    <i data-lucide="key-round" style="width: 18px; height: 18px;"></i> Enter Password to Unlock
                </button>
                <button type="button" class="btn btn-secondary" onclick="window.switchSettingsTab('profile')" style="padding: 0.75rem 1.35rem; font-size: 0.92rem;">
                    Cancel & Return to Profile
                </button>
            </div>

        </div>
    `;
}

function getModuleKeySpecs(mod) {
    const specs = [];
    const g = mod.general || {};
    const f = mod.fieldRules || {};
    const p = mod.permissions || {};

    // 1. Dynamic Prefix detection (quotePrefix, codePrefix, leadPrefix, etc.)
    const prefixKey = Object.keys(g).find(k => k.toLowerCase().includes('prefix'));
    if (prefixKey && g[prefixKey]) specs.push({ label: 'Prefix', val: g[prefixKey] });

    // 2. Dynamic Sequence start detection
    const seqKey = Object.keys(g).find(k => k.toLowerCase().includes('sequence'));
    if (seqKey && g[seqKey]) specs.push({ label: 'Sequence Start', val: '#' + g[seqKey] });

    // 3. Dynamic Tax Rate detection
    const taxKey = Object.keys(g).find(k => k.toLowerCase().includes('taxrate')) || Object.keys(f).find(k => k.toLowerCase().includes('taxrate'));
    if (taxKey && (g[taxKey] !== undefined || f[taxKey] !== undefined)) {
        specs.push({ label: 'Tax Rate (GST)', val: (g[taxKey] !== undefined ? g[taxKey] : f[taxKey]) + '%' });
    }

    // 4. Validity / Duration
    const valKey = Object.keys(g).find(k => k.toLowerCase().includes('validity') || k.toLowerCase().includes('duration'));
    if (valKey && g[valKey]) specs.push({ label: 'Validity Period', val: g[valKey] + (typeof g[valKey] === 'number' ? ' Days' : '') });

    if (g.autoRefreshSeconds) specs.push({ label: 'Auto Refresh', val: g.autoRefreshSeconds + 's' });
    if (g.defaultPaymentTerms) specs.push({ label: 'Payment Terms', val: g.defaultPaymentTerms });
    if (g.defaultCreditLimit) specs.push({ label: 'Credit Limit', val: '₹' + Number(g.defaultCreditLimit).toLocaleString('en-IN') });
    if (f.defaultMeasurementUnit) specs.push({ label: 'Default UoM', val: f.defaultMeasurementUnit });
    if (f.defaultWastageMarginPct !== undefined) specs.push({ label: 'Wastage Margin', val: f.defaultWastageMarginPct + '%' });
    if (f.minGrossMarginPct !== undefined) specs.push({ label: 'Min Profit Margin', val: f.minGrossMarginPct + '%' });
    if (g.discountCeilingPercent !== undefined) specs.push({ label: 'Max Discount', val: g.discountCeilingPercent + '%' });
    if (g.minimumLeadScore) specs.push({ label: 'Min Lead Score', val: g.minimumLeadScore + ' pts' });
    if (g.warrantyDaysDefault) specs.push({ label: 'Warranty Period', val: g.warrantyDaysDefault + ' Days' });
    if (g.paymentGraceDays) specs.push({ label: 'Grace Period', val: g.paymentGraceDays + ' Days' });
    if (f.requireApprovalOverAmount) specs.push({ label: 'PO Approval Req', val: '> ₹' + Number(f.requireApprovalOverAmount).toLocaleString('en-IN') });
    if (f.stockAlertThreshold) specs.push({ label: 'Low Stock Alert', val: '< ' + f.stockAlertThreshold + ' units' });
    if (g.standardWorkDays) specs.push({ label: 'Work Days/Mo', val: g.standardWorkDays + ' Days' });
    if (g.defaultWorkHours) specs.push({ label: 'Shift Hours', val: g.defaultWorkHours + 'h / day' });
    if (f.fiscalYearStart) specs.push({ label: 'Fiscal Year', val: f.fiscalYearStart });
    if (p.minRoleRequired) specs.push({ label: 'Min Role Required', val: p.minRoleRequired });

    if (specs.length < 3) {
        specs.push({ label: 'Security Level', val: p.minRoleRequired ? (p.minRoleRequired + '+') : 'Admin Only' });
        specs.push({ label: 'Status Baseline', val: mod.status || 'Default' });
    }

    return specs.slice(0, 4);
}

function renderAccountsConfigTabHTML(state) {
    const store = window.Store || Store;
    const configs = (typeof store.getAccountsConfigurations === 'function')
        ? store.getAccountsConfigurations()
        : (store.state.accountsConfigurations || {});
    const auditLogs = (typeof store.getAuditLogs === 'function')
        ? store.getAuditLogs()
        : (store.state.configurationAuditLogs || []);

    const configList = Object.values(configs);
    const totalModules = configList.length;
    const defaultCount = configList.filter(c => c.status === 'Default').length;
    const customCount = configList.filter(c => c.status === 'Customized').length;
    const auditCount = auditLogs.length;

    if (!window.accountsConfigCategoryFilter) window.accountsConfigCategoryFilter = 'all';
    if (!window.accountsConfigStatusFilter) window.accountsConfigStatusFilter = 'all';

    const categoryBadges = {
        'Core': 'background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35);',
        'Commercial': 'background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35);',
        'Operations': 'background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);',
        'Financial': 'background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.35);',
        'HR': 'background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.35);'
    };

    return `
        <div class="accounts-config-container">
            
            <!-- Executive Header Banner -->
            <div class="accounts-config-header">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.25rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                            <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--brand-gradient); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 0 20px var(--color-primary-glow);">
                                <i data-lucide="sliders" style="width: 24px; height: 24px;"></i>
                            </div>
                            <div>
                                <h1 style="margin: 0; font-size: 1.55rem; color: #f8fafc; font-weight: 700; letter-spacing: -0.3px;">
                                    Accounts Configuration & Admin Master Control
                                </h1>
                                <p style="margin: 3px 0 0; color: #94a3b8; font-size: 0.88rem;">
                                    Configure parameters, numbering sequences, field validation, and calculation formulas for all 14 ERP modules.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                        <button type="button" class="btn btn-secondary" onclick="window.openAuditLogsModal()" style="display: inline-flex; align-items: center; gap: 7px; padding: 0.55rem 1.15rem; font-size: 0.86rem; font-weight: 600;">
                            <i data-lucide="history" style="width: 16px; height: 16px; color: #38bdf8;"></i>
                            <span>Audit Trail (${auditCount})</span>
                        </button>
                        <button type="button" class="btn" onclick="window.openGlobalResetModal()" style="background: rgba(239, 68, 68, 0.15); border: 1.5px solid rgba(239, 68, 68, 0.5); color: #f87171; display: inline-flex; align-items: center; gap: 7px; padding: 0.55rem 1.25rem; font-size: 0.86rem; font-weight: 700; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.28)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.15)'">
                            <i data-lucide="shield-alert" style="width: 17px; height: 17px; color: #ef4444;"></i>
                            <span>Reset All Configuration</span>
                        </button>
                    </div>
                </div>

                <!-- 4 Metrics Overview Bar -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-top: 1.5rem; border-top: 1px solid var(--glass-border); padding-top: 1.25rem;">
                    <div class="accounts-stat-card">
                        <div style="width: 38px; height: 38px; border-radius: 9px; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                            <i data-lucide="grid" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Total Scope</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #f8fafc;">${totalModules} Modules</div>
                        </div>
                    </div>

                    <div class="accounts-stat-card">
                        <div style="width: 38px; height: 38px; border-radius: 9px; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                            <i data-lucide="check-circle" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Factory Baseline</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #38bdf8;">${defaultCount} Defaults</div>
                        </div>
                    </div>

                    <div class="accounts-stat-card">
                        <div style="width: 38px; height: 38px; border-radius: 9px; background: rgba(168, 85, 247, 0.15); display: flex; align-items: center; justify-content: center; color: #c084fc;">
                            <i data-lucide="edit-3" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Customized</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #c084fc;">${customCount} Modules</div>
                        </div>
                    </div>

                    <div class="accounts-stat-card">
                        <div style="width: 38px; height: 38px; border-radius: 9px; background: rgba(34, 197, 94, 0.15); display: flex; align-items: center; justify-content: center; color: #4ade80;">
                            <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Audit Trail</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #4ade80;">${auditCount} Events</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filter & Search Controls Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; background: var(--color-bg-card); padding: 0.85rem 1.15rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                <!-- Live Search -->
                <div style="position: relative; min-width: 280px; flex: 1;">
                    <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--color-text-muted);"></i>
                    <input type="text" id="accountsConfigSearchInput" placeholder="Filter by module, prefix, sequence, or rule..." 
                           oninput="window.filterAccountsConfigCards()" 
                           class="glass-input" 
                           style="width: 100%; padding-left: 38px; font-size: 0.88rem;">
                </div>

                <!-- Category Filters -->
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center;">
                    ${['all', 'Core', 'Commercial', 'Operations', 'Financial', 'HR'].map(cat => {
                        const isCatActive = window.accountsConfigCategoryFilter === cat;
                        return `
                            <button type="button" onclick="window.setAccountsConfigCategoryFilter('${cat}')"
                                    id="btn-cat-filter-${cat.toLowerCase()}"
                                    style="border: none; border-radius: 6px; padding: 5px 12px; font-size: 0.78rem; font-weight: ${isCatActive ? '700' : '500'}; cursor: pointer; transition: all 0.2s; background: ${isCatActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'}; color: ${isCatActive ? 'white' : 'var(--color-text-muted)'};">
                                ${cat === 'all' ? 'All (14)' : cat}
                            </button>
                        `;
                    }).join('')}
                </div>

                <!-- Status Filter Pill -->
                <div style="display: flex; gap: 0.4rem; align-items: center; border-left: 1px solid var(--glass-border); padding-left: 0.75rem;">
                    <select id="accountsConfigStatusFilterSelect" onchange="window.setAccountsConfigStatusFilter(this.value)" class="glass-input" style="padding: 4px 8px; font-size: 0.78rem;">
                        <option value="all" ${window.accountsConfigStatusFilter === 'all' ? 'selected' : ''}>Status: All</option>
                        <option value="Default" ${window.accountsConfigStatusFilter === 'Default' ? 'selected' : ''}>Default Only</option>
                        <option value="Customized" ${window.accountsConfigStatusFilter === 'Customized' ? 'selected' : ''}>Customized Only</option>
                    </select>
                </div>
            </div>

            <!-- 14 ERP Modules Card Grid -->
            <div class="accounts-config-grid" id="accountsConfigCardsGrid">
                ${configList.map(mod => {
                    const statusClass = (mod.status === 'Customized') ? 'is-customized' : 'is-default';
                    const catStyle = categoryBadges[mod.category] || categoryBadges['Core'];
                    const specs = getModuleKeySpecs(mod);
                    const formattedDate = mod.lastModified ? new Date(mod.lastModified).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

                    return `
                        <div class="accounts-config-card ${statusClass}" 
                             id="card-mod-${mod.id}"
                             data-module-id="${mod.id}"
                             data-category="${mod.category}"
                             data-status="${mod.status}"
                             data-search="${(mod.name + ' ' + mod.id + ' ' + mod.category + ' ' + (mod.general?.codePrefix || '') + ' ' + mod.description).toLowerCase()}">
                            
                            <div>
                                <!-- Card Top Row: Icon, Name & Status Pill -->
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.65rem;">
                                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                                        <div style="width: 38px; height: 38px; border-radius: 9px; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; color: var(--color-primary); flex-shrink: 0;">
                                            <i data-lucide="${mod.icon || 'settings'}" style="width: 20px; height: 20px;"></i>
                                        </div>
                                        <div>
                                            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #f8fafc; line-height: 1.25;">
                                                ${mod.name}
                                            </h3>
                                            <span style="font-size: 0.68rem; font-weight: 600; padding: 1px 7px; border-radius: 4px; margin-top: 3px; display: inline-block; ${catStyle}">
                                                ${mod.category}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Status Pill Indicator -->
                                    <span class="status-pill-badge ${mod.status === 'Customized' ? 'status-pill-customized' : 'status-pill-default'}">
                                        <span style="width: 6px; height: 6px; border-radius: 50%; background: ${mod.status === 'Customized' ? '#c084fc' : '#38bdf8'};"></span>
                                        ${mod.status}
                                    </span>
                                </div>

                                <!-- Description -->
                                <p style="margin: 0 0 0.85rem; font-size: 0.8rem; color: var(--color-text-muted); line-height: 1.45; min-height: 2.3em;">
                                    ${mod.description}
                                </p>

                                <!-- Configured Parameter Specs Box -->
                                <div class="param-specs-box">
                                    ${specs.map(s => `
                                        <div class="param-spec-row">
                                            <span class="param-spec-label">${s.label}:</span>
                                            <span class="param-spec-val">${s.val}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Card Bottom: Last Modified & Actions -->
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: #64748b; margin-bottom: 0.85rem; padding-top: 0.45rem; border-top: 1px solid rgba(255,255,255,0.06);">
                                    <span>
                                        ${formattedDate ? `Modified: ${formattedDate}` : 'Baseline Preset'}
                                    </span>
                                    <span style="font-family: monospace; color: #94a3b8;">#${mod.id}</span>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.65rem;">
                                    <button type="button" class="btn btn-primary" onclick="window.openModuleConfigModal('${mod.id}')" style="padding: 0.5rem 0.85rem; font-size: 0.82rem; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                                        <i data-lucide="sliders" style="width: 14px; height: 14px;"></i> Configure
                                    </button>
                                    <button type="button" class="btn btn-secondary" onclick="window.promptResetModule('${mod.id}')" title="Reset to Baseline Factory Defaults" style="padding: 0.5rem 0.75rem; font-size: 0.82rem; color: #94a3b8; display: inline-flex; align-items: center; justify-content: center;" onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='#94a3b8'">
                                        <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i>
                                    </button>
                                </div>
                            </div>

                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Empty Search State -->
            <div id="accountsConfigEmptyState" style="display: none; padding: 3rem 1.5rem; text-align: center; color: var(--color-text-muted);">
                <i data-lucide="search-x" style="width: 44px; height: 44px; margin-bottom: 0.75rem; opacity: 0.5;"></i>
                <h4 style="margin: 0 0 0.4rem; color: #f8fafc; font-size: 1.1rem;">No matching ERP modules found</h4>
                <p style="margin: 0; font-size: 0.85rem;">Try modifying your keyword search or category filter above.</p>
            </div>

        </div>
    `;
}

// Filter cards in real-time
window.filterAccountsConfigCards = () => {
    const query = (document.getElementById('accountsConfigSearchInput')?.value || '').toLowerCase().trim();
    const cat = window.accountsConfigCategoryFilter || 'all';
    const status = window.accountsConfigStatusFilter || 'all';
    const cards = document.querySelectorAll('.accounts-config-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const cardSearch = card.getAttribute('data-search') || '';
        const cardCat = card.getAttribute('data-category') || '';
        const cardStatus = card.getAttribute('data-status') || '';

        const matchesQuery = !query || cardSearch.includes(query);
        const matchesCat = (cat === 'all') || (cardCat === cat);
        const matchesStatus = (status === 'all') || (cardStatus === status);

        if (matchesQuery && matchesCat && matchesStatus) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const empty = document.getElementById('accountsConfigEmptyState');
    if (empty) empty.style.display = (visibleCount === 0) ? 'block' : 'none';
};

window.setAccountsConfigCategoryFilter = (cat) => {
    window.accountsConfigCategoryFilter = cat;
    ['all', 'core', 'commercial', 'operations', 'financial', 'hr'].forEach(c => {
        const btn = document.getElementById(`btn-cat-filter-${c}`);
        if (btn) {
            const isActive = (c === cat.toLowerCase());
            btn.style.background = isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)';
            btn.style.color = isActive ? 'white' : 'var(--color-text-muted)';
            btn.style.fontWeight = isActive ? '700' : '500';
        }
    });
    window.filterAccountsConfigCards();
};

window.setAccountsConfigStatusFilter = (status) => {
    window.accountsConfigStatusFilter = status;
    window.filterAccountsConfigCards();
};

// =============================================================================
// DEDICATED MODULE CONFIGURATION / EDIT MODAL
// =============================================================================

window.openModuleConfigModal = (moduleId) => {
    window.closeModuleConfigModal();

    const store = window.Store || Store;
    const mod = store.getModuleConfig(moduleId);
    if (!mod) return alert('Configuration for module not found: ' + moduleId);

    const general = mod.general || {};
    const fieldRules = mod.fieldRules || {};
    const permissions = mod.permissions || {};

    // Helper to format key names nicely
    const formatLabel = (key) => {
        return key.replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .replace(/Pct/g, '(%)')
                  .replace(/G S T I N/g, 'GSTIN')
                  .replace(/P O/g, 'PO')
                  .replace(/Q C/g, 'QC');
    };

    const modal = document.createElement('div');
    modal.id = 'moduleConfigModal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center; z-index: 100050; padding: 1.5rem;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 720px; max-width: 96vw; max-height: 90vh; display: flex; flex-direction: column; background: #0b0f19; border: 1.5px solid var(--color-primary-border); border-radius: var(--radius-lg); box-shadow: 0 25px 70px rgba(0,0,0,0.85); overflow: hidden;">
            
            <!-- Modal Header -->
            <div style="padding: 1.25rem 1.75rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                        <i data-lucide="${mod.icon || 'settings'}" style="width: 22px; height: 22px;"></i>
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #f8fafc;">
                                ${mod.name}
                            </h3>
                            <span class="status-pill-badge ${mod.status === 'Customized' ? 'status-pill-customized' : 'status-pill-default'}">
                                ${mod.status}
                            </span>
                        </div>
                        <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">
                            ${mod.description}
                        </p>
                    </div>
                </div>
                <button type="button" onclick="window.closeModuleConfigModal()" style="background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 6px;">
                    <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                </button>
            </div>

            <!-- Modal Form Body (Scrollable) -->
            <form id="moduleConfigForm" onsubmit="window.saveModuleConfig(event, '${mod.id}')" style="flex: 1; overflow-y: auto; padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.5rem;">
                
                <!-- Inline Validation Error Banner (hidden by default) -->
                <div id="moduleConfigErrorBanner" style="display: none; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 0.75rem 1rem; color: #f87171; font-size: 0.85rem;">
                </div>

                <!-- SECTION 1: General & Identifiers -->
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.85rem;">
                        <i data-lucide="hash" style="width: 16px; height: 16px; color: #38bdf8;"></i>
                        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;">
                            General & Sequence Rules
                        </h4>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--glass-border);">
                        ${Object.keys(general).map(key => {
                            const val = general[key];
                            const inputType = typeof val === 'number' ? 'number' : 'text';
                            if (typeof val === 'boolean') {
                                return `
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.35rem 0;">
                                        <label style="font-size: 0.82rem; color: #cbd5e1; cursor: pointer;" for="cfg_gen_${key}">
                                            ${formatLabel(key)}
                                        </label>
                                        <label class="config-toggle-switch">
                                            <input type="checkbox" id="cfg_gen_${key}" name="gen_${key}" ${val ? 'checked' : ''}>
                                            <span class="config-toggle-slider"></span>
                                        </label>
                                    </div>
                                `;
                            }
                            return `
                                <div>
                                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.8rem; color: #94a3b8; font-weight: 500;">
                                        ${formatLabel(key)}
                                    </label>
                                    <input type="${inputType}" id="cfg_gen_${key}" name="gen_${key}" value="${val !== undefined && val !== null ? val : ''}" 
                                           class="glass-input" style="width: 100%; font-size: 0.88rem; font-weight: 600;">
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- SECTION 2: Field Rules, Validations & Calculation Defaults -->
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.85rem;">
                        <i data-lucide="check-square" style="width: 16px; height: 16px; color: #4ade80;"></i>
                        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;">
                            Field Rules, Validations & Calculation Rules
                        </h4>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--glass-border);">
                        ${Object.keys(fieldRules).map(key => {
                            const val = fieldRules[key];
                            if (typeof val === 'boolean') {
                                return `
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.35rem 0;">
                                        <label style="font-size: 0.82rem; color: #cbd5e1; cursor: pointer;" for="cfg_fld_${key}">
                                            ${formatLabel(key)}
                                        </label>
                                        <label class="config-toggle-switch">
                                            <input type="checkbox" id="cfg_fld_${key}" name="fld_${key}" ${val ? 'checked' : ''}>
                                            <span class="config-toggle-slider"></span>
                                        </label>
                                    </div>
                                `;
                            }
                            const inputType = typeof val === 'number' ? 'number' : 'text';
                            return `
                                <div>
                                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.8rem; color: #94a3b8; font-weight: 500;">
                                        ${formatLabel(key)}
                                    </label>
                                    <input type="${inputType}" id="cfg_fld_${key}" name="fld_${key}" value="${val !== undefined && val !== null ? val : ''}" 
                                           class="glass-input" style="width: 100%; font-size: 0.88rem; font-weight: 600;">
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- SECTION 3: Role & Permission Settings -->
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.85rem;">
                        <i data-lucide="shield" style="width: 16px; height: 16px; color: #c084fc;"></i>
                        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;">
                            Security & Role-Based Permissions
                        </h4>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--glass-border);">
                        <div>
                            <label style="display: block; margin-bottom: 0.4rem; font-size: 0.8rem; color: #94a3b8; font-weight: 500;">
                                Minimum Security Role Required
                            </label>
                            <select id="cfg_perm_minRoleRequired" name="perm_minRoleRequired" class="glass-input" style="width: 100%; padding: 0.55rem 0.75rem; font-size: 0.88rem; font-weight: 600; background: #0f172a;">
                                <option value="Admin" ${(permissions.minRoleRequired === 'Admin') ? 'selected' : ''}>Admin (Super Administrator)</option>
                                <option value="Manager" ${(permissions.minRoleRequired === 'Manager') ? 'selected' : ''}>Manager (Operational Leadership)</option>
                                <option value="Sales" ${(permissions.minRoleRequired === 'Sales') ? 'selected' : ''}>Sales (Commercial Staff)</option>
                                <option value="Technician" ${(permissions.minRoleRequired === 'Technician') ? 'selected' : ''}>Technician (Site & Survey)</option>
                                <option value="Worker" ${(permissions.minRoleRequired === 'Worker') ? 'selected' : ''}>Worker (Production Staff)</option>
                            </select>
                        </div>

                        ${Object.keys(permissions).filter(k => k !== 'minRoleRequired').map(key => {
                            const val = permissions[key];
                            return `
                                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.35rem 0;">
                                    <label style="font-size: 0.82rem; color: #cbd5e1; cursor: pointer;" for="cfg_perm_${key}">
                                        ${formatLabel(key)}
                                    </label>
                                    <label class="config-toggle-switch">
                                        <input type="checkbox" id="cfg_perm_${key}" name="perm_${key}" ${val ? 'checked' : ''}>
                                        <span class="config-toggle-slider"></span>
                                    </label>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Hidden submit button triggered by footer -->
                <button type="submit" id="hiddenModuleConfigSubmitBtn" style="display: none;"></button>
            </form>

            <!-- Modal Footer -->
            <div style="padding: 1.15rem 1.75rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.25);">
                <button type="button" class="btn" onclick="window.promptResetModule('${mod.id}')" style="background: transparent; border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px; padding: 0.5rem 1rem;">
                    <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i> Reset to Baseline Default
                </button>

                <div style="display: flex; gap: 0.75rem;">
                    <button type="button" class="btn btn-secondary" onclick="window.closeModuleConfigModal()" style="padding: 0.55rem 1.25rem; font-size: 0.85rem;">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" onclick="document.getElementById('hiddenModuleConfigSubmitBtn').click()" style="padding: 0.55rem 1.5rem; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="check" style="width: 15px; height: 15px;"></i> Save Changes
                    </button>
                </div>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.closeModuleConfigModal = () => {
    const el = document.getElementById('moduleConfigModal');
    if (el) el.remove();
};

window.saveModuleConfig = async (e, moduleId) => {
    e.preventDefault();

    const store = window.Store || Store;
    const current = store.getModuleConfig(moduleId);
    if (!current) return;

    const errorBanner = document.getElementById('moduleConfigErrorBanner');
    if (errorBanner) errorBanner.style.display = 'none';

    // Clone base config
    const updated = JSON.parse(JSON.stringify(current));
    const form = document.getElementById('moduleConfigForm');
    if (!form) return;

    // Collect General
    if (updated.general) {
        Object.keys(updated.general).forEach(k => {
            const el = document.getElementById(`cfg_gen_${k}`);
            if (el) {
                if (typeof updated.general[k] === 'boolean') {
                    updated.general[k] = el.checked;
                } else if (typeof updated.general[k] === 'number') {
                    const num = Number(el.value);
                    if (isNaN(num)) throw new Error(`${k} must be a valid number`);
                    updated.general[k] = num;
                } else {
                    updated.general[k] = el.value.trim();
                }
            }
        });
    }

    // Collect Field Rules
    if (updated.fieldRules) {
        Object.keys(updated.fieldRules).forEach(k => {
            const el = document.getElementById(`cfg_fld_${k}`);
            if (el) {
                if (typeof updated.fieldRules[k] === 'boolean') {
                    updated.fieldRules[k] = el.checked;
                } else if (typeof updated.fieldRules[k] === 'number') {
                    const num = Number(el.value);
                    if (isNaN(num)) throw new Error(`${k} must be a valid number`);
                    updated.fieldRules[k] = num;
                } else {
                    updated.fieldRules[k] = el.value.trim();
                }
            }
        });
    }

    // Collect Permissions
    if (updated.permissions) {
        const minRoleEl = document.getElementById('cfg_perm_minRoleRequired');
        if (minRoleEl) updated.permissions.minRoleRequired = minRoleEl.value;

        Object.keys(updated.permissions).forEach(k => {
            if (k === 'minRoleRequired') return;
            const el = document.getElementById(`cfg_perm_${k}`);
            if (el) {
                if (typeof updated.permissions[k] === 'boolean') {
                    updated.permissions[k] = el.checked;
                }
            }
        });
    }

    // --- Inline Validation ---
    try {
        if (updated.general && updated.general.codePrefix !== undefined && !updated.general.codePrefix) {
            throw new Error('Code Prefix cannot be blank.');
        }
        if (updated.general && updated.general.startingSequence !== undefined && updated.general.startingSequence < 1) {
            throw new Error('Starting sequence counter must be greater than or equal to 1.');
        }
        if (updated.fieldRules && updated.fieldRules.minGrossMarginPct !== undefined) {
            if (updated.fieldRules.minGrossMarginPct < 0 || updated.fieldRules.minGrossMarginPct > 100) {
                throw new Error('Minimum gross profit margin must be between 0% and 100%.');
            }
        }
        if (updated.fieldRules && updated.fieldRules.taxRatePct !== undefined) {
            if (updated.fieldRules.taxRatePct < 0 || updated.fieldRules.taxRatePct > 100) {
                throw new Error('Tax rate (GST) must be between 0% and 100%.');
            }
        }
    } catch (err) {
        if (errorBanner) {
            errorBanner.innerText = '⚠️ ' + err.message;
            errorBanner.style.display = 'block';
            errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
    }

    // Dispatch save
    const adminUser = store.getActiveUser();
    const res = await store.updateModuleConfig(moduleId, updated, adminUser.id, adminUser.name);

    window.closeModuleConfigModal();
    window.showAccountsConfigToast(`Settings for ${updated.name} updated successfully!`, 'success');

    // Trigger re-render of settings view
    store.notify();
};

// =============================================================================
// ACCOUNTS CONFIGURATION ACCESS UNLOCK & CREDENTIAL RE-AUTHENTICATION
// =============================================================================

window.openAccountsConfigUnlockModal = () => {
    window.closeAccountsConfigUnlockModal();

    const store = window.Store || Store;
    const activeUser = (store && typeof store.getActiveUser === 'function') ? store.getActiveUser() : { id: 'SB-9901', name: 'Shamsudheen V.K.', email: 'admin@stellobuild.com' };

    const modal = document.createElement('div');
    modal.id = 'accountsConfigUnlockModal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.88); backdrop-filter: blur(14px);
        display: flex; align-items: center; justify-content: center; z-index: 100090; padding: 1.5rem;
    `;

    modal.innerHTML = `
        <div class="auth-challenge-modal" id="accountsConfigUnlockCard" style="width: 480px; max-width: 95vw; padding: 2.25rem;">
            
            <!-- Close button -->
            <button type="button" onclick="window.cancelAccountsConfigUnlock()" style="position: absolute; right: 16px; top: 16px; background: transparent; border: none; color: #94a3b8; cursor: pointer;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>

            <!-- Header Icon & Badge -->
            <div style="text-align: center; margin-bottom: 1.25rem;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); border: 2px solid #38bdf8; display: flex; align-items: center; justify-content: center; color: #38bdf8; margin: 0 auto 0.85rem; box-shadow: 0 0 25px rgba(56, 189, 248, 0.35);">
                    <i data-lucide="shield-check" style="width: 32px; height: 32px;"></i>
                </div>
                <span style="font-size: 0.72rem; letter-spacing: 0.8px; font-weight: 800; text-transform: uppercase; color: #38bdf8; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); padding: 3px 12px; border-radius: 9999px;">
                    SECURITY CHALLENGE
                </span>
                <h2 style="margin: 0.65rem 0 0.3rem; font-size: 1.45rem; color: #f8fafc; font-weight: 700;">
                    Super Admin Verification
                </h2>
                <p style="margin: 0; color: #94a3b8; font-size: 0.85rem; line-height: 1.45;">
                    Enter your administrator password to unlock the Accounts Configuration dashboard.
                </p>
            </div>

            <!-- Identity Card -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.85rem;">
                <img src="${activeUser.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}" style="width: 38px; height: 38px; border-radius: 50%; border: 2px solid #38bdf8; object-fit: cover;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: #f8fafc; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${activeUser.name || 'Shamsudheen V.K.'}
                    </div>
                    <div style="font-size: 0.72rem; color: #38bdf8; font-family: monospace;">
                        ID: #${activeUser.id || 'SB-9901'} • ${activeUser.email || 'admin@stellobuild.com'}
                    </div>
                </div>
            </div>

            <!-- Password Input Form -->
            <form id="accountsConfigUnlockForm" onsubmit="event.preventDefault(); window.submitAccountsConfigUnlock();" style="margin-bottom: 0.5rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.45rem;">
                    Admin Password <span style="color: #ef4444;">*</span>
                </label>
                <div style="position: relative;">
                    <input type="password" id="accountsConfigUnlockPassword" 
                           placeholder="Enter admin password" 
                           class="glass-input" 
                           autocomplete="current-password"
                           style="width: 100%; padding-right: 42px; font-size: 0.95rem; font-weight: 600; background: rgba(0,0,0,0.5); border-color: rgba(56, 189, 248, 0.4);">
                    <button type="button" class="pass-toggle-btn" onclick="window.togglePasswordVisibility('accountsConfigUnlockPassword', this)" title="Show/Hide Password">
                        <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>

                <!-- Error Banner -->
                <div id="accountsConfigUnlockError" style="display: none; margin-top: 0.75rem; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.8rem; color: #f87171; text-align: left; line-height: 1.4;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="alert-circle" style="width: 15px; height: 15px; flex-shrink: 0;"></i>
                        <span id="accountsConfigUnlockErrorMsg">Invalid administrator password. Security breach attempt has been recorded in the audit trail.</span>
                    </div>
                </div>

                <!-- Helper Hint -->
                <div style="margin-top: 0.65rem; font-size: 0.72rem; color: #64748b; display: flex; align-items: center; gap: 5px;">
                    <i data-lucide="info" style="width: 12px; height: 12px;"></i>
                    <span>Default Super Admin Password: <code>Admin@2026</code> (or <code>admin123</code>)</span>
                </div>

                <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="window.cancelAccountsConfigUnlock()" style="flex: 1; padding: 0.65rem; font-size: 0.88rem;">
                        Cancel
                    </button>
                    <button type="submit" id="btnSubmitUnlockAccountsConfig" class="btn btn-primary" style="flex: 1.5; padding: 0.65rem; font-size: 0.88rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                        <i data-lucide="unlock" style="width: 16px; height: 16px;"></i> Unlock Controls
                    </button>
                </div>
            </form>

        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
        document.getElementById('accountsConfigUnlockPassword')?.focus();
    }, 100);
};

window.closeAccountsConfigUnlockModal = () => {
    const el = document.getElementById('accountsConfigUnlockModal');
    if (el) el.remove();
};

window.cancelAccountsConfigUnlock = () => {
    window.closeAccountsConfigUnlockModal();
    if (window.currentSettingsTab === 'accounts_config' && !window.isAccountsConfigUnlocked()) {
        window.switchSettingsTab('profile');
    }
};

window.togglePasswordVisibility = (inputId, btn) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    if (btn) {
        btn.innerHTML = isPass ? '<i data-lucide="eye-off" style="width: 16px; height: 16px;"></i>' : '<i data-lucide="eye" style="width: 16px; height: 16px;"></i>';
        if (window.lucide) window.lucide.createIcons();
    }
};

window.submitAccountsConfigUnlock = async () => {
    const passInput = document.getElementById('accountsConfigUnlockPassword');
    const errorBox = document.getElementById('accountsConfigUnlockError');
    const errorMsg = document.getElementById('accountsConfigUnlockErrorMsg');
    const card = document.getElementById('accountsConfigUnlockCard');
    const btn = document.getElementById('btnSubmitUnlockAccountsConfig');
    if (!passInput) return;

    const password = passInput.value.trim();
    if (!password) {
        if (errorBox && errorMsg) {
            errorMsg.innerText = 'Please enter your administrator account password.';
            errorBox.style.display = 'block';
        }
        if (card) {
            card.classList.remove('animate-shake');
            void card.offsetWidth;
            card.classList.add('animate-shake');
        }
        passInput.focus();
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 16px; height: 16px;"></i> Verifying...`;
        if (window.lucide) window.lucide.createIcons();
    }

    const store = window.Store || Store;
    const activeUser = (store && typeof store.getActiveUser === 'function') ? store.getActiveUser() : { id: 'SB-9901' };

    try {
        const response = await fetch('/api/admin/verify-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId: activeUser.id || 'SB-9901', password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            window.accountsConfigUnlocked = true;
            window.accountsConfigUnlockExpiresAt = Date.now() + (data.expiresIn || 900) * 1000;
            window.adminAccessToken = data.token;

            window.closeAccountsConfigUnlockModal();
            window.showAccountsConfigToast('Challenge verified: Master Accounts Configuration unlocked.', 'success');

            // Re-render settings view to show the unlocked configuration dashboard
            if (store && typeof store.notify === 'function') {
                store.notify();
            }
        } else {
            // Verification failed
            if (card) {
                card.classList.remove('animate-shake');
                void card.offsetWidth;
                card.classList.add('animate-shake');
            }
            if (errorBox && errorMsg) {
                errorMsg.innerText = data.message || 'Access Denied: Invalid administrator password. Security breach logged.';
                errorBox.style.display = 'block';
                if (window.lucide) window.lucide.createIcons();
            }
            passInput.value = '';
            passInput.focus();

            // Refresh audit logs in store so user can see the logged failed attempt
            if (store && typeof store.refreshAuditLogs === 'function') store.refreshAuditLogs();
        }
    } catch (err) {
        console.error('Unlock error:', err);
        if (errorBox && errorMsg) {
            errorMsg.innerText = 'Network error or server unavailable. Please try again.';
            errorBox.style.display = 'block';
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="unlock" style="width: 16px; height: 16px;"></i> Unlock Controls`;
            if (window.lucide) window.lucide.createIcons();
        }
    }
};

// =============================================================================
// CREDENTIAL RE-AUTHENTICATION FOR RESET OPERATIONS (SINGLE & MASTER)
// =============================================================================

window.openResetAuthModal = (targetModuleId) => {
    window.closeResetAuthModal();

    const store = window.Store || Store;
    const activeUser = (store && typeof store.getActiveUser === 'function') ? store.getActiveUser() : { id: 'SB-9901', name: 'Shamsudheen V.K.' };
    const isMasterReset = targetModuleId === 'all';
    const mod = isMasterReset ? null : (store && typeof store.getModuleConfig === 'function' ? store.getModuleConfig(targetModuleId) : null);
    const modName = isMasterReset ? 'All 14 ERP Modules' : (mod ? mod.name : targetModuleId);

    const modal = document.createElement('div');
    modal.id = 'resetAuthModal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.92); backdrop-filter: blur(16px);
        display: flex; align-items: center; justify-content: center; z-index: 100100; padding: 1.5rem;
    `;

    modal.innerHTML = `
        <div class="destructive-reset-modal" id="resetAuthCard" style="width: 520px; max-width: 95vw; padding: 2.25rem;">
            
            <button type="button" onclick="window.closeResetAuthModal()" style="position: absolute; right: 16px; top: 16px; background: transparent; border: none; color: #94a3b8; cursor: pointer;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>

            <!-- Warning Icon -->
            <div style="text-align: center; margin-bottom: 1.25rem;">
                <div class="destructive-hazard-glow" style="width: 64px; height: 64px; border-radius: 50%; background: rgba(239, 68, 68, 0.18); border: 2.5px solid #ef4444; display: flex; align-items: center; justify-content: center; color: #ef4444; margin: 0 auto 0.85rem;">
                    <i data-lucide="alert-triangle" style="width: 32px; height: 32px;"></i>
                </div>
                <span style="font-size: 0.72rem; letter-spacing: 0.8px; font-weight: 800; text-transform: uppercase; color: #ef4444; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); padding: 3px 12px; border-radius: 9999px;">
                    ${isMasterReset ? 'MASTER CONFIGURATION ROLLBACK' : 'FACTORY BASELINE RESET'}
                </span>
                <h2 style="margin: 0.65rem 0 0.35rem; font-size: 1.45rem; color: #f8fafc; font-weight: 700;">
                    Credential Re-Authentication Required
                </h2>
                <p style="margin: 0; color: #cbd5e1; font-size: 0.86rem; line-height: 1.5;">
                    ${isMasterReset 
                        ? 'You are about to roll back <strong>all 14 ERP modules</strong> to original factory baseline defaults. Custom prefixes, sequences, field rules, and formulas will be wiped.' 
                        : `You are about to restore <strong>${modName}</strong> to original factory default configuration. All other modules remain untouched.`}
                </p>
            </div>

            <!-- Form -->
            <form id="resetAuthForm" onsubmit="event.preventDefault(); window.executeResetWithAuth('${targetModuleId}');">
                
                <!-- Admin User ID Input -->
                <div style="margin-bottom: 0.85rem; text-align: left;">
                    <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.4rem;">
                        Admin User ID / Email <span style="color: #ef4444;">*</span>
                    </label>
                    <div style="position: relative;">
                        <input type="text" id="resetAuthAdminId" 
                               value="${activeUser.id || 'SB-9901'}" 
                               class="glass-input" 
                               style="width: 100%; font-family: monospace; font-size: 0.95rem; font-weight: 600; background: rgba(0,0,0,0.5); border-color: rgba(239, 68, 68, 0.4);">
                    </div>
                </div>

                <!-- Admin Password Input -->
                <div style="margin-bottom: 0.85rem; text-align: left;">
                    <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.4rem;">
                        Current Admin Password <span style="color: #ef4444;">*</span>
                    </label>
                    <div style="position: relative;">
                        <input type="password" id="resetAuthPassword" 
                               placeholder="Enter current admin password" 
                               class="glass-input" 
                               autocomplete="current-password"
                               style="width: 100%; padding-right: 42px; font-size: 0.95rem; font-weight: 600; background: rgba(0,0,0,0.5); border-color: rgba(239, 68, 68, 0.4);">
                        <button type="button" class="pass-toggle-btn" onclick="window.togglePasswordVisibility('resetAuthPassword', this)" title="Show/Hide Password">
                            <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                </div>

                ${isMasterReset ? `
                    <!-- Master Safety Token Input -->
                    <div style="margin-bottom: 1rem; text-align: left; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 0.85rem;">
                        <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #f87171; margin-bottom: 0.35rem;">
                            Type <span style="font-family: monospace; background: rgba(239, 68, 68, 0.25); padding: 1px 6px; border-radius: 4px;">RESET</span> in capital letters to confirm:
                        </label>
                        <input type="text" id="resetAuthConfirmToken" 
                               placeholder="Type RESET here" 
                               class="glass-input" 
                               autocomplete="off"
                               style="width: 100%; text-align: center; font-family: monospace; font-size: 1.05rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; border-color: rgba(239, 68, 68, 0.5); background: rgba(0,0,0,0.4);">
                    </div>
                ` : ''}

                <!-- Error Banner -->
                <div id="resetAuthError" style="display: none; margin-bottom: 1rem; background: rgba(239, 68, 68, 0.18); border: 1px solid rgba(239, 68, 68, 0.45); border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.82rem; color: #f87171; text-align: left;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="alert-circle" style="width: 15px; height: 15px; flex-shrink: 0;"></i>
                        <span id="resetAuthErrorMsg">Security authorization failed: Invalid Admin User ID or Password.</span>
                    </div>
                </div>

                <div style="font-size: 0.72rem; color: #64748b; text-align: left; margin-bottom: 1.25rem;">
                    🔒 All destructive rollbacks are cryptographically verified against the server and recorded in the audit trail.
                </div>

                <!-- Buttons -->
                <div style="display: flex; gap: 0.85rem; justify-content: center;">
                    <button type="button" class="btn btn-secondary" onclick="window.closeResetAuthModal()" style="padding: 0.65rem 1.45rem; font-size: 0.88rem;">
                        Cancel (Keep Settings)
                    </button>
                    <button type="submit" id="btnExecuteResetAuth" class="btn" style="background: linear-gradient(135deg, #dc2626, #991b1b); color: white; border: 1px solid #ef4444; padding: 0.65rem 1.75rem; font-size: 0.88rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i> Authorize & Execute Reset
                    </button>
                </div>
            </form>

        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
        document.getElementById('resetAuthPassword')?.focus();
    }, 100);
};

window.closeResetAuthModal = () => {
    const el = document.getElementById('resetAuthModal');
    if (el) el.remove();
};

window.executeResetWithAuth = async (targetModuleId) => {
    const adminIdInput = document.getElementById('resetAuthAdminId');
    const passInput = document.getElementById('resetAuthPassword');
    const tokenInput = document.getElementById('resetAuthConfirmToken');
    const errorBox = document.getElementById('resetAuthError');
    const errorMsg = document.getElementById('resetAuthErrorMsg');
    const card = document.getElementById('resetAuthCard');
    const btn = document.getElementById('btnExecuteResetAuth');

    const adminId = (adminIdInput?.value || '').trim();
    const password = passInput?.value || '';
    const confirmToken = (tokenInput?.value || '').trim();
    const isMasterReset = targetModuleId === 'all';

    if (!adminId || !password) {
        if (errorBox && errorMsg) {
            errorMsg.innerText = 'Please enter both your Admin User ID and current Admin Password.';
            errorBox.style.display = 'block';
        }
        if (card) {
            card.classList.remove('animate-shake');
            void card.offsetWidth;
            card.classList.add('animate-shake');
        }
        return;
    }

    if (isMasterReset && confirmToken !== 'RESET') {
        if (errorBox && errorMsg) {
            errorMsg.innerText = 'Master Reset requires typing RESET in capital letters.';
            errorBox.style.display = 'block';
        }
        if (card) {
            card.classList.remove('animate-shake');
            void card.offsetWidth;
            card.classList.add('animate-shake');
        }
        tokenInput?.focus();
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 16px; height: 16px;"></i> Verifying credentials...`;
        if (window.lucide) window.lucide.createIcons();
    }

    const store = window.Store || Store;

    try {
        const response = await fetch('/api/admin/reset-configurations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                moduleId: targetModuleId,
                adminId,
                password,
                confirmToken
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Update store state
            if (data.configurations) {
                store.state.accountsConfigurations = data.configurations;
            } else if (data.configuration && targetModuleId !== 'all') {
                if (!store.state.accountsConfigurations) store.getAccountsConfigurations();
                store.state.accountsConfigurations[targetModuleId] = data.configuration;
            }
            if (data.log) {
                if (!store.state.configurationAuditLogs) store.state.configurationAuditLogs = [];
                store.state.configurationAuditLogs.unshift(data.log);
            }
            store.saveState();

            window.closeResetAuthModal();
            window.closeModuleConfigModal();
            window.showAccountsConfigToast(data.message || 'Configuration successfully reset to baseline defaults.', 'success');

            if (store && typeof store.notify === 'function') store.notify();
        } else {
            if (card) {
                card.classList.remove('animate-shake');
                void card.offsetWidth;
                card.classList.add('animate-shake');
            }
            if (errorBox && errorMsg) {
                errorMsg.innerText = data.message || 'Security authorization failed: Invalid Admin User ID or Password.';
                errorBox.style.display = 'block';
                if (window.lucide) window.lucide.createIcons();
            }
            if (passInput) {
                passInput.value = '';
                passInput.focus();
            }
        }
    } catch (err) {
        console.error('Reset execution error:', err);
        if (errorBox && errorMsg) {
            errorMsg.innerText = 'Network error or server unavailable. Please try again.';
            errorBox.style.display = 'block';
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="trash-2" style="width: 16px; height: 16px;"></i> Authorize & Execute Reset`;
            if (window.lucide) window.lucide.createIcons();
        }
    }
};

// Aliases so all reset triggers point to the authenticated modal:
window.promptResetModule = (moduleId) => {
    window.openResetAuthModal(moduleId);
};
window.openResetModuleModal = (moduleId) => {
    window.openResetAuthModal(moduleId);
};
window.closeResetModuleModal = () => {
    window.closeResetAuthModal();
};
window.openGlobalResetModal = () => {
    window.openResetAuthModal('all');
};
window.closeGlobalResetModal = () => {
    window.closeResetAuthModal();
};

// =============================================================================
// AUDIT & HISTORY LOG MODAL
// =============================================================================

window.openAuditLogsModal = () => {
    window.closeAuditLogsModal();

    const store = window.Store || Store;
    const auditLogs = store.getAuditLogs();

    const modal = document.createElement('div');
    modal.id = 'auditLogsModal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px);
        display: flex; align-items: center; justify-content: center; z-index: 100070; padding: 1.5rem;
    `;

    const renderActionBadge = (action) => {
        if (action === 'GLOBAL_RESET') {
            return `<span style="font-size: 0.7rem; font-weight: 700; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 2px 8px; border-radius: 4px;">GLOBAL RESET</span>`;
        }
        if (action === 'MODULE_RESET') {
            return `<span style="font-size: 0.7rem; font-weight: 700; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 2px 8px; border-radius: 4px;">MODULE RESET</span>`;
        }
        return `<span style="font-size: 0.7rem; font-weight: 700; background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); padding: 2px 8px; border-radius: 4px;">UPDATE CONFIG</span>`;
    };

    modal.innerHTML = `
        <div class="glass-panel" style="width: 820px; max-width: 96vw; max-height: 88vh; display: flex; flex-direction: column; background: #0c101c; border: 1px solid var(--color-primary-border); border-radius: var(--radius-lg); box-shadow: 0 25px 75px rgba(0,0,0,0.85); overflow: hidden;">
            
            <!-- Header -->
            <div style="padding: 1.25rem 1.75rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                        <i data-lucide="history" style="width: 22px; height: 22px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #f8fafc;">
                            Configuration Audit Trail & Reset History
                        </h3>
                        <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">
                            Detailed log of every parameter modification, module reset, and master rollback.
                        </p>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <button type="button" class="btn btn-secondary" onclick="window.exportAuditLogsJSON()" style="padding: 0.45rem 0.95rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 5px;">
                        <i data-lucide="download" style="width: 14px; height: 14px;"></i> Export JSON
                    </button>
                    <button type="button" onclick="window.closeAuditLogsModal()" style="background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 6px;">
                        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                    </button>
                </div>
            </div>

            <!-- Search Filter Bar -->
            <div style="padding: 0.85rem 1.75rem; border-bottom: 1px solid var(--glass-border); background: rgba(0,0,0,0.2);">
                <div style="position: relative;">
                    <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--color-text-muted);"></i>
                    <input type="text" id="auditSearchInput" placeholder="Search audit logs by module, admin, or action..." 
                           oninput="window.filterAuditLogs(this.value)" 
                           class="glass-input" 
                           style="width: 100%; padding-left: 36px; font-size: 0.84rem;">
                </div>
            </div>

            <!-- Logs Timeline / Table -->
            <div id="auditLogsContainer" style="flex: 1; overflow-y: auto; padding: 1.25rem 1.75rem; display: flex; flex-direction: column; gap: 0.85rem;">
                ${auditLogs.length === 0 ? `
                    <div style="padding: 3rem; text-align: center; color: var(--color-text-muted);">
                        No audit events recorded yet.
                    </div>
                ` : auditLogs.map(log => {
                    const formattedTime = new Date(log.timestamp).toLocaleString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });

                    return `
                        <div class="audit-log-item" data-search="${(log.moduleName + ' ' + log.action + ' ' + log.adminName + ' ' + log.details).toLowerCase()}" style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px; padding: 1rem 1.15rem;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.45rem;">
                                <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                                    ${renderActionBadge(log.action)}
                                    <strong style="color: #f8fafc; font-size: 0.95rem;">${log.moduleName || log.moduleId}</strong>
                                    <span style="font-size: 0.72rem; color: #38bdf8; font-family: monospace; background: rgba(56,189,248,0.1); padding: 1px 6px; border-radius: 4px;">#${log.moduleId}</span>
                                </div>
                                <span style="font-size: 0.75rem; color: #64748b; font-family: monospace;">
                                    ${formattedTime}
                                </span>
                            </div>

                            <p style="margin: 0 0 0.65rem; font-size: 0.82rem; color: #cbd5e1; line-height: 1.45;">
                                ${log.details}
                            </p>

                            <!-- Changed Parameters Diff -->
                            ${(log.diff && log.diff.length > 0) ? `
                                <div style="background: rgba(0,0,0,0.3); border-radius: 6px; padding: 0.6rem 0.75rem; margin-top: 0.5rem; font-size: 0.78rem;">
                                    <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Parameter Diffs:</div>
                                    <div style="display: flex; flex-direction: column; gap: 3px;">
                                        ${log.diff.map(d => `
                                            <div style="display: flex; justify-content: space-between; gap: 8px; font-family: monospace;">
                                                <span style="color: #94a3b8;">${d.param}:</span>
                                                <span>
                                                    <span style="color: #ef4444; text-decoration: line-through;">${typeof d.oldVal === 'object' ? JSON.stringify(d.oldVal) : d.oldVal}</span>
                                                    <span style="color: #64748b; margin: 0 4px;">&rarr;</span>
                                                    <span style="color: #4ade80; font-weight: 700;">${typeof d.newVal === 'object' ? JSON.stringify(d.newVal) : d.newVal}</span>
                                                </span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            <div style="font-size: 0.72rem; color: #64748b; margin-top: 0.5rem; display: flex; justify-content: space-between;">
                                <span>Admin: <strong style="color: #cbd5e1;">${log.adminName}</strong> (${log.adminId})</span>
                                <span>Ref: ${log.id}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Footer -->
            <div style="padding: 1rem 1.75rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: flex-end; background: rgba(0,0,0,0.2);">
                <button type="button" class="btn btn-secondary" onclick="window.closeAuditLogsModal()" style="padding: 0.5rem 1.35rem; font-size: 0.85rem;">
                    Close
                </button>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.closeAuditLogsModal = () => {
    const el = document.getElementById('auditLogsModal');
    if (el) el.remove();
};

window.filterAuditLogs = (query) => {
    const q = (query || '').toLowerCase().trim();
    const items = document.querySelectorAll('.audit-log-item');
    items.forEach(item => {
        const text = item.getAttribute('data-search') || '';
        item.style.display = (!q || text.includes(q)) ? 'block' : 'none';
    });
};

window.exportAuditLogsJSON = () => {
    const store = window.Store || Store;
    const logs = store.getAuditLogs();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `erp_configuration_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
};

// =============================================================================
// TOAST NOTIFICATIONS (NON-BLOCKING INSTANT FEEDBACK)
// =============================================================================

window.showAccountsConfigToast = (msg, type = 'success') => {
    let toast = document.getElementById('accountsConfigToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'accountsConfigToast';
        toast.style.cssText = `
            position: fixed; top: 24px; right: 24px;
            padding: 12px 20px; border-radius: 10px;
            z-index: 100100; font-size: 0.88rem; font-weight: 600;
            display: flex; align-items: center; gap: 10px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.5);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateY(-20px); opacity: 0; pointer-events: none;
        `;
        document.body.appendChild(toast);
    }

    const isSuccess = type === 'success';
    toast.style.background = '#090e17';
    toast.style.color = '#ffffff';
    toast.style.border = `1.5px solid ${isSuccess ? '#22c55e' : '#ef4444'}`;
    toast.innerHTML = `
        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${isSuccess ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; display: flex; align-items: center; justify-content: center; color: ${isSuccess ? '#4ade80' : '#f87171'}; flex-shrink: 0;">
            <i data-lucide="${isSuccess ? 'check-circle' : 'alert-circle'}" style="width: 15px; height: 15px;"></i>
        </div>
        <span>${msg}</span>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Show animation
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    clearTimeout(window._accountsToastTimer);
    window._accountsToastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
    }, 3500);
};



