import React, { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * SalesAdvanceAdjustment - Modular ERP React Component
 * 
 * Provides financial logic and UI for:
 * 1. Customer advance pool detection & unallocated balance display
 * 2. Partial deduction with manual override and presets (Max, 50%, Clear)
 * 3. Residual wallet balance auto-recalculation
 * 4. Net balance due computation
 * 5. Accounts Receivable routing for credit payments vs Cash / Bank Transfer
 * 6. Non-bubbling, zero-jumping event handling with stable state management
 */
export const SalesAdvanceAdjustment = ({
    customerId,
    customerName,
    availableAdvancePool = 0,
    invoiceGrandTotal = 0,
    initialAppliedAdvance = 0,
    initialPaymentMode = 'CREDIT',
    onAdvanceChange,
    onPaymentModeChange,
    onSaveInvoice
}) => {
    // Stable State Management
    const [advanceEnabled, setAdvanceEnabled] = useState(initialAppliedAdvance > 0 || availableAdvancePool > 0);
    const [appliedAdvance, setAppliedAdvance] = useState(initialAppliedAdvance);
    const [paymentMode, setPaymentMode] = useState(initialPaymentMode);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Synchronize if customer's advance pool changes
    useEffect(() => {
        if (availableAdvancePool > 0 && appliedAdvance === 0 && advanceEnabled) {
            const defaultAllocation = Math.min(availableAdvancePool, invoiceGrandTotal);
            setAppliedAdvance(defaultAllocation);
            if (onAdvanceChange) onAdvanceChange(defaultAllocation);
        }
    }, [availableAdvancePool, invoiceGrandTotal, advanceEnabled]);

    // Financial Calculations
    const maxApplicable = useMemo(() => {
        return Math.min(availableAdvancePool, invoiceGrandTotal);
    }, [availableAdvancePool, invoiceGrandTotal]);

    const activeAdvance = advanceEnabled ? Number(appliedAdvance) || 0 : 0;
    
    // Residual advance remaining in customer wallet for future orders
    const residualWalletBalance = useMemo(() => {
        return Math.max(0, availableAdvancePool - activeAdvance);
    }, [availableAdvancePool, activeAdvance]);

    // Net balance due = Invoice Total - Applied Advance
    const netBalanceDue = useMemo(() => {
        return Math.max(0, invoiceGrandTotal - activeAdvance);
    }, [invoiceGrandTotal, activeAdvance]);

    // Handlers with explicit event containment to prevent page jumps / bubbling
    const handleToggleAdvance = useCallback((e) => {
        e.stopPropagation();
        const nextState = !advanceEnabled;
        setAdvanceEnabled(nextState);
        if (!nextState) {
            setAppliedAdvance(0);
            if (onAdvanceChange) onAdvanceChange(0);
        } else {
            const autoApplied = Math.min(availableAdvancePool, invoiceGrandTotal);
            setAppliedAdvance(autoApplied);
            if (onAdvanceChange) onAdvanceChange(autoApplied);
        }
    }, [advanceEnabled, availableAdvancePool, invoiceGrandTotal, onAdvanceChange]);

    const handleManualOverride = useCallback((e) => {
        e.stopPropagation();
        const rawVal = e.target.value;
        const numVal = parseFloat(rawVal) || 0;
        
        // Allow user to apply only a portion up to the available pool
        const clampedVal = Math.min(Math.max(0, numVal), availableAdvancePool);
        setAppliedAdvance(clampedVal);
        setAdvanceEnabled(true);
        if (onAdvanceChange) onAdvanceChange(clampedVal);
    }, [availableAdvancePool, onAdvanceChange]);

    const handlePreset = useCallback((type, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        let target = 0;
        if (type === 'full') {
            target = maxApplicable;
        } else if (type === 'half') {
            target = Math.round(availableAdvancePool / 2);
        } else if (type === 'clear') {
            target = 0;
        }
        setAppliedAdvance(target);
        setAdvanceEnabled(target > 0);
        if (onAdvanceChange) onAdvanceChange(target);
    }, [maxApplicable, availableAdvancePool, onAdvanceChange]);

    const handleSelectPaymentMode = useCallback((mode, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setPaymentMode(mode);
        if (onPaymentModeChange) onPaymentModeChange(mode);
    }, [onPaymentModeChange]);

    const handleFormSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            if (onSaveInvoice) {
                await onSaveInvoice({
                    appliedAdvance: activeAdvance,
                    residualWalletBalance,
                    netBalanceDue,
                    paymentMode,
                    routedToAccountsReceivable: paymentMode === 'CREDIT' && netBalanceDue > 0
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [activeAdvance, residualWalletBalance, netBalanceDue, paymentMode, onSaveInvoice]);

    return (
        <div className="erp-advance-adjustment-container" style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.25rem',
            color: '#f8fafc',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
            
            {/* 1. Customer Advance Pool Detection Widget */}
            <div className="customer-advance-widget" style={{
                background: availableAdvancePool > 0 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.08))' 
                    : 'rgba(255, 255, 255, 0.02)',
                border: availableAdvancePool > 0 ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1rem', color: availableAdvancePool > 0 ? '#34d399' : '#94a3b8' }}>💼</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>Customer Advance Pool</span>
                    </div>
                    <span style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: availableAdvancePool > 0 ? '#34d399' : '#94a3b8',
                        background: availableAdvancePool > 0 ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        padding: '3px 8px',
                        borderRadius: '6px'
                    }}>
                        Available Advance: ₹{availableAdvancePool.toLocaleString('en-IN')}
                    </span>
                </div>

                {availableAdvancePool > 0 ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={(e) => handlePreset('full', e)}
                            style={{
                                flex: 1, padding: '5px 8px', fontSize: '0.75rem', fontWeight: 700,
                                background: 'rgba(16, 185, 129, 0.25)', border: '1px solid #10b981',
                                color: '#34d399', borderRadius: '5px', cursor: 'pointer'
                            }}
                        >
                            Apply Max Needed (₹{maxApplicable.toLocaleString('en-IN')})
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handlePreset('half', e)}
                            style={{
                                flex: 1, padding: '5px 8px', fontSize: '0.75rem', fontWeight: 600,
                                background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#cbd5e1', borderRadius: '5px', cursor: 'pointer'
                            }}
                        >
                            Apply 50% (₹{Math.round(availableAdvancePool / 2).toLocaleString('en-IN')})
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handlePreset('clear', e)}
                            style={{
                                padding: '5px 10px', fontSize: '0.75rem', fontWeight: 600,
                                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#f87171', borderRadius: '5px', cursor: 'pointer'
                            }}
                        >
                            Clear
                        </button>
                    </div>
                ) : (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                        No unallocated ledger advance credits available for {customerName || 'this customer'}.
                    </div>
                )}
            </div>

            {/* 2. Emerald Green Advance Payment Adjustment Card */}
            <div className="advance-payment-card" style={{
                border: advanceEnabled ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                background: advanceEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                boxShadow: advanceEnabled ? '0 0 16px rgba(16, 185, 129, 0.22)' : 'none',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                transition: 'all 0.25s ease'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: advanceEnabled ? '0.75rem' : '0' }}>
                    <label 
                        onClick={(e) => e.stopPropagation()} 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, userSelect: 'none' }}
                    >
                        <input
                            type="checkbox"
                            checked={advanceEnabled}
                            onChange={handleToggleAdvance}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: advanceEnabled ? '#34d399' : '#f8fafc' }}>
                            Advance Payment
                        </span>
                    </label>
                    <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: advanceEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        color: advanceEnabled ? '#34d399' : '#94a3b8'
                    }}>
                        {advanceEnabled ? 'ACTIVE DEDUCTION' : 'OPTIONAL'}
                    </span>
                </div>

                {advanceEnabled && (
                    <>
                        {/* Partial Deduction Manual Input */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div>
                                <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>Applied Advance Amount:</span>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Manual override enabled</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#34d399', fontWeight: 700 }}>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    max={availableAdvancePool}
                                    value={appliedAdvance || ''}
                                    onChange={handleManualOverride}
                                    placeholder="0.00"
                                    style={{
                                        width: '130px',
                                        background: 'rgba(0, 0, 0, 0.45)',
                                        color: '#ffffff',
                                        border: '1.5px solid #10b981',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        textAlign: 'right',
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Residual Wallet Balance */}
                        {availableAdvancePool > 0 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px dashed rgba(16, 185, 129, 0.35)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                marginBottom: '0.75rem',
                                fontSize: '0.78rem'
                            }}>
                                <span style={{ color: '#94a3b8' }}>Residual Advance in Wallet:</span>
                                <strong style={{ color: '#34d399', fontWeight: 700 }}>
                                    ₹{residualWalletBalance.toLocaleString('en-IN')} remaining for future orders
                                </strong>
                            </div>
                        )}

                        {/* Net Balance Due Card */}
                        <div style={{
                            background: netBalanceDue > 0 
                                ? (paymentMode === 'CREDIT' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)') 
                                : 'rgba(16, 185, 129, 0.2)',
                            padding: '0.75rem 0.9rem',
                            borderRadius: '8px',
                            border: netBalanceDue > 0 
                                ? (paymentMode === 'CREDIT' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)') 
                                : '1px solid rgba(16, 185, 129, 0.4)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{
                                        color: netBalanceDue > 0 ? (paymentMode === 'CREDIT' ? '#fca5a5' : '#fbbf24') : '#34d399',
                                        fontSize: '0.88rem',
                                        fontWeight: 700
                                    }}>
                                        Net Balance Due
                                    </span>
                                    <div style={{
                                        fontSize: '0.72rem',
                                        color: paymentMode === 'CREDIT' && netBalanceDue > 0 ? '#f87171' : '#94a3b8',
                                        marginTop: '2px'
                                    }}>
                                        {netBalanceDue === 0 
                                            ? '✓ Fully settled with advance credit' 
                                            : (paymentMode === 'CREDIT' 
                                                ? `⚡ ₹${netBalanceDue.toLocaleString('en-IN')} will route to Accounts Receivable` 
                                                : 'Due on delivery / maturity date')}
                                    </div>
                                </div>
                                <span style={{
                                    color: netBalanceDue > 0 ? (paymentMode === 'CREDIT' ? '#ef4444' : '#fbbf24') : '#34d399',
                                    fontSize: '1.25rem',
                                    fontWeight: 800
                                }}>
                                    ₹{netBalanceDue.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 3. Payment Mode Routing Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Payment Mode*
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {['CREDIT', 'CASH', 'BANK_TRANSFER', 'CHEQUE'].map((mode) => {
                        const isActive = paymentMode === mode;
                        const label = mode === 'BANK_TRANSFER' ? 'Bank Transfer' : mode;
                        return (
                            <button
                                key={mode}
                                type="button"
                                onClick={(e) => handleSelectPaymentMode(mode, e)}
                                style={{
                                    padding: '0.55rem',
                                    textAlign: 'center',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.82rem',
                                    background: isActive ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                                    border: isActive ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.12)',
                                    color: isActive ? '#ffffff' : '#94a3b8',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. Action Save Button */}
            <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFormSubmit}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.2s ease'
                }}
            >
                {isSubmitting ? 'Posting Ledger Entries...' : 'Confirm Invoice & Ledger Allocation'}
            </button>
        </div>
    );
};

export default SalesAdvanceAdjustment;
