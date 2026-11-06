import re
import sys
import os

filepath = os.path.abspath('js/modules/calculation.js')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Read calculation.js, total length: {len(content)}")

# --- 1. Patch openPartitionPosDropdown & selectPanePartitionPos ---
old_dropdown_block = """window.openPartitionPosDropdown = (paneIndex, anchorEl) => {
    window.closePartitionPosDropdown();
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.id = 'calc-partition-pos-popover';
    pop.style.cssText = `
        position: fixed;
        left: ${Math.round(rect.left)}px;
        top: ${Math.round(rect.bottom + 4)}px;
        background: #ffffff;
        border: 1.5px solid #0284c7;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.22);
        z-index: 100080;
        min-width: 175px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 5px;
        font-family: var(--font-main, sans-serif);
    `;

    const options = [
        { id: 'top', label: '⬆️ Top Partition', shortcut: 'PT' },
        { id: 'center', label: '↕️ Middle Partition', shortcut: 'PM' },
        { id: 'bottom', label: '⬇️ Bottom Partition', shortcut: 'PB' }
    ];

    let activeOptIdx = 0;

    pop.innerHTML = `
        <div style="font-size: 0.68rem; font-weight: 800; color: #64748b; padding: 4px 8px 6px; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; letter-spacing: 0.5px;">
            Pane ${paneIndex + 1} Position (Use ↑/↓ + Enter)
        </div>
        ${options.map((opt, idx) => `
            <div 
                class="pos-opt-item ${idx === 0 ? 'nav-focus' : ''}" 
                data-pos="${opt.id}"
                style="padding: 7px 10px; cursor: pointer; border-radius: 5px; font-size: 0.8rem; font-weight: 700; color: #1e293b; display: flex; justify-content: space-between; align-items: center; transition: all 0.15s ease; background: ${idx === 0 ? '#e0f2fe' : 'transparent'};"
                onmouseenter="this.style.background='#e0f2fe'; this.style.color='#0284c7'"
                onmouseleave="if(!this.classList.contains('nav-focus')){ this.style.background='transparent'; this.style.color='#1e293b'; }"
                onclick="window.selectPanePartitionPos(${paneIndex}, '${opt.id}')"
            >
                <span>${opt.label}</span>
                <span style="font-size: 0.68rem; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${opt.shortcut}</span>
            </div>
        `).join('')}
    `;

    document.body.appendChild(pop);

    const keyHandler = (e) => {
        const items = pop.querySelectorAll('.pos-opt-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeOptIdx = (activeOptIdx + 1) % items.length;
            items.forEach((it, idx) => {
                it.classList.toggle('nav-focus', idx === activeOptIdx);
                it.style.background = idx === activeOptIdx ? '#e0f2fe' : 'transparent';
                it.style.color = idx === activeOptIdx ? '#0284c7' : '#1e293b';
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeOptIdx = (activeOptIdx - 1 + items.length) % items.length;
            items.forEach((it, idx) => {
                it.classList.toggle('nav-focus', idx === activeOptIdx);
                it.style.background = idx === activeOptIdx ? '#e0f2fe' : 'transparent';
                it.style.color = idx === activeOptIdx ? '#0284c7' : '#1e293b';
            });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const chosen = items[activeOptIdx]?.getAttribute('data-pos') || 'top';
            window.selectPanePartitionPos(paneIndex, chosen);
            cleanup();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cleanup();
        }
    };

    const cleanup = () => {
        window.removeEventListener('keydown', keyHandler);
        pop.remove();
    };

    window.addEventListener('keydown', keyHandler);

    setTimeout(() => {
        const docClickHandler = (e) => {
            if (!pop.contains(e.target) && e.target !== anchorEl) {
                cleanup();
                document.removeEventListener('click', docClickHandler);
            }
        };
        document.addEventListener('click', docClickHandler);
    }, 50);
};

window.closePartitionPosDropdown = () => {
    const pop = document.getElementById('calc-partition-pos-popover');
    if (pop) pop.remove();
};

window.selectPanePartitionPos = (paneIndex, pos) => {
    window.closePartitionPosDropdown();
    window.setPanePartitionPos(paneIndex, pos);
};"""

new_dropdown_block = """window.openPartitionPosDropdown = (paneIndex, anchorEl) => {
    window.closePartitionPosDropdown();
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.id = 'calc-partition-pos-popover';
    pop.style.cssText = `
        position: fixed;
        left: ${Math.round(rect.left)}px;
        top: ${Math.round(rect.bottom + 4)}px;
        background: #ffffff;
        border: 1.5px solid #0284c7;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.22);
        z-index: 100080;
        min-width: 195px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 5px;
        font-family: var(--font-main, sans-serif);
    `;

    const options = [
        { id: 'top', label: '⬆️ Top Partition', shortcut: 'PT', dir: 'horizontal' },
        { id: 'center', label: '↕️ Middle Partition', shortcut: 'PM', dir: 'horizontal' },
        { id: 'bottom', label: '⬇️ Bottom Partition', shortcut: 'PB', dir: 'horizontal' },
        { id: 'vertical', label: '↔️ Vertical Partition', shortcut: 'PV', dir: 'vertical' },
        { id: 'clear', label: '❌ Remove Partition', shortcut: 'NP', dir: 'none' }
    ];

    let activeOptIdx = 0;

    pop.innerHTML = `
        <div style="font-size: 0.68rem; font-weight: 800; color: #64748b; padding: 4px 8px 6px; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; letter-spacing: 0.5px;">
            Pane ${paneIndex + 1} Partition (Use ↑/↓ + Enter)
        </div>
        ${options.map((opt, idx) => `
            <div 
                class="pos-opt-item ${idx === 0 ? 'nav-focus' : ''}" 
                data-pos="${opt.id}"
                data-dir="${opt.dir}"
                style="padding: 7px 10px; cursor: pointer; border-radius: 5px; font-size: 0.8rem; font-weight: 700; color: #1e293b; display: flex; justify-content: space-between; align-items: center; transition: all 0.15s ease; background: ${idx === 0 ? '#e0f2fe' : 'transparent'};"
                onmouseenter="this.style.background='#e0f2fe'; this.style.color='#0284c7'"
                onmouseleave="if(!this.classList.contains('nav-focus')){ this.style.background='transparent'; this.style.color='#1e293b'; }"
                onclick="window.selectPanePartitionPos(${paneIndex}, '${opt.id}', '${opt.dir}')"
            >
                <span>${opt.label}</span>
                <span style="font-size: 0.68rem; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${opt.shortcut}</span>
            </div>
        `).join('')}
    `;

    document.body.appendChild(pop);

    const keyHandler = (e) => {
        const items = pop.querySelectorAll('.pos-opt-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeOptIdx = (activeOptIdx + 1) % items.length;
            items.forEach((it, idx) => {
                it.classList.toggle('nav-focus', idx === activeOptIdx);
                it.style.background = idx === activeOptIdx ? '#e0f2fe' : 'transparent';
                it.style.color = idx === activeOptIdx ? '#0284c7' : '#1e293b';
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeOptIdx = (activeOptIdx - 1 + items.length) % items.length;
            items.forEach((it, idx) => {
                it.classList.toggle('nav-focus', idx === activeOptIdx);
                it.style.background = idx === activeOptIdx ? '#e0f2fe' : 'transparent';
                it.style.color = idx === activeOptIdx ? '#0284c7' : '#1e293b';
            });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const chosen = items[activeOptIdx]?.getAttribute('data-pos') || 'top';
            const chosenDir = items[activeOptIdx]?.getAttribute('data-dir') || 'horizontal';
            window.selectPanePartitionPos(paneIndex, chosen, chosenDir);
            cleanup();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cleanup();
        }
    };

    const cleanup = () => {
        window.removeEventListener('keydown', keyHandler);
        pop.remove();
    };

    window.addEventListener('keydown', keyHandler);

    setTimeout(() => {
        const docClickHandler = (e) => {
            if (!pop.contains(e.target) && e.target !== anchorEl) {
                cleanup();
                document.removeEventListener('click', docClickHandler);
            }
        };
        document.addEventListener('click', docClickHandler);
    }, 50);
};

window.closePartitionPosDropdown = () => {
    const pop = document.getElementById('calc-partition-pos-popover');
    if (pop) pop.remove();
};

window.selectPanePartitionPos = (paneIndex, pos, dir = 'horizontal') => {
    window.closePartitionPosDropdown();
    if (pos === 'clear' || dir === 'none') {
        window.setPanePartitionCount(paneIndex, 0);
        return;
    }
    const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
    const targetObj = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    if (targetObj) {
        if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
        targetObj.partitionDir[paneIndex] = dir;
    }
    window.setPanePartitionPos(paneIndex, pos === 'vertical' ? 'center' : pos, dir);
};"""

