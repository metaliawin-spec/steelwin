// Test Leo queries with Node.js
const fs = require('fs');
const path = require('path');

// Simulate DOM window environment for bundle testing
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
    url: "http://localhost:3000",
    runScripts: "dangerously"
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

// SpeechSynthesis mock
global.window.speechSynthesis = {
    speak: () => {},
    cancel: () => {},
    getVoices: () => []
};

// Load bundle
const bundleCode = fs.readFileSync(path.join(__dirname, '../js/bundle.js'), 'utf-8');
dom.window.eval(bundleCode);

const LeoEngine = dom.window.LeoEngine;
const Store = dom.window.Store;

console.log('Store initialized:', !!Store);
console.log('LeoEngine initialized:', !!LeoEngine);

const queries = [
    "How many quotations came in today?",
    "What is the total sales amount today?",
    "Who visited today?",
    "What is the total purchase volume?",
    "Who is on leave today?",
    "Tell me about something completely unknown"
];

queries.forEach(q => {
    console.log('\n========================================');
    console.log('QUERY:', q);
    const res = LeoEngine.query(q);
    console.log('SPEECH TEXT:', res.speechText);
    console.log('SUMMARY TEXT:', res.summaryText);
    if (res.speechText.includes("I don't know") || res.speechText.includes("Data not found")) {
        console.error('FAIL: Found forbidden phrase in speechText');
    } else {
        console.log('PASS: Accurate live response without fallback failure');
    }
});
