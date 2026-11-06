const fs = require('fs');
const path = require('path');

function createBundle() {
    const modulesDir = path.join(__dirname, '..', 'js', 'modules');
    const storePath = path.join(__dirname, '..', 'js', 'store.js');
    const appPath = path.join(__dirname, '..', 'js', 'app.js');
    const outputPath = path.join(__dirname, '..', 'js', 'bundle.js');

    let output = '/* WINPRO - Standalone Bundle (Works on both http:// and file://) */\n(() => {\n';

    // 1. Store
    let storeContent = fs.readFileSync(storePath, 'utf8');
    storeContent = storeContent.replace(/export\s+(function|const|let|var)\s+([a-zA-Z0-9_$]+)/g, '$1 $2');
    storeContent = storeContent.replace(/const\s+Store\s*=/, 'const Store = window.Store =');
    output += '\n// --- STORE ---\n' + storeContent + '\n';

    // 2. Modules
    const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'));
    for (const f of moduleFiles) {
        let modContent = fs.readFileSync(path.join(modulesDir, f), 'utf8');
        // Remove import statements
        modContent = modContent.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"];?/g, '');
        // Replace export function / export const
        modContent = modContent.replace(/export\s+(function|const|let|var)\s+([a-zA-Z0-9_$]+)/g, '$1 $2');
        output += `\n// --- MODULE: ${f} ---\n` + modContent + '\n';
    }

    // 3. App
    let appContent = fs.readFileSync(appPath, 'utf8');
    // Remove imports
    appContent = appContent.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"];?/g, '');
    output += '\n// --- APP CORE ---\n' + appContent + '\n';

    output += '\n})();\n';

    fs.writeFileSync(outputPath, output, 'utf8');
    console.log('Bundle created successfully at:', outputPath, `(${output.length} bytes)`);
}

createBundle();
