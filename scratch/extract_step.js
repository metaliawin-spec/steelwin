const fs = require('fs');
const readline = require('readline');

async function run() {
    const filePath = 'C:/Users/anshi/.gemini/antigravity-ide/brain/c6c05c05-5968-4292-b804-64b7412f1d59/.system_generated/logs/transcript_full.jsonl';
    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (line.includes('"step_index":1927')) {
            const obj = JSON.parse(line);
            fs.writeFileSync('scratch/step_1927.txt', obj.content || '', 'utf8');
            console.log('Successfully extracted step 1927 to scratch/step_1927.txt');
            break;
        }
    }
}

run();
