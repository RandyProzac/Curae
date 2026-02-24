import React, { useState } from 'react';
import { X, Save, User, Phone, Mail, MapPin, AlertTriangle } from 'lucide-react';
import styles from './NewPatientModal.module.css';

const NewPatientModal = ({ isOpen, onClose, onSave }) => {
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        id_number: '', // mapping to dni
        birthDate: '', // stores DD/MM/YYYY for display or YYYY-MM-DD for DB
        phone: '',
        email: '',
        address: '',
        doctor_id: '',
        allergies: '',
        conditions: '',
        age: '' // added for quick entry
    });

    React.useEffect(() => {
        const fetchDoctors = async () => {
            const { data } = await supabase.from('doctors').select('id, name').eq('active', true);
            setDoctors(data || []);
        };
        if (isOpen) fetchDoctors();
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'birthDate') {
            // Mask: DD/MM/YYYY
            let val = value.replace(/\D/g, '');
            if (val.length > 8) val = val.slice(0, 8);
            let formatted = val;
            if (val.length > 2) formatted = val.slice(0, 2) + '/' + val.slice(2);
            if (val.length > 4) formatted = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);

            setFormData(prev => {
                const newState = { ...prev, birthDate: formatted };
                // If we have a full date, calculate age
                if (val.length === 8) {
                    const d = val.slice(0, 2);
                    const m = val.slice(2, 4);
                    const y = val.slice(4, 8);
                    const birth = new Date(`${y}-${m}-${d}`);
                    if (!isNaN(birth)) {
                        const age = Math.floor((new Date() - birth) / (365.25 * 24 * 60 * 60 * 1000));
                        newState.age = age > 0 ? age.toString() : '';
                    }
                }
                return newState;
            });
        } else if (name === 'age') {
            // If age is typed, we can estimate birth year but it's imprecise, 
            // usually users prefer one or the other.
            setFormData(prev => ({ ...prev, age: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Helper to convert DD/MM/YYYY to YYYY-MM-DD
        let formattedDate = '';
        if (formData.birthDate && formData.birthDate.length === 10) {
            const [d, m, y] = formData.birthDate.split('/');
            formattedDate = `${y}-${m}-${d}`;
        }

        const patientData = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            dni: formData.id_number,
            date_of_birth: formattedDate || null,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            doctor_id: formData.doctor_id || null,
            notes: `Edad: ${formData.age}\nAlergias: ${formData.allergies}\nCondiciones: ${formData.conditions}`
        };
        onSave(patientData);
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
                                <label>Nombres</label>
                                <input
                                    type="text" name="first_name" required
                                    placeholder="Ej. Ana"
                                    value={formData.first_name} onChange={handleChange}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Apellidos</label>
                                <input
                                    type="text" name="last_name" required
                                    placeholder="Ej. Garcia"
                                    value={formData.last_name} onChange={handleChange}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>DNI / NIE</label>
                                <input
                                    type="text" name="id_number" required
                                    placeholder="8 dígitos"
                                    value={formData.id_number} onChange={handleChange}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Fecha de Nacimiento</label>
                                <input
                                    type="text" name="birthDate" required
                                    placeholder="DD / MM / YYYY"
                                    value={formData.birthDate} onChange={handleChange}
                                    maxLength={10}
                                />
                            </div>
                            <div className={styles.inputGroup} style={{ maxWidth: '80px' }}>
                                <label>Edad</label>
                                <input
                                    type="text" name="age"
                                    placeholder="-"
                                    value={formData.age ? `${formData.age} años` : ''}
                                    readOnly
                                    style={{ background: '#f8fafc', color: '#64748b' }}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Doctor Responsable</label>
                                <select
                                    name="doctor_id"
                                    value={formData.doctor_id}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                >
                                    <option value="">-- Seleccionar Doctor --</option>
                                    {doctors.map(doc => (
                                        <option key={doc.id} value={doc.id}>{doc.name}</option>
                                    ))}
                                </select>
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
