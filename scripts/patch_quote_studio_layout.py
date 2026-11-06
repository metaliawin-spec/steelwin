import os

calc_path = r'c:\Users\anshi\OneDrive\Documents\code\code project\js\modules\calculation.js'

with open(calc_path, 'r', encoding='utf-8') as f:
    content = f.read()

target_step1_and_2 = """                        <!-- STEP 1: CUSTOMER DETAILS (5 MANDATORY FIELDS) -->
                        <div style="background: var(--color-bg-main); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem 1.1rem;">
                            <div style="margin-bottom: 0.6rem;">
                                <span style="font-size: 0.82rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                                    Step 1: Customer Details (All 5 Fields Mandatory)
                                </span>
                            </div>

                            <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; margin-bottom: 10px;">
                                <div style="position: relative;">
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">1. Customer Name *</label>
                                    <input 
                                        type="text" 
                                        id="qs-cust-name" 
                                        required 
                                        value="${cust.name || ''}" 
                                        placeholder="Full Name or Business Name" 
                                        class="glass-input" 
                                        autocomplete="off"
                                        onfocus="window.showQuoteCustDropdown(this.value)"
                                        oninput="window.handleQuoteCustInput(this.value)"
                                        style="width: 100%; font-size: 0.88rem; font-weight: 600; padding: 6px 10px; color: #0f172a !important; background: #ffffff !important;"
                                    >
                                    <div 
                                        id="qs-cust-dropdown" 
                                        style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; max-height: 220px; overflow-y: auto; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; box-shadow: 0 10px 25px rgba(15,23,42,0.18); z-index: 1000; text-align: left;"
                                    ></div>
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">5. Mobile Number *</label>
                                    <input type="tel" id="qs-cust-mobile" required value="${cust.mobile || ''}" placeholder="10-digit mobile number" class="glass-input" style="width: 100%; font-size: 0.88rem; font-weight: 600; padding: 6px 10px; color: #0f172a !important; background: #ffffff !important;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">2. Place *</label>
                                    <input type="text" id="qs-cust-place" required value="${cust.place || ''}" placeholder="Area / Locality" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 6px 10px; color: #0f172a !important; background: #ffffff !important;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">3. City *</label>
                                    <input type="text" id="qs-cust-city" required value="${cust.city || ''}" placeholder="City / Town" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 6px 10px; color: #0f172a !important; background: #ffffff !important;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">4. Pincode *</label>
                                    <input type="text" id="qs-cust-pin" required value="${cust.pincode || ''}" placeholder="6-digit postal PIN" class="glass-input" style="width: 100%; font-size: 0.85rem; padding: 6px 10px; color: #0f172a !important; background: #ffffff !important;">
                                </div>
                            </div>
                        </div>

                        <!-- STEP 2: DEFAULT MATERIAL PRESETS WITH 'NONE' OPTION -->
                        <div style="background: var(--color-bg-main); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem 1.1rem;">
                            <div style="margin-bottom: 0.65rem;">
                                <span style="font-size: 0.84rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                                    Step 2: Quotation Material Presets
                                </span>
                                <div style="font-size: 0.74rem; color: var(--color-text-muted); margin-top: 3px;">
                                    Select the default materials for this customer's windows. Every material includes a '-- None (Not Included) --' option.
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(115px, 1fr)); gap: 8px;">
                                <!-- Profile -->
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">1. Profile / Frame</label>
                                    <select id="qs-mat-frame" class="glass-input quotation-preset-select" style="width: 100%; padding: 7px 8px; font-size: 0.8rem; cursor: pointer;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['profile', 'frame'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.frame === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Pipe -->
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">2. Pipe</label>
                                    <select id="qs-mat-pipe" class="glass-input quotation-preset-select" style="width: 100%; padding: 7px 8px; font-size: 0.8rem; cursor: pointer;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['pipe', 'tube'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.pipe === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Panel -->
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">3. Panel</label>
                                    <select id="qs-mat-panel" class="glass-input quotation-preset-select" style="width: 100%; padding: 7px 8px; font-size: 0.8rem; cursor: pointer;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['panel', 'sheet', 'glass'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.panel === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Hinges -->
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">4. Hinges</label>
                                    <select id="qs-mat-hinge" class="glass-input quotation-preset-select" style="width: 100%; padding: 7px 8px; font-size: 0.8rem; cursor: pointer;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['hinges', 'hinge'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.hinge === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Lock & Accessories -->
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">5. Lock & Accessories</label>
                                    <select id="qs-mat-lock" class="glass-input quotation-preset-select" style="width: 100%; padding: 7px 8px; font-size: 0.8rem; cursor: pointer;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['lock', 'lock & accessories', 'accessories'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.lock === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Hook & Rubber -->
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">6. Hook & Rubber</label>
                                    <select id="qs-mat-hook" class="glass-input quotation-preset-select" style="width: 100%; padding: 7px 8px; font-size: 0.8rem; cursor: pointer;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['hook', 'hook & rubber', 'rubber'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.hook === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Paint -->
                                <div>
                                    <label style="display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 3px;">7. Paint</label>
                                    <select id="qs-mat-paint" class="glass-input quotation-preset-select" style="width: 100%; padding: 7px 8px; font-size: 0.8rem; cursor: pointer;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['paint', 'coating'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.paint === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>"""

