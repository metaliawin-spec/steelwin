import re

with open('js/modules/calculation.js', 'r', encoding='utf-8') as f:
    src = f.read()

# 1. Update paneOverlays in renderManualCalc
old_overlay_code = """                    <!-- Direct Pane Click Target (Clicking on pane selects this individual pane) -->
                    <div 
                        onclick="window.selectPane(${i})"
                        title="Pane ${i + 1} of ${g.cols} (Click to select) • Shortcuts: P (Add), PT (Top), PM (Middle), PB (Bottom)"
                        style="position: absolute; left: 0; top: ${frameThick}px; width: ${drawPaneW}px; height: ${innerH}px; cursor: pointer; pointer-events: auto; z-index: 10; border-radius: 2px; transition: all 0.15s ease; ${isSelected ? 'box-shadow: inset 0 0 0 2.5px #10b981, inset 0 0 14px rgba(16, 185, 129, 0.22);' : ''}"
                        onmouseenter="if(!${isSelected}) this.style.backgroundColor='rgba(16, 185, 129, 0.08)'"
                        onmouseleave="if(!${isSelected}) this.style.backgroundColor='transparent'"
                    ></div>

                    <!-- Partition Indicator: Light green theme with 50% opacity/transparency (keeping underlying window structure visible) -->
                    <div style="position: absolute; left: 50%; top: ${Math.round(frameThick + (innerH * 0.08))}px; transform: translateX(-50%); pointer-events: auto; display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 15;">
                        <div 
                            onclick="window.cyclePanePartition(${i})" 
                            title="Pane ${i + 1}: Click to cycle partition count (${parts} -> ${(parts + 1) % 3})"
                            style="
                                background: rgba(220, 252, 231, 0.50); 
                                border: 1.5px solid rgba(22, 163, 74, 0.65); 
                                backdrop-filter: blur(2px);
                                border-radius: 6px; 
                                padding: 2px 8px; 
                                display: flex; 
                                flex-direction: column; 
                                align-items: center; 
                                cursor: pointer; 
                                box-shadow: 0 2px 6px rgba(16, 185, 129, 0.15); 
                                user-select: none; 
                                transition: all 0.15s ease;
                                ${isSelected ? 'outline: 2px solid #10b981; outline-offset: 1px;' : ''}
                            "
                            onmouseover="this.style.background='rgba(187, 247, 208, 0.65)'; this.style.transform='scale(1.05)'"
                            onmouseout="this.style.background='rgba(220, 252, 231, 0.50)'; this.style.transform='scale(1)'"
                        >
                            <div style="font-size: 0.90rem; font-weight: 800; color: #14532d; line-height: 1;">${parts}</div>
                            <div style="font-size: 0.50rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                        </div>

                        ${parts === 1 ? `
                            <button 
                                type="button" 
                                onclick="window.cyclePanePartitionPos(${i})"
                                title="Position: Click to change Top -> Middle -> Bottom"
                                style="
                                    background: rgba(20, 83, 45, 0.70); 
                                    color: #ecfdf5; 
                                    border: 1px solid rgba(22, 163, 74, 0.65); 
                                    backdrop-filter: blur(2px);
                                    border-radius: 4px; 
                                    padding: 1px 6px; 
                                    font-size: 0.58rem; 
                                    font-weight: 800; 
                                    text-transform: uppercase; 
                                    cursor: pointer; 
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.12); 
                                    letter-spacing: 0.5px;
                                "
                            >
                                ${posDisplay}
                            </button>
                        ` : ''}
                    </div>

                    <!-- Individual Pane Width Input (Only shown when multi-pane cols > 1) -->
                    ${g.cols > 1 ? `
                        <div style="position: absolute; left: 50%; top: calc(100% + 6px); transform: translateX(-50%); pointer-events: auto; display: flex; flex-direction: column; align-items: center; z-index: 15;">
                            <span style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 1px;">W(${g.unit})</span>
                            <input 
                                type="number" 
                                class="hide-spin" 
                                step="${g.unit === 'mm' ? '10' : '0.5'}" 
                                min="1" 
                                value="${g.paneWidths[i]}" 
                                onchange="window.updateIndividualPaneWidth(${i}, this.value)" 
                                style="width: 62px; height: 28px; text-align: center; font-weight: 700; font-size: 0.95rem; color: #0f172a; border: 1.5px solid #cbd5e1; border-radius: 5px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none; padding: 2px 4px; box-sizing: border-box;"
                            >
                        </div>
                    ` : ''}"""

