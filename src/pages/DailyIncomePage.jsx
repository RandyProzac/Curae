import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Search, Filter, Edit2, Check, X } from 'lucide-react';
import { financeApi, doctorsApi } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import styles from './DailyIncomePage.module.css';

export default function DailyIncomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const dateParam = query.get('date');
    const { user, canViewGlobalFinance } = useAuth();

    const [selectedDate, setSelectedDate] = useState(() => {
        if (dateParam) {
            // Keep the 'T12:00:00' trick used elsewhere to prevent timezone shifts when loading date only
            return new Date(`${dateParam}T12:00:00`);
        }
        return new Date();
    });

    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [filterQuery, setFilterQuery] = useState('');
    const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');
    const [isDoctorFilterOpen, setIsDoctorFilterOpen] = useState(false);
    const [selectedMethodFilter, setSelectedMethodFilter] = useState('');
    const [isMethodFilterOpen, setIsMethodFilterOpen] = useState(false);
    
    // Inline edit state
    const [allDoctors, setAllDoctors] = useState([]);
    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [editDoctorId, setEditDoctorId] = useState('');
    const [isSavingDoctor, setIsSavingDoctor] = useState(false);

    const loadData = async (dateObj) => {
        setLoading(true);
        try {
            const dayStart = new Date(dateObj);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dateObj);
            dayEnd.setHours(23, 59, 59, 999);

            const filterDocId = canViewGlobalFinance ? null : user?.id;
            
            const [fetchedPayments, doctorsRes] = await Promise.all([
                financeApi.getDailyIncomeDetails(dayStart.toISOString(), dayEnd.toISOString(), filterDocId),
                canViewGlobalFinance ? doctorsApi.getAll() : Promise.resolve([])
            ]);
            
            setPayments(fetchedPayments);
            if (canViewGlobalFinance) setAllDoctors(doctorsRes);
        } catch (error) {
            console.error('Error fetching detailed daily income:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(selectedDate);
    }, [selectedDate]);

    const handleDateChange = (e) => {
        if (!e.target.value) return;
        const newDate = new Date(`${e.target.value}T12:00:00`);
        setSelectedDate(newDate);
        // Soft update URL without refreshing
        navigate(`/finanzas/ingresos-diarios?date=${e.target.value}`, { replace: true });
    };

    const handleEditClick = (payment) => {
        setEditingPaymentId(payment.id);
        // Find if the payment's attendingDoctor matches an existing doctor to pre-select
        const foundDoc = allDoctors.find(d => d.name === payment.attendingDoctor);
        setEditDoctorId(foundDoc ? foundDoc.id : '');
    };

    const handleCancelEdit = () => {
        setEditingPaymentId(null);
        setEditDoctorId('');
    };

    const handleSaveDoctor = async (paymentId) => {
        setIsSavingDoctor(true);
        try {
            await financeApi.updatePaymentDoctor(paymentId, editDoctorId || null);
            // Refresh data to get the updated payment with new resolved doctor
            await loadData(selectedDate);
            setEditingPaymentId(null);
            setEditDoctorId('');
        } catch (error) {
            console.error('Error updating doctor:', error);
            alert('Error al actualizar el tratante.');
        } finally {
            setIsSavingDoctor(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(val || 0);

    const formatTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const uniqueDoctors = [...new Set(payments.map(p => p.attendingDoctor).filter(Boolean))].sort();
    const uniqueMethods = [...new Set(payments.map(p => p.method).filter(Boolean))].sort();

    const filteredPayments = payments.filter(p => {
        if (selectedDoctorFilter && p.attendingDoctor !== selectedDoctorFilter) return false;
        if (selectedMethodFilter && p.method !== selectedMethodFilter) return false;
        if (!filterQuery) return true;
        const lowerQ = filterQuery.toLowerCase();
        return (
            (p.patientName && p.patientName.toLowerCase().includes(lowerQ)) ||
            (p.treatment && p.treatment.toLowerCase().includes(lowerQ)) ||
            (p.attendingDoctor && p.attendingDoctor.toLowerCase().includes(lowerQ)) ||
            (p.method && p.method.toLowerCase().includes(lowerQ))
        );
    });

    const filteredTotal = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <button className={styles.backBtn} onClick={() => navigate('/finanzas')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2>Detalle de Ingresos</h2>
                        <p>Cierre de caja y corroboración de pagos.</p>
                    </div>
                </div>

                <div className={styles.controls}>
                    <div className={styles.dateSelector}>
                        <Calendar size={18} className={styles.calendarIcon} />
                        <input
                            type="date"
                            value={(new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000))).toISOString().split('T')[0]}
                            onChange={handleDateChange}
                            className={styles.dateInput}
                        />
                    </div>
                    <div className={styles.searchBox}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar paciente, tratante..."
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <div className={styles.totalBox}>
                        <span className={styles.totalLabel}>{(filterQuery || selectedDoctorFilter || selectedMethodFilter) ? 'TOTAL FILTRADO' : 'TOTAL DEL DÍA'}</span>
                        <span className={styles.totalAmount}>{formatCurrency(filteredTotal)}</span>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className={styles.loading}>Cargando pagos del día...</div>
            ) : (
                <div className={styles.tableCard}>
                    <div className={styles.tableWrapper}>
                        {payments.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No se registraron pagos en esta fecha.</p>
                            </div>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '80px' }}>HORA</th>
                                        <th>PACIENTE</th>
                                        <th>TRATAMIENTO</th>
                                        <th className={styles.thWithFilter}>
                                            <div className={styles.thContent}>
                                                <span>TRATANTE</span>
                                                {canViewGlobalFinance && uniqueDoctors.length > 0 && (
                                                    <div className={styles.filterContainer}>
                                                        <button 
                                                            className={`${styles.filterBtn} ${selectedDoctorFilter ? styles.filterBtnActive : ''}`}
                                                            onClick={() => setIsDoctorFilterOpen(!isDoctorFilterOpen)}
                                                            title="Filtrar por tratante"
                                                        >
                                                            <Filter size={14} />
                                                        </button>
                                                        {isDoctorFilterOpen && (
                                                            <div className={styles.filterDropdown}>
                                                                <div 
                                                                    className={`${styles.filterOption} ${!selectedDoctorFilter ? styles.filterOptionActive : ''}`}
                                                                    onClick={() => { setSelectedDoctorFilter(''); setIsDoctorFilterOpen(false); }}
                                                                >
                                                                    Todos
                                                                </div>
                                                                {uniqueDoctors.map(doc => (
                                                                    <div 
                                                                        key={doc}
                                                                        className={`${styles.filterOption} ${selectedDoctorFilter === doc ? styles.filterOptionActive : ''}`}
                                                                        onClick={() => { setSelectedDoctorFilter(doc); setIsDoctorFilterOpen(false); }}
                                                                    >
                                                                        {doc}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                        <th className={styles.thWithFilter}>
                                            <div className={styles.thContent}>
                                                <span>MÉTODO</span>
                                                {uniqueMethods.length > 0 && (
                                                    <div className={styles.filterContainer}>
                                                        <button 
                                                            className={`${styles.filterBtn} ${selectedMethodFilter ? styles.filterBtnActive : ''}`}
                                                            onClick={() => setIsMethodFilterOpen(!isMethodFilterOpen)}
                                                            title="Filtrar por método"
                                                        >
                                                            <Filter size={14} />
                                                        </button>
                                                        {isMethodFilterOpen && (
                                                            <div className={styles.filterDropdown}>
                                                                <div 
                                                                    className={`${styles.filterOption} ${!selectedMethodFilter ? styles.filterOptionActive : ''}`}
                                                                    onClick={() => { setSelectedMethodFilter(''); setIsMethodFilterOpen(false); }}
                                                                >
                                                                    Todos
                                                                </div>
                                                                {uniqueMethods.map(method => (
                                                                    <div 
                                                                        key={method}
                                                                        className={`${styles.filterOption} ${selectedMethodFilter === method ? styles.filterOptionActive : ''}`}
                                                                        onClick={() => { setSelectedMethodFilter(method); setIsMethodFilterOpen(false); }}
                                                                    >
                                                                        {method}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                        <th className={styles.textRight}>MONTO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.map((p) => (
                                        <tr key={p.id}>
                                            <td className={styles.timeCell}>{formatTime(p.date)}</td>
                                            <td className={styles.boldCell}>{p.patientName}</td>
                                            <td className={styles.treatmentCell}>{p.treatment}</td>
                                            <td>
                                                {editingPaymentId === p.id ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <select
                                                            value={editDoctorId}
                                                            onChange={(e) => setEditDoctorId(e.target.value)}
                                                            style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '140px' }}
                                                            disabled={isSavingDoctor}
                                                        >
                                                            <option value="">Sin asignar (Usar Filiciación)</option>
                                                            {allDoctors.map(d => (
                                                                <option key={d.id} value={d.id}>{d.name}</option>
                                                            ))}
                                                        </select>
                                                        <button 
                                                            onClick={() => handleSaveDoctor(p.id)} 
                                                            disabled={isSavingDoctor}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: '2px' }}
                                                            title="Guardar"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={handleCancelEdit} 
                                                            disabled={isSavingDoctor}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                                                            title="Cancelar"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span className={styles.doctorBadge}>{p.attendingDoctor}</span>
                                                        {canViewGlobalFinance && (
                                                            <button 
                                                                onClick={() => handleEditClick(p)}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                                                                title="Editar tratante"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={styles.methodBadge}>{p.method}</span>
                                            </td>
                                            <td className={`${styles.textRight} ${styles.amountCell}`}>
                                                {formatCurrency(p.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className={styles.footerRow}>
                                        <td colSpan="5" className={styles.textRight} style={{ fontWeight: 'bold' }}>
                                            Total {(filterQuery || selectedDoctorFilter || selectedMethodFilter) ? 'Filtrado' : 'General'}:
                                        </td>
                                        <td className={`${styles.textRight} ${styles.amountCell}`} style={{ fontSize: '1.1rem' }}>
                                            {formatCurrency(filteredTotal)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
