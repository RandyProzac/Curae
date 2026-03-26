import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Search, Users, CalendarDays } from 'lucide-react';
import { financeApi } from '../lib/supabase';
import styles from './MonthlyIncomePage.module.css';

export default function MonthlyIncomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const dateParam = query.get('month'); // YYYY-MM format

    const [selectedMonth, setSelectedMonth] = useState(() => {
        if (dateParam) {
            const [year, month] = dateParam.split('-');
            return new Date(parseInt(year), parseInt(month) - 1, 1);
        }
        return new Date();
    });

    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('patient'); // 'patient' or 'day'
    const [patientTotals, setPatientTotals] = useState([]);
    const [dayTotals, setDayTotals] = useState([]);
    const [filterQuery, setFilterQuery] = useState('');

    const loadData = async (dateObj) => {
        setLoading(true);
        try {
            // First day
            const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Last day
            const endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);

            const summarizedData = await financeApi.getMonthlyIncomeDetails(startOfMonth.toISOString(), endOfMonth.toISOString());

            setPatientTotals(summarizedData.byPatient || []);
            setDayTotals(summarizedData.byDay || []);
        } catch (error) {
            console.error('Error fetching monthly income details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(selectedMonth);
    }, [selectedMonth]);

    const handleMonthChange = (e) => {
        if (!e.target.value) return;
        const [year, month] = e.target.value.split('-');
        const newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        setSelectedMonth(newDate);
        // Soft update URL
        navigate(`/finanzas/ingresos-mensuales?month=${e.target.value}`, { replace: true });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(val || 0);

    // Format current title: e.g. "Febrero 2026"
    const displayTitle = selectedMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const capitalizedTitle = displayTitle.charAt(0).toUpperCase() + displayTitle.slice(1);

    const filteredPatients = patientTotals.filter(pt => {
        if (!filterQuery) return true;
        const lowerQ = filterQuery.toLowerCase();
        return pt.patientName.toLowerCase().includes(lowerQ);
    });

    const filteredDays = dayTotals.filter(dt => {
        if (!filterQuery) return true;
        // Allows filtering by "01", "2026", "25", etc.
        const dateStr = formatClientDate(dt.day);
        return dateStr.toLowerCase().includes(filterQuery.toLowerCase());
    });

    const activeList = viewMode === 'patient' ? filteredPatients : filteredDays;
    const filteredTotal = activeList.reduce((acc, item) => acc + (item.total || 0), 0);

    // Helper formatter for the day view to show e.g. "Martes, 24 de febrero"
    function formatClientDate(isoString) {
        if (!isoString) return '';
        // Note: split by '-' and use local Date to avoid TZ shift
        const [y, m, d] = isoString.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        const formatted = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <button className={styles.backBtn} onClick={() => navigate('/finanzas')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ textTransform: 'capitalize' }}>{capitalizedTitle}</h2>
                        <p>Resumen de lista mensual por paciente.</p>
                    </div>
                </div>

                <div className={styles.controls}>
                    <div className={styles.viewToggleGroup}>
                        <button
                            className={`${styles.viewToggleBtn} ${viewMode === 'patient' ? styles.viewToggleActive : ''}`}
                            onClick={() => setViewMode('patient')}
                        >
                            <Users size={16} /> Pacientes
                        </button>
                        <button
                            className={`${styles.viewToggleBtn} ${viewMode === 'day' ? styles.viewToggleActive : ''}`}
                            onClick={() => setViewMode('day')}
                        >
                            <CalendarDays size={16} /> Días
                        </button>
                    </div>

                    <div className={styles.dateSelector}>
                        <Calendar size={18} className={styles.calendarIcon} />
                        <input
                            type="month"
                            value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                            onChange={handleMonthChange}
                            className={styles.dateInput}
                        />
                    </div>
                    <div className={styles.searchBox}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={viewMode === 'patient' ? "Buscar paciente..." : "Buscar día..."}
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <div className={styles.totalBox}>
                        <span className={styles.totalLabel}>{filterQuery ? 'TOTAL FILTRADO' : 'TOTAL DEL MES'}</span>
                        <span className={styles.totalAmount}>{formatCurrency(filteredTotal)}</span>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className={styles.loading}>Consolidando mes y calculando totales...</div>
            ) : (
                <div className={styles.tableCard}>
                    <div className={styles.tableWrapper}>
                        {activeList.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No hay ingresos registrados en este mes con los filtros actuales.</p>
                            </div>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>{viewMode === 'patient' ? 'PACIENTE' : 'FECHA'}</th>
                                        <th className={styles.textRight} style={{ width: '200px' }}>TOTAL ABONADO EN EL MES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeList.map((item, index) => (
                                        <tr key={viewMode === 'patient' ? item.patientId : item.day || index}>
                                            <td className={styles.boldCell}>
                                                {viewMode === 'patient' ? item.patientName : formatClientDate(item.day)}
                                            </td>
                                            <td className={`${styles.textRight} ${styles.amountCell}`}>
                                                {formatCurrency(item.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className={styles.footerRow}>
                                        <td className={styles.textRight} style={{ fontWeight: 'bold' }}>
                                            Total {filterQuery ? 'Filtrado' : 'Abonado en el Mes'}:
                                        </td>
                                        <td className={`${styles.textRight} ${styles.amountCell}`} style={{ fontSize: '1.2rem' }}>
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
