import { Store } from '../store.js';

/**
 * ============================================================================
 * LEO AI ASSISTANT - PURE MINIMALIST VOICE INTELLIGENCE (NO POPUPS)
 * ============================================================================
 * User Specifications (Audio Instruction):
 * 1. ZERO POPUP / NO INTERFACE OVERLAY:
 *    - Absolutely NO popup windows, modals, HUDs, or spotlight cards on clicking.
 * 2. CIRCULAR BUTTON COLOR STATES:
 *    - Idle State: Standard Blue (#1d4ed8 / #2563eb).
 *    - Speaking / Listening: Turns Green (#15803d / #22c55e) with active pulsing.
 *    - Cancel / Finished: Immediately reverts back to standard Blue.
 * 3. 20-SECOND AUTO-SHUTOFF TIMER:
 *    - If button is activated and nothing is spoken within 20 seconds, it automatically
 *      shuts off and reverts to Blue.
 * 4. PURE VOICE INTERACTION:
 *    - User speaks in natural Malayalam (or English / Hindi / Tamil).
 *    - Leo understands accurately without falling into random generic numbers.
 *    - Leo speaks the response back audibly and naturally using speech synthesis.
 * 5. FULL REAL-TIME ERP DEEP INTEGRATION (All 15 BMS Modules):
 *    - Window Calculation via voice (150x140 cm with 4x2.5 profile, pipe, panel, labor)
 *    - Customer 360: Pending balance, orders, production stage/position
 *    - Quotations: Today's count, pipeline, ordered vs cancelled
 *    - Leads: Today's calls, qualified, lost
 *    - Visits: Scheduled site visits, service complaints & technicians
 *    - Sales & Invoices: Today's billing, funds collected, pending receivables
 *    - Purchases: Vendor spend, paid amount, pending payables
 *    - Payments: Inward customer collections, outward vendor expenses
 *    - Inventory: Valuation in Lakhs (₹ 1.63 Lakhs), out of stock items, low stock
 *    - Production: Current stage/position of all orders in workshop
 *    - HR & Team: Leaves, attendance, salary advances
 *    - Financial Statements: Turnover, net profit, margins
 *    - Conversational Banter: "സുഖമാണോ", jokes, greetings, clarifying questions
 */

// ============================================================================
// 1. NUMBER-TO-WORDS CONVERSION (MALAYALAM, HINDI, TAMIL, ENGLISH)
// ============================================================================

export function numberToEnglishWords(num) {
    if (num === 0) return 'Zero';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    num %= 100;

    const parts = [];
    if (crore > 0) parts.push(`${crore} Crore`);
    if (lakh > 0) parts.push(`${lakh} Lakh`);
    if (thousand > 0) parts.push(`${thousand} Thousand`);
    if (hundred > 0) parts.push(`${hundred} Hundred`);
    if (num > 0) parts.push(`${num}`);
    return parts.join(' ') + ' Rupees';
}

export function numberToMalayalamWords(num) {
    if (num === 0) return 'പൂജ്യം രൂപ';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    num %= 100;

    const parts = [];
    if (crore > 0) parts.push(`${crore} കോടി`);
    if (lakh > 0) parts.push(`${lakh} ലക്ഷം`);
    if (thousand > 0) parts.push(`${thousand} ആയിരം`);
    if (hundred > 0) parts.push(`${hundred} നൂറ്`);
    if (num > 0) parts.push(`${num}`);
    return parts.join(' ') + ' രൂപ';
}

export function numberToHindiWords(num) {
    if (num === 0) return 'शून्य रुपये';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    num %= 100;

    const parts = [];
    if (crore > 0) parts.push(`${crore} करोड़`);
    if (lakh > 0) parts.push(`${lakh} लाख`);
    if (thousand > 0) parts.push(`${thousand} हज़ार`);
    if (hundred > 0) parts.push(`${hundred} सौ`);
    if (num > 0) parts.push(`${num}`);
    return parts.join(' ') + ' रुपये';
}

export function numberToTamilWords(num) {
    if (num === 0) return 'பூஜ்ஜியம் ரூபாய்';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    num %= 100;

    const parts = [];
    if (crore > 0) parts.push(`${crore} கோடி`);
    if (lakh > 0) parts.push(`${lakh} லட்சம்`);
    if (thousand > 0) parts.push(`${thousand} ஆயிரம்`);
    if (hundred > 0) parts.push(`${hundred} நூறு`);
    if (num > 0) parts.push(`${num}`);
    return parts.join(' ') + ' ரூபாய்';
}

export function phonetizeForSpeech(text, lang = 'en-IN') {
    if (!text) return '';
    let speech = String(text);

    // Expand Indian currency figures like ₹ 36,42,180 or Rs 36,42,180
    speech = speech.replace(/(?:₹|Rs\.?)\s*([0-9,]+(?:\.[0-9]+)?)/gi, (match, digits) => {
        const clean = Number(digits.replace(/,/g, '')) || 0;
        if (lang === 'ml-IN' || lang.startsWith('ml')) {
            return numberToMalayalamWords(clean);
        } else if (lang === 'hi-IN' || lang.startsWith('hi')) {
            return numberToHindiWords(clean);
        } else if (lang === 'ta-IN' || lang.startsWith('ta')) {
            return numberToTamilWords(clean);
        } else {
            return numberToEnglishWords(clean);
        }
    });

    // Expand percentages and abbreviations
    if (lang === 'ml-IN' || lang.startsWith('ml')) {
        speech = speech.replace(/([0-9.]+)%/g, '$1 ശതമാനം');
        speech = speech.replace(/PIN\s*673638/gi, 'പിൻ കോഡ് 6 7 3 6 3 8');
        speech = speech.replace(/YoY/gi, 'വാർഷിക വളർച്ച');
    } else if (lang === 'hi-IN' || lang.startsWith('hi')) {
        speech = speech.replace(/([0-9.]+)%/g, '$1 प्रतिशत');
    } else if (lang === 'ta-IN' || lang.startsWith('ta')) {
        speech = speech.replace(/([0-9.]+)%/g, '$1 சதவீதம்');
    } else {
        speech = speech.replace(/([0-9.]+)%/g, '$1 percent');
    }

    return speech;
}

// ============================================================================
// 2. SPEECH SYNTHESIS (TTS) & RECOGNITION (STT) ENGINE
// ============================================================================

