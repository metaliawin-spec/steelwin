import { Store } from '../store.js';

// Global tab and filter state for Customer Profile
let customerActiveTab = 'timeline'; // 'timeline', 'orders', 'sales', 'services', 'purchases', 'quotes'
let timelineFilter = 'all'; // 'all', 'sale', 'service', 'purchase', 'quote'

// Comprehensive Offline PIN Directory for instantaneous auto-population
const PIN_DIRECTORY = {
    '673638': { district: 'Kozhikode', state: 'Kerala', place: 'Kozhikode Malabar Hub' },
    '673001': { district: 'Kozhikode', state: 'Kerala', place: 'Calicut Town' },
    '673004': { district: 'Kozhikode', state: 'Kerala', place: 'West Hill' },
    '676505': { district: 'Malappuram', state: 'Kerala', place: 'Manjeri' },
    '670001': { district: 'Kannur', state: 'Kerala', place: 'Kannur Town' },
    '682030': { district: 'Ernakulam', state: 'Kerala', place: 'Kakkanad' },
    '682001': { district: 'Ernakulam', state: 'Kerala', place: 'Kochi' },
    '680001': { district: 'Thrissur', state: 'Kerala', place: 'Thrissur Town' },
    '695001': { district: 'Thiruvananthapuram', state: 'Kerala', place: 'Trivandrum City' },
    '560001': { district: 'Bengaluru Urban', state: 'Karnataka', place: 'Bengaluru City' },
    '600001': { district: 'Chennai', state: 'Tamil Nadu', place: 'Chennai GPO' },
    '641001': { district: 'Coimbatore', state: 'Tamil Nadu', place: 'Coimbatore Town' },
    '110001': { district: 'Central Delhi', state: 'Delhi', place: 'Connaught Place' },
    '400001': { district: 'Mumbai', state: 'Maharashtra', place: 'Mumbai GPO' },
    '500001': { district: 'Hyderabad', state: 'Telangana', place: 'Hyderabad GPO' }
};

export function renderCustomers(state) {
    const container = document.createElement('div');
    container.className = 'customers-view animate-fade-in';

    // 1. DEDICATED FULL-SCREEN ADD CUSTOMER INTERFACE
    if (state.isAddingCustomer) {
        return renderAddCustomerFullScreen(state);
    }

    // 2. MODERN CUSTOMER PROFILE / CLIENT VIEW
    if (state.selectedCustomer) {
        return renderCustomerProfile(state.selectedCustomer, state);
    }

    // 3. MAIN CUSTOMER LIST VIEW
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 style="font-size: 1.85rem; font-weight: 700; color: var(--color-text-heading); margin: 0; line-height: 1.2;">Client Management</h1>
                <p style="color: var(--color-text-muted); font-size: 0.88rem; margin: 4px 0 0 0;">Manage customer accounts, geo-locations, production milestones, and financial ledgers.</p>
            </div>
            <button class="btn btn-primary" onclick="window.openAddCustomerModal()" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.25rem; font-weight: 600; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                <i data-lucide="user-plus" style="width: 17px; height: 17px;"></i> Add Customer
            </button>
        </div>

        <div class="glass-panel" style="overflow: hidden; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
            <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
                <thead class="sticky-table-header" style="position: sticky; top: 0; z-index: 20; background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">
                    <tr>
                        <th style="padding: 1rem 1.25rem; text-align: left; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600; background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">Customer</th>
                        <th style="padding: 1rem; text-align: left; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600; background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">Contact Details</th>
                        <th style="padding: 1rem; text-align: left; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600; background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">Location / Area</th>
                        <th style="padding: 1rem; text-align: center; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600; background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">Orders</th>
                        <th style="padding: 1rem; text-align: right; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600; background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">Total Invoiced</th>
                        <th style="padding: 1rem; text-align: right; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600; background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">Advance Balance</th>
                        <th style="padding: 1rem 1.25rem; text-align: center; font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600; background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.customers.map(c => `
                        <tr style="border-bottom: 1px solid var(--glass-border-subtle); cursor: pointer; transition: background 0.15s ease;" onclick="window.viewCustomer('${c.id}')" onmouseover="this.style.background='var(--color-primary-subtle)'" onmouseout="this.style.background='transparent'">
                            <td style="padding: 1.1rem 1.25rem; border-bottom: 1px solid var(--glass-border-subtle);">
                                <div style="display: flex; align-items: center; gap: 0.85rem;">
                                    <div style="width: 42px; height: 42px; background: var(--color-primary-subtle); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-weight: 700; border: 1px solid var(--color-primary-border); box-shadow: 0 0 10px var(--color-primary-glow);">
                                        ${c.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style="font-weight: 600; color: var(--color-text-heading); font-size: 0.95rem;">${c.name}</div>
                                        <div style="font-size: 0.74rem; color: var(--color-text-muted); font-family: monospace;">ID: ${c.id}</div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border-subtle);">
                                <div style="font-size: 0.88rem; color: var(--color-text-main); display: flex; align-items: center; gap: 0.4rem;">
                                    <i data-lucide="phone" style="width: 14px; height: 14px; color: var(--color-primary);"></i> 
                                    ${c.mobile || '-'}
                                </div>
                            </td>
                            <td style="padding: 1rem; color: var(--color-text-muted); font-size: 0.88rem; border-bottom: 1px solid var(--glass-border-subtle);">
                                <div style="display: flex; align-items: center; gap: 0.4rem;">
                                    <i data-lucide="map-pin" style="width: 13px; height: 13px; color: var(--color-danger);"></i>
                                    ${c.address || '-'}
                                </div>
                            </td>
                            <td style="padding: 1rem; text-align: center; border-bottom: 1px solid var(--glass-border-subtle);">
                                <span style="background: var(--color-primary-subtle); color: var(--color-primary); padding: 3px 10px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; border: 1px solid var(--color-primary-border);">
                                    ${countOrders(c.name, state.productionOrders || [])}
                                </span>
                            </td>
                            <td style="padding: 1rem; text-align: right; font-weight: 700; color: var(--color-text-heading); font-size: 0.95rem; border-bottom: 1px solid var(--glass-border-subtle);">
                                ₹ ${Number(c.totalValue || 0).toLocaleString('en-IN')}
                            </td>
                            <td style="padding: 1rem; text-align: right; font-weight: 700; color: var(--color-success); font-size: 0.95rem; border-bottom: 1px solid var(--glass-border-subtle);">
                                ₹ ${Number(c.advanceBalance || 0).toLocaleString('en-IN')}
                            </td>
                            <td style="padding: 1rem 1.25rem; text-align: center; border-bottom: 1px solid var(--glass-border-subtle);">
                                <button class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.35rem;" onclick="event.stopPropagation(); window.viewCustomer('${c.id}')">
                                    View Profile <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
    return container;
}

function countOrders(customerName, orders) {
    if (!orders || !customerName) return 0;
    const name = customerName.toLowerCase();
    return orders.filter(o => o.client && o.client.toLowerCase() === name).length;
}

// Global Actions for Customer Module
window.viewCustomer = (idOrName) => {
    const store = window.Store || Store;
    store.state.currentView = 'customers';
    if (!idOrName) {
        store.state.selectedCustomer = null;
    } else {
        const cust = (store.state.customers || []).find(c => c.id === idOrName || c.name.toLowerCase() === String(idOrName).toLowerCase());
        store.state.selectedCustomer = cust ? cust.id : idOrName;
    }
    store.state.isAddingCustomer = false;
    customerActiveTab = 'all';
    timelineFilter = 'all';
    store.notify();
};

window.viewCustomerDetails = window.viewCustomer;

// Back button handler: Navigates back to Customer List
window.backToCustomers = () => {
    const store = window.Store || Store;
    store.state.currentView = 'customers';
    store.state.selectedCustomer = null;
    store.state.isAddingCustomer = false;
    store.notify();
};

window.printCustomerProfile = () => {
    window.print();
};

window.setCustomerActiveTab = (tab) => {
    customerActiveTab = tab;
    let targetId = 'sec-' + tab;
    if (tab === 'overview' || tab === 'client') targetId = 'sec-overview';
    const target = document.getElementById(targetId) || document.getElementById(`customer-${tab}-view`);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.classList.add('profile-section-highlight');
        setTimeout(() => {
            target.classList.remove('profile-section-highlight');
        }, 1600);
    }
};
window.switchCustomerTab = window.setCustomerActiveTab;

window.setCustomerTimelineFilter = (filter) => {
    let normalized = filter;
    if (filter === 'sales') normalized = 'sale';
    if (filter === 'services') normalized = 'service';
    if (filter === 'purchases') normalized = 'purchase';
    if (filter === 'quotes') normalized = 'quote';
    timelineFilter = normalized;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const store = window.Store || Store;
    store.notify();
    requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: 'instant' });
    });
};
window.filterCustomerTimeline = window.setCustomerTimelineFilter;

// Milestone Step Names & Icons for Production Tracking
const ORDER_STAGES = [
    { step: 0, label: 'Order Confirmed', icon: 'check-circle' },
    { step: 1, label: 'Cutting & Prep', icon: 'scissors' },
    { step: 2, label: 'Channel Making', icon: 'layers' },
    { step: 3, label: 'Welding & Fab', icon: 'flame' },
    { step: 4, label: 'Painting & Coat', icon: 'paint-brush' },
    { step: 5, label: 'QC & Assembly', icon: 'shield-check' },
    { step: 6, label: 'Dispatched / Installed', icon: 'truck' }
];

