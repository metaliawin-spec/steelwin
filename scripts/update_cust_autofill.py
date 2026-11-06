import re

with open('js/modules/calculation.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update customer dropdown item rendering and selection function
old_section = '''    let html = `
        <div style="padding: 5px 10px; background: #f8fafc; font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
            <span>Verified Customers</span>
            <span style="font-size: 0.68rem; color: #0284c7; font-weight: 700;">Click to autofill</span>
        </div>
    `;

    filtered.forEach(c => {
        const escaped = JSON.stringify(c).replace(/"/g, '&quot;');
        html += `
            <div 
                onclick="window.selectStudioCustomer(${escaped})"
                class="calc-search-dropdown-item"
                style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; cursor: pointer; text-align: left;"
            >
                <div style="font-weight: 700; font-size: 0.84rem; color: #0f172a;">${c.name}</div>
                <div style="font-size: 0.72rem; color: #64748b; margin-top: 1px;">
                    ${c.mobile ? '📞 ' + c.mobile : ''} ${c.place ? '• 📍 ' + c.place : ''} ${c.city ? ', ' + c.city : ''}
                </div>
            </div>
        `;
    });

    dd.innerHTML = html;
    dd.style.display = 'block';
};

window.selectStudioCustomer = (c) => {
    if (!c) return;
    let name = c.name || '';
    let mobile = c.mobile || c.phone || '';
    let place = c.place || '';
    let city = c.city || '';
    let pin = c.pincode || c.pin || '';

    // Smart address parser if place/city/pincode are stored combined in c.address
    if (c.address) {
        const pinMatch = c.address.match(/\\b\\d{6}\\b/);
        if (pinMatch && !pin) pin = pinMatch[0];

        const cleanAddr = c.address.replace(/\\b\\d{6}\\b/, '').replace(/[-–]/g, '').trim();
        const parts = cleanAddr.split(',').map(s => s.trim()).filter(Boolean);
        if (!place && parts.length > 0) place = parts[0];
        if (!city && parts.length > 1) city = parts[1];
        if (!city && parts.length === 1) city = parts[0];
    }
    if (!pin) pin = '673001'; // Default valid Kerala postal code fallback
    if (!city && place) city = place;

    const n = document.getElementById('qs-cust-name');
    const m = document.getElementById('qs-cust-mobile');
    const p = document.getElementById('qs-cust-place');
    const ci = document.getElementById('qs-cust-city');
    const pi = document.getElementById('qs-cust-pin');

    if (n) n.value = name;
    if (m) m.value = mobile;
    if (p) p.value = place;
    if (ci) ci.value = city;
    if (pi) pi.value = pin;

    if (Store.state.quoteStudio?.customer) {
        Store.state.quoteStudio.customer.name = name;
        Store.state.quoteStudio.customer.mobile = mobile;
        Store.state.quoteStudio.customer.place = place;
        Store.state.quoteStudio.customer.city = city;
        Store.state.quoteStudio.customer.pincode = pin;
        Store.state.quoteStudio.customer.id = c.id || '';
    }

    const dd = document.getElementById('qs-cust-dropdown');
    if (dd) dd.style.display = 'none';
};
window.selectQuoteCustomer = window.selectStudioCustomer;'''

new_section = '''    let html = `
        <div style="padding: 5px 10px; background: #f8fafc; font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
            <span>Verified Customers</span>
            <span style="font-size: 0.68rem; color: #0284c7; font-weight: 700;">Click to autofill</span>
        </div>
    `;

    window._activeQuoteCustMatches = filtered;
    filtered.forEach((c, idx) => {
        const addrDisplay = [c.place, c.city].filter(Boolean).join(', ') || c.address || '';
        html += `
            <div 
                onclick="window.autofillQuoteWizardCustomerByIndex(${idx})"
                class="calc-search-dropdown-item"
                style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; cursor: pointer; text-align: left;"
            >
                <div style="font-weight: 700; font-size: 0.84rem; color: #0f172a;">${c.name}</div>
                <div style="font-size: 0.72rem; color: #64748b; margin-top: 1px;">
                    ${c.mobile ? '📞 ' + c.mobile : ''} ${addrDisplay ? '• 📍 ' + addrDisplay : ''}
                </div>
            </div>
        `;
    });

    dd.innerHTML = html;
    dd.style.display = 'block';
};

window.autofillQuoteWizardCustomerByIndex = (idx) => {
    const list = window._activeQuoteCustMatches || [];
    const c = list[idx];
    if (c) window.autofillQuoteWizardCustomer(c);
};

window.autofillQuoteWizardCustomer = (c) => {
    if (!c) return;
    let name = c.name || '';
    let mobile = c.mobile || c.phone || '';
    let place = c.place || '';
    let city = c.city || '';
    let pin = c.pincode || c.pin || '';

    // Smart address parser if place/city/pincode are stored combined in c.address
    if (c.address) {
        const pinMatch = c.address.match(/\\b\\d{6}\\b/);
        if (pinMatch && !pin) pin = pinMatch[0];

        const cleanAddr = c.address.replace(/\\b\\d{6}\\b/, '').replace(/[-–]/g, '').trim();
        const parts = cleanAddr.split(',').map(s => s.trim()).filter(Boolean);
        if (!place && parts.length > 0) place = parts[0];
        if (!city && parts.length > 1) city = parts[1];
        if (!city && parts.length === 1) city = parts[0];
    }
    if (!pin) pin = '673001'; // Default valid Kerala postal code fallback
    if (!city && place) city = place;

    const n = document.getElementById('qs-cust-name');
    const m = document.getElementById('qs-cust-mobile');
    const p = document.getElementById('qs-cust-place');
    const ci = document.getElementById('qs-cust-city');
    const pi = document.getElementById('qs-cust-pin');

    if (n) n.value = name;
    if (m) m.value = mobile;
    if (p) p.value = place;
    if (ci) ci.value = city;
    if (pi) pi.value = pin;

    if (Store.state.quoteStudio?.customer) {
        Store.state.quoteStudio.customer.name = name;
        Store.state.quoteStudio.customer.mobile = mobile;
        Store.state.quoteStudio.customer.place = place;
        Store.state.quoteStudio.customer.city = city;
        Store.state.quoteStudio.customer.pincode = pin;
        Store.state.quoteStudio.customer.id = c.id || '';
    }

    const dd = document.getElementById('qs-cust-dropdown');
    if (dd) dd.style.display = 'none';
};'''

if old_section in code:
    code = code.replace(old_section, new_section)
    print("Replaced customer dropdown methods successfully.")
else:
    print("Warning: old_section not found verbatim")

with open('js/modules/calculation.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Saved calculation.js")