new_overlay_code = """                    <!-- Direct Pane Click Target (Clicking directly on pane selects / configures this individual pane) -->
                    <div 
                        onclick="window.selectPane(${i}, true)"
                        title="Pane ${i + 1} of ${g.cols} (Click to select & toggle partition) • Shortcuts: P (Add), PT (Top), PM (Middle), PB (Bottom)"
                        style="position: absolute; left: 0; top: ${frameThick}px; width: ${drawPaneW}px; height: ${innerH}px; cursor: pointer; pointer-events: auto; z-index: 10; border-radius: 2px; transition: all 0.15s ease; ${isSelected ? 'box-shadow: inset 0 0 0 2.5px #10b981, inset 0 0 16px rgba(16, 185, 129, 0.22);' : ''}"
                        onmouseenter="if(!${isSelected}) this.style.backgroundColor='rgba(16, 185, 129, 0.08)'"
                        onmouseleave="if(!${isSelected}) this.style.backgroundColor='transparent'"
                    ></div>

                    <!-- Partition Indicator: Light green theme with 50% opacity/transparency (keeping underlying window structure visible) -->
                    <div style="position: absolute; left: 50%; top: ${Math.round(frameThick + (innerH * 0.08))}px; transform: translateX(-50%); pointer-events: auto; display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 15;">
                        <div 
                            onclick="event.stopPropagation(); window.cyclePanePartition(${i})" 
                            title="Pane ${i + 1}: Click to cycle partition count (${parts} -> ${(parts + 1) % 3})"
                            style="
                                background: ${parts === 0 ? 'rgba(240, 253, 244, 0.45)' : 'rgba(220, 252, 231, 0.50)'}; 
                                border: 1.5px ${parts === 0 ? 'dashed rgba(34, 197, 94, 0.50)' : 'solid rgba(22, 163, 74, 0.60)'}; 
                                backdrop-filter: blur(2px);
                                border-radius: 6px; 
                                padding: 2px 10px; 
                                display: flex; 
                                flex-direction: column; 
                                align-items: center; 
                                cursor: pointer; 
                                box-shadow: 0 2px 6px rgba(16, 185, 129, 0.15); 
                                user-select: none; 
                                transition: all 0.15s ease;
                                ${isSelected ? 'outline: 2.5px solid #10b981; outline-offset: 1px;' : ''}
                            "
                            onmouseover="this.style.background='rgba(187, 247, 208, 0.65)'; this.style.transform='scale(1.05)'"
                            onmouseout="this.style.background='${parts === 0 ? 'rgba(240, 253, 244, 0.45)' : 'rgba(220, 252, 231, 0.50)'}'; this.style.transform='scale(1)'"
                        >
                            <div style="font-size: 0.90rem; font-weight: 800; color: #14532d; line-height: 1;">${parts}</div>
                            <div style="font-size: 0.52rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                        </div>

                        ${parts === 1 ? `
                            <button 
                                type="button" 
                                onclick="event.stopPropagation(); window.cyclePanePartitionPos(${i})"
                                title="Position: Click to change Top -> Middle -> Bottom"
                                style="
                                    background: rgba(22, 163, 74, 0.50); 
                                    color: #064e3b; 
                                    border: 1px solid rgba(22, 163, 74, 0.65); 
                                    backdrop-filter: blur(2px);
                                    border-radius: 4px; 
                                    padding: 1px 7px; 
                                    font-size: 0.60rem; 
                                    font-weight: 800; 
                                    text-transform: uppercase; 
                                    cursor: pointer; 
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.10); 
                                    letter-spacing: 0.5px;
                                    transition: all 0.15s ease;
                                "
                                onmouseover="this.style.background='rgba(22, 163, 74, 0.75)'; this.style.color='#ffffff'"
                                onmouseout="this.style.background='rgba(22, 163, 74, 0.50)'; this.style.color='#064e3b'"
                            >
                                ${posDisplay}
                            </button>
                        ` : ''}
                    </div>

                    <!-- Individual Pane Width Input (Only shown when multi-pane cols > 1) -->
                    ${g.cols > 1 ? `
                        <div style="position: absolute; left: 50%; top: calc(100% + 6px); transform: translateX(-50%); pointer-events: auto; display: flex; flex-direction: column; align-items: center; z-index: 15;">
                            <span style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 1px;">W(${g.unit})</span>
                            <input 
                                type="number" 
                                class="hide-spin" 
                                step="${g.unit === 'mm' ? '10' : '0.5'}" 
                                min="1" 
                                value="${g.paneWidths[i]}" 
                                onchange="window.updateIndividualPaneWidth(${i}, this.value)" 
                                style="width: 68px; height: 28px; text-align: center; font-weight: 700; font-size: 0.95rem; color: #0f172a; border: 1.5px solid #cbd5e1; border-radius: 5px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none; padding: 2px 2px; box-sizing: border-box; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;"
                            >
                        </div>
                    ` : ''}"""

if old_overlay_code in src:
    src = src.replace(old_overlay_code, new_overlay_code)
    print("Updated paneOverlays in renderManualCalc")
else:
    print("ERROR: old_overlay_code not matched")