window.updateCustomerOrderStatus = (orderId, newStatusOrStep, maybeProgress) => {
    const store = window.Store || Store;
    const order = (store.state.productionOrders || []).find(o => o.id === orderId);
    if (!order) return;

    let statusText = newStatusOrStep;
    let progressNum = maybeProgress;

    const matchByLabel = ORDER_STAGES.find(s => s.label.toLowerCase() === String(newStatusOrStep).toLowerCase());
    const matchByStep = ORDER_STAGES.find(s => s.step === Number(newStatusOrStep));

    if (matchByLabel) {
        statusText = matchByLabel.label;
        if (progressNum === undefined) progressNum = matchByLabel.step;
    } else if (matchByStep && typeof newStatusOrStep === 'number') {
        statusText = matchByStep.label;
        progressNum = matchByStep.step;
    }

    order.status = statusText;
    if (typeof progressNum === 'number') order.progress = progressNum;
    store.notify();
};

window.saveCustomerNote = (customerId) => {
    const textarea = document.getElementById(`customer-note-${customerId}`);
    if (textarea) {
        const store = window.Store || Store;
        const cust = store.state.customers.find(c => c.id === customerId);
        if (cust) {
            cust.notes = textarea.value;
            store.notify();
            alert('Client note saved successfully!');
        }
    }
};

// =========================================================================
// REQUIREMENT 1 & 2 & 3: FULL-SCREEN "ADD NEW CUSTOMER" INTERFACE
// With Real-Time PIN Code Auto-Fetch for District & State/Category
// =========================================================================

export function renderAddCustomerFullScreen(state) {
    const container = document.createElement('div');
    container.className = 'add-customer-fullscreen animate-fade-in';
    container.style.cssText = 'width: 100%; display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 3rem;';

    container.innerHTML = `
        <!-- Top Navigation Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <button class="btn btn-secondary" onclick="window.closeAddCustomerView()" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;">
                    <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i> Back
                </button>
                <div>
                    <h1 style="margin: 0; font-size: 1.85rem; font-weight: 700; color: var(--color-text-heading); line-height: 1.2;">
                        Add New Customer
                    </h1>
                    <p style="margin: 3px 0 0; font-size: 0.85rem; color: var(--color-text-muted);">
                        Create a dedicated customer profile with postal auto-fetch and financial setup.
                    </p>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <button type="button" class="btn btn-secondary" onclick="window.closeAddCustomerView()" style="padding: 0.6rem 1.25rem;">
                    Cancel
                </button>
                <button type="button" class="btn btn-primary" onclick="document.getElementById('full-screen-customer-form').requestSubmit()" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.5rem; font-weight: 600;">
                    <i data-lucide="check" style="width: 16px; height: 16px;"></i> Save Customer
                </button>
            </div>
        </div>

        <!-- Full-Screen Structured Form Layout -->
        <form id="full-screen-customer-form" onsubmit="window.saveNewCustomer(event)" style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                
                <!-- CARD 1: Basic & Identity Information -->
                <div class="glass-panel customer-identity-card" style="padding: 1.75rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); background: var(--color-bg-card); position: relative; z-index: 100;">
                    <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.85rem;">
                        <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--color-primary-subtle); display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
                            <i data-lucide="user" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 600;">Client Identification</h3>
                            <p style="margin: 2px 0 0; font-size: 0.74rem; color: var(--color-text-muted);">Primary contact & identity records</p>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 1.15rem;">
                        <!-- Full Name / Company Name with Universal Customer Search -->
                        <div>
                            ${window.UniversalCustomerSearch ? window.UniversalCustomerSearch.renderHTML({
                                id: 'cust-identity-search',
                                inputId: 'cust-name',
                                label: 'Full Name / Company Name *',
                                value: '',
                                placeholder: 'Search existing customer or enter new client name...',
                                infoTooltip: 'Search verified clients, leads, and price calculation records, or type a new client name'
                            }) : `
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                                    Full Name / Company Name <span style="color: var(--color-danger);">*</span>
                                </label>
                                <input type="text" id="cust-name" required placeholder="e.g. Green Valley Residency / Dr. Arun Kumar" class="glass-input" style="width: 100%; padding: 0.7rem 0.95rem; font-size: 0.9rem; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-md); color: var(--input-color);">
                            `}
                        </div>

                        <!-- Mobile Phone -->
                        <div>
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                                Mobile Phone Number <span style="color: var(--color-danger);">*</span>
                            </label>
                            <input type="tel" id="cust-phone" required placeholder="e.g. 9846112233" class="glass-input" style="width: 100%; padding: 0.7rem 0.95rem; font-size: 0.9rem; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-md); color: var(--input-color);">
                        </div>

                        <!-- Email Address -->
                        <div>
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                                Email Address
                            </label>
                            <input type="email" id="cust-email" placeholder="e.g. client@project.com" class="glass-input" style="width: 100%; padding: 0.7rem 0.95rem; font-size: 0.9rem; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-md); color: var(--input-color);">
                        </div>

                        <!-- Customer Category / Type -->
                        <div>
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                                Customer Type / Segment
                            </label>
                            <select id="cust-category" class="glass-input" style="width: 100%; padding: 0.7rem 0.95rem; font-size: 0.9rem; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-md); color: var(--input-color);">
                                <option value="Individual Residential">Individual Residential (Villa / Homeowner)</option>
                                <option value="Commercial Developer">Commercial Developer / Builder</option>
                                <option value="Architect & Consultant">Architect / Interior Consultant</option>
                                <option value="Institutional / Hospital">Institutional / Healthcare / Hospital</option>
                                <option value="Contractor">Fabrication Subcontractor</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- CARD 2: Required Location Fields & PIN Code Auto-Fetch Logic -->
                <div class="glass-panel" style="padding: 1.75rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); background: var(--color-bg-card);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.85rem;">
                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--color-primary-subtle); display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
                                <i data-lucide="map-pin" style="width: 18px; height: 18px;"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 600;">Geographic & Postal Location</h3>
                                <p style="margin: 2px 0 0; font-size: 0.74rem; color: var(--color-text-muted);">Automated postal lookup via PIN code</p>
                            </div>
                        </div>

                        <!-- Live Auto-fetch Badge -->
                        <span id="pincode-fetch-badge" style="font-size: 0.72rem; padding: 3px 9px; border-radius: 9999px; background: var(--color-primary-subtle); color: var(--color-primary); font-weight: 600; display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--color-primary-border);">
                            <i data-lucide="zap" style="width: 12px; height: 12px;"></i> API Auto-Fill Active
                        </span>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 1.15rem;">
                        <!-- PIN Code Input (With instant auto-fetch listener) -->
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                                <label style="font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading);">
                                    PIN Code <span style="color: var(--color-danger);">*</span>
                                </label>
                                <span style="font-size: 0.72rem; color: var(--color-text-muted);">Enter 6-digit PIN code (e.g. 673638, 682030)</span>
                            </div>
                            <div style="position: relative;">
                                <input type="text" id="cust-pincode" maxlength="6" required placeholder="e.g. 673638" oninput="window.handlePincodeAutoFetch(this.value)" class="glass-input" style="width: 100%; padding: 0.7rem 0.95rem; font-size: 1rem; font-weight: 700; letter-spacing: 2px; font-family: monospace; background: var(--input-bg); border: 1px solid var(--color-primary-border); border-radius: var(--radius-md); color: var(--color-primary);">
                                <span id="pincode-spinner" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--color-success); display: none;">
                                    ✓ Auto-fetched
                                </span>
                            </div>
                            <div id="pincode-status-text" style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 4px;">
                                Auto-populates District and State automatically upon 6 digits.
                            </div>
                        </div>

                        <!-- Place / Location (Required) -->
                        <div>
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                                Place / Location <span style="color: var(--color-danger);">*</span>
                            </label>
                            <input type="text" id="cust-place" required placeholder="e.g. Kozhikode Malabar / Kakkanad" class="glass-input" style="width: 100%; padding: 0.7rem 0.95rem; font-size: 0.9rem; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-md); color: var(--input-color);">
                        </div>

                        <!-- 2-Column: District & State (Auto-populated by PIN Code) -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <!-- District (Required) -->
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                                    District <span style="color: var(--color-danger);">*</span>
                                </label>
                                <input type="text" id="cust-district" required placeholder="e.g. Kozhikode" class="glass-input" style="width: 100%; padding: 0.7rem 0.95rem; font-size: 0.9rem; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-md); color: var(--input-color);">
                            </div>

                            <!-- State / Region -->
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                                    State / Category <span style="color: var(--color-danger);">*</span>
                                </label>
                                <input type="text" id="cust-state" required value="Kerala" placeholder="e.g. Kerala" class="glass-input" style="width: 100%; padding: 0.7rem 0.95rem; font-size: 0.9rem; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-md); color: var(--input-color);">
                            </div>
                        </div>

                        <!-- Complete Address / Landmark -->
                        <div>
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                                Detailed Site Address / Landmark
                            </label>
                            <textarea id="cust-address" class="glass-input" style="width: 100%; height: 60px; padding: 0.6rem 0.85rem; font-size: 0.85rem; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-md); color: var(--input-color); resize: none;" placeholder="House/Plot No., Street, Building Name..."></textarea>
                        </div>
                    </div>
                </div>

            </div>

            <!-- CARD 3: Financial Balances & Project Specifications -->
            <div class="glass-panel" style="padding: 1.75rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); background: var(--color-bg-card);">
                <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.85rem;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(34, 197, 94, 0.2); display: flex; align-items: center; justify-content: center; color: var(--color-success);">
                        <i data-lucide="credit-card" style="width: 18px; height: 18px;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; color: var(--color-text-heading); font-weight: 600;">Financial & Site Settings</h3>
                        <p style="margin: 2px 0 0; font-size: 0.74rem; color: var(--color-text-muted);">Initial advance ledger & site instructions</p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div>
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                            Initial Advance Balance (₹)
                        </label>
                        <input type="number" id="cust-advance" value="0" min="0" class="glass-input" style="width: 100%; padding: 0.7rem 0.95rem; font-size: 0.95rem; font-weight: 700; color: var(--color-success); background: var(--input-bg); border: 1px solid var(--color-success); border-radius: var(--radius-md);">
                        <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 4px;">Advance will automatically credit against customer's future invoices.</div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading); margin-bottom: 0.4rem;">
                            Special Project Notes / Installation Remarks
                        </label>
                        <textarea id="cust-notes" class="glass-input" style="width: 100%; height: 50px; padding: 0.6rem 0.85rem; font-size: 0.85rem; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-md); color: var(--input-color); resize: none;" placeholder="e.g. Requires heavy crane access on 3rd floor; anodized champagne finish."></textarea>
                    </div>
                </div>
            </div>

            <!-- Bottom Action Row -->
            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 0.5rem;">
                <button type="button" class="btn btn-secondary" onclick="window.closeAddCustomerView()" style="padding: 0.75rem 1.75rem; font-size: 0.9rem;">
                    Cancel
                </button>
                <button type="submit" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 2rem; font-weight: 700; font-size: 0.95rem;">
                    <i data-lucide="check" style="width: 18px; height: 18px;"></i> Save Customer
                </button>
            </div>

        </form>
    `;

    setTimeout(() => { 
        if (window.lucide) window.lucide.createIcons(); 
        if (window.UniversalCustomerSearch) {
            window.UniversalCustomerSearch.register('cust-identity-search', {
                onSelect: (cust) => {
                    window.populateCustomerIdentity(cust);
                },
                onClear: () => {
                    window.clearCustomerIdentity();
                }
            });
        }
    }, 0);
    return container;
}

