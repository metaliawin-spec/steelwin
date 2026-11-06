import json
import re

with open('scripts/india_svg_data.json', 'r', encoding='utf-8') as f:
    india_data = json.load(f)

# Load current dashboard.js
with open('js/modules/dashboard.js', 'r', encoding='utf-8') as f:
    dashboard_code = f.read()

# Build the complete state paths array in JS
state_paths_js = json.dumps(india_data['locations'], ensure_ascii=False)

# Build the cities list with exact coordinates
cities_data = [
    # Kerala Corridor (from South to North)
    {"name": "Kannur", "state": "Kerala", "x": 147, "y": 582, "pin": "670001", "orders": 12, "value": "₹ 85,000", "client": "Apex Hospital Infra"},
    {"name": "Kozhikode", "state": "Kerala", "x": 152, "y": 597, "pin": "673638", "isOrigin": True, "orders": 38, "value": "₹ 2,45,000", "client": "Central Factory & City Hospital"},
    {"name": "Malappuram", "state": "Kerala", "x": 158, "y": 607, "pin": "676505", "orders": 18, "value": "₹ 1,35,000", "client": "Luxury Villa Project"},
    {"name": "Thrissur", "state": "Kerala", "x": 162, "y": 618, "pin": "680001", "orders": 14, "value": "₹ 95,000", "client": "Sunrise Builders"},
    {"name": "Kochi", "state": "Kerala", "x": 161, "y": 630, "pin": "682001", "orders": 22, "value": "₹ 1,75,000", "client": "WINPRO HQ & Marine Drive"},
    {"name": "Kollam", "state": "Kerala", "x": 172, "y": 649, "pin": "691001", "orders": 9, "value": "₹ 68,000", "client": "Kollam Coastline Residences"},
    {"name": "Thiruvananthapuram", "state": "Kerala", "x": 176, "y": 660, "pin": "695001", "orders": 16, "value": "₹ 1,20,000", "client": "Travancore Commercial Center"},

    # Tamil Nadu & Karnataka
    {"name": "Coimbatore", "state": "Tamil Nadu", "x": 180, "y": 612, "pin": "641001", "orders": 15, "value": "₹ 1,10,000", "client": "Elite Commercials"},
    {"name": "Tiruchirappalli", "state": "Tamil Nadu", "x": 206, "y": 620, "pin": "620001", "orders": 8, "value": "₹ 58,000", "client": "Cauvery Towers"},
    {"name": "Madurai", "state": "Tamil Nadu", "x": 195, "y": 635, "pin": "625001", "orders": 11, "value": "₹ 74,000", "client": "Meenakshi Mall Infra"},
    {"name": "Chennai", "state": "Tamil Nadu", "x": 242, "y": 568, "pin": "600001", "orders": 24, "value": "₹ 1,85,000", "client": "Metro Commercial Hub"},
    {"name": "Bengaluru", "state": "Karnataka", "x": 195, "y": 570, "pin": "560001", "orders": 28, "value": "₹ 2,15,000", "client": "Modern Interiors & Tech Park"},

    # Andhra Pradesh & Telangana
    {"name": "Hyderabad", "state": "Telangana", "x": 228, "y": 475, "pin": "500001", "orders": 19, "value": "₹ 1,40,000", "client": "Deccan Infra & HITEC City"},
    {"name": "Vijayawada", "state": "Andhra Pradesh", "x": 265, "y": 508, "pin": "520001", "orders": 10, "value": "₹ 72,000", "client": "Krishna Buildcon"},

    # Maharashtra & Goa
    {"name": "Mumbai", "state": "Maharashtra", "x": 108, "y": 445, "pin": "400001", "orders": 26, "value": "₹ 2,10,000", "client": "Apex Towers & Nariman Pt"},
    {"name": "Greater Mumbai", "state": "Maharashtra", "x": 109, "y": 441, "pin": "400050", "orders": 14, "value": "₹ 1,05,000", "client": "Bandra Kurla Complex"},
    {"name": "Vasai-Virar", "state": "Maharashtra", "x": 107, "y": 436, "pin": "401201", "orders": 9, "value": "₹ 64,000", "client": "Western Outskirts Residency"},
    {"name": "Pune", "state": "Maharashtra", "x": 126, "y": 458, "pin": "411001", "orders": 17, "value": "₹ 1,30,000", "client": "Hinjawadi IT Corridor"},
    {"name": "Nashik", "state": "Maharashtra", "x": 128, "y": 424, "pin": "422001", "orders": 8, "value": "₹ 55,000", "client": "Godavari Facades"},
    {"name": "Aurangabad", "state": "Maharashtra", "x": 158, "y": 434, "pin": "431001", "orders": 7, "value": "₹ 48,000", "client": "Ajanta Commercial"},
    {"name": "Nagpur", "state": "Maharashtra", "x": 240, "y": 390, "pin": "440001", "orders": 12, "value": "₹ 85,000", "client": "Zero Mile Logistics"},

    # Gujarat
    {"name": "Surat", "state": "Gujarat", "x": 88, "y": 385, "pin": "395001", "orders": 15, "value": "₹ 1,12,000", "client": "Diamond Bourse Towers"},
    {"name": "Vadodara", "state": "Gujarat", "x": 90, "y": 355, "pin": "390001", "orders": 11, "value": "₹ 78,000", "client": "Sayaji Corporate Park"},
    {"name": "Rajkot", "state": "Gujarat", "x": 40, "y": 350, "pin": "360001", "orders": 8, "value": "₹ 52,000", "client": "Saurashtra Industrial"},

    # Madhya Pradesh & Chhattisgarh
    {"name": "Indore", "state": "Madhya Pradesh", "x": 148, "y": 345, "pin": "452001", "orders": 12, "value": "₹ 86,000", "client": "Malwa Corporate Plaza"},
    {"name": "Bhopal", "state": "Madhya Pradesh", "x": 178, "y": 335, "pin": "462001", "orders": 14, "value": "₹ 98,000", "client": "Bhojpal Infrastructure"},
    {"name": "Jabalpur", "state": "Madhya Pradesh", "x": 242, "y": 335, "pin": "482001", "orders": 7, "value": "₹ 46,000", "client": "Narmada Towers"},
    {"name": "Gwalior", "state": "Madhya Pradesh", "x": 188, "y": 258, "pin": "474001", "orders": 9, "value": "₹ 62,000", "client": "Heritage City Infra"},
    {"name": "Raipur", "state": "Chhattisgarh", "x": 288, "y": 388, "pin": "492001", "orders": 10, "value": "₹ 70,000", "client": "Mahanadi Business Bay"},
    {"name": "Bhilai", "state": "Chhattisgarh", "x": 278, "y": 392, "pin": "490001", "orders": 6, "value": "₹ 42,000", "client": "Steel City Builders"},

    # Rajasthan
    {"name": "Jaipur", "state": "Rajasthan", "x": 152, "y": 230, "pin": "302001", "orders": 18, "value": "₹ 1,35,000", "client": "Pink City Convention"},
    {"name": "Jodhpur", "state": "Rajasthan", "x": 92, "y": 248, "pin": "342001", "orders": 8, "value": "₹ 58,000", "client": "Marwar Craft Enclosures"},
    {"name": "Kota", "state": "Rajasthan", "x": 160, "y": 288, "pin": "324001", "orders": 7, "value": "₹ 49,000", "client": "Chambal Heights"},

    # National Capital Region (NCR) & North
    {"name": "NEW DELHI", "state": "Delhi", "x": 186, "y": 210, "pin": "110001", "isCapital": True, "orders": 32, "value": "₹ 2,60,000", "client": "Central Capital Supplies"},
    {"name": "Faridabad", "state": "Haryana", "x": 188, "y": 217, "pin": "121001", "orders": 10, "value": "₹ 75,000", "client": "NCR Manufacturing Park"},
    {"name": "Ghaziabad", "state": "Uttar Pradesh", "x": 192, "y": 208, "pin": "201001", "orders": 11, "value": "₹ 80,000", "client": "Hindon City Mall"},
    {"name": "Meerut", "state": "Uttar Pradesh", "x": 196, "y": 196, "pin": "250001", "orders": 8, "value": "₹ 56,000", "client": "Expressway Logistics"},
    {"name": "Chandigarh", "state": "Chandigarh", "x": 179, "y": 160, "pin": "160001", "orders": 14, "value": "₹ 1,02,000", "client": "City Beautiful Towers"},
    {"name": "Ludhiana", "state": "Punjab", "x": 158, "y": 150, "pin": "141001", "orders": 10, "value": "₹ 72,000", "client": "Punjab Industrial Hub"},
    {"name": "Amritsar", "state": "Punjab", "x": 142, "y": 132, "pin": "143001", "orders": 9, "value": "₹ 65,000", "client": "Golden City Enclosures"},
    {"name": "Srinagar", "state": "Jammu & Kashmir", "x": 156, "y": 80, "pin": "190001", "orders": 7, "value": "₹ 50,000", "client": "Dal View Premium"},

    # Uttar Pradesh
    {"name": "Agra", "state": "Uttar Pradesh", "x": 196, "y": 240, "pin": "282001", "orders": 11, "value": "₹ 78,000", "client": "Yamuna Heritage Center"},
    {"name": "Kanpur", "state": "Uttar Pradesh", "x": 245, "y": 256, "pin": "208001", "orders": 14, "value": "₹ 96,000", "client": "Ganga Commercial Enclave"},
    {"name": "Lucknow", "state": "Uttar Pradesh", "x": 258, "y": 248, "pin": "226001", "orders": 16, "value": "₹ 1,18,000", "client": "Awadh City Towers"},
    {"name": "Allahabad", "state": "Uttar Pradesh", "x": 282, "y": 278, "pin": "211001", "orders": 9, "value": "₹ 64,000", "client": "Sangam Infra Complex"},
    {"name": "Varanasi", "state": "Uttar Pradesh", "x": 310, "y": 276, "pin": "221001", "orders": 10, "value": "₹ 72,000", "client": "Kashi Gateway Complex"},

    # Eastern
    {"name": "Patna", "state": "Bihar", "x": 352, "y": 272, "pin": "800001", "orders": 12, "value": "₹ 88,000", "client": "Patliputra Business Bay"},
    {"name": "Ranchi", "state": "Jharkhand", "x": 358, "y": 335, "pin": "834001", "orders": 9, "value": "₹ 63,000", "client": "Chota Nagpur Infra"},
    {"name": "Dhanbad", "state": "Jharkhand", "x": 378, "y": 322, "pin": "826001", "orders": 7, "value": "₹ 48,000", "client": "Coalfield Builders"},
    {"name": "Jamshedpur", "state": "Jharkhand", "x": 378, "y": 346, "pin": "831001", "orders": 11, "value": "₹ 79,000", "client": "Tata Steel Townships"},
    {"name": "Asansol", "state": "West Bengal", "x": 390, "y": 320, "pin": "713301", "orders": 8, "value": "₹ 55,000", "client": "Damodar Industrial"},
    {"name": "Kolkata", "state": "West Bengal", "x": 418, "y": 350, "pin": "700001", "orders": 25, "value": "₹ 1,90,000", "client": "Salt Lake IT Hub & Howrah"}
]
cities_json = json.dumps(cities_data, ensure_ascii=False)

