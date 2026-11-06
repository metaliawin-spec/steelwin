// Builder script for calculation.js full update
const fs = require('fs');
const path = require('path');

const calcPath = path.join(__dirname, '..', 'js', 'modules', 'calculation.js');
let content = fs.readFileSync(calcPath, 'utf8');

// Define new renderMaterialCatalog and its modals
const newMaterialCatalogCode = `
// Material Catalog UI State & Helpers
window.matCatalogActiveGroup = window.matCatalogActiveGroup || 'all';
window.matCatalogSearchQuery = window.matCatalogSearchQuery || '';
window.matCatalogViewMode = window.matCatalogViewMode || 'columns';

export function renderMaterialCatalog(state) {
    const catalog = Store.state.materialCatalog || [];
    const groups = Store.state.materialGroups || ['Profile', 'Pipe', 'Panel', 'Hinges', 'Paint', 'Lock & Accessories', 'Hook & Rubber'];
    
    // Group icons & colors mapping
    const groupMeta = {
        'Profile': { icon: 'box', color: '#3b82f6' },
        'Frame': { icon: 'box', color: '#3b82f6' },
        'Pipe': { icon: 'columns', color: '#06b6d4' },
        'Panel': { icon: 'layout-grid', color: '#8b5cf6' },
        'Hinges': { icon: 'shuffle', color: '#f59e0b' },
        'Paint': { icon: 'paint-bucket', color: '#ec4899' },
        'Lock & Accessories': { icon: 'lock', color: '#ef4444' },
        'Lock': { icon: 'lock', color: '#ef4444' },
        'Hook & Rubber': { icon: 'anchor', color: '#10b981' },
        'Hook': { icon: 'anchor', color: '#10b981' }
    };
    const defaultMeta = { icon: 'folder', color: '#14b8a6' };

    const activeGroup = window.matCatalogActiveGroup || 'all';
    const searchQuery = (window.matCatalogSearchQuery || '').toLowerCase().trim();
    const viewMode = window.matCatalogViewMode || 'columns';

    // Filter items
    const filteredCatalog = catalog.filter(item => {
        const itemCategory = (item.category || '').toLowerCase();
        const matchesGroup = activeGroup === 'all' || itemCategory === activeGroup.toLowerCase();
        if (!matchesGroup) return false;

        if (searchQuery) {
            const name = (item.name || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const cat = (item.category || '').toLowerCase();
            const unit = (item.unit || '').toLowerCase();
            const rate = String(item.rate || '');
            const thick = String(item.thicknessGauge || item.thicknessMm || item.thickness || '').toLowerCase();
            const width = String(item.sideWidthMm || item.widthMm || item.width || '').toLowerCase();
            return name.includes(searchQuery) || desc.includes(searchQuery) || cat.includes(searchQuery) || unit.includes(searchQuery) || rate.includes(searchQuery) || thick.includes(searchQuery) || width.includes(searchQuery);
        }
        return true;
    });

    // Groups to display in Columns view
    const displayGroups = activeGroup === 'all' 
        ? groups 
        : groups.filter(g => g.toLowerCase() === activeGroup.toLowerCase());

    // Schedule Lucide icons refresh
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 20);

    return \`
        <div style="height: 100%; overflow-y: auto; padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Header Card (Clean layout with ONLY 2 buttons at top right: Add Item and Add Category) -->
            <div class="glass-panel" style="padding: 1.25rem 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-radius: 12px; border: 1px solid var(--glass-border); background: var(--color-bg-surface-glass);">
                <div style="display: flex; align-items: center; gap: 0.9rem;">
                    <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(59, 130, 246, 0.15); display: flex; align-items: center; justify-content: center; color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);">
                        <i data-lucide="layers" style="width: 22px; height: 22px;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--color-text-heading); display: flex; align-items: center; gap: 0.5rem;">
                            Material Catalog
                        </h2>
                        <p style="margin: 2px 0 0; font-size: 0.82rem; color: var(--color-text-muted);">
                            Profiles, pipes, panels, hinges, paint & hardware category rate masters.
                        </p>
                    </div>
                </div>
                <!-- STRICTLY ONLY TWO CALLS / BUTTONS AT TOP RIGHT -->
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <button onclick="window.openAddMaterialModal()" class="btn btn-primary" id="btn-catalog-add-item" style="display: flex; align-items: center; gap: 0.45rem; padding: 0.55rem 1.15rem; font-size: 0.88rem; font-weight: 600;">
                        <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i> + Add Item
                    </button>
                    <button onclick="window.openAddCategoryModal()" class="btn btn-secondary" id="btn-catalog-add-category" style="display: flex; align-items: center; gap: 0.45rem; padding: 0.55rem 1rem; font-size: 0.88rem; border-color: rgba(255,255,255,0.25);">
                        <i data-lucide="folder-plus" style="width: 16px; height: 16px;"></i> + Add Category
                    </button>
                </div>
            </div>

            <!-- Controls: Filter Pills & Search & View Toggle -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <!-- Group Filter Pills -->
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; background: rgba(0,0,0,0.25); padding: 5px; border-radius: 10px; border: 1px solid var(--glass-border); align-items: center;">
                    <button onclick="window.setCatalogFilter('all')" 
                            style="border: none; border-radius: 6px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; background: \${activeGroup === 'all' ? 'var(--color-primary)' : 'transparent'}; color: \${activeGroup === 'all' ? 'white' : 'var(--color-text-muted)'}; font-weight: \${activeGroup === 'all' ? '600' : '400'};">
                        All Items (\${catalog.length})
                    </button>
                    \${groups.map(g => {
                        const cnt = catalog.filter(m => (m.category || '').toLowerCase() === g.toLowerCase()).length;
                        const isAct = activeGroup.toLowerCase() === g.toLowerCase();
                        const meta = groupMeta[g] || defaultMeta;
                        return \`
                            <button onclick="window.setCatalogFilter('\${g}')" 
                                    style="border: none; border-radius: 6px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; background: \${isAct ? meta.color : 'transparent'}; color: \${isAct ? 'white' : 'var(--color-text-muted)'}; font-weight: \${isAct ? '600' : '400'}; display: flex; align-items: center; gap: 5px;">
                                <i data-lucide="\${meta.icon}" style="width: 13px; height: 13px;"></i>
                                \${g} (\${cnt})
                            </button>
                        \`;
                    }).join('')}
                </div>

                <!-- Search Input and View Switcher -->
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="position: relative; width: 280px;">
                        <i data-lucide="search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #888;"></i>
                        <input type="text" placeholder="Search profiles, pipes, panels, specs..." value="\${window.matCatalogSearchQuery || ''}" oninput="window.setCatalogSearch(this.value)" class="glass-input" style="width: 100%; padding-left: 32px; font-size: 0.84rem; height: 35px; border-radius: 8px;">
                        \${window.matCatalogSearchQuery ? \`
                            <button onclick="window.setCatalogSearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #888; cursor: pointer; padding: 2px;">
                                <i data-lucide="x" style="width: 13px; height: 13px;"></i>
                            </button>
                        \` : ''}
                    </div>

                    <div style="display: flex; background: rgba(0,0,0,0.25); border-radius: 8px; border: 1px solid var(--glass-border); padding: 3px;">
                        <button onclick="window.setCatalogView('columns')" title="Columns / Group Cards View" style="border: none; border-radius: 6px; padding: 5px 10px; cursor: pointer; background: \${viewMode === 'columns' ? 'var(--color-primary)' : 'transparent'}; color: \${viewMode === 'columns' ? 'white' : '#888'}; display: flex; align-items: center; gap: 4px; font-size: 0.8rem;">
                            <i data-lucide="columns" style="width: 14px; height: 14px;"></i> Columns
                        </button>
                        <button onclick="window.setCatalogView('table')" title="Data Table View" style="border: none; border-radius: 6px; padding: 5px 10px; cursor: pointer; background: \${viewMode === 'table' ? 'var(--color-primary)' : 'transparent'}; color: \${viewMode === 'table' ? 'white' : '#888'}; display: flex; align-items: center; gap: 4px; font-size: 0.8rem;">
                            <i data-lucide="table" style="width: 14px; height: 14px;"></i> Table
                        </button>
                    </div>
                </div>
            </div>

            <!-- Content Area: Columns View or Table View -->
            \${viewMode === 'columns' ? \`
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 1.5rem; align-items: start;">
                    \${displayGroups.map(groupName => {
                        const meta = groupMeta[groupName] || defaultMeta;
                        const items = filteredCatalog.filter(m => (m.category || '').toLowerCase() === groupName.toLowerCase());
                        const isCustom = !['Profile', 'Frame', 'Pipe', 'Panel', 'Hinges', 'Lock & Accessories', 'Hook & Rubber', 'Paint'].includes(groupName);

                        return \`
                            <div class="glass-panel" style="display: flex; flex-direction: column; border-radius: 12px; border: 1px solid var(--glass-border); background: var(--color-bg-card); overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
                                <!-- Column Header -->
                                <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                                        <div style="width: 34px; height: 34px; border-radius: 8px; background: \${meta.color}20; color: \${meta.color}; display: flex; align-items: center; justify-content: center; border: 1px solid \${meta.color}35;">
                                            <i data-lucide="\${meta.icon}" style="width: 17px; height: 17px;"></i>
                                        </div>
                                        <div>
                                            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--color-text-heading);">\${groupName}</h3>
                                            <span style="font-size: 0.72rem; color: var(--color-text-muted);">\${items.length} materials</span>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 0.35rem;">
                                        <button onclick="window.openAddMaterialModal('\${groupName}')" title="Add item to \${groupName}" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem; display: flex; align-items: center; gap: 3px; border-radius: 6px;">
                                            <i data-lucide="plus" style="width: 13px; height: 13px;"></i> Add
                                        </button>
                                        \${isCustom ? \`
                                            <button onclick="window.deleteGroupPrompt('\${groupName}')" title="Delete Group \${groupName}" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px 6px; border-radius: 6px; display: flex; align-items: center;">
                                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                            </button>
                                        \` : ''}
                                    </div>
                                </div>

                                <!-- Column Item List -->
                                <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; min-height: 120px;">
                                    \${items.length === 0 ? \`
                                        <div style="padding: 2.5rem 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.85rem; border: 1px dashed var(--glass-border); border-radius: 8px;">
                                            <p style="margin: 0 0 0.6rem 0;">No items found in <strong>\${groupName}</strong>.</p>
                                            <button onclick="window.openAddMaterialModal('\${groupName}')" class="btn btn-secondary" style="font-size: 0.78rem; padding: 5px 12px;">
                                                <i data-lucide="plus" style="width: 13px; height: 13px; display:inline-block; vertical-align:middle;"></i> Add First Item
                                            </button>
                                        </div>
                                    \` : items.map(item => \`
                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.45rem; transition: all 0.15s;" onmouseover="this.style.borderColor='\${meta.color}90'; this.style.background='rgba(255,255,255,0.05)';" onmouseout="this.style.borderColor='var(--glass-border)'; this.style.background='rgba(255,255,255,0.03)';">
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                                                <div>
                                                    <div style="font-weight: 600; font-size: 0.92rem; color: var(--color-text-heading);">\${item.name}</div>
                                                    <div style="font-size: 0.72rem; color: var(--color-text-muted); font-family: monospace;">ID: \${item.id}</div>
                                                </div>
                                                <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; background: \${meta.color}15; color: \${meta.color}; border: 1px solid \${meta.color}40; white-space: nowrap;">
                                                    \${item.unit || 'pcs'}
                                                </span>
                                            </div>

                                            <!-- Category specific badges -->
                                            \${item.category === 'Profile' ? \`
                                                <div style="font-size: 0.74rem; color: #94a3b8; display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                                                    <span style="background: rgba(59, 130, 246, 0.1); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.2);">Side: \${item.sideWidthMm || 50}mm | Center: \${item.centerWidthMm || 25}mm</span>
                                                    \${item.weight16G ? \`<span style="background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 4px;">16G: \${item.weight16G}kg</span>\` : ''}
                                                    \${item.weight18G ? \`<span style="background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 4px;">18G: \${item.weight18G}kg</span>\` : ''}
                                                </div>
                                            \` : item.category === 'Pipe' ? \`
                                                <div style="font-size: 0.74rem; color: #94a3b8; display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                                                    <span style="background: rgba(6, 182, 212, 0.1); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(6, 182, 212, 0.2);">Width: \${item.widthMm || 25}mm • \${item.thicknessGauge || item.thicknessMm || '18G'}</span>
                                                    \${item.weightPerLength ? \`<span style="background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 4px;">\${item.weightPerLength} kg/length</span>\` : ''}
                                                </div>
                                            \` : item.category === 'Panel' ? \`
                                                <div style="font-size: 0.74rem; color: #94a3b8; display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                                                    <span style="background: rgba(139, 92, 246, 0.1); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(139, 92, 246, 0.2);">\${item.meterPrice ? '₹' + item.meterPrice + '/meter (6m length)' : 'Standard Panel'}</span>
                                                </div>
                                            \` : item.category === 'Paint' ? \`
                                                <div style="font-size: 0.74rem; color: #94a3b8; display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                                                    <span style="background: rgba(236, 72, 153, 0.1); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(236, 72, 153, 0.2);">Mode: \${item.pricingMode === 'sqft' ? 'Per Sq.Ft' : 'Per Kalli (Pane)'}</span>
                                                </div>
                                            \` : ''}

                                            \${item.description ? \`
                                                <div style="font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.35;">
                                                    \${item.description}
                                                </div>
                                            \` : ''}

                                            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.4rem; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 0.2rem;">
                                                <div style="display: flex; align-items: baseline; gap: 4px; flex-wrap: wrap;">
                                                    <span style="color: #10b981; font-weight: 700; font-size: 1.05rem;">₹\${item.rate}</span>
                                                    <span style="font-size: 0.75rem; color: var(--color-text-muted);">/ \${item.unit}</span>
                                                </div>

                                                <div style="display: flex; align-items: center; gap: 4px;">
                                                    <button onclick="window.openEditMaterialModal('\${item.id}')" title="Edit Item" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='#94a3b8'">
                                                        <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
                                                    </button>
                                                    <button onclick="window.deleteMaterialPrompt('\${item.id}')" title="Delete Item" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
                                                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    \`).join('')}
                                </div>
                            </div>
                        \`;
                    }).join('')}
                </div>
            \` : \`
                <!-- Table View -->
                <div class="glass-panel" style="padding: 0; border-radius: 10px; border: 1px solid var(--glass-border); overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.04); border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); font-size: 0.8rem; text-transform: uppercase;">
                                    <th style="padding: 12px 16px;">Material Component</th>
                                    <th style="padding: 12px 16px;">Category</th>
                                    <th style="padding: 12px 16px;">Attributes / Specs</th>
                                    <th style="padding: 12px 16px; width: 140px;">UoM</th>
                                    <th style="padding: 12px 16px; text-align: right;">Rate (₹)</th>
                                    <th style="padding: 12px 16px; text-align: center; width: 100px;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                \${filteredCatalog.map(m => \`
                                    <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                        <td style="padding: 12px 16px; font-weight: 600; color: var(--color-text-heading);">
                                            \${m.name}
                                            \${m.description ? \`<div style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 400;">\${m.description}</div>\` : ''}
                                        </td>
                                        <td style="padding: 12px 16px;">
                                            <span style="font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: rgba(59, 130, 246, 0.1); color: #3b82f6;">\${m.category}</span>
                                        </td>
                                        <td style="padding: 12px 16px; font-size: 0.8rem; color: #94a3b8;">
                                            \${m.sideWidthMm ? \`Side \${m.sideWidthMm}mm, Center \${m.centerWidthMm}mm\` : m.widthMm ? \`Width \${m.widthMm}mm\` : m.meterPrice ? \`₹\${m.meterPrice}/m\` : '-'}
                                        </td>
                                        <td style="padding: 12px 16px; font-weight: 600;">\${m.unit}</td>
                                        <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #10b981;">₹\${m.rate}</td>
                                        <td style="padding: 12px 16px; text-align: center;">
                                            <button onclick="window.openEditMaterialModal('\${m.id}')" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px;"><i data-lucide="edit-2" style="width: 14px; height: 14px;"></i></button>
                                            <button onclick="window.deleteMaterialPrompt('\${m.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px;"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                                        </td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            \`}
        </div>
    \`;
}

export function renderCalcSettings(state) {
    return renderMaterialCatalog(state);
}

// Global action handlers for Material Catalog
window.setCatalogFilter = (groupId) => {
    window.matCatalogActiveGroup = groupId;
    Store.notify();
};

window.setCatalogSearch = (query) => {
    window.matCatalogSearchQuery = query;
    Store.notify();
};

window.setCatalogView = (mode) => {
    window.matCatalogViewMode = mode;
    Store.notify();
};

// Add Category Modal (Pre-populated with Profile, Pipe, Panel, Hinges, Paint, Lock & Accessories, Hook & Rubber)
window.openAddCategoryModal = () => {
    document.getElementById('catalog-group-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'catalog-group-modal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem;';

    const groups = Store.state.materialGroups || ['Profile', 'Pipe', 'Panel', 'Hinges', 'Paint', 'Lock & Accessories', 'Hook & Rubber'];

    modal.innerHTML = \`
        <div class="glass-panel" style="width: 100%; max-width: 480px; padding: 1.75rem; background: var(--color-bg-card, #1e1e24); border: 1px solid var(--glass-border); border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.2rem; color: var(--color-text-heading);">
                    <i data-lucide="folder-plus" style="color: var(--color-primary);"></i> Add Material Category
                </h3>
                <button onclick="document.getElementById('catalog-group-modal').remove()" style="background: none; border: none; color: #888; cursor: pointer;"><i data-lucide="x"></i></button>
            </div>
            <form onsubmit="window.saveNewCatalogCategory(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Category Name *</label>
                    <input type="text" id="new-category-name" required placeholder="e.g. Profile, Pipe, Panel, Hinges, Paint, Lock & Accessories..." class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="font-size: 0.78rem; color: var(--color-text-muted);">
                    <strong>Existing Categories:</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
                        \${groups.map(g => \`
                            <span style="background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); font-size: 0.75rem;">\${g}</span>
                        \`).join('')}
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('catalog-group-modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="font-weight: 600;">Create Category</button>
                </div>
            </form>
        </div>
    \`;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => document.getElementById('new-category-name')?.focus(), 50);
};
window.openAddGroupModal = window.openAddCategoryModal;

window.saveNewCatalogCategory = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const nameInput = document.getElementById('new-category-name');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) return;

    Store.addMaterialGroup(name);
    window.matCatalogActiveGroup = name;
    document.getElementById('catalog-group-modal')?.remove();
    Store.notify();
};

window.deleteGroupPrompt = (groupName) => {
    const items = (Store.state.materialCatalog || []).filter(m => (m.category || '').toLowerCase() === groupName.toLowerCase());
    const msg = items.length > 0 
        ? \`Are you sure you want to delete category "\${groupName}"? It contains \${items.length} item(s) which will also be removed.\`
        : \`Are you sure you want to delete category "\${groupName}"?\`;
    if (confirm(msg)) {
        if (items.length > 0) {
            items.forEach(it => Store.deleteMaterial(it.id));
        }
        Store.deleteMaterialGroup(groupName);
        if (window.matCatalogActiveGroup.toLowerCase() === groupName.toLowerCase()) {
            window.matCatalogActiveGroup = 'all';
        }
    }
};

// Add Item Modal with Category Specific Fields (Profile, Pipe, Panel, Hinges, Paint, Lock & Accessories, Hook & Rubber)
window.openAddMaterialModal = (defaultCategory) => {
    document.getElementById('add-material-modal')?.remove();
    const groups = Store.state.materialGroups || ['Profile', 'Pipe', 'Panel', 'Hinges', 'Paint', 'Lock & Accessories', 'Hook & Rubber'];
    const preselectedCat = defaultCategory || (window.matCatalogActiveGroup !== 'all' ? window.matCatalogActiveGroup : (groups[0] || 'Profile'));

    const modal = document.createElement('div');
    modal.id = 'add-material-modal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem; overflow-y:auto;';

    modal.innerHTML = \`
        <div class="glass-panel" style="width: 100%; max-width: 580px; padding: 2rem; background: var(--color-bg-card, #1e1e24); border: 1px solid var(--glass-border); border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); margin: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; color: var(--color-text-heading);">
                    <i data-lucide="plus-circle" style="color: var(--color-primary);"></i> Add Item to Material Catalog
                </h3>
                <button onclick="document.getElementById('add-material-modal').remove()" style="background: none; border: none; color: #888; cursor: pointer;"><i data-lucide="x"></i></button>
            </div>

            <form onsubmit="window.saveNewCatalogMaterial(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                <!-- Category Selector with Direct + Add Category Button -->
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Category *</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select id="mat-new-cat" onchange="window.updateMaterialModalFields(this.value)" class="glass-input" style="flex: 1; padding: 8px 10px; font-size: 0.9rem; font-weight: 600;">
                            \${groups.map(g => \`<option value="\${g}" \${g.toLowerCase() === preselectedCat.toLowerCase() ? 'selected' : ''}>\${g}</option>\`).join('')}
                        </select>
                        <button type="button" onclick="window.openAddCategoryModal()" class="btn btn-secondary" style="white-space: nowrap; font-size: 0.8rem; padding: 7px 12px; display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="folder-plus" style="width: 14px; height: 14px;"></i> + Add Category
                        </button>
                    </div>
                </div>

                <!-- Dynamic Form Container for Category Specific Fields -->
                <div id="dynamic-category-fields">
                    \${getCategoryFieldsHtml(preselectedCat)}
                </div>

                <!-- Description / Remarks -->
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Description / Remarks</label>
                    <input type="text" id="mat-new-desc" placeholder="Specification details or notes..." class="glass-input" style="width: 100%; padding: 8px 12px; font-size: 0.88rem;">
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.75rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('add-material-modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="font-weight: 600; padding: 0.6rem 1.4rem;">Save Item to Catalog</button>
                </div>
            </form>
        </div>
    \`;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => document.getElementById('mat-new-name')?.focus(), 50);
};

// Generates dynamic fields based on user audio requirements
function getCategoryFieldsHtml(category) {
    const cat = (category || '').toLowerCase();
    
    if (cat === 'profile' || cat === 'frame') {
        return \`
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Profile Size / Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. 5x3 Profile, 4x2.5 Profile" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Thickness (Gauge or mm) *</label>
                        <select id="mat-prof-thick-mode" class="glass-input" style="width: 100%; padding: 8px 10px; font-size: 0.85rem;">
                            <option value="16G">16 Gauge (1.5 mm)</option>
                            <option value="18G">18 Gauge (1.2 mm)</option>
                            <option value="20G">20 Gauge (1.0 mm)</option>
                            <option value="mm">Custom mm</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Rate / Unit (₹) *</label>
                        <input type="number" step="0.5" id="mat-new-rate" required placeholder="e.g. 180" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Side Profile Width (mm) *</label>
                        <input type="number" step="1" id="mat-prof-side-w" required placeholder="e.g. 50" value="50" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Center Profile Width (mm) *</label>
                        <input type="number" step="1" id="mat-prof-center-w" required placeholder="e.g. 25" value="25" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">16 Gauge (1.5mm) Weight (kg) *</label>
                        <input type="number" step="0.01" id="mat-prof-wt16" required placeholder="e.g. 1.45" value="1.45" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">18 Gauge (1.2mm) Weight (kg) *</label>
                        <input type="number" step="0.01" id="mat-prof-wt18" required placeholder="e.g. 1.20" value="1.20" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                </div>
            </div>
        \`;
    } else if (cat === 'pipe') {
        return \`
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Pipe Type / Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. 1\\" x 1\\" MS Square Pipe, 1.5\\"x1\\" Rect Tube" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Thickness (Gauge or mm) *</label>
                        <input type="text" id="mat-pipe-thick" placeholder="e.g. 18G / 1.2mm" value="18G" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Width in mm *</label>
                        <input type="number" step="0.1" id="mat-pipe-width" required placeholder="e.g. 25.4" value="25.4" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Weight per Length (kg) *</label>
                        <input type="number" step="0.01" id="mat-pipe-wt" required placeholder="e.g. 1.15" value="1.15" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Rate (₹/kg or length) *</label>
                        <input type="number" step="0.5" id="mat-new-rate" required placeholder="e.g. 95" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>
            </div>
        \`;
    } else if (cat === 'panel') {
        return \`
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Panel Type / Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. 5mm Clear Float Glass, 4mm ACP Solid Sheet" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Charge per Meter (₹) *</label>
                        <input type="number" step="1" id="mat-panel-meter" required placeholder="e.g. 330 (6m standard length)" value="330" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Rate (₹ / sq.ft) *</label>
                        <input type="number" step="0.5" id="mat-new-rate" required placeholder="e.g. 55" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>
            </div>
        \`;
    } else if (cat === 'hinges') {
        return \`
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Hinge Type / Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. Heavy Duty SS Butt Hinge 4\\", Friction Stay 10\\"" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Price (₹ per pair or piece) *</label>
                        <input type="number" step="1" id="mat-new-rate" required placeholder="e.g. 85" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Unit</label>
                        <select id="mat-new-uom" class="glass-input" style="width: 100%; padding: 8px 10px;">
                            <option value="pcs" selected>Pieces (pcs)</option>
                            <option value="pair">Pair (pair)</option>
                        </select>
                    </div>
                </div>
            </div>
        \`;
    } else if (cat === 'paint') {
        return \`
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Paint Type / Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. Epoxy Powder Coating (Matte Black)" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Pricing Option *</label>
                        <select id="mat-paint-mode" class="glass-input" style="width: 100%; padding: 8px 10px;">
                            <option value="kalli" selected>Price per Kalli (Pane)</option>
                            <option value="sqft">Price per Sq.Ft</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Price (₹) *</label>
                        <input type="number" step="1" id="mat-new-rate" required placeholder="e.g. 450 per kalli or 35 per sqft" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>
            </div>
        \`;
    } else if (cat === 'lock & accessories' || cat === 'lock') {
        return \`
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Item Name / Type *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. Cockspur Window Handle Lock, Multipoint Espag" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Price (₹) *</label>
                        <input type="number" step="1" id="mat-new-rate" required placeholder="e.g. 160" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Unit</label>
                        <select id="mat-new-uom" class="glass-input" style="width: 100%; padding: 8px 10px;">
                            <option value="pcs" selected>Pieces (pcs)</option>
                            <option value="set">Set (set)</option>
                        </select>
                    </div>
                </div>
            </div>
        \`;
    } else if (cat === 'hook & rubber' || cat === 'hook') {
        return \`
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Item Name / Type *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. Casement Stay Wind Hook 8\\", EPDM Gasket Strip" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Price (₹) *</label>
                        <input type="number" step="1" id="mat-new-rate" required placeholder="e.g. 75" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Unit</label>
                        <select id="mat-new-uom" class="glass-input" style="width: 100%; padding: 8px 10px;">
                            <option value="pcs" selected>Pieces (pcs)</option>
                            <option value="mtr">Meters (mtr)</option>
                        </select>
                    </div>
                </div>
            </div>
        \`;
    } else {
        return \`
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Item Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. Custom Material" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Unit of Measure *</label>
                        <input type="text" id="mat-new-uom" value="pcs" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Rate (₹) *</label>
                        <input type="number" step="0.5" id="mat-new-rate" required placeholder="e.g. 100" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>
            </div>
        \`;
    }
}

window.updateMaterialModalFields = (category) => {
    const container = document.getElementById('dynamic-category-fields');
    if (container) {
        container.innerHTML = getCategoryFieldsHtml(category);
    }
};

window.saveNewCatalogMaterial = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const category = document.getElementById('mat-new-cat')?.value || 'Profile';
    const name = document.getElementById('mat-new-name')?.value.trim() || 'New Item';
    const rate = parseFloat(document.getElementById('mat-new-rate')?.value) || 0;
    const desc = document.getElementById('mat-new-desc')?.value.trim() || '';

    const catLower = category.toLowerCase();
    const id = 'mat_' + catLower.replace(/[^a-z0-9]/g, '').slice(0, 5) + '_' + Date.now().toString().slice(-4);

    const newMaterial = {
        id,
        name,
        category,
        rate,
        description: desc
    };

    if (catLower === 'profile' || catLower === 'frame') {
        newMaterial.unit = 'kg';
        newMaterial.thicknessGauge = document.getElementById('mat-prof-thick-mode')?.value || '16G';
        newMaterial.sideWidthMm = parseFloat(document.getElementById('mat-prof-side-w')?.value) || 50;
        newMaterial.centerWidthMm = parseFloat(document.getElementById('mat-prof-center-w')?.value) || 25;
        newMaterial.weight16G = parseFloat(document.getElementById('mat-prof-wt16')?.value) || 1.45;
        newMaterial.weight18G = parseFloat(document.getElementById('mat-prof-wt18')?.value) || 1.20;
        newMaterial.weightFactor = newMaterial.weight16G;
    } else if (catLower === 'pipe') {
        newMaterial.unit = 'kg';
        newMaterial.thicknessGauge = document.getElementById('mat-pipe-thick')?.value || '18G';
        newMaterial.widthMm = parseFloat(document.getElementById('mat-pipe-width')?.value) || 25.4;
        newMaterial.weightPerLength = parseFloat(document.getElementById('mat-pipe-wt')?.value) || 1.15;
        newMaterial.weightFactor = newMaterial.weightPerLength;
    } else if (catLower === 'panel') {
        newMaterial.unit = 'sq.ft';
        newMaterial.meterPrice = parseFloat(document.getElementById('mat-panel-meter')?.value) || 330;
        newMaterial.standardLength = 6;
        newMaterial.weightFactor = 1.15;
    } else if (catLower === 'paint') {
        newMaterial.pricingMode = document.getElementById('mat-paint-mode')?.value || 'kalli';
        newMaterial.unit = newMaterial.pricingMode === 'sqft' ? 'sq.ft' : 'pane';
        if (newMaterial.pricingMode === 'kalli') {
            newMaterial.pricePerKalli = rate;
            newMaterial.pricePerSqFt = 35;
        } else {
            newMaterial.pricePerSqFt = rate;
            newMaterial.pricePerKalli = 450;
        }
    } else {
        newMaterial.unit = document.getElementById('mat-new-uom')?.value || 'pcs';
        newMaterial.weightFactor = 0.25;
    }

    Store.addMaterial(newMaterial);
    document.getElementById('add-material-modal')?.remove();
    Store.notify();
};

window.openEditMaterialModal = (itemId) => {
    document.getElementById('edit-material-modal')?.remove();
    const item = (Store.state.materialCatalog || []).find(m => m.id === itemId);
    if (!item) return;

    const modal = document.createElement('div');
    modal.id = 'edit-material-modal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem;';

    modal.innerHTML = \`
        <div class="glass-panel" style="width: 100%; max-width: 500px; padding: 2rem; background: var(--color-bg-card, #1e1e24); border: 1px solid var(--glass-border); border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; color: var(--color-text-heading);">
                    <i data-lucide="edit-2" style="color: var(--color-primary);"></i> Edit Material Item
                </h3>
                <button onclick="document.getElementById('edit-material-modal').remove()" style="background: none; border: none; color: #888; cursor: pointer;"><i data-lucide="x"></i></button>
            </div>

            <form onsubmit="window.saveEditCatalogMaterial(event, '\${item.id}')" style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Item Name *</label>
                    <input type="text" id="mat-edit-name" required value="\${item.name || ''}" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Category</label>
                        <input type="text" value="\${item.category}" readonly class="glass-input" style="width: 100%; padding: 8px 10px; opacity: 0.8;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: #10b981; font-weight: 600; margin-bottom: 0.35rem;">Rate (₹) *</label>
                        <input type="number" step="0.5" id="mat-edit-rate" required value="\${item.rate || 0}" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Description</label>
                    <input type="text" id="mat-edit-desc" value="\${item.description || ''}" class="glass-input" style="width: 100%; padding: 8px 12px;">
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.75rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('edit-material-modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="font-weight: 600;">Update Material</button>
                </div>
            </form>
        </div>
    \`;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.saveEditCatalogMaterial = (e, itemId) => {
    if (e && e.preventDefault) e.preventDefault();
    const item = (Store.state.materialCatalog || []).find(m => m.id === itemId);
    if (!item) return;

    item.name = document.getElementById('mat-edit-name')?.value.trim() || item.name;
    item.rate = parseFloat(document.getElementById('mat-edit-rate')?.value) || item.rate;
    item.description = document.getElementById('mat-edit-desc')?.value.trim() || item.description;

    Store.saveState();
    document.getElementById('edit-material-modal')?.remove();
    Store.notify();
};

window.deleteMaterialPrompt = (id) => {
    if (confirm('Delete this material item from catalog?')) {
        Store.deleteMaterial(id);
    }
};
`;

console.log('Replacing material catalog code...');
const startCatalogIdx = content.indexOf('// Material Catalog UI State & Helpers');
const endCatalogIdx = content.indexOf('function renderManualCalc(state) {');

if (startCatalogIdx !== -1 && endCatalogIdx !== -1) {
    content = content.slice(0, startCatalogIdx) + newMaterialCatalogCode + '\n\n' + content.slice(endCatalogIdx);
    console.log('Material Catalog updated successfully.');
} else {
    console.error('Could not find catalog boundaries!');
}

fs.writeFileSync(calcPath, content, 'utf8');
