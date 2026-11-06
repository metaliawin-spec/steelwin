export const DEFAULT_RBAC_CONFIG = {
    roles: [
        { id: 'admin', code: 'admin', name: 'Super Administrator', department: 'Executive Management', badgeColor: '#38bdf8', description: 'Full administrative visibility, business turnover, production pipeline, inventory, HR, audit logs, and configurations.' },
        { id: 'accounts', code: 'accounts', name: 'Accounts Executive', department: 'Finance & Billing', badgeColor: '#34d399', description: 'Financial & billing focus: payments received/pending, receivables & payables, purchase bills, cash flow, ledgers, and tax/GST summaries.' },
        { id: 'sales', code: 'sales', name: 'Sales Executive', department: 'Sales & CRM', badgeColor: '#fbbf24', description: 'Sales pipeline focus: active leads, assigned site visits, quotations pipeline, conversion rates, and order tracking.' },
        { id: 'production', code: 'production', name: 'Production & Staff Lead', department: 'Operations & Fabrication', badgeColor: '#a78bfa', description: 'Operations focus: assigned jobs, fabrication tasks, cutting & measurement sheets, production stages, and delivery schedules.' }
    ],
    modules: [
        { id: 'dashboard', name: 'Dashboard', category: 'Core', icon: 'layout-dashboard' },
        { id: 'customers', name: 'Customers', category: 'Commercial', icon: 'user-check' },
        { id: 'leads', name: 'Leads & CRM', category: 'Commercial', icon: 'users' },
        { id: 'calculation', name: 'Calculation', category: 'Operations', icon: 'calculator' },
        { id: 'quotations', name: 'Quotations', category: 'Commercial', icon: 'file-text' },
        { id: 'orders', name: 'Orders', category: 'Commercial', icon: 'clipboard-list' },
        { id: 'bom', name: 'BOM (Bill of Materials)', category: 'Operations', icon: 'layers' },
        { id: 'sales', name: 'Sales & Invoices', category: 'Finance', icon: 'shopping-cart' },
        { id: 'sales_return', name: 'Sales Return', category: 'Finance', icon: 'rotate-ccw' },
        { id: 'purchase', name: 'Purchase & Expense', category: 'Finance', icon: 'shopping-bag' },
        { id: 'purchase_return', name: 'Purchase Return', category: 'Finance', icon: 'rotate-ccw' },
        { id: 'payments', name: 'Payments', category: 'Finance', icon: 'credit-card' },
        { id: 'stock_manager', name: 'Inventory', category: 'Operations', icon: 'package' },
        { id: 'production', name: 'Production', category: 'Operations', icon: 'hammer' },
        { id: 'site_visit', name: 'Site Visit', category: 'Operations', icon: 'map-pin' },
        { id: 'service_visit', name: 'Service Visit', category: 'Operations', icon: 'wrench' },
        { id: 'hr', name: 'HR & Team', category: 'Operations', icon: 'users' },
        { id: 'reports', name: 'Statements & Reports', category: 'Finance', icon: 'bar-chart-2' },
        { id: 'settings', name: 'Settings', category: 'System', icon: 'settings' },
        { id: 'accounts_config', name: 'Accounts Config', category: 'System', icon: 'sliders' }
    ],
    permissions: {
        admin: {
            dashboard: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            customers: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            leads: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            calculation: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            quotations: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            orders: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            bom: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            site_visit: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            service_visit: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            sales: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            sales_return: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            purchase: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            purchase_return: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            payments: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            stock_manager: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            production: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            hr: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            reports: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            settings: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' },
            accounts_config: { view: true, create: true, read: true, update: true, delete: true, scope: 'all' }
        },
        accounts: {
            dashboard: { view: true, create: false, read: true, update: false, delete: false, scope: 'department' },
            customers: { view: true, create: false, read: true, update: false, delete: false, scope: 'all' },
            leads: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            calculation: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            quotations: { view: true, create: false, read: true, update: false, delete: false, scope: 'all' },
            orders: { view: true, create: false, read: true, update: false, delete: false, scope: 'all' },
            bom: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            site_visit: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            service_visit: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            sales: { view: true, create: true, read: true, update: true, delete: false, scope: 'all' },
            sales_return: { view: true, create: true, read: true, update: true, delete: false, scope: 'all' },
            purchase: { view: true, create: true, read: true, update: true, delete: false, scope: 'all' },
            purchase_return: { view: true, create: true, read: true, update: true, delete: false, scope: 'all' },
            payments: { view: true, create: true, read: true, update: true, delete: false, scope: 'all' },
            stock_manager: { view: true, create: false, read: true, update: false, delete: false, scope: 'all' },
            production: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            hr: { view: true, create: false, read: true, update: false, delete: false, scope: 'own' },
            reports: { view: true, create: true, read: true, update: false, delete: false, scope: 'all' },
            settings: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            accounts_config: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' }
        },
        sales: {
            dashboard: { view: true, create: false, read: true, update: false, delete: false, scope: 'department' },
            customers: { view: true, create: true, read: true, update: true, delete: false, scope: 'all' },
            leads: { view: true, create: true, read: true, update: true, delete: false, scope: 'all' },
            calculation: { view: true, create: true, read: true, update: true, delete: false, scope: 'own' },
            quotations: { view: true, create: true, read: true, update: true, delete: false, scope: 'all' },
            orders: { view: true, create: true, read: true, update: true, delete: false, scope: 'all' },
            bom: { view: true, create: false, read: true, update: false, delete: false, scope: 'own' },
            site_visit: { view: true, create: true, read: true, update: true, delete: false, scope: 'all' },
            service_visit: { view: true, create: false, read: true, update: true, delete: false, scope: 'department' },
            sales: { view: true, create: false, read: true, update: false, delete: false, scope: 'department' },
            sales_return: { view: true, create: true, read: true, update: false, delete: false, scope: 'department' },
            purchase: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            purchase_return: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            payments: { view: true, create: false, read: true, update: false, delete: false, scope: 'own' },
            stock_manager: { view: true, create: false, read: true, update: false, delete: false, scope: 'all' },
            production: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            hr: { view: true, create: false, read: true, update: false, delete: false, scope: 'own' },
            reports: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            settings: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            accounts_config: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' }
        },
        production: {
            dashboard: { view: true, create: false, read: true, update: false, delete: false, scope: 'department' },
            customers: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            leads: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            calculation: { view: true, create: false, read: true, update: false, delete: false, scope: 'all' },
            quotations: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            orders: { view: true, create: false, read: true, update: true, delete: false, scope: 'all' },
            bom: { view: true, create: false, read: true, update: false, delete: false, scope: 'all' },
            site_visit: { view: true, create: false, read: true, update: true, delete: false, scope: 'own' },
            service_visit: { view: true, create: false, read: true, update: true, delete: false, scope: 'own' },
            sales: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            sales_return: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            purchase: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            purchase_return: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            payments: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            stock_manager: { view: true, create: false, read: true, update: false, delete: false, scope: 'all' },
            production: { view: true, create: false, read: true, update: true, delete: false, scope: 'all' },
            hr: { view: true, create: false, read: true, update: false, delete: false, scope: 'own' },
            reports: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            settings: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' },
            accounts_config: { view: false, create: false, read: false, update: false, delete: false, scope: 'none' }
        }
    },
    userOverrides: {}
};

export const DEFAULT_ACCOUNTS_CONFIGURATIONS = {
    dashboard: {
        id: 'dashboard',
        name: 'Dashboard & Executive Analytics',
        category: 'Core',
        icon: 'layout-dashboard',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'System overview, smart geographic sales corridor map, real-time metrics & delivery pipeline',
        general: {
            autoRefreshSeconds: 30,
            defaultMapView: 'smart_kerala',
            showRevenueMetrics: true,
            showLowStockScroller: true,
            showSiteServiceWidget: true,
            nationalOverviewEnabled: true
        },
        fieldRules: {
            highlightThresholdSales: 50000,
            pinPulseAnimation: true,
            defaultCurrency: '₹'
        },
        permissions: {
            minRoleRequired: 'Admin',
            allowExportReports: true,
            viewModeRestricted: false
        }
    },
    customers: {
        id: 'customers',
        name: 'Customer Relationship & Profiles',
        category: 'Commercial',
        icon: 'user-check',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'Client master directory, credit limits, GST validation, and ledger associations',
        general: {
            codePrefix: 'CUST-',
            startingSequence: 1001,
            defaultPaymentTerms: 'Net 30 Days',
            defaultCreditLimit: 100000,
            autoCreateLeadOnInquiry: false
        },
        fieldRules: {
            mandatoryPhone: true,
            mandatoryAddress: true,
            mandatoryGSTINForB2B: true,
            allowDuplicateNames: false,
            autoFormatPhone: true
        },
        permissions: {
            minRoleRequired: 'Sales',
            allowDeleteCustomer: false,
            restrictCreditLimitEdit: true
        }
    },
    calculation: {
        id: 'calculation',
        name: 'Window & Door Dimension Calculator',
        category: 'Operations',
        icon: 'calculator',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'Multi-pane window & door formulas, material cut-lists, weight factors, and hardware pricing',
        general: {
            defaultProfileGrade: 'Tata Steel MS 16G',
            standardWastageAllowancePercent: 5.0,
            standardMarkupMarginPercent: 25.0,
            minimumGrossMarginPercent: 18.0,
            measurementUnit: 'cm',
            fractionalPrecision: 2
        },
        fieldRules: {
            autoIncludeRubberGasket: true,
            defaultLockType: 'lock_multipoint',
            defaultHingeType: 'hinge_friction_12in',
            enforceMinDimensions: true,
            minWidthCm: 45,
            minHeightCm: 45
        },
        permissions: {
            minRoleRequired: 'Designer',
            allowCustomHardwareRates: false,
            lockFormulaModifications: true
        }
    },
    quotations: {
        id: 'quotations',
        name: 'Quotations & Commercial Proposals',
        category: 'Commercial',
        icon: 'file-text',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'Multi-item estimate builder, GST calculation, formal PDF quotation engine, and discounts',
        general: {
            quotePrefix: 'QT-2025-',
            startingSequence: 201,
            validityDurationDays: 15,
            defaultTaxRatePercent: 18.0,
            taxLabel: 'GST 18% (CGST 9% + SGST 9%)',
            discountCeilingPercent: 10.0
        },
        fieldRules: {
            autoCalculateInstallationCost: true,
            installationRatePerSqFt: 35,
            showMaterialBreakdownToClient: true,
            termsAndConditionsTemplate: '1. 50% Advance with Purchase Order. 2. Balance before dispatch. 3. Delivery within 14 working days.',
            footerSignatoryName: 'Shamsudheen V.K. (Managing Director)'
        },
        permissions: {
            minRoleRequired: 'Sales',
            requireSupervisorDiscountApproval: true,
            allowPriceOverride: false
        }
    },
    leads: {
        id: 'leads',
        name: 'Leads & Inquiries CRM',
        category: 'Commercial',
        icon: 'users',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'Sales lead capture, status pipelines, priority tags, and automated follow-up reminders',
        general: {
            leadPrefix: 'LD-',
            startingSequence: 501,
            defaultSource: 'Direct / Walk-In',
            followUpReminderDays: 3,
            autoAssignRepresentative: true
        },
        fieldRules: {
            mandatoryRequirementNotes: true,
            defaultPriority: 'Warm',
            stages: 'New, Contacted, Site Survey Scheduled, Quote Sent, Won, Lost'
        },
        permissions: {
            minRoleRequired: 'Sales',
            allowDirectLeadDeletion: false,
            restrictReassignment: true
        }
    },
    site_visit: {
        id: 'site_visit',
        name: 'Site Visits & Field Surveys',
        category: 'Operations',
        icon: 'map-pin',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'On-site measurement bookings, GPS coordinates, supervisor site photo uploads & checklists',
        general: {
            visitPrefix: 'SV-',
            startingSequence: 101,
            gpsRadiusMeters: 500,
            requireSurveyPhotos: true,
            defaultSurveyTechnician: 'Harish Menon'
        },
        fieldRules: {
            mandatoryCivilOpeningCheck: true,
            mandatoryLintelClearanceCheck: true,
            autoSyncDimensionsToCalc: true
        },
        permissions: {
            minRoleRequired: 'Supervisor',
            allowSurveyReschedule: true,
            lockCompletedSurvey: true
        }
    },
    service_visit: {
        id: 'service_visit',
        name: 'Service Visits & Warranty Support',
        category: 'Operations',
        icon: 'wrench',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'Post-installation maintenance, glass replacement, alignment check, warranty claims',
        general: {
            servicePrefix: 'SRV-',
            startingSequence: 101,
            standardWarrantyMonths: 12,
            standardServiceFee: 750,
            requireClientSignature: true
        },
        fieldRules: {
            autoCheckWarrantyExpiry: true,
            mandatoryFaultCategory: true,
            includeHardwareReplacement: true
        },
        permissions: {
            minRoleRequired: 'Supervisor',
            allowWarrantyWaiver: false,
            requireBillingReceipt: true
        }
    },
    sales: {
        id: 'sales',
        name: 'Sales & Invoices Engine',
        category: 'Financial',
        icon: 'shopping-cart',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'Tax invoices, ledger accounting debit/credit, due dates, advance reconciliation, and payment terms',
        general: {
            invoicePrefix: 'INV-2025-',
            startingSequence: 101,
            paymentDueBufferDays: 15,
            defaultPaymentMethod: 'Bank Transfer / NEFT',
            roundingRule: 'Nearest Rupee',
            autoGenerateEInvoice: true
        },
        fieldRules: {
            mandatoryBillToAddress: true,
            mandatoryPlaceOfSupply: true,
            autoReconcileCustomerAdvance: true,
            lockInvoiceAfterPayment: true
        },
        permissions: {
            minRoleRequired: 'Accounts',
            allowInvoiceCancellation: false,
            allowManualTaxAdjustment: false
        }
    },
    purchase: {
        id: 'purchase',
        name: 'Purchase Orders & Raw Material Procurement',
        category: 'Financial',
        icon: 'shopping-bag',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'Steel coil, glass sheets, hardware orders, supplier purchase bills, and vendor approval',
        general: {
            poPrefix: 'PO-2025-',
            startingSequence: 301,
            defaultDeliveryBufferDays: 7,
            minOrderValueWarning: 5000,
            autoUpdateStockOnGRN: true
        },
        fieldRules: {
            requireVendorApproval: true,
            mandatorySupplierInvoiceNumber: true,
            autoCalculateTDS: false,
            defaultPaymentTerms: 'Net 45 Days'
        },
        permissions: {
            minRoleRequired: 'Accounts',
            requireSupervisorSignoff: true,
            restrictVendorCreation: false
        }
    },
    payments: {
        id: 'payments',
        name: 'Payments & Treasury Reconciliation',
        category: 'Financial',
        icon: 'credit-card',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'Customer receipts, supplier payouts, advance credits, UPI / Bank reconciliation, and petty cash',
        general: {
            paymentPrefix: 'PAY-',
            startingSequence: 701,
            defaultDepositAccount: 'HDFC Bank Industrial A/c (Current)',
            allowPartialPayments: true,
            autoNotifyCustomerReceipt: true
        },
        fieldRules: {
            mandatoryBankReferenceNumber: true,
            autoAllocateToOldestInvoice: true,
            allowCashReceiptsOverLimit: false,
            maxCashReceiptLimit: 50000
        },
        permissions: {
            minRoleRequired: 'Accounts',
            allowPaymentDeletion: false,
            requireDoubleEntryAudit: true
        }
    },
    stock_manager: {
        id: 'stock_manager',
        name: 'Inventory & Material Stock Management',
        category: 'Operations',
        icon: 'package',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'Raw materials, locks, hinges, rubber gaskets, minimum stock threshold alerts, and valuation',
        general: {
            valuationMethod: 'FIFO (First-In First-Out)',
            reorderAlertThreshold: 10,
            preventNegativeStockTransactions: true,
            autoDeductStockOnFabrication: true
        },
        fieldRules: {
            mandatoryRackBinLocation: true,
            mandatoryBatchTracking: false,
            autoAlertSupplierOnLowStock: true
        },
        permissions: {
            minRoleRequired: 'Supervisor',
            allowDirectStockAdjustment: false,
            requireStockAuditReason: true
        }
    },
    production: {
        id: 'production',
        name: 'Production Floor & Manufacturing Workflow',
        category: 'Operations',
        icon: 'hammer',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: '6-stage fabrication lifecycle, cutting, welding, powder coating oven, QC testing, and dispatch',
        general: {
            orderPrefix: 'ORD-',
            startingSequence: 4401,
            stages: 'Order Placed, 3D CAD Drawing, Channel Cutting, Fabrication & Welding, Painting & Powder Coat, Quality Check & Fitting, Delivered',
            mandatoryQCChecklist: true,
            autoNotifyCustomerOnStageAdvance: true
        },
        fieldRules: {
            requireDrawingApprovalBeforeCutting: true,
            logTechnicianPerWorkstation: true,
            trackPowderCoatingOvenTemperature: true
        },
        permissions: {
            minRoleRequired: 'Production',
            allowStageBypass: false,
            lockCompletedOrders: true
        }
    },
    hr: {
        id: 'hr',
        name: 'HR, Attendance & Overtime (OT) Engine',
        category: 'HR',
        icon: 'users',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'Biometric & face check-in, late arrival detection, shift rules, overtime rate calculation, and payroll',
        general: {
            standardShiftHours: 8,
            standardReportingTime: '08:30 AM',
            lateArrivalGracePeriodMinutes: 15,
            defaultOvertimeHourlyRate: 150,
            standardWorkingDaysPerMonth: 26,
            autoCheckoutHourPM: 7
        },
        fieldRules: {
            mandatoryFaceKioskScan: true,
            gpsGeofencingActive: true,
            autoCalculateOTOnCheckout: true,
            trackMonthlyLateArrivalsCount: true
        },
        permissions: {
            minRoleRequired: 'Admin',
            allowManualAttendanceOverride: true,
            lockHistoricMonthPayroll: true
        }
    },
    reports: {
        id: 'reports',
        name: 'Statements, Audits & Financial Reports',
        category: 'Financial',
        icon: 'bar-chart-2',
        status: 'Default',
        lastModified: null,
        modifiedBy: null,
        description: 'Profit & loss, stock valuation, GST summary ledger, pending deliveries, and custom analytics',
        general: {
            defaultDateFilterRange: 'This Month',
            defaultExportFormat: 'Excel / XLSX',
            includeCompanyLetterheadInPDF: true,
            financialYearStartingMonth: 'April (Indian FY)'
        },
        fieldRules: {
            displayTaxSummarySeparate: true,
            maskConfidentialPayrollNumbers: true,
            enableRealtimeGraphTrends: true
        },
        permissions: {
            minRoleRequired: 'Admin',
            allowRawDatabaseExport: false,
            restrictAccessToAccountsOnly: true
        }
    }
};

