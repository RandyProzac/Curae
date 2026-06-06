import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, Printer, Calendar, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, AlertCircle } from 'lucide-react';
import { vouchersApi } from '../../lib/supabase';
import { printVoucherToIframe } from '../common/PrintableVoucher';

const S = {
    container: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
        flexWrap: 'wrap', gap: '12px',
    },
    title: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: '#0f172a' },
    filters: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
    dateInput: {
        padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '8px',
        fontSize: '13px', color: '#374151', outline: 'none',
    },
    searchInput: {
        padding: '6px 10px 6px 32px', border: '1px solid #e2e8f0', borderRadius: '8px',
        fontSize: '13px', color: '#374151', outline: 'none', width: '180px',
    },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: {
        textAlign: 'left', padding: '10px 16px', fontWeight: '600', fontSize: '11px',
        color: '#64748b', textTransform: 'uppercase', background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0', cursor: 'pointer', userSelect: 'none',
    },
    tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
    td: { padding: '12px 16px', verticalAlign: 'middle', color: '#334155' },
    ticketBadge: {
        display: 'inline-block', padding: '3px 8px', background: '#f0fdf4',
        border: '1px solid #bbf7d0', borderRadius: '6px', fontFamily: 'monospace',
        fontWeight: '700', fontSize: '12px', color: '#166534',
    },
    methodsCell: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
    methodTag: {
        padding: '2px 7px', background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: '20px', fontSize: '11px', color: '#1d4ed8', fontWeight: '500',
    },
    printBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '5px 10px', border: '1px solid #0f766e', borderRadius: '6px',
        background: 'transparent', color: '#0f766e', cursor: 'pointer',
        fontSize: '12px', fontWeight: '600', transition: 'all 0.15s',
    },
    empty: { padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
    loadingRow: { padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' },
    doctorBadge: {
        display: 'inline-block', padding: '2px 8px', background: '#f8fafc',
        border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '11px',
        color: '#475569', fontWeight: '500', whiteSpace: 'nowrap',
    },
    pagination: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc',
        fontSize: '13px', color: '#64748b', flexWrap: 'wrap', gap: '8px',
    },
    pageBtn: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px',
        background: 'white', color: '#374151', cursor: 'pointer', fontSize: '13px',
        fontWeight: '500', transition: 'all 0.15s',
    },
    pageBtnActive: {
        background: '#0f766e', color: 'white', borderColor: '#0f766e', fontWeight: '700',
    },
    pageBtnDisabled: {
        opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none',
    },
};

/**
 * VoucherHistory
 * Displays a list of vouchers with date filters.
 * If patientId is passed, shows only that patient's vouchers.
 * Otherwise shows all (for Finance page).
 *
 * @prop {string}  patientId    - Optional. Filters by patient.
 * @prop {boolean} compact      - Optional. Hides patient column (useful inside patient profile).
 */
