import { Store } from '../store.js';

// ============================================================================
// STYLOBUILD ERP - DEDICATED ORDERS MODULE & CUSTOMER TRACKING PORTAL
// ============================================================================

export const ORDER_MILESTONES = [
    { key: 'Order Listed', label: 'Order Listed', icon: 'clipboard-list', color: '#38bdf8', desc: 'Order confirmed from approved quotation' },
    { key: 'Drawing', label: 'Drawing', icon: 'pen-tool', color: '#818cf8', desc: '2D/3D CAD technical shop drawings drafted' },
    { key: 'Channel Making', label: 'Channel Making', icon: 'scissors', color: '#f59e0b', desc: 'CNC cutting, punching & channel profile shaping' },
    { key: 'Fabrication', label: 'Fabrication', icon: 'hammer', color: '#ec4899', desc: 'Structural welding, corner joins & sash assembly' },
    { key: 'Painting', label: 'Painting', icon: 'paint-bucket', color: '#a855f7', desc: 'Anti-corrosion primer & oven powder coating' },
    { key: 'Packing', label: 'Packing', icon: 'box', color: '#6366f1', desc: 'Protective edge wrapping, bubble shield & hardware pack' },
    { key: 'Dispatched', label: 'Dispatched', icon: 'send', color: '#06b6d4', desc: 'Loaded on logistics truck for site transit' },
    { key: 'Delivered', label: 'Delivered', icon: 'check-circle-2', color: '#10b981', desc: 'Handover complete; customer sign-off & portal revoked' }
];

window.orderSearchQuery = window.orderSearchQuery || '';
window.orderStageFilter = window.orderStageFilter || 'all';
window.currentCustomerPortalOrderId = window.currentCustomerPortalOrderId || null;
window.customerPortalPanZoom = { scale: 1, translateX: 0, translateY: 0, isDragging: false, startX: 0, startY: 0 };

