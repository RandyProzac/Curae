import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import DoctorStatusBoard from '../components/dashboard/DoctorStatusBoard';
import { useAuth } from '../contexts/useAuth';

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
    const { user, isAdmin } = useAuth();
    const [userName, setUserName] = useState('Doctor');
    const [quote, setQuote] = useState('');
    const navigate = useNavigate();

    const [recentActivity, setRecentActivity] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);

    useEffect(() => {
        // 1. Get User Name for Greeting
        if (user?.name) {
            const firstName = user.name.split(' ')[0];
            setUserName(firstName);
        }

        // 2. Set Quote (Daily rotation based on day number)
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        setQuote(QUOTES[dayOfYear % QUOTES.length]);

        // 3. Fetch Stats
        const fetchStats = async () => {
            try {
                // Prepare variables upfront
                const doctorId = user?.id;
                const todayStr = new Date().toISOString().split('T')[0];
                
                const d = new Date();
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(d.setDate(diff));
                monday.setHours(0, 0, 0, 0);
                const mondayStr = monday.toISOString().split('T')[0];
                
                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
                
                const now = new Date();
                const currentTodayStr = now.toISOString().split('T')[0];
                const currentTimeStr = now.toTimeString().split(' ')[0].slice(0, 5); // "HH:MM"

                // Prepare Queries
                let aptTodayQuery = supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('date', todayStr);
                if (doctorId) aptTodayQuery = aptTodayQuery.eq('doctor_id', doctorId);

                let aptWeekQuery = supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('date', mondayStr);
                if (doctorId) aptWeekQuery = aptWeekQuery.eq('doctor_id', doctorId);

                // Execute all queries in parallel
                const [
                    { count: patCount, error: patError },
                    { count: aptCount },
                    { count: aptWeekCount },
                    { count: totalActiveCount },
                    incomeMonth,
                    productsResult,
                    { data: upcomingData },
                    { data: plansData }
                ] = await Promise.all([
                    supabase.from('patients').select('id', { count: 'exact', head: true }),
                    aptTodayQuery,
                    aptWeekQuery,
                    supabase.from('treatment_plans').select('id', { count: 'exact', head: true }).eq('status', 'active'),
                    financeApi.getIncomeByPeriod(startOfMonth).catch(() => 0),
                    inventoryApi.getProducts().catch(() => []),
                    supabase.from('appointments').select('*, patient:patients(first_name, last_name), service:services(name)').eq('doctor_id', doctorId || '').gte('date', currentTodayStr).neq('status', 'cancelled').order('date', { ascending: true }).order('start_time', { ascending: true }),
                    supabase.from('treatment_plans').select('*, patient:patients(first_name, last_name)').order('created_at', { ascending: false }).limit(20)
                ]);

                if (patError) console.error('Error counting patients:', patError);

                setStats({
                    patientsCount: patCount || 0,
                    appointmentsToday: aptCount || 0,
                    appointmentsWeek: aptWeekCount || 0,
                    activeTreatments: totalActiveCount || 0,
                    incomeMonth: incomeMonth || 0
                });

                // Low Stock
                const lowStock = Array.isArray(productsResult) ? productsResult.filter(p => p.stock <= p.min_stock) : [];
                setLowStockItems(lowStock);

                // Upcoming Appointments
                let validUpcoming = [];
                if (upcomingData) {
                    validUpcoming = upcomingData.filter(a => {
                        if (a.date > currentTodayStr) return true;
                        return a.start_time >= currentTimeStr;
                    }).slice(0, 4);
                }
                setUpcomingAppointments(validUpcoming);

                // Recent High Budget Plans
                if (plansData) {
                    const topPlans = plansData.map(plan => {
                        const total = (plan.budget?.items || []).reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
                        return { ...plan, totalBudget: total };
                    }).sort((a, b) => b.totalBudget - a.totalBudget).slice(0, 4);
                    setRecentActivity(topPlans);
                }

            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

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
            trendColor: 'trendUp',
            adminOnly: true
        },
    ];

    const visibleKpis = kpiData.filter(stat => !stat.adminOnly || isAdmin);

    // Removing static recentActivity array

    return (
        <div className={styles.dashboardGrid}>

            {/* New Welcome Header */}
            <header className={styles.welcomeHeader}>
                <div className={styles.grain}></div>
                <div>
                    <h1>¡Hola {userName}! 👋</h1>
                    <p className={styles.quote}>"{quote}"</p>
                </div>
                <div className={styles.headerStats}>
                    <div className={styles.headerStatItem}>
                        <span>Pacientes Hoy</span>
                        <strong>{loading ? '...' : stats.appointmentsToday}</strong>
                    </div>
                    <div className={styles.headerStatItem}>
                        <span>Pacientes Semanales</span>
                        <strong>{loading ? '...' : stats.appointmentsWeek}</strong>
                    </div>
                </div>
            </header>

            {/* Real-time Doctor Status Animation Strip */}
            <DoctorStatusBoard />

            {/* KPI Cards */}
            <section className={styles.statsRow}>
                {visibleKpis.map((stat, index) => (
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

                {/* Activity Feed (High Budget Plans) - ONLY FOR ADMINS */}
                {isAdmin && (
                    <section>
                        <h3 className={styles.sectionTitle}>Planes Destacados (Recientes)</h3>
                        <div className={styles.activityCard}>
                            {recentActivity.length === 0 ? (
                                <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No hay planes de tratamiento activos.</p>
                            ) : (
                                <ul className={styles.activityList}>
                                    {recentActivity.map((plan, index) => (
                                        <li key={index} className={styles.activityItem}>
                                            <span className={styles.activityTime} style={{ fontSize: '13px', fontWeight: 600 }}>
                                                {formatCurrency(plan.totalBudget)}
                                            </span>
                                            <div className={styles.activityInfo}>
                                                <span className={styles.activityTitle}>{plan.title || 'Plan General'}</span>
                                                <span className={styles.activityDesc}>{plan.patient?.first_name} {plan.patient?.last_name}</span>
                                            </div>
                                            <button className={styles.actionButton} onClick={() => navigate(`/pacientes/${plan.patient_id}/historia-clinica`)}>Ver</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                )}

                {/* Próximas Citas */}
                <section>
                    <h3 className={styles.sectionTitle}>Próximas Citas</h3>
                    <div className={styles.activityCard}>
                        {upcomingAppointments.length === 0 ? (
                            <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No hay citas próximas programadas para hoy.</p>
                        ) : (
                            <ul className={styles.activityList}>
                                {upcomingAppointments.map((apt, index) => (
                                    <li key={index} className={styles.activityItem}>
                                        <div className={styles.iconContainer} style={{ width: 36, height: 36, background: '#e0f2fe', color: '#0284c7' }}>
                                            <Clock size={18} />
                                        </div>
                                        <div className={styles.activityInfo}>
                                            <span className={styles.activityTitle}>{apt.start_time?.slice(0, 5)} - {apt.patient?.first_name} {apt.patient?.last_name}</span>
                                            <span className={styles.activityDesc}>{apt.service?.name || apt.motivo || 'Consulta general'}</span>
                                        </div>
                                        <button className={styles.actionButton} style={{ color: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }} onClick={() => navigate('/citas')}>Abrir</button>
                                    </li>
                                ))}
                            </ul>
                        )}
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