# 2. Update Controller Bar in renderManualCalc to include both Radio Buttons & Dropdown
old_ctrl_bar = """                    <!-- ON-SCREEN MANUAL PANE & PARTITION CONTROLLER BAR (Dual Selection & Control) -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                        
                        <!-- Left: Active Pane Selector -->
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Active Pane:</span>
                            <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                                ${Array.from({length: g.cols}, (_, idx) => `
                                    <button 
                                        type="button" 
                                        onclick="window.selectPane(${idx})"
                                        style="background: ${g.activePaneIndex === idx ? '#10b981' : 'transparent'}; color: ${g.activePaneIndex === idx ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease; ${g.activePaneIndex === idx ? 'box-shadow: 0 1px 3px rgba(0,0,0,0.15);' : ''}"
                                        title="Select Pane ${idx + 1}"
                                    >
                                        Pane ${idx + 1}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Center: Partition Count Toggle for Active Pane -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Partition (P):</span>
                            <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                                ${[0, 1, 2].map(cnt => `
                                    <button 
                                        type="button" 
                                        onclick="window.setPanePartitionCount(${g.activePaneIndex}, ${cnt})"
                                        style="background: ${(g.panePartitions[g.activePaneIndex] || 0) === cnt ? '#0284c7' : 'transparent'}; color: ${(g.panePartitions[g.activePaneIndex] || 0) === cnt ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                        title="${cnt === 0 ? 'No partition' : cnt + ' partition(s)'}"
                                    >
                                        ${cnt === 0 ? 'None (0)' : cnt + ' Part.'}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Right: Position Selector for Active Pane (Top / Middle / Bottom) -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Position:</span>
                            ${(g.panePartitions[g.activePaneIndex] || 0) === 1 ? `
                                <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                                    <button 
                                        type="button" 
                                        onclick="window.setPanePartitionPos(${g.activePaneIndex}, 'top')"
                                        title="Position: Top (Shortcut: PT)"
                                        style="background: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'top' ? '#16a34a' : 'transparent'}; color: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'top' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                    >
                                        ⬆ Top (PT)
                                    </button>
                                    <button 
                                        type="button" 
                                        onclick="window.setPanePartitionPos(${g.activePaneIndex}, 'center')"
                                        title="Position: Middle / Center (Shortcut: PM)"
                                        style="background: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'center' ? '#16a34a' : 'transparent'}; color: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'center' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                    >
                                        ⬍ Middle (PM)
                                    </button>
                                    <button 
                                        type="button" 
                                        onclick="window.setPanePartitionPos(${g.activePaneIndex}, 'bottom')"
                                        title="Position: Bottom (Shortcut: PB)"
                                        style="background: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'bottom' ? '#16a34a' : 'transparent'}; color: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'bottom' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                    >
                                        ⬇ Bottom (PB)
                                    </button>
                                </div>
                            ` : `
                                <span style="font-size: 0.72rem; color: #94a3b8; font-style: italic;">Set 1 partition to choose position</span>
                            `}
                        </div>

                        <!-- Keyboard Shortcut Legend Pill -->
                        <div style="font-size: 0.70rem; font-weight: 700; color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 6px; padding: 4px 9px; display: flex; align-items: center; gap: 6px;">
                            <span>⌨</span>
                            <span><strong>P:</strong> Add | <strong>PT:</strong> Top | <strong>PM:</strong> Mid | <strong>PB:</strong> Bot</span>
                        </div>

                    </div>"""

