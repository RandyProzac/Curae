import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Clock, Truck, Hammer, Edit2 } from 'lucide-react';
import { labWorkApi, doctorsApi, expensesApi, patientsApi } from '../../lib/supabase';
import { useAuth } from '../../contexts/useAuth';

export default function ClinicalHistoryLabWork({ patientId }) {
    const { user } = useAuth();
    const [labWorks, setLabWorks] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        work_type: '',
        tooth_number: '',
        laboratory_name: '',
        sent_date: new Date().toISOString().split('T')[0],
        expected_receive_date: '',
        actual_receive_date: '',
        status: 'ENVIADO',
        cost: 0,
        price: 0,
        notes: '',
        doctor_id: ''
    });

    useEffect(() => {
        if (patientId) {
            loadData();
        }
    }, [patientId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [works, docs, patientData] = await Promise.all([
                labWorkApi.getByPatient(patientId),
                doctorsApi.getAll(),
                patientsApi.getById(patientId)
            ]);
            setLabWorks(works);
            setDoctors(docs);
            setPatient(patientData);

            // Set default doctor ID if not set
            if (!formData.doctor_id && docs.length > 0) {
                // Try to find current user in doctors list
                const match = docs.find(d => d.name.toLowerCase().includes(user?.name?.toLowerCase()?.split(' ')[0] || ''));
                if (match) {
                    setFormData(prev => ({ ...prev, doctor_id: match.id }));
                }
            }
        } catch (error) {
            console.error('Error fetching lab works:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (work = null) => {
        if (work) {
            setEditingId(work.id);
            setFormData({
                work_type: work.work_type,
                tooth_number: work.tooth_number || '',
                laboratory_name: work.laboratory_name || '',
                sent_date: work.sent_date,
                expected_receive_date: work.expected_receive_date || '',
                actual_receive_date: work.actual_receive_date || '',
                status: work.status,
                cost: work.cost,
                price: work.price,
                notes: work.notes || '',
                doctor_id: work.doctor_id || ''
            });
        } else {
            setEditingId(null);
            setFormData(prev => ({
                ...prev,
                work_type: '',
                tooth_number: '',
                laboratory_name: '',
                sent_date: new Date().toISOString().split('T')[0],
                expected_receive_date: '',
                actual_receive_date: '',
                status: 'ENVIADO',
                cost: 0,
                price: 0,
                notes: ''
            }));
        }
        setShowForm(true);
    };

    const handleSave = async () => {
        try {
            if (!formData.work_type || !formData.sent_date) {
                alert('Por favor complete los campos obligatorios (Tipo de Trabajo y Fecha de Envío).');
                return;
            }

            const payload = {
                patient_id: patientId,
                ...formData,
                expected_receive_date: formData.expected_receive_date || null,
                actual_receive_date: formData.actual_receive_date || null,
                doctor_id: formData.doctor_id || null
            };

            const patientName = `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim();

            if (editingId) {
                await labWorkApi.update(editingId, payload);
                
                // Sync expense on update: delete existing and recreate if cost > 0
                await expensesApi.deleteByReference(editingId);
                if (payload.cost > 0) {
                    try {
                        await expensesApi.create({
                            date: payload.sent_date,
                            description: `Laboratorio: ${payload.work_type} - Paciente: ${patientName} #LabID:${editingId}`,
                            supplier: payload.laboratory_name || 'Laboratorio',
                            category: 'Laboratorio',
                            amount: payload.cost,
                            status: 'pendiente'
                        });
                    } catch (expError) {
                        console.error('Error updating automatic expense:', expError);
                    }
                }
            } else {
                const newWork = await labWorkApi.create(payload);
                
                // Automatically create an expense in Finance if there's a cost
                if (newWork && payload.cost > 0) {
                    try {
                        await expensesApi.create({
                            date: payload.sent_date,
                            description: `Laboratorio: ${payload.work_type} - Paciente: ${patientName} #LabID:${newWork.id}`,
                            supplier: payload.laboratory_name || 'Laboratorio',
                            category: 'Laboratorio',
                            amount: payload.cost,
                            status: 'pendiente'
                        });
                    } catch (expError) {
                        console.error('Error creating automatic expense:', expError);
                    }
                }
            }
            setShowForm(false);
            loadData();
        } catch (error) {
            console.error('Error saving lab work:', error);
            alert('Error al guardar el trabajo de laboratorio.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este trabajo de laboratorio?')) {
            try {
                await labWorkApi.delete(id);
                // Also delete associated expense
                await expensesApi.deleteByReference(id);
                loadData();
            } catch (error) {
                console.error('Error deleting lab work:', error);
            }
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            'ENVIADO': { bg: '#dbeafe', color: '#2563eb', icon: <Truck size={14} /> },
            'RECIBIDO': { bg: '#fef3c7', color: '#d97706', icon: <Hammer size={14} /> },
            'EN_PRUEBA': { bg: '#e0e7ff', color: '#4f46e5', icon: <Clock size={14} /> },
            'INSTALADO': { bg: '#dcfce7', color: '#16a34a', icon: <CheckCircle size={14} /> }
        };
        const st = config[status] || config['ENVIADO'];
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                backgroundColor: st.bg, color: st.color,
                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
            }}>
                {st.icon}
                {status.replace('_', ' ')}
            </span>
        );
    };

    // Shared simple styling via a const (borrowing the general clean look of the app)
    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '16px' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' },
        title: { margin: 0, fontSize: '16px', color: '#1e293b' },
        addButton: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0f766e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
        card: { backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' },
        cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
        workType: { fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' },
        infoRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '13px', color: '#475569', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' },
        infoItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
        label: { fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#94a3b8' },
        actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' },
        iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' },

        // Form specific 
        formOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
        formModal: { backgroundColor: 'white', borderRadius: '16px', width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', padding: '24px' },
        formTitle: { margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', fontWeight: 'bold' },
        fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
        row: { display: 'flex', gap: '12px' },
        input: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
        textarea: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', width: '100%', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
        formActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
        cancelBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer', fontWeight: '500' },
        saveBtn: { padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f766e', color: 'white', cursor: 'pointer', fontWeight: '500' },
    };

    if (loading && labWorks.length === 0) return <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Cargando trabajos de laboratorio...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h3 style={styles.title}>Trabajos de Laboratorio</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Gestión de coronas, prótesis y alineadores</p>
                </div>
                <button style={styles.addButton} onClick={() => handleOpenForm()}>
                    <Plus size={16} />
                    Nuevo Trabajo
                </button>
            </div>

            {labWorks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ color: '#64748b', margin: 0 }}>No hay trabajos de laboratorio registrados para este paciente.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {labWorks.map(work => (
                        <div key={work.id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div>
                                    <h4 style={styles.workType}>{work.work_type}</h4>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Laboratorio: {work.laboratory_name || 'No especificado'}</span>
                                </div>
                                {getStatusBadge(work.status)}
                            </div>

                            <div style={styles.infoRow}>
                                <div style={styles.infoItem}>
                                    <span style={styles.label}>Diente / Zona</span>
                                    <span>{work.tooth_number || '-'}</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <span style={styles.label}>Doctor</span>
                                    <span>{work.doctor?.name || 'No asignado'}</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <span style={styles.label}>Fecha Envío</span>
                                    <span>{new Date(work.sent_date).toLocaleDateString('es-PE')}</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <span style={styles.label}>Fecha Esperada</span>
                                    <span>{work.expected_receive_date ? new Date(work.expected_receive_date).toLocaleDateString('es-PE') : '-'}</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <span style={styles.label}>Costo Lab.</span>
                                    <span style={{ color: '#ef4444' }}>S/ {Number(work.cost).toFixed(2)}</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <span style={styles.label}>Precio Paciente</span>
                                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>S/ {Number(work.price).toFixed(2)}</span>
                                </div>
                            </div>

                            {work.notes && (
                                <div style={{ fontSize: '13px', color: '#475569', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                                    <strong>Notas:</strong> {work.notes}
                                </div>
                            )}

                            <div style={styles.actions}>
                                <button style={{ ...styles.iconBtn, color: '#3b82f6' }} onClick={() => handleOpenForm(work)}>
                                    <Edit2 size={16} />
                                </button>
                                <button style={{ ...styles.iconBtn, color: '#ef4444' }} onClick={() => handleDelete(work.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Formulario */}
            {showForm && (
                <div style={styles.formOverlay} onClick={() => setShowForm(false)}>
                    <div style={styles.formModal} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.formTitle}>{editingId ? 'Editar Trabajo de Laboratorio' : 'Nuevo Trabajo de Laboratorio'}</h2>

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Tipo de Trabajo *</label>
                            <input
                                style={styles.input}
                                value={formData.work_type}
                                onChange={e => setFormData({ ...formData, work_type: e.target.value })}
                                placeholder="Ej: Corona Metal Porcelana, Alineadores, etc."
                                required
                            />
                        </div>

                        <div style={styles.row}>
                            <div style={{ ...styles.fieldGroup, flex: 1 }}>
                                <label style={styles.label}>Diente / Pieza</label>
                                <input style={styles.input} value={formData.tooth_number} onChange={e => setFormData({ ...formData, tooth_number: e.target.value })} placeholder="Ej: 14, 25" />
                            </div>
                            <div style={{ ...styles.fieldGroup, flex: 1 }}>
                                <label style={styles.label}>Nombre Laboratorio</label>
                                <input style={styles.input} value={formData.laboratory_name} onChange={e => setFormData({ ...formData, laboratory_name: e.target.value })} placeholder="Ej: Laboratorio XYZ" />
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={{ ...styles.fieldGroup, flex: 1 }}>
                                <label style={styles.label}>Doctor Tratante</label>
                                <select style={styles.input} value={formData.doctor_id} onChange={e => setFormData({ ...formData, doctor_id: e.target.value })}>
                                    <option value="">Seleccionar Doctor...</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ ...styles.fieldGroup, flex: 1 }}>
                                <label style={styles.label}>Estado Actual</label>
                                <select style={styles.input} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="ENVIADO">Enviado</option>
                                    <option value="RECIBIDO">Recibido (En Clínica)</option>
                                    <option value="EN_PRUEBA">En Prueba</option>
                                    <option value="INSTALADO">Instalado (Finalizado)</option>
                                </select>
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={{ ...styles.fieldGroup, flex: 1 }}>
                                <label style={styles.label}>Fecha Envío *</label>
                                <input type="date" style={styles.input} value={formData.sent_date} onChange={e => setFormData({ ...formData, sent_date: e.target.value })} required />
                            </div>
                            <div style={{ ...styles.fieldGroup, flex: 1 }}>
                                <label style={styles.label}>Fecha Esperada (Promesa)</label>
                                <input type="date" style={styles.input} value={formData.expected_receive_date} onChange={e => setFormData({ ...formData, expected_receive_date: e.target.value })} />
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={{ ...styles.fieldGroup, flex: 1 }}>
                                <label style={styles.label}>Costo Laboratorio (S/)</label>
                                <input type="number" step="0.01" style={styles.input} value={formData.cost} onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div style={{ ...styles.fieldGroup, flex: 1 }}>
                                <label style={styles.label}>Precio al Paciente (S/)</label>
                                <input type="number" step="0.01" style={styles.input} value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
                            </div>
                        </div>

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Notas adicionales</label>
                            <textarea style={styles.textarea} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Color, detalles específicos, etc." />
                        </div>

                        <div style={styles.formActions}>
                            <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancelar</button>
                            <button style={styles.saveBtn} onClick={handleSave}>Guardar Trabajo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
