import React, { useState, useEffect } from 'react';
import { notesApi } from '../../lib/supabase';
import { Trash2, FileText, Plus, Calendar } from 'lucide-react';
import styles from './ClinicalHistory.module.css';

export default function ClinicalHistoryNotes({ patientId }) {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (patientId) loadNotes();
    }, [patientId]);

    const loadNotes = async () => {
        try {
            const data = await notesApi.getByPatient(patientId);
            setNotes(data || []);
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.content.trim()) return;

        setLoading(true);
        try {
            await notesApi.create({
                patient_id: patientId,
                title: newNote.title || 'Nota de Evolución',
                content: newNote.content
            });
            setNewNote({ title: '', content: '' });
            await loadNotes();
        } catch (error) {
            console.error(error);
            alert('Error al guardar nota');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar esta nota?')) return;
        try {
            await notesApi.delete(id);
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            alert('Error eliminando nota');
        }
    };

    // Format Date
    const formatDate = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={styles.notesContainer} style={{ marginTop: '30px' }}>
            <h3 className={styles.sectionTitle} style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#334155' }}>
                <FileText size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                Bitácora / Notas de Evolución
            </h3>

            {/* List of Past Notes */}
            <div className={styles.notesList}>
                {notes.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '10px' }}>
                        No hay notas registradas.
                    </div>
                ) : (
                    notes.map(note => (
                        <div key={note.id} className={styles.noteCard} style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '10px',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingRight: '24px' }}>
                                <strong style={{ color: '#475569', fontSize: '0.95rem' }}>
                                    {note.title || 'Nota sin título'}
                                </strong>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                                    <Calendar size={12} style={{ marginRight: '4px' }} />
                                    {formatDate(note.created_at)}
                                </span>
                            </div>

                            <div style={{ fontSize: '0.95rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                {note.content}
                            </div>

                            <button
                                onClick={() => handleDelete(note.id)}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#cbd5e1',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px',
                                    transition: 'all 0.2s'
                                }}
                                title="Eliminar nota"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#ef4444';
                                    e.currentTarget.style.background = '#fee2e2';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#cbd5e1';
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add New Note Form */}
            <div className={styles.addNoteForm} style={{
                marginTop: '20px',
                padding: '20px',
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#475569', fontWeight: '600' }}>
                    <Plus size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    Agregar Nueva Nota
                </h4>
                <input
                    type="text"
                    placeholder="Título (Ej. Control post-operatorio, Limpieza, etc.)"
                    className={styles.input}
                    value={newNote.title}
                    onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                    style={{ marginBottom: '12px', width: '100%', padding: '10px', fontSize: '0.95rem' }}
                />
                <textarea
                    placeholder="Describe los hallazgos, tratamiento realizado o evolución del paciente..."
                    className={styles.textarea}
                    value={newNote.content}
                    onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                    style={{ marginBottom: '15px', minHeight: '100px', width: '100%', padding: '10px', fontSize: '0.95rem' }}
                />
                <button
                    className={styles.btnPrimary}
                    onClick={handleAddNote}
                    disabled={loading}
                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                >
                    {loading ? 'Guardando...' : 'Guardar Nota'}
                </button>
            </div>
        </div>
    );
}