replacement_step1_and_2 = """                        <!-- STEP 1: CUSTOMER DETAILS (5 MANDATORY FIELDS) -->
                        <div style="background: var(--color-bg-main); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1.15rem 1.35rem;">
                            <div style="margin-bottom: 0.75rem;">
                                <span style="font-size: 0.86rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                                    Step 1: Customer Details (All 5 Fields Mandatory)
                                </span>
                            </div>

                            <!-- Row 1: 4:1 Ratio (Customer Name 4fr : Mobile Number 1fr) with Increased Input Height -->
                            <div style="display: grid; grid-template-columns: 4fr 1fr; gap: 14px; margin-bottom: 14px;">
                                <div style="position: relative;">
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">1. Customer Name *</label>
                                    <input 
                                        type="text" 
                                        id="qs-cust-name" 
                                        required 
                                        value="${cust.name || ''}" 
                                        placeholder="Full Name or Business Name" 
                                        class="glass-input" 
                                        autocomplete="off"
                                        onfocus="window.showQuoteCustDropdown(this.value)"
                                        oninput="window.handleQuoteCustInput(this.value)"
                                        style="width: 100%; height: 44px; font-size: 0.95rem; font-weight: 600; padding: 10px 14px; color: #0f172a !important; background: #ffffff !important; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                    >
                                    <div 
                                        id="qs-cust-dropdown" 
                                        style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; max-height: 240px; overflow-y: auto; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; box-shadow: 0 12px 28px rgba(15,23,42,0.2); z-index: 1000; text-align: left;"
                                    ></div>
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">5. Mobile Number *</label>
                                    <input 
                                        type="tel" 
                                        id="qs-cust-mobile" 
                                        required 
                                        value="${cust.mobile || ''}" 
                                        placeholder="10-digit mobile number" 
                                        class="glass-input" 
                                        style="width: 100%; height: 44px; font-size: 0.95rem; font-weight: 600; padding: 10px 14px; color: #0f172a !important; background: #ffffff !important; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                    >
                                </div>
                            </div>

                            <!-- Row 2: Location & Address Fields with Increased Input Height -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">2. Place *</label>
                                    <input 
                                        type="text" 
                                        id="qs-cust-place" 
                                        required 
                                        value="${cust.place || ''}" 
                                        placeholder="Area / Locality" 
                                        class="glass-input" 
                                        style="width: 100%; height: 44px; font-size: 0.92rem; padding: 10px 14px; color: #0f172a !important; background: #ffffff !important; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                    >
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">3. City *</label>
                                    <input 
                                        type="text" 
                                        id="qs-cust-city" 
                                        required 
                                        value="${cust.city || ''}" 
                                        placeholder="City / Town" 
                                        class="glass-input" 
                                        style="width: 100%; height: 44px; font-size: 0.92rem; padding: 10px 14px; color: #0f172a !important; background: #ffffff !important; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                    >
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">4. Pincode *</label>
                                    <input 
                                        type="text" 
                                        id="qs-cust-pin" 
                                        required 
                                        value="${cust.pincode || ''}" 
                                        placeholder="6-digit postal PIN" 
                                        class="glass-input" 
                                        style="width: 100%; height: 44px; font-size: 0.92rem; padding: 10px 14px; color: #0f172a !important; background: #ffffff !important; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                    >
                                </div>
                            </div>
                        </div>

                        <!-- STEP 2: DEFAULT MATERIAL PRESETS WITH INCREASED HEIGHT & CLEAR PADDING -->
                        <div style="background: var(--color-bg-main); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1.15rem 1.35rem;">
                            <div style="margin-bottom: 0.75rem;">
                                <span style="font-size: 0.86rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                                    Step 2: Quotation Material Presets
                                </span>
                                <div style="font-size: 0.76rem; color: var(--color-text-muted); margin-top: 3px;">
                                    Select the default materials for this customer's windows. Every material includes a '-- None (Not Included) --' option.
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
                                <!-- Profile -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">1. Profile / Frame</label>
                                    <select id="qs-mat-frame" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['profile', 'frame'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.frame === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Pipe -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">2. Pipe</label>
                                    <select id="qs-mat-pipe" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['pipe', 'tube'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.pipe === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Panel -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">3. Panel</label>
                                    <select id="qs-mat-panel" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['panel', 'sheet', 'glass'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.panel === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Hinges -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">4. Hinges</label>
                                    <select id="qs-mat-hinge" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['hinges', 'hinge'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.hinge === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Lock & Accessories -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px; white-space: nowrap;">5. Lock & Accessories</label>
                                    <select id="qs-mat-lock" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['lock', 'lock & accessories', 'accessories'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.lock === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Hook & Rubber -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px; white-space: nowrap;">6. Hook & Rubber</label>
                                    <select id="qs-mat-hook" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['hook', 'hook & rubber', 'rubber'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.hook === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Paint -->
                                <div>
                                    <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">7. Paint</label>
                                    <select id="qs-mat-paint" class="glass-input quotation-preset-select" style="width: 100%; height: 44px; padding: 9px 10px; font-size: 0.86rem; cursor: pointer; border-radius: 6px;">
                                        <option value="none">-- None (Not Included) --</option>
                                        ${catalog.filter(m => ['paint', 'coating'].includes((m.category || '').toLowerCase())).map(m => `
                                            <option value="${m.id}" ${mats.paint === m.id ? 'selected' : ''}>${m.name} (₹${m.rate})</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>"""

assert target_step1_and_2 in content, "target_step1_and_2 not found!"
content = content.replace(target_step1_and_2, replacement_step1_and_2, 1)

with open(calc_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Step 1 and Step 2 updated: 4:1 ratio applied, and input heights increased to 44px!")
