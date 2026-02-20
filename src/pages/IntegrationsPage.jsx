import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MessageCircle, Link2, Unlink } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import styles from './IntegrationsPage.module.css';
import { logoutFromGoogle } from '../lib/googleAuth';
import { exchangeGoogleCodeForTokens } from '../services/googleCalendarService';
import { supabase } from '../lib/supabase';
import { exportDatabaseToJson, importDatabaseFromJson } from '../services/backupService';
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

    // Backup state
    const [showImportModal, setShowImportModal] = useState(false);
    const [importSecurityCode, setImportSecurityCode] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Initial load: check Central Supabase Database to see if there is ANY Master Token saved.
    useEffect(() => {
        const checkGlobalConnection = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('integrations')
                    .select('status, updated_at')
                    .eq('provider', 'google_calendar')
                    .maybeSingle();

                if (data && data.status === 'connected') {
                    setIntegrations(prev => ({
                        ...prev,
                        googleCalendar: {
                            isConnected: true,
                            lastSync: data.updated_at,
                            // Retain local email if we have it, else show generic "Cuenta Administrativa"
                            email: prev.googleCalendar.email || 'Cuenta Administrativa de Clínica'
                        }
                    }));
                }
            } catch (err) {
                console.error("Error checking global connection", err);
            } finally {
                setLoading(false);
            }
        };

        checkGlobalConnection();
    }, []);

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

    const handleGoogleDisconnect = async () => {
        setLoading(true);
        logoutFromGoogle();
        localStorage.removeItem('google_connected_email');
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiry');

        // Disconnect Globally
        try {
            await supabase
                .from('integrations')
                .update({ status: 'disconnected', access_token: null, refresh_token: null })
                .eq('provider', 'google_calendar');
        } catch (e) { console.error(e); }

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

    // Backup Handlers
    const handleExport = async () => {
        setLoading(true);
        const result = await exportDatabaseToJson();
        if (!result.success) {
            alert("Error al exportar: " + result.error);
        }
        setLoading(false);
    };

    const handleImportFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setShowImportModal(true);
        }
    };

    const handleExecuteImport = async () => {
        if (importSecurityCode !== 'CURAE') {
            alert("Código de seguridad incorrecto. Debes escribir CURAE.");
            return;
        }

        if (!selectedFile) {
            alert("Ningún archivo seleccionado.");
            return;
        }

        setLoading(true);
        setShowImportModal(false);
        const result = await importDatabaseFromJson(selectedFile);
        if (result.success) {
            alert("Base de datos importada exitosamente. Recargando aplicación...");
            window.location.reload();
        } else {
            alert("Error al importar: " + result.error);
            setLoading(false);
        }
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

            {/* Configuración de Datos Card */}
            <div className={styles.grid} style={{ marginTop: '24px' }}>
                <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.cardHeader}>
                        <div className={styles.iconWrapper} style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                            <Link2 size={24} />
                        </div>
                        <span className={styles.statusBadge} style={{ background: '#f1f5f9', color: '#475569' }}>
                            Avanzado
                        </span>
                    </div>
                    <div className={styles.cardBody}>
                        <h3 className={styles.cardTitle}>Gestión de Base de Datos</h3>
                        <p className={styles.cardDescription}>
                            Genera copias de respaldo de forma local en tu computadora para tu tranquilidad. Podrás usar este archivo en el futuro para restaurar la clínica a un estado anterior en caso de emergencia.
                        </p>
                    </div>
                    <div className={styles.cardFooter} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleExport}
                            disabled={loading}
                            style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                        >
                            {loading ? 'Procesando...' : 'Descargar Copia de Seguridad JSON'}
                        </button>

                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportFileSelect}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                disabled={loading}
                            />
                            <button
                                disabled={loading}
                                style={{ padding: '10px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', pointerEvents: 'none', fontWeight: '500' }}
                            >
                                Restaurar Base de Datos
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Security Modal */}
            {showImportModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', padding: '32px', borderRadius: '16px',
                        maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.25rem', marginBottom: '16px' }}>
                            Confirmación de Seguridad
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px', lineHeight: 1.5 }}>
                            Estás a punto de reemplazar <strong>toda la base de datos actual</strong> con la información del archivo <span style={{ color: '#3b82f6' }}>{selectedFile?.name}</span>.
                        </p>
                        <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '24px', fontWeight: '500' }}>
                            Esta acción destruirá permanentemente los datos nuevos ingresados desde la fecha de este respaldo y no se puede deshacer.
                        </p>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                                Escribe CURAE para continuar:
                            </label>
                            <input
                                type="text"
                                value={importSecurityCode}
                                onChange={(e) => setImportSecurityCode(e.target.value)}
                                placeholder="Escribe aquí..."
                                style={{
                                    width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1',
                                    borderRadius: '8px', fontSize: '1rem', outline: 'none'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setSelectedFile(null);
                                    setImportSecurityCode('');
                                }}
                                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExecuteImport}
                                disabled={importSecurityCode !== 'CURAE'}
                                style={{
                                    padding: '8px 16px',
                                    background: importSecurityCode === 'CURAE' ? '#ef4444' : '#fca5a5',
                                    border: 'none', borderRadius: '6px', color: 'white', cursor: importSecurityCode === 'CURAE' ? 'pointer' : 'not-allowed',
                                    fontWeight: '500'
                                }}
                            >
                                Proceder
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

