import { Store } from '../store.js';

export function renderProduction(state) {
    const container = document.createElement('div');
    container.className = 'production-view animate-fade-in';

    // Use data from Store
    const activeOrders = state.productionOrders;

    const stages = [
        { label: 'Order Listed', icon: 'clipboard-list' },
        { label: 'Drawing', icon: 'pen-tool' },
        { label: 'Channel Making', icon: 'scissors' },
        { label: 'Fabrication', icon: 'hammer' },
        { label: 'Painting', icon: 'paint-bucket' },
        { label: 'Packing', icon: 'box' },
        { label: 'Dispatched', icon: 'send' },
        { label: 'Delivered', icon: 'check-circle-2' }
    ];

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
                <h1>Production Floor</h1>
                <p style="color: var(--color-text-muted);">Track real-time status of manufacturing orders type</p>
            </div>
            <div style="display: flex; gap: 1rem; align-items: center;">
                 <div style="position: relative;">
                    <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; color: var(--color-text-muted);"></i>
                    <input type="text" id="search-input" placeholder="Search Client or ID..." style="padding-left: 2.5rem; width: 250px;">
                 </div>
                 
                 <button class="btn" onclick="window.toggleFilter()" style="background: var(--glass-bg);">
                    <i data-lucide="filter"></i> Filter
                </button>

            </div>
        </div>

        <div id="filter-panel" style="display: none; background: var(--glass-bg); padding: 1rem; margin-bottom: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
            <p style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--color-text-muted);">Filter by Status:</p>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn" style="font-size: 0.8rem; padding: 0.25rem 0.75rem;" onclick="window.filterByStage('All')">All</button>
                ${stages.map((s, i) => `<button class="btn" style="font-size: 0.8rem; padding: 0.25rem 0.75rem; background: rgba(0,0,0,0.2);" onclick="window.filterByStage(${i})">${s.label}</button>`).join('')}
            </div>
        </div>

        <div id="production-list" style="display: flex; flex-direction: column; gap: 1.5rem;">
            ${activeOrders.map(order => createOrderCard(order, stages)).join('')}
        </div>

        <!-- Hidden Input for File Upload -->
        <input type="file" id="drawing-upload-input" accept="image/*,application/pdf" style="display: none;">

        <!-- Drawing Modal -->
        <div id="drawing-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center;">
            <div class="glass-panel" style="width: 80%; height: 80%; background: var(--color-bg-sidebar); display: flex; flex-direction: column; overflow: hidden; position: relative;">
                <div style="padding: 1rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                    <h3 id="modal-title">Order Drawing</h3>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <span id="file-type-badge" style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: var(--glass-bg);"></span>
                        <button class="btn" onclick="window.closeDrawing()"><i data-lucide="x"></i></button>
                    </div>
                </div>
                <div id="modal-content-area" style="flex: 1; padding: 1rem; display: flex; align-items: center; justify-content: center; background: #1a1a1a;">
                    <!-- Content will be injected here -->
                </div>
            </div>
        </div>
    `;

    // --- Action Handlers ---

    let currentUploadOrderId = null;

    window.updateStatus = (orderId, newStepIndex) => {
        const store = window.Store || Store;
        const activeUser = (typeof store.getActiveUser === 'function') ? store.getActiveUser() : { isSuperAdmin: true, name: 'Admin' };
        const order = store.state.productionOrders.find(o => o.id === orderId);

        if (order && newStepIndex < stages.length) {
            const nextStageLabel = stages[newStepIndex].label;

            // Granular technician stage advancement validation
            if (!activeUser.isSuperAdmin && activeUser.role !== 'Super Administrator') {
                const userRole = (activeUser.role || '').toLowerCase();
                const userName = (activeUser.name || '').toLowerCase();
                const isDesignRole = userRole.includes('cad') || userRole.includes('design') || userName.includes('farhan');
                const isFabricationRole = userRole.includes('fabricat') || userRole.includes('welder') || userName.includes('rajeesh');
                const isPaintingRole = userRole.includes('paint') || userRole.includes('coat') || userName.includes('mani');
                const isCNC = userRole.includes('cnc') || userRole.includes('channel');

                let authorized = false;
                if (nextStageLabel === 'Drawing' && isDesignRole) authorized = true;
                else if (nextStageLabel === 'Channel Making' && (isCNC || isFabricationRole)) authorized = true;
                else if (nextStageLabel === 'Fabrication' && isFabricationRole) authorized = true;
                else if (nextStageLabel === 'Painting' && (isPaintingRole || isFabricationRole)) authorized = true;
                else if (['Packing', 'Dispatched', 'Delivered'].includes(nextStageLabel)) authorized = true;
                else if (store.can('production', 'update')) authorized = true;

                if (!authorized) {
                    alert(`Access Restricted: As ${activeUser.name} (${activeUser.role}), you do not have operational authorization to sign off the "${nextStageLabel}" stage.`);
                    return;
                }
            }

            order.progress = newStepIndex;
            order.status = nextStageLabel;

            // Instant synchronization with dedicated Orders tracking module
            if (store.state.orders) {
                const matchingOrder = store.state.orders.find(o => o.id === orderId || (o.customer && order.client && o.customer.toLowerCase() === order.client.toLowerCase()));
                if (matchingOrder) {
                    matchingOrder.currentMilestone = nextStageLabel;
                    if (!matchingOrder.milestonesHistory) matchingOrder.milestonesHistory = [];
                    matchingOrder.milestonesHistory.push({
                        stage: nextStageLabel,
                        date: new Date().toLocaleString(),
                        by: `${activeUser.name} (${activeUser.role || 'Staff'})`
                    });

                    // Auto-revoke customer credentials if Delivered
                    if (nextStageLabel === 'Delivered') {
                        if (!matchingOrder.portalCredentials) matchingOrder.portalCredentials = {};
                        matchingOrder.portalCredentials.active = false;
                        matchingOrder.portalCredentials.revokedAt = new Date().toLocaleString();
                    }
                }
            }

            if (typeof store.saveState === 'function') store.saveState();
            store.notify();
            alert(`Order ${orderId} moved to ${nextStageLabel}${nextStageLabel === 'Delivered' ? ' • Customer portal credentials automatically revoked.' : ''}`);
        }
    };

    window.uploadDrawing = (orderId) => {
        currentUploadOrderId = orderId;
        document.getElementById('drawing-upload-input').click();
    };

    // Handle File Selection
    const fileInput = container.querySelector('#drawing-upload-input');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file || !currentUploadOrderId) return;

            // Determine Type
            const isPdf = file.type === 'application/pdf';
            const fileUrl = URL.createObjectURL(file); // Create local preview URL

            const order = Store.state.productionOrders.find(o => o.id === currentUploadOrderId);
            if (order) {
                order.drawing = true;
                order.drawingType = isPdf ? 'pdf' : 'image';
                order.drawingUrl = fileUrl;
                order.fileName = file.name;

                Store.notify();
                alert(`Successfully attached ${file.name}`);
            }

            // Reset input
            fileInput.value = '';
            currentUploadOrderId = null;
        });
    }

    window.viewDrawing = (orderId) => {
        const order = Store.state.productionOrders.find(o => o.id === orderId);
        if (order) {
            const modal = document.getElementById('drawing-modal');
            const title = document.getElementById('modal-title');
            const contentArea = document.getElementById('modal-content-area');
            const badge = document.getElementById('file-type-badge');

            title.innerText = `Drawing for ${order.id}`;
            badge.innerText = order.drawingType === 'pdf' ? 'PDF Document' : 'Image File';

            // Clear previous
            contentArea.innerHTML = '';

            const url = order.drawingUrl || "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2531&auto=format&fit=crop";
            const type = order.drawingType || 'image';

            if (type === 'pdf') {
                // For PDF, use an iframe
                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                contentArea.appendChild(iframe);
            } else {
                // For Image
                const img = document.createElement('img');
                img.src = url;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.objectFit = 'contain';
                contentArea.appendChild(img);
            }

            modal.style.display = 'flex';
        }
    };

    window.closeDrawing = () => {
        document.getElementById('drawing-modal').style.display = 'none';
    };


    window.generateCuttingList = () => {
        const store = window.Store || Store;
        if (!store) return;

        const orders = store.state.productionOrders || [];
        if (orders.length === 0) {
            alert('No active production orders to generate cutlist.');
            return;
        }

        // Mock Calculation Logic (Aggregate Items)
        const materials = {
            'Aluminum Extrusion Class A': { cuts: [], totalLength: 0 },
            'Glass Pane 6mm': { cuts: [], totalArea: 0 },
            'Rubber Gasket': { cuts: [], totalLength: 0 }
        };

        orders.forEach(order => {
            // Distribute mock items based on order ID hash
            if (order.id.includes('1') || order.id.includes('3')) {
                materials['Aluminum Extrusion Class A'].cuts.push({ id: order.id, dim: '2400mm x 4' });
                materials['Aluminum Extrusion Class A'].totalLength += 9.6;
            }
            if (order.id.includes('2') || order.id.includes('4')) {
                materials['Glass Pane 6mm'].cuts.push({ id: order.id, dim: '1200x800mm x 2' });
                materials['Glass Pane 6mm'].totalArea += 1.92;
            }
        });

        const container = document.createElement('div');
        container.id = 'cutlist-preview';
        container.className = 'animate-fade-in';
        container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: white; color: black; z-index: 2000; overflow-y: auto;
            padding: 40px;
        `;

        container.innerHTML = `
            <div class="no-print" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
                <button onclick="document.getElementById('cutlist-preview').remove()" class="btn btn-secondary">
                    <i data-lucide="arrow-left"></i> Back
                </button>
                <div style="display: flex; gap: 0.6rem; align-items: center;">
                    <button class="btn btn-secondary" onclick="window.sharePrintDoc('Cutlist Report', 'Cutlist-Report', 'Cutlist Optimization Report', 'Production Team', 0, '')" style="background: #2563eb; border: 1px solid #2563eb; color: white; display: flex; align-items: center; gap: 6px;" title="Share report via WhatsApp, Email, etc.">
                        <i data-lucide="share-2" style="width: 15px;"></i> Share
                    </button>
                    <button class="btn btn-secondary" onclick="window.downloadPrintDoc('cutlist-report-content', 'Cutlist-Optimization-Report')" style="background: #475569; border: 1px solid #64748b; color: white; display: flex; align-items: center; gap: 6px;" title="Download PDF report">
                        <i data-lucide="download" style="width: 15px;"></i> Download
                    </button>
                    <button onclick="window.print()" class="btn btn-primary" style="background: #10b981; border: none; color: white; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="printer" style="width: 15px;"></i> Print Report
                    </button>
                </div>
            </div>

            <div id="cutlist-report-content" style="max-width: 210mm; margin: 0 auto; background: white; color: black; padding: 20px;">
                <div style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #333; padding-bottom: 1rem;">
                    <h1 style="margin: 0; font-size: 24px;">CUTLIST OPTIMIZATION REPORT</h1>
                    <p style="margin: 0.5rem 0 0 0; color: #666;">Generated on ${new Date().toLocaleString()}</p>
                    <p style="font-weight: bold; color: #333; margin-top: 0.5rem;">GL Windows & Doors Production</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: #f5f5f5; padding: 1rem; border-radius: 4px;">
                        <span style="display: block; font-size: 0.8rem; color: #666;">Total Orders</span>
                        <strong style="font-size: 1.5rem;">${orders.length}</strong>
                    </div>
                    <div style="background: #f5f5f5; padding: 1rem; border-radius: 4px;">
                         <span style="display: block; font-size: 0.8rem; color: #666;">Optimization Yield</span>
                        <strong style="font-size: 1.5rem; color: green;">96.5%</strong>
                    </div>
                     <div style="background: #f5f5f5; padding: 1rem; border-radius: 4px;">
                         <span style="display: block; font-size: 0.8rem; color: #666;">Waste Est.</span>
                        <strong style="font-size: 1.5rem; color: orange;">3.5%</strong>
                    </div>
                </div>

                ${Object.entries(materials).map(([name, data]) => data.cuts.length > 0 ? `
                    <div style="margin-bottom: 2rem; border: 1px solid #ccc; break-inside: avoid;">
                        <div style="background: #eee; padding: 0.5rem 1rem; font-weight: bold; border-bottom: 1px solid #ccc; display: flex; justify-content: space-between;">
                            <span>${name}</span>
                            <span>Total Req: ${data.totalLength ? data.totalLength.toFixed(2) + ' m' : data.totalArea.toFixed(2) + ' sq.m'}</span>
                        </div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <th style="padding: 8px; text-align: left; font-size: 0.9rem;">Order Ref</th>
                                    <th style="padding: 8px; text-align: right; font-size: 0.9rem;">Cuts Required</th>
                                    <th style="padding: 8px; text-align: right; font-size: 0.9rem;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.cuts.map(cut => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 8px; font-size: 0.9rem;">${cut.id}</td>
                                        <td style="padding: 8px; text-align: right; font-family: monospace;">${cut.dim}</td>
                                        <td style="padding: 8px; text-align: right;">Pending</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div style="padding: 0.5rem; background: #fafafa; font-size: 0.8rem; font-family: monospace; color: #555;">
                            Bar Optimization: [2400] [2400] [1200] [Rem: 400]
                        </div>
                    </div>
                ` : '').join('')}

                <div style="margin-top: 3rem; font-size: 0.8rem; color: #999; text-align: center;">
                    End of Report - Internal Use Only
                </div>
            </div>
        `;

        document.body.appendChild(container);
        if (window.lucide) window.lucide.createIcons();
    };

    window.toggleFilter = () => {
        const panel = document.getElementById('filter-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };

    window.filterByStage = (stageIndex) => {
        const cards = container.querySelectorAll('.production-card');
        cards.forEach(card => {
            const progress = parseInt(card.dataset.progress);
            if (stageIndex === 'All' || progress === stageIndex) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };

    // Attach functionality to the search input
    const searchInput = container.querySelector('#search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = container.querySelectorAll('.production-card');

            cards.forEach(card => {
                const client = card.dataset.client.toLowerCase();
                const id = card.dataset.id.toLowerCase();

                if (client.includes(term) || id.includes(term)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Helper to create card
    function createOrderCard(order, stages) {
        const progressPercent = (order.progress / (stages.length - 1)) * 100;

        return `
            <div class="glass-panel production-card" data-client="${order.client}" data-id="${order.id}" data-progress="${order.progress}" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                            <span style="font-weight: 700; color: var(--color-primary); font-size: 1.1rem;">${order.id}</span>
                            <span style="font-size: 0.9rem; font-weight: 600;">${order.client}</span>
                        </div>
                        <p style="color: var(--color-text-muted); font-size: 0.9rem;">${order.items}</p>
                    </div>
                    <div style="text-align: right;">
                         ${order.drawing
                ? `<button class="btn" onclick="window.viewDrawing('${order.id}')" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; background: rgba(var(--hue-primary), 50%, 30%, 0.3); color: var(--color-primary); border: 1px solid var(--color-primary-glow);">
                                <i data-lucide="eye" style="width: 14px;"></i> View Drawing
                               </button>`
                : `<button class="btn" onclick="window.uploadDrawing('${order.id}')" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; border: 1px dashed var(--color-text-muted);">
                                <i data-lucide="paperclip" style="width: 14px;"></i> Attach Drawing
                               </button>`
            }
                    </div>
                </div>

                <!-- Progress Tracker -->
                <div style="position: relative; margin-top: 1rem;">
                    <!-- Track Line -->
                    <div style="position: absolute; top: 15px; left: 0; width: 100%; height: 4px; background: var(--glass-border); border-radius: 4px; z-index: 0;"></div>
                    <div style="position: absolute; top: 15px; left: 0; width: ${progressPercent}%; height: 4px; background: var(--color-success); border-radius: 4px; z-index: 0; transition: width 0.5s;"></div>

                    <!-- Steps -->
                    <div style="display: flex; justify-content: space-between; position: relative; z-index: 1;">
                        ${stages.map((stage, idx) => {
                const isCompleted = idx <= order.progress;
                const isCurrent = idx === order.progress;

                let color = isCompleted ? 'var(--color-success)' : 'var(--color-text-muted)';
                let bg = isCompleted ? 'var(--color-success)' : 'var(--glass-bg)';
                let border = isCompleted ? 'var(--color-success)' : 'var(--glass-border)';

                // Highlight Current differently?
                if (isCurrent) {
                    bg = 'var(--color-bg-main)';
                    border = 'var(--color-warning)';
                    color = 'var(--color-warning)';
                }

                return `
                                <div style="display: flex; flex-direction: column; align-items: center; width: 80px; text-align: center;">
                                    <div style="
                                        width: 32px; height: 32px; 
                                        border-radius: 50%; 
                                        background: ${isCompleted ? bg : 'var(--glass-bg)'}; 
                                        border: 2px solid ${border};
                                        display: flex; align-items: center; justify-content: center;
                                        margin-bottom: 0.5rem;
                                        color: ${isCompleted && !isCurrent ? 'white' : color};
                                        transition: all 0.3s;
                                        box-shadow: ${isCurrent ? '0 0 10px rgba(255,165,0,0.4)' : 'none'};
                                    ">
                                        ${isCompleted && !isCurrent
                        ? `<i data-lucide="check" style="width: 16px; height: 16px;"></i>`
                        : `<i data-lucide="${stage.icon}" style="width: 16px; height: 16px;"></i>`
                    }
                                    </div>
                                    <span style="font-size: 0.75rem; color: ${isCurrent ? 'var(--color-text-main)' : 'var(--color-text-muted)'}; font-weight: ${isCurrent ? '600' : '400'};">${stage.label}</span>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>

                <!-- Controls -->
                <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: flex-end; gap: 1rem;">
                     ${order.progress < stages.length - 1 ? `
                        <button class="btn btn-primary" onclick="window.updateStatus('${order.id}', ${order.progress + 1})">
                            Move to ${stages[order.progress + 1].label} <i data-lucide="chevron-right"></i>
                        </button>
                     ` : `
                        <button class="btn" style="background: var(--color-success); color: white; cursor: default;">
                            <i data-lucide="check-circle"></i> Completed
                        </button>
                     `}
                </div>
            </div>
        `;
    }

    return container;
}
