const fs = require('fs');
const path = require('path');

const calcPath = path.join(__dirname, '..', 'js', 'modules', 'calculation.js');
let content = fs.readFileSync(calcPath, 'utf8');

// 1. Ensure convertUnit is defined near top
const convertUnitCode = `
// --- SHARED UNIT CONVERTER (cm, mm, inch, ft, m) ---
function convertUnit(val, fromUnit, toUnit) {
    if (val === undefined || val === null || isNaN(val)) return 0;
    if (fromUnit === toUnit) return parseFloat(val);
    const num = parseFloat(val);
    let mm = num;
    if (fromUnit === 'cm') mm = num * 10;
    else if (fromUnit === 'm') mm = num * 1000;
    else if (fromUnit === 'inch') mm = num * 25.4;
    else if (fromUnit === 'ft') mm = num * 304.8;
    else if (fromUnit === 'mm') mm = num;

    if (toUnit === 'cm') return parseFloat((mm / 10).toFixed(1));
    if (toUnit === 'mm') return Math.round(mm);
    if (toUnit === 'm') return parseFloat((mm / 1000).toFixed(3));
    if (toUnit === 'inch') return parseFloat((mm / 25.4).toFixed(1));
    if (toUnit === 'ft') return parseFloat((mm / 304.8).toFixed(2));
    return parseFloat(mm.toFixed(2));
}
window.convertUnit = convertUnit;
`;

if (!content.includes('// --- SHARED UNIT CONVERTER')) {
    content = content.replace('// --- RENDER FUNCTIONS ---', convertUnitCode + '\n// --- RENDER FUNCTIONS ---');
}

// 2. Update renderCalculation quotation tab mounting
const oldMountBlock = `    if (activeTab === 'quotes') {
        const mount = container.querySelector('#calc-inner-mount');
        if (mount) {
            mount.style.padding = '0';
            mount.style.maxWidth = '100%';
            mount.innerHTML = '';
            mount.appendChild(renderQuotations(state));
        }
    }`;

const newMountBlock = `    if (activeTab === 'quotes') {
        const mount = container.querySelector('#calc-inner-mount');
        if (mount) {
            mount.style.padding = '0';
            mount.style.maxWidth = '100%';
            mount.innerHTML = '';
            if (Store.state.quoteStudio && Store.state.quoteStudio.active) {
                mount.appendChild(renderQuotationStudio(state));
            } else {
                mount.appendChild(renderQuotations(state));
            }
        }
    }`;

content = content.replace(oldMountBlock, newMountBlock);

// 3. Update getTabTitle
content = content.replace("if (tab === 'manual') return 'Estimate Calculation';", "if (tab === 'manual') return 'Quick Calculation';");

// 4. Update getTabContent
content = content.replace(
    "if (!state.calcTab || state.calcTab === 'manual') return renderManualCalc(state);",
    "if (state.calcTab === 'quotes' && Store.state.quoteStudio && Store.state.quoteStudio.active) return renderQuotationStudio(state);\n    if (!state.calcTab || state.calcTab === 'manual') return renderManualCalc(state);"
);

console.log('Step 1 applied successfully.');
fs.writeFileSync(calcPath, content, 'utf8');