if old_dropdown_block in content:
    content = content.replace(old_dropdown_block, new_dropdown_block, 1)
    print("Updated openPartitionPosDropdown block.")
else:
    print("WARNING: old_dropdown_block not found!")


# --- 2. Patch handleSubPaneClick with PARTITION_VERTICAL ---
old_subclick_target = """        if (cmd === 'PARTITION_TOP') {
            if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
            if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('top');
            targetObj.panePartitions[paneIndex] = 1;
            targetObj.partitionPos[paneIndex] = 'top';
            window.showStudioToast(`Top partition applied to Pane ${paneIndex + 1}`);
        } else if (cmd === 'PARTITION_MIDDLE') {
            if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
            if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('top');
            targetObj.panePartitions[paneIndex] = 1;
            targetObj.partitionPos[paneIndex] = 'center';
            window.showStudioToast(`Middle partition applied to Pane ${paneIndex + 1}`);
        } else if (cmd === 'PARTITION_BOTTOM') {
            if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
            if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('top');
            targetObj.panePartitions[paneIndex] = 1;
            targetObj.partitionPos[paneIndex] = 'bottom';
            window.showStudioToast(`Bottom partition applied to Pane ${paneIndex + 1}`);"""

new_subclick_target = """        if (cmd === 'PARTITION_TOP') {
            if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
            if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('top');
            if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
            targetObj.panePartitions[paneIndex] = 1;
            targetObj.partitionDir[paneIndex] = 'horizontal';
            targetObj.partitionPos[paneIndex] = 'top';
            window.showStudioToast(`Top partition applied to Pane ${paneIndex + 1}`);
        } else if (cmd === 'PARTITION_MIDDLE') {
            if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
            if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('top');
            if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
            targetObj.panePartitions[paneIndex] = 1;
            targetObj.partitionDir[paneIndex] = 'horizontal';
            targetObj.partitionPos[paneIndex] = 'center';
            window.showStudioToast(`Middle partition applied to Pane ${paneIndex + 1}`);
        } else if (cmd === 'PARTITION_BOTTOM') {
            if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
            if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('top');
            if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
            targetObj.panePartitions[paneIndex] = 1;
            targetObj.partitionDir[paneIndex] = 'horizontal';
            targetObj.partitionPos[paneIndex] = 'bottom';
            window.showStudioToast(`Bottom partition applied to Pane ${paneIndex + 1}`);
        } else if (cmd === 'PARTITION_VERTICAL') {
            if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
            if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('center');
            if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
            targetObj.panePartitions[paneIndex] = 1;
            targetObj.partitionDir[paneIndex] = 'vertical';
            targetObj.partitionPos[paneIndex] = 'center';
            window.showStudioToast(`Vertical partition (PV) applied to Pane ${paneIndex + 1}`);"""

if old_subclick_target in content:
    content = content.replace(old_subclick_target, new_subclick_target, 1)
    print("Updated handleSubPaneClick with PARTITION_VERTICAL.")
else:
    print("WARNING: old_subclick_target not found!")


# --- 3. Patch keydown listener with seq.endsWith('pv') ---
old_seq_target = """                // PB: Partition Bottom (Arms command, then click pane to apply)
                if (seq.endsWith('pb')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_BOTTOM', 'PB', 'Bottom Partition', 'Click any pane to apply Bottom Partition');
                    return;
                }"""

new_seq_target = """                // PB: Partition Bottom (Arms command, then click pane to apply)
                if (seq.endsWith('pb')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_BOTTOM', 'PB', 'Bottom Partition', 'Click any pane to apply Bottom Partition');
                    return;
                }

                // PV: Partition Vertical (Audio 2: arms command, then click pane to apply)
                if (seq.endsWith('pv')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_VERTICAL', 'PV', 'Vertical Partition', 'Click any pane to apply Vertical Partition');
                    return;
                }"""

if old_seq_target in content:
    content = content.replace(old_seq_target, new_seq_target, 1)
    print("Updated keydown listener with PV command.")
else:
    print("WARNING: old_seq_target not found!")


# --- 4. Patch state defaults & setPanePartitionPos in renderManualCalc ---
old_state_init = """        if (!g.partitionPos || g.partitionPos.length !== g.cols) {
            g.partitionPos = Array(g.cols).fill('top');
        }"""

new_state_init = """        if (!g.partitionPos || g.partitionPos.length !== g.cols) {
            g.partitionPos = Array(g.cols).fill('top');
        }
        if (!g.partitionDir || g.partitionDir.length !== g.cols) {
            g.partitionDir = Array(g.cols).fill('horizontal');
        }"""

if old_state_init in content:
    content = content.replace(old_state_init, new_state_init, 1)
    print("Updated state defaults with partitionDir.")
else:
    print("WARNING: old_state_init not found!")


# --- 5. Patch setCols / loadPreset / setPanePartitionPos ---
old_set_pos_func = """        window.setPanePartitionPos = (index, pos) => {
            snapshotCalc();
            if (!g.partitionPos) g.partitionPos = Array(g.cols).fill('top');
            if (!g.panePartitions) g.panePartitions = Array(g.cols).fill(0);
            g.activePaneIndex = index;
            if ((g.panePartitions[index] || 0) === 0) {
                g.panePartitions[index] = 1;
            }
            g.partitionPos[index] = pos;
            Store.notify();
        };"""

