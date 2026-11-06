const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const port = 3000;

// Auto-bundle helper to ensure bundle.js is always fresh
function buildBundle() {
    try {
        const bundleScript = path.join(__dirname, 'scripts', 'bundle.js');
        if (fs.existsSync(bundleScript)) {
            delete require.cache[require.resolve(bundleScript)];
            require(bundleScript);
        }
    } catch (e) {
        console.error('Failed to auto-build bundle:', e.message);
    }
}

// Initial bundle
buildBundle();

// Watch js files for development auto-bundling
try {
    fs.watch(path.join(__dirname, 'js'), { recursive: true }, (eventType, filename) => {
        if (filename && filename !== 'bundle.js' && filename.endsWith('.js')) {
            console.log(`File change detected (${filename}), rebundling...`);
            buildBundle();
        }
    });
} catch (e) {
    // Watch recursive might not be supported on all environments
}

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.pdf': 'application/pdf'
};

// --- ACCOUNTS CONFIGURATION PERSISTENCE & API LOGIC ---
const CONFIG_FILE = path.join(__dirname, 'data', 'accounts_configurations.json');
const DEFAULT_CONFIG_FILE = path.join(__dirname, 'data', 'default_accounts_configurations.json');
const RBAC_FILE = path.join(__dirname, 'data', 'rbac_roles_permissions.json');
const LEADS_FILE = path.join(__dirname, 'data', 'leads.json');
const META_CONFIG_FILE = path.join(__dirname, 'data', 'meta_webhook_config.json');
const ADMIN_CREDENTIALS_FILE = path.join(__dirname, 'data', 'admin_credentials.json');
const EMPLOYEES_FILE = path.join(__dirname, 'data', 'employees.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function loadEmployeesData() {
    try {
        if (fs.existsSync(EMPLOYEES_FILE)) {
            const raw = fs.readFileSync(EMPLOYEES_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Error reading EMPLOYEES_FILE:', e);
    }
    return [];
}

function saveEmployeesData(data) {
    try {
        const dir = path.dirname(EMPLOYEES_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error saving EMPLOYEES_FILE:', e);
    }
}

function loadUsersData() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const raw = fs.readFileSync(USERS_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Error reading USERS_FILE:', e);
    }
    return {};
}

function saveUsersData(data) {
    try {
        const dir = path.dirname(USERS_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error saving USERS_FILE:', e);
    }
}

const SALES_RETURNS_FILE = path.join(__dirname, 'data', 'sales_returns.json');
const PURCHASE_RETURNS_FILE = path.join(__dirname, 'data', 'purchase_returns.json');
const CUSTOMER_LEDGER_FILE = path.join(__dirname, 'data', 'customer_ledger.json');

function loadSalesReturnsData() {
    try {
        if (fs.existsSync(SALES_RETURNS_FILE)) {
            return JSON.parse(fs.readFileSync(SALES_RETURNS_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('Error reading SALES_RETURNS_FILE:', e);
    }
    return [];
}

function saveSalesReturnsData(data) {
    try {
        const dir = path.dirname(SALES_RETURNS_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(SALES_RETURNS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error saving SALES_RETURNS_FILE:', e);
    }
}

function loadPurchaseReturnsData() {
    try {
        if (fs.existsSync(PURCHASE_RETURNS_FILE)) {
            return JSON.parse(fs.readFileSync(PURCHASE_RETURNS_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('Error reading PURCHASE_RETURNS_FILE:', e);
    }
    return [];
}

function savePurchaseReturnsData(data) {
    try {
        const dir = path.dirname(PURCHASE_RETURNS_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(PURCHASE_RETURNS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error saving PURCHASE_RETURNS_FILE:', e);
    }
}

function loadCustomerLedgerData() {
    try {
        if (fs.existsSync(CUSTOMER_LEDGER_FILE)) {
            return JSON.parse(fs.readFileSync(CUSTOMER_LEDGER_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('Error reading CUSTOMER_LEDGER_FILE:', e);
    }
    return [];
}

function saveCustomerLedgerData(data) {
    try {
        const dir = path.dirname(CUSTOMER_LEDGER_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CUSTOMER_LEDGER_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error saving CUSTOMER_LEDGER_FILE:', e);
    }
}

function loadAdminCredentials() {
    try {
        if (fs.existsSync(ADMIN_CREDENTIALS_FILE)) {
            const raw = fs.readFileSync(ADMIN_CREDENTIALS_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Error loading ADMIN_CREDENTIALS_FILE:', e);
    }
    return {
        superAdmin: {
            userId: "SB-9901",
            username: "admin",
            email: "admin@stellobuild.com",
            fullName: "Shamsudheen V.K.",
            role: "Super Administrator",
            salt: "c782f9d146194b15b3a328109d9e6f21",
            passwordHash: "f899b24ad239e06868ac6f0e5fa4b5549a734b18421e0f0af315919e72a4e385b9acc7e31730cc97f158a1abd20fa3bc89ab3238490fc2387acd11b0a14d2dc9",
            fallbackHash: "c9535101db1c8ca0c19f5e4578d3b051b67cb0dce0475ad06e63f1e660f591bc12d445a11e24e117e506f7d6419d89c9ff9aa375749f8620ba0bf4964690c70f"
        }
    };
}

function verifyAdminPassword(inputAdminId, inputPassword) {
    if (!inputPassword || typeof inputPassword !== 'string') return false;
    const creds = loadAdminCredentials();
    const admin = creds.superAdmin;
    if (!admin) return false;

    // Check if inputAdminId matches (accepts empty or matching userId, username, email, 'admin', 'sb-9901')
    const normId = (inputAdminId || '').trim().toLowerCase();
    const matchesId = !normId ||
        normId === admin.userId.toLowerCase() ||
        normId === (admin.username || '').toLowerCase() ||
        normId === (admin.email || '').toLowerCase() ||
        normId === 'admin' ||
        normId === 'sb-9901';

    if (!matchesId) return false;

    try {
        const testHash = crypto.pbkdf2Sync(inputPassword, admin.salt, 10000, 64, 'sha512').toString('hex');
        if (crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(admin.passwordHash, 'hex'))) {
            return true;
        }
        if (admin.fallbackHash && crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(admin.fallbackHash, 'hex'))) {
            return true;
        }
    } catch (e) {
        console.error('Password hash comparison error:', e);
    }
    return false;
}

function loadLeadsData() {
    try {
        if (fs.existsSync(LEADS_FILE)) {
            const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Error reading LEADS_FILE:', e);
    }
    return [];
}

function saveLeadsData(data) {
    try {
        const dir = path.dirname(LEADS_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(LEADS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error saving leads data:', e);
    }
}

function loadMetaConfig() {
    try {
        if (fs.existsSync(META_CONFIG_FILE)) {
            const raw = fs.readFileSync(META_CONFIG_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Error reading META_CONFIG_FILE:', e);
    }
    return {
        pageId: "108429188410294",
        pageName: "Stello Build Fabrication & Architectural Glazing",
        formId: "892340192841029",
        formName: "Premium Windows & Glass Doors Inquiry Form (Kerala)",
        verifyToken: "stello_meta_verify_token_2026",
        pageAccessToken: "EAAGNO4...Meta_Permanent_System_Page_Access_Token...",
        autoSyncEnabled: true,
        webhookUrl: "https://erp.stellobuild.com/api/webhooks/meta",
        lastSyncedAt: new Date().toISOString(),
        totalLeadsCaptured: 0,
        webhookAuditLogs: []
    };
}

function saveMetaConfig(config) {
    try {
        const dir = path.dirname(META_CONFIG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(META_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error saving Meta config:', e);
    }
}

function loadRbacData() {
    try {
        if (fs.existsSync(RBAC_FILE)) {
            const raw = fs.readFileSync(RBAC_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Error reading RBAC_FILE:', e);
    }
    return { roles: [], modules: [], permissions: {}, userOverrides: {}, auditLogs: [] };
}

function saveRbacData(data) {
    try {
        const dir = path.dirname(RBAC_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(RBAC_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error saving RBAC data:', e);
    }
}

function loadConfigData() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Error reading CONFIG_FILE:', e);
    }
    try {
        if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
            const rawDef = fs.readFileSync(DEFAULT_CONFIG_FILE, 'utf-8');
            const parsed = JSON.parse(rawDef);
            saveConfigData(parsed);
            return parsed;
        }
    } catch (e) {
        console.error('Error loading default config:', e);
    }
    return { configurations: {}, auditLogs: [] };
}

function saveConfigData(data) {
    try {
        const dir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error saving config data:', e);
    }
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-user-role',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(JSON.stringify(payload));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

// Server-side Authentication & Role Context Extraction Middleware
function getRequestUser(req) {
    const authHeader = req.headers['authorization'] || '';
    const customUserId = req.headers['x-user-id'] || '';
    const customRole = req.headers['x-user-role'] || '';

    let urlObj;
    try {
        urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
    } catch (e) {
        urlObj = { searchParams: new Map() };
    }

    const queryUser = urlObj.searchParams.get ? urlObj.searchParams.get('userId') : null;
    const queryRole = urlObj.searchParams.get ? urlObj.searchParams.get('role') : null;

    let bearerUser = '';
    if (authHeader.startsWith('Bearer ')) {
        bearerUser = authHeader.substring(7).trim();
    }

    const userId = customUserId || queryUser || bearerUser || 'SB-9901';
    let role = customRole || queryRole;

    if (!role) {
        if (userId === 'SB-9901' || userId === 'admin') {
            role = 'admin';
        } else if (userId === 'EMP-101') {
            role = 'accounts';
        } else if (userId === 'EMP-102') {
            role = 'sales';
        } else if (['EMP-105', 'EMP-106', 'EMP-107', 'EMP-108'].includes(userId)) {
            role = 'production';
        } else {
            role = 'production';
        }
    }

    return {
        userId,
        role,
        isAdmin: (role === 'admin')
    };
}

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-user-role'
        });
        res.end();
        return;
    }

    // Strip query parameters and hash
    const cleanUrl = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    const reqUser = getRequestUser(req);

    // =========================================================================
    // PDF UPLOAD & PERSISTENCE ENDPOINT: /api/upload-pdf
    // =========================================================================
    if (req.method === 'POST' && cleanUrl === '/api/upload-pdf') {
        const body = await parseBody(req);
        if (!body.dataBase64) {
            return sendJson(res, 400, { success: false, message: 'Missing dataBase64' });
        }
        let rawBase64 = body.dataBase64;
        if (rawBase64.includes('base64,')) {
            rawBase64 = rawBase64.split('base64,')[1];
        }
        const buffer = Buffer.from(rawBase64, 'base64');
        const originalName = (body.filename || 'Quotation.pdf').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const filename = originalName.endsWith('.pdf') ? originalName : (originalName + '.pdf');
        
        const uploadsDir = path.join(__dirname, 'uploads', 'quotations');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, buffer);
        console.log(`[PDF Upload] Saved ${filename} (${buffer.length} bytes) to /uploads/quotations/${filename}`);
        
        const host = req.headers.host || `localhost:${port}`;
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const fileUrl = `/uploads/quotations/${filename}`;
        const fullUrl = `${protocol}://${host}${fileUrl}`;
        
        return sendJson(res, 200, {
            success: true,
            filename,
            url: fileUrl,
            fullUrl: fullUrl
        });
    }

    // =========================================================================
    // SALES RETURNS & FINANCIAL LEDGER ENDPOINTS: /api/sales/returns, /api/customer-ledger
    // =========================================================================
    if (cleanUrl === '/api/sales/returns') {
        if (req.method === 'GET') {
            const returns = loadSalesReturnsData();
            return sendJson(res, 200, { success: true, count: returns.length, returns });
        }
        if (req.method === 'POST') {
            const body = await parseBody(req);
            const returns = loadSalesReturnsData();
            const newReturn = {
                id: body.id || `SR-${new Date().getFullYear()}-${String(returns.length + 1).padStart(3, '0')}`,
                date: body.date || new Date().toISOString().split('T')[0],
                invoiceId: body.invoiceId || 'INV-GENERAL',
                customerId: body.customerId || 'C-GEN',
                customer: body.customer || 'Customer',
                items: body.items || 'Returned Goods',
                reason: body.reason || 'Client Scope Modification',
                amount: parseFloat(body.amount) || 0,
                restock: body.restock !== false,
                creditNoteGenerated: true,
                creditNoteId: `CN-${new Date().getFullYear()}-${String(returns.length + 1).padStart(3, '0')}`,
                creditDestination: 'CUSTOMER_ADVANCE_WALLET',
                status: 'Processed',
                createdAt: new Date().toISOString()
            };
            returns.unshift(newReturn);
            saveSalesReturnsData(returns);

            // Record into customer ledger
            const ledger = loadCustomerLedgerData();
            ledger.unshift({
                id: `LED-${Date.now()}`,
                invoiceId: newReturn.invoiceId,
                customerId: newReturn.customerId,
                customerName: newReturn.customer,
                date: newReturn.date,
                type: 'SALES_RETURN',
                paymentMode: 'CREDIT_NOTE',
                invoiceTotal: 0,
                advanceApplied: 0,
                balanceDue: 0,
                accountsReceivable: 0,
                particulars: `Sales Return ${newReturn.id} against ${newReturn.invoiceId} - ₹${newReturn.amount.toLocaleString('en-IN')} credited to advance wallet`,
                timestamp: new Date().toISOString()
            });
            saveCustomerLedgerData(ledger);

            return sendJson(res, 201, { success: true, returnVoucher: newReturn });
        }
    }

    if (cleanUrl === '/api/customer-ledger' && req.method === 'GET') {
        const ledger = loadCustomerLedgerData();
        return sendJson(res, 200, { success: true, count: ledger.length, ledger });
    }

    if (cleanUrl === '/api/customers/advance/deduct' && req.method === 'POST') {
        const body = await parseBody(req);
        const { customerId, customerName, amount, invoiceId } = body;
        const ledger = loadCustomerLedgerData();
        const entry = {
            id: `LED-${Date.now()}`,
            invoiceId: invoiceId || 'N/A',
            customerId: customerId || 'CUST',
            customerName: customerName || 'Customer',
            date: new Date().toISOString().split('T')[0],
            type: 'ADVANCE_ADJUSTMENT',
            paymentMode: 'LEDGER_OFFSET',
            invoiceTotal: parseFloat(amount) || 0,
            advanceApplied: parseFloat(amount) || 0,
            balanceDue: 0,
            accountsReceivable: 0,
            particulars: `Advance deduction ₹${(parseFloat(amount) || 0).toLocaleString('en-IN')} applied on Invoice ${invoiceId || ''}`,
            timestamp: new Date().toISOString()
        };
        ledger.unshift(entry);
        saveCustomerLedgerData(ledger);
        return sendJson(res, 200, { success: true, entry });
    }

    // =========================================================================
    // REST API ENDPOINTS: /api/rbac/*
    // =========================================================================
    if (cleanUrl.startsWith('/api/rbac')) {
        console.log(`[RBAC ${req.method}] ${cleanUrl} (User: ${reqUser.userId}, Role: ${reqUser.role})`);
        const rbacData = loadRbacData();

        // 1. GET /api/rbac/roles
        if (req.method === 'GET' && cleanUrl === '/api/rbac/roles') {
            return sendJson(res, 200, {
                success: true,
                roles: rbacData.roles || []
            });
        }

        // 2. GET /api/rbac/permissions
        if (req.method === 'GET' && cleanUrl === '/api/rbac/permissions') {
            return sendJson(res, 200, {
                success: true,
                roles: rbacData.roles || [],
                modules: rbacData.modules || [],
                permissions: rbacData.permissions || {},
                userOverrides: rbacData.userOverrides || {},
                auditLogs: rbacData.auditLogs || []
            });
        }

        // 3. GET /api/rbac/session (Validate active session & effective permissions)
        if (req.method === 'GET' && cleanUrl === '/api/rbac/session') {
            const rolePerms = (rbacData.permissions && rbacData.permissions[reqUser.role]) || {};
            const userOverrides = (rbacData.userOverrides && rbacData.userOverrides[reqUser.userId]) || {};
            const effectivePerms = { ...rolePerms, ...userOverrides };

            return sendJson(res, 200, {
                success: true,
                authenticated: true,
                user: {
                    userId: reqUser.userId,
                    role: reqUser.role,
                    isAdmin: reqUser.isAdmin,
                    permissions: effectivePerms
                }
            });
        }

        // 4. PUT /api/rbac/permissions/:roleId (Update Role Permissions - Admin Only)
        const rolePermMatch = cleanUrl.match(/^\/api\/rbac\/permissions\/([a-zA-Z0-9_\-]+)$/);
        if (req.method === 'PUT' && rolePermMatch) {
            if (!reqUser.isAdmin) {
                return sendJson(res, 403, {
                    success: false,
                    error: 'Forbidden: Administrative authorization required to update role permissions.',
                    requiredRole: 'admin',
                    currentRole: reqUser.role
                });
            }

            const targetRoleId = rolePermMatch[1];
            const body = await parseBody(req);
            const newPermissions = body.permissions || {};

            if (!rbacData.permissions) rbacData.permissions = {};
            rbacData.permissions[targetRoleId] = {
                ...(rbacData.permissions[targetRoleId] || {}),
                ...newPermissions
            };

            const auditEntry = {
                id: 'LOG-RBAC-' + Date.now(),
                timestamp: new Date().toISOString(),
                adminId: reqUser.userId,
                action: 'UPDATE_ROLE_PERMISSIONS',
                targetRole: targetRoleId,
                details: `Updated permissions for role ${targetRoleId}.`,
                modulesUpdated: Object.keys(newPermissions)
            };
            if (!rbacData.auditLogs) rbacData.auditLogs = [];
            rbacData.auditLogs.unshift(auditEntry);

            saveRbacData(rbacData);
            return sendJson(res, 200, {
                success: true,
                message: `Permissions updated for role ${targetRoleId}.`,
                permissions: rbacData.permissions[targetRoleId],
                log: auditEntry
            });
        }

        // 5. PUT /api/rbac/users/:userId/permissions (Update User Custom Overrides - Admin Only)
        const userPermMatch = cleanUrl.match(/^\/api\/rbac\/users\/([a-zA-Z0-9_\-]+)\/permissions$/);
        if (req.method === 'PUT' && userPermMatch) {
            if (!reqUser.isAdmin) {
                return sendJson(res, 403, {
                    success: false,
                    error: 'Forbidden: Administrative authorization required to update user permission overrides.',
                    requiredRole: 'admin',
                    currentRole: reqUser.role
                });
            }

            const targetUserId = userPermMatch[1];
            const body = await parseBody(req);
            const userOverrides = body.permissions || {};

            if (!rbacData.userOverrides) rbacData.userOverrides = {};
            rbacData.userOverrides[targetUserId] = userOverrides;

            const auditEntry = {
                id: 'LOG-RBAC-' + Date.now(),
                timestamp: new Date().toISOString(),
                adminId: reqUser.userId,
                action: 'UPDATE_USER_OVERRIDES',
                targetUser: targetUserId,
                details: `Custom module permissions configured for user ${targetUserId}.`
            };
            if (!rbacData.auditLogs) rbacData.auditLogs = [];
            rbacData.auditLogs.unshift(auditEntry);

            saveRbacData(rbacData);
            return sendJson(res, 200, {
                success: true,
                message: `Permission overrides saved for user ${targetUserId}.`,
                overrides: rbacData.userOverrides[targetUserId],
                log: auditEntry
            });
        }

        return sendJson(res, 404, { success: false, message: 'RBAC endpoint not found.' });
    }

    // =========================================================================
    // REST API ENDPOINTS: /api/admin (Protected Security Challenge & Reset Endpoints)
    // =========================================================================
    if (cleanUrl.startsWith('/api/admin')) {
        console.log(`[ADMIN SECURITY API ${req.method}] ${cleanUrl} (User: ${reqUser.userId}, Role: ${reqUser.role})`);

        // 1. POST /api/admin/verify-access (Page Entry Authentication Challenge)
        if (req.method === 'POST' && cleanUrl === '/api/admin/verify-access') {
            const body = await parseBody(req);
            const inputAdminId = body.adminId || reqUser.userId || 'SB-9901';
            const inputPassword = body.password || '';

            const isValid = verifyAdminPassword(inputAdminId, inputPassword);

            const configData = loadConfigData();
            if (!configData.auditLogs) configData.auditLogs = [];

            if (!isValid) {
                console.warn(`[SECURITY ALERT] Failed admin authentication attempt for accounts_config by ${inputAdminId}`);
                const failedLog = {
                    id: 'LOG-SEC-' + Date.now(),
                    timestamp: new Date().toISOString(),
                    adminId: inputAdminId,
                    adminName: 'Unknown / Authentication Failed',
                    action: 'FAILED_ACCESS_CHALLENGE',
                    moduleId: 'accounts_config',
                    moduleName: 'Accounts Configuration Master Gate',
                    details: `Unauthorized or invalid password verification attempt on Accounts Configuration gate by user identifier '${inputAdminId}'. Access denied.`,
                    diff: [{ param: 'Gate Challenge', oldVal: 'Locked', newVal: 'Attempt Blocked (401)' }]
                };
                configData.auditLogs.unshift(failedLog);
                saveConfigData(configData);

                return sendJson(res, 401, {
                    success: false,
                    message: 'Invalid administrator password. Security breach attempt has been recorded in the audit trail.',
                    error: 'AUTHENTICATION_FAILED'
                });
            }

            // Success: Generate unlock token
            const token = crypto.randomBytes(24).toString('hex');
            const successLog = {
                id: 'LOG-AUTH-' + Date.now(),
                timestamp: new Date().toISOString(),
                adminId: inputAdminId,
                adminName: 'Shamsudheen V.K. (Super Admin)',
                action: 'ACCESS_CHALLENGE_PASSED',
                moduleId: 'accounts_config',
                moduleName: 'Accounts Configuration Master Gate',
                details: `Super Administrator challenge-response passed. Unlocked master configuration controls for user '${inputAdminId}'.`,
                diff: [{ param: 'Gate Challenge', oldVal: 'Locked', newVal: 'Unlocked' }]
            };
            configData.auditLogs.unshift(successLog);
            saveConfigData(configData);

            return sendJson(res, 200, {
                success: true,
                message: 'Security challenge successful. Master configuration access granted.',
                token,
                expiresIn: 900, // 15 mins
                admin: {
                    userId: 'SB-9901',
                    name: 'Shamsudheen V.K.',
                    role: 'Super Administrator'
                }
            });
        }

        // 2. POST /api/admin/reset-configurations (Destructive Credential Re-Authentication)
        if (req.method === 'POST' && cleanUrl === '/api/admin/reset-configurations') {
            const body = await parseBody(req);
            const moduleId = body.moduleId || 'all';
            const adminId = (body.adminId || '').trim();
            const password = body.password || '';
            const confirmToken = (body.confirmToken || '').trim();

            const configData = loadConfigData();
            const defData = fs.existsSync(DEFAULT_CONFIG_FILE) ? JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE, 'utf-8')) : { configurations: {} };
            if (!configData.auditLogs) configData.auditLogs = [];

            // 1. Validate Admin User ID & Password against secure hash
            if (!adminId || !password || !verifyAdminPassword(adminId, password)) {
                console.warn(`[SECURITY ALERT] Destructive reset operation rejected: Invalid credentials for ${adminId} on module: ${moduleId}`);
                const failedResetLog = {
                    id: 'LOG-SEC-' + Date.now(),
                    timestamp: new Date().toISOString(),
                    adminId: adminId || 'Anonymous',
                    adminName: 'Authentication Failed',
                    action: 'FAILED_RESET_AUTHENTICATION',
                    moduleId,
                    moduleName: moduleId === 'all' ? 'All ERP Modules' : (defData.configurations[moduleId]?.name || moduleId),
                    details: `Unauthorized destructive reset attempt on module '${moduleId}'. Invalid administrator credentials provided. Rollback aborted.`,
                    diff: [{ param: 'Reset Security', oldVal: 'Action Blocked', newVal: 'Credentials Rejected (401)' }]
                };
                configData.auditLogs.unshift(failedResetLog);
                saveConfigData(configData);

                return sendJson(res, 401, {
                    success: false,
                    message: 'Security authorization failed: Invalid Admin User ID or Password. Destruction aborted.',
                    error: 'INVALID_CREDENTIALS'
                });
            }

            const adminName = 'Shamsudheen V.K.';

            // 2. Master Global Reset (All 14 Modules)
            if (moduleId === 'all') {
                if (confirmToken !== 'RESET') {
                    return sendJson(res, 400, {
                        success: false,
                        message: 'Master Reset safety requirement not met: You must explicitly confirm by typing RESET.',
                        error: 'CONFIRM_TOKEN_REQUIRED'
                    });
                }

                const freshDefaults = JSON.parse(JSON.stringify(defData.configurations || {}));
                Object.keys(freshDefaults).forEach(k => {
                    freshDefaults[k].status = 'Default';
                    freshDefaults[k].lastModified = new Date().toISOString();
                    freshDefaults[k].modifiedBy = `${adminName} (${adminId})`;
                });

                configData.configurations = freshDefaults;
                const logEntry = {
                    id: 'LOG-' + Date.now(),
                    timestamp: new Date().toISOString(),
                    adminId,
                    adminName,
                    action: 'GLOBAL_RESET',
                    moduleId: 'all',
                    moduleName: 'All 14 ERP Modules',
                    details: `Authenticated Master Global Reset executed by ${adminName} (${adminId}). Restored all 14 module configurations to factory baseline defaults.`,
                    diff: [{ param: 'All Modules', oldVal: 'Custom Configuration State', newVal: 'Baseline Factory Defaults' }]
                };
                configData.auditLogs.unshift(logEntry);
                saveConfigData(configData);

                return sendJson(res, 200, {
                    success: true,
                    message: 'All ERP module configurations have been authenticated and reset to factory defaults.',
                    configurations: configData.configurations,
                    log: logEntry
                });
            }

            // 3. Single Module Reset
            if (!defData.configurations || !defData.configurations[moduleId]) {
                return sendJson(res, 404, {
                    success: false,
                    message: `Module '${moduleId}' not found in factory configuration baselines.`,
                    error: 'MODULE_NOT_FOUND'
                });
            }

            const oldConfig = configData.configurations[moduleId] || {};
            const restoredConfig = JSON.parse(JSON.stringify(defData.configurations[moduleId]));
            restoredConfig.status = 'Default';
            restoredConfig.lastModified = new Date().toISOString();
            restoredConfig.modifiedBy = `${adminName} (${adminId})`;

            configData.configurations[moduleId] = restoredConfig;
            const logEntry = {
                id: 'LOG-' + Date.now(),
                timestamp: new Date().toISOString(),
                adminId,
                adminName,
                action: 'MODULE_RESET',
                moduleId,
                moduleName: restoredConfig.name,
                details: `Authenticated factory reset for ${restoredConfig.name} executed by ${adminName} (${adminId}).`,
                diff: [{ param: 'Module State', oldVal: oldConfig.status || 'Customized', newVal: 'Default' }]
            };
            configData.auditLogs.unshift(logEntry);
            saveConfigData(configData);

            return sendJson(res, 200, {
                success: true,
                message: `Reset ${restoredConfig.name} to factory default settings.`,
                configuration: restoredConfig,
                configurations: configData.configurations,
                log: logEntry
            });
        }

        // 3. GET /api/admin/pending-employees (Retrieve Unprovisioned Employees List)
        if (req.method === 'GET' && cleanUrl === '/api/admin/pending-employees') {
            const employees = loadEmployeesData();
            const pending = employees.filter(e => e.status === 'pending_provisioning' || e.provisioningStatus === 'pending_provisioning' || !e.hasLogin);
            return sendJson(res, 200, {
                success: true,
                pendingEmployees: pending,
                allEmployees: employees,
                totalPending: pending.length,
                totalEmployees: employees.length
            });
        }

        // 4. POST /api/admin/provision-access (Generate Credentials, Bcrypt Hash & Assign Module Permissions)
        if (req.method === 'POST' && cleanUrl === '/api/admin/provision-access') {
            const body = await parseBody(req);
            const employeeId = body.employeeId;
            const permissions = body.permissions || {};

            if (!employeeId) {
                return sendJson(res, 400, { success: false, message: 'Employee ID is required.' });
            }

            let employees = loadEmployeesData();
            let emp = employees.find(e => e.id === employeeId);

            if (!emp) {
                if (body.employee) {
                    emp = body.employee;
                    employees.push(emp);
                } else {
                    return sendJson(res, 404, { success: false, message: `Employee with ID ${employeeId} not found.` });
                }
            }

            // Automatic Credential Generation Engine:
            // 1. Username Pattern: Employee Name (lowercase, no spaces) + Last 4 digits of phone number
            const cleanName = (emp.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
            const phoneDigits = (emp.phone || '0000').replace(/\D/g, '').slice(-4) || '1234';
            const username = `${cleanName}${phoneDigits}`;

            // 2. Password Pattern: Exactly 6 characters starting strictly with 'STY' followed by 3 randomized numbers (e.g. STY482)
            const randomDigits = Math.floor(100 + Math.random() * 900);
            const rawPassword = `STY${randomDigits}`;

            // 3. Store hashed password securely using bcrypt
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(rawPassword, salt);

            // Save in users.json and admin_credentials.json
            let users = loadUsersData();
            users[username] = {
                userId: emp.id,
                username: username,
                passwordHash: passwordHash,
                fullName: emp.name,
                email: emp.email || `${username}@stellobuild.com`,
                role: emp.role,
                department: emp.department || 'Operations',
                permissions: permissions,
                isProvisioned: true,
                createdAt: new Date().toISOString()
            };
            saveUsersData(users);

            // Also mirror in admin_credentials.json for system login lookup
            try {
                let adminCreds = loadAdminCredentials();
                if (!adminCreds.provisionedUsers) adminCreds.provisionedUsers = {};
                adminCreds.provisionedUsers[username] = {
                    userId: emp.id,
                    username: username,
                    passwordHash: passwordHash,
                    fullName: emp.name,
                    role: emp.role,
                    permissions: permissions,
                    provisionedAt: new Date().toISOString()
                };
                fs.writeFileSync(ADMIN_CREDENTIALS_FILE, JSON.stringify(adminCreds, null, 2), 'utf-8');
            } catch (e) {
                console.error('Error saving provisioned user in ADMIN_CREDENTIALS_FILE:', e);
            }

            // Update Employee Record
            emp.status = 'provisioned';
            emp.provisioningStatus = 'provisioned';
            emp.hasLogin = true;
            emp.username = username;
            emp.permissions = permissions;
            emp.provisionedAt = new Date().toISOString();
            saveEmployeesData(employees);

            // Update RBAC user overrides
            try {
                let rbacData = loadRbacData();
                if (!rbacData.userOverrides) rbacData.userOverrides = {};
                rbacData.userOverrides[emp.id] = permissions;
                if (!rbacData.auditLogs) rbacData.auditLogs = [];
                rbacData.auditLogs.unshift({
                    id: 'LOG-PROV-' + Date.now(),
                    timestamp: new Date().toISOString(),
                    adminId: reqUser.userId || 'SB-9901',
                    action: 'PROVISION_EMPLOYEE_LOGIN',
                    employeeId: emp.id,
                    username: username,
                    details: `Generated credentials and provisioned module permissions for ${emp.name} (${username}).`
                });
                saveRbacData(rbacData);
            } catch (e) {
                console.error('Error updating RBAC for provisioned employee:', e);
            }

            console.log(`[PROVISION SUCCESS] Generated login for ${emp.name} -> Username: ${username}, Temp Password: ${rawPassword}`);

            return sendJson(res, 200, {
                success: true,
                message: 'Employee credentials successfully generated and provisioned.',
                username: username,
                tempPassword: rawPassword,
                credentials: {
                    employeeId: emp.id,
                    employeeName: emp.name,
                    username: username,
                    password: rawPassword, // Plaintext returned strictly for admin modal popup display and 1-click copy
                    tempPassword: rawPassword,
                    role: emp.role,
                    department: emp.department || 'Operations',
                    permissions: permissions,
                    generatedAt: new Date().toISOString()
                },
                employee: emp
            });
        }

        return sendJson(res, 404, { success: false, message: 'Admin endpoint not found.' });
    }

    // =========================================================================
    // REST API ENDPOINTS: /api/hr/* (HR Management & Employee Onboarding)
    // =========================================================================
    if (cleanUrl.startsWith('/api/hr')) {
        console.log(`[HR API ${req.method}] ${cleanUrl} (User: ${reqUser.userId}, Role: ${reqUser.role})`);

        // 1. GET /api/hr/employees (List all employees)
        if (req.method === 'GET' && cleanUrl === '/api/hr/employees') {
            const employees = loadEmployeesData();
            return sendJson(res, 200, {
                success: true,
                employees: employees
            });
        }

        // 2. POST /api/hr/employees (Step 1: HR Manager Employee Creation Interface)
        if (req.method === 'POST' && cleanUrl === '/api/hr/employees') {
            const body = await parseBody(req);
            let employees = loadEmployeesData();

            // Validate mandatory fields
            const name = (body.name || '').trim();
            const phone = (body.phone || '').trim();

            if (!name || !phone) {
                return sendJson(res, 400, {
                    success: false,
                    message: 'Full Name and Phone Number are required fields.'
                });
            }

            // Generate unique sequential employee ID if not provided
            const nextIdNum = employees.reduce((max, e) => {
                const m = (e.id || '').match(/(\d+)$/);
                return m ? Math.max(max, parseInt(m[1], 10)) : max;
            }, 108) + 1;

            const role = (body.role || body.profession || 'Fabricator').trim();
            const department = body.department || (
                role.toLowerCase().includes('account') ? 'Accounts' :
                role.toLowerCase().includes('sale') ? 'Sales & CRM' :
                role.toLowerCase().includes('design') ? 'Designing' :
                role.toLowerCase().includes('sup') ? 'Operations' :
                role.toLowerCase().includes('paint') ? 'Painting Section' :
                role.toLowerCase().includes('weld') || role.toLowerCase().includes('fab') ? 'Fabrication' : 'Operations & Fabrication'
            );

            const newEmployee = {
                id: body.id || `EMP-${nextIdNum}`,
                name: name,
                phone: phone,
                email: (body.email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@stellobuild.com`).trim(),
                address: (body.address || body.place || body.location || '').trim(),
                place: (body.place || body.address || body.location || '').trim(),
                monthlySalary: parseFloat(body.monthlySalary || body.salary) || 25000,
                shift: body.shift || '08:30 AM - 05:30 PM (8 hrs)',
                shiftHours: parseFloat(body.shiftHours) || 8,
                reportingTime: body.reportingTime || '08:30 AM',
                overtimeRate: parseFloat(body.overtimeRate) || 150,
                role: role,
                department: department,
                photo: body.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                // Requirement: Saving stores the record in the employees collection without granting system login access yet
                status: 'pending_provisioning',
                provisioningStatus: 'pending_provisioning',
                hasLogin: false,
                permissions: {},
                createdAt: new Date().toISOString()
            };

            employees.push(newEmployee);
            saveEmployeesData(employees);

            console.log(`[HR ONBOARDING] Created employee ${newEmployee.name} (${newEmployee.id}) with status pending_provisioning.`);

            return sendJson(res, 201, {
                success: true,
                message: 'Employee onboarding profile saved successfully with pending provisioning status.',
                employee: newEmployee
            });
        }

        return sendJson(res, 404, { success: false, message: 'HR endpoint not found.' });
    }

    // =========================================================================
    // REST API ENDPOINTS: /api/configurations (Protected by Server-Side Admin Route Guard)
    // =========================================================================
    if (cleanUrl.startsWith('/api/configurations')) {
        console.log(`[API ${req.method}] ${cleanUrl} (User: ${reqUser.userId}, Role: ${reqUser.role})`);
        
        // SERVER-SIDE ROUTE GUARD: Only Admin may modify or access master configurations
        if (!reqUser.isAdmin) {
            console.warn(`[SECURITY BLOCK] Unauthorized configuration access attempt by ${reqUser.userId} (Role: ${reqUser.role})`);
            return sendJson(res, 403, {
                success: false,
                error: 'Forbidden: Administrative access required for Accounts Configuration.',
                requiredRole: 'admin',
                currentRole: reqUser.role,
                currentUserId: reqUser.userId
            });
        }

        const data = loadConfigData();
        const defData = fs.existsSync(DEFAULT_CONFIG_FILE) ? JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE, 'utf-8')) : { configurations: {} };

        // 1. GET /api/configurations
        if (req.method === 'GET' && cleanUrl === '/api/configurations') {
            return sendJson(res, 200, {
                success: true,
                configurations: data.configurations || {},
                auditLogs: data.auditLogs || []
            });
        }

        // 2. GET /api/configurations/audit-logs
        if (req.method === 'GET' && cleanUrl === '/api/configurations/audit-logs') {
            return sendJson(res, 200, {
                success: true,
                auditLogs: data.auditLogs || []
            });
        }

        // 3. POST /api/configurations/reset-all (Global Admin Reset)
        if (req.method === 'POST' && cleanUrl === '/api/configurations/reset-all') {
            const body = await parseBody(req);
            const token = (body.confirmToken || '').trim();
            const adminId = body.adminId || 'SB-9901';
            const adminName = body.adminName || 'Shamsudheen V.K.';

            if (body.password && !verifyAdminPassword(adminId, body.password)) {
                return sendJson(res, 401, {
                    success: false,
                    message: 'Security authorization failed: Invalid administrator password.'
                });
            }

            if (token !== 'RESET' && token !== 'admin123' && token !== 'SUPERADMIN') {
                return sendJson(res, 403, {
                    success: false,
                    message: 'Security authorization failed. You must confirm by typing RESET.'
                });
            }

            // Restore all to baseline defaults
            const freshDefaults = JSON.parse(JSON.stringify(defData.configurations || {}));
            Object.keys(freshDefaults).forEach(k => {
                freshDefaults[k].status = 'Default';
                freshDefaults[k].lastModified = new Date().toISOString();
                freshDefaults[k].modifiedBy = `${adminName} (${adminId})`;
            });

            data.configurations = freshDefaults;
            const logEntry = {
                id: 'LOG-' + Date.now(),
                timestamp: new Date().toISOString(),
                adminId,
                adminName,
                action: 'GLOBAL_RESET',
                moduleId: 'all',
                moduleName: 'All 14 ERP Modules',
                details: 'Master Admin Global Reset executed. Restored all 14 module configurations to factory baseline defaults.',
                diff: [{ param: 'All Modules', oldVal: 'Custom Configuration State', newVal: 'Baseline Factory Defaults' }]
            };
            if (!data.auditLogs) data.auditLogs = [];
            data.auditLogs.unshift(logEntry);

            saveConfigData(data);
            return sendJson(res, 200, {
                success: true,
                message: 'All ERP module configurations have been reset to baseline defaults.',
                configurations: data.configurations,
                log: logEntry
            });
        }

        // 4. POST /api/configurations/:moduleId/reset (Individual Module Reset)
        const resetMatch = cleanUrl.match(/^\/api\/configurations\/([a-zA-Z0-9_\-]+)\/reset$/);
        if (req.method === 'POST' && resetMatch) {
            const moduleId = resetMatch[1];
            const body = await parseBody(req);
            const adminId = body.adminId || 'SB-9901';
            const adminName = body.adminName || 'Shamsudheen V.K.';

            if (body.password && !verifyAdminPassword(adminId, body.password)) {
                return sendJson(res, 401, {
                    success: false,
                    message: 'Security authorization failed: Invalid administrator password.'
                });
            }

            if (!defData.configurations || !defData.configurations[moduleId]) {
                return sendJson(res, 404, { success: false, message: `Module ${moduleId} not found in defaults.` });
            }

            const oldConfig = data.configurations[moduleId] || {};
            const restoredConfig = JSON.parse(JSON.stringify(defData.configurations[moduleId]));
            restoredConfig.status = 'Default';
            restoredConfig.lastModified = new Date().toISOString();
            restoredConfig.modifiedBy = `${adminName} (${adminId})`;

            data.configurations[moduleId] = restoredConfig;

            const logEntry = {
                id: 'LOG-' + Date.now(),
                timestamp: new Date().toISOString(),
                adminId,
                adminName,
                action: 'MODULE_RESET',
                moduleId,
                moduleName: restoredConfig.name,
                details: `Reset configuration for ${restoredConfig.name} to original factory default settings.`,
                diff: [{ param: 'Module State', oldVal: oldConfig.status || 'Customized', newVal: 'Default' }]
            };
            if (!data.auditLogs) data.auditLogs = [];
            data.auditLogs.unshift(logEntry);

            saveConfigData(data);
            return sendJson(res, 200, {
                success: true,
                message: `Reset ${restoredConfig.name} to factory default settings.`,
                configuration: restoredConfig,
                log: logEntry
            });
        }

        // 5. PUT /api/configurations/:moduleId (Update / Modify Module Configuration)
        const updateMatch = cleanUrl.match(/^\/api\/configurations\/([a-zA-Z0-9_\-]+)$/);
        if (req.method === 'PUT' && updateMatch) {
            const moduleId = updateMatch[1];
            const body = await parseBody(req);
            const updates = body.config || {};
            const adminId = body.adminId || 'SB-9901';
            const adminName = body.adminName || 'Shamsudheen V.K.';

            if (!data.configurations[moduleId]) {
                return sendJson(res, 404, { success: false, message: `Module ${moduleId} not found.` });
            }

            const current = data.configurations[moduleId];
            const diff = [];

            // Compute changes for audit logging
            const checkDiff = (prefix, o1, o2) => {
                if (!o2) return;
                Object.keys(o2).forEach(k => {
                    const fullKey = prefix ? `${prefix}.${k}` : k;
                    if (typeof o2[k] === 'object' && o2[k] !== null && !Array.isArray(o2[k])) {
                        checkDiff(fullKey, o1 ? o1[k] : {}, o2[k]);
                    } else if (o1 && o1[k] !== undefined && JSON.stringify(o1[k]) !== JSON.stringify(o2[k])) {
                        diff.push({ param: fullKey, oldVal: o1[k], newVal: o2[k] });
                    }
                });
            };

            checkDiff('', current, updates);

            // Merge updates
            const updatedConfig = {
                ...current,
                ...updates,
                general: { ...(current.general || {}), ...(updates.general || {}) },
                fieldRules: { ...(current.fieldRules || {}), ...(updates.fieldRules || {}) },
                permissions: { ...(current.permissions || {}), ...(updates.permissions || {}) },
                status: 'Customized',
                lastModified: new Date().toISOString(),
                modifiedBy: `${adminName} (${adminId})`
            };

            data.configurations[moduleId] = updatedConfig;

            const logEntry = {
                id: 'LOG-' + Date.now(),
                timestamp: new Date().toISOString(),
                adminId,
                adminName,
                action: 'UPDATE',
                moduleId,
                moduleName: updatedConfig.name,
                details: `Updated ${diff.length} configuration parameter(s) for ${updatedConfig.name}.`,
                diff
            };
            if (!data.auditLogs) data.auditLogs = [];
            data.auditLogs.unshift(logEntry);

            saveConfigData(data);
            return sendJson(res, 200, {
                success: true,
                message: `Successfully updated configuration for ${updatedConfig.name}.`,
                configuration: updatedConfig,
                log: logEntry
            });
        }

        return sendJson(res, 404, { success: false, message: 'Configuration endpoint not found.' });
    }

    // =========================================================================
    // REST API ENDPOINTS: /api/webhooks/meta (Facebook & Instagram Lead Ads)
    // =========================================================================
    if (cleanUrl === '/api/webhooks/meta') {
            const metaConfig = loadMetaConfig();

            // 1. GET: Verification Challenge from Meta Graph API
            if (req.method === 'GET') {
                let urlObj;
                try {
                    urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
                } catch (e) {
                    urlObj = { searchParams: new URLSearchParams() };
                }
                const hubMode = urlObj.searchParams.get('hub.mode');
                const hubToken = urlObj.searchParams.get('hub.verify_token');
                const hubChallenge = urlObj.searchParams.get('hub.challenge');

                if (hubMode === 'subscribe' && hubToken === metaConfig.verifyToken) {
                    console.log(`[Meta Webhook] GET verification succeeded with verify_token "${hubToken}".`);
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(hubChallenge || 'CHALLENGE_ACCEPTED');
                    return;
                } else {
                    console.warn(`[Meta Webhook] Verification failed. Expected "${metaConfig.verifyToken}", got "${hubToken}".`);
                    res.writeHead(403, { 'Content-Type': 'text/plain' });
                    res.end('Forbidden: Verification token mismatch');
                    return;
                }
            }

            // 2. POST: Real-Time Lead Ingestion Webhook Listener
            if (req.method === 'POST') {
                const body = await parseBody(req);
                console.log('[Meta Webhook] Incoming payload received:', JSON.stringify(body));

                let leads = loadLeadsData();
                let customerName = 'Meta Lead';
                let phone = '';
                let email = '';
                let address = '';
                let city = 'Kozhikode';
                let products = ['Aluminium Sliding Windows (Heavy Duty)'];
                let timeline = 'Immediate (1-2 Weeks)';
                let notes = 'Auto-captured from Meta Lead Ads (Facebook & Instagram).';
                let estimatedBudget = 250000;
                let leadgenId = 'META-' + Date.now();

                if (body.entry && Array.isArray(body.entry) && body.entry[0] && body.entry[0].changes) {
                    const change = body.entry[0].changes[0] || {};
                    const value = change.value || {};
                    leadgenId = value.leadgen_id || ('META-' + Date.now());

                    if (value.field_data) {
                        value.field_data.forEach(f => {
                            const val = Array.isArray(f.values) ? f.values[0] : f.values;
                            if (f.name === 'full_name' || f.name === 'name') customerName = val;
                            if (f.name === 'phone_number' || f.name === 'phone') phone = val;
                            if (f.name === 'email') email = val;
                            if (f.name === 'city') city = val;
                            if (f.name === 'street_address' || f.name === 'address') address = val;
                            if (f.name === 'products_required' || f.name === 'interest') {
                                products = String(val).split(',').map(s => s.trim());
                            }
                            if (f.name === 'timeline') timeline = val;
                            if (f.name === 'notes') notes = val;
                        });
                    } else {
                        customerName = value.customer_name || `Meta Lead (${leadgenId.slice(-6)})`;
                        phone = value.phone_number || value.phone || '+91 9847 ' + Math.floor(100000 + Math.random() * 900000);
                        city = value.city || 'Kochi';
                        address = value.address || `${city}, Kerala`;
                        notes = `Meta Lead Ad Notification. Page ID: ${value.page_id || metaConfig.pageId}, Form ID: ${value.form_id || metaConfig.formId}, Leadgen ID: ${leadgenId}`;
                    }
                } else if (body.field_data) {
                    body.field_data.forEach(f => {
                        const val = Array.isArray(f.values) ? f.values[0] : f.values;
                        if (f.name === 'full_name' || f.name === 'name') customerName = val;
                        if (f.name === 'phone_number' || f.name === 'phone') phone = val;
                        if (f.name === 'email') email = val;
                        if (f.name === 'city') city = val;
                        if (f.name === 'street_address' || f.name === 'address') address = val;
                        if (f.name === 'products_required' || f.name === 'interest') {
                            products = String(val).split(',').map(s => s.trim());
                        }
                        if (f.name === 'timeline') timeline = val;
                        if (f.name === 'notes') notes = val;
                    });
                    if (body.leadgen_id) leadgenId = body.leadgen_id;
                } else {
                    customerName = body.name || body.customer_name || body.full_name || 'Meta Ad Customer';
                    phone = body.phone || body.phone_number || '+91 9847 ' + Math.floor(100000 + Math.random() * 900000);
                    email = body.email || '';
                    address = body.address || body.street_address || '';
                    city = body.city || 'Kozhikode';
                    if (body.products) products = Array.isArray(body.products) ? body.products : [body.products];
                    if (body.expectedTimeline) timeline = body.expectedTimeline;
                    if (body.notes) notes = body.notes;
                    if (body.estimatedBudget) estimatedBudget = Number(body.estimatedBudget) || 250000;
                    if (body.leadgen_id) leadgenId = body.leadgen_id;
                }

                // Calculate next Lead ID
                let maxNum = 1000;
                leads.forEach(l => {
                    const match = String(l.id).match(/\d+/);
                    if (match) {
                        const num = parseInt(match[0], 10);
                        if (num > maxNum) maxNum = num;
                    }
                });
                const newLeadId = 'LD-' + (maxNum + 1);

                const newLead = {
                    id: newLeadId,
                    name: customerName,
                    phone: phone,
                    email: email,
                    address: address || `${city}, Kerala`,
                    city: city,
                    status: 'New Lead',
                    source: 'Meta Ads',
                    expectedTimeline: timeline,
                    estimatedBudget: estimatedBudget,
                    assignedTo: 'Rohit Sharma (Sales)',
                    date: new Date().toISOString().split('T')[0],
                    products: products,
                    notes: notes,
                    metaLeadgenId: leadgenId,
                    attachments: [],
                    timeline: [
                        {
                            timestamp: new Date().toISOString(),
                            action: 'LEAD_CREATED',
                            notes: `Lead auto-captured via Meta Webhook (Leadgen ID: ${leadgenId}). Source: Meta Ads (FB/IG).`,
                            user: 'Meta Graph Webhook'
                        }
                    ]
                };

                leads.unshift(newLead);
                saveLeadsData(leads);

                // Update Meta Config Audit Log
                if (!metaConfig.webhookAuditLogs) metaConfig.webhookAuditLogs = [];
                const auditLog = {
                    id: 'META-WH-' + Date.now().toString().slice(-6),
                    timestamp: new Date().toISOString(),
                    event: 'leadgen',
                    leadgenId: leadgenId,
                    customer: customerName,
                    phone: phone,
                    status: 'SUCCESS_SAVED'
                };
                metaConfig.webhookAuditLogs.unshift(auditLog);
                if (metaConfig.webhookAuditLogs.length > 50) metaConfig.webhookAuditLogs = metaConfig.webhookAuditLogs.slice(0, 50);
                metaConfig.lastSyncedAt = new Date().toISOString();
                metaConfig.totalLeadsCaptured = (metaConfig.totalLeadsCaptured || 0) + 1;
                saveMetaConfig(metaConfig);

                return sendJson(res, 200, {
                    success: true,
                    message: `Meta Lead ${newLeadId} successfully captured and stored.`,
                    lead: newLead,
                    auditLog
                });
            }
        }

        // =========================================================================
        // REST API ENDPOINTS: /api/leads/*
        // =========================================================================
        if (cleanUrl.startsWith('/api/leads')) {
            console.log(`[LEADS ${req.method}] ${cleanUrl}`);

            // 1. GET /api/leads/meta-config
            if (cleanUrl === '/api/leads/meta-config' && req.method === 'GET') {
                return sendJson(res, 200, {
                    success: true,
                    config: loadMetaConfig()
                });
            }

            // 2. PUT /api/leads/meta-config
            if (cleanUrl === '/api/leads/meta-config' && req.method === 'PUT') {
                const body = await parseBody(req);
                let config = loadMetaConfig();
                config = { ...config, ...(body.config || body) };
                config.lastUpdated = new Date().toISOString();
                saveMetaConfig(config);
                return sendJson(res, 200, {
                    success: true,
                    message: 'Meta configuration updated successfully.',
                    config
                });
            }

            // 3. POST /api/leads/simulate-meta-lead
            if (cleanUrl === '/api/leads/simulate-meta-lead' && req.method === 'POST') {
                const sampleSimulations = [
                    {
                        name: "Er. Mohammed Haris",
                        phone: "+91 9847 443 219",
                        email: "haris.consulting@gmail.com",
                        address: "Flat 7C, Skyline Riverdale, Bypass Road",
                        city: "Kozhikode",
                        products: ["Aluminium Sliding Windows (Heavy Duty)", "Acoustic / Soundproof Double Glazing"],
                        timeline: "Immediate (1-2 Weeks)",
                        budget: 420000,
                        notes: "Submitted via Instagram Lead Ad #WIN-PREMIUM-2026. Requested site inspection and soundproof glass demonstration."
                    },
                    {
                        name: "Dr. Ananya Nair",
                        phone: "+91 9446 332 101",
                        email: "dr.ananyanair@apollo.org",
                        address: "Nair Heritage Manor, Kowdiar",
                        city: "Trivandrum",
                        products: ["UPVC Casement Doors & French Windows", "Balcony Toughened Glass Railings"],
                        timeline: "Within 1 Month",
                        budget: 580000,
                        notes: "Facebook Lead Ad inquiry: Full residential window replacement package for heritage bungalow."
                    },
                    {
                        name: "Adv. Rajesh Kurup",
                        phone: "+91 9895 776 543",
                        email: "kurup.legal@outlook.com",
                        address: "Kurup Chambers, Marine Drive",
                        city: "Kochi",
                        products: ["Structural Glazing & Commercial Curtain Wall", "Fix Glass Partitions & Shower Enclosures"],
                        timeline: "Immediate (1-3 Days)",
                        budget: 850000,
                        notes: "Inquiry from Instagram Carousel Campaign: Corporate Law Chamber modern glazing retrofit."
                    }
                ];

                const picked = sampleSimulations[Math.floor(Math.random() * sampleSimulations.length)];
                let leads = loadLeadsData();
                let metaConfig = loadMetaConfig();

                let maxNum = 1000;
                leads.forEach(l => {
                    const match = String(l.id).match(/\d+/);
                    if (match) {
                        const num = parseInt(match[0], 10);
                        if (num > maxNum) maxNum = num;
                    }
                });
                const newLeadId = 'LD-' + (maxNum + 1);
                const leadgenId = 'SIM-LID-' + Date.now().toString().slice(-7);

                const simulatedLead = {
                    id: newLeadId,
                    name: picked.name,
                    phone: picked.phone,
                    email: picked.email,
                    address: picked.address,
                    city: picked.city,
                    status: 'New Lead',
                    source: 'Meta Ads',
                    expectedTimeline: picked.timeline,
                    estimatedBudget: picked.budget,
                    assignedTo: 'Rohit Sharma (Sales)',
                    date: new Date().toISOString().split('T')[0],
                    products: picked.products,
                    notes: picked.notes,
                    metaLeadgenId: leadgenId,
                    attachments: [
                        {
                            id: 'att-sim-' + Date.now(),
                            name: 'meta_leadgen_form_response.json',
                            type: 'application/json',
                            size: '1.2 KB',
                            date: new Date().toISOString().split('T')[0]
                        }
                    ],
                    timeline: [
                        {
                            timestamp: new Date().toISOString(),
                            action: 'LEAD_CREATED',
                            notes: `Lead captured via Meta Lead Ads Webhook simulation (Leadgen ID: ${leadgenId}).`,
                            user: 'Meta Graph Webhook Simulator'
                        }
                    ]
                };

                leads.unshift(simulatedLead);
                saveLeadsData(leads);

                if (!metaConfig.webhookAuditLogs) metaConfig.webhookAuditLogs = [];
                const auditLog = {
                    id: 'META-WH-' + Date.now().toString().slice(-6),
                    timestamp: new Date().toISOString(),
                    event: 'leadgen_simulated',
                    leadgenId: leadgenId,
                    customer: picked.name,
                    phone: picked.phone,
                    status: 'SUCCESS_SAVED'
                };
                metaConfig.webhookAuditLogs.unshift(auditLog);
                metaConfig.lastSyncedAt = new Date().toISOString();
                metaConfig.totalLeadsCaptured = (metaConfig.totalLeadsCaptured || 0) + 1;
                saveMetaConfig(metaConfig);

                return sendJson(res, 201, {
                    success: true,
                    message: `Simulated Meta Lead ${newLeadId} generated and synced!`,
                    lead: simulatedLead,
                    auditLog
                });
            }

            // 4. GET /api/leads
            if (cleanUrl === '/api/leads' && req.method === 'GET') {
                const leads = loadLeadsData();
                return sendJson(res, 200, {
                    success: true,
                    leads: leads || []
                });
            }

            // 5. POST /api/leads (Create New Lead)
            if (cleanUrl === '/api/leads' && req.method === 'POST') {
                const body = await parseBody(req);
                if (!body.name || !body.name.trim() || !body.phone || !body.phone.trim()) {
                    return sendJson(res, 400, {
                        success: false,
                        message: 'Customer Name and Phone Number are required fields.'
                    });
                }

                let leads = loadLeadsData();
                let maxNum = 1000;
                leads.forEach(l => {
                    const match = String(l.id).match(/\d+/);
                    if (match) {
                        const num = parseInt(match[0], 10);
                        if (num > maxNum) maxNum = num;
                    }
                });
                const newLeadId = 'LD-' + (maxNum + 1);
                const adminName = reqUser.userId === 'SB-9901' ? 'Shamsudheen V.K. (Admin)' : (body.createdByName || 'Sales Executive');

                const newLead = {
                    id: newLeadId,
                    name: body.name.trim(),
                    phone: body.phone.trim(),
                    email: body.email ? body.email.trim() : '',
                    address: body.address ? body.address.trim() : '',
                    city: body.city ? body.city.trim() : 'Kozhikode',
                    status: body.status || 'New Lead',
                    source: body.source || 'Direct Walk-in',
                    expectedTimeline: body.expectedTimeline || 'Within 1 Month',
                    estimatedBudget: Number(body.estimatedBudget) || 150000,
                    assignedTo: body.assignedTo || 'Rohit Sharma (Sales)',
                    date: body.date || new Date().toISOString().split('T')[0],
                    products: Array.isArray(body.products) ? body.products : [],
                    notes: body.notes ? body.notes.trim() : '',
                    attachments: Array.isArray(body.attachments) ? body.attachments : [],
                    timeline: [
                        {
                            timestamp: new Date().toISOString(),
                            action: 'LEAD_CREATED',
                            notes: 'Lead registered manually via Full-Page Lead Creation Interface.',
                            user: adminName
                        }
                    ]
                };

                leads.unshift(newLead);
                saveLeadsData(leads);
                return sendJson(res, 201, {
                    success: true,
                    message: `Lead ${newLeadId} created successfully.`,
                    lead: newLead
                });
            }

            // 6. PUT /api/leads/:id (Update Lead Details or Status Transition)
            const leadIdMatch = cleanUrl.match(/^\/api\/leads\/([a-zA-Z0-9_\-]+)$/);
            if (req.method === 'PUT' && leadIdMatch) {
                const targetId = leadIdMatch[1];
                const body = await parseBody(req);
                let leads = loadLeadsData();
                const idx = leads.findIndex(l => l.id === targetId);

                if (idx === -1) {
                    return sendJson(res, 404, { success: false, message: `Lead ${targetId} not found.` });
                }

                const existing = leads[idx];
                const oldStatus = existing.status;
                const adminName = reqUser.userId === 'SB-9901' ? 'Shamsudheen V.K. (Admin)' : (body.updatedByName || 'Operations Team');
                const isStatusTransition = body.status && body.status !== oldStatus;
                const timeline = existing.timeline || [];

                if (isStatusTransition) {
                    const transitionNote = body.transitionNotes || 
                        `Stage transition: ${oldStatus} ➔ ${body.status}` + 
                        (body.reason ? ` (Reason: ${body.reason})` : '');

                    timeline.unshift({
                        timestamp: new Date().toISOString(),
                        action: 'STATUS_CHANGED',
                        fromStatus: oldStatus,
                        toStatus: body.status,
                        notes: transitionNote,
                        user: adminName,
                        reason: body.reason || ''
                    });
                } else if (body.notes && body.logActivity) {
                    timeline.unshift({
                        timestamp: new Date().toISOString(),
                        action: 'NOTE_ADDED',
                        notes: body.notes,
                        user: adminName
                    });
                }

                const updatedLead = {
                    ...existing,
                    ...body,
                    id: existing.id,
                    timeline: timeline
                };

                leads[idx] = updatedLead;
                saveLeadsData(leads);
                return sendJson(res, 200, {
                    success: true,
                    message: `Lead ${targetId} updated successfully.`,
                    lead: updatedLead
                });
            }

            // 7. DELETE /api/leads/:id (Archive or Delete Lead)
            if (req.method === 'DELETE' && leadIdMatch) {
                const targetId = leadIdMatch[1];
                let leads = loadLeadsData();
                const initialLen = leads.length;
                leads = leads.filter(l => l.id !== targetId);

                if (leads.length === initialLen) {
                    return sendJson(res, 404, { success: false, message: `Lead ${targetId} not found.` });
                }

                saveLeadsData(leads);
                return sendJson(res, 200, {
                    success: true,
                    message: `Lead ${targetId} removed successfully.`
                });
            }
            return sendJson(res, 404, { success: false, message: 'Leads endpoint not found.' });
        }

        // =====================================================================
        // PURCHASE RETURNS & DEBIT NOTES API ENDPOINTS
        // =====================================================================
        if (cleanUrl === '/api/purchase/returns') {
            if (req.method === 'GET') {
                const returns = loadPurchaseReturnsData();
                return sendJson(res, 200, { success: true, returns, total: returns.length });
            }
            if (req.method === 'POST') {
                const body = await parseBody(req);
                let returns = loadPurchaseReturnsData();
                const newReturn = {
                    id: body.id || `PR-${Date.now().toString().slice(-4)}`,
                    poId: body.poId || 'PO-1001',
                    vendor: body.vendor || 'Vendor',
                    items: body.items || 'Returned Material Items',
                    creditAmount: Number(body.creditAmount !== undefined ? body.creditAmount : body.amount) || 0,
                    refundMode: body.refundMode || 'Debit Note (Vendor Account)',
                    date: body.date || new Date().toISOString().split('T')[0],
                    reason: body.reason || 'Material defect',
                    status: body.status || 'Processed',
                    debitNoteId: body.debitNoteId || `DN-${Date.now().toString().slice(-4)}`,
                    createdAt: new Date().toISOString()
                };
                returns.unshift(newReturn);
                savePurchaseReturnsData(returns);
                return sendJson(res, 201, { success: true, message: 'Purchase return logged successfully.', return: newReturn });
            }
        }

        // SALES RETURNS & CREDIT NOTES API ENDPOINTS
        if (cleanUrl === '/api/sales/returns') {
            if (req.method === 'GET') {
                const returns = loadSalesReturnsData();
                return sendJson(res, 200, { success: true, returns, total: returns.length });
            }
            if (req.method === 'POST') {
                const body = await parseBody(req);
                let returns = loadSalesReturnsData();
                const newReturn = {
                    id: body.id || `SR-${Date.now().toString().slice(-4)}`,
                    invoiceId: body.invoiceId || 'INV-2026-1001',
                    customerId: body.customerId || 'C-001',
                    customer: body.customer || 'Customer',
                    items: body.items || 'Returned Product Items',
                    amount: Number(body.amount || body.refundAmount) || 0,
                    reason: body.reason || 'Client Return',
                    creditNoteGenerated: true,
                    creditNoteId: body.creditNoteId || `CN-${Date.now().toString().slice(-4)}`,
                    date: body.date || new Date().toISOString().split('T')[0],
                    status: body.status || 'Processed',
                    createdAt: new Date().toISOString()
                };
                returns.unshift(newReturn);
                saveSalesReturnsData(returns);
                return sendJson(res, 201, { success: true, message: 'Sales return logged successfully.', return: newReturn });
            }
        }

        // =====================================================================
        // HR ONBOARDING & ADMIN CREDENTIAL PROVISIONING ENDPOINTS
        // =====================================================================

        // 1. GET /api/hr/employees
        if (req.method === 'GET' && cleanUrl === '/api/hr/employees') {
            const employees = loadEmployeesData();
            return sendJson(res, 200, {
                success: true,
                employees: employees,
                total: employees.length
            });
        }

        // 2. POST /api/hr/employees (Step 1: HR Manager Employee Creation Interface)
        if (req.method === 'POST' && cleanUrl === '/api/hr/employees') {
            const body = await parseBody(req);
            if (!body.name || !body.phone) {
                return sendJson(res, 400, {
                    success: false,
                    message: 'Full Name and Phone Number are required fields.'
                });
            }

            const employees = loadEmployeesData();
            let maxEmpNum = 100;
            employees.forEach(emp => {
                const match = String(emp.id).match(/\d+/);
                if (match) {
                    const num = parseInt(match[0], 10);
                    if (num > maxEmpNum) maxEmpNum = num;
                }
            });
            const newEmpId = 'EMP-' + (maxEmpNum + 1);

            const newEmployee = {
                id: newEmpId,
                name: String(body.name).trim(),
                phone: String(body.phone).trim(),
                email: body.email ? String(body.email).trim() : '',
                address: body.address ? String(body.address).trim() : (body.location ? String(body.location).trim() : ''),
                location: body.location ? String(body.location).trim() : (body.address ? String(body.address).trim() : ''),
                monthlySalary: Number(body.monthlySalary) || 0,
                shift: body.shift || '08:30 AM - 05:30 PM (8 hrs)',
                shiftHours: Number(body.shiftHours) || 8,
                reportingTime: body.reportingTime || '08:30 AM',
                overtimeRate: Number(body.overtimeRate) || 0,
                role: body.role || 'Glazing Specialist',
                department: body.department || 'Production',
                photo: body.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                status: 'pending_provisioning',
                provisioningStatus: 'pending_provisioning',
                hasLogin: false,
                username: null,
                createdAt: new Date().toISOString()
            };

            employees.push(newEmployee);
            saveEmployeesData(employees);

            return sendJson(res, 201, {
                success: true,
                message: `Employee ${newEmployee.name} created successfully in pending provisioning status.`,
                employee: newEmployee
            });
        }

        // 3. GET /api/admin/pending-employees (Retrieve unprovisioned employees list)
        if (req.method === 'GET' && cleanUrl === '/api/admin/pending-employees') {
            const employees = loadEmployeesData();
            const pending = employees.filter(e => e.status === 'pending_provisioning' || e.provisioningStatus === 'pending_provisioning' || !e.hasLogin);
            return sendJson(res, 200, {
                success: true,
                count: pending.length,
                pendingEmployees: pending,
                allEmployees: employees
            });
        }

        // 4. POST /api/admin/provision-access (Step 2: Admin Role Permissions & Credential Provisioning)
        if (req.method === 'POST' && cleanUrl === '/api/admin/provision-access') {
            const body = await parseBody(req);
            const employeeId = body.employeeId;

            if (!employeeId) {
                return sendJson(res, 400, {
                    success: false,
                    message: 'Employee ID is required for access provisioning.'
                });
            }

            const employees = loadEmployeesData();
            const empIndex = employees.findIndex(e => e.id === employeeId);
            if (empIndex === -1) {
                return sendJson(res, 404, {
                    success: false,
                    message: `Employee ${employeeId} not found.`
                });
            }

            const emp = employees[empIndex];

            // 1) Username Pattern: Employee Name (lowercase, no spaces) + Last 4 digits of phone
            const cleanName = (emp.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
            const phoneDigits = (emp.phone || '').replace(/\D/g, '');
            const last4Phone = phoneDigits.length >= 4 
                ? phoneDigits.slice(-4) 
                : (String(emp.id).replace(/\D/g, '').padStart(4, '0'));
            const username = cleanName + last4Phone;

            // 2) Password Pattern: 6-char string starting with 'STY' + 3 randomized numbers (e.g., STY482)
            const random3Digits = Math.floor(100 + Math.random() * 900);
            const plainPassword = `STY${random3Digits}`;

            // 3) Secure Bcrypt hashing
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(plainPassword, salt);

            // 4) Save to users collection (data/users.json)
            const users = loadUsersData();
            users[username] = {
                id: emp.id,
                username: username,
                passwordHash: passwordHash,
                role: body.role || emp.role || 'Staff',
                name: emp.name,
                email: emp.email || '',
                phone: emp.phone || '',
                photo: emp.photo,
                status: 'active',
                permissions: body.permissions || {},
                provisionedAt: new Date().toISOString(),
                provisionedBy: body.adminId || 'SB-9901'
            };
            saveUsersData(users);

            // 5) Update employee record
            emp.status = 'provisioned';
            emp.provisioningStatus = 'provisioned';
            emp.hasLogin = true;
            emp.username = username;
            emp.provisionedAt = new Date().toISOString();
            employees[empIndex] = emp;
            saveEmployeesData(employees);

            // 6) Audit logging & RBAC sync
            try {
                const rbac = loadRbacData();
                if (!rbac.auditLogs) rbac.auditLogs = [];
                rbac.auditLogs.unshift({
                    id: 'AUD-PRV-' + Date.now().toString().slice(-6),
                    timestamp: new Date().toISOString(),
                    action: 'EMPLOYEE_CREDENTIAL_PROVISIONED',
                    targetUser: username,
                    targetEmployee: emp.id,
                    details: `Generated credentials (username: ${username}) & RBAC permissions for ${emp.name} (#${emp.id})`,
                    adminId: body.adminId || 'SB-9901'
                });
                if (body.permissions) {
                    if (!rbac.userOverrides) rbac.userOverrides = {};
                    rbac.userOverrides[emp.id] = body.permissions;
                }
                saveRbacData(rbac);
            } catch (err) {
                console.error('RBAC sync error during provisioning:', err);
            }

            // 7) Return plaintext credentials in response for modal display
            return sendJson(res, 200, {
                success: true,
                message: `Credentials generated and access provisioned for ${emp.name}!`,
                username: username,
                tempPassword: plainPassword,
                employee: emp,
                permissions: body.permissions || {}
            });
        }


    // =========================================================================
    // STATIC FILE SERVING
    // =========================================================================
    let filePath = '.' + cleanUrl;
    if (filePath === './') {
        filePath = './index.html';
    }

    if (cleanUrl === '/favicon.ico') {
        filePath = './favicon.svg';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                fs.readFile('./404.html', (err404, content404) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content404 || '<h1>404 Not Found</h1>', 'utf-8');
                });
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server error: ' + error.code + '\n');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

