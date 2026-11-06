const fs = require('fs');
const readline = require('readline');

async function searchTranscript() {
    const filePath = 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/.system_generated/logs/transcript_full.jsonl';
    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (line.includes('Showing lines 1650 to 1750') || line.includes('Showing lines 1680 to 1780') || line.includes('Showing lines 1700 to 1800')) {
            const obj = JSON.parse(line);
            console.log('Found viewing step:', obj.step_index);
            fs.writeFileSync('scratch/viewed_lines_1650.txt', obj.content || '', 'utf8');
            break;
        }
    }
}

searchTranscript();