export default function VoucherHistory({ patientId = null, compact = false }) {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const fmt = (d) => d.toISOString().split('T')[0];

    const [from, setFrom] = useState(fmt(firstOfMonth));
    const [to,   setTo]   = useState(fmt(today));
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [search, setSearch]     = useState('');
    const [sort, setSort]         = useState({ col: 'created_at', asc: false });
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 15;
    const [voucherToDelete, setVoucherToDelete] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const startISO = new Date(from + 'T00:00:00').toISOString();
            const endISO   = new Date(to   + 'T23:59:59').toISOString();

            let data;
            if (patientId) {
                data = await vouchersApi.getByPatient(patientId);
                // Filter by date client-side when fetching by patient
                data = data.filter(v => v.created_at >= startISO && v.created_at <= endISO);
            } else {
                data = await vouchersApi.getByDateRange(startISO, endISO);
            }
            setVouchers(data);
        } catch (err) {
            console.error('Error loading vouchers:', err);
        } finally {
            setLoading(false);
        }
    }, [from, to, patientId]);

    useEffect(() => { load(); }, [load]);

    const handleReprint = async (voucher) => {
        try {
            const full = await vouchersApi.getById(voucher.id);
            // Call the isolated iframe print function directly
            printVoucherToIframe(full);
        } catch (err) {
            console.error('Error reprinting voucher:', err);
            alert("Error al cargar el voucher para imprimir.");
        }
    };

    const handleDelete = (voucher) => {
        setVoucherToDelete(voucher);
    };

    const confirmDelete = async () => {
        if (!voucherToDelete) return;
        try {
            await vouchersApi.delete(voucherToDelete.id);
            setVoucherToDelete(null);
            load(); // Reload the list
        } catch (err) {
            console.error('Error deleting voucher:', err);
            alert("Error al eliminar el voucher.");
        }
    };

    const toggleSort = (col) => {
        setSort(prev => ({ col, asc: prev.col === col ? !prev.asc : false }));
    };

    const filtered = vouchers
        .filter(v => {
            if (!search) return true;
            const patName = v.patient ? `${v.patient.first_name} ${v.patient.last_name}`.toLowerCase() : '';
            const ticket  = String(v.ticket_number);
            const q       = search.toLowerCase();
            return patName.includes(q) || ticket.includes(q) || (v.patient?.dni || '').includes(q);
        })
        .sort((a, b) => {
            if (sort.col === 'created_at') return sort.asc
                ? new Date(a.created_at) - new Date(b.created_at)
                : new Date(b.created_at) - new Date(a.created_at);
            if (sort.col === 'total') return sort.asc
                ? a.total_paid - b.total_paid
                : b.total_paid - a.total_paid;
            if (sort.col === 'ticket') return sort.asc
                ? a.ticket_number - b.ticket_number
                : b.ticket_number - a.ticket_number;
            return 0;
        });

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [from, to, search, sort.col, sort.asc]);

    const SortIcon = ({ col }) => sort.col === col
        ? (sort.asc ? <ChevronUp size={13} /> : <ChevronDown size={13} />)
        : null;

    const totalSum = filtered.reduce((s, v) => s + parseFloat(v.total_paid || 0), 0);

    return (
        <div style={S.container}>
            {/* Header / Filters */}
            <div style={S.header}>
                <div style={S.title}>
                    <Receipt size={18} color="#0f766e" />
                    Historial de Vouchers
                    {!loading && <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}>({filtered.length})</span>}
                </div>
                <div style={S.filters}>
                    {!compact && (
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={14} style={{ position: 'absolute', left: '8px', color: '#94a3b8' }} />
                            <input
                                id="voucher-search"
                                type="text"
                                placeholder="Buscar paciente, ticket, DNI..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={S.searchInput}
                            />
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                        <Calendar size={14} />
                        <input id="voucher-from" type="date" value={from} onChange={e => setFrom(e.target.value)} style={S.dateInput} />
                        <span>→</span>
                        <input id="voucher-to"   type="date" value={to}   onChange={e => setTo(e.target.value)}   style={S.dateInput} />
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div style={S.loadingRow}>Cargando vouchers...</div>
            ) : filtered.length === 0 ? (
                <div style={S.empty}>
                    <Receipt size={36} style={{ opacity: 0.2, marginBottom: '8px' }} />
                    <p>No hay vouchers en el período seleccionado.</p>
                </div>
            ) : (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    <th style={S.th} onClick={() => toggleSort('ticket')}>
                                        Nro Ticket <SortIcon col="ticket" />
                                    </th>
                                    <th style={S.th} onClick={() => toggleSort('created_at')}>
                                        Fecha / Hora <SortIcon col="created_at" />
                                    </th>
                                    {!compact && <th style={S.th}>Paciente</th>}
                                    {!compact && <th style={S.th}>Doctor</th>}
                                    <th style={S.th}>Servicios</th>
                                    <th style={{ ...S.th, textAlign: 'right' }} onClick={() => toggleSort('total')}>
                                        Total <SortIcon col="total" />
                                    </th>
                                    <th style={S.th}>Métodos de Pago</th>
                                    <th style={S.th}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map(v => {
                                    const createdAt = new Date(v.created_at);
                                    const fecha = createdAt.toLocaleDateString('es-PE');
                                    const hora  = createdAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                                    const patName = v.patient ? `${v.patient.first_name} ${v.patient.last_name}` : '—';
                                    const services = (v.voucher_items || []).map(i => i.service_name).join(', ');
                                    const methods  = v.voucher_payment_methods || [];

                                    return (
                                        <tr key={v.id} style={S.tr}>
                                            <td style={S.td}>
                                                <span style={S.ticketBadge}>
                                                    #{String(v.ticket_number).padStart(8, '0')}
                                                </span>
                                            </td>
                                            <td style={S.td}>
                                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{fecha}</div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{hora}</div>
                                            </td>
                                            {!compact && (
                                                <td style={S.td}>
                                                    <div style={{ fontWeight: '600' }}>{patName}</div>
                                                    {v.patient?.dni && <div style={{ fontSize: '11px', color: '#94a3b8' }}>DNI: {v.patient.dni}</div>}
                                                </td>
                                            )}
                                            {!compact && (
                                                <td style={S.td}>
                                                    {v.doctor?.name ? (
                                                        <span style={S.doctorBadge}>{v.doctor.name}</span>
                                                    ) : (
                                                        <span style={{ ...S.doctorBadge, color: '#94a3b8', borderStyle: 'dashed' }}>Sin asignar</span>
                                                    )}
                                                </td>
                                            )}
                                            <td style={{ ...S.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={services}>
                                                {services || '—'}
                                            </td>
                                            <td style={{ ...S.td, textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                                                S/ {parseFloat(v.total_paid || 0).toFixed(2)}
                                            </td>
                                            <td style={S.td}>
                                                <div style={S.methodsCell}>
                                                    {methods.map((m, i) => (
                                                        <span key={i} style={S.methodTag}>
                                                            {m.method} S/{parseFloat(m.amount).toFixed(2)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={S.td}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleReprint(v)}
                                                        style={{ ...S.actionBtn, color: '#0f766e', borderColor: '#ccfbf1', background: '#f0fdfa' }}
                                                        title="Reimprimir Voucher"
                                                    >
                                                        <Printer size={16} /> Reimprimir
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(v)}
                                                        style={{ ...S.actionBtn, color: '#e11d48', borderColor: '#ffe4e6', background: '#fff1f2' }}
                                                        title="Eliminar Voucher"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                                    <td colSpan={compact ? 4 : 6} style={{ ...S.td, fontWeight: '700', color: '#374151' }}>
                                        Total período ({filtered.length} vouchers):
                                    </td>
                                    <td style={{ ...S.td, textAlign: 'right', fontWeight: '800', fontSize: '15px', color: '#059669' }}>
                                        S/ {totalSum.toFixed(2)}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={S.pagination}>
                            <span>
                                Mostrando {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length}
                            </span>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <button
                                    style={{ ...S.pageBtn, ...(safePage <= 1 ? S.pageBtnDisabled : {}) }}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={safePage <= 1}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                                    .reduce((acc, p, idx, arr) => {
                                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) => p === '...' ? (
                                        <span key={`dots-${i}`} style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            style={{ ...S.pageBtn, ...(p === safePage ? S.pageBtnActive : {}) }}
                                            onClick={() => setCurrentPage(p)}
                                        >
                                            {p}
                                        </button>
                                    ))
                                }
                                <button
                                    style={{ ...S.pageBtn, ...(safePage >= totalPages ? S.pageBtnDisabled : {}) }}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={safePage >= totalPages}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Delete Confirmation Modal */}
            {voucherToDelete && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', borderRadius: '12px', width: '450px', maxWidth: '90%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#e11d48' }}>
                            <AlertCircle size={24} />
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>Eliminar Voucher</h3>
                        </div>
                        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                            ¿Estás seguro que deseas eliminar el voucher <strong>B{String(voucherToDelete.ticket_number ?? '').padStart(8, '0')}</strong>?
                        </p>
                        
                        <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '14px', marginBottom: '24px', fontSize: '13px', color: '#9f1239' }}>
                            <strong>Esta acción:</strong>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', lineHeight: '1.6' }}>
                                <li>Eliminará el registro del voucher del sistema.</li>
                                <li>Eliminará los pagos asociados en los reportes de Finanzas.</li>
                                <li><strong>Revertirá el saldo pagado</strong> en los tratamientos del paciente (volverán a estar pendientes).</li>
                            </ul>
                            <p style={{ marginTop: '12px', marginBottom: 0, fontWeight: '700' }}>Esta acción NO se puede deshacer.</p>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                onClick={() => setVoucherToDelete(null)} 
                                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '500', cursor: 'pointer', transition: 'background 0.15s' }}
                                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseOut={e => e.currentTarget.style.background = 'white'}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#e11d48', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s' }}
                                onMouseOver={e => e.currentTarget.style.background = '#be123c'}
                                onMouseOut={e => e.currentTarget.style.background = '#e11d48'}
                            >
                                <Trash2 size={16} /> Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
