import React, { useState } from 'react';
import { X, Save, User, Phone, Mail, MapPin, AlertTriangle } from 'lucide-react';
import styles from './NewPatientModal.module.css';

const NewPatientModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        dni: '',
        birthDate: '',
        phone: '',
        email: '',
        address: '',
        allergies: '',
        conditions: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <h2>Registrar Nuevo Paciente</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.section}>
                        <h3><User size={18} /> Datos Personales</h3>
                        <div className={styles.grid}>
                            <div className={styles.inputGroup}>
                                <label>Nombre Completo</label>
                                <input
                                    type="text" name="name" required
                                    placeholder="Ej. Ana Garcia"
                                    value={formData.name} onChange={handleChange}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>DNI / NIE</label>
                                <input
                                    type="text" name="dni" required
                                    placeholder="8 dígitos"
                                    value={formData.dni} onChange={handleChange}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Fecha de Nacimiento</label>
                                <input
                                    type="date" name="birthDate" required
                                    value={formData.birthDate} onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3><Phone size={18} /> Contacto</h3>
                        <div className={styles.grid}>
                            <div className={styles.inputGroup}>
                                <label>Teléfono</label>
                                <input
                                    type="tel" name="phone" required
                                    placeholder="+51 ..."
                                    value={formData.phone} onChange={handleChange}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Correo Electrónico</label>
                                <input
                                    type="email" name="email"
                                    placeholder="correo@ejemplo.com"
                                    value={formData.email} onChange={handleChange}
                                />
                            </div>
                            <div className={styles.inputGroupFull}>
                                <label>Dirección</label>
                                <input
                                    type="text" name="address"
                                    placeholder="Av. Las Magnolias 123..."
                                    value={formData.address} onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3><AlertTriangle size={18} /> Información Médica</h3>
                        <div className={styles.grid}>
                            <div className={styles.inputGroupFull}>
                                <label>Alergias</label>
                                <textarea
                                    name="allergies" rows="2"
                                    placeholder="Ninguna / Penicilina / ..."
                                    value={formData.allergies} onChange={handleChange}
                                />
                            </div>
                            <div className={styles.inputGroupFull}>
                                <label>Condiciones Previas</label>
                                <textarea
                                    name="conditions" rows="2"
                                    placeholder="Diabetes / Hipertensión / ..."
                                    value={formData.conditions} onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <footer className={styles.footer}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            <Save size={18} />
                            Guardar Paciente
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default NewPatientModal;