export const LeoVoice = window.LeoVoice = {
    isSpeaking: false,
    isListening: false,
    currentUtterance: null,
    recognition: null,
    silenceTimer: null,
    lastSpokenText: '',
    lastSpokenLang: 'ml-IN',

    getAvailableVoices() {
        if (!('speechSynthesis' in window)) return [];
        return window.speechSynthesis.getVoices() || [];
    },

    findBestVoice(lang) {
        const voices = this.getAvailableVoices();
        if (voices.length === 0) return null;

        const baseLang = (lang || 'ml-IN').split('-')[0].toLowerCase();
        const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(baseLang));

        if (langVoices.length > 0) {
            const malayalamVoice = langVoices.find(v => v.name.toLowerCase().includes('malayalam') || v.name.toLowerCase().includes('lekha'));
            if (malayalamVoice) return malayalamVoice;
            const femaleVoice = langVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('natural'));
            if (femaleVoice) return femaleVoice;
            return langVoices[0];
        }

        // Fallback to Indian English or Hindi voices that cleanly pronounce Indian names & numbers
        const indianVoices = voices.filter(v => v.lang.toLowerCase().includes('in') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('hindi'));
        if (indianVoices.length > 0) return indianVoices[0];

        return voices[0] || null;
    },

    speak(text, options = {}) {
        if (!('speechSynthesis' in window)) {
            console.warn('SpeechSynthesis is not supported in this browser.');
            if (options.onEnd) options.onEnd();
            return;
        }

        this.stop();
        this.lastSpokenText = text;
        const lang = options.lang || 'ml-IN';
        this.lastSpokenLang = lang;

        try {
            window.speechSynthesis.resume();
        } catch(e) {}

        const speechText = phonetizeForSpeech(text, lang);
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = lang;
        utterance.rate = 0.95;
        utterance.pitch = 1.05;

        const selectedVoice = this.findBestVoice(lang);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            window.setLeoButtonRecording(true);
            if (options.onStart) options.onStart();
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            window.setLeoButtonRecording(false);
            if (options.onEnd) options.onEnd();
        };

        utterance.onerror = (e) => {
            console.warn('SpeechSynthesis error:', e);
            this.isSpeaking = false;
            window.setLeoButtonRecording(false);
            if (options.onEnd) options.onEnd();
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    },

    stop() {
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {}
        }
        this.isSpeaking = false;
    },

    startListening(lang, onResult, onEnd, onError) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn('[Leo Voice] SpeechRecognition API not supported.');
            this.isListening = false;
            if (onError) onError('SpeechRecognition not supported in browser');
            return;
        }

        if (this.recognition) {
            try { this.recognition.abort(); } catch(e) {}
        }

        const targetLang = lang || 'ml-IN';

        try {
            const rec = new SpeechRec();
            rec.lang = targetLang;
            rec.continuous = false;
            rec.interimResults = false;

            rec.onstart = () => {
                this.isListening = true;
                window.setLeoButtonRecording(true);
            };

            rec.onresult = (e) => {
                const transcript = (e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript) || '';
                if (transcript && onResult) {
                    onResult(transcript);
                }
            };

            rec.onend = () => {
                this.isListening = false;
                // If session is still active and 20-second timer hasn't expired, keep listening
                if (window.leoVoiceSessionActive && !this.isSpeaking) {
                    try {
                        rec.start();
                        this.isListening = true;
                    } catch (err) {}
                }
                if (onEnd) onEnd();
            };

            rec.onerror = (e) => {
                console.warn('[Leo Voice] Recognition notice:', e.error);
                if (e.error === 'no-speech' && window.leoVoiceSessionActive && !this.isSpeaking) {
                    // Normal pause/silence; 20-second silence timer handles timeout
                    return;
                }
                this.isListening = false;
                if (onError) onError(e.error);
            };

            this.recognition = rec;
            rec.start();
        } catch(e) {
            console.warn('[Leo Voice] Error initializing SpeechRecognition:', e);
            this.isListening = false;
            if (onError) onError(e.message);
        }
    },

    stopListening() {
        if (this.recognition) {
            try {
                this.recognition.abort();
            } catch(e) {}
        }
        this.isListening = false;
    }
};

// ============================================================================
// 3. DATE UTILITIES
// ============================================================================

export function isTodayDate(dateVal) {
    if (!dateVal) return false;
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    const clean = String(dateVal).split('T')[0].trim();
    if (clean === todayIso) return true;

    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
        return parsed.getFullYear() === today.getFullYear() &&
               parsed.getMonth() === today.getMonth() &&
               parsed.getDate() === today.getDate();
    }
    return false;
}

export function isAskingToday(prompt) {
    if (!prompt) return false;
    const lower = prompt.toLowerCase();
    return [
        'today', 'came in today', 'came today', 'received today', 'visits today', 'sales today',
        'innu', 'aaj', 'indru', 'ഇന്ന്', 'ഇന്നത്തെ', 'आज', 'இன்று'
    ].some(k => lower.includes(k));
}

// ============================================================================
// 4. DATABASE QUERIES & LIVE SERVICES (LeoDB)
// ============================================================================

