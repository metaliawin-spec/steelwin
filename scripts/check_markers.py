with open('js/modules/calculation.js', 'r', encoding='utf-8') as f:
    src = f.read()

m1 = 'let frameThick = 12;' in src
m2 = '<rect x="${frameThick/2}"' in src
m3 = 'window.cycleStudioPartition = (idx) => {' in src
m4 = 'window.saveQuotationItemAndNew = () => {' in src
m5 = 'window.saveQuotationFinal = () => {' in src
m6 = 'const frameThick = Math.max(4, Math.min(10, Math.round(drawH * 0.035)));' in src

print('m1:', m1, 'm2:', m2, 'm3:', m3, 'm4:', m4, 'm5:', m5, 'm6:', m6)