export function renderOrders(state) {
    const store = window.Store || Store;
    if (!store.state.orders) store.state.orders = [];

    const activeUser = (typeof store.getActiveUser === 'function') ? store.getActiveUser() : { isSuperAdmin: true, name: 'Shamsudheen V.K.', role: 'Super Administrator' };
    const isSuperAdmin = activeUser.isSuperAdmin !== false;

    const orders = store.state.orders || [];
    const q = (window.orderSearchQuery || '').toLowerCase().trim();
    const filterStage = window.orderStageFilter || 'all';

    const filteredOrders = orders.filter(o => {
        if (filterStage !== 'all' && o.currentMilestone !== filterStage) return false;
        if (q) {
            const matchId = (o.id || '').toLowerCase().includes(q);
            const matchCust = (o.customer || '').toLowerCase().includes(q);
            const matchPhone = (o.customerMobile || '').toLowerCase().includes(q);
            const matchQuote = (o.quoteId || '').toLowerCase().includes(q);
            if (!matchId && !matchCust && !matchPhone && !matchQuote) return false;
        }
        return true;
    });

    // Metric Calculations
    const totalOrdersCount = orders.length;
    const inProductionCount = orders.filter(o => !['Order Listed', 'Dispatched', 'Delivered'].includes(o.currentMilestone)).length;
    const dispatchedCount = orders.filter(o => o.currentMilestone === 'Dispatched').length;
    const deliveredCount = orders.filter(o => o.currentMilestone === 'Delivered').length;
    const totalOrderValue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    const container = document.createElement('div');
    container.className = 'orders-view animate-fade-in';
    container.style.cssText = 'padding: 1.75rem 2rem; color: #f8fafc; font-family: "Inter", sans-serif;';

    container.innerHTML = `
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem;">
                    <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">
                        Order Management &amp; Tracking
                    </span>
                    <span style="font-size: 0.72rem; color: #34d399; background: rgba(52, 211, 153, 0.1); padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                        <span style="width: 6px; height: 6px; border-radius: 50%; background: #34d399; box-shadow: 0 0 8px #34d399;"></span> Customer Portal Live Sync
                    </span>
                </div>
                <h1 style="margin: 0; font-size: 1.85rem; font-weight: 800; color: #f8fafc; letter-spacing: -0.5px;">Orders (Dedicated Order List)</h1>
                <p style="margin: 0.25rem 0 0; color: #94a3b8; font-size: 0.88rem;">
                    Manage order fulfillment lifecycle, auto-dispatch WhatsApp portal credentials, and live production milestone tracking.
                </p>
            </div>

            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary" onclick="window.navigate('quotations')" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; padding: 0.6rem 1.15rem; border-color: rgba(99, 102, 241, 0.35); color: #818cf8;">
                    <i data-lucide="file-text" style="width: 15px; height: 15px;"></i> Convert from Quotations
                </button>
                <button type="button" class="btn btn-primary" onclick="window.openNewOrderModal()" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.88rem; padding: 0.6rem 1.35rem; font-weight: 600; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.35);">
                    <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i> Create Manual Order
                </button>
            </div>
        </div>

        <!-- 5 Summary KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: 12px; border-left: 4px solid #38bdf8;">
                <div style="font-size: 0.74rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Total Orders</div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.4rem;">
                    <div style="font-size: 1.65rem; font-weight: 800; color: #f8fafc;">${totalOrdersCount}</div>
                    <span style="font-size: 0.75rem; color: #38bdf8; font-weight: 700;">₹${totalOrderValue.toLocaleString('en-IN')}</span>
                </div>
            </div>

            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: 12px; border-left: 4px solid #ec4899;">
                <div style="font-size: 0.74rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">In Production</div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.4rem;">
                    <div style="font-size: 1.65rem; font-weight: 800; color: #f8fafc;">${inProductionCount}</div>
                    <span style="font-size: 0.72rem; color: #ec4899; font-weight: 600;">Drawing to Packing</span>
                </div>
            </div>

            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: 12px; border-left: 4px solid #06b6d4;">
                <div style="font-size: 0.74rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Dispatched (Transit)</div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.4rem;">
                    <div style="font-size: 1.65rem; font-weight: 800; color: #f8fafc;">${dispatchedCount}</div>
                    <span style="font-size: 0.72rem; color: #06b6d4; font-weight: 600;">En Route</span>
                </div>
            </div>

            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: 12px; border-left: 4px solid #10b981;">
                <div style="font-size: 0.74rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Delivered &amp; Closed</div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.4rem;">
                    <div style="font-size: 1.65rem; font-weight: 800; color: #f8fafc;">${deliveredCount}</div>
                    <span style="font-size: 0.72rem; color: #10b981; font-weight: 600;">Credentials Revoked</span>
                </div>
            </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="glass-panel" style="padding: 0.85rem 1.15rem; margin-bottom: 1.25rem; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
            <!-- Search -->
            <div style="position: relative; flex: 1; max-width: 360px; min-width: 220px;">
                <i data-lucide="search" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #94a3b8;"></i>
                <input type="text" value="${window.orderSearchQuery}" placeholder="Search Order ID, Client, Mobile, Quote..." 
                       oninput="window.orderSearchQuery = this.value; Store.notify();"
                       style="width: 100%; padding: 0.5rem 0.85rem 0.5rem 2.35rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 6px; color: white; font-size: 0.86rem;" />
            </div>

            <!-- Milestone Filter Pills -->
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                <span style="font-size: 0.75rem; color: #94a3b8;">Stage:</span>
                <button type="button" onclick="window.orderStageFilter = 'all'; Store.notify();" 
                        style="padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: 1px solid ${filterStage === 'all' ? 'var(--color-primary)' : 'var(--glass-border)'}; background: ${filterStage === 'all' ? 'var(--color-primary)' : 'transparent'}; color: ${filterStage === 'all' ? '#fff' : '#94a3b8'};">
                    All Orders
                </button>
                ${ORDER_MILESTONES.map(m => {
                    const active = (filterStage === m.key);
                    return `
                        <button type="button" onclick="window.orderStageFilter = '${m.key}'; Store.notify();"
                                style="padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: 1px solid ${active ? m.color : 'var(--glass-border)'}; background: ${active ? m.color + '22' : 'transparent'}; color: ${active ? m.color : '#94a3b8'};">
                            ${m.label}
                        </button>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- Orders Table -->
        <div class="glass-panel" style="border-radius: 12px; border: 1px solid var(--glass-border); overflow: hidden;">
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.86rem;">
                    <thead style="background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--glass-border); color: #94a3b8; font-size: 0.78rem; text-transform: uppercase;">
                        <tr>
                            <th style="padding: 0.85rem 1rem; width: 140px;">Order ID</th>
                            <th style="padding: 0.85rem 1rem; min-width: 180px;">Customer &amp; Contact</th>
                            <th style="padding: 0.85rem 1rem; min-width: 220px;">Products &amp; Items</th>
                            <th style="padding: 0.85rem 1rem; text-align: right; width: 130px;">Amount &amp; Balance</th>
                            <th style="padding: 0.85rem 1rem; text-align: center; width: 160px;">Production Stage</th>
                            <th style="padding: 0.85rem 1rem; text-align: center; width: 140px;">Customer Portal</th>
                            <th style="padding: 0.85rem 1rem; text-align: right; width: 220px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredOrders.length === 0 ? `
                            <tr>
                                <td colspan="7" style="padding: 3rem 1rem; text-align: center; color: #94a3b8;">
                                    <i data-lucide="package" style="width: 40px; height: 40px; margin-bottom: 0.5rem; opacity: 0.4;"></i>
                                    <div>No manufacturing orders found. Convert a quotation or create a new order.</div>
                                </td>
                            </tr>
                        ` : filteredOrders.map(order => {
                            const milestone = ORDER_MILESTONES.find(m => m.key === order.currentMilestone) || ORDER_MILESTONES[0];
                            const isPortalActive = order.portalCredentials && order.portalCredentials.active !== false && order.currentMilestone !== 'Delivered';
                            const cleanPhone = (order.customerMobile || '').replace(/\D/g, '');

                            return `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                    <!-- Order ID -->
                                    <td style="padding: 0.9rem 1rem;">
                                        <div style="font-weight: 700; color: #38bdf8; font-family: monospace; font-size: 0.92rem;">${order.id}</div>
                                        ${order.quoteId ? `
                                            <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                                                Ref: <span style="color: #cbd5e1;">${order.quoteId}</span>
                                            </div>
                                        ` : ''}
                                        <div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;">${order.date || 'Today'}</div>
                                    </td>

                                    <!-- Customer & Contact -->
                                    <td style="padding: 0.9rem 1rem;">
                                        <div style="font-weight: 700; color: #f8fafc; font-size: 0.9rem;">${order.customer}</div>
                                        <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #cbd5e1; margin-top: 2px;">
                                            <i data-lucide="phone" style="width: 12px; height: 12px; color: #22c55e;"></i>
                                            <span>${order.customerMobile || 'Not provided'}</span>
                                        </div>
                                        <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">${order.customerAddress || 'Kozhikode, Kerala'}</div>
                                    </td>

                                    <!-- Products & Items -->
                                    <td style="padding: 0.9rem 1rem;">
                                        <div style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.4;">${order.items || 'Standard Custom Windows'}</div>
                                        ${order.drawingUrl ? `
                                            <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #38bdf8; margin-top: 4px; cursor: pointer;" onclick="window.openUniversalDrawingPreview('${order.id}')">
                                                <i data-lucide="image" style="width: 12px; height: 12px;"></i> Universal Drawing Attached
                                            </div>
                                        ` : ''}
                                    </td>

                                    <!-- Amount & Balance -->
                                    <td style="padding: 0.9rem 1rem; text-align: right;">
                                        <div style="font-weight: 700; color: #f8fafc; font-size: 0.95rem;">₹${(Number(order.amount) || 0).toLocaleString('en-IN')}</div>
                                        <div style="font-size: 0.75rem; color: ${(Number(order.balanceDue) || 0) > 0 ? '#fbbf24' : '#34d399'}; margin-top: 2px;">
                                            Due: ₹${(Number(order.balanceDue) || 0).toLocaleString('en-IN')}
                                        </div>
                                    </td>

                                    <!-- Production Stage -->
                                    <td style="padding: 0.9rem 1rem; text-align: center;">
                                        <span style="
                                            display: inline-flex; align-items: center; gap: 5px;
                                            padding: 4px 10px; border-radius: 9999px; font-size: 0.74rem; font-weight: 700;
                                            background: ${milestone.color}18; color: ${milestone.color}; border: 1px solid ${milestone.color}44;
                                        ">
                                            <i data-lucide="${milestone.icon}" style="width: 12px; height: 12px;"></i>
                                            ${milestone.label}
                                        </span>
                                    </td>

                                    <!-- Customer Portal Status -->
                                    <td style="padding: 0.9rem 1rem; text-align: center;">
                                        ${isPortalActive ? `
                                            <div style="display: inline-flex; flex-direction: column; align-items: center; gap: 3px;">
                                                <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                                                    <i data-lucide="shield-check" style="width: 12px; height: 12px;"></i> Active
                                                </span>
                                                <button type="button" onclick="window.dispatchOrderWhatsApp('${order.id}')" style="background: transparent; border: none; color: #38bdf8; font-size: 0.7rem; cursor: pointer; text-decoration: underline;" title="Dispatch credentials via WhatsApp">
                                                    Resend Credentials
                                                </button>
                                            </div>
                                        ` : `
                                            <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;" title="Credentials automatically disabled upon delivery">
                                                <i data-lucide="shield-x" style="width: 12px; height: 12px;"></i> Revoked
                                            </span>
                                        `}
                                    </td>

                                    <!-- Actions -->
                                    <td style="padding: 0.9rem 1rem; text-align: right;">
                                        <div style="display: inline-flex; gap: 0.4rem; align-items: center;">
                                            <!-- Customer Portal Button -->
                                            <button type="button" class="btn btn-secondary" onclick="window.openCustomerPortal('${order.id}')" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);" title="Launch Customer Tracking Portal View">
                                                <i data-lucide="external-link" style="width: 13px; height: 13px;"></i> Portal
                                            </button>

                                            <!-- WhatsApp Button -->
                                            <button type="button" class="btn btn-secondary" onclick="window.dispatchOrderWhatsApp('${order.id}')" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px; color: #22c55e; border-color: rgba(34, 197, 94, 0.4);" title="Auto-dispatch WhatsApp Notification with credentials">
                                                <i data-lucide="message-circle" style="width: 13px; height: 13px;"></i> WhatsApp
                                            </button>

                                            <!-- Advance Stage Button -->
                                            <button type="button" class="btn btn-primary" onclick="window.openAdvanceStageModal('${order.id}')" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;" title="Advance Order Production Stage">
                                                <i data-lucide="step-forward" style="width: 13px; height: 13px;"></i> Stage
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
    return container;
}

