import React, { useState, useEffect } from 'react';
import { X, Save, Check, Upload, Eye, EyeOff, KeyRound } from 'lucide-react';
import styles from './DoctorModal.module.css';

const PRESET_COLORS = [
    '#14b8a6', '#10b981', '#22c55e', '#84cc16',
    '#eab308', '#f59e0b', '#f97316', '#ef4444',
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7',
    '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9',
    '#06b6d4', '#475569'
];

const DoctorModal = ({ isOpen, onClose, onSave, doctor = null, isAdmin = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        dni: '',
        cop: '',
        phone: '',
        email: '',
        join_date: new Date().toISOString().split('T')[0],
        color: PRESET_COLORS[0],
        active: true
    });
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [signatureFile, setSignatureFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const isNewDoctor = !doctor;
    const showCredentials = isNewDoctor && isAdmin;

    useEffect(() => {
        if (doctor) {
            setFormData({
                name: doctor.name || '',
                specialty: doctor.specialty || '',
                dni: doctor.dni || '',
                cop: doctor.cop || '',
                phone: doctor.phone || '',
                email: doctor.email || '',
                join_date: doctor.join_date || new Date().toISOString().split('T')[0],
                color: doctor.color || PRESET_COLORS[0],
                active: doctor.active ?? true,
                signature_url: doctor.signature_url
            });
        } else {
            setFormData({
                name: '',
                specialty: '',
                dni: '',
                cop: '',
                phone: '',
                email: '',
                join_date: new Date().toISOString().split('T')[0],
                color: PRESET_COLORS[0],
                active: true,
                signature_url: null
            });
            setCredentials({ username: '', password: '' });
        }
        setSignatureFile(null);
        setShowPassword(false);
    }, [doctor, isOpen]);

    // Auto-generar username cuando cambia el nombre del doctor
    useEffect(() => {
        if (isNewDoctor && formData.name && !credentials.username) {
            const autoUser = formData.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            setCredentials(prev => ({ ...prev, username: autoUser }));
        }
    }, [formData.name, isNewDoctor]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar credenciales para doctores nuevos
        if (showCredentials) {
            if (!credentials.username.trim()) {
                alert('El campo "Usuario" es obligatorio para nuevos doctores.');
                return;
            }
            if (!credentials.password || credentials.password.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres.');
                return;
            }
        }

        try {
            setLoading(true);
            const payload = { ...formData, signatureFile };

            // Adjuntar credenciales si es un doctor nuevo con cuenta de acceso
            if (showCredentials) {
                let email = credentials.username.trim().toLowerCase();
                if (!email.includes('@')) email = `${email}@curae.com`;
                payload.email = email;
                payload.authCredentials = {
                    username: email,
                    password: credentials.password
                };
            }

            await onSave(payload);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar doctor: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{doctor ? 'Editar Doctor' : 'Nuevo Doctor'}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nombre Completo</label>
                        <input
                            required
                            className={styles.input}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej. Dr. Juan Pérez"
                        />
                    </div>

                    <div className={styles.row3}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Especialidad</label>
                            <input
                                className={styles.input}
                                value={formData.specialty}
                                onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                placeholder="Ej. Ortodoncia"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>DNI / CMP</label>
                            <input
                                className={styles.input}
                                value={formData.dni}
                                onChange={e => setFormData({ ...formData, dni: e.target.value })}
                                placeholder="12345678"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>COP</label>
                            <input
                                className={styles.input}
                                value={formData.cop}
                                onChange={e => setFormData({ ...formData, cop: e.target.value })}
                                placeholder="123456"
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Teléfono</label>
                            <input
                                className={styles.input}
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="999 888 777"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="doctor@clinica.com"
                                disabled={showCredentials}
                            />
                            {showCredentials && (
                                <small style={{ color: '#94a3b8', fontSize: '11px' }}>Se generará automáticamente desde el usuario</small>
                            )}
                        </div>
                    </div>

                    {/* ========== CREDENCIALES DE ACCESO (solo nuevo doctor + admin) ========== */}
                    {showCredentials && (
                        <div className={styles.credentialsBox}>
                            <div className={styles.credentialsHeader}>
                                <KeyRound size={18} color="#0f766e" />
                                <span className={styles.credentialsTitle}>Credenciales de Acceso al Sistema</span>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Usuario</label>
                                    <input
                                        required
                                        className={styles.input}
                                        value={credentials.username}
                                        onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                                        placeholder="nombre (sin @)"
                                        style={{ borderColor: '#0f766e' }}
                                    />
                                    <span className={styles.credentialsInfo}>
                                        Inicio de sesión: <strong>{credentials.username || '...'}</strong> → {credentials.username ? `${credentials.username.toLowerCase().replace(/[^a-z0-9]/g, '')}@curae.com` : '...'}
                                    </span>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Contraseña</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            required
                                            type={showPassword ? 'text' : 'password'}
                                            className={styles.input}
                                            value={credentials.password}
                                            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                            placeholder="Mínimo 6 caracteres"
                                            minLength={6}
                                            style={{ borderColor: '#0f766e', paddingRight: '40px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px'
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Fecha de Ingreso</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={formData.join_date}
                                onChange={e => setFormData({ ...formData, join_date: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Estado</label>
                            <select
                                className={styles.select}
                                value={formData.active.toString()}
                                onChange={e => setFormData({ ...formData, active: e.target.value === 'true' })}
                            >
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Firma del Doctor (PNG Transparente)</label>
                        <div className={styles.signatureUploadContainer}>
                            <div className={styles.fileUploadWrapper}>
                                <input
                                    type="file"
                                    id="signature-upload"
                                    accept="image/png"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setSignatureFile(e.target.files[0]);
                                        }
                                    }}
                                    className={styles.fileInputHidden}
                                />
                                <label htmlFor="signature-upload" className={styles.fileUploadButton}>
                                    <Upload size={16} /> Seleccionar archivo
                                </label>
                                <span className={styles.fileName}>
                                    {signatureFile ? signatureFile.name : 'Sin archivos seleccionados'}
                                </span>
                            </div>
                            {(signatureFile || formData.signature_url) && (
                                <div className={styles.signaturePreview}>
                                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Vista previa:</p>
                                    <img
                                        src={signatureFile ? URL.createObjectURL(signatureFile) : formData.signature_url}
                                        alt="Firma"
                                        style={{ maxHeight: '60px', border: '1px dashed #cbd5e1', padding: '4px', borderRadius: '4px', display: 'block', backgroundColor: '#f8fafc' }}
                                    />
                                </div>
                            )}
                        </div>
                        <small style={{ color: '#94a3b8', fontSize: '12px' }}>Obligatorio para que la firma aparezca en los presupuestos impresos.</small>
                    </div>

                    <div className={styles.formGroup}>
                        <div className={styles.labelRow}>
                            <label className={styles.label}>Color de Calendario</label>
                            <span className={styles.colorValue}>{formData.color.toUpperCase()}</span>
                        </div>
                        <div className={styles.colorsGrid}>
                            {PRESET_COLORS.map(c => (
                                <div
                                    key={c}
                                    className={`${styles.colorOption} ${formData.color === c ? styles.selected : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setFormData({ ...formData, color: c })}
                                >
                                    {formData.color === c && (
                                        <Check size={18} color="white" />
                                    )}
                                </div>
                            ))}

                            {/* Custom Color Picker */}
                            <div className={styles.customColorWrapper}>
                                <div
                                    className={`${styles.colorOption} ${styles.customTrigger} ${!PRESET_COLORS.includes(formData.color) ? styles.selected : ''}`}
                                    style={{
                                        backgroundColor: !PRESET_COLORS.includes(formData.color) ? formData.color : '#f1f5f9',
                                        border: PRESET_COLORS.includes(formData.color) ? '2px dashed #cbd5e1' : '3px solid white'
                                    }}
                                >
                                    <input
                                        type="color"
                                        className={styles.colorInputHidden}
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        title="Color personalizado"
                                    />
                                    {(!PRESET_COLORS.includes(formData.color)) ? (
                                        <Check size={18} color="white" />
                                    ) : (
                                        <span style={{ fontSize: '20px', color: '#94a3b8', lineHeight: 1 }}>+</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button type="button" className={styles.cancelButton} onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.saveButton} disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Guardando...' : 'Guardar Doctor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DoctorModal;