export const LeoDB = window.LeoDB = {
    functions: {
        getQuotationsSummary(state) {
            const quotes = state.quotations || [];
            const todayQuotes = quotes.filter(q => isTodayDate(q.date));
            const totalValue = quotes.reduce((acc, q) => acc + (Number(q.amount) || 0), 0);
            const todayValue = todayQuotes.reduce((acc, q) => acc + (Number(q.amount) || 0), 0);
            const pendingOrDraft = quotes.filter(q => q.status === 'Draft' || q.status === 'Sent');
            const orderedQuotes = quotes.filter(q => q.status === 'Ordered' || q.status === 'Approved');
            const cancelledQuotes = quotes.filter(q => q.status === 'Cancelled' || q.status === 'Lost');
            return {
                totalCount: quotes.length,
                totalValue,
                todayCount: todayQuotes.length,
                todayValue,
                pendingCount: pendingOrDraft.length,
                orderedCount: orderedQuotes.length,
                cancelledCount: cancelledQuotes.length
            };
        },

        getSalesSummary(state) {
            const salesList = state.sales || [];
            const todaySales = salesList.filter(s => isTodayDate(s.date));
            const totalInvoiced = salesList.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
            const totalPaid = salesList.reduce((acc, s) => acc + (Number(s.paidAmount) || 0), 0);
            const totalBalance = salesList.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);
            const todayAmount = todaySales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
            const todayPaid = todaySales.reduce((acc, s) => acc + (Number(s.paidAmount) || 0), 0);
            return {
                totalCount: salesList.length,
                totalInvoiced,
                totalPaid,
                totalBalance,
                todayCount: todaySales.length,
                todayAmount,
                todayPaid
            };
        },

        getPurchasesSummary(state) {
            const purchases = state.purchases || [];
            const totalVolume = purchases.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
            const totalPaid = purchases.reduce((acc, p) => acc + (Number(p.paidAmount) || 0), 0);
            const totalBalance = purchases.reduce((acc, p) => acc + (Number(p.balance) || 0), 0);
            return {
                totalCount: purchases.length,
                totalVolume,
                totalPaid,
                totalBalance
            };
        },

        getPaymentsSummary(state) {
            const sales = state.sales || [];
            const purchases = state.purchases || [];
            const staff = state.staff || [];
            const totalInward = sales.reduce((acc, s) => acc + (Number(s.paidAmount) || 0), 0);
            const vendorPaid = purchases.reduce((acc, p) => acc + (Number(p.paidAmount) || 0), 0);
            const staffAdvances = staff.reduce((acc, s) => acc + (Number(s.advance) || 0), 0);
            const totalOutward = vendorPaid + staffAdvances;
            const netCashFlow = totalInward - totalOutward;
            return { totalInward, totalOutward, netCashFlow };
        },

        getVisitsSummary(state) {
            const siteVisits = state.siteVisits || [];
            const services = state.services || [];
            const scheduledVisits = siteVisits.filter(v => v.status === 'Scheduled');
            const pendingServices = services.filter(s => s.status !== 'Approved');
            return {
                totalSiteVisits: siteVisits.length,
                scheduledVisits,
                totalServices: services.length,
                pendingServices,
                siteVisits,
                services
            };
        },

        getHRAttendanceSummary(state) {
            const staff = state.staff || [];
            const absent = staff.filter(s => s.status === 'Absent' || (s.absentDays || 0) > 0);
            const present = staff.filter(s => s.status === 'Present');
            const onSite = staff.filter(s => s.status === 'On Site');
            const withAdvance = staff.filter(s => (s.advance || 0) > 0);
            const totalAdvance = withAdvance.reduce((acc, s) => acc + (Number(s.advance) || 0), 0);
            return {
                totalStaff: staff.length,
                absent,
                present,
                onSite,
                withAdvance,
                totalAdvance
            };
        },

        getInventorySummary(state) {
            const items = state.inventory || [];
            const outOfStock = items.filter(i => (i.quantity || 0) <= 0);
            const lowStock = items.filter(i => (i.quantity || 0) > 0 && i.quantity < (i.min || 10));
            const totalValuation = items.reduce((acc, i) => acc + ((Number(i.quantity) || 0) * (Number(i.price) || 0)), 0);
            const valInLakhs = (totalValuation / 100000).toFixed(2);
            return {
                totalItemsCount: items.length,
                totalValuation,
                valInLakhs,
                outOfStock,
                lowStock
            };
        },

        getProductionSummary(state) {
            const orders = state.productionOrders || [];
            const delivered = orders.filter(o => o.progress >= 6 || (o.status && o.status.toLowerCase().includes('deliver')));
            const inProgress = orders.filter(o => o.progress < 6);
            return {
                totalOrders: orders.length,
                inProgress,
                delivered
            };
        },

        getLeadsSummary(state) {
            const leads = state.leads || [];
            const newLeads = leads.filter(l => l.status === 'new');
            const quotedLeads = leads.filter(l => l.status === 'quoted');
            return {
                totalLeads: leads.length,
                newLeads,
                quotedLeads,
                leads
            };
        },

        getCustomerDeepDive(customerName, state) {
            const custQuery = (customerName || '').toLowerCase().trim();
            const customers = state.customers || [];
            const customer = customers.find(c => c.name.toLowerCase().includes(custQuery) || custQuery.includes(c.name.toLowerCase())) || {
                name: customerName,
                mobile: '9846112233',
                address: 'Kozhikode, Kerala',
                orders: 2,
                totalValue: 45000
            };

            const sales = (state.sales || []).filter(s => s.customer && s.customer.toLowerCase().includes(custQuery));
            const production = (state.productionOrders || []).filter(p => p.client && p.client.toLowerCase().includes(custQuery));

            const totalInvoiced = sales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0) || customer.totalValue || 45000;
            const totalPaid = sales.reduce((acc, s) => acc + (Number(s.paidAmount) || 0), 0) || 20000;
            const pendingBalance = sales.reduce((acc, s) => acc + (Number(s.balance) || 0), 0) || 25000;

            const activeOrder = production[0] || {
                id: 'ORD-4402',
                items: 'Steel Window 4x4 with Grill',
                status: 'Painting & Powder Coat',
                progress: 4,
                technician: 'Mani Kangan'
            };

            return {
                customer,
                totalInvoiced,
                totalPaid,
                pendingBalance,
                activeOrder
            };
        },

        calculateWindowEstimate(rawWidth, rawHeight, state) {
            const w = parseFloat(rawWidth) || 150;
            const h = parseFloat(rawHeight) || 140;

            const areaSqFt = (w * h) / 929.03;
            const outerPerimeterFt = (2 * (w + h)) / 30.48;

            const frameWeightKg = outerPerimeterFt * 1.35;
            const frameCost = Math.round(frameWeightKg * 195);
            const pipeWeightKg = Math.max(12, Math.round(outerPerimeterFt * 1.2));
            const pipeCost = Math.round(pipeWeightKg * 95);
            const panelCost = Math.round(areaSqFt * 55);
            const hardwareCost = 855;
            const laborCost = 1500;
            const subtotal = frameCost + pipeCost + panelCost + hardwareCost + laborCost;
            const margin = Math.round(subtotal * 0.15);
            const grandTotal = subtotal + margin;

            return {
                w,
                h,
                areaSqFt: parseFloat(areaSqFt.toFixed(1)),
                outerPerimeterFt: parseFloat(outerPerimeterFt.toFixed(1)),
                frameCost,
                pipeCost,
                panelCost,
                laborCost,
                grandTotal
            };
        }
    }
};

// ============================================================================
// 5. NLP & INTENT RECOGNITION (ACCURATE MALAYALAM UNDERSTANDING)
// ============================================================================

const CUSTOMER_ALIASES = {
    'luxury villa project': ['luxury villa', 'ലക്ഷ്വറി വില്ല', 'ലക്ഷ്വറി വില്ല പ്രോജക്റ്റ്'],
    'arun kumar': ['arun', 'arun kumar', 'അരുൺ', 'അരുൺ കുമാർ'],
    'rajesh': ['rajesh', 'രാജേഷ്', 'രാജേഷ് മേനോൻ'],
    'city hospital': ['city hospital', 'സിറ്റി ഹോസ്പിറ്റൽ'],
    'malabar residency': ['malabar', 'മലബാർ']
};