// ============================================================================
// CUSTOMER TRACKING PORTAL (Requirement 3)
// ============================================================================

window.openCustomerPortal = (orderId) => {
    const store = window.Store || Store;
    const order = (store.state.orders || []).find(o => o.id === orderId);
    if (!order) return alert('Order not found!');

    window.currentCustomerPortalOrderId = orderId;
    window.customerPortalPanZoom = { scale: 1, translateX: 0, translateY: 0, isDragging: false, startX: 0, startY: 0 };

    const existing = document.getElementById('customer-portal-modal');
    if (existing) existing.remove();

    const isRevoked = (order.currentMilestone === 'Delivered' || (order.portalCredentials && order.portalCredentials.active === false));
    const activeMilestoneIndex = ORDER_MILESTONES.findIndex(m => m.key === order.currentMilestone);

    const modal = document.createElement('div');
    modal.id = 'customer-portal-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.88);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        display: flex; align-items: center; justify-content: center; z-index: 100060;
        padding: 1.5rem; font-family: 'Inter', sans-serif;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 960px; max-width: 96vw; max-height: 92vh; overflow-y: auto; background: #080d16; border: 1.5px solid rgba(56, 189, 248, 0.35); border-radius: 16px; box-shadow: 0 25px 75px rgba(0,0,0,0.9); color: #f8fafc; padding: 2rem;">
            
            <!-- Top Bar with StyloBuild Brand & Credentials Box -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.9rem;">
                    <div style="width: 46px; height: 46px; border-radius: 12px; background: var(--brand-gradient); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 0 16px var(--color-primary-glow);">
                        <i data-lucide="shield-check" style="width: 26px; height: 26px;"></i>
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h2 style="margin: 0; font-size: 1.4rem; font-weight: 800; color: #f8fafc;">StyloBuild • Customer Tracking Portal</h2>
                            <span style="font-size: 0.7rem; padding: 2px 8px; border-radius: 9999px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); font-weight: 700;">
                                PRIVATE ACCESS
                            </span>
                        </div>
                        <p style="margin: 2px 0 0; font-size: 0.8rem; color: #94a3b8;">
                            Live manufacturing telemetry for Order <strong style="color: #38bdf8; font-family: monospace;">${order.id}</strong>
                        </p>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <button type="button" class="btn btn-secondary" onclick="window.dispatchOrderWhatsApp('${order.id}')" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: #22c55e; border-color: rgba(34, 197, 94, 0.4);">
                        <i data-lucide="share-2" style="width: 14px; height: 14px;"></i> Share Portal Link
                    </button>
                    <button type="button" onclick="document.getElementById('customer-portal-modal').remove()" style="background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); color: #cbd5e1; border-radius: 8px; padding: 6px 10px; cursor: pointer;">
                        ✕ Close
                    </button>
                </div>
            </div>

            <!-- Revocation Alert Banner if Delivered -->
            ${isRevoked ? `
                <div style="background: rgba(239, 68, 68, 0.15); border: 1.5px solid rgba(239, 68, 68, 0.4); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.75rem; display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; display: flex; align-items: center; justify-content: center; color: #ef4444; flex-shrink: 0;">
                        <i data-lucide="shield-alert" style="width: 24px; height: 24px;"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.05rem; color: #f87171; font-weight: 700;">Customer Portal Access Revoked &amp; Disabled</h4>
                        <p style="margin: 3px 0 0; font-size: 0.84rem; color: #fca5a5; line-height: 1.45;">
                            This order was marked as <strong>'Delivered'</strong>. Per StyloBuild security governance, once client handover is finalized, customer credentials are automatically revoked and inactive.
                        </p>
                    </div>
                </div>
            ` : `
                <!-- Auto-Generated Credentials Card -->
                <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 0.85rem 1.25rem; margin-bottom: 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                    <div>
                        <span style="font-size: 0.72rem; text-transform: uppercase; color: #38bdf8; font-weight: 700; letter-spacing: 0.5px;">Auto-Generated Customer Login Credentials</span>
                        <div style="display: flex; gap: 1.5rem; margin-top: 4px; font-size: 0.86rem;">
                            <span>Username: <strong style="color: #f8fafc;">${order.customer}</strong></span>
                            <span>Password: <strong style="color: #38bdf8; font-family: monospace;">${order.customerMobile}</strong></span>
                        </div>
                    </div>
                    <span style="font-size: 0.74rem; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35); padding: 3px 10px; border-radius: 9999px; font-weight: 700;">
                        ACTIVE CREDENTIALS
                    </span>
                </div>
            `}

            <!-- 1. REAL-TIME PRODUCTION MILESTONE TRACKER (8 Milestones) -->
            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 14px; padding: 1.5rem; margin-bottom: 1.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="activity" style="width: 18px; height: 18px; color: #38bdf8;"></i> Real-Time Manufacturing Milestone Tracker
                        </h3>
                        <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">
                            Status updates made on the production floor reflect instantly on this tracker.
                        </p>
                    </div>
                    <span style="font-size: 0.82rem; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 3px 10px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.3);">
                        Current Stage: ${order.currentMilestone}
                    </span>
                </div>

                <!-- 8-Step Timeline Horizontal Bar -->
                <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 0.5rem; position: relative;">
                    ${ORDER_MILESTONES.map((m, idx) => {
                        const isCompleted = idx < activeMilestoneIndex;
                        const isCurrent = idx === activeMilestoneIndex;
                        const isUpcoming = idx > activeMilestoneIndex;

                        let stepBg = 'rgba(255,255,255,0.04)';
                        let stepBorder = 'rgba(255,255,255,0.1)';
                        let textColor = '#94a3b8';
                        let badgeIcon = m.icon;

                        if (isCompleted) {
                            stepBg = 'rgba(34, 197, 94, 0.15)';
                            stepBorder = 'rgba(34, 197, 94, 0.4)';
                            textColor = '#4ade80';
                            badgeIcon = 'check';
                        } else if (isCurrent) {
                            stepBg = `${m.color}22`;
                            stepBorder = m.color;
                            textColor = '#ffffff';
                        }

                        return `
                            <div style="
                                background: ${stepBg}; border: 1.5px solid ${stepBorder}; border-radius: 10px;
                                padding: 0.85rem 0.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px;
                                box-shadow: ${isCurrent ? `0 0 16px ${m.color}44` : 'none'}; position: relative;
                            ">
                                <div style="
                                    width: 32px; height: 32px; border-radius: 50%;
                                    background: ${isCompleted ? '#10b981' : (isCurrent ? m.color : 'rgba(255,255,255,0.08)')};
                                    color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;
                                ">
                                    <i data-lucide="${badgeIcon}" style="width: 16px; height: 16px;"></i>
                                </div>
                                <div style="font-size: 0.76rem; font-weight: 700; color: ${textColor}; line-height: 1.2;">
                                    ${m.label}
                                </div>
                                <div style="font-size: 0.65rem; color: #64748b;">
                                    ${isCompleted ? 'Completed' : (isCurrent ? 'Active Now' : 'Pending')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- 2. APPROVED QUOTATION SUMMARY & DESIGN DRAWINGS WITH PAN/ZOOM -->
            <div style="display: grid; grid-template-columns: 1fr 1.35fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                
                <!-- Approved Quotation Details Card -->
                <div class="glass-panel" style="padding: 1.5rem; border-radius: 12px; background: rgba(0,0,0,0.25); border: 1px solid var(--glass-border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                        <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="file-check" style="width: 18px; height: 18px; color: #10b981;"></i> Approved Commercial Proposal
                        </h4>
                        <span style="font-size: 0.72rem; color: #34d399; font-weight: 700;">VERIFIED</span>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem;">
                        <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                            <span>Customer Name:</span>
                            <strong style="color: #f8fafc;">${order.customer}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                            <span>Quotation Reference:</span>
                            <strong style="color: #38bdf8;">${order.quoteId || 'QT-APPROVED'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                            <span>Order Confirmation Date:</span>
                            <span style="color: #cbd5e1;">${order.date || 'Today'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                            <span>Expected Delivery:</span>
                            <span style="color: #cbd5e1;">${order.dueDate || '30 Days'}</span>
                        </div>

                        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.45rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #94a3b8;">Grand Total:</span>
                                <strong style="color: #f8fafc; font-size: 1.05rem;">₹${(Number(order.amount) || 0).toLocaleString('en-IN')}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: #10b981;">
                                <span>Advance Paid:</span>
                                <strong>₹${(Number(order.advancePayment) || 0).toLocaleString('en-IN')}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: ${(Number(order.balanceDue) || 0) > 0 ? '#fbbf24' : '#34d399'}; font-weight: 700;">
                                <span>Balance Remaining:</span>
                                <strong>₹${(Number(order.balanceDue) || 0).toLocaleString('en-IN')}</strong>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 1.25rem;">
                        <button type="button" class="btn btn-primary" onclick="window.downloadOrderQuotationDoc('${order.id}')" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0.65rem 1rem; font-weight: 600;">
                            <i data-lucide="download" style="width: 16px; height: 16px;"></i> Download Approved Quotation PDF
                        </button>
                    </div>
                </div>

                <!-- Technical Drawings with Interactive Pan/Zoom Canvas (Requirement 3) -->
                <div class="glass-panel" style="padding: 1.5rem; border-radius: 12px; background: rgba(0,0,0,0.25); border: 1px solid var(--glass-border); display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <div>
                            <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
                                <i data-lucide="layers" style="width: 18px; height: 18px; color: #38bdf8;"></i> Design Drawings &amp; Shop CAD
                            </h4>
                            <span style="font-size: 0.74rem; color: #94a3b8;">Pan &amp; Zoom enabled technical blueprint view</span>
                        </div>

                        <!-- Pan & Zoom Controls -->
                        <div style="display: flex; gap: 4px; align-items: center; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 8px; border: 1px solid var(--glass-border);">
                            <button type="button" onclick="window.zoomCustomerDrawing(0.2)" class="btn btn-secondary" style="padding: 3px 8px; font-size: 0.8rem;" title="Zoom In">+</button>
                            <span id="panzoom-scale-label" style="font-size: 0.72rem; color: #38bdf8; font-family: monospace; padding: 0 4px;">100%</span>
                            <button type="button" onclick="window.zoomCustomerDrawing(-0.2)" class="btn btn-secondary" style="padding: 3px 8px; font-size: 0.8rem;" title="Zoom Out">-</button>
                            <button type="button" onclick="window.resetCustomerDrawingZoom()" class="btn btn-secondary" style="padding: 3px 8px; font-size: 0.72rem;" title="Reset Zoom">Reset</button>
                        </div>
                    </div>

                    <!-- Interactive Drawing Viewport -->
                    <div id="drawing-panzoom-viewport" 
                         onmousedown="window.startDrawingPan(event)"
                         onmousemove="window.doDrawingPan(event)"
                         onmouseup="window.endDrawingPan(event)"
                         onmouseleave="window.endDrawingPan(event)"
                         style="
                            flex: 1; min-height: 260px; background: #070b12; border: 1px solid var(--glass-border); border-radius: 10px;
                            overflow: hidden; position: relative; cursor: grab; display: flex; align-items: center; justify-content: center;
                         ">
                        <div id="drawing-panzoom-content" style="transform-origin: center center; transition: transform 0.08s ease-out; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                            <img src="${order.drawingUrl || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2531&auto=format&fit=crop'}" 
                                 alt="Technical Drawing" 
                                 style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);" 
                                 draggable="false" />
                        </div>
                        <div style="position: absolute; bottom: 8px; right: 8px; font-size: 0.68rem; color: #64748b; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px;">
                            Click &amp; Drag to Pan • Zoom Buttons Above
                        </div>
                    </div>
                </div>

            </div>

        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
};

// Pan & Zoom Handlers
window.zoomCustomerDrawing = (delta) => {
    const pz = window.customerPortalPanZoom;
    pz.scale = Math.max(0.5, Math.min(3.5, pz.scale + delta));
    const label = document.getElementById('panzoom-scale-label');
    if (label) label.innerText = Math.round(pz.scale * 100) + '%';
    const content = document.getElementById('drawing-panzoom-content');
    if (content) content.style.transform = `translate(${pz.translateX}px, ${pz.translateY}px) scale(${pz.scale})`;
};

window.resetCustomerDrawingZoom = () => {
    const pz = window.customerPortalPanZoom;
    pz.scale = 1;
    pz.translateX = 0;
    pz.translateY = 0;
    const label = document.getElementById('panzoom-scale-label');
    if (label) label.innerText = '100%';
    const content = document.getElementById('drawing-panzoom-content');
    if (content) content.style.transform = `translate(0px, 0px) scale(1)`;
};

window.startDrawingPan = (e) => {
    const pz = window.customerPortalPanZoom;
    pz.isDragging = true;
    pz.startX = e.clientX - pz.translateX;
    pz.startY = e.clientY - pz.translateY;
    const vp = document.getElementById('drawing-panzoom-viewport');
    if (vp) vp.style.cursor = 'grabbing';
};

window.doDrawingPan = (e) => {
    const pz = window.customerPortalPanZoom;
    if (!pz.isDragging) return;
    pz.translateX = e.clientX - pz.startX;
    pz.translateY = e.clientY - pz.startY;
    const content = document.getElementById('drawing-panzoom-content');
    if (content) content.style.transform = `translate(${pz.translateX}px, ${pz.translateY}px) scale(${pz.scale})`;
};

window.endDrawingPan = () => {
    window.customerPortalPanZoom.isDragging = false;
    const vp = document.getElementById('drawing-panzoom-viewport');
    if (vp) vp.style.cursor = 'grab';
};

// ============================================================================
// WHATSAPP DISPATCH WITH PRIVATE PORTAL CREDENTIALS (Requirement 3)
// ============================================================================

window.dispatchOrderWhatsApp = (orderId) => {
    const store = window.Store || Store;
    const order = (store.state.orders || []).find(o => o.id === orderId);
    if (!order) return alert('Order not found!');

    const existing = document.getElementById('order-whatsapp-dispatch-modal');
    if (existing) existing.remove();

    const cleanMobile = (order.customerMobile || '').replace(/\D/g, '');
    const phoneWithCountry = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;
    const portalUrl = `${window.location.origin}${window.location.pathname}#/orders?portal=true&orderId=${order.id}`;

    const message = 
`*StyloBuild — Customer Tracking Portal Confirmation*
Order Ref: ${order.id}
Customer: ${order.customer}
Amount: ₹${(Number(order.amount) || 0).toLocaleString('en-IN')}

Dear ${order.customer},
Your custom manufacturing order has been confirmed and placed in production!

Track real-time manufacturing milestones & technical shop drawings here:
${portalUrl}

*Your Secure Customer Portal Login Credentials:*
• Username: ${order.customer}
• Password: ${order.customerMobile}

(Note: Your credentials remain active throughout production until delivery is complete.)
Thank you for choosing StyloBuild — Stronger Homes, Together Tomorrow.`;

    const waApiUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;

    const modal = document.createElement('div');
    modal.id = 'order-whatsapp-dispatch-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center; z-index: 100080;
        padding: 1.5rem; font-family: 'Inter', sans-serif;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 540px; max-width: 95vw; background: #090e17; border: 1.5px solid #22c55e; border-radius: 14px; padding: 1.75rem; color: #f8fafc; box-shadow: 0 25px 65px rgba(0,0,0,0.9);">
            
            <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1.25rem;">
                <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(34, 197, 94, 0.2); border: 1.5px solid #22c55e; display: flex; align-items: center; justify-content: center; color: #22c55e;">
                    <i data-lucide="message-circle" style="width: 24px; height: 24px;"></i>
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #f8fafc;">WhatsApp Portal Notification</h3>
                    <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">Send private portal link and auto-generated credentials to ${order.customer}</p>
                </div>
            </div>

            <!-- Credentials Card -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1rem; font-size: 0.84rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #94a3b8;">Customer:</span>
                    <strong style="color: #f8fafc;">${order.customer}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #94a3b8;">Destination Mobile:</span>
                    <strong style="color: #22c55e; font-family: monospace;">${order.customerMobile}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Auto-Generated Password:</span>
                    <code style="color: #38bdf8; font-weight: 700;">${order.customerMobile}</code>
                </div>
            </div>

            <!-- Message Preview -->
            <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.35rem;">Dispatch Message Preview:</label>
                <textarea readonly style="width: 100%; height: 140px; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 8px; color: #cbd5e1; padding: 0.75rem; font-size: 0.78rem; line-height: 1.45; resize: none; font-family: monospace;">${message}</textarea>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('order-whatsapp-dispatch-modal').remove()">
                    Close
                </button>
                <button type="button" class="btn btn-secondary" onclick="navigator.clipboard.writeText(\`${message.replace(/`/g, '\\`')}\`); alert('Message copied to clipboard!');" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);">
                    📋 Copy Text
                </button>
                <a href="${waApiUrl}" target="_blank" class="btn btn-primary" onclick="document.getElementById('order-whatsapp-dispatch-modal').remove()" style="background: #22c55e; border-color: #22c55e; color: white; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; font-weight: 700;">
                    <i data-lucide="send" style="width: 15px; height: 15px;"></i> Open WhatsApp
                </a>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
};

// ============================================================================
// STAGE ADVANCEMENT MODAL & REVOCATION UPON DELIVERED (Requirements 3 & 4)
// ============================================================================

window.openAdvanceStageModal = (orderId) => {
    const store = window.Store || Store;
    const order = (store.state.orders || []).find(o => o.id === orderId);
    if (!order) return alert('Order not found!');

    const existing = document.getElementById('order-advance-stage-modal');
    if (existing) existing.remove();

    const activeUser = (typeof store.getActiveUser === 'function') ? store.getActiveUser() : { isSuperAdmin: true, name: 'Shamsudheen V.K.', role: 'Super Administrator' };
    const isSuperAdmin = activeUser.isSuperAdmin !== false;

    const modal = document.createElement('div');
    modal.id = 'order-advance-stage-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center; z-index: 100070;
        padding: 1.5rem; font-family: 'Inter', sans-serif;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 520px; max-width: 95vw; background: #090e17; border: 1.5px solid var(--glass-border); border-radius: 14px; padding: 1.75rem; color: #f8fafc; box-shadow: 0 25px 65px rgba(0,0,0,0.9);">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
                <div>
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #f8fafc;">Advance Production Stage</h3>
                    <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">Order ${order.id} • ${order.customer}</p>
                </div>
                <button type="button" onclick="document.getElementById('order-advance-stage-modal').remove()" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 1.25rem;">✕</button>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.84rem;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Current Milestone:</span>
                    <strong style="color: #38bdf8;">${order.currentMilestone}</strong>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
                <label style="font-size: 0.78rem; font-weight: 600; color: #94a3b8;">Select Target Milestone:</label>
                ${ORDER_MILESTONES.map((m, idx) => {
                    const isCurrent = m.key === order.currentMilestone;
                    return `
                        <button type="button" onclick="window.commitAdvanceStage('${order.id}', '${m.key}')" 
                                class="btn btn-secondary"
                                style="
                                    justify-content: space-between; padding: 0.65rem 1rem; font-size: 0.84rem; text-align: left;
                                    border-color: ${isCurrent ? m.color : 'var(--glass-border)'};
                                    background: ${isCurrent ? m.color + '18' : 'rgba(255,255,255,0.02)'};
                                    color: ${isCurrent ? m.color : '#f8fafc'};
                                ">
                            <span style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="${m.icon}" style="width: 15px; height: 15px;"></i>
                                <span>${m.label}</span>
                            </span>
                            ${isCurrent ? '<span style="font-size: 0.7rem; font-weight: 700;">CURRENT</span>' : '<span style="font-size: 0.72rem; color: #94a3b8;">Move Here ➔</span>'}
                        </button>
                    `;
                }).join('')}
            </div>

            <div style="font-size: 0.75rem; color: #94a3b8; line-height: 1.4; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem;">
                ⚠️ <strong>Note:</strong> Advancing to <strong>'Delivered'</strong> will automatically revoke and disable the customer's portal credentials.
            </div>

        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
};

window.commitAdvanceStage = (orderId, targetStage) => {
    const store = window.Store || Store;
    const order = (store.state.orders || []).find(o => o.id === orderId);
    if (!order) return;

    const activeUser = (typeof store.getActiveUser === 'function') ? store.getActiveUser() : { isSuperAdmin: true, name: 'Shamsudheen V.K.', role: 'Super Administrator' };
    const isSuperAdmin = activeUser.isSuperAdmin !== false;

    // Granular Technician Stage Advancement Permission Check (Requirement 4)
    if (!isSuperAdmin) {
        const userRole = (activeUser.role || '').toLowerCase();
        let allowedStage = null;
        if (userRole.includes('cad') || userRole.includes('design')) allowedStage = 'Drawing';
        else if (userRole.includes('cnc') || userRole.includes('channel')) allowedStage = 'Channel Making';
        else if (userRole.includes('fab') || userRole.includes('weld')) allowedStage = 'Fabrication';
        else if (userRole.includes('paint') || userRole.includes('coat')) allowedStage = 'Painting';
        else if (userRole.includes('pack')) allowedStage = 'Packing';
        else if (userRole.includes('delivery') || userRole.includes('driver')) allowedStage = 'Delivered';

        if (allowedStage && targetStage !== allowedStage && targetStage !== 'Dispatched') {
            alert(`Permission Denied: As '${activeUser.role}', you are only authorized to advance the '${allowedStage}' stage. Super Admin authorization is required.`);
            return;
        }
    }

    order.currentMilestone = targetStage;
    if (!order.milestonesHistory) order.milestonesHistory = [];
    order.milestonesHistory.push({
        stage: targetStage,
        date: new Date().toLocaleString(),
        by: activeUser.name || 'Technician'
    });

    // Sync with production orders
    if (store.state.productionOrders) {
        const prod = store.state.productionOrders.find(p => p.id === order.id || p.client === order.customer);
        if (prod) {
            prod.status = targetStage;
            const idx = ORDER_MILESTONES.findIndex(m => m.key === targetStage);
            if (idx !== -1) prod.progress = idx;
        }
    }

    // Auto-revoke credentials if Delivered (Requirement 3)
    if (targetStage === 'Delivered') {
        if (!order.portalCredentials) order.portalCredentials = {};
        order.portalCredentials.active = false;
        order.portalCredentials.revokedAt = new Date().toLocaleString();
        alert(`Order ${order.id} marked as 'Delivered'! Customer portal credentials have been automatically revoked and disabled.`);
    } else {
        alert(`Order ${order.id} moved to '${targetStage}' stage. Live customer portal updated.`);
    }

    const modal = document.getElementById('order-advance-stage-modal');
    if (modal) modal.remove();

    store.saveState();
    store.notify();
};

window.openUniversalDrawingPreview = (orderId) => {
    const store = window.Store || Store;
    const order = (store.state.orders || []).find(o => o.id === orderId);
    if (!order) return;

    window.openCustomerPortal(orderId);
};

window.downloadOrderQuotationDoc = (orderId) => {
    const store = window.Store || Store;
    const order = (store.state.orders || []).find(o => o.id === orderId);
    if (!order) return;

    const quote = (store.state.quotations || []).find(q => q.id === order.quoteId) || {
        id: order.quoteId || 'QT-APPROVED',
        customer: order.customer,
        date: order.date,
        amount: order.amount,
        advancePayment: order.advancePayment,
        balanceDue: order.balanceDue,
        items: [{ name: order.items, qty: 1, rate: order.amount, total: order.amount }]
    };

    if (typeof window.openPrintQuotationModal === 'function') {
        window.openPrintQuotationModal(quote);
    } else {
        alert(`Downloading approved quotation document for ${order.id}...`);
    }
};

window.openNewOrderModal = () => {
    const store = window.Store || Store;
    const customers = store.state.customers || [];

    const newId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const custOptions = customers.map(c => `<option value="${c.name}">${c.name} (${c.mobile})</option>`).join('');

    const modal = document.createElement('div');
    modal.id = 'manual-new-order-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center; z-index: 100060;
        padding: 1.5rem; font-family: 'Inter', sans-serif;
    `;

    modal.innerHTML = `
        <div class="glass-panel" style="width: 520px; max-width: 95vw; background: #090e17; border: 1.5px solid var(--glass-border); border-radius: 14px; padding: 1.75rem; color: #f8fafc;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700;">Create Manual Manufacturing Order</h3>
                <button type="button" onclick="document.getElementById('manual-new-order-modal').remove()" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 1.2rem;">✕</button>
            </div>

            <form onsubmit="window.saveManualOrder(event, '${newId}')" style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 4px;">Customer Name *</label>
                    <select id="mo-customer" required style="width: 100%; padding: 0.6rem 0.85rem; background: #0f172a; border: 1px solid var(--glass-border); border-radius: 6px; color: white; font-size: 0.88rem;">
                        <option value="" disabled selected>Select Customer</option>
                        ${custOptions}
                    </select>
                </div>

                <div>
                    <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 4px;">Item Description *</label>
                    <input type="text" id="mo-items" required placeholder="e.g. 3-Kalli Sliding Window with SS Mesh" style="width: 100%; padding: 0.6rem 0.85rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 6px; color: white; font-size: 0.88rem;" />
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 4px;">Total Amount (₹) *</label>
                        <input type="number" id="mo-amount" required min="1000" placeholder="50000" style="width: 100%; padding: 0.6rem 0.85rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 6px; color: white; font-size: 0.88rem;" />
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 4px;">Advance Payment (₹)</label>
                        <input type="number" id="mo-advance" min="0" placeholder="15000" style="width: 100%; padding: 0.6rem 0.85rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 6px; color: white; font-size: 0.88rem;" />
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('manual-new-order-modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="font-weight: 700;">Instantiate Order</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
};

window.saveManualOrder = (e, orderId) => {
    e.preventDefault();
    const store = window.Store || Store;
    const custName = document.getElementById('mo-customer').value;
    const custObj = (store.state.customers || []).find(c => c.name === custName) || {};
    const items = document.getElementById('mo-items').value;
    const amount = Number(document.getElementById('mo-amount').value) || 0;
    const advance = Number(document.getElementById('mo-advance').value) || 0;
    const balance = Math.max(0, amount - advance);

    const newOrder = {
        id: orderId,
        quoteId: 'MANUAL-' + Date.now().toString().slice(-4),
        customer: custName,
        customerMobile: custObj.mobile || custObj.phone || '9846112233',
        customerAddress: custObj.address || 'Kozhikode, Kerala',
        items: items,
        amount: amount,
        advancePayment: advance,
        balanceDue: balance,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currentMilestone: 'Order Listed',
        milestones: ['Order Listed', 'Drawing', 'Channel Making', 'Fabrication', 'Painting', 'Packing', 'Dispatched', 'Delivered'],
        milestonesHistory: [{ stage: 'Order Listed', date: new Date().toLocaleString(), by: 'Admin Manual Entry' }],
        assignedTechnician: 'Rajeesh Kumar',
        drawingType: 'image',
        drawingUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2531&auto=format&fit=crop',
        portalCredentials: {
            username: custName,
            password: custObj.mobile || '9846112233',
            active: true,
            generatedAt: new Date().toLocaleString(),
            revokedAt: null
        }
    };

    if (!store.state.orders) store.state.orders = [];
    store.state.orders.unshift(newOrder);

    // Also add to productionOrders
    if (!store.state.productionOrders) store.state.productionOrders = [];
    store.state.productionOrders.unshift({
        id: newOrder.id,
        client: newOrder.customer,
        items: newOrder.items,
        amount: newOrder.amount,
        date: newOrder.date,
        status: 'Order Listed',
        progress: 0,
        technician: 'Rajeesh Kumar',
        drawing: true
    });

    const modal = document.getElementById('manual-new-order-modal');
    if (modal) modal.remove();

    store.saveState();
    store.notify();

    // Auto-dispatch WhatsApp prompt
    window.dispatchOrderWhatsApp(orderId);
};
