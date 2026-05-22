import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

const PAYMENT_METHODS = ['Efectivo', 'VISA', 'Mastercard', 'BCP', 'Interbank', 'BBVA', 'Yape', 'Plin', 'Transferencia'];

const S = {
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    },
    modal: {
        background: 'white', borderRadius: '16px', width: '100%', maxWidth: '620px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
        borderRadius: '16px 16px 0 0',
    },
    headerTitle: { color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 },
    headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: '12px', marginTop: '2px' },
    closeBtn: {
        background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px',
        color: 'white', cursor: 'pointer', padding: '6px', display: 'flex',
        alignItems: 'center', transition: 'background 0.2s',
    },
    body: { padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' },
    sectionTitle: { fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' },
    itemRow: {
        display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center',
        gap: '12px', padding: '10px 14px', background: '#f8fafc',
        borderRadius: '10px', border: '1px solid #e2e8f0',
    },
    itemName: { fontWeight: '600', fontSize: '14px', color: '#0f172a' },
    itemSub:  { fontSize: '12px', color: '#64748b', marginTop: '2px' },
    amountInput: {
        width: '110px', padding: '8px 10px', border: '1.5px solid #e2e8f0',
        borderRadius: '8px', fontSize: '14px', fontWeight: '600', textAlign: 'right',
        outline: 'none', transition: 'border-color 0.2s', color: '#0f172a',
    },
    methodRow: {
        display: 'grid', gridTemplateColumns: '1fr 130px 36px',
        alignItems: 'center', gap: '8px',
    },
    select: {
        padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px',
        fontSize: '14px', outline: 'none', background: 'white', color: '#0f172a', cursor: 'pointer',
    },
    addMethodBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 14px', border: '1.5px dashed #0f766e', borderRadius: '8px',
        background: 'transparent', color: '#0f766e', cursor: 'pointer',
        fontSize: '13px', fontWeight: '600', transition: 'all 0.15s',
    },
    removeBtn: {
        background: '#fee2e2', border: 'none', borderRadius: '6px', color: '#ef4444',
        cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center',
    },
    totalBar: {
        padding: '14px 16px', borderRadius: '10px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        border: '1.5px solid', marginTop: '4px',
    },
    footer: {
        padding: '16px 24px', borderTop: '1px solid #e2e8f0',
        display: 'flex', gap: '10px', justifyContent: 'flex-end',
    },
    cancelBtn: {
        padding: '10px 20px', border: '1.5px solid #e2e8f0', borderRadius: '8px',
        background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
    },
    confirmBtn: {
        padding: '10px 22px', border: 'none', borderRadius: '8px',
        color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
        display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s',
    },
};

/**
 * MultiPaymentModal
 * Allows paying multiple budget items in one transaction, with optional split payment methods.
 * Generates a voucher on confirm.
 *
 * @prop {Array}    items      - Budget items with pending balance (budget_item objects)
 * @prop {object}   patient    - { id, first_name, last_name, dni }
 * @prop {string}   budgetId   - Budget id
 * @prop {string}   doctorId   - Attending doctor id
 * @prop {Function} onConfirm  - async (voucher) => void
 * @prop {Function} onClose    - () => void
 */