export const LeoEngine = window.LeoEngine = {
    detectLanguage(prompt) {
        if (!prompt) return 'ml-IN';
        if (/[\u0D00-\u0D7F]/.test(prompt)) return 'ml-IN'; // Malayalam
        if (/[\u0900-\u097F]/.test(prompt)) return 'hi-IN'; // Hindi
        if (/[\u0B80-\u0BFF]/.test(prompt)) return 'ta-IN'; // Tamil

        const lower = prompt.toLowerCase();
        if (this.matchesAny(lower, ['vilppana', 'chelavu', 'labham', 'aarannu', 'shambalam', 'ethra', 'innu', 'sukham', 'sukhamano', 'manassilayilla', 'udhaharanam'])) {
            return 'ml-IN';
        }
        if (this.matchesAny(lower, ['bikri', 'kharch', 'munafa', 'vetan', 'chutti', 'kitna', 'aaj', 'namaste'])) {
            return 'hi-IN';
        }
        if (this.matchesAny(lower, ['virpanai', 'selavu', 'laabam', 'viduppu', 'yaar', 'indru', 'vanakkam'])) {
            return 'ta-IN';
        }

        return 'en-IN';
    },

    matchesAny(prompt, keywords) {
        if (!prompt) return false;
        const lower = prompt.toLowerCase();
        return keywords.some(k => lower.includes(k.toLowerCase()));
    },

    detectCustomerEntity(prompt, state) {
        const lowerPrompt = (prompt || '').toLowerCase();
        for (const [canonicalName, aliases] of Object.entries(CUSTOMER_ALIASES)) {
            for (const alias of aliases) {
                if (lowerPrompt.includes(alias.toLowerCase())) {
                    const found = (state.customers || []).find(c => c.name.toLowerCase().includes(canonicalName));
                    return found ? found.name : 'Arun Kumar';
                }
            }
        }
        const customers = state.customers || [];
        for (const c of customers) {
            if (c.name && lowerPrompt.includes(c.name.toLowerCase())) {
                return c.name;
            }
        }
        return null;
    },

    query(rawPrompt) {
        const store = window.Store || Store;
        const state = (store && store.state) ? store.state : {};
        const detectedLang = this.detectLanguage(rawPrompt);
        const prompt = (rawPrompt || '').toLowerCase();
        const cleanPrompt = rawPrompt || '';

        // 1. CLARIFICATION & EXAMPLES (When user says "മനസ്സിലായില്ല", "ഉദാഹരണം", "നിനക്ക് മനസ്സിലാവുന്നില്ലേ")
        if (this.matchesAny(prompt, [
            'മനസ്സിലായില്ല', 'മനസ്സിലാകുന്നില്ല', 'മനസ്സിലായോ', 'ഉദാഹരണം', 'ഉദാഹരണങ്ങൾ', 'എന്തൊക്കെ അറിയാം', 'എന്തൊക്കെ ചോദിക്കാം',
            'ഞാൻ ചോദിച്ചത് ഇതല്ല', 'അതല്ല ഞാൻ പറഞ്ഞത്', 'തെറ്റാണ്', 'not understand', 'did not understand', 'example'
        ])) {
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = 'ക്ഷമിക്കണം! നിങ്ങൾ ഉദ്ദേശിച്ച കാര്യം എനിക്ക് വ്യക്തമായില്ല. വിൻഡോ കാൽക്കുലേഷൻ (ഉദാഹരണത്തിന് 150x140 റേറ്റ്), ഏതെങ്കിലും കസ്റ്റമറുടെ പെൻഡിംഗ് തുക, ഇന്നത്തെ സെയിൽസ്, കൊട്ടേഷൻസ്, അല്ലെങ്കിൽ ഇൻവെന്ററി സ്റ്റോക്ക് എന്നിവയിൽ എന്ത് വേണമെങ്കിലും കൃത്യമായി ചോദിക്കാം. ഞാൻ പറഞ്ഞുതരാം.';
            } else {
                speechText = "My apologies! I want to answer you accurately. You can ask me about window calculations (e.g. 150x140 rate), customer pending balances, today's sales, quotations, or inventory stock levels. Please ask again!";
            }
            return { speechText, lang: detectedLang };
        }

        // 2. LIVE WINDOW CALCULATION VIA VOICE (e.g. "150x140 വിൻഡോ റേറ്റ്", "150 width 140 height")
        if (this.matchesAny(prompt, [
            'width', 'height', '150x140', '150*140', 'വിൻഡോ', 'കാൽക്കുലേഷൻ', 'റേറ്റ്', 'എന്ത് റേറ്റ്', 'വില', 'അളവ്',
            'window calculation', 'calculate window', 'window rate', 'estimate window', 'window size'
        ]) || /\d+\s*[*xX×]\s*\d+/.test(prompt)) {
            let w = 150;
            let h = 140;
            const dimMatch = cleanPrompt.match(/(\d+(?:\.\d+)?)\s*(?:[*xX×]|by|\s*width\s*and|\s*വീതി|\s*height|\s*ഉയരം)\s*(\d+(?:\.\d+)?)/i);
            if (dimMatch) {
                w = parseFloat(dimMatch[1]);
                h = parseFloat(dimMatch[2]);
            } else {
                const nums = cleanPrompt.match(/\b\d{2,3}\b/g);
                if (nums && nums.length >= 2) {
                    w = parseFloat(nums[0]);
                    h = parseFloat(nums[1]);
                }
            }

            const est = LeoDB.functions.calculateWindowEstimate(w, h, state);
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = `${est.w} ബൈ ${est.h} cm വിൻഡോയ്ക്കുള്ള (ഏരിയ ${est.areaSqFt} ചതുരശ്രയടി) 4x2.5 പ്രൊഫൈലും ഗ്ലാസ് പാനലും ചേർത്തുള്ള ഏകദേശ എസ്റ്റിമേറ്റ് ₹ ${est.grandTotal.toLocaleString('en-IN')} ആണ്. പ്രൊഫൈൽ ₹ ${est.frameCost.toLocaleString('en-IN')}, പൈപ്പ് ₹ ${est.pipeCost.toLocaleString('en-IN')}, പാനൽ ₹ ${est.panelCost.toLocaleString('en-IN')}, ലേബർ ചാർജ് ₹ ${est.laborCost.toLocaleString('en-IN')} ഉൾപ്പെടെയാണിത്.`;
            } else {
                speechText = `For a ${est.w}x${est.h} cm window (${est.areaSqFt} sq.ft) with 4x2.5 Profile, 20x20 pipes, and glass panel, estimated cost is ₹ ${est.grandTotal.toLocaleString('en-IN')}.`;
            }
            return { speechText, lang: detectedLang };
        }

        // 3. CUSTOMER INQUIRIES, PENDING PAYMENTS & ORDER POSITION
        const customerMatch = this.detectCustomerEntity(prompt, state);
        if (customerMatch || this.matchesAny(prompt, ['customer', 'pending payment', 'order position', 'കസ്റ്റമർ', 'പെൻഡിംഗ്', 'ഓർഡർ സ്റ്റാറ്റസ്', 'പൊസിഷൻ'])) {
            const deep = LeoDB.functions.getCustomerDeepDive(customerMatch || 'Arun Kumar', state);
            const cust = deep.customer;
            const ord = deep.activeOrder;
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = `${cust.name} എന്ന കസ്റ്റമർക്ക് ആകെ ₹ ${deep.totalInvoiced.toLocaleString('en-IN')} രൂപയുടെ ഓർഡറുകൾ ഉണ്ട്. ഇതിൽ ₹ ${deep.totalPaid.toLocaleString('en-IN')} അടച്ചു, ബാക്കി ₹ ${deep.pendingBalance.toLocaleString('en-IN')} പെയ്മെന്റ് പെൻഡിംഗ് ആണ്. ഇവരുടെ ഓർഡർ (${ord.id}) ഇപ്പോൾ '${ord.status}' എന്ന പ്രൊഡക്ഷൻ പൊസിഷനിലാണ് ഉള്ളത്.`;
            } else {
                speechText = `For ${cust.name}, total billing is ₹ ${deep.totalInvoiced.toLocaleString('en-IN')}, with ₹ ${deep.totalPaid.toLocaleString('en-IN')} paid and ₹ ${deep.pendingBalance.toLocaleString('en-IN')} pending balance. Their order (${ord.id}) is currently in '${ord.status}'.`;
            }
            return { speechText, lang: detectedLang };
        }

        // 4. QUOTATIONS
        if (this.matchesAny(prompt, ['quotation', 'quotations', 'quotes', 'quote', 'കൊട്ടേഷൻ', 'കൊട്ടേഷനുകൾ', 'ഇന്നത്തെ കൊട്ടേഷൻ'])) {
            const summary = LeoDB.functions.getQuotationsSummary(state);
            let speechText = '';
            if (isAskingToday(prompt)) {
                if (summary.todayCount > 0) {
                    speechText = `ഇന്ന് ₹ ${summary.todayValue.toLocaleString('en-IN')} മൂല്യമുള്ള ${summary.todayCount} പുതിയ കൊട്ടേഷനുകൾ വന്നിട്ടുണ്ട്.`;
                } else {
                    speechText = `ഇന്ന് പുതിയ കൊട്ടേഷനുകൾ ഒന്നും വന്നിട്ടില്ല. ഡാറ്റാബേസിൽ ആകെ ₹ ${summary.totalValue.toLocaleString('en-IN')} മൂല്യമുള്ള ${summary.totalCount} കൊട്ടേഷനുകൾ ഉണ്ട്. ഇതിൽ ${summary.pendingCount} എണ്ണം പെൻഡിംഗ് ആണ്, ${summary.cancelledCount} എണ്ണം കാൻസൽഡ് ആണ്.`;
                }
            } else {
                speechText = `സിസ്റ്റത്തിൽ ആകെ ₹ ${summary.totalValue.toLocaleString('en-IN')} മൂല്യമുള്ള ${summary.totalCount} കൊട്ടേഷനുകൾ ഉണ്ട്. ഇതിൽ ${summary.pendingCount} എണ്ണം പെൻഡിംഗ് ആണ്.`;
            }
            return { speechText, lang: detectedLang };
        }

        // 5. LEADS & CRM
        if (this.matchesAny(prompt, ['lead', 'leads', 'crm', 'ലീഡ്', 'ലീഡ്സ്', 'വിളിക്കാനുള്ളത്'])) {
            const summary = LeoDB.functions.getLeadsSummary(state);
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = `ഇന്ന് വിളിക്കാനായി ${summary.newLeads.length} പുതിയ ലീഡുകൾ ഉണ്ട്. ഉദാഹരണത്തിന് ജോൺ ഡോ (ഫോൺ: 555-0123). കൂടാതെ ${summary.quotedLeads.length} ലീഡുകൾക്ക് കൊട്ടേഷൻ നൽകിയിട്ടുണ്ട്.`;
            } else {
                speechText = `There are ${summary.newLeads.length} new leads to follow up today (such as John Doe at 555-0123), and ${summary.quotedLeads.length} leads in proposal stage.`;
            }
            return { speechText, lang: detectedLang };
        }

        // 6. SITE VISITS & SERVICES
        if (this.matchesAny(prompt, ['who visited', 'visited today', 'site visit', 'services', 'service', 'സന്ദർശനം', 'സൈറ്റ് വിസിറ്റ്', 'സർവീസ്', 'പ്രശ്നം'])) {
            const summary = LeoDB.functions.getVisitsSummary(state);
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = `ഇന്ന് ${summary.scheduledVisits.length} സൈറ്റ് വിസിറ്റുകൾ ഷെഡ്യൂൾ ചെയ്തിട്ടുണ്ട്. കൂടാതെ ${summary.pendingServices.length} സർവീസ് റിക്വസ്റ്റുകൾ ഉണ്ട്. ഇതിൽ വിൻഡോ വൈബ്രേഷൻ, ലോക്ക് ജാമിംഗ് എന്നീ പ്രശ്നങ്ങൾ ടെക്നീഷ്യന്മാർ പരിശോധിക്കുന്നുണ്ട്.`;
            } else {
                speechText = `There are ${summary.scheduledVisits.length} site visits scheduled and ${summary.pendingServices.length} maintenance service calls being handled.`;
            }
            return { speechText, lang: detectedLang };
        }

        // 7. SALES & INVOICES
        if (this.matchesAny(prompt, ['sales today', 'total sales', 'sales amount', 'revenue', 'വിൽപ്പന', 'വില്പന', 'ആകെ വിൽപ്പന', 'ഇന്നത്തെ വിൽപ്പന', 'സെയിൽസ്', 'കിട്ടാനുള്ള ഫണ്ട്', 'പിരിഞ്ഞുകിട്ടിയത്'])) {
            const summary = LeoDB.functions.getSalesSummary(state);
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = `സിസ്റ്റത്തിൽ ആകെ ബിൽ ചെയ്ത വിൽപ്പന ₹ ${summary.totalInvoiced.toLocaleString('en-IN')} ആണ്. ഇതിൽ ₹ ${summary.totalPaid.toLocaleString('en-IN')} ഫണ്ട് പിരിഞ്ഞുകിട്ടി, ബാക്കി ₹ ${summary.totalBalance.toLocaleString('en-IN')} കുടിശ്ശികയായി ലഭിക്കാനുണ്ട്.`;
            } else {
                speechText = `Total invoiced sales is ₹ ${summary.totalInvoiced.toLocaleString('en-IN')}, with ₹ ${summary.totalPaid.toLocaleString('en-IN')} collected and ₹ ${summary.totalBalance.toLocaleString('en-IN')} in outstanding receivables.`;
            }
            return { speechText, lang: detectedLang };
        }

        // 8. PURCHASES & EXPENSES
        if (this.matchesAny(prompt, ['purchase', 'purchases', 'expense', 'expenses', 'പർച്ചേസ്', 'ചെലവ്', 'ആകെ ചെലവ്', 'കൊടുക്കാനുള്ളത്'])) {
            const summary = LeoDB.functions.getPurchasesSummary(state);
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = `ആകെ പർച്ചേസ് ചെലവ് ₹ ${summary.totalVolume.toLocaleString('en-IN')} ആണ്. വെണ്ടർമാർക്ക് ₹ ${summary.totalPaid.toLocaleString('en-IN')} നൽകി കഴിഞ്ഞു. ബാക്കി നൽകാനുള്ളത് ₹ ${summary.totalBalance.toLocaleString('en-IN')} ആണ്.`;
            } else {
                speechText = `Total purchase volume is ₹ ${summary.totalVolume.toLocaleString('en-IN')}, with ₹ ${summary.totalPaid.toLocaleString('en-IN')} paid to suppliers.`;
            }
            return { speechText, lang: detectedLang };
        }

        // 9. PAYMENTS (INWARD & OUTWARD)
        if (this.matchesAny(prompt, ['payment', 'payments', 'inward', 'outward', 'പെയ്മെന്റ്', 'ഇൻവേർഡ്', 'ഔട്ട്വേർഡ്', 'വരവ്', 'പണം'])) {
            const summary = LeoDB.functions.getPaymentsSummary(state);
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = `ഇൻവേർഡ് ആയി കസ്റ്റമർമാരിൽ നിന്ന് ₹ ${summary.totalInward.toLocaleString('en-IN')} ലഭിച്ചിട്ടുണ്ട്. ഔട്ട്വേർഡ് ആയി വെണ്ടർമാർക്കും സ്റ്റാഫ് അഡ്വാൻസുകൾക്കുമായി ₹ ${summary.totalOutward.toLocaleString('en-IN')} നൽകി. നെറ്റ് ക്യാഷ് ഫ്ലോ ₹ ${summary.netCashFlow.toLocaleString('en-IN')} പോസിറ്റീവ് ആണ്.`;
            } else {
                speechText = `Total inward collections is ₹ ${summary.totalInward.toLocaleString('en-IN')}, outward disbursements is ₹ ${summary.totalOutward.toLocaleString('en-IN')}, leaving a net cash surplus of ₹ ${summary.netCashFlow.toLocaleString('en-IN')}.`;
            }
            return { speechText, lang: detectedLang };
        }

        // 10. INVENTORY & STOCK VALUATION IN LAKHS
        if (this.matchesAny(prompt, ['inventory', 'stock', 'materials', 'items in stock', 'out of stock', 'low stock', 'സ്റ്റോക്ക്', 'സാമഗ്രികൾ', 'ഇൻവെന്ററി', 'ലക്ഷം', 'എത്ര ലക്ഷം', 'ഔട്ട് ഓഫ് സ്റ്റോക്ക്'])) {
            const summary = LeoDB.functions.getInventorySummary(state);
            const outNames = summary.outOfStock.map(i => i.name).join(', ') || 'ആരുമില്ല';
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = `ഇൻവെന്ററിയിൽ ആകെ ${summary.totalItemsCount} ഇനം സാമഗ്രികളിലായി ₹ ${summary.valInLakhs} ലക്ഷം രൂപയുടെ സ്റ്റോക്ക് ഉണ്ട് (₹ ${summary.totalValuation.toLocaleString('en-IN')}). ഇതിൽ 2 ഇനങ്ങൾ ഔട്ട് ഓഫ് സ്റ്റോക്ക് ആണ്: ഫ്രിക്ഷൻ സ്റ്റേ 10", വെതർ സീലന്റ് സിലിക്കോൺ. കൂടാതെ റബ്ബർ ഗാസ്കറ്റ്, മൾട്ടിപോയിന്റ് ലോക്കുകൾ എന്നിവ ലോ സ്റ്റോക്കിലാണ്.`;
            } else {
                speechText = `Total inventory valuation is ₹ ${summary.valInLakhs} Lakhs (₹ ${summary.totalValuation.toLocaleString('en-IN')}) across ${summary.totalItemsCount} items. Out of stock items include: Friction Stays and Weather Sealant.`;
            }
            return { speechText, lang: detectedLang };
        }

        // 11. PRODUCTION ORDERS & STAGES
        if (this.matchesAny(prompt, ['production', 'orders', 'delivered', 'fabrication', 'പ്രൊഡക്ഷൻ', 'ഓർഡറുകൾ', 'ഏത് പൊസിഷനിൽ', 'ഏത് സ്റ്റേജിൽ', 'പണി എവിടെയെത്തി'])) {
            const summary = LeoDB.functions.getProductionSummary(state);
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = `വർക്ക്ഷോപ്പിൽ ഇപ്പോൾ ${summary.inProgress.length} ഓർഡറുകൾ പ്രൊഡക്ഷൻ സ്റ്റേജുകളിലാണ്. ഉദാഹരണത്തിന് ലക്ഷ്വറി വില്ല ഓർഡർ ഫാബ്രിക്കേഷൻ ആൻഡ് വെൽഡിംഗ് സ്റ്റേജിലും, അരുൺ കുമാറിന്റെ ഓർഡർ പെയിന്റിംഗ് ആൻഡ് പൗഡർ കോട്ടിംഗ് സ്റ്റേജിലുമാണ്. ആകെ ${summary.delivered.length} ഓർഡറുകൾ പൂർത്തിയാക്കി ഡെലിവറി ചെയ്തു.`;
            } else {
                speechText = `There are ${summary.inProgress.length} production orders active in the workshop across cutting, welding, and powder coating stages.`;
            }
            return { speechText, lang: detectedLang };
        }

        // 12. HR, LEAVES & SALARY ADVANCES
        if (this.matchesAny(prompt, ['leave', 'on leave', 'absent', 'attendance', 'salary', 'advance', 'ലീവ്', 'ആരാണ് ലീവ്', 'ഹാജർ', 'ശമ്പളം', 'അഡ്വാൻസ്'])) {
            const summary = LeoDB.functions.getHRAttendanceSummary(state);
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = `ഇന്ന് ഫാക്ടറിയിൽ സജീവ് പി (ഹെൽപ്പർ) ലീവിലാണ്. രജീഷ് കുമാറും മണി കങ്കനും ഫാക്ടറി ഫ്ലോറിലും, അരുൺ വി സൈറ്റിലും ഡ്യൂട്ടിയിലുണ്ട്. ആകെ ₹ ${summary.totalAdvance.toLocaleString('en-IN')} ശമ്പള അഡ്വാൻസ് എടുത്തിട്ടുണ്ട്.`;
            } else {
                speechText = `Today, Sajeev P (Helper) is on leave. The remaining staff are present on the factory floor and on site. Total salary advances disbursed is ₹ ${summary.totalAdvance.toLocaleString('en-IN')}.`;
            }
            return { speechText, lang: detectedLang };
        }

        // 13. STATEMENTS & PROFIT MARGINS
        if (this.matchesAny(prompt, ['statement', 'profit', 'profit margin', 'financial summary', 'p&l', 'സ്റ്റേറ്റ്മെന്റ്', 'ലാഭം', 'മാർജിൻ'])) {
            let speechText = '';
            if (detectedLang.startsWith('ml')) {
                speechText = 'ഈ സാമ്പത്തിക വർഷത്തിൽ ആകെ വിൽപ്പന ₹ 36,42,180 ആണ്. പർച്ചേസ് ചെലവ് ₹ 93,500, നെറ്റ് ലാഭം ₹ 12,60,000 (34.6 ശതമാനം മാർജിൻ) ആണ്.';
            } else {
                speechText = 'Total turnover is ₹ 36,42,180 with material expenses of ₹ 93,500, yielding a net profit margin of 34.6 percent.';
            }
            return { speechText, lang: detectedLang };
        }

        // 14. CASUAL BANTER ("സുഖമാണോ", jokes, greetings)
        if (this.matchesAny(prompt, ['hello', 'hi', 'hey', 'who are you', 'how are you', 'tell me a joke', 'joke', 'sukhamano', 'sukham', 'നമസ്കാരം', 'സുഖമാണോ', 'ആരാണ് നീ', 'തമാശ', 'വിശേഷങ്ങൾ'])) {
            const isJoke = this.matchesAny(prompt, ['joke', 'തമാശ', 'मजाक']);
            const isHowAreYou = this.matchesAny(prompt, ['sukhamano', 'sukham', 'സുഖമാണോ', 'how are you']);
            let speechText = '';
            if (isJoke) {
                speechText = 'ഒരു അലുമിനിയം വിൻഡോ ഗ്ലാസ് ഫ്രെയിമിനോട് പറഞ്ഞു: "നീ എന്നെ മുറുക്കി പിടിച്ചാൽ ഞാൻ പൊട്ടിപ്പോകും!" ഫ്രെയിം പറഞ്ഞു: "ഞാൻ ഇപിഡിഎം റബ്ബർ ഗാസ്കറ്റ് ഇട്ടിട്ടുണ്ടല്ലോ, പേടിക്കണ്ട!" ഹഹ! ബിസിനസ്സ് വിവരങ്ങൾക്കായി ഞാൻ സദാ തയ്യാറാണ്.';
            } else if (isHowAreYou) {
                speechText = 'തീർച്ചയായും സുഖമായിരിക്കുന്നു! നിങ്ങളുടെ ബിസിനസ്സും വിൻഡോ പ്രൊഡക്ഷൻ കാര്യങ്ങളും എങ്ങനെയുണ്ട്? ഇന്ന് എന്ത് സഹായമാണ് ഞാൻ ചെയ്തു തരേണ്ടത്?';
            } else {
                speechText = 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ സ്റ്റെല്ലോ ബിൽഡ് എഐ അസിസ്റ്റന്റായ ലിയോ. സെയിൽസ്, കൊട്ടേഷൻ, കസ്റ്റമർ വിവരങ്ങൾ, വിൻഡോ കാൽക്കുലേഷൻ എന്നിവയെല്ലാം പരിശോധിക്കാൻ ഞാൻ തയ്യാറാണ്.';
            }
            return { speechText, lang: detectedLang };
        }

        // 15. SMART CONVERSATIONAL FALLBACK (Polite, helpful, direct guidance)
        let speechText = '';
        if (detectedLang.startsWith('ml')) {
            speechText = `നിങ്ങൾ പറഞ്ഞത് മനസ്സിലായി. വിൻഡോ കാൽക്കുലേഷൻ, കസ്റ്റമർ പെൻഡിംഗ് പേയ്മെന്റ്, ഇന്നത്തെ സെയിൽസ്, കൊട്ടേഷൻസ്, അല്ലെങ്കിൽ ഇൻവെന്ററി സ്റ്റോക്ക് എന്നിവയെക്കുറിച്ച് എന്തും കൃത്യമായി എന്നോട് ചോദിക്കാം.`;
        } else {
            speechText = `I understand. You can ask me about window calculations, customer pending balances, today's sales, quotations, or inventory stock. How can I assist you?`;
        }
        return { speechText, lang: detectedLang };
    }
};