# Replacement function for createSmartZoomIndiaMapSvg
new_function_code = f"""// ============================================================================
// 100% POLITICALLY ACCURATE OFFICIAL INDIA MAP VECTOR ENGINE
// Matches Official Political & Metropolitan Map of India with All State Boundaries & Cities
// ============================================================================

const OFFICIAL_INDIA_STATE_PATHS = {state_paths_js};

const OFFICIAL_METROPOLITAN_CITIES = {cities_json};

function createSmartZoomIndiaMapSvg() {{
    const origin = {{ x: 152, y: 597 }}; // Kozhikode (PIN 673638)

    // Dynamic Trajectory routes radiating from factory origin PIN 673638 (Kozhikode)
    const keyCorridors = [
        {{ name: 'Kannur', targetX: 147, targetY: 582, dur: '1.8s', delay: '0.1s' }},
        {{ name: 'Malappuram', targetX: 158, targetY: 607, dur: '2.0s', delay: '0.2s' }},
        {{ name: 'Thrissur', targetX: 162, targetY: 618, dur: '2.2s', delay: '0.3s' }},
        {{ name: 'Kochi', targetX: 161, targetY: 630, dur: '2.4s', delay: '0.4s' }},
        {{ name: 'Kollam', targetX: 172, targetY: 649, dur: '2.6s', delay: '0.5s' }},
        {{ name: 'Thiruvananthapuram', targetX: 176, targetY: 660, dur: '2.8s', delay: '0.6s' }},
        {{ name: 'Coimbatore', targetX: 180, targetY: 612, dur: '2.5s', delay: '0.4s' }},
        {{ name: 'Madurai', targetX: 195, targetY: 635, dur: '2.9s', delay: '0.7s' }},
        {{ name: 'Bengaluru', targetX: 195, targetY: 570, dur: '3.0s', delay: '0.8s' }},
        {{ name: 'Chennai', targetX: 242, targetY: 568, dur: '3.3s', delay: '1.0s' }},
        {{ name: 'Hyderabad', targetX: 228, targetY: 475, dur: '3.6s', delay: '1.2s' }},
        {{ name: 'Mumbai', targetX: 108, targetY: 445, dur: '3.8s', delay: '1.4s' }},
        {{ name: 'Surat', targetX: 88, targetY: 385, dur: '4.0s', delay: '1.5s' }},
        {{ name: 'Bhopal', targetX: 178, targetY: 335, dur: '4.2s', delay: '1.6s' }},
        {{ name: 'NEW DELHI', targetX: 186, targetY: 210, dur: '4.6s', delay: '1.8s' }},
        {{ name: 'Kolkata', targetX: 418, targetY: 350, dur: '4.8s', delay: '2.0s' }}
    ];

    const trajectories = keyCorridors.map(c => {{
        const midX = (origin.x + c.targetX) / 2 + (c.targetX < origin.x ? -15 : 15);
        const midY = (origin.y + c.targetY) / 2;
        const pathD = `M ${{origin.x}},${{origin.y}} Q ${{midX}},${{midY}} ${{c.targetX}},${{c.targetY}}`;
        return {{
            ...c,
            path: pathD
        }};
    }});

    // Prominent State Name Labels on Map (Subtle 50% opacity, crisp typography)
    const stateLabels = [
        {{ name: 'JAMMU & KASHMIR', x: 172, y: 55 }},
        {{ name: 'LADAKH', x: 215, y: 70 }},
        {{ name: 'HIMACHAL PRADESH', x: 190, y: 133 }},
        {{ name: 'PUNJAB', x: 145, y: 165 }},
        {{ name: 'UTTARAKHAND', x: 232, y: 175 }},
        {{ name: 'HARYANA', x: 164, y: 195 }},
        {{ name: 'RAJASTHAN', x: 119, y: 257 }},
        {{ name: 'UTTAR PRADESH', x: 265, y: 245 }},
        {{ name: 'BIHAR', x: 368, y: 275 }},
        {{ name: 'GUJARAT', x: 65, y: 355 }},
        {{ name: 'MADHYA PRADESH', x: 214, y: 319 }},
        {{ name: 'JHARKHAND', x: 365, y: 326 }},
        {{ name: 'WEST BENGAL', x: 411, y: 310 }},
        {{ name: 'ODISHA', x: 340, y: 405 }},
        {{ name: 'CHHATTISGARH', x: 295, y: 387 }},
        {{ name: 'MAHARASHTRA', x: 179, y: 435 }},
        {{ name: 'TELANGANA', x: 237, y: 456 }},
        {{ name: 'ANDHRA PRADESH', x: 263, y: 500 }},
        {{ name: 'KARNATAKA', x: 170, y: 518 }},
        {{ name: 'TAMIL NADU', x: 211, y: 610 }},
        {{ name: 'KERALA', x: 145, y: 635 }},
        {{ name: 'ASSAM', x: 516, y: 271 }},
        {{ name: 'ARUNACHAL PRADESH', x: 550, y: 224 }}
    ];

    // Default Full India ViewBox: 0 0 612 696 matching official India map
    return `
        <svg id="india-3d-map-svg" viewBox="0 0 612 696" style="width: 100%; height: 100%; max-height: 520px; filter: drop-shadow(0 15px 35px rgba(0,0,0,0.65)); transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);">
            <defs>
                <linearGradient id="indiaStateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#0e1f33" />
                    <stop offset="50%" stop-color="#112942" />
                    <stop offset="100%" stop-color="#0a1828" />
                </linearGradient>

                <linearGradient id="keralaHighlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#0f3426" />
                    <stop offset="100%" stop-color="#072017" />
                </linearGradient>

                <linearGradient id="indiaSlabShadow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#030810" />
                    <stop offset="100%" stop-color="#010408" />
                </linearGradient>

                <filter id="neonPinGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
                    <feMerge>
                        <feMergeNode in="blur2" />
                        <feMergeNode in="blur1" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <linearGradient id="trajectoryLaser" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.95" />
                    <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.9" />
                    <stop offset="100%" stop-color="#22c55e" stop-opacity="1" />
                </linearGradient>
            </defs>

            <!-- 1. 3D ELEVATION BASE SLAB LAYER -->
            <g id="india-3d-base-layer" transform="translate(4, 7)" opacity="0.85">
                ${{OFFICIAL_INDIA_STATE_PATHS.map(st => `
                    <path d="${{st.path}}" fill="url(#indiaSlabShadow)" stroke="#000000" stroke-width="0.8" />
                `).join('')}}
            </g>

            <!-- 2. AUTHENTIC POLITICAL STATES & STATE BOUNDARIES OF INDIA -->
            <g id="india-states-layer">
                ${{OFFICIAL_INDIA_STATE_PATHS.map(st => `
                    <path id="state-${{st.id}}" data-state-name="${{st.name}}" d="${{st.path}}" 
                          fill="${{st.id === 'kl' ? 'url(#keralaHighlightGrad)' : 'url(#indiaStateGrad)'}}" 
                          stroke="${{st.id === 'kl' ? '#22c55e' : 'rgba(56, 189, 248, 0.45)'}}" 
                          stroke-width="${{st.id === 'kl' ? '1.4' : '0.85'}}" 
                          stroke-linejoin="round"
                          style="transition: all 0.25s ease; cursor: pointer;"
                          onmouseover="this.style.fill='rgba(56, 189, 248, 0.28)'; this.style.stroke='#38bdf8';"
                          onmouseout="this.style.fill='${{st.id === 'kl' ? 'url(#keralaHighlightGrad)' : 'url(#indiaStateGrad)'}}'; this.style.stroke='${{st.id === 'kl' ? '#22c55e' : 'rgba(56, 189, 248, 0.45)'}}';">
                        <title>${{st.name}}</title>
                    </path>
                `).join('')}}
            </g>

            <!-- 3. STATE NAMES ON MAP -->
            <g id="map-state-names" pointer-events="none">
                ${{stateLabels.map(st => `
                    <text x="${{st.x}}" y="${{st.y}}" fill="#94a3b8" font-size="5.8" font-weight="700" opacity="0.48" text-anchor="middle" font-family="'Inter', sans-serif" letter-spacing="0.4px">
                        ${{st.name}}
                    </text>
                `).join('')}}
            </g>

            <!-- 4. ANIMATED SUPPLY ROUTE TRAJECTORIES RADIATING FROM PIN 673638 (KOZHIKODE) -->
            <g id="map-trajectories" pointer-events="none">
                ${{trajectories.map(tr => `
                    <path d="${{tr.path}}" fill="none" stroke="rgba(34, 197, 94, 0.22)" stroke-width="0.8" stroke-dasharray="2,2" />
                    <path class="supply-trajectory-line" d="${{tr.path}}" fill="none" stroke="url(#trajectoryLaser)" stroke-width="1.3" style="animation-duration: ${{tr.dur}}; animation-delay: ${{tr.delay}};" filter="url(#neonPinGlow)" />
                    <circle r="2.2" fill="#4ade80" filter="url(#neonPinGlow)">
                        <animateMotion path="${{tr.path}}" dur="${{tr.dur}}" begin="${{tr.delay}}" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0;1;1;0" dur="${{tr.dur}}" begin="${{tr.delay}}" repeatCount="indefinite" />
                    </circle>
                `).join('')}}
            </g>

            <!-- 5. ALL METROPOLITAN CITIES FROM THE REFERENCE MAP -->
            <g id="map-destinations-layer">
                ${{OFFICIAL_METROPOLITAN_CITIES.map(c => `
                    <g class="map-city-node" transform="translate(${{c.x}}, ${{c.y}})" style="cursor: pointer;" onclick="window.showLocationDetail('${{c.name}}', '${{c.pin}}', '${{c.orders}}', '${{c.value}}', '${{c.client}}')">
                        ${{c.isOrigin ? `
                            <!-- Central Origin Ping (Kozhikode, PIN 673638) -->
                            <circle cx="0" cy="0" r="3" fill="none" stroke="#f59e0b" stroke-width="1.4">
                                <animate attributeName="r" values="3;10;18" dur="2.2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="1;0.4;0" dur="2.2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="0" cy="0" r="5" fill="rgba(245, 158, 11, 0.35)" />
                            <circle cx="0" cy="0" r="3.2" fill="#fbbf24" stroke="#ffffff" stroke-width="1.2" filter="url(#neonPinGlow)" />
                        ` : c.isCapital ? `
                            <!-- Country Capital (New Delhi) -->
                            <rect x="-3.5" y="-3.5" width="7" height="7" fill="none" stroke="#ef4444" stroke-width="1.2">
                                <animate attributeName="stroke-width" values="1.2;2;1.2" dur="2s" repeatCount="indefinite" />
                            </rect>
                            <rect x="-2" y="-2" width="4" height="4" fill="#ef4444" />
                        ` : `
                            <!-- Standard Metropolitan City (Red dot as in reference map) -->
                            <circle cx="0" cy="0" r="2.2" fill="none" stroke="#ef4444" stroke-width="0.8">
                                <animate attributeName="r" values="2.2;6;10" dur="3s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.8;0.2;0" dur="3s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="0" cy="0" r="2.5" fill="#ef4444" stroke="#ffffff" stroke-width="0.7" filter="url(#neonPinGlow)" />
                        `}}

                        <!-- City Label Text -->
                        <g class="town-label-group" transform="translate(${{c.x > 380 ? -4 : 4}}, ${{c.y > 640 ? -4 : 2}})">
                            <text x="0" y="0" 
                                  fill="${{c.isOrigin ? '#fbbf24' : c.isCapital ? '#f87171' : '#f1f5f9'}}" 
                                  font-size="${{c.isOrigin || c.isCapital ? '5.4' : '4.2'}}" 
                                  font-weight="${{c.isOrigin || c.isCapital ? '700' : '600'}}" 
                                  opacity="${{c.isOrigin || c.isCapital ? '1' : '0.85'}}" 
                                  font-family="'Inter', sans-serif" 
                                  letter-spacing="0.2px"
                                  text-anchor="${{c.x > 380 ? 'end' : 'start'}}"
                                  style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.95));">
                                ${{c.isOrigin ? '★ ' : ''}}${{c.name}}
                            </text>
                        </g>

                        <title>${{c.name}} (${{c.state}}, PIN ${{c.pin}}): ${{c.orders}} Active Orders | ${{c.client}}</title>
                    </g>
                `).join('')}}
            </g>

        </svg>
    `;
}}
"""

