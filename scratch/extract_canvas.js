const fs = require('fs');

const txt = fs.readFileSync('scratch/original_renderManualCalc.txt', 'utf8');
const searchPos = 442696; // where Custom Kalli was found
const endPos = txt.indexOf('function renderDetailedCalculation', searchPos);
console.log('searchPos:', searchPos, 'endPos:', endPos);

const canvasAndRest = txt.substring(searchPos - 200, endPos !== -1 ? endPos : searchPos + 20000);
fs.writeFileSync('scratch/original_canvas_block.txt', canvasAndRest, 'utf8');
console.log('Saved scratch/original_canvas_block.txt with length:', canvasAndRest.length);
