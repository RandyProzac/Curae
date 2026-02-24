import React from 'react';
import { User, Heart, Save } from 'lucide-react';
import styles from './ClinicalHistory.module.css';

const ClinicalHistoryGeneral = ({ formData, updateField, updateAntecedente, onSave }) => {

    const antecedentesOptions = [
        { id: 'enfermedadCardiaca', label: 'Enf. Cardíaca' },
        { id: 'enfermedadRenal', label: 'Enf. Renal' },
        { id: 'alergias', label: 'Alergias' },
        { id: 'hemorragia', label: 'Hemorragia' },
        { id: 'diabetes', label: 'Diabetes' },
        { id: 'hepatitis', label: 'Hepatitis' },
        { id: 'presionAlta', label: 'Presión Alta' },
        { id: 'epilepsia', label: 'Epilepsia' },
        { id: 'vih', label: 'V.I.H.' },
        { id: 'problemasHemorragicos', label: 'Prob. Hemorrágicos' },
        { id: 'medicado', label: 'Medicado' },
        { id: 'embarazada', label: 'Embarazada' },
        { id: 'cancer', label: 'Cáncer' },
        { id: 'tdah', label: 'TDA/TDAH' },
    ];

    return (
        <div className={styles.tabContent}>
            {/* Datos Personales */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <div className={styles.iconBox} style={{ background: '#3b82f6' }}>
                            <User size={18} />
                        </div>
                        Datos del Paciente
                    </div>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Apellidos</label>
                            <input
                                className={styles.input}
                                value={formData.apellidos}
                                onChange={(e) => updateField('apellidos', e.target.value)}
                                placeholder="Apellidos"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombres</label>
                            <input
                                className={styles.input}
                                value={formData.nombres}
                                onChange={(e) => updateField('nombres', e.target.value)}
                                placeholder="Nombres"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Fecha de Nacimiento</label>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="DD / MM / YYYY"
                                maxLength={10}
                                value={(() => {
                                    // Convert YYYY-MM-DD to DD/MM/YYYY for display if it's not already masked
                                    if (!formData.fechaNacimiento) return '';
                                    if (formData.fechaNacimiento.includes('/')) return formData.fechaNacimiento;
                                    const [y, m, d] = formData.fechaNacimiento.split('-');
                                    if (!y || !m || !d) return formData.fechaNacimiento;
                                    return `${d}/${m}/${y}`;
                                })()}
                                onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length > 8) val = val.slice(0, 8);
                                    let formatted = val;
                                    if (val.length > 2) formatted = val.slice(0, 2) + '/' + val.slice(2);
                                    if (val.length > 4) formatted = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);

                                    updateField('fechaNacimiento', formatted);

                                    // Auto-calculate age
                                    if (val.length === 8) {
                                        const d = val.slice(0, 2);
                                        const m = val.slice(2, 4);
                                        const y = val.slice(4, 8);
                                        const birth = new Date(`${y}-${m}-${d}`);
                                        if (!isNaN(birth)) {
                                            const age = Math.floor((new Date() - birth) / (365.25 * 24 * 60 * 60 * 1000));
                                            if (age > 0) updateField('edad', age.toString());
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Edad</label>
                            <input
                                className={styles.input}
                                type="text"
                                value={(() => {
                                    let birthDate = formData.fechaNacimiento;
                                    if (!birthDate) return '';

                                    // Convert DD/MM/YYYY to YYYY-MM-DD if needed for calculation
                                    let y, m, d;
                                    if (birthDate.includes('/')) {
                                        [d, m, y] = birthDate.split('/');
                                    } else {
                                        [y, m, d] = birthDate.split('-');
                                    }

                                    const birth = new Date(`${y}-${m}-${d}`);
                                    if (isNaN(birth)) return '';
                                    const age = Math.floor((new Date() - birth) / (365.25 * 24 * 60 * 60 * 1000));
                                    return age > 0 ? `${age} años` : '-';
                                })()}
                                readOnly
                                style={{ background: '#f8fafc', color: '#64748b', cursor: 'default' }}
                                placeholder="Auto"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Sexo</label>
                            <select
                                className={styles.select}
                                value={formData.sexo}
                                onChange={(e) => updateField('sexo', e.target.value)}
                            >
                                <option value="">Seleccionar</option>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Estado Civil</label>
                            <select
                                className={styles.select}
                                value={formData.estadoCivil}
                                onChange={(e) => updateField('estadoCivil', e.target.value)}
                            >
                                <option value="">Seleccionar</option>
                                <option value="soltero">Soltero/a</option>
                                <option value="casado">Casado/a</option>
                                <option value="divorciado">Divorciado/a</option>
                                <option value="viudo">Viudo/a</option>
                            </select>
                        </div>
                        <div className={`${styles.formGroup} ${styles.wide}`}>
                            <label className={styles.label}>Dirección</label>
                            <input
                                className={styles.input}
                                value={formData.direccion}
                                onChange={(e) => updateField('direccion', e.target.value)}
                                placeholder="Dirección completa"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Distrito</label>
                            <input
                                className={styles.input}
                                value={formData.distrito}
                                onChange={(e) => updateField('distrito', e.target.value)}
                                placeholder="Distrito"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Ciudad</label>
                            <input
                                className={styles.input}
                                value={formData.ciudad}
                                onChange={(e) => updateField('ciudad', e.target.value)}
                                placeholder="Ciudad"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Teléfono</label>
                            <input
                                className={styles.input}
                                value={formData.telefono}
                                onChange={(e) => updateField('telefono', e.target.value)}
                                placeholder="Teléfono"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                className={styles.input}
                                type="email"
                                value={formData.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                placeholder="Email"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>DNI</label>
                            <input
                                className={styles.input}
                                value={formData.dni}
                                onChange={(e) => updateField('dni', e.target.value)}
                                placeholder="DNI"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Ocupación</label>
                            <input
                                className={styles.input}
                                value={formData.ocupacion}
                                onChange={(e) => updateField('ocupacion', e.target.value)}
                                placeholder="Ocupación"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Lugar de Trabajo/Estudio</label>
                            <input
                                className={styles.input}
                                value={formData.lugarTrabajo}
                                onChange={(e) => updateField('lugarTrabajo', e.target.value)}
                                placeholder="Lugar de trabajo o estudio"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre del Apoderado</label>
                            <input
                                className={styles.input}
                                value={formData.nombreApoderado}
                                onChange={(e) => updateField('nombreApoderado', e.target.value)}
                                placeholder="Si es menor de edad"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Antecedentes */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <div className={styles.iconBox} style={{ background: '#ef4444' }}>
                            <Heart size={18} />
                        </div>
                        Antecedentes Médicos
                    </div>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.checkboxGrid}>
                        {antecedentesOptions.map(opt => (
                            <label
                                key={opt.id}
                                className={`${styles.checkboxItem} ${formData.antecedentes[opt.id] ? styles.checked : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.antecedentes[opt.id] || false}
                                    onChange={(e) => updateAntecedente(opt.id, e.target.checked)}
                                    className={styles.checkbox}
                                />
                                <span>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    <div className={`${styles.formGroup} ${styles.wide}`} style={{ marginTop: '24px' }}>
                        <label className={styles.label}>OTROS ANTECEDENTES</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={formData.antecedentes.otros || ''}
                            onChange={(e) => updateAntecedente('otros', e.target.value)}
                            placeholder="Especificar otros antecedentes médicos relevantes..."
                        />
                    </div>
                </div>
            </div>

            <div className={styles.formActions}>
                <button className={styles.btnPrimary} onClick={onSave} style={{ alignSelf: 'flex-end', marginTop: '20px' }}>
                    <Save size={18} />
                    <span>Guardar Datos Generales</span>
                </button>
            </div>
        </div >
    );
};

export default ClinicalHistoryGeneral;
