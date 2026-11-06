const fs = require('fs');

const txt = fs.readFileSync('scratch/original_renderManualCalc.txt', 'utf8');
const needle = 'WINDOW PANES:';
const pos = txt.indexOf(needle);

if (pos !== -1) {
    const snippet = txt.substring(pos, pos + 8000);
    fs.writeFileSync('scratch/original_canvas_html.txt', snippet, 'utf8');
    console.log('Saved to scratch/original_canvas_html.txt');
}
