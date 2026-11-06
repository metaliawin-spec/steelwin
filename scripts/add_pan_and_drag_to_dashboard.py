import re

with open('js/modules/dashboard.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update the hint in the badge to mention "Double-click to zoom • Drag to pan"
badge_search = '<span style="font-size: 0.68rem; color: #38bdf8;">Double-click to zoom</span>'
badge_replace = '<span style="font-size: 0.68rem; color: #38bdf8;">Double-click to zoom &bull; Drag to pan</span>'
if badge_search in code:
    code = code.replace(badge_search, badge_replace)
    print("Updated badge hint text")

# 2. Call initIndiaMapPanAndDrag in the setTimeout
init_search = "initDashboardDualScroll();"
init_replace = "initDashboardDualScroll();\n        initIndiaMapPanAndDrag();"
if init_search in code and "initIndiaMapPanAndDrag();" not in code:
    code = code.replace(init_search, init_replace, 1)
    print("Added initIndiaMapPanAndDrag call in dashboard render")

# 3. Add the complete initIndiaMapPanAndDrag implementation
pan_and_drag_code = """
// ============================================================================
// INTERACTIVE MAP PAN AND DRAG ENGINE (FLUID & HIGHLY RESPONSIVE)
// Supports smooth mouse drag and touch panning across both zoomed & default views
// ============================================================================

window.indiaMapHasDragged = false;

function initIndiaMapPanAndDrag() {
    const svg = document.getElementById('india-3d-map-svg');
    if (!svg) return;

    let isDragging = false;
    let startScreenX = 0;
    let startScreenY = 0;
    let startVb = [0, 0, 612, 696];
    let dragDistance = 0;

    const setCursor = (grabbing) => {
        if (grabbing) {
            svg.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
        } else {
            document.body.style.cursor = '';
            svg.style.cursor = 'grab';
        }
    };

    // Initial cursor
    setCursor(false);
    svg.style.touchAction = 'none';

    // Pointer Down (Mouse click / touch press)
    const onPointerDown = (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return; // Left click only
        if (e.target.closest('button')) return;

        // Cancel any active smooth tween animation
        if (window._currentViewBoxAnimation) {
            cancelAnimationFrame(window._currentViewBoxAnimation);
            window._currentViewBoxAnimation = null;
        }

        isDragging = true;
        dragDistance = 0;
        startScreenX = e.clientX;
        startScreenY = e.clientY;

        const currentVb = (svg.getAttribute('viewBox') || '0 0 612 696').split(' ').map(Number);
        startVb = currentVb;

        svg.style.transition = 'none';
        setCursor(true);

        try {
            svg.setPointerCapture(e.pointerId);
        } catch (err) {}
    };

    // Pointer Move (Fluid dragging)
    const onPointerMove = (e) => {
        if (!isDragging) return;

        const deltaScreenX = e.clientX - startScreenX;
        const deltaScreenY = e.clientY - startScreenY;
        dragDistance = Math.hypot(deltaScreenX, deltaScreenY);

        if (dragDistance > 4) {
            window.indiaMapHasDragged = true;
        }

        const rect = svg.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const [origX, origY, origW, origH] = startVb;

        // Convert screen pixel delta to SVG coordinate delta
        const scaleX = origW / rect.width;
        const scaleY = origH / rect.height;

        let newX = origX - deltaScreenX * scaleX;
        let newY = origY - deltaScreenY * scaleY;

        // Natural soft boundaries with comfortable panning margin
        const padX = Math.max(40, origW * 0.2);
        const padY = Math.max(40, origH * 0.2);
        const minX = -padX;
        const maxX = 612 - origW + padX;
        const minY = -padY;
        const maxY = 696 - origH + padY;

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));

        svg.setAttribute('viewBox', `${newX.toFixed(2)} ${newY.toFixed(2)} ${origW} ${origH}`);
    };

    // Pointer Up / Cancel (Release)
    const onPointerUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        setCursor(false);

        try {
            if (e && e.pointerId) svg.releasePointerCapture(e.pointerId);
        } catch (err) {}

        // Keep hasDragged flag true momentarily so any pending click event doesn't trigger detail toast
        setTimeout(() => {
            window.indiaMapHasDragged = false;
        }, 120);
    };

    // Remove any previous listener duplicates
    svg.removeEventListener('pointerdown', svg._onPanDown);
    svg.removeEventListener('pointermove', svg._onPanMove);
    svg.removeEventListener('pointerup', svg._onPanUp);
    svg.removeEventListener('pointercancel', svg._onPanUp);

    svg._onPanDown = onPointerDown;
    svg._onPanMove = onPointerMove;
    svg._onPanUp = onPointerUp;

    svg.addEventListener('pointerdown', onPointerDown);
    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerup', onPointerUp);
    svg.addEventListener('pointercancel', onPointerUp);

    console.log('[India Map Pan/Drag] Successfully initialized fluid pointer panning mechanics.');
}
window.initIndiaMapPanAndDrag = initIndiaMapPanAndDrag;
"""

# Inject before createSmartZoomIndiaMapSvg
if "function initIndiaMapPanAndDrag" not in code:
    code = pan_and_drag_code + "\n\n" + code
    print("Injected initIndiaMapPanAndDrag function")

# Also ensure showLocationDetail ignores click when dragged
loc_check = "if (window.indiaMapHasDragged) return;"
if loc_check not in code:
    code = code.replace("window.showLocationDetail = (town, pin, orders, value, client) => {", 
                        "window.showLocationDetail = (town, pin, orders, value, client) => {\n        if (window.indiaMapHasDragged) return;")
    print("Added hasDragged check to showLocationDetail")

with open('js/modules/dashboard.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated js/modules/dashboard.js with Pan and Drag support successfully!")
