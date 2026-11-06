const fs = require('fs');
const readline = require('readline');

async function searchTranscript() {
    const filePath = 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/.system_generated/logs/transcript_full.jsonl';
    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (line.includes('Showing lines 1350 to') || line.includes('Showing lines 1360 to') || line.includes('Showing lines 1340 to')) {
            const obj = JSON.parse(line);
            console.log('Found viewing step:', obj.step_index);
            fs.writeFileSync('scratch/viewed_lines_1350.txt', obj.content || '', 'utf8');
            console.log('Wrote to scratch/viewed_lines_1350.txt');
            break;
        }
    }
}

searchTranscript();
