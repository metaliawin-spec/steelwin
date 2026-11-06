const fs = require('fs');
const readline = require('readline');

async function searchTranscript() {
    const filePath = 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/.system_generated/logs/transcript_full.jsonl';
    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (line.includes('Showing lines 1450 to 1550') || line.includes('Showing lines 1480 to 1580') || line.includes('Showing lines 1500 to 1600') || line.includes('Showing lines 1550 to 1650')) {
            const obj = JSON.parse(line);
            console.log('Found viewing step:', obj.step_index);
            fs.appendFileSync('scratch/viewed_calculation_full.txt', '\n--- STEP ' + obj.step_index + ' ---\n' + (obj.content || '') + '\n', 'utf8');
        }
    }
    console.log('Finished search.');
}

searchTranscript();