// Full-screen Open / Close Handlers
window.openAddCustomerModal = () => {
    const store = window.Store || Store;
    store.state.isAddingCustomer = true;
    store.state.selectedCustomer = null;
    store.notify();
};

window.closeAddCustomerView = () => {
    const store = window.Store || Store;
    store.state.isAddingCustomer = false;
    store.notify();
};

// Auto-populate customer fields when selected from Universal Customer Search
window.populateCustomerIdentity = (cust) => {
    if (!cust) return;
    const nameInput = document.getElementById('cust-name');
    const phoneInput = document.getElementById('cust-phone');
    const emailInput = document.getElementById('cust-email');
    const categorySelect = document.getElementById('cust-category');
    const pincodeInput = document.getElementById('cust-pincode');
    const districtInput = document.getElementById('cust-district');
    const stateInput = document.getElementById('cust-state');
    const placeInput = document.getElementById('cust-place');
    const addressInput = document.getElementById('cust-address');
    const advanceInput = document.getElementById('cust-advance');
    const notesInput = document.getElementById('cust-notes');

    if (nameInput) nameInput.value = cust.name || '';
    if (phoneInput) phoneInput.value = cust.mobile || cust.phone || '';
    if (emailInput) emailInput.value = (cust.raw && cust.raw.email) || cust.email || '';
    if (categorySelect && cust.raw && cust.raw.category) {
        categorySelect.value = cust.raw.category;
    }
    const pin = cust.pincode || (cust.raw && cust.raw.pincode);
    if (pincodeInput && pin) {
        pincodeInput.value = pin;
        window.handlePincodeAutoFetch(pin);
    }
    if (districtInput && (cust.district || (cust.raw && cust.raw.district))) {
        districtInput.value = cust.district || cust.raw.district;
    }
    if (stateInput && (cust.state || (cust.raw && cust.raw.state))) {
        stateInput.value = cust.state || cust.raw.state;
    }
    if (placeInput && (cust.place || (cust.raw && cust.raw.place))) {
        placeInput.value = cust.place || cust.raw.place;
    }
    const addr = cust.street || (cust.raw && cust.raw.street) || cust.address || (cust.raw && cust.raw.address) || '';
    if (addressInput && addr) {
        addressInput.value = addr;
    }
    if (advanceInput && cust.advanceBalance !== undefined) {
        advanceInput.value = cust.advanceBalance;
    }
    if (notesInput && (cust.notes || (cust.raw && cust.raw.notes))) {
        notesInput.value = cust.notes || cust.raw.notes;
    }
};

window.clearCustomerIdentity = () => {
    const fields = ['cust-name', 'cust-phone', 'cust-email', 'cust-pincode', 'cust-place', 'cust-district', 'cust-state', 'cust-address', 'cust-notes'];
    fields.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = '';
    });
    const adv = document.getElementById('cust-advance');
    if (adv) adv.value = '0';
    const statusText = document.getElementById('pincode-status-text');
    if (statusText) statusText.innerHTML = '<span style="color: #64748b;">Auto-populates District and State automatically upon 6 digits.</span>';
};

// =========================================================================
// REAL-TIME PIN CODE AUTO-FETCH LOGIC (API + INSTANT OFFLINE DIRECTORY)
// =========================================================================
window.handlePincodeAutoFetch = (rawPincode) => {
    const pincode = String(rawPincode || '').trim();
    const spinner = document.getElementById('pincode-spinner');
    const statusText = document.getElementById('pincode-status-text');
    const districtInput = document.getElementById('cust-district');
    const stateInput = document.getElementById('cust-state');
    const placeInput = document.getElementById('cust-place');

    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
        if (spinner) spinner.style.display = 'none';
        if (statusText) statusText.innerHTML = '<span style="color: #64748b;">Auto-populates District and State automatically upon 6 digits.</span>';
        return;
    }

    if (spinner) {
        spinner.style.display = 'block';
        spinner.style.color = '#38bdf8';
        spinner.innerText = '⚡ Fetching...';
    }

    // Step 1: Immediate Instant Lookup via PIN_DIRECTORY (0ms latency fallback)
    if (PIN_DIRECTORY[pincode]) {
        const entry = PIN_DIRECTORY[pincode];
        if (districtInput) districtInput.value = entry.district;
        if (stateInput) stateInput.value = entry.state;
        if (placeInput && !placeInput.value.trim()) placeInput.value = entry.place;

        if (spinner) {
            spinner.style.display = 'block';
            spinner.style.color = '#4ade80';
            spinner.innerText = '✓ Auto-fetched';
        }
        if (statusText) {
            statusText.innerHTML = `<span style="color: #4ade80; font-weight: 600;">✓ Auto-filled: ${entry.district}, ${entry.state} (${entry.place})</span>`;
        }
    }

    // Step 2: Live India Postal PIN API Call for comprehensive nationwide coverage
    try {
        fetch(`https://api.postalpincode.in/pincode/${pincode}`)
            .then(res => res.json())
            .then(data => {
                if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
                    const po = data[0].PostOffice[0];
                    if (districtInput) districtInput.value = po.District;
                    if (stateInput) stateInput.value = po.State;
                    if (placeInput && !placeInput.value.trim()) placeInput.value = po.Name;

                    if (spinner) {
                        spinner.style.display = 'block';
                        spinner.style.color = '#4ade80';
                        spinner.innerText = '✓ Auto-fetched';
                    }
                    if (statusText) {
                        statusText.innerHTML = `<span style="color: #4ade80; font-weight: 600;">✓ Auto-fetched from Postal API: ${po.District}, ${po.State} (${po.Name})</span>`;
                    }
                }
            })
            .catch(err => {
                // If offline or network error, fallback is already gracefully applied via Step 1
                console.log('Postal API network response:', err.message);
            });
    } catch (e) {
        // Fallback silently
    }
};

window.saveNewCustomer = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    let name = document.getElementById('cust-name')?.value?.trim();
    if (!name && window.UniversalCustomerSearch) {
        name = window.UniversalCustomerSearch.getValue('cust-identity-search');
    }
    const mobile = document.getElementById('cust-phone')?.value?.trim();
    const pincode = document.getElementById('cust-pincode')?.value?.trim();
    const place = document.getElementById('cust-place')?.value?.trim();
    const district = document.getElementById('cust-district')?.value?.trim();
    const state = document.getElementById('cust-state')?.value?.trim() || 'Kerala';
    const street = document.getElementById('cust-address')?.value?.trim() || '';
    const category = document.getElementById('cust-category')?.value || 'Individual Residential';
    const advanceBalance = parseFloat(document.getElementById('cust-advance')?.value) || 0;
    const notes = document.getElementById('cust-notes')?.value?.trim() || '';

    if (!name || !mobile) {
        alert('Please fill out Full Name and Mobile Phone.');
        return;
    }

    // Structured address string
    const fullAddress = [place, district, state, pincode].filter(Boolean).join(', ');

    const store = window.Store || Store;
    const newId = 'C-00' + ((store.state.customers || []).length + 1);

    const newCustomer = {
        id: newId,
        name,
        mobile,
        address: fullAddress,
        place,
        district,
        state,
        pincode,
        street,
        category,
        orders: 0,
        totalValue: 0,
        advanceBalance,
        notes
    };

    store.state.customers.push(newCustomer);
    store.state.isAddingCustomer = false;
    store.state.selectedCustomer = newId; // Navigate straight to modern profile
    store.notify();

    alert(`Customer "${name}" created successfully with District: ${district}, State: ${state}!`);
};

