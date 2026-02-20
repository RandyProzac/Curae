import React, { useState } from 'react';
import { Calendar as CalendarIcon, MessageCircle, Link2, Unlink } from 'lucide-react';
import styles from './IntegrationsPage.module.css';

export default function IntegrationsPage() {
    // Mocking the state for now. In a real scenario, fetch this from Supabase.
    const [integrations, setIntegrations] = useState({
        googleCalendar: { isConnected: false, lastSync: null },
        whatsapp: { isConnected: false, lastSync: null }
    });
    const [loading, setLoading] = useState(false);

    // Simulated API call
    const toggleIntegration = async (provider) => {
        setLoading(true);
        // Simulate network delay
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
                            {integrations.googleCalendar.isConnected ? 'Conectado' : 'Desconectado'}
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
                                onClick={() => toggleIntegration('googleCalendar')}
                                disabled={loading}
                            >
                                <Unlink size={16} />
                                Desconectar
                            </button>
                        ) : (
                            <button
                                className={styles.btnConnect}
                                onClick={() => toggleIntegration('googleCalendar')}
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