new_ctrl_bar = """                    <!-- ON-SCREEN MANUAL PANE & PARTITION CONTROLLER BAR (Dual Selection & Control) -->
                    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                        
                        <!-- Left: Active Pane Selector (Radio / Tabs) -->
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Active Pane:</span>
                            <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                                ${Array.from({length: g.cols}, (_, idx) => `
                                    <button 
                                        type="button" 
                                        onclick="window.selectPane(${idx})"
                                        style="display: flex; align-items: center; gap: 5px; background: ${g.activePaneIndex === idx ? '#10b981' : 'transparent'}; color: ${g.activePaneIndex === idx ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease; ${g.activePaneIndex === idx ? 'box-shadow: 0 1px 3px rgba(0,0,0,0.15);' : ''}"
                                        title="Select Pane ${idx + 1} of ${g.cols} (Keyboard: ${idx + 1})"
                                    >
                                        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${g.activePaneIndex === idx ? '#ffffff' : '#94a3b8'};"></span>
                                        Pane ${idx + 1}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Center: Partition Count Toggle for Active Pane (P) -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Partition (P):</span>
                            <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                                ${[0, 1, 2].map(cnt => `
                                    <button 
                                        type="button" 
                                        onclick="window.setPanePartitionCount(${g.activePaneIndex}, ${cnt})"
                                        style="background: ${(g.panePartitions[g.activePaneIndex] || 0) === cnt ? '#0284c7' : 'transparent'}; color: ${(g.panePartitions[g.activePaneIndex] || 0) === cnt ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                        title="${cnt === 0 ? 'No partition' : cnt + ' partition(s)'}"
                                    >
                                        ${cnt === 0 ? 'None (0)' : cnt + ' Part.'}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Right: Position Selector for Active Pane (Radio Buttons + Dropdown Menu) -->
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Position:</span>
                            <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                                <button 
                                    type="button" 
                                    onclick="window.setPanePartitionPos(${g.activePaneIndex}, 'top')"
                                    title="Position: Top (Shortcut: PT)"
                                    style="display: flex; align-items: center; gap: 5px; background: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'top' ? '#16a34a' : 'transparent'}; color: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'top' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                >
                                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'top' ? '#ffffff' : '#94a3b8'};"></span>
                                    ⬆ Top (PT)
                                </button>
                                <button 
                                    type="button" 
                                    onclick="window.setPanePartitionPos(${g.activePaneIndex}, 'center')"
                                    title="Position: Middle / Center (Shortcut: PM)"
                                    style="display: flex; align-items: center; gap: 5px; background: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'center' ? '#16a34a' : 'transparent'}; color: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'center' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                >
                                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'center' ? '#ffffff' : '#94a3b8'};"></span>
                                    ⬍ Middle (PM)
                                </button>
                                <button 
                                    type="button" 
                                    onclick="window.setPanePartitionPos(${g.activePaneIndex}, 'bottom')"
                                    title="Position: Bottom (Shortcut: PB)"
                                    style="display: flex; align-items: center; gap: 5px; background: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'bottom' ? '#16a34a' : 'transparent'}; color: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'bottom' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                >
                                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${(g.partitionPos[g.activePaneIndex] || 'top') === 'bottom' ? '#ffffff' : '#94a3b8'};"></span>
                                    ⬇ Bottom (PB)
                                </button>
                            </div>

                            <!-- Dropdown Menu for Position (Top / Middle / Bottom) -->
                            <select 
                                onchange="window.setPanePartitionPos(${g.activePaneIndex}, this.value)"
                                style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 0.75rem; font-weight: 700; color: #1e293b; outline: none; cursor: pointer;"
                                title="Position Dropdown for Pane ${g.activePaneIndex + 1}"
                            >
                                <option value="top" ${(g.partitionPos[g.activePaneIndex] || 'top') === 'top' ? 'selected' : ''}>Top (PT)</option>
                                <option value="center" ${(g.partitionPos[g.activePaneIndex] || 'top') === 'center' ? 'selected' : ''}>Middle / Center (PM)</option>
                                <option value="bottom" ${(g.partitionPos[g.activePaneIndex] || 'top') === 'bottom' ? 'selected' : ''}>Bottom (PB)</option>
                            </select>
                        </div>

                        <!-- Keyboard Shortcut Legend Pill -->
                        <div style="font-size: 0.70rem; font-weight: 700; color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 6px; padding: 4px 9px; display: flex; align-items: center; gap: 6px;">
                            <span>⌨</span>
                            <span><strong>P:</strong> Add | <strong>PT:</strong> Top | <strong>PM:</strong> Mid | <strong>PB:</strong> Bot</span>
                        </div>

                    </div>"""

if old_ctrl_bar in src:
    src = src.replace(old_ctrl_bar, new_ctrl_bar)
    print("Updated controller bar in renderManualCalc")
else:
    print("ERROR: old_ctrl_bar not matched")

# 3. Update Height and Total W input badges in renderManualCalc (Fix Overflow & Truncation)
old_height_badge = """                            <!-- Left Height Input Badge: Generous Width to prevent digit truncation -->
                            <div style="position: absolute; right: calc(100% + 14px); top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; background: white; padding: 6px 12px; border-radius: 8px; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.08); white-space: nowrap; z-index: 20;">
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 3px; text-transform: uppercase;">HEIGHT (${g.unit})</div>
                                <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalH}" onchange="window.updateGrid('totalH', this.value)" style="width: 82px; height: 34px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #0284c7; border: 1.5px solid #7dd3fc; border-radius: 6px; background: #f8fafc; outline: none; line-height: 1; padding: 2px 6px; box-sizing: border-box; overflow: visible;">
                            </div>"""

new_height_badge = """                            <!-- Left Height Input Badge: Generous Width to prevent digit truncation -->
                            <div style="position: absolute; right: calc(100% + 14px); top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; background: white; padding: 6px 14px; min-width: 104px; border-radius: 8px; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.08); white-space: nowrap; z-index: 20;">
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 3px; text-transform: uppercase;">HEIGHT (${g.unit})</div>
                                <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalH}" onchange="window.updateGrid('totalH', this.value)" style="width: 96px; min-width: 96px; height: 34px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #0284c7; border: 1.5px solid #7dd3fc; border-radius: 6px; background: #f8fafc; outline: none; line-height: 1; padding: 2px 2px; box-sizing: border-box; overflow: visible; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;">
                            </div>"""

if old_height_badge in src:
    src = src.replace(old_height_badge, new_height_badge)
    print("Updated Height input badge in renderManualCalc")
else:
    print("ERROR: old_height_badge not matched")

