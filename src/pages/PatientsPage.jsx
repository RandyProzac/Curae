import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Trash2, Calendar as CalendarIcon, FileText, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import NewPatientModal from '../components/patients/NewPatientModal';
import PatientDetailSidebar from '../components/patients/PatientDetailSidebar';
import styles from '../components/patients/PatientList.module.css';

// Deterministic color from patient name (Gmail-style)
const AVATAR_COLORS = [
    '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4',
    '#84cc16', '#e11d48', '#0ea5e9', '#d946ef', '#059669'
];

const getPatientColor = (name) => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Relative date formatter
const getRelativeDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return null;

    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Hoy', type: 'today' };
    if (diffDays === 1) return { text: 'Mañana', type: 'future' };
    if (diffDays === -1) return { text: 'Ayer', type: 'past' };
    if (diffDays > 1) return { text: `En ${diffDays} días`, type: 'future' };
    if (diffDays < -1) return { text: `Hace ${Math.abs(diffDays)} días`, type: 'past' };

    return null;
};

const PatientsPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [patientToDelete, setPatientToDelete] = useState(null);

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('patients')
                .select('*, appointments(date, start_time, status), doctor:doctors(color)')
                .order('last_name');

            if (error) throw error;

            const today = new Date().toISOString().split('T')[0];

            let formattedPatients = data.map(p => {
                const apts = p.appointments || [];
                // Sort appointments by date desc to find last visit easily
                apts.sort((a, b) => new Date(b.date) - new Date(a.date));

                const lastVisitApt = apts.find(a => a.date < today && a.status !== 'cancelled');

                // For future appointments, we need closest first (date ascending)
                const futureApts = apts
                    .filter(a => a.date >= today && a.status !== 'cancelled')
                    .sort((a, b) => {
                        const dateDiff = new Date(a.date) - new Date(b.date);
                        if (dateDiff !== 0) return dateDiff;
                        // Time comparison
                        return a.start_time.localeCompare(b.start_time);
                    });

                const nextApt = futureApts[0];

                return {
                    id: p.id,
                    firstName: p.first_name,
                    lastName: p.last_name,
                    name: `${p.first_name} ${p.last_name}`,
                    dni: p.dni || 'Sin DNI',
                    lastVisit: lastVisitApt ? lastVisitApt.date : '-',
                    nextAppt: nextApt ? nextApt.date : '-',
                    rawNextAppt: nextApt ? `${nextApt.date}T${nextApt.start_time}` : null,
                    email: p.email,
                    phone: p.phone,
                    color: p.doctor?.color || getPatientColor(`${p.first_name} ${p.last_name}`)
                };
            });

            // Sort: Nearest appointment first, then Alphabetical
            formattedPatients.sort((a, b) => {
                if (a.rawNextAppt && !b.rawNextAppt) return -1;
                if (!a.rawNextAppt && b.rawNextAppt) return 1;

                if (a.rawNextAppt && b.rawNextAppt) {
                    if (a.rawNextAppt !== b.rawNextAppt) {
                        return new Date(a.rawNextAppt) - new Date(b.rawNextAppt);
                    }
                }

                return a.name.localeCompare(b.name);
            });

            setPatients(formattedPatients);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleCreatePatient = async (patientData) => {
        try {
            const { error } = await supabase.from('patients').insert([patientData]);

            if (error) throw error;

            fetchPatients();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating patient:', error);
            alert('Error al crear paciente: ' + error.message);
        }
    };

    const handleDeletePatient = async () => {
        if (!patientToDelete) return;

        try {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', patientToDelete.id);

            if (error) throw error;

            fetchPatients();
            setIsDeleteModalOpen(false);
            setPatientToDelete(null);
        } catch (error) {
            console.error('Error deleting patient:', error);
            alert('Error al eliminar paciente: ' + error.message);
        }
    };

    const handlePatientClick = (patient) => {
        setSelectedPatient(patient);
        setIsSidebarOpen(true);
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni.includes(searchTerm)
    );

    const renderDateBadge = (dateStr) => {
        const relative = getRelativeDate(dateStr);
        if (!relative) return <span className={styles.noAppt}>Sin citas</span>;

        const typeClass = relative.type === 'today'
            ? styles.dateToday
            : relative.type === 'future'
                ? styles.dateFuture
                : styles.datePast;

        return (
            <span className={`${styles.dateBadge} ${typeClass}`}>
                <Clock size={12} />
                {relative.text}
            </span>
        );
    };

    return (
        <div className={styles.container}>
            <header className={styles.contentHeader}>
                <div className={styles.headerTitle}>
                    <h3>Base de Pacientes</h3>
                    <p>Gestiona y visualiza el historial de tus pacientes</p>
                </div>
                <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
                    <UserPlus size={18} />
                    <span>Nuevo Paciente</span>
                </button>
            </header>

            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.tableWrapper}>
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Cargando pacientes...</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>Última Cita</th>
                                <th>Próxima Cita</th>
                                <th className={styles.actionsHeader}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.length > 0 ? (
                                filteredPatients.map((patient) => (
                                    <tr key={patient.id} className={styles.row}>
                                        <td>
                                            <div
                                                className={styles.patientCell}
                                                onClick={() => handlePatientClick(patient)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div
                                                    className={styles.avatar}
                                                    style={{ backgroundColor: patient.color }}
                                                >
                                                    {patient.firstName ? patient.firstName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div className={styles.patientInfo}>
                                                    <span className={styles.patientName} style={{ color: '#0f766e' }}>{patient.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{renderDateBadge(patient.lastVisit)}</td>
                                        <td>{renderDateBadge(patient.nextAppt)}</td>
                                        <td className={styles.actions}>
                                            <button
                                                className={styles.historyBtn}
                                                onClick={() => navigate(`/pacientes/${patient.id}/historia-clinica`)}
                                            >
                                                <FileText size={15} />
                                                <span>Historia Clínica</span>
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                onClick={() => {
                                                    setPatientToDelete(patient);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                title="Eliminar Paciente"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                                        No se encontraron pacientes
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <NewPatientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreatePatient}
            />

            <PatientDetailSidebar
                patient={selectedPatient}
                isOpen={isSidebarOpen}
                onClose={() => {
                    setIsSidebarOpen(false);
                    setSelectedPatient(null);
                }}
            />

            {/* Reconfirmation Modal */}
            {isDeleteModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
                    <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIcon}>
                            <AlertTriangle size={32} />
                        </div>
                        <h3>¿Eliminar Paciente?</h3>
                        <p style={{ color: '#64748b', marginTop: '10px' }}>
                            Estás a punto de eliminar a <strong>{patientToDelete?.name}</strong>.
                            Esta acción no se puede deshacer y borrará todo su historial.
                        </p>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setIsDeleteModalOpen(false)}>
                                Cancelar
                            </button>
                            <button className={styles.confirmBtn} onClick={handleDeletePatient}>
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientsPage;
