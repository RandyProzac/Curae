import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { Stethoscope, LogIn, AlertCircle } from 'lucide-react';
import styles from '../components/auth/Login.module.css'; // Keeping original styles for now

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/pacientes');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.logoSection}>
                    <div className={styles.iconCircle}>
                        <Stethoscope size={40} color="var(--primary-blue)" />
                    </div>
                    <h1>Curae Online</h1>
                    <p>Gestión Clínica Inteligente</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.errorBadge}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="ejemplo@curae.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.loginButton} disabled={loading}>
                        {loading ? (
                            <span className={styles.loader}></span>
                        ) : (
                            <>
                                <LogIn size={20} />
                                <span>Acceder al Portal</span>
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>&copy; 2026 Curae Online Dental Solutions</p>
                    <div className={styles.testAccount}>
                        <p><strong>Cuentas de prueba:</strong></p>
                        <p>Admin: admin@curae.com / admin123</p>
                        <p>Doctor: doctor@curae.com / doctor123</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