old_totalw_badge = """                            <!-- Bottom Total Width Badge: Generous Width to prevent digit truncation -->
                            <div style="position: absolute; top: ${totalWTop}; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 6px; background: white; padding: 6px 14px; border-radius: 8px; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.08); white-space: nowrap; z-index: 20;">
                                <span style="font-size: 0.70rem; color: #64748b; font-weight: 700;">TOTAL W:</span>
                                <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalW}" onchange="window.updateGrid('totalW', this.value)" style="width: 80px; height: 32px; text-align: center; font-weight: 800; font-size: 1.05rem; color: #0284c7; border: 1.5px solid #7dd3fc; border-radius: 6px; background: #f8fafc; outline: none; padding: 2px 6px; box-sizing: border-box; overflow: visible;">
                                <span style="font-size: 0.74rem; font-weight: 700; color: #475569;">${g.unit}</span>
                            </div>"""

new_totalw_badge = """                            <!-- Bottom Total Width Badge: Generous Width to prevent digit truncation -->
                            <div style="position: absolute; top: ${totalWTop}; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; background: white; padding: 6px 16px; border-radius: 8px; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.08); white-space: nowrap; z-index: 20;">
                                <span style="font-size: 0.70rem; color: #64748b; font-weight: 700;">TOTAL W:</span>
                                <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalW}" onchange="window.updateGrid('totalW', this.value)" style="width: 96px; min-width: 96px; height: 32px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #0284c7; border: 1.5px solid #7dd3fc; border-radius: 6px; background: #f8fafc; outline: none; padding: 2px 2px; box-sizing: border-box; overflow: visible; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;">
                                <span style="font-size: 0.74rem; font-weight: 700; color: #475569;">${g.unit}</span>
                            </div>"""

if old_totalw_badge in src:
    src = src.replace(old_totalw_badge, new_totalw_badge)
    print("Updated Total W badge in renderManualCalc")
else:
    print("ERROR: old_totalw_badge not matched")

# 4. Update Studio versions in renderQuotationStudio
# Studio overlay
old_studio_overlay = """            <!-- Partition Indicator: Light green theme with 50% opacity/transparency -->
            <div style="position: absolute; left: ${currentX + drawPaneW / 2}px; top: ${innerStartY + 8}px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 25; pointer-events: auto;">
                <div 
                    onclick="window.cycleStudioPartition(${i})" 
                    title="Pane ${i + 1}: Click to cycle partitions (${parts} -> ${(parts + 1) % 3})"
                    style="
                        background: rgba(220, 252, 231, 0.50); 
                        border: 1.5px solid rgba(22, 163, 74, 0.65); 
                        backdrop-filter: blur(2px);
                        border-radius: 5px; 
                        padding: 2px 7px; 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        cursor: pointer; 
                        box-shadow: 0 2px 6px rgba(16, 185, 129, 0.15); 
                        user-select: none; 
                        transition: all 0.15s ease;
                        ${isSelectedStudio ? 'outline: 2px solid #10b981; outline-offset: 1px;' : ''}
                    "
                    onmouseover="this.style.background='rgba(187, 247, 208, 0.65)'; this.style.transform='scale(1.05)'"
                    onmouseout="this.style.background='rgba(220, 252, 231, 0.50)'; this.style.transform='scale(1)'"
                >
                    <div style="font-size: 0.88rem; font-weight: 800; color: #14532d; line-height: 1;">${parts}</div>
                    <div style="font-size: 0.50rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                </div>

                ${parts === 1 ? `
                    <button 
                        type="button" 
                        onclick="window.cycleStudioPartitionPos(${i})"
                        title="Position: Click to change Top -> Middle -> Bottom"
                        style="
                            background: rgba(20, 83, 45, 0.70); 
                            color: #ecfdf5; 
                            border: 1px solid rgba(22, 163, 74, 0.65); 
                            backdrop-filter: blur(2px);
                            border-radius: 4px; 
                            padding: 1px 6px; 
                            font-size: 0.58rem; 
                            font-weight: 800; 
                            text-transform: uppercase; 
                            cursor: pointer; 
                            box-shadow: 0 1px 3px rgba(0,0,0,0.12); 
                            letter-spacing: 0.5px;
                        "
                    >
                        ${posDisplay}
                    </button>
                ` : ''}
            </div>"""