new_set_pos_func = """        window.setPanePartitionPos = (index, pos, dir = null) => {
            snapshotCalc();
            if (!g.partitionPos) g.partitionPos = Array(g.cols).fill('top');
            if (!g.partitionDir) g.partitionDir = Array(g.cols).fill('horizontal');
            if (!g.panePartitions) g.panePartitions = Array(g.cols).fill(0);
            g.activePaneIndex = index;
            if ((g.panePartitions[index] || 0) === 0) {
                g.panePartitions[index] = 1;
            }
            if (dir) g.partitionDir[index] = dir;
            else if (pos === 'vertical') {
                g.partitionDir[index] = 'vertical';
                pos = 'center';
            }
            g.partitionPos[index] = pos;
            Store.notify();
        };"""

if old_set_pos_func in content:
    content = content.replace(old_set_pos_func, new_set_pos_func, 1)
    print("Updated setPanePartitionPos.")
else:
    print("WARNING: old_set_pos_func not found!")


# --- 6. Patch BOM partition & grill loop in renderManualCalc ---
old_bom_loop = """        for (let i = 0; i < g.cols; i++) {
            const parts = g.panePartitions[i] || 0;
            if (parts > 0) {
                totalPartitionDividers += parts;
                const pw_mm = convertUnit(g.paneWidths[i], g.unit, 'mm');
                partitionLenFt += parts * ((pw_mm / 25.4) / 12);
            }

            // Calculate grill tubes for this pane
            const paneW_cm = convertUnit(g.paneWidths[i] || (g.totalW / g.cols), g.unit, 'cm');
            const paneOrient = g.paneTubeOrientations[i] || 'horizontal';
            const paneCount = g.paneTubeCounts[i];

            if (parts === 0) {
                const orient0 = (g.subOrientations && g.subOrientations[`${i}_0`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const count0 = (g.subTubeCounts && g.subTubeCounts[`${i}_0`]) ?? (g.paneTubeCounts ? g.paneTubeCounts[i] : null);
                const gr = computePaneGrill(paneW_cm, totalInnerHCm, orient0, count0);
                totalGrillPipes += gr.count;
                totalGrillLengthCm += gr.totalLengthCm;
            } else if (parts === 1) {
                const pos = (g.partitionPos && g.partitionPos[i]) || 'top';
                let pyFrac = pos === 'center' ? 0.50 : (pos === 'bottom' ? 0.65 : 0.35);
                const h1_cm = totalInnerHCm * pyFrac;
                const h2_cm = totalInnerHCm * (1 - pyFrac);
                const orient0 = (g.subOrientations && g.subOrientations[`${i}_0`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const orient1 = (g.subOrientations && g.subOrientations[`${i}_1`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const count0 = (g.subTubeCounts && g.subTubeCounts[`${i}_0`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] * pyFrac) : null);
                const count1 = (g.subTubeCounts && g.subTubeCounts[`${i}_1`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] * (1 - pyFrac)) : null);
                const gr1 = computePaneGrill(paneW_cm, h1_cm, orient0, count0);
                const gr2 = computePaneGrill(paneW_cm, h2_cm, orient1, count1);
                totalGrillPipes += gr1.count + gr2.count;
                totalGrillLengthCm += gr1.totalLengthCm + gr2.totalLengthCm;
            } else {
                const hEach = totalInnerHCm / (parts + 1);
                for (let p = 0; p <= parts; p++) {
                    const orientP = (g.subOrientations && g.subOrientations[`${i}_${p}`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                    const countP = (g.subTubeCounts && g.subTubeCounts[`${i}_${p}`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] / (parts + 1)) : null);
                    const gr = computePaneGrill(paneW_cm, hEach, orientP, countP);
                    totalGrillPipes += gr.count;
                    totalGrillLengthCm += gr.totalLengthCm;
                }
            }
        }"""

new_bom_loop = """        for (let i = 0; i < g.cols; i++) {
            const parts = g.panePartitions[i] || 0;
            const isVert = parts > 0 && ((g.partitionDir && g.partitionDir[i] === 'vertical') || (g.partitionPos && g.partitionPos[i] === 'vertical'));
            if (parts > 0) {
                totalPartitionDividers += parts;
                if (isVert) {
                    partitionLenFt += parts * h_ft;
                } else {
                    const pw_mm = convertUnit(g.paneWidths[i], g.unit, 'mm');
                    partitionLenFt += parts * ((pw_mm / 25.4) / 12);
                }
            }

            // Calculate grill tubes for this pane
            const paneW_cm = convertUnit(g.paneWidths[i] || (g.totalW / g.cols), g.unit, 'cm');

            if (parts === 0) {
                const orient0 = (g.subOrientations && g.subOrientations[`${i}_0`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const count0 = (g.subTubeCounts && g.subTubeCounts[`${i}_0`]) ?? (g.paneTubeCounts ? g.paneTubeCounts[i] : null);
                const gr = computePaneGrill(paneW_cm, totalInnerHCm, orient0, count0);
                totalGrillPipes += gr.count;
                totalGrillLengthCm += gr.totalLengthCm;
            } else if (isVert) {
                const w1_cm = Math.max(5, (paneW_cm - 2.5) * 0.5);
                const w2_cm = Math.max(5, paneW_cm - 2.5 - w1_cm);
                const orient0 = (g.subOrientations && g.subOrientations[`${i}_0`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const orient1 = (g.subOrientations && g.subOrientations[`${i}_1`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const count0 = (g.subTubeCounts && g.subTubeCounts[`${i}_0`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] * 0.5) : null);
                const count1 = (g.subTubeCounts && g.subTubeCounts[`${i}_1`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] * 0.5) : null);
                const gr1 = computePaneGrill(w1_cm, totalInnerHCm, orient0, count0);
                const gr2 = computePaneGrill(w2_cm, totalInnerHCm, orient1, count1);
                totalGrillPipes += gr1.count + gr2.count;
                totalGrillLengthCm += gr1.totalLengthCm + gr2.totalLengthCm;
            } else if (parts === 1) {
                const pos = (g.partitionPos && g.partitionPos[i]) || 'top';
                let pyFrac = pos === 'center' ? 0.50 : (pos === 'bottom' ? 0.65 : 0.35);
                const h1_cm = totalInnerHCm * pyFrac;
                const h2_cm = totalInnerHCm * (1 - pyFrac);
                const orient0 = (g.subOrientations && g.subOrientations[`${i}_0`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const orient1 = (g.subOrientations && g.subOrientations[`${i}_1`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const count0 = (g.subTubeCounts && g.subTubeCounts[`${i}_0`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] * pyFrac) : null);
                const count1 = (g.subTubeCounts && g.subTubeCounts[`${i}_1`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] * (1 - pyFrac)) : null);
                const gr1 = computePaneGrill(paneW_cm, h1_cm, orient0, count0);
                const gr2 = computePaneGrill(paneW_cm, h2_cm, orient1, count1);
                totalGrillPipes += gr1.count + gr2.count;
                totalGrillLengthCm += gr1.totalLengthCm + gr2.totalLengthCm;
            } else {
                const hEach = totalInnerHCm / (parts + 1);
                for (let p = 0; p <= parts; p++) {
                    const orientP = (g.subOrientations && g.subOrientations[`${i}_${p}`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                    const countP = (g.subTubeCounts && g.subTubeCounts[`${i}_${p}`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] / (parts + 1)) : null);
                    const gr = computePaneGrill(paneW_cm, hEach, orientP, countP);
                    totalGrillPipes += gr.count;
                    totalGrillLengthCm += gr.totalLengthCm;
                }
            }
        }"""