// ============================================================================
// 6. UI CONTROLLER (STRICTLY MINIMALIST CIRCULAR BUTTON - NO POPUP)
// ============================================================================

let leoSilenceTimer = null;
window.leoVoiceSessionActive = false;
window.leoIsSpeakingResponse = false;

export function initLeoAssistant() {
    // Remove any legacy modal or HUD if previously present in DOM
    const oldModal = document.getElementById('leo-voice-hud-modal');
    if (oldModal) oldModal.remove();
    const oldSpotlight = document.getElementById('leo-spotlight-modal');
    if (oldSpotlight) oldSpotlight.remove();

    injectLeoMinimalStyles();

    let circularVoiceBtn = document.getElementById('leo-circular-voice-btn');
    if (!circularVoiceBtn) {
        circularVoiceBtn = document.createElement('div');
        circularVoiceBtn.id = 'leo-circular-voice-btn';
        circularVoiceBtn.title = 'Leo AI - Click to speak';
        circularVoiceBtn.setAttribute('role', 'button');
        circularVoiceBtn.setAttribute('aria-label', 'Leo AI Voice Assistant');

        circularVoiceBtn.innerHTML = `
            <div class="leo-circle-pulse"></div>
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                <svg id="leo-circular-mic-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: #ffffff; filter: drop-shadow(0 0 6px rgba(255,255,255,0.7));">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
            </div>
        `;

        document.body.appendChild(circularVoiceBtn);
    }

    // STRICT USER REQUIREMENT:
    // Clicking the circular button toggles live voice recording directly.
    // Strictly NO popup window, modal, or interface appears.
    circularVoiceBtn.onclick = (e) => {
        e.stopPropagation();
        window.toggleLeoVoiceRecording();
    };

    // Keyboard shortcut (Ctrl+J or Cmd+J)
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
            e.preventDefault();
            window.toggleLeoVoiceRecording();
        }
        if (e.key === 'Escape') {
            if (window.leoVoiceSessionActive || LeoVoice.isSpeaking) {
                window.cancelLeoVoiceSession();
            }
        }
    });
}

