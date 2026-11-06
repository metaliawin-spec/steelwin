import json
import re

with open('js/modules/dashboard.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Expanded list of key Districts, Cities, and Towns across active regions
cities_data = [
    # Kerala Corridor (All Key Districts & Towns)
    {"name": "Kannur", "state": "Kerala", "type": "District", "x": 147, "y": 582, "pin": "670001", "orders": 12, "value": "₹ 85,000", "client": "Apex Hospital Infra"},
    {"name": "Wayanad", "state": "Kerala", "type": "District", "x": 158, "y": 588, "pin": "673121", "orders": 8, "value": "₹ 54,000", "client": "Green Valley Villa"},
    {"name": "Kozhikode", "state": "Kerala", "type": "Central Factory Hub", "x": 152, "y": 597, "pin": "673638", "isOrigin": True, "orders": 38, "value": "₹ 2,45,000", "client": "Central Factory & City Hospital"},
    {"name": "Malappuram", "state": "Kerala", "type": "District", "x": 158, "y": 607, "pin": "676505", "orders": 18, "value": "₹ 1,35,000", "client": "Luxury Villa Project"},
    {"name": "Palakkad", "state": "Kerala", "type": "District", "x": 172, "y": 608, "pin": "678001", "orders": 7, "value": "₹ 52,000", "client": "Malabar Works"},
    {"name": "Thrissur", "state": "Kerala", "type": "District", "x": 162, "y": 618, "pin": "680001", "orders": 14, "value": "₹ 95,000", "client": "Sunrise Builders"},
    {"name": "Kochi", "state": "Kerala", "type": "Metropolitan Hub", "x": 161, "y": 630, "pin": "682001", "orders": 22, "value": "₹ 1,75,000", "client": "WINPRO HQ & Marine Drive"},
    {"name": "Alappuzha", "state": "Kerala", "type": "District", "x": 165, "y": 641, "pin": "688001", "orders": 9, "value": "₹ 62,000", "client": "Backwater Resorts"},
    {"name": "Kottayam", "state": "Kerala", "type": "District", "x": 170, "y": 638, "pin": "686001", "orders": 8, "value": "₹ 58,000", "client": "Rubber City Infra"},
    {"name": "Kollam", "state": "Kerala", "type": "District", "x": 172, "y": 649, "pin": "691001", "orders": 9, "value": "₹ 68,000", "client": "Coastline Residences"},
    {"name": "Thiruvananthapuram", "state": "Kerala", "type": "Capital City", "x": 176, "y": 660, "pin": "695001", "orders": 16, "value": "₹ 1,20,000", "client": "Travancore Commercial"},

    # Tamil Nadu & Karnataka
    {"name": "Coimbatore", "state": "Tamil Nadu", "type": "Industrial Hub", "x": 180, "y": 612, "pin": "641001", "orders": 15, "value": "₹ 1,10,000", "client": "Elite Commercials"},
    {"name": "Salem", "state": "Tamil Nadu", "type": "District", "x": 200, "y": 596, "pin": "636001", "orders": 7, "value": "₹ 48,000", "client": "Steel Authority Complex"},
    {"name": "Tiruchirappalli", "state": "Tamil Nadu", "type": "District", "x": 206, "y": 620, "pin": "620001", "orders": 8, "value": "₹ 58,000", "client": "Cauvery Towers"},
    {"name": "Madurai", "state": "Tamil Nadu", "type": "Metropolitan Hub", "x": 195, "y": 635, "pin": "625001", "orders": 11, "value": "₹ 74,000", "client": "Meenakshi Mall Infra"},
    {"name": "Chennai", "state": "Tamil Nadu", "type": "Metropolitan Hub", "x": 242, "y": 568, "pin": "600001", "orders": 24, "value": "₹ 1,85,000", "client": "Metro Commercial Hub"},
    {"name": "Mangaluru", "state": "Karnataka", "type": "Coastal City", "x": 138, "y": 560, "pin": "575001", "orders": 9, "value": "₹ 64,000", "client": "Portside Commercial"},
    {"name": "Mysuru", "state": "Karnataka", "type": "District", "x": 170, "y": 580, "pin": "570001", "orders": 8, "value": "₹ 56,000", "client": "Royal Heritage Enclosures"},
    {"name": "Bengaluru", "state": "Karnataka", "type": "Metropolitan Hub", "x": 195, "y": 570, "pin": "560001", "orders": 28, "value": "₹ 2,15,000", "client": "Modern Interiors & Tech Park"},
    {"name": "Hubballi", "state": "Karnataka", "type": "District", "x": 145, "y": 508, "pin": "580020", "orders": 7, "value": "₹ 46,000", "client": "North Karnataka Logistics"},

    # Andhra Pradesh & Telangana
    {"name": "Hyderabad", "state": "Telangana", "type": "Metropolitan Hub", "x": 228, "y": 475, "pin": "500001", "orders": 19, "value": "₹ 1,40,000", "client": "Deccan Infra & HITEC City"},
    {"name": "Vijayawada", "state": "Andhra Pradesh", "type": "Commercial City", "x": 265, "y": 508, "pin": "520001", "orders": 10, "value": "₹ 72,000", "client": "Krishna Buildcon"},
    {"name": "Visakhapatnam", "state": "Andhra Pradesh", "type": "Port City", "x": 318, "y": 455, "pin": "530001", "orders": 11, "value": "₹ 78,000", "client": "Vizag Coastal Infra"},

    # Maharashtra & Goa
    {"name": "Mumbai", "state": "Maharashtra", "type": "Metropolitan Hub", "x": 108, "y": 445, "pin": "400001", "orders": 26, "value": "₹ 2,10,000", "client": "Apex Towers & Nariman Pt"},
    {"name": "Greater Mumbai", "state": "Maharashtra", "type": "City Zone", "x": 109, "y": 441, "pin": "400050", "orders": 14, "value": "₹ 1,05,000", "client": "BKC Commercial Hub"},
    {"name": "Vasai-Virar", "state": "Maharashtra", "type": "Town Zone", "x": 107, "y": 436, "pin": "401201", "orders": 9, "value": "₹ 64,000", "client": "Western Outskirts"},
    {"name": "Pune", "state": "Maharashtra", "type": "Metropolitan Hub", "x": 126, "y": 458, "pin": "411001", "orders": 17, "value": "₹ 1,30,000", "client": "Hinjawadi IT Corridor"},
    {"name": "Nashik", "state": "Maharashtra", "type": "District", "x": 128, "y": 424, "pin": "422001", "orders": 8, "value": "₹ 55,000", "client": "Godavari Facades"},
    {"name": "Aurangabad", "state": "Maharashtra", "type": "District", "x": 158, "y": 434, "pin": "431001", "orders": 7, "value": "₹ 48,000", "client": "Ajanta Commercial"},
    {"name": "Nagpur", "state": "Maharashtra", "type": "Metropolitan Hub", "x": 240, "y": 390, "pin": "440001", "orders": 12, "value": "₹ 85,000", "client": "Zero Mile Logistics"},
    {"name": "Panaji", "state": "Goa", "type": "Capital City", "x": 121, "y": 512, "pin": "403001", "orders": 6, "value": "₹ 44,000", "client": "Goa Coastal Villas"},

    # Gujarat
    {"name": "Surat", "state": "Gujarat", "type": "Metropolitan Hub", "x": 88, "y": 385, "pin": "395001", "orders": 15, "value": "₹ 1,12,000", "client": "Diamond Bourse Towers"},
    {"name": "Vadodara", "state": "Gujarat", "type": "District", "x": 90, "y": 355, "pin": "390001", "orders": 11, "value": "₹ 78,000", "client": "Sayaji Corporate Park"},
    {"name": "Ahmedabad", "state": "Gujarat", "type": "Metropolitan Hub", "x": 80, "y": 335, "pin": "380001", "orders": 16, "value": "₹ 1,25,000", "client": "Sabarmati Towers"},
    {"name": "Rajkot", "state": "Gujarat", "type": "District", "x": 40, "y": 350, "pin": "360001", "orders": 8, "value": "₹ 52,000", "client": "Saurashtra Industrial"},

    # Madhya Pradesh & Chhattisgarh
    {"name": "Indore", "state": "Madhya Pradesh", "type": "Metropolitan Hub", "x": 148, "y": 345, "pin": "452001", "orders": 12, "value": "₹ 86,000", "client": "Malwa Corporate Plaza"},
    {"name": "Bhopal", "state": "Madhya Pradesh", "type": "Capital City", "x": 178, "y": 335, "pin": "462001", "orders": 14, "value": "₹ 98,000", "client": "Bhojpal Infrastructure"},
    {"name": "Jabalpur", "state": "Madhya Pradesh", "type": "District", "x": 242, "y": 335, "pin": "482001", "orders": 7, "value": "₹ 46,000", "client": "Narmada Towers"},
    {"name": "Gwalior", "state": "Madhya Pradesh", "type": "District", "x": 188, "y": 258, "pin": "474001", "orders": 9, "value": "₹ 62,000", "client": "Heritage City Infra"},
    {"name": "Raipur", "state": "Chhattisgarh", "type": "Capital City", "x": 288, "y": 388, "pin": "492001", "orders": 10, "value": "₹ 70,000", "client": "Mahanadi Business Bay"},
    {"name": "Bhilai", "state": "Chhattisgarh", "type": "Industrial Town", "x": 278, "y": 392, "pin": "490001", "orders": 6, "value": "₹ 42,000", "client": "Steel City Builders"},

    # Rajasthan
    {"name": "Jaipur", "state": "Rajasthan", "type": "Capital City", "x": 152, "y": 230, "pin": "302001", "orders": 18, "value": "₹ 1,35,000", "client": "Pink City Convention"},
    {"name": "Jodhpur", "state": "Rajasthan", "type": "District", "x": 92, "y": 248, "pin": "342001", "orders": 8, "value": "₹ 58,000", "client": "Marwar Craft Enclosures"},
    {"name": "Kota", "state": "Rajasthan", "type": "Industrial City", "x": 160, "y": 288, "pin": "324001", "orders": 7, "value": "₹ 49,000", "client": "Chambal Heights"},

    # National Capital Region (NCR) & North
    {"name": "NEW DELHI", "state": "Delhi", "type": "Country Capital", "x": 186, "y": 210, "pin": "110001", "isCapital": True, "orders": 32, "value": "₹ 2,60,000", "client": "Central Capital Supplies"},
    {"name": "Faridabad", "state": "Haryana", "type": "Industrial Town", "x": 188, "y": 217, "pin": "121001", "orders": 10, "value": "₹ 75,000", "client": "NCR Manufacturing Park"},
    {"name": "Ghaziabad", "state": "Uttar Pradesh", "type": "Industrial City", "x": 192, "y": 208, "pin": "201001", "orders": 11, "value": "₹ 80,000", "client": "Hindon City Mall"},
    {"name": "Meerut", "state": "Uttar Pradesh", "type": "District", "x": 196, "y": 196, "pin": "250001", "orders": 8, "value": "₹ 56,000", "client": "Expressway Logistics"},
    {"name": "Chandigarh", "state": "Chandigarh", "type": "Union Territory Capital", "x": 179, "y": 160, "pin": "160001", "orders": 14, "value": "₹ 1,02,000", "client": "City Beautiful Towers"},
    {"name": "Ludhiana", "state": "Punjab", "type": "Industrial Hub", "x": 158, "y": 150, "pin": "141001", "orders": 10, "value": "₹ 72,000", "client": "Punjab Industrial Hub"},
    {"name": "Amritsar", "state": "Punjab", "type": "Metropolitan City", "x": 142, "y": 132, "pin": "143001", "orders": 9, "value": "₹ 65,000", "client": "Golden City Enclosures"},
    {"name": "Srinagar", "state": "Jammu & Kashmir", "type": "Capital City", "x": 156, "y": 80, "pin": "190001", "orders": 7, "value": "₹ 50,000", "client": "Dal View Premium"},

    # Uttar Pradesh
    {"name": "Agra", "state": "Uttar Pradesh", "type": "City", "x": 196, "y": 240, "pin": "282001", "orders": 11, "value": "₹ 78,000", "client": "Yamuna Heritage Center"},
    {"name": "Kanpur", "state": "Uttar Pradesh", "type": "Industrial Hub", "x": 245, "y": 256, "pin": "208001", "orders": 14, "value": "₹ 96,000", "client": "Ganga Commercial Enclave"},
    {"name": "Lucknow", "state": "Uttar Pradesh", "type": "Capital City", "x": 258, "y": 248, "pin": "226001", "orders": 16, "value": "₹ 1,18,000", "client": "Awadh City Towers"},
    {"name": "Allahabad", "state": "Uttar Pradesh", "type": "District City", "x": 282, "y": 278, "pin": "211001", "orders": 9, "value": "₹ 64,000", "client": "Sangam Infra Complex"},
    {"name": "Varanasi", "state": "Uttar Pradesh", "type": "Heritage City", "x": 310, "y": 276, "pin": "221001", "orders": 10, "value": "₹ 72,000", "client": "Kashi Gateway Complex"},

    # Eastern
    {"name": "Patna", "state": "Bihar", "type": "Capital City", "x": 352, "y": 272, "pin": "800001", "orders": 12, "value": "₹ 88,000", "client": "Patliputra Business Bay"},
    {"name": "Ranchi", "state": "Jharkhand", "type": "Capital City", "x": 358, "y": 335, "pin": "834001", "orders": 9, "value": "₹ 63,000", "client": "Chota Nagpur Infra"},
    {"name": "Dhanbad", "state": "Jharkhand", "type": "District", "x": 378, "y": 322, "pin": "826001", "orders": 7, "value": "₹ 48,000", "client": "Coalfield Builders"},
    {"name": "Jamshedpur", "state": "Jharkhand", "type": "Industrial City", "x": 378, "y": 346, "pin": "831001", "orders": 11, "value": "₹ 79,000", "client": "Tata Steel Townships"},
    {"name": "Asansol", "state": "West Bengal", "type": "District", "x": 390, "y": 320, "pin": "713301", "orders": 8, "value": "₹ 55,000", "client": "Damodar Industrial"},
    {"name": "Kolkata", "state": "West Bengal", "type": "Metropolitan Hub", "x": 418, "y": 350, "pin": "700001", "orders": 25, "value": "₹ 1,90,000", "client": "Salt Lake IT Hub & Howrah"},
    {"name": "Bhubaneswar", "state": "Odisha", "type": "Capital City", "x": 360, "y": 410, "pin": "751001", "orders": 9, "value": "₹ 62,000", "client": "Kalinga Business Plaza"}
]

cities_json = json.dumps(cities_data, ensure_ascii=False)

# Replace OFFICIAL_METROPOLITAN_CITIES definition
cities_pattern = r"const OFFICIAL_METROPOLITAN_CITIES = \[[\s\S]*?\];"
code = re.sub(cities_pattern, f"const OFFICIAL_METROPOLITAN_CITIES = {cities_json};", code)
print("Updated OFFICIAL_METROPOLITAN_CITIES with districts and towns")

# Replace pin icon and label rendering in createSmartZoomIndiaMapSvg
destinations_layer_pattern = r"<!-- 5\. ALL METROPOLITAN CITIES FROM THE REFERENCE MAP -->[\s\S]*?<\/g>\s*<\/svg>"

new_destinations_layer = """<!-- 5. CUSTOM RED LOCATION MARKER/PIN ICONS & SUBDUED DISTRICT/TOWN LABELS (NO RAW PIN NUMBERS) -->
            <g id="map-destinations-layer">
                ${OFFICIAL_METROPOLITAN_CITIES.map(c => `
                    <g class="map-city-node" transform="translate(${c.x}, ${c.y})" style="cursor: pointer;" onclick="window.showLocationDetail('${c.name}', '${c.pin}', '${c.orders}', '${c.value}', '${c.client}')">
                        ${c.isOrigin ? `
                            <!-- Origin Factory Pin (Kozhikode, PIN 673638) - Gold Executive Beacon Pin -->
                            <circle cx="0" cy="0" r="3" fill="none" stroke="#f59e0b" stroke-width="1.2">
                                <animate attributeName="r" values="3;9;16" dur="2.4s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="1;0.35;0" dur="2.4s" repeatCount="indefinite" />
                            </circle>
                            <ellipse cx="0" cy="0.6" rx="2.5" ry="1.1" fill="rgba(0,0,0,0.6)" />
                            <!-- Teardrop Location Marker Icon pointing down to (0,0) -->
                            <path d="M 0,-9.5 C -3.4,-9.5 -5.2,-7 -5.2,-4 C -5.2,-1 0,0 0,0 C 0,0 5.2,-1 5.2,-4 C 5.2,-7 3.4,-9.5 0,-9.5 Z" 
                                  fill="url(#goldPinGradient)" stroke="#ffffff" stroke-width="0.65" filter="url(#neonPinGlow)" />
                            <circle cx="0" cy="-4.8" r="1.6" fill="#ffffff" />
                        ` : c.isCapital ? `
                            <!-- Country Capital Marker Pin (NEW DELHI) -->
                            <circle cx="0" cy="0" r="2.8" fill="none" stroke="#ef4444" stroke-width="1">
                                <animate attributeName="r" values="2.8;7;13" dur="2.6s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.9;0.3;0" dur="2.6s" repeatCount="indefinite" />
                            </circle>
                            <ellipse cx="0" cy="0.6" rx="2.4" ry="1" fill="rgba(0,0,0,0.6)" />
                            <path d="M 0,-9 C -3.3,-9 -4.9,-6.6 -4.9,-3.8 C -4.9,-1 0,0 0,0 C 0,0 4.9,-1 4.9,-3.8 C 4.9,-6.6 3.3,-9 0,-9 Z" 
                                  fill="url(#redPinGradient)" stroke="#ffffff" stroke-width="0.65" filter="url(#neonPinGlow)" />
                            <rect x="-1.4" y="-5.4" width="2.8" height="2.8" fill="#ffffff" />
                        ` : `
                            <!-- Compact Small Red Location Marker/Pin Icon -->
                            <ellipse cx="0" cy="0.5" rx="1.8" ry="0.85" fill="rgba(0,0,0,0.55)" />
                            <!-- Custom Red Teardrop Map Pin Icon pointing down precisely to (0, 0) -->
                            <path d="M 0,-7.4 C -2.6,-7.4 -4,-5.3 -4,-2.9 C -4,-0.8 0,0 0,0 C 0,0 4,-0.8 4,-2.9 C 4,-5.3 2.6,-7.4 0,-7.4 Z" 
                                  fill="url(#redPinGradient)" 
                                  stroke="rgba(255,255,255,0.9)" 
                                  stroke-width="0.45" 
                                  filter="url(#neonPinGlow)" />
                            <!-- Inner pin dot -->
                            <circle cx="0" cy="-3.6" r="1.1" fill="#ffffff" opacity="0.95" />
                        `}

                        <!-- Subdued District, City, and Town Labels (Half-Brightness / Subtle Low-Opacity Style - NO RAW PIN NUMBERS) -->
                        <g class="town-label-group" transform="translate(${c.x > 380 ? -5.5 : 5.5}, ${c.y > 640 ? -5 : 1.5})">
                            <text x="0" y="0" 
                                  class="town-main-name"
                                  fill="${c.isOrigin ? '#fbbf24' : '#cbd5e1'}" 
                                  font-size="${c.isOrigin ? '4.6' : c.isCapital ? '4.2' : '3.6'}" 
                                  font-weight="${c.isOrigin || c.isCapital ? '700' : '500'}" 
                                  opacity="${c.isOrigin ? '0.88' : c.isCapital ? '0.75' : '0.5'}" 
                                  font-family="'Inter', sans-serif" 
                                  letter-spacing="0.25px"
                                  text-anchor="${c.x > 380 ? 'end' : 'start'}"
                                  style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.9)); transition: all 0.2s ease;">
                                ${c.isOrigin ? '★ ' : ''}${c.name}
                            </text>
                            
                            <!-- Detailed Town Subtext (Active Orders only - strictly NO raw PIN numeric clutter) -->
                            <text x="0" y="3.2" 
                                  class="town-deep-detail"
                                  fill="#38bdf8" 
                                  font-size="2.4" 
                                  font-weight="600" 
                                  opacity="0" 
                                  font-family="'Inter', sans-serif"
                                  text-anchor="${c.x > 380 ? 'end' : 'start'}"
                                  style="transition: opacity 0.3s ease; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.9));">
                                ${c.orders} Active Orders
                            </text>
                        </g>

                        <title>${c.name} (${c.state}): ${c.orders} Orders | ${c.client}</title>
                    </g>
                `).join('')}
            </g>

        </svg>"""

code = re.sub(destinations_layer_pattern, new_destinations_layer, code)
print("Updated destinations layer with custom red pin icons and subdued labels")

# Also add redPinGradient and goldPinGradient in defs if missing
if 'id="redPinGradient"' not in code:
    defs_search = '<filter id="neonPinGlow"'
    defs_replace = """<linearGradient id="redPinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#f87171" />
                    <stop offset="60%" stop-color="#ef4444" />
                    <stop offset="100%" stop-color="#b91c1c" />
                </linearGradient>

                <linearGradient id="goldPinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fef08a" />
                    <stop offset="40%" stop-color="#f59e0b" />
                    <stop offset="100%" stop-color="#b45309" />
                </linearGradient>

                <filter id="neonPinGlow" """
    code = code.replace(defs_search, defs_replace)
    print("Added redPinGradient and goldPinGradient in defs")

# Update font sizes in zoom handlers to keep the half-brightness subtle style
code = code.replace("t.setAttribute('font-size', '4.4')", "t.setAttribute('font-size', '3.6'); t.style.opacity = '0.5'")
code = code.replace("t.setAttribute('font-size', '4.0')", "t.setAttribute('font-size', '3.4'); t.style.opacity = '0.6'")
code = code.replace("t.setAttribute('font-size', '3.0')", "t.setAttribute('font-size', '2.6'); t.style.opacity = '0.75'")

with open('js/modules/dashboard.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated js/modules/dashboard.js with custom red pins, no raw PINs, and subdued half-brightness labels!")
