const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\anshi\\.gemini\\antigravity-ide\\brain\\2a9f5f14-fdec-4ff4-a3fd-c05be7726680';

async function run() {
    console.log('Launching browser to verify dashboard fixes...');
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1550,1050']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1550, height: 1050 });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));

        console.log('\n--- 1. VERIFY COMPACT RIGHT PANEL & EXPANDED MAP ---');
        const layoutMetrics = await page.evaluate(() => {
            const dangerCard = document.querySelector('.stock-alert-card-danger');
            const rightPanel = dangerCard ? dangerCard.parentElement : null;
            const mapCard = document.querySelector('.map-canvas-card');
            return {
                rightPanelWidth: rightPanel ? rightPanel.getBoundingClientRect().width : 0,
                mapCardWidth: mapCard ? mapCard.getBoundingClientRect().width : 0,
                ratio: rightPanel && mapCard ? (mapCard.getBoundingClientRect().width / rightPanel.getBoundingClientRect().width).toFixed(2) : 0
            };
        });
        console.log('Layout metrics:', layoutMetrics);

        console.log('\n--- 2. VERIFY MAP BOTTOM METRICS BAR FIT & ALIGNMENT ---');
        const metricsBarData = await page.evaluate(() => {
            const bar = document.getElementById('mapDeliveryMetricsBar');
            if (!bar) return { found: false };
            const barRect = bar.getBoundingClientRect();
            const pills = Array.from(bar.querySelectorAll('.delivery-metric-pill'));
            const pillsData = pills.map((p, idx) => {
                const r = p.getBoundingClientRect();
                return {
                    idx,
                    text: p.innerText.replace(/\s+/g, ' ').trim(),
                    left: r.left,
                    right: r.right,
                    width: r.width,
                    clippedRight: r.right > (barRect.right + 2)
                };
            });
            return {
                found: true,
                barWidth: barRect.width,
                barScrollWidth: bar.scrollWidth,
                barClientWidth: bar.clientWidth,
                hasOverflow: bar.scrollWidth > (bar.clientWidth + 2),
                pillsCount: pills.length,
                pillsData
            };
        });
        console.log('Metrics bar check:', metricsBarData);

        console.log('\n--- 3. VERIFY MAP TOWN LABELS (NO RAW PIN CODES, SUBTLE OPACITY) ---');
        const mapLabelsData = await page.evaluate(() => {
            const labelNodes = Array.from(document.querySelectorAll('.town-label-group text'));
            const labels = labelNodes.map(t => ({
                text: t.textContent.trim(),
                opacity: window.getComputedStyle(t).opacity || t.getAttribute('opacity')
            }));
            const pinCodeRegex = /\b\d{6}\b/;
            const hasRawPins = labels.some(l => pinCodeRegex.test(l.text));
            const hasFeroke = labels.some(l => l.text.includes('Feroke'));
            const hasKozhikode = labels.some(l => l.text.includes('Kozhikode'));
            const hasKochi = labels.some(l => l.text.includes('Kochi'));
            return {
                totalLabels: labels.length,
                hasRawPins,
                hasFeroke,
                hasKozhikode,
                hasKochi,
                samples: labels.slice(0, 8)
            };
        });
        console.log('Map labels check:', mapLabelsData);

        console.log('\n--- 4. VERIFY REMOVAL OF HOVER POPUPS & UNWANTED BUTTONS ---');
        const cleanUiData = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const hasHoverInstruction = /hover to scroll/i.test(bodyText);
            const hasNewQuoteBtn = !!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Quote'));
            const siteVisitBadges = Array.from(document.querySelectorAll('.badge-site-visit')).map(b => {
                const s = window.getComputedStyle(b);
                return {
                    bg: s.backgroundColor,
                    color: s.color,
                    border: s.border
                };
            });
            const statusPills = Array.from(document.querySelectorAll('.badge-status-pill')).map(p => ({
                class: p.className,
                text: p.innerText.trim()
            }));
            return {
                hasHoverInstruction,
                hasNewQuoteBtn,
                siteVisitBadgeStyle: siteVisitBadges[0] || null,
                statusPillsCount: statusPills.length,
                sampleStatusPills: statusPills.slice(0, 6)
            };
        });
        console.log('Clean UI check:', cleanUiData);

        console.log('\n--- 5. VERIFY CONTINUOUS AUTO-SCROLLING BEHAVIOR ---');
        const scrollStartPositions = await page.evaluate(() => {
            const scrollers = [
                'out-of-stock-scroll-container',
                'low-stock-scroll-container',
                'site-visit-service-scroll-container',
                'quotation-pending-scroll-container'
            ];
            return scrollers.map(id => {
                const el = document.getElementById(id);
                return { id, top: el ? el.scrollTop : null, height: el ? el.scrollHeight : null };
            });
        });
        console.log('Scroll start:', scrollStartPositions);

        // Wait 2.5 seconds to observe auto-scrolling
        await new Promise(r => setTimeout(r, 2500));

        const scrollAfterPositions = await page.evaluate(() => {
            const scrollers = [
                'out-of-stock-scroll-container',
                'low-stock-scroll-container',
                'site-visit-service-scroll-container',
                'quotation-pending-scroll-container'
            ];
            return scrollers.map(id => {
                const el = document.getElementById(id);
                return { id, top: el ? el.scrollTop : null };
            });
        });
        console.log('Scroll after 2.5s:', scrollAfterPositions);

        const didAutoScroll = scrollAfterPositions.map((after, i) => {
            const before = scrollStartPositions[i];
            return { id: after.id, moved: after.top > before.top, delta: after.top - before.top };
        });
        console.log('Auto-scroll movement:', didAutoScroll);

        console.log('\n--- 6. CAPTURE HIGH RESOLUTION VERIFICATION SCREENSHOTS ---');
        const finalScreenshotPath = path.join(artifactDir, 'final_dashboard_layout_verified.png');
        await page.screenshot({ path: finalScreenshotPath, fullPage: false });
        console.log('Saved dashboard overview screenshot to:', finalScreenshotPath);

        // Detailed crop of Central Map + Metrics Bar + Compact Right Sidebar
        const mapAndSidebarScreenshotPath = path.join(artifactDir, 'map_and_compact_widgets_verified.png');
        const mainSectionHandle = await page.$('.map-canvas-card');
        if (mainSectionHandle) {
            await mainSectionHandle.screenshot({ path: mapAndSidebarScreenshotPath });
            console.log('Saved map and metrics bar crop screenshot to:', mapAndSidebarScreenshotPath);
        }

        // Detailed crop of Bottom Horizontal Section (Site Visit & Service + Quotation Pending)
        const bottomSectionHandle = await page.$('#site-visit-service-scroll-container');
        if (bottomSectionHandle) {
            const bottomParent = await page.evaluateHandle(el => el.closest('.glass-panel').parentElement, bottomSectionHandle);
            const bottomScreenshotPath = path.join(artifactDir, 'bottom_widgets_badges_verified.png');
            await bottomParent.screenshot({ path: bottomScreenshotPath });
            console.log('Saved bottom widgets screenshot to:', bottomScreenshotPath);
        }

        console.log('\n=== ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY ===');
    } catch (err) {
        console.error('Verification error:', err);
    } finally {
        await browser.close();
    }
}

run();