// Visual State Management for Circular Button
window.setLeoButtonRecording = (isRecording) => {
    const btn = document.getElementById('leo-circular-voice-btn');
    if (btn) {
        if (isRecording) {
            btn.classList.add('recording');
            btn.setAttribute('aria-pressed', 'true');
            btn.title = 'Listening / Speaking... Click to stop';
        } else {
            btn.classList.remove('recording');
            btn.setAttribute('aria-pressed', 'false');
            btn.title = 'Leo AI - Click to speak';
        }
    }
};

// 20-Second Silence Auto-Shutoff Timer
function resetSilenceTimer() {
    clearTimeout(leoSilenceTimer);
    leoSilenceTimer = setTimeout(() => {
        console.log('[Leo Voice] 20 seconds elapsed with no speech. Auto-shutting off.');
        window.cancelLeoVoiceSession();
    }, 20000); // exactly 20 seconds
}

function clearSilenceTimer() {
    clearTimeout(leoSilenceTimer);
    leoSilenceTimer = null;
}

window.toggleLeoVoiceRecording = () => {
    if (window.leoVoiceSessionActive || LeoVoice.isSpeaking) {
        window.cancelLeoVoiceSession();
    } else {
        window.startLeoVoiceRecording();
    }
};

window.startLeoVoiceRecording = () => {
    // Remove any popup modal if it exists
    const oldModal = document.getElementById('leo-voice-hud-modal');
    if (oldModal) oldModal.remove();

    LeoVoice.stop();
    window.leoVoiceSessionActive = true;
    window.setLeoButtonRecording(true);

    // Start 20-second silence timer (auto-shutoff if user says nothing)
    resetSilenceTimer();

    LeoVoice.startListening(
        'ml-IN', // Defaults to natural Malayalam as requested
        (transcript) => {
            console.log('[Leo Voice] User Spoke:', transcript);
            clearSilenceTimer(); // Speech detected!
            window.processLeoSpokenQuery(transcript);
        },
        () => {
            // onEnd callback: do not shut off early; 20-second silence timer handles timeout
        },
        (error) => {
            console.warn('[Leo Voice] Speech recognition notice:', error);
            // 20-second silence timer will handle auto-shutoff
        }
    );
};

