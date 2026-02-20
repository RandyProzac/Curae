import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MessageCircle, Link2, Unlink } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import styles from './IntegrationsPage.module.css';
import { logoutFromGoogle } from '../lib/googleAuth';
import { exchangeGoogleCodeForTokens } from '../services/googleCalendarService';

export default function IntegrationsPage() {
    // Real state based on LocalStorage token presence for Google
    const [integrations, setIntegrations] = useState({
        googleCalendar: {
            isConnected: !!localStorage.getItem('google_access_token'),
            lastSync: null,
            email: localStorage.getItem('google_connected_email') || null
        },
        whatsapp: { isConnected: false, lastSync: null }
    });
    const [loading, setLoading] = useState(false);

    // Setup Google Login Hook (Authorization Code flow for offline access)
    const loginGoogle = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            console.log('Got Auth Code, exchanging...', codeResponse);
            const result = await exchangeGoogleCodeForTokens(codeResponse.code);

            if (result.success) {
                setIntegrations(prev => ({
                    ...prev,
                    googleCalendar: {
                        isConnected: true,
                        lastSync: new Date().toISOString(),
                        email: localStorage.getItem('google_connected_email')
                    }
                }));
            } else {
                console.error("Token Exchange failed:", result.error);
                alert("Error al conectar con Google: " + result.error);
            }
            setLoading(false);
        },
        onError: error => {
            console.error('Login Failed:', error);
            setLoading(false);
        },
        flow: 'auth-code',
        scope: "https://www.googleapis.com/auth/calendar email profile",
    });

    const handleGoogleConnect = () => {
        setLoading(true);
        loginGoogle();
    };

    const handleGoogleDisconnect = () => {
        setLoading(true);
        logoutFromGoogle();
        localStorage.removeItem('google_connected_email');
        setIntegrations(prev => ({
            ...prev,
            googleCalendar: { isConnected: false, lastSync: null, email: null }
        }));
        setLoading(false);
    };

    // Simulated API call for Whatsapp
    const toggleIntegration = async (provider) => {
        if (provider === 'googleCalendar') return; // Handled separately

        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        setIntegrations(prev => ({
            ...prev,
            [provider]: {
                isConnected: !prev[provider].isConnected,
                lastSync: !prev[provider].isConnected ? new Date().toISOString() : null
            }
        }));

        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Integraciones y Conexiones</h1>
                <p className={styles.subtitle}>Gestiona tus conexiones con servicios externos para automatizar tu clínica.</p>
            </header>

            <div className={styles.grid}>
                {/* Google Calendar Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.iconWrapper} ${styles.googleIcon}`}>
                            <CalendarIcon size={24} />
                        </div>
                        <span className={`${styles.statusBadge} ${integrations.googleCalendar.isConnected ? styles.statusConnected : styles.statusDisconnected}`}>
                            {integrations.googleCalendar.isConnected ? `Conectado: ${integrations.googleCalendar.email || 'Cuenta Activa'}` : 'Desconectado'}
                        </span>
                    </div>
                    <div className={styles.cardBody}>
                        <h3 className={styles.cardTitle}>Google Calendar</h3>
                        <p className={styles.cardDescription}>
                            Sincroniza automáticamente tus citas médicas de Curae con tu calendario personal o de clínica en Google. Evita cruces de horarios y accede a tu agenda desde cualquier lugar.
                        </p>
                    </div>
                    <div className={styles.cardFooter}>
                        {integrations.googleCalendar.isConnected ? (
                            <button
                                className={styles.btnDisconnect}
                                onClick={handleGoogleDisconnect}
                                disabled={loading}
                            >
                                <Unlink size={16} />
                                Desconectar
                            </button>
                        ) : (
                            <button
                                className={styles.btnConnect}
                                onClick={handleGoogleConnect}
                                disabled={loading}
                            >
                                <Link2 size={16} />
                                Conectar
                            </button>
                        )}
                    </div>
                </div>

                {/* WhatsApp Business Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.iconWrapper} ${styles.whatsappIcon}`}>
                            <MessageCircle size={24} />
                        </div>
                        <span className={`${styles.statusBadge} ${integrations.whatsapp.isConnected ? styles.statusConnected : styles.statusDisconnected}`}>
                            {integrations.whatsapp.isConnected ? 'Contectado' : 'Desconectado'}
                        </span>
                    </div>
                    <div className={styles.cardBody}>
                        <h3 className={styles.cardTitle}>WhatsApp Business</h3>
                        <p className={styles.cardDescription}>
                            Automatiza el envío de recordatorios de citas, confirmaciones y mensajes de seguimiento a tus pacientes directamente a su WhatsApp. Reduce el ausentismo escolar de forma drástica.
                        </p>
                    </div>
                    <div className={styles.cardFooter}>
                        {integrations.whatsapp.isConnected ? (
                            <button
                                className={styles.btnDisconnect}
                                onClick={() => toggleIntegration('whatsapp')}
                                disabled={loading}
                            >
                                <Unlink size={16} />
                                Desconectar
                            </button>
                        ) : (
                            <button
                                className={styles.btnConnect}
                                onClick={() => toggleIntegration('whatsapp')}
                                disabled={loading}
                            >
                                <Link2 size={16} />
                                Conectar
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

