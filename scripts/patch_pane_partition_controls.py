import re
import sys

def apply_render_calc_patch():
    filepath = 'js/modules/calculation.js'
    with open(filepath, 'r', encoding='utf-8') as f:
        src = f.read()

    # 1. Update defaults inside renderManualCalc to ensure 20x20 tube and orientations
    old_init = """        const rc = state.rateCalc;
        if (!rc.materials) rc.materials = {};
        if (rc.materials.frame === undefined) rc.materials.frame = 'prof_box';
        if (rc.materials.pipe === undefined) rc.materials.pipe = 'tube_sq_1x1';"""

    new_init = """        const rc = state.rateCalc;
        if (!rc.materials) rc.materials = {};
        if (rc.materials.frame === undefined) rc.materials.frame = 'prof_box';
        if (rc.materials.pipe === undefined || rc.materials.pipe === 'tube_sq_1x1') rc.materials.pipe = 'tube_sq_20x20';"""

    if old_init in src:
        src = src.replace(old_init, new_init, 1)
        print("Updated default pipe to 20x20 square tube.")

    # 2. Update keydown listener in renderManualCalc to use calcShortcutSequence and armed commands
    old_keydown_block = """                // Shortcut 'P': Activate partition mode or add/cycle partition on the selected pane
                if (key === 'p') {
                    e.preventDefault();
                    window.calcShortcutBuffer.key = 'p';
                    clearTimeout(window.calcShortcutBuffer.timer);
                    window.calcShortcutBuffer.timer = setTimeout(() => {
                        window.calcShortcutBuffer.key = null;
                    }, 1500);

                    if (!targetObj.panePartitions) targetObj.panePartitions = Array(cols).fill(0);
                    const cur = targetObj.panePartitions[activeIdx] || 0;
                    targetObj.panePartitions[activeIdx] = cur === 0 ? 1 : ((cur + 1) % 3);
                    if (!targetObj.partitionPos) targetObj.partitionPos = Array(cols).fill('top');
                    Store.notify();
                    return;
                }

                // Check for PT, PM, PB sequence or direct T, M, B on partitioned pane
                const hasPBuffer = window.calcShortcutBuffer.key === 'p';
                const hasPartition = (targetObj.panePartitions?.[activeIdx] || 0) > 0;

                if (key === 't' && (hasPBuffer || hasPartition)) {
                    e.preventDefault();
                    window.calcShortcutBuffer.key = null;
                    clearTimeout(window.calcShortcutBuffer.timer);
                    if (!targetObj.panePartitions) targetObj.panePartitions = Array(cols).fill(0);
                    if ((targetObj.panePartitions[activeIdx] || 0) === 0) targetObj.panePartitions[activeIdx] = 1;
                    if (!targetObj.partitionPos) targetObj.partitionPos = Array(cols).fill('top');
                    targetObj.partitionPos[activeIdx] = 'top';
                    Store.notify();
                    return;
                }

                if (key === 'm' && (hasPBuffer || hasPartition)) {
                    e.preventDefault();
                    window.calcShortcutBuffer.key = null;
                    clearTimeout(window.calcShortcutBuffer.timer);
                    if (!targetObj.panePartitions) targetObj.panePartitions = Array(cols).fill(0);
                    if ((targetObj.panePartitions[activeIdx] || 0) === 0) targetObj.panePartitions[activeIdx] = 1;
                    if (!targetObj.partitionPos) targetObj.partitionPos = Array(cols).fill('top');
                    targetObj.partitionPos[activeIdx] = 'center'; // Middle / Center
                    Store.notify();
                    return;
                }

                if (key === 'b' && (hasPBuffer || hasPartition)) {
                    e.preventDefault();
                    window.calcShortcutBuffer.key = null;
                    clearTimeout(window.calcShortcutBuffer.timer);
                    if (!targetObj.panePartitions) targetObj.panePartitions = Array(cols).fill(0);
                    if ((targetObj.panePartitions[activeIdx] || 0) === 0) targetObj.panePartitions[activeIdx] = 1;
                    if (!targetObj.partitionPos) targetObj.partitionPos = Array(cols).fill('top');
                    targetObj.partitionPos[activeIdx] = 'bottom';
                    Store.notify();
                    return;
                }"""

    new_keydown_block = """                // Handle Escape to disarm command or close popovers
                if (key === 'escape') {
                    if (window.calcArmedCommand) {
                        e.preventDefault();
                        window.disarmCalcCommand();
                        return;
                    }
                    if (typeof window.closePartitionPosDropdown === 'function') {
                        window.closePartitionPosDropdown();
                    }
                    return;
                }

                // Append to sequence buffer (Audios 1, 3, 4, 6: PT, PM, PB, R, PN, PPN, NP)
                window.calcShortcutSequence = (window.calcShortcutSequence || '') + key;
                clearTimeout(window.calcShortcutTimer);
                window.calcShortcutTimer = setTimeout(() => {
                    window.calcShortcutSequence = '';
                }, 1800);

                const seq = window.calcShortcutSequence;

                // PT: Partition Top (Arms command, then click pane to apply)
                if (seq.endsWith('pt')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_TOP', 'PT', 'Top Partition', 'Click any pane to apply Top Partition');
                    return;
                }

                // PM: Partition Middle (Arms command, then click pane to apply)
                if (seq.endsWith('pm')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_MIDDLE', 'PM', 'Middle Partition', 'Click any pane to apply Middle Partition');
                    return;
                }

                // PB: Partition Bottom (Arms command, then click pane to apply)
                if (seq.endsWith('pb')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_BOTTOM', 'PB', 'Bottom Partition', 'Click any pane to apply Bottom Partition');
                    return;
                }

                // PPN: Per-Pane Pipe Number (Arms command, then click pane to input pipe count)
                if (seq.endsWith('ppn')) {
                    e.preventDefault();
                    window.armCalcCommand('SET_PANE_PIPES', 'PPN', 'Set Pane Pipe Count', 'Click a pane to enter pipe count');
                    return;
                }

                // PN: Global Pipe Number across window (Prompts immediately)
                if (seq.endsWith('pn')) {
                    e.preventDefault();
                    window.calcShortcutSequence = '';
                    window.promptGlobalPipeCount();
                    return;
                }

                // NP: Remove Pipes from pane (Arms command, then click pane to remove pipes)
                if (seq.endsWith('np')) {
                    e.preventDefault();
                    window.armCalcCommand('REMOVE_PIPES', 'NP', 'Remove Pipes', 'Click a pane to remove all pipes');
                    return;
                }

                // R: Rotate grill pipes orientation in pane (Arms command, then click pane to toggle Horizontal ⮂ Vertical)
                if (key === 'r') {
                    e.preventDefault();
                    window.armCalcCommand('ROTATE_GRILL', 'R', 'Rotate Grill Pipes', 'Click any pane to rotate pipes (Horizontal ⮂ Vertical)');
                    return;
                }"""

    if old_keydown_block in src:
        src = src.replace(old_keydown_block, new_keydown_block, 1)
        print("Updated keydown listener with armed command workflow.")
    else:
        print("NOTE: old_keydown_block not found exactly, searching...")

    # 3. Update Pipe BOM & Labor Calculation in renderManualCalc
    old_pipe_calc = """        // Material 2: Pipe (Vertical Mullions between panes + Horizontal Partitions)
        let partitionLenFt = 0;
        let totalPartitionDividers = 0;
        if (!pipeItem.isNone) {
            for (let i = 0; i < g.cols; i++) {
                const parts = g.panePartitions[i] || 0;
                if (parts > 0) {
                    totalPartitionDividers += parts;
                    const pw_mm = convertUnit(g.paneWidths[i], g.unit, 'mm');
                    partitionLenFt += parts * ((pw_mm / 25.4) / 12);
                }
            }
        }
        const pipeLenFt = pipeItem.isNone ? 0 : (((g.cols - 1) * h_ft) + partitionLenFt);
        const pipeWeightKg = pipeItem.isNone ? 0 : (pipeLenFt * (pipeItem.weightFactor || 1.15));
        const pipeSubtotal = pipeItem.isNone ? 0 : (pipeWeightKg * (pipeItem.rate || 95));"""

    new_pipe_calc = """        // Material 2: Pipe (Vertical Mullions + Horizontal Partitions + Security Grill Tubes)
        // Ensure arrays for orientations and custom counts
        if (!g.paneTubeOrientations) g.paneTubeOrientations = Array(g.cols).fill('horizontal');
        if (!g.paneTubeCounts) g.paneTubeCounts = Array(g.cols).fill(null);

        let partitionLenFt = 0;
        let totalPartitionDividers = 0;
        let totalGrillPipes = 0;
        let totalGrillLengthCm = 0;

        const totalInnerWCm = convertUnit(g.totalW, g.unit, 'cm') - (g.cols > 1 ? (g.cols - 1) * 2.5 : 0);
        const totalInnerHCm = convertUnit(g.totalH, g.unit, 'cm') - 8;

        for (let i = 0; i < g.cols; i++) {
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
                const gr = computePaneGrill(paneW_cm, totalInnerHCm, paneOrient, paneCount);
                totalGrillPipes += gr.count;
                totalGrillLengthCm += gr.totalLengthCm;
            } else if (parts === 1) {
                const pos = (g.partitionPos && g.partitionPos[i]) || 'top';
                let pyFrac = pos === 'center' ? 0.50 : (pos === 'bottom' ? 0.65 : 0.35);
                const h1_cm = totalInnerHCm * pyFrac;
                const h2_cm = totalInnerHCm * (1 - pyFrac);
                const gr1 = computePaneGrill(paneW_cm, h1_cm, paneOrient, paneCount ? Math.round(paneCount * pyFrac) : null);
                const gr2 = computePaneGrill(paneW_cm, h2_cm, paneOrient, paneCount ? Math.round(paneCount * (1 - pyFrac)) : null);
                totalGrillPipes += gr1.count + gr2.count;
                totalGrillLengthCm += gr1.totalLengthCm + gr2.totalLengthCm;
            } else {
                const hEach = totalInnerHCm / (parts + 1);
                for (let p = 0; p <= parts; p++) {
                    const gr = computePaneGrill(paneW_cm, hEach, paneOrient, paneCount ? Math.round(paneCount / (parts + 1)) : null);
                    totalGrillPipes += gr.count;
                    totalGrillLengthCm += gr.totalLengthCm;
                }
            }
        }

        const mullionCount = g.cols - 1;
        const totalPipePieces = totalGrillPipes + mullionCount + totalPartitionDividers;
        const totalGrillLengthFt = (totalGrillLengthCm / 2.54) / 12;
        const pipeLenFt = pipeItem.isNone ? 0 : (((g.cols - 1) * h_ft) + partitionLenFt + totalGrillLengthFt);
        const totalPipeMeters = (pipeLenFt * 0.3048);
        const pipeWeightKg = pipeItem.isNone ? 0 : (pipeLenFt * (pipeItem.weightFactor || 0.95));
        const pipeSubtotal = pipeItem.isNone ? 0 : (pipeWeightKg * (pipeItem.rate || 95));"""

    if old_pipe_calc in src:
        src = src.replace(old_pipe_calc, new_pipe_calc, 1)
        print("Updated pipe calculation with grill tubes, count, and meters.")

    # 4. Update Labor Charges calculation in renderManualCalc
    old_labor_calc = """        // Cost Totals
        const totalMaterialCost = frameSubtotal + pipeSubtotal + panelSubtotal + hingeSubtotal + paintSubtotal + hookSubtotal + lockSubtotal;
        const laborCharges = parseFloat(p.laborCharge ?? 800) || 0;
        const profitMarginPercent = parseFloat(p.profitMarginPercent ?? 15) || 0;
        const baseCost = totalMaterialCost + laborCharges;"""

    new_labor_calc = """        // Cost Totals & Dynamic Labor Charges (Audio 7: Normal vs Partitioned Pane Rates)
        const totalMaterialCost = frameSubtotal + pipeSubtotal + panelSubtotal + hingeSubtotal + paintSubtotal + hookSubtotal + lockSubtotal;
        
        const laborRates = Store.state.laborRates || { normalPaneRate: 500, partitionedPaneRate: 800 };
        let normalPanesCount = 0;
        let partitionedPanesCount = 0;
        for (let i = 0; i < g.cols; i++) {
            if ((g.panePartitions && g.panePartitions[i] || 0) > 0) partitionedPanesCount++;
            else normalPanesCount++;
        }
        const autoLaborCharge = (normalPanesCount * (laborRates.normalPaneRate || 500)) + (partitionedPanesCount * (laborRates.partitionedPaneRate || 800));
        
        // Auto-assign labor charge if standard default 800 or unassigned
        if (p.laborCharge === undefined || p.laborCharge === null || p.laborCharge === 800) {
            p.laborCharge = autoLaborCharge;
        }
        const laborCharges = parseFloat(p.laborCharge ?? autoLaborCharge) || 0;
        const profitMarginPercent = parseFloat(p.profitMarginPercent ?? 15) || 0;
        const baseCost = totalMaterialCost + laborCharges;"""

    if old_labor_calc in src:
        src = src.replace(old_labor_calc, new_labor_calc, 1)
        print("Updated Labor Charges calculation.")

    # Write intermediate
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(src)
    return True

apply_render_calc_patch()
