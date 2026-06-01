import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Trash2,
    Printer,
    MessageCircle,
    DollarSign,
    Check,
    X,
    Pencil,
} from 'lucide-react';
import { budgetsApi, paymentsApi, doctorsApi, vouchersApi, supabase } from '../../lib/supabase';
import { printVoucherToIframe } from '../common/PrintableVoucher';
import ServiceSelector from '../appointments/ServiceSelector';
import PrintableBudget from '../common/PrintableBudget';
import MultiPaymentModal from './MultiPaymentModal';
import { useAuth } from '../../contexts/useAuth';

// ─── FEATURE FLAG ───────────────────────────────────────────────────────────
// Set to true to re-enable the global discount UI and calculations.
const GLOBAL_DISCOUNT_ENABLED = false;
// ────────────────────────────────────────────────────────────────────────────

/**
 * BudgetDetails
 * Renders a single budget card with full details and actions.
 * Used in TreatmentPlans to show the associated budget.
 */
export default function BudgetDetails({ budget, patientId, patientName, patientPhone, planTitle, onUpdate }) {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(true); // Default expanded for "Superpresupuesto" look
    const [addingItem, setAddingItem] = useState(false);

    // New Item State
    const [newItemData, setNewItemData] = useState({
        service: null, toothNumber: '', quantity: 1, price: '',
        discount: 0, discountType: 'fixed',
    });

    // Payment State
    const [paymentModal, setPaymentModal] = useState({ open: false, item: null });
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('VISA');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [paymentDoctorId, setPaymentDoctorId] = useState('');
    const [doctorsList, setDoctorsList] = useState([]);

    // Confirm Modal
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
    const [isPaying, setIsPaying] = useState(false);

    // Print state
    const [printingBudget, setPrintingBudget] = useState(null);
    const [printingItemIds, setPrintingItemIds] = useState(null);
    const [realActiveDoctor, setRealActiveDoctor] = useState(user);

    // Voucher / Multi-payment state
    const [multiPayModal, setMultiPayModal] = useState(false);
    const [editVoucherData, setEditVoucherData] = useState(null);
    const [isEditingVoucher, setIsEditingVoucher] = useState(false);

    const items = budget?.items || budget?.budget_items || [];
    const [selectedForPrint, setSelectedForPrint] = useState([]);

    useEffect(() => {
        if (items) {
            setSelectedForPrint(items.map(item => item.id));
        }
    }, [items?.length]);

    // Preload the active doctor's profile on mount to cache the signature image
    // This solves the issue where Chromium drops images from print preview if rendered too fast
    useEffect(() => {
        const fetchInitialDoctor = async () => {
            if (user?.name) {
                try {
                    const docs = await doctorsApi.getAll();
                    setDoctorsList(docs.filter(d => d.active !== false));
                    const userParts = user.name.toLowerCase().split(' ');
                    const userFirst = userParts[0];
                    const userLast = userParts[userParts.length - 1];

                    const match = docs.find(d => {
                        const dbName = d.name.toLowerCase();
                        return dbName === user.name.toLowerCase() ||
                            (dbName.includes(userFirst) && dbName.includes(userLast));
                    });

                    if (match) setRealActiveDoctor(match);
                } catch (e) {
                    console.error('Error preloading doctor profile for print', e);
                }
            }
        };
        fetchInitialDoctor();
    }, [user?.name]);

    const handlePrint = async (printBudget, itemIds = null) => {
        // We already preloaded the doctor, but we re-fetch just in case it changed recently
        try {
            if (user?.name) {
                const docs = await doctorsApi.getAll();
                // Robust matching to handle slight name variations (e.g., "Luciana Renata..." vs "Luciana...")
                const userParts = user.name.toLowerCase().split(' ');
                const userFirst = userParts[0];
                const userLast = userParts[userParts.length - 1];

                const match = docs.find(d => {
                    const dbName = d.name.toLowerCase();
                    return dbName === user.name.toLowerCase() ||
                        (dbName.includes(userFirst) && dbName.includes(userLast));
                });

                if (match) setRealActiveDoctor(match);
            }
        } catch (e) {
            console.error('Error fetching latest doctor profile for print', e);
        }

        setPrintingBudget(printBudget);
        setPrintingItemIds(itemIds);

        // Give the DOM enough time to load the Logo and Signature PNG before opening print preview
        setTimeout(() => {
            window.print();
            // Critical for iOS: We WAIT a few seconds before removing the portal
            // because in mobile Safari/Chrome, print() is non-blocking and immediate removal
            // results in blank pages.
            setTimeout(() => {
                setPrintingBudget(null);
                setPrintingItemIds(null);
            }, 6000);
        }, 1200);
    };

    // Inline Discount Editing
    const [editingDiscount, setEditingDiscount] = useState(null); // item id
    const [editDiscountVal, setEditDiscountVal] = useState('');
    const [editDiscountType, setEditDiscountType] = useState('fixed');

    // Inline Unit Price Editing
    const [editingUnitPrice, setEditingUnitPrice] = useState(null);
    const [editUnitPriceVal, setEditUnitPriceVal] = useState('');

    // Inline Quantity Editing
    const [editingQuantity, setEditingQuantity] = useState(null);
    const [editQuantityVal, setEditQuantityVal] = useState('');

    // Inline Global Discount Editing
    const [editingGlobalDiscount, setEditingGlobalDiscount] = useState(false);
    const [editGlobalDiscountVal, setEditGlobalDiscountVal] = useState('');
    const [editGlobalDiscountType, setEditGlobalDiscountType] = useState('fixed');
    const globalDiscountActiveRef = useRef(false);
    // Local state so UI updates immediately without waiting for parent re-fetch
    const [savedGlobalDiscount, setSavedGlobalDiscount] = useState(parseFloat(budget.global_discount || 0));
    const [savedGlobalDiscountType, setSavedGlobalDiscountType] = useState(budget.global_discount_type || 'fixed');

    const startEditDiscount = (item) => {
        setEditingDiscount(item.id);
        setEditDiscountVal(item.discount || 0);
        setEditDiscountType(item.discount_type || 'fixed');
    };

    const startEditUnitPrice = (item) => {
        const hasPaid = parseFloat(item.paid_amount || 0) > 0;
        if (hasPaid) return;
        setEditingUnitPrice(item.id);
        setEditUnitPriceVal(parseFloat(item.unit_price) || 0);
    };

    const saveUnitPrice = async (itemId) => {
        if (editingUnitPrice !== itemId) return;
        const newPrice = parseFloat(editUnitPriceVal);
        if (isNaN(newPrice) || newPrice <= 0) {
            setEditingUnitPrice(null);
            return;
        }
        try {
            setEditingUnitPrice(null);
            await budgetsApi.updateItem(itemId, { unit_price: newPrice });
            onUpdate?.();
        } catch (err) {
            console.error('Error updating unit price:', err);
            alert('Error al guardar el precio unitario');
            onUpdate?.();
        }
    };

    const startEditQuantity = (item) => {
        const hasPaid = parseFloat(item.paid_amount || 0) > 0;
        if (hasPaid) return;
        setEditingQuantity(item.id);
        setEditQuantityVal(item.quantity || 1);
    };

    const saveQuantity = async (itemId) => {
        if (editingQuantity !== itemId) return;
        const newQty = parseInt(editQuantityVal);
        if (isNaN(newQty) || newQty < 1) {
            setEditingQuantity(null);
            return;
        }
        try {
            setEditingQuantity(null);
            await budgetsApi.updateItem(itemId, { quantity: newQty });
            onUpdate?.();
        } catch (err) {
            console.error('Error updating quantity:', err);
            alert('Error al guardar la cantidad');
            onUpdate?.();
        }
    };

    const saveDiscount = async (itemId) => {
        if (editingDiscount !== itemId) return;

        const newDiscount = parseFloat(editDiscountVal) || 0;
        const newType = editDiscountType;

        try {
            // Optimistic update: notify parent or update local if we had local state
            // For now, call the API and clear editing state immediately for smoothness
            setEditingDiscount(null);
            
            await budgetsApi.updateItem(itemId, {
                discount: newDiscount,
                discount_type: newType,
            });
            
            // Background update to sync everything else (totals, etc.)
            onUpdate?.();
        } catch (err) {
            console.error('Error updating discount:', err);
            alert('Error al guardar el descuento');
            onUpdate?.(); // Revert to server state
        }
    };

    // Calculations — reads savedGlobalDiscount (local state) for instant UI update
    const getBudgetTotals = (items) => {
        let subtotal = 0, totalDiscount = 0, paid = 0;
        (items || []).forEach(item => {
            const rawPrice = parseFloat(item.unit_price) * (item.quantity || 1);
            subtotal += rawPrice;
            const discountVal = parseFloat(item.discount || 0);
            const itemDiscountAmount = (item.discount_type === 'percent')
                ? (rawPrice * discountVal / 100) : discountVal;
            totalDiscount += itemDiscountAmount;
            paid += parseFloat(item.paid_amount || 0);
        });
        const totalAfterItems = Math.max(0, subtotal - totalDiscount);
        // Global discount — only applied when feature flag is enabled
        const globalDiscountAmount = GLOBAL_DISCOUNT_ENABLED
            ? (savedGlobalDiscountType === 'percent'
                ? (totalAfterItems * savedGlobalDiscount / 100)
                : savedGlobalDiscount)
            : 0;
        const total = Math.max(0, totalAfterItems - globalDiscountAmount);
        const balance = Math.max(0, total - paid);
        return { subtotal, discountAmount: totalDiscount, totalAfterItems, globalDiscountAmount, total, paid, balance };
    };

    const totals = getBudgetTotals(budget.items || []);

    const startEditGlobalDiscount = () => {
        globalDiscountActiveRef.current = true;
        setEditingGlobalDiscount(true);
        setEditGlobalDiscountVal(savedGlobalDiscount > 0 ? savedGlobalDiscount : '');
        setEditGlobalDiscountType(savedGlobalDiscountType);
    };

    const saveGlobalDiscount = async (val, type) => {
        if (!globalDiscountActiveRef.current) return;
        globalDiscountActiveRef.current = false;
        setEditingGlobalDiscount(false);
        const numVal = parseFloat(val) || 0;
        // Update local state immediately so UI reflects change without parent re-fetch
        setSavedGlobalDiscount(numVal);
        setSavedGlobalDiscountType(type);
        try {
            const { error } = await supabase
                .from('budgets')
                .update({ global_discount: numVal, global_discount_type: type })
                .eq('id', budget.id);
            if (error) throw error;
            onUpdate?.(); // background sync
        } catch (err) {
            console.error('[GlobalDiscount] Error:', err);
            alert('Error al guardar: ' + (err.message || JSON.stringify(err)));
            // Revert local state on error
            setSavedGlobalDiscount(parseFloat(budget.global_discount || 0));
            setSavedGlobalDiscountType(budget.global_discount_type || 'fixed');
        }
    };

    // Actions
    const handleAddItem = async () => {
        if (!newItemData.service) return;
        try {
            await budgetsApi.addItem({
                budget_id: budget.id,
                service_id: newItemData.service.id,
                service_name: newItemData.service.name,
                tooth_number: newItemData.toothNumber || null,
                quantity: newItemData.quantity || 1,
                unit_price: newItemData.price || newItemData.service.price,
                discount: newItemData.discount || 0,
                discount_type: newItemData.discountType || 'fixed',
            });
            setNewItemData({ service: null, toothNumber: '', quantity: 1, price: '', discount: 0, discountType: 'fixed' });
            setAddingItem(false);
            onUpdate?.();
        } catch (err) {
            console.error('Error adding item:', err);
            alert('Error al agregar item');
        }
    };

    const handleDeleteSelectedItems = () => {
        if (selectedForPrint.length === 0) return;
        setConfirmModal({
            open: true,
            title: 'Eliminar Items Seleccionados',
            message: `¿Eliminar los ${selectedForPrint.length} servicios seleccionados del presupuesto?`,
            onConfirm: async () => {
                try {
                    // Create an array of promises to delete all selected items
                    const deletePromises = selectedForPrint.map(itemId => budgetsApi.deleteItem(itemId));
                    await Promise.all(deletePromises);

                    setConfirmModal(prev => ({ ...prev, open: false }));
                    setSelectedForPrint([]); // Clear selection after deletion
                    onUpdate?.();
                } catch (err) {
                    console.error('Error deleting items:', err);
                }
            }
        });
    };

    const handleEditPaidVoucher = async (item) => {
        try {
            setIsEditingVoucher(true);
            
            // 1. Try to find if this item is part of a voucher
            const { data: viData, error: viErr } = await supabase
                .from('voucher_items')
                .select('voucher_id')
                .eq('budget_item_id', item.id)
                .limit(1);
                
            if (viData && viData.length > 0) {
                // It's a voucher! Fetch the full voucher
                const voucherId = viData[0].voucher_id;
                const { data: voucher, error: vErr } = await supabase
                    .from('vouchers')
                    .select('*, voucher_items(*), voucher_payment_methods(*)')
                    .eq('id', voucherId)
                    .single();
                    
                if (voucher) {
                    setEditVoucherData({
                        mode: 'edit',
                        oldVoucherId: voucherId,
                        voucher: voucher
                    });
                    setMultiPayModal(true);
                }
            } else {
                // Legacy payment or no voucher
                alert('Este pago es muy antiguo o no se generó como Voucher. Por favor anúlelo manualmente o contacte a soporte si necesita editarlo.');
            }
        } catch (error) {
            console.error('Error fetching voucher for edit:', error);
            alert('No se pudo cargar la información del pago.');
        } finally {
            setIsEditingVoucher(false);
        }
    };

    const handlePayment = async () => {
        const amount = parseFloat(paymentAmount);
        const item = paymentModal.item;

        if (!amount || amount <= 0 || !item || isPaying) return;

        // Validation: Prevent overpayment
        const rawPrice = parseFloat(item.unit_price) * (item.quantity || 1);
        const discountVal = parseFloat(item.discount || 0);
        const itemDiscount = (item.discount_type === 'percent')
            ? (rawPrice * discountVal / 100) : discountVal;
        const subtotal = rawPrice - itemDiscount;
        const paidSoFar = parseFloat(item.paid_amount || 0);
        const remaining = Math.max(0, subtotal - paidSoFar);

        if (amount > (remaining + 0.001)) {
            alert(`El monto (S/ ${amount.toFixed(2)}) supera el saldo pendiente (S/ ${remaining.toFixed(2)}).`);
            return;
        }

        try {
            setIsPaying(true);
            
            // Create a voucher instead of a single payment so it can be edited later
            await vouchersApi.create({
                patientId: patientId,
                budgetId: budget.id,
                doctorId: paymentDoctorId || null,
                items: [{
                    budgetItemId: item.id,
                    serviceName: item.treatment_name || item.description || 'Tratamiento',
                    quantity: item.quantity || 1,
                    unitPrice: item.unit_price,
                    amountPaid: amount
                }],
                paymentMethods: [{
                    method: paymentMethod,
                    amount: amount
                }]
            });

            setPaymentModal({ open: false, item: null });
            setPaymentAmount('');
            setPaymentMethod('VISA');
            setPaymentNotes('');

            // Critical: wait for parent to fetch fresh data
            if (onUpdate) await onUpdate();
        } catch (err) {
            console.error('Error registering payment:', err);
            alert(`Error al registrar pago: ${err.message || JSON.stringify(err)}`);
        } finally {
            setIsPaying(false);
        }
    };

    // Calculate status color
    const statusColor = totals.balance <= 0 ? '#166534' : '#92400e';
    const statusBg = totals.balance <= 0 ? '#dcfce7' : '#fef3c7';
    const statusText = totals.balance <= 0 ? '✓ Pagado' : '⏳ Pendiente';

    return (
        <div style={S.card}>
            {/* Header */}
            <div style={S.cardHeader} onClick={() => setIsExpanded(!isExpanded)}>
                <div style={S.cardTitle}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span style={{ ...S.statusBadge, background: statusBg, color: statusColor }}>
                        {statusText}
                    </span>
                    <span style={S.budgetName}>Presupuesto General</span>
                    {/* Date is usually on parent plan card, but can show here too */}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: totals.balance > 0 ? '#f59e0b' : '#10b981' }}>
                        S/ {totals.total.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Body */}
            {isExpanded && (
                <div style={S.cardBody}>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                <th style={{ ...S.th, width: '30px', textAlign: 'center' }} title="Imprimir">
                                    <input
                                        type="checkbox"
                                        checked={selectedForPrint.length === items.length && items.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedForPrint(items.map(i => i.id));
                                            else setSelectedForPrint([]);
                                        }}
                                        style={{ accentColor: '#0f766e', cursor: 'pointer' }}
                                    />
                                </th>
                                <th style={S.th}>Item</th>
                                <th style={S.th}>Nota</th>
                                <th style={{ ...S.th, color: '#0f766e' }}>P. Unit.</th>
                                <th style={S.th}>Dscto.</th>
                                <th style={S.th}>Cant.</th>
                                <th style={S.th}>Subtotal</th>
                                <th style={S.th}>Pagado</th>
                                <th style={S.th}>Por pagar</th>
                                <th style={S.th}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => {
                                const rawPrice = parseFloat(item.unit_price) * (item.quantity || 1);
                                const discountVal = parseFloat(item.discount || 0);
                                const itemDiscount = (item.discount_type === 'percent')
                                    ? (rawPrice * discountVal / 100) : discountVal;
                                const subtotal = rawPrice - itemDiscount;
                                const paid = parseFloat(item.paid_amount || 0);
                                const remaining = Math.max(0, subtotal - paid);

                                return (
                                    <tr key={item.id} style={S.tr}>
                                        <td style={{ ...S.td, textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedForPrint.includes(item.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedForPrint([...selectedForPrint, item.id]);
                                                    else setSelectedForPrint(selectedForPrint.filter(id => id !== item.id));
                                                }}
                                                style={{ accentColor: '#0f766e', cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={{ ...S.td, fontWeight: '600' }}>{item.service_name}</td>
                                        <td style={{ ...S.td, color: '#64748b', fontSize: '12px' }}>{item.tooth_number || '-'}</td>
                                        <td style={{ ...S.td, fontWeight: '600', color: '#0f766e', whiteSpace: 'nowrap', minWidth: '110px' }}>
                                            {editingUnitPrice === item.id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>S/</span>
                                                    <input
                                                        type="number" step="0.01" min="0.01"
                                                        value={editUnitPriceVal}
                                                        onChange={e => setEditUnitPriceVal(e.target.value)}
                                                        onBlur={() => saveUnitPrice(item.id)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') saveUnitPrice(item.id);
                                                            if (e.key === 'Escape') setEditingUnitPrice(null);
                                                        }}
                                                        style={{ width: '70px', padding: '4px 8px', border: '1px solid #0f766e', borderRadius: '4px', fontSize: '12px', outline: 'none', color: '#0f766e', fontWeight: '600' }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => setEditingUnitPrice(null)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                                                        title="Cancelar"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span
                                                    onClick={() => startEditUnitPrice(item)}
                                                    style={{ cursor: parseFloat(item.paid_amount || 0) > 0 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: parseFloat(item.paid_amount || 0) > 0 ? 0.7 : 1 }}
                                                    title={parseFloat(item.paid_amount || 0) > 0 ? 'No se puede editar: ya tiene pagos' : 'Click para editar precio unitario'}
                                                >
                                                    S/ {parseFloat(item.unit_price).toFixed(2)}
                                                    {parseFloat(item.paid_amount || 0) <= 0 && <Pencil size={13} style={{ opacity: 0.5 }} />}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ ...S.td, fontSize: '12px', whiteSpace: 'nowrap', minWidth: '120px' }}>
                                            {editingDiscount === item.id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <input
                                                        type="number" step="0.01" min="0"
                                                        value={editDiscountVal}
                                                        onChange={e => setEditDiscountVal(e.target.value)}
                                                        onBlur={() => saveDiscount(item.id)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') saveDiscount(item.id);
                                                            if (e.key === 'Escape') setEditingDiscount(null);
                                                        }}
                                                        style={{ width: '60px', padding: '4px 8px', border: '1px solid #0f766e', borderRadius: '4px 0 0 4px', fontSize: '12px', borderRight: 'none', outline: 'none' }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onMouseDown={(e) => {
                                                            e.preventDefault(); // Prevent blur before click
                                                            setEditDiscountType(p => p === 'fixed' ? 'percent' : 'fixed');
                                                        }}
                                                        style={{ padding: '4px 8px', border: '1px solid #0f766e', background: '#f0fdfa', fontSize: '11px', fontWeight: '700', cursor: 'pointer', borderRadius: '0 4px 4px 0', color: '#0f766e', minWidth: '32px' }}
                                                    >
                                                        {editDiscountType === 'percent' ? '%' : 'S/'}
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingDiscount(null)} 
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                                                        title="Cancelar"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span
                                                    onClick={() => startEditDiscount(item)}
                                                    style={{ cursor: 'pointer', color: itemDiscount > 0 ? '#f59e0b' : '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                    title="Click para editar descuento"
                                                >
                                                    {itemDiscount > 0 ? `- S/ ${itemDiscount.toFixed(2)}` : '-'}
                                                    <Pencil size={13} style={{ opacity: 0.8 }} />
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ ...S.td, whiteSpace: 'nowrap', minWidth: '70px' }}>
                                            {editingQuantity === item.id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <input
                                                        type="number" min="1" step="1"
                                                        value={editQuantityVal}
                                                        onChange={e => setEditQuantityVal(e.target.value)}
                                                        onBlur={() => saveQuantity(item.id)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') saveQuantity(item.id);
                                                            if (e.key === 'Escape') setEditingQuantity(null);
                                                        }}
                                                        style={{ width: '45px', padding: '4px 8px', border: '1px solid #0f766e', borderRadius: '4px', fontSize: '12px', outline: 'none', textAlign: 'center' }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => setEditingQuantity(null)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                                                        title="Cancelar"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span
                                                    onClick={() => startEditQuantity(item)}
                                                    style={{ cursor: parseFloat(item.paid_amount || 0) > 0 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: parseFloat(item.paid_amount || 0) > 0 ? 0.7 : 1 }}
                                                    title={parseFloat(item.paid_amount || 0) > 0 ? 'No se puede editar: ya tiene pagos' : 'Click para editar cantidad'}
                                                >
                                                    {item.quantity}
                                                    {parseFloat(item.paid_amount || 0) <= 0 && <Pencil size={13} style={{ opacity: 0.5 }} />}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ ...S.td, fontWeight: '600' }}>S/ {rawPrice.toFixed(2)}</td>
                                        <td style={{ ...S.td, color: paid > 0 ? '#059669' : '#94a3b8' }}>
                                            {paid > 0 ? `S/ ${paid.toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{ ...S.td, fontWeight: '600', color: remaining > 0 ? '#0f172a' : '#059669' }}>
                                            S/ {remaining.toFixed(2)}
                                        </td>
                                        <td style={S.td}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {remaining > 0 ? (
                                                    <>
                                                        <button
                                                            style={S.payBtn}
                                                            onClick={() => {
                                                                setPaymentModal({ open: true, item });
                                                                setPaymentAmount(remaining.toFixed(2));
                                                                setPaymentDoctorId(item.doctor_id || user?.id || '');
                                                            }}
                                                        >Pagar</button>
                                                        {paid > 0 && (
                                                            <button
                                                                style={{
                                                                    padding: '4px 10px',
                                                                    border: '1px solid #cbd5e1',
                                                                    borderRadius: '6px',
                                                                    cursor: isEditingVoucher ? 'wait' : 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    color: '#475569',
                                                                    background: '#f1f5f9',
                                                                    fontFamily: 'inherit'
                                                                }}
                                                                onClick={() => handleEditPaidVoucher(item)}
                                                                disabled={isEditingVoucher}
                                                                title="Editar el voucher del pago parcial"
                                                            >
                                                                Editar
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <button 
                                                        style={{...S.paidBadge, border: 'none', cursor: isEditingVoucher ? 'wait' : 'pointer', fontFamily: 'inherit'}} 
                                                        onClick={() => handleEditPaidVoucher(item)}
                                                        disabled={isEditingVoucher}
                                                        title="Clic para editar el voucher de pago"
                                                    >
                                                        ✓ Pagado
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Add Item Form */}
                    {addingItem ? (
                        <div style={S.addItemForm}>
                            <ServiceSelector
                                value={null}
                                onChange={(service) => {
                                    if (service) {
                                        setNewItemData(prev => ({ ...prev, service, price: service.price }));
                                    }
                                }}
                                placeholder="Buscar servicio..."
                            />
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <div style={{ ...S.paramGroup, flex: 2 }}>
                                    <label style={S.paramLabel}>Diente / Nota</label>
                                    <input
                                        type="text"
                                        style={S.paramInput}
                                        value={newItemData.toothNumber}
                                        onChange={e => setNewItemData({ ...newItemData, toothNumber: e.target.value })}
                                        placeholder="ej. Muela del juicio..."
                                    />
                                </div>
                                <div style={{ ...S.paramGroup, width: '60px' }}>
                                    <label style={S.paramLabel}>Cant.</label>
                                    <input
                                        type="number" min="1"
                                        style={{ ...S.paramInput, textAlign: 'center' }}
                                        value={newItemData.quantity}
                                        onChange={e => setNewItemData({ ...newItemData, quantity: e.target.value })}
                                    />
                                </div>
                                <div style={{ ...S.paramGroup, width: '90px' }}>
                                    <label style={S.paramLabel}>Precio U.</label>
                                    <input
                                        type="number" step="0.01"
                                        style={S.paramInput}
                                        value={newItemData.price}
                                        onChange={e => setNewItemData({ ...newItemData, price: e.target.value })}
                                    />
                                </div>
                                <div style={{ ...S.paramGroup, width: '130px' }}>
                                    <label style={S.paramLabel}>Descuento</label>
                                    <div style={{ display: 'flex', gap: '0' }}>
                                        <input
                                            type="number" step="0.01" min="0"
                                            style={{ ...S.paramInput, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none' }}
                                            value={newItemData.discount || ''}
                                            onChange={e => setNewItemData({ ...newItemData, discount: e.target.value })}
                                            placeholder="0"
                                        />
                                        <button
                                            onClick={() => setNewItemData(prev => ({
                                                ...prev,
                                                discountType: prev.discountType === 'fixed' ? 'percent' : 'fixed',
                                            }))}
                                            style={{
                                                padding: '0 8px',
                                                border: '1px solid #e2e8f0',
                                                borderTopRightRadius: '6px',
                                                borderBottomRightRadius: '6px',
                                                background: '#f1f5f9',
                                                color: '#64748b',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                minWidth: '32px'
                                            }}
                                            title="Cambiar tipo de descuento"
                                        >
                                            {newItemData.discountType === 'percent' ? '%' : 'S/'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                                <button style={S.cancelBtn} onClick={() => setAddingItem(false)}>Cancelar</button>
                                <button style={S.confirmBtn} onClick={handleAddItem}>Agregar</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '12px 16px' }}>
                            <button style={S.addItemBtn} onClick={() => setAddingItem(true)}>
                                <Plus size={14} /> Agregar servicio
                            </button>
                        </div>
                    )}

                    {/* Footer Summary */}
                    <div style={S.footer}>
                        <div style={S.footerActions}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {selectedForPrint.length > 0 && (
                                    <button
                                        style={{ ...S.actionBtn, color: '#ef4444', borderColor: '#ef4444', background: '#fee2e2' }}
                                        onClick={handleDeleteSelectedItems}
                                    >
                                        <Trash2 size={16} />
                                        Eliminar ({selectedForPrint.length})
                                    </button>
                                )}
                                {/* Imprimir Presupuesto (existing flow) */}
                                <button
                                    style={{
                                        ...S.actionBtn,
                                        opacity: selectedForPrint.length === 0 ? 0.5 : 1,
                                        cursor: selectedForPrint.length === 0 ? 'not-allowed' : 'pointer',
                                    }}
                                    onClick={() => handlePrint(budget, selectedForPrint)}
                                    disabled={selectedForPrint.length === 0}
                                    title="Imprimir presupuesto/cotización"
                                >
                                    <Printer size={16} />
                                    Imprimir Presupuesto
                                </button>
                                {/* Cobrar y Generar Voucher (new flow) */}
                                {(() => {
                                    const pendingSelected = items.filter(it =>
                                        selectedForPrint.includes(it.id) &&
                                        (() => {
                                            const raw  = parseFloat(it.unit_price) * (it.quantity || 1);
                                            const disc = parseFloat(it.discount || 0);
                                            const d    = it.discount_type === 'percent' ? (raw * disc / 100) : disc;
                                            return Math.max(0, raw - d - parseFloat(it.paid_amount || 0)) > 0.001;
                                        })()
                                    );
                                    return pendingSelected.length > 0 ? (
                                        <button
                                            id="btn-cobrar-voucher"
                                            style={{
                                                ...S.actionBtn,
                                                background: 'linear-gradient(135deg, #0f766e, #134e4a)',
                                                color: 'white',
                                                border: 'none',
                                                fontWeight: '700',
                                            }}
                                            onClick={() => setMultiPayModal(true)}
                                        >
                                            <DollarSign size={16} />
                                            Cobrar ({pendingSelected.length}) y Generar Voucher
                                        </button>
                                    ) : null;
                                })()}
                            </div>
                            <button
                                style={{ ...S.actionBtn, color: '#25d366', borderColor: '#25d366' }}
                                onClick={() => {
                                    const phone = patientPhone ? `51${patientPhone}` : '';
                                    const msg = `Hola ${patientName || ''}, te envío el detalle de tu presupuesto por *${planTitle || budget.title || 'tu tratamiento'}*.\nTotal: S/ ${totals.total.toFixed(2)}\nSaludos, Curae.`;
                                    if (patientPhone) {
                                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                    } else {
                                        alert('El paciente no tiene un número de teléfono registrado.');
                                    }
                                }}
                            >
                                <MessageCircle size={16} /> Enviar por WhatsApp
                            </button>
                        </div>
                        <div style={S.summaryGrid}>
                            <span style={S.summaryLabel}>Subtotal:</span>
                            <span style={S.summaryValue}>S/ {totals.subtotal.toFixed(2)}</span>
                            {totals.discountAmount > 0 && (
                                <>
                                    <span style={S.summaryLabel}>Descuento:</span>
                                    <span style={{ ...S.summaryValue, color: '#f59e0b' }}>- S/ {totals.discountAmount.toFixed(2)}</span>
                                </>
                            )}
                            {/* Global Discount Row — controlled by GLOBAL_DISCOUNT_ENABLED flag */}
                            {GLOBAL_DISCOUNT_ENABLED && (
                                <>
                                    <span style={{ ...S.summaryLabel, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Dscto. Global:
                                    </span>
                                    <span style={{ ...S.summaryValue, color: '#e67e22' }}>
                                        {editingGlobalDiscount ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                                                <input
                                                    type="number" step="0.01" min="0"
                                                    value={editGlobalDiscountVal}
                                                    onChange={e => setEditGlobalDiscountVal(e.target.value)}
                                                    onBlur={e => saveGlobalDiscount(e.target.value, editGlobalDiscountType)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') saveGlobalDiscount(editGlobalDiscountVal, editGlobalDiscountType);
                                                        if (e.key === 'Escape') {
                                                            globalDiscountActiveRef.current = false;
                                                            setEditingGlobalDiscount(false);
                                                        }
                                                    }}
                                                    style={{ width: '60px', padding: '4px 8px', border: '1px solid #e67e22', borderRadius: '4px 0 0 4px', fontSize: '12px', borderRight: 'none', outline: 'none', textAlign: 'right' }}
                                                    autoFocus
                                                />
                                                <button
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setEditGlobalDiscountType(p => p === 'fixed' ? 'percent' : 'fixed');
                                                    }}
                                                    style={{ padding: '4px 8px', border: '1px solid #e67e22', background: '#fef3c7', fontSize: '11px', fontWeight: '700', cursor: 'pointer', borderRadius: '0 4px 4px 0', color: '#e67e22', minWidth: '32px' }}
                                                >
                                                    {editGlobalDiscountType === 'percent' ? '%' : 'S/'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        globalDiscountActiveRef.current = false;
                                                        setEditingGlobalDiscount(false);
                                                    }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span
                                                onClick={startEditGlobalDiscount}
                                                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                title="Click para editar descuento global"
                                            >
                                                {totals.globalDiscountAmount > 0 ? `- S/ ${totals.globalDiscountAmount.toFixed(2)}` : '-'}
                                                <Pencil size={13} style={{ opacity: 0.6 }} />
                                            </span>
                                        )}
                                    </span>
                                </>
                            )}
                            <span style={S.summaryLabel}>Total:</span>
                            <span style={{ ...S.summaryValue, fontWeight: '700', fontSize: '15px', color: '#0f766e' }}>S/ {totals.total.toFixed(2)}</span>
                            {totals.paid > 0 && (
                                <>
                                    <span style={S.summaryLabel}>Pagado:</span>
                                    <span style={{ ...S.summaryValue, color: '#059669' }}>S/ {totals.paid.toFixed(2)}</span>
                                </>
                            )}
                            <span style={{ ...S.summaryLabel, fontWeight: '600' }}>Por pagar:</span>
                            <span style={{ ...S.summaryValue, fontWeight: '700', fontSize: '15px', color: totals.balance > 0 ? '#ef4444' : '#059669' }}>
                                S/ {totals.balance.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Modals */}
            {
                paymentModal.open && (
                    <div style={S.modalOverlay} onClick={() => setPaymentModal({ open: false, item: null })}>
                        <div style={S.modal} onClick={e => e.stopPropagation()}>
                            <div style={S.modalHeader}>
                                <h3 style={{ margin: 0, fontSize: '16px' }}>Registrar Pago</h3>
                            </div>
                            <div style={S.modalBody}>
                                <div style={S.fieldGroup}>
                                    <label style={S.fieldLabel}>Monto (S/)</label>
                                    <input type="number" step="0.01" value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)} autoFocus style={S.fieldInput} />
                                </div>
                                <div style={S.fieldGroup}>
                                    <label style={S.fieldLabel}>Método de Pago</label>
                                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={S.fieldInput}>
                                        <option value="VISA">VISA</option>
                                        <option value="BCP">BCP</option>
                                        <option value="BBVA">BBVA</option>
                                        <option value="INTERBANK">INTERBANK</option>
                                        <option value="EFECTIVO">EFECTIVO</option>
                                        <option value="YAPE">YAPE</option>
                                        <option value="PLIN">PLIN</option>
                                        <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                    </select>
                                </div>
                                <div style={S.fieldGroup}>
                                    <label style={S.fieldLabel}>Doctor Responsable</label>
                                    <select 
                                        value={paymentDoctorId} 
                                        onChange={e => setPaymentDoctorId(e.target.value)} 
                                        style={S.fieldInput}
                                    >
                                        <option value="">-- Sin Asignar --</option>
                                        {doctorsList.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={S.modalActions}>
                                    <button style={S.cancelBtn} onClick={() => setPaymentModal({ open: false, item: null })}>Cancelar</button>
                                    <button
                                        style={{ ...S.confirmBtn, opacity: isPaying ? 0.7 : 1, cursor: isPaying ? 'not-allowed' : 'pointer' }}
                                        onClick={handlePayment}
                                        disabled={isPaying}
                                    >
                                        {isPaying ? 'Procesando...' : 'Confirmar Pago'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                confirmModal.open && (
                    <div style={S.modalOverlay} onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>
                        <div style={{ ...S.modal, width: '400px' }} onClick={e => e.stopPropagation()}>
                            <div style={S.modalHeader}>
                                <h3 style={{ margin: 0, color: '#ef4444' }}>Confirmar</h3>
                            </div>
                            <div style={{ padding: '24px' }}>{confirmModal.message}</div>
                            <div style={S.modalActions}>
                                <button style={S.cancelBtn} onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>Cancelar</button>
                                <button style={{ ...S.confirmBtn, background: '#ef4444' }} onClick={confirmModal.onConfirm}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Hidden Printable Budget (cotización) */}
            {printingBudget && (
                <PrintableBudget
                    patientName={patientName}
                    patientPhone={patientPhone}
                    budget={printingBudget}
                    planTitle={planTitle}
                    printItemIds={printingItemIds}
                    activeDoctor={realActiveDoctor}
                />
            )}

            {/* Multi-payment modal */}
            {multiPayModal && (() => {
                const pendingItems = editVoucherData
                    ? items.filter(it => editVoucherData.voucher.voucher_items.some(vi => vi.budget_item_id === it.id))
                    : items.filter(it =>
                        selectedForPrint.includes(it.id) &&
                        (() => {
                            const raw  = parseFloat(it.unit_price) * (it.quantity || 1);
                            const disc = parseFloat(it.discount || 0);
                            const d    = it.discount_type === 'percent' ? (raw * disc / 100) : disc;
                            return Math.max(0, raw - d - parseFloat(it.paid_amount || 0)) > 0.001;
                        })()
                    );
                return (
                    <MultiPaymentModal
                        items={pendingItems}
                        editVoucherData={editVoucherData}
                        patient={budget.patient || { first_name: patientName?.split(' ')[0] || '', last_name: patientName?.split(' ').slice(1).join(' ') || '' }}
                        budgetId={budget.id}
                        doctorId={realActiveDoctor?.id || null}
                        doctorsList={doctorsList}
                        onClose={() => {
                            setMultiPayModal(false);
                            setEditVoucherData(null);
                        }}
                        onConfirm={async ({ items: itemsPayload, paymentMethods, doctorId }) => {
                            const voucherData = {
                                patientId: patientId,
                                budgetId:  budget.id,
                                doctorId:  doctorId || null,
                                items:     itemsPayload,
                                paymentMethods,
                            };
                            
                            let voucher;
                            if (editVoucherData) {
                                voucher = await vouchersApi.replace(editVoucherData.oldVoucherId, voucherData);
                            } else {
                                voucher = await vouchersApi.create(voucherData);
                            }
                            
                            setMultiPayModal(false);
                            setEditVoucherData(null);
                            
                            // Find the doctor name for the print view
                            const selectedDoctor = doctorsList.find(d => d.id === doctorId) || realActiveDoctor;

                            // Attach doctor info for printing
                            const voucherForPrint = {
                                ...voucher,
                                patient: budget.patient || { first_name: patientName?.split(' ')[0] || '', last_name: patientName?.split(' ').slice(1).join(' ') || '', dni: '' },
                                doctor:  selectedDoctor ? { name: selectedDoctor.name } : null,
                                voucher_items: itemsPayload.map(i => ({
                                    service_name: i.serviceName,
                                    quantity:     i.quantity,
                                    amount_paid:  i.amountPaid,
                                })),
                                voucher_payment_methods: paymentMethods,
                            };
                            
                            // Call the isolated iframe print function
                            printVoucherToIframe(voucherForPrint);
                            onUpdate?.();
                        }}
                    />
                );
            })()}

            {/* Secret image preload to ensure the signature is cached before 
                printing. Display:none causes browsers to aggressively delay 
                image fetching, so we use opacity/position instead. */}
            {realActiveDoctor?.signature_url && (
                <img
                    src={realActiveDoctor.signature_url}
                    alt="preload"
                    style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.01, zIndex: -100 }}
                />
            )}
        </div >
    );
}

// Styles reused
const S = {
    card: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '16px', position: 'relative' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' },
    cardTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b' },
    cardBody: { borderTop: '1px solid #f1f5f9', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { textAlign: 'left', padding: '10px 12px', fontWeight: '600', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '10px 12px', verticalAlign: 'middle', fontSize: '13px', color: '#334155' },
    statusBadge: { padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
    payBtn: { padding: '4px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'white', background: '#0f766e' },
    paidBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#059669', background: '#dcfce7' },
    deleteItemBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' },
    addItemBtn: { display: 'flex', gap: '6px', padding: '8px 14px', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: '#64748b', fontSize: '13px' },
    addItemForm: { padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' },
    paramsGrid: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    paramGroup: { flex: 1, minWidth: '80px' },
    paramLabel: { display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' },
    paramInput: { width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' },
    cancelBtn: { padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: 'white', fontSize: '13px' },
    confirmBtn: { padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: '#0f766e', color: 'white', fontSize: '13px' },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' },
    footerActions: { display: 'flex', gap: '8px', alignItems: 'center' },
    actionBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: 'white', color: '#334155', fontWeight: '600', fontSize: '13px', height: '36px' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 16px', textAlign: 'right', fontSize: '13px' },
    summaryLabel: { color: '#64748b', fontWeight: '500' },
    summaryValue: { color: '#1e293b', fontWeight: '500' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
    modal: { background: 'white', borderRadius: '16px', width: '440px', maxWidth: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' },
    modalHeader: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9' },
    modalBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
    modalActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #f1f5f9' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    fieldLabel: { fontSize: '12px', fontWeight: '600', color: '#64748b' },
    fieldInput: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' },
};
