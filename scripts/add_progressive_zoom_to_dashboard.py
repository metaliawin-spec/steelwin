import re

with open('js/modules/dashboard.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update createSmartZoomIndiaMapSvg to include ondblclick handler and dynamic town details
svg_search = '<svg id="india-3d-map-svg"'
svg_replace = '<svg id="india-3d-map-svg" ondblclick="window.handleIndiaMapDoubleClick(event)"'
if svg_search in code:
    code = code.replace(svg_search, svg_replace)
    print("Added ondblclick to svg element")
else:
    print("Warning: could not find #india-3d-map-svg tag")

# 2. Add town-level details in Level 2 zoom
# Let's inspect where town-label-group is rendered in dashboard.js
town_label_search = """                        <!-- City Label Text -->
                        <g class="town-label-group" transform="translate(${c.x > 380 ? -4 : 4}, ${c.y > 640 ? -4 : 2})">
                            <text x="0" y="0" 
                                  fill="${c.isOrigin ? '#fbbf24' : c.isCapital ? '#f87171' : '#f1f5f9'}" 
                                  font-size="${c.isOrigin || c.isCapital ? '5.4' : '4.2'}" 
                                  font-weight="${c.isOrigin || c.isCapital ? '700' : '600'}" 
                                  opacity="${c.isOrigin || c.isCapital ? '1' : '0.85'}" 
                                  font-family="'Inter', sans-serif" 
                                  letter-spacing="0.2px"
                                  text-anchor="${c.x > 380 ? 'end' : 'start'}"
                                  style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.95));">
                                ${c.isOrigin ? '★ ' : ''}${c.name}
                            </text>
                        </g>"""

town_label_replace = """                        <!-- City Label & Deep Zoom Town Details -->
                        <g class="town-label-group" transform="translate(${c.x > 380 ? -5 : 5}, ${c.y > 640 ? -4 : 2})">
                            <text x="0" y="0" 
                                  class="town-main-name"
                                  fill="${c.isOrigin ? '#fbbf24' : c.isCapital ? '#f87171' : '#f1f5f9'}" 
                                  font-size="${c.isOrigin || c.isCapital ? '5.6' : '4.4'}" 
                                  font-weight="${c.isOrigin || c.isCapital ? '700' : '600'}" 
                                  opacity="${c.isOrigin || c.isCapital ? '1' : '0.88'}" 
                                  font-family="'Inter', sans-serif" 
                                  letter-spacing="0.2px"
                                  text-anchor="${c.x > 380 ? 'end' : 'start'}"
                                  style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.95));">
                                ${c.isOrigin ? '★ ' : ''}${c.name}
                            </text>
                            
                            <!-- Detailed Town Subtext & PIN (Dynamically revealed on Deep Zoom) -->
                            <text x="0" y="3.6" 
                                  class="town-deep-detail"
                                  fill="#38bdf8" 
                                  font-size="2.8" 
                                  font-weight="600" 
                                  opacity="0" 
                                  font-family="'Inter', monospace"
                                  text-anchor="${c.x > 380 ? 'end' : 'start'}"
                                  style="transition: opacity 0.3s ease; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.9));">
                                PIN ${c.pin} • ${c.orders} Orders
                            </text>
                        </g>"""

if town_label_search in code:
    code = code.replace(town_label_search, town_label_replace)
    print("Added deep zoom town details")
else:
    print("Warning: could not find town_label_search")

# 3. Add the complete Progressive Double-Click Zoom Controller
progressive_zoom_engine = """
    // ============================================================================
    // PROGRESSIVE DOUBLE-CLICK ZOOM-IN & ZOOM-OUT ENGINE (SMOOTH TWEENED ANIMATION)
    // ============================================================================
    window.indiaMapZoomLevel = 0; // 0: Default Full View, 1: Regional Focus, 2: Town-Level Deep Zoom
    window.indiaMapLastClickedTarget = null;

    // Smooth EaseInOutCubic Tween Animation for SVG viewBox
    window.animateSvgViewBox = (svg, targetViewBox, duration = 650, onComplete) => {
        if (!svg) return;
        if (window._currentViewBoxAnimation) {
            cancelAnimationFrame(window._currentViewBoxAnimation);
            window._currentViewBoxAnimation = null;
        }

        const startViewBox = (svg.getAttribute('viewBox') || '0 0 612 696').split(' ').map(Number);
        const [startX, startY, startW, startH] = startViewBox;
        const [targetX, targetY, targetW, targetH] = targetViewBox;

        const startTime = performance.now();
        const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const ease = easeInOutCubic(progress);

            const curX = startX + (targetX - startX) * ease;
            const curY = startY + (targetY - startY) * ease;
            const curW = startW + (targetW - startW) * ease;
            const curH = startH + (targetH - startH) * ease;

            svg.setAttribute('viewBox', `${curX.toFixed(2)} ${curY.toFixed(2)} ${curW.toFixed(2)} ${curH.toFixed(2)}`);

            if (progress < 1) {
                window._currentViewBoxAnimation = requestAnimationFrame(step);
            } else {
                window._currentViewBoxAnimation = null;
                svg.setAttribute('viewBox', `${targetX} ${targetY} ${targetW} ${targetH}`);
                if (onComplete) onComplete();
            }
        };

        window._currentViewBoxAnimation = requestAnimationFrame(step);
    };

    // Transform Client Mouse Coordinates (e.clientX, e.clientY) to SVG User-Space Coordinates
    window.getSvgCoordinates = (e, svg) => {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return { x: 306, y: 348 };
        const svgP = pt.matrixTransform(ctm.inverse());
        return { x: svgP.x, y: svgP.y };
    };

    // Progressive Double-Click Zoom Controller
    window.handleIndiaMapDoubleClick = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const svg = document.getElementById('india-3d-map-svg');
        const pill = document.getElementById('map-active-region-pill');
        const zoomBadge = document.getElementById('map-zoom-level-badge');
        if (!svg) return;

        // Current level cycle: 0 -> 1 -> 2 -> 0
        const currentLevel = window.indiaMapZoomLevel || 0;
        const nextLevel = (currentLevel + 1) % 3;
        window.indiaMapZoomLevel = nextLevel;

        const coords = window.getSvgCoordinates(e, svg);
        const clickX = coords.x;
        const clickY = coords.y;
        window.indiaMapLastClickedTarget = { x: clickX, y: clickY };

        console.log(`[India Map DblClick] Transitioning from Level ${currentLevel} to Level ${nextLevel} at (${clickX.toFixed(1)}, ${clickY.toFixed(1)})`);

        if (nextLevel === 1) {
            // STEP 1: First Double-Click -> Regional Focus Zoom (Level 1)
            const targetW = 250;
            const targetH = 285;
            let targetX = clickX - targetW / 2;
            let targetY = clickY - targetH / 2;

            // Clamp inside SVG frame
            targetX = Math.max(-10, Math.min(612 - targetW + 10, targetX));
            targetY = Math.max(-10, Math.min(696 - targetH + 10, targetY));

            window.animateSvgViewBox(svg, [Math.round(targetX), Math.round(targetY), targetW, targetH], 600, () => {
                // Enhance town labels
                document.querySelectorAll('.town-main-name').forEach(t => t.setAttribute('font-size', '4.0'));
                document.querySelectorAll('.town-deep-detail').forEach(t => t.setAttribute('opacity', '0.6'));
            });

            svg.style.cursor = 'zoom-in';

            if (pill) {
                pill.innerText = `🔍 Level 1: Regional Focus • Double-click to zoom deeper`;
                pill.style.color = '#38bdf8';
                pill.style.borderColor = 'rgba(56, 189, 248, 0.4)';
            }
            if (zoomBadge) {
                zoomBadge.innerHTML = `<span style="color: #38bdf8;">Level 1</span> / 2`;
            }

        } else if (nextLevel === 2) {
            // STEP 2: Second Double-Click -> Precise Town-Level Details (Level 2 / Deep Zoom)
            const targetW = 105;
            const targetH = 120;
            let targetX = clickX - targetW / 2;
            let targetY = clickY - targetH / 2;

            targetX = Math.max(-10, Math.min(612 - targetW + 10, targetX));
            targetY = Math.max(-10, Math.min(696 - targetH + 10, targetY));

            window.animateSvgViewBox(svg, [Math.round(targetX), Math.round(targetY), targetW, targetH], 650, () => {
                // Prominently reveal town-level details, PIN codes, order counts
                document.querySelectorAll('.town-main-name').forEach(t => {
                    t.setAttribute('font-size', '3.0');
                    t.setAttribute('font-weight', '700');
                });
                document.querySelectorAll('.town-deep-detail').forEach(t => {
                    t.setAttribute('opacity', '0.95');
                    t.setAttribute('font-size', '2.2');
                });
            });

            svg.style.cursor = 'zoom-out';

            if (pill) {
                pill.innerText = `🎯 Level 2: Town-Level Deep View • Double-click to reset view`;
                pill.style.color = '#4ade80';
                pill.style.borderColor = 'rgba(34, 197, 94, 0.4)';
            }
            if (zoomBadge) {
                zoomBadge.innerHTML = `<span style="color: #4ade80;">Level 2</span> (Max)`;
            }

        } else {
            // STEP 3: Final Double-Click -> Reset / Full Zoom-Out to Default Framed View
            window.animateSvgViewBox(svg, [0, 0, 612, 696], 650, () => {
                document.querySelectorAll('.town-main-name').forEach(t => t.setAttribute('font-size', '4.4'));
                document.querySelectorAll('.town-deep-detail').forEach(t => t.setAttribute('opacity', '0'));
            });

            svg.style.cursor = 'zoom-in';

            if (pill) {
                pill.innerText = `Official All-India Map: Metropolitan & Logistics View`;
                pill.style.color = '#38bdf8';
                pill.style.borderColor = 'rgba(56, 189, 248, 0.3)';
            }
            if (zoomBadge) {
                zoomBadge.innerHTML = `<span>Level 0</span> / 2`;
            }
        }
    };

    // Non-blocking Location Detail Toast (eliminates window.alert blocking double-click)
    window.showLocationDetail = (town, pin, orders, value, client) => {
        const existing = document.getElementById('map-location-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'map-location-toast';
        toast.style.cssText = `
            position: absolute;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.92);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(56, 189, 248, 0.4);
            border-radius: 8px;
            padding: 8px 16px;
            color: #f8fafc;
            font-size: 0.78rem;
            z-index: 999;
            box-shadow: 0 10px 25px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            gap: 12px;
            pointer-events: auto;
            animation: fadeIn 0.2s ease;
        `;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.1rem; color: #fbbf24;">📍</span>
                <div>
                    <strong style="color: #38bdf8;">${town}</strong> (PIN ${pin}) &bull; <span style="color: #4ade80;">${orders} Active Orders</span> (${value})
                    <div style="font-size: 0.68rem; color: #94a3b8;">Client: ${client} | Dispatched from Central Factory (Kozhikode, PIN 673638)</div>
                </div>
            </div>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #94a3b8; font-size: 1rem; cursor: pointer; padding: 0 4px;">&times;</button>
        `;

        const container = document.querySelector('#india-3d-map-svg')?.parentElement;
        if (container) {
            container.appendChild(toast);
            setTimeout(() => { if (toast && toast.parentElement) toast.remove(); }, 5000);
        }
    };
"""

# Replace the old showLocationDetail and add the progressive zoom engine right before setDashboardMapZoom
old_show_loc = "window.showLocationDetail = (town, pin, orders, value, client) => {"
if old_show_loc in code:
    code = code.replace(old_show_loc, progressive_zoom_engine + "\n    window._legacyShowLoc = (town, pin, orders, value, client) => {")
    print("Injected progressive zoom engine successfully")
else:
    print("Warning: could not find old showLocationDetail")

# 4. Add UI badge / reset button to the map canvas container
map_canvas_wrapper = """<div style="position: relative; flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; min-height: 420px; overflow: hidden; border-radius: var(--radius-md);">"""
map_canvas_enhanced = """<div style="position: relative; flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; min-height: 420px; overflow: hidden; border-radius: var(--radius-md); user-select: none;">
                    
                    <!-- Floating Interactive Zoom Level Badge & Hint -->
                    <div style="position: absolute; top: 12px; right: 14px; z-index: 10; display: flex; align-items: center; gap: 6px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 4px 12px; font-size: 0.72rem; color: #94a3b8; pointer-events: auto;">
                        <span id="map-zoom-level-badge" style="font-weight: 600; color: #f8fafc;"><span>Level 0</span> / 2</span>
                        <span style="opacity: 0.4;">|</span>
                        <span style="font-size: 0.68rem; color: #38bdf8;">Double-click to zoom</span>
                        <button type="button" onclick="window.handleIndiaMapDoubleClick({ clientX: 0, clientY: 0, preventDefault:()=>{}, stopPropagation:()=>{} })" title="Cycle or Reset Zoom" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; color: #38bdf8; font-size: 0.68rem; padding: 2px 7px; cursor: pointer; margin-left: 4px;">
                            Reset
                        </button>
                    </div>"""

if map_canvas_wrapper in code:
    code = code.replace(map_canvas_wrapper, map_canvas_enhanced)
    print("Added floating interactive zoom level badge & hint")
else:
    print("Warning: could not find map_canvas_wrapper")

with open('js/modules/dashboard.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated js/modules/dashboard.js with Progressive Double-Click Zoom successfully!")