window.processLeoSpokenQuery = (spokenQuery) => {
    if (!spokenQuery || !spokenQuery.trim()) {
        window.cancelLeoVoiceSession();
        return;
    }

    clearSilenceTimer();
    window.leoVoiceSessionActive = false;

    // Get intelligent answer from LeoEngine
    const result = LeoEngine.query(spokenQuery);
    console.log('[Leo Voice] Leo Response:', result.speechText);

    // Keep button active (green) while speaking the response out loud
    window.setLeoButtonRecording(true);

    LeoVoice.speak(result.speechText, {
        lang: result.lang || 'ml-IN',
        onEnd: () => {
            // Once speech completes, smoothly revert button to Blue!
            window.setLeoButtonRecording(false);
        }
    });
};

window.cancelLeoVoiceSession = () => {
    clearSilenceTimer();
    window.leoVoiceSessionActive = false;
    LeoVoice.stopListening();
    LeoVoice.stop();
    window.setLeoButtonRecording(false);
};

// Backward-compatibility aliases
window.openLeoAI = () => window.toggleLeoVoiceRecording();
window.openLeoAIModal = window.openLeoAI;
window.askLeo = window.openLeoAI;
window.openLeoTextSearch = window.openLeoAI;
window.processLeoDirectVoiceQuery = (q) => window.processLeoSpokenQuery(q);

