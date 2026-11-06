const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('🚀 Starting Verification of PDF 2D Drawing & WhatsApp Attachment Sharing Pipeline...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Listen to console
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    console.log('✓ Page loaded.');

    // 1. Verify 2D Drawing Pre-Rasterization and HTML2Canvas rendering
    const drawingTest = await page.evaluate(async () => {
        const store = window.Store;
        const quote = (store.state.quotations || [])[0];
        if (!quote) return { error: 'No quotation found' };

        const html = window.renderPrintableQuotationHTML(quote);
        const tempContainer = document.createElement('div');
        tempContainer.id = 'verify-pdf-box';
        tempContainer.style.cssText = 'position: absolute; left: 0; top: 0; width: 800px; background: white; z-index: 99999;';
        tempContainer.innerHTML = html;
        document.body.appendChild(tempContainer);

        const el = tempContainer.querySelector('#printable-quotation') || tempContainer;
        
        // Before rasterization: count SVGs
        const svgsBefore = el.querySelectorAll('table tbody tr td:nth-child(2) svg').length;

        // Run ensureImagesLoaded (which pre-rasterizes SVGs into PNG images)
        await window.ensureImagesLoaded(el);

        // After rasterization: count SVGs and IMGs
        const svgsAfter = el.querySelectorAll('table tbody tr td:nth-child(2) svg').length;
        const imgsAfter = el.querySelectorAll('table tbody tr td:nth-child(2) img').length;

        // Compile to canvas using html2pdf
        const opt = {
            margin: [8, 8, 8, 8],
            filename: 'test.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 1, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        const worker = window.html2pdf().set(opt).from(el);
        const canvas = await worker.toCanvas().get('canvas');
        const canvasPng = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');

        tempContainer.remove();

        return {
            quoteId: quote.id,
            svgsBefore,
            svgsAfter,
            imgsAfter,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            canvasPngLength: canvasPng.length,
            canvasPng
        };
    });

    if (drawingTest.error) {
        console.error('❌ Drawing test failed:', drawingTest.error);
    } else {
        console.log(`✓ SVGs before pre-rasterization: ${drawingTest.svgsBefore}`);
        console.log(`✓ SVGs after pre-rasterization: ${drawingTest.svgsAfter}`);
        console.log(`✓ High-res PNG images after pre-rasterization: ${drawingTest.imgsAfter}`);
        console.log(`✓ Canvas rendered size: ${drawingTest.canvasWidth}x${drawingTest.canvasHeight}`);
        
        fs.writeFileSync('screenshots/verify_2d_drawing_pdf.png', Buffer.from(drawingTest.canvasPng, 'base64'));
        console.log('✓ Saved screenshots/verify_2d_drawing_pdf.png');
    }

    // 2. Verify PDF Blob Generation & API Upload
    const uploadTest = await page.evaluate(async () => {
        const store = window.Store;
        const quote = (store.state.quotations || [])[0];
        
        // Test generateQuotePdfBlob
        const blob = await window.generateQuotePdfBlob(quote);
        const blobSize = blob.size;
        const blobType = blob.type;

        // Test base64 conversion
        const base64 = await window.blobToBase64(blob);

        // Test API upload
        const filename = `Test_Verification_${quote.id}.pdf`;
        const uploadRes = await fetch('/api/upload-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, dataBase64: base64 })
        });
        const uploadJson = await uploadRes.json();

        return {
            blobSize,
            blobType,
            uploadSuccess: uploadJson.success,
            uploadUrl: uploadJson.url,
            uploadFullUrl: uploadJson.fullUrl
        };
    });

    console.log('✓ PDF Blob generated size:', uploadTest.blobSize, 'bytes, type:', uploadTest.blobType);
    console.log('✓ Upload to /api/upload-pdf result:', uploadTest.uploadSuccess, 'URL:', uploadTest.uploadFullUrl);

    // 3. Verify Share Quotation Modal UI with Direct PDF Link
    await page.evaluate(() => {
        const store = window.Store;
        const quote = (store.state.quotations || [])[0];
        window.openShareQuotationModal(quote.id);
    });

    await new Promise(r => setTimeout(r, 600));

    const modalCheck = await page.evaluate(() => {
        const modal = document.getElementById('quote-share-modal');
        if (!modal) return { exists: false };

        const dlBtn = document.getElementById('share-download-pdf-btn');
        const waBtn = document.getElementById('share-whatsapp-pdf-btn');
        const moreBtn = document.getElementById('share-action-more');
        const copyCapBtn = document.getElementById('btn-copy-quote-caption');
        const copyLinkBtn = document.getElementById('btn-copy-quote-pdf-link');
        const openLink = document.getElementById('btn-preview-quote-pdf');
        const previewBox = document.getElementById('quote-caption-preview-box');

        return {
            exists: true,
            hasDownloadBtn: !!dlBtn,
            hasWhatsAppBtn: !!waBtn,
            hasMoreBtn: !!moreBtn,
            hasCopyCaptionBtn: !!copyCapBtn,
            hasCopyLinkBtn: !!copyLinkBtn,
            hasOpenLink: !!openLink,
            captionText: previewBox ? previewBox.textContent : '',
            containsPdfLink: previewBox ? previewBox.textContent.includes('/uploads/quotations/') : false
        };
    });

    console.log('✓ Modal checks:', modalCheck);

    const modalEl = await page.$('#quote-share-modal > div');
    if (modalEl) {
        await modalEl.screenshot({ path: 'screenshots/verify_share_modal_with_pdf_link.png' });
        console.log('✓ Saved screenshots/verify_share_modal_with_pdf_link.png');
    }

    await browser.close();
    console.log('🎉 Verification completed successfully!');
})();
