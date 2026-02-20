import React, { useState, useEffect } from 'react';
import {
    Wallet, TrendingUp, AlertTriangle,
    ArrowUpRight, ArrowDownRight, DollarSign,
    Package, Activity, Search, User, ShoppingCart
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import styles from './FinancePage.module.css';
import { financeApi, expensesApi, cashFlowApi, inventoryApi } from '../lib/supabase';
// import ExpenseModal from '../components/finance/ExpenseModal';

// --- CONSTANTS ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// --- COMPONENTS ---

const KpiCard = ({ title, value, subtext, icon, trend, trendValue, colorClass }) => (
    <div className={styles.kpiCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <span className={styles.kpiLabel}>{title}</span>
                <div className={styles.kpiValue}>{value}</div>
            </div>
            <div className={`${styles.kpiIcon} ${styles[colorClass]}`}>
                {icon}
            </div>
        </div>
        {subtext && (
            <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {trend === 'up' && <ArrowUpRight size={16} className={styles.textGreen} />}
                {trend === 'down' && <ArrowDownRight size={16} className={styles.textRed} />}
                <span className={trend === 'up' ? styles.textGreen : (trend === 'down' ? styles.textRed : '')}>
                    {trendValue}
                </span>
                <span style={{ opacity: 0.8 }}>{subtext}</span>
            </div>
        )}
    </div>
);

const TodayCard = ({ title, value, type }) => {
    let icon, trendClass;
    if (type === 'income') {
        icon = <ArrowUpRight size={18} />;
        trendClass = styles.trendUp;
    } else if (type === 'expense') {
        icon = <ArrowDownRight size={18} />;
        trendClass = styles.trendDown;
    } else {
        icon = <Wallet size={18} />;
        trendClass = styles.trendNeutral;
    }

    return (
        <div className={styles.todayCard}>
            <div className={styles.todayHeader}>
                {title}
                <div className={`${styles.todayTrend} ${trendClass}`}>
                    {icon}
                </div>
            </div>
            <div className={styles.todayValue}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>En tiempo real</div>
        </div>
    );
};

const FinancePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // -- DATA STATE --
    const [todayMetrics, setTodayMetrics] = useState({ income: 0, expenses: 0, balance: 0 });
    const [monthSummary, setMonthSummary] = useState({ income: 0, expenses: 0, balance: 0 });
    const [trendData, setTrendData] = useState([]);
    const [revenueByDoctor, setRevenueByDoctor] = useState([]);
    const [inventoryValue, setInventoryValue] = useState(0);
    const [topExpenses, setTopExpenses] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [topPatients, setTopPatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [allPatientsStats, setAllPatientsStats] = useState([]);

    // -- DATA FETCHING --
    const loadData = React.useCallback(async () => {
        setLoading(true);
        try {
            // 1. Daily Metrics (Based on selectedDay)
            const dayStart = new Date(selectedDay);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(selectedDay);
            dayEnd.setHours(23, 59, 59, 999);

            const [dayIncome, dayExpensesList] = await Promise.all([
                financeApi.getIncomeByPeriod(dayStart.toISOString(), dayEnd.toISOString()),
                expensesApi.getByPeriod(dayStart.toISOString(), dayEnd.toISOString())
            ]);
            const dayTotalExp = dayExpensesList.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

            // 2. Monthly Summary (Based on selectedMonth)
            const monthYear = selectedMonth.getFullYear();
            const monthIdx = selectedMonth.getMonth();
            const startOfMonth = new Date(monthYear, monthIdx, 1).toISOString();
            const endOfMonth = new Date(monthYear, monthIdx + 1, 0, 23, 59, 59, 999).toISOString();

            const [summary, docRev, patientStats] = await Promise.all([
                cashFlowApi.getSummary(startOfMonth, endOfMonth),
                financeApi.getRevenueByDoctor(startOfMonth, endOfMonth),
                financeApi.getPatientFinanceStats(0, startOfMonth, endOfMonth)
            ]);

            // 3. Annual Trend (Based on selectedYear)
            const trend = await cashFlowApi.getMonthlyTrend(selectedYear);

            // 4. Inventory Impact (Always current status)
            const products = await inventoryApi.getProducts();
            const totalInvValue = products.reduce((acc, p) => acc + (p.cost * p.stock), 0);
            const lowStockItems = products.filter(p => p.stock <= p.min_stock);

            // 5. Generate Alerts
            const newAlerts = [];
            if (lowStockItems.length > 0) {
                newAlerts.push({
                    type: 'warning',
                    title: 'Stock Crítico',
                    message: `${lowStockItems.length} productos con stock bajo.`,
                    id: 'stock'
                });
            }
            if (summary.balance < 0) {
                newAlerts.push({
                    type: 'danger',
                    title: 'Flujo de Caja Negativo',
                    message: 'Gastos superan ingresos en este periodo.',
                    id: 'cashflow'
                });
            }

            // Set State
            setTodayMetrics({
                income: dayIncome,
                expenses: dayTotalExp,
                balance: dayIncome - dayTotalExp,
                isToday: selectedDay.toDateString() === new Date().toDateString()
            });
            setMonthSummary(summary);
            setTrendData(trend);
            setInventoryValue(totalInvValue);
            setRevenueByDoctor(docRev.slice(0, 5));
            setTopExpenses(summary.expensesByCategory || []);
            setAlerts(newAlerts);
            setAllPatientsStats(patientStats);
            setTopPatients(patientStats.slice(0, 10));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedDay, selectedMonth, selectedYear]);

    // Initial Load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Formatters
    const formatCurrency = (val) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(val || 0);

    // Handlers
    const handleDayChange = (e) => {
        setSelectedDay(new Date(e.target.value + 'T12:00:00'));
    };

    const handleMonthChange = (e) => {
        const [year, month] = e.target.value.split('-');
        setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
    };

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
    };

    return (
        <div className={styles.container}>
            {/* --- HEADER --- */}
            <header className={styles.header}>
                <div className={styles.title}>
                    <h2>Finanzas Maestras 📊</h2>
                    <p>Visión estratégíca de tu consultorio.</p>
                </div>
                <div className={styles.controls}>
                    <button className={styles.addExpenseBtn} onClick={() => navigate('/gastos')}>
                        <ShoppingCart size={16} /> <span>Gestionar Gastos</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando inteligencia financiera...</div>
            ) : (
                <div className={styles.grid}>

                    <section className={styles.sectionToday}>
                        <div className={styles.todayDateBadge}>
                            <span>Detalle del día:</span>
                            <input
                                type="date"
                                value={selectedDay.toISOString().split('T')[0]}
                                onChange={handleDayChange}
                                className={styles.inlineDatePicker}
                            />
                        </div>
                        <TodayCard
                            title={todayMetrics.isToday ? "Ingreso Hoy" : "Ingreso del Día"}
                            value={formatCurrency(todayMetrics.income)}
                            type="income"
                        />
                        <TodayCard
                            title={todayMetrics.isToday ? "Gasto Hoy" : "Gasto del Día"}
                            value={formatCurrency(todayMetrics.expenses)}
                            type="expense"
                        />
                        <TodayCard
                            title={todayMetrics.isToday ? "Balance Diario" : "Balance del Día"}
                            value={formatCurrency(todayMetrics.balance)}
                            type="balance"
                        />
                    </section>

                    {/* --- 2. KPIS MENSUALES --- */}
                    <div className={styles.todayDateBadge} style={{ marginTop: '12px' }}>
                        <span>Resumen Mensual:</span>
                        <input
                            type="month"
                            value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                            onChange={handleMonthChange}
                            className={styles.inlineDatePicker}
                        />
                    </div>
                    <KpiCard
                        title="Facturación del Periodo"
                        value={formatCurrency(monthSummary.income)}
                        icon={<Activity size={20} />}
                        colorClass="iconBlue"
                        subtext={todayMetrics.isToday ? "acumulado hoy" : `total en ${selectedDay.toLocaleDateString('es-ES')}`}
                        trend="up"
                        trendValue="Ingresos"
                    />
                    <KpiCard
                        title="Gastos Operativos"
                        value={formatCurrency(monthSummary.expenses)}
                        icon={<Wallet size={20} />}
                        colorClass="iconYellow"
                        subtext="control de salidas"
                        trend="down"
                        trendValue="Egresos"
                    />
                    <KpiCard
                        title="Utilidad Neta"
                        value={formatCurrency(monthSummary.balance)}
                        icon={<TrendingUp size={20} />}
                        colorClass="iconGreen"
                        subtext="ganancia real"
                        trend={monthSummary.balance > 0 ? 'up' : 'down'}
                        trendValue={((monthSummary.balance / (monthSummary.income || 1)) * 100).toFixed(1) + '%'}
                    />
                    <KpiCard
                        title="Capital en Stock"
                        value={formatCurrency(inventoryValue)}
                        icon={<Package size={20} />}
                        colorClass="iconPurple"
                        subtext="dinero en insumos"
                        trendValue="Activo"
                    />

                    {/* --- 3. GRÁFICOS (CENTER STAGE) --- */}
                    <div className={styles.chartSection}>
                        <div className={styles.chartHeader}>
                            <div className={styles.chartTitle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <h3>Flujo de Caja Anual</h3>
                                    <select
                                        value={selectedYear}
                                        onChange={handleYearChange}
                                        className={styles.inlineYearSelect}
                                    >
                                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <p>Comparativa Ingresos vs Egresos del año seleccionado</p>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div> Ingresos
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></div> Gastos
                                </div>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
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
                                    <Tooltip
                                        contentStyle={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                        formatter={(value) => formatCurrency(value)}
                                        labelStyle={{ color: '#1e293b', fontWeight: 600, marginBottom: 4 }}
                                    />
                                    <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                                    <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* --- 4. SIDE PANEL (ALERTS & BREAKDOWN) --- */}
                    <div className={styles.sidePanel}>
                        {/* A. ALERTS */}
                        <div className={styles.sideCard}>
                            <h4 className={styles.sideTitle}>
                                <AlertTriangle size={18} color="#f59e0b" /> Alertas Inteligentes
                            </h4>
                            {alerts.length > 0 ? (
                                <ul className={styles.alertList}>
                                    {alerts.map((alert, i) => (
                                        <li key={i} className={styles.alertItem}>
                                            <div className={styles.alertIcon}>
                                                <AlertTriangle size={16} />
                                            </div>
                                            <div className={styles.alertContent}>
                                                <h4>{alert.title}</h4>
                                                <p>{alert.message}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ color: '#64748b', fontSize: '0.9rem', padding: '10px 0' }}>Todo en orden. ¡Buen trabajo! 🚀</div>
                            )}
                        </div>

                        {/* B. INCOME SOURCES */}
                        <div className={styles.sideCard}>
                            <h4 className={styles.sideTitle}>Top Doctores (Ingresos)</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {revenueByDoctor.map((doc, i) => (
                                    <div key={i} className={styles.inventoryItem}>
                                        <span className={styles.itemName}>{doc.name}</span>
                                        <span className={styles.itemValue}>{formatCurrency(doc.total)}</span>
                                    </div>
                                ))}
                                {revenueByDoctor.length === 0 && <div style={{ color: '#94a3b8' }}>Sin datos aún.</div>}
                            </div>
                        </div>

                        {/* C. EXPENSE BREAKDOWN (Simple Pie) */}
                        <div className={styles.sideCard}>
                            <h4 className={styles.sideTitle}>Distribución de Gastos</h4>
                            <div style={{ height: 200, width: '100%' }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={topExpenses}
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {topExpenses.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val) => formatCurrency(val)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: -10 }}>
                                {topExpenses.slice(0, 3).map((e, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#64748b' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i] }}></div> {e.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* --- 5. TOP PATIENTS & SEARCH --- */}
                    <div className={styles.topPatientsSection}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.chartTitle}>
                                <h3>Ranking de Pacientes</h3>
                                <p>Pacientes con mayor inversión en la clínica</p>
                            </div>
                            <div className={styles.searchBox}>
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar paciente por nombre o DNI..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.patientsList}>
                            {(searchQuery ? allPatientsStats.filter(p =>
                                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                p.dni?.includes(searchQuery)
                            ).slice(0, 10) : topPatients).map((patient, i) => (
                                <div key={patient.id} className={styles.patientRow}>
                                    <div className={styles.patientInfo}>
                                        <div className={styles.rankBadge}>{i + 1}</div>
                                        <div className={styles.patientAvatar}>
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <div className={styles.pName}>{patient.name}</div>
                                            <div className={styles.pDni}>DNI: {patient.dni || 'No reg.'}</div>
                                        </div>
                                    </div>
                                    <div className={styles.patientValue}>
                                        <div className={styles.vGroup}>
                                            <span className={styles.vLabel}>Presupuesto Total:</span>
                                            <span className={styles.vBudget}>{formatCurrency(patient.totalBudget)}</span>
                                        </div>
                                        <div className={styles.vGroup}>
                                            <span className={styles.vLabel}>Total Pagado:</span>
                                            <span className={styles.vPaid}>{formatCurrency(patient.totalPaid)}</span>
                                        </div>
                                        <div className={styles.vBar}>
                                            <div
                                                className={styles.vProgress}
                                                style={{ width: `${Math.min(100, (patient.totalPaid / (patient.totalBudget || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {searchQuery && allPatientsStats.filter(p =>
                                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                p.dni?.includes(searchQuery)
                            ).length === 0 && (
                                    <div className={styles.noResults}>No se encontraron pacientes con "{searchQuery}"</div>
                                )}
                        </div>
                    </div>
                </div>
            )}

            {/* Gastos gestionados en su propia página */}
        </div>
    );
};

export default FinancePage;