if old_bom_loop in content:
    content = content.replace(old_bom_loop, new_bom_loop, 1)
    print("Updated BOM partition and grill loop.")
else:
    print("WARNING: old_bom_loop not found!")


# --- 7. Patch canvas sizing & interactive model rendering ---
# Target the block starting from `const maxAvailW = 540;` to the end of `calc-right-partition-panel`
old_canvas_block_pattern = re.compile(
    r"const maxAvailW = 540;.*?<!-- Centered Window Frame Wrapper",
    re.DOTALL
)

new_canvas_block = """const maxAvailW = 660;
        const maxAvailH = 310;
        const aspect = (w_mm > 0 && h_mm > 0) ? (w_mm / h_mm) : (g.cols * 50 / 140);
        let drawW, drawH;
        if (aspect >= (maxAvailW / maxAvailH)) {
            drawW = maxAvailW;
            drawH = Math.max(100, Math.round(drawW / aspect));
        } else {
            drawH = maxAvailH;
            drawW = Math.max(90, Math.round(drawH * aspect));
        }

        const is4x3 = String(rc.materials?.frame || '').toLowerCase().includes('4x3') || String(frameItem.name || '').toLowerCase().includes('4x3');
        const frameThick = is4x3 ? Math.max(14, Math.round(drawH * 0.052)) : Math.max(9, Math.round(drawH * 0.038));
        const mullionThick = Math.max(6, Math.round(frameThick * 0.72));
        const sashThick = Math.max(5, Math.round(frameThick * 0.65));
        const sashGap = 1.5; // TIGHT REBATE CLEARANCE (adippichu - no over-gap)

        const hasPanel = rc.materials?.panel !== 'none' && rc.materials?.panel !== '' && !panelItem.isNone;
        const profileFill = '#4a4d52';
        const profileStroke = '#181a1b';
        const strokeW = 1.5;
        const glassFill = '#ffffff';

        let gridSvg = '';
        let paneOverlays = '';
        let currentPaneLeft = frameThick;
        let bestHorizDim = null;
        let bestVertDim = null;
        const innerH = drawH - (frameThick * 2);
        const totalInnerW = drawW - (frameThick * 2) - ((g.cols - 1) * mullionThick);
        const panePositions = [];

        for (let i = 0; i < g.cols; i++) {
            const paneFraction = (g.paneWidths[i] && g.totalW > 0) ? (g.paneWidths[i] / g.totalW) : (1 / g.cols);
            const drawPaneW = Math.max(10, Math.round(totalInnerW * paneFraction));
            const parts = g.panePartitions[i] || 0;
            const pos = (g.partitionPos && g.partitionPos[i]) || 'top';
            const isVert = parts >= 1 && ((g.partitionDir && g.partitionDir[i] === 'vertical') || pos === 'vertical');

            panePositions.push({ startX: currentPaneLeft, endX: currentPaneLeft + drawPaneW, w: drawPaneW, i });

            // Sub-sections in this pane
            const subSections = [];
            if (parts === 0) {
                subSections.push({ x: currentPaneLeft, y: frameThick, w: drawPaneW, h: innerH, isVert: false, subName: 'Full Pane' });
            } else if (isVert) {
                let pxFrac = 0.50;
                if (pos === 'left') pxFrac = 0.35;
                else if (pos === 'right') pxFrac = 0.65;
                const w1 = Math.round((drawPaneW - mullionThick) * pxFrac);
                const w2 = drawPaneW - mullionThick - w1;
                subSections.push({ x: currentPaneLeft, y: frameThick, w: w1, h: innerH, isVert: true, subName: 'Left Opening' });
                subSections.push({ x: currentPaneLeft + w1 + mullionThick, y: frameThick, w: w2, h: innerH, isVert: true, subName: 'Right Opening' });
            } else if (parts === 1) {
                let pyFraction = 0.35;
                if (pos === 'center') pyFraction = 0.50;
                else if (pos === 'bottom') pyFraction = 0.65;
                const h1 = Math.round((innerH - mullionThick) * pyFraction);
                const h2 = innerH - mullionThick - h1;
                subSections.push({ x: currentPaneLeft, y: frameThick, w: drawPaneW, h: h1, isVert: false, subName: 'Top Opening' });
                subSections.push({ x: currentPaneLeft, y: frameThick + h1 + mullionThick, w: drawPaneW, h: h2, isVert: false, subName: 'Main Opening' });
            } else {
                const hEach = Math.round((innerH - (parts * mullionThick)) / (parts + 1));
                for (let p = 0; p <= parts; p++) {
                    subSections.push({ x: currentPaneLeft, y: frameThick + (p * (hEach + mullionThick)), w: drawPaneW, h: hEach, isVert: false, subName: `Opening ${p+1}` });
                }
            }

            // If vertical partition, draw the vertical divider mullion
            if (isVert) {
                const w1 = subSections[0].w;
                gridSvg += `<rect x="${currentPaneLeft + w1}" y="${frameThick}" width="${mullionThick}" height="${innerH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" rx="0.5" />`;
            }

            // Render sub-sections as apertures cutout into the solid frame
            for (let s = 0; s < subSections.length; s++) {
                const sec = subSections[s];
                let innerApertureX = sec.x;
                let innerApertureY = sec.y;
                let innerApertureW = sec.w;
                let innerApertureH = sec.h;

                if (hasPanel) {
                    // Outer aperture rebate border (white hairline / rebate opening)
                    gridSvg += `<rect x="${sec.x}" y="${sec.y}" width="${sec.w}" height="${sec.h}" fill="#ffffff" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                    const sX = sec.x + sashGap;
                    const sY = sec.y + sashGap;
                    const sW = sec.w - (sashGap * 2);
                    const sH = sec.h - (sashGap * 2);
                    if (sW > sashThick * 2 && sH > sashThick * 2) {
                        gridSvg += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                        const gX = sX + sashThick;
                        const gY = sY + sashThick;
                        const gW = sW - (sashThick * 2);
                        const gH = sH - (sashThick * 2);
                        gridSvg += `<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.8}" />`;
                        innerApertureX = gX;
                        innerApertureY = gY;
                        innerApertureW = gW;
                        innerApertureH = gH;
                    }
                } else {
                    gridSvg += `<rect x="${sec.x}" y="${sec.y}" width="${sec.w}" height="${sec.h}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                }

                // Security Grill Tubes inside aperture (20x20 Square Tubes)
                const secW_cm = (sec.w / totalInnerW) * totalInnerWCm;
                const secH_cm = (sec.h / innerH) * totalInnerHCm;
                const subKey = `${i}_${s}`;
                const paneOrient = (g.subOrientations && g.subOrientations[subKey]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const paneCount = (g.subTubeCounts && g.subTubeCounts[subKey]) ?? (g.paneTubeCounts ? g.paneTubeCounts[i] : null);
                const grill = computePaneGrill(secW_cm, secH_cm, paneOrient, paneCount);

                const pipeThickPx = Math.max(3, Math.round(drawH * (2.0 / Math.max(20, convertUnit(g.totalH, g.unit, 'cm')))));
                if (grill.count > 0 && innerApertureW > pipeThickPx * 2 && innerApertureH > pipeThickPx * 2) {
                    if (paneOrient === 'horizontal') {
                        const gapPx = (innerApertureH - (grill.count * pipeThickPx)) / (grill.count + 1);
                        for (let p = 0; p < grill.count; p++) {
                            const py = innerApertureY + gapPx * (p + 1) + pipeThickPx * p;
                            gridSvg += `<rect x="${innerApertureX}" y="${py}" width="${innerApertureW}" height="${pipeThickPx}" fill="#ffffff" stroke="#334155" stroke-width="1.1" rx="0.5" />`;
                        }
                        const isPart = (g.panePartitions && g.panePartitions[i] > 0);
                        const isMainArea = isPart ? (s > 0) : true;
                        let hScore = innerApertureH;
                        if (isMainArea) hScore += 600;
                        if (i === g.cols - 1 || i === g.activePaneIndex) hScore += 100;

                        if (!bestHorizDim || hScore > bestHorizDim.score) {
                            bestHorizDim = {
                                innerApertureX, innerApertureY, innerApertureW, innerApertureH,
                                gapPx, pipeThickPx, gapCm: grill.gapCm, i, s, score: hScore, count: grill.count
                            };
                        }
                    } else {
                        const gapPx = (innerApertureW - (grill.count * pipeThickPx)) / (grill.count + 1);
                        for (let p = 0; p < grill.count; p++) {
                            const px = innerApertureX + gapPx * (p + 1) + pipeThickPx * p;
                            gridSvg += `<rect x="${px}" y="${innerApertureY}" width="${pipeThickPx}" height="${innerApertureH}" fill="#ffffff" stroke="#334155" stroke-width="1.1" rx="0.5" />`;
                        }
                        if (!bestVertDim || s === 0 || i === g.activePaneIndex) {
                            bestVertDim = {
                                innerApertureX, innerApertureY, innerApertureW, innerApertureH,
                                gapPx, pipeThickPx, gapCm: grill.gapCm, i, s, count: grill.count
                            };
                        }
                    }
                }
            }

            const isSelected = (g.activePaneIndex === i);
            const posDisplay = isVert ? 'VERT' : (pos === 'center' ? 'MID' : (pos === 'bottom' ? 'BTM' : 'TOP'));

            // HTML Overlay for this Pane (Audio 1 & 2: Clean sub-section targets, NO dashed blue outlines)
            paneOverlays += `
                <div style="position: absolute; left: ${currentPaneLeft}px; top: 0; width: ${drawPaneW}px; height: ${drawH}px; pointer-events: none;">
                    
                    <!-- Direct Sub-Section Click Targets -->
                    ${subSections.length > 1 ? subSections.map((sec, sIdx) => {
                        const isSubActive = (g.activePaneIndex === i && (g.activeSubIndex ?? 0) === sIdx);
                        const subLabel = sec.subName || (sIdx === 0 ? 'Opening 1' : 'Opening 2');
                        return `
                            <div 
                                onclick="window.handleSubPaneClick(${i}, ${sIdx})"
                                title="Pane ${i + 1} (${subLabel}): Click to select • Press R to rotate grill"
                                style="position: absolute; left: ${sec.x - currentPaneLeft}px; top: ${sec.y}px; width: ${sec.w}px; height: ${sec.h}px; cursor: pointer; pointer-events: auto; z-index: 10; border-radius: 2px; transition: background 0.15s ease; ${isSubActive ? 'background: rgba(2, 132, 199, 0.08);' : ''}"
                                onmouseenter="this.style.backgroundColor='rgba(15, 23, 42, 0.06)'"
                                onmouseleave="this.style.backgroundColor='${isSubActive ? 'rgba(2, 132, 199, 0.08)' : 'transparent'}'"
                            ></div>
                        `;
                    }).join('') : `
                        <div 
                            onclick="window.handleSubPaneClick(${i}, 0)"
                            title="Pane ${i + 1} of ${g.cols}: Click to apply active command or select • Shortcuts: PT (Top), PM (Mid), PB (Btm), PV (Vertical), R (Rotate)"
                            style="position: absolute; left: 0; top: ${frameThick}px; width: ${drawPaneW}px; height: ${innerH}px; cursor: pointer; pointer-events: auto; z-index: 10; border-radius: 2px; transition: background 0.15s ease; ${isSelected ? 'background: rgba(2, 132, 199, 0.08);' : ''}"
                            onmouseenter="this.style.backgroundColor='rgba(15, 23, 42, 0.06)'"
                            onmouseleave="this.style.backgroundColor='${isSelected ? 'rgba(2, 132, 199, 0.08)' : 'transparent'}'"
                        ></div>
                    `}

                    <!-- Partition Position Pill Dropdown Trigger -->
                    ${parts >= 1 ? `
                        <div style="position: absolute; left: 50%; top: ${Math.round(frameThick + 8)}px; transform: translateX(-50%); pointer-events: auto; z-index: 15;">
                            <div 
                                onclick="event.stopPropagation(); window.openPartitionPosDropdown(${i}, this)" 
                                title="Pane ${i + 1}: Click to choose Top, Middle, Bottom, Vertical or remove partition"
                                style="
                                    background: rgba(255, 255, 255, 0.85); 
                                    border: 1px solid #cbd5e1; 
                                    backdrop-filter: blur(2px);
                                    border-radius: 4px; 
                                    padding: 2px 8px; 
                                    display: flex; 
                                    align-items: center; 
                                    gap: 4px; 
                                    cursor: pointer; 
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.06); 
                                    user-select: none; 
                                    font-size: 0.68rem; 
                                    font-weight: 700; 
                                    color: #475569;
                                    transition: all 0.15s ease;
                                "
                                onmouseover="this.style.background='#ffffff'; this.style.borderColor='#94a3b8'; this.style.color='#0f172a'"
                                onmouseout="this.style.background='rgba(255, 255, 255, 0.85)'; this.style.borderColor='#cbd5e1'; this.style.color='#475569'"
                            >
                                <span>${parts} (${posDisplay})</span>
                                <span style="font-size: 0.55rem; color: #94a3b8;">▼</span>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Individual Pane Width Input: Sits cleanly at the TOP above AutoCAD dimension line -->
                    ${g.cols > 1 ? `
                        <div style="position: absolute; left: 50%; top: -56px; transform: translateX(-50%); pointer-events: auto; display: flex; flex-direction: column; align-items: center; z-index: 25;">
                            <span style="font-size: 0.62rem; color: #64748b; font-weight: 700; margin-bottom: 1px;">W(${g.unit})</span>
                            <input 
                                type="number" 
                                class="hide-spin" 
                                step="${g.unit === 'mm' ? '10' : '0.5'}" 
                                min="1" 
                                value="${g.paneWidths[i]}" 
                                onchange="window.updateIndividualPaneWidth(${i}, this.value)" 
                                style="width: 62px; height: 26px; text-align: center; font-weight: 700; font-size: 0.90rem; color: #0f172a; border: 1.5px solid #cbd5e1; border-radius: 5px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none; padding: 1px 2px; box-sizing: border-box; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;"
                            >
                        </div>
                    ` : ''}

                </div>
            `;

            currentPaneLeft += drawPaneW + (i < g.cols - 1 ? mullionThick : 0);
        }

        // AutoCAD Blueprint Dimensions Layout (Matching Reference Image 2)
        const strokeCAD = '#334155';
        const strokeW_CAD = 1.1;
        const fontFam = 'monospace';

        // 1. Top Dimensions: Individual Pane Widths (Image 2: 41, 100, 41)
        for (let pIdx = 0; pIdx < panePositions.length; pIdx++) {
            const pos = panePositions[pIdx];
            const pX1 = pos.startX;
            const pX2 = pos.endX;
            const dimY = -18;
            const paneWCm = Math.round(convertUnit(g.paneWidths[pIdx] || (g.totalW / g.cols), g.unit, 'cm'));

            // Witness lines
            gridSvg += `<line x1="${pX1}" y1="0" x2="${pX1}" y2="${dimY - 6}" stroke="${strokeCAD}" stroke-width="0.9" />`;
            gridSvg += `<line x1="${pX2}" y1="0" x2="${pX2}" y2="${dimY - 6}" stroke="${strokeCAD}" stroke-width="0.9" />`;
            // Dimension line
            gridSvg += `<line x1="${pX1}" y1="${dimY}" x2="${pX2}" y2="${dimY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />`;
            // Tick marks
            gridSvg += `<line x1="${pX1 - 3}" y1="${dimY + 3}" x2="${pX1 + 3}" y2="${dimY - 3}" stroke="${strokeCAD}" stroke-width="1.3" />`;
            gridSvg += `<line x1="${pX2 - 3}" y1="${dimY + 3}" x2="${pX2 + 3}" y2="${dimY - 3}" stroke="${strokeCAD}" stroke-width="1.3" />`;
            // Dimension text
            gridSvg += `<text x="${(pX1 + pX2) / 2}" y="${dimY - 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="middle">${paneWCm}</text>`;
        }

        // 2. Bottom Dimension: Total Window Width (Image 2: 200)
        const botDimY = drawH + 20;
        const totWCm = Math.round(convertUnit(g.totalW, g.unit, 'cm'));
        gridSvg += `
            <line x1="0" y1="${drawH}" x2="0" y2="${botDimY + 6}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${drawW}" y1="${drawH}" x2="${drawW}" y2="${botDimY + 6}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="0" y1="${botDimY}" x2="${drawW}" y2="${botDimY}" stroke="${strokeCAD}" stroke-width="1.2" />
            <line x1="-3" y1="${botDimY + 3}" x2="3" y2="${botDimY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <line x1="${drawW - 3}" y1="${botDimY + 3}" x2="${drawW + 3}" y2="${botDimY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <text x="${drawW / 2}" y="${botDimY + 14}" fill="#0f172a" font-size="12px" font-weight="800" font-family="${fontFam}" text-anchor="middle">${totWCm}</text>
        `;

        // 3. Right Dimension: Total Window Height (Image 2: 160)
        const rightDimX = drawW + 24;
        const totHCm = Math.round(convertUnit(g.totalH, g.unit, 'cm'));
        gridSvg += `
            <line x1="${drawW}" y1="0" x2="${rightDimX + 6}" y2="0" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${drawW}" y1="${drawH}" x2="${rightDimX + 6}" y2="${drawH}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${rightDimX}" y1="0" x2="${rightDimX}" y2="${drawH}" stroke="${strokeCAD}" stroke-width="1.2" />
            <line x1="${rightDimX - 3}" y1="3" x2="${rightDimX + 3}" y2="-3" stroke="${strokeCAD}" stroke-width="1.4" />
            <line x1="${rightDimX - 3}" y1="${drawH + 3}" x2="${rightDimX + 3}" y2="${drawH - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <text x="${rightDimX + 8}" y="${drawH / 2 + 4}" fill="#0f172a" font-size="12px" font-weight="800" font-family="${fontFam}" text-anchor="start">${totHCm}</text>
        `;

        // 4. Left Dimension: Partition Heights (Image 2: 41 and 105)
        const horizPartIdx = g.panePartitions ? g.panePartitions.findIndex((p, idx) => p > 0 && g.partitionDir?.[idx] !== 'vertical') : -1;
        const leftDimX = -24;
        if (horizPartIdx !== -1) {
            const hPos = g.partitionPos[horizPartIdx] || 'top';
            const pyFrac = hPos === 'center' ? 0.50 : (hPos === 'bottom' ? 0.65 : 0.35);
            const divY = frameThick + Math.round((innerH - mullionThick) * pyFrac) + Math.round(mullionThick / 2);
            const topHCm = Math.round(totHCm * pyFrac);
            const botHCm = Math.round(totHCm * (1 - pyFrac));

            gridSvg += `
                <line x1="0" y1="0" x2="${leftDimX - 6}" y2="0" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="0" y1="${divY}" x2="${leftDimX - 6}" y2="${divY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="0" y1="${drawH}" x2="${leftDimX - 6}" y2="${drawH}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${leftDimX}" y1="0" x2="${leftDimX}" y2="${divY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX}" y1="${divY}" x2="${leftDimX}" y2="${drawH}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX - 3}" y1="3" x2="${leftDimX + 3}" y2="-3" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${divY + 3}" x2="${leftDimX + 3}" y2="${divY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${drawH + 3}" x2="${leftDimX + 3}" y2="${drawH - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <text x="${leftDimX - 8}" y="${divY / 2 + 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="end">${topHCm}</text>
                <text x="${leftDimX - 8}" y="${(divY + drawH) / 2 + 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="end">${botHCm}</text>
            `;
        } else {
            gridSvg += `
                <line x1="0" y1="0" x2="${leftDimX - 6}" y2="0" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="0" y1="${drawH}" x2="${leftDimX - 6}" y2="${drawH}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${leftDimX}" y1="0" x2="${leftDimX}" y2="${drawH}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX - 3}" y1="3" x2="${leftDimX + 3}" y2="-3" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${drawH + 3}" x2="${leftDimX + 3}" y2="${drawH - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <text x="${leftDimX - 8}" y="${drawH / 2 + 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="end">${totHCm}</text>
            `;
        }

        // 5. Inner Aperture Grill Gap Callouts (Image 2: 7.8)
        if (bestVertDim && bestVertDim.gapCm > 0) {
            const p = Math.max(0, Math.floor(((bestVertDim.count || 2) - 1) / 2));
            const x1 = bestVertDim.innerApertureX + bestVertDim.gapPx * (p + 1) + bestVertDim.pipeThickPx * p;
            const x2 = x1 + bestVertDim.gapPx;
            const midY = bestVertDim.innerApertureY + bestVertDim.innerApertureH / 2;
            gridSvg += `
                <line x1="${x1}" y1="${midY}" x2="${x2}" y2="${midY}" stroke="#16a34a" stroke-width="1.2" />
                <line x1="${x1}" y1="${midY - 4}" x2="${x1}" y2="${midY + 4}" stroke="#16a34a" stroke-width="1.1" />
                <line x1="${x2}" y1="${midY - 4}" x2="${x2}" y2="${midY + 4}" stroke="#16a34a" stroke-width="1.1" />
                <text x="${(x1 + x2) / 2}" y="${midY - 5}" fill="#16a34a" font-size="10.5px" font-weight="700" font-family="${fontFam}" text-anchor="middle">${bestVertDim.gapCm}</text>
            `;
        }
        if (bestHorizDim && bestHorizDim.gapCm > 0) {
            const p = Math.max(0, Math.floor(((bestHorizDim.count || 2) - 1) / 2));
            const y1 = bestHorizDim.innerApertureY + bestHorizDim.gapPx * (p + 1) + bestHorizDim.pipeThickPx * p;
            const y2 = y1 + bestHorizDim.gapPx;
            const midX = bestHorizDim.innerApertureX + bestHorizDim.innerApertureW / 2;
            gridSvg += `
                <line x1="${midX}" y1="${y1}" x2="${midX}" y2="${y2}" stroke="#16a34a" stroke-width="1.2" />
                <line x1="${midX - 4}" y1="${y1}" x2="${midX + 4}" y2="${y1}" stroke="#16a34a" stroke-width="1.1" />
                <line x1="${midX - 4}" y1="${y2}" x2="${midX + 4}" y2="${y2}" stroke="#16a34a" stroke-width="1.1" />
                <text x="${midX + 7}" y="${(y1 + y2) / 2 + 3.5}" fill="#16a34a" font-size="10.5px" font-weight="700" font-family="${fontFam}" text-anchor="start">${bestHorizDim.gapCm}</text>
            `;
        }

        // Material Direct-Typing Search Combobox Builder for Quick Calc
        const renderMatCol = (catKey, label, allowedCats, currentVal) => {
            const items = catalog.filter(m => {
                const cat = (m.category || '').toLowerCase();
                return allowedCats.some(c => cat === c.toLowerCase() || cat.includes(c.toLowerCase()));
            });
            const selItem = items.find(m => m.id === currentVal || m.name === currentVal);
            const rawDisplayVal = currentVal === 'none' ? '-- None (Not Included) --' : (selItem ? `${selItem.name} (₹${selItem.rate})` : (currentVal || '-- None (Not Included) --'));
            const displayVal = escapeHtmlAttr(rawDisplayVal);
            const boxId = `bar-mat-root-quick-${catKey}`;

            return `
                <div id="${boxId}" class="mat-combobox-root" style="display: flex; flex-direction: column; gap: 4px; min-width: 0; position: relative;">
                    <label style="font-size: 0.72rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtmlAttr(label)}">${label}</label>
                    
                    <input type="hidden" id="quick-mat-${catKey}" value="${escapeHtmlAttr(currentVal)}">
                    
                    <div style="position: relative; width: 100%; display: flex; align-items: center;">
                        <input 
                            type="text" 
                            id="bar-mat-input-quick-${catKey}"
                            class="mat-combobox-input"
                            value="${displayVal}"
                            data-selected-id="${escapeHtmlAttr(currentVal)}"
                            data-selected-name="${displayVal}"
                            autocomplete="off"
                            onclick="this.select(); window.openMatCombobox('${boxId}', this)"
                            onfocus="window.openMatCombobox('${boxId}', this)"
                            oninput="window.filterMatCombobox('${boxId}', this.value)"
                            onkeydown="window.handleMatComboboxKey('${boxId}', event)"
                            style="width: 100%; height: 32px; padding: 4px 8px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.80rem; font-weight: 600; color: #0f172a; background: #ffffff; outline: none; cursor: pointer; text-overflow: ellipsis;"
                        >
                        <span style="position: absolute; right: 8px; font-size: 0.65rem; color: #64748b; pointer-events: none;">▼</span>
                    </div>

                    <div id="${boxId}-dropdown" class="mat-combobox-dropdown" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; min-width: 220px; max-height: 250px; overflow-y: auto; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 100050; padding: 4px;">
                        <div class="mat-combobox-opt" data-id="none" onclick="window.selectMatComboboxItem('${boxId}', 'none', '-- None (Not Included) --')" style="padding: 6px 10px; font-size: 0.78rem; font-weight: 700; color: #ef4444; border-radius: 4px; cursor: pointer;">
                            -- None (Not Included) --
                        </div>
                        ${items.map(m => `
                            <div class="mat-combobox-opt" data-id="${escapeHtmlAttr(m.id)}" data-name="${escapeHtmlAttr(m.name)}" onclick="window.selectMatComboboxItem('${boxId}', '${escapeHtmlAttr(m.id)}', '${escapeHtmlAttr(m.name)} (₹${m.rate})')" style="padding: 6px 10px; font-size: 0.78rem; font-weight: 600; color: #1e293b; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between;">
                                <span>${m.name}</span>
                                <span style="font-weight: 700; color: #0284c7;">₹${m.rate}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        };

        const totalWTop = 'calc(100% + 36px)';

        return `
            <div class="quick-calc-container" style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 1300px; margin: 0 auto; padding-bottom: 3rem;">
                
                <!-- 1. TOP HEADER & CONTROLS -->
                <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 18px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                    
                    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px;">
                        
                        <div style="display: flex; align-items: center; background: #0f172a; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid #334155;">
                            <div style="display: flex; align-items: center; padding: 0 12px; border-right: 1px solid rgba(255,255,255,0.18); background: rgba(0,0,0,0.18);">
                                <span style="color: #e2e8f0; font-size: 0.82rem; font-weight: 600; margin-right: 8px;">Custom Kalli:</span>
                                <input 
                                    type="number" 
                                    class="hide-spin"
                                    min="1" 
                                    max="30" 
                                    value="${g.cols}" 
                                    style="width: 44px; height: 26px; text-align: center; padding: 0; font-weight: 800; border-radius: 4px; border: 1px solid #64748b; background: #1e293b; color: white; font-size: 0.88rem; outline: none; -webkit-appearance: none; -moz-appearance: textfield; appearance: textfield;" 
                                    onchange="window.loadPreset(this.value)" 
                                    onkeydown="if(event.key==='Enter'){ window.loadPreset(this.value); this.blur(); }"
                                    title="Type any number of kalli and press Enter"
                                >
                            </div>

                            ${[1, 2, 3, 4, 5].map((c, idx) => `
                                <button 
                                    type="button" 
                                    onclick="window.loadPreset(${c})" 
                                    style="
                                        background: ${g.cols === c ? '#16a34a' : 'transparent'}; 
                                        color: white; 
                                        border: none; 
                                        border-right: ${idx < 4 ? '1px solid rgba(255,255,255,0.18)' : 'none'}; 
                                        padding: 6px 16px; 
                                        font-weight: 700; 
                                        font-size: 0.85rem; 
                                        cursor: pointer; 
                                        transition: all 0.15s ease-in-out;
                                        ${g.cols === c ? 'box-shadow: inset 0 0 10px rgba(0,0,0,0.25);' : ''}
                                    "
                                    title="${c} Kalli (${c * 50}x140 cm)"
                                    onmouseover="if(${g.cols !== c}) this.style.background='rgba(255,255,255,0.08)'"
                                    onmouseout="if(${g.cols !== c}) this.style.background='transparent'"
                                >
                                    ${c} Kalli
                                </button>
                            `).join('')}
                        </div>

                        <!-- Search Bar with Autocomplete Dropdown -->
                        <div style="flex: 1; max-width: 380px; min-width: 240px; margin-left: auto; position: relative;" id="calc-search-container">
                            <div style="position: relative; display: flex; align-items: center;">
                                <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; color: #64748b; pointer-events: none; z-index: 2;">🔍</span>
                                <input 
                                    type="text" 
                                    id="calc-search-bar" 
                                    autocomplete="off"
                                    placeholder="Search window presets, types, or dimensions (e.g. 150x140)..." 
                                    value="${window.calcSearchQuery || ''}"
                                    onfocus="window.openCalcSearchDropdown(this.value)"
                                    oninput="window.handleCalcSearchInput(this.value)"
                                    onkeydown="window.handleCalcSearchKey(event)"
                                    style="width: 100%; padding: 7px 32px 7px 32px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.84rem; outline: none; background: #ffffff !important; color: #0f172a !important; font-weight: 600; caret-color: #0284c7; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                >
                                <button 
                                    type="button" 
                                    id="calc-search-clear-btn"
                                    onclick="window.clearCalcSearch()" 
                                    style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: #e2e8f0; border: none; color: #475569; width: 18px; height: 18px; border-radius: 50%; display: ${window.calcSearchQuery ? 'flex' : 'none'}; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem; font-weight: 700; line-height: 1; padding: 0;"
                                    title="Clear search"
                                >×</button>
                            </div>

                            <div 
                                id="calc-search-dropdown" 
                                style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; width: 100%; max-height: 380px; overflow-y: auto; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 8px; box-shadow: 0 14px 30px -4px rgba(15, 23, 42, 0.25), 0 6px 14px -2px rgba(15, 23, 42, 0.12); z-index: 1000; text-align: left;"
                            ></div>
                        </div>

                    </div>

                </div>

                <!-- 2. 2D INTERACTIVE MODEL CANVAS CONTAINER -->
                <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); position: relative;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></span>
                            <span style="font-size: 0.85rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">Interactive 2D Window Model</span>
                        </div>
                        <div style="font-size: 0.78rem; color: #64748b; font-weight: 600;">
                            Area: <strong>${areaSqFt.toFixed(2)} sq.ft</strong> (${(areaSqFt * 0.0929).toFixed(2)} m²) • Perimeter: <strong>${outerPerimeterFt.toFixed(2)} ft</strong>
                        </div>
                    </div>

                    <!-- Centering Viewport Container (Right-side panel removed per Audio 1 & Image 1; perfectly centered with clearance for AutoCAD dimensions) -->
                    <div style="position: relative; width: 100%; height: 520px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
                        
                        <!-- Floating Armed Command Banner -->
                        <div id="calc-armed-command-banner" style="display: ${window.calcArmedCommand ? 'flex' : 'none'}; position: absolute; top: 12px; left: 50%; transform: translateX(-50%); background: #0f172a; color: #ffffff; padding: 8px 18px; border-radius: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.25); align-items: center; gap: 12px; z-index: 50; border: 1.5px solid #38bdf8; font-size: 0.82rem;">
                            <span class="cmd-text" style="font-weight: 700;">
                                ⚡ ACTIVE COMMAND [${window.calcArmedCommand?.code || ''}]: ${window.calcArmedCommand?.title || ''} — ${window.calcArmedCommand?.help || 'Click any pane to apply'}
                            </span>
                            <button onclick="window.disarmCalcCommand()" style="background: rgba(255,255,255,0.15); border: none; color: #f1f5f9; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: 700;">Cancel (Esc)</button>
                        </div>

                        <!-- Sleek Bottom Floating Shortcuts Bar (Audio 1 & Audio 2: Reminds user of all commands without crowding canvas) -->
                        <div style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); background: rgba(248, 250, 252, 0.95); backdrop-filter: blur(4px); border: 1px solid #cbd5e1; border-radius: 20px; padding: 5px 18px; font-size: 0.72rem; color: #475569; display: flex; align-items: center; gap: 8px; z-index: 20; box-shadow: 0 2px 8px rgba(0,0,0,0.06); pointer-events: none;">
                            <span style="font-weight: 800; color: #1e293b;">⌨️ Shortcuts:</span>
                            <span><strong style="color: #0284c7;">PT</strong> Top</span> •
                            <span><strong style="color: #0284c7;">PM</strong> Mid</span> •
                            <span><strong style="color: #0284c7;">PB</strong> Btm</span> •
                            <span><strong style="color: #0284c7;">PV</strong> Vertical</span> •
                            <span><strong style="color: #0284c7;">R</strong> Rotate</span> •
                            <span><strong style="color: #0284c7;">PPN</strong> Pipes</span> •
                            <span><strong style="color: #0284c7;">NP</strong> Clear</span>
                        </div>

                        <!-- Centered Window Frame Wrapper -->
                        <!-- Centered Window Frame Wrapper"""

if old_canvas_block_pattern.search(content):
    content = old_canvas_block_pattern.sub(new_canvas_block, content, count=1)
    print("Replaced canvas block and removed calc-right-partition-panel successfully!")
else:
    print("WARNING: old_canvas_block_pattern not found!")

# --- 8. Patch Left Height Badge position so it doesn't overlap left CAD dimensions ---
old_left_height_badge = """                            <!-- Left Height Input Badge: Generous Width to prevent digit truncation -->
                            <div style="position: absolute; right: calc(100% + 14px); top: 50%; transform: translateY(-50%);"""

new_left_height_badge = """                            <!-- Left Height Input Badge: Positioned outside the left AutoCAD partition height dimension lines -->
                            <div style="position: absolute; right: calc(100% + 56px); top: 50%; transform: translateY(-50%);"""

if old_left_height_badge in content:
    content = content.replace(old_left_height_badge, new_left_height_badge, 1)
    print("Updated left height badge position.")
else:
    print("WARNING: old_left_height_badge not found!")


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Saved updated calculation.js successfully!")
