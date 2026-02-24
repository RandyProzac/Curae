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
import { doctorsApi } from '../lib/supabase';
import DoctorModal from '../components/doctors/DoctorModal';
import styles from './DoctorsPage.module.css';

const DoctorsPage = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({}); // { doctorId: { patientsMonth: 12, ... } }

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const data = await doctorsApi.getAll();
            setDoctors(data);

            // Fetch stats for each doctor
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

    const handleOpenCreate = () => {
        setEditingDoctor(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (doctor) => {
        setEditingDoctor(doctor);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este doctor?')) return;
        try {
            await doctorsApi.delete(id);
            setDoctors(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            alert('Error al eliminar doctor: ' + error.message);
        }
    };

    const handleSave = async (formData) => {
        try {
            const { signatureFile, ...doctorData } = formData;

            // Handle signature upload if there's a new file
            if (signatureFile) {
                const url = await doctorsApi.uploadSignature(signatureFile);
                if (url) {
                    doctorData.signature_url = url;
                }
            }

            if (editingDoctor) {
                // Update doctor
                const updated = await doctorsApi.update(editingDoctor.id, doctorData);

                // Cascade: Update all events of this doctor if color changed
                if (editingDoctor.color !== doctorData.color) {
                    await doctorsApi.updateEventColors(editingDoctor.id, doctorData.color);
                }

                setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d));
            } else {
                const created = await doctorsApi.create(doctorData);
                setDoctors(prev => [...prev, created]);
            }
            await fetchDoctors();
        } catch (error) {
            console.error('Error in handleSave:', error);
            alert('Error al guardar los cambios: ' + error.message);
        }
    };

    // Sort alphabetically
    const sortedDoctors = [...doctors].sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <h2>Gestión de Doctores</h2>
                    <p>Administra el personal médico, especialidades y horarios.</p>
                </div>
                <button className={styles.addButton} onClick={handleOpenCreate}>
                    <UserPlus size={18} />
                    <span>Nuevo Doctor</span>
                </button>
            </header>

            <div className={styles.tableContainer}>
                {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Cargando doctores...</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Doctor</th>
                                <th>Especialidad</th>
                                <th>Métricas (Mes)</th>
                                <th>Contacto</th>
                                <th>Fecha Ingreso</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedDoctors.map(doctor => (
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
                                    <td>
                                        <div className={styles.statCell}>
                                            <span style={{ fontSize: '1.2em' }}>{stats[doctor.id]?.patientsMonth || 0}</span>
                                            <span style={{ fontSize: '0.8em', color: '#94a3b8', marginLeft: '4px' }}>Pacientes</span>
                                        </div>
                                    </td>
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
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sortedDoctors.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                                        No hay doctores registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <DoctorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                doctor={editingDoctor}
            />
        </div>
    );
};

export default DoctorsPage;
