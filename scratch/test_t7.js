const puppeteer = require('puppeteer');
(async () => {
    const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const p = await b.newPage();
    await p.goto('http://127.0.0.1:3000/');
    await new Promise(r => setTimeout(r, 800));

    const res = await p.evaluate(() => {
        const testQuote = (Store.state.quotations || [])[0];
        testQuote.attachments = [
            {
                name: 'window_elevation_plan.png',
                size: '420 KB',
                date: '2026-10-20',
                url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                isImage: true
            }
        ];

        const printableHtml = window.renderPrintableQuotationHTML(testQuote);
        const div = document.createElement('div');
        div.innerHTML = printableHtml;

        const attImg = div.querySelector('img[alt="window_elevation_plan.png"]');
        return {
            hasAttImg: !!attImg,
            src: attImg ? attImg.src : null,
            hasSharpContrast: attImg && (attImg.style.imageRendering.includes('optimize-contrast') || attImg.getAttribute('style').includes('optimize-contrast')),
            hasCors: attImg && attImg.hasAttribute('crossorigin')
        };
    });

    console.log('Result:', JSON.stringify(res, null, 2));
    await b.close();
})();
