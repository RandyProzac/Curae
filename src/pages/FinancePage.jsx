import React, { useState, useEffect } from 'react';
import {
    Plus, Wallet, Activity, AlertTriangle,
    ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Calendar,
    Edit2, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import supabase, { expensesApi, cashFlowApi, financeApi } from '../lib/supabase';
import ExpenseModal from '../components/finance/ExpenseModal';
import styles from './FinancePage.module.css';

// Chart Colors
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const FinancePage = () => {
    const [activeTab, setActiveTab] = useState('cashflow'); // 'cashflow', 'expenses', 'inventory'
    const [loading, setLoading] = useState(false);

    // -- VIEW STATE (Expenses) --
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());

    // -- SHARED STATE --
    const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0, expensesByCategory: [] });

    // -- CASHFLOW TAB STATE --
    const [trendData, setTrendData] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [allPatients, setAllPatients] = useState([]); // Store all for search
    const [patientSearch, setPatientSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('year'); // 'month', 'year'

    // -- EXPENSES TAB STATE --
    const [expenses, setExpenses] = useState([]);
    const [editingExpense, setEditingExpense] = useState(null);

    // -- MODALS --
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    // -- DAILY CLOSE STATE --
    // Use 'en-CA' to get YYYY-MM-DD format respecting local timezone
    const [dailyDate, setDailyDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [dailyPayments, setDailyPayments] = useState([]);

    useEffect(() => {
        if (activeTab === 'cashflow') {
            const fetchDaily = async () => {
                const { data, error } = await supabase
                    .from('payments')
                    .select('*, patients(first_name, last_name)')
                    .eq('date', dailyDate)
                    .order('created_at', { ascending: false });
                if (error) console.error('Error fetching daily payments:', error);
                setDailyPayments(data || []);
            };
            fetchDaily();
        }
    }, [dailyDate, activeTab]);

    // Daily Calculations
    const dailyTotal = dailyPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const byMethod = dailyPayments.reduce((acc, p) => {
        const m = p.payment_method || 'Otros';
        acc[m] = (acc[m] || 0) + parseFloat(p.amount);
        return acc;
    }, {});

    // Initial Load
    useEffect(() => {
        loadData();
    }, [activeTab, dateFilter, viewYear, viewMonth]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Use selected View Date instead of current date
            const startOfMonth = new Date(viewYear, viewMonth, 1).toISOString();
            const endOfMonth = new Date(viewYear, viewMonth + 1, 0).toISOString(); // Last day of viewMonth

            if (activeTab === 'cashflow') {
                // 1. KPI Summary (Selected Month)
                const sumData = await cashFlowApi.getSummary(startOfMonth, endOfMonth);
                setSummary(sumData);

                // 2. Trend Chart (Selected Year)
                const trend = await cashFlowApi.getMonthlyTrend(viewYear);
                setTrendData(trend);

                // 3. Payment Methods (Use Selected Year? Or All Time?) 
                // Let's stick to consistent scope. Ideally should accept date range, but current API is all-time.
                // Keeping as is for now, or TODO: Enhance API to accept year.
                const methods = await financeApi.getPaymentMethodBreakdown();
                setPaymentMethods(methods);

                // 4. Patients Income (All Time for now as it's a leader board)
                const patients = await financeApi.getInvestmentByPatient();
                setAllPatients(patients);

            } else if (activeTab === 'fixed' || activeTab === 'variable') {
                const data = await expensesApi.getAll();
                setExpenses(data);
                // Also refresh summary for the header cards (Selected Month)
                const sumData = await cashFlowApi.getSummary(startOfMonth, endOfMonth);
                setSummary(sumData);
            }
        } catch (error) {
            console.error('Error loading finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic for Patients
    const getDisplayedPatients = () => {
        let filtered = allPatients;
        if (patientSearch) {
            const lower = patientSearch.toLowerCase();
            filtered = allPatients.filter(p =>
                p.patient_name.toLowerCase().includes(lower) ||
                (p.dni && p.dni.includes(lower))
            );
        }
        // Always show top 10 of the filtered result
        return filtered.slice(0, 10);
    };

    // --- HANDLERS ---

    // Expenses
    const handleOpenCreateExpense = () => {
        setEditingExpense(null);
        setIsExpenseModalOpen(true);
    };

    const handleEditExpense = (expense) => {
        setEditingExpense(expense);
        setIsExpenseModalOpen(true);
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este gasto? Esto actualizará el flujo de caja.')) {
            try {
                await expensesApi.delete(id);
                loadData();
            } catch (error) {
                alert('Error al eliminar: ' + error.message);
            }
        }
    };

    const handleSaveExpense = async (expenseData) => {
        if (editingExpense) {
            await expensesApi.update(editingExpense.id, expenseData);
        } else {
            await expensesApi.create(expenseData);
        }
        loadData(); // This refreshes table AND summary balance
    };



    const handleGenerateDemoData = async () => {
        if (!window.confirm('¿Generar 10 gastos variables de prueba?')) return;
        setLoading(true);
        try {
            const demos = [
                { category: 'Mantenimiento', description: 'Reparación de aire acondicionado', amount: 350, type: 'VARIABLE' },
                { category: 'Mantenimiento', description: 'Pintura de fachada', amount: 1200, type: 'VARIABLE' },
                { category: 'Marketing', description: 'Promoción especial Redes Sociales', amount: 500, type: 'VARIABLE' },
                { category: 'Marketing', description: 'Souvenirs para pacientes', amount: 200, type: 'VARIABLE' },
                { category: 'Mobiliario', description: 'Silla ergonómica recepción', amount: 450, type: 'VARIABLE' },
                { category: 'Materiales', description: 'Insumos de limpieza extra', amount: 120, type: 'VARIABLE' },
                { category: 'Servicios', description: 'Reparación tubería', amount: 180, type: 'VARIABLE' },
                { category: 'Eventos', description: 'Coffee break capacitación', amount: 150, type: 'VARIABLE' },
                { category: 'Mobiliario', description: 'Lámpara de escritorio', amount: 80, type: 'VARIABLE' },
                { category: 'Otros', description: 'Decoración sala de espera', amount: 300, type: 'VARIABLE' }
            ];
            // Date = 15th of current view month
            const dateStr = new Date(viewYear, viewMonth, 15).toISOString().split('T')[0];

            for (const demo of demos) {
                await expensesApi.create({ ...demo, date: dateStr, status: 'pagado' });
            }
            await loadData();
            alert('Datos generados correctamente.');
        } catch (e) {
            console.error(e);
            alert('Error generando datos.');
        } finally {
            setLoading(false);
        }
    };

    // Utils
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount || 0);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#1e293b' }}>{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} style={{ color: entry.color, fontSize: '0.9rem', marginBottom: '4px' }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <h2>Finanzas y Reportes</h2>
                    <p>Control integral de caja, gastos e inventario.</p>
                </div>
                <div className={styles.tabsContainer}>
                    <button
                        className={`${styles.tab} ${activeTab === 'cashflow' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('cashflow')}
                    >
                        <Activity size={18} style={{ marginRight: 6, marginBottom: -2 }} />
                        Flujo de Caja
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'fixed' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('fixed')}
                    >
                        <DollarSign size={18} style={{ marginRight: 6, marginBottom: -2 }} />
                        Gastos Fijos
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'variable' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('variable')}
                    >
                        <TrendingUp size={18} style={{ marginRight: 6, marginBottom: -2 }} />
                        Gastos Variables
                    </button>
                </div>
            </header>

            <div className={styles.contentArea}>
                {loading && !summary.income ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cargando datos...</div>
                ) : (
                    <>
                        {/* TAB 1: CASH FLOW (MERGED DASHBOARD) */}
                        {activeTab === 'cashflow' && (
                            <div className={styles.dashboardGrid}>
                                {/* --- NAVIGATION CONTROLS (Year & Month) --- */}
                                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: '1 / -1', marginBottom: '24px' }}>
                                    {/* Year Selector */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                                        <button
                                            onClick={() => setViewYear(prev => prev - 1)}
                                            className={styles.iconBtn}
                                            style={{ background: '#f1f5f9', padding: 8, borderRadius: '50%' }}
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b', fontWeight: 800 }}>{viewYear}</h2>
                                        <button
                                            onClick={() => setViewYear(prev => prev + 1)}
                                            className={styles.iconBtn}
                                            style={{ background: '#f1f5f9', padding: 8, borderRadius: '50%' }}
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>

                                    {/* Month Tabs */}
                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', justifyContent: 'space-between' }}>
                                        {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((m, i) => (
                                            <button
                                                key={m}
                                                onClick={() => setViewMonth(i)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    border: 'none',
                                                    background: viewMonth === i ? '#3b82f6' : 'transparent',
                                                    color: viewMonth === i ? 'white' : '#64748b',
                                                    fontWeight: viewMonth === i ? 600 : 500,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ROW 1: KPIs */}
                                <div className={styles.kpiRow}>
                                    <div className={styles.kpiCard}>
                                        <span className={styles.kpiLabel}>Ingresos ({['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][viewMonth]})</span>
                                        <div className={styles.kpiValue} style={{ color: '#10b981' }}>
                                            {formatCurrency(summary.income)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#10b981' }}>
                                            <ArrowUpRight size={14} /> Entradas totales
                                        </div>
                                    </div>
                                    <div className={styles.kpiCard}>
                                        <span className={styles.kpiLabel}>Egresos ({['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][viewMonth]})</span>
                                        <div className={styles.kpiValue} style={{ color: '#ef4444' }}>
                                            {formatCurrency(summary.expenses)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#ef4444' }}>
                                            <ArrowDownRight size={14} /> Salidas totales
                                        </div>
                                    </div>
                                    <div className={styles.kpiCard}>
                                        <span className={styles.kpiLabel}>Balance Neto</span>
                                        <div className={styles.kpiValue} style={{ color: summary.balance >= 0 ? '#3b82f6' : '#64748b' }}>
                                            {formatCurrency(summary.balance)}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            Rentabilidad del periodo
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 2: CHART (Ingresos vs Gastos) */}
                                <div className={styles.chartContainer} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Evolución Anual: {viewYear}</h3>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></span> Ingresos
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></span> Gastos
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ width: '100%', height: 350 }}>
                                        <ResponsiveContainer>
                                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `S/ ${val / 1000}k`} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                                                <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* ROW 3: LISTS & PIE */}
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>

                                    {/* Top Patients */}
                                    <div className={styles.tableContainer} style={{ height: 'fit-content' }}>
                                        <div className={styles.actionHeader} style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', marginBottom: 0, flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Top Pacientes (Ingresos Generados)</h3>
                                            <div style={{ position: 'relative', width: '100%' }}>
                                                <input // Search Input
                                                    type="text"
                                                    placeholder="Buscar paciente por nombre o DNI..."
                                                    value={patientSearch}
                                                    onChange={(e) => setPatientSearch(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px 12px 8px 36px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #e2e8f0',
                                                        fontSize: '0.9rem'
                                                    }}
                                                />
                                                <div style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <table className={styles.table}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    <th>Paciente</th>
                                                    <th style={{ textAlign: 'right' }}>Total Invertido</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getDisplayedPatients().map((p, i) => (
                                                    <tr key={i}>
                                                        <td>
                                                            <div style={{ fontWeight: 600, color: '#334155' }}>{p.name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.dni || 'Sin DNI'}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                                                            + {formatCurrency(p.totalPaid)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {getDisplayedPatients().length === 0 && (
                                                    <tr>
                                                        <td colSpan="2" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                                                            No se encontraron pacientes.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Payment Methods */}
                                    <div className={styles.chartContainer} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <h3 style={{ margin: '0 0 20px', fontSize: '1rem', color: '#1e293b' }}>Métodos de Pago</h3>
                                        <div style={{ width: '100%', height: 250 }}>
                                            <ResponsiveContainer>
                                                <PieChart>
                                                    <Pie
                                                        data={paymentMethods}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {paymentMethods.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(val) => formatCurrency(val)} />
                                                    <Legend verticalAlign="bottom" height={36} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DAILY CLOSE SECTION */}
                        <div className={styles.tableContainer} style={{ marginTop: '30px', borderTop: '4px solid #3b82f6' }}>
                            <div className={styles.actionHeader} style={{ padding: '20px', background: '#eff6ff', borderBottom: '1px solid #dbeafe' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1.1rem' }}>📅 Cierre de Caja Diario</h3>
                                    <p style={{ margin: '4px 0 0', color: '#60a5fa', fontSize: '0.85rem' }}>Verificación de ingresos por día</p>
                                </div>
                                <input
                                    type="date"
                                    value={dailyDate}
                                    onChange={(e) => setDailyDate(e.target.value)}
                                    style={{
                                        padding: '8px 12px', borderRadius: '8px', border: '1px solid #bfdbfe',
                                        color: '#1e40af', fontWeight: 600, outline: 'none'
                                    }}
                                />
                            </div>

                            {/* Summary Cards */}
                            <div style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ background: '#3b82f6', color: 'white', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>TOTAL GENERAL</span>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatCurrency(dailyTotal)}</div>
                                </div>
                                {Object.entries(byMethod).map(([method, amount]) => (
                                    <div key={method} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '12px 20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>{method}</span>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>{formatCurrency(amount)}</div>
                                    </div>
                                ))}
                            </div>

                            <table className={styles.table}>
                                <thead style={{ background: '#f1f5f9' }}>
                                    <tr>
                                        <th>Hora</th>
                                        <th>Paciente</th>
                                        <th>Concepto</th>
                                        <th>Método</th>
                                        <th style={{ textAlign: 'right' }}>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyPayments.length > 0 ? (
                                        dailyPayments.map(pay => (
                                            <tr key={pay.id}>
                                                <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                                    {new Date(pay.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td style={{ fontWeight: 600, color: '#334155' }}>
                                                    {pay.patients ? `${pay.patients.first_name} ${pay.patients.last_name}` : 'Paciente General'}
                                                </td>
                                                <td style={{ color: '#475569' }}>
                                                    Pago registrado
                                                </td>
                                                <td>
                                                    <span style={{
                                                        background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px',
                                                        fontSize: '0.8rem', fontWeight: 500, color: '#475569', border: '1px solid #e2e8f0'
                                                    }}>
                                                        {pay.payment_method}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                                                    + {formatCurrency(pay.amount)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                No hay ingresos registrados en esta fecha.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* TAB 2 & 3: FIXED & VARIABLE EXPENSES */}
                        {(activeTab === 'fixed' || activeTab === 'variable') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                {/* --- NAVIGATION CONTROLS (Year & Month) --- */}
                                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    {/* Year Selector */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                                        <button
                                            onClick={() => setViewYear(prev => prev - 1)}
                                            className={styles.iconBtn}
                                            style={{ background: '#f1f5f9', padding: 8, borderRadius: '50%' }}
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b', fontWeight: 800 }}>{viewYear}</h2>
                                        <button
                                            onClick={() => setViewYear(prev => prev + 1)}
                                            className={styles.iconBtn}
                                            style={{ background: '#f1f5f9', padding: 8, borderRadius: '50%' }}
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>

                                    {/* Month Tabs */}
                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', justifyContent: 'space-between' }}>
                                        {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((m, i) => (
                                            <button
                                                key={m}
                                                onClick={() => setViewMonth(i)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    border: 'none',
                                                    background: viewMonth === i ? '#3b82f6' : 'transparent',
                                                    color: viewMonth === i ? 'white' : '#64748b',
                                                    fontWeight: viewMonth === i ? 600 : 500,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(() => {
                                    // FILTER DATA FOR SELECTED VIEW & TAB TYPE
                                    const filteredExpenses = expenses.filter(e => {
                                        const d = new Date(e.date);
                                        const [y, m, d_str] = typeof e.date === 'string' ? e.date.split('-') : [];

                                        let dateMatch = false;
                                        if (y && m) {
                                            dateMatch = parseInt(y) === viewYear && (parseInt(m) - 1) === viewMonth;
                                        } else {
                                            dateMatch = d.getFullYear() === viewYear && d.getMonth() === viewMonth;
                                        }

                                        if (!dateMatch) return false;

                                        // Type Filter
                                        // Fixed = 'FIJO'. Variable = 'VARIABLE', 'OPERATIVO', or null/undefined
                                        if (activeTab === 'fixed') return e.type === 'FIJO';
                                        return e.type !== 'FIJO';
                                    });

                                    // CALCULATE METRICS FOR VIEW
                                    const totalMonth = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
                                    const tabTitle = activeTab === 'fixed' ? 'Gastos Fijos' : 'Gastos Variables';

                                    // Top Categories
                                    const catMap = {};
                                    filteredExpenses.forEach(e => {
                                        if (!catMap[e.category]) catMap[e.category] = 0;
                                        catMap[e.category] += parseFloat(e.amount);
                                    });
                                    const topCats = Object.entries(catMap)
                                        .map(([name, value]) => ({ name, value }))
                                        .sort((a, b) => b.value - a.value)
                                        .slice(0, 5);

                                    return (
                                        <>
                                            {/* Summary Cards */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                                                {/* Top 5 Table */}
                                                <div className={styles.tableContainer} style={{ height: 'fit-content' }}>
                                                    <div className={styles.actionHeader} style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', marginBottom: 0 }}>
                                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Top 5 ({tabTitle}) - {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][viewMonth]}</h3>
                                                    </div>
                                                    <table className={styles.table}>
                                                        <thead style={{ background: '#f8fafc' }}>
                                                            <tr>
                                                                <th>Categoría</th>
                                                                <th style={{ textAlign: 'center' }}>%</th>
                                                                <th style={{ textAlign: 'right' }}>Monto</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {topCats.map((cat, i) => {
                                                                const percent = totalMonth > 0 ? (cat.value / totalMonth) * 100 : 0;
                                                                return (
                                                                    <tr key={i}>
                                                                        <td style={{ fontWeight: 500, color: '#334155' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }}></div>
                                                                                {cat.name}
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                                                                            {percent.toFixed(1)}%
                                                                        </td>
                                                                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                                                                            {formatCurrency(cat.value)}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            {topCats.length === 0 && (
                                                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: 16, color: '#94a3b8' }}>Sin gastos registrados</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Total Card */}
                                                <div className={styles.chartContainer} style={{ background: '#fef2f2', padding: '24px', borderRadius: '12px', border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#ef4444' }}>Total {tabTitle}</span>
                                                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#991b1b', margin: '10px 0' }}>{formatCurrency(totalMonth)}</span>
                                                    <span style={{ fontSize: '0.9rem', color: '#b91c1c' }}>
                                                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][viewMonth]} {viewYear}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.actionHeader} style={{ marginTop: '12px' }}>
                                                <h3>Detalle de {tabTitle}</h3>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {activeTab === 'variable' && (
                                                        <button className={styles.secondaryButton} onClick={handleGenerateDemoData}>
                                                            <Activity size={16} /> Demo
                                                        </button>
                                                    )}
                                                    <button className={styles.addButton} onClick={handleOpenCreateExpense}>
                                                        <Plus size={18} /> Nuevo Gasto
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={styles.tableContainer}>
                                                <table className={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th>Día</th>
                                                            <th>Categoría</th>
                                                            <th>Descripción</th>
                                                            <th>Estado</th>
                                                            <th style={{ textAlign: 'right' }}>Monto</th>
                                                            <th style={{ width: '100px', textAlign: 'center' }}>Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredExpenses.length > 0 ? (
                                                            filteredExpenses.map(expense => (
                                                                <tr key={expense.id}>
                                                                    <td>
                                                                        <div style={{ fontWeight: 600, color: '#334155' }}>
                                                                            {new Date(expense.date).getDate()}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][new Date(expense.date).getDay()]}
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ fontWeight: 500 }}>{expense.category}</td>
                                                                    <td>
                                                                        {expense.description}
                                                                        {expense.supplier && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{expense.supplier}</div>}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`${styles.statusBadge} ${expense.status === 'pagado' ? styles.statusPagado : styles.statusPendiente}`}>
                                                                            {expense.status}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                                                                        - {formatCurrency(expense.amount)}
                                                                    </td>
                                                                    <td style={{ textAlign: 'center' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                                            <button
                                                                                onClick={() => handleEditExpense(expense)}
                                                                                className={styles.iconBtn}
                                                                                title="Editar"
                                                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
                                                                            >
                                                                                <Edit2 size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteExpense(expense.id)}
                                                                                className={styles.iconBtn}
                                                                                title="Eliminar"
                                                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No hay {tabTitle.toLowerCase()} en este mes.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}


                    </>
                )}
            </div>

            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
                expense={editingExpense}
                defaultType={activeTab === 'fixed' ? 'FIJO' : 'VARIABLE'}
            />


        </div>
    );
};

export default FinancePage;