# Regex find createSmartZoomIndiaMapSvg function and replace it
# Pattern from function createSmartZoomIndiaMapSvg() until the next section
pattern = r"function createSmartZoomIndiaMapSvg\(\) \{[\s\S]*?\n\}"
match = re.search(pattern, dashboard_code)
if not match:
    print("Error: Could not locate createSmartZoomIndiaMapSvg in dashboard.js")
    exit(1)

dashboard_code = dashboard_code[:match.start()] + new_function_code + dashboard_code[match.end():]

# Now update the zoom handlers in window.setDashboardMapZoom, window.zoomDashboardMapIn, window.zoomDashboardMapOut
new_zoom_handlers = """    window.setDashboardMapZoom = (mode) => {
        const svg = document.getElementById('india-3d-map-svg');
        const smartBtn = document.getElementById('btn-zoom-smart');
        const allBtn = document.getElementById('btn-zoom-all-india');
        const pill = document.getElementById('map-active-region-pill');
        if (!svg) return;

        window.dashboardMapCurrentZoom = mode;

        if (mode === 'all_india') {
            svg.setAttribute('viewBox', '0 0 612 696');
            if (smartBtn) smartBtn.classList.remove('active');
            if (allBtn) allBtn.classList.add('active');
            if (pill) {
                pill.innerText = 'All-India National Logistics View (Official)';
                pill.style.color = '#4ade80';
                pill.style.borderColor = 'rgba(34, 197, 94, 0.4)';
            }
            document.querySelectorAll('.town-label-group text').forEach(t => t.setAttribute('font-size', '4.4'));
        } else {
            // Smart Zoom into Kerala & Southern Active Cluster
            svg.setAttribute('viewBox', '125 545 135 130');
            if (smartBtn) smartBtn.classList.add('active');
            if (allBtn) allBtn.classList.remove('active');
            if (pill) {
                pill.innerText = 'Smart-Zoom: Kerala & South (Active Sales)';
                pill.style.color = '#38bdf8';
                pill.style.borderColor = 'rgba(56, 189, 248, 0.4)';
            }
            document.querySelectorAll('.town-label-group text').forEach(t => t.setAttribute('font-size', '3.6'));
        }
    };

    window.zoomDashboardMapIn = () => {
        const svg = document.getElementById('india-3d-map-svg');
        if (!svg) return;
        const currentViewBox = svg.getAttribute('viewBox').split(' ').map(Number);
        const [x, y, w, h] = currentViewBox;
        if (w > 80) {
            const newW = w * 0.8;
            const newH = h * 0.8;
            const newX = x + (w - newW) / 2;
            const newY = y + (h - newH) / 2;
            svg.setAttribute('viewBox', `${newX} ${newY} ${newW} ${newH}`);
        }
    };

    window.zoomDashboardMapOut = () => {
        const svg = document.getElementById('india-3d-map-svg');
        if (!svg) return;
        const currentViewBox = svg.getAttribute('viewBox').split(' ').map(Number);
        const [x, y, w, h] = currentViewBox;
        if (w < 612) {
            const newW = Math.min(612, w * 1.25);
            const newH = Math.min(696, h * 1.25);
            const newX = Math.max(0, x - (newW - w) / 2);
            const newY = Math.max(0, y - (newH - h) / 2);
            svg.setAttribute('viewBox', `${newX} ${newY} ${newW} ${newH}`);
        }
    };"""

zoom_pattern = r"window\.setDashboardMapZoom = \(mode\) => \{[\s\S]*?window\.zoomDashboardMapOut = \(\) => \{[\s\S]*?\n    \};"
zoom_match = re.search(zoom_pattern, dashboard_code)
if zoom_match:
    dashboard_code = dashboard_code[:zoom_match.start()] + new_zoom_handlers + dashboard_code[zoom_match.end():]
    print("Replaced zoom handlers successfully!")
else:
    print("Warning: Could not match zoom handlers pattern")

# Also update the top map header pill to reflect official view by default
dashboard_code = dashboard_code.replace("Smart Auto-Framed: Active Sales Regions", "Official All-India Map: Metropolitan & Logistics View")
dashboard_code = dashboard_code.replace("Smart auto-framed from origin factory PIN 673638", "Official Political Boundaries & Metropolitan Logistics Corridor from PIN 673638")

# Write back
with open('js/modules/dashboard.js', 'w', encoding='utf-8') as f:
    f.write(dashboard_code)

print("Updated js/modules/dashboard.js with official India map successfully!")