export default function MultiPaymentModal({ items = [], patient, budgetId, doctorId, onConfirm, onClose }) {

    // Per-item amounts: { [itemId]: string }
    const [amounts, setAmounts] = useState(() =>
        Object.fromEntries(items.map(it => {
            const raw   = parseFloat(it.unit_price) * (it.quantity || 1);
            const disc  = parseFloat(it.discount || 0);
            const itemD = it.discount_type === 'percent' ? (raw * disc / 100) : disc;
            const remaining = Math.max(0, raw - itemD - parseFloat(it.paid_amount || 0));
            return [it.id, remaining.toFixed(2)];
        }))
    );

    // Payment methods: [{ id, method, amount }]
    const [methods, setMethods] = useState([{ id: Date.now(), method: 'Efectivo', amount: '' }]);

    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const totalItems   = useMemo(() => Object.values(amounts).reduce((s, v) => s + (parseFloat(v) || 0), 0), [amounts]);
    const totalMethods = useMemo(() => methods.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0), [methods]);
    const balanced     = Math.abs(totalItems - totalMethods) < 0.01;

    // When totalItems changes, auto-fill first method amount
    const syncFirstMethod = (newTotal) => {
        setMethods(prev => {
            if (prev.length === 1) {
                return [{ ...prev[0], amount: newTotal.toFixed(2) }];
            }
            return prev;
        });
    };

    const handleAmountChange = (itemId, val) => {
        const it = items.find(i => i.id === itemId);
        if (!it) return;
        const raw      = parseFloat(it.unit_price) * (it.quantity || 1);
        const disc     = parseFloat(it.discount || 0);
        const itemD    = it.discount_type === 'percent' ? (raw * disc / 100) : disc;
        const remaining = Math.max(0, raw - itemD - parseFloat(it.paid_amount || 0));
        const clamped  = Math.min(parseFloat(val) || 0, remaining);
        const next     = { ...amounts, [itemId]: clamped > 0 ? String(clamped) : val };
        setAmounts(next);
        const newTotal = Object.values(next).reduce((s, v) => s + (parseFloat(v) || 0), 0);
        syncFirstMethod(newTotal);
    };

    const addMethod = () => {
        setMethods(prev => [...prev, { id: Date.now(), method: 'BCP', amount: '' }]);
    };

    const removeMethod = (id) => {
        setMethods(prev => prev.filter(m => m.id !== id));
    };

    const updateMethod = (id, field, val) => {
        setMethods(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
    };

    const handleConfirm = async () => {
        setError('');
        if (totalItems <= 0) { setError('El monto total a cobrar debe ser mayor a 0.'); return; }
        if (!balanced)        { setError(`La suma de métodos de pago (S/ ${totalMethods.toFixed(2)}) debe ser igual al total cobrado (S/ ${totalItems.toFixed(2)}).`); return; }

        const itemsPayload = items
            .filter(it => parseFloat(amounts[it.id] || 0) > 0)
            .map(it => ({
                budgetItemId: it.id,
                serviceName:  it.service_name,
                quantity:     it.quantity || 1,
                unitPrice:    it.unit_price,
                amountPaid:   parseFloat(amounts[it.id] || 0),
            }));

        const methodsPayload = methods
            .filter(m => parseFloat(m.amount || 0) > 0)
            .map(m => ({ method: m.method, amount: parseFloat(m.amount) }));

        try {
            setLoading(true);
            await onConfirm({ items: itemsPayload, paymentMethods: methodsPayload });
        } catch (err) {
            setError(err.message || 'Error al registrar el cobro. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={S.modal}>
                {/* Header */}
                <div style={S.header}>
                    <div>
                        <p style={S.headerTitle}>💳 Cobrar y Generar Voucher</p>
                        <p style={S.headerSub}>
                            {patient ? `${patient.first_name} ${patient.last_name}` : 'Paciente'} · {items.length} servicio(s) seleccionado(s)
                        </p>
                    </div>
                    <button style={S.closeBtn} onClick={onClose} title="Cerrar">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={S.body}>
                    {/* Section 1: Items */}
                    <div>
                        <p style={S.sectionTitle}>📋 Servicios a Cobrar</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {items.map(it => {
                                const raw      = parseFloat(it.unit_price) * (it.quantity || 1);
                                const disc     = parseFloat(it.discount || 0);
                                const itemD    = it.discount_type === 'percent' ? (raw * disc / 100) : disc;
                                const remaining = Math.max(0, raw - itemD - parseFloat(it.paid_amount || 0));
                                return (
                                    <div key={it.id} style={S.itemRow}>
                                        <div>
                                            <p style={S.itemName}>{it.service_name}</p>
                                            <p style={S.itemSub}>
                                                Saldo pendiente: <strong>S/ {remaining.toFixed(2)}</strong>
                                                {parseFloat(it.paid_amount || 0) > 0 && ` · Ya pagado: S/ ${parseFloat(it.paid_amount).toFixed(2)}`}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>S/</span>
                                            <input
                                                id={`amount-item-${it.id}`}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max={remaining}
                                                value={amounts[it.id] ?? ''}
                                                onChange={e => handleAmountChange(it.id, e.target.value)}
                                                style={{
                                                    ...S.amountInput,
                                                    borderColor: parseFloat(amounts[it.id] || 0) > 0 ? '#0f766e' : '#e2e8f0',
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: Payment Methods */}
                    <div>
                        <p style={S.sectionTitle}>💰 Métodos de Pago</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {methods.map((m, idx) => (
                                <div key={m.id} style={S.methodRow}>
                                    <select
                                        id={`method-select-${m.id}`}
                                        style={S.select}
                                        value={m.method}
                                        onChange={e => updateMethod(m.id, 'method', e.target.value)}
                                    >
                                        {PAYMENT_METHODS.map(pm => (
                                            <option key={pm} value={pm}>{pm}</option>
                                        ))}
                                    </select>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>S/</span>
                                        <input
                                            id={`method-amount-${m.id}`}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={m.amount}
                                            onChange={e => updateMethod(m.id, 'amount', e.target.value)}
                                            style={{ ...S.amountInput, width: '90px' }}
                                        />
                                    </div>
                                    {methods.length > 1 && (
                                        <button style={S.removeBtn} onClick={() => removeMethod(m.id)} title="Eliminar método">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    {methods.length === 1 && <div />}
                                </div>
                            ))}
                            <button style={S.addMethodBtn} onClick={addMethod}>
                                <Plus size={14} /> Agregar otro método
                            </button>
                        </div>
                    </div>

                    {/* Total indicator */}
                    <div style={{
                        ...S.totalBar,
                        borderColor: balanced ? '#10b981' : '#f59e0b',
                        background:  balanced ? '#f0fdf4' : '#fffbeb',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {balanced
                                ? <CheckCircle2 size={18} color="#10b981" />
                                : <AlertCircle  size={18} color="#f59e0b" />
                            }
                            <span style={{ fontSize: '13px', fontWeight: '600', color: balanced ? '#166534' : '#92400e' }}>
                                {balanced ? 'Montos cuadrados ✓' : 'Los montos no cuadran'}
                            </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                Total cobrado: <strong>S/ {totalItems.toFixed(2)}</strong>
                            </p>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                Total métodos: <strong>S/ {totalMethods.toFixed(2)}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={S.footer}>
                    <button style={S.cancelBtn} onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        id="btn-confirm-payment"
                        style={{
                            ...S.confirmBtn,
                            background: balanced && !loading ? 'linear-gradient(135deg, #0f766e, #134e4a)' : '#94a3b8',
                            cursor: balanced && !loading ? 'pointer' : 'not-allowed',
                        }}
                        onClick={handleConfirm}
                        disabled={!balanced || loading}
                    >
                        {loading ? '⏳ Registrando...' : '✅ Confirmar Cobro y Generar Voucher'}
                    </button>
                </div>
            </div>
        </div>
    );
}
