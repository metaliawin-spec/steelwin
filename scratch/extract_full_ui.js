const fs = require('fs');

const txt = fs.readFileSync('scratch/original_renderManualCalc.txt', 'utf8');
const needle = 'CLIENT NAME';
let pos = 0;
while ((pos = txt.indexOf(needle, pos)) !== -1) {
    console.log('CLIENT NAME found at:', pos);
    const snippet = txt.substring(pos - 200, pos + 10000);
    fs.writeFileSync('scratch/original_full_ui.html', snippet, 'utf8');
    console.log('Saved to scratch/original_full_ui.html');
    break;
}
