const fs = require('fs');

const txt = fs.readFileSync('scratch/original_renderManualCalc.txt', 'utf8');
const needle = 'PARTITION';
let pos = 0;
while ((pos = txt.indexOf(needle, pos)) !== -1) {
    console.log('PARTITION at:', pos);
    console.log(txt.substring(pos - 400, pos + 600));
    pos += needle.length;
}