// =========================================================================
// REQUIREMENT 1, 2 & 3: MODERNIZED CUSTOMER PROFILE / CLIENT VIEW
// - Back button text strictly updated to 'Back'
// - 'Long Service' / 'Log Service' label and option COMPLETELY REMOVED
// - Polished executive dashboard styling, real-time margins, and KPI tiles
// =========================================================================

function renderCustomerProfile(customerId, state) {
    const customer = state.customers.find(c => c.id === customerId || c.name.toLowerCase() === String(customerId).toLowerCase());
    if (!customer) return document.createElement('div');

    const customerNameLower = customer.name.toLowerCase();

    // 1. Gather all related data
    const orders = (state.productionOrders || []).filter(o => o.client && o.client.toLowerCase() === customerNameLower);
    const quotations = (state.quotations || []).filter(q => q.customer && q.customer.toLowerCase() === customerNameLower);
    const sales = (state.sales || []).filter(s => s.customer && s.customer.toLowerCase() === customerNameLower);
    const services = (state.services || []).filter(s => s.customer && s.customer.toLowerCase() === customerNameLower);
    const purchases = (state.purchases || []).filter(p => p.client && p.client.toLowerCase() === customerNameLower);
    const costSheets = customer.costSheets || [];

    // Financial calculations
    const totalBilled = sales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || customer.totalValue || 0;
    const totalAdvance = customer.advanceBalance || 0;
    const pendingBalance = sales.reduce((sum, s) => sum + (Number(s.balance !== undefined ? s.balance : s.amount) || 0), 0);
    const totalPurchasesCost = purchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Direct Customer Profit & Margin (Matching Leo AI Precision)
    const netProfit = totalBilled - totalPurchasesCost;
    const profitMarginPct = totalBilled > 0 ? ((netProfit / totalBilled) * 100).toFixed(1) : 0;

    // 2. Build Unified Timeline Events
    let timelineEvents = [];

    // Add Sales Invoices
    sales.forEach(s => {
        timelineEvents.push({
            id: s.id,
            type: 'sale',
            category: 'Sales Invoice',
            date: s.date || '2025-12-01',
            title: `Tax Invoice Generated — ${s.id}`,
            description: s.items || 'Standard Window Installation',
            amount: Number(s.amount) || 0,
            advance: Number(s.advancePayment || s.paidAmount || 0),
            balance: Number(s.balance !== undefined ? s.balance : 0),
            status: s.status || 'Paid',
            statusColor: s.status === 'Paid' ? '#10b981' : s.status === 'Overdue' ? '#ef4444' : '#f59e0b',
            icon: 'credit-card',
            actionText: 'Print Invoice',
            actionFn: `window.openPrintInvoiceModalById('${s.id}')`
        });
    });

    // Add Services & Maintenance
    services.forEach(srv => {
        const serviceTitle = srv.title || srv.issue || 'Window Service & Maintenance';
        const serviceNotes = srv.notes || srv.details || srv.resolutionDetails?.notes || 'Completed service visit';
        timelineEvents.push({
            id: srv.id,
            type: 'service',
            category: 'Service & Maintenance',
            date: srv.date || '2026-01-01',
            title: `${serviceTitle} (${srv.id})`,
            description: `Technician: ${srv.technician || 'Field Team'} • Notes: ${serviceNotes}`,
            amount: Number(srv.cost) || 0,
            status: srv.status || 'Completed',
            statusColor: srv.status === 'Completed' ? '#10b981' : '#3b82f6',
            icon: 'wrench',
            actionText: 'Service Ticket'
        });
    });

    // Add Material Procurement / Purchases for client's projects
    purchases.forEach(p => {
        timelineEvents.push({
            id: p.id,
            type: 'purchase',
            category: 'Material Procurement',
            date: p.date || '2025-12-01',
            title: `Procurement: ${p.items}`,
            description: `Supplier: ${p.vendor} • PO: ${p.id}`,
            amount: Number(p.amount) || 0,
            status: p.status || 'Delivered',
            statusColor: '#6366f1',
            icon: 'shopping-bag',
            actionText: 'PO Details'
        });
    });

    // Add Quotations
    quotations.forEach(q => {
        timelineEvents.push({
            id: q.id,
            type: 'quote',
            category: 'Quotation / Estimate',
            date: q.date || '2025-12-01',
            title: `Quotation Prepared — ${q.id}`,
            description: (q.items && q.items.length) ? q.items.map(i => i.name).join(', ') : 'Custom Fabrication Estimate',
            amount: Number(q.amount) || 0,
            status: q.status || 'Draft',
            statusColor: q.status === 'Approved' ? '#10b981' : '#f59e0b',
            icon: 'file-text',
            actionText: 'Print Quote',
            actionFn: `window.openPrintQuotationModalById('${q.id}')`
        });
    });

    // Add Saved Designs / Cost Sheets
    costSheets.forEach(cs => {
        timelineEvents.push({
            id: cs.id,
            type: 'quote',
            category: 'Design & Cost Sheet',
            date: cs.date || '2025-12-01',
            title: `Custom Design Saved: ${cs.design}`,
            description: `Dimensions: ${cs.dimensions} | Area: ${cs.area}`,
            amount: Number(cs.cost) || 0,
            status: 'Design Saved',
            statusColor: '#06b6d4',
            icon: 'calculator',
            actionText: 'View Spec'
        });
    });

    // Sort timeline by date descending
    timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter timeline based on user selection
    const filteredTimeline = timelineEvents.filter(ev => {
        if (timelineFilter === 'all') return true;
        return ev.type === timelineFilter;
    });

    const container = document.createElement('div');
    container.className = 'customer-profile animate-fade-in';
    container.style.cssText = 'padding: 0.25rem 0 3.5rem; display: flex; flex-direction: column; gap: 1.75rem; width: 100%;';

    container.innerHTML = `
        <!-- Top Navigation Header: STRICTLY UPDATED BACK BUTTON ("Back") & NO "Long Service" BUTTON -->
        <div class="glass-panel" style="padding: 1.15rem 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; background: var(--color-bg-card);">
            <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <!-- Updated Back Button: Changed strictly from 'Back to Client' to 'Back' -->
                <button class="btn btn-secondary" onclick="window.backToCustomers()" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; font-weight: 600;">
                    <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i> Back
                </button>
                
                <div style="display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;">
                    <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #0284c7, #6366f1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.35rem; font-weight: 800; color: white; box-shadow: 0 0 16px rgba(56, 189, 248, 0.4); border: 2px solid rgba(255,255,255,0.2);">
                        ${customer.name.charAt(0)}
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                            <h1 style="margin: 0; font-size: 1.65rem; font-weight: 700; color: var(--color-text-heading); letter-spacing: -0.3px;">
                                ${customer.name}
                            </h1>
                            <span style="padding: 3px 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 9999px; font-size: 0.76rem; font-weight: 700; font-family: monospace;">
                                ${customer.id}
                            </span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 2px; font-size: 0.78rem; color: var(--color-text-muted);">
                            <span>${customer.category || 'Individual Residential'}</span>
                            <span>•</span>
                            <span style="display: inline-flex; align-items: center; gap: 4px; color: #4ade80;">
                                <span style="width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px #22c55e;"></span>
                                Active Client
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Action Hub: Completely removed 'Long Service' / 'Log Service' label & option -->
            <div style="display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap;">
                <button class="btn btn-secondary" onclick="window.printCustomerProfile()" style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; padding: 0.5rem 0.95rem;">
                    <i data-lucide="printer" style="width: 15px; height: 15px; color: #38bdf8;"></i> Print Profile
                </button>
                <button class="btn btn-secondary" onclick="window.quickCreateForCustomer('quote', '${customer.name}')" style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; padding: 0.5rem 0.95rem;">
                    <i data-lucide="file-plus" style="width: 15px; height: 15px; color: #fbbf24;"></i> + New Quote
                </button>
                <button class="btn btn-primary" onclick="window.quickCreateForCustomer('invoice', '${customer.name}')" style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; padding: 0.5rem 1rem; font-weight: 600;">
                    <i data-lucide="shopping-cart" style="width: 15px; height: 15px;"></i> + New Invoice
                </button>
            </div>
        </div>

        <!-- Sticky Quick Navigation Jump Ribbon (Smooth Scroll - No Swiping or Hidden Content) -->
        <div class="profile-jump-bar glass-panel" style="position: sticky; top: 0; z-index: 100; backdrop-filter: blur(16px); background: var(--table-sticky-header-bg); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 0.65rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);">
            <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.6px; display: flex; align-items: center; gap: 0.35rem; margin-right: 0.35rem;">
                    <i data-lucide="compass" style="width: 14px; height: 14px; color: #38bdf8;"></i> Quick Jump:
                </span>
                <button class="jump-chip" onclick="window.setCustomerActiveTab('overview')"><i data-lucide="user" style="width: 13px; height: 13px;"></i> Overview</button>
                <button class="jump-chip" onclick="window.setCustomerActiveTab('orders')"><i data-lucide="package" style="width: 13px; height: 13px;"></i> Orders (${orders.length})</button>
                <button class="jump-chip" onclick="window.setCustomerActiveTab('sales')"><i data-lucide="credit-card" style="width: 13px; height: 13px;"></i> Invoices (${sales.length})</button>
                <button class="jump-chip" onclick="window.setCustomerActiveTab('quotes')"><i data-lucide="file-text" style="width: 13px; height: 13px;"></i> Quotes (${quotations.length + costSheets.length})</button>
                <button class="jump-chip" onclick="window.setCustomerActiveTab('purchases')"><i data-lucide="shopping-bag" style="width: 13px; height: 13px;"></i> POs (${purchases.length})</button>
                <button class="jump-chip" onclick="window.setCustomerActiveTab('services')"><i data-lucide="wrench" style="width: 13px; height: 13px;"></i> Services (${services.length})</button>
                <button class="jump-chip" onclick="window.setCustomerActiveTab('timeline')"><i data-lucide="activity" style="width: 13px; height: 13px;"></i> Activity Timeline (${timelineEvents.length})</button>
            </div>
            <div style="font-size: 0.74rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 0.4rem;">
                <i data-lucide="layout" style="width: 13px; height: 13px; color: #38bdf8;"></i> Full-Page Expanded View
            </div>
        </div>

        <!-- 4 Top Executive Financial & Operations KPI Cards -->
        <div id="sec-kpis" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.25rem;">
            <!-- 1. Total Invoiced -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-md); background: var(--color-bg-card); border: 1px solid rgba(56, 189, 248, 0.25); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.25rem;">
                        <div style="width: 22px; height: 22px; border-radius: 5px; background: rgba(56, 189, 248, 0.2); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                            <i data-lucide="trending-up" style="width: 12px; height: 12px;"></i>
                        </div>
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase;">Total Invoiced</span>
                    </div>
                    <div style="font-size: 1.45rem; font-weight: 800; color: var(--color-text-heading); letter-spacing: -0.3px;">
                        ₹ ${Number(totalBilled).toLocaleString('en-IN')}
                    </div>
                    <div style="font-size: 0.68rem; color: #38bdf8; margin-top: 2px;">Recognized sales revenue</div>
                </div>
                <div style="width: 70px; height: 32px; opacity: 0.85;">
                    <svg viewBox="0 0 100 32" style="width: 100%; height: 100%;">
                        <path d="M 0,25 Q 30,12 60,18 T 100,4" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
                        <circle cx="100" cy="4" r="3.5" fill="#38bdf8" />
                    </svg>
                </div>
            </div>

            <!-- 2. Available Advance -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-md); background: var(--color-bg-card); border: 1px solid rgba(34, 197, 94, 0.25); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.25rem;">
                        <div style="width: 22px; height: 22px; border-radius: 5px; background: rgba(34, 197, 94, 0.2); display: flex; align-items: center; justify-content: center; color: #4ade80;">
                            <i data-lucide="wallet" style="width: 12px; height: 12px;"></i>
                        </div>
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase;">Advance Balance</span>
                    </div>
                    <div style="font-size: 1.45rem; font-weight: 800; color: #4ade80; letter-spacing: -0.3px;">
                        ₹ ${Number(totalAdvance).toLocaleString('en-IN')}
                    </div>
                    <div style="font-size: 0.68rem; color: #4ade80; margin-top: 2px;">Ready for auto-deduction</div>
                </div>
                <div style="width: 70px; height: 32px; opacity: 0.85;">
                    <svg viewBox="0 0 100 32" style="width: 100%; height: 100%;">
                        <path d="M 0,22 Q 25,26 50,15 T 100,5" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
                        <circle cx="100" cy="5" r="3.5" fill="#22c55e" />
                    </svg>
                </div>
            </div>

            <!-- 3. Pending Receivables -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-md); background: var(--color-bg-card); border: 1px solid rgba(245, 158, 11, 0.25); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.25rem;">
                        <div style="width: 22px; height: 22px; border-radius: 5px; background: rgba(245, 158, 11, 0.2); display: flex; align-items: center; justify-content: center; color: #fbbf24;">
                            <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                        </div>
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase;">Pending Balance</span>
                    </div>
                    <div style="font-size: 1.45rem; font-weight: 800; color: ${pendingBalance > 0 ? '#fbbf24' : 'var(--color-text-muted)'}; letter-spacing: -0.3px;">
                        ₹ ${Number(pendingBalance).toLocaleString('en-IN')}
                    </div>
                    <div style="font-size: 0.68rem; color: var(--color-text-muted); margin-top: 2px;">${pendingBalance > 0 ? 'Awaiting collection' : 'Fully settled'}</div>
                </div>
                <div style="width: 70px; height: 32px; opacity: 0.85;">
                    <svg viewBox="0 0 100 32" style="width: 100%; height: 100%;">
                        <path d="M 0,20 Q 25,25 50,16 T 100,8" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" />
                        <circle cx="100" cy="8" r="3.5" fill="#f59e0b" />
                    </svg>
                </div>
            </div>

            <!-- 4. Active Orders -->
            <div class="glass-panel" style="padding: 1.15rem 1.25rem; border-radius: var(--radius-md); background: var(--color-bg-card); border: 1px solid rgba(168, 85, 247, 0.25); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.25rem;">
                        <div style="width: 22px; height: 22px; border-radius: 5px; background: rgba(168, 85, 247, 0.2); display: flex; align-items: center; justify-content: center; color: #c084fc;">
                            <i data-lucide="hammer" style="width: 12px; height: 12px;"></i>
                        </div>
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase;">Active Orders</span>
                    </div>
                    <div style="font-size: 1.45rem; font-weight: 800; color: var(--color-text-heading); letter-spacing: -0.3px;">
                        ${orders.length}
                    </div>
                    <div style="font-size: 0.68rem; color: #c084fc; margin-top: 2px;">${orders.filter(o => o.progress < 6).length} in active fabrication</div>
                </div>
                <div style="width: 70px; height: 32px; opacity: 0.85;">
                    <svg viewBox="0 0 100 32" style="width: 100%; height: 100%;">
                        <path d="M 0,24 Q 25,10 60,16 T 100,6" fill="none" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round" />
                        <circle cx="100" cy="6" r="3.5" fill="#a855f7" />
                    </svg>
                </div>
            </div>
        </div>

        <!-- Section 1: Expanded Client Logistics & Identity, Customer Profit & Margin, Notes -->
        <div id="sec-overview" class="profile-section-card" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
            <!-- Card 1: Client Logistics & Identity -->
            <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); display: flex; flex-direction: column; justify-content: space-between; background: var(--color-bg-card);">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.85rem;">
                            <div style="width: 54px; height: 54px; background: linear-gradient(135deg, #0284c7, #6366f1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 800; color: white; box-shadow: 0 0 16px rgba(56, 189, 248, 0.4); border: 2px solid rgba(255,255,255,0.2);">
                                ${customer.name.charAt(0)}
                            </div>
                            <div>
                                <h3 style="font-size: 1.18rem; font-weight: 700; color: var(--color-text-heading); margin: 0;">${customer.name}</h3>
                                <div style="font-size: 0.76rem; color: var(--color-text-muted); font-family: monospace;">Account ID: ${customer.id}</div>
                            </div>
                        </div>
                        <span style="font-size: 0.74rem; font-weight: 600; color: #38bdf8; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 9999px;">
                            ${customer.category || 'Client'}
                        </span>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem; margin-top: 1rem;">
                        <div style="display: flex; gap: 0.75rem; align-items: center;">
                            <div style="width: 28px; height: 28px; background: var(--color-bg-surface-glass); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                                <i data-lucide="phone" style="width: 13px; height: 13px;"></i>
                            </div>
                            <div>
                                <span style="font-size: 0.72rem; color: var(--color-text-muted);">Phone:</span>
                                <strong style="color: var(--color-text-heading); margin-left: 4px;">${customer.mobile || 'Not specified'}</strong>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                            <div style="width: 28px; height: 28px; background: var(--color-bg-surface-glass); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #ef4444; margin-top: 2px;">
                                <i data-lucide="map-pin" style="width: 13px; height: 13px;"></i>
                            </div>
                            <div>
                                <span style="font-size: 0.72rem; color: var(--color-text-muted);">Delivery Location:</span>
                                <div style="font-weight: 600; color: var(--color-text-heading);">${customer.address || 'Not specified'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); padding-top: 1rem; margin-top: 1.25rem; border-top: 1px solid var(--glass-border); text-align: center;">
                    <div>
                        <div style="font-weight: 800; font-size: 1.15rem; color: #38bdf8;">${orders.length}</div>
                        <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase;">Orders</div>
                    </div>
                    <div>
                        <div style="font-weight: 800; font-size: 1.15rem; color: #4ade80;">${sales.length}</div>
                        <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase;">Invoices</div>
                    </div>
                    <div>
                        <div style="font-weight: 800; font-size: 1.15rem; color: #c084fc;">${quotations.length}</div>
                        <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase;">Quotes</div>
                    </div>
                </div>
            </div>

            <!-- Card 2: Customer Profitability & Financial Health (Real-Time Leo Analytics) -->
            <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid rgba(34, 197, 94, 0.3); background: var(--color-bg-card); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--color-text-heading); display: flex; align-items: center; gap: 0.45rem;">
                            <i data-lucide="pie-chart" style="width: 17px; height: 17px; color: #4ade80;"></i> Customer Profit & Margin
                        </h4>
                        <span style="font-size: 0.75rem; font-weight: 800; color: #4ade80; background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.4); padding: 3px 10px; border-radius: 9999px;">
                            ${profitMarginPct}% Margin
                        </span>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.84rem;">
                        <div style="display: flex; justify-content: space-between; color: var(--color-text-muted);">
                            <span>Invoiced Revenue:</span>
                            <strong style="color: var(--color-text-heading);">₹ ${Number(totalBilled).toLocaleString('en-IN')}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: var(--color-text-muted);">
                            <span>Direct Job Expenses (POs):</span>
                            <strong style="color: #f87171;">₹ ${Number(totalPurchasesCost).toLocaleString('en-IN')}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #4ade80; border-top: 1px solid var(--glass-border); padding-top: 0.6rem; font-weight: 700; font-size: 0.95rem;">
                            <span>Net Account Profit:</span>
                            <span>₹ ${Number(netProfit).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                <!-- Margin Progress Bar -->
                <div style="margin-top: 1.25rem; padding-top: 0.75rem; border-top: 1px solid var(--glass-border);">
                    <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--color-text-muted); margin-bottom: 0.35rem;">
                        <span>Operating Margin Health</span>
                        <strong style="color: #4ade80;">${profitMarginPct}% Gross Yield</strong>
                    </div>
                    <div style="height: 6px; width: 100%; background: var(--glass-border); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: ${Math.min(Math.max(profitMarginPct, 0), 100)}%; background: linear-gradient(90deg, #22c55e, #38bdf8); border-radius: 3px;"></div>
                    </div>
                </div>
            </div>

            <!-- Card 3: Client Notes & Job Preferences -->
            <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); display: flex; flex-direction: column; justify-content: space-between; background: var(--color-bg-card);">
                <div>
                    <h4 style="margin: 0 0 0.75rem; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: #38bdf8; font-weight: 600;">
                        <i data-lucide="file-text" style="width: 16px; height: 16px;"></i> Client Notes & Specifications
                    </h4>
                    <p style="font-size: 0.76rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">Persistent notes regarding site access, architectural drawings, and preferences.</p>
                    <textarea id="customer-note-${customer.id}" 
                              style="width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-sm); padding: 0.7rem; color: var(--input-color); min-height: 90px; resize: vertical; font-size: 0.84rem; font-family: inherit; line-height: 1.4;" 
                              placeholder="Record client preferences, site contact, delivery notes...">${customer.notes || ''}</textarea>
                </div>
                <button class="btn btn-secondary" onclick="window.saveCustomerNote('${customer.id}')" style="margin-top: 0.75rem; width: 100%; font-size: 0.82rem; padding: 0.5rem; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;">
                    <i data-lucide="save" style="width: 14px; height: 14px;"></i> Save Notes
                </button>
            </div>
        </div>

        <!-- Section 2: Product Order Tracking -->
        <div id="sec-orders" class="profile-section-card glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); background: var(--color-bg-card);">
            ${renderCustomerOrderTracking(orders, customer)}
        </div>

        <!-- Section 3: Commercial Ledgers (Invoices & Formal Quotations) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(460px, 1fr)); gap: 1.5rem;">
            <div id="sec-sales" class="profile-section-card glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); background: var(--color-bg-card);">
                ${renderCustomerSalesTab(sales, customer)}
            </div>
            <div id="sec-quotes" class="profile-section-card glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); background: var(--color-bg-card);">
                ${renderCustomerQuotesTab(quotations, costSheets, customer)}
            </div>
        </div>

        <!-- Section 4: Operations & Procurement (POs & Maintenance Services) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(460px, 1fr)); gap: 1.5rem;">
            <div id="sec-purchases" class="profile-section-card glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); background: var(--color-bg-card);">
                ${renderCustomerPurchasesTab(purchases, customer)}
            </div>
            <div id="sec-services" class="profile-section-card glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); background: var(--color-bg-card);">
                ${renderCustomerServicesTab(services, customer)}
            </div>
        </div>

        <!-- Section 5: Activity & Transaction History -->
        <div id="sec-timeline" class="profile-section-card glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border); background: var(--color-bg-card);">
            ${renderCustomerTimeline(filteredTimeline, customer)}
        </div>
    `;

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
    return container;
}

