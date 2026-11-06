import re
import os

with open('js/modules/calculation.js', 'r', encoding='utf-8') as f:
    calc_src = f.read()

# 1. Add convertUnit at top if not present
if 'export function convertUnit' not in calc_src:
    convert_unit_code = '''
export function convertUnit(val, fromUnit, toUnit) {
    if (val === undefined || val === null || isNaN(val)) return 0;
    const num = Number(val);
    if (!fromUnit || !toUnit || fromUnit === toUnit) return num;
    
    // Normalize fromUnit to mm
    let mm = num;
    const from = String(fromUnit).toLowerCase();
    if (from === 'cm') mm = num * 10;
    else if (from === 'inch' || from === 'in') mm = num * 25.4;
    else if (from === 'ft' || from === 'feet') mm = num * 304.8;
    else if (from === 'm' || from === 'meter') mm = num * 1000;
    
    // Convert mm to toUnit
    const to = String(toUnit).toLowerCase();
    if (to === 'mm') return Math.round(mm);
    if (to === 'cm') return Number((mm / 10).toFixed(1));
    if (to === 'inch' || to === 'in') return Number((mm / 25.4).toFixed(2));
    if (to === 'ft' || to === 'feet') return Number((mm / 304.8).toFixed(2));
    if (to === 'm' || to === 'meter') return Number((mm / 1000).toFixed(3));
    return num;
}
window.convertUnit = convertUnit;
'''
    calc_src = calc_src.replace("import { renderQuotations } from './quotations.js';", "import { renderQuotations } from './quotations.js';" + convert_unit_code)
    print('Added convertUnit to calculation.js')

# 2. Update activeTab === 'quotes' block around lines 343-351
old_quotes_mount = """    if (activeTab === 'quotes') {
        const mount = container.querySelector('#calc-inner-mount');
        if (mount) {
            mount.style.padding = '0';
            mount.style.maxWidth = '100%';
            mount.innerHTML = '';
            mount.appendChild(renderQuotations(state));
        }
    }"""

new_quotes_mount = """    if (activeTab === 'quotes') {
        const mount = container.querySelector('#calc-inner-mount');
        if (mount) {
            if (Store.state.quoteStudio && Store.state.quoteStudio.active) {
                mount.style.padding = '1.25rem';
                mount.style.maxWidth = '1500px';
                mount.innerHTML = renderQuotationStudio(state);
            } else {
                mount.style.padding = '0';
                mount.style.maxWidth = '100%';
                mount.innerHTML = '';
                mount.appendChild(renderQuotations(state));
            }
        }
    }"""

if old_quotes_mount in calc_src:
    calc_src = calc_src.replace(old_quotes_mount, new_quotes_mount)
    print('Updated quotes mount in calculation.js')

with open('js/modules/calculation.js', 'w', encoding='utf-8') as f:
    f.write(calc_src)
print('Phase 1 patch applied successfully.')
