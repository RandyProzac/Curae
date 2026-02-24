import React, { useState, useEffect } from 'react';
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
import { budgetsApi, paymentsApi, doctorsApi } from '../../lib/supabase';
import ServiceSelector from '../appointments/ServiceSelector';
import PrintableBudget from '../common/PrintableBudget';
import { useAuth } from '../../contexts/useAuth';

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
        service: null, toothNumber: '', quantity: 1, price: 0,
        discount: 0, discountType: 'fixed',
    });

    // Payment State
    const [paymentModal, setPaymentModal] = useState({ open: false, item: null });
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [paymentNotes, setPaymentNotes] = useState('');

    // Confirm Modal
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
    const [isPaying, setIsPaying] = useState(false);

    // Print state
    const [printingBudget, setPrintingBudget] = useState(null);
    const [printingItemIds, setPrintingItemIds] = useState(null); // Changed to array
    const [realActiveDoctor, setRealActiveDoctor] = useState(user);

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
            setPrintingBudget(null);
            setPrintingItemIds(null);
        }, 1200);
    };

    // Inline Discount Editing
    const [editingDiscount, setEditingDiscount] = useState(null); // item id
    const [editDiscountVal, setEditDiscountVal] = useState('');
    const [editDiscountType, setEditDiscountType] = useState('fixed');

    const startEditDiscount = (item) => {
        setEditingDiscount(item.id);
        setEditDiscountVal(item.discount || 0);
        setEditDiscountType(item.discount_type || 'fixed');
    };

    const saveDiscount = async (itemId) => {
        try {
            await budgetsApi.updateItem(itemId, {
                discount: parseFloat(editDiscountVal) || 0,
                discount_type: editDiscountType,
            });
            setEditingDiscount(null);
            onUpdate?.();
        } catch (err) {
            console.error('Error updating discount:', err);
        }
    };

    // Calculations
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
        const total = Math.max(0, subtotal - totalDiscount);
        const balance = Math.max(0, total - paid);
        return { subtotal, discountAmount: totalDiscount, total, paid, balance };
    };

    const totals = getBudgetTotals(budget.items || []);

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
            setNewItemData({ service: null, toothNumber: '', quantity: 1, price: 0, discount: 0, discountType: 'fixed' });
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
            await paymentsApi.create({
                budget_item_id: item.id,
                amount,
                method: paymentMethod,
                notes: paymentNotes || null,
            });

            setPaymentModal({ open: false, item: null });
            setPaymentAmount('');
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
                                        <td style={{ ...S.td, fontSize: '12px', whiteSpace: 'nowrap', minWidth: '120px' }}>
                                            {editingDiscount === item.id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <input
                                                        type="number" step="0.01" min="0"
                                                        value={editDiscountVal}
                                                        onChange={e => setEditDiscountVal(e.target.value)}
                                                        style={{ width: '55px', padding: '3px 5px', border: '1px solid #e2e8f0', borderRadius: '4px 0 0 4px', fontSize: '12px', borderRight: 'none' }}
                                                        autoFocus
                                                        onKeyDown={e => e.key === 'Enter' && saveDiscount(item.id)}
                                                    />
                                                    <button
                                                        onClick={() => setEditDiscountType(p => p === 'fixed' ? 'percent' : 'fixed')}
                                                        style={{ padding: '3px 6px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '11px', fontWeight: '700', cursor: 'pointer', borderRadius: '0 4px 4px 0', color: '#64748b', minWidth: '26px' }}
                                                    >
                                                        {editDiscountType === 'percent' ? '%' : 'S/'}
                                                    </button>
                                                    <button onClick={() => saveDiscount(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: '2px' }}>
                                                        <Check size={14} />
                                                    </button>
                                                    <button onClick={() => setEditingDiscount(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
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
                                        onChange={e => setNewItemData({ ...newItemData, quantity: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                                <div style={{ ...S.paramGroup, width: '90px' }}>
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
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {selectedForPrint.length > 0 && (
                                    <button
                                        style={{ ...S.actionBtn, color: '#ef4444', borderColor: '#ef4444', background: '#fee2e2' }}
                                        onClick={handleDeleteSelectedItems}
                                    >
                                        <Trash2 size={16} />
                                        Eliminar ({selectedForPrint.length})
                                    </button>
                                )}
                                <button
                                    style={{
                                        ...S.actionBtn,
                                        opacity: selectedForPrint.length === 0 ? 0.5 : 1,
                                        cursor: selectedForPrint.length === 0 ? 'not-allowed' : 'pointer',
                                        background: selectedForPrint.length > 0 ? '#0f766e' : 'transparent',
                                        color: selectedForPrint.length > 0 ? 'white' : '#64748b',
                                        border: selectedForPrint.length > 0 ? 'none' : '1px solid #e2e8f0'
                                    }}
                                    onClick={() => handlePrint(budget, selectedForPrint)}
                                    disabled={selectedForPrint.length === 0}
                                >
                                    <Printer size={16} />
                                    Imprimir ({selectedForPrint.length})
                                </button>
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
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="yape">Yape / Plin</option>
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

            {/* Hidden Printable Content */}
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