// =========================================================================
// SUB-VIEWS FOR CUSTOMER PROFILE TABS
// =========================================================================

function renderCustomerOrderTracking(orders, customer) {
    if (!orders || orders.length === 0) {
        return `
            <div class="glass-panel" style="padding: 3rem; text-align: center; color: var(--color-text-muted); border-radius: var(--radius-lg);">
                <i data-lucide="package" style="width: 48px; height: 48px; margin-bottom: 1rem; color: #64748b;"></i>
                <h3 style="margin: 0 0 0.5rem; color: white;">No Product Orders Found</h3>
                <p style="margin: 0 0 1.5rem; font-size: 0.9rem;">There are currently no manufacturing orders recorded for ${customer.name}.</p>
                <button class="btn btn-primary" onclick="window.quickCreateForCustomer('quote', '${customer.name}')">
                    Create Quotation to Generate Order
                </button>
            </div>
        `;
    }

    return `
        <div id="customer-orders-view" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--color-text-heading);">Product Order Tracking</h3>
                    <p style="margin: 2px 0 0; font-size: 0.82rem; color: var(--color-text-muted);">Detailed milestone tracking and fabrication progress for ${customer.name}.</p>
                </div>
                <span style="font-size: 0.85rem; color: #4ade80; font-weight: 600;">
                    ${orders.filter(o => o.progress >= 6).length} Delivered • ${orders.filter(o => o.progress < 6).length} In Production
                </span>
            </div>

            ${orders.map(order => {
                const currentProgress = order.progress || 0;
                const pct = Math.round((Math.min(currentProgress, 6) / 6) * 100);

                return `
                    <div class="glass-panel card order-card" style="padding: 1.75rem; border: 1px solid var(--glass-border); border-radius: var(--radius-lg); background: var(--color-bg-card);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <span style="font-size: 1.25rem; font-weight: 800; color: #38bdf8;">${order.id}</span>
                                    <span style="padding: 3px 10px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; background: ${currentProgress >= 6 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)'}; color: ${currentProgress >= 6 ? '#4ade80' : '#38bdf8'}; border: 1px solid ${currentProgress >= 6 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(56, 189, 248, 0.4)'};">
                                        ${order.status}
                                    </span>
                                    ${order.drawing ? `
                                        <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: rgba(147, 51, 234, 0.2); color: #c084fc; border: 1px solid rgba(147, 51, 234, 0.3);">
                                            📐 CAD Specs Approved
                                        </span>
                                    ` : ''}
                                </div>
                                <div style="font-size: 1rem; font-weight: 600; margin-top: 0.5rem; color: var(--color-text-heading);">
                                    ${order.items}
                                </div>
                            </div>

                            <div style="text-align: right; font-size: 0.85rem;">
                                <div style="color: var(--color-text-muted);">Order Date: <strong style="color:var(--color-text-heading);">${order.date}</strong></div>
                                ${order.targetDate ? `<div style="color: #fbbf24; margin-top: 2px;">Target Delivery: <strong>${order.targetDate}</strong></div>` : ''}
                                ${order.amount ? `<div style="font-weight: 700; color: #4ade80; font-size: 1.15rem; margin-top: 4px;">₹ ${Number(order.amount).toLocaleString('en-IN')}</div>` : ''}
                            </div>
                        </div>

                        <!-- Stepper -->
                        <div style="margin: 1.75rem 0 1.25rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--color-text-muted);">
                                <span>Fabrication Journey</span>
                                <span style="font-weight: 700; color: ${pct === 100 ? '#4ade80' : '#38bdf8'};">${pct}% Complete</span>
                            </div>
                            <div style="position: relative; margin: 1.5rem 0.5rem 2rem;">
                                <div style="position: absolute; top: 18px; left: 0; right: 0; height: 4px; background: var(--glass-border); border-radius: 2px; z-index: 1;"></div>
                                <div style="position: absolute; top: 18px; left: 0; width: ${pct}%; height: 4px; background: linear-gradient(90deg, #38bdf8, #22c55e); border-radius: 2px; z-index: 2; transition: width 0.4s ease;"></div>

                                <div style="display: flex; justify-content: space-between; position: relative; z-index: 3;">
                                    ${ORDER_STAGES.map((st) => {
                                        const isCompleted = currentProgress > st.step;
                                        const isCurrent = currentProgress === st.step;
                                        let nodeBg = 'var(--color-bg-surface-glass)';
                                        let nodeColor = 'var(--color-text-muted)';
                                        let borderColor = 'var(--glass-border)';

                                        if (isCompleted) {
                                            nodeBg = '#22c55e';
                                            nodeColor = 'white';
                                            borderColor = '#22c55e';
                                        } else if (isCurrent) {
                                            nodeBg = '#38bdf8';
                                            nodeColor = 'white';
                                            borderColor = '#38bdf8';
                                        }

                                        return `
                                            <div style="display: flex; flex-direction: column; align-items: center; width: 80px; text-align: center;">
                                                <div style="width: 36px; height: 36px; border-radius: 50%; background: ${nodeBg}; border: 2px solid ${borderColor}; color: ${nodeColor}; display: flex; align-items: center; justify-content: center; font-size: 0.88rem; box-shadow: ${isCurrent ? '0 0 14px rgba(56, 189, 248, 0.6)' : 'none'};">
                                                    ${isCompleted ? '✓' : (st.step + 1)}
                                                </div>
                                                <div style="font-size: 0.72rem; margin-top: 8px; font-weight: ${isCurrent ? '700' : '500'}; color: ${isCurrent ? '#38bdf8' : (isCompleted ? '#a7f3d0' : 'var(--color-text-muted)')}; line-height: 1.2;">
                                                    ${st.label}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Assigned Tech & Stage Updater -->
                        <div style="background: var(--color-bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                            <div style="display: flex; gap: 1.5rem; align-items: center; font-size: 0.85rem;">
                                <div>
                                    <span style="color: var(--color-text-muted);">Fabricator:</span>
                                    <strong style="color: var(--color-text-heading); margin-left: 4px;">${order.technician || 'Factory Team'}</strong>
                                </div>
                                ${order.notes ? `
                                    <div style="color: var(--color-text-main); border-left: 1px solid var(--glass-border); padding-left: 1.5rem;">
                                        <span style="color: var(--color-text-muted);">Specs:</span> ${order.notes}
                                    </div>
                                ` : ''}
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <label style="font-size: 0.8rem; color: var(--color-text-muted);">Update Status:</label>
                                <select onchange="window.updateCustomerOrderStatus('${order.id}', (this.options[this.selectedIndex] ? this.options[this.selectedIndex].text : this.value), parseInt(this.value))" 
                                        style="background: var(--input-bg); color: var(--input-color); border: 1px solid var(--input-border); border-radius: 4px; padding: 4px 8px; font-size: 0.82rem; cursor: pointer;">
                                    ${ORDER_STAGES.map(st => `
                                        <option value="${st.step}" ${currentProgress === st.step ? 'selected' : ''}>${st.label}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderCustomerTimeline(timelineEvents, customer) {
    return `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--color-text-heading);">Activity & Transaction History</h3>
                    <p style="margin: 2px 0 0; font-size: 0.82rem; color: var(--color-text-muted);">Unified chronological log of Sales, Services, Purchases, and Estimates.</p>
                </div>
                
                <div style="display: flex; gap: 0.35rem; background: var(--color-bg-card); padding: 4px; border-radius: 8px; border: 1px solid var(--glass-border);">
                    <button onclick="window.setCustomerTimelineFilter('all')" 
                            style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.78rem; cursor: pointer; background: ${timelineFilter === 'all' ? 'var(--color-primary)' : 'transparent'}; color: ${timelineFilter === 'all' ? 'white' : 'var(--color-text-muted)'}; font-weight: 500;">
                        All
                    </button>
                    <button onclick="window.setCustomerTimelineFilter('sale')" 
                            style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.78rem; cursor: pointer; background: ${timelineFilter === 'sale' ? '#10b981' : 'transparent'}; color: ${timelineFilter === 'sale' ? 'white' : 'var(--color-text-muted)'}; font-weight: 500;">
                        💳 Sales
                    </button>
                    <button onclick="window.setCustomerTimelineFilter('service')" 
                            style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.78rem; cursor: pointer; background: ${timelineFilter === 'service' ? '#0284c7' : 'transparent'}; color: ${timelineFilter === 'service' ? 'white' : 'var(--color-text-muted)'}; font-weight: 500;">
                        🔧 Services
                    </button>
                    <button onclick="window.setCustomerTimelineFilter('purchase')" 
                            style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.78rem; cursor: pointer; background: ${timelineFilter === 'purchase' ? '#6366f1' : 'transparent'}; color: ${timelineFilter === 'purchase' ? 'white' : 'var(--color-text-muted)'}; font-weight: 500;">
                        🛒 Purchases
                    </button>
                    <button onclick="window.setCustomerTimelineFilter('quote')" 
                            style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.78rem; cursor: pointer; background: ${timelineFilter === 'quote' ? '#eab308' : 'transparent'}; color: ${timelineFilter === 'quote' ? 'white' : 'var(--color-text-muted)'}; font-weight: 500;">
                        📄 Quotes
                    </button>
                </div>
            </div>

            ${timelineEvents.length === 0 ? `
                <div class="glass-panel" style="padding: 3rem; text-align: center; color: var(--color-text-muted); border-radius: var(--radius-lg); background: var(--color-bg-card); border: 1px solid var(--glass-border);">
                    <i data-lucide="clock" style="width: 48px; height: 48px; margin-bottom: 1rem; color: #64748b;"></i>
                    <p style="margin: 0;">No activities matching the selected filter.</p>
                </div>
            ` : `
                <div id="customer-timeline-container" style="position: relative; padding-left: 28px; margin-top: 1rem;">
                    <div style="position: absolute; top: 12px; bottom: 12px; left: 10px; width: 2px; background: var(--glass-border);"></div>
                    <div style="display: flex; flex-direction: column; gap: 1.15rem;">
                        ${timelineEvents.map(event => `
                            <div class="timeline-item" style="position: relative;">
                                <div style="position: absolute; left: -24px; top: 16px; width: 14px; height: 14px; border-radius: 50%; background: ${event.statusColor || 'var(--color-primary)'}; border: 3px solid var(--color-bg-surface-glass); box-shadow: 0 0 8px ${event.statusColor || 'var(--color-primary)'};"></div>
                                <div class="glass-panel" style="padding: 1.25rem; border: 1px solid var(--glass-border); border-radius: var(--radius-md); background: var(--color-bg-card);">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                                            <span style="font-size: 0.72rem; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; font-weight: 700; background: var(--color-bg-surface-glass); color: ${event.statusColor || '#aaa'};">
                                                ${event.category}
                                            </span>
                                            <span style="font-size: 0.8rem; color: var(--color-text-muted);">
                                                ${event.date}
                                            </span>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <span style="padding: 2px 8px; border-radius: 9999px; font-size: 0.74rem; font-weight: 600; background: var(--color-bg-surface-glass); color: ${event.statusColor || '#aaa'};">
                                                ${event.status}
                                            </span>
                                            ${event.amount ? `
                                                <span style="font-weight: 700; font-size: 1rem; color: var(--color-text-heading);">
                                                    ₹ ${event.amount.toLocaleString('en-IN')}
                                                </span>
                                            ` : ''}
                                        </div>
                                    </div>

                                    <h4 style="margin: 0 0 0.35rem; font-size: 1rem; color: var(--color-text-heading); font-weight: 600;">
                                        ${event.title}
                                    </h4>
                                    <p style="margin: 0; font-size: 0.85rem; color: var(--color-text-muted);">
                                        ${event.description}
                                    </p>

                                    ${(event.type === 'sale' && (event.advance || event.balance !== undefined)) ? `
                                        <div style="display: flex; gap: 1.5rem; margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px dashed var(--glass-border); font-size: 0.8rem;">
                                            ${event.advance ? `<span style="color: #4ade80;">Advance Paid: <strong>₹${event.advance.toLocaleString('en-IN')}</strong></span>` : ''}
                                            <span style="color: ${event.balance > 0 ? '#fbbf24' : '#4ade80'};">Balance Due: <strong>₹${event.balance.toLocaleString('en-IN')}</strong></span>
                                        </div>
                                    ` : ''}

                                    ${event.actionFn ? `
                                        <div style="margin-top: 0.75rem; text-align: right;">
                                            <button class="btn btn-secondary" onclick="${event.actionFn}" style="padding: 0.3rem 0.7rem; font-size: 0.78rem;">
                                                <i data-lucide="printer" style="width: 14px; height: 14px;"></i> ${event.actionText}
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `}
        </div>
    `;
}

function renderCustomerSalesTab(sales, customer) {
    return `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--color-text-heading);">Sales Invoices</h3>
                <button class="btn btn-primary" onclick="window.quickCreateForCustomer('invoice', '${customer.name}')" style="font-size: 0.82rem; padding: 0.45rem 0.95rem;">
                    <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Create Invoice
                </button>
            </div>
            <div class="glass-panel" style="overflow: hidden; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
                <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.88rem;">
                    <thead class="sticky-table-header" style="background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">
                        <tr>
                            <th style="padding: 0.85rem; text-align: left; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Invoice #</th>
                            <th style="padding: 0.85rem; text-align: left; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Date</th>
                            <th style="padding: 0.85rem; text-align: left; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Items / Work Description</th>
                            <th style="padding: 0.85rem; text-align: right; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Amount</th>
                            <th style="padding: 0.85rem; text-align: right; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Balance</th>
                            <th style="padding: 0.85rem; text-align: center; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sales.map(s => `
                            <tr style="border-bottom: 1px solid var(--glass-border);">
                                <td style="padding: 0.85rem; font-family: monospace; font-weight: 600; color: #38bdf8; border-bottom: 1px solid var(--glass-border);">${s.id}</td>
                                <td style="padding: 0.85rem; color: var(--color-text-main); border-bottom: 1px solid var(--glass-border);">${s.date}</td>
                                <td style="padding: 0.85rem; color: var(--color-text-muted); border-bottom: 1px solid var(--glass-border);">${s.items}</td>
                                <td style="padding: 0.85rem; text-align: right; font-weight: 700; color: #4ade80; border-bottom: 1px solid var(--glass-border);">₹ ${(s.amount || 0).toLocaleString('en-IN')}</td>
                                <td style="padding: 0.85rem; text-align: right; color: ${s.balance > 0 ? '#fbbf24' : 'var(--color-text-muted)'}; border-bottom: 1px solid var(--glass-border);">₹ ${(s.balance || 0).toLocaleString('en-IN')}</td>
                                <td style="padding: 0.85rem; text-align: center; border-bottom: 1px solid var(--glass-border);">
                                    <span style="padding: 2px 8px; border-radius: 9999px; font-size: 0.74rem; font-weight: 600; background: ${s.status === 'Paid' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${s.status === 'Paid' ? '#4ade80' : '#fbbf24'};">
                                        ${s.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                        ${sales.length === 0 ? '<tr><td colspan="6" style="padding: 2rem; text-align: center; color: var(--color-text-muted);">No invoices generated yet.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCustomerServicesTab(services, customer) {
    return `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--color-text-heading);">Service Records</h3>
                <span style="font-size: 0.8rem; color: var(--color-text-muted);">Total Maintenance History</span>
            </div>
            <div class="glass-panel" style="overflow: hidden; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
                <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.88rem;">
                    <thead class="sticky-table-header" style="background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">
                        <tr>
                            <th style="padding: 0.85rem; text-align: left; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Service ID</th>
                            <th style="padding: 0.85rem; text-align: left; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Title</th>
                            <th style="padding: 0.85rem; text-align: left; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Technician</th>
                            <th style="padding: 0.85rem; text-align: center; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Date</th>
                            <th style="padding: 0.85rem; text-align: right; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Cost</th>
                            <th style="padding: 0.85rem; text-align: center; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${services.map(srv => `
                            <tr style="border-bottom: 1px solid var(--glass-border);">
                                <td style="padding: 0.85rem; font-family: monospace; font-weight: 600; color: #38bdf8; border-bottom: 1px solid var(--glass-border);">${srv.id}</td>
                                <td style="padding: 0.85rem; color: var(--color-text-heading); border-bottom: 1px solid var(--glass-border);">${srv.title || srv.issue || 'Service'}</td>
                                <td style="padding: 0.85rem; color: var(--color-text-main); border-bottom: 1px solid var(--glass-border);">${srv.technician}</td>
                                <td style="padding: 0.85rem; text-align: center; color: var(--color-text-muted); border-bottom: 1px solid var(--glass-border);">${srv.date}</td>
                                <td style="padding: 0.85rem; text-align: right; font-weight: 600; color: var(--color-text-heading); border-bottom: 1px solid var(--glass-border);">₹ ${(srv.cost || 0).toLocaleString('en-IN')}</td>
                                <td style="padding: 0.85rem; text-align: center; border-bottom: 1px solid var(--glass-border);">
                                    <span style="padding: 2px 8px; border-radius: 9999px; font-size: 0.74rem; font-weight: 600; background: rgba(34, 197, 94, 0.2); color: #4ade80;">
                                        ${srv.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                        ${services.length === 0 ? '<tr><td colspan="6" style="padding: 2rem; text-align: center; color: var(--color-text-muted);">No service visits recorded for this client.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCustomerPurchasesTab(purchases, customer) {
    return `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--color-text-heading);">Project Procurement (Material Expenses)</h3>
                <span style="font-size: 0.8rem; color: var(--color-text-muted);">Direct site expenses</span>
            </div>
            <div class="glass-panel" style="overflow: hidden; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
                <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.88rem;">
                    <thead class="sticky-table-header" style="background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">
                        <tr>
                            <th style="padding: 0.85rem; text-align: left; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">PO #</th>
                            <th style="padding: 0.85rem; text-align: left; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Vendor / Supplier</th>
                            <th style="padding: 0.85rem; text-align: left; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Materials / Items</th>
                            <th style="padding: 0.85rem; text-align: center; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Date</th>
                            <th style="padding: 0.85rem; text-align: right; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Cost</th>
                            <th style="padding: 0.85rem; text-align: center; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${purchases.map(p => `
                            <tr style="border-bottom: 1px solid var(--glass-border);">
                                <td style="padding: 0.85rem; font-family: monospace; font-weight: 600; color: #a78bfa; border-bottom: 1px solid var(--glass-border);">${p.id}</td>
                                <td style="padding: 0.85rem; font-weight: 600; color: var(--color-text-heading); border-bottom: 1px solid var(--glass-border);">${p.vendor}</td>
                                <td style="padding: 0.85rem; color: var(--color-text-muted); border-bottom: 1px solid var(--glass-border);">${p.items}</td>
                                <td style="padding: 0.85rem; text-align: center; color: var(--color-text-main); border-bottom: 1px solid var(--glass-border);">${p.date}</td>
                                <td style="padding: 0.85rem; text-align: right; font-weight: 700; color: #f87171; border-bottom: 1px solid var(--glass-border);">₹ ${Number(p.amount).toLocaleString('en-IN')}</td>
                                <td style="padding: 0.85rem; text-align: center; border-bottom: 1px solid var(--glass-border);">
                                    <span style="padding: 2px 8px; border-radius: 9999px; font-size: 0.74rem; font-weight: 600; background: rgba(99, 102, 241, 0.2); color: #818cf8;">
                                        ${p.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                        ${purchases.length === 0 ? '<tr><td colspan="6" style="padding: 2rem; text-align: center; color: var(--color-text-muted);">No project specific purchase orders found.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCustomerQuotesTab(quotations, costSheets, customer) {
    return `
        <div>
            <div style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--color-text-heading);">Formal Quotations</h3>
                    <button class="btn btn-primary" onclick="window.quickCreateForCustomer('quote', '${customer.name}')" style="font-size: 0.82rem; padding: 0.45rem 0.95rem;">
                        <i data-lucide="plus" style="width: 14px; height: 14px;"></i> New Quotation
                    </button>
                </div>
                <div class="glass-panel" style="overflow: hidden; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
                    <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.88rem;">
                        <thead class="sticky-table-header" style="background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border);">
                            <tr>
                                <th style="padding: 0.85rem; text-align: left; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Quote ID</th>
                                <th style="padding: 0.85rem; text-align: left; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Date</th>
                                <th style="padding: 0.85rem; text-align: right; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Amount</th>
                                <th style="padding: 0.85rem; text-align: center; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Status</th>
                                <th style="padding: 0.85rem; text-align: center; color: var(--color-text-muted); background: var(--table-sticky-header-bg);">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${quotations.map(q => `
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.85rem; font-family: monospace; font-weight: 600; color: #38bdf8; border-bottom: 1px solid var(--glass-border);">${q.id}</td>
                                    <td style="padding: 0.85rem; color: var(--color-text-main); border-bottom: 1px solid var(--glass-border);">${q.date}</td>
                                    <td style="padding: 0.85rem; text-align: right; font-weight: 700; color: #4ade80; border-bottom: 1px solid var(--glass-border);">₹ ${Number(q.amount).toLocaleString('en-IN')}</td>
                                    <td style="padding: 0.85rem; text-align: center; border-bottom: 1px solid var(--glass-border);">
                                        <span style="padding: 2px 8px; border-radius: 9999px; font-size: 0.74rem; font-weight: 600; background: ${q.status === 'Approved' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${q.status === 'Approved' ? '#4ade80' : '#fbbf24'};">
                                            ${q.status}
                                        </span>
                                    </td>
                                    <td style="padding: 0.85rem; text-align: center; border-bottom: 1px solid var(--glass-border);">
                                        <button class="btn btn-secondary" onclick="window.openPrintQuotationModalById('${q.id}')" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;">
                                            <i data-lucide="printer" style="width: 14px; height: 14px;"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${quotations.length === 0 ? '<tr><td colspan="5" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">No formal quotations on file.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Calculation Cost Sheets -->
            <div>
                <h3 style="margin: 0 0 1rem; font-size: 1.25rem; font-weight: 700; color: var(--color-text-heading);">Custom Window Cost Sheets & CAD Specs</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${costSheets.map(cs => `
                        <div class="glass-panel" style="padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border); background: var(--color-bg-card);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem;">
                                <div>
                                    <strong style="color: #38bdf8; font-size: 1.1rem;">${cs.design}</strong>
                                    <span style="color: var(--color-text-muted); font-size: 0.85rem; margin-left: 10px;">${cs.dimensions} | ${cs.area}</span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 800; font-size: 1.15rem; color: #4ade80;">₹ ${Number(cs.cost).toLocaleString('en-IN')}</div>
                                    <div style="color: var(--color-text-muted); font-size: 0.75rem;">${cs.date}</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 2rem; font-size: 0.82rem; color: var(--color-text-muted);">
                                <div>
                                    <strong style="color: var(--color-text-heading);">Materials:</strong><br/>
                                    • Frame: ${cs.materials?.frame || 'MS Box Profile'}<br/>
                                    • Panel: ${cs.materials?.panel || 'Glazing'}
                                </div>
                                <div>
                                    <strong style="color: var(--color-text-heading);">Fabrication Specs:</strong><br/>
                                    • Total Weight: <span style="color: #90caf9;">${cs.materials?.weight || '-'}</span><br/>
                                    • Pipe Length: <span style="color: #a5d6a7;">${cs.materials?.length || '-'}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    ${costSheets.length === 0 ? '<div class="glass-panel" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted); border-radius: var(--radius-md); background: var(--color-bg-card); border: 1px solid var(--glass-border);">No cost sheets saved from calculation.</div>' : ''}
                </div>
            </div>
        </div>
    `;
}

// Quick action launcher for customer
window.quickCreateForCustomer = (type, customerName) => {
    const store = window.Store || Store;
    if (type === 'invoice') {
        store.navigate('sales');
        setTimeout(() => {
            if (window.initCreateInvoice) {
                window.initCreateInvoice();
                if (window.selectInvCustomer) window.selectInvCustomer(customerName);
            }
        }, 100);
    } else if (type === 'quote') {
        store.navigate('quotations');
        setTimeout(() => {
            if (window.initCreateQuotation) {
                window.initCreateQuotation();
                if (window.selectQuoteCustomer) window.selectQuoteCustomer(customerName);
            }
        }, 100);
    }
};
