const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Starting verification of Authentic India Map...');
    const browser = await puppeteer.launch({ 
        headless: 'new', 
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1050 });
    
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // Check SVG map elements
    const mapStats = await page.evaluate(() => {
        const svg = document.getElementById('india-3d-map-svg');
        if (!svg) return { exists: false };
        const states = Array.from(svg.querySelectorAll('#india-states-layer path')).map(p => p.getAttribute('data-state-name'));
        const cities = Array.from(svg.querySelectorAll('.map-city-node text')).map(t => t.textContent.trim());
        const trajectories = svg.querySelectorAll('#map-trajectories path').length;
        return {
            exists: true,
            viewBox: svg.getAttribute('viewBox'),
            statesCount: states.length,
            citiesCount: cities.length,
            sampleStates: states.slice(0, 10),
            sampleCities: cities.slice(0, 15),
            trajectoriesCount: trajectories
        };
    });

    console.log('Map Stats:', JSON.stringify(mapStats, null, 2));

    // Screenshot of full India map card
    const mapCard = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Delivery Locations'))?.closest('.glass-panel');
    });

    if (mapCard) {
        await mapCard.screenshot({ path: 'scripts/authentic_india_map_full.png' });
        console.log('📸 Captured scripts/authentic_india_map_full.png');
    }

    // Now test zoom to Kerala & South
    console.log('Testing Zoom to Kerala & South...');
    await page.evaluate(() => {
        window.setDashboardMapZoom('smart_kerala');
    });
    await new Promise(r => setTimeout(r, 700));

    if (mapCard) {
        await mapCard.screenshot({ path: 'scripts/authentic_india_map_kerala_zoom.png' });
        console.log('📸 Captured scripts/authentic_india_map_kerala_zoom.png');
    }

    await browser.close();
    console.log('Done verification!');
})();
