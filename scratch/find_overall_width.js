const fs = require('fs');

const txt = fs.readFileSync('scratch/original_renderManualCalc.txt', 'utf8');
const needle = 'Overall Width';
let pos = 0;
while ((pos = txt.indexOf(needle, pos)) !== -1) {
    console.log('Overall Width at:', pos);
    const snippet = txt.substring(pos - 600, pos + 1000);
    fs.writeFileSync('scratch/overall_width_snippet.txt', snippet, 'utf8');
    pos += needle.length;
}