new_studio_overlay = """            <!-- Partition Indicator: Light green theme with 50% opacity/transparency -->
            <div style="position: absolute; left: ${currentX + drawPaneW / 2}px; top: ${innerStartY + 8}px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 25; pointer-events: auto;">
                <div 
                    onclick="event.stopPropagation(); window.cycleStudioPartition(${i})" 
                    title="Pane ${i + 1}: Click to cycle partitions (${parts} -> ${(parts + 1) % 3})"
                    style="
                        background: ${parts === 0 ? 'rgba(240, 253, 244, 0.45)' : 'rgba(220, 252, 231, 0.50)'}; 
                        border: 1.5px ${parts === 0 ? 'dashed rgba(34, 197, 94, 0.50)' : 'solid rgba(22, 163, 74, 0.60)'}; 
                        backdrop-filter: blur(2px);
                        border-radius: 6px; 
                        padding: 2px 9px; 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        cursor: pointer; 
                        box-shadow: 0 2px 6px rgba(16, 185, 129, 0.15); 
                        user-select: none; 
                        transition: all 0.15s ease;
                        ${isSelectedStudio ? 'outline: 2.5px solid #10b981; outline-offset: 1px;' : ''}
                    "
                    onmouseover="this.style.background='rgba(187, 247, 208, 0.65)'; this.style.transform='scale(1.05)'"
                    onmouseout="this.style.background='${parts === 0 ? 'rgba(240, 253, 244, 0.45)' : 'rgba(220, 252, 231, 0.50)'}'; this.style.transform='scale(1)'"
                >
                    <div style="font-size: 0.88rem; font-weight: 800; color: #14532d; line-height: 1;">${parts}</div>
                    <div style="font-size: 0.52rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">PARTITION</div>
                </div>

                ${parts === 1 ? `
                    <button 
                        type="button" 
                        onclick="event.stopPropagation(); window.cycleStudioPartitionPos(${i})"
                        title="Position: Click to change Top -> Middle -> Bottom"
                        style="
                            background: rgba(22, 163, 74, 0.50); 
                            color: #064e3b; 
                            border: 1px solid rgba(22, 163, 74, 0.65); 
                            backdrop-filter: blur(2px);
                            border-radius: 4px; 
                            padding: 1px 7px; 
                            font-size: 0.60rem; 
                            font-weight: 800; 
                            text-transform: uppercase; 
                            cursor: pointer; 
                            box-shadow: 0 1px 3px rgba(0,0,0,0.10); 
                            letter-spacing: 0.5px;
                            transition: all 0.15s ease;
                        "
                        onmouseover="this.style.background='rgba(22, 163, 74, 0.75)'; this.style.color='#ffffff'"
                        onmouseout="this.style.background='rgba(22, 163, 74, 0.50)'; this.style.color='#064e3b'"
                    >
                        ${posDisplay}
                    </button>
                ` : ''}
            </div>"""

if old_studio_overlay in src:
    src = src.replace(old_studio_overlay, new_studio_overlay)
    print("Updated Studio pane overlay in renderQuotationStudio")
else:
    print("ERROR: old_studio_overlay not matched")

# Studio pane direct click
old_studio_click = """            <!-- Direct Pane Click Selection -->
            <div 
                onclick="window.selectStudioPane(${i})"
                title="Pane ${i + 1} (Click to select)"
                style="position: absolute; left: ${currentX}px; top: ${innerStartY}px; width: ${drawPaneW}px; height: ${innerH}px; cursor: pointer; z-index: 15; pointer-events: auto; border-radius: 2px; transition: all 0.15s ease; ${isSelectedStudio ? 'box-shadow: inset 0 0 0 2.5px #10b981, inset 0 0 14px rgba(16, 185, 129, 0.22);' : ''}"
                onmouseenter="if(!${isSelectedStudio}) this.style.backgroundColor='rgba(16, 185, 129, 0.08)'"
                onmouseleave="if(!${isSelectedStudio}) this.style.backgroundColor='transparent'"
            ></div>"""

new_studio_click = """            <!-- Direct Pane Click Selection -->
            <div 
                onclick="window.selectStudioPane(${i}, true)"
                title="Pane ${i + 1} of ${cw.cols} (Click to select & toggle partition) • Shortcuts: P (Add), PT (Top), PM (Middle), PB (Bottom)"
                style="position: absolute; left: ${currentX}px; top: ${innerStartY}px; width: ${drawPaneW}px; height: ${innerH}px; cursor: pointer; z-index: 15; pointer-events: auto; border-radius: 2px; transition: all 0.15s ease; ${isSelectedStudio ? 'box-shadow: inset 0 0 0 2.5px #10b981, inset 0 0 16px rgba(16, 185, 129, 0.22);' : ''}"
                onmouseenter="if(!${isSelectedStudio}) this.style.backgroundColor='rgba(16, 185, 129, 0.08)'"
                onmouseleave="if(!${isSelectedStudio}) this.style.backgroundColor='transparent'"
            ></div>"""

if old_studio_click in src:
    src = src.replace(old_studio_click, new_studio_click)
    print("Updated Studio direct pane click in renderQuotationStudio")
else:
    print("ERROR: old_studio_click not matched")

