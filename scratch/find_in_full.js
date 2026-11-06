const fs = require('fs');
const readline = require('readline');

async function findInFullTranscript() {
    const filePath = 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/.system_generated/logs/transcript_full.jsonl';
    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (line.includes('PARTITION') && !line.includes('"step_index":2544')) {
            const obj = JSON.parse(line);
            if (obj.step_index < 2000) {
                console.log('FOUND line in step:', obj.step_index);
                const idx = line.indexOf('PARTITION');
                console.log(line.substring(Math.max(0, idx - 400), idx + 1000));
                fs.writeFileSync('scratch/partition_match.txt', line, 'utf8');
                break;
            }
        }
    }
}

findInFullTranscript();
