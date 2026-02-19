import React, { useState, useEffect } from 'react';
import { X, Save, Check } from 'lucide-react';
import styles from './DoctorModal.module.css';

const PRESET_COLORS = [
    '#14b8a6', // Teal
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#10b981', // Emerald
    '#ef4444', // Red
    '#6366f1'  // Indigo
];

const DoctorModal = ({ isOpen, onClose, onSave, doctor = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        dni: '',
        phone: '',
        email: '',
        join_date: new Date().toISOString().split('T')[0],
        color: PRESET_COLORS[0],
        active: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (doctor) {
            setFormData({
                name: doctor.name || '',
                specialty: doctor.specialty || '',
                dni: doctor.dni || '',
                phone: doctor.phone || '',
                email: doctor.email || '',
                join_date: doctor.join_date || new Date().toISOString().split('T')[0],
                color: doctor.color || PRESET_COLORS[0],
                active: doctor.active ?? true
            });
        } else {
            // Reset for new
            setFormData({
                name: '',
                specialty: '',
                dni: '',
                phone: '',
                email: '',
                join_date: new Date().toISOString().split('T')[0],
                color: PRESET_COLORS[0],
                active: true
            });
        }
    }, [doctor, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await onSave(formData);
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

                    <div className={styles.row}>
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
                            />
                        </div>
                    </div>

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
                        <label className={styles.label}>Color de Calendario</label>
                        <div className={styles.colorsGrid}>
                            {PRESET_COLORS.map(c => (
                                <div
                                    key={c}
                                    className={`${styles.colorOption} ${formData.color === c ? styles.selected : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setFormData({ ...formData, color: c })}
                                >
                                    {formData.color === c && (
                                        <Check size={16} color="white" style={{ margin: '6px' }} />
                                    )}
                                </div>
                            ))}
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