# Studio controller bar
old_studio_ctrl = """                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    
                    <!-- Left: Active Pane Selector -->
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Active Pane:</span>
                        <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                            ${Array.from({length: cw.cols}, (_, idx) => `
                                <button 
                                    type="button" 
                                    onclick="window.selectStudioPane(${idx})"
                                    style="background: ${cw.activePaneIndex === idx ? '#10b981' : 'transparent'}; color: ${cw.activePaneIndex === idx ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease; ${cw.activePaneIndex === idx ? 'box-shadow: 0 1px 3px rgba(0,0,0,0.15);' : ''}"
                                >
                                    Pane ${idx + 1}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Center: Partition Count Toggle -->
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Partition (P):</span>
                        <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                            ${[0, 1, 2].map(cnt => `
                                <button 
                                    type="button" 
                                    onclick="window.setStudioPanePartitionCount(${cw.activePaneIndex}, ${cnt})"
                                    style="background: ${(cw.panePartitions?.[cw.activePaneIndex] || 0) === cnt ? '#0284c7' : 'transparent'}; color: ${(cw.panePartitions?.[cw.activePaneIndex] || 0) === cnt ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                >
                                    ${cnt === 0 ? 'None (0)' : cnt + ' Part.'}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Right: Position Selector (Top / Middle / Bottom) -->
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Position:</span>
                        ${(cw.panePartitions?.[cw.activePaneIndex] || 0) === 1 ? `
                            <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                                <button 
                                    type="button" 
                                    onclick="window.setStudioPanePartitionPos(${cw.activePaneIndex}, 'top')"
                                    title="Position: Top (Shortcut: PT)"
                                    style="background: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'top' ? '#16a34a' : 'transparent'}; color: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'top' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                >
                                    ⬆ Top (PT)
                                </button>
                                <button 
                                    type="button" 
                                    onclick="window.setStudioPanePartitionPos(${cw.activePaneIndex}, 'center')"
                                    title="Position: Middle / Center (Shortcut: PM)"
                                    style="background: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'center' ? '#16a34a' : 'transparent'}; color: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'center' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                >
                                    ⬍ Middle (PM)
                                </button>
                                <button 
                                    type="button" 
                                    onclick="window.setStudioPanePartitionPos(${cw.activePaneIndex}, 'bottom')"
                                    title="Position: Bottom (Shortcut: PB)"
                                    style="background: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'bottom' ? '#16a34a' : 'transparent'}; color: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'bottom' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                >
                                    ⬇ Bottom (PB)
                                </button>
                            </div>
                        ` : `
                            <span style="font-size: 0.72rem; color: #94a3b8; font-style: italic;">Set 1 partition to choose position</span>
                        `}
                    </div>

                    <!-- Keyboard Shortcut Legend Pill -->
                    <div style="font-size: 0.70rem; font-weight: 700; color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 6px; padding: 4px 9px; display: flex; align-items: center; gap: 6px;">
                        <span>⌨</span>
                        <span><strong>P:</strong> Add | <strong>PT:</strong> Top | <strong>PM:</strong> Mid | <strong>PB:</strong> Bot</span>
                    </div>

                </div>"""

new_studio_ctrl = """                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                    
                    <!-- Left: Active Pane Selector (Radio / Tabs) -->
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Active Pane:</span>
                        <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                            ${Array.from({length: cw.cols}, (_, idx) => `
                                <button 
                                    type="button" 
                                    onclick="window.selectStudioPane(${idx})"
                                    style="display: flex; align-items: center; gap: 5px; background: ${cw.activePaneIndex === idx ? '#10b981' : 'transparent'}; color: ${cw.activePaneIndex === idx ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease; ${cw.activePaneIndex === idx ? 'box-shadow: 0 1px 3px rgba(0,0,0,0.15);' : ''}"
                                    title="Select Pane ${idx + 1} of ${cw.cols} (Keyboard: ${idx + 1})"
                                >
                                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${cw.activePaneIndex === idx ? '#ffffff' : '#94a3b8'};"></span>
                                    Pane ${idx + 1}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Center: Partition Count Toggle -->
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Partition (P):</span>
                        <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                            ${[0, 1, 2].map(cnt => `
                                <button 
                                    type="button" 
                                    onclick="window.setStudioPanePartitionCount(${cw.activePaneIndex}, ${cnt})"
                                    style="background: ${(cw.panePartitions?.[cw.activePaneIndex] || 0) === cnt ? '#0284c7' : 'transparent'}; color: ${(cw.panePartitions?.[cw.activePaneIndex] || 0) === cnt ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                                >
                                    ${cnt === 0 ? 'None (0)' : cnt + ' Part.'}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Right: Position Selector (Top / Middle / Bottom Radio Buttons + Dropdown) -->
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Position:</span>
                        <div style="display: flex; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 6px;">
                            <button 
                                type="button" 
                                onclick="window.setStudioPanePartitionPos(${cw.activePaneIndex}, 'top')"
                                title="Position: Top (Shortcut: PT)"
                                style="display: flex; align-items: center; gap: 5px; background: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'top' ? '#16a34a' : 'transparent'}; color: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'top' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                            >
                                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'top' ? '#ffffff' : '#94a3b8'};"></span>
                                ⬆ Top (PT)
                            </button>
                            <button 
                                type="button" 
                                onclick="window.setStudioPanePartitionPos(${cw.activePaneIndex}, 'center')"
                                title="Position: Middle / Center (Shortcut: PM)"
                                style="display: flex; align-items: center; gap: 5px; background: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'center' ? '#16a34a' : 'transparent'}; color: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'center' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                            >
                                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'center' ? '#ffffff' : '#94a3b8'};"></span>
                                ⬍ Middle (PM)
                            </button>
                            <button 
                                type="button" 
                                onclick="window.setStudioPanePartitionPos(${cw.activePaneIndex}, 'bottom')"
                                title="Position: Bottom (Shortcut: PB)"
                                style="display: flex; align-items: center; gap: 5px; background: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'bottom' ? '#16a34a' : 'transparent'}; color: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'bottom' ? '#ffffff' : '#334155'}; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;"
                            >
                                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'bottom' ? '#ffffff' : '#94a3b8'};"></span>
                                ⬇ Bottom (PB)
                            </button>
                        </div>

                        <!-- Dropdown Menu for Position -->
                        <select 
                            onchange="window.setStudioPanePartitionPos(${cw.activePaneIndex}, this.value)"
                            style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 0.75rem; font-weight: 700; color: #1e293b; outline: none; cursor: pointer;"
                            title="Position Dropdown for Pane ${cw.activePaneIndex + 1}"
                        >
                            <option value="top" ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'top' ? 'selected' : ''}>Top (PT)</option>
                            <option value="center" ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'center' ? 'selected' : ''}>Middle / Center (PM)</option>
                            <option value="bottom" ${(cw.partitionPos?.[cw.activePaneIndex] || 'top') === 'bottom' ? 'selected' : ''}>Bottom (PB)</option>
                        </select>
                    </div>

                    <!-- Keyboard Shortcut Legend Pill -->
                    <div style="font-size: 0.70rem; font-weight: 700; color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 6px; padding: 4px 9px; display: flex; align-items: center; gap: 6px;">
                        <span>⌨</span>
                        <span><strong>P:</strong> Add | <strong>PT:</strong> Top | <strong>PM:</strong> Mid | <strong>PB:</strong> Bot</span>
                    </div>

                </div>"""

