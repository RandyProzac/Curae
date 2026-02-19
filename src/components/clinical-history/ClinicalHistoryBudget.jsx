import React, { useState, useEffect, useCallback } from 'react';
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
    Stethoscope,
} from 'lucide-react';
import { budgetsApi, paymentsApi } from '../../lib/supabase';
import ServiceSelector from '../appointments/ServiceSelector';
import PrintableBudget from '../common/PrintableBudget';

/**
 * ClinicalHistoryBudget
 * Budget tab in clinical history. Shows all budgets for a patient.
 * Supports: view items, add items, pay, discount, print, WhatsApp.
 */
export default function ClinicalHistoryBudget({ patientId, patientName, patientPhone }) {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBudgets, setExpandedBudgets] = useState({});
    const [addingItemTo, setAddingItemTo] = useState(null);
    const [newItemData, setNewItemData] = useState({
        service: null, toothNumber: '', quantity: 1, price: 0,
        discount: 0, discountType: 'fixed',
    });
    const [paymentModal, setPaymentModal] = useState({ open: false, item: null });
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    // Print state
    const [printingBudget, setPrintingBudget] = useState(null);
    const [printingItemId, setPrintingItemId] = useState(null);

    const handlePrint = (budget, itemId = null) => {
        setPrintingBudget(budget);
        setPrintingItemId(itemId);
        // Wait for state to apply and component to render before printing
        setTimeout(() => {
            window.print();
            setPrintingBudget(null);
            setPrintingItemId(null);
        }, 500);
    };

    const loadBudgets = useCallback(async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const data = await budgetsApi.getByPatient(patientId);
            // Auto-sync statuses
            const synced = await Promise.all((data || []).map(async (b) => {
                const items = b.budget_items || [];
                if (items.length === 0) return b;
                const totals = getBudgetTotalsFromItems(items);
                const balance = totals.balance;
                if (balance <= 0 && b.status !== 'completed') {
                    try { await budgetsApi.update(b.id, { status: 'completed' }); } catch (e) { }
                    return { ...b, status: 'completed' };
                }
                if (balance > 0 && b.status === 'completed') {
                    try { await budgetsApi.update(b.id, { status: 'in_progress' }); } catch (e) { }
                    return { ...b, status: 'in_progress' };
                }
                return b;
            }));
            setBudgets(synced);
        } catch (err) {
            console.error('Error loading budgets:', err);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => { loadBudgets(); }, [loadBudgets]);

    // ===== CALCULATIONS =====
    const getBudgetTotalsFromItems = (items) => {
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
        const total = Math.max(0, subtotal - totalDiscount);
        const balance = Math.max(0, total - paid);
        return { subtotal, discountAmount: totalDiscount, total, paid, balance };
    };

    const getBudgetTotals = (budget) => getBudgetTotalsFromItems(budget.budget_items);

    // ===== ACTIONS =====
    const handleDeleteBudget = (budgetId) => {
        setConfirmModal({
            open: true,
            title: 'Eliminar Presupuesto',
            message: '¿Estás seguro de eliminar este presupuesto y todos sus items? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    await budgetsApi.delete(budgetId);
                    setBudgets(budgets.filter(b => b.id !== budgetId));
                    setConfirmModal(prev => ({ ...prev, open: false }));
                } catch (err) {
                    console.error('Error deleting budget:', err);
                }
            }
        });
    };

    const handleAddItem = async (budgetId) => {
        if (!newItemData.service) return;
        try {
            const item = await budgetsApi.addItem({
                budget_id: budgetId,
                service_id: newItemData.service.id,
                service_name: newItemData.service.name,
                tooth_number: newItemData.toothNumber || null,
                quantity: newItemData.quantity || 1,
                unit_price: newItemData.price || newItemData.service.price,
                discount: newItemData.discount || 0,
                discount_type: newItemData.discountType || 'fixed',
            });
            setBudgets(budgets.map(b =>
                b.id === budgetId
                    ? { ...b, budget_items: [...(b.budget_items || []), { ...item, payments: [] }] }
                    : b
            ));
            setNewItemData({ service: null, toothNumber: '', quantity: 1, price: 0, discount: 0, discountType: 'fixed' });
            setAddingItemTo(null);
        } catch (err) {
            console.error('Error adding item:', err);
        }
    };

    const handleDeleteItem = (budgetId, itemId) => {
        setConfirmModal({
            open: true,
            title: 'Eliminar Item',
            message: '¿Eliminar este servicio del presupuesto?',
            onConfirm: async () => {
                try {
                    await budgetsApi.deleteItem(itemId);
                    setBudgets(budgets.map(b =>
                        b.id === budgetId
                            ? { ...b, budget_items: b.budget_items.filter(i => i.id !== itemId) }
                            : b
                    ));
                    setConfirmModal(prev => ({ ...prev, open: false }));
                } catch (err) {
                    console.error('Error deleting item:', err);
                }
            }
        });
    };

    const handlePayment = async () => {
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0 || !paymentModal.item) return;
        try {
            await paymentsApi.create({
                budget_item_id: paymentModal.item.id,
                amount,
                method: paymentMethod,
                notes: paymentNotes || null,
                date: new Date().toLocaleDateString('en-CA'),
            });
            const updatedBudgets = budgets.map(b => {
                const updatedItems = (b.budget_items || []).map(item =>
                    item.id === paymentModal.item.id
                        ? { ...item, paid_amount: parseFloat(item.paid_amount || 0) + amount }
                        : item
                );
                return { ...b, budget_items: updatedItems };
            });
            // Auto-complete check
            const finalBudgets = await Promise.all(updatedBudgets.map(async (b) => {
                const hasThisItem = (b.budget_items || []).some(i => i.id === paymentModal.item.id);
                if (hasThisItem && b.status !== 'completed') {
                    const totals = getBudgetTotalsFromItems(b.budget_items);
                    if (totals.balance <= 0 && b.budget_items.length > 0) {
                        try { await budgetsApi.update(b.id, { status: 'completed' }); return { ...b, status: 'completed' }; }
                        catch (e) { }
                    }
                }
                return b;
            }));
            setBudgets(finalBudgets);
            setPaymentModal({ open: false, item: null });
            setPaymentAmount('');
            setPaymentMethod('efectivo');
            setPaymentNotes('');
        } catch (err) {
            console.error('Error registering payment:', err);
        }
    };

    const toggleBudget = (id) => {
        setExpandedBudgets(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) {
        return <div style={S.loadingBox}>Cargando presupuestos...</div>;
    }

    if (budgets.length === 0) {
        return (
            <div style={S.emptyState}>
                <DollarSign size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                <h3 style={S.emptyTitle}>Aún no hay presupuestos creados</h3>
                <p style={S.emptyDesc}>
                    Ve a la sección <strong>Odontograma</strong> para registrar hallazgos, agregar servicios
                    y crear un presupuesto desde el plan de tratamiento.
                </p>
            </div>
        );
    }

    return (
        <>
            <div style={S.container}>
                <div style={S.header}>
                    <h3 style={S.headerTitle}>
                        <DollarSign size={20} />
                        Presupuestos
                    </h3>
                    <span style={S.headerCount}>{budgets.length} presupuesto{budgets.length !== 1 ? 's' : ''}</span>
                </div>

                {budgets.map(budget => {
                    const totals = getBudgetTotals(budget);
                    const isExpanded = expandedBudgets[budget.id];
                    const items = budget.budget_items || [];

                    return (
                        <div key={budget.id} style={S.card}>
                            {/* Card Header */}
                            <div style={S.cardHeader} onClick={() => toggleBudget(budget.id)}>
                                <div style={S.cardTitle}>
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span style={{
                                        ...S.statusBadge,
                                        background: budget.status === 'completed' ? '#dcfce7' : '#fef3c7',
                                        color: budget.status === 'completed' ? '#166534' : '#92400e',
                                    }}>
                                        {budget.status === 'completed' ? '✓ Completado' : '⏳ En proceso'}
                                    </span>
                                    <span style={S.budgetName}>{budget.title || budget.name}</span>
                                    <span style={S.budgetDate}>
                                        Creado el {new Date(budget.created_at).toLocaleDateString('es-PE')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        fontSize: '14px', fontWeight: '700',
                                        color: totals.balance > 0 ? '#f59e0b' : '#10b981',
                                    }}>
                                        S/ {totals.total.toFixed(2)}
                                    </span>
                                    <button
                                        style={S.iconBtn}
                                        onClick={(e) => { e.stopPropagation(); handleDeleteBudget(budget.id); }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Body */}
                            {isExpanded && (
                                <div style={S.cardBody}>
                                    {items.length > 0 && (
                                        <table style={S.table}>
                                            <thead>
                                                <tr>
                                                    <th style={S.th}>Item</th>
                                                    <th style={S.th}>Nota</th>
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
                                                            <td style={{ ...S.td, fontWeight: '600' }}>{item.service_name}</td>
                                                            <td style={{ ...S.td, color: '#64748b', fontSize: '12px' }}>{item.tooth_number || '-'}</td>
                                                            <td style={{ ...S.td, color: itemDiscount > 0 ? '#f59e0b' : '#cbd5e1', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                                                {itemDiscount > 0 ? `- S/ ${itemDiscount.toFixed(2)}` : '-'}
                                                            </td>
                                                            <td style={S.td}>{item.quantity}</td>
                                                            <td style={{ ...S.td, fontWeight: '600' }}>S/ {subtotal.toFixed(2)}</td>
                                                            <td style={{ ...S.td, color: paid > 0 ? '#059669' : '#94a3b8' }}>
                                                                {paid > 0 ? `S/ ${paid.toFixed(2)}` : '-'}
                                                            </td>
                                                            <td style={{ ...S.td, fontWeight: '600', color: remaining > 0 ? '#0f172a' : '#059669' }}>
                                                                S/ {remaining.toFixed(2)}
                                                            </td>
                                                            <td style={S.td}>
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    {remaining > 0 ? (
                                                                        <button
                                                                            style={S.payBtn}
                                                                            onClick={() => {
                                                                                setPaymentModal({ open: true, item });
                                                                                setPaymentAmount(remaining.toFixed(2));
                                                                            }}
                                                                        >Pagar</button>
                                                                    ) : (
                                                                        <span style={S.paidBadge}>✓ Pagado</span>
                                                                    )}
                                                                    <button
                                                                        style={S.deleteItemBtn}
                                                                        onClick={() => handleDeleteItem(budget.id, item.id)}
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                    <button
                                                                        style={{ ...S.deleteItemBtn, color: '#64748b' }}
                                                                        onClick={() => handlePrint(budget, item.id)}
                                                                        title="Imprimir solo este item"
                                                                    >
                                                                        <Printer size={13} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}

                                    {/* Add Item */}
                                    {addingItemTo === budget.id ? (
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
                                            <div style={S.paramsGrid}>
                                                <div style={S.paramGroup}>
                                                    <label style={S.paramLabel}>Nota</label>
                                                    <input
                                                        type="text"
                                                        placeholder="ej: Nota opcional..."
                                                        style={S.paramInput}
                                                        value={newItemData.toothNumber}
                                                        onChange={e => setNewItemData({ ...newItemData, toothNumber: e.target.value })}
                                                    />
                                                </div>
                                                <div style={{ ...S.paramGroup, width: '60px' }}>
                                                    <label style={S.paramLabel}>Cant.</label>
                                                    <input
                                                        type="number" min="1"
                                                        style={{ ...S.paramInput, textAlign: 'center' }}
                                                        value={newItemData.quantity}
                                                        onChange={e => setNewItemData({ ...newItemData, quantity: parseInt(e.target.value) || 1 })}
                                                    />
                                                </div>
                                                <div style={{ ...S.paramGroup, width: '100px' }}>
                                                    <label style={S.paramLabel}>Precio U.</label>
                                                    <input
                                                        type="number" step="0.01"
                                                        style={S.paramInput}
                                                        value={newItemData.price}
                                                        onChange={e => setNewItemData({ ...newItemData, price: parseFloat(e.target.value) || 0 })}
                                                    />
                                                </div>
                                                <div style={{ ...S.paramGroup, width: '130px' }}>
                                                    <label style={S.paramLabel}>Descuento</label>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <input
                                                            type="number" step="0.01" min="0"
                                                            style={S.paramInput}
                                                            value={newItemData.discount || ''}
                                                            onChange={e => setNewItemData({ ...newItemData, discount: e.target.value })}
                                                        />
                                                        <button
                                                            onClick={() => setNewItemData(prev => ({
                                                                ...prev,
                                                                discountType: prev.discountType === 'fixed' ? 'percent' : 'fixed',
                                                            }))}
                                                            style={S.toggleBtn}
                                                        >
                                                            {newItemData.discountType === 'percent' ? '%' : 'S/'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button style={S.cancelBtn} onClick={() => { setAddingItemTo(null); setNewItemData({ service: null, toothNumber: '', quantity: 1, price: 0, discount: 0, discountType: 'fixed' }); }}>Cancelar</button>
                                                <button style={S.confirmBtn} onClick={() => handleAddItem(budget.id)}>Agregar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '12px 16px' }}>
                                            <button style={S.addItemBtn} onClick={() => setAddingItemTo(budget.id)}>
                                                <Plus size={14} /> Agregar servicio
                                            </button>
                                        </div>
                                    )}

                                    {/* Summary Footer */}
                                    {items.length > 0 && (
                                        <div style={S.footer}>
                                            <div style={S.footerActions}>
                                                <button style={S.actionBtn} onClick={() => handlePrint(budget)}>
                                                    <Printer size={16} /> Imprimir
                                                </button>
                                                <button
                                                    style={{ ...S.actionBtn, color: '#25d366', borderColor: '#25d366' }}
                                                    onClick={() => {
                                                        const phone = patientPhone ? `51${patientPhone}` : '';
                                                        const msg = `Hola ${patientName || ''}, te envío el detalle de tu presupuesto por *${budget.title || budget.name || 'tu tratamiento'}*.\nTotal: S/ ${totals.total.toFixed(2)}\nSaludos, Curae.`;
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
                                                <span style={S.summaryLabel}>Dscto:</span>
                                                <span style={{ ...S.summaryValue, color: '#f59e0b' }}>S/ {totals.discountAmount.toFixed(2)}</span>
                                                <span style={S.summaryLabel}>Total:</span>
                                                <span style={{ ...S.summaryValue, fontWeight: '700', fontSize: '15px' }}>S/ {totals.total.toFixed(2)}</span>
                                                <span style={S.summaryLabel}>Pagado:</span>
                                                <span style={{ ...S.summaryValue, color: '#059669' }}>S/ {totals.paid.toFixed(2)}</span>
                                                <span style={S.summaryLabel}>Por pagar:</span>
                                                <span style={{ ...S.summaryValue, fontWeight: '700', color: totals.balance > 0 ? '#ef4444' : '#059669' }}>
                                                    S/ {totals.balance.toFixed(2)}{totals.balance === 0 && ' ✓'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Payment Modal */}
            {paymentModal.open && (
                <div style={S.modalOverlay} onClick={() => setPaymentModal({ open: false, item: null })}>
                    <div style={S.modal} onClick={e => e.stopPropagation()}>
                        <div style={S.modalHeader}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>Registrar Pago — {paymentModal.item?.service_name}</h3>
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
                                    <option value="efectivo">Efectivo</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="yape">Yape / Plin</option>
                                </select>
                            </div>
                            <div style={S.fieldGroup}>
                                <label style={S.fieldLabel}>Nota (Opcional)</label>
                                <input placeholder="Comentario del pago..." value={paymentNotes}
                                    onChange={e => setPaymentNotes(e.target.value)} style={S.fieldInput} />
                            </div>
                        </div>
                        <div style={S.modalActions}>
                            <button style={S.cancelBtn} onClick={() => setPaymentModal({ open: false, item: null })}>Cancelar</button>
                            <button style={S.confirmBtn} onClick={handlePayment}>Confirmar Pago</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModal.open && (
                <div style={S.modalOverlay} onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>
                    <div style={{ ...S.modal, width: '400px' }} onClick={e => e.stopPropagation()}>
                        <div style={S.modalHeader}>
                            <h3 style={{ margin: 0, color: '#ef4444', fontSize: '16px' }}>{confirmModal.title}</h3>
                        </div>
                        <div style={{ padding: '24px', color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                            {confirmModal.message}
                        </div>
                        <div style={S.modalActions}>
                            <button style={S.cancelBtn} onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>Cancelar</button>
                            <button style={{ ...S.confirmBtn, background: '#ef4444' }} onClick={confirmModal.onConfirm}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Printable Content */}
            {printingBudget && (
                <PrintableBudget
                    patientName={patientName}
                    patientPhone={patientPhone}
                    budget={printingBudget}
                    printItemId={printingItemId}
                />
            )}
        </>
    );
}

// ============================================
// STYLES
// ============================================
const S = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '18px',
        fontWeight: '700',
        color: '#1e293b',
        margin: 0,
    },
    headerCount: {
        fontSize: '13px',
        color: '#64748b',
        background: '#f1f5f9',
        padding: '4px 12px',
        borderRadius: '20px',
    },
    loadingBox: {
        textAlign: 'center',
        padding: '40px',
        color: '#94a3b8',
        fontSize: '14px',
    },
    emptyState: {
        textAlign: 'center',
        padding: '48px 24px',
        background: '#f8fafc',
        borderRadius: '16px',
        border: '1px dashed #cbd5e1',
    },
    emptyTitle: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#475569',
        margin: '0 0 8px',
    },
    emptyDesc: {
        fontSize: '14px',
        color: '#94a3b8',
        margin: 0,
        maxWidth: '400px',
        marginLeft: 'auto',
        marginRight: 'auto',
        lineHeight: 1.5,
    },
    card: {
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid #f1f5f9',
        transition: 'background 0.15s',
    },
    cardTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#334155',
    },
    statusBadge: {
        padding: '2px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '600',
    },
    budgetName: { fontSize: '14px', fontWeight: '600', color: '#1e293b' },
    budgetDate: { fontSize: '12px', color: '#94a3b8', fontWeight: '400' },
    iconBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#94a3b8',
        padding: '4px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
    },
    cardBody: {
        borderTop: '1px solid #f1f5f9',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px',
    },
    th: {
        textAlign: 'left',
        padding: '10px 12px',
        fontWeight: '600',
        fontSize: '11px',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
    },
    tr: {
        borderBottom: '1px solid #f1f5f9',
    },
    td: {
        padding: '10px 12px',
        verticalAlign: 'middle',
        fontSize: '13px',
        color: '#334155',
    },
    payBtn: {
        padding: '4px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600',
        color: 'white',
        background: '#0f766e',
    },
    paidBadge: {
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#059669',
        background: '#dcfce7',
    },
    deleteItemBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#ef4444',
        padding: '4px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        opacity: 0.6,
    },
    addItemForm: {
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
    },
    paramsGrid: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
    },
    paramGroup: { flex: 1, minWidth: '80px' },
    paramLabel: {
        display: 'block',
        fontSize: '11px',
        fontWeight: '600',
        color: '#64748b',
        marginBottom: '4px',
        textTransform: 'uppercase',
    },
    paramInput: {
        width: '100%',
        padding: '6px 8px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#334155',
        background: 'white',
        outline: 'none',
        boxSizing: 'border-box',
    },
    toggleBtn: {
        padding: '6px 10px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '700',
        color: '#64748b',
        background: 'white',
        whiteSpace: 'nowrap',
    },
    addItemBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        border: '1px dashed #cbd5e1',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        color: '#64748b',
        background: 'transparent',
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '16px',
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc',
        flexWrap: 'wrap',
        gap: '16px',
    },
    footerActions: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },
    actionBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        color: '#334155',
        background: 'white',
        height: '36px',
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'auto auto',
        gap: '4px 16px',
        textAlign: 'right',
        fontSize: '13px',
    },
    summaryLabel: {
        color: '#64748b',
        fontWeight: '500',
    },
    summaryValue: {
        color: '#1e293b',
        fontWeight: '500',
    },
    cancelBtn: {
        padding: '8px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        color: '#64748b',
        background: 'white',
    },
    confirmBtn: {
        padding: '8px 20px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        color: 'white',
        background: '#0f766e',
    },
    // Modal styles
    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        background: 'white',
        borderRadius: '16px',
        width: '440px',
        maxWidth: '90vw',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    modalHeader: {
        padding: '20px 24px',
        borderBottom: '1px solid #f1f5f9',
    },
    modalBody: {
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    modalActions: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end',
        padding: '16px 24px',
        borderTop: '1px solid #f1f5f9',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    fieldLabel: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#64748b',
    },
    fieldInput: {
        padding: '8px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#334155',
        outline: 'none',
    },
};