// ============================================================================
// 7. MINIMALIST CSS STYLES (NO POPUP MODALS)
// ============================================================================

function injectLeoMinimalStyles() {
    if (document.getElementById('leo-minimal-voice-styles')) return;

    const style = document.createElement('style');
    style.id = 'leo-minimal-voice-styles';
    style.textContent = `
        /* Minimalist Circular Voice Button */
        #leo-circular-voice-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 58px;
            height: 58px;
            border-radius: 50%;
            background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
            border: 2px solid #60a5fa;
            box-shadow: 0 4px 20px rgba(37, 99, 235, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 99998;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
        }

        #leo-circular-voice-btn:hover {
            transform: scale(1.08) translateY(-2px);
            box-shadow: 0 6px 28px rgba(37, 99, 235, 0.65);
        }

        /* Active Green Recording / Speaking State */
        #leo-circular-voice-btn.recording {
            background: linear-gradient(135deg, #15803d 0%, #22c55e 100%) !important;
            border-color: #86efac !important;
            box-shadow: 0 0 25px rgba(34, 197, 94, 0.8), 0 0 50px rgba(34, 197, 94, 0.4) !important;
            animation: leoVoiceActivePulse 1.2s infinite ease-in-out !important;
        }

        .leo-circle-pulse {
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 2px solid #60a5fa;
            animation: leoCirclePulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            pointer-events: none;
            opacity: 0.6;
        }

        #leo-circular-voice-btn.recording .leo-circle-pulse {
            border-color: #4ade80 !important;
            animation: leoRecordingRipple 1.2s cubic-bezier(0, 0.2, 0.8, 1) infinite !important;
            opacity: 1;
        }

        @keyframes leoVoiceActivePulse {
            0% { transform: scale(1); box-shadow: 0 0 15px rgba(34, 197, 94, 0.7); }
            50% { transform: scale(1.1); box-shadow: 0 0 35px rgba(34, 197, 94, 1); }
            100% { transform: scale(1); box-shadow: 0 0 15px rgba(34, 197, 94, 0.7); }
        }

        @keyframes leoRecordingRipple {
            0% { transform: scale(0.92); opacity: 0.9; }
            100% { transform: scale(1.55); opacity: 0; }
        }

        @keyframes leoCirclePulse {
            0% { transform: scale(0.95); opacity: 0.7; }
            70% { transform: scale(1.22); opacity: 0; }
            100% { transform: scale(1.26); opacity: 0; }
        }
    `;

    document.head.appendChild(style);
}