if old_studio_ctrl in src:
    src = src.replace(old_studio_ctrl, new_studio_ctrl)
    print("Updated Studio controller bar in renderQuotationStudio")
else:
    print("ERROR: old_studio_ctrl not matched")

# Studio Height and Total W badges
old_studio_height = """                    <!-- Left Height Input Badge: Generous Width to prevent digit truncation -->
                    <div style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; z-index: 30; background: white; padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                        <div style="font-size: 0.68rem; color: #64748b; font-weight: 700; margin-bottom: 2px;">HEIGHT (${cw.unit})</div>
                        <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.totalH}" onchange="window.updateStudioGrid('totalH', this.value)" style="width: 82px; height: 34px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 5px; background: #ffffff; outline: none; padding: 2px 6px; box-sizing: border-box; overflow: visible;">
                    </div>"""

new_studio_height = """                    <!-- Left Height Input Badge: Generous Width to prevent digit truncation -->
                    <div style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; z-index: 30; background: white; padding: 6px 14px; min-width: 104px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                        <div style="font-size: 0.68rem; color: #64748b; font-weight: 700; margin-bottom: 2px;">HEIGHT (${cw.unit})</div>
                        <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.totalH}" onchange="window.updateStudioGrid('totalH', this.value)" style="width: 96px; min-width: 96px; height: 34px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 5px; background: #ffffff; outline: none; padding: 2px 2px; box-sizing: border-box; overflow: visible; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;">
                    </div>"""

if old_studio_height in src:
    src = src.replace(old_studio_height, new_studio_height)
    print("Updated Studio Height badge in renderQuotationStudio")
else:
    print("ERROR: old_studio_height not matched")

old_studio_width = """                    <!-- Bottom Width Badge: Generous Width to prevent digit truncation -->
                    <div style="position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; z-index: 30; background: white; padding: 6px 14px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                        <span style="font-size: 0.72rem; color: #64748b; font-weight: 700;">TOTAL W:</span>
                        <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.totalW}" onchange="window.updateStudioGrid('totalW', this.value)" style="width: 80px; height: 32px; text-align: center; font-weight: 800; font-size: 1.05rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 5px; background: #ffffff; outline: none; padding: 2px 6px; box-sizing: border-box; overflow: visible;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: #475569;">${cw.unit}</span>
                    </div>"""

new_studio_width = """                    <!-- Bottom Width Badge: Generous Width to prevent digit truncation -->
                    <div style="position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; z-index: 30; background: white; padding: 6px 16px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                        <span style="font-size: 0.72rem; color: #64748b; font-weight: 700;">TOTAL W:</span>
                        <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.totalW}" onchange="window.updateStudioGrid('totalW', this.value)" style="width: 96px; min-width: 96px; height: 32px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 5px; background: #ffffff; outline: none; padding: 2px 2px; box-sizing: border-box; overflow: visible; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: #475569;">${cw.unit}</span>
                    </div>"""

if old_studio_width in src:
    src = src.replace(old_studio_width, new_studio_width)
    print("Updated Studio Width badge in renderQuotationStudio")
else:
    print("ERROR: old_studio_width not matched")

with open('js/modules/calculation.js', 'w', encoding='utf-8') as f:
    f.write(src)

print("Patching completed successfully!")
