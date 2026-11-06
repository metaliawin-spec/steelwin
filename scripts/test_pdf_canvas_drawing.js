const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

    const result = await page.evaluate(async () => {
        const store = window.Store;
        const quote = (store.state.quotations || [])[0];
        if (!quote) return { error: 'No quote found' };

        // Test rendering HTML
        const html = window.renderPrintableQuotationHTML(quote);
        const tempContainer = document.createElement('div');
        tempContainer.id = 'debug-temp-pdf-box';
        tempContainer.style.cssText = 'position: absolute; left: 0px; top: 0px; width: 800px; background: white; z-index: 99999;';
        tempContainer.innerHTML = html;
        document.body.appendChild(tempContainer);

        const el = tempContainer.querySelector('#printable-quotation') || tempContainer;
        
        // Check what SVG or IMG is in the drawing cell
        const drawingCells = el.querySelectorAll('table tbody tr td:nth-child(2)');
        const cellDetails = [];
        drawingCells.forEach((cell, idx) => {
            const svgs = cell.querySelectorAll('svg');
            const imgs = cell.querySelectorAll('img');
            cellDetails.push({
                idx,
                innerHtmlLen: cell.innerHTML.length,
                hasSvg: svgs.length,
                hasImg: imgs.length,
                svgTag: svgs.length ? svgs[0].outerHTML.slice(0, 100) : null,
                imgSrc: imgs.length ? imgs[0].src.slice(0, 100) : null,
                text: cell.innerText.trim()
            });
        });

        // Test html2canvas render
        let canvasRendered = false;
        let dataUrlLength = 0;
        let drawingAreaPixels = null;
        if (window.html2canvas) {
            try {
                const canvas = await window.html2canvas(el, { scale: 1, useCORS: true, logging: true });
                canvasRendered = true;
                dataUrlLength = canvas.toDataURL('image/png').length;
                
                // Get image data around the first cell
                const rect = drawingCells[0] ? drawingCells[0].getBoundingClientRect() : null;
                return {
                    quoteId: quote.id,
                    cellDetails,
                    canvasRendered,
                    dataUrlLength,
                    rect: rect ? { x: rect.x, y: rect.y, w: rect.width, h: rect.height } : null
                };
            } catch (err) {
                return { error: 'html2canvas error: ' + err.message, cellDetails };
            }
        }

        return { quoteId: quote.id, cellDetails, html2canvasExists: !!window.html2canvas };
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    // Also let's take a screenshot of the debug container to see if the browser sees it!
    const debugEl = await page.$('#debug-temp-pdf-box');
    if (debugEl) {
        await debugEl.screenshot({ path: 'screenshots/pdf_view_screenshot.png' });
        console.log('Saved screenshot of #debug-temp-pdf-box to screenshots/pdf_view_screenshot.png');
    }

    await browser.close();
})();
