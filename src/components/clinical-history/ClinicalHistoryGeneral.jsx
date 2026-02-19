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
                            <label className={styles.label}>Edad</label>
                            <input
                                className={styles.input}
                                type="number"
                                value={formData.edad}
                                onChange={(e) => updateField('edad', e.target.value)}
                                placeholder="Edad"
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
                            <label className={styles.label}>Fecha de Nacimiento</label>
                            <input
                                className={styles.input}
                                type="date"
                                value={formData.fechaNacimiento}
                                onChange={(e) => updateField('fechaNacimiento', e.target.value)}
                            />
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
                        <div className={`${styles.formGroup} ${styles.wide}`}>
                            <label className={styles.label}>Motivo de Consulta</label>
                            <textarea
                                className={styles.textarea}
                                value={formData.motivoConsulta}
                                onChange={(e) => updateField('motivoConsulta', e.target.value)}
                                placeholder="Describa el motivo principal de la consulta..."
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
                    <div className={styles.inlineForm}>
                        <label className={styles.label}>Otros antecedentes</label>
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
