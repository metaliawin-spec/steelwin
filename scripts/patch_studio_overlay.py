with open('js/modules/calculation.js', 'r', encoding='utf-8') as f:
    src = f.read()

target = '''        paneOverlays += `
            <!-- Direct Pane Click Target in Studio -->
            <div 
                onclick="window.selectStudioPane(${i})"
                title="Pane ${i + 1} of ${cw.cols} (Click to select & configure) • Shortcuts: P, PT, PM, PB"
                style="position: absolute; left: ${currentX}px; top: ${innerStartY}px; width: ${drawPaneW}px; height: ${innerH}px; cursor: pointer; z-index: 15; pointer-events: auto; border-radius: 2px; transition: all 0.15s ease; ${isSelectedStudio ? 'box-shadow: inset 0 0 0 2.5px #10b981, inset 0 0 14px rgba(16, 185, 129, 0.22);' : ''}"
                onmouseenter="if(!${isSelectedStudio}) this.style.backgroundColor='rgba(16, 185, 129, 0.08)'"
                onmouseleave="if(!${isSelectedStudio}) this.style.backgroundColor='transparent'"
            ></div>

            <!-- Partition Indicator: Light green theme with 50% opacity/transparency -->
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
                        ${posDisplayStudio}
                    </button>
                ` : ''}
            </div>

            <div style="position: absolute; left: ${currentX}px; top: ${startY + drawH + 8}px; width: ${drawPaneW}px; text-align: center; z-index: 20;">
                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 2px;">W(${cw.unit})</div>
                <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.paneWidths?.[i] || 50}" onchange="window.updateStudioPaneWidth(${i}, this.value)" style="width: 62px; height: 28px; text-align: center; font-weight: 700; font-size: 0.95rem; color: #0f172a; border: 1.5px solid #cbd5e1; border-radius: 5px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none; padding: 2px 4px; box-sizing: border-box;">
            </div>
        `;'''

replacement = '''        paneOverlays += `
            <!-- Direct Pane Click Target in Studio -->
            <div 
                onclick="window.selectStudioPane(${i}, true)"
                title="Pane ${i + 1} of ${cw.cols} (Click to select & configure partition) • Shortcuts: P, PT, PM, PB"
                style="position: absolute; left: ${currentX}px; top: ${innerStartY}px; width: ${drawPaneW}px; height: ${innerH}px; cursor: pointer; z-index: 15; pointer-events: auto; border-radius: 2px; transition: all 0.15s ease; ${isSelectedStudio ? 'box-shadow: inset 0 0 0 2.5px #10b981, inset 0 0 16px rgba(16, 185, 129, 0.22);' : ''}"
                onmouseenter="if(!${isSelectedStudio}) this.style.backgroundColor='rgba(16, 185, 129, 0.08)'"
                onmouseleave="if(!${isSelectedStudio}) this.style.backgroundColor='transparent'"
            ></div>

            <!-- Partition Indicator: Light green theme with 50% opacity/transparency -->
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
                        ${posDisplayStudio}
                    </button>
                ` : ''}
            </div>

            <div style="position: absolute; left: ${currentX}px; top: ${startY + drawH + 8}px; width: ${drawPaneW}px; text-align: center; z-index: 20;">
                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 2px;">W(${cw.unit})</div>
                <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.paneWidths?.[i] || 50}" onchange="window.updateStudioPaneWidth(${i}, this.value)" style="width: 68px; height: 28px; text-align: center; font-weight: 700; font-size: 0.95rem; color: #0f172a; border: 1.5px solid #cbd5e1; border-radius: 5px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none; padding: 2px 2px; box-sizing: border-box; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;">
            </div>
        `;'''

if target in src:
    src = src.replace(target, replacement)
    with open('js/modules/calculation.js', 'w', encoding='utf-8') as f:
        f.write(src)
    print('Studio pane overlay updated successfully!')
else:
    print('Target not found in src')