export const Store = {
    state: {
        currentView: 'dashboard',
        accountsConfigurations: null,
        configurationAuditLogs: [],
        user: { 
            id: 'SB-9901',
            name: (typeof localStorage !== 'undefined' && localStorage.getItem('sb_user_name')) || 'Shamsudheen V.K.', 
            phone: (typeof localStorage !== 'undefined' && localStorage.getItem('sb_user_phone')) || '+91 9846 123 456',
            location: (typeof localStorage !== 'undefined' && localStorage.getItem('sb_user_location')) || 'Kozhikode, Kerala',
            pincode: (typeof localStorage !== 'undefined' && localStorage.getItem('sb_user_pincode')) || '673638',
            email: 'admin@stellobuild.com',
            role: 'Super Administrator', 
            department: 'Executive Management & Global Supply Chain',
            status: 'Active',
            permissions: ['ALL_PERMISSIONS'],
            photo: (typeof localStorage !== 'undefined' && localStorage.getItem('gl_admin_avatar')) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' 
        },
        notifications: [
            { id: 1, type: 'critical', message: 'Old Stock Warning: 50 sheets > 180 days', title: 'Old Stock' },
            { id: 2, type: 'warning', message: 'Pipe 2x2 stock low', title: 'Low Stock' },
            { id: 3, type: 'info', message: 'Service due for Customer #442', title: 'Maintenance' }
        ],
        inventory: [
            { id: 'm1', name: 'Steel Sheet 16G', quantity: 45, unit: 'sheet', price: 1200, weight: 1.25, min: 50, category: 'Sheet' },
            { id: 'm2', name: 'Pipe 1x1 MS', quantity: 200, unit: 'length', price: 450, weight: 1.15, min: 100, category: 'Pipe' },
            { id: 'm3', name: 'Epoxy Black Paint', quantity: 20, unit: 'ltr', price: 350, weight: 0.5, min: 10, category: 'Paint' },
            { id: 'm4', name: 'Friction Stays 10" SS', quantity: 0, unit: 'pairs', price: 260, weight: 0.35, min: 25, category: 'Hardware' },
            { id: 'm5', name: 'Weather Sealant Silicone', quantity: 0, unit: 'tubes', price: 280, weight: 0.4, min: 30, category: 'Consumable' },
            { id: 'm6', name: 'EPDM Rubber Gasket 12mm', quantity: 18, unit: 'mtr', price: 45, weight: 0.2, min: 50, category: 'Gasket' },
            { id: 'm7', name: 'Multipoint Espag Locks', quantity: 3, unit: 'pcs', price: 450, weight: 0.65, min: 15, category: 'Hardware' },
            { id: 'm8', name: '5mm Clear Float Glass', quantity: 180, unit: 'sq.ft', price: 55, weight: 1.15, min: 80, category: 'Glass' }
        ],
        leads: [
            { id: 1, name: 'John Doe', phone: '555-0123', status: 'new', created: '2025-12-07' },
            { id: 2, name: 'Luxury Villa Project', phone: '555-0199', status: 'quoted', created: '2025-12-05' }
        ],
        quotations: [
            {
                id: 'Q-2025-001',
                customer: 'Arun Kumar',
                date: '2025-12-08',
                dueDate: '2025-12-15',
                amount: 45000,
                status: 'Draft',
                salesPerson: { name: 'Rohit Sharma', contact: '9876543210' },
                paymentTerms: '50% Advance, Balance before delivery.',
                validity: '30 Days',
                description: 'Fabrication and installation of steel windows for ground floor.',
                items: [
                    { name: 'Window W1', desc: 'Steel Window 4x4 with Grill', pieces: 4, rate: 8500, total: 34000 },
                    { name: 'Ventilator V1', desc: 'Top hung 2x2', pieces: 2, rate: 3500, total: 7000 },
                    { name: 'Fixing Charges', desc: 'Labor and welding consumables', pieces: 1, rate: 4000, total: 4000 }
                ]
            },
            {
                id: 'Q-2025-002',
                customer: 'Luxury Villa Project',
                date: '2025-12-07',
                dueDate: '2025-12-20',
                amount: 125000,
                status: 'Sent',
                salesPerson: { name: 'Anshid', contact: '9998887776' },
                paymentTerms: '30% Advance, 60% on progress, 10% on completion.',
                validity: '15 Days',
                description: 'Complete premium window package for 1st floor.',
                items: [
                    { name: 'French Window', desc: 'Double door opening 6x7', pieces: 5, rate: 25000, total: 125000 }
                ]
            }
        ],
        currentQuoteItems: [], // Items currently being designed/added
        quotationParams: {
            profitMargin: 20, // percentage
            overheadMargin: 10, // percentage
            wasteFactor: 5, // percentage
        },
        // Global Settings (Company & Preferences)
        settings: {
            company: {
                name: 'STYLO STEEL',
                address: 'STYLO TOWER\nKONDOTTY ROAD MUNDAKKULAM\nMalappuram, Kerala - 673638',
                phone: '8086888500',
                email: 'Buildstello@gmail.com',
                website: 'stylosteel.com',
                taxId: '895CFBPJ4043Q1ZE',
                pan: '895CFBPJ4043Q1ZE'
            },
            whatsapp: {
                allowStaffSharing: true,
                connected: true,
                phone: '+91 8086888500',
                senderName: 'STYLO STEEL'
            },
            preferences: {
                currency: '₹',
                theme: 'dark'
            },
            quotationDefaults: {
                prefix: 'QT-',
                nextSequence: 1001,
                numberFormat: '{PREFIX}{YYYY}-{SEQ}',
                paddingDigits: 4,
                validity: '30 Days',
                paymentTerms: '50% Advance, Balance before delivery.',
                footerText: 'Authorized Signatory',
                defaultDescription: 'Fabrication and installation of customized steel windows and architectural doors.',
                termsRows: [
                    'Rates are valid for 30 days from quotation date.',
                    '50% Advance with purchase order confirmation, balance before delivery.',
                    'Delivery timeline: 14 to 21 working days after site measurement sign-off.',
                    'Site installation and transport extra as quoted unless specifically included.',
                    'All structural steel products carry a 5-year anti-rust structural warranty.'
                ]
            },
            bank: {
                bankName: 'HDFC Bank',
                accountName: 'WINPRO Systems',
                accountNumber: '50200098765432',
                ifsc: 'HDFC0001234',
                branch: 'Kakkanad, Kochi'
            }
        },
        // Leo Live Voice AI Configuration
        leoVoiceSettings: {
            activeVoiceId: (typeof localStorage !== 'undefined' && localStorage.getItem('leo_active_voice')) || 'malavika-expressive',
            language: (typeof localStorage !== 'undefined' && localStorage.getItem('leo_language')) || 'en-IN',
            speechRate: Number((typeof localStorage !== 'undefined' && localStorage.getItem('leo_speech_rate')) || 1.0),
            speechPitch: Number((typeof localStorage !== 'undefined' && localStorage.getItem('leo_speech_pitch')) || 1.0),
            autoSpeak: (typeof localStorage !== 'undefined' && localStorage.getItem('leo_auto_speak') !== 'false'),
            speechVolume: 1.0
        },
        // Admin Configurable Calculation Settings
        calcSettings: {
            pipe: { name: 'Sq Pipe 1"x1" (1.2mm)', unit: 'mtr', rate: 85, weight: 1.15 },
            sheet: { name: 'MS Sheet 16G', unit: 'sq.ft', rate: 65, weight: 1.25 },
            hinge: { name: 'Steel Hinge 4"', unit: 'nos', rate: 25, weight: 0.12 },
            towerbolt: { name: 'Towerbolt 6"', unit: 'nos', rate: 45, weight: 0.18 },
            paint: { name: 'Epoxy Paint', unit: 'ltr', rate: 450, coverage: 12 }, // coverage in sq.m per ltr
            primer: { name: 'Metal Primer', unit: 'ltr', rate: 220, coverage: 14 },
            labor: { name: 'Fabrication Labor', unit: 'sq.ft', rate: 15 },
            consumables: { name: 'Welding Rod/Disc', unit: 'lot', rate: 150, weight: 0 },
            glass_single: { name: 'Single Glazing (5mm)', unit: 'sq.ft', rate: 45, weight: 1.1 },
            glass_double: { name: 'Double Glazing (18mm)', unit: 'sq.ft', rate: 120, weight: 2.2 },
            glass_laminated: { name: 'Laminated Glass', unit: 'sq.ft', rate: 150, weight: 2.5 },
            glass_tempered: { name: 'Tempered Glass', unit: 'sq.ft', rate: 90, weight: 1.1 },
            lock: { name: 'Window Lock', unit: 'nos', rate: 150, weight: 0.2 },
            handle: { name: 'Handle', unit: 'nos', rate: 80, weight: 0.1 },
        },
        // Dedicated Fabrication Costing & Engineering Calculation Parameters
        fabricationRates: {
            unitWeightRatioKgPerMeter: 2.9167, // Benchmark profile: 240mm sheet width yields approx 0.875 kg per 300mm length (0.875 / 0.3 = 2.9167 kg/m)
            profileKgRate: 180,               // Profile price per kg (₹180/kg default)
            pipeMeterRate: 95,                // Pipe price per meter (₹95/m default)
            grillPitchMm: 120,                // Grill pipe spacing interval (120mm -> 160cm yields 13 pipes)
            holePunchRate: 5,                 // Hole punching charge per hole (₹5/hole default)
            paintBaselineCost: 150,           // Paint baseline cost benchmarked at ₹150 for 50x140 cm (0.70 m²)
            paintBaselineAreaSqM: 0.70,       // 0.70 m² baseline
            unitHingeRate: 85,                // Hinges unit rate (₹85/pcs default)
            labourTiers: {
                baseAssembly: 150,            // Base single-panel assembly: ₹150
                shutterFabrication: 150,      // Opening shutter/panel additional fabrication: ₹150
                partitionCharge: 50,          // Partition insertion charge: ₹50 per partition
                cuttingHandlingSurcharge: 150 // Additional cutting and material handling surcharge: ₹150
            }
        },
        savedCalculations: [],
        // Configurable Labor Rates per Pane (Normal vs Partitioned)
        laborRates: {
            normalPaneRate: 500,
            partitionedPaneRate: 800
        },
        // Default Material Catalog Groups (user-customizable & dynamically expandable)
        materialGroups: ['Profile', 'Pipe', 'Panel', 'Hinges', 'Paint', 'Lock & Accessories', 'Hook & Rubber'],
        // Dedicated Material Catalog with Dynamic Pricing, Specifications and UoM selection
        materialCatalog: [
            // 1. Profile (Outer Frame Profiles)
            { id: 'prof_box', name: '5x3 Profile (Box Section)', category: 'Profile', unit: 'kg', rate: 180, thicknessMode: 'gauge', thicknessGauge: '16G', thicknessMm: 1.5, sideWidthMm: 50, centerWidthMm: 25, weight16G: 1.45, weight18G: 1.20, weightFactor: 1.45, description: '1.5mm MS Box Section Outer Profile' },
            { id: 'prof_4x2', name: '4x2 Profile (Box Section)', category: 'Profile', unit: 'kg', rate: 185, thicknessMode: 'gauge', thicknessGauge: '16G', thicknessMm: 1.5, sideWidthMm: 40, centerWidthMm: 25, weight16G: 1.30, weight18G: 1.08, weightFactor: 1.30, description: 'Standard 4x2 window outer profile' },
            { id: 'prof_5x25', name: '5x2.5 Profile (Rebated)', category: 'Profile', unit: 'kg', rate: 188, thicknessMode: 'gauge', thicknessGauge: '16G', thicknessMm: 1.5, sideWidthMm: 45, centerWidthMm: 25, weight16G: 1.40, weight18G: 1.15, weightFactor: 1.40, description: '5x2.5 rebated window frame profile' },
            { id: 'prof_4x25', name: '4x2.5 Profile (Rebated)', category: 'Profile', unit: 'kg', rate: 195, thicknessMode: 'gauge', thicknessGauge: '16G', thicknessMm: 1.5, sideWidthMm: 40, centerWidthMm: 25, weight16G: 1.35, weight18G: 1.10, weightFactor: 1.35, description: 'Standard 4x2.5 rebated window outer profile' },
            { id: 'prof_4x3', name: '4x3 Profile (Box Section)', category: 'Profile', unit: 'kg', rate: 190, thicknessMode: 'gauge', thicknessGauge: '16G', thicknessMm: 1.5, sideWidthMm: 48, centerWidthMm: 28, weight16G: 1.42, weight18G: 1.18, weightFactor: 1.42, description: '4x3 heavy section outer profile' },
            { id: 'prof_z_flange', name: 'Heavy Z-Section Flanged (60x30mm)', category: 'Profile', unit: 'kg', rate: 210, thicknessMode: 'gauge', thicknessGauge: '16G', thicknessMm: 1.5, sideWidthMm: 60, centerWidthMm: 30, weight16G: 1.85, weight18G: 1.50, weightFactor: 1.85, description: 'Flanged Weatherproof Profile with step' },
            { id: 'prof_step', name: 'Step Rebated Profile (65x35mm)', category: 'Profile', unit: 'kg', rate: 225, thicknessMode: 'gauge', thicknessGauge: '18G', thicknessMm: 1.2, sideWidthMm: 65, centerWidthMm: 35, weight16G: 2.10, weight18G: 1.75, weightFactor: 1.75, description: 'Dual rebate architectural frame profile' },
            
            // 2. Pipe (Inner Grid / Partitions / Grill - 20x20 Square Tube)
            { id: 'tube_sq_20x20', name: '20x20 Square Tube (1.2mm)', category: 'Pipe', unit: 'kg', rate: 95, pipeType: 'Square Pipe', thicknessGauge: '18G', thicknessMm: 1.2, widthMm: 20.0, weightPerLength: 0.95, weightFactor: 0.95, description: '20x20 mm MS Square Tube Window Grill Pipe' },
            { id: 'tube_sq_1x1', name: '1" x 1" MS Square Pipe (1.2mm)', category: 'Pipe', unit: 'kg', rate: 95, pipeType: 'Square Pipe', thicknessGauge: '18G', thicknessMm: 1.2, widthMm: 25.4, weightPerLength: 1.15, weightFactor: 1.15, description: 'Standard partition and sash frame pipe' },
            { id: 'tube_rect_15x1', name: '1.5" x 1" Rectangular Tube (1.4mm)', category: 'Pipe', unit: 'kg', rate: 105, pipeType: 'Rectangular Tube', thicknessGauge: '16G', thicknessMm: 1.5, widthMm: 38.1, weightPerLength: 1.55, weightFactor: 1.55, description: 'Heavy mullion & transom reinforcement' },
            { id: 'tube_sq_075', name: '0.75" x 0.75" Slim Pipe (1.0mm)', category: 'Pipe', unit: 'kg', rate: 90, pipeType: 'Square Pipe', thicknessGauge: '18G', thicknessMm: 1.0, widthMm: 19.0, weightPerLength: 0.85, weightFactor: 0.85, description: 'Decorative light inner grills' },
            
            // 3. Panel (Glass, Acrylic, ACP & Metal Sheets)
            { id: 'glass_5mm_clear', name: '5mm Clear Float Glass', category: 'Panel', unit: 'sq.ft', rate: 55, meterPrice: 330, standardLength: 6, panelType: 'Glass Panel', weightFactor: 1.15, description: 'Standard single glazing panel' },
            { id: 'glass_6mm_tough', name: '6mm Toughened Safety Glass', category: 'Panel', unit: 'sq.ft', rate: 95, meterPrice: 570, standardLength: 6, panelType: 'Toughened Glass', weightFactor: 1.40, description: 'Impact resistant tempered glass' },
            { id: 'panel_acp_4mm', name: '4mm ACP Solid Metal Panel', category: 'Panel', unit: 'sq.ft', rate: 85, meterPrice: 510, standardLength: 6, panelType: 'ACP Sheet', weightFactor: 1.10, description: 'Aluminum composite infill sheet' },
            
            // 4. Hinges
            { id: 'hinge_ss_4in', name: 'Heavy Duty SS Butt Hinge 4"', category: 'Hinges', unit: 'pcs', rate: 85, hingeType: 'SS Butt Hinge', weightFactor: 0.18, description: 'Stainless steel ball bearing hinge' },
            { id: 'hinge_friction_10', name: 'Friction Stay 10" Casement', category: 'Hinges', unit: 'pcs', rate: 260, hingeType: 'Friction Stay', weightFactor: 0.35, description: 'Concealed side/top hung friction arms' },
            { id: 'hinge_steel_4in', name: 'Standard Steel Hinge 4"', category: 'Hinges', unit: 'pcs', rate: 35, hingeType: 'Steel Hinge', weightFactor: 0.15, description: 'Economical mild steel butt hinge' },
            
            // 5. Paint
            { id: 'paint_epoxy_black', name: 'Epoxy Powder Coating (Matte Black)', category: 'Paint', unit: 'pane', rate: 450, pricingMode: 'kalli', pricePerKalli: 450, pricePerSqFt: 35, coverage: 12, description: 'Anti-corrosion oven-baked epoxy finish' },
            { id: 'paint_pu_grey', name: 'Anthracite Grey PU Finish', category: 'Paint', unit: 'sq.ft', rate: 45, pricingMode: 'sqft', pricePerKalli: 550, pricePerSqFt: 45, coverage: 11, description: 'Polyurethane exterior weather coat' },
            { id: 'paint_white_enamel', name: 'Pure White Baked Enamel', category: 'Paint', unit: 'pane', rate: 400, pricingMode: 'kalli', pricePerKalli: 400, pricePerSqFt: 30, coverage: 13, description: 'Gloss white rust-resistant finish' },

            // 6. Lock & Accessories
            { id: 'lock_cockspur', name: 'Cockspur Window Handle Lock', category: 'Lock & Accessories', unit: 'pcs', rate: 160, lockType: 'Cockspur Handle', weightFactor: 0.25, description: 'Wedge latching locking handle' },
            { id: 'lock_multipoint', name: 'Multipoint Espag Transmission Lock', category: 'Lock & Accessories', unit: 'pcs', rate: 450, lockType: 'Multipoint Lock', weightFactor: 0.65, description: 'High security multipoint rod mechanism' },
            { id: 'lock_cam_window', name: 'Window Cam Lock & Keeper', category: 'Lock & Accessories', unit: 'pcs', rate: 95, lockType: 'Cam Lock', weightFactor: 0.18, description: 'Rotating cam sash fastener' },
            
            // 7. Hook & Rubber
            { id: 'hook_stay_8in', name: 'Casement Stay Wind Hook 8"', category: 'Hook & Rubber', unit: 'pcs', rate: 75, hookType: 'Stay Wind Hook', weightFactor: 0.20, description: 'Slotted window stay arm hook' },
            { id: 'rubber_epdm_gasket', name: 'EPDM Rubber Weather Gasket Strip', category: 'Hook & Rubber', unit: 'mtr', rate: 25, hookType: 'Rubber Gasket', weightFactor: 0.05, description: 'Acoustic and weatherproof rubber seal' }
        ],
        // Active multi-product draft session for Quotation Generation
        currentQuoteDraft: {
            customer: '',
            customerId: '',
            customerPhone: '',
            customerAddress: '',
            items: []
        },
        productionOrders: [
            {
                id: 'ORD-4401',
                client: 'Luxury Villa Project',
                items: 'Window 3-Pane (x15), French Door (x2)',
                amount: 125000,
                date: '2025-12-07',
                targetDate: '2026-01-15',
                status: 'Fabrication & Welding',
                progress: 3, // 0: Placed, 1: Cutting, 2: Channeling, 3: Welding, 4: Coating, 5: QC, 6: Installed
                technician: 'Rajeesh Kumar',
                drawing: true,
                notes: '16G MS frame with electro-welded corners and custom grill.'
            },
            {
                id: 'ORD-4402',
                client: 'Arun Kumar',
                items: 'Steel Window 4x4 with Grill (x4), Ventilator 2x2 (x2)',
                amount: 45000,
                date: '2025-12-16',
                targetDate: '2026-01-20',
                status: 'Painting & Powder Coat',
                progress: 4,
                technician: 'Mani Kangan',
                drawing: true,
                notes: 'Matte black epoxy powder coated finish with 5mm single glazing.'
            },
            {
                id: 'ORD-4405',
                client: 'City Hospital',
                items: 'Acoustic Partition Frame (x4)',
                amount: 85000,
                date: '2025-12-08',
                targetDate: '2026-01-25',
                status: 'Cutting & Prep',
                progress: 1,
                technician: 'Sajeev P',
                drawing: false,
                notes: 'Heavy gauge steel channel partitions for ICU sound dampening.'
            },
            {
                id: 'ORD-4390',
                client: 'Mr. Rajesh',
                items: 'Main Entrance Sliding Gate (x1)',
                amount: 12000,
                date: '2025-12-05',
                targetDate: '2026-01-10',
                status: 'Quality Check & Fitting',
                progress: 5,
                technician: 'Rajeesh Kumar',
                drawing: true,
                notes: 'Laser cut designer sheet inlay with ball bearing bottom rollers.'
            },
            {
                id: 'ORD-4385',
                client: 'Malabar Residency',
                items: 'Soundproof Sliding Windows (x8)',
                amount: 98000,
                date: '2025-11-28',
                targetDate: '2025-12-24',
                deliveredDate: '2025-12-24',
                status: 'Delivered',
                progress: 6,
                technician: 'Rajeesh Kumar',
                drawing: true,
                notes: 'Completed final handover and acoustic testing. Client signed off.'
            },
            {
                id: 'ORD-4372',
                client: 'Skyline Heights',
                items: 'Balcony French Doors & Glass Enclosure',
                amount: 145000,
                date: '2025-11-15',
                targetDate: '2025-12-18',
                deliveredDate: '2025-12-19',
                status: 'Delivered',
                progress: 6,
                technician: 'Mani Kangan',
                drawing: true,
                notes: 'Delivered and fitted on 14th floor. Quality check signed.'
            },
            {
                id: 'ORD-4360',
                client: 'Green Valley Villa',
                items: 'Heavy MS Casement Windows (x6)',
                amount: 72000,
                date: '2025-11-10',
                targetDate: '2025-12-05',
                deliveredDate: '2025-12-06',
                status: 'Delivered',
                progress: 6,
                technician: 'Rajeesh Kumar',
                drawing: true,
                notes: 'Delivered on site and verified with site engineer.'
            }
        ],
        customers: [
            { id: 'C-001', name: 'Arun Kumar', mobile: '9846112233', address: 'Kozhikode, Kerala', orders: 2, totalValue: 45000, advanceBalance: 15000 },
            { id: 'C-002', name: 'Luxury Villa Project', mobile: '9846998877', address: 'Malappuram, Kerala', orders: 5, totalValue: 125000, advanceBalance: 25000 },
            { id: 'C-003', name: 'City Hospital', mobile: '0495223344', address: 'Kannur Road', orders: 1, totalValue: 8400, advanceBalance: 0 },
            { id: 'C-004', name: 'Mr. Rajesh', mobile: '9988776655', address: 'Wayanad', orders: 1, totalValue: 12000, advanceBalance: 5000 }
        ],
        activeUserId: 'SB-9901', // 'SB-9901' for Super Admin or 'EMP-...' for Employee
        customProfessions: ['Fabricator', 'Welder', 'Helper', 'Driver', 'Sales Executive', 'Accounts Executive', 'Site Supervisor', 'Architectural Designer', 'Powder Coating Lead'],
        staff: [
            {
                id: 'EMP-101',
                name: 'Sneha Nair',
                role: 'Accounts Executive',
                department: 'Accounts',
                status: 'Present',
                location: 'Main Office',
                checkIn: '08:25 AM',
                checkOut: '05:30 PM',
                photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                place: 'Kozhikode, Kerala',
                phone: '+91 9846 223 344',
                email: 'sneha.accounts@stellobuild.com',
                monthlySalary: 28000,
                shiftHours: 8,
                reportingTime: '08:30 AM',
                overtimeRate: 150,
                overtimeHours: 6.0,
                overtime: 900,
                advance: 0,
                presentDays: 24,
                absentDays: 0,
                leaves: 2,
                lateDays: 0,
                joiningDate: '2024-03-15',
                permissions: {
                    dashboard: 'view',
                    customers: 'view',
                    calculation: 'none',
                    quotations: 'view',
                    leads: 'none',
                    site_visit: 'none',
                    service_visit: 'none',
                    sales: 'functional',
                    purchase: 'functional',
                    payments: 'functional',
                    stock_manager: 'view',
                    production: 'none',
                    hr: 'view',
                    reports: 'functional',
                    settings: 'none'
                }
            },
            {
                id: 'EMP-102',
                name: 'Rohit Sharma',
                role: 'Sales Executive',
                department: 'Sales',
                status: 'On Site',
                location: 'Client Site (Malabar)',
                checkIn: '08:45 AM',
                checkOut: '06:15 PM',
                photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                place: 'Malappuram, Kerala',
                phone: '+91 9876 543 210',
                email: 'rohit.sales@stellobuild.com',
                monthlySalary: 30000,
                shiftHours: 8,
                reportingTime: '08:30 AM',
                overtimeRate: 160,
                overtimeHours: 10.5,
                overtime: 1680,
                advance: 1500,
                presentDays: 23,
                absentDays: 1,
                leaves: 2,
                lateDays: 2,
                joiningDate: '2024-01-10',
                permissions: {
                    dashboard: 'view',
                    customers: 'functional',
                    calculation: 'functional',
                    quotations: 'functional',
                    leads: 'functional',
                    site_visit: 'functional',
                    service_visit: 'view',
                    sales: 'functional',
                    purchase: 'none',
                    payments: 'view',
                    stock_manager: 'view',
                    production: 'none',
                    hr: 'view',
                    reports: 'view',
                    settings: 'none'
                }
            },
            {
                id: 'EMP-103',
                name: 'Farhan Ali',
                role: 'Window & CAD Designer',
                department: 'Designing',
                status: 'Present',
                location: 'Design Studio',
                checkIn: '08:15 AM',
                checkOut: '05:45 PM',
                photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                place: 'Kochi, Kerala',
                phone: '+91 9847 334 455',
                email: 'farhan.cad@stellobuild.com',
                monthlySalary: 35000,
                shiftHours: 8,
                reportingTime: '08:30 AM',
                overtimeRate: 180,
                overtimeHours: 14.0,
                overtime: 2520,
                advance: 0,
                presentDays: 25,
                absentDays: 0,
                leaves: 1,
                lateDays: 0,
                joiningDate: '2023-11-01',
                permissions: {
                    dashboard: 'view',
                    customers: 'view',
                    calculation: 'functional',
                    quotations: 'functional',
                    leads: 'none',
                    site_visit: 'none',
                    service_visit: 'none',
                    sales: 'none',
                    purchase: 'none',
                    payments: 'none',
                    stock_manager: 'view',
                    production: 'view',
                    hr: 'view',
                    reports: 'none',
                    settings: 'none'
                }
            },
            {
                id: 'EMP-104',
                name: 'Harish Menon',
                role: 'Operations Supervisor',
                department: 'Supervisor',
                status: 'Present',
                location: 'Fabrication Plant',
                checkIn: '08:00 AM',
                checkOut: '06:00 PM',
                photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
                place: 'Palakkad, Kerala',
                phone: '+91 9846 887 766',
                email: 'harish.sup@stellobuild.com',
                monthlySalary: 32000,
                shiftHours: 8,
                reportingTime: '08:30 AM',
                overtimeRate: 170,
                overtimeHours: 16.0,
                overtime: 2720,
                advance: 2000,
                presentDays: 24,
                absentDays: 0,
                leaves: 2,
                lateDays: 0,
                joiningDate: '2023-08-15',
                permissions: {
                    dashboard: 'view',
                    customers: 'view',
                    calculation: 'view',
                    quotations: 'view',
                    leads: 'view',
                    site_visit: 'functional',
                    service_visit: 'functional',
                    sales: 'view',
                    purchase: 'view',
                    payments: 'none',
                    stock_manager: 'functional',
                    production: 'functional',
                    hr: 'functional',
                    reports: 'view',
                    settings: 'none'
                }
            },
            {
                id: 'EMP-105',
                name: 'Manoj Kumar',
                role: 'Production Floor Lead',
                department: 'Production',
                status: 'Present',
                location: 'Assembly Bay 2',
                checkIn: '08:10 AM',
                checkOut: '05:30 PM',
                photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
                place: 'Thrissur, Kerala',
                phone: '+91 9846 556 677',
                email: 'manoj.prod@stellobuild.com',
                monthlySalary: 29000,
                shiftHours: 8,
                reportingTime: '08:30 AM',
                overtimeRate: 155,
                overtimeHours: 8.0,
                overtime: 1240,
                advance: 1000,
                presentDays: 24,
                absentDays: 1,
                leaves: 1,
                lateDays: 0,
                joiningDate: '2024-02-01',
                permissions: {
                    dashboard: 'view',
                    customers: 'none',
                    calculation: 'view',
                    quotations: 'none',
                    leads: 'none',
                    site_visit: 'none',
                    service_visit: 'none',
                    sales: 'none',
                    purchase: 'none',
                    payments: 'none',
                    stock_manager: 'functional',
                    production: 'functional',
                    hr: 'view',
                    reports: 'none',
                    settings: 'none'
                }
            },
            {
                id: 'EMP-106',
                name: 'Mani Kangan',
                role: 'CNC Machinery Operator',
                department: 'Production',
                status: 'Present',
                location: 'CNC Cutting Machine #1',
                checkIn: '08:20 AM',
                checkOut: '05:50 PM',
                photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
                place: 'Aluva, Kerala',
                phone: '+91 9846 110 102',
                email: 'mani.cnc@stellobuild.com',
                monthlySalary: 24000,
                shiftHours: 8,
                reportingTime: '08:30 AM',
                overtimeRate: 140,
                overtimeHours: 12.0,
                overtime: 1680,
                advance: 0,
                presentDays: 24,
                absentDays: 0,
                leaves: 2,
                lateDays: 0,
                joiningDate: '2024-04-10',
                permissions: {
                    dashboard: 'none',
                    customers: 'none',
                    calculation: 'none',
                    quotations: 'none',
                    leads: 'none',
                    site_visit: 'none',
                    service_visit: 'none',
                    sales: 'none',
                    purchase: 'none',
                    payments: 'none',
                    stock_manager: 'view',
                    production: 'functional',
                    hr: 'view',
                    reports: 'none',
                    settings: 'none'
                }
            },
            {
                id: 'EMP-107',
                name: 'Rajeesh Kumar',
                role: 'Fabrication Specialist',
                department: 'Fabrication',
                status: 'Present',
                location: 'Welding & Assembly Floor',
                checkIn: '08:15 AM',
                checkOut: '06:30 PM',
                photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
                place: 'Kochi, Kerala',
                phone: '+91 9846 110 101',
                email: 'rajeesh.fab@stellobuild.com',
                monthlySalary: 26000,
                shiftHours: 8,
                reportingTime: '08:30 AM',
                overtimeRate: 150,
                overtimeHours: 18.0,
                overtime: 2700,
                advance: 2000,
                presentDays: 22,
                absentDays: 2,
                leaves: 2,
                lateDays: 0,
                joiningDate: '2023-05-20',
                permissions: {
                    dashboard: 'none',
                    customers: 'none',
                    calculation: 'view',
                    quotations: 'none',
                    leads: 'none',
                    site_visit: 'view',
                    service_visit: 'none',
                    sales: 'none',
                    purchase: 'none',
                    payments: 'none',
                    stock_manager: 'view',
                    production: 'functional',
                    hr: 'view',
                    reports: 'none',
                    settings: 'none'
                }
            },
            {
                id: 'EMP-108',
                name: 'Suresh Babu',
                role: 'Painting & Coating Specialist',
                department: 'Painting Section',
                status: 'Present',
                location: 'Powder Coating Booth',
                checkIn: '08:35 AM',
                checkOut: '05:30 PM',
                photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
                place: 'Kozhikode, Kerala',
                phone: '+91 9846 998 811',
                email: 'suresh.paint@stellobuild.com',
                monthlySalary: 22000,
                shiftHours: 8,
                reportingTime: '08:30 AM',
                overtimeRate: 130,
                overtimeHours: 8.0,
                overtime: 1040,
                advance: 500,
                presentDays: 23,
                absentDays: 1,
                leaves: 2,
                lateDays: 1,
                joiningDate: '2024-06-01',
                permissions: {
                    dashboard: 'none',
                    customers: 'none',
                    calculation: 'none',
                    quotations: 'none',
                    leads: 'none',
                    site_visit: 'none',
                    service_visit: 'none',
                    sales: 'none',
                    purchase: 'none',
                    payments: 'none',
                    stock_manager: 'view',
                    production: 'functional',
                    hr: 'view',
                    reports: 'none',
                    settings: 'none'
                }
            }
        ],
        sales: [
            {
                id: 'INV-2025-001', customer: 'Luxury Villa Project', date: '2025-12-01',
                amount: 125000, paidAmount: 125000, balance: 0,
                items: 'Window 3-Pane (x15)', status: 'Paid',
                dueDate: '2025-12-10', paymentType: 'Full'
            },
            {
                id: 'INV-2025-002', customer: 'Arun Kumar', date: '2025-12-15',
                amount: 45000, paidAmount: 20000, balance: 25000,
                items: 'Steel Window 4x4', status: 'Pending',
                dueDate: '2026-01-15', paymentType: 'Advance'
            },
            {
                id: 'INV-2025-003', customer: 'City Hospital', date: '2025-11-20',
                amount: 85000, paidAmount: 0, balance: 85000,
                items: 'Partition Work', status: 'Overdue',
                dueDate: '2025-12-05', paymentType: 'Credit'
            },
            {
                id: 'INV-2025-004', customer: 'Mr. Rajesh', date: '2025-12-28',
                amount: 12000, paidAmount: 5000, balance: 7000,
                items: 'Gate Main', status: 'Partially Paid',
                dueDate: '2026-01-10', paymentType: 'Advance'
            },
            {
                id: 'ADV-2026-001', customer: 'New Client Demo', date: '2026-01-01',
                amount: 10000, paidAmount: 10000, balance: 0,
                items: 'Booking Advance', status: 'Advance',
                dueDate: '2026-01-01', paymentType: 'Advance'
            }
        ],
        siteVisits: [
            {
                id: 'SV-101',
                customer: 'Luxury Villa Project',
                phone: '9846998877',
                location: 'Malappuram, Kerala',
                mapsUrl: 'https://maps.google.com/?q=11.0732,76.0740',
                date: '2026-01-25',
                time: '10:30 AM',
                staff: 'Rajeesh Kumar',
                purpose: 'Pre-fabrication opening measurement & lintel check',
                notes: 'Check lintel height and masonry plumb for 15 windows.',
                status: 'Scheduled', // 'Scheduled', 'In Progress', 'Completed'
                initialFiles: [
                    { name: 'ground_floor_plan.pdf', type: 'pdf', size: '2.4 MB', date: '2026-01-22' },
                    { name: 'site_frontage.jpg', type: 'image', size: '1.8 MB', date: '2026-01-22' }
                ],
                staffUpdates: []
            },
            {
                id: 'SV-102',
                customer: 'Arun Kumar',
                phone: '9846112233',
                location: 'Kozhikode, Kerala',
                mapsUrl: 'https://maps.google.com/?q=11.2588,75.7804',
                date: '2026-01-18',
                time: '02:00 PM',
                staff: 'Mani Kangan',
                purpose: 'Window Aperture Measurement',
                notes: 'Final check for ground floor bedroom windows.',
                status: 'Completed',
                initialFiles: [
                    { name: 'elevation_blueprint.pdf', type: 'pdf', size: '1.2 MB', date: '2026-01-16' }
                ],
                staffUpdates: [
                    {
                        staff: 'Mani Kangan',
                        date: '2026-01-18 03:45 PM',
                        status: 'Completed',
                        notes: 'All 4 window frames measured. Opening 120x150cm verified with 15mm plaster allowance on sill.',
                        files: [
                            { name: 'measurement_sheet.pdf', type: 'pdf', size: '950 KB' },
                            { name: 'opening_verified.jpg', type: 'image', size: '2.1 MB' }
                        ]
                    }
                ]
            },
            {
                id: 'SV-103',
                customer: 'Green Valley Villa',
                phone: '9744556677',
                location: 'Wayanad, Kerala',
                mapsUrl: 'https://maps.google.com/?q=11.6854,76.1320',
                date: '2026-02-02',
                time: '11:00 AM',
                staff: 'Rajeesh Kumar',
                purpose: 'Balcony french window structural anchoring inspect',
                notes: 'Verify steel lintel load-bearing capacity before installation.',
                status: 'Scheduled',
                initialFiles: [],
                staffUpdates: []
            },
            {
                id: 'SV-104',
                customer: 'Skyline Heights',
                phone: '9847119900',
                location: 'Kakkanad, Kochi',
                mapsUrl: 'https://maps.google.com/?q=10.0159,76.3419',
                date: '2026-02-05',
                time: '03:30 PM',
                staff: 'Mani Kangan',
                purpose: 'Final glazing alignment & seal check',
                notes: 'Inspect DGU silicone weather seals after monsoon test.',
                status: 'Scheduled',
                initialFiles: [],
                staffUpdates: []
            }
        ],
        services: [
            {
                id: 'SRV-801',
                customer: 'Arun Kumar',
                phone: '9846112233',
                location: 'Kozhikode, Kerala',
                details: 'Master bedroom window handle loose, vibrating under heavy monsoon wind.',
                issue: 'Window Sash Vibration & Latch Alignment',
                priority: 'High',
                date: '2026-01-10',
                time: '11:00 AM',
                technician: 'Mani Kangan',
                status: 'Approved', // 'Scheduled', 'In Progress', 'Completed by Tech', 'Approved'
                cost: 1500,
                issueFiles: [
                    { name: 'loose_hinge.jpg', type: 'image', size: '1.4 MB' }
                ],
                resolutionDetails: {
                    completedDate: '2026-01-10 01:30 PM',
                    technician: 'Mani Kangan',
                    notes: 'Replaced friction stay hinges, lubricated handle mechanism, and tested 10 opening cycles.',
                    partsReplaced: '2x SS Butt Hinges 4", Silicone Sealant bead',
                    files: [
                        { name: 'repaired_hinge.jpg', type: 'image', size: '1.6 MB' },
                        { name: 'smooth_operation.mp4', type: 'video', size: '3.8 MB' }
                    ]
                },
                approvalDetails: {
                    verifiedBy: 'Rohit Sharma (Sales)',
                    verifiedDate: '2026-01-11 10:00 AM',
                    status: 'Approved',
                    notes: 'Customer confirmed complete satisfaction. Verified for service invoice closure.'
                }
            },
            {
                id: 'SRV-802',
                customer: 'Luxury Villa Project',
                phone: '9846998877',
                location: 'Malappuram, Kerala',
                details: 'Pre-monsoon silicone gasket check for French windows on 1st floor balcony.',
                issue: 'Weather Seal Inspection & Silicon Touchup',
                priority: 'Medium',
                date: '2026-01-20',
                time: '03:00 PM',
                technician: 'Rajeesh Kumar',
                status: 'Completed by Tech', // Pending Sales Verification!
                cost: 4500,
                issueFiles: [
                    { name: 'gasket_wear.jpg', type: 'image', size: '1.1 MB' }
                ],
                resolutionDetails: {
                    completedDate: '2026-01-20 04:30 PM',
                    technician: 'Rajeesh Kumar',
                    notes: 'Applied structural neutral cure silicone along all outer flanges and tested water spray resistance.',
                    partsReplaced: '2x Weather Sealant Cartridges, 15m EPDM Gasket',
                    files: [
                        { name: 'sealed_transom.jpg', type: 'image', size: '2.0 MB' },
                        { name: 'water_test_video.mp4', type: 'video', size: '4.5 MB' }
                    ]
                },
                approvalDetails: null
            },
            {
                id: 'SRV-803',
                customer: 'City Hospital',
                phone: '0495223344',
                location: 'Kannur Road',
                details: 'Emergency lock jamming on ICU acoustic partition frame door.',
                issue: 'ICU Partition Door Closer & Lock Jam',
                priority: 'Urgent',
                date: '2026-01-22',
                time: '09:00 AM',
                technician: 'Mani Kangan',
                status: 'Scheduled',
                cost: 2200,
                issueFiles: [
                    { name: 'jammed_lock.jpg', type: 'image', size: '900 KB' }
                ],
                resolutionDetails: null,
                approvalDetails: null
            },
            {
                id: 'SRV-804',
                customer: 'Malabar Residency',
                phone: '9846224466',
                location: 'Calicut Beach Road',
                details: 'Friction stay arm stiffening from coastal salt air.',
                issue: 'Casement Friction Arm Lubrication & Re-alignment',
                priority: 'Medium',
                date: '2026-01-28',
                time: '10:00 AM',
                technician: 'Rajeesh Kumar',
                status: 'Scheduled',
                cost: 1800,
                issueFiles: [],
                resolutionDetails: null,
                approvalDetails: null
            }
        ],
        purchases: [
            {
                id: 'PO-1001', vendor: 'Steel City Suppliers', client: 'Luxury Villa Project', date: '2025-12-05',
                amount: 42000, paidAmount: 42000, balance: 0,
                items: 'Heavy Duty MS Channels 2x2 (x40)', status: 'Delivered',
                dueDate: '2025-12-15', paymentType: 'Credit'
            },
            {
                id: 'PO-1002', vendor: 'Saint-Gobain Glazing', client: 'Luxury Villa Project', date: '2025-12-10',
                amount: 38000, paidAmount: 38000, balance: 0,
                items: 'Toughened Double Glass Panes 18mm', status: 'Delivered',
                dueDate: '2025-12-20', paymentType: 'Bank Transfer'
            },
            {
                id: 'PO-1003', vendor: 'Apex Fasteners & Hardware', client: 'Arun Kumar', date: '2025-12-16',
                amount: 8500, paidAmount: 8500, balance: 0,
                items: 'Friction Stays & Multi-point Locks (x12 sets)', status: 'Delivered',
                dueDate: '2025-12-25', paymentType: 'Cash'
            },
            {
                id: 'PO-1004', vendor: 'General Paints', client: 'Mr. Rajesh', date: '2026-01-02',
                amount: 5000, paidAmount: 5000, balance: 0,
                items: 'Anti-rust Primer & Epoxy Black (20L)', status: 'Delivered',
                dueDate: '2026-01-02', paymentType: 'Cash'
            }
        ],
        rawMaterialCategories: ['Sheet', 'Pipe', 'Hardware', 'Paint', 'Extrusions', 'Glass', 'Fasteners', 'Rubber Gasket', 'Other'],
        finishedGoods: [
            {
                id: 'FG-201',
                name: 'Living Room 3-Pane Casement Window',
                type: 'Window',
                customer: 'Arun Kumar',
                dimensions: '180 x 140 cm',
                color: 'Matte Black Epoxy',
                status: 'Ready for Dispatch',
                dateAdded: '2026-01-18',
                image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop'
            },
            {
                id: 'FG-202',
                name: 'French Balcony Double Door',
                type: 'Door',
                customer: 'Luxury Villa Project',
                dimensions: '150 x 210 cm',
                color: 'Anthracite Grey PU',
                status: 'Quality Checked',
                dateAdded: '2026-01-20',
                image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop'
            },
            {
                id: 'FG-203',
                name: 'Kitchen Ventilator with Exhaust Louver',
                type: 'Ventilator',
                customer: 'Stock (Unassigned)',
                dimensions: '60 x 60 cm',
                color: 'Pure White Enamel',
                status: 'In Warehouse',
                dateAdded: '2026-01-22',
                image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop'
            }
        ],
        orders: [
            {
                id: 'ORD-7001',
                quoteId: 'Q-2025-001',
                customer: 'Arun Kumar',
                customerMobile: '9846112233',
                customerAddress: 'Kozhikode, Kerala',
                items: 'Steel Window 4x4 with Grill (x4), Ventilator 2x2 (x2)',
                amount: 45000,
                advancePayment: 15000,
                balanceDue: 30000,
                date: '2026-01-10',
                dueDate: '2026-02-15',
                currentMilestone: 'Fabrication',
                milestones: ['Order Listed', 'Drawing', 'Channel Making', 'Fabrication', 'Painting', 'Packing', 'Dispatched', 'Delivered'],
                milestonesHistory: [
                    { stage: 'Order Listed', date: '2026-01-10 10:00 AM', by: 'System (Quote Conversion)' },
                    { stage: 'Drawing', date: '2026-01-12 02:30 PM', by: 'Farhan Ali (CAD Designer)' },
                    { stage: 'Channel Making', date: '2026-01-14 11:15 AM', by: 'Mani Kangan (CNC)' },
                    { stage: 'Fabrication', date: '2026-01-16 04:00 PM', by: 'Rajeesh Kumar (Technician)' }
                ],
                assignedTechnician: 'Rajeesh Kumar',
                drawingType: 'image',
                drawingUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2531&auto=format&fit=crop',
                portalCredentials: {
                    username: 'Arun Kumar',
                    password: '9846112233',
                    active: true,
                    generatedAt: '2026-01-10 10:00 AM',
                    revokedAt: null
                }
            },
            {
                id: 'ORD-7002',
                quoteId: 'Q-2025-002',
                customer: 'Luxury Villa Project',
                customerMobile: '9846998877',
                customerAddress: 'Malappuram, Kerala',
                items: 'Window 3-Pane (x15), French Door (x2)',
                amount: 125000,
                advancePayment: 40000,
                balanceDue: 85000,
                date: '2026-01-12',
                dueDate: '2026-02-28',
                currentMilestone: 'Painting',
                milestones: ['Order Listed', 'Drawing', 'Channel Making', 'Fabrication', 'Painting', 'Packing', 'Dispatched', 'Delivered'],
                milestonesHistory: [
                    { stage: 'Order Listed', date: '2026-01-12 11:00 AM', by: 'System (Quote Conversion)' },
                    { stage: 'Drawing', date: '2026-01-13 04:00 PM', by: 'Farhan Ali (CAD Designer)' },
                    { stage: 'Channel Making', date: '2026-01-16 01:30 PM', by: 'Mani Kangan (CNC)' },
                    { stage: 'Fabrication', date: '2026-01-18 10:00 AM', by: 'Rajeesh Kumar (Technician)' },
                    { stage: 'Painting', date: '2026-01-20 03:45 PM', by: 'Mani Kangan (Coating Lead)' }
                ],
                assignedTechnician: 'Mani Kangan',
                drawingType: 'image',
                drawingUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2531&auto=format&fit=crop',
                portalCredentials: {
                    username: 'Luxury Villa Project',
                    password: '9846998877',
                    active: true,
                    generatedAt: '2026-01-12 11:00 AM',
                    revokedAt: null
                }
            },
            {
                id: 'ORD-7003',
                quoteId: 'Q-2025-003',
                customer: 'Green Valley Villa',
                customerMobile: '9744556677',
                customerAddress: 'Wayanad, Kerala',
                items: 'Heavy MS Casement Windows (x6)',
                amount: 72000,
                advancePayment: 72000,
                balanceDue: 0,
                date: '2025-12-01',
                dueDate: '2026-01-05',
                currentMilestone: 'Delivered',
                milestones: ['Order Listed', 'Drawing', 'Channel Making', 'Fabrication', 'Painting', 'Packing', 'Dispatched', 'Delivered'],
                milestonesHistory: [
                    { stage: 'Order Listed', date: '2025-12-01' },
                    { stage: 'Drawing', date: '2025-12-03' },
                    { stage: 'Channel Making', date: '2025-12-08' },
                    { stage: 'Fabrication', date: '2025-12-14' },
                    { stage: 'Painting', date: '2025-12-19' },
                    { stage: 'Packing', date: '2025-12-22' },
                    { stage: 'Dispatched', date: '2025-12-23' },
                    { stage: 'Delivered', date: '2025-12-24 05:00 PM', by: 'Rajeesh Kumar (Delivery)' }
                ],
                assignedTechnician: 'Rajeesh Kumar',
                drawingType: 'image',
                drawingUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2531&auto=format&fit=crop',
                portalCredentials: {
                    username: 'Green Valley Villa',
                    password: '9744556677',
                    active: false,
                    generatedAt: '2025-12-01',
                    revokedAt: '2025-12-24 05:00 PM'
                }
            }
        ],
        sales: [
            {
                id: 'INV-2026-1001',
                customer: 'Arun Kumar',
                date: '2026-01-10',
                amount: 45000,
                paidAmount: 15000,
                balance: 30000,
                items: 'Steel Window 4x4 with Grill (x4), Ventilator 2x2 (x2)',
                status: 'Pending',
                dueDate: '2026-01-15', // Overdue!
                paymentType: 'Advance'
            },
            {
                id: 'INV-2026-1002',
                customer: 'Luxury Villa Project',
                date: '2026-01-12',
                amount: 125000,
                paidAmount: 125000,
                balance: 0,
                items: 'French Window Double Door (x5)',
                status: 'Paid',
                dueDate: '2026-02-01',
                paymentType: 'Online'
            },
            {
                id: 'INV-2026-1003',
                customer: 'City Hospital',
                date: '2025-12-15',
                amount: 85000,
                paidAmount: 20000,
                balance: 65000,
                items: 'Acoustic Partition Frame (x4)',
                status: 'Pending',
                dueDate: '2025-12-30', // Overdue!
                paymentType: 'Credit'
            }
        ],
        salesReturns: [
            {
                id: 'SR-101',
                invoiceId: 'INV-2026-1001',
                customer: 'Arun Kumar',
                date: '2026-01-16',
                reason: 'Dimension adjustment for bedroom ventilator sill',
                items: 'Ventilator 2x2 (x1)',
                refundAmount: 3500,
                status: 'Approved'
            }
        ],
        purchaseReturns: [
            {
                id: 'PR-101',
                poId: 'PO-1003',
                vendor: 'Apex Fasteners & Hardware',
                date: '2026-01-18',
                reason: 'Surface defect on friction stay arms batch',
                items: 'Friction Stays 10" (x4 pairs)',
                creditAmount: 1040,
                status: 'Processed'
            }
        ]
    },
    listeners: [],

    initPersistence() {
        try {
            const saved = localStorage.getItem('gl_erp_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge saved settings/data into current state
                // We primarily want to persist 'settings' and maybe 'inventory/customers' if we were doing a full app
                // For now, let's focus on Settings and Quotation Defaults
                if (parsed.settings) this.state.settings = parsed.settings;
                if (parsed.customers) this.state.customers = parsed.customers;
                if (parsed.leads) this.state.leads = parsed.leads;
                if (parsed.productionOrders) {
                    this.state.productionOrders = parsed.productionOrders;
                    // Ensure delivered orders are available
                    if (!this.state.productionOrders.some(o => o.progress >= 6 || (o.status && o.status.toLowerCase().includes('deliver')))) {
                        this.state.productionOrders.push(
                            {
                                id: 'ORD-4385',
                                client: 'Malabar Residency',
                                items: 'Soundproof Sliding Windows (x8)',
                                amount: 98000,
                                date: '2025-11-28',
                                targetDate: '2025-12-24',
                                deliveredDate: '2025-12-24',
                                status: 'Delivered',
                                progress: 6,
                                technician: 'Rajeesh Kumar',
                                drawing: true,
                                notes: 'Completed final handover and acoustic testing. Client signed off.'
                            },
                            {
                                id: 'ORD-4372',
                                client: 'Skyline Heights',
                                items: 'Balcony French Doors & Glass Enclosure',
                                amount: 145000,
                                date: '2025-11-15',
                                targetDate: '2025-12-18',
                                deliveredDate: '2025-12-19',
                                status: 'Delivered',
                                progress: 6,
                                technician: 'Mani Kangan',
                                drawing: true,
                                notes: 'Delivered and fitted on 14th floor. Quality check signed.'
                            }
                        );
                    }
                }
                if (parsed.siteVisits && parsed.siteVisits.length >= 2) this.state.siteVisits = parsed.siteVisits;
                if (parsed.services && parsed.services.length >= 3) this.state.services = parsed.services;
                if (parsed.materialGroups && Array.isArray(parsed.materialGroups)) {
                    this.state.materialGroups = parsed.materialGroups.filter(g => g && g.toLowerCase() !== 'frame');
                }
                if (parsed.materialCatalog && Array.isArray(parsed.materialCatalog)) {
                    this.state.materialCatalog = parsed.materialCatalog;
                }
                // Ensure default groups and legacy categories are smoothly migrated
                const defaultGroups = ['Profile', 'Pipe', 'Panel', 'Hinges', 'Paint', 'Lock & Accessories', 'Hook & Rubber'];
                if (!this.state.materialGroups) this.state.materialGroups = [...defaultGroups];
                this.state.materialGroups = this.state.materialGroups.filter(g => g && g.toLowerCase() !== 'frame');
                defaultGroups.forEach(g => {
                    if (!this.state.materialGroups.some(existing => existing.toLowerCase() === g.toLowerCase())) {
                        this.state.materialGroups.push(g);
                    }
                });
                if (this.state.materialCatalog) {
                    this.state.materialCatalog.forEach(m => {
                        if (m.category === 'Frame') m.category = 'Profile';
                        if (m.category === 'Square Tube') m.category = 'Pipe';
                        if (m.category === 'Glass' || m.category === 'Sheet') m.category = 'Panel';
                        if (m.category === 'Lock') m.category = 'Lock & Accessories';
                        if (m.category === 'Hook') m.category = 'Hook & Rubber';
                    });
                }
                if (parsed.quotations) this.state.quotations = parsed.quotations;
                if (parsed.currentQuoteDraft) this.state.currentQuoteDraft = parsed.currentQuoteDraft;
                if (parsed.leoVoiceSettings) this.state.leoVoiceSettings = parsed.leoVoiceSettings;
                if (parsed.staff && Array.isArray(parsed.staff) && parsed.staff.length > 0) {
                    this.state.staff = parsed.staff;
                }
                if (parsed.activeUserId) {
                    this.state.activeUserId = parsed.activeUserId;
                }
                if (parsed.laborRates) this.state.laborRates = parsed.laborRates;
                if (!this.state.laborRates) this.state.laborRates = { normalPaneRate: 500, partitionedPaneRate: 800 };

                if (parsed.fabricationRates) {
                    this.state.fabricationRates = { ...this.state.fabricationRates, ...parsed.fabricationRates };
                    if (parsed.fabricationRates.labourTiers) {
                        this.state.fabricationRates.labourTiers = { ...this.state.fabricationRates.labourTiers, ...parsed.fabricationRates.labourTiers };
                    }
                }
                if (parsed.savedCalculations && Array.isArray(parsed.savedCalculations)) {
                    this.state.savedCalculations = parsed.savedCalculations;
                }

                // Ensure 20x20 square tube is present in catalog
                if (this.state.materialCatalog && !this.state.materialCatalog.some(m => m.id === 'tube_sq_20x20')) {
                    this.state.materialCatalog.splice(7, 0, { 
                        id: 'tube_sq_20x20', 
                        name: '20x20 Square Tube (1.2mm)', 
                        category: 'Pipe', 
                        unit: 'kg', 
                        rate: 95, 
                        pipeType: 'Square Pipe', 
                        thicknessGauge: '18G', 
                        thicknessMm: 1.2, 
                        widthMm: 20.0, 
                        weightPerLength: 0.95, 
                        weightFactor: 0.95, 
                        description: '20x20 mm MS Square Tube Window Grill Pipe' 
                    });
                }
                if (parsed.accountsConfigurations) {
                    this.state.accountsConfigurations = parsed.accountsConfigurations;
                }
                if (parsed.configurationAuditLogs) {
                    this.state.configurationAuditLogs = parsed.configurationAuditLogs;
                }
                if (parsed.rbac) {
                    this.state.rbac = parsed.rbac;
                }
                if (parsed.orders && Array.isArray(parsed.orders) && parsed.orders.length > 0) {
                    this.state.orders = parsed.orders;
                }
                if (parsed.sales && Array.isArray(parsed.sales) && parsed.sales.length > 0) {
                    this.state.sales = parsed.sales;
                }
                if (parsed.rawMaterialCategories && Array.isArray(parsed.rawMaterialCategories)) {
                    this.state.rawMaterialCategories = parsed.rawMaterialCategories;
                }
                if (parsed.finishedGoods && Array.isArray(parsed.finishedGoods)) {
                    this.state.finishedGoods = parsed.finishedGoods;
                }
                if (parsed.salesReturns && Array.isArray(parsed.salesReturns)) {
                    this.state.salesReturns = parsed.salesReturns;
                }
                if (parsed.purchaseReturns && Array.isArray(parsed.purchaseReturns)) {
                    this.state.purchaseReturns = parsed.purchaseReturns;
                }
            }
            if (!this.state.rbac) {
                this.state.rbac = JSON.parse(JSON.stringify(DEFAULT_RBAC_CONFIG));
            }
            if (typeof localStorage !== 'undefined') {
                const savedPhoto = localStorage.getItem('gl_admin_avatar');
                if (savedPhoto && this.state.user) {
                    this.state.user.photo = savedPhoto;
                }
                const savedName = localStorage.getItem('sb_user_name');
                if (savedName && this.state.user) this.state.user.name = savedName;
                const savedPhone = localStorage.getItem('sb_user_phone');
                if (savedPhone && this.state.user) this.state.user.phone = savedPhone;
                const savedLoc = localStorage.getItem('sb_user_location');
                if (savedLoc && this.state.user) this.state.user.location = savedLoc;
                const savedPin = localStorage.getItem('sb_user_pincode');
                if (savedPin && this.state.user) this.state.user.pincode = savedPin;

                const savedVoice = localStorage.getItem('leo_active_voice');
                if (savedVoice && this.state.leoVoiceSettings) {
                    this.state.leoVoiceSettings.activeVoiceId = savedVoice;
                }
                const savedLang = localStorage.getItem('leo_language');
                if (savedLang && this.state.leoVoiceSettings) {
                    this.state.leoVoiceSettings.language = savedLang;
                }
            }
            // Trigger server-side REST API sync for Configurations, RBAC, Leads & Employees
            this.syncAccountsConfigurationsWithServer();
            this.syncRbacWithServer();
            this.syncLeads();
            this.syncEmployeesWithServer();
        } catch (e) {
            console.error('Failed to load state', e);
        }
    },

    updateLeoVoiceSettings(newSettings) {
        if (!this.state.leoVoiceSettings) {
            this.state.leoVoiceSettings = {
                activeVoiceId: 'malavika-expressive',
                language: 'en-IN',
                speechRate: 1.0,
                speechPitch: 1.0,
                autoSpeak: true,
                speechVolume: 1.0
            };
        }
        this.state.leoVoiceSettings = {
            ...this.state.leoVoiceSettings,
            ...newSettings
        };
        try {
            if (typeof localStorage !== 'undefined') {
                if (newSettings.activeVoiceId) localStorage.setItem('leo_active_voice', newSettings.activeVoiceId);
                if (newSettings.language) localStorage.setItem('leo_language', newSettings.language);
                if (newSettings.speechRate) localStorage.setItem('leo_speech_rate', String(newSettings.speechRate));
                if (newSettings.speechPitch) localStorage.setItem('leo_speech_pitch', String(newSettings.speechPitch));
                if (newSettings.autoSpeak !== undefined) localStorage.setItem('leo_auto_speak', String(newSettings.autoSpeak));
            }
        } catch (e) {}
        this.notify();
    },

    updateUserPhoto(photoDataUrl) {
        if (!this.state.user) this.state.user = {};
        this.state.user.photo = photoDataUrl;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('gl_admin_avatar', photoDataUrl);
            }
        } catch (e) {}
        document.querySelectorAll('.admin-profile-avatar').forEach(img => {
            img.src = photoDataUrl;
        });
        this.notify();
    },

    updateUserProfile(data) {
        if (!this.state.user) this.state.user = {};
        Object.assign(this.state.user, data);
        try {
            if (typeof localStorage !== 'undefined') {
                if (data.name) localStorage.setItem('sb_user_name', data.name);
                if (data.phone) localStorage.setItem('sb_user_phone', data.phone);
                if (data.location) localStorage.setItem('sb_user_location', data.location);
                if (data.pincode) localStorage.setItem('sb_user_pincode', data.pincode);
            }
        } catch (e) {}
        this.saveState();
        this.notify();
    },

    saveState() {
        try {
            // Persist relevant parts of state
            const toSave = {
                settings: this.state.settings,
                customers: this.state.customers,
                leads: this.state.leads,
                productionOrders: this.state.productionOrders,
                siteVisits: this.state.siteVisits,
                services: this.state.services,
                materialCatalog: this.state.materialCatalog,
                materialGroups: this.state.materialGroups,
                laborRates: this.state.laborRates,
                fabricationRates: this.state.fabricationRates,
                savedCalculations: this.state.savedCalculations,
                quotations: this.state.quotations,
                currentQuoteDraft: this.state.currentQuoteDraft,
                leoVoiceSettings: this.state.leoVoiceSettings,
                user: this.state.user,
                staff: this.state.staff,
                customProfessions: this.state.customProfessions,
                activeUserId: this.state.activeUserId,
                accountsConfigurations: this.state.accountsConfigurations,
                configurationAuditLogs: this.state.configurationAuditLogs,
                rbac: this.state.rbac,
                orders: this.state.orders,
                sales: this.state.sales,
                rawMaterialCategories: this.state.rawMaterialCategories,
                finishedGoods: this.state.finishedGoods,
                salesReturns: this.state.salesReturns,
                purchaseReturns: this.state.purchaseReturns
            };
            localStorage.setItem('gl_erp_state', JSON.stringify(toSave));
        } catch (e) {
            console.error('Failed to save state', e);
        }
    },

    getActiveUser() {
        if (!this.state.rbac) {
            this.state.rbac = JSON.parse(JSON.stringify(DEFAULT_RBAC_CONFIG));
        }
        const rbac = this.state.rbac || {};
        const defaultPerms = rbac.permissions || {};
        const overrides = rbac.userOverrides || {};

        if (!this.state.activeUserId || this.state.activeUserId === 'SB-9901' || this.state.activeUserId === 'admin') {
            const rolePerms = defaultPerms['admin'] || {};
            const userOvr = overrides['SB-9901'] || overrides['admin'] || {};
            return {
                id: 'SB-9901',
                name: (this.state.user && this.state.user.name) || 'Shamsudheen V.K.',
                role: 'Super Administrator',
                roleCode: 'admin',
                department: 'Executive Management',
                isSuperAdmin: true,
                photo: (this.state.user && this.state.user.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                permissions: { ...rolePerms, ...userOvr }
            };
        }
        const emp = (this.state.staff || []).find(s => s.id === this.state.activeUserId);
        if (emp) {
            let roleCode = 'production';
            if (emp.id === 'EMP-101' || (emp.department && emp.department.toLowerCase().includes('account'))) {
                roleCode = 'accounts';
            } else if (emp.id === 'EMP-102' || (emp.department && emp.department.toLowerCase().includes('sales'))) {
                roleCode = 'sales';
            } else {
                roleCode = 'production';
            }

            const rolePerms = defaultPerms[roleCode] || {};
            const userOvr = overrides[emp.id] || {};
            const effectivePerms = { ...rolePerms, ...userOvr };

            return {
                ...emp,
                roleCode: roleCode,
                department: emp.department || 'Operations',
                isSuperAdmin: false,
                photo: emp.photo,
                shiftHours: emp.shiftHours || 8,
                reportingTime: emp.reportingTime || '08:30 AM',
                overtimeRate: emp.overtimeRate || 150,
                overtimeHours: emp.overtimeHours || 0,
                overtime: emp.overtime || 0,
                lateDays: emp.lateDays || 0,
                presentDays: emp.presentDays !== undefined ? emp.presentDays : 22,
                absentDays: emp.absentDays !== undefined ? emp.absentDays : 0,
                permissions: effectivePerms
            };
        }
        return {
            id: 'SB-9901',
            name: 'Shamsudheen V.K.',
            role: 'Super Administrator',
            roleCode: 'admin',
            department: 'Executive Management',
            isSuperAdmin: true,
            permissions: defaultPerms['admin'] || {}
        };
    },

    can(module, action = 'view') {
        const user = this.getActiveUser();
        if (user.isSuperAdmin || user.roleCode === 'admin') return true;

        // HR module is self-service for personal attendance and OT records
        if (module === 'hr' && (action === 'view' || action === 'read')) return true;

        const perm = user.permissions && user.permissions[module];
        if (!perm) return false;

        if (typeof perm === 'string') {
            if (perm === 'none') return false;
            if (action === 'view' || action === 'read') return perm === 'view' || perm === 'functional';
            if (action === 'create' || action === 'update' || action === 'delete') return perm === 'functional';
            return false;
        }

        if (typeof perm === 'object') {
            if (action === 'view') return !!perm.view;
            if (action === 'read') return !!(perm.read || perm.view);
            if (action === 'create') return !!perm.create;
            if (action === 'update') return !!perm.update;
            if (action === 'delete') return !!perm.delete;
        }

        return false;
    },

    getRoleCode() {
        const u = this.getActiveUser();
        return u.roleCode || (u.isSuperAdmin ? 'admin' : 'production');
    },

    async syncRbacWithServer() {
        try {
            if (typeof fetch !== 'undefined') {
                const res = await fetch('/api/rbac/permissions');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.permissions) {
                        if (!this.state.rbac) this.state.rbac = {};
                        this.state.rbac.roles = data.roles || this.state.rbac.roles;
                        this.state.rbac.modules = data.modules || this.state.rbac.modules;
                        this.state.rbac.permissions = data.permissions;
                        this.state.rbac.userOverrides = data.userOverrides || {};
                        this.saveState();
                        this.notify();
                    }
                }
            }
        } catch (e) {}
    },

    async updateRolePermissions(roleId, permissions) {
        if (!this.state.rbac) this.state.rbac = JSON.parse(JSON.stringify(DEFAULT_RBAC_CONFIG));
        if (!this.state.rbac.permissions) this.state.rbac.permissions = {};
        this.state.rbac.permissions[roleId] = {
            ...(this.state.rbac.permissions[roleId] || {}),
            ...permissions
        };
        this.saveState();
        this.notify();

        try {
            if (typeof fetch !== 'undefined') {
                const active = this.getActiveUser();
                await fetch(`/api/rbac/permissions/${roleId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': active.id,
                        'x-user-role': active.roleCode
                    },
                    body: JSON.stringify({ permissions: this.state.rbac.permissions[roleId] })
                });
            }
        } catch (e) {}
        return { success: true, permissions: this.state.rbac.permissions[roleId] };
    },

    async updateUserPermissionOverrides(userId, permissions) {
        if (!this.state.rbac) this.state.rbac = JSON.parse(JSON.stringify(DEFAULT_RBAC_CONFIG));
        if (!this.state.rbac.userOverrides) this.state.rbac.userOverrides = {};
        this.state.rbac.userOverrides[userId] = permissions;
        this.saveState();
        this.notify();

        try {
            if (typeof fetch !== 'undefined') {
                const active = this.getActiveUser();
                await fetch(`/api/rbac/users/${userId}/permissions`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': active.id,
                        'x-user-role': active.roleCode
                    },
                    body: JSON.stringify({ permissions })
                });
            }
        } catch (e) {}
        return { success: true, overrides: permissions };
    },

    resetRolePermissions(roleId) {
        const fresh = DEFAULT_RBAC_CONFIG.permissions[roleId];
        if (fresh) {
            return this.updateRolePermissions(roleId, fresh);
        }
    },

    switchUser(userId) {
        this.state.activeUserId = userId;
        this.saveState();
        this.notify();
    },

    addStaff(staffMember) {
        if (!this.state.staff) this.state.staff = [];
        this.state.staff.push(staffMember);
        this.saveState();
        this.notify();
    },

    addCustomProfession(professionName) {
        if (!professionName || typeof professionName !== 'string') return;
        const trimmed = professionName.trim();
        if (!this.state.customProfessions) {
            this.state.customProfessions = ['Fabricator', 'Welder', 'Helper', 'Driver', 'Sales Executive', 'Accounts Executive', 'Site Supervisor', 'Architectural Designer', 'Powder Coating Lead'];
        }
        if (!this.state.customProfessions.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
            this.state.customProfessions.push(trimmed);
            this.saveState();
            this.notify();
        }
    },

    async createEmployee(employeeData) {
        if (!this.state.staff) this.state.staff = [];
        
        let newEmp = null;
        try {
            const res = await fetch('/api/hr/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeData)
            });
            const data = await res.json();
            if (data.success && data.employee) {
                newEmp = data.employee;
            }
        } catch (e) {
            console.warn('Backend /api/hr/employees unavailable, using local store:', e);
        }

        if (!newEmp) {
            const maxId = this.state.staff.reduce((max, s) => {
                const num = parseInt((s.id || '').replace(/\D/g, ''), 10);
                return isNaN(num) ? max : Math.max(max, num);
            }, 100);
            newEmp = {
                id: 'EMP-' + (maxId + 1),
                ...employeeData,
                status: 'pending_provisioning',
                provisioningStatus: 'pending_provisioning',
                hasLogin: false,
                username: null,
                createdAt: new Date().toISOString()
            };
        }

        const existingIdx = this.state.staff.findIndex(s => s.id === newEmp.id);
        if (existingIdx !== -1) {
            this.state.staff[existingIdx] = newEmp;
        } else {
            this.state.staff.push(newEmp);
        }

        this.saveState();
        this.notify();
        return newEmp;
    },

    async provisionEmployeeAccess(employeeId, permissions, adminId, role) {
        if (!this.state.staff) this.state.staff = [];
        const emp = this.state.staff.find(s => s.id === employeeId);
        if (!emp) throw new Error(`Employee ${employeeId} not found.`);

        let result = null;
        try {
            const res = await fetch('/api/admin/provision-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId,
                    permissions,
                    adminId: adminId || 'SB-9901',
                    role: role || emp.role || 'Staff'
                })
            });
            const data = await res.json();
            if (data.success) {
                result = data;
                result.username = data.username || (data.credentials && data.credentials.username);
                result.tempPassword = data.tempPassword || (data.credentials && (data.credentials.tempPassword || data.credentials.password));
                if (!result.credentials) {
                    result.credentials = {
                        username: result.username,
                        password: result.tempPassword,
                        tempPassword: result.tempPassword
                    };
                }
            } else {
                throw new Error(data.message || 'Provisioning failed on server.');
            }
        } catch (e) {
            console.warn('Backend /api/admin/provision-access failed or offline, generating locally:', e);
            const cleanName = (emp.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
            const phoneDigits = (emp.phone || '').replace(/\D/g, '');
            const last4Phone = phoneDigits.length >= 4 
                ? phoneDigits.slice(-4) 
                : (String(emp.id).replace(/\D/g, '').padStart(4, '0'));
            const username = cleanName + last4Phone;
            const random3Digits = Math.floor(100 + Math.random() * 900);
            const plainPassword = `STY${random3Digits}`;

            result = {
                success: true,
                username: username,
                tempPassword: plainPassword,
                credentials: {
                    username: username,
                    password: plainPassword,
                    tempPassword: plainPassword
                },
                employee: {
                    ...emp,
                    status: 'provisioned',
                    provisioningStatus: 'provisioned',
                    hasLogin: true,
                    username: username,
                    provisionedAt: new Date().toISOString()
                }
            };
        }

        // Update local state
        emp.status = 'provisioned';
        emp.provisioningStatus = 'provisioned';
        emp.hasLogin = true;
        emp.username = result.username;
        emp.permissions = permissions;
        emp.provisionedAt = new Date().toISOString();

        if (this.state.rbac) {
            if (!this.state.rbac.userOverrides) this.state.rbac.userOverrides = {};
            this.state.rbac.userOverrides[employeeId] = permissions;
            if (!this.state.rbac.auditLogs) this.state.rbac.auditLogs = [];
            this.state.rbac.auditLogs.unshift({
                id: 'AUD-PRV-' + Date.now().toString().slice(-6),
                timestamp: new Date().toISOString(),
                action: 'EMPLOYEE_CREDENTIAL_PROVISIONED',
                targetUser: result.username,
                targetEmployee: employeeId,
                details: `Generated credentials (${result.username}) and RBAC permissions for ${emp.name} (#${employeeId})`,
                adminId: adminId || 'SB-9901'
            });
        }

        this.saveState();
        this.notify();

        return result;
    },

    async syncEmployeesWithServer() {
        try {
            const res = await fetch('/api/hr/employees');
            const data = await res.json();
            if (data.success && Array.isArray(data.employees)) {
                if (!this.state.staff) this.state.staff = [];
                data.employees.forEach(serverEmp => {
                    const idx = this.state.staff.findIndex(s => s.id === serverEmp.id);
                    if (idx !== -1) {
                        this.state.staff[idx] = { ...this.state.staff[idx], ...serverEmp };
                    } else {
                        this.state.staff.push(serverEmp);
                    }
                });
                this.saveState();
                this.notify();
            }
        } catch (e) {
            console.warn('Error syncing employees with server:', e);
        }
    },

    updateStaff(staffId, updates) {
        if (!this.state.staff) return;
        const s = this.state.staff.find(item => item.id === staffId);
        if (s) {
            Object.assign(s, updates);
            this.saveState();
            this.notify();
        }
    },

    deleteStaff(staffId) {
        if (!this.state.staff) return;
        const index = this.state.staff.findIndex(s => s.id === staffId);
        if (index !== -1) {
            this.state.staff.splice(index, 1);
            if (this.state.activeUserId === staffId) {
                this.state.activeUserId = 'SB-9901';
            }
            this.saveState();
            this.notify();
        }
    },

    logStaffCheckIn(staffId, timeStr, method = 'Standard') {
        const staff = (this.state.staff || []).find(s => s.id === staffId);
        if (!staff) return;
        
        const now = new Date();
        const checkInTime = timeStr || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        staff.status = 'Present';
        staff.checkIn = checkInTime;
        staff.checkOut = '-';
        
        // 9:10 AM factory shift grace period rule
        // Shift start 9:00 AM, Grace period threshold is strictly 09:10 AM
        let isLate = false;
        let latePenalty = 0;
        try {
            const [curHours, curMinutes] = checkInTime.replace(/[^0-9:]/g, '').split(':').map(Number);
            const curIsPM = checkInTime.toLowerCase().includes('pm');
            const actualHours = (curIsPM && curHours < 12) ? curHours + 12 : (curHours === 12 && !curIsPM ? 0 : curHours);
            
            // Check past 9:10 AM (09:10 = 9 * 60 + 10 = 550 minutes)
            const actualMinutesTotal = actualHours * 60 + (curMinutes || 0);
            const graceThresholdMinutes = 9 * 60 + 10; // 09:10 AM
            
            if (actualMinutesTotal > graceThresholdMinutes) {
                isLate = true;
                staff.lateDays = (staff.lateDays || 0) + 1;
                // 1-hour wage penalty: Monthly Salary / (26 days * 8 hours)
                const hourlyWage = Math.round((staff.monthlySalary || 0) / (26 * 8));
                latePenalty = hourlyWage > 0 ? hourlyWage : 120;
                staff.latePenaltyDeduction = (staff.latePenaltyDeduction || 0) + latePenalty;
            }
        } catch (e) {}

        if (!staff.attendanceHistory) staff.attendanceHistory = [];
        staff.attendanceHistory.unshift({
            date: now.toISOString().split('T')[0],
            checkIn: checkInTime,
            checkOut: '-',
            status: 'Present',
            method: method,
            isLate: isLate,
            latePenalty: latePenalty,
            overtimeHours: 0
        });

        this.saveState();
        this.notify();
        return { isLate, checkInTime, latePenalty };
    },

    logStaffCheckOut(staffId, timeStr) {
        const staff = (this.state.staff || []).find(s => s.id === staffId);
        if (!staff) return;

        const now = new Date();
        const checkOutTime = timeStr || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        staff.checkOut = checkOutTime;

        const shiftDuration = staff.shiftHours || 8;
        const otRate = staff.overtimeRate || 150;
        let hoursWorked = 8;
        let otHours = 0;

        try {
            if (staff.checkIn && staff.checkIn !== '-') {
                const parseTime = (str) => {
                    const [h, m] = str.replace(/[^0-9:]/g, '').split(':').map(Number);
                    const isPM = str.toLowerCase().includes('pm');
                    return ((isPM && h < 12) ? h + 12 : (h === 12 && !isPM ? 0 : h)) * 60 + (m || 0);
                };
                const inMins = parseTime(staff.checkIn);
                const outMins = parseTime(checkOutTime);
                const diffMins = Math.max(0, outMins - inMins);
                hoursWorked = Math.round((diffMins / 60) * 10) / 10;
                if (hoursWorked > shiftDuration) {
                    otHours = Math.round((hoursWorked - shiftDuration) * 10) / 10;
                }
            }
        } catch (e) {}

        if (otHours > 0) {
            staff.overtimeHours = Math.round(((staff.overtimeHours || 0) + otHours) * 10) / 10;
            const otPay = Math.round(otHours * otRate);
            staff.overtime = (staff.overtime || 0) + otPay;
        }

        if (staff.attendanceHistory && staff.attendanceHistory.length > 0) {
            const todayEntry = staff.attendanceHistory[0];
            todayEntry.checkOut = checkOutTime;
            todayEntry.hoursWorked = hoursWorked;
            todayEntry.overtimeHours = otHours;
        }

        this.saveState();
        this.notify();
        return { hoursWorked, otHours, otPay: Math.round(otHours * otRate) };
    },

    logStaffOvertime(staffId, otHours, reason = 'Special Shift / Production Overtime') {
        const staff = (this.state.staff || []).find(s => s.id === staffId);
        if (!staff) return;

        const otRate = staff.overtimeRate || 150;
        const addedHours = parseFloat(otHours) || 0;
        const addedPay = Math.round(addedHours * otRate);

        staff.overtimeHours = Math.round(((staff.overtimeHours || 0) + addedHours) * 10) / 10;
        staff.overtime = (staff.overtime || 0) + addedPay;

        if (!staff.otLogs) staff.otLogs = [];
        staff.otLogs.unshift({
            date: new Date().toISOString().split('T')[0],
            hours: addedHours,
            rate: otRate,
            amount: addedPay,
            reason: reason
        });

        this.saveState();
        this.notify();
        return { addedHours, addedPay };
    },

    async createEmployee(employeeData) {
        if (!this.state.staff) this.state.staff = [];
        
        const nextIdNum = this.state.staff.reduce((max, e) => {
            const m = (e.id || '').match(/(\d+)$/);
            return m ? Math.max(max, parseInt(m[1], 10)) : max;
        }, 108) + 1;

        const role = (employeeData.role || employeeData.profession || 'Fabricator').trim();
        const department = employeeData.department || (
            role.toLowerCase().includes('account') ? 'Accounts' :
            role.toLowerCase().includes('sale') ? 'Sales & CRM' :
            role.toLowerCase().includes('design') ? 'Designing' :
            role.toLowerCase().includes('sup') ? 'Operations' :
            role.toLowerCase().includes('paint') ? 'Painting Section' :
            role.toLowerCase().includes('weld') || role.toLowerCase().includes('fab') ? 'Fabrication' : 'Operations & Fabrication'
        );

        const newEmp = {
            id: employeeData.id || `EMP-${nextIdNum}`,
            name: (employeeData.name || '').trim(),
            phone: (employeeData.phone || '').trim(),
            email: (employeeData.email || '').trim(),
            place: (employeeData.place || employeeData.address || employeeData.location || '').trim(),
            location: (employeeData.place || employeeData.address || employeeData.location || '').trim(),
            address: (employeeData.address || employeeData.place || employeeData.location || '').trim(),
            monthlySalary: parseFloat(employeeData.monthlySalary || employeeData.salary) || 25000,
            shift: employeeData.shift || '08:30 AM - 05:30 PM (8 hrs)',
            shiftHours: parseFloat(employeeData.shiftHours) || 8,
            reportingTime: employeeData.reportingTime || '08:30 AM',
            overtimeRate: parseFloat(employeeData.overtimeRate) || 150,
            role: role,
            department: department,
            photo: employeeData.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            // Requirement: Saving stores record without granting system login access yet
            status: 'pending_provisioning',
            provisioningStatus: 'pending_provisioning',
            hasLogin: false,
            permissions: {},
            createdAt: new Date().toISOString()
        };

        this.state.staff.push(newEmp);
        this.saveState();
        this.notify();

        try {
            if (typeof fetch !== 'undefined') {
                const res = await fetch('/api/hr/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newEmp)
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.employee) {
                        const idx = this.state.staff.findIndex(s => s.id === newEmp.id || s.phone === newEmp.phone);
                        if (idx !== -1) {
                            this.state.staff[idx] = { ...newEmp, ...data.employee };
                            this.saveState();
                            this.notify();
                        }
                        return data.employee;
                    }
                }
            }
        } catch (e) {
            console.error('Error creating employee on server:', e);
        }

        return newEmp;
    },

    addCustomProfession(professionName) {
        const name = (professionName || '').trim();
        if (!name) return false;
        if (!this.state.customProfessions) {
            this.state.customProfessions = ['Fabricator', 'Welder', 'Helper', 'Driver', 'Sales Executive', 'Accounts Executive', 'Site Supervisor', 'Architectural Designer', 'Powder Coating Lead'];
        }
        if (!this.state.customProfessions.includes(name)) {
            this.state.customProfessions.push(name);
            this.saveState();
            this.notify();
        }
        return true;
    },

    async syncEmployeesWithServer() {
        try {
            if (typeof fetch !== 'undefined') {
                const res = await fetch('/api/hr/employees');
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.employees) && data.employees.length > 0) {
                        data.employees.forEach(serverEmp => {
                            const idx = (this.state.staff || []).findIndex(s => s.id === serverEmp.id);
                            if (idx !== -1) {
                                this.state.staff[idx] = { ...this.state.staff[idx], ...serverEmp };
                            } else {
                                this.state.staff.push(serverEmp);
                            }
                        });
                        this.saveState();
                        this.notify();
                    }
                }
            }
        } catch (e) {}
    },

    updateOrderStatus(orderId, newStatus, newProgress) {
        const order = this.state.productionOrders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            if (typeof newProgress === 'number') order.progress = newProgress;
            this.notify();
        }
    },

    addCustomerService(serviceData) {
        if (!this.state.services) this.state.services = [];
        this.state.services.unshift(serviceData);
        this.notify();
    },

    deductCustomerAdvance(customerNameOrId, amount) {
        if (!customerNameOrId || amount <= 0) return;
        const q = String(customerNameOrId).trim().toLowerCase();
        const cust = this.state.customers.find(c => c.name.toLowerCase() === q || c.id.toLowerCase() === q);
        if (cust) {
            cust.advanceBalance = Math.max(0, (cust.advanceBalance || 0) - amount);
            this.saveState();
            this.notify();
        }
    },

    addCustomerAdvance(customerNameOrId, amount, reference = '') {
        if (!customerNameOrId || amount <= 0) return;
        const q = String(customerNameOrId).trim().toLowerCase();
        const cust = this.state.customers.find(c => c.name.toLowerCase() === q || c.id.toLowerCase() === q);
        if (cust) {
            cust.advanceBalance = (Number(cust.advanceBalance) || 0) + amount;
            this.saveState();
            this.notify();
        }
    },

    updateCustomerOutstanding(customerNameOrId, amount) {
        if (!customerNameOrId) return;
        const q = String(customerNameOrId).trim().toLowerCase();
        const cust = this.state.customers.find(c => c.name.toLowerCase() === q || c.id.toLowerCase() === q);
        if (cust) {
            cust.outstandingBalance = Math.max(0, (Number(cust.outstandingBalance) || 0) + amount);
            this.saveState();
            this.notify();
        }
    },

    recordLedgerTransaction(entry) {
        if (!this.state.customerLedger) this.state.customerLedger = [];
        this.state.customerLedger.unshift(entry);
        this.saveState();
        this.notify();
    },

    addCustomer(customerData) {
        if (!this.state.customers) this.state.customers = [];
        const name = (customerData.name || '').trim();
        if (!name) return null;
        const norm = name.toLowerCase();
        let existing = this.state.customers.find(c => (c.name && c.name.trim().toLowerCase() === norm) || (customerData.id && c.id === customerData.id));
        if (existing) {
            if (customerData.mobile && !existing.mobile) existing.mobile = customerData.mobile;
            if (customerData.address && !existing.address) existing.address = customerData.address;
            if (customerData.advanceBalance && !existing.advanceBalance) existing.advanceBalance = customerData.advanceBalance;
            this.saveState();
            this.notify();
            return existing;
        }

        const newCustomer = {
            id: customerData.id || `C-${Math.floor(100 + Math.random() * 900)}`,
            name: name,
            mobile: customerData.mobile || customerData.phone || '',
            address: customerData.address || customerData.location || '',
            orders: customerData.orders || 0,
            totalValue: customerData.totalValue || customerData.amount || 0,
            advanceBalance: parseFloat(customerData.advanceBalance) || 0,
            source: customerData.source || 'Verified Client',
            isVerified: customerData.source !== 'Price Calculation' && customerData.source !== 'Lead',
            createdAt: new Date().toISOString()
        };
        this.state.customers.push(newCustomer);
        this.saveState();
        this.notify();
        return newCustomer;
    },

    ensureCustomerFromCalculation(customerData) {
        if (!customerData || !customerData.name) return null;
        const name = customerData.name.trim();
        if (!name) return null;
        return this.addCustomer({
            ...customerData,
            name,
            source: 'Price Calculation'
        });
    },

    getUniversalCustomers() {
        const list = [];
        const seen = new Set();

        // 1. Primary Customers Database (Verified Clients)
        (this.state.customers || []).forEach(c => {
            if (!c || !c.name) return;
            const name = c.name.trim();
            const key = name.toLowerCase();
            seen.add(key);
            list.push({
                id: c.id || `C-${Math.floor(100 + Math.random() * 900)}`,
                name: name,
                mobile: c.mobile || c.phone || '',
                address: c.address || c.location || '',
                advanceBalance: parseFloat(c.advanceBalance) || 0,
                source: c.source || 'Verified Client',
                sourceType: c.source === 'Price Calculation' ? 'calculation' : 'customer',
                isVerified: c.source !== 'Price Calculation',
                raw: c
            });
        });

        // 2. Leads Database (Prospective Clients)
        (this.state.leads || []).forEach(l => {
            if (!l || !l.name) return;
            const name = l.name.trim();
            const key = name.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            list.push({
                id: l.id || `L-${Math.floor(100 + Math.random() * 900)}`,
                name: name,
                mobile: l.phone || l.mobile || '',
                address: l.address || l.location || l.interest || '',
                advanceBalance: 0,
                source: 'Lead',
                sourceType: 'lead',
                isVerified: false,
                raw: l
            });
        });

        // 3. Customers generated from Price Calculation drafts & Quotations
        if (this.state.calcStudio && this.state.calcStudio.customerName) {
            const name = this.state.calcStudio.customerName.trim();
            const key = name.toLowerCase();
            if (name && !seen.has(key)) {
                seen.add(key);
                list.push({
                    id: this.state.calcStudio.customerId || `CALC-${Math.floor(100 + Math.random() * 900)}`,
                    name: name,
                    mobile: this.state.calcStudio.customerPhone || '',
                    address: this.state.calcStudio.customerLocation || '',
                    advanceBalance: 0,
                    source: 'Price Calculation',
                    sourceType: 'calculation',
                    isVerified: false,
                    raw: this.state.calcStudio
                });
            }
        }

        if (this.state.currentQuoteDraft && this.state.currentQuoteDraft.customer) {
            const name = this.state.currentQuoteDraft.customer.trim();
            const key = name.toLowerCase();
            if (name && !seen.has(key)) {
                seen.add(key);
                list.push({
                    id: this.state.currentQuoteDraft.customerId || `DRAFT-${Math.floor(100 + Math.random() * 900)}`,
                    name: name,
                    mobile: this.state.currentQuoteDraft.customerPhone || '',
                    address: this.state.currentQuoteDraft.customerAddress || '',
                    advanceBalance: 0,
                    source: 'Price Calculation',
                    sourceType: 'calculation',
                    isVerified: false,
                    raw: this.state.currentQuoteDraft
                });
            }
        }

        (this.state.quotations || []).forEach(q => {
            if (!q || !q.customer) return;
            const name = q.customer.trim();
            const key = name.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                list.push({
                    id: q.customerId || q.id,
                    name: name,
                    mobile: q.customerPhone || '',
                    address: q.customerAddress || '',
                    advanceBalance: parseFloat(q.advancePayment) || 0,
                    source: 'Price Calculation',
                    sourceType: 'calculation',
                    isVerified: false,
                    raw: q
                });
            }
        });

        return list;
    },

    generateNextQuotationNumber(increment = false) {
        const qDefs = (this.state.settings && this.state.settings.quotationDefaults) || {};
        const prefix = qDefs.prefix !== undefined ? qDefs.prefix : 'QT-';
        const nextSeq = Number(qDefs.nextSequence) || 1001;
        const format = qDefs.numberFormat || '{PREFIX}{YYYY}-{SEQ}';
        const padding = Number(qDefs.paddingDigits) || 4;

        const now = new Date();
        const yyyy = String(now.getFullYear());
        const yy = yyyy.slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const seqStr = String(nextSeq).padStart(padding, '0');

        let generated = format
            .replace('{PREFIX}', prefix)
            .replace('{YYYY}', yyyy)
            .replace('{YY}', yy)
            .replace('{MM}', mm)
            .replace('{SEQ}', seqStr);

        const existing = this.state.quotations || [];
        if (existing.some(q => q && q.id === generated)) {
            let candidateSeq = nextSeq;
            while (existing.some(q => q && q.id === generated)) {
                candidateSeq++;
                const cSeqStr = String(candidateSeq).padStart(padding, '0');
                generated = format
                    .replace('{PREFIX}', prefix)
                    .replace('{YYYY}', yyyy)
                    .replace('{YY}', yy)
                    .replace('{MM}', mm)
                    .replace('{SEQ}', cSeqStr);
            }
            if (increment) {
                if (!this.state.settings) this.state.settings = {};
                if (!this.state.settings.quotationDefaults) this.state.settings.quotationDefaults = {};
                this.state.settings.quotationDefaults.nextSequence = candidateSeq + 1;
                this.saveState();
            }
        } else if (increment) {
            if (!this.state.settings) this.state.settings = {};
            if (!this.state.settings.quotationDefaults) this.state.settings.quotationDefaults = {};
            this.state.settings.quotationDefaults.nextSequence = nextSeq + 1;
            this.saveState();
        }

        return generated;
    },

    // Material Catalog Mutators
    addMaterial(material) {
        if (!this.state.materialCatalog) this.state.materialCatalog = [];
        if (!material.id) material.id = 'mat_' + Date.now();
        this.state.materialCatalog.push(material);
        this.saveState();
        this.notify();
    },

    updateMaterial(id, fieldOrUpdates, value) {
        if (!this.state.materialCatalog) return;
        const mat = this.state.materialCatalog.find(m => m.id === id);
        if (mat) {
            if (typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null) {
                Object.assign(mat, fieldOrUpdates);
            } else {
                mat[fieldOrUpdates] = (fieldOrUpdates === 'rate' || fieldOrUpdates === 'weightFactor' || fieldOrUpdates === 'coverage') ? (parseFloat(value) || 0) : value;
            }
            this.saveState();
            this.notify();
        }
    },

    deleteMaterial(id) {
        if (!this.state.materialCatalog) return;
        this.state.materialCatalog = this.state.materialCatalog.filter(m => m.id !== id);
        this.saveState();
        this.notify();
    },

    addMaterialGroup(groupName) {
        if (!this.state.materialGroups) this.state.materialGroups = ['Profile', 'Pipe', 'Panel', 'Hinges', 'Paint', 'Lock & Accessories', 'Hook & Rubber'];
        const trimmed = (groupName || '').trim();
        if (trimmed && !this.state.materialGroups.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
            this.state.materialGroups.push(trimmed);
            this.saveState();
            this.notify();
        }
    },

    deleteMaterialGroup(groupName) {
        if (!this.state.materialGroups) return;
        this.state.materialGroups = this.state.materialGroups.filter(g => g.toLowerCase() !== groupName.toLowerCase());
        this.saveState();
        this.notify();
    },

    // Quotation Multi-Product Draft Mutators
    addDraftQuoteItem(item) {
        if (!this.state.currentQuoteDraft) {
            this.state.currentQuoteDraft = { customer: '', customerId: '', customerPhone: '', customerAddress: '', items: [] };
        }
        this.state.currentQuoteDraft.items.push(item);
        this.saveState();
        this.notify();
    },

    clearDraftQuote() {
        this.state.currentQuoteDraft = { customer: '', customerId: '', customerPhone: '', customerAddress: '', items: [] };
        this.saveState();
        this.notify();
    },

    // Fabrication Calculation Engine Mutators
    updateFabricationRate(key, value) {
        if (!this.state.fabricationRates) {
            this.state.fabricationRates = {
                unitWeightRatioKgPerMeter: 2.9167,
                profileKgRate: 180,
                pipeMeterRate: 95,
                grillPitchMm: 120,
                holePunchRate: 5,
                paintBaselineCost: 150,
                paintBaselineAreaSqM: 0.70,
                unitHingeRate: 85,
                labourTiers: {
                    baseAssembly: 150,
                    shutterFabrication: 150,
                    partitionCharge: 50,
                    cuttingHandlingSurcharge: 150
                }
            };
        }
        this.state.fabricationRates[key] = parseFloat(value) || 0;
        this.saveState();
        this.notify();
    },

    updateLabourTier(key, value) {
        if (!this.state.fabricationRates) this.state.fabricationRates = {};
        if (!this.state.fabricationRates.labourTiers) {
            this.state.fabricationRates.labourTiers = {
                baseAssembly: 150,
                shutterFabrication: 150,
                partitionCharge: 50,
                cuttingHandlingSurcharge: 150
            };
        }
        this.state.fabricationRates.labourTiers[key] = parseFloat(value) || 0;
        this.saveState();
        this.notify();
    },

    saveFabricationCalculation(calculation) {
        if (!this.state.savedCalculations) this.state.savedCalculations = [];
        this.state.savedCalculations.unshift(calculation);
        this.saveState();
        this.notify();
    },

    // Site Visit Mutators
    addSiteVisit(visit) {
        if (!this.state.siteVisits) this.state.siteVisits = [];
        this.state.siteVisits.unshift(visit);
        this.saveState();
        this.notify();
    },

    updateSiteVisit(id, updates) {
        if (!this.state.siteVisits) return;
        const v = this.state.siteVisits.find(item => item.id === id);
        if (v) {
            Object.assign(v, updates);
            this.saveState();
            this.notify();
        }
    },

    addSiteVisitStaffUpdate(visitId, updateData) {
        if (!this.state.siteVisits) return;
        const v = this.state.siteVisits.find(item => item.id === visitId);
        if (v) {
            if (!v.staffUpdates) v.staffUpdates = [];
            v.staffUpdates.unshift(updateData);
            if (updateData.status) v.status = updateData.status;
            this.saveState();
            this.notify();
        }
    },

    // Service Visit Mutators & Verification Workflow
    addServiceVisit(service) {
        if (!this.state.services) this.state.services = [];
        this.state.services.unshift(service);
        this.saveState();
        this.notify();
    },

    updateServiceVisit(id, updates) {
        if (!this.state.services) return;
        const s = this.state.services.find(item => item.id === id);
        if (s) {
            Object.assign(s, updates);
            this.saveState();
            this.notify();
        }
    },

    completeServiceByTech(serviceId, resolutionData) {
        if (!this.state.services) return;
        const s = this.state.services.find(item => item.id === serviceId);
        if (s) {
            s.resolutionDetails = resolutionData;
            s.status = 'Completed by Tech'; // Moves to Sales Verification stage
            this.saveState();
            this.notify();
        }
    },

    approveServiceBySales(serviceId, approvalData) {
        if (!this.state.services) return;
        const s = this.state.services.find(item => item.id === serviceId);
        if (s) {
            s.approvalDetails = approvalData;
            s.status = approvalData.status || 'Approved'; // 'Approved' or 'Ready'
            this.saveState();
            this.notify();
        }
    },

    // --- LEADS MANAGEMENT & CRM WORKFLOW ---
    async syncLeads() {
        try {
            if (typeof fetch !== 'undefined') {
                const res = await fetch('/api/leads');
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.leads)) {
                        this.state.leads = data.leads;
                        this.saveState();
                        this.notify();
                        return this.state.leads;
                    }
                }
            }
        } catch (e) {
            console.error('Failed to sync leads from server:', e);
        }
        return this.state.leads || [];
    },

    getLeads() {
        return this.state.leads || [];
    },

    async addLead(leadData) {
        if (!this.state.leads) this.state.leads = [];
        try {
            if (typeof fetch !== 'undefined') {
                const res = await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(leadData)
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.lead) {
                        this.state.leads.unshift(data.lead);
                        this.saveState();
                        this.notify();
                        return { success: true, lead: data.lead };
                    }
                }
            }
        } catch (e) {
            console.error('Error creating lead via API:', e);
        }

        // Fallback local creation
        const newLead = {
            id: 'LD-' + (1000 + this.state.leads.length + 1),
            ...leadData,
            status: leadData.status || 'New Lead',
            date: leadData.date || new Date().toISOString().split('T')[0],
            timeline: [
                {
                    timestamp: new Date().toISOString(),
                    action: 'LEAD_CREATED',
                    notes: 'Lead created in offline mode.',
                    user: (this.state.user && this.state.user.name) || 'Admin'
                }
            ]
        };
        this.state.leads.unshift(newLead);
        this.saveState();
        this.notify();
        return { success: true, lead: newLead };
    },

    async updateLead(id, updates) {
        if (!this.state.leads) return null;
        const idx = this.state.leads.findIndex(l => l.id === id);
        if (idx !== -1) {
            this.state.leads[idx] = { ...this.state.leads[idx], ...updates };
            this.saveState();
            this.notify();
        }

        try {
            if (typeof fetch !== 'undefined') {
                const res = await fetch(`/api/leads/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.lead && idx !== -1) {
                        this.state.leads[idx] = data.lead;
                        this.saveState();
                        this.notify();
                        return data.lead;
                    }
                }
            }
        } catch (e) {
            console.error('Error updating lead via API:', e);
        }
        return idx !== -1 ? this.state.leads[idx] : null;
    },

    async updateLeadStatus(id, newStatus, reason = '') {
        return await this.updateLead(id, {
            status: newStatus,
            reason: reason,
            transitionNotes: `Moved to ${newStatus}${reason ? ' (' + reason + ')' : ''}`
        });
    },

    async deleteLead(id) {
        if (!this.state.leads) return;
        this.state.leads = this.state.leads.filter(l => l.id !== id);
        this.saveState();
        this.notify();

        try {
            if (typeof fetch !== 'undefined') {
                await fetch(`/api/leads/${id}`, { method: 'DELETE' });
            }
        } catch (e) {}
    },

    subscribe(callback) {
        this.listeners.push(callback);
    },

    notify() {
        this.saveState(); // Auto-save on every update
        this.listeners.forEach(cb => cb(this.state));
    },

    // =========================================================================
    // ACCOUNTS CONFIGURATION & ADMIN MODIFICATION ENGINE
    // =========================================================================
    getAccountsConfigurations() {
        if (!this.state.accountsConfigurations) {
            this.state.accountsConfigurations = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS_CONFIGURATIONS));
        }
        return this.state.accountsConfigurations;
    },

    getModuleConfig(moduleId) {
        const configs = this.getAccountsConfigurations();
        return configs[moduleId] || null;
    },

    async syncAccountsConfigurationsWithServer() {
        try {
            if (typeof fetch !== 'undefined') {
                const res = await fetch('/api/configurations');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.success && data.configurations) {
                        this.state.accountsConfigurations = data.configurations;
                        if (data.auditLogs && Array.isArray(data.auditLogs)) {
                            this.state.configurationAuditLogs = data.auditLogs;
                        }
                        this.saveState();
                        this.notify();
                    }
                }
            }
        } catch (e) {
            // Local fallback
        }
    },

    async updateModuleConfig(moduleId, newConfig, adminId, adminName) {
        const admin = this.getActiveUser();
        const aId = adminId || admin.id || 'SB-9901';
        const aName = adminName || admin.name || 'Shamsudheen V.K.';

        if (!this.state.accountsConfigurations) {
            this.getAccountsConfigurations();
        }
        const current = this.state.accountsConfigurations[moduleId] || {};
        const diff = [];
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
        checkDiff('', current, newConfig);

        const updated = {
            ...current,
            ...newConfig,
            general: { ...(current.general || {}), ...(newConfig.general || {}) },
            fieldRules: { ...(current.fieldRules || {}), ...(newConfig.fieldRules || {}) },
            permissions: { ...(current.permissions || {}), ...(newConfig.permissions || {}) },
            status: 'Customized',
            lastModified: new Date().toISOString(),
            modifiedBy: `${aName} (${aId})`
        };

        this.state.accountsConfigurations[moduleId] = updated;

        const logEntry = {
            id: 'LOG-' + Date.now(),
            timestamp: new Date().toISOString(),
            adminId: aId,
            adminName: aName,
            action: 'UPDATE',
            moduleId,
            moduleName: updated.name,
            details: `Updated ${diff.length} configuration parameter(s) for ${updated.name}.`,
            diff
        };
        if (!this.state.configurationAuditLogs) this.state.configurationAuditLogs = [];
        this.state.configurationAuditLogs.unshift(logEntry);

        this.saveState();
        this.notify();

        try {
            if (typeof fetch !== 'undefined') {
                const res = await fetch(`/api/configurations/${moduleId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ config: newConfig, adminId: aId, adminName: aName })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.configuration) {
                        this.state.accountsConfigurations[moduleId] = data.configuration;
                        if (data.log) this.state.configurationAuditLogs[0] = data.log;
                    }
                }
            }
        } catch (e) {}

        return { success: true, configuration: updated, log: logEntry };
    },

    async resetModuleConfig(moduleId, adminId, adminName, password) {
        const admin = this.getActiveUser();
        const aId = adminId || admin.id || 'SB-9901';
        const aName = adminName || admin.name || 'Shamsudheen V.K.';

        if (!DEFAULT_ACCOUNTS_CONFIGURATIONS[moduleId]) {
            return { success: false, message: 'Module defaults not found.' };
        }

        const oldConfig = (this.state.accountsConfigurations && this.state.accountsConfigurations[moduleId]) || {};
        const restored = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS_CONFIGURATIONS[moduleId]));
        restored.status = 'Default';
        restored.lastModified = new Date().toISOString();
        restored.modifiedBy = `${aName} (${aId})`;

        if (!this.state.accountsConfigurations) this.getAccountsConfigurations();
        this.state.accountsConfigurations[moduleId] = restored;

        const logEntry = {
            id: 'LOG-' + Date.now(),
            timestamp: new Date().toISOString(),
            adminId: aId,
            adminName: aName,
            action: 'MODULE_RESET',
            moduleId,
            moduleName: restored.name,
            details: `Reset configuration for ${restored.name} to original factory default settings.`,
            diff: [{ param: 'Module State', oldVal: oldConfig.status || 'Customized', newVal: 'Default' }]
        };
        if (!this.state.configurationAuditLogs) this.state.configurationAuditLogs = [];
        this.state.configurationAuditLogs.unshift(logEntry);

        this.saveState();
        this.notify();

        try {
            if (typeof fetch !== 'undefined') {
                const res = await fetch(`/api/admin/reset-configurations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ moduleId, adminId: aId, password })
                });
                const data = await res.json();
                if (data && data.configurations) {
                    this.state.accountsConfigurations = data.configurations;
                    this.saveState();
                    this.notify();
                }
            }
        } catch (e) {}

        return { success: true, configuration: restored, log: logEntry };
    },

    async resetAllConfigurations(adminId, adminName, confirmToken, password) {
        const admin = this.getActiveUser();
        const aId = adminId || admin.id || 'SB-9901';
        const aName = adminName || admin.name || 'Shamsudheen V.K.';

        const freshDefaults = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS_CONFIGURATIONS));
        Object.keys(freshDefaults).forEach(k => {
            freshDefaults[k].status = 'Default';
            freshDefaults[k].lastModified = new Date().toISOString();
            freshDefaults[k].modifiedBy = `${aName} (${aId})`;
        });

        this.state.accountsConfigurations = freshDefaults;

        const logEntry = {
            id: 'LOG-' + Date.now(),
            timestamp: new Date().toISOString(),
            adminId: aId,
            adminName: aName,
            action: 'GLOBAL_RESET',
            moduleId: 'all',
            moduleName: 'All 14 ERP Modules',
            details: 'Master Admin Global Reset executed. Restored all 14 module configurations to factory baseline defaults.',
            diff: [{ param: 'All Modules', oldVal: 'Custom Configuration State', newVal: 'Baseline Factory Defaults' }]
        };
        if (!this.state.configurationAuditLogs) this.state.configurationAuditLogs = [];
        this.state.configurationAuditLogs.unshift(logEntry);

        this.saveState();
        this.notify();

        try {
            if (typeof fetch !== 'undefined') {
                const res = await fetch('/api/admin/reset-configurations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ moduleId: 'all', confirmToken, adminId: aId, password })
                });
                const data = await res.json();
                if (data && data.configurations) {
                    this.state.accountsConfigurations = data.configurations;
                    this.saveState();
                    this.notify();
                }
            }
        } catch (e) {}

        return { success: true, configurations: freshDefaults, log: logEntry };
    },

    getAuditLogs() {
        return this.state.configurationAuditLogs || [];
    },

    navigate(view) {
        this.state.currentView = view;
        this.notify();
    }
};

// Initialize persistence on load
Store.initPersistence();

// Expose globally for debugging and Action handlers
window.Store = Store;
