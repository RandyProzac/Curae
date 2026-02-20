import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Settings,
    LogOut,
    Stethoscope,
    Menu,
    X,
    Wallet,
    ShoppingCart,
    Plug,
    Sun,
    Moon
} from 'lucide-react';
import styles from './MainLayout.module.css';

const MainLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Theme Management
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('curaeTheme');
        // By default prefer light unless user specifically chose dark
        return savedTheme ? savedTheme : 'light';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('curaeTheme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

    // Dynamically set page title based on current route
    const getPageTitle = (pathname) => {
        if (pathname === '/' || pathname === '/dashboard') return 'Panel de Control';
        if (pathname.includes('/citas')) return 'Gestión de Citas';
        if (pathname.includes('/pacientes')) return 'Gestión de Pacientes';
        if (pathname.includes('/servicios')) return 'Catálogo de Servicios';
        if (pathname.includes('/doctores')) return 'Gestión de Doctores';
        if (pathname.includes('/agenda')) return 'Agenda Médica';
        if (pathname.includes('/odontograma')) return 'Odontograma Clínico';
        if (pathname.includes('/reportes')) return 'Reportes y Métricas';
        if (pathname.includes('/configuracion')) return 'Configuración';
        if (pathname.includes('/integraciones')) return 'Integraciones';
        return 'Curae Online';
    };

    const navItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/citas', icon: <Calendar size={20} />, label: 'Citas' },
        { path: '/pacientes', icon: <Users size={20} />, label: 'Pacientes' },
        { path: '/servicios', icon: <Stethoscope size={20} />, label: 'Servicios' },
        { path: '/doctores', icon: <Users size={20} />, label: 'Doctores' },
        { path: '/finanzas', icon: <Wallet size={20} />, label: 'Finanzas' },
        { path: '/inventario', icon: <ShoppingCart size={20} />, label: 'Inventario' },
        { path: '/configuracion', icon: <Settings size={20} />, label: 'Configuración' },
        { path: '/integraciones', icon: <Plug size={20} />, label: 'Integraciones' },
    ];

    const handleNavClick = () => {
        // Close sidebar on mobile after clicking a link
        setSidebarOpen(false);
    };

    return (
        <div className={styles.layout}>
            {/* Mobile Overlay */}
            <div
                className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ''} `}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''} `}>
                <div className={styles.logoContainer}>
                    <img src="/logo_curae.svg" alt="Curae Logo" style={{ width: '42px', height: '42px' }} />
                    <span className={styles.logoText}>Curae</span>
                    {/* Close button on mobile */}
                    <button
                        className={styles.closeSidebarBtn}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `${styles.navItem} ${isActive ? styles.navItemActive : ''} `
                            }
                            end={item.path === '/'} // Only match exact for root
                            onClick={handleNavClick}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <button onClick={logout} className={styles.logoutBtn}>
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={styles.main}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button
                            className={styles.mobileMenuBtn}
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className={styles.pageTitle}>{getPageTitle(location.pathname)}</h2>
                    </div>

                    <div className={styles.headerRight}>
                        <button
                            className={styles.themeToggle}
                            onClick={toggleTheme}
                            aria-label="Toggle Dark Mode"
                            title="Cambiar tema"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.name}</span>
                            <span className={styles.userRole}>{user?.role === 'ADMIN' ? 'Administrador' : 'Doctor'}</span>
                        </div>
                        <div className={styles.avatar}>
                            {user?.name?.charAt(0)}
                        </div>
                    </div>
                </header>

                <main className={`
                    ${styles.content} 
                    ${(location.pathname.includes('/citas') || location.pathname.includes('/odontograma')) ? styles.contentCompact : ''}
                    ${(location.pathname.includes('/historia-clinica') || location.pathname.includes('/evolucion')) ? styles.contentFullWidth : ''}
`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

