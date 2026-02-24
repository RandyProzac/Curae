import React, { useState, useEffect } from 'react';
import { X, Plus, Phone, Mail, Trash2, ChevronDown, ChevronRight, Pencil, Printer, MessageCircle } from 'lucide-react';
import { supabase, budgetsApi, paymentsApi } from '../../lib/supabase';
import { getStatusConfig } from '../../utils/constants';
import ServiceSelector from '../appointments/ServiceSelector';
import TreatmentPlans from '../clinical-history/TreatmentPlans';
import styles from './PatientDetailSidebar.module.css';

const AVATAR_COLORS = [
    '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'
];

const getColor = (name) => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const PatientDetailSidebar = ({ patient, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('citas');
    const [appointments, setAppointments] = useState([]);
    const [patientDetail, setPatientDetail] = useState(null);
    const [budgets, setBudgets] = useState([]);
    const [expandedBudgets, setExpandedBudgets] = useState({});
    const [loading, setLoading] = useState(true);

    // New budget form
    const [showNewBudget, setShowNewBudget] = useState(false);
    const [newBudgetTitle, setNewBudgetTitle] = useState('');

    // Add item form
    const [addingItemTo, setAddingItemTo] = useState(null); // budget ID
    const [newItemData, setNewItemData] = useState({ service: null, toothNumber: '', quantity: 1, price: 0, discount: 0, discountType: 'fixed' });

    // Payment modal
    const [paymentModal, setPaymentModal] = useState({ open: false, item: null });
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [paymentNotes, setPaymentNotes] = useState('');

    // Confirmation Modal
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    // Printing state
    const [printingBudgetId, setPrintingBudgetId] = useState(null);

    const handlePrint = (id) => {
        setPrintingBudgetId(id);
        // Wait for state update and render before printing
        setTimeout(() => {
            window.print();
            setPrintingBudgetId(null);
        }, 100);
    };

    useEffect(() => {
        if (isOpen && patient) {
            loadPatientData();
        }
    }, [isOpen, patient]);

    const loadPatientData = async () => {
        setLoading(true);
        try {
            const [detailRes, aptsRes, budgetsData] = await Promise.all([
                supabase.from('patients').select('*, doctor:doctors(name, color)').eq('id', patient.id).single(),
                supabase.from('appointments')
                    .select('*, doctor:doctors(name), service:services(name)')
                    .eq('patient_id', patient.id)
                    .order('date', { ascending: false })
                    .limit(20),
                budgetsApi.getByPatient(patient.id)
            ]);

            setPatientDetail(detailRes.data);
            setAppointments(aptsRes.data || []);

            // Auto-sync budget statuses on load
            const synced = await Promise.all((budgetsData || []).map(async (b) => {
                const items = b.budget_items || [];
                if (items.length === 0) return b;
                const totals = getBudgetTotalsFromItems(items); // Use updated logic
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
            console.error('Error loading patient data:', err);
        } finally {
            setLoading(false);
        }
    };

    // ===== BUDGET ACTIONS =====
    const handleCreateBudget = async () => {
        if (!newBudgetTitle.trim()) return;
        try {
            const created = await budgetsApi.create({
                patient_id: patient.id,
                title: newBudgetTitle.trim(),
                status: 'in_progress'
            });
            setBudgets([{ ...created, budget_items: [] }, ...budgets]);
            setExpandedBudgets({ ...expandedBudgets, [created.id]: true });
            setNewBudgetTitle('');
            setShowNewBudget(false);
        } catch (err) {
            console.error('Error creating budget:', err);
        }
    };

    const handleDeleteBudget = (budgetId) => {
        setConfirmModal({
            open: true,
            title: 'Eliminar Presupuesto',
            message: '¿Estás seguro de eliminar este presupuesto y todos sus items? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    await budgetsApi.delete(budgetId);
                    setBudgets(budgets.filter(b => b.id !== budgetId));
                    setConfirmModal({ ...confirmModal, open: false });
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
                discount_type: newItemData.discountType || 'fixed'
            });
            const updatedBudgets = budgets.map(b =>
                b.id === budgetId
                    ? { ...b, budget_items: [...(b.budget_items || []), { ...item, payments: [] }] }
                    : b
            );

            // Auto-check completion status with new item (balance likely increased, so status might revert if it was completed)
            const finalBudgets = await Promise.all(updatedBudgets.map(async (b) => {
                if (b.id === budgetId && b.status === 'completed') {
                    // Re-calculate with new item
                    const totals = getBudgetTotalsFromItems(b.budget_items); // No global discount needed now
                    if (totals.balance > 0) {
                        await budgetsApi.update(b.id, { status: 'in_progress' });
                        return { ...b, status: 'in_progress' };
                    }
                }
                return b;
            }));

            setBudgets(finalBudgets);
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
                    setConfirmModal({ ...confirmModal, open: false });
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
                date: new Date().toLocaleDateString('en-CA') // Save with local date to avoid TZ issues
            });
            // Update local state and check auto-complete
            const updatedBudgets = budgets.map(b => {
                const updatedItems = (b.budget_items || []).map(item =>
                    item.id === paymentModal.item.id
                        ? { ...item, paid_amount: parseFloat(item.paid_amount || 0) + amount }
                        : item
                );
                return { ...b, budget_items: updatedItems };
            });

            // Auto-complete: check if the budget containing this item is fully paid
            const finalBudgets = await Promise.all(updatedBudgets.map(async (b) => {
                const hasThisItem = (b.budget_items || []).some(i => i.id === paymentModal.item.id);
                if (hasThisItem && b.status !== 'completed') {
                    const totals = getBudgetTotalsFromItems(b.budget_items); // New logic
                    if (totals.balance <= 0 && b.budget_items.length > 0) {
                        try {
                            await budgetsApi.update(b.id, { status: 'completed' });
                            return { ...b, status: 'completed' };
                        } catch (e) { console.error('Error auto-completing budget:', e); }
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

    // ===== CALCULATIONS (Total Per Item) =====
    const getBudgetTotalsFromItems = (items) => {
        let subtotal = 0;
        let totalDiscount = 0;
        let paid = 0;

        (items || []).forEach(item => {
            const rawPrice = parseFloat(item.unit_price) * (item.quantity || 1);
            subtotal += rawPrice;

            // Calculate Item Discount
            const discountVal = parseFloat(item.discount || 0);
            const itemDiscountAmount = (item.discount_type === 'percent')
                ? (rawPrice * discountVal / 100)
                : discountVal;

            totalDiscount += itemDiscountAmount;
            paid += parseFloat(item.paid_amount || 0);
        });

        const total = Math.max(0, subtotal - totalDiscount);
        const balance = Math.max(0, total - paid);
        return { subtotal, discountAmount: totalDiscount, total, paid, balance };
    };

    const getBudgetTotals = (budget) => {
        return getBudgetTotalsFromItems(budget.budget_items);
    };

    const getGlobalBalance = () => {
        return budgets.reduce((sum, b) => sum + getBudgetTotals(b).balance, 0);
    };

    // Removed global discount handlers (updateDiscountLocal, saveDiscountToDb, toggleDiscountType)
    // as we moved to item-level discounts.

    const toggleBudget = (id) => {
        setExpandedBudgets(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (!isOpen) return null;

    const fullName = patient ? `${patient.firstName || patient.first_name || ''} ${patient.lastName || patient.last_name || ''}`.trim() : '';
    const globalBalance = getGlobalBalance();

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.sidebar}>
                {/* Header */}
                <div className={styles.header}>
                    <div
                        className={styles.avatar}
                        style={{ backgroundColor: patientDetail?.doctor?.color || getColor(fullName) }}
                    >
                        {fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.headerInfo}>
                        <h2 className={styles.patientName}>{fullName.toUpperCase()}</h2>
                        <div className={styles.headerMeta}>
                            {patient.phone && (
                                <span className={`${styles.metaTag} ${styles.phoneTag}`}>
                                    <Phone size={12} /> {patient.phone}
                                </span>
                            )}
                            <span
                                className={`${styles.metaTag} ${styles.balanceTag}`}
                                style={{ background: globalBalance > 0 ? '#f59e0b' : '#10b981' }}
                            >
                                S/ {globalBalance.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    {['citas', 'filiacion', 'planes'].map(tab => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'citas' ? 'Citas' : tab === 'filiacion' ? 'Filiación' : 'Plan de Tratamiento'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Cargando...</div>
                    ) : activeTab === 'citas' ? (
                        /* ===== CITAS TAB ===== */
                        appointments.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No hay citas registradas</p>
                            </div>
                        ) : (
                            <table className={styles.citasTable}>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Doctor</th>
                                        <th>Motivo</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map(apt => {
                                        const sc = getStatusConfig(apt.status);
                                        return (
                                            <tr key={apt.id}>
                                                <td>
                                                    {new Date(apt.date + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    {apt.start_time && <span style={{ color: '#94a3b8', marginLeft: '6px' }}>{apt.start_time.slice(0, 5)}</span>}
                                                </td>
                                                <td>{apt.doctor?.name || '-'}</td>
                                                <td>{apt.service?.name || apt.motivo || '-'}</td>
                                                <td>
                                                    <span
                                                        className={styles.statusBadge}
                                                        style={{ background: sc.bgColor, color: sc.color }}
                                                    >
                                                        {sc.icon} {sc.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )

                    ) : activeTab === 'filiacion' ? (
                        /* ===== FILIACION TAB ===== */
                        <div className={styles.filiacionGrid}>
                            <div className={styles.fieldGroup}>
                                <span className={styles.fieldLabel}>Nombres</span>
                                <span className={styles.fieldValue}>{patientDetail?.first_name || '-'}</span>
                            </div>
                            <div className={styles.fieldGroup}>
                                <span className={styles.fieldLabel}>Apellidos</span>
                                <span className={styles.fieldValue}>{patientDetail?.last_name || '-'}</span>
                            </div>
                            <div className={styles.fieldGroup}>
                                <span className={styles.fieldLabel}>DNI</span>
                                <span className={styles.fieldValue}>{patientDetail?.dni || '-'}</span>
                            </div>
                            <div className={styles.fieldGroup}>
                                <span className={styles.fieldLabel}>Teléfono</span>
                                <span className={styles.fieldValue}>{patientDetail?.phone || '-'}</span>
                            </div>
                            <div className={styles.fieldGroup}>
                                <span className={styles.fieldLabel}>Email</span>
                                <span className={styles.fieldValue}>{patientDetail?.email || '-'}</span>
                            </div>
                            <div className={styles.fieldGroup}>
                                <span className={styles.fieldLabel}>Fecha de Nacimiento</span>
                                <span className={styles.fieldValue}>
                                    {patientDetail?.date_of_birth
                                        ? `${new Date(patientDetail.date_of_birth + 'T00:00:00').toLocaleDateString('es-PE')} (${Math.floor((new Date() - new Date(patientDetail.date_of_birth + 'T00:00:00')) / (365.25 * 24 * 60 * 60 * 1000))} años)`
                                        : '-'}
                                </span>
                            </div>
                            <div className={styles.fieldGroup}>
                                <span className={styles.fieldLabel}>Doctor Responsable</span>
                                <span className={styles.fieldValue} style={{ color: patientDetail?.doctor?.color || '#0f766e', fontWeight: 'bold' }}>
                                    {patientDetail?.doctor?.name || 'No asignado'}
                                </span>
                            </div>
                            <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                                <span className={styles.fieldLabel}>Dirección</span>
                                <span className={styles.fieldValue}>{patientDetail?.address || '-'}</span>
                            </div>
                            <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                                <span className={styles.fieldLabel}>Notas</span>
                                <span className={styles.fieldValue}>{patientDetail?.notes || 'Sin notas'}</span>
                            </div>
                        </div>

                    ) : (
                        /* ===== PLANES DE TRATAMIENTO TAB ===== */
                        <TreatmentPlans
                            patientId={patient.id}
                            patientName={`${patient.first_name} ${patient.last_name}`.trim()}
                            patientPhone={patient.phone}
                            onUpdate={loadPatientData}
                        />
                    )}
                </div >
            </div >

            {/* Payment Modal */}
            {
                paymentModal.open && (
                    <div className={styles.paymentOverlay} onClick={() => setPaymentModal({ open: false, item: null })}>
                        <div className={styles.paymentModal} onClick={e => e.stopPropagation()}>
                            <div className={styles.paymentHeader}>
                                <h3>Registrar Pago — {paymentModal.item?.service_name}</h3>
                            </div>
                            <div className={styles.paymentBody}>
                                <div className={styles.paymentField}>
                                    <label>Monto (S/)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className={styles.paymentField}>
                                    <label>Método de Pago</label>
                                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="yape">Yape / Plin</option>
                                    </select>
                                </div>
                                <div className={styles.paymentField}>
                                    <label>Nota (Opcional)</label>
                                    <input
                                        placeholder="Comentario del pago..."
                                        value={paymentNotes}
                                        onChange={e => setPaymentNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.paymentActions}>
                                <button className={styles.cancelBtn} onClick={() => setPaymentModal({ open: false, item: null })}>Cancelar</button>
                                <button className={styles.confirmPayBtn} onClick={handlePayment}>Confirmar Pago</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Confirmation Modal */}
            {
                confirmModal.open && (
                    <div className={styles.paymentOverlay} onClick={() => setConfirmModal({ ...confirmModal, open: false })}>
                        <div className={styles.paymentModal} onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
                            <div className={styles.paymentHeader}>
                                <h3 style={{ color: '#ef4444' }}>{confirmModal.title}</h3>
                            </div>
                            <div style={{ padding: '24px', color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                                {confirmModal.message}
                            </div>
                            <div className={styles.paymentActions}>
                                <button className={styles.cancelBtn} onClick={() => setConfirmModal({ ...confirmModal, open: false })}>Cancelar</button>
                                <button
                                    className={styles.confirmPayBtn}
                                    style={{ background: '#ef4444' }}
                                    onClick={confirmModal.onConfirm}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default PatientDetailSidebar;
