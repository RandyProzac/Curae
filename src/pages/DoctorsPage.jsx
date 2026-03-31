import React, { useState, useEffect } from 'react';
import {
    UserPlus,
    Edit2,
    Trash2,
    Phone,
    Mail,
    Calendar,
    Award
} from 'lucide-react';
import { supabase, doctorsApi } from '../lib/supabase';
import DoctorModal from '../components/doctors/DoctorModal';
import { useAuth } from '../contexts/useAuth';
import styles from './DoctorsPage.module.css';

const DoctorsPage = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const { isAdmin } = useAuth();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('DOCTOR'); // 'DOCTOR' or 'ADMIN'
    const [editingDoctor, setEditingDoctor] = useState(null);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const data = await doctorsApi.getAll();
            setDoctors(data);

            const statsMap = {};
            await Promise.all(data.map(async (doc) => {
                const docStat = await doctorsApi.getStats(doc.id);
                statsMap[doc.id] = docStat;
            }));
            setStats(statsMap);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleOpenCreate = (mode = 'DOCTOR') => {
        setModalMode(mode);
        setEditingDoctor(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (doctor) => {
        setModalMode(doctor.specialty === 'ADMINISTRACION' ? 'ADMIN' : 'DOCTOR');
        setEditingDoctor(doctor);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const isDoctor = medicalStaff.some(d => d.id === id);
        if (!window.confirm(`¿Estás seguro de eliminar este ${isDoctor ? 'doctor' : 'personal administrativa'}? Se eliminará también su cuenta de acceso.`)) return;
        try {
            // Usar RPC para eliminar doctor + auth atomicamente
            const { error } = await supabase.rpc('delete_doctor_with_auth', { p_doctor_id: id });
            if (error) throw error;
            setDoctors(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            alert('Error al eliminar doctor: ' + error.message);
        }
    };

    const handleSave = async (formData) => {
        try {
            const { signatureFile, authCredentials, ...doctorData } = formData;

            // 1. Subir firma si existe
            let signatureUrl = doctorData.signature_url || null;
            if (signatureFile) {
                const url = await doctorsApi.uploadSignature(signatureFile);
                if (url) signatureUrl = url;
            }

            if (editingDoctor) {
                // ============ EDITAR DOCTOR EXISTENTE ============
                const updated = await doctorsApi.update(editingDoctor.id, {
                    ...doctorData,
                    signature_url: signatureUrl
                });

                if (editingDoctor.color !== doctorData.color) {
                    await doctorsApi.updateEventColors(editingDoctor.id, doctorData.color);
                }

                setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d));
            } else if (authCredentials) {
                // ============ NUEVO DOCTOR CON CUENTA DE ACCESO (vía RPC) ============
                const { data, error } = await supabase.rpc('create_doctor_with_auth', {
                    p_name: doctorData.name,
                    p_password: authCredentials.password,
                    p_email: authCredentials.username,
                    p_specialty: doctorData.specialty || '',
                    p_phone: doctorData.phone || '',
                    p_dni: doctorData.dni || '',
                    p_cop: doctorData.cop || '',
                    p_color: doctorData.color || '#14b8a6',
                    p_join_date: doctorData.join_date || new Date().toISOString().split('T')[0],
                    p_signature_url: signatureUrl
                });

                if (error) throw error;
            } else {
                // ============ NUEVO DOCTOR SIN CUENTA (fallback, no debería llegar aquí) ============
                await doctorsApi.create({ ...doctorData, signature_url: signatureUrl });
            }

            await fetchDoctors();
        } catch (error) {
            console.error('Error in handleSave:', error);
            alert('Error al guardar los cambios: ' + error.message);
        }
    };

    const medicalStaff = [...doctors]
        .filter(doctor => doctor.active !== false && doctor.specialty !== 'ADMINISTRACION' && doctor.email !== 'gerencia@curae.com')
        .sort((a, b) => a.name.localeCompare(b.name));

    const adminStaff = [...doctors]
        .filter(doctor => doctor.active !== false && doctor.specialty === 'ADMINISTRACION' && doctor.email !== 'gerencia@curae.com')
        .sort((a, b) => a.name.localeCompare(b.name));

    const renderDoctorTable = (staffList, title, showStats = true) => (
        <div className={styles.tableSection}>
            <h3 className={styles.sectionTitle}>{title}</h3>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{title === 'Cuerpo Médico' ? 'Doctor' : 'Identidad'}</th>
                            <th>{title === 'Cuerpo Médico' ? 'Especialidad' : 'Cargo'}</th>
                            {showStats && <th>Citas (Mes)</th>}
                            <th>Contacto</th>
                            <th>Ingreso</th>
                            <th style={{ textAlign: 'right' }}>Gestión</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.map(doctor => (
                            <tr key={doctor.id}>
                                <td>
                                    <div className={styles.doctorCell}>
                                        <div
                                            className={styles.avatarSmall}
                                            style={{ backgroundColor: doctor.color || '#cbd5e1' }}
                                        >
                                            {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className={styles.nameInfo}>
                                            <span className={styles.doctorName}>{doctor.name}</span>
                                            {doctor.dni && <span className={styles.doctorDni}>DNI: {doctor.dni}</span>}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={styles.badge}>{doctor.specialty || 'General'}</span>
                                </td>
                                {showStats && (
                                    <td>
                                        <div className={styles.statCell}>
                                            <span style={{ fontSize: '1.2em' }}>{stats[doctor.id]?.patientsMonth || 0}</span>
                                            <span style={{ fontSize: '0.8em', color: '#94a3b8', marginLeft: '4px' }}>Pacientes</span>
                                        </div>
                                    </td>
                                )}
                                <td>
                                    <div className={styles.contactCell}>
                                        {doctor.phone && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Phone size={12} /> {doctor.phone}
                                            </div>
                                        )}
                                        {doctor.email && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Mail size={12} /> {doctor.email}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                    {new Date(doctor.join_date || doctor.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                    <div className={styles.rowActions}>
                                        {isAdmin && (
                                            <>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => handleOpenEdit(doctor)}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteKey}`}
                                                    onClick={() => handleDelete(doctor.id)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {staffList.length === 0 && (
                            <tr>
                                <td colSpan={showStats ? "6" : "5"} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                                    No hay {title.toLowerCase()} registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <h2>Gestión de Personal</h2>
                    <p>Administra el cuerpo médico y el equipo administrativo de la clínica.</p>
                </div>
                {isAdmin && (
                    <div className={styles.headerActions}>
                        <button className={`${styles.addButton} ${styles.btnAdmin}`} onClick={() => handleOpenCreate('ADMIN')}>
                            <UserPlus size={18} />
                            <span>+ Nuevo Asistente / Administrativo</span>
                        </button>
                        <button className={`${styles.addButton} ${styles.btnDoctor}`} onClick={() => handleOpenCreate('DOCTOR')}>
                            <UserPlus size={18} />
                            <span>+ Nuevo Doctor</span>
                        </button>
                    </div>
                )}
            </header>

            <div className={styles.content}>
                {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Cargando personal...</div>
                ) : (
                    <>
                        {renderDoctorTable(medicalStaff, 'Cuerpo Médico', true)}
                        <div style={{ marginTop: '48px' }}>
                            {renderDoctorTable(adminStaff, 'Personal Administrativo', false)}
                        </div>
                    </>
                )}
            </div>

            <DoctorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                doctor={editingDoctor}
                isAdmin={isAdmin}
                mode={modalMode}
            />
        </div>
    );
};

export default DoctorsPage;
