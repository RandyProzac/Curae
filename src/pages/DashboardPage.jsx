import React, { useEffect, useState } from 'react';
import {
    Users,
    Calendar,
    Activity,
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertTriangle,
    Package
} from 'lucide-react';
import styles from './DashboardPage.module.css';
import { supabase, financeApi, inventoryApi } from '../lib/supabase';

const QUOTES = [
    "La sonrisa es la mejor carta de presentación. 😁",
    "Bocas sanas, vidas felices. ✨",
    "Cada diente cuenta una historia, cuídalos. 🦷",
    "La excelencia no es un acto, es un hábito. 🏆",
    "Tu dedicación crea sonrisas brillantes. 🌟",
    "El arte de la odontología es amor hecho visible."
];

const DashboardPage = () => {
    const [stats, setStats] = useState({
        patientsCount: 0,
        appointmentsToday: 0,
        activeTreatments: 0,
        incomeMonth: 0,
        incomeWeek: 0
    });
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Doctor');
    const [quote, setQuote] = useState('');

    useEffect(() => {
        // 1. Get User
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Try to get name from metadata or split email
                const name = user.user_metadata?.first_name
                    || user.user_metadata?.name
                    || user.email?.split('@')[0];
                // Capitalize
                setUserName(name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Doctor');
            }
        };
        getUser();

        // 2. Set Quote (Daily rotation based on day number)
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        setQuote(QUOTES[dayOfYear % QUOTES.length]);

        // 3. Fetch Stats
        const fetchStats = async () => {
            try {
                // Patients Count (Try explicit select 'id' to be lighter)
                const { count: patCount, error: patError } = await supabase
                    .from('patients')
                    .select('id', { count: 'exact', head: true });

                if (patError) console.error('Error counting patients:', patError);

                // Appointments Today
                const todayStr = new Date().toISOString().split('T')[0];
                const { count: aptCount } = await supabase
                    .from('appointments')
                    .select('id', { count: 'exact', head: true })
                    .eq('date', todayStr);

                // Active Treatments (Scheduled)
                const { count: activeCount } = await supabase
                    .from('appointments')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'scheduled');

                // Income - Month
                const date = new Date();
                const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
                const incomeMonth = await financeApi.getIncomeByPeriod(startOfMonth);

                // Income - Week (From Monday)
                const d = new Date();
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                const monday = new Date(d.setDate(diff));
                monday.setHours(0, 0, 0, 0);
                const incomeWeek = await financeApi.getIncomeByPeriod(monday.toISOString());

                setStats({
                    patientsCount: patCount || 0,
                    appointmentsToday: aptCount || 0,
                    activeTreatments: activeCount || 0,
                    incomeMonth: incomeMonth || 0,
                    incomeWeek: incomeWeek || 0
                });

                // Low Stock
                try {
                    const products = await inventoryApi.getProducts();
                    const lowStock = Array.isArray(products) ? products.filter(p => p.stock <= p.min_stock) : [];
                    setLowStockItems(lowStock);
                } catch (err) {
                    console.warn('Inventory error:', err);
                }

            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(amount);
    };

    const kpiData = [
        {
            label: 'Pacientes Totales',
            value: loading ? '...' : stats.patientsCount,
            trend: '+5% este mes', // Static trend for now or implement logic
            icon: <Users size={24} />,
            color: 'iconBlue',
            trendColor: 'trendUp'
        },
        {
            label: 'Citas Hoy',
            value: loading ? '...' : stats.appointmentsToday,
            trend: 'Ver agenda',
            icon: <Calendar size={24} />,
            color: 'iconGreen',
            trendColor: 'trendUp'
        },
        {
            label: 'Tratamientos Activos',
            value: loading ? '...' : stats.activeTreatments,
            trend: 'En curso',
            icon: <Activity size={24} />,
            color: 'iconPurple',
            trendColor: 'trendUp'
        },
        {
            label: 'Ingresos del Mes',
            value: loading ? '...' : formatCurrency(stats.incomeMonth),
            trend: 'vs mes anterior',
            icon: <DollarSign size={24} />,
            color: 'iconGold',
            trendColor: 'trendUp'
        },
    ];

    const recentActivity = [
        { time: '09:00', title: 'Cita completada: Juan Pérez', desc: 'Limpieza dental profunda', status: 'completed' },
        { time: '10:30', title: 'Nueva cita agendada', desc: 'Ana García - Evaluación Ortodoncia', status: 'new' },
        { time: '11:15', title: 'Pago registrado', desc: 'Carlos Morales - Cuota 2/12', status: 'payment' },
        { time: '12:00', title: 'Recordatorio enviado', desc: 'Confirmación cita mañana: Elena R.', status: 'system' },
    ];

    return (
        <div className={styles.dashboardGrid}>

            {/* New Welcome Header */}
            <header className={styles.welcomeHeader}>
                <div>
                    <h1>Bienvenido, {userName} 👋</h1>
                    <p className={styles.quote}>"{quote}"</p>
                </div>
                <div className={styles.headerStats}>
                    <div className={styles.headerStatItem}>
                        <span>Pacientes Hoy</span>
                        <strong>{loading ? '...' : stats.appointmentsToday}</strong>
                    </div>
                    <div className={styles.headerStatItem}>
                        <span>Ingresos Semana</span>
                        <strong>{loading ? '...' : formatCurrency(stats.incomeWeek)}</strong>
                    </div>
                </div>
            </header>

            {/* KPI Cards */}
            <section className={styles.statsRow}>
                {kpiData.map((stat, index) => (
                    <div key={index} className={styles.statCard}>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stat.value}</span>
                            <span className={styles.statLabel}>{stat.label}</span>
                            <div className={`${styles.statTrend} ${styles[stat.trendColor]}`}>
                                <TrendingUp size={14} />
                                <span>{stat.trend}</span>
                            </div>
                        </div>
                        <div className={`${styles.iconContainer} ${styles[stat.color]}`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </section>

            {/* Recent Activity & Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                {/* Activity Feed */}
                <section>
                    <h3 className={styles.sectionTitle}>Actividad Reciente</h3>
                    <div className={styles.activityCard}>
                        <ul className={styles.activityList}>
                            {recentActivity.map((activity, index) => (
                                <li key={index} className={styles.activityItem}>
                                    <span className={styles.activityTime}>{activity.time}</span>
                                    <div className={styles.activityInfo}>
                                        <span className={styles.activityTitle}>{activity.title}</span>
                                        <span className={styles.activityDesc}>{activity.desc}</span>
                                    </div>
                                    <button className={styles.actionButton}>Ver</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Próximas Citas (Mock) */}
                <section>
                    <h3 className={styles.sectionTitle}>Próximas Citas</h3>
                    <div className={styles.activityCard}>
                        <ul className={styles.activityList}>
                            <li className={styles.activityItem}>
                                <div className={styles.iconContainer} style={{ width: 36, height: 36, background: 'var(--brand-beige)', color: 'var(--brand-primary)' }}>
                                    <Clock size={18} />
                                </div>
                                <div className={styles.activityInfo}>
                                    <span className={styles.activityTitle}>14:00 - Mario Vargas</span>
                                    <span className={styles.activityDesc}>Extracción Molar</span>
                                </div>
                                <button className={styles.actionButton} style={{ color: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }}>Iniciar</button>
                            </li>
                            <li className={styles.activityItem}>
                                <div className={styles.iconContainer} style={{ width: 36, height: 36, background: '#e0f2fe', color: '#0284c7' }}>
                                    <Clock size={18} />
                                </div>
                                <div className={styles.activityInfo}>
                                    <span className={styles.activityTitle}>15:30 - Luisa Lane</span>
                                    <span className={styles.activityDesc}>Control Brackets</span>
                                </div>
                                <button className={styles.actionButton}>Detalles</button>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Low Stock Alert */}
                {lowStockItems.length > 0 && (
                    <section>
                        <h3 className={styles.sectionTitle} style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={20} /> Alerta de Inventario
                        </h3>
                        <div className={styles.activityCard} style={{ border: '1px solid #fcd34d', background: '#fffbeb' }}>
                            <ul className={styles.activityList}>
                                {lowStockItems.slice(0, 5).map(item => (
                                    <li key={item.id} className={styles.activityItem} style={{ borderBottom: '1px solid #fde68a' }}>
                                        <div className={styles.iconContainer} style={{ background: '#fef3c7', color: '#d97706' }}>
                                            <Package size={18} />
                                        </div>
                                        <div className={styles.activityInfo}>
                                            <span className={styles.activityTitle}>{item.name}</span>
                                            <span className={styles.activityDesc} style={{ color: '#b45309' }}>Stock: {item.stock} (Mín: {item.min_stock})</span>
                                        </div>
                                    </li>
                                ))}
                                {lowStockItems.length > 5 && (
                                    <li style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem', color: '#b45309' }}>
                                        + {lowStockItems.length - 5} productos más
                                    </li>
                                )}
                            </ul>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
